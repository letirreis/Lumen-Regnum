-- Migration 024: plano grátis cobre um arco inteiro + UTM na lista de espera
-- Date: 2026-10-19
--
-- 1) Plano free: sessões 5 -> 10, cenas 40 -> 80 e encontros 5 -> 10 (cenas e encontros sobem junto
--    para as 10 sessões não esgotarem a cota de cenas na metade). Demais limites ficam iguais.
--    Só aumenta cota: ninguém perde nada, e quem já estava no limite volta a poder criar.
-- 2) dmos_waitlist.utm: parâmetros de campanha (utm_source, utm_medium, ...) gravados pelo /api/waitlist.
--    Coluna nova e opcional; a rota continua funcionando se esta migração ainda não foi aplicada.
--
-- COMO VER:  select email, source, utm->>'utm_source' as origem, utm->>'utm_campaign' as campanha, created_at
--            from public.dmos_waitlist order by created_at desc;

CREATE OR REPLACE FUNCTION private.tier_limit(p_tier text, p_resource text)
RETURNS integer
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT v.lim FROM (VALUES
    ('dmos_campaigns',    'free',    1), ('dmos_campaigns',    'starter',    3), ('dmos_campaigns',    'full',      100),
    ('dmos_npcs',         'free',   10), ('dmos_npcs',         'starter', 1500), ('dmos_npcs',         'full',     5000),
    ('dmos_locations',    'free',   10), ('dmos_locations',    'starter', 1500), ('dmos_locations',    'full',     5000),
    ('dmos_factions',     'free',   10), ('dmos_factions',     'starter', 1500), ('dmos_factions',     'full',     5000),
    ('dmos_items',        'free',   10), ('dmos_items',        'starter', 1500), ('dmos_items',        'full',     5000),
    ('dmos_monsters',     'free',   10), ('dmos_monsters',     'starter', 1500), ('dmos_monsters',     'full',     5000),
    ('dmos_characters',   'free',   10), ('dmos_characters',   'starter', 1500), ('dmos_characters',   'full',     5000),
    ('dmos_sessions',     'free',   10), ('dmos_sessions',     'starter', 1000), ('dmos_sessions',     'full',     3000),
    ('dmos_session_scenes','free',  80), ('dmos_session_scenes','starter',5000), ('dmos_session_scenes','full',   15000),
    ('dmos_encounters',   'free',   10), ('dmos_encounters',   'starter',  500), ('dmos_encounters',   'full',     2000),
    ('dmos_notes',        'free',   20), ('dmos_notes',        'starter',  500), ('dmos_notes',        'full',     2000),
    ('dmos_tags',         'free',   20), ('dmos_tags',         'starter',  500), ('dmos_tags',         'full',     2000)
  ) AS v(resource, tier, lim)
  WHERE v.resource = p_resource AND v.tier = p_tier;
$$;

ALTER TABLE public.dmos_waitlist ADD COLUMN IF NOT EXISTS utm jsonb;
