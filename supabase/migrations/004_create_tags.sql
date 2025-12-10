-- Migration 004: Create Tags System
-- This migration creates dmos_tags and dmos_faction_tags tables for categorizing factions
--
-- IMPORTANT: Before running this migration, verify the data types in your existing tables:
--   1. Check dmos_campaigns.id type with: 
--      SELECT data_type FROM information_schema.columns WHERE table_name = 'dmos_campaigns' AND column_name = 'id';
--   2. Check dmos_factions.id type with:
--      SELECT data_type FROM information_schema.columns WHERE table_name = 'dmos_factions' AND column_name = 'id';
--   3. Check auth.users.id type with:
--      SELECT data_type FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id';
--
-- This migration assumes TEXT types for campaign_id, faction_id, and created_by based on common Supabase patterns.
-- If your schema uses different types (e.g., UUID), adjust the column types below accordingly.
--
-- RECOMMENDATION: Always backup your database before running migrations.

-- 1. Create dmos_tags table
CREATE TABLE IF NOT EXISTS dmos_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES dmos_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1', -- Default indigo color
  type TEXT DEFAULT 'custom', -- 'type', 'status', or 'custom'
  description TEXT DEFAULT '',
  created_by TEXT REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, name) -- Prevent duplicate tag names within a campaign
);

-- 2. Create dmos_faction_tags pivot table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS dmos_faction_tags (
  faction_id TEXT NOT NULL REFERENCES dmos_factions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES dmos_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (faction_id, tag_id)
);

-- 3. Enable RLS on dmos_tags
ALTER TABLE dmos_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for dmos_tags

-- Policy: Users can view tags for their own campaigns
CREATE POLICY "Users can view their campaign tags"
  ON dmos_tags FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM dmos_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert tags for their own campaigns
CREATE POLICY "Users can insert their campaign tags"
  ON dmos_tags FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM dmos_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update tags for their own campaigns
CREATE POLICY "Users can update their campaign tags"
  ON dmos_tags FOR UPDATE
  USING (
    campaign_id IN (
      SELECT id FROM dmos_campaigns WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete tags for their own campaigns
CREATE POLICY "Users can delete their campaign tags"
  ON dmos_tags FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM dmos_campaigns WHERE user_id = auth.uid()
    )
  );

-- 5. Enable RLS on dmos_faction_tags
ALTER TABLE dmos_faction_tags ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for dmos_faction_tags

-- Policy: Users can view faction tags for their own campaigns
CREATE POLICY "Users can view their faction tags"
  ON dmos_faction_tags FOR SELECT
  USING (
    faction_id IN (
      SELECT f.id FROM dmos_factions f
      JOIN dmos_campaigns c ON f.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Policy: Users can insert faction tags for their own campaigns
CREATE POLICY "Users can insert their faction tags"
  ON dmos_faction_tags FOR INSERT
  WITH CHECK (
    faction_id IN (
      SELECT f.id FROM dmos_factions f
      JOIN dmos_campaigns c ON f.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Policy: Users can delete faction tags for their own campaigns
CREATE POLICY "Users can delete their faction tags"
  ON dmos_faction_tags FOR DELETE
  USING (
    faction_id IN (
      SELECT f.id FROM dmos_factions f
      JOIN dmos_campaigns c ON f.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- 7. Create trigger function for updated_at on dmos_tags
CREATE OR REPLACE FUNCTION update_dmos_tags_updated_at()
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

-- 8. Create trigger to automatically update updated_at on dmos_tags
CREATE TRIGGER trigger_update_dmos_tags_updated_at
  BEFORE UPDATE ON dmos_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_dmos_tags_updated_at();

-- 9. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dmos_tags_campaign_id ON dmos_tags(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dmos_tags_type ON dmos_tags(type);
CREATE INDEX IF NOT EXISTS idx_dmos_faction_tags_faction_id ON dmos_faction_tags(faction_id);
CREATE INDEX IF NOT EXISTS idx_dmos_faction_tags_tag_id ON dmos_faction_tags(tag_id);

-- 10. Add comments for documentation
COMMENT ON TABLE dmos_tags IS 'Stores tags for categorizing factions and other entities within campaigns';
COMMENT ON TABLE dmos_faction_tags IS 'Pivot table for many-to-many relationship between factions and tags';
COMMENT ON COLUMN dmos_tags.type IS 'Tag type: type (faction type), status (faction status), or custom (user-defined)';
COMMENT ON COLUMN dmos_tags.color IS 'Hex color code for tag display in UI';
