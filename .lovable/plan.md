# Reboot: Eternal Shards (Aetherfall Online) — Equipe de 4, Iniciativa, Despertar

Reboot completo do jogo para a estrutura do documento: equipe de 4 heróis, 6 classes com evoluções, combate por barra de iniciativa com IA por prioridades, Despertar, Entidades Ancestrais, 5 regiões e história em capítulos. Reset destrutivo de personagens/itens/inventário/incursões. Arte inteira gerada via `imagegen` e servida pelo CDN.

## Etapas

### 1. Fundação (schema + reset)
Migração destrutiva única:
- **Drop**: `characters`, `cohorts`, `incursions`, `inventory`, `items`, `enemies`, `zones`, `zone_waves`, `archetypes`, `offline_reserves`. Mantém `profiles`, `wallets`, `user_roles`, `admin_audit_logs`.
- **Novas tabelas**:
  - `classes` (6 base + 12 evoluções, com `parent_slug` para árvore).
  - `elements` enum: `fogo, gelo, raio, terra, luz, sombra, arcano`.
  - `heroes` (personagens jogáveis; até 12 por conta): nome, classe, elemento, nível, XP, atributos, 8 slots equipados, `awakening_energy`.
  - `parties` (equipe ativa de 4): `slot1..slot4` → `heroes.id`, `entity_slug` (Entidade Ancestral equipada).
  - `hero_priorities`: fila ordenada de regras por herói (JSONB: `[{when, target, action}]`).
  - `regions` (5) e `stages` (10 por região = 50 fases) com chefe final.
  - `enemies` reescrito com elemento, fraquezas/resistências, HP/ATK/DEF/SPD.
  - `expeditions` (idle): região, duração (15m/30m/1h/2h/4h/8h), party_snapshot, resultado.
  - `items` mantém shape parecido, mas com `element_affinity` e `class_restriction[]` (evoluções específicas).
  - `inventory` reescrito para `owner_user_id`.
  - `ancestral_entities` (6) e `user_entities` (desbloqueio + cooldown).
  - `story_chapters` (5) e `user_story_progress`.
  - `abilities` (25) com custo, alvo, elemento, efeito JSON.
- **Grants + RLS** em todas as tabelas seguindo padrão do projeto.
- **Trigger** de validação de party (máx 4 heróis únicos do mesmo user) e de item (`class_restriction`).

### 2. Motor de combate por iniciativa (server-side)
`src/lib/combat/engine.server.ts`:
- Determinístico via PRNG seed (permite replay).
- Loop: acumula iniciativa = SPD × dt; ao encher, o ator escolhe ação via regras de prioridade do jogador (fallback: atacar mais fraco).
- Regras suportadas: `atacar_mais_fraco`, `atacar_chefe`, `curar_abaixo_40`, `magia_area`, `proteger_aliado_baixo`, `guardar_especial`.
- Aplica dano com tabela elemento × elemento (fraqueza/resistência).
- Acumula `awakening_energy`; ao encher, dispara Despertar da classe.
- Entidade Ancestral: 1 uso por batalha, cooldown entre batalhas.
- Produz **timeline** de eventos que a UI reproduz frame-a-frame.

### 3. Expedições idle
`src/lib/expedition.functions.ts`:
- `startExpedition({regionId, durationMin, partyId})`: valida energia/slots, grava snapshot da party e da rota.
- Enquanto roda: nenhum trabalho no servidor; ao reivindicar, o motor simula N encontros proporcionais à duração usando seed derivada de `expedition.id`.
- `claimExpedition`: gera relatório completo (inimigos derrotados, XP, ouro, materiais, itens, item raro, fragmentos astrais) e concede recompensas.

### 4. UI de jogo (todas em pt-BR)
- `/jogo` layout com abas: **Bastião, Equipe, Combate, Expedições, História, Invocações, Inventário, Loja, Carteira, Ranking**.
- **Equipe** (`jogo.equipe.tsx`): 12 heróis em grade → arrastar para os 4 slots + slot da Entidade; editor de Prioridades (lista drag-and-drop de regras).
- **Combate** (`jogo.combate.tsx`): substitui a Arena. Renderiza a timeline do motor com framer-motion:
  - Linha superior: 4 retratos dos heróis + barras HP/Mana/Iniciativa/Despertar.
  - Linha inferior: 3-5 inimigos com HP.
  - Floaters de dano/cura, ícones elementais, flash no ataque, tela cheia no Despertar, cutscene curta na Entidade.
- **Expedições** (`jogo.expedicoes.tsx`): cards por região com botões de duração, contador ao vivo, botão Reivindicar.
- **História** (`jogo.historia.tsx`): 5 capítulos com arte gerada + texto do arco dos Núcleos Astrais.
- **Invocações** (`jogo.invocacoes.tsx`): 6 Entidades com arte, descrição e desbloqueio.
- **Inventário/Loja/Herói**: adaptados para o novo modelo (por herói, filtro por classe/evolução).

### 5. Arte (via `imagegen` → CDN)
Geração em batches paralelos, `google/gemini-3.1-flash-image`, salvos em `src/assets/`:
- Logo + banner do jogo.
- 6 classes base + 12 evoluções: retrato + corpo inteiro (36 imagens).
- 6 Entidades Ancestrais (Valtheron, Ignivar, Nyméria, Gaorun, Sylphae, Nocthar).
- 5 backgrounds de região + 5 chefes principais.
- ~30 inimigos comuns (silhuetas por tipo/elemento).
- 25 ícones de habilidade + 6 ícones de Despertar.
- Reaproveita ícones de itens já existentes; gera mais 40 para completar 100.

### 6. Seeds
Migração de seed única após schema:
- 6 classes + 12 evoluções, com stats base, habilidade básica/especial/passiva, descrição do Despertar e `icon_url`.
- 6 elementos e matriz de fraquezas.
- 6 Entidades Ancestrais.
- 5 regiões × 10 fases (chefe na 10ª) com pool de inimigos.
- 5 chefes principais e 30 inimigos.
- 25 habilidades (5 básicas, 12 especiais, 6 passivas ligadas a classes/evoluções, mais utilitárias).
- 100 itens (arma/off-hand por evolução em 6 raridades + genéricos + consumíveis).
- 5 capítulos de história.

### 7. Reboot de conta
Ao logar depois da migração: se o user tinha herói antigo (agora inexistente), redireciona para `/criar-heroi` que vira **Criar Condutor** — o jogador dá nome ao protagonista, escolhe classe base, e recebe 3 companheiros de classes complementares.

### 8. Admin
Atualiza `/admin` para o novo schema: criar Condutor, resetar party, conceder herói/item/Entidade, com auditoria.

## Ordem de execução (build)

1. Migração destrutiva + criação de todas as tabelas + grants + RLS + triggers.
2. Migração de seeds (classes, elementos, entidades, regiões/fases, inimigos, habilidades, itens, capítulos).
3. Batch 1 de `imagegen`: logo, 6 classes base, 6 entidades, 5 regiões (17 imagens, paralelas).
4. Batch 2 de `imagegen`: 12 evoluções, 5 chefes, 30 inimigos (47 imagens, paralelas).
5. Batch 3 de `imagegen`: 25 ícones de habilidade + 6 de Despertar + 40 ícones de item (paralelas).
6. Server code: `combat/engine.server.ts`, `party.functions.ts`, `hero.functions.ts`, `expedition.functions.ts`, `story.functions.ts`, `entities.functions.ts`. Reescreve `inventory.functions.ts`, `shop.functions.ts`, `character.functions.ts` para o novo modelo.
7. UI: nova `/criar-heroi` (Condutor + 3 companheiros), `jogo.equipe.tsx`, `jogo.combate.tsx` (substitui arena), `jogo.expedicoes.tsx`, `jogo.historia.tsx`, `jogo.invocacoes.tsx`. Adapta `jogo.tsx` (nav), `jogo.index.tsx` (Bastião), `jogo.inventario.tsx`, `jogo.loja.tsx`, `jogo.heroi.tsx`.
8. Admin refeito para novo schema.
9. Verificação: build TS + smoke test manual (criar Condutor → equipe → expedição curta → reivindicar → combate contra chefe).

## Detalhes técnicos

- **Iniciativa**: `readiness += speed * dt` num loop com `dt=100ms` simulado; ator age em `readiness>=100`, reseta para 0. Ação custa mais quando é especial (multiplica gasto).
- **Regras de IA**: JSON array por herói `[{ id, condition, target, action, priority }]`. Motor avalia em ordem; primeira condição satisfeita ganha. Editor da UI é uma lista `dnd-kit`.
- **Despertar**: `awakening_energy += damage_taken*0.1 + damage_dealt*0.05`. A 100, próxima ação vira Despertar (efeito por classe hardcoded no motor).
- **Entidades Ancestrais**: `parties.entity_slug` + `user_entities.cooldown_until`. Botão manual no combate; fora disso não age.
- **Timeline**: motor devolve `events: [{ t, type, actor, target, payload }]` e a UI usa `framer-motion` + timers para animar; sem WebSocket, tudo cliente-side após o `POST`.
- **Expedições**: cálculo no reivindicar usa `hash(expedition_id, region_seed)` como PRNG, então mesma expedição sempre dá o mesmo resultado (anti-cheat).
- **Story**: cada capítulo tem `unlock_condition` (ex.: `region_1_boss_defeated`). Ler `/jogo/historia` só destrava; capítulos não gastam energia.
- **Reset**: `DROP TABLE ... CASCADE` na migração; `handle_new_user` continua criando profile/wallet/role, mas nada de herói.

## Fora do escopo deste ciclo (fica para depois)

- Pagamentos (Paddle/Stripe).
- Guildas, chat social, world bosses (voltam num ciclo futuro).
- Passe de temporada e conquistas (podem entrar em um ciclo 2 rápido).
- Ilustração final por artista humano — arte gerada por IA é placeholder de qualidade.
