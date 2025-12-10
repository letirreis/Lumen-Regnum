# Diagrama de Arquitetura - Sistema de Tags Normalizadas

## 📊 Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUMEN REGNUM - TAGS SYSTEM                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐     ┌─────────────────────────┐
│   USER INTERFACE        │     │   BACKEND (SUPABASE)    │
├─────────────────────────┤     ├─────────────────────────┤
│                         │     │                         │
│  Layout.tsx             │     │  dmos_campaigns         │
│  └─ "Families &         │     │  ├─ id (PK)             │
│     Factions"           │     │  └─ user_id             │
│                         │     │                         │
│  GenericList.tsx        │     │  dmos_factions          │
│  ├─ Modal Editor        │────▶│  ├─ id (PK)             │
│  ├─ Form Fields         │     │  ├─ campaign_id (FK)    │
│  └─ Save Logic          │     │  ├─ name                │
│                         │     │  └─ tag_ids (transient) │
│  MultiFactionSelect.tsx │     │                         │
│  ├─ Chip Display        │     │  dmos_tags              │
│  ├─ Dropdown            │────▶│  ├─ id (PK)             │
│  └─ onChange Handler    │     │  ├─ campaign_id (FK)    │
│                         │     │  ├─ name                │
│  TagSelector.tsx        │     │  ├─ color               │
│  ├─ Selected Tags       │     │  ├─ tag_type            │
│  ├─ Available Tags      │────▶│  ├─ created_by          │
│  ├─ Inline Creator      │     │  └─ created_at          │
│  └─ Type Filter         │     │                         │
│                         │     │  dmos_faction_tags      │
│  services/store.ts      │     │  ├─ faction_id (PK,FK)  │
│  ├─ db.tags.*           │────▶│  ├─ tag_id (PK,FK)      │
│  ├─ db.faction_tags.*   │     │  └─ created_at          │
│  └─ db.factions.*       │     │                         │
│                         │     │  dmos_locations         │
│  types.ts               │     │  ├─ id (PK)             │
│  ├─ Tag interface       │────▶│  ├─ campaign_id (FK)    │
│  ├─ Faction.tag_ids     │     │  ├─ faction_ids[]       │
│  └─ Location.faction_ids│     │  └─ faction_influence   │
│                         │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 🔄 Fluxo de Dados - Criar Tag

```
┌────────────────────────────────────────────────────────────────────┐
│                    CRIAR TAG INLINE - FLUXO                         │
└────────────────────────────────────────────────────────────────────┘

1. USUÁRIO                    2. COMPONENTE               3. DATABASE
   │                             │                           │
   │ Edita Faction               │                           │
   ├──────────────────────▶     │                           │
   │                             │ Carrega tags              │
   │                             ├──────────────────────▶    │
   │                             │                           │
   │                             │◀──────────────────────    │
   │                             │ availableTags[]           │
   │                             │                           │
   │ Clica "Criar nova tag"      │                           │
   ├──────────────────────▶     │                           │
   │                             │ Abre formulário           │
   │                             │ (nome, cor, tipo)         │
   │                             │                           │
   │ Preenche formulário         │                           │
   ├──────────────────────▶     │                           │
   │                             │                           │
   │ Clica "Criar Tag"           │                           │
   ├──────────────────────▶     │                           │
   │                             │ db.tags.add()             │
   │                             ├──────────────────────▶    │
   │                             │                           │
   │                             │                       INSERT INTO
   │                             │                       dmos_tags
   │                             │                           │
   │                             │◀──────────────────────    │
   │                             │ Success                   │
   │                             │                           │
   │                             │ onTagsReload()            │
   │                             ├──────────────────────▶    │
   │                             │                       SELECT *
   │                             │                       FROM dmos_tags
   │                             │◀──────────────────────    │
   │                             │ Updated tags[]            │
   │                             │                           │
   │                             │ Auto-seleciona nova tag   │
   │◀──────────────────────     │ (adiciona ao tag_ids)     │
   │ Tag criada e selecionada    │                           │
   │                             │                           │
```

---

## 🔄 Fluxo de Dados - Salvar Faction com Tags

```
┌────────────────────────────────────────────────────────────────────┐
│                  SALVAR FACTION COM TAGS - FLUXO                    │
└────────────────────────────────────────────────────────────────────┘

1. USUÁRIO                    2. COMPONENTE               3. DATABASE
   │                             │                           │
   │ Seleciona 3 tags            │                           │
   ├──────────────────────▶     │                           │
   │                             │ editingItem.tag_ids =     │
   │                             │ [uuid1, uuid2, uuid3]     │
   │                             │                           │
   │ Clica "Save Faction"        │                           │
   ├──────────────────────▶     │                           │
   │                             │ handleSave()              │
   │                             │                           │
   │                             │ 1. Salva Faction          │
   │                             │ db.factions.update()      │
   │                             ├──────────────────────▶    │
   │                             │                       UPDATE
   │                             │                       dmos_factions
   │                             │                       (name, goal...)
   │                             │◀──────────────────────    │
   │                             │                           │
   │                             │ 2. Limpa tags antigas     │
   │                             │ db.faction_tags.deleteAll │
   │                             ├──────────────────────▶    │
   │                             │                       DELETE FROM
   │                             │                       dmos_faction_tags
   │                             │                       WHERE faction_id
   │                             │◀──────────────────────    │
   │                             │                           │
   │                             │ 3. Cria novas associações │
   │                             │ Loop: tag_ids.forEach()   │
   │                             │                           │
   │                             │ db.faction_tags.add()     │
   │                             ├──────────────────────▶    │
   │                             │                       INSERT INTO
   │                             │                       dmos_faction_tags
   │                             │                       (faction_id,     │
   │                             │                        tag_id)         │
   │                             │◀──────────────────────    │
   │                             │ (repete 3x)               │
   │                             │                           │
   │◀──────────────────────     │ Modal fecha               │
   │ "Saved!"                    │ Lista recarrega           │
   │                             │                           │
```

---

## 🗂️ Estrutura de Relacionamentos

```
┌────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIPS                             │
└────────────────────────────────────────────────────────────────────┘

                    dmos_campaigns
                         │
                         │ user_id
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  dmos_factions    dmos_tags      dmos_locations
        │                │                │
        │ id             │ id             │ id
        │ name           │ name           │ name
        │                │ color          │ faction_ids[] ───┐
        │                │ tag_type       │                  │
        │                │                │                  │
        └────────┬───────┘                │                  │
                 │                        │                  │
                 │   many-to-many         │                  │
                 │                        │                  │
           dmos_faction_tags              │                  │
                 │                        │                  │
           ┌─────┴─────┐                  │                  │
           │ faction_id│◀─────────────────┘                  │
           │ tag_id    │                                     │
           └───────────┘                                     │
                                                             │
                                one-to-many (array)          │
                         ┌───────────────────────────────────┘
                         │
                         ▼
                  [factionId1, factionId2, ...]
```

---

## 🎨 Componentes UI - Hierarquia

```
┌────────────────────────────────────────────────────────────────────┐
│                      UI COMPONENT TREE                              │
└────────────────────────────────────────────────────────────────────┘

App.tsx
 │
 ├─ Layout.tsx
 │   ├─ Navigation Menu
 │   │   ├─ Overview
 │   │   ├─ Characters
 │   │   ├─ NPCs
 │   │   ├─ Monsters
 │   │   ├─ Locations
 │   │   ├─ Families & Factions ◀── RENOMEADO
 │   │   ├─ Items
 │   │   ├─ Combat
 │   │   └─ Sessions
 │   │
 │   └─ {children}
 │
 └─ GenericList.tsx (entityType='faction')
     │
     ├─ Filter Bar
     ├─ Search Input
     │
     ├─ Cards Grid
     │   └─ Faction Cards
     │       ├─ Name
     │       ├─ Tags (display only)
     │       └─ Action Buttons
     │           ├─ Edit ──┐
     │           └─ Delete  │
     │                      │
     └─ Modal (isModalOpen) │
         │                  │
         │◀─────────────────┘
         │
         ├─ Modal Header
         │   └─ "Edit Faction" / "New Faction"
         │
         ├─ Modal Body (Form Fields)
         │   │
         │   ├─ Input (name)
         │   │
         │   ├─ TagSelector.tsx ◀── NOVO COMPONENTE
         │   │   ├─ Filter Dropdown (tipo)
         │   │   ├─ Selected Tags (chips)
         │   │   │   └─ Tag Chip
         │   │   │       ├─ Name
         │   │   │       ├─ Type badge
         │   │   │       └─ X button
         │   │   │
         │   │   ├─ Available Tags (clicáveis)
         │   │   │   └─ Tag Button
         │   │   │       ├─ Name
         │   │   │       └─ Type badge
         │   │   │
         │   │   └─ Inline Creator
         │   │       ├─ Input (nome)
         │   │       ├─ Color Picker
         │   │       ├─ Select (tipo)
         │   │       └─ Buttons
         │   │           ├─ Criar Tag
         │   │           └─ Cancelar
         │   │
         │   ├─ Input (goal)
         │   ├─ Textarea (resources)
         │   ├─ Textarea (conflicts)
         │   └─ Textarea (notes)
         │
         └─ Modal Footer
             └─ Button "Save Faction"
                 └─ onClick={handleSave}

GenericList.tsx (entityType='location')
     │
     └─ Modal (isModalOpen)
         │
         ├─ Modal Body (Form Fields)
         │   │
         │   ├─ Input (name)
         │   │
         │   ├─ MultiFactionSelect.tsx ◀── NOVO COMPONENTE
         │   │   ├─ Selected Factions (chips)
         │   │   │   └─ Faction Chip
         │   │   │       ├─ Name
         │   │   │       └─ X button
         │   │   │
         │   │   └─ Dropdown (adicionar)
         │   │       └─ Faction Options
         │   │           └─ onClick={handleAdd}
         │   │
         │   ├─ Input (faction_influence) ◀── LEGADO
         │   ├─ Select (importance)
         │   └─ ... outros campos
         │
         └─ Button "Save Location"
```

---

## 🔒 Security (RLS) Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    ROW LEVEL SECURITY FLOW                          │
└────────────────────────────────────────────────────────────────────┘

USER REQUEST
     │
     │ SELECT * FROM dmos_tags WHERE campaign_id = 'xxx'
     │
     ▼
SUPABASE RLS
     │
     ├──▶ Check Policy: "Users can view tags from their campaigns"
     │    │
     │    │ campaign_id IN (
     │    │   SELECT id FROM dmos_campaigns 
     │    │   WHERE user_id = auth.uid()
     │    │ )
     │    │
     │    ├──▶ User owns campaign? ──▶ YES ──▶ ALLOW
     │    │                           │
     │    └───────────────────────────┘
     │                                │
     │                                NO
     │                                │
     │                                ▼
     │                              DENY (empty result)
     │
     ▼
RETURN DATA
     │
     └──▶ Only tags from user's campaigns

SIMILAR FLOW FOR:
- INSERT: "Users can create tags in their campaigns"
- UPDATE: "Users can update tags from their campaigns"
- DELETE: "Users can delete tags from their campaigns"
```

---

## 📦 Data Flow - Complete Cycle

```
┌────────────────────────────────────────────────────────────────────┐
│              COMPLETE DATA FLOW - FROM UI TO DATABASE               │
└────────────────────────────────────────────────────────────────────┘

1. USER OPENS FACTION EDITOR
   │
   │ Click "Edit Faction"
   │
   ▼
2. GENERICLIST.TSX
   │
   │ openEdit(faction)
   │   ├─ loadFormDependencies()
   │   │   └─ db.tags.list(campaignId)
   │   │       └─ supabase.from('dmos_tags').select('*')
   │   │           .eq('campaign_id', campaignId)
   │   │
   │   ├─ setAvailableTags(tags)
   │   └─ setEditingItem(faction)
   │
   ▼
3. MODAL RENDERS
   │
   │ <TagSelector
   │   tags={availableTags}
   │   selectedIds={editingItem.tag_ids || []}
   │   onChange={(ids) => setEditingItem({...editingItem, tag_ids: ids})}
   │ />
   │
   ▼
4. USER CREATES NEW TAG
   │
   │ Click "Criar nova tag"
   │   ├─ Fill name, color, type
   │   └─ Click "Criar Tag"
   │
   ▼
5. TAGSELECTOR.TSX
   │
   │ handleCreateTag()
   │   ├─ newTag = { id, campaign_id, name, color, tag_type }
   │   ├─ db.tags.add(newTag)
   │   │   └─ supabase.from('dmos_tags').insert(newTag)
   │   │       └─ RLS checks ownership
   │   │           └─ INSERT succeeds
   │   │
   │   ├─ onTagsReload()
   │   │   └─ Fetch updated tags list
   │   │       └─ setAvailableTags(newList)
   │   │
   │   └─ onChange([...selectedIds, newTag.id])
   │       └─ Auto-select new tag
   │
   ▼
6. USER SELECTS MORE TAGS
   │
   │ Click tags from available list
   │   └─ onChange([id1, id2, id3])
   │       └─ setEditingItem({...item, tag_ids: [id1,id2,id3]})
   │
   ▼
7. USER SAVES FACTION
   │
   │ Click "Save Faction"
   │
   ▼
8. GENERICLIST.TSX
   │
   │ handleSave()
   │   │
   │   ├─ Step 1: Save Faction
   │   │   └─ db.factions.update({
   │   │         id, campaign_id, name, goal, ...,
   │   │         tag_ids: [id1, id2, id3]  // transient
   │   │       })
   │   │       └─ supabase.from('dmos_factions').update(...)
   │   │           └─ RLS checks ownership
   │   │               └─ UPDATE succeeds
   │   │
   │   ├─ Step 2: Clear old tag associations
   │   │   └─ db.faction_tags.deleteAll(factionId)
   │   │       └─ supabase.from('dmos_faction_tags')
   │   │           .delete()
   │   │           .eq('faction_id', factionId)
   │   │           └─ RLS checks ownership
   │   │               └─ DELETE succeeds
   │   │
   │   └─ Step 3: Create new tag associations
   │       └─ For each tagId in tag_ids:
   │           └─ db.faction_tags.add(factionId, tagId)
   │               └─ supabase.from('dmos_faction_tags')
   │                   .insert({ faction_id, tag_id })
   │                   └─ RLS checks ownership
   │                       └─ INSERT succeeds
   │
   ▼
9. SUCCESS
   │
   ├─ Modal closes
   ├─ List refreshes
   │   └─ loadItems()
   │       └─ Faction now shows with tags
   │
   └─ User sees updated faction in list
```

---

## 🎯 Key Design Decisions

### 1. Transient vs Persisted Fields

```
FACTION OBJECT IN MEMORY:
{
  id: "uuid-123",
  name: "Thieves Guild",
  goal: "Control underworld",
  tag_ids: ["tag-1", "tag-2"]  ◀── TRANSIENT (not in dmos_factions)
}

FACTION IN DATABASE:
dmos_factions
├─ id: "uuid-123"
├─ name: "Thieves Guild"
└─ goal: "Control underworld"

dmos_faction_tags
├─ (uuid-123, tag-1)
└─ (uuid-123, tag-2)

REASON: Normalization - avoid array columns, use proper pivot table
```

### 2. Compatibility Strategy

```
LOCATION OBJECT:
{
  faction_ids: ["faction-1", "faction-2"],  ◀── NEW (array)
  faction_influence: "Controlled by Guild"  ◀── OLD (text)
}

BOTH FIELDS COEXIST!
- New UI uses faction_ids
- Old data preserved in faction_influence
- Users can use both simultaneously
- No data migration required
```

### 3. Inline Creation

```
WHY INLINE TAG CREATION?
- Better UX: no context switching
- Faster workflow: create + select in one flow
- Immediate feedback: tag appears instantly
- Auto-selection: newly created tag is selected

IMPLEMENTATION:
- TagSelector has embedded form
- Toggle between list view and create view
- onTagsReload() callback refreshes list
- onChange() auto-adds new tag to selection
```

---

## 📚 References

- **Implementation**: `components/TagSelector.tsx`, `components/MultiFactionSelect.tsx`
- **Database**: `SQL_MIGRATIONS_REFERENCE.md`
- **API**: `services/store.ts` (db.tags, db.faction_tags)
- **Types**: `types.ts` (Tag, Faction, Location interfaces)
- **Schema**: `App.tsx` (field definitions)
- **Logic**: `pages/GenericList.tsx` (modal, save, load)

---

**Version**: 1.0  
**Date**: 2025-12-10  
**Architecture**: Client-side React + Supabase PostgreSQL
