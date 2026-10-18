-- Migration 022: cadastro aberto (com ou sem código de convite)
-- Date: 2026-10-18
--
-- O que muda
--   * Antes: sem código de convite válido o cadastro era recusado no servidor.
--   * Agora: sem código, a conta é criada normalmente no plano grátis (Explorador). O plano pago
--     só passa a valer depois que o pagamento é confirmado pelo Stripe (webhook com service_role).
--   * Se a pessoa DIGITAR um código, ele continua sendo validado como antes: código inválido,
--     expirado, revogado ou esgotado ainda recusa o cadastro.
--   * Convites que concedem plano continuam funcionando (a concessão acontece na mesma etapa de antes).
--
-- Segurança: cadastro aberto atrai contas descartáveis. As cotas do plano grátis são pequenas e vivem no banco.
-- Recomendação: ligar "Confirm email" no Supabase Auth e um CAPTCHA (Authentication > Attack Protection).

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

  -- Sem código: cadastro aberto, conta nasce no plano grátis.
  IF v_code = '' THEN
    NEW.raw_user_meta_data := coalesce(NEW.raw_user_meta_data, '{}'::jsonb) - 'invite_code';
    RETURN NEW;
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
