## Etapa 2 (final) — Prioridades, Iniciativa e Combate

Fecha a Etapa 2 do ciclo Eternal Shards: cada herói ganha uma lista de prioridades (regras de IA idle), o motor de combate por iniciativa entra em cena, e uma nova aba **Combate** permite testar a party contra inimigos das regiões iniciais.

### 1. Editor de prioridades (por herói)

- Nova aba **Prioridades** em `/jogo/prioridades` listando os 4 heróis da party.
- Para cada herói, uma lista ordenada (drag-to-reorder simples via botões ↑/↓) de regras do tipo:
  - `{ ability: "basic" | "skill_1" | "skill_2" | "awakening" | "defend", target: "lowest_hp_ally" | "lowest_hp_enemy" | "highest_atk_enemy" | "self" | "random_enemy", condition?: "hp<50%" | "mana>=cost" | "awakening_ready" | "always" }`
- Persistência: coluna `heroes.priorities jsonb` já existe — grava via nova server fn `updateHeroPriorities`.
- Um botão "Restaurar padrão" gera prioridades sensatas por role da classe (tanque defende quando HP<40%, suporte cura menor HP, DPS ataca maior ameaça, etc.).

### 2. Motor de combate por iniciativa

- Novo módulo `src/lib/combat.server.ts` (server-only, importado só por functions):
  - Turnos ordenados por `spd` decrescente com desempate por posição.
  - Aplica dano com fórmula `max(1, atk * mult - def * 0.5)`, com multiplicador por elemento consultando `element_matchups`.
  - Consome mana das habilidades, acumula `awakening_energy` (+10 por ação, +25 ao receber dano; dispara quando ≥100).
  - Executa a primeira regra de prioridade cujo `condition` for verdadeiro; fallback = ataque básico no inimigo com menor HP.
  - Retorna um `CombatLog` estruturado: `{ turn, actor, ability, targets, damage, healing, status, snapshot }[]` + `outcome: "victory" | "defeat"` + recompensas.
- Server fn `simulateFight({ stageSlug })`:
  - Middleware `requireSupabaseAuth`.
  - Lê party + heróis do usuário, lê `stages` + `enemies` da região correspondente.
  - Roda o combate e devolve o log (sem persistir mudanças ainda — expedições persistentes ficam para a Etapa 3).

### 3. Tela de Combate

- Nova aba **Combate** em `/jogo/combate`:
  - Seletor de região → estágio (dropdown alimentado por `regions` + `stages`).
  - Botão "Iniciar combate" chama `simulateFight`.
  - Renderiza o `CombatLog` com animação turno-a-turno reaproveitando `CombatStage` existente (adaptado para 4v1..3): barras de HP/MP animadas, floaters de dano, destaque do herói ativo.
  - Painel lateral com resultado (vitória/derrota) e recompensas simuladas.

### 4. Ajustes menores

- `jogo.tsx`: adicionar abas **Prioridades** e **Combate**.
- `createProtagonist`: já inicializa `priorities: []` — passar a gerar defaults por role no mesmo insert, para o jogador ter algo utilizável de cara.
- Botão "Restaurar padrão" reaproveita a mesma função em `src/lib/combat/defaults.ts` (client-safe).

### Detalhes técnicos

- Server functions ficam em `src/lib/hero.functions.ts` (`updateHeroPriorities`) e novo `src/lib/combat.functions.ts` (`simulateFight`, `listStages`), todas com `requireSupabaseAuth`.
- `combat.server.ts` fica fora do grafo do cliente (sufixo `.server.ts` bloqueia import client-side).
- Nenhuma alteração de schema — todas as colunas necessárias (`priorities`, `awakening_energy`, `element_matchups`, `stages`, `enemies`) já existem.
- Tipos de log/prioridade centralizados em `src/lib/combat/types.ts` para reuso client + server.

### Fora do escopo desta etapa

- Persistência de expedições idle contínuas, drops reais no inventário, XP/level-up pós-combate → Etapa 3 (Economia + Progressão).
- Habilidades customizadas por herói além do conjunto base da classe → Etapa 4.
