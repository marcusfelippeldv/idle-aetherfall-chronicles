# Etapa 6 — Arena Animada

Hoje o combate contra chefe e as expedições retornam apenas um log de texto. Esta etapa transforma esses momentos em cenas animadas para o jogador **ver** o herói lutando, os inimigos caindo e as recompensas pingando — sem mudar nenhuma regra de servidor (as fórmulas continuam autoritativas).

## O que muda para o jogador

1. **Cena de batalha contra chefe** (`/jogo/arena` → aba Combate)
   - Ao clicar em "Enfrentar chefe", em vez de um log de texto surge um palco animado: herói à esquerda, chefe à direita, barras de HP grandes no topo.
   - Os turnos do log retornado pelo servidor são reproduzidos em sequência (~450 ms por turno): o atacante avança, o defensor tremula, número de dano voa (vermelho, ou dourado gigante em CRÍTICO), a barra de HP desce animada.
   - Ao final: flash de vitória com raios dourados + chuva de XP/ouro, ou tela de derrota em tom carmesim. Botão "Rever combate" e "Lutar novamente".
   - O log textual antigo fica disponível recolhido em "Ver detalhes".

2. **Patrulha idle animada** (aba Expedições, card de expedição ativa)
   - Silhueta do herói caminhando (loop de bob vertical) sobre um cenário paralaxe da região (3 camadas com velocidades diferentes).
   - Inimigos aparecem da direita a cada X segundos (proporcional ao tempo total), recebem um "swoosh" de ataque, somem em partículas e um contador "+1 abate" incrementa.
   - Pop-ups flutuantes de drops raros (com cor por raridade) quando o timer cruza marcos.
   - Barra de progresso substituída por trilha com marcadores de recompensa.

3. **Micro-animações globais**
   - HP/XP nos headers com transição suave (tween de números).
   - Cintilação sutil em botões primários prontos para ação (colheita disponível, chefe ao alcance).
   - Toast de vitória com confete dourado curto.

## Arquitetura técnica

**Sem migração de banco. Sem novas server functions.** Toda a lógica visual mora no cliente e consome os dados que já existem (`character.last_combat.turns`, `expedition.expected_end_at`, `region.name`).

### Novos arquivos
- `src/components/arena/CombatStage.tsx` — palco de combate. Props: `log` (o `last_combat`), `onReplay`. Usa `framer-motion` (já não instalado — adicionar) para animar sprites, dano flutuante, shake e barras. Máquina de estados por turno com `useEffect` + timers, respeitando `prefers-reduced-motion`.
- `src/components/arena/HpBar.tsx` — barra estilizada com gradiente por facção e tween de largura.
- `src/components/arena/FloatingNumber.tsx` — número de dano/cura que sobe e some.
- `src/components/arena/PatrolScene.tsx` — cenário paralaxe da expedição. Recebe `region.slug` e `progress` (0-1) e reproduz loop de andar + spawn de inimigos determinístico por seed local (para ser suave, não precisa bater com servidor).
- `src/components/arena/CharacterSprite.tsx` — silhueta SVG por classe (Guardião, Arcanista, Caçador, Clérigo, Duelista) com pose idle/attack/hurt. SVGs inline, coloridos com tokens do design system.
- `src/components/arena/EnemySprite.tsx` — silhueta SVG genérica com variação por `region.slug` (florestal, deserto, arcano, etc.).
- `src/components/arena/VictoryBurst.tsx` — flash de raios + partículas douradas (SVG + motion), 1.2 s.
- `src/components/ui/animated-number.tsx` — hook + componente para tween de números (usado em HP, ouro, XP nos headers).

### Arquivos alterados
- `src/routes/_authenticated/jogo.arena.tsx`
  - `BossPanel`: substituir o card "Log de combate" pelo `<CombatStage log={log} />`. Quando não há log, mostrar cartaz do chefe com arte pulsando ("Pronto para o duelo").
  - `ActiveExpeditionCard`: envolver o topo do card com `<PatrolScene region={region} progress={progress} />` (altura ~180 px), mantendo a barra de progresso e o botão de colheita abaixo.
  - `HeroHeader`: trocar leitura direta de HP/ouro/cristais por `<AnimatedNumber />`.
- `src/styles.css` — adicionar keyframes `arena-shake`, `arena-float-up`, `arena-parallax-scroll` e tokens `--rarity-common/uncommon/rare/epic/legendary` (se ainda não existirem).

### Dependências novas
- `framer-motion` (peer-friendly com React 19, ~50 kB gzip). Usado apenas nos componentes acima.

### Acessibilidade e performance
- Todo componente animado respeita `useReducedMotion()`: modo reduzido salta direto ao estado final (log estático + resultado).
- Sem `backdropFilter`; blurs pesados evitados.
- Animações desmontam ao trocar de aba (cleanup dos timers).
- Sprites são SVG inline (< 4 kB cada), sem requisições extras.

## Fora do escopo desta etapa
- Ilustrações realistas / arte gerada por IA (usaremos silhuetas SVG estilizadas alinhadas ao design system).
- Animações no chat, guilda, raides (podem virar Etapa 7 se quiser).
- Trilha sonora / SFX de combate.
- Mudanças em fórmulas, drops ou balanceamento.

## Checklist de entrega
1. Instalar `framer-motion`.
2. Criar os 7 componentes em `src/components/arena/` + `AnimatedNumber`.
3. Adicionar keyframes/tokens em `src/styles.css`.
4. Refatorar `BossPanel`, `ActiveExpeditionCard` e `HeroHeader`.
5. Testar: combate vitorioso, combate derrotado, expedição em andamento, modo `prefers-reduced-motion`.
6. `tsgo --noEmit` limpo.
