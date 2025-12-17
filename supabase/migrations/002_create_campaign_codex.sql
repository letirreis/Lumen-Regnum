-- Migration: Create dmos_campaign_codex table for Codex system
-- This table stores all worldbuilding and narrative information for campaigns

CREATE TABLE IF NOT EXISTS dmos_campaign_codex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES dmos_campaigns(id) ON DELETE CASCADE,
  main_arc JSONB DEFAULT '{}',
  major_plots JSONB DEFAULT '[]',
  world_lore JSONB DEFAULT '{}',
  magic_and_technology JSONB DEFAULT '{}',
  politics_and_factions JSONB DEFAULT '{}',
  secrets_of_world TEXT DEFAULT '',
  tone_and_aesthetic JSONB DEFAULT '{}',
  world_timeline JSONB DEFAULT '[]',
  home_rules TEXT DEFAULT '',
  notes_and_scraps TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);

-- Add RLS policies for dmos_campaign_codex
ALTER TABLE dmos_campaign_codex ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view codex for their own campaigns
DROP POLICY IF EXISTS "Users can view their campaign codex" ON dmos_campaign_codex;
CREATE POLICY "Users can view their campaign codex"
  ON dmos_campaign_codex FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM dmos_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert codex for their own campaigns
DROP POLICY IF EXISTS "Users can insert their campaign codex" ON dmos_campaign_codex;
CREATE POLICY "Users can insert their campaign codex"
  ON dmos_campaign_codex FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM dmos_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update codex for their own campaigns
DROP POLICY IF EXISTS "Users can update their campaign codex" ON dmos_campaign_codex;
CREATE POLICY "Users can update their campaign codex"
  ON dmos_campaign_codex FOR UPDATE
  USING (
    campaign_id IN (
      SELECT id FROM dmos_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete codex for their own campaigns
DROP POLICY IF EXISTS "Users can delete their campaign codex" ON dmos_campaign_codex;
CREATE POLICY "Users can delete their campaign codex"
  ON dmos_campaign_codex FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM dmos_campaigns WHERE user_id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dmos_campaign_codex_updated_at()
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

-- Trigger to call the function before update
DROP TRIGGER IF EXISTS trigger_update_dmos_campaign_codex_updated_at ON dmos_campaign_codex;
CREATE TRIGGER trigger_update_dmos_campaign_codex_updated_at
  BEFORE UPDATE ON dmos_campaign_codex
  FOR EACH ROW
  EXECUTE FUNCTION update_dmos_campaign_codex_updated_at();

-- Add comment for documentation
COMMENT ON TABLE dmos_campaign_codex IS 'Stores worldbuilding and narrative information for campaigns in the Codex system';
