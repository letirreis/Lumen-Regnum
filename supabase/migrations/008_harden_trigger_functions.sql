-- Migration: Remove unnecessary SECURITY DEFINER from updated_at triggers
-- Date: 2026-08-29
-- Issue: update_dmos_campaign_codex_updated_at() and update_dmos_session_scenes_updated_at()
-- only stamp NEW.updated_at on the row already being written by the calling user -
-- they never touch data outside the caller's own privileges, so running them with
-- the function owner's elevated rights (SECURITY DEFINER) is an unnecessary privilege
-- escalation. SECURITY INVOKER (the default) is sufficient and safer.

CREATE OR REPLACE FUNCTION update_dmos_campaign_codex_updated_at()
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

CREATE OR REPLACE FUNCTION update_dmos_session_scenes_updated_at()
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
