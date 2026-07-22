
## Objetivo

Substituir o placeholder atual de `src/routes/index.tsx` por uma landing completa em pt-BR na direção **Éter Nobre — cards portrait**, mantendo paleta, tipografia e layout aprovados.

## Escopo

Arquivo tocado: `src/routes/index.tsx` (reescrita completa) + acréscimo de tokens no `src/styles.css`. Sem alterações de backend, banco, rotas ou header/footer globais.

## Seções da nova página

1. **Hero cinematográfico** — pattern radial (roxo → azul-noite) + grão sutil, título "AETHERFALL" em Syne dourado com halo, subtítulo do ciclo Eternal Shards, dois CTAs: `Criar conta` → `/cadastro` (roxo com faixa inferior mais escura) e `Entrar` → `/login` (contorno roxo).
2. **Arquétipos jogáveis (6)** — grid 3×2 de cards em `aspect-[3/4]` com retrato de cada classe (importando `src/assets/classes/{guardiao,espadachim,arqueiro,arcanista,vidente,punho}.jpg`), gradiente inferior escuro, nome em Syne + tagline em roxo caps. Hover: borda roxa acesa.
3. **Pilares do mundo (5)** — cards numerados 01–05: Party de 4, IA por Prioridades, Incursões Regionais, Chefes Mundiais, Economia & Raridade.
4. **Roadmap — Eternal Shards** — timeline vertical alinhada aos marcos reais entregues: Fase 1 (Fundação — classes, party) concluída, Fase 2 (Combate & Prioridades) concluída, Fase 3 (Economia, Missões, Social) em curso, Fase 4 (PvP & Guildas ativas) próxima.
5. **CTA final + rodapé leve** — chamada "Sua party aguarda" com botão `Criar conta`, seguida de linha discreta com copyright.

## Design tokens

Adicionar em `src/styles.css` (`:root` + `@theme inline`) os quatro hex da paleta Éter Nobre como tokens semânticos:
- `--aether-night: #0B1024`
- `--aether-violet-deep: #1B1147`
- `--aether-violet: #6A3DF5`
- `--aether-gold: #F4C15A`

Mapear para utilitários (`bg-aether-*`, `text-aether-*`, `border-aether-*`) e usar em vez de hex inline. Fontes Syne e Plus Jakarta Sans já carregam via `__root.tsx` — apenas verificar; caso falte, incluir o `<link>` no head do root (fora do escopo se já presente).

## Metadata

Manter/atualizar `head()` do route: título "Aetherfall Online — RPG idle épico", description curta em pt-BR, `og:title`, `og:description`, `og:type=website`, `twitter:card=summary_large_image`. Sem `og:image` até haver uma arte fixa.

## Animações

Somente CSS/Tailwind: transições de hover nos cards de classes e pilares, `drop-shadow` pulsando levemente no título via keyframe em `styles.css`. Nada de framer-motion nesta página para manter leve.

## Fora de escopo

- Redesign do header/footer, das rotas de autenticação ou do dashboard `/jogo`.
- Novas artes: reaproveitar retratos existentes das 6 classes.
- Backend: nenhuma migração ou server function nesta iteração.

## Verificação

Após implementar: `bunx tsgo --noEmit` e captura Playwright em `/` (viewport 1280×1800) para validar o hero, o grid dos 6 arquétipos, os 5 pilares e a timeline.
