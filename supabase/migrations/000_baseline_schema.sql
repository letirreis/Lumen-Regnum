-- Migration: Baseline schema for the core dmos_* tables
-- Date: 2026-08-29 (rewritten after verifying against the live project)
--
-- WHY THIS FILE EXISTS
-- Every other migration in this directory assumes dmos_campaigns,
-- dmos_characters, dmos_npcs, dmos_monsters, dmos_locations, dmos_factions,
-- dmos_items, dmos_encounters, dmos_sessions and dmos_notes already exist -
-- none of them create these tables. They were created directly against the
-- Supabase project (dashboard/SQL editor) outside of version control, so a
-- fresh `supabase db push` against an empty project would fail, and there was
-- no single source of truth for their columns, types or RLS policies.
--
-- THIS VERSION WAS VERIFIED AGAINST THE LIVE PROJECT
-- An earlier draft of this file guessed UUID primary/foreign keys throughout,
-- by analogy with migrations 002-005. That guess was WRONG: the live project
-- (kadaeswavubftwfztzyv / "Lumen Regnun - RPG Campaign Manager") uses
-- client-generated TEXT ids everywhere except dmos_tags.id and
-- dmos_faction_tags.tag_id (native UUID), and every top-level table carries
-- its own `user_id UUID REFERENCES auth.users(id)` column with a single
-- `USING (auth.uid() = user_id)` policy for ALL commands - NOT the
-- campaign-id-join RLS pattern that migrations 002-005 use for the
-- newer "codex system" tables (dmos_campaign_codex, dmos_tags,
-- dmos_faction_tags, dmos_faction_members, dmos_session_scenes), which DO
-- match that join pattern (just with TEXT ids instead of UUID).
-- This file was corrected by querying information_schema.columns,
-- pg_constraint and pg_policies directly against that project. It is safe to
-- run (idempotent: IF NOT EXISTS / DROP POLICY IF EXISTS) but since every
-- table below already exists there, running it again is a no-op.
--
-- KNOWN GAPS NOT ADDRESSED HERE (flagged for a product decision, not fixed):
--   - Location's "faction_ids" multi-select in the UI is stripped out of the
--     payload before saving (see pages/GenericList.tsx handleSave) and there
--     is no dmos_location_factions pivot table, so connecting factions to a
--     Location is currently a no-op in the running app.
--   - dmos_tags and dmos_faction_tags each have two near-duplicate policies
--     per action (e.g. "Users can view their campaign tags" and "Users can
--     view tags from their campaigns"), evidently from the setup script being
--     run more than once with slightly different wording. Harmless (RLS ORs
--     permissive policies together) but worth consolidating.

CREATE TABLE IF NOT EXISTS public.dmos_campaigns (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT,
  theme TEXT,
  main_arc TEXT,
  status TEXT,
  notes TEXT
);

ALTER TABLE public.dmos_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.dmos_campaigns;
CREATE POLICY "Users can manage their own campaigns" ON public.dmos_campaigns FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dmos_locations (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT, type TEXT, region TEXT, faction_influence TEXT, importance TEXT,
  accent_color TEXT, tags TEXT, description TEXT, atmosphere TEXT,
  magic_intensity TEXT, architecture TEXT, population TEXT, government TEXT,
  economy TEXT, magic_tech TEXT, climate TEXT, dangers TEXT,
  typical_creatures TEXT, rumors TEXT, secrets TEXT, npcs_related TEXT,
  sub_locations TEXT, map_description TEXT, events TEXT, connections TEXT,
  map_url TEXT
);

ALTER TABLE public.dmos_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own locations" ON public.dmos_locations;
CREATE POLICY "Users can manage their own locations" ON public.dmos_locations FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dmos_factions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT, goal TEXT, methods TEXT, resources TEXT, conflicts TEXT,
  influence TEXT, notes TEXT
);

ALTER TABLE public.dmos_factions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own factions" ON public.dmos_factions;
CREATE POLICY "Users can manage their own factions" ON public.dmos_factions FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dmos_npcs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT, title TEXT, npc_type TEXT, race VARCHAR(100), class VARCHAR(100),
  status TEXT, magic_level TEXT, alignment TEXT, attributes JSONB,
  appearance TEXT, mannerisms TEXT, voice TEXT, personality_tags TEXT,
  motivation TEXT, secret TEXT, importance TEXT, role TEXT,
  faction_id TEXT REFERENCES public.dmos_factions(id) ON DELETE SET NULL,
  location_id TEXT REFERENCES public.dmos_locations(id) ON DELETE SET NULL,
  frequented_locations TEXT, relationships TEXT, notes TEXT
);

ALTER TABLE public.dmos_npcs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own npcs" ON public.dmos_npcs;
CREATE POLICY "Users can manage their own npcs" ON public.dmos_npcs FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dmos_characters (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT, race TEXT, class TEXT, subclass TEXT, level INTEGER,
  faction_id TEXT REFERENCES public.dmos_factions(id) ON DELETE SET NULL,
  ac INTEGER, max_hp INTEGER, current_hp INTEGER, attributes JSONB,
  passives JSONB, speed INTEGER, resistances TEXT, immunities TEXT,
  feats TEXT, notes TEXT, hooks TEXT
);

ALTER TABLE public.dmos_characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own characters" ON public.dmos_characters;
CREATE POLICY "Users can manage their own characters" ON public.dmos_characters FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dmos_monsters (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT, monster_type TEXT, size TEXT, cr TEXT, alignment TEXT,
  origin_biome TEXT, role TEXT, status TEXT, ac INTEGER, max_hp INTEGER,
  speed TEXT, attributes JSONB, skills TEXT, senses TEXT, languages TEXT,
  resistances TEXT, immunities TEXT, vulnerabilities TEXT, actions TEXT,
  reactions TEXT, legendary_actions TEXT, spells TEXT,
  intelligence_level TEXT, tactics TEXT, locations_found TEXT, loot TEXT,
  narrative_theme TEXT, horror_scale TEXT, consequences TEXT, notes TEXT
);

ALTER TABLE public.dmos_monsters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own monsters" ON public.dmos_monsters;
CREATE POLICY "Users can manage their own monsters" ON public.dmos_monsters FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dmos_items (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT, rarity TEXT, type TEXT, item_class TEXT, status TEXT,
  accent_color TEXT, tags TEXT, appearance TEXT, runes TEXT,
  effects_passive TEXT, effects_active TEXT, conditions TEXT,
  random_effects TEXT, requirements TEXT, class_compatibility TEXT,
  side_effects TEXT, corruption_growth TEXT, lore TEXT, evolution TEXT,
  owner TEXT,
  found_at_location_id TEXT REFERENCES public.dmos_locations(id) ON DELETE SET NULL,
  connections TEXT, hooks TEXT
);

ALTER TABLE public.dmos_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own items" ON public.dmos_items;
CREATE POLICY "Users can manage their own items" ON public.dmos_items FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dmos_encounters (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  name TEXT, creatures JSONB, status TEXT, notes TEXT, round INTEGER
);

ALTER TABLE public.dmos_encounters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own encounters" ON public.dmos_encounters;
CREATE POLICY "Users can manage their own encounters" ON public.dmos_encounters FOR ALL
  USING (auth.uid() = user_id);

-- Extended later by 003_session_planning.sql (session_number, title, goal_dm, ...)
CREATE TABLE IF NOT EXISTS public.dmos_sessions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  date TEXT, summary TEXT, decisions TEXT, npcs_encountered JSONB,
  locations_visited JSONB, items_found JSONB, secrets_revealed TEXT,
  consequences TEXT, next_hooks TEXT, notes TEXT
);

ALTER TABLE public.dmos_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.dmos_sessions;
CREATE POLICY "Users can manage their own sessions" ON public.dmos_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dmos_notes (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
  title TEXT, content TEXT, created_at TEXT
);

ALTER TABLE public.dmos_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.dmos_notes;
CREATE POLICY "Users can manage their own notes" ON public.dmos_notes FOR ALL
  USING (auth.uid() = user_id);
