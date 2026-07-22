
## Contexto verificado agora

- Banco: 2 usuários, 2 perfis, **0 heróis**, 1 admin (`marcusfelippeldv@gmail.com` / `stronda`).
- RLS de `characters` está OK: `INSERT WITH CHECK (auth.uid() = user_id)`, `SELECT` já permite admin via `has_role`.
- Nas correções anteriores nenhum `POST` para `createCharacter` chegou ao worker — ou seja, o clique não estava disparando a chamada. Ainda não reproduzi autenticado. **Diagnóstico não confirmado**; a Etapa 1 deste plano é reproduzir de verdade antes de "consertar às cegas".

## Etapa 1 — Reproduzir e consertar `/jogo/novo`

1. Rodar Playwright autenticado como o admin (`stronda`), abrir `/jogo/novo`, escolher classe, digitar nome, clicar "Iniciar jornada", capturar: request `POST createCharacter`, resposta, toast, console.
2. Corrigir a causa real revelada pelo passo 1. Hipóteses prováveis, em ordem:
   - **Bearer não anexado** para essa fn específica (middleware/ordem em `src/start.ts`). Fix: garantir attach.
   - **Erro validação Zod** silencioso (regex do nome bloqueando caractere). Fix: mensagem + regex.
   - **Bug de UI**: `disabled` travado, ou classe não selecionada por algum motivo. Fix: estado + feedback.
   - **`handle_new_user`** não rodou para conta antiga (falta profile/wallet). Fix: backfill dos 2 usuários existentes.
3. Validar via Playwright que o herói aparece em `characters` e que a arena carrega.

## Etapa 2 — Rede de segurança para o admin ("acesso a tudo")

Não é "logar como", é poder operar em qualquer conta a partir do painel admin. Server functions com `assertAdmin` + `supabaseAdmin` + registro em `admin_audit_logs`:

- `adminCreateCharacter({ target_user_id, name, class_id })` — cria herói para qualquer conta (útil agora para desbloquear jogadores).
- `adminListCharacters({ search })` — lista heróis com dono, nível, poder, status.
- `adminEditCharacter({ character_id, patch })` — ajustar level/xp/hp/atributos/is_active.
- `adminDeleteCharacter({ character_id })` — remover herói travado.
- `adminAdjustWallet({ target_user_id, gold_delta, premium_delta, reason })` — crédito/débito com transação em `currency_transactions`.
- `adminGrantItem({ target_user_id, item_id, qty })` — dropar item no inventário.
- `adminResetCooldowns({ target_user_id })` — zera `last_combat` e cancela expedição/raid ativas.
- `adminGrantRole/adminRevokeRole({ target_user_id, role })` — promover/rebaixar admin/moderador.
- `adminAuditLog({ limit })` — leitura do audit trail.

## Etapa 3 — Painéis administrativos

Expandir `src/routes/_authenticated/_admin/`:

- `admin.jogadores.tsx` (já existe): adicionar ações por linha — **Criar herói**, **Ver heróis**, **Ajustar carteira**, **Conceder item**, **Resetar cooldowns**, **Promover/Rebaixar**, **Suspender/Banir** (já existe).
- `admin.herois.tsx` (novo): tabela global de heróis com filtros; editar/deletar inline.
- `admin.economia.tsx` (novo): form de ajuste de carteira + concessão de item + lista das últimas transações.
- `admin.auditoria.tsx` (novo): leitura de `admin_audit_logs` (quem fez o quê, quando, justificativa).

Todas as mutações admin exigem campo **justificativa** (>=5 chars) e vão para o audit log — mesmo padrão do `setAccountStatus` atual.

## Etapa 4 — Ação imediata para desbloquear jogadores

Depois que a Etapa 3 estiver no ar, você (admin) consegue criar heróis para `haliwi@hotmail.com` e para si mesmo direto pelo painel, sem depender do fluxo `/jogo/novo` estar 100%.

## Detalhes técnicos

- Todas as fns novas: `createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])`, `assertAdmin(context.userId)`, `await import("@/integrations/supabase/client.server")` dentro do handler, `z.parse` na entrada, `insert` em `admin_audit_logs` no fim.
- Nada de service-role em rota/loader; nada de service-role para checar admin (usa `supabaseAdmin` só depois do `assertAdmin`, que já é o padrão do arquivo).
- UI só em `pt-BR`, seguindo tokens do design system existente. Sem hardcode de cor.
- Nenhuma alteração em RLS é necessária (admin opera via service-role no servidor). Não vou mexer em policies a não ser que a Etapa 1 revele necessidade.
- SEO: cada rota nova recebe `head()` com `title`/`description` próprios e `robots: noindex`.

## Fora de escopo

- Trocar auth/login, pagamentos, novas mecânicas de jogo, mudanças visuais no jogo. Só admin + fix da criação de herói.
