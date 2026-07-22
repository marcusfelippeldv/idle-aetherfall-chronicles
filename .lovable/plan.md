## GitHub

Não consigo conectar o GitHub por você — a autorização precisa acontecer na sua conta. Passo a passo:

1. No editor Lovable, clique no **+** (canto inferior esquerdo do chat) → **GitHub → Connect project**
2. Autorize o app do Lovable
3. Escolha a conta/org e clique **Create Repository**

A sincronização é bidirecional e automática depois disso.

## Idle offline nas batalhas (50% XP quando offline)

Objetivo: a party fica farmando o estágio selecionado 24/7. Ao voltar, o jogador vê o loot acumulado. Enquanto está online e na aba de combate, o loop roda em tempo real com XP cheio; enquanto offline, acumula com XP reduzido a 50% (ouro fica cheio).

### Modelo de dados (nova migração)

Nova tabela `idle_runs` (uma linha ativa por usuário):
- `user_id` (PK, FK auth.users)
- `stage_id` (FK stages)
- `started_at`, `last_tick_at`, `last_seen_at` timestamptz
- `pending_xp` bigint, `pending_gold` bigint, `pending_drops` jsonb (fila de itens por hero)
- RLS: dono lê/escreve; GRANTs padrão authenticated + service_role.

Novo campo em `heroes`: `xp bigint default 0`, `level int default 1` (se ainda não existir com esses nomes — verificar antes na migração).

### Rate de recompensas

Derivado do `simulate()` já existente: rodamos uma simulação "amostral" do estágio para estimar `xp_per_min` e `gold_per_min` (média de xp/gold por vitória × vitórias/min estimadas pelo tempo médio de turnos). Cacheado em memória do handler por stage_id.

Alternativa mais simples e determinística: usar `stages.xp_reward` e `stages.gold_reward` (ou os campos existentes nos inimigos) × taxa fixa (ex.: 1 clear a cada 20s para estágio normal, 60s para boss). Vou usar essa — mais previsível e sem custo de simular.

### Server functions (`src/lib/idle.functions.ts`)

- `startIdleRun({ stageId })` — cria/atualiza a linha em `idle_runs`, zera pending, seta `last_tick_at = now()`.
- `getIdleStatus()` — lê a linha ativa, calcula `elapsed = now - last_tick_at`, aplica taxa e o multiplicador de XP (0.5 se `now - last_seen_at > 60s`, senão 1.0), retorna `{ stage, pendingXp, pendingGold, pendingDrops, ratePerMin, offlineMultiplier, sinceMs }`. **Não persiste** — é read-only, o cálculo é feito a cada chamada.
- `heartbeat()` — atualiza `last_seen_at = now()` (chamado a cada 20s pela UI enquanto a aba está aberta).
- `claimIdleRewards()` — dentro de uma transação: recomputa o pending como em `getIdleStatus`, credita XP nos heróis da party (aplicando level-up conforme curva já existente ou nova: `xp_to_next = 100 * level^1.5`), credita ouro na `wallets`, insere drops no `inventory`, atualiza `last_tick_at = now()` e zera pending. Também dispara `bumpMetric` para missões/conquistas relevantes (`stage_cleared`, `gold_earned`).
- `stopIdleRun()` — reivindica e deleta a linha.

### UI (rota `/jogo/combate`)

Adicionar painel "Expedição idle":
- Selector de estágio (reusa `listStages`).
- Botão **Iniciar expedição** / **Parar**.
- Card com contadores animados (usa `AnimatedNumber` já existente) mostrando XP e ouro acumulados em tempo real (poll a cada 3s + tick local por segundo entre polls).
- Badge "Modo offline (−50% XP)" quando `offlineMultiplier < 1`.
- Botão **Coletar recompensas** que chama `claimIdleRewards` e mostra toast com o total + drops.
- `heartbeat` em `setInterval(20_000)` enquanto a rota estiver montada.

O combate ativo turno-a-turno (`simulateFight`) continua disponível como "batalha manual" para o jogador assistir a animação de uma luta específica — a idle roda em paralelo.

### Detalhes técnicos

- Cálculo de `elapsed` é dividido em janela online (até `last_seen_at + 60s`) × 1.0 e janela offline × 0.5 para XP, para não penalizar quem fechou a aba há 2 minutos com o total de 50% no período inteiro.
- Drops offline: para não inflar a jsonb, limitamos a `pendingDrops` a N=50 itens; excedente vira ouro equivalente.
- Segurança: `claimIdleRewards` recalcula do servidor — cliente nunca envia valores. `last_tick_at` só avança no claim; assim mesmo se o cliente spammar `getIdleStatus`, nada é creditado.
- Sem cron/pg_cron: recompensa é lazy, computada só quando o jogador volta ou coleta.

### Arquivos afetados

- Nova migração: `idle_runs` + GRANTs + RLS + policies + índice em `user_id`.
- Novo: `src/lib/idle.functions.ts`.
- Editado: `src/routes/_authenticated/jogo.combate.tsx` (painel idle).
- Editado: `src/lib/progression.server.ts` só se precisar de nova métrica.

Confirma que posso seguir com a taxa fixa por estágio (mais simples) em vez de derivar do simulador? E o timeout de 60s para considerar "offline" está bom?