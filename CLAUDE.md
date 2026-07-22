# CLAUDE.md

## Aetherfall Chronicles – Guia Essencial

RPG idle (browser) em **TanStack Start + React 19 + TypeScript + Supabase**, criado via [Lovable](https://lovable.dev) e sincronizado bidirecional com o editor Lovable.

- Branch de produção: `main` | Branch de desenvolvimento: `desenv`
- Projeto conectado ao Lovable: **NUNCA reescrever histórico já pushado** (force push, rebase, amend, squash) — quebra o histórico do lado do Lovable (ver `AGENTS.md`).

## Princípios

- Comunicação técnica e objetiva.
- Discordar quando necessário.
- Planejar com passos concretos (sem estimar prazos).
- **Simplicity First**: cada mudança o mais simples possível, tocando o mínimo de código.
- **No Laziness**: achar a causa raiz, sem fix temporário — padrão de dev sênior.
- **Minimal Impact**: mexer só no necessário, evitando introduzir bugs.

## Comandos

```bash
bun install            # dependências (bun.lock é o lockfile — não usar npm/yarn)
bun run dev            # vite dev server
bun run build          # build de produção
bun run build:dev      # build em modo development
bun run lint           # eslint
bun run format         # prettier --write

# NUNCA: git push --force / rebase / amend em commit já pushado (projeto Lovable)
# NUNCA: editar src/routeTree.gen.ts (auto-gerado pelo TanStack Router)
```

Não há framework de testes configurado ainda. Se lógica de jogo nova precisar de teste (ex.: motor de combate), sugerir **vitest** antes de instalar qualquer coisa.

## Arquitetura

```
src/
├── routes/                     # File-based routing (TanStack Start) — ver src/routes/README.md
│   ├── __root.tsx              # shell do app (preservar <Outlet />)
│   └── _authenticated/         # rotas protegidas (jogo.*, criar-heroi)
├── lib/
│   ├── *.functions.ts          # Server Functions (createServerFn) — fronteira client↔server
│   ├── *.server.ts             # lógica server-only pura (ex.: combat.server.ts = motor de combate)
│   ├── combat/                 # types e defaults do combate
│   └── game/                   # helpers de domínio (raridade etc.)
├── integrations/supabase/      # clients, auth-middleware, types.ts (GERADO — não editar à mão)
├── components/
│   ├── ui/                     # shadcn/ui — não customizar direto, compor por cima
│   ├── game/ arena/ admin/     # componentes de domínio
│   └── ...
├── hooks/                      # use-session, use-mobile
└── assets/                     # imagens de classes e itens
supabase/migrations/            # migrations SQL (timestamp_uuid.sql)
```

## Padrões

### Server Functions (`src/lib/*.functions.ts`)

- Toda operação client↔server passa por `createServerFn` — nunca chamar Supabase com service key no client.
- Rota autenticada: `.middleware([requireSupabaseAuth])` → handler recebe `context.supabase` (client do usuário, respeita RLS) e `context.userId`.
- Input sempre validado com **zod** via `.inputValidator((data) => schema.parse(data))`.
- Lógica pesada/pura vive em `*.server.ts` e é importada com `await import("./x.server")` dentro do handler (mantém fora do bundle client).
- Erros: `throw new Error(mensagem)` com mensagem em pt-BR voltada ao jogador quando fizer sentido.
- Leitura pública (sem auth): client via `publicClient()` com `SUPABASE_PUBLISHABLE_KEY`.

### Rotas (`src/routes/`)

- File-based routing — as convenções completas estão em `src/routes/README.md`. **NÃO criar** `src/pages/`, `app/layout.tsx` ou padrões Next.js/Remix.
- `routeTree.gen.ts` é auto-gerado — nunca editar.
- Nomes de rota em pt-BR kebab-case (`criar-heroi`, `recuperar-senha`); telas do jogo como filhas de `jogo.` (`jogo.combate.tsx`, `jogo.loja.tsx`).
- Rotas protegidas vão dentro de `_authenticated/`.

### Frontend

- UI base: **shadcn/ui + Radix + Tailwind CSS 4** (`tw-animate-css`, `tailwind-merge`, `cva`). Componentes de `components/ui/` são vendorizados — compor, não reescrever.
- Estado de servidor: **@tanstack/react-query**. Formulários: **react-hook-form + zod**. Toasts: **sonner**. Animações: **framer-motion**.
- Ícones: **lucide-react**. Classes CSS condicionais: `cn()` de `src/lib/utils.ts`.
- Texto de UI em **português (pt-BR)** — o jogo é em português.

### Convenções

- TypeScript: `camelCase` para variáveis/funções, `PascalCase` para componentes/types.
- Banco (Postgres/Supabase): `snake_case` em tabelas e colunas; converter para camelCase na fronteira do server function.
- `vite.config.ts`: o preset `@lovable.dev/vite-tanstack-config` já inclui os plugins todos — **não adicionar de novo** (duplicar quebra o app; ver comentário no próprio arquivo).

## Tecnologias

- **Runtime/tooling**: Bun, Vite 8, TypeScript 5.8, ESLint 9 + Prettier
- **App**: TanStack Start (SSR) + TanStack Router + React 19 + React Query + Tailwind 4 + shadcn/Radix
- **Backend**: Supabase (Postgres + Auth + RLS), server functions do TanStack Start, deploy Nitro (target cloudflare)

## Banco de Dados (Supabase)

- Schema versionado em `supabase/migrations/*.sql` — **nunca alterar o banco manualmente** fora de migration.
- Migration já aplicada/pushada é **imutável** — mudança nova = migration nova.
- Toda tabela com dados de jogador tem **RLS**; policies fazem parte da migration que cria a tabela.
- `src/integrations/supabase/types.ts` é gerado a partir do schema — regenerar após migration, não editar à mão.
- **O assistente NUNCA edita `.env`** — só documenta as variáveis necessárias (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, ...).

## Segurança

- Auth via Supabase (cookies/sessão — `use-session.ts`, `auth-middleware.ts`).
- Nada de secret/service key em código client — validação e escrita sensível sempre em server function.
- Regras de jogo que dão recompensa (loot, XP, ouro, compra) rodam **no servidor** — nunca confiar em valores calculados no client.

## Git & PR

- Branch dedicada por feature: `feature/{nomeDaFeature}` a partir de `desenv`. Cada fase do plano = um commit atômico (`Fase X: descrição`).
- Push é feito pelo usuário após validação — assistente **NÃO faz push**.
- **Force push proibido** (projeto Lovable). Sem amend em commit já enviado.
- PR: base `desenv`, build e lint OK.

## Regras Absolutas

- **VOCÊ NUNCA PODE EXECUTAR UM COMMIT OU UM PR NAS BRANCHS `main` e `desenv`** — nas outras branches, apenas quando solicitado.
- Nunca reescrever histórico já pushado (Lovable).
- Nunca editar `routeTree.gen.ts` nem `integrations/supabase/types.ts` à mão.
- Nunca alterar o banco fora de migration; migration aplicada é imutável.
- Nunca colocar lógica de recompensa/validação de jogo no client.
- Nunca editar `.env`.

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Tarefas extensas — pasta dedicada no Obsidian

Antes de começar, avalie o tamanho/complexidade da tarefa. Se for **extensa** ou com **potencial de crescer** (múltiplos módulos, várias etapas, decisões de arquitetura, múltiplas sessões), **pare e sugira ao usuário** criar uma pasta dedicada no Obsidian antes de prosseguir.

Sinais de tarefa extensa:
- Toca mais de 3-4 camadas distintas (migration + types + server function + rota + componentes)
- Envolve nova entidade de jogo, novo sistema ou novo fluxo (ex.: guildas, PvP, eventos)
- Requer migration não-trivial (alteração de tipo, backfill, FK nova, mudança de RLS)
- Tem decisões de arquitetura em aberto (ex.: calcular no client vs server, realtime vs polling)
- Provavelmente vai exigir mais de uma sessão para concluir

Quando identificar, sugira no formato:
> "Essa tarefa parece extensa (motivo). Sugiro criarmos `Obsidian Aetherfall/<nome-da-implementacao>/` com um `CLAUDE.md` interno para consolidar regras, objetivos e contexto. Tudo bem?"

Após aprovação, criar:
- `Obsidian Aetherfall/<nome-da-implementacao>/` (kebab-case ou nome descritivo)
- `Obsidian Aetherfall/<nome-da-implementacao>/CLAUDE.md` com seções: **Objetivo**, **Escopo**, **Regras específicas**, **Decisões tomadas**, **Pendências/Dúvidas**, **Referências** (arquivos, issues, PRs)

Esse `CLAUDE.md` interno vira a fonte de verdade da tarefa — consultar e atualizar ao longo das sessões. Não duplicar conteúdo do CLAUDE.md raiz; apenas regras/contexto específicos da tarefa.
