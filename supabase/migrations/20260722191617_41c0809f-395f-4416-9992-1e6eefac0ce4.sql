
CREATE TABLE public.idle_runs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_tick_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  pending_xp bigint NOT NULL DEFAULT 0,
  pending_gold bigint NOT NULL DEFAULT 0,
  pending_drops jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.idle_runs TO authenticated;
GRANT ALL ON public.idle_runs TO service_role;

ALTER TABLE public.idle_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own idle run select" ON public.idle_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own idle run insert" ON public.idle_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own idle run update" ON public.idle_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own idle run delete" ON public.idle_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_idle_runs_updated_at BEFORE UPDATE ON public.idle_runs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
