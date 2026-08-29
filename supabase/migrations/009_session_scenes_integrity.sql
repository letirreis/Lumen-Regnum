-- Migration: Session scenes data integrity
-- Date: 2026-08-29
-- 1. Adds the missing index on dmos_session_scenes.session_id - every RLS policy on
--    this table filters through it via a JOIN, and services/store.ts's scenes.list()
--    also queries by it, so every scene read was doing a sequential scan.
-- 2. Adds the missing FK from location_id to dmos_locations, so a deleted location
--    can no longer leave a scene pointing at a dangling id.
--
-- NOTE: the live project's location_id and dmos_locations.id are both TEXT (this
-- project uses client-generated TEXT ids throughout, not native UUID columns,
-- despite several other checked-in migrations assuming UUID) - keep this a
-- same-type FK, do not convert either column to UUID.

CREATE INDEX IF NOT EXISTS idx_dmos_session_scenes_session_id ON dmos_session_scenes(session_id);

ALTER TABLE dmos_session_scenes
  ADD CONSTRAINT fk_dmos_session_scenes_location
  FOREIGN KEY (location_id) REFERENCES dmos_locations(id) ON DELETE SET NULL;
