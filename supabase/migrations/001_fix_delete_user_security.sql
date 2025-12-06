-- Migration: Fix delete_user function security vulnerability
-- Date: 2025-12-06
-- Issue: Function public.delete_user has a mutable search_path security vulnerability
--
-- This migration:
-- 1. Drops the existing insecure delete_user function
-- 2. Creates a new secure version with explicit search_path
-- 3. Sets proper permissions
--
-- To apply this migration:
-- Run this SQL in your Supabase SQL Editor or via the Supabase CLI

-- Drop the old insecure function if it exists
DROP FUNCTION IF EXISTS public.delete_user();
DROP FUNCTION IF EXISTS public.delete_user(uuid);

-- Create the secure version with explicit search_path
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
  -- Add your application-specific table deletions here as needed
  -- Example pattern:
  -- DELETE FROM public.table_name WHERE user_id = current_user_id;
  
  -- Delete user's campaigns (adjust table name based on your schema)
  -- This will fail silently if the table doesn't exist - you may want to handle this
  BEGIN
    DELETE FROM public.dmos_campaigns WHERE owner_id = current_user_id;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, continue
      NULL;
  END;
  
  -- Delete the user from auth.users
  -- This requires SECURITY DEFINER as regular users can't delete from auth.users
  DELETE FROM auth.users WHERE id = current_user_id;
  
END;
$$;

-- Set proper permissions
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- Add documentation
COMMENT ON FUNCTION public.delete_user() IS 
'Securely deletes the current authenticated user and their associated data.
- Uses SECURITY DEFINER to access auth.users with elevated privileges
- Implements explicit search_path = public, pg_catalog for security
- Uses fully-qualified table names to prevent injection attacks
- Only accessible to authenticated users
- Automatically gets the user ID from the current session';

-- Verification query (optional - run after migration)
-- SELECT 
--   p.proname as function_name,
--   pg_get_function_identity_arguments(p.oid) as arguments,
--   CASE WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
--        WHEN p.provolatile = 's' THEN 'STABLE'
--        WHEN p.provolatile = 'v' THEN 'VOLATILE'
--   END as volatility,
--   CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security,
--   pg_get_function_result(p.oid) as return_type,
--   p.proconfig as settings
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' AND p.proname = 'delete_user';
