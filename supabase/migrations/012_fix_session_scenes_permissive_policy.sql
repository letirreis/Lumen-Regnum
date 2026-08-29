-- Migration: Fix unrestricted RLS policy on dmos_session_scenes
-- Date: 2026-08-29
-- Discovered while auditing the live project's actual RLS policies (they diverge
-- from what 003_session_planning.sql defines - this table was evidently set up by
-- hand, not by running that migration): the live "Users can update their session
-- scenes" policy was created with cmd = ALL and no USING/WITH CHECK clause at
-- all, which grants unrestricted SELECT/UPDATE/DELETE to any authenticated user
-- on every row of this table, regardless of which campaign it belongs to -
-- more severe than any finding from the original code review. Replace it with a
-- properly scoped UPDATE policy and add the DELETE policy that was missing
-- entirely (previously only covered, unrestricted, by the ALL policy).

DROP POLICY IF EXISTS "Users can update their session scenes" ON public.dmos_session_scenes;

CREATE POLICY "Users can update their session scenes"
  ON public.dmos_session_scenes FOR UPDATE
  USING (
    session_id IN (
      SELECT s.id FROM public.dmos_sessions s
      JOIN public.dmos_campaigns c ON s.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their session scenes" ON public.dmos_session_scenes;
CREATE POLICY "Users can delete their session scenes"
  ON public.dmos_session_scenes FOR DELETE
  USING (
    session_id IN (
      SELECT s.id FROM public.dmos_sessions s
      JOIN public.dmos_campaigns c ON s.campaign_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
