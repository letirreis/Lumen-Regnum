-- Migration 019: segredos do mundo como lista estruturada e ligação com as cenas
-- Aditiva e segura (só colunas novas com valor padrão). O campo de texto antigo secrets_of_world
-- continua existindo e não é alterado. As políticas de RLS existentes cobrem as novas colunas.
--   dmos_campaign_codex.world_secrets : [{ id, title, truth, clues, status: Hidden|Hinted|Revealed }]
--   dmos_session_scenes.secret_ids    : ids de world_secrets que a cena pode revelar
ALTER TABLE public.dmos_campaign_codex
  ADD COLUMN IF NOT EXISTS world_secrets jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.dmos_session_scenes
  ADD COLUMN IF NOT EXISTS secret_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
