-- Migration 005: Faction Members (NPCs and Characters)
-- Creates pivot table for many-to-many relationship between factions and members (NPCs/Characters)

-- Tabela pivot para relacionamento many-to-many entre factions e membros
CREATE TABLE IF NOT EXISTS public.dmos_faction_members (
    faction_id UUID NOT NULL REFERENCES public.dmos_factions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL,
    member_type TEXT NOT NULL CHECK (member_type IN ('npc', 'character')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Primary key composta
    PRIMARY KEY (faction_id, member_id)
);

-- Índices para melhor performance em queries
CREATE INDEX idx_dmos_faction_members_faction_id ON public.dmos_faction_members(faction_id);
CREATE INDEX idx_dmos_faction_members_member_id ON public.dmos_faction_members(member_id);
CREATE INDEX idx_dmos_faction_members_member_type ON public.dmos_faction_members(member_type);

-- Row Level Security (RLS)
ALTER TABLE public.dmos_faction_members ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver membros de factions das suas campanhas
CREATE POLICY "Users can view faction members from their campaigns"
    ON public.dmos_faction_members
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
CREATE POLICY "Users can create faction members in their campaigns"
    ON public.dmos_faction_members
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
CREATE POLICY "Users can delete faction members from their campaigns"
    ON public.dmos_faction_members
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
