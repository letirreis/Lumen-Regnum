-- Migration 017: Cadastro somente por convite
-- Date: 2026-10-12
--
-- Como funciona
--   * Os códigos ficam em private.invite_codes. O schema "private" NÃO é exposto pela API do
--     Supabase, então ninguém (nem anon, nem usuários logados) consegue ler ou listar os códigos.
--   * Um trigger em auth.users valida o código ANTES de criar o usuário. Sem código válido, o cadastro
--     falha no servidor, mesmo que alguém chame a API direto sem passar pela tela do app.
--   * O front-end envia o código em signUp(..., { options: { data: { invite_code } } }).
--   * Usuários que já existem não são afetados (o trigger só roda em novos cadastros).
--
-- COMO GERAR CÓDIGOS (rode no SQL Editor do Supabase):
--   select * from private.create_invite_codes(3, 'Beta testers');        -- 3 códigos de uso único
--   select * from private.create_invite_codes(1, 'Maria', 1, 7);         -- 1 código que vale 7 dias
--   select * from private.create_invite_codes(1, 'Turma da mesa', 5);    -- 1 código que serve para 5 pessoas
--
-- COMO ACOMPANHAR / REVOGAR:
--   select * from private.invite_status order by created_at desc;
--   update private.invite_codes set revoked = true where code = 'LUMEN-XXXX-XXXX-XXXX';

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.invite_codes (
  code        text PRIMARY KEY,
  note        text,
  max_uses    integer NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  uses        integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  expires_at  timestamptz,
  revoked     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS private.invite_redemptions (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code         text NOT NULL REFERENCES private.invite_codes(code) ON DELETE CASCADE,
  user_id      uuid NOT NULL,
  email        text,
  redeemed_at  timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC, anon, authenticated;
ALTER TABLE private.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Painel simples: quanto cada código já foi usado e por quem
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
     FROM private.invite_redemptions r WHERE r.code = c.code) AS usado_por
FROM private.invite_codes c;

-- Gerador de códigos. Formato: LUMEN-XXXX-XXXX-XXXX (hex, 48 bits aleatórios, sem caracteres ambíguos)
CREATE OR REPLACE FUNCTION private.create_invite_codes(
  p_count      integer DEFAULT 1,
  p_note       text    DEFAULT NULL,
  p_max_uses   integer DEFAULT 1,
  p_valid_days integer DEFAULT NULL
)
RETURNS TABLE (code text, note text, max_uses integer, expires_at timestamptz)
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
  v_expires := CASE WHEN p_valid_days IS NULL THEN NULL ELSE now() + make_interval(days => p_valid_days) END;

  FOR i IN 1..p_count LOOP
    h := upper(replace(gen_random_uuid()::text, '-', ''));
    v_code := 'LUMEN-' || substr(h, 1, 4) || '-' || substr(h, 5, 4) || '-' || substr(h, 9, 4);
    INSERT INTO private.invite_codes AS ic (code, note, max_uses, expires_at)
    VALUES (v_code, p_note, p_max_uses, v_expires);
    RETURN QUERY SELECT v_code, p_note, p_max_uses, v_expires;
  END LOOP;
END;
$$;

-- Validação no servidor: roda antes de qualquer novo usuário ser gravado em auth.users
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

  -- FOR UPDATE: duas pessoas usando o último uso do mesmo código ao mesmo tempo não passam as duas
  SELECT * INTO v_row FROM private.invite_codes WHERE code = v_code FOR UPDATE;

  IF NOT FOUND
     OR v_row.revoked
     OR (v_row.expires_at IS NOT NULL AND v_row.expires_at < now())
     OR v_row.uses >= v_row.max_uses THEN
    RAISE EXCEPTION 'INVITE_INVALID';
  END IF;

  UPDATE private.invite_codes SET uses = uses + 1 WHERE code = v_code;
  INSERT INTO private.invite_redemptions (code, user_id, email) VALUES (v_code, NEW.id, NEW.email);

  -- Não deixa o código gravado no perfil do usuário
  NEW.raw_user_meta_data := NEW.raw_user_meta_data - 'invite_code';
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.create_invite_codes(integer, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_invite_code() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_invite_code_trigger ON auth.users;
CREATE TRIGGER enforce_invite_code_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_invite_code();
