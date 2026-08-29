-- Migration: Make tag names unique case-insensitively per campaign
-- Date: 2026-08-29
-- Issue: the live unique constraint on dmos_tags is (campaign_id, name) - named
-- dmos_tags_campaign_id_name_key, not unique_tag_per_campaign as an earlier draft
-- of this migration guessed - and is case-sensitive, so "Goblins" and "goblins"
-- are treated as different tags in the same campaign, leading to accidental
-- near-duplicates. Drop whichever name exists and replace it with a
-- case-insensitive unique index.

ALTER TABLE public.dmos_tags DROP CONSTRAINT IF EXISTS dmos_tags_campaign_id_name_key;
ALTER TABLE public.dmos_tags DROP CONSTRAINT IF EXISTS unique_tag_per_campaign;

CREATE UNIQUE INDEX IF NOT EXISTS unique_tag_per_campaign_ci
  ON public.dmos_tags (campaign_id, lower(name));
