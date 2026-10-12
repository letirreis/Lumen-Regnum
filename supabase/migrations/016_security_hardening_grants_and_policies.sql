-- Migration 016: Security hardening (grants, trigger functions, policies)
-- Date: 2026-10-12
--
-- Estado verificado no projeto ao vivo (kadaeswavubftwfztzyv) antes desta migration:
--   * RLS ativo nas 16 tabelas, policies prendem os dados ao dono (OK).
--   * O papel anon tinha TODOS os privilégios de tabela, inclusive TRUNCATE (que NÃO passa por RLS).
--   * authenticated também tinha TRUNCATE/REFERENCES/TRIGGER sem necessidade.
--   * Policies das tabelas filhas (locations, npcs, ...) checavam só user_id, então um usuário
--     conseguia gravar um registro seu apontando para o campaign_id de outra pessoa.
--   * Todas as policies estavam no papel PUBLIC (inclui anon). Funciona porque auth.uid() é NULL
--     para anon, mas o correto é restringir a authenticated.
--   * Funções de trigger estavam com EXECUTE para anon/authenticated sem necessidade.
--
-- Esta migration NÃO muda o comportamento do app: o SELECT do anon foi mantido de propósito
-- porque services/supabase.ts (checkConnection) faz uma consulta de teste. Veja o passo opcional no final.

-- 1. Privilégios de tabela
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- 2. Funções de trigger não precisam ser chamáveis por API
--    (EXECUTE de função de trigger só é checado na criação do trigger, não ao disparar)
REVOKE EXECUTE ON FUNCTION public.update_dmos_campaign_codex_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_dmos_session_scenes_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_dmos_tags_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_dmos_faction_member() FROM PUBLIC, anon, authenticated;

-- 3. dmos_campaigns: policy só para authenticated, com WITH CHECK explícito
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.dmos_campaigns;
CREATE POLICY "Users can manage their own campaigns" ON public.dmos_campaigns
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 4. Tabelas filhas: além de user_id = auth.uid(), o campaign_id gravado precisa ser de
--    uma campanha do próprio usuário (impede inserir/mover registros para campanha alheia)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['dmos_locations','dmos_factions','dmos_npcs','dmos_characters',
                           'dmos_monsters','dmos_items','dmos_encounters','dmos_sessions','dmos_notes']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Users can manage their own ' || replace(t, 'dmos_', ''), t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
         USING ((select auth.uid()) = user_id)
         WITH CHECK (
           (select auth.uid()) = user_id
           AND (campaign_id IS NULL OR campaign_id IN (SELECT id FROM public.dmos_campaigns WHERE user_id = (select auth.uid())))
         )',
      'Users can manage their own ' || replace(t, 'dmos_', ''), t);
  END LOOP;
END $$;

-- 5. Demais policies (codex, tags, pivôs, cenas) estavam no papel PUBLIC: restringe a authenticated
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND roles = '{public}'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 6. OPCIONAL (aplicar só depois de publicar o checkConnection corrigido em services/supabase.ts):
--    tira também a leitura do anon. Antes disso, o app pode mostrar erro de conexão.
-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
