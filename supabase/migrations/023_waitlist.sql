-- Migration 023: lista de espera (páginas de venda)
-- Date: 2026-10-18
--
-- Quem grava é a função de servidor /api/waitlist (service_role). O navegador NÃO tem acesso à tabela:
-- RLS ligado, sem nenhuma policy e sem GRANT para anon/authenticated. Só você enxerga, pelo painel.
--
-- COMO VER / EXPORTAR:  Table Editor > dmos_waitlist > Export CSV
--   ou:  select email, lang, source, created_at from public.dmos_waitlist order by created_at;

CREATE TABLE IF NOT EXISTS public.dmos_waitlist (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254 AND email = lower(btrim(email))),
  lang        text NOT NULL DEFAULT 'pt-BR' CHECK (lang IN ('pt-BR', 'en')),
  source      text CHECK (source IS NULL OR char_length(source) <= 60),
  notified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS dmos_waitlist_email_key ON public.dmos_waitlist (email);

ALTER TABLE public.dmos_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmos_waitlist FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.dmos_waitlist FROM PUBLIC, anon, authenticated;
