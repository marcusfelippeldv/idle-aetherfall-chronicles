## 1) Criação de herói em `/jogo/novo`

O que já foi feito antes: policies de `INSERT/UPDATE/DELETE` por `auth.uid()` foram adicionadas em `characters` (e demais tabelas do jogador), e o `UNIQUE` global de `characters.name` virou `UNIQUE (user_id, name)`. Confirmei no banco que as policies estão ativas.

O que ainda pode estar travando (a investigar em build):

- Nos logs do worker da última hora não aparece nenhum `POST /_serverFn/...` para `createCharacter` — só GETs (listagem de classes, perfil, etc.). Ou o clique em "Iniciar jornada" não está disparando, ou o botão fica desabilitado, ou o POST está falhando antes de chegar ao servidor.
- O site publicado (`idle.alphoracubo.com`) pode estar rodando um build anterior; a correção anterior mexeu em código + banco, e sem republish o binário no ar pode não bater com o esquema atual.

Plano de execução:

1. Abrir `/jogo/novo` no preview com Playwright autenticado, escolher classe, preencher nome, clicar "Iniciar jornada" e capturar:
   - screenshot do estado final,
   - console/network para ver a resposta do `createCharacter` (status + corpo),
   - toast de erro, se houver.
2. Diagnosticar a partir do sinal real:
   - Se o POST nunca sai → problema de UI/estado (ex.: `classId` não sendo setado, botão preso em `disabled`, mutation não montada). Corrigir em `src/routes/_authenticated/jogo.novo.tsx`.
   - Se o POST volta com erro de RLS/permissão → checar `requireSupabaseAuth` e o bearer sendo anexado em `src/start.ts` (a sessão do usuário precisa chegar como `Authorization: Bearer <jwt>`).
   - Se volta erro de FK/campo (ex.: `class_id` inválido) → ajustar o handler em `src/lib/character.functions.ts`.
   - Se o erro só ocorre em produção → orientar republish após o fix.
3. Aplicar o fix mínimo que a causa apontar (sem migração nova, a menos que o sinal exija). Rodar o fluxo de novo no preview para confirmar que o herói é criado e a rota redireciona para `/jogo/arena`.

## 2) Favicon Aetherfall Online

Hoje `public/favicon.ico` é o favicon padrão do Lovable. Vou substituir por uma marca própria do jogo.

Passos:

1. Gerar `public/favicon.png` com o `imagegen` (modelo `premium`, fundo transparente, 512×512) — marca simbólica em dourado/roxo alinhada ao design system (ex.: cristal/asa estilizada, sem texto, leitura limpa em 16–32 px).
2. Atualizar `src/routes/__root.tsx` para referenciar `/favicon.png` (`type: "image/png"`) no lugar de `/favicon.ico`.
3. Remover o arquivo padrão `public/favicon.ico` para não servir o ícone antigo para crawlers que ignoram o `<link>`.

## Verificação final

- Preview: `/jogo/novo` cria herói e redireciona para `/jogo/arena` (screenshot).
- Aba do navegador mostra o novo favicon (screenshot do preview em desktop).
- Aviso ao usuário: o favicon só aparece no domínio publicado depois de republicar, e previews sociais têm cache próprio.
