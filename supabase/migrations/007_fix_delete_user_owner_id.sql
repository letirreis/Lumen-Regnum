-- Migration: Fix delete_user() deleting campaigns by the wrong column
-- Date: 2026-08-29
-- Issue: delete_user() deleted from public.dmos_campaigns using a non-existent
-- "owner_id" column, while every RLS policy in this project uses "user_id".
-- The function's own "WHEN undefined_column THEN NULL" handler swallowed the
-- resulting error, so the DELETE silently did nothing, auth.users was still
-- deleted, and the campaign (and all its child data) was left permanently
-- orphaned and unreachable (RLS requires auth.uid() = user_id).
--
-- This migration replaces delete_user() with a version that deletes by the
-- correct column and surfaces unexpected schema errors instead of hiding them.

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

  -- Delete the user's campaigns first (children cascade via ON DELETE CASCADE
  -- FKs to dmos_campaigns.id). Only tolerate the table being entirely absent;
  -- any other error (e.g. a genuinely wrong column name) must abort the
  -- transaction instead of being silently swallowed, so a schema drift here
  -- can never again leave data orphaned without any warning.
  BEGIN
    DELETE FROM public.dmos_campaigns WHERE user_id = current_user_id;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;

  -- Delete the user from auth.users LAST (requires SECURITY DEFINER privilege)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

COMMENT ON FUNCTION public.delete_user() IS
'Allows authenticated users to delete their own account and associated data.
Deletes public.dmos_campaigns by user_id (matches this project''s RLS policies),
then deletes the auth.users row. Uses SECURITY DEFINER with explicit search_path.';
