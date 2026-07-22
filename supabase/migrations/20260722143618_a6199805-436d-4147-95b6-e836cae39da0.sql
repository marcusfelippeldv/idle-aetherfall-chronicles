
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE public.item_type AS ENUM ('weapon', 'armor', 'helmet', 'accessory', 'material', 'consumable');
CREATE TYPE public.item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE public.expedition_status AS ENUM ('running', 'ready', 'claimed', 'cancelled');
CREATE TYPE public.currency_type AS ENUM ('gold', 'premium');
CREATE TYPE public.transaction_kind AS ENUM ('credit', 'debit');
CREATE TYPE public.product_kind AS ENUM ('premium_pack', 'season_pass', 'founder_pack', 'subscription');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'delivered', 'refunded', 'cancelled');

-- ============================================================
-- Utility: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- USER_ROLES (separated from profiles)
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  account_status public.account_status NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gold_balance BIGINT NOT NULL DEFAULT 0,
  premium_balance BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wallet"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- CATALOG: CLASSES
-- ============================================================
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  base_hp INT NOT NULL DEFAULT 100,
  base_attack INT NOT NULL DEFAULT 10,
  base_defense INT NOT NULL DEFAULT 10,
  base_speed INT NOT NULL DEFAULT 10,
  icon_url TEXT,
  order_index INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.classes TO anon, authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classes are public" ON public.classes FOR SELECT TO anon, authenticated USING (active);

-- ============================================================
-- CATALOG: REGIONS
-- ============================================================
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  required_level INT NOT NULL DEFAULT 1,
  order_index INT NOT NULL DEFAULT 0,
  background_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regions TO anon, authenticated;
GRANT ALL ON public.regions TO service_role;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Regions are public" ON public.regions FOR SELECT TO anon, authenticated USING (active);

-- ============================================================
-- CATALOG: ENEMIES
-- ============================================================
CREATE TABLE public.enemies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_boss BOOLEAN NOT NULL DEFAULT false,
  level INT NOT NULL DEFAULT 1,
  hp INT NOT NULL DEFAULT 50,
  attack INT NOT NULL DEFAULT 5,
  defense INT NOT NULL DEFAULT 5,
  xp_reward INT NOT NULL DEFAULT 10,
  gold_min INT NOT NULL DEFAULT 1,
  gold_max INT NOT NULL DEFAULT 5,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.enemies TO anon, authenticated;
GRANT ALL ON public.enemies TO service_role;
ALTER TABLE public.enemies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enemies are public" ON public.enemies FOR SELECT TO anon, authenticated USING (active);

-- ============================================================
-- CATALOG: ITEMS
-- ============================================================
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  item_type public.item_type NOT NULL,
  rarity public.item_rarity NOT NULL DEFAULT 'common',
  required_level INT NOT NULL DEFAULT 1,
  attack_bonus INT NOT NULL DEFAULT 0,
  defense_bonus INT NOT NULL DEFAULT 0,
  hp_bonus INT NOT NULL DEFAULT 0,
  speed_bonus INT NOT NULL DEFAULT 0,
  image_url TEXT,
  sell_price INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.items TO anon, authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items are public" ON public.items FOR SELECT TO anon, authenticated USING (active);

-- ============================================================
-- CHARACTERS
-- ============================================================
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT UNIQUE NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id),
  level INT NOT NULL DEFAULT 1,
  current_xp BIGINT NOT NULL DEFAULT 0,
  power INT NOT NULL DEFAULT 0,
  current_hp INT NOT NULL DEFAULT 100,
  max_hp INT NOT NULL DEFAULT 100,
  attack INT NOT NULL DEFAULT 10,
  defense INT NOT NULL DEFAULT 10,
  speed INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.characters TO authenticated;
GRANT ALL ON public.characters TO service_role;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own characters" ON public.characters FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
-- No INSERT/UPDATE/DELETE policies for authenticated: characters change only via server functions (service_role).

CREATE TRIGGER trg_characters_updated_at BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id),
  quantity INT NOT NULL DEFAULT 1,
  equipped BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own inventory" ON public.inventory_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============================================================
-- EXPEDITIONS
-- ============================================================
CREATE TABLE public.expeditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id),
  status public.expedition_status NOT NULL DEFAULT 'running',
  duration_minutes INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_end_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  generated_xp BIGINT NOT NULL DEFAULT 0,
  generated_gold BIGINT NOT NULL DEFAULT 0,
  result_data JSONB
);
GRANT SELECT ON public.expeditions TO authenticated;
GRANT ALL ON public.expeditions TO service_role;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own expeditions" ON public.expeditions FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============================================================
-- CURRENCY TRANSACTIONS
-- ============================================================
CREATE TABLE public.currency_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_type public.currency_type NOT NULL,
  transaction_kind public.transaction_kind NOT NULL,
  amount BIGINT NOT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.currency_transactions TO authenticated;
GRANT ALL ON public.currency_transactions TO service_role;
ALTER TABLE public.currency_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own currency transactions" ON public.currency_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  product_kind public.product_kind NOT NULL,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  premium_amount INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are public" ON public.products FOR SELECT TO anon, authenticated USING (active);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  payment_provider TEXT,
  provider_order_id TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- ADMIN AUDIT LOGS
-- ============================================================
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  previous_data JSONB,
  new_data JSONB,
  justification TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- TRIGGER: on new auth.users -> profile + wallet + default role
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  raw_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  raw_username := regexp_replace(lower(raw_username), '[^a-z0-9_]+', '', 'g');
  IF length(raw_username) < 3 THEN
    raw_username := 'heroi' || substr(NEW.id::text, 1, 6);
  END IF;

  final_username := raw_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := raw_username || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (NEW.id, NEW.email, final_username, COALESCE(NEW.raw_user_meta_data->>'display_name', final_username));

  INSERT INTO public.wallets (user_id) VALUES (NEW.id);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED: classes
-- ============================================================
INSERT INTO public.classes (name, slug, description, base_hp, base_attack, base_defense, base_speed, order_index) VALUES
  ('Guardião', 'guardiao', 'Muralha viva de escudo e aço. Provoca inimigos e absorve o dano da equipe.', 150, 8, 18, 6, 1),
  ('Arcanista', 'arcanista', 'Manipula os fragmentos do cristal ancestral para desencadear magias elementais em área.', 90, 18, 6, 10, 2),
  ('Caçador', 'cacador', 'Rápido e letal. Ataques críticos e venenos que corroem os mais resistentes.', 100, 15, 8, 14, 3),
  ('Clérigo', 'clerigo', 'Canaliza a luz sagrada para curar aliados e romper corrupções sombrias.', 110, 9, 10, 9, 4),
  ('Duelista', 'duelista', 'Esquiva graciosa e lâminas gêmeas que encadeiam combos devastadores.', 105, 14, 9, 15, 5);

-- ============================================================
-- SEED: regions
-- ============================================================
INSERT INTO public.regions (name, slug, description, required_level, order_index) VALUES
  ('Vale de Nyros', 'vale-de-nyros', 'Pradaria dourada onde o primeiro fragmento do cristal caiu. Criaturas de pouca ameaça vagam por aqui.', 1, 1),
  ('Floresta de Aetheril', 'floresta-de-aetheril', 'Árvores gigantescas cantam ao vento arcano. Feras corrompidas espreitam entre raízes brilhantes.', 5, 2),
  ('Catacumbas de Vorhal', 'catacumbas-de-vorhal', 'Ruínas subterrâneas de um reino esquecido. Aqui, o cristal quebrou pela primeira vez.', 12, 3);

-- ============================================================
-- SEED: enemies (5 por região + 1 chefe)
-- ============================================================
WITH r AS (SELECT id, slug FROM public.regions)
INSERT INTO public.enemies (region_id, name, is_boss, level, hp, attack, defense, xp_reward, gold_min, gold_max)
SELECT r.id, e.name, e.is_boss, e.level, e.hp, e.attack, e.defense, e.xp_reward, e.gold_min, e.gold_max
FROM r
JOIN (VALUES
  -- Vale de Nyros
  ('vale-de-nyros', 'Coelho Espinhado', false, 1, 30, 4, 2, 8, 2, 5),
  ('vale-de-nyros', 'Lobisom das Planícies', false, 2, 55, 7, 3, 14, 4, 8),
  ('vale-de-nyros', 'Espectro de Cristal', false, 3, 70, 9, 4, 20, 6, 12),
  ('vale-de-nyros', 'Bandido Errante', false, 3, 80, 10, 5, 22, 7, 14),
  ('vale-de-nyros', 'Ursulo Ancião', false, 4, 110, 12, 7, 30, 10, 20),
  ('vale-de-nyros', 'Rhulgar, o Devorador', true, 5, 320, 22, 14, 120, 60, 120),
  -- Floresta de Aetheril
  ('floresta-de-aetheril', 'Trepadeira Faminta', false, 5, 140, 14, 8, 40, 12, 22),
  ('floresta-de-aetheril', 'Fada Corrompida', false, 6, 160, 18, 6, 48, 15, 26),
  ('floresta-de-aetheril', 'Cervo de Éter', false, 7, 190, 20, 10, 55, 18, 30),
  ('floresta-de-aetheril', 'Aranha Prismática', false, 8, 210, 24, 12, 65, 20, 34),
  ('floresta-de-aetheril', 'Druida Desviado', false, 9, 260, 28, 14, 80, 25, 42),
  ('floresta-de-aetheril', 'Selvana, Rainha das Raízes', true, 12, 900, 46, 26, 340, 180, 320),
  -- Catacumbas de Vorhal
  ('catacumbas-de-vorhal', 'Esqueleto Guardião', false, 12, 380, 34, 20, 130, 40, 70),
  ('catacumbas-de-vorhal', 'Servo Cristalino', false, 13, 420, 38, 22, 150, 46, 80),
  ('catacumbas-de-vorhal', 'Cavaleiro Caído', false, 14, 500, 42, 26, 175, 55, 92),
  ('catacumbas-de-vorhal', 'Necroaranha', false, 15, 560, 48, 28, 200, 65, 105),
  ('catacumbas-de-vorhal', 'Espectro do Rei', false, 16, 640, 54, 32, 230, 78, 125),
  ('catacumbas-de-vorhal', 'Vorhal, o Trono Vazio', true, 20, 2400, 92, 58, 900, 480, 820)
) AS e(slug, name, is_boss, level, hp, attack, defense, xp_reward, gold_min, gold_max)
  ON r.slug = e.slug;

-- ============================================================
-- SEED: items (20)
-- ============================================================
INSERT INTO public.items (name, slug, description, item_type, rarity, required_level, attack_bonus, defense_bonus, hp_bonus, speed_bonus, sell_price) VALUES
  ('Espada de Ferro', 'espada-de-ferro', 'Lâmina simples, mas confiável.', 'weapon', 'common', 1, 5, 0, 0, 0, 10),
  ('Adaga Silenciosa', 'adaga-silenciosa', 'Rápida e certeira.', 'weapon', 'common', 1, 4, 0, 0, 2, 10),
  ('Cajado de Aprendiz', 'cajado-de-aprendiz', 'Guarda um leve pulso arcano.', 'weapon', 'common', 1, 6, 0, 0, 0, 12),
  ('Elmo Enferrujado', 'elmo-enferrujado', 'Melhor que nada.', 'helmet', 'common', 1, 0, 3, 5, 0, 8),
  ('Peitoral de Couro', 'peitoral-de-couro', 'Leve e prático.', 'armor', 'common', 1, 0, 4, 8, 0, 10),
  ('Anel do Vento', 'anel-do-vento', 'Sussurra pressa.', 'accessory', 'uncommon', 3, 0, 0, 0, 3, 25),
  ('Machado do Guardião', 'machado-do-guardiao', 'Feito para segurar linhas.', 'weapon', 'uncommon', 5, 10, 2, 0, 0, 40),
  ('Manto Rúnico', 'manto-runico', 'Bordado com runas de proteção.', 'armor', 'uncommon', 5, 0, 8, 15, 1, 45),
  ('Escudo Solar', 'escudo-solar', 'Brilha ao amanhecer.', 'accessory', 'uncommon', 6, 0, 6, 10, 0, 50),
  ('Botas Élficas', 'botas-elficas', 'Passos silenciosos como folhas.', 'armor', 'rare', 8, 0, 5, 5, 6, 80),
  ('Cetro de Aetheril', 'cetro-de-aetheril', 'Canaliza o coração da floresta.', 'weapon', 'rare', 10, 20, 0, 0, 3, 120),
  ('Elmo do Cavaleiro Caído', 'elmo-do-cavaleiro-caido', 'Ainda ecoa juramentos antigos.', 'helmet', 'rare', 12, 0, 10, 20, 0, 140),
  ('Amuleto Cristalino', 'amuleto-cristalino', 'Pulsa com a energia do cristal.', 'accessory', 'rare', 12, 4, 4, 15, 2, 160),
  ('Espadas Gêmeas de Vorhal', 'espadas-gemeas-de-vorhal', 'Duas lâminas, um só destino.', 'weapon', 'epic', 15, 32, 0, 0, 8, 260),
  ('Armadura do Trono Vazio', 'armadura-do-trono-vazio', 'Frio como o silêncio das catacumbas.', 'armor', 'epic', 15, 0, 24, 40, 0, 300),
  ('Coroa da Rainha das Raízes', 'coroa-da-rainha-das-raizes', 'Ainda germina sob a lua.', 'helmet', 'epic', 15, 6, 12, 25, 0, 320),
  ('Cristal Bruto', 'cristal-bruto', 'Fragmento do que já foi um todo.', 'material', 'uncommon', 1, 0, 0, 0, 0, 15),
  ('Poção Menor de Cura', 'pocao-menor-de-cura', 'Restaura um pouco de vitalidade.', 'consumable', 'common', 1, 0, 0, 0, 0, 5),
  ('Runa do Alvorecer', 'runa-do-alvorecer', 'Um item lendário para tempos incertos.', 'accessory', 'legendary', 20, 15, 15, 50, 10, 900),
  ('Selo do Portador de Luz', 'selo-do-portador-de-luz', 'Concedido apenas aos verdadeiros heróis.', 'accessory', 'legendary', 25, 20, 20, 60, 12, 1200);

-- ============================================================
-- SEED: products
-- ============================================================
INSERT INTO public.products (name, slug, description, product_kind, price_cents, premium_amount, order_index) VALUES
  ('500 Cristais', 'pack-500-cristais', 'Pacote inicial de cristais para acelerar sua jornada.', 'premium_pack', 1990, 500, 1),
  ('1.200 Cristais', 'pack-1200-cristais', 'Melhor valor por cristal. Bônus de 20%.', 'premium_pack', 3990, 1200, 2),
  ('Pacote de Fundador', 'pacote-fundador', 'Nome no mural, título exclusivo, skin, moeda e acesso antecipado.', 'founder_pack', 9990, 2000, 3),
  ('Clube Mensal', 'clube-mensal', 'Fila extra de expedição, mais espaço no inventário, aparência exclusiva e bônus diários.', 'subscription', 2490, 0, 4),
  ('Passe da Temporada', 'passe-temporada', '45 dias de recompensas: aparências, títulos, molduras, efeitos e moeda.', 'season_pass', 4990, 500, 5);
