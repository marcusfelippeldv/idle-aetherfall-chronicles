
# Aetherfall Online — Plano Completo

RPG Idle web original, pt-BR, tema fantasia medieval mágica. Stack: TanStack Start + React + TypeScript + Tailwind + Lovable Cloud (Supabase). Toda a lógica sensível (recompensas, moedas, pagamentos) roda em server functions autenticadas com RLS.

> IMPORTANTE: o escopo é enorme. Este plano cobre as 5 etapas, mas cada etapa será implementada em **uma iteração separada** — só peça a próxima quando a anterior estiver testada. Tentar tudo de uma vez leva a builds quebrados e regressões.

---

## Etapa 1 — Fundação (primeira entrega)

Objetivo: usuário consegue se cadastrar, confirmar e-mail, entrar, ver landing, ter perfil e um painel admin básico.

### Landing pública (`/`)
- Cabeçalho fixo: logo textual "Aetherfall", links Início · O jogo · Classes · Roadmap · Ranking · Comunidade, botões Entrar / Criar conta.
- Hero: "Sua jornada continua, mesmo quando você está offline."
- Seções: sobre progressão Idle, 5 classes, equipamentos & chefes, progressão offline, roadmap, CTA final.
- Rodapé: Termos, Privacidade, Suporte, redes.
- Rotas públicas separadas (SEO): `/classes`, `/roadmap`, `/ranking`, `/termos`, `/privacidade`, `/login`, `/cadastro`, `/recuperar-senha`, `/reset-password`, `/confirmar-email`.
- Cada rota com `head()` próprio (title, description, og:title, og:description em pt-BR).

### Design system
- Tema escuro por padrão. Paleta: azul profundo, roxo, dourado, cinza pedra. Tokens novos em `src/styles.css` (oklch): `--gold`, `--arcane`, `--stone`, `--gradient-arcane`, `--shadow-elegant`. Nenhuma cor hardcoded em componentes.
- Tipografia legível (Inter via `<link>` no `__root`).
- Placeholders visuais claramente marcados até termos artes finais.

### Autenticação (Lovable Cloud)
- E-mail/senha + confirmação de e-mail + reset (`/reset-password` obrigatória).
- Layout `_authenticated/` gerenciado pela integração para gate de `/jogo/*`.
- Layout `_authenticated/_admin/` extra para `/admin/*` usando `has_role`.
- Header reflete estado da sessão (avatar/menu quando logado, "Entrar/Criar conta" quando não).

### Banco (migração inicial + GRANTs + RLS)
Tabelas: `profiles`, `app_role` enum, `user_roles`, `characters`, `classes`, `regions`, `enemies`, `items`, `inventory_items`, `expeditions`, `wallets`, `currency_transactions`, `products`, `orders`, `admin_audit_logs`.

Regras chave:
- `user_roles` separado do `profiles`; função `has_role(uuid, app_role)` SECURITY DEFINER.
- Trigger `on_auth_user_created` cria `profiles` + `wallets` + role default `user`.
- RLS: jogador lê/edita apenas o próprio perfil/personagens/inventário/carteira/pedidos. Catálogo (`classes`, `regions`, `enemies`, `items`, `products`) legível por `anon`+`authenticated`. Escrita nessas tabelas só via admin/service_role.
- **Cliente nunca escreve** em `wallets`, `currency_transactions`, `expeditions.generated_*`, `characters.level/xp/attack/...`, `inventory_items` (exceto via server fn). Sem policies de UPDATE para o usuário nessas colunas sensíveis.
- `GRANT` explícito para cada tabela nova (authenticated / anon quando aplicável / service_role).

### Painel admin básico (`/admin`)
- Métricas: total de contas, contas últimos 7d, jogadores ativos, expedições iniciadas, ouro gerado, moeda premium em circulação, pedidos criados/pagos (queries server-side com `has_role` check).
- Lista de jogadores com busca por email/username/id.
- Suspender/reativar conta com **justificativa obrigatória** → grava em `admin_audit_logs`.
- Visualização read-only de perfil, personagens, moedas, inventário.

### Seed (mesma migração)
- 5 classes, 3 regiões, 5 inimigos/região + 1 chefe/região, 20 itens, 5 produtos demo. Uma conta admin promovida via SQL usando email de variável de ambiente (`ADMIN_BOOTSTRAP_EMAIL`).

---

## Etapa 2 — Jogo funcional

- `/jogo` dashboard: personagem ativo, nível, XP, poder, ouro, cristais, expedição atual, itens recentes, atalhos.
- `/jogo/personagem`: criação (escolha de classe + nome único), atributos derivados da classe.
- `/jogo/expedicao`: escolher região (nível mínimo) + duração (15/30/60/120/240 min).
- Server fns: `startExpedition`, `claimExpedition` (idempotente por `expeditions.id`, valida `expected_end_at`, calcula XP/ouro/drops no servidor com seed determinístico, grava `currency_transactions` e `inventory_items`, atualiza `characters` e `wallets` numa transação RPC).
- `/jogo/inventario` + `/jogo/equipamentos`: grid, filtros por tipo/raridade, comparação com equipado, equipar/desequipar/vender (server fn `sellItem`).
- Relatório da expedição (inimigos derrotados, XP, ouro, itens) retornado por `claimExpedition`.

---

## Etapa 3 — Economia

- `/jogo/loja` com produtos demo (500 Cristais, 1.200 Cristais, Fundador, Clube Mensal, Passe).
- Preparar arquitetura de pagamentos SEM cobrar ainda: `orders` + server fns `createOrder`, rota pública `/api/public/webhooks/payments` (verificação HMAC), `grantOrder` idempotente (bloqueia dupla entrega via `orders.status = 'delivered'`).
- Recomendação: usar `payments--recommend_payment_provider` na hora de ativar (Stripe para BR + Pix; Mercado Pago se preferir boleto). Ativação só quando o usuário pedir.
- Todas as movimentações de moeda passam por `currency_transactions` (origem, valor, saldo antes/depois).

---

## Etapa 4 — Retenção

- Missões diárias (tabela `daily_quests` + `character_daily_quests` com reset diário via server fn).
- Conquistas (`achievements`, `character_achievements`).
- Ranking (`/ranking` público, top por poder; view materializada refrescada por cron pg_cron chamando rota `/api/public/cron/refresh-rankings` com secret).
- Passe de temporada (trilha grátis/premium, tabela `season_pass_progress`).
- Notícias no admin + página pública `/noticias`.

---

## Etapa 5 — Social

- Guildas (`guilds`, `guild_members`, papéis dentro da guilda).
- Chat de guilda (Supabase Realtime).
- Party e raid cooperativa assíncrona (fila de participação, boss compartilhado com HP acumulado).
- **PvP em tempo real fica fora** — só assíncrono neste plano.

---

## Segurança (transversal)
- Zod em todo `inputValidator` de server fn e em toda rota `/api/public/*`.
- Rate limiting básico em `startExpedition`, `createOrder`, login (tabela `rate_limits` + server fn helper).
- `admin_audit_logs` para toda ação administrativa que modifique estado.
- Nenhum cálculo de recompensa/preço no cliente.
- HIBP habilitado em auth (`configure_auth` com `password_hibp_enabled: true`).

## Detalhes técnicos (referência)
- Rotas seguem convenção TanStack: `_authenticated/jogo.expedicao.tsx`, `_authenticated/_admin/admin.jogadores.tsx`, etc.
- Server fns em `src/lib/*.functions.ts`; helpers `.server.ts` para privilegiado; `supabaseAdmin` importado dinamicamente dentro do handler.
- Google OAuth via `lovable.auth.signInWithOAuth('google', ...)` quando adicionado (Etapa 1 pode ser só email/senha se preferir — confirmar).
- Server fns críticas (`claimExpedition`, `grantOrder`) usam RPC Postgres com transação para atomicidade.

## Entrega desta iteração
Vou implementar **apenas a Etapa 1** agora. Ao terminar, reporto: tabelas criadas, políticas RLS aplicadas, server fns criadas, o que ainda é simulado, variáveis de ambiente necessárias, e como testar antes de publicar. Depois disso você pede a Etapa 2.

## Próxima decisão sua (antes de eu construir)
1. Confirma iniciar pela **Etapa 1 completa** (landing + auth + banco + admin básico), sem tocar em `/jogo/*` ainda?
2. Etapa 1 com Google OAuth ativo desde já, ou só email/senha por enquanto?
