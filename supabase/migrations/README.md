# How to Apply Supabase Migrations

This document explains how to apply the SQL migrations in the `supabase/migrations/` folder to your Supabase database.

## Overview

The migrations in this folder must be applied to your Supabase database for the application features to work correctly. Each migration file is numbered and should be applied in order.

## Current Migrations

1. **001_fix_delete_user_security.sql** - Security fix for delete_user function
2. **002_create_campaign_codex.sql** - Creates the campaign codex system
3. **003_session_planning.sql** - Creates session planning and scenes tables
4. **004_create_tags.sql** - ⚠️ **NEW** - Creates the normalized tags system
5. **005_add_faction_ids_to_locations.sql** - ⚠️ **NEW** - Adds multi-faction support to locations

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at https://supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New Query** button
4. Copy the contents of each migration file (in order)
5. Paste into the SQL editor
6. Click **Run** button to execute
7. Verify no errors occurred
8. Repeat for each migration file you haven't applied yet

### Option 2: Using Supabase CLI

If you have Supabase CLI installed and configured:

```bash
# Navigate to project root
cd /path/to/Lumen-Regnum

# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase db execute -f supabase/migrations/004_create_tags.sql
```

### Option 3: Using SQL Editor with File Upload

Some Supabase dashboards support file upload:

1. Go to SQL Editor
2. Look for an upload/import option
3. Select the migration file
4. Execute

## Verifying Migrations

After applying migrations, verify they worked correctly:

### Verify Tables Exist

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'dmos_campaigns',
    'dmos_campaign_codex', 
    'dmos_sessions',
    'dmos_session_scenes',
    'dmos_tags',
    'dmos_faction_tags',
    'dmos_locations'
)
ORDER BY table_name;
```

Expected result: All 7 tables should be listed.

### Verify Tags Tables Structure

Run this query to verify the tags tables were created correctly:

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('dmos_tags', 'dmos_faction_tags')
ORDER BY table_name, ordinal_position;
```

Expected result: 
- `dmos_tags` should have 7 columns: id, campaign_id, name, color, tag_type, created_by, created_at
- `dmos_faction_tags` should have 3 columns: faction_id, tag_id, created_at

### Verify RLS Policies

Run this query to verify Row Level Security policies:

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('dmos_tags', 'dmos_faction_tags')
ORDER BY tablename, cmd;
```

Expected result: Each table should have 3-4 policies for SELECT, INSERT, UPDATE, DELETE operations.

### Verify faction_ids Column

Run this query to verify the faction_ids column was added to locations:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'dmos_locations'
AND column_name = 'faction_ids';
```

Expected result: Should return one row showing `faction_ids` column with type `ARRAY`.

## Troubleshooting

### Error: "relation already exists"

This is normal if you're re-running a migration. The migrations use `IF NOT EXISTS` clauses to be idempotent (safe to run multiple times).

### Error: "permission denied"

Make sure you're logged in with sufficient permissions. You need to be the project owner or have database admin rights.

### Error: "column already exists"

Similar to "relation already exists" - the migration was likely already applied. You can safely ignore this.

### RLS Policies Blocking Operations

If you can create the table but get errors when trying to insert/update/delete:

1. Verify RLS policies were created (see verification queries above)
2. Make sure the user is authenticated (logged in)
3. Verify the user owns the campaign they're trying to modify
4. Check the Supabase logs for specific RLS policy violations

### Testing RLS Policies

To test if RLS policies are working:

```sql
-- This should work if you're authenticated and own a campaign
INSERT INTO dmos_tags (campaign_id, name, tag_type, color) 
VALUES (
    'YOUR_CAMPAIGN_ID_HERE', 
    'Test Tag', 
    'type', 
    '#6366f1'
);

-- Clean up test data
DELETE FROM dmos_tags WHERE name = 'Test Tag';
```

## What If Tables Already Exist?

If you already created the `dmos_tags` and `dmos_faction_tags` tables manually in Supabase:

1. **Check if RLS policies exist** using the verification query above
2. **If policies are missing**, you can either:
   - Option A: Drop and recreate the tables by running the migration
   - Option B: Run only the RLS policy sections from the migration file

### Option A: Drop and Recreate (if tables are empty)

```sql
-- Only do this if tables have no data you want to keep!
DROP TABLE IF EXISTS public.dmos_faction_tags;
DROP TABLE IF EXISTS public.dmos_tags;

-- Then run the full migration 004_create_tags.sql
```

### Option B: Add Missing RLS Policies Only

If your tables already have data and you don't want to recreate them, extract just the RLS policy sections from `004_create_tags.sql` and run those.

## Need Help?

If you encounter issues:

1. Check the Supabase logs in your dashboard (Logs > Postgres Logs)
2. Verify you're using the correct project and database
3. Make sure your user has the necessary permissions
4. Check for any existing policies that might conflict
5. Refer to the original `SQL_MIGRATIONS_REFERENCE.md` for additional context

## Security Notice

All migrations include Row Level Security (RLS) policies that ensure:
- Users can only access data from their own campaigns
- All database operations are properly authenticated
- Cross-campaign data access is prevented

These security measures are critical and should not be disabled.
