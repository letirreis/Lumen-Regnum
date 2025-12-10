# Supabase Database Setup

This directory contains SQL migrations and functions for the Lumen Regnum application's Supabase backend.

## Security Notice ⚠️

The `delete_user` function has been updated to fix a critical security vulnerability:
- **Issue**: Previous version had a mutable `search_path` that could be exploited
- **Fix**: Function now uses explicit `SET search_path = public, pg_catalog`
- **Impact**: Prevents SQL injection-like attacks and ensures predictable behavior

## Quick Setup

### 1. Apply the Security Fix

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/001_fix_delete_user_security.sql`
4. Click **Run** to execute the migration
5. Verify success with the verification query (included in the migration file)

**Option B: Via Supabase CLI**

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### 2. Verify the Fix

After applying the migration, run this query in the SQL Editor to verify:

```sql
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security,
  p.proconfig as settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'delete_user';
```

Expected output should show:
- `settings` includes `{search_path=public,pg_catalog}`
- `security` shows `SECURITY DEFINER`

## Files

### Migrations
- **`migrations/001_fix_delete_user_security.sql`** - Fixes the security vulnerability in the delete_user function
- **`migrations/002_create_campaign_codex.sql`** - Creates the campaign codex system
- **`migrations/003_session_planning.sql`** - Creates session planning and scenes tables
- **`migrations/004_create_tags.sql`** - Creates the normalized tags system (dmos_tags, dmos_faction_tags)
- **`migrations/005_add_faction_ids_to_locations.sql`** - Adds multi-faction support to locations
- **`migrations/README.md`** - Detailed guide on how to apply migrations

### Functions
- **`functions/delete_user.sql`** - The secure implementation of the delete_user function with detailed comments

## Applying Migrations

For detailed instructions on how to apply database migrations, see **`migrations/README.md`**.

Quick summary:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each migration file content (in numerical order)
3. Click Run to execute
4. Verify success with the verification queries

⚠️ **Important**: Migrations 004 and 005 are required for the Tags and Multi-Faction features to work.

## Function Documentation

### `delete_user()`

**Purpose**: Allows authenticated users to delete their own account and associated data.

**Security Features**:
- ✅ Explicit `search_path = public, pg_catalog`
- ✅ Fully-qualified table names
- ✅ `SECURITY DEFINER` to access auth.users
- ✅ Automatic user ID from session (uses `auth.uid()`)
- ✅ Restricted to authenticated users only

**Usage from Client**:
```typescript
// In your React/TypeScript code
import { supabase } from './services/supabase';

const deleteAccount = async () => {
  const { error } = await supabase.rpc('delete_user');
  if (error) throw error;
  // User is now deleted, sign out handled automatically
};
```

**What it does**:
1. Gets the current user's ID from the session
2. Validates a user is logged in
3. Deletes user data from application tables (e.g., campaigns)
4. Deletes the user from `auth.users`

## Customization (Important!)

⚠️ **You MUST customize the function for your application's schema.**

The provided migration includes a hardcoded reference to `dmos_campaigns` table, which may not exist in your schema or may have different column names. You need to:

1. **Review your database schema** and identify all tables that store user data
2. **Edit the migration SQL** before applying it
3. **Add DELETE statements** for each table that references users

### Example Customization:

```sql
-- Add inside the delete_user function's BEGIN block, BEFORE the auth.users deletion:

-- Pattern: Wrap each deletion in error handling for safety
BEGIN
  DELETE FROM public.your_table_name WHERE user_id = current_user_id;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END;

BEGIN
  DELETE FROM public.another_table WHERE user_foreign_key = current_user_id;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END;
```

### Why Error Handling?

The error handling (`EXCEPTION WHEN undefined_table/undefined_column`) makes the function resilient to schema changes and allows it to work across different environments where table structures might vary.

### Operation Order Matters!

1. **First**: Delete from application tables (campaigns, logs, etc.)
2. **Last**: Delete from `auth.users`

This order prevents orphaned data if application deletions fail.

## Password Recovery Setup

To enable password recovery emails:

1. **Configure Email Settings** in Supabase Dashboard:
   - Go to **Authentication** → **Settings** → **Email**
   - Configure your SMTP settings or use Supabase's default email service
   - Customize the password recovery email template

2. **Set Redirect URL**:
   - The app is configured to redirect to `${window.location.origin}/#/reset-password`
   - Make sure this route is handled in your application
   - Update if your routing structure is different

3. **Test the Flow**:
   ```typescript
   import { resetPassword } from './services/supabase';
   
   // User enters their email
   await resetPassword('user@example.com');
   // User receives email with reset link
   // Link redirects to /#/reset-password with token
   // User enters new password via updatePassword()
   ```

## Troubleshooting

### "Function delete_user does not exist"
- The migration hasn't been applied yet
- Apply `migrations/001_fix_delete_user_security.sql`

### "No authenticated user found"
- User is not logged in
- Check `auth.uid()` returns a valid UUID
- Verify the user's session is active

### "Permission denied for table auth.users"
- Function is not marked as `SECURITY DEFINER`
- Re-run the migration to fix

### Password recovery emails not sending
- Check email settings in Supabase Dashboard
- Verify SMTP configuration or enable Supabase email service
- Check spam/junk folders
- Verify the redirect URL is correctly configured

## Additional Resources

- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

## Support

For issues or questions:
1. Check the Supabase Dashboard logs
2. Review the SQL Editor query results
3. Verify your RLS (Row Level Security) policies
4. Check the application console for error messages
