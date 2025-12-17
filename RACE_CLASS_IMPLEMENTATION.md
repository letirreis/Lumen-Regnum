# Race and Class Fields Implementation

## Overview

This document describes the implementation of Race and Class fields for NPCs and Player Characters in Lumen Regnum.

## Changes Summary

### 1. Database Changes

**Migration File**: `supabase/migrations/006_add_race_class_fields.sql`

The migration adds two new columns to the `dmos_npcs` table:
- `race VARCHAR(100)` - Nullable
- `class VARCHAR(100)` - Nullable

**Note**: The `dmos_characters` table already has these columns, so no changes are needed there.

**To Apply**: Run the migration SQL in your Supabase SQL Editor.

### 2. TypeScript Types

Both `Character` and `NPC` interfaces now include:
```typescript
race?: string;
class?: string;
```

Fields are optional for backwards compatibility with existing data.

### 3. Form Fields

Both Character and NPC forms now include:

**Race Field**:
- Dropdown with 9 D&D 5e races: Dragonborn, Dwarf, Elf, Gnome, Half-Elf, Half-Orc, Halfling, Human, Tiefling
- "Other" option for custom races
- Conditional text field appears when "Other" is selected
- Custom race values are saved directly to the `race` field

**Class Field**:
- Dropdown with 13 D&D 5e classes: Artificer, Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard

### 4. Card Display

NPCs and Characters now display race and class as prominent badges:

**Race Badge**:
- Gold/yellow styling: `bg-yellow-900/10 text-yellow-600 border-yellow-900/30`
- Icon: 🎭
- Example: `🎭 HUMAN`

**Class Badge**:
- Indigo/violet styling: `bg-indigo-900/20 text-indigo-300 border-indigo-800/50`
- Icon: ⚔️
- Example: `⚔️ CLERIC`

Badges appear prominently after custom tags and before other system badges.

## How to Use

### Creating/Editing NPCs or Characters

1. Navigate to NPCs or Characters section
2. Click "New" or edit an existing entry
3. Select a race from the dropdown
   - If selecting "Other", a custom race field will appear
   - Enter your custom race name
4. Select a class from the dropdown
5. Save

### Custom Races

When you select "Other" for race:
1. A "Custom Race" text field appears
2. Enter your custom race (e.g., "Aasimar", "Kenku", "Warforged")
3. The custom value is saved to the `race` field
4. When editing later, "Other" will be pre-selected and the custom value shown

### Viewing Cards

Race and class badges appear on all NPC and Character cards:
- Race: Gold/yellow with 🎭 icon
- Class: Indigo/violet with ⚔️ icon

Example card:
```
Dame Seraphine Lothaire
POLITICIAN | SÓLÁRIS | NEUTRAL | ANTAGONIST
🎭 HUMAN | ⚔️ CLERIC
```

## Technical Details

### Constants

Race and class options are defined as exported constants in `App.tsx`:
```typescript
export const DND_RACES = [
    'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 
    'Half-Orc', 'Halfling', 'Human', 'Tiefling', 'Other'
];

export const DND_CLASSES = [
    'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 
    'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 
    'Sorcerer', 'Warlock', 'Wizard'
];
```

### Conditional Field Rendering

The form system now supports conditional fields via the `conditionalOn` property:
```typescript
{
  key: 'race_custom',
  label: 'Custom Race',
  type: 'text',
  conditionalOn: { key: 'race', value: 'Other' }
}
```

This pattern can be reused for other conditional fields in the future.

### Validation

- Custom race field is validated: trimmed and checked for non-empty
- If "Other" is selected but no custom race provided, field is set to `null`
- Empty/null values are handled gracefully for backwards compatibility

## Testing Checklist

- [ ] Apply database migration
- [ ] Create a new NPC with a standard race (e.g., Human)
- [ ] Create a new NPC with a custom race (select "Other" and enter custom value)
- [ ] Edit an existing NPC and change its race/class
- [ ] Verify race and class badges appear on cards
- [ ] Verify custom races load correctly when editing
- [ ] Create a new Character with race and class
- [ ] Verify backwards compatibility with existing NPCs/Characters without race/class

## Design System

Colors follow the Lumen Regnum design system:
- **Gold**: `#D4AF37` for race (identity/heritage)
- **Indigo/Violet**: `#6366f1` for class (role/abilities)

Badge styling:
- Semi-transparent backgrounds
- Subtle borders
- Uppercase text
- Increased letter-spacing (tracking)
- 10px font size

## Future Enhancements

Potential improvements for the future:
- Add subclass support (optional dropdown)
- Add level display for NPCs (currently only for Characters)
- Add race/class filters in the filter bar
- Add quick-create buttons for common race/class combinations
- Add tooltips with race/class descriptions
