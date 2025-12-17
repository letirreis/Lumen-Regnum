-- Migration: Add Race and Class fields to NPCs and Characters
-- Date: 2025-12-17
-- Description: Adds race and class columns to dmos_npcs table
--              Note: dmos_characters already has these columns

-- Add race and class columns to dmos_npcs table
-- These columns are optional (nullable) to maintain compatibility with existing data
ALTER TABLE public.dmos_npcs 
ADD COLUMN IF NOT EXISTS race VARCHAR(100),
ADD COLUMN IF NOT EXISTS class VARCHAR(100);

-- Add comments to document the columns
COMMENT ON COLUMN public.dmos_npcs.race IS 'D&D 5e race (Dragonborn, Dwarf, Elf, Gnome, Half-Elf, Half-Orc, Halfling, Human, Tiefling, or custom)';
COMMENT ON COLUMN public.dmos_npcs.class IS 'D&D 5e class (Artificer, Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard)';

-- Verify the columns were added
-- Run this query to check:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'dmos_npcs'
-- AND column_name IN ('race', 'class');
