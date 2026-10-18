-- Migration 020: Planos (free / starter / full), cotas e exportação protegidas no servidor
-- Date: 2026-10-18
--
-- PRINCÍPIOS DE SEGURANÇA
--   * O plano do usuário vive em public.dmos_subscriptions. O cliente só pode LER a própria linha
--     (RLS + GRANT de coluna). Nenhum INSERT/UPDATE/DELETE é permitido a anon/authenticated.
--     Quem escreve é o servidor: trigger do convite, função de admin e (futuramente) o webhook do
--     Stripe usando a service_role.
--   * NUNCA usamos user_metadata (editável pelo próprio usuário) para decidir plano.
--   * As cotas são aplicadas por TRIGGER BEFORE INSERT no banco. Mesmo chamando a API direto, sem o app,
--     não dá para passar do limite. Um advisory lock por usuário impede passar do limite com
--     requisições paralelas.
--   * Plano expirado (tier_expires_at no passado) volta a valer como "free" automaticamente.
--     Dados existentes NUNCA são apagados num downgrade: só não dá para criar acima da cota.
--   * "Ilimitado" na verdade tem um teto alto (anti-abuso). Cada linha também tem tamanho máximo.
--
-- COMO DAR/TROCAR PLANO MANUALMENTE (SQL Editor):
--   select private.set_user_plan('pessoa@email.com', 'full', 60);   -- full por 60 dias
--   select private.set_user_plan('pessoa@email.com', 'starter');    -- starter sem data de fim
--   select private.set_user_plan('pessoa@email.com', 'free');       -- volta para o grátis
--
-- CÓDIGOS DE CONVITE QUE CONCEDEM PLANO:
--   select * from private.create_invite_codes(3, 'Beta', 1, 14, 'full', 60);
--        -- 3 códigos, 1 uso cada, código vale 14 dias para ser usado, quem usar ganha FULL por 60 dias
--   select * from private.create_invite_codes(1, 'Maria');   -- convite comum: conta nasce no plano free

-- ---------------------------------------------------------------------------------------------
-- 1) Tabela de assinaturas
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmos_subscriptions (
  user_id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier                   text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'full')),
  tier_expires_at        timestamptz,
  source                 text NOT NULL DEFAULT 'default' CHECK (source IN ('default', 'invite', 'stripe', 'legacy', 'admin')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dmos_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmos_subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own subscription" ON public.dmos_subscriptions;
CREATE POLICY "Users can read their own subscription" ON public.dmos_subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.dmos_subscriptions FROM PUBLIC, anon, authenticated;
-- só colunas inofensivas; ids do Stripe ficam fora do alcance do navegador
GRANT SELECT (user_id, tier, tier_expires_at, source, created_at, updated_at)
  ON public.dmos_subscriptions TO authenticated;

-- Quem já existe (testadores convidados antes dos planos) fica no Full, sem prazo. Dá para mudar depois
-- com private.set_user_plan.
INSERT INTO public.dmos_subscriptions (user_id, tier, tier_expires_at, source)
SELECT id, 'full', NULL, 'legacy' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- 2) Funções internas (schema private: não exposto pela API)
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.effective_tier(p_user uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT s.tier FROM public.dmos_subscriptions s
      WHERE s.user_id = p_user AND (s.tier_expires_at IS NULL OR s.tier_expires_at > now())),
    'free');
$$;

-- Limites por plano. Os valores altos (starter/full) são tetos anti-abuso, não promessa de "ilimitado" infinito.
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
    ('dmos_sessions',     'free',    5), ('dmos_sessions',     'starter', 1000), ('dmos_sessions',     'full',     3000),
    ('dmos_session_scenes','free',  40), ('dmos_session_scenes','starter',5000), ('dmos_session_scenes','full',   15000),
    ('dmos_encounters',   'free',    5), ('dmos_encounters',   'starter',  500), ('dmos_encounters',   'full',     2000),
    ('dmos_notes',        'free',   20), ('dmos_notes',        'starter',  500), ('dmos_notes',        'full',     2000),
    ('dmos_tags',         'free',   20), ('dmos_tags',         'starter',  500), ('dmos_tags',         'full',     2000)
  ) AS v(resource, tier, lim)
  WHERE v.resource = p_resource AND v.tier = p_tier;
$$;

CREATE OR REPLACE FUNCTION private.tier_has_feature(p_tier text, p_feature text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_feature
    WHEN 'export'     THEN p_tier IN ('starter', 'full')
    WHEN 'images'     THEN p_tier IN ('starter', 'full')   -- ainda não existe no app
    WHEN 'share_link' THEN p_tier = 'full'                 -- ainda não existe no app
    WHEN 'co_gm'      THEN p_tier = 'full'                 -- ainda não existe no app
    WHEN 'ai'         THEN p_tier = 'full'                 -- ainda não existe no app
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION private.owned_count(p_user uuid, p_table text)
RETURNS bigint
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE n bigint;
BEGIN
  IF p_table = 'dmos_session_scenes' THEN
    SELECT count(*) INTO n FROM public.dmos_session_scenes sc
      JOIN public.dmos_sessions se ON se.id = sc.session_id WHERE se.user_id = p_user;
  ELSIF p_table = 'dmos_tags' THEN
    SELECT count(*) INTO n FROM public.dmos_tags t
      JOIN public.dmos_campaigns c ON c.id = t.campaign_id WHERE c.user_id = p_user;
  ELSIF p_table IN ('dmos_campaigns','dmos_npcs','dmos_locations','dmos_factions','dmos_items',
                    'dmos_monsters','dmos_characters','dmos_sessions','dmos_encounters','dmos_notes') THEN
    EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', p_table) INTO n USING p_user;
  ELSE
    RAISE EXCEPTION 'owned_count: tabela desconhecida %', p_table;
  END IF;
  RETURN n;
END;
$$;

-- Trigger de cota: roda ANTES de cada INSERT. Sem auth.uid() (service_role / SQL Editor) não limita.
CREATE OR REPLACE FUNCTION private.enforce_quota()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_tier  text;
  v_limit integer;
  v_count bigint;
BEGIN
  IF v_user IS NULL THEN
    RETURN NEW;
  END IF;

  -- uma fila por usuário: duas requisições simultâneas não passam juntas do limite
  PERFORM pg_advisory_xact_lock(hashtextextended('quota:' || v_user::text, 0));

  v_tier  := private.effective_tier(v_user);
  v_limit := private.tier_limit(v_tier, TG_TABLE_NAME);
  IF v_limit IS NULL THEN
    RAISE EXCEPTION 'QUOTA_UNKNOWN:%', TG_TABLE_NAME;
  END IF;

  v_count := private.owned_count(v_user, TG_TABLE_NAME);
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED:%:%:%', TG_TABLE_NAME, v_limit, v_tier
      USING HINT = 'Limite do plano atingido.';
  END IF;
  RETURN NEW;
END;
$$;

-- Tamanho máximo por linha (anti-abuso de armazenamento). TG_ARGV[0] = bytes.
CREATE OR REPLACE FUNCTION private.enforce_row_size()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF octet_length(to_jsonb(NEW)::text) > TG_ARGV[0]::integer THEN
    RAISE EXCEPTION 'ROW_TOO_LARGE:%', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$;

-- Admin: define o plano de alguém pelo e-mail
CREATE OR REPLACE FUNCTION private.set_user_plan(p_email text, p_tier text, p_days integer DEFAULT NULL)
RETURNS TABLE (email text, tier text, tier_expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_id uuid; v_exp timestamptz;
BEGIN
  IF p_tier NOT IN ('free', 'starter', 'full') THEN
    RAISE EXCEPTION 'plano inválido: %', p_tier;
  END IF;
  SELECT u.id INTO v_id FROM auth.users u WHERE lower(u.email) = lower(btrim(p_email));
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'usuário não encontrado: %', p_email;
  END IF;
  v_exp := CASE WHEN p_days IS NULL OR p_tier = 'free' THEN NULL ELSE now() + make_interval(days => p_days) END;
  INSERT INTO public.dmos_subscriptions AS s (user_id, tier, tier_expires_at, source)
  VALUES (v_id, p_tier, v_exp, 'admin')
  ON CONFLICT (user_id) DO UPDATE
    SET tier = EXCLUDED.tier, tier_expires_at = EXCLUDED.tier_expires_at, source = 'admin', updated_at = now();
  RETURN QUERY SELECT lower(btrim(p_email)), p_tier, v_exp;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- 3) Triggers de cota e de tamanho nas tabelas
-- ---------------------------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['dmos_campaigns','dmos_npcs','dmos_locations','dmos_factions','dmos_items',
                           'dmos_monsters','dmos_characters','dmos_sessions','dmos_session_scenes',
                           'dmos_encounters','dmos_notes','dmos_tags']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS enforce_quota_trigger ON public.%I', t);
    EXECUTE format('CREATE TRIGGER enforce_quota_trigger BEFORE INSERT ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION private.enforce_quota()', t);
    EXECUTE format('DROP TRIGGER IF EXISTS enforce_row_size_trigger ON public.%I', t);
    EXECUTE format('CREATE TRIGGER enforce_row_size_trigger BEFORE INSERT OR UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION private.enforce_row_size(200000)', t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS enforce_row_size_trigger ON public.dmos_campaign_codex;
CREATE TRIGGER enforce_row_size_trigger BEFORE INSERT OR UPDATE ON public.dmos_campaign_codex
  FOR EACH ROW EXECUTE FUNCTION private.enforce_row_size(1500000);

REVOKE ALL ON FUNCTION private.effective_tier(uuid)               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.tier_limit(text, text)             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.tier_has_feature(text, text)       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.owned_count(uuid, text)            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_quota()                    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_row_size()                 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.set_user_plan(text, text, integer) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 4) Convite concede plano
-- ---------------------------------------------------------------------------------------------
ALTER TABLE private.invite_codes       ADD COLUMN IF NOT EXISTS grant_tier text NOT NULL DEFAULT 'free' CHECK (grant_tier IN ('free', 'starter', 'full'));
ALTER TABLE private.invite_codes       ADD COLUMN IF NOT EXISTS grant_days integer CHECK (grant_days IS NULL OR grant_days > 0);
ALTER TABLE private.invite_redemptions ADD COLUMN IF NOT EXISTS grant_tier text NOT NULL DEFAULT 'free';
ALTER TABLE private.invite_redemptions ADD COLUMN IF NOT EXISTS grant_days integer;

DROP FUNCTION IF EXISTS private.create_invite_codes(integer, text, integer, integer);
CREATE OR REPLACE FUNCTION private.create_invite_codes(
  p_count      integer DEFAULT 1,
  p_note       text    DEFAULT NULL,
  p_max_uses   integer DEFAULT 1,
  p_valid_days integer DEFAULT NULL,
  p_tier       text    DEFAULT 'free',
  p_tier_days  integer DEFAULT NULL
)
RETURNS TABLE (code text, note text, max_uses integer, expires_at timestamptz, grant_tier text, grant_days integer)
LANGUAGE plpgsql
SET search_path = private, pg_catalog
AS $$
DECLARE
  i integer;
  h text;
  v_code text;
  v_expires timestamptz;
BEGIN
  IF p_count < 1 OR p_count > 100 THEN
    RAISE EXCEPTION 'p_count deve estar entre 1 e 100';
  END IF;
  IF p_tier NOT IN ('free', 'starter', 'full') THEN
    RAISE EXCEPTION 'p_tier inválido: %', p_tier;
  END IF;
  v_expires := CASE WHEN p_valid_days IS NULL THEN NULL ELSE now() + make_interval(days => p_valid_days) END;

  FOR i IN 1..p_count LOOP
    h := upper(replace(gen_random_uuid()::text, '-', ''));
    v_code := 'LUMEN-' || substr(h, 1, 4) || '-' || substr(h, 5, 4) || '-' || substr(h, 9, 4);
    INSERT INTO private.invite_codes AS ic (code, note, max_uses, expires_at, grant_tier, grant_days)
    VALUES (v_code, p_note, p_max_uses, v_expires, p_tier, p_tier_days);
    RETURN QUERY SELECT v_code, p_note, p_max_uses, v_expires, p_tier, p_tier_days;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION private.create_invite_codes(integer, text, integer, integer, text, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.enforce_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, pg_catalog
AS $$
DECLARE
  v_code text;
  v_row  private.invite_codes%ROWTYPE;
BEGIN
  v_code := upper(btrim(coalesce(NEW.raw_user_meta_data ->> 'invite_code', '')));

  IF v_code = '' THEN
    RAISE EXCEPTION 'INVITE_REQUIRED';
  END IF;

  SELECT * INTO v_row FROM private.invite_codes WHERE code = v_code FOR UPDATE;

  IF NOT FOUND
     OR v_row.revoked
     OR (v_row.expires_at IS NOT NULL AND v_row.expires_at < now())
     OR v_row.uses >= v_row.max_uses THEN
    RAISE EXCEPTION 'INVITE_INVALID';
  END IF;

  UPDATE private.invite_codes SET uses = uses + 1 WHERE code = v_code;
  INSERT INTO private.invite_redemptions (code, user_id, email, grant_tier, grant_days)
  VALUES (v_code, NEW.id, NEW.email, v_row.grant_tier, v_row.grant_days);

  NEW.raw_user_meta_data := NEW.raw_user_meta_data - 'invite_code';
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.enforce_invite_code() FROM PUBLIC, anon, authenticated;

-- Depois que o usuário existe, cria a assinatura conforme o convite usado
CREATE OR REPLACE FUNCTION private.provision_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r private.invite_redemptions%ROWTYPE;
BEGIN
  SELECT * INTO r FROM private.invite_redemptions WHERE user_id = NEW.id ORDER BY redeemed_at DESC LIMIT 1;
  IF FOUND AND r.grant_tier <> 'free' THEN
    INSERT INTO public.dmos_subscriptions (user_id, tier, tier_expires_at, source)
    VALUES (NEW.id, r.grant_tier,
            CASE WHEN r.grant_days IS NULL THEN NULL ELSE now() + make_interval(days => r.grant_days) END,
            'invite')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.dmos_subscriptions (user_id, tier, source)
    VALUES (NEW.id, 'free', 'default')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.provision_subscription() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS provision_subscription_trigger ON auth.users;
CREATE TRIGGER provision_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.provision_subscription();

CREATE OR REPLACE VIEW private.invite_status AS
SELECT
  c.code,
  c.note,
  c.uses || '/' || c.max_uses AS usos,
  CASE
    WHEN c.revoked THEN 'revogado'
    WHEN c.expires_at IS NOT NULL AND c.expires_at < now() THEN 'expirado'
    WHEN c.uses >= c.max_uses THEN 'esgotado'
    ELSE 'ativo'
  END AS situacao,
  c.expires_at,
  c.created_at,
  (SELECT string_agg(r.email, ', ' ORDER BY r.redeemed_at)
     FROM private.invite_redemptions r WHERE r.code = c.code) AS usado_por,
  c.grant_tier || coalesce(' por ' || c.grant_days || ' dias', '') AS plano_concedido
FROM private.invite_codes c;

-- ---------------------------------------------------------------------------------------------
-- 5) RPCs chamadas pelo app (security definer, só para usuários logados)
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_plan()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_tier text;
  v_sub  public.dmos_subscriptions%ROWTYPE;
  v_res  text;
  v_usage  jsonb := '{}'::jsonb;
  v_limits jsonb := '{}'::jsonb;
  v_feat   jsonb := '{}'::jsonb;
  f text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  v_tier := private.effective_tier(v_user);
  SELECT * INTO v_sub FROM public.dmos_subscriptions WHERE user_id = v_user;

  FOREACH v_res IN ARRAY ARRAY['dmos_campaigns','dmos_npcs','dmos_locations','dmos_factions','dmos_items',
                               'dmos_monsters','dmos_characters','dmos_sessions','dmos_session_scenes',
                               'dmos_encounters','dmos_notes','dmos_tags']
  LOOP
    v_usage  := v_usage  || jsonb_build_object(v_res, private.owned_count(v_user, v_res));
    v_limits := v_limits || jsonb_build_object(v_res, private.tier_limit(v_tier, v_res));
  END LOOP;

  FOREACH f IN ARRAY ARRAY['export','images','share_link','co_gm','ai'] LOOP
    v_feat := v_feat || jsonb_build_object(f, private.tier_has_feature(v_tier, f));
  END LOOP;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'stored_tier', coalesce(v_sub.tier, 'free'),
    'expires_at', v_sub.tier_expires_at,
    'source', coalesce(v_sub.source, 'default'),
    'usage', v_usage,
    'limits', v_limits,
    'features', v_feat
  );
END;
$$;

-- Backup completo de uma campanha (JSON). Recurso do Starter/Full, checado no servidor.
CREATE OR REPLACE FUNCTION public.export_campaign(p_campaign_id text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_camp jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF NOT private.tier_has_feature(private.effective_tier(v_user), 'export') THEN
    RAISE EXCEPTION 'FEATURE_LOCKED:export';
  END IF;

  SELECT to_jsonb(c) - 'user_id' INTO v_camp
    FROM public.dmos_campaigns c WHERE c.id = p_campaign_id AND c.user_id = v_user;
  IF v_camp IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  RETURN jsonb_build_object(
    'app', 'Lumen Regnum',
    'format_version', 1,
    'exported_at', now(),
    'campaign', v_camp,
    'codex',      (SELECT to_jsonb(x) FROM public.dmos_campaign_codex x WHERE x.campaign_id = p_campaign_id),
    'characters', (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_characters x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'npcs',       (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_npcs x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'monsters',   (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_monsters x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'locations',  (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_locations x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'factions',   (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_factions x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'items',      (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_items x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'sessions',   (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_sessions x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'scenes',     (SELECT coalesce(jsonb_agg(to_jsonb(sc)), '[]') FROM public.dmos_session_scenes sc
                     JOIN public.dmos_sessions se ON se.id = sc.session_id
                    WHERE se.campaign_id = p_campaign_id AND se.user_id = v_user),
    'encounters', (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_encounters x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'notes',      (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'user_id'), '[]') FROM public.dmos_notes x WHERE x.campaign_id = p_campaign_id AND x.user_id = v_user),
    'tags',       (SELECT coalesce(jsonb_agg(to_jsonb(x) - 'created_by'), '[]') FROM public.dmos_tags x WHERE x.campaign_id = p_campaign_id),
    'faction_members',  (SELECT coalesce(jsonb_agg(to_jsonb(fm)), '[]') FROM public.dmos_faction_members fm
                           JOIN public.dmos_factions f ON f.id = fm.faction_id
                          WHERE f.campaign_id = p_campaign_id AND f.user_id = v_user),
    'faction_tags',     (SELECT coalesce(jsonb_agg(to_jsonb(ft)), '[]') FROM public.dmos_faction_tags ft
                           JOIN public.dmos_factions f ON f.id = ft.faction_id
                          WHERE f.campaign_id = p_campaign_id AND f.user_id = v_user),
    'location_factions',(SELECT coalesce(jsonb_agg(to_jsonb(lf)), '[]') FROM public.dmos_location_factions lf
                           JOIN public.dmos_locations l ON l.id = lf.location_id
                          WHERE l.campaign_id = p_campaign_id AND l.user_id = v_user)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.my_plan()                FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.export_campaign(text)    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_plan()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_campaign(text) TO authenticated;
