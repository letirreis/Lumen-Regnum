-- Migration 004: Tags System
-- Creates normalized tags system with dmos_tags and dmos_faction_tags pivot table

-- 1. Create dmos_tags table
CREATE TABLE IF NOT EXISTS public.dmos_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT, -- Hex color code or preset color name (e.g., '#6366f1' or 'indigo')
    tag_type TEXT, -- Tag type: 'type', 'status', 'custom', etc.
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_tag_per_campaign UNIQUE (campaign_id, name)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dmos_tags_campaign_id ON public.dmos_tags(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dmos_tags_type ON public.dmos_tags(tag_type);

-- Row Level Security (RLS)
ALTER TABLE public.dmos_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tags from their campaigns
DROP POLICY IF EXISTS "Users can view tags from their campaigns" ON public.dmos_tags;
CREATE POLICY "Users can view tags from their campaigns"
    ON public.dmos_tags
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create tags in their campaigns
DROP POLICY IF EXISTS "Users can create tags in their campaigns" ON public.dmos_tags;
CREATE POLICY "Users can create tags in their campaigns"
    ON public.dmos_tags
    FOR INSERT
    WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update tags from their campaigns
DROP POLICY IF EXISTS "Users can update tags from their campaigns" ON public.dmos_tags;
CREATE POLICY "Users can update tags from their campaigns"
    ON public.dmos_tags
    FOR UPDATE
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete tags from their campaigns
DROP POLICY IF EXISTS "Users can delete tags from their campaigns" ON public.dmos_tags;
CREATE POLICY "Users can delete tags from their campaigns"
    ON public.dmos_tags
    FOR DELETE
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- 2. Create dmos_faction_tags pivot table
CREATE TABLE IF NOT EXISTS public.dmos_faction_tags (
    faction_id TEXT NOT NULL REFERENCES public.dmos_factions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.dmos_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Composite primary key
    PRIMARY KEY (faction_id, tag_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dmos_faction_tags_faction_id ON public.dmos_faction_tags(faction_id);
CREATE INDEX IF NOT EXISTS idx_dmos_faction_tags_tag_id ON public.dmos_faction_tags(tag_id);

-- Row Level Security (RLS)
ALTER TABLE public.dmos_faction_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view faction-tag associations from their campaigns
DROP POLICY IF EXISTS "Users can view faction-tag associations from their campaigns" ON public.dmos_faction_tags;
CREATE POLICY "Users can view faction-tag associations from their campaigns"
    ON public.dmos_faction_tags
    FOR SELECT
    USING (
        faction_id IN (
            SELECT id FROM public.dmos_factions 
            WHERE campaign_id IN (
                SELECT id FROM public.dmos_campaigns 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Users can create faction-tag associations in their campaigns
DROP POLICY IF EXISTS "Users can create faction-tag associations in their campaigns" ON public.dmos_faction_tags;
CREATE POLICY "Users can create faction-tag associations in their campaigns"
    ON public.dmos_faction_tags
    FOR INSERT
    WITH CHECK (
        faction_id IN (
            SELECT id FROM public.dmos_factions 
            WHERE campaign_id IN (
                SELECT id FROM public.dmos_campaigns 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Users can delete faction-tag associations from their campaigns
DROP POLICY IF EXISTS "Users can delete faction-tag associations from their campaigns" ON public.dmos_faction_tags;
CREATE POLICY "Users can delete faction-tag associations from their campaigns"
    ON public.dmos_faction_tags
    FOR DELETE
    USING (
        faction_id IN (
            SELECT id FROM public.dmos_factions 
            WHERE campaign_id IN (
                SELECT id FROM public.dmos_campaigns 
                WHERE user_id = auth.uid()
            )
        )
    );
