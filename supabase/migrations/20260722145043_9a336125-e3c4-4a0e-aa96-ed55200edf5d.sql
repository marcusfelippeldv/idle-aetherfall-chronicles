
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS defeated_bosses uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_combat jsonb;

ALTER TABLE public.expeditions
  ADD COLUMN IF NOT EXISTS rng_seed bigint NOT NULL DEFAULT (floor(random() * 2147483647))::bigint;

CREATE UNIQUE INDEX IF NOT EXISTS characters_one_active_per_user
  ON public.characters (user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS expeditions_running_by_character
  ON public.expeditions (character_id) WHERE status = 'running';
