# Etapa 5 — Social

Última etapa do roadmap. Objetivo: transformar Aetherfall Online em um mundo compartilhado com guildas, comunicação em tempo real e conteúdo cooperativo (raids assíncronas).

## O que o jogador vai receber

- **Guildas**: criar, entrar, sair, gerenciar membros e ver o mural da guilda.
- **Chat**: canal global do reino + canal privado da guilda, em tempo real.
- **Raids assíncronas**: chefes de elite que exigem contribuição de vários heróis ao longo de horas; recompensas distribuídas conforme dano causado.
- **Ranking de guildas**: nova aba no ranking com poder somado dos membros.

## Banco de dados (nova migração)

Tabelas novas em `public` (todas com GRANTs + RLS + policies):

- `guilds`: nome único, tag (3-5 chars), descrição, emblema, dono, `member_count`, `total_power`, timestamps.
- `guild_members`: `guild_id`, `user_id`, `character_id`, `role` (`leader` | `officer` | `member`), `joined_at`, contribuição total.
- `guild_invites`: convites pendentes com expiração.
- `chat_channels`: registro dos canais (`global`, `guild:<id>`).
- `chat_messages`: `channel_key`, `user_id`, `character_name`, `content`, `created_at` (retenção lógica: só últimos 200 por canal na UI).
- `raid_templates`: chefes de raid (HP total, janela em horas, recompensas base).
- `raids`: instância ativa de uma raid (template, `guild_id` opcional para raids exclusivas, `starts_at`, `ends_at`, `current_hp`, status).
- `raid_contributions`: `raid_id`, `character_id`, dano acumulado, última investida, cooldown.
- `raid_rewards`: entregas calculadas ao fim da raid.

Enums novos: `guild_role`, `raid_status` (`active` | `defeated` | `expired` | `settled`).

Índices: `guild_members(user_id)`, `chat_messages(channel_key, created_at desc)`, `raid_contributions(raid_id, damage desc)`.

Seed: 3 chefes de raid iniciais (ex.: Leviatã do Véu, Titã de Obsidiana, Fênix Umbral) com HP e recompensas balanceadas para grupos pequenos.

## RLS (regras em linguagem simples)

- Qualquer jogador autenticado lê guildas, membros públicos e ranking de guilda.
- Só o líder edita a guilda; líder/oficiais aceitam convites e removem membros; membros saem de si mesmos.
- Chat global: leitura para autenticados; inserção só do próprio usuário.
- Chat de guilda: leitura e escrita apenas para membros daquela guilda.
- Raids: leitura pública; contribuição só do dono do personagem e respeitando cooldown/janela.

## Server functions (novas)

Client-safe (`src/lib/*.functions.ts`):

- `guild.functions.ts`: `listGuilds`, `getMyGuild`, `createGuild` (custo em cristais), `joinGuild`, `leaveGuild`, `kickMember`, `promoteMember`, `updateGuild`.
- `chat.functions.ts`: `listMessages({ channel })`, `sendMessage({ channel, content })` com rate limit (ex.: 1 msg/2s por usuário, 500 chars, filtro básico).
- `raid.functions.ts`: `listActiveRaids`, `getRaidDetails`, `attackRaid` (aplica cooldown de 5-10 min, calcula dano usando as fórmulas existentes de `formulas.server.ts`, grava contribuição), `claimRaidRewards` (após `settled`).

Server-only helpers em `src/lib/social.server.ts`: recomputo de `member_count`/`total_power`, liquidação de raid (rateio proporcional ao dano), integração com `progression.server.ts` para XP de temporada e conquistas de raid/guilda.

## Realtime (chat e raid)

- Chat: assinar `chat_messages` filtrando por `channel_key` via Supabase Realtime no cliente, com fallback em polling (5s) se o socket cair.
- Raid: assinar mudanças de `raids.current_hp` para atualizar a barra em tempo real.
- Nenhuma escrita direta do cliente no banco — realtime é só leitura; escrita passa sempre pelas server functions (mantém antifraude).

## UI (novas rotas em pt-BR)

- `src/routes/_authenticated/jogo.guilda.tsx`: se sem guilda, lista de guildas + botão "Fundar guilda" (modal com custo em cristais). Com guilda: painel com membros, papéis, mural e ações de gestão conforme papel.
- `src/routes/_authenticated/jogo.chat.tsx`: layout com abas Global/Guilda, lista de mensagens com auto-scroll e input com contador de caracteres.
- `src/routes/_authenticated/jogo.raides.tsx`: cards das raids ativas (barra de HP, tempo restante, top contribuintes) e detalhe com botão "Investir" (mostra cooldown), log das últimas investidas e recompensas previstas.
- `src/routes/ranking.tsx`: nova aba "Guildas" (poder total, membros, líder).
- `src/routes/_authenticated/jogo.arena.tsx`: adicionar atalhos no header para Guilda, Chat e Raides. Ordem final: Diário · Conquistas · Temporada · Guilda · Chat · Raides · Loja · Carteira (pode virar dropdown "Social" se ficar apertado).
- Cada rota nova ganha seu próprio `head()` com título, descrição, `og:title` e `og:description` em pt-BR.

## Integração com sistemas existentes

- Ganhos em raid disparam `progression.server.ts` (missões diárias tipo "contribua com raid", conquistas "primeira raid vencida", XP de temporada).
- Fundar guilda debita cristais via `wallets` + `currency_transactions` (mesma pipeline da Loja/Carteira), aparecendo no extrato.
- Nenhuma alteração no combate/expedição já existentes além dos hooks de progresso.

## Antifraude / segurança

- Toda escrita passa por server function; realtime é read-only.
- Cooldowns e limites de dano validados no servidor.
- Chat: rate limit por usuário, tamanho máximo, sanitização (sem HTML), lista simples de palavras bloqueadas.
- Sem PII em `chat_messages` — só `character_name` público.

## Ordem de execução

1. Migração SQL (tabelas, enums, GRANTs, RLS, policies, seed de raids).
2. Server functions (`guild`, `chat`, `raid`) + `social.server.ts`.
3. Hooks de progresso (raid vencida, guilda fundada).
4. Rotas de UI: Guilda → Chat → Raides → aba de ranking → atalhos no header da Arena.
5. Verificação: `bun run build`, smoke test das rotas novas e leitura das policies via linter.

## Fora do escopo desta etapa

- Integração real de pagamentos Stripe/Paddle (fica para o passo seguinte, como combinado).
- Guerras de guilda / PvP direto (pode virar Etapa 6 futura).
- Moderação avançada de chat (denúncias, banimentos administrativos além do painel admin atual).
