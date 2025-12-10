-- Migration 004: Create Tags System
-- This migration creates the normalized tags system for categorizing factions and other entities

-- ============================================================================
-- 1. CREATE TAGS TABLE
-- ============================================================================

-- Tabela para armazenar tags normalizadas (type, status, custom tags)
-- Substitui o campo texto "tags" usado anteriormente em várias entidades (factions, etc.)
-- por um sistema estruturado com tabela própria e relacionamento many-to-many
CREATE TABLE IF NOT EXISTS public.dmos_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT, -- Hex color code or preset color name (ex: '#6366f1' or 'indigo')
    tag_type TEXT, -- Tipo da tag: 'type', 'status', 'custom', etc.
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_tag_per_campaign UNIQUE (campaign_id, name)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dmos_tags_campaign_id ON public.dmos_tags(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dmos_tags_type ON public.dmos_tags(tag_type);

-- ============================================================================
-- 2. ROW LEVEL SECURITY POLICIES FOR TAGS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.dmos_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view tags from their campaigns" ON public.dmos_tags;
DROP POLICY IF EXISTS "Users can create tags in their campaigns" ON public.dmos_tags;
DROP POLICY IF EXISTS "Users can update tags from their campaigns" ON public.dmos_tags;
DROP POLICY IF EXISTS "Users can delete tags from their campaigns" ON public.dmos_tags;

-- Policy: Usuários podem ver tags das suas campanhas
CREATE POLICY "Users can view tags from their campaigns"
    ON public.dmos_tags
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem criar tags nas suas campanhas
CREATE POLICY "Users can create tags in their campaigns"
    ON public.dmos_tags
    FOR INSERT
    WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem atualizar tags das suas campanhas
CREATE POLICY "Users can update tags from their campaigns"
    ON public.dmos_tags
    FOR UPDATE
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem deletar tags das suas campanhas
CREATE POLICY "Users can delete tags from their campaigns"
    ON public.dmos_tags
    FOR DELETE
    USING (
        campaign_id IN (
            SELECT id FROM public.dmos_campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- 3. CREATE FACTION-TAGS PIVOT TABLE
-- ============================================================================

-- Tabela pivot para relacionamento many-to-many entre factions e tags
-- Permite que uma faction tenha múltiplas tags e uma tag seja usada por múltiplas factions
CREATE TABLE IF NOT EXISTS public.dmos_faction_tags (
    faction_id UUID NOT NULL REFERENCES public.dmos_factions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.dmos_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Primary key composta
    PRIMARY KEY (faction_id, tag_id)
);

-- Índices para melhor performance em queries
CREATE INDEX IF NOT EXISTS idx_dmos_faction_tags_faction_id ON public.dmos_faction_tags(faction_id);
CREATE INDEX IF NOT EXISTS idx_dmos_faction_tags_tag_id ON public.dmos_faction_tags(tag_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES FOR FACTION-TAGS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.dmos_faction_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view faction-tag associations from their campaigns" ON public.dmos_faction_tags;
DROP POLICY IF EXISTS "Users can create faction-tag associations in their campaigns" ON public.dmos_faction_tags;
DROP POLICY IF EXISTS "Users can delete faction-tag associations from their campaigns" ON public.dmos_faction_tags;

-- Policy: Usuários podem ver associações de factions das suas campanhas
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

-- Policy: Usuários podem criar associações para factions das suas campanhas
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

-- Policy: Usuários podem deletar associações de factions das suas campanhas
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

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ============================================================================

-- Uncomment to verify table structure:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('dmos_tags', 'dmos_faction_tags')
-- ORDER BY table_name, ordinal_position;

-- Uncomment to verify RLS policies:
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE tablename IN ('dmos_tags', 'dmos_faction_tags');
