
-- Element matchups (simple wheel: fogo>gelo, gelo>raio, raio>terra, terra>fogo; luz<>sombra; arcano neutral; neutro neutral)
INSERT INTO public.element_matchups (attacker, defender, multiplier) VALUES
('fogo','gelo',1.5),('gelo','raio',1.5),('raio','terra',1.5),('terra','fogo',1.5),
('gelo','fogo',0.75),('raio','gelo',0.75),('terra','raio',0.75),('fogo','terra',0.75),
('luz','sombra',1.5),('sombra','luz',1.5)
ON CONFLICT DO NOTHING;

-- Abilities (skill_1 and skill_2 per class)
INSERT INTO public.abilities (slug, name, class_slug, kind, element, mana_cost, power, target, description) VALUES
('guardiao_s1','Escudo Radiante','guardiao','skill','luz',12,1.2,'lowest_hp_ally','Protege o aliado mais ferido, reduzindo dano recebido.'),
('guardiao_s2','Golpe do Baluarte','guardiao','skill','neutro',10,1.4,'highest_atk_enemy','Ataque pesado com escudo, gera provocação.'),
('espadachim_s1','Corte Ascendente','espadachim','skill','neutro',8,1.6,'lowest_hp_enemy','Corte ágil que ignora parte da defesa.'),
('espadachim_s2','Dança das Lâminas','espadachim','skill','arcano',14,1.3,'random_enemy','Múltiplos cortes rápidos.'),
('arqueiro_s1','Flecha Astral','arqueiro','skill','luz',10,1.7,'highest_atk_enemy','Flecha guiada pelos astros.'),
('arqueiro_s2','Chuva de Setas','arqueiro','skill','neutro',16,1.2,'random_enemy','Salva ampla contra o grupo.'),
('arcanista_s1','Explosão Arcana','arcanista','skill','arcano',14,1.9,'lowest_hp_enemy','Detona um foco de Éter no inimigo.'),
('arcanista_s2','Runa Congelante','arcanista','skill','gelo',12,1.5,'highest_atk_enemy','Runa que retarda e fere.'),
('vidente_s1','Bênção da Aurora','vidente','skill','luz',12,1.5,'lowest_hp_ally','Cura restauradora em um aliado.'),
('vidente_s2','Julgamento Solar','vidente','skill','luz',14,1.4,'highest_atk_enemy','Raio de luz punitivo.'),
('punho_s1','Impacto Trovejante','punho','skill','raio',10,1.7,'lowest_hp_enemy','Golpe que ecoa com trovão.'),
('punho_s2','Fúria Interior','punho','skill','arcano',8,1.3,'self','Fortalece a si mesmo temporariamente.')
ON CONFLICT (slug) DO NOTHING;

-- Regions
INSERT INTO public.regions (slug, name, chapter, description, recommended_level, sort_order) VALUES
('vale_alvorada','Vale da Alvorada',1,'Planícies serenas onde os primeiros ecos dos Núcleos Astrais despertam.',1,1),
('bosque_lumen','Bosque Lúmen',1,'Uma floresta prateada infestada por criaturas do crepúsculo.',5,2),
('ruinas_eter','Ruínas do Éter',2,'Escombros de um império arcano, guardadas por autômatos.',10,3)
ON CONFLICT (slug) DO NOTHING;

-- Enemies
INSERT INTO public.enemies (slug, name, element, is_boss, level, hp, atk, def, spd, xp_reward, gold_reward) VALUES
('lobo_alvorada','Lobo da Alvorada','neutro',false,1,80,14,4,10,15,8),
('goblin_batedor','Goblin Batedor','terra',false,2,95,16,5,12,18,10),
('espirito_alva','Espírito da Alva','luz',false,3,110,18,6,11,22,12),
('urso_alva','Urso Ancião da Alvorada','terra',true,5,320,26,10,8,80,45),
('lobo_lumen','Lobo Lumen','luz',false,5,140,20,7,13,28,14),
('naga_bosque','Naga do Bosque','gelo',false,6,160,22,8,12,32,16),
('bruxa_lumen','Bruxa Lúmen','sombra',false,7,150,24,7,11,36,18),
('rainha_lumen','Rainha Lúmen','sombra',true,9,520,30,12,10,140,70),
('automato_eter','Autômato Menor','arcano',false,10,200,26,10,10,44,22),
('serpente_arcana','Serpente Arcana','arcano',false,11,220,28,10,13,48,24),
('golem_eter','Golem de Éter','arcano',false,12,260,30,14,7,54,28),
('guardiao_ruinas','Guardião das Ruínas','arcano',true,14,780,36,16,9,220,120)
ON CONFLICT (slug) DO NOTHING;

-- Stages: 3 per region, last is boss
INSERT INTO public.stages (region_slug, stage_number, is_boss, enemy_pool, boss_slug) VALUES
('vale_alvorada',1,false,ARRAY['lobo_alvorada','goblin_batedor'],NULL),
('vale_alvorada',2,false,ARRAY['goblin_batedor','espirito_alva'],NULL),
('vale_alvorada',3,true,ARRAY[]::text[],'urso_alva'),
('bosque_lumen',1,false,ARRAY['lobo_lumen','naga_bosque'],NULL),
('bosque_lumen',2,false,ARRAY['naga_bosque','bruxa_lumen'],NULL),
('bosque_lumen',3,true,ARRAY[]::text[],'rainha_lumen'),
('ruinas_eter',1,false,ARRAY['automato_eter','serpente_arcana'],NULL),
('ruinas_eter',2,false,ARRAY['serpente_arcana','golem_eter'],NULL),
('ruinas_eter',3,true,ARRAY[]::text[],'guardiao_ruinas')
ON CONFLICT DO NOTHING;
