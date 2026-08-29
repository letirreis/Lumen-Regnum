-- Migration: Validate dmos_faction_members.member_id against its declared member_type
-- Date: 2026-08-29
-- Issue: member_id has no foreign key, since it can point at either dmos_npcs or
-- dmos_characters depending on member_type - a plain FK can only reference one
-- table. Without any check, a deleted NPC/character leaves a phantom faction
-- member, and a typo'd member_type + member_id pair is accepted silently.
-- This adds a trigger that validates member_id actually exists in the table
-- named by member_type at insert/update time (existing rows are unaffected).
--
-- NOTE: dmos_faction_members.member_id is UUID, but dmos_npcs.id / dmos_characters.id
-- are TEXT on the live project (see note in 009) - the lookups below cast
-- member_id to text to match, since a bare `id = NEW.member_id` would fail with
-- a text/uuid type mismatch.

CREATE OR REPLACE FUNCTION validate_dmos_faction_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.member_type = 'npc' THEN
    IF NOT EXISTS (SELECT 1 FROM public.dmos_npcs WHERE id = NEW.member_id::text) THEN
      RAISE EXCEPTION 'member_id % does not exist in dmos_npcs', NEW.member_id;
    END IF;
  ELSIF NEW.member_type = 'character' THEN
    IF NOT EXISTS (SELECT 1 FROM public.dmos_characters WHERE id = NEW.member_id::text) THEN
      RAISE EXCEPTION 'member_id % does not exist in dmos_characters', NEW.member_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_dmos_faction_member ON public.dmos_faction_members;
CREATE TRIGGER trigger_validate_dmos_faction_member
  BEFORE INSERT OR UPDATE ON public.dmos_faction_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_dmos_faction_member();
