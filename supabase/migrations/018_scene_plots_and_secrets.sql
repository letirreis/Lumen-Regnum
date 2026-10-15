-- Migration 018: cenas ligadas às tramas do Códex e segredos a revelar
-- Aditiva e segura: só adiciona 2 colunas com valor padrão. As políticas de RLS da tabela
-- continuam valendo (elas já cobrem a linha inteira, via sessão -> campanha -> user_id).
--   plot_ids : ids (do Códex > Tramas Principais) que a cena movimenta
--   secrets  : segredos que o Mestre pretende revelar nesta cena
ALTER TABLE public.dmos_session_scenes
  ADD COLUMN IF NOT EXISTS plot_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS secrets  text  NOT NULL DEFAULT '';
