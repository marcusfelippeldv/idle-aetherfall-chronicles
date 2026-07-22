-- REBOOT: Eternal Shards
DROP TABLE IF EXISTS public.incursions CASCADE;
DROP TABLE IF EXISTS public.offline_reserves CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TABLE IF EXISTS public.cohorts CASCADE;
DROP TABLE IF EXISTS public.zone_waves CASCADE;
DROP TABLE IF EXISTS public.zones CASCADE;
DROP TABLE IF EXISTS public.enemies CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.archetypes CASCADE;
DROP FUNCTION IF EXISTS public.tg_validate_equipment() CASCADE;
DROP TYPE IF EXISTS public.item_slot CASCADE;
DROP TYPE IF EXISTS public.item_rarity CASCADE;
DROP TYPE IF EXISTS public.element CASCADE;
DROP TYPE IF EXISTS public.expedition_status CASCADE;
DROP TYPE IF EXISTS public.class_role CASCADE;

CREATE TYPE public.item_slot AS ENUM ('arma','ofmao','elmo','peito','pernas','pes','amuleto','anel','consumivel','material');
CREATE TYPE public.item_rarity AS ENUM ('comum','incomum','raro','epico','lendario','mitico');
CREATE TYPE public.element AS ENUM ('fogo','gelo','raio','terra','luz','sombra','arcano','neutro');
CREATE TYPE public.expedition_status AS ENUM ('em_andamento','concluida','reivindicada','cancelada');
CREATE TYPE public.class_role AS ENUM ('tanque','magico','suporte','fisico','lancista','assassino');

CREATE TABLE public.classes (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_slug TEXT REFERENCES public.classes(slug),
  tier INT NOT NULL DEFAULT 1,
  role class_role NOT NULL,
  description TEXT NOT NULL,
  base_hp INT NOT NULL DEFAULT 100,
  base_mana INT NOT NULL DEFAULT 50,
  base_atk INT NOT NULL DEFAULT 10,
  base_def INT NOT NULL DEFAULT 10,
  base_spd INT NOT NULL DEFAULT 10,
  hp_per_level INT NOT NULL DEFAULT 10,
  atk_per_level INT NOT NULL DEFAULT 2,
  def_per_level INT NOT NULL DEFAULT 2,
  awakening_name TEXT NOT NULL,
  awakening_desc TEXT NOT NULL,
  portrait_url TEXT,
  full_url TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.classes TO anon, authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes leitura pública" ON public.classes FOR SELECT USING (true);

CREATE TABLE public.element_matchups (
  attacker element NOT NULL,
  defender element NOT NULL,
  multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  PRIMARY KEY (attacker, defender)
);
GRANT SELECT ON public.element_matchups TO anon, authenticated;
GRANT ALL ON public.element_matchups TO service_role;
ALTER TABLE public.element_matchups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matchups leitura pública" ON public.element_matchups FOR SELECT USING (true);

CREATE TABLE public.abilities (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_slug TEXT REFERENCES public.classes(slug),
  kind TEXT NOT NULL,
  element element NOT NULL DEFAULT 'neutro',
  mana_cost INT NOT NULL DEFAULT 0,
  power NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  target TEXT NOT NULL DEFAULT 'inimigo_unico',
  description TEXT NOT NULL,
  icon_url TEXT
);
GRANT SELECT ON public.abilities TO anon, authenticated;
GRANT ALL ON public.abilities TO service_role;
ALTER TABLE public.abilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abilities leitura pública" ON public.abilities FOR SELECT USING (true);

CREATE TABLE public.ancestral_entities (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  element element NOT NULL,
  description TEXT NOT NULL,
  effect TEXT NOT NULL,
  cooldown_min INT NOT NULL DEFAULT 60,
  portrait_url TEXT,
  icon_url TEXT
);
GRANT SELECT ON public.ancestral_entities TO anon, authenticated;
GRANT ALL ON public.ancestral_entities TO service_role;
ALTER TABLE public.ancestral_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entities leitura pública" ON public.ancestral_entities FOR SELECT USING (true);

CREATE TABLE public.user_entities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_slug TEXT NOT NULL REFERENCES public.ancestral_entities(slug),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cooldown_until TIMESTAMPTZ,
  PRIMARY KEY (user_id, entity_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_entities TO authenticated;
GRANT ALL ON public.user_entities TO service_role;
ALTER TABLE public.user_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_entities dono" ON public.user_entities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_entities admin" ON public.user_entities FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.regions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  chapter INT NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  recommended_level INT NOT NULL DEFAULT 1,
  background_url TEXT,
  boss_slug TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.regions TO anon, authenticated;
GRANT ALL ON public.regions TO service_role;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regions leitura pública" ON public.regions FOR SELECT USING (true);

CREATE TABLE public.enemies (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  element element NOT NULL DEFAULT 'neutro',
  is_boss BOOLEAN NOT NULL DEFAULT false,
  level INT NOT NULL DEFAULT 1,
  hp INT NOT NULL,
  atk INT NOT NULL,
  def INT NOT NULL,
  spd INT NOT NULL DEFAULT 10,
  xp_reward INT NOT NULL DEFAULT 10,
  gold_reward INT NOT NULL DEFAULT 5,
  sprite_url TEXT
);
GRANT SELECT ON public.enemies TO anon, authenticated;
GRANT ALL ON public.enemies TO service_role;
ALTER TABLE public.enemies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enemies leitura pública" ON public.enemies FOR SELECT USING (true);

CREATE TABLE public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_slug TEXT NOT NULL REFERENCES public.regions(slug) ON DELETE CASCADE,
  stage_number INT NOT NULL,
  is_boss BOOLEAN NOT NULL DEFAULT false,
  enemy_pool TEXT[] NOT NULL DEFAULT '{}',
  boss_slug TEXT REFERENCES public.enemies(slug),
  UNIQUE (region_slug, stage_number)
);
GRANT SELECT ON public.stages TO anon, authenticated;
GRANT ALL ON public.stages TO service_role;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stages leitura pública" ON public.stages FOR SELECT USING (true);

CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  slot item_slot NOT NULL,
  rarity item_rarity NOT NULL DEFAULT 'comum',
  tier INT NOT NULL DEFAULT 1,
  element_affinity element,
  class_restriction TEXT[] NOT NULL DEFAULT '{}',
  hp_bonus INT NOT NULL DEFAULT 0,
  mana_bonus INT NOT NULL DEFAULT 0,
  attack_bonus INT NOT NULL DEFAULT 0,
  defense_bonus INT NOT NULL DEFAULT 0,
  speed_bonus INT NOT NULL DEFAULT 0,
  gold_value INT NOT NULL DEFAULT 10,
  sell_price INT NOT NULL DEFAULT 5,
  sold_in_shop BOOLEAN NOT NULL DEFAULT false,
  icon_url TEXT
);
GRANT SELECT ON public.items TO anon, authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items leitura pública" ON public.items FOR SELECT USING (true);

CREATE TABLE public.heroes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_slug TEXT NOT NULL REFERENCES public.classes(slug),
  element element NOT NULL DEFAULT 'neutro',
  is_protagonist BOOLEAN NOT NULL DEFAULT false,
  level INT NOT NULL DEFAULT 1,
  xp BIGINT NOT NULL DEFAULT 0,
  hp INT NOT NULL DEFAULT 100,
  mana INT NOT NULL DEFAULT 50,
  atk INT NOT NULL DEFAULT 10,
  def INT NOT NULL DEFAULT 10,
  spd INT NOT NULL DEFAULT 10,
  awakening_energy INT NOT NULL DEFAULT 0,
  priorities JSONB NOT NULL DEFAULT '[]',
  equipped_arma UUID,
  equipped_ofmao UUID,
  equipped_elmo UUID,
  equipped_peito UUID,
  equipped_pernas UUID,
  equipped_pes UUID,
  equipped_amuleto UUID,
  equipped_anel UUID,
  portrait_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX heroes_user_idx ON public.heroes(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heroes TO authenticated;
GRANT ALL ON public.heroes TO service_role;
ALTER TABLE public.heroes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "heroes dono" ON public.heroes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "heroes admin" ON public.heroes FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_heroes_updated_at BEFORE UPDATE ON public.heroes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id),
  quantity INT NOT NULL DEFAULT 1,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX inventory_user_idx ON public.inventory(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory dono" ON public.inventory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inventory admin" ON public.inventory FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_validate_hero_equipment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  slot_col TEXT;
  inv_id UUID;
  inv_user UUID;
  inv_slot item_slot;
  inv_restr TEXT[];
  hero_class TEXT;
  ids UUID[];
BEGIN
  hero_class := NEW.class_slug;
  FOREACH slot_col IN ARRAY ARRAY['arma','ofmao','elmo','peito','pernas','pes','amuleto','anel']
  LOOP
    EXECUTE format('SELECT ($1).equipped_%I', slot_col) INTO inv_id USING NEW;
    IF inv_id IS NOT NULL THEN
      SELECT inv.user_id, it.slot, it.class_restriction
        INTO inv_user, inv_slot, inv_restr
        FROM public.inventory inv
        JOIN public.items it ON it.id = inv.item_id
       WHERE inv.id = inv_id;
      IF inv_user IS NULL THEN RAISE EXCEPTION 'Item de inventário % não existe', inv_id; END IF;
      IF inv_user <> NEW.user_id THEN RAISE EXCEPTION 'Item de inventário não pertence ao dono do herói'; END IF;
      IF inv_slot::text <> slot_col THEN RAISE EXCEPTION 'Item tem slot % e não pode ir em %', inv_slot, slot_col; END IF;
      IF inv_restr IS NOT NULL AND array_length(inv_restr, 1) IS NOT NULL AND NOT (hero_class = ANY(inv_restr)) THEN
        RAISE EXCEPTION 'Este item é exclusivo de outra classe';
      END IF;
    END IF;
  END LOOP;
  ids := ARRAY[NEW.equipped_arma, NEW.equipped_ofmao, NEW.equipped_elmo, NEW.equipped_peito,
               NEW.equipped_pernas, NEW.equipped_pes, NEW.equipped_amuleto, NEW.equipped_anel];
  IF (SELECT count(DISTINCT x) FROM unnest(ids) x WHERE x IS NOT NULL) <>
     (SELECT count(x) FROM unnest(ids) x WHERE x IS NOT NULL) THEN
    RAISE EXCEPTION 'Mesmo item não pode ocupar dois slots';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_hero_equipment BEFORE INSERT OR UPDATE ON public.heroes FOR EACH ROW EXECUTE FUNCTION public.tg_validate_hero_equipment();

CREATE TABLE public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slot1 UUID REFERENCES public.heroes(id) ON DELETE SET NULL,
  slot2 UUID REFERENCES public.heroes(id) ON DELETE SET NULL,
  slot3 UUID REFERENCES public.heroes(id) ON DELETE SET NULL,
  slot4 UUID REFERENCES public.heroes(id) ON DELETE SET NULL,
  entity_slug TEXT REFERENCES public.ancestral_entities(slug),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parties TO authenticated;
GRANT ALL ON public.parties TO service_role;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties dono" ON public.parties FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "parties admin" ON public.parties FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_parties_updated_at BEFORE UPDATE ON public.parties FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.expeditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region_slug TEXT NOT NULL REFERENCES public.regions(slug),
  duration_min INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  status expedition_status NOT NULL DEFAULT 'em_andamento',
  party_snapshot JSONB NOT NULL,
  seed BIGINT NOT NULL,
  report JSONB,
  claimed_at TIMESTAMPTZ
);
CREATE INDEX expeditions_user_idx ON public.expeditions(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expeditions TO authenticated;
GRANT ALL ON public.expeditions TO service_role;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expeditions dono" ON public.expeditions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expeditions admin" ON public.expeditions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.story_chapters (
  slug TEXT PRIMARY KEY,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  unlock_condition TEXT,
  cover_url TEXT
);
GRANT SELECT ON public.story_chapters TO anon, authenticated;
GRANT ALL ON public.story_chapters TO service_role;
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapters leitura pública" ON public.story_chapters FOR SELECT USING (true);

CREATE TABLE public.user_story_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_slug TEXT NOT NULL REFERENCES public.story_chapters(slug),
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chapter_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_story_progress TO authenticated;
GRANT ALL ON public.user_story_progress TO service_role;
ALTER TABLE public.user_story_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress dono" ON public.user_story_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress admin" ON public.user_story_progress FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));