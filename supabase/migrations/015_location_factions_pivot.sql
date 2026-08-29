-- Migration: Location <-> Faction pivot table
-- Date: 2026-08-29
-- Issue: types.ts's Location.faction_ids and the "Facções (conectar)"
-- multi-select in the Location form (App.tsx SCHEMAS.location /
-- pages/GenericList.tsx) have never had a backing table - GenericList's
-- handleSave strips faction_ids out of the payload before saving a location
-- (since dmos_locations has no such column), so connecting a faction to a
-- location has always been a no-op in the running app.
-- This mirrors the existing dmos_faction_members / dmos_faction_tags pivot
-- pattern (see 004_tags_system.sql, 005_faction_members.sql).

CREATE TABLE IF NOT EXISTS public.dmos_location_factions (
    location_id TEXT NOT NULL REFERENCES public.dmos_locations(id) ON DELETE CASCADE,
    faction_id TEXT NOT NULL REFERENCES public.dmos_factions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    PRIMARY KEY (location_id, faction_id)
);

CREATE INDEX IF NOT EXISTS idx_dmos_location_factions_location_id ON public.dmos_location_factions(location_id);
CREATE INDEX IF NOT EXISTS idx_dmos_location_factions_faction_id ON public.dmos_location_factions(faction_id);

ALTER TABLE public.dmos_location_factions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view location-faction links in their campaigns" ON public.dmos_location_factions;
CREATE POLICY "Users can view location-faction links in their campaigns"
    ON public.dmos_location_factions
    FOR SELECT
    USING (
        location_id IN (
            SELECT id FROM public.dmos_locations WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create location-faction links in their campaigns" ON public.dmos_location_factions;
CREATE POLICY "Users can create location-faction links in their campaigns"
    ON public.dmos_location_factions
    FOR INSERT
    WITH CHECK (
        location_id IN (
            SELECT id FROM public.dmos_locations WHERE user_id = auth.uid()
        )
        AND faction_id IN (
            SELECT id FROM public.dmos_factions WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete location-faction links in their campaigns" ON public.dmos_location_factions;
CREATE POLICY "Users can delete location-faction links in their campaigns"
    ON public.dmos_location_factions
    FOR DELETE
    USING (
        location_id IN (
            SELECT id FROM public.dmos_locations WHERE user_id = auth.uid()
        )
    );
