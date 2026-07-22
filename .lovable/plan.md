# Etapa 4 — Retenção

Pagamentos ficam adiados (a loja de cristais continua com botão "Em breve"). Foco desta etapa: dar motivos para o jogador voltar todo dia e progredir a longo prazo.

## O que o jogador vai poder fazer

1. **Missões diárias** — 3 tarefas por dia (ex: "Complete 2 expedições", "Derrote 1 chefe", "Venda 5 itens"). Ao concluir, resgata ouro + XP. Reset automático à meia-noite (fuso do servidor, UTC).
2. **Conquistas permanentes** — marcos de longo prazo (ex: "Primeiro chefe derrotado", "Nível 10", "100 expedições concluídas"). Cada uma dá cristais como recompensa única.
3. **Ranking expandido** — a página `/ranking` atual (top 50 por poder) ganha abas: **Poder**, **Nível**, **Chefes derrotados**, **Ouro acumulado**. Filtro público, sem login.
4. **Passe de temporada** — barra de XP de temporada (30 dias), com 10 níveis e recompensas em ouro/cristais/itens a cada nível. XP de temporada vem de expedições e chefes.

## Ações desta etapa

### Banco de dados (1 migração)
- `daily_quest_templates` (catálogo fixo: slug, título, tipo de meta, valor, recompensa em ouro/xp).
- `daily_quests` (instância por usuário/dia: user_id, template_id, progress, target, claimed_at, quest_date).
- `achievement_templates` (catálogo: slug, título, descrição, tipo, threshold, recompensa em cristais).
- `achievements` (user_id, template_id, unlocked_at, claimed_at).
- `seasons` (id, name, starts_at, ends_at, active).
- `season_progress` (user_id, season_id, xp, claimed_levels int[]).
- `season_rewards` (season_id, level, gold, premium, item_id).
- Seed: ~8 templates de missão diária, ~15 conquistas, 1 temporada ativa de 30 dias com 10 níveis de recompensa.
- Grants + RLS: usuário lê/atualiza só o próprio; templates e temporadas são públicos (SELECT anônimo).

### Server functions
- `src/lib/quests.functions.ts`
  - `getDailyQuests()` — busca ou gera as 3 missões do dia via seleção determinística (seed = user_id + data).
  - `claimDailyQuest({ questId })` — valida progress ≥ target, credita ouro/xp, marca claimed.
- `src/lib/achievements.functions.ts`
  - `getMyAchievements()` — lista com estado (locked/unlocked/claimed).
  - `claimAchievement({ achievementId })` — credita cristais.
- `src/lib/season.functions.ts`
  - `getSeasonStatus()` — temporada atual + progresso + níveis pendentes.
  - `claimSeasonLevel({ level })` — libera recompensa quando XP suficiente.
- `src/lib/catalog.functions.ts` — expande `listRanking` para aceitar `sortBy` (power|level|bosses|gold).

### Hooks de progresso (dentro de server functions existentes)
- `claimExpedition` (expedition.functions): incrementa progresso das missões "completar expedições", "coletar ouro" e adiciona XP de temporada.
- `fightBoss` (combat.functions): incrementa "derrotar chefe" e desbloqueia conquistas de chefes.
- `sellItem` (inventory.functions): incrementa "vender itens".
- Verificação de conquistas por threshold roda dentro dessas mesmas funções (função utilitária `checkAchievements(supabase, userId, event)`).

### UI (pt-BR, mantendo tema escuro dourado/arcano)
- **Nova rota `/jogo/diario`**: cards das 3 missões com barras de progresso e botão "Resgatar".
- **Nova rota `/jogo/conquistas`**: grid com estado (bloqueada, desbloqueada, resgatada), ordenadas por categoria.
- **Nova rota `/jogo/temporada`**: barra grande de XP, trilha visual dos 10 níveis com recompensas.
- **`/jogo/arena`**: acrescenta 3 botões no header (Diário, Conquistas, Temporada) + badge com contador de missões prontas para resgate.
- **`/ranking`**: adiciona `Tabs` com os 4 critérios; loader recebe `?sort=` via `useSearch`.

## Segurança
- Toda validação (progress, threshold, saldo de XP de temporada, meia-noite UTC) roda no servidor sob `requireSupabaseAuth`.
- Idempotência: `claimed_at` impede resgate duplicado; `claimed_levels` (array) idem para temporada.
- Reset diário: `quest_date = current_date` no servidor; sem `updated_at` do cliente.
- Templates e temporadas: SELECT público via cliente `anon` (leitura fria, sem PII).

## Detalhes técnicos
- Missões diárias geradas sob demanda (não em cron): primeira chamada do dia insere as 3 linhas com `ON CONFLICT (user_id, quest_date) DO NOTHING`.
- Ranking usa índices existentes em `characters(power desc)`, `characters(level desc)`; adiciono índices para `defeated_bosses` e uma view materializada não é necessária neste volume.
- XP de temporada: coluna `season_xp` em `season_progress`; ganho = xp da expedição / 2 (ajustável no seed).

## Fora do escopo desta etapa
- Integração com Stripe/Paddle (adiada conforme pedido).
- Guildas, chat, raids (Etapa 5).
- Notificações push / e-mail de missões prontas.
