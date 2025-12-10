# Visual Guide: Tags System Fix

This document provides a visual representation of the problem and solution.

## The Problem (Before)

### What Users See
```
┌─────────────────────────────────────────┐
│  Faction Edit Dialog                    │
├─────────────────────────────────────────┤
│  Name: House Vareen                     │
│                                         │
│  Tags (type & status)                   │
│  ┌───────────────────────────────────┐ │
│  │ [Create New Tag]                  │ │
│  │                                   │ │
│  │ Tag Name: teste                   │ │
│  │ Color: [🟦]  Type: [type ▼]      │ │
│  │                                   │ │
│  │ [Criar Tag] [Cancelar]            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Save]                                 │
└─────────────────────────────────────────┘

User clicks [Criar Tag]...

┌─────────────────────────────────────────┐
│  ⚠️  Error Dialog                       │
├─────────────────────────────────────────┤
│                                         │
│  Erro ao criar tag. Verifique se a     │
│  tabela dmos_tags existe no banco de   │
│  dados.                                 │
│                                         │
│           [OK]                          │
└─────────────────────────────────────────┘
```

### What's in Supabase
```
Supabase Dashboard → Table Editor

┌────────────────────────────────────────┐
│  Tables                                │
├────────────────────────────────────────┤
│  ✓ dmos_campaigns                      │
│  ✓ dmos_characters                     │
│  ✓ dmos_factions                       │
│  ✓ dmos_tags          ← EXISTS!        │
│  ...                                   │
└────────────────────────────────────────┘

Table: dmos_tags
┌────┬─────────────┬──────┬───────┬────────┐
│ id │ campaign_id │ name │ color │ type   │
├────┼─────────────┼──────┼───────┼────────┤
│    │             │      │       │        │
│ (empty - can't insert!)                 │
└─────────────────────────────────────────┘
```

### The Hidden Problem
```
RLS Policies for dmos_tags: ❌ MISSING

Without RLS policies:
┌─────────────────────────────────────────┐
│  User tries to INSERT                   │
│  ↓                                      │
│  Supabase checks RLS                    │
│  ↓                                      │
│  No policies found                      │
│  ↓                                      │
│  ❌ PERMISSION DENIED                   │
└─────────────────────────────────────────┘

Table exists, but INSERT blocked!
```

---

## The Solution (After)

### Step 1: Apply Migration 004
```
Supabase Dashboard → SQL Editor

┌─────────────────────────────────────────┐
│  New Query                              │
├─────────────────────────────────────────┤
│                                         │
│  -- Contents of 004_create_tags.sql    │
│  CREATE TABLE IF NOT EXISTS dmos_tags   │
│  ...                                    │
│                                         │
│  ALTER TABLE dmos_tags ENABLE RLS;      │
│                                         │
│  CREATE POLICY "Users can view..."      │
│  CREATE POLICY "Users can create..."    │
│  CREATE POLICY "Users can update..."    │
│  CREATE POLICY "Users can delete..."    │
│                                         │
│           [Run] ←                       │
└─────────────────────────────────────────┘

Result: ✅ Success
```

### Step 2: Verify RLS Policies
```
SQL Editor → Run Query

SELECT policyname FROM pg_policies 
WHERE tablename = 'dmos_tags';

Results:
┌─────────────────────────────────────────┐
│ policyname                              │
├─────────────────────────────────────────┤
│ Users can view tags from their...       │
│ Users can create tags in their...       │
│ Users can update tags from their...     │
│ Users can delete tags from their...     │
└─────────────────────────────────────────┘

✅ 4 policies found - Good!
```

### Step 3: Test in Application
```
┌─────────────────────────────────────────┐
│  Faction Edit Dialog                    │
├─────────────────────────────────────────┤
│  Name: House Vareen                     │
│                                         │
│  Tags (type & status)                   │
│  ┌───────────────────────────────────┐ │
│  │ [Create New Tag]                  │ │
│  │                                   │ │
│  │ Tag Name: teste                   │ │
│  │ Color: [🟦]  Type: [type ▼]      │ │
│  │                                   │ │
│  │ [Criar Tag] [Cancelar]            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Save]                                 │
└─────────────────────────────────────────┘

User clicks [Criar Tag]...

✅ Tag created successfully!

┌─────────────────────────────────────────┐
│  Tags (type & status)                   │
│  ┌───────────────────────────────────┐ │
│  │ Selected:                         │ │
│  │  🟦 teste (type) [x]              │ │
│  │                                   │ │
│  │ Available:                        │ │
│  │  (click to add more tags)         │ │
│  │                                   │ │
│  │ [+ Criar nova tag]                │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### What Changed in Database
```
Table: dmos_tags
┌──────────┬─────────────┬───────┬─────────┬────────┐
│ id       │ campaign_id │ name  │ color   │ type   │
├──────────┼─────────────┼───────┼─────────┼────────┤
│ uuid-123 │ campaign-a  │ teste │ #6366f1 │ type   │
└──────────┴─────────────┴───────┴─────────┴────────┘

✅ Data inserted successfully!

RLS Policies: ✅ ACTIVE
- Users can only see tags from their campaigns
- Users can only create tags in their campaigns
- Campaign ownership verified via auth.uid()
```

---

## How RLS Works

### Without RLS Policies (Before)
```
┌──────────────┐         ┌──────────────┐
│    User      │         │   Database   │
│ (logged in)  │         │              │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │ INSERT INTO dmos_tags  │
       ├───────────────────────>│
       │                        │
       │                  ┌─────▼─────┐
       │                  │ Check RLS │
       │                  └─────┬─────┘
       │                        │
       │                  ❌ No policies
       │                        │
       │   Permission Denied    │
       │<───────────────────────┤
       │                        │
```

### With RLS Policies (After)
```
┌──────────────┐         ┌──────────────┐
│    User      │         │   Database   │
│ (logged in)  │         │              │
│ auth.uid()   │         │              │
│ = user-123   │         │              │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │ INSERT INTO dmos_tags  │
       │ campaign_id=camp-abc   │
       ├───────────────────────>│
       │                        │
       │                  ┌─────▼─────┐
       │                  │ Check RLS │
       │                  └─────┬─────┘
       │                        │
       │                  Check: Does user-123
       │                  own campaign camp-abc?
       │                        │
       │                  Query: SELECT id FROM
       │                  campaigns WHERE id=camp-abc
       │                  AND user_id=user-123
       │                        │
       │                  ✅ Yes! Match found
       │                        │
       │   Insert Successful    │
       │<───────────────────────┤
       │                        │
```

---

## Improved Error Messages

### Before
```
❌ Generic Message
"Erro ao criar tag. Verifique se a tabela dmos_tags existe no banco de dados."

Problem: Not helpful when table DOES exist
```

### After
```
✅ Specific Messages Based on Error Type

Case 1: Table Missing
"Erro ao criar tag. A tabela dmos_tags não existe no banco de dados. 
Execute a migration 004_create_tags.sql (veja supabase/migrations/README.md)."

Case 2: RLS Policy Issue
"Erro ao criar tag. Problema com permissões (RLS policies). 
Verifique se as RLS policies da tabela dmos_tags foram criadas corretamente. 
Execute a migration 004_create_tags.sql (veja supabase/migrations/README.md)."

Case 3: Duplicate Key
"Erro ao criar tag. Uma tag com esse nome já existe nesta campanha."

Case 4: Unknown Error
"Erro ao criar tag. Erro: [actual error message]. 
Verifique o console para mais detalhes."
```

---

## Quick Diagnosis Flowchart

```
Tag creation fails?
       │
       ▼
Does table exist?
┌─────────────────┐
│  SELECT * FROM  │
│  dmos_tags      │
└────┬────────────┘
     │
     ├─ No? ──> Apply migration 004
     │
     └─ Yes
        │
        ▼
Are RLS policies present?
┌─────────────────┐
│  SELECT FROM    │
│  pg_policies    │
└────┬────────────┘
     │
     ├─ No? ──> Apply migration 004
     │
     └─ Yes (4 policies)
        │
        ▼
Is user authenticated?
┌─────────────────┐
│  SELECT         │
│  auth.uid()     │
└────┬────────────┘
     │
     ├─ NULL? ──> Log in to app
     │
     └─ Has UUID
        │
        ▼
Does user own campaign?
┌─────────────────┐
│  SELECT * FROM  │
│  campaigns      │
│  WHERE user_id  │
│  = auth.uid()   │
└────┬────────────┘
     │
     ├─ No? ──> Use correct campaign_id
     │
     └─ Yes
        │
        ▼
Can insert test row?
┌─────────────────┐
│  INSERT INTO    │
│  dmos_tags ...  │
└────┬────────────┘
     │
     ├─ No? ──> Check Supabase logs
     │
     └─ Yes
        │
        ▼
    ✅ FIXED!
```

---

## Documentation Map

When you need help, go here:

```
Need to apply migrations?
  → supabase/migrations/README.md
  → supabase/migrations/004_create_tags.sql

Getting errors creating tags?
  → docs/TROUBLESHOOTING_TAGS.md
  → Step-by-step diagnosis
  → SQL verification queries

Want to understand the feature?
  → FEATURE_TAGS_README.md
  → Feature overview
  → Usage examples

Need SQL reference?
  → SQL_MIGRATIONS_REFERENCE.md
  → Original SQL documentation

General setup?
  → supabase/README.md
  → Database setup guide
  → All migrations listed

Quick start?
  → README.md
  → Main project README
  → Links to all guides
```

---

## Summary

### The Issue
✗ Table exists but can't insert  
✗ Generic error message  
✗ No clear fix  

### The Fix
✓ Apply migration 004_create_tags.sql  
✓ Includes RLS policies  
✓ Specific error messages  
✓ Comprehensive documentation  
✓ Verification queries  

### Result
Users can successfully create tags after applying the migration!
