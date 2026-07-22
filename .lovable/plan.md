## Problema

Após criar o herói com sucesso, o usuário é jogado de volta para `/criar-heroi` em vez de ficar em `/jogo/arena`. O herói foi criado no banco (confirmado: "Stronda" existe com `is_active=true`).

**Causa raiz (confirmada por leitura de código + replay):** race entre `invalidateQueries` e `navigate`.

- Em `criar-heroi.tsx`, ao ter sucesso: `qc.invalidateQueries({ queryKey: ["me","character"] })` (assíncrono, mas sem await do refetch) → `navigate({ to: "/jogo/arena" })`.
- `/jogo` (index) e `/criar-heroi` já haviam populado o cache de `["me","character"]` com `{ character: null }`.
- Arena monta e faz `useQuery(["me","character"])` — como já existe valor em cache, `isLoading = false` e `data.character = null` imediatamente, disparando `<Navigate to="/criar-heroi" replace />` antes do refetch chegar.

## Correção

Uma única mudança pequena em `src/routes/_authenticated/criar-heroi.tsx`, no `onSuccess` da mutation:

1. Escrever o herói recém-criado direto no cache com `qc.setQueryData(["me","character"], ...)` usando o retorno de `createCharacter` (ou refazendo um `getMyCharacter` e aguardando).
2. Trocar `invalidateQueries` por `await qc.refetchQueries({ queryKey: ["me","character"] })` para garantir dado fresco antes de navegar.
3. Só então chamar `navigate({ to: "/jogo/arena" })`.

Defesa extra em `src/routes/_authenticated/jogo.arena.tsx`: só redirecionar para `/criar-heroi` quando `characterQ.isFetching === false` **e** `characterQ.isSuccess === true` **e** `character == null`. Isso evita o mesmo padrão de race em qualquer futuro caller.

Nenhuma mudança de backend, schema, RLS ou lógica de jogo — apenas sincronização de cache/estado no frontend.

## Validação

- Rodar Playwright: login → `/criar-heroi` → criar herói → confirmar URL final `/jogo/arena` com HUD do herói visível (não voltar para criação).
- Recarregar `/jogo/arena` diretamente e confirmar que continua carregando o herói.
