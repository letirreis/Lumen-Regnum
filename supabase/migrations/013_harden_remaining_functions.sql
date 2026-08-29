-- Migration: Close remaining findings from the Supabase security advisor
-- Date: 2026-08-29
-- 1. delete_user() still had a direct EXECUTE grant to `anon` predating this
--    project's migrations - `REVOKE ALL ... FROM PUBLIC` (in 001/007) does not
--    remove a role-specific grant like this one. Calling it as anon would
--    already fail (auth.uid() is NULL, raising "No authenticated user found"),
--    but revoke the grant explicitly for defense in depth.
-- 2. update_dmos_tags_updated_at() has the same unnecessary-SECURITY-DEFINER
--    issue fixed for the other two updated_at triggers in
--    008_harden_trigger_functions.sql, but lives outside this repo's migrations
--    (dmos_tags was evidently set up by hand) so it was missed until the
--    Supabase advisor flagged it directly.

REVOKE EXECUTE ON FUNCTION public.delete_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_dmos_tags_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
