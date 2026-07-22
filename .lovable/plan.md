
# Loja, Inventário Ativo e Equipamento do Herói

Vamos entregar o loop "matar → dropar → equipar → vender/comprar" que dá valor de mercado aos itens.

## 1. Catálogo de itens (seed)

Ampliar `public.items` com ~40 itens cobrindo todos os slots (`arma`, `elmo`, `peito`, `pernas`, `pes`, `amuleto`, `anel`, `ofmao`, `consumivel`, `material`) em todas as raridades (`comum` → `mitico`). Escala de bônus por tier + raridade:

```text
comum      x1.0    incomum   x1.4    raro      x2.0
epico      x3.0    lendario  x4.5    mitico    x6.5
```

Preços na loja: só `comum`/`incomum` disponíveis para compra direta; raridades altas só via drop ou revenda entre jogadores (fase futura). Todo item ganha `sell_price` (metade do `gold_value`).

Schema pequeno via migração:
- `items`: adicionar `sell_price int not null default 0`, `buyable boolean not null default false`.
- `characters`: adicionar colunas de slot equipado (`equipped_arma`, `equipped_elmo`, ... `equipped_anel`) como `uuid null` referenciando `inventory(id)` com `on delete set null`. Assim o "equipar" é atômico e a mesma linha de inventário só pode estar num slot.
- Índice único parcial garantindo que cada `inventory.id` só apareça uma vez entre os slots do herói (via trigger de validação).

## 2. Drops na Incursão

Em `claimIncursion`:
- Roll determinístico por onda usando o PRNG já existente (`seed = incursion.id + wave`).
- Tabela de loot por zona (tier 1: comum 70% / incomum 25% / raro 5%; tier 2 sobe; boss da onda 10 sempre dropa 1 item ≥ raro).
- Cria linhas em `inventory` e devolve resumo `{ gold, xp, drops: [{name, rarity, slot}] }` para exibir no modal de resgate.

## 3. Server functions novas

`src/lib/shop.functions.ts`:
- `listShop()` — itens `buyable=true` agrupados por slot.
- `buyItem({ itemId, quantity })` — debita ouro em `wallets`, insere em `inventory` (com bypass RLS via `supabaseAdmin` após checar `auth.uid()`).
- `sellItem({ inventoryId, quantity })` — desequipa se necessário, decrementa/remove linha, credita `sell_price`.

`src/lib/inventory.functions.ts`:
- `listInventory()` — join `inventory` + `items`, marca `equippedSlot`.
- `equipItem({ inventoryId })` — valida slot compatível com o item, desequipa o anterior, grava `characters.equipped_<slot>`.
- `unequipItem({ slot })`.

Todas usam `requireSupabaseAuth`; escritas críticas usam `supabaseAdmin` após validação do `userId`.

## 4. UI

- `src/routes/_authenticated/jogo.loja.tsx` (nova aba "Loja"): grid por categoria, badge de raridade colorida, preço em ouro, botão Comprar.
- `src/routes/_authenticated/jogo.inventario.tsx` (reescrita): grid com filtros por slot/raridade, ações Equipar / Desequipar / Vender. Item equipado destacado.
- `src/routes/_authenticated/jogo.heroi.tsx` (nova aba "Herói"): silhueta com 8 slots ao redor (arma, ofmao, elmo, peito, pernas, pes, amuleto, anel). Clicar num slot abre modal com itens compatíveis do inventário. Mostra atributos totais (base + equipamentos).
- Sub-header de `jogo.tsx`: adicionar "Herói" e "Loja" às tabs.
- Componente `RarityBadge` reutilizável com cores: cinza / verde / azul / roxo / dourado / vermelho-cristal.
- Modal de resgate da Incursão passa a listar drops com raridade.

## 5. Cálculo de atributos

Helper `computeCharacterStats(character, equippedItems)` usado tanto no cliente (exibição) quanto no servidor (combate/incursão) — soma bônus dos itens equipados aos atributos base. `formulas.server.ts` (arquivo do PRNG que já existe em `src/lib/game`) é atualizado para receber stats efetivos.

## Detalhes técnicos

- Migração única: adiciona colunas, GRANTs mantidos, políticas RLS existentes cobrem (inventory já é `auth.uid() = user_id`).
- Seed de itens via `INSERT` na mesma migração (dados determinísticos).
- Trigger `validate_equip_slots` em `characters` garante integridade: o `inventory.id` referenciado pertence ao mesmo `user_id` e o `items.slot` bate com a coluna.
- Enum `item_slot` já existe; não muda.
- Sem mudança nas telas Bastião/Coorte/Ranking.

## Ordem de execução

1. Migração (colunas + trigger + seed de itens + `sell_price`/`buyable`).
2. Server functions (shop, inventory) + atualização de `incursion.functions.ts` para drops.
3. Componente `RarityBadge` + helper de stats.
4. Rotas `jogo.loja.tsx`, `jogo.heroi.tsx`, reescrita de `jogo.inventario.tsx`.
5. Atualizar tabs em `jogo.tsx` e modal de resgate em `jogo.arena.tsx`.
