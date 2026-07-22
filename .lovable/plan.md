# Etapa 2 — Jogo Funcional (Aetherfall Online)

Com a fundação pronta (auth, RLS, admin, landing), agora vamos transformar o projeto num jogo idle jogável de verdade. O objetivo desta etapa é: o jogador cria um herói, escolhe uma classe, envia o herói em expedições que rodam em tempo real, ganha XP/ouro/itens e gerencia o inventário — tudo com cálculos no servidor para impedir trapaça.

## O que o jogador vai poder fazer ao final

1. Criar 1 herói (nome + classe) a partir do painel.
2. Ver a ficha do herói: nível, XP, HP, ATK, DEF, ouro, cristais, equipamento.
3. Escolher uma região desbloqueada e iniciar uma expedição idle (duração 1–30 min).
4. Ver a expedição rodando em tempo real (barra de progresso, tempo restante).
5. Coletar a recompensa ao terminar: XP, ouro, drops de itens (com raridade).
6. Subir de nível automaticamente, com ganho de atributos por classe.
7. Abrir o inventário, equipar/desequipar itens, ver bônus aplicados.
8. Enfrentar chefe da região ao atingir nível mínimo (combate automático resolvido no servidor com log turno-a-turno).
9. Desbloquear próxima região ao vencer o chefe.

## Estrutura de rotas nova

```text
src/routes/_authenticated/
  play.tsx                  # hub do jogo (lista heróis, botão criar)
  play.new.tsx              # criação de herói
  play.$characterId.tsx     # layout do herói (sidebar com ficha + Outlet)
  play.$characterId.index.tsx        # visão geral / expedição ativa
  play.$characterId.expeditions.tsx  # escolher região e iniciar
  play.$characterId.inventory.tsx    # inventário e equipamento
  play.$characterId.combat.$expeditionId.tsx  # log de combate contra chefe
```

O `/dashboard` atual passa a ter um card "Jogar" que leva para `/play`.

## Lógica de servidor (tudo em server functions autenticadas)

Nada de cálculo no cliente. Toda mutação passa por `createServerFn` com `requireSupabaseAuth` e valida ownership via RLS + checagem explícita de `character.user_id === userId`.

- `createCharacter({ name, classId })` — 1 herói por conta nesta etapa; valida nome único do usuário.
- `getCharacter(characterId)` — ficha completa + equipamento + expedição ativa.
- `startExpedition({ characterId, regionId })` — valida nível mínimo da região, cria linha em `expeditions` com `started_at`, `ends_at`, `status='running'`, seed de RNG. Impede iniciar se já houver uma expedição ativa.
- `claimExpedition({ expeditionId })` — só resolve se `now() >= ends_at`. Calcula recompensas no servidor a partir do seed + tabelas de drop, aplica XP/level up, insere `inventory_items`, credita ouro em `wallets`, grava `currency_transactions`, marca expedição `completed`.
- `cancelExpedition({ expeditionId })` — encerra sem recompensa.
- `equipItem({ characterId, inventoryItemId })` / `unequipSlot({ characterId, slot })` — valida slot compatível e requisitos.
- `fightBoss({ characterId, regionId })` — combate determinístico (seed) turno-a-turno, retorna log; em vitória, desbloqueia próxima região no `characters.unlocked_regions`.

Fórmulas ficam num módulo `src/lib/game/formulas.server.ts` (XP por nível, dano = ATK - DEF/2 com variação, chance de drop por raridade, ganho de atributos por classe). Regras chatas de trapaça (velocidade, ouro infinito, item duplicado) morrem no servidor porque o cliente nunca envia números — só ids.

## Schema — pequenos ajustes

Tabelas já existem. Vamos precisar de:

- `characters`: adicionar `unlocked_regions uuid[]` (default com a região inicial) e `active_expedition_id uuid null`.
- `expeditions`: adicionar `rng_seed bigint` e `rewards jsonb` (preenchido ao claim, para replay/auditoria).
- `items`: garantir colunas `slot` (weapon/armor/accessory), `atk_bonus`, `def_bonus`, `hp_bonus`, `level_req`.
- `inventory_items`: adicionar `equipped boolean default false`.
- Nova tabela `combat_logs` (id, character_id, expedition_id/boss_region_id, turns jsonb, result, created_at) com RLS "dono do personagem lê".

Toda migração segue o padrão obrigatório: CREATE → GRANT → ENABLE RLS → POLICY, e triggers de `updated_at` onde aplicável.

## UI / UX

- Tema já definido (escuro, azul/roxo/dourado). Usar cards com bordas suaves, ícones lucide, badges de raridade coloridos (comum/incomum/raro/épico/lendário).
- Barra de progresso da expedição atualizada via `setInterval` no cliente apenas para o timer visual; a verdade vem do servidor no claim.
- Toasts em pt-BR para eventos ("Você subiu para o nível 5!", "Item lendário obtido: Lâmina do Crepúsculo").
- Log de combate estilo terminal com animação de linha por linha.
- Loading states com skeletons; erros amigáveis.

## Segurança / anti-cheat

- RLS mantém jogador só vendo o próprio; catálogo (classes, regiões, inimigos, items, products) permanece leitura pública para `anon`+`authenticated`.
- Server functions rejeitam qualquer expedition/character que não pertença ao `userId` do middleware.
- `claimExpedition` é idempotente: se `status != 'running'`, retorna o resultado já gravado.
- Sem `supabaseAdmin` — tudo passa pelo cliente autenticado com RLS.

## Fora do escopo desta etapa (vai para Etapas 3–5)

- Loja com dinheiro real / integração de pagamentos.
- Missões diárias, conquistas, ranking, passe.
- Guildas, chat, raids.
- Múltiplos heróis por conta, respec de classe, prestige.

## Ordem de implementação

1. Migração de ajustes de schema + `combat_logs`.
2. Módulo `src/lib/game/formulas.server.ts` + testes rápidos das fórmulas.
3. Server functions (`character.functions.ts`, `expedition.functions.ts`, `inventory.functions.ts`, `combat.functions.ts`).
4. Rotas `_authenticated/play*` com queries via TanStack Query.
5. Componentes de UI (CharacterSheet, ExpeditionCard, InventoryGrid, CombatLog, RegionPicker).
6. Ligar o `/dashboard` ao `/play` e ajustar header.
7. Verificação: criar conta de teste via Playwright, criar herói, rodar expedição curta (setar duração de teste), reclamar, equipar item, lutar contra chefe.

Depois desta etapa o jogo já é jogável de ponta a ponta em loop idle. As Etapas 3–5 entram em planos separados quando você quiser avançar.
