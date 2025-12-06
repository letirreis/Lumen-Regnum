-- Secure delete_user function with explicit search_path
-- This function allows users to delete their own account and associated data
-- 
-- Security improvements:
-- 1. SET search_path = public, pg_catalog - prevents search_path manipulation attacks
-- 2. Fully-qualified table names (public.auth.users) - ensures correct table resolution
-- 3. SECURITY DEFINER - runs with function owner's privileges
-- 4. Proper parameter validation

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
  
  -- Delete user data from application tables
  -- Note: Add your application-specific table deletions here
  -- Example: DELETE FROM public.user_logs WHERE user_id = current_user_id;
  -- Example: DELETE FROM public.dmos_campaigns WHERE owner_id = current_user_id;
  
  -- Delete user's campaigns (if they exist in the schema)
  DELETE FROM public.dmos_campaigns WHERE owner_id = current_user_id;
  
  -- Delete the user from auth.users (requires service role or SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- Log the deletion (optional - only if you have an audit log table)
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
