// Server-only game math. Never import from client code.

export function xpForNextLevel(level: number): number {
  return Math.round(50 * Math.pow(level, 1.8));
}

export function totalXpAtLevel(level: number): number {
  let sum = 0;
  for (let i = 1; i < level; i++) sum += xpForNextLevel(i);
  return sum;
}

export type ClassGrowth = {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

const GROWTH: Record<string, ClassGrowth> = {
  guardiao: { hp: 22, attack: 3, defense: 5, speed: 1 },
  arcanista: { hp: 10, attack: 6, defense: 2, speed: 3 },
  cacador: { hp: 14, attack: 5, defense: 3, speed: 5 },
  clerigo: { hp: 18, attack: 3, defense: 4, speed: 3 },
  duelista: { hp: 14, attack: 5, defense: 3, speed: 6 },
};

export function growthFor(classSlug: string): ClassGrowth {
  return GROWTH[classSlug] ?? { hp: 15, attack: 4, defense: 3, speed: 3 };
}

/** mulberry32 PRNG — deterministic given a seed. */
export function makeRng(seed: number) {
  let a = (seed >>> 0) || 1;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Chance de drop por raridade (base). Ajustável por dificuldade. */
export const DROP_CHANCE: Record<string, number> = {
  common: 0.45,
  uncommon: 0.22,
  rare: 0.09,
  epic: 0.03,
  legendary: 0.008,
};

/** Aplica XP acumulado e devolve novo nível + atributos base atualizados. */
export function applyXp(params: {
  currentLevel: number;
  currentXp: number;
  gainedXp: number;
  growth: ClassGrowth;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpeed: number;
}) {
  let level = params.currentLevel;
  let xp = params.currentXp + params.gainedXp;
  let leveledUp = false;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
    leveledUp = true;
  }
  const gainedLevels = level - params.currentLevel;
  return {
    level,
    xp,
    leveledUp,
    hp: params.baseHp + params.growth.hp * gainedLevels,
    attack: params.baseAtk + params.growth.attack * gainedLevels,
    defense: params.baseDef + params.growth.defense * gainedLevels,
    speed: params.baseSpeed + params.growth.speed * gainedLevels,
  };
}

/** Combate turno-a-turno determinístico. */
export type CombatUnit = {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
};

export type CombatTurn = {
  actor: "hero" | "enemy";
  damage: number;
  targetHpAfter: number;
  crit: boolean;
};

export function simulateCombat(
  hero: CombatUnit,
  enemy: CombatUnit,
  seed: number,
): { winner: "hero" | "enemy"; turns: CombatTurn[]; heroHpAfter: number } {
  const rng = makeRng(seed);
  const turns: CombatTurn[] = [];
  const h = { ...hero };
  const e = { ...enemy };
  let heroTurn = h.speed >= e.speed;
  let safety = 0;
  while (h.hp > 0 && e.hp > 0 && safety++ < 200) {
    if (heroTurn) {
      const crit = rng() < 0.1;
      const base = Math.max(1, h.attack - Math.floor(e.defense / 2));
      const variance = 0.85 + rng() * 0.3;
      const dmg = Math.max(1, Math.round(base * variance * (crit ? 1.75 : 1)));
      e.hp = Math.max(0, e.hp - dmg);
      turns.push({ actor: "hero", damage: dmg, targetHpAfter: e.hp, crit });
    } else {
      const crit = rng() < 0.05;
      const base = Math.max(1, e.attack - Math.floor(h.defense / 2));
      const variance = 0.85 + rng() * 0.3;
      const dmg = Math.max(1, Math.round(base * variance * (crit ? 1.5 : 1)));
      h.hp = Math.max(0, h.hp - dmg);
      turns.push({ actor: "enemy", damage: dmg, targetHpAfter: h.hp, crit });
    }
    heroTurn = !heroTurn;
  }
  return {
    winner: h.hp > 0 ? "hero" : "enemy",
    turns,
    heroHpAfter: h.hp,
  };
}
