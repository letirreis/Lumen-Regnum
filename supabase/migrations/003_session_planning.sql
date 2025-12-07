-- Migration 003: Session Planning System
-- Expand dmos_sessions table with prep fields and create dmos_session_scenes table

-- 1. Add new fields to dmos_sessions for session planning/prep
ALTER TABLE dmos_sessions
ADD COLUMN IF NOT EXISTS session_number INTEGER,
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS goal_dm TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS focus_players TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS synopsis TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS expected_start_state TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS expected_end_state TEXT DEFAULT '';

-- 2. Create dmos_session_scenes table
CREATE TABLE IF NOT EXISTS dmos_session_scenes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT REFERENCES dmos_sessions(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  type TEXT DEFAULT 'Other',
  description TEXT DEFAULT '',
  objective TEXT DEFAULT '',
  location_id TEXT,
  npcs JSONB DEFAULT '[]',
  beats JSONB DEFAULT '[]',
  branches TEXT DEFAULT '',
  hooks TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on dmos_session_scenes
ALTER TABLE dmos_session_scenes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for dmos_session_scenes

-- Policy: Users can view their session scenes
CREATE POLICY "Users can view their session scenes"
  ON dmos_session_scenes FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM dmos_sessions s
      JOIN dmos_campaigns c ON s.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their session scenes
CREATE POLICY "Users can insert their session scenes"
  ON dmos_session_scenes FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM dmos_sessions s
      JOIN dmos_campaigns c ON s.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Policy: Users can update their session scenes
CREATE POLICY "Users can update their session scenes"
  ON dmos_session_scenes FOR UPDATE
  USING (
    session_id IN (
      SELECT s.id FROM dmos_sessions s
      JOIN dmos_campaigns c ON s.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their session scenes
CREATE POLICY "Users can delete their session scenes"
  ON dmos_session_scenes FOR DELETE
  USING (
    session_id IN (
      SELECT s.id FROM dmos_sessions s
      JOIN dmos_campaigns c ON s.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- 5. Create trigger function for updated_at on dmos_session_scenes
CREATE OR REPLACE FUNCTION update_dmos_session_scenes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_dmos_session_scenes_updated_at
  BEFORE UPDATE ON dmos_session_scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_dmos_session_scenes_updated_at();
