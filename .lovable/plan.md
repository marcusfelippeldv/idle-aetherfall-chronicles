# Restaurar menus do jogo e a cena de combate animada

## Diagnóstico

Durante o "Reboot" para o novo schema (arquétipos, coortes, incursões), duas coisas se perderam:

1. **Menus internos do jogo**: as rotas `loja`, `carteira`, `chat`, `guilda`, `raides`, `diario`, `conquistas`, `temporada` foram apagadas. O header só mostra `Início / Roadmap / Ranking / Painel`, e o Bastião (`/jogo`) só linka pra `criar-heroi` e `arena`.
2. **Batalha animada (herói vs monstro)**: `src/components/arena/CombatStage.tsx` e `PatrolScene.tsx` ainda existem, mas a nova `jogo.arena.tsx` foi reescrita para mostrar apenas cronômetro + barra de progresso, sem invocar essas cenas.

## O que este plano faz

Foco só em **UI/apresentação** — sem mexer em schema nem lógica de servidor. Restaurar o que sumiu, adaptando ao novo modelo (Incursão + Ondas 1–10).

### 1. Cena de combate animada na Incursão

Na `src/routes/_authenticated/jogo.arena.tsx`, quando houver `incursion` ativa (status `em_andamento`):

- Renderizar `<PatrolScene />` como fundo em paralaxe da zona escolhida.
- Sobrepor `<CombatStage />` mostrando o herói (sprite baseado no arquétipo) vs o inimigo da onda atual (derivado de `zone_waves` + `enemies`).
- Derivar a **onda atual** a partir do tempo decorrido / duração total (`ondaAtual = floor(progresso * 10) + 1`), puramente client-side — sem novas queries.
- Manter HP simulado do herói e do mob com `AnimatedNumber`, floaters de dano periódicos (tick a cada ~1.5s), e "morte" do mob ao virar a onda, avançando para o próximo sprite.
- Quando `status = concluida`, trocar a cena por um painel de "Vitória — reclamar recompensas" (o `claim` atual continua funcionando).
- Quando `status = null` (sem incursão), manter o seletor de zonas atual.

Ajustes necessários nos componentes existentes (só props/typings):
- `sprites.tsx`: mapear os 5 arquétipos novos (`guardiao`, `arqueiro_astral`, `arcanista`, `vidente`, `punho_aurora`) para sprites — reaproveitar os existentes por role (`tank/dps/support/healer`).
- `CombatStage.tsx` / `PatrolScene.tsx`: aceitar `zoneSlug` e `archetypeSlug` como entrada.

Pequena server function opcional (só leitura, sem novo schema): `listZoneWaves(zoneId)` para saber quais mobs aparecem em cada onda e mostrar o sprite/nome certo. Sem isso, cai num placeholder genérico "Inimigo da Onda N".

### 2. Menus do jogo (Bastião)

Repor uma navegação clara dentro de `/jogo`. Duas partes:

**a) Sub-header com abas** dentro do layout `src/routes/_authenticated/jogo.tsx` (que hoje é só `<Outlet />`). Abas visíveis:
- Incursão (`/jogo/arena`)
- Carteira (`/jogo/carteira`) — já existe
- Coorte (`/jogo/coorte`) — nova, placeholder listando membros da `cohorts` do herói
- Inventário (`/jogo/inventario`) — nova, placeholder lendo `inventory`
- Ranking (`/jogo/ranking` ou reaproveita `/ranking`)

**b) Dropdown "Jogar" no `site-header.tsx`** (quando logado) com os mesmos links, para acesso rápido de qualquer página.

As rotas novas (`coorte`, `inventario`) entram como **placeholders funcionais** — listam dados do herói atual (via `getMyCharacter` já existente ou uma leitura simples nova) e explicitam "em construção" para os sistemas ainda não portados (loja, guildas, chat, raides, diário, conquistas, temporada). Sem reconstruir a lógica desses sistemas nesta iteração — eles foram removidos junto com o schema antigo e voltarão em ciclos próprios.

### 3. Bastião (`jogo.index.tsx`)

Adicionar cards de atalho para as mesmas abas (Incursão / Coorte / Inventário / Carteira / Ranking / Admin), com o herói ativo em destaque no topo. Sem mudar dados carregados.

## Fora de escopo (fica pra ciclos seguintes)

- Reconstruir loja, guildas, chat, raides, diário, conquistas, temporada sobre o novo schema — cada um é um sistema próprio.
- Novos sprites/arte por arquétipo — reaproveitar os existentes.
- Sons/música.

## Ordem de execução

1. Ajustar `sprites.tsx` para os novos arquétipos.
2. Reescrever `jogo.arena.tsx` para embutir `PatrolScene` + `CombatStage` durante a incursão.
3. Converter `jogo.tsx` num layout com sub-header de abas.
4. Criar `jogo.coorte.tsx` e `jogo.inventario.tsx` (placeholders com dados reais).
5. Adicionar dropdown "Jogar" no `site-header.tsx`.
6. Refrescar `jogo.index.tsx` com cards de atalho.

Confirma que posso seguir com esse escopo (menus + animação de combate, sem reconstruir loja/guilda/etc)?