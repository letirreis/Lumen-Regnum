# Troubleshooting Guide: "Não reconhece a tabela dmos_tags"

This guide helps you diagnose and fix the error: **"Erro ao criar tag. Verifique se a tabela dmos_tags existe no banco de dados."**

## Problem Description

You see an error when trying to create tags, even though the `dmos_tags` table appears to exist in the Supabase Table Editor.

## Root Causes

This error typically occurs due to one of these reasons:

### 1. Missing RLS (Row Level Security) Policies ⚠️ **MOST COMMON**

**Symptoms:**
- Table exists in Supabase Table Editor
- Table is empty or has data
- Error occurs when trying to INSERT/UPDATE/DELETE

**Why this happens:**
- The table was created manually without RLS policies
- RLS is enabled but policies are missing or misconfigured
- User doesn't have permission according to the RLS policies

**How to check:**
Run this query in Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'dmos_tags';

-- Check existing policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'dmos_tags';
```

**Expected result:**
- `rowsecurity` should be `true`
- Should have 4 policies: one for SELECT, INSERT, UPDATE, DELETE

**How to fix:**
Apply the migration `004_create_tags.sql` which includes all necessary RLS policies.

---

### 2. Table Doesn't Exist

**Symptoms:**
- Error message mentions "relation does not exist"
- Table doesn't appear in Supabase Table Editor

**How to check:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'dmos_tags';
```

**Expected result:** Should return one row with `dmos_tags`

**How to fix:**
Apply migration `004_create_tags.sql` to create the table.

---

### 3. Campaign Ownership Issue

**Symptoms:**
- RLS policies exist
- Table exists
- Error still occurs when creating tags

**Why this happens:**
RLS policies check if `campaign_id` belongs to a campaign owned by the current user (`auth.uid()`).

**How to check:**
```sql
-- Check if you're authenticated
SELECT auth.uid();

-- Check if you own any campaigns
SELECT id, name, user_id 
FROM dmos_campaigns 
WHERE user_id = auth.uid();
```

**Expected result:**
- `auth.uid()` should return a UUID (your user ID)
- Should see at least one campaign

**How to fix:**
- Make sure you're logged in
- Make sure you're using the correct `campaign_id` when creating tags
- The campaign must belong to the authenticated user

---

### 4. Foreign Key Constraints

**Symptoms:**
- Error mentions "violates foreign key constraint"
- `campaign_id` is invalid

**How to check:**
```sql
-- Verify the campaign exists
SELECT id, name 
FROM dmos_campaigns 
WHERE id = 'YOUR_CAMPAIGN_ID_HERE';
```

**How to fix:**
Use a valid `campaign_id` that exists in `dmos_campaigns` table.

---

## Step-by-Step Diagnosis

Follow these steps in order:

### Step 1: Verify Table Exists

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'dmos_tags'
ORDER BY ordinal_position;
```

✅ **Expected:** Should list 7 columns (id, campaign_id, name, color, tag_type, created_by, created_at)  
❌ **If empty:** Table doesn't exist → Apply migration 004

---

### Step 2: Check RLS Status

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'dmos_tags';
```

✅ **Expected:** `rowsecurity = true`  
❌ **If false or empty:** RLS not enabled → Apply migration 004

---

### Step 3: Verify RLS Policies

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'dmos_tags'
ORDER BY cmd;
```

✅ **Expected:** 4 rows showing policies for SELECT, INSERT, UPDATE, DELETE  
❌ **If less than 4:** Policies missing → Apply migration 004

---

### Step 4: Test Authentication

```sql
SELECT auth.uid() as my_user_id;
```

✅ **Expected:** A UUID  
❌ **If NULL:** You're not logged in → Log in to the application

---

### Step 5: Check Campaign Ownership

```sql
SELECT id, name 
FROM dmos_campaigns 
WHERE user_id = auth.uid();
```

✅ **Expected:** At least one campaign  
❌ **If empty:** Create a campaign first in the application

---

### Step 6: Test Insert Permission

```sql
-- Try to insert a test tag (replace YOUR_CAMPAIGN_ID)
INSERT INTO dmos_tags (campaign_id, name, tag_type, color) 
VALUES (
    'YOUR_CAMPAIGN_ID',  -- Replace with actual campaign ID from Step 5
    'Test Tag',
    'type',
    '#6366f1'
);

-- If successful, clean up:
DELETE FROM dmos_tags WHERE name = 'Test Tag';
```

✅ **Expected:** Insert succeeds  
❌ **If fails:** Check the error message

Common errors:
- `permission denied`: RLS policies not working → Apply migration 004
- `violates foreign key`: Invalid campaign_id → Use ID from Step 5
- `duplicate key value`: Tag with that name exists → Change name or delete existing

---

## Quick Fixes

### Fix 1: Apply Migrations (Recommended)

The safest and most complete fix:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/004_create_tags.sql` from this repo
3. Copy and paste the entire content
4. Click **Run**
5. Verify success with diagnosis queries above

This will:
- ✅ Create table if missing (with `IF NOT EXISTS`)
- ✅ Set up RLS policies
- ✅ Create necessary indexes
- ✅ Be safe to run even if table already exists

---

### Fix 2: Just Add RLS Policies (If table exists)

If your table already exists and has data, you can run just the RLS policy sections from migration 004:

```sql
-- Enable RLS
ALTER TABLE public.dmos_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (in case of conflicts)
DROP POLICY IF EXISTS "Users can view tags from their campaigns" ON public.dmos_tags;
DROP POLICY IF EXISTS "Users can create tags in their campaigns" ON public.dmos_tags;
DROP POLICY IF EXISTS "Users can update tags from their campaigns" ON public.dmos_tags;
DROP POLICY IF EXISTS "Users can delete tags from their campaigns" ON public.dmos_tags;

-- Create new policies
CREATE POLICY "Users can view tags from their campaigns"
    ON public.dmos_tags FOR SELECT
    USING (campaign_id IN (SELECT id FROM public.dmos_campaigns WHERE user_id = auth.uid()));

CREATE POLICY "Users can create tags in their campaigns"
    ON public.dmos_tags FOR INSERT
    WITH CHECK (campaign_id IN (SELECT id FROM public.dmos_campaigns WHERE user_id = auth.uid()));

CREATE POLICY "Users can update tags from their campaigns"
    ON public.dmos_tags FOR UPDATE
    USING (campaign_id IN (SELECT id FROM public.dmos_campaigns WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete tags from their campaigns"
    ON public.dmos_tags FOR DELETE
    USING (campaign_id IN (SELECT id FROM public.dmos_campaigns WHERE user_id = auth.uid()));
```

---

## Understanding RLS Policies

The RLS policies ensure:

1. **SELECT**: You can only see tags from campaigns you own
2. **INSERT**: You can only create tags in campaigns you own
3. **UPDATE**: You can only modify tags from campaigns you own
4. **DELETE**: You can only delete tags from campaigns you own

The policy works by checking:
```sql
campaign_id IN (
    SELECT id FROM public.dmos_campaigns 
    WHERE user_id = auth.uid()
)
```

This means:
- ✅ If you own the campaign → Permission granted
- ❌ If someone else owns it → Permission denied
- ❌ If you're not logged in → Permission denied (`auth.uid()` returns NULL)

---

## Still Not Working?

If you've followed all steps and it still doesn't work:

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages when creating tag
   - Copy the full error message

2. **Check Supabase Logs**
   - Go to Supabase Dashboard
   - Logs → Postgres Logs
   - Look for errors around the time you tried to create a tag

3. **Verify User Session**
   - In browser console, run:
     ```javascript
     await supabase.auth.getUser()
     ```
   - Should return user object with `id`

4. **Test with Service Role Key** (temporary bypass RLS)
   - NOT recommended for production
   - Only for testing if RLS is the issue
   - Create a test client with service role key
   - If it works → RLS policies are the issue

5. **Create a GitHub Issue**
   - Include diagnosis results from all steps
   - Include error messages from console
   - Include Supabase logs if available

---

## Prevention

To avoid this issue in the future:

1. ✅ Always use migration files from `supabase/migrations/`
2. ✅ Don't create tables manually in Supabase without RLS policies
3. ✅ Test with the diagnosis queries after applying migrations
4. ✅ Keep migration files in version control
5. ✅ Document any manual schema changes

---

## Related Files

- `supabase/migrations/004_create_tags.sql` - Complete migration with RLS
- `supabase/migrations/005_add_faction_ids_to_locations.sql` - Multi-faction support
- `supabase/migrations/README.md` - How to apply migrations
- `FEATURE_TAGS_README.md` - Feature documentation
- `SQL_MIGRATIONS_REFERENCE.md` - Additional reference

---

## Summary Checklist

Run through this checklist:

- [ ] Table `dmos_tags` exists
- [ ] Table has 7 columns (id, campaign_id, name, color, tag_type, created_by, created_at)
- [ ] RLS is enabled on the table
- [ ] 4 RLS policies exist (SELECT, INSERT, UPDATE, DELETE)
- [ ] User is authenticated (auth.uid() returns UUID)
- [ ] User owns at least one campaign
- [ ] Test insert succeeds

If all items are checked ✅, tag creation should work!
