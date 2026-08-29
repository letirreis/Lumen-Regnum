-- Secure delete_user function with explicit search_path
-- This function allows users to delete their own account and associated data
--
-- Security improvements:
-- 1. SET search_path = public, pg_catalog - prevents search_path manipulation attacks
-- 2. Fully-qualified table names (public.auth.users) - ensures correct table resolution
-- 3. SECURITY DEFINER - runs with function owner's privileges
-- 4. Proper parameter validation
--
-- CANONICAL SOURCE: this file is a documentation/reference copy. The version
-- actually applied to the database is whichever migration ran last -
-- currently migrations/007_fix_delete_user_owner_id.sql. Keep this file's body
-- in sync with that migration whenever one of them changes.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user's ID
  current_user_id := auth.uid();
  
  -- Validate that a user is actually logged in
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;
  
  -- Delete user data from application tables FIRST
  -- This prevents orphaned data if auth.users deletion succeeds but app data fails
  -- Note: Customize these deletions for your application's schema
  -- Example: DELETE FROM public.user_logs WHERE user_id = current_user_id;
  
  -- Delete user's campaigns (with error handling for missing table)
  -- dmos_campaigns is keyed by user_id (see RLS policies in migrations 002-005)
  BEGIN
    DELETE FROM public.dmos_campaigns WHERE user_id = current_user_id;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist in this schema, skip
      NULL;
  END;
  
  -- Add more application table deletions here as needed:
  -- BEGIN
  --   DELETE FROM public.your_table WHERE user_id = current_user_id;
  -- EXCEPTION
  --   WHEN undefined_table THEN NULL;
  -- END;
  
  -- Delete the user from auth.users LAST (requires SECURITY DEFINER privilege)
  -- This should be the final operation to prevent orphaned data
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- Log the deletion (optional - only if you have an audit log table)
  -- This should run BEFORE deleting from auth.users if you want to keep the log
  -- INSERT INTO public.user_deletion_log (user_id, deleted_at) 
  -- VALUES (current_user_id, pg_catalog.now());
  
END;
$$;

-- Grant execute permission to authenticated users only
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.delete_user() IS 
'Allows authenticated users to delete their own account and associated data. 
Uses SECURITY DEFINER to access auth.users table with elevated privileges.
Implements explicit search_path for security.';
