
-- Drop tabelas antigas
DROP TABLE IF EXISTS public.raid_rewards CASCADE;
DROP TABLE IF EXISTS public.raid_contributions CASCADE;
DROP TABLE IF EXISTS public.raids CASCADE;
DROP TABLE IF EXISTS public.raid_templates CASCADE;
DROP TABLE IF EXISTS public.season_rewards CASCADE;
DROP TABLE IF EXISTS public.season_progress CASCADE;
DROP TABLE IF EXISTS public.seasons CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.achievement_templates CASCADE;
DROP TABLE IF EXISTS public.daily_quests CASCADE;
DROP TABLE IF EXISTS public.daily_quest_templates CASCADE;
DROP TABLE IF EXISTS public.currency_transactions CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.guild_invites CASCADE;
DROP TABLE IF EXISTS public.guild_members CASCADE;
DROP TABLE IF EXISTS public.guilds CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.expeditions CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TABLE IF EXISTS public.enemies CASCADE;
DROP TABLE IF EXISTS public.regions CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP FUNCTION IF EXISTS public.is_guild_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.my_guild_id(uuid) CASCADE;

-- Drop enums antigos (podem já existir com valores incompatíveis)
DROP TYPE IF EXISTS public.archetype_role CASCADE;
DROP TYPE IF EXISTS public.item_rarity CASCADE;
DROP TYPE IF EXISTS public.item_slot CASCADE;
DROP TYPE IF EXISTS public.incursion_mode CASCADE;
DROP TYPE IF EXISTS public.incursion_status CASCADE;

UPDATE public.wallets SET gold_balance = 0, premium_balance = 0;

CREATE TYPE public.archetype_role AS ENUM ('tank_melee','tank_agile','ranger','mage_dps','mage_support');
CREATE TYPE public.item_rarity AS ENUM ('comum','incomum','raro','epico','lendario','mitico');
CREATE TYPE public.item_slot AS ENUM ('arma','elmo','peito','pernas','pes','amuleto','anel','ofmao','consumivel','material');
CREATE TYPE public.incursion_mode AS ENUM ('ativa','vigilia','treino');
CREATE TYPE public.incursion_status AS ENUM ('em_andamento','concluida','falhou','cancelada');

CREATE TABLE public.archetypes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  role public.archetype_role NOT NULL,
  description text NOT NULL,
  hp_per_level int NOT NULL,
  mana_per_level int NOT NULL,
  starting_weapon text NOT NULL,
  uses_mana_potion boolean NOT NULL DEFAULT false,
  base_hp int NOT NULL,
  base_mana int NOT NULL,
  base_attack int NOT NULL,
  base_defense int NOT NULL,
  base_speed int NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.archetypes TO anon, authenticated;
GRANT ALL ON public.archetypes TO service_role;
ALTER TABLE public.archetypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arquetipos publicos" ON public.archetypes FOR SELECT USING (true);

CREATE TABLE public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype_id uuid NOT NULL REFERENCES public.archetypes(id),
  name text NOT NULL,
  level int NOT NULL DEFAULT 8,
  current_xp bigint NOT NULL DEFAULT 0,
  current_hp int NOT NULL,
  max_hp int NOT NULL,
  current_mana int NOT NULL,
  max_mana int NOT NULL,
  attack int NOT NULL,
  defense int NOT NULL,
  speed int NOT NULL,
  skill_melee int NOT NULL DEFAULT 10,
  skill_ranged int NOT NULL DEFAULT 10,
  skill_magic int NOT NULL DEFAULT 10,
  skill_shield int NOT NULL DEFAULT 10,
  skill_fist int NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, archetype_id),
  UNIQUE (user_id, name)
);
CREATE INDEX idx_characters_user ON public.characters(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.characters TO authenticated;
GRANT ALL ON public.characters TO service_role;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meus personagens - ler" ON public.characters FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "meus personagens - criar" ON public.characters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meus personagens - atualizar" ON public.characters FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meus personagens - remover" ON public.characters FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_characters_updated BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.cohorts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  slot2_character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  slot3_character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  slots_unlocked int NOT NULL DEFAULT 1 CHECK (slots_unlocked BETWEEN 1 AND 3),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.cohorts TO authenticated;
GRANT ALL ON public.cohorts TO service_role;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "minha coorte - ler" ON public.cohorts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "minha coorte - upsert" ON public.cohorts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "minha coorte - atualizar" ON public.cohorts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_cohorts_updated BEFORE UPDATE ON public.cohorts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.enemies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  is_boss boolean NOT NULL DEFAULT false,
  level int NOT NULL DEFAULT 1,
  hp int NOT NULL,
  attack int NOT NULL,
  defense int NOT NULL,
  xp_reward int NOT NULL DEFAULT 0,
  gold_min int NOT NULL DEFAULT 0,
  gold_max int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.enemies TO anon, authenticated;
GRANT ALL ON public.enemies TO service_role;
ALTER TABLE public.enemies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inimigos publicos" ON public.enemies FOR SELECT USING (true);

CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  required_level int NOT NULL DEFAULT 1,
  difficulty_stars int NOT NULL DEFAULT 1,
  xp_multiplier numeric(5,2) NOT NULL DEFAULT 1.0,
  loot_multiplier numeric(5,2) NOT NULL DEFAULT 1.0,
  duration_minutes int NOT NULL DEFAULT 5,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.zones TO anon, authenticated;
GRANT ALL ON public.zones TO service_role;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zonas publicas" ON public.zones FOR SELECT USING (true);

CREATE TABLE public.zone_waves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  wave_number int NOT NULL CHECK (wave_number BETWEEN 1 AND 10),
  is_boss boolean NOT NULL DEFAULT false,
  enemy_id uuid NOT NULL REFERENCES public.enemies(id),
  enemy_count int NOT NULL DEFAULT 1,
  UNIQUE(zone_id, wave_number)
);
GRANT SELECT ON public.zone_waves TO anon, authenticated;
GRANT ALL ON public.zone_waves TO service_role;
ALTER TABLE public.zone_waves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ondas publicas" ON public.zone_waves FOR SELECT USING (true);

CREATE TABLE public.incursions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  mode public.incursion_mode NOT NULL DEFAULT 'ativa',
  status public.incursion_status NOT NULL DEFAULT 'em_andamento',
  loop_enabled boolean NOT NULL DEFAULT false,
  current_wave int NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  expected_end_at timestamptz NOT NULL,
  ended_at timestamptz,
  rng_seed bigint NOT NULL,
  offline_minutes_used int NOT NULL DEFAULT 0,
  rewards_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incursions_user_active ON public.incursions(user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incursions TO authenticated;
GRANT ALL ON public.incursions TO service_role;
ALTER TABLE public.incursions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "minhas incursoes" ON public.incursions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_incursions_updated BEFORE UPDATE ON public.incursions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.offline_reserves (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hunt_minutes_left int NOT NULL DEFAULT 720,
  train_minutes_left int NOT NULL DEFAULT 720,
  last_tick_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.offline_reserves TO authenticated;
GRANT ALL ON public.offline_reserves TO service_role;
ALTER TABLE public.offline_reserves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "minha reserva" ON public.offline_reserves FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_offline_updated BEFORE UPDATE ON public.offline_reserves
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  slot public.item_slot NOT NULL,
  tier int NOT NULL DEFAULT 1,
  rarity public.item_rarity NOT NULL DEFAULT 'comum',
  attack_bonus int NOT NULL DEFAULT 0,
  defense_bonus int NOT NULL DEFAULT 0,
  hp_bonus int NOT NULL DEFAULT 0,
  mana_bonus int NOT NULL DEFAULT 0,
  speed_bonus int NOT NULL DEFAULT 0,
  gold_value int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.items TO anon, authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens publicos" ON public.items FOR SELECT USING (true);

CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id),
  quantity int NOT NULL DEFAULT 1,
  equipped_on_character uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inventory_user ON public.inventory(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meu inventario" ON public.inventory FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.archetypes (slug, name, role, description, hp_per_level, mana_per_level, starting_weapon, uses_mana_potion, base_hp, base_mana, base_attack, base_defense, base_speed, sort_order) VALUES
('guardiao','Guardião','tank_melee','Muralha de aço e juramento. Absorve dano e protege a coorte com investidas curtas.',15,5,'Machado do Juramento',false,180,40,22,26,10,1),
('arqueiro-astral','Arqueiro Astral','ranger','Caçador do véu estelar. Dispara flechas prateadas mantendo distância dos inimigos.',10,15,'Arco Sidéreo',true,120,90,26,16,18,2),
('arcanista','Arcanista','mage_dps','Domador das correntes de éter. Devasta ondas inteiras com magia elemental de área.',5,30,'Bastão do Vórtice',true,90,160,30,10,14,3),
('vidente','Vidente','mage_support','Sussurra profecias que curam e amaldiçoam. Sustenta a coorte em incursões longas.',5,30,'Cetro da Aurora',true,95,160,24,12,15,4),
('punho-da-aurora','Punho da Aurora','tank_agile','Monge nômade da luz solar. Tanque ágil que golpeia com técnica ancestral.',13,8,'Bastão de Luz',false,160,60,24,22,20,5);

INSERT INTO public.enemies (slug, name, is_boss, level, hp, attack, defense, xp_reward, gold_min, gold_max) VALUES
('lobo-cinzento','Lobo Cinzento',false,3,45,10,4,12,3,7),
('bandido-esfarrapado','Bandido Esfarrapado',false,4,60,12,5,18,5,10),
('ratazana-do-veu','Ratazana do Véu',false,2,30,8,2,8,2,5),
('goblin-batedor','Goblin Batedor',false,5,70,14,6,22,6,12),
('goblin-xama','Goblin Xamã',true,7,180,20,10,120,30,60),
('esqueleto-corrompido','Esqueleto Corrompido',false,7,90,16,8,28,8,16),
('espectro-menor','Espectro Menor',false,8,110,18,10,34,10,20),
('cavaleiro-fantasma','Cavaleiro Fantasma',true,10,260,26,16,240,60,120),
('aranha-de-obsidiana','Aranha de Obsidiana',false,10,130,22,12,42,12,24),
('lobisomem-sombrio','Lobisomem Sombrio',false,12,170,26,14,54,16,32),
('bruxa-da-cinza','Bruxa da Cinza',false,13,190,30,14,62,18,36),
('drake-jovem','Drake Jovem',true,15,420,34,22,520,120,240);

INSERT INTO public.zones (slug, name, description, required_level, difficulty_stars, xp_multiplier, loot_multiplier, duration_minutes, sort_order) VALUES
('vilarejo-esquecido','Vilarejo Esquecido','Ruínas na periferia do Bastião. Perfeito para os primeiros passos.',1,1,1.0,1.0,3,1),
('ruinas-de-veyr','Ruínas de Veyr','Templos abandonados invadidos por mortos-vivos.',5,2,1.15,1.10,5,2),
('floresta-sombria','Floresta Sombria','Mata densa onde criaturas caçam à luz do luar.',10,3,1.30,1.25,7,3);

DO $$
DECLARE
  z_vil uuid; z_ruin uuid; z_flor uuid;
  e_lobo uuid; e_bandido uuid; e_rata uuid; e_gob uuid; e_gob_boss uuid;
  e_esq uuid; e_espec uuid; e_cav_boss uuid;
  e_aran uuid; e_lobisomem uuid; e_bruxa uuid; e_drake_boss uuid;
BEGIN
  SELECT id INTO z_vil FROM public.zones WHERE slug='vilarejo-esquecido';
  SELECT id INTO z_ruin FROM public.zones WHERE slug='ruinas-de-veyr';
  SELECT id INTO z_flor FROM public.zones WHERE slug='floresta-sombria';
  SELECT id INTO e_lobo FROM public.enemies WHERE slug='lobo-cinzento';
  SELECT id INTO e_bandido FROM public.enemies WHERE slug='bandido-esfarrapado';
  SELECT id INTO e_rata FROM public.enemies WHERE slug='ratazana-do-veu';
  SELECT id INTO e_gob FROM public.enemies WHERE slug='goblin-batedor';
  SELECT id INTO e_gob_boss FROM public.enemies WHERE slug='goblin-xama';
  SELECT id INTO e_esq FROM public.enemies WHERE slug='esqueleto-corrompido';
  SELECT id INTO e_espec FROM public.enemies WHERE slug='espectro-menor';
  SELECT id INTO e_cav_boss FROM public.enemies WHERE slug='cavaleiro-fantasma';
  SELECT id INTO e_aran FROM public.enemies WHERE slug='aranha-de-obsidiana';
  SELECT id INTO e_lobisomem FROM public.enemies WHERE slug='lobisomem-sombrio';
  SELECT id INTO e_bruxa FROM public.enemies WHERE slug='bruxa-da-cinza';
  SELECT id INTO e_drake_boss FROM public.enemies WHERE slug='drake-jovem';

  INSERT INTO public.zone_waves (zone_id, wave_number, is_boss, enemy_id, enemy_count) VALUES
  (z_vil,1,false,e_rata,3),(z_vil,2,false,e_rata,4),(z_vil,3,false,e_lobo,3),(z_vil,4,false,e_lobo,4),
  (z_vil,5,false,e_bandido,3),(z_vil,6,false,e_bandido,4),(z_vil,7,false,e_gob,3),(z_vil,8,false,e_gob,4),
  (z_vil,9,false,e_gob,5),(z_vil,10,true,e_gob_boss,1);

  INSERT INTO public.zone_waves (zone_id, wave_number, is_boss, enemy_id, enemy_count) VALUES
  (z_ruin,1,false,e_esq,3),(z_ruin,2,false,e_esq,4),(z_ruin,3,false,e_espec,3),(z_ruin,4,false,e_espec,4),
  (z_ruin,5,false,e_esq,5),(z_ruin,6,false,e_espec,4),(z_ruin,7,false,e_aran,3),(z_ruin,8,false,e_aran,4),
  (z_ruin,9,false,e_espec,5),(z_ruin,10,true,e_cav_boss,1);

  INSERT INTO public.zone_waves (zone_id, wave_number, is_boss, enemy_id, enemy_count) VALUES
  (z_flor,1,false,e_aran,3),(z_flor,2,false,e_aran,4),(z_flor,3,false,e_lobisomem,3),(z_flor,4,false,e_lobisomem,4),
  (z_flor,5,false,e_bruxa,2),(z_flor,6,false,e_bruxa,3),(z_flor,7,false,e_lobisomem,4),(z_flor,8,false,e_bruxa,3),
  (z_flor,9,false,e_lobisomem,5),(z_flor,10,true,e_drake_boss,1);
END $$;

INSERT INTO public.items (slug, name, description, slot, tier, rarity, attack_bonus, defense_bonus, hp_bonus, mana_bonus, gold_value) VALUES
('pocao-cura-menor','Poção de Cura Menor','Restaura 60 de HP.','consumivel',1,'comum',0,0,60,0,20),
('pocao-mana-menor','Poção de Éter Menor','Restaura 80 de mana.','consumivel',1,'comum',0,0,0,80,20),
('elmo-couro','Elmo de Couro','Proteção básica para a cabeça.','elmo',1,'comum',0,3,15,0,50),
('peitoral-couro','Peitoral de Couro','Peça de couro rígido.','peito',1,'comum',0,5,25,0,75),
('anel-simples','Anel Simples','Um anel de latão modesto.','anel',1,'comum',1,1,0,0,40);

INSERT INTO public.offline_reserves (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
