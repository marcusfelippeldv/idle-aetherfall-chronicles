
-- =========================
-- SEED ITEMS
-- =========================
INSERT INTO public.items (slug, name, description, slot, rarity, tier, class_restriction, hp_bonus, mana_bonus, attack_bonus, defense_bonus, speed_bonus, gold_value, sell_price, sold_in_shop, icon_url) VALUES
-- Weapons per class, tiers by rarity
('arma_guardiao_comum','Malho do Recruta','Martelo pesado forjado no Bastião.','arma','comum',1,ARRAY['guardiao'],10,0,6,3,0,120,40,true,'/__l5e/assets-v1/a2c67294-7502-4634-9f2a-eac76faf18f0/arma-guardiao.png'),
('arma_guardiao_raro','Malho do Valente','Martelo abençoado por juramentos de defesa.','arma','raro',3,ARRAY['guardiao'],30,0,16,10,0,900,300,true,'/__l5e/assets-v1/a2c67294-7502-4634-9f2a-eac76faf18f0/arma-guardiao.png'),
('arma_guardiao_epico','Malho de Éter','Cravejado de cristais que absorvem impacto.','arma','epico',5,ARRAY['guardiao'],60,0,28,20,0,3200,1000,false,'/__l5e/assets-v1/a2c67294-7502-4634-9f2a-eac76faf18f0/arma-guardiao.png'),
('arma_arqueiro_comum','Arco de Cerimônia','Arco de treino do salão da Alvorada.','arma','comum',1,ARRAY['arqueiro'],4,0,9,0,3,120,40,true,'/__l5e/assets-v1/556c4905-0026-4a0d-a806-e5c211a69512/arma-arqueiro.png'),
('arma_arqueiro_raro','Arco Estelar','Corda tecida com fio de nebulosa.','arma','raro',3,ARRAY['arqueiro'],12,0,22,4,6,900,300,true,'/__l5e/assets-v1/556c4905-0026-4a0d-a806-e5c211a69512/arma-arqueiro.png'),
('arma_arqueiro_epico','Arco do Zênite','Dispara flechas de luz solidificada.','arma','epico',5,ARRAY['arqueiro'],24,0,38,6,10,3200,1000,false,'/__l5e/assets-v1/556c4905-0026-4a0d-a806-e5c211a69512/arma-arqueiro.png'),
('arma_arcanista_comum','Cajado Cintilante','Runas simples no topo.','arma','comum',1,ARRAY['arcanista'],4,15,8,0,0,120,40,true,'/__l5e/assets-v1/170d6b30-0c69-4d88-9284-a7b308a90911/arma-arcanista.png'),
('arma_arcanista_raro','Cajado das Marés','Convoca faíscas arcanas ao brandir.','arma','raro',3,ARRAY['arcanista'],10,35,20,2,0,900,300,true,'/__l5e/assets-v1/170d6b30-0c69-4d88-9284-a7b308a90911/arma-arcanista.png'),
('arma_arcanista_epico','Cajado do Éter','Absorve mana do ambiente.','arma','epico',5,ARRAY['arcanista'],20,60,36,4,0,3200,1000,false,'/__l5e/assets-v1/170d6b30-0c69-4d88-9284-a7b308a90911/arma-arcanista.png'),
('arma_vidente_comum','Báculo Sereno','Cristal opaco no topo, aprendiz.','arma','comum',1,ARRAY['vidente'],6,20,5,2,0,120,40,true,'/__l5e/assets-v1/3620476d-030e-49a6-9ccd-3d1991706377/arma-vidente.png'),
('arma_vidente_raro','Báculo da Aurora','Emana luz curativa suave.','arma','raro',3,ARRAY['vidente'],18,40,14,6,0,900,300,true,'/__l5e/assets-v1/3620476d-030e-49a6-9ccd-3d1991706377/arma-vidente.png'),
('arma_vidente_epico','Báculo do Vislumbre','Diz-se ver o futuro dos aliados.','arma','epico',5,ARRAY['vidente'],32,70,24,10,0,3200,1000,false,'/__l5e/assets-v1/3620476d-030e-49a6-9ccd-3d1991706377/arma-vidente.png'),
('arma_punho_comum','Manoplas do Discípulo','Couro reforçado.','arma','comum',1,ARRAY['punho'],6,0,10,0,2,120,40,true,'/__l5e/assets-v1/94440ad7-14f5-44e5-b814-6d9d25ebe652/arma-punho.png'),
('arma_punho_raro','Manoplas do Vento','Ondas de choque a cada golpe.','arma','raro',3,ARRAY['punho'],16,0,24,2,5,900,300,true,'/__l5e/assets-v1/94440ad7-14f5-44e5-b814-6d9d25ebe652/arma-punho.png'),
('arma_punho_epico','Manoplas da Aurora','Punhos brilhando com fé solar.','arma','epico',5,ARRAY['punho'],28,0,40,4,8,3200,1000,false,'/__l5e/assets-v1/94440ad7-14f5-44e5-b814-6d9d25ebe652/arma-punho.png'),
-- Off-hands per class
('ofmao_guardiao_comum','Escudo de Treino','Robusto e simples.','ofmao','comum',1,ARRAY['guardiao'],20,0,0,6,-1,100,30,true,'/__l5e/assets-v1/179918e9-9b89-4b1b-83c7-765554aebc83/off-guardiao.png'),
('ofmao_guardiao_raro','Escudo do Juramento','Símbolo do Bastião incrustado.','ofmao','raro',3,ARRAY['guardiao'],40,0,2,14,-1,800,260,true,'/__l5e/assets-v1/179918e9-9b89-4b1b-83c7-765554aebc83/off-guardiao.png'),
('ofmao_arqueiro_comum','Aljava Simples','Comporta muitas flechas.','ofmao','comum',1,ARRAY['arqueiro'],4,0,3,0,2,100,30,true,'/__l5e/assets-v1/86f9f0ba-b1c5-4619-8bf4-d01313bf919c/off-arqueiro.png'),
('ofmao_arqueiro_raro','Aljava Estelar','Regenera flechas encantadas.','ofmao','raro',3,ARRAY['arqueiro'],10,0,8,2,5,800,260,true,'/__l5e/assets-v1/86f9f0ba-b1c5-4619-8bf4-d01313bf919c/off-arqueiro.png'),
('ofmao_arcanista_comum','Grimório Simples','Feitiços aprendizes.','ofmao','comum',1,ARRAY['arcanista'],3,20,4,0,0,100,30,true,'/__l5e/assets-v1/e002e1a6-d2d2-4fa4-a7fe-56709813d5d0/off-arcanista.png'),
('ofmao_arcanista_raro','Grimório do Cosmos','Páginas se abrem sozinhas.','ofmao','raro',3,ARRAY['arcanista'],8,45,10,2,0,800,260,true,'/__l5e/assets-v1/e002e1a6-d2d2-4fa4-a7fe-56709813d5d0/off-arcanista.png'),
('ofmao_vidente_comum','Sino Sereno','Repele espíritos menores.','ofmao','comum',1,ARRAY['vidente'],6,15,2,2,0,100,30,true,'/__l5e/assets-v1/b3d961cf-2713-4a97-8f45-ccf068acb7e7/off-vidente.png'),
('ofmao_vidente_raro','Sino da Aurora','Cura suave em cada tanger.','ofmao','raro',3,ARRAY['vidente'],14,35,4,6,0,800,260,true,'/__l5e/assets-v1/b3d961cf-2713-4a97-8f45-ccf068acb7e7/off-vidente.png'),
('ofmao_punho_comum','Faixa do Discípulo','Concentra respiração.','ofmao','comum',1,ARRAY['punho'],6,5,3,0,2,100,30,true,'/__l5e/assets-v1/12b94c78-ffca-4397-83f1-5da3a72a896d/off-punho.png'),
('ofmao_punho_raro','Faixa do Vento','Focaliza o chi.','ofmao','raro',3,ARRAY['punho'],14,10,8,2,5,800,260,true,'/__l5e/assets-v1/12b94c78-ffca-4397-83f1-5da3a72a896d/off-punho.png'),
-- Generic armor pieces (elmo, peito, pernas, pes)
('elmo_comum','Elmo de Ferro','Proteção básica.','elmo','comum',1,ARRAY[]::text[],14,0,0,4,0,90,25,true,'/__l5e/assets-v1/258cbe8e-ca3c-44f6-b5ba-6905529981ac/elmo.png'),
('elmo_raro','Elmo de Aço Etéreo','Resiste a ilusões.','elmo','raro',3,ARRAY[]::text[],28,4,1,10,0,700,220,true,'/__l5e/assets-v1/258cbe8e-ca3c-44f6-b5ba-6905529981ac/elmo.png'),
('elmo_epico','Elmo do Vigia','Amplia a visão em batalha.','elmo','epico',5,ARRAY[]::text[],48,8,2,18,1,2400,800,false,'/__l5e/assets-v1/258cbe8e-ca3c-44f6-b5ba-6905529981ac/elmo.png'),
('peito_comum','Peitoral de Placas','Cobre o torso.','peito','comum',1,ARRAY[]::text[],25,0,0,6,-1,110,35,true,'/__l5e/assets-v1/f8fd41f4-5fd6-4379-a27f-c1cc9cc56066/peito.png'),
('peito_raro','Peitoral Etéreo','Placas cravejadas com éter.','peito','raro',3,ARRAY[]::text[],50,4,1,14,0,900,280,true,'/__l5e/assets-v1/f8fd41f4-5fd6-4379-a27f-c1cc9cc56066/peito.png'),
('peito_epico','Peitoral do Guardião Real','Absorve golpes fatais.','peito','epico',5,ARRAY[]::text[],90,8,2,24,0,3200,1000,false,'/__l5e/assets-v1/f8fd41f4-5fd6-4379-a27f-c1cc9cc56066/peito.png'),
('pernas_comum','Grevas de Ferro','Metal pesado.','pernas','comum',1,ARRAY[]::text[],12,0,0,4,-1,80,25,true,'/__l5e/assets-v1/3fe3f22b-f9b6-48d0-9519-4ff54378f179/pernas.png'),
('pernas_raro','Grevas Sagradas','Rezas gravadas nas placas.','pernas','raro',3,ARRAY[]::text[],26,2,1,10,0,650,200,true,'/__l5e/assets-v1/3fe3f22b-f9b6-48d0-9519-4ff54378f179/pernas.png'),
('pes_comum','Botas de Couro','Silenciosas.','pes','comum',1,ARRAY[]::text[],6,0,0,2,3,70,20,true,'/__l5e/assets-v1/c3a2a729-3b27-4909-b50c-73403e44e251/pes.png'),
('pes_raro','Botas do Viajante','Nunca cansam.','pes','raro',3,ARRAY[]::text[],14,2,1,4,7,600,180,true,'/__l5e/assets-v1/c3a2a729-3b27-4909-b50c-73403e44e251/pes.png'),
('pes_epico','Botas do Zênite','Passos rápidos como luz.','pes','epico',5,ARRAY[]::text[],24,4,2,8,12,2200,700,false,'/__l5e/assets-v1/c3a2a729-3b27-4909-b50c-73403e44e251/pes.png'),
('amuleto_comum','Amuleto de Cristal','Foca energia arcana.','amuleto','comum',1,ARRAY[]::text[],5,10,2,1,1,120,40,true,'/__l5e/assets-v1/deac44d2-35b9-4de1-942d-12af9801c5a2/amuleto.png'),
('amuleto_raro','Amuleto do Vazio','Vibra em batalha.','amuleto','raro',3,ARRAY[]::text[],12,25,5,3,2,900,300,true,'/__l5e/assets-v1/deac44d2-35b9-4de1-942d-12af9801c5a2/amuleto.png'),
('amuleto_lendario','Amuleto do Aeter','Chama do próprio Aetherfall.','amuleto','lendario',6,ARRAY[]::text[],40,80,12,8,4,8000,2500,false,'/__l5e/assets-v1/deac44d2-35b9-4de1-942d-12af9801c5a2/amuleto.png'),
('anel_comum','Anel de Prata','Elegante e leve.','anel','comum',1,ARRAY[]::text[],3,5,2,1,1,100,30,true,'/__l5e/assets-v1/4c5c688a-e694-4699-a4c2-e3ec7ab0e8fc/anel.png'),
('anel_raro','Anel de Éter','Cristal preso ao ouro.','anel','raro',3,ARRAY[]::text[],10,15,5,3,2,800,260,true,'/__l5e/assets-v1/4c5c688a-e694-4699-a4c2-e3ec7ab0e8fc/anel.png'),
('anel_lendario','Anel do Aeter','Sussurra segredos de reinos.','anel','lendario',6,ARRAY[]::text[],28,50,10,6,4,7500,2400,false,'/__l5e/assets-v1/4c5c688a-e694-4699-a4c2-e3ec7ab0e8fc/anel.png'),
-- Consumables
('pocao_vida_p','Poção de Vida','Restaura HP em combate futuro.','consumivel','comum',1,ARRAY[]::text[],0,0,0,0,0,50,15,true,'/__l5e/assets-v1/789fa0ab-b362-486e-ab1f-3ece406c5625/pocao-vida.png'),
('pocao_mana_p','Poção de Mana','Restaura mana.','consumivel','comum',1,ARRAY[]::text[],0,0,0,0,0,60,20,true,'/__l5e/assets-v1/c34b851e-613b-4d27-ac36-c2b26e297892/pocao-mana.png'),
-- Materials
('cristal_eter','Cristal de Éter','Reagente arcano puro.','material','incomum',2,ARRAY[]::text[],0,0,0,0,0,80,30,false,'/__l5e/assets-v1/c38ffa3e-b3ca-472a-9053-fa2965623d2a/cristal.png'),
('fragmento_eter','Fragmento de Éter','Restos cintilantes do Aetherfall.','material','raro',3,ARRAY[]::text[],0,0,0,0,0,250,90,false,'/__l5e/assets-v1/8db7fa74-4454-497c-a2f2-7e6dfba038fe/fragmento-eter.png')
ON CONFLICT (slug) DO NOTHING;

-- =========================
-- RETENTION: daily missions & achievements
-- =========================
CREATE TABLE public.daily_missions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  target INTEGER NOT NULL,
  metric TEXT NOT NULL,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.daily_missions TO anon, authenticated;
GRANT ALL ON public.daily_missions TO service_role;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_missions leitura pública" ON public.daily_missions FOR SELECT USING (true);

CREATE TABLE public.user_daily_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_slug TEXT NOT NULL REFERENCES public.daily_missions(slug),
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  progress INTEGER NOT NULL DEFAULT 0,
  claimed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_slug, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_daily_progress TO authenticated;
GRANT ALL ON public.user_daily_progress TO service_role;
ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "udp dono" ON public.user_daily_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.achievements (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  metric TEXT NOT NULL,
  target INTEGER NOT NULL,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_premium INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements leitura pública" ON public.achievements FOR SELECT USING (true);

CREATE TABLE public.user_achievements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL REFERENCES public.achievements(slug),
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ua dono" ON public.user_achievements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- SOCIAL: guilds, chat, world bosses
-- =========================
CREATE TABLE public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.guilds TO anon, authenticated;
GRANT INSERT, UPDATE ON public.guilds TO authenticated;
GRANT ALL ON public.guilds TO service_role;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guilds leitura pública" ON public.guilds FOR SELECT USING (true);
CREATE POLICY "guilds criar" ON public.guilds FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "guilds líder edita" ON public.guilds FOR UPDATE TO authenticated USING (auth.uid() = leader_id) WITH CHECK (auth.uid() = leader_id);

CREATE TABLE public.guild_members (
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id),
  UNIQUE (user_id)
);
GRANT SELECT ON public.guild_members TO anon, authenticated;
GRANT INSERT, DELETE ON public.guild_members TO authenticated;
GRANT ALL ON public.guild_members TO service_role;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gm leitura pública" ON public.guild_members FOR SELECT USING (true);
CREATE POLICY "gm entrar" ON public.guild_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gm sair" ON public.guild_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'global',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat leitura autenticada" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "chat autor escreve" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX chat_messages_channel_created_idx ON public.chat_messages(channel, created_at DESC);

CREATE TABLE public.world_bosses (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  element element NOT NULL DEFAULT 'neutro',
  max_hp BIGINT NOT NULL,
  current_hp BIGINT NOT NULL,
  reward_gold INTEGER NOT NULL DEFAULT 500,
  reward_xp INTEGER NOT NULL DEFAULT 200,
  reset_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.world_bosses TO anon, authenticated;
GRANT UPDATE ON public.world_bosses TO authenticated;
GRANT ALL ON public.world_bosses TO service_role;
ALTER TABLE public.world_bosses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb leitura pública" ON public.world_bosses FOR SELECT USING (true);
CREATE POLICY "wb bater" ON public.world_bosses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.world_boss_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_slug TEXT NOT NULL REFERENCES public.world_bosses(slug) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  damage INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.world_boss_hits TO authenticated;
GRANT ALL ON public.world_boss_hits TO service_role;
ALTER TABLE public.world_boss_hits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wbh leitura autenticada" ON public.world_boss_hits FOR SELECT TO authenticated USING (true);
CREATE POLICY "wbh autor escreve" ON public.world_boss_hits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX wbh_boss_idx ON public.world_boss_hits(boss_slug, created_at DESC);

-- =========================
-- SEEDS: missions, achievements, world bosses
-- =========================
INSERT INTO public.daily_missions (slug, name, description, target, metric, reward_gold, reward_xp, sort_order) VALUES
('win_3','Vitórias diárias','Vença 3 combates hoje.',3,'wins',150,80,1),
('win_boss_1','Chefe do dia','Derrote 1 chefe regional.',1,'boss_wins',300,150,2),
('spend_stage','Explorador','Complete 5 estágios diferentes.',5,'stages',200,120,3),
('buy_item','Mercador','Compre 1 item na loja.',1,'shop_buys',80,40,4),
('boss_hit','Guerra mundial','Cause 1000 de dano num chefe mundial.',1000,'boss_damage',400,200,5),
('chat','Camarada','Envie 3 mensagens no chat global.',3,'chat_messages',60,30,6);

INSERT INTO public.achievements (slug, name, description, metric, target, reward_gold, reward_premium, sort_order) VALUES
('first_hero','Primeira Fagulha','Crie seu primeiro herói.','heroes_created',1,100,5,1),
('party_full','Coorte Completa','Tenha 4 heróis na equipe.','party_full',1,200,10,2),
('win_10','Cavaleiro do Amanhã','Vença 10 combates.','wins',10,500,15,3),
('win_50','Herói Emergente','Vença 50 combates.','wins',50,2500,30,4),
('boss_5','Caçador de Chefes','Derrote 5 chefes regionais.','boss_wins',5,1500,25,5),
('rich_10k','Cofres Abertos','Acumule 10 000 de ouro.','gold_ever',10000,1000,20,6),
('collector','Colecionador','Possua 10 itens distintos.','item_count',10,800,15,7),
('wb_slayer','Verdugo Mundial','Contribua com 50 000 de dano em chefes mundiais.','boss_damage',50000,5000,100,8);

INSERT INTO public.world_bosses (slug, name, description, element, max_hp, current_hp, reward_gold, reward_xp) VALUES
('leviata_de_eter','Leviatã de Éter','Uma serpente cósmica que despertou nas ruínas do Aetherfall.','arcano',500000,500000,1200,500),
('titan_de_pedra','Titã de Pedra','Colosso antigo que caminha entre montanhas.','terra',300000,300000,900,400),
('fenix_solar','Fênix Solar','Renasce a cada eclipse com asas de chama pura.','fogo',400000,400000,1000,450);
