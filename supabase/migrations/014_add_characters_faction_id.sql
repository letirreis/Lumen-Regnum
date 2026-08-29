-- Migration: Add missing faction_id column to dmos_characters
-- Date: 2026-08-29
-- Issue: types.ts's Character interface and the Character form in App.tsx
-- (SCHEMAS.character) both include a faction_id field, and pages/GenericList.tsx
-- already renders a Faction select and sends faction_id in the save payload for
-- characters - but dmos_characters never had this column, so selecting a
-- faction on a Character silently failed to persist (or would error, depending
-- on PostgREST's handling of an unknown column in the payload).
-- dmos_npcs already has an equivalent faction_id TEXT column with the same
-- ON DELETE SET NULL behavior; this mirrors it.

ALTER TABLE public.dmos_characters
  ADD COLUMN IF NOT EXISTS faction_id TEXT REFERENCES public.dmos_factions(id) ON DELETE SET NULL;
