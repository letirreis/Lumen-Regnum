# Quick Fix for delete_user Security Vulnerability

## ⚠️ Critical Security Issue

Your Supabase `delete_user` function has a security vulnerability that needs immediate attention.

## What's Wrong?

The function lacks an explicit `search_path`, which can lead to:
- SQL injection-like vulnerabilities
- Unpredictable behavior during execution
- Potential security exploits

## How to Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Review & Customize the SQL

⚠️ **IMPORTANT**: Before running, you MUST customize the function for your database schema!

The migration file includes a reference to `dmos_campaigns` table. You need to:
1. Check if this table exists in your schema
2. Add deletions for any other tables that store user data
3. Update column names if they differ (e.g., `user_id` vs `owner_id`)

See the full `migrations/001_fix_delete_user_security.sql` file for the complete version with comments.

### Step 3: Copy & Paste This SQL

**Option A**: Copy the entire contents of `migrations/001_fix_delete_user_security.sql` (recommended - includes all error handling)

**Option B**: Use this simplified version (customize the table deletions):

```sql
-- Drop the old insecure function
DROP FUNCTION IF EXISTS public.delete_user();

-- Create the secure version
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;
  
  -- Delete user's data from application tables FIRST
  -- CUSTOMIZE THIS SECTION for your tables!
  BEGIN
    DELETE FROM public.dmos_campaigns WHERE owner_id = current_user_id;
  EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_column THEN NULL;
  END;
  
  -- Add more table deletions here as needed
  
  -- Delete from auth.users LAST
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Set permissions
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
```

### Step 4: Run the Query

Click the **Run** button (or press Cmd/Ctrl + Enter)

### Step 5: Verify It Worked

Run this verification query:

```sql
SELECT 
  p.proname as function_name,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security,
  p.proconfig as settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'delete_user';
```

You should see:
- `settings` contains `{search_path=public,pg_catalog}`
- `security` shows `SECURITY DEFINER`

## Done! ✅

Your `delete_user` function is now secure.

## What Changed?

### Before (Insecure):
```sql
CREATE FUNCTION public.delete_user() ...
-- No search_path set - VULNERABLE!
```

### After (Secure):
```sql
CREATE FUNCTION public.delete_user()
...
SET search_path = public, pg_catalog  -- Explicit and safe!
```

## Need More Help?

- See [README.md](./README.md) for detailed documentation
- Check [Supabase Docs](https://supabase.com/docs/guides/database/functions)
- Review the full migration in `migrations/001_fix_delete_user_security.sql`

## Password Recovery Issues?

If password recovery emails aren't working:

1. Go to **Authentication** → **Settings** → **Email** in Supabase Dashboard
2. Configure SMTP or enable Supabase's email service
3. Test with your email address

See the main [README.md](./README.md) for detailed password recovery setup.
