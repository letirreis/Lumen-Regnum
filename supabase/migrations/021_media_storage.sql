-- Migration 021: Imagens e mapas (armazenamento privado com cota e plano validados no servidor)
-- Date: 2026-10-18
--
-- SEGURANÇA
--   * Bucket PRIVADO "dmos-media". Ninguém acessa por URL pública: o app pede URLs assinadas e temporárias.
--   * Cada usuário só enxerga/cria/apaga arquivos dentro da própria pasta  <user_id>/...
--   * Só aceita JPEG, PNG e WebP (SVG fica de fora de propósito: pode carregar script) e até 3 MB por arquivo.
--     Esses dois limites são do próprio bucket (o Storage recusa antes de gravar).
--   * Trigger BEFORE INSERT em storage.objects confere, no servidor: recurso "imagens" do plano,
--     cota de bytes e cota de quantidade. Mesmo enviando direto pela API, sem o app, não passa.
--     (Overshoot máximo: um arquivo de até 3 MB, porque o tamanho só é conhecido depois do envio.)
--   * dmos_media guarda a quem a imagem pertence (NPC, local, item...) e só aceita entidades do próprio usuário.
--
-- LIMITES (por usuário): free sem upload | starter 50 MB e 300 arquivos | full 200 MB e 1500 arquivos.
-- Para mudar quando migrar para o plano Pro do Supabase, altere private.media_limit_bytes/media_limit_count.

-- 1) Bucket privado ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('dmos-media', 'dmos-media', false, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 3145728,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2) Políticas do storage: só a própria pasta; sem UPDATE (nada de sobrescrever) ------------------
DROP POLICY IF EXISTS "dmos-media owner select" ON storage.objects;
DROP POLICY IF EXISTS "dmos-media owner insert" ON storage.objects;
DROP POLICY IF EXISTS "dmos-media owner delete" ON storage.objects;

CREATE POLICY "dmos-media owner select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'dmos-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "dmos-media owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dmos-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "dmos-media owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'dmos-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- 3) Limites de mídia por plano -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.media_limit_bytes(p_tier text)
RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE p_tier WHEN 'starter' THEN 52428800::bigint WHEN 'full' THEN 209715200::bigint ELSE 0::bigint END;
$$;

CREATE OR REPLACE FUNCTION private.media_limit_count(p_tier text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE p_tier WHEN 'starter' THEN 300 WHEN 'full' THEN 1500 ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION private.media_usage(p_user uuid)
RETURNS TABLE (bytes bigint, files bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(sum(coalesce((o.metadata ->> 'size')::bigint, 0)), 0)::bigint, count(*)::bigint
    FROM storage.objects o
   WHERE o.bucket_id = 'dmos-media' AND (storage.foldername(o.name))[1] = p_user::text;
$$;

-- Cota aplicada a CADA upload (BEFORE INSERT em storage.objects)
CREATE OR REPLACE FUNCTION private.enforce_media_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_tier  text;
  v_bytes bigint;
  v_files bigint;
BEGIN
  IF NEW.bucket_id <> 'dmos-media' OR v_user IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('media:' || v_user::text, 0));

  v_tier := private.effective_tier(v_user);
  IF NOT private.tier_has_feature(v_tier, 'images') THEN
    RAISE EXCEPTION 'FEATURE_LOCKED:images';
  END IF;

  SELECT u.bytes, u.files INTO v_bytes, v_files FROM private.media_usage(v_user) u;

  IF v_bytes >= private.media_limit_bytes(v_tier) THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED:media_bytes:%:%', private.media_limit_bytes(v_tier), v_tier;
  END IF;
  IF v_files >= private.media_limit_count(v_tier) THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED:media_count:%:%', private.media_limit_count(v_tier), v_tier;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_media_quota_trigger ON storage.objects;
CREATE TRIGGER enforce_media_quota_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION private.enforce_media_quota();

-- 4) Vínculo imagem <-> entidade -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmos_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id text NOT NULL REFERENCES public.dmos_campaigns(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('npc', 'location', 'item', 'monster', 'character', 'faction')),
  entity_id   text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('portrait', 'map')),
  path        text NOT NULL UNIQUE,
  size_bytes  integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 3145728),
  mime        text NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dmos_media_campaign_idx ON public.dmos_media (campaign_id, entity_type);
CREATE INDEX IF NOT EXISTS dmos_media_entity_idx   ON public.dmos_media (entity_type, entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS dmos_media_one_portrait_idx
  ON public.dmos_media (entity_type, entity_id) WHERE kind = 'portrait';

ALTER TABLE public.dmos_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own media rows" ON public.dmos_media;
CREATE POLICY "Users manage their own media rows" ON public.dmos_media
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND path LIKE (SELECT auth.uid())::text || '/%'
    AND campaign_id IN (SELECT c.id FROM public.dmos_campaigns c WHERE c.user_id = (SELECT auth.uid()))
  );

REVOKE ALL ON TABLE public.dmos_media FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.dmos_media TO authenticated;

-- Regras no INSERT: recurso do plano, entidade do próprio usuário/campanha, no máximo 6 mapas por entidade
CREATE OR REPLACE FUNCTION private.enforce_media_row()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_table text;
  v_ok    boolean;
  v_maps  integer;
BEGIN
  IF v_user IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT private.tier_has_feature(private.effective_tier(v_user), 'images') THEN
    RAISE EXCEPTION 'FEATURE_LOCKED:images';
  END IF;

  IF NEW.kind = 'map' AND NEW.entity_type <> 'location' THEN
    RAISE EXCEPTION 'MEDIA_INVALID:map_only_for_locations';
  END IF;

  v_table := CASE NEW.entity_type
    WHEN 'npc' THEN 'dmos_npcs' WHEN 'location' THEN 'dmos_locations' WHEN 'item' THEN 'dmos_items'
    WHEN 'monster' THEN 'dmos_monsters' WHEN 'character' THEN 'dmos_characters' WHEN 'faction' THEN 'dmos_factions'
  END;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = $1 AND user_id = $2 AND campaign_id = $3)', v_table)
    INTO v_ok USING NEW.entity_id, v_user, NEW.campaign_id;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'MEDIA_INVALID:entity_not_found';
  END IF;

  IF NEW.kind = 'map' THEN
    SELECT count(*) INTO v_maps FROM public.dmos_media
     WHERE entity_type = NEW.entity_type AND entity_id = NEW.entity_id AND kind = 'map';
    IF v_maps >= 6 THEN
      RAISE EXCEPTION 'MEDIA_INVALID:too_many_maps';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_media_row_trigger ON public.dmos_media;
CREATE TRIGGER enforce_media_row_trigger
  BEFORE INSERT ON public.dmos_media
  FOR EACH ROW EXECUTE FUNCTION private.enforce_media_row();

REVOKE ALL ON FUNCTION private.media_limit_bytes(text)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.media_limit_count(text)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.media_usage(uuid)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_media_quota()     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_media_row()       FROM PUBLIC, anon, authenticated;

-- 5) my_plan passa a informar o uso de imagens ------------------------------------------------------
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
  v_mb bigint;
  v_mf bigint;
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

  SELECT u.bytes, u.files INTO v_mb, v_mf FROM private.media_usage(v_user) u;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'stored_tier', coalesce(v_sub.tier, 'free'),
    'expires_at', v_sub.tier_expires_at,
    'source', coalesce(v_sub.source, 'default'),
    'usage', v_usage,
    'limits', v_limits,
    'features', v_feat,
    'media', jsonb_build_object(
      'bytes_used', v_mb, 'bytes_limit', private.media_limit_bytes(v_tier),
      'files_used', v_mf, 'files_limit', private.media_limit_count(v_tier))
  );
END;
$$;
