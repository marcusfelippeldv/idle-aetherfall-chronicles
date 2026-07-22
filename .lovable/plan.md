# Ícones + Itens por Arquétipo

Hoje todo item aparece só como texto e serve para qualquer classe. Vamos (1) dar um ícone visual a cada item e (2) criar armas/off-hands dedicadas para cada um dos 5 arquétipos, com restrição de uso.

## 1. Schema

Migração em `items`:
- `icon_url text` — URL do CDN (`/__l5e/assets-v1/...`) do ícone.
- `allowed_archetypes text[]` default `'{}'` — vazio = qualquer arquétipo pode usar; caso contrário só slugs listados.

Trigger `tg_validate_equipment` ganha checagem extra: ao equipar, se `allowed_archetypes` não estiver vazio, o arquétipo do herói precisa estar na lista — senão levanta exceção.

## 2. Ícones (assets CDN)

Geramos PNGs 512×512 estilo "game icon", fundo transparente, e subimos via `lovable-assets`. Para manter custo e tempo controlados, um ícone por **família** e a raridade é indicada pela borda/badge já existente (`RarityBadge`), não por sprite diferente.

Famílias planejadas (~22 ícones):
- Armas por arquétipo: espada longa (Guardião), arco astral (Arqueiro), cajado arcano (Arcanista), orbe vidente (Vidente), manoplas (Punho).
- Off-hand por arquétipo: escudo torre, aljava, tomo, totem, faixa de combate.
- Armaduras genéricas: elmo, peitoral, grevas, botas (4 ícones).
- Acessórios: amuleto, anel (2 ícones).
- Consumíveis/materiais: poção vermelha, poção azul, fragmento de éter, cristal (4 ícones).

Cada `.asset.json` fica em `src/assets/items/` e é referenciado por slug nos seeds.

## 3. Arsenal por arquétipo

Para cada arquétipo criamos linha completa de **arma + off-hand** nas 6 raridades (comum → mítico), com `allowed_archetypes = ['<slug>']`:

| Arquétipo | Arma | Off-hand |
|---|---|---|
| Guardião | Espada de Vigília | Escudo Torre |
| Arqueiro Astral | Arco Sideral | Aljava Estelar |
| Arcanista | Cajado Rúnico | Tomo Arcano |
| Vidente | Orbe do Presságio | Totem Vidente |
| Punho da Aurora | Manoplas da Aurora | Faixa de Combate |

Bônus escalam com raridade seguindo o padrão atual (atk/def/hp/mana/vel). Preço de compra/venda também escala.

As armas genéricas atuais ("Lâmina Rústico", "Escudo Rústico" etc.) viram itens **universais** (allowed vazio) — servem de fallback e loot inicial. Armaduras, acessórios, consumíveis permanecem universais.

## 4. Loja, inventário, herói

- Loja (`jogo.loja.tsx`): renderiza `icon_url` no card; filtro extra "Para meu arquétipo" oculta itens de outras classes.
- Inventário (`jogo.inventario.tsx`): substitui o placeholder de emoji pela imagem; itens travados por arquétipo mostram tag "Exclusivo: <arquétipo>" e botão Equipar desativado.
- Herói (`jogo.heroi.tsx`): silhueta dos slots mostra o ícone do item equipado; modal de troca lista só o que o arquétipo pode usar.
- Feedback de drop na Arena: passa a exibir o ícone junto do nome.
- `RarityBadge` continua responsável pela borda/tint colorido em volta da imagem.

## 5. Ordem de execução

1. Migração (`icon_url`, `allowed_archetypes`, trigger).
2. Gerar os ~22 PNGs (`imagegen`) e subir com `lovable-assets`.
3. Migração de seed: atualizar itens existentes com `icon_url` e inserir os 60 novos itens por arquétipo (5 × 2 slots × 6 raridades).
4. Atualizar `shop.functions.ts` / `inventory.functions.ts` para retornar/filtrar por arquétipo.
5. Atualizar UIs de Loja, Inventário, Herói e Arena com o novo campo `icon_url`.

## Detalhes técnicos

- `imagegen` roda em `fast` com `transparent_background=true`, prompt "game item icon, <descrição>, painted, glowing, on a solid white background".
- Trigger só valida no momento de equipar; itens no inventário de arquétipo diferente ficam guardados (útil para trade futuro).
- Nenhuma alteração em combate/incursão — drops continuam com pool universal + pool específico do arquétipo do herói dono da incursão (bias no `claimIncursion` para preferir itens compatíveis quando o drop for de arma/off-hand).
