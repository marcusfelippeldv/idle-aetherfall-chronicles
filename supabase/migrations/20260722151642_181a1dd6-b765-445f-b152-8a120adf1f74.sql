
-- =================== DAILY QUESTS ===================
CREATE TABLE public.daily_quest_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL, -- 'expeditions' | 'boss_kills' | 'items_sold' | 'gold_earned' | 'levels_gained'
  target INTEGER NOT NULL CHECK (target > 0),
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  reward_season_xp INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_quest_templates TO anon, authenticated;
GRANT ALL ON public.daily_quest_templates TO service_role;
ALTER TABLE public.daily_quest_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read templates" ON public.daily_quest_templates FOR SELECT USING (active);

CREATE TABLE public.daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.daily_quest_templates(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id, quest_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_quests TO authenticated;
GRANT ALL ON public.daily_quests TO service_role;
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quests" ON public.daily_quests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_daily_quests_user_date ON public.daily_quests(user_id, quest_date DESC);

-- =================== ACHIEVEMENTS ===================
CREATE TABLE public.achievement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  goal_type TEXT NOT NULL, -- 'level' | 'expeditions' | 'boss_kills' | 'gold_earned' | 'items_owned'
  threshold INTEGER NOT NULL,
  reward_premium INTEGER NOT NULL DEFAULT 0,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievement_templates TO anon, authenticated;
GRANT ALL ON public.achievement_templates TO service_role;
ALTER TABLE public.achievement_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read achievements" ON public.achievement_templates FOR SELECT USING (active);

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.achievement_templates(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  UNIQUE (user_id, template_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_achievements_user ON public.achievements(user_id);

-- =================== SEASONS ===================
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seasons TO anon, authenticated;
GRANT ALL ON public.seasons TO service_role;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read seasons" ON public.seasons FOR SELECT USING (true);

CREATE TABLE public.season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level > 0),
  xp_required INTEGER NOT NULL,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_premium INTEGER NOT NULL DEFAULT 0,
  reward_item_id UUID REFERENCES public.items(id),
  UNIQUE (season_id, level)
);
GRANT SELECT ON public.season_rewards TO anon, authenticated;
GRANT ALL ON public.season_rewards TO service_role;
ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read season rewards" ON public.season_rewards FOR SELECT USING (true);

CREATE TABLE public.season_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  season_xp INTEGER NOT NULL DEFAULT 0,
  claimed_levels INTEGER[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.season_progress TO authenticated;
GRANT ALL ON public.season_progress TO service_role;
ALTER TABLE public.season_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own season progress" ON public.season_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =================== RANKING INDEXES ===================
CREATE INDEX IF NOT EXISTS idx_characters_level ON public.characters(level DESC);
CREATE INDEX IF NOT EXISTS idx_characters_defeated_bosses ON public.characters USING gin(defeated_bosses);

-- =================== SEEDS ===================
INSERT INTO public.daily_quest_templates (slug, title, description, goal_type, target, reward_gold, reward_xp, reward_season_xp, weight) VALUES
  ('exp-2', 'Explorador', 'Complete 2 expedições hoje.', 'expeditions', 2, 300, 60, 50, 3),
  ('exp-5', 'Aventureiro', 'Complete 5 expedições hoje.', 'expeditions', 5, 800, 150, 120, 2),
  ('boss-1', 'Caçador de Chefes', 'Derrote 1 chefe hoje.', 'boss_kills', 1, 500, 100, 100, 3),
  ('boss-3', 'Matador de Titãs', 'Derrote 3 chefes hoje.', 'boss_kills', 3, 1500, 300, 300, 1),
  ('sell-5', 'Mercador', 'Venda 5 itens hoje.', 'items_sold', 5, 400, 50, 40, 2),
  ('sell-15', 'Comerciante', 'Venda 15 itens hoje.', 'items_sold', 15, 1200, 150, 120, 1),
  ('gold-1000', 'Buscador de Ouro', 'Colete 1000 ouros hoje.', 'gold_earned', 1000, 250, 80, 60, 3),
  ('level-1', 'Ascensão', 'Suba 1 nível hoje.', 'levels_gained', 1, 400, 0, 80, 2);

INSERT INTO public.achievement_templates (slug, title, description, category, goal_type, threshold, reward_premium, reward_gold, order_index) VALUES
  ('level-5',    'Iniciado',          'Alcance o nível 5.',               'level',       'level',        5,   5,  0, 10),
  ('level-10',   'Veterano',          'Alcance o nível 10.',              'level',       'level',        10,  15, 0, 11),
  ('level-25',   'Herói de Aetheril', 'Alcance o nível 25.',              'level',       'level',        25,  40, 0, 12),
  ('level-50',   'Lendário',          'Alcance o nível 50.',              'level',       'level',        50,  100,0, 13),
  ('exp-1',      'Primeiros Passos',  'Complete sua primeira expedição.', 'expeditions', 'expeditions',  1,   3,  0, 20),
  ('exp-10',     'Explorador Novato', 'Complete 10 expedições.',          'expeditions', 'expeditions',  10,  10, 0, 21),
  ('exp-50',     'Vagante Incansável','Complete 50 expedições.',          'expeditions', 'expeditions',  50,  30, 0, 22),
  ('exp-200',    'Andarilho Eterno',  'Complete 200 expedições.',         'expeditions', 'expeditions',  200, 80, 0, 23),
  ('boss-1',     'Cortador de Sombras','Derrote seu primeiro chefe.',     'combat',      'boss_kills',   1,   10, 0, 30),
  ('boss-5',     'Matador de Chefes', 'Derrote 5 chefes.',                'combat',      'boss_kills',   5,   25, 0, 31),
  ('boss-15',    'Purga do Continente','Derrote 15 chefes.',              'combat',      'boss_kills',   15,  60, 0, 32),
  ('gold-10k',   'Cofres Cheios',     'Acumule 10.000 ouros ganhos.',     'economy',     'gold_earned',  10000, 15, 0, 40),
  ('gold-100k',  'Barão do Ouro',     'Acumule 100.000 ouros ganhos.',    'economy',     'gold_earned',  100000, 50, 0, 41),
  ('items-25',   'Colecionador',      'Possua 25 itens em posse total.',  'collection',  'items_owned',  25,  10, 0, 50),
  ('items-100',  'Guardião do Bazar', 'Possua 100 itens em posse total.', 'collection',  'items_owned',  100, 40, 0, 51);

-- Seed: 1 temporada ativa de 30 dias
WITH s AS (
  INSERT INTO public.seasons (name, slug, description, starts_at, ends_at, active)
  VALUES ('Alvorecer de Aetheril', 'alvorecer-de-aetheril',
          'Primeira temporada do continente. 10 níveis de recompensas para os heróis mais dedicados.',
          now(), now() + INTERVAL '30 days', true)
  RETURNING id
)
INSERT INTO public.season_rewards (season_id, level, xp_required, reward_gold, reward_premium)
SELECT s.id, lvl, lvl * 500, lvl * 200, CASE WHEN lvl % 2 = 0 THEN 5 ELSE 0 END
FROM s, generate_series(1, 10) AS lvl;
