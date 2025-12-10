-- Migration 005: Add Multi-Faction Support to Locations
-- This migration adds the ability to associate multiple factions with a location

-- ============================================================================
-- ADD FACTION_IDS COLUMN TO LOCATIONS
-- ============================================================================

-- Adiciona suporte para múltiplas facções associadas a uma location
-- Implementado como array de UUIDs para simplicidade
ALTER TABLE public.dmos_locations 
ADD COLUMN IF NOT EXISTS faction_ids UUID[];

-- Index for better query performance when searching by faction
CREATE INDEX IF NOT EXISTS idx_dmos_locations_faction_ids ON public.dmos_locations USING GIN (faction_ids);

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ============================================================================

-- Uncomment to verify column was added:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'dmos_locations'
-- AND column_name = 'faction_ids';
