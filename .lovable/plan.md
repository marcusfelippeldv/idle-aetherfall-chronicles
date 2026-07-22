## Objetivo

Aetherfall Online mantém marca, arte, cores (azul/roxo/dourado) e nomenclatura próprias. Adotamos a **arquitetura de jogo** do documento (party de até 3, hunts em 10 waves com boss, offline 12h, wheel de talentos, gemas/forja, imbuements, prey, arena 3v3, guildas), mas com nomes e sistemas originais — não copiamos vocabulário de Tibia/Baiak.

Vamos **resetar** o schema atual do jogo (`characters`, `expeditions`, `inventory_items`, `items`, `quests`, `seasons`, `raid_*`, `enemies`, `regions`, `classes`, `products`, `orders`, `guild_*`, `chat_messages`, `achievements*`, `season_*`, `daily_quest*`, `currency_transactions`). Preservamos `profiles`, `wallets` (zerando saldo), `user_roles` e `admin_audit_logs`.

## Renomeação Aetherfall (identidade própria)

Nada de "vocação/Knight/Paladin/Sorcerer/Druid/Monk/wave/hunt/exura/coin/prey/imbuement".

| Conceito Baiak | Aetherfall |
|---|---|
| Vocação | **Arquétipo** |
| Knight | **Guardião** (tanque marcial) |
| Paladin | **Arqueiro Astral** (atirador físico) |
| Sorcerer | **Arcanista** (mago ofensivo) |
| Druid | **Vidente** (mago suporte/cura) |
| Monk | **Punho da Aurora** (tanque ágil) |
| Party | **Coorte** (até 3) |
| Hunt / 10 waves | **Incursão** com 10 **ondas** e **chefe de fase** |
| Cidade/lobby | **Bastião** |
| Offline hunt/train | **Vigília** (caça offline) / **Treino** (offline sem risco) |
| Coins premium | **Cristais de Éter** (já temos "premium" na wallet) |
| Wheel of Destiny | **Constelação** (talentos) |
| Prey | **Presságio** (bônus vs. um inimigo escolhido) |
| Gems/Forge | **Runas** e **Bigorna** |
| Imbuements | **Selos** (buffs temporários no equipamento) |
| Boss room + chest | **Câmara do Ápice** + **Relicário** |
| Arena PvP 3v3 | **Duelos do Nexo** (3v3 ranqueado) |
| Guild war | **Confronto de Ordens** (guildas viram **Ordens**) |
| Daily reward | **Bênção Diária** |
| Achievements | **Feitos** |

Regra: 1 personagem por arquétipo, até 5 por conta. Coorte com 3 slots; XP divide 65% líder / resto igual entre vivos, solo = 100%.

## Escopo por fases (todas planejadas agora, implementadas em sequência)

### Fase A — Reset + Núcleo (bloqueia tudo o resto)

**Schema (migração única de reset):**
- Drop das tabelas de jogo listadas acima. Preservar `profiles`, `wallets`, `user_roles`, `admin_audit_logs`.
- Novas tabelas com GRANTs + RLS:
  - `archetypes` (5 linhas fixas: id, slug, nome, papel, hp_por_nivel, mana_por_nivel, arma_inicial, usa_pocao_mana, desc).
  - `characters` (user_id, archetype_id, name, level, xp, hp_cur, mana_cur, skill_melee, skill_ranged, skill_magic, skill_shield, skill_fist, is_active). Unique `(user_id, archetype_id)`.
  - `cohorts` (user_id, leader_char_id, slot2_char_id, slot3_char_id, slots_unlocked int 1|2|3).
  - `regions` → **zones** (id, slug, nome, nivel_recomendado, dificuldade_estrelas, xp_mult, loot_mult).
  - `zone_waves` (zone_id, wave_number 1..10, is_boss, spawn_json).
  - `enemies` (id, slug, nome, hp, atk, def, xp, gold_min, gold_max, resistances_json).
  - `incursions` (character_or_cohort_id, zone_id, mode enum: `active|offline_hunt|offline_train`, started_at, expected_end_at, offline_reserve_used_minutes, loop bool, status).
  - `offline_reserves` (user_id, hunt_minutes_left default 720, train_minutes_left default 720, last_tick_at).
  - `items` (id, slug, nome, tipo enum: arma/armadura/elmo/etc, tier int, rarity enum common..mythic, base_stats_json, slot enum).
  - `inventory` (user_id, item_id, qty, equipped_on_char nullable, unique_instance_id nullable).
  - `character_equipment` (character_id, slot, inventory_row_id).
- Índices em user_id, char_id, is_active, status='active'.

**Server functions (`src/lib/`):**
- `archetype.functions.ts`: `listArchetypes`.
- `character.functions.ts` (reescrita): `getMyCohort` (retorna coorte + wallet + incursão ativa), `createCharacter({ name, archetypeId })`, `unlockCohortSlot({ slot: 2|3, pay: 'gold'|'crystals' })`, `setCohortMember({ slot, characterId })`.
- `incursion.functions.ts`: `startIncursion({ zoneId, loop })`, `tickActiveIncursion` (progressão determinística), `switchToOffline({ mode })`, `claimOfflineRewards()`. Motor de combate reaproveita `formulas.server.ts` (adaptado a coorte + mana + rotação simples).
- `zone.functions.ts`: `listZones`, `getZone`.

**UI/rotas (`src/routes/_authenticated/`):**
- `criar-heroi.tsx` reescrita: escolhe arquétipo restante (esconde os já usados), nome único por conta.
- `jogo.index.tsx` vira **Bastião**: mostra coorte, cristais/ouro, botão "Ir para a Arena", lista de personagens, botão "Novo arquétipo" enquanto houver slot.
- `jogo.arena.tsx` vira **Incursão**: seletor de zona + botão Iniciar + `CombatStage` reaproveitado com 3 heróis + barra de ondas 1..10 + card de chefe da wave 10 + botão Loop.
- Nova rota `jogo.vigilia.tsx`: escolher modo offline (Vigília ou Treino), ver reserva de 12h.
- Redirect `/jogo/novo` → `/criar-heroi` continua.

**Correções de retenção do bug atual:** manter `qc.setQueryData(["me","cohort"], …)` após criar personagem para não ricochetear para /criar-heroi.

### Fase B — Progressão profunda

- **Constelação** (Wheel of Destiny): tabelas `talent_nodes` (grafo por arquétipo, tiers 1..N) e `character_talents`. 1 ponto por nível. Server fns `listTalentTree`, `allocateTalent`, `respec` (custa cristais).
- **Magias & Rotação**: tabela `spells` (slug, nome, arquétipo, tipo `dano|cura|área|buff`, custo_mana, cooldown, formula), `character_spells` (aprendidas por nível), `character_rotation` (JSON de ordem/condições). UI de "Grimório" na tela de personagem para arrastar spells na rotação e definir gatilhos (curar se HP<X%).
- **Skills** (skill_melee/ranged/magic/shield/fist): sobem por uso durante incursão e por Treino offline; fórmula multiplicativa no ataque.
- Reset de bênçãos diárias (**Bênção Diária**) e **Feitos** com nova nomenclatura (drop das antigas achievements/season, recria).
- Novo passe de temporada: **Ciclo Estelar**.

### Fase C — Itens, economia e coleta

- **Tiers & Raridade**: reforço no schema `items` (tier 1..5, rarity common/rare/epic/legendary/mythic), affix pool.
- **Runas & Bigorna**: `runes` (id, slug, tipo, effect_json), `character_rune_slots` (item_instance_id, slot, rune_id). Server fns `socketRune`, `unsocketRune`.
- **Selos** (imbuements): `seal_templates`, `active_seals` (item_instance_id, seal_id, expires_at). Aplicação custa cristais/ouro.
- **Presságio**: `omen_slots` (character_id, slot 1..3, enemy_slug, expires_at, bonus_type). Reroll pago.
- **Câmara do Ápice**: `elite_bosses` + `boss_run_charges` (por dia) + `boss_loot` com anúncio no servidor quando cai lendário/mítico.
- **Loja Aetherfall** revista: reset de `products`/`orders`, produtos de cristais + cosméticos (aparências, cores dos 4 canais). Sem integração de pagamento ainda (usar mock crediting via admin).

### Fase D — Social e PvP

- **Duelos do Nexo**: `pvp_matches`, `pvp_ratings`, `pvp_seasons`, ligas Bronze→Diamante. Sistema autoritativo no servidor com sim determinística em turnos rápidos.
- **Ordens** (guildas — reset e recria): `orders`, `order_members` (papéis: Regente, Vice, Iniciado), `order_wars`, `order_bank`. Chat de ordem.
- **Bastião** compartilhado: reset do `chat_messages`, canais `mundo`, `ordem`, `pvp`.
- **Rankings**: por nível de personagem, por poder de coorte, por speedrun de incursão, por elo PvP, por ordem.
- **Painel Admin**: adaptar `admin.functions.ts` para nova nomenclatura, manter auditoria obrigatória, adicionar criar personagem para conta travada e reset de cristais/ouro com justificativa.

## Detalhes técnicos

- Migração única para Fase A com reset (drop + create + grants + rls + policies + seeds de arquétipos, zonas, inimigos base). Fases B–D vão em migrações incrementais próprias, cada uma seguida pela regeneração dos types e refactor de rotas/functions.
- Combate continua determinístico com `mulberry32` já existente em `formulas.server.ts`; estendido para múltiplos aliados e mana. `CombatStage`/`PatrolScene` são reaproveitados renderizando os 3 heróis da coorte.
- Toda função sensível (criar personagem, iniciar incursão, alocar talento, socket de runa) usa `requireSupabaseAuth`; escrita privilegiada via `supabaseAdmin` importado dentro do handler.
- RLS: usuário só lê/escreve os próprios personagens, coorte, inventário, incursão, ordens. `admin_audit_logs` continua service-role only. Catálogos (`archetypes`, `zones`, `zone_waves`, `enemies`, `items`, `spells`, `talent_nodes`, `rune`, `seal_templates`) com `GRANT SELECT TO anon, authenticated` e policy `USING (true)`.
- Todas as strings da UI em pt-BR, com nomenclatura Aetherfall acima. Todos `head()`/meta tags atualizados por rota.
- SEO nas rotas públicas (`/`, `/classes` → renomear para `/arquetipos`, `/ranking`, `/roadmap`, `/privacidade`, `/termos`) reescritos com nova identidade.

## Validação por fase

Ao fim de cada fase, valido com Playwright: login → criar arquétipo → montar coorte → iniciar incursão → completar ondas → derrotar chefe da wave 10 → ver loot no inventário → (Fase B) alocar talento e ajustar rotação → (Fase C) aplicar runa e selo → (Fase D) entrar em fila PvP e criar ordem.

## Fora deste plano

Integração real de pagamento (Paddle/Stripe), animações premium (Fase 6 anterior — mantidas como estão), tradução para outros idiomas, mobile-first refinado (segue responsivo básico).
