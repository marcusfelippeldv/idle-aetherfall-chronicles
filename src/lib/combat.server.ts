import type {
  AbilitySlug,
  CombatEvent,
  CombatResult,
  CombatSnapshot,
  ConditionKind,
  PriorityRule,
  TargetKind,
} from "./combat/types";

export type HeroInput = {
  id: string;
  name: string;
  classSlug: string;
  element: string;
  hp: number;
  mana: number;
  atk: number;
  def: number;
  spd: number;
  awakening: number;
  priorities: PriorityRule[];
};

export type EnemyInput = {
  slug: string;
  name: string;
  element: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  isBoss: boolean;
  xpReward: number;
  goldReward: number;
};

export type AbilityDef = {
  slug: string; // e.g. "guardiao_s1" or "basic"
  classSlug: string | null;
  kind: AbilitySlug;
  element: string;
  manaCost: number;
  power: number;
  target: TargetKind;
  name: string;
};

type Combatant = {
  side: "hero" | "enemy";
  index: number;
  name: string;
  element: string;
  classSlug?: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  atk: number;
  def: number;
  spd: number;
  awakening: number;
  defending: boolean;
  priorities: PriorityRule[];
  abilities: Record<AbilitySlug, AbilityDef | null>;
};

const MAX_TURNS = 200;

export function simulate(
  heroesIn: HeroInput[],
  enemiesIn: EnemyInput[],
  abilitiesByClass: Map<string, AbilityDef[]>,
  matchups: Map<string, number>,
): CombatResult {
  const heroes: Combatant[] = heroesIn.map((h, i) => {
    const abList = abilitiesByClass.get(h.classSlug) ?? [];
    return {
      side: "hero",
      index: i,
      name: h.name,
      element: h.element,
      classSlug: h.classSlug,
      hp: h.hp,
      maxHp: h.hp,
      mana: h.mana,
      maxMana: h.mana,
      atk: h.atk,
      def: h.def,
      spd: h.spd,
      awakening: h.awakening,
      defending: false,
      priorities: h.priorities?.length ? h.priorities : [{ ability: "basic", target: "lowest_hp_enemy", condition: "always" }],
      abilities: buildAbilities(h.classSlug, h.element, abList),
    };
  });

  const enemies: Combatant[] = enemiesIn.map((e, i) => ({
    side: "enemy",
    index: i,
    name: e.name,
    element: e.element,
    hp: e.hp,
    maxHp: e.hp,
    mana: 0,
    maxMana: 0,
    atk: e.atk,
    def: e.def,
    spd: e.spd,
    awakening: 0,
    defending: false,
    priorities: [{ ability: "basic", target: "lowest_hp_enemy", condition: "always" }],
    abilities: {
      basic: { slug: "basic", classSlug: null, kind: "basic", element: e.element, manaCost: 0, power: 1, target: "lowest_hp_enemy", name: "Investida" },
      skill_1: null,
      skill_2: null,
      awakening: null,
      defend: { slug: "defend", classSlug: null, kind: "defend", element: "neutro", manaCost: 0, power: 0, target: "self", name: "Defender" },
    },
  }));

  const events: CombatEvent[] = [];
  let turn = 0;

  while (turn < MAX_TURNS && anyAlive(heroes) && anyAlive(enemies)) {
    const order = [...heroes, ...enemies]
      .filter((c) => c.hp > 0)
      .sort((a, b) => b.spd - a.spd || (a.side === "hero" ? -1 : 1));

    for (const actor of order) {
      if (actor.hp <= 0) continue;
      if (!anyAlive(heroes) || !anyAlive(enemies)) break;
      actor.defending = false;

      const enemiesOf = actor.side === "hero" ? enemies : heroes;
      const alliesOf = actor.side === "hero" ? heroes : enemies;

      const choice = pickAction(actor, enemiesOf, alliesOf);
      const targets = pickTargets(actor, choice.ability, choice.rule.target, enemiesOf, alliesOf);

      const evTargets: CombatEvent["targets"] = [];

      if (choice.ability.kind === "defend") {
        actor.defending = true;
        actor.awakening = Math.min(100, actor.awakening + 15);
      } else if (choice.ability.kind === "awakening") {
        actor.awakening = 0;
        for (const t of targets) {
          const dmg = computeDamage(actor, t, choice.ability.power * 2.2, choice.ability.element, matchups);
          applyDamage(t, dmg);
          evTargets.push({ side: t.side, index: t.index, name: t.name, damage: dmg, healing: 0, hpAfter: t.hp });
        }
      } else if (choice.ability.slug === "vidente_s1" || (choice.ability.kind === "skill" && choice.ability.target === "lowest_hp_ally" && choice.ability.slug.startsWith("guardiao"))) {
        // Healing / support fallback -> treat as heal
        if (choice.ability.slug === "vidente_s1") {
          for (const t of targets) {
            const heal = Math.round(actor.atk * choice.ability.power);
            t.hp = Math.min(t.maxHp, t.hp + heal);
            evTargets.push({ side: t.side, index: t.index, name: t.name, damage: 0, healing: heal, hpAfter: t.hp });
          }
          actor.mana = Math.max(0, actor.mana - choice.ability.manaCost);
          actor.awakening = Math.min(100, actor.awakening + 10);
        } else {
          // guardiao_s1: shield ally (small heal + defending flag)
          for (const t of targets) {
            const heal = Math.round(actor.atk * 0.5);
            t.hp = Math.min(t.maxHp, t.hp + heal);
            t.defending = true;
            evTargets.push({ side: t.side, index: t.index, name: t.name, damage: 0, healing: heal, hpAfter: t.hp });
          }
          actor.mana = Math.max(0, actor.mana - choice.ability.manaCost);
          actor.awakening = Math.min(100, actor.awakening + 10);
        }
      } else if (choice.ability.kind === "skill" && choice.ability.target === "self") {
        // Self buff: small heal + awakening gain
        actor.hp = Math.min(actor.maxHp, actor.hp + Math.round(actor.atk * choice.ability.power));
        actor.mana = Math.max(0, actor.mana - choice.ability.manaCost);
        actor.awakening = Math.min(100, actor.awakening + 20);
        evTargets.push({ side: actor.side, index: actor.index, name: actor.name, damage: 0, healing: Math.round(actor.atk * choice.ability.power), hpAfter: actor.hp });
      } else {
        // Damage skill or basic
        actor.mana = Math.max(0, actor.mana - choice.ability.manaCost);
        for (const t of targets) {
          const dmg = computeDamage(actor, t, choice.ability.power, choice.ability.element, matchups);
          applyDamage(t, dmg);
          evTargets.push({ side: t.side, index: t.index, name: t.name, damage: dmg, healing: 0, hpAfter: t.hp });
        }
        actor.awakening = Math.min(100, actor.awakening + 10);
      }

      events.push({
        turn: turn + 1,
        actor: { side: actor.side, index: actor.index, name: actor.name },
        ability: choice.ability.kind,
        abilityName: choice.ability.name,
        targets: evTargets,
        snapshot: snapshotAll(heroes, enemies),
      });

      if (!anyAlive(heroes) || !anyAlive(enemies)) break;
    }
    turn++;
  }

  const outcome = anyAlive(heroes) && !anyAlive(enemies) ? "victory" : "defeat";
  const rewardXp = outcome === "victory" ? enemiesIn.reduce((a, e) => a + e.xpReward, 0) : 0;
  const rewardGold = outcome === "victory" ? enemiesIn.reduce((a, e) => a + e.goldReward, 0) : 0;

  return {
    outcome,
    events,
    heroes: heroesIn.map((h) => ({ name: h.name, classSlug: h.classSlug, maxHp: h.hp, maxMana: h.mana })),
    enemies: enemiesIn.map((e) => ({ name: e.name, slug: e.slug, element: e.element, maxHp: e.hp, isBoss: e.isBoss })),
    rewardXp,
    rewardGold,
  };
}

function buildAbilities(classSlug: string, element: string, list: AbilityDef[]): Combatant["abilities"] {
  const s1 = list.find((a) => a.slug.endsWith("_s1")) ?? null;
  const s2 = list.find((a) => a.slug.endsWith("_s2")) ?? null;
  return {
    basic: { slug: "basic", classSlug, kind: "basic", element, manaCost: 0, power: 1, target: "lowest_hp_enemy", name: "Ataque básico" },
    skill_1: s1,
    skill_2: s2,
    awakening: { slug: "awakening", classSlug, kind: "awakening", element, manaCost: 0, power: 1.6, target: "highest_atk_enemy", name: "Despertar" },
    defend: { slug: "defend", classSlug, kind: "defend", element: "neutro", manaCost: 0, power: 0, target: "self", name: "Defender" },
  };
}

function pickAction(actor: Combatant, enemies: Combatant[], allies: Combatant[]): { ability: AbilityDef; rule: PriorityRule } {
  for (const rule of actor.priorities) {
    const ability = actor.abilities[rule.ability];
    if (!ability) continue;
    if (!checkCondition(actor, rule.condition, ability, enemies, allies)) continue;
    return { ability, rule };
  }
  return { ability: actor.abilities.basic!, rule: { ability: "basic", target: "lowest_hp_enemy", condition: "always" } };
}

function checkCondition(actor: Combatant, cond: ConditionKind, ability: AbilityDef, _enemies: Combatant[], _allies: Combatant[]): boolean {
  switch (cond) {
    case "always":
      return ability.manaCost <= actor.mana;
    case "mana_ok":
      return ability.manaCost <= actor.mana && ability.manaCost > 0;
    case "hp_below_50":
      return actor.hp / actor.maxHp < 0.5 && ability.manaCost <= actor.mana;
    case "hp_below_25":
      return actor.hp / actor.maxHp < 0.25;
    case "awakening_ready":
      return ability.kind === "awakening" && actor.awakening >= 100;
  }
}

function pickTargets(actor: Combatant, ability: AbilityDef, target: TargetKind, enemies: Combatant[], allies: Combatant[]): Combatant[] {
  const alive = (arr: Combatant[]) => arr.filter((c) => c.hp > 0);
  if (ability.kind === "defend" || target === "self") return [actor];
  const pool = target === "lowest_hp_ally" ? alive(allies) : alive(enemies);
  if (pool.length === 0) return [];
  switch (target) {
    case "lowest_hp_ally":
      return [pool.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]];
    case "lowest_hp_enemy":
      return [pool.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]];
    case "highest_atk_enemy":
      return [pool.slice().sort((a, b) => b.atk - a.atk)[0]];
    case "random_enemy":
      return [pool[Math.floor(Math.random() * pool.length)]];
    default:
      return [pool[0]];
  }
}

function computeDamage(actor: Combatant, target: Combatant, power: number, element: string, matchups: Map<string, number>): number {
  const mult = matchups.get(`${element}>${target.element}`) ?? 1;
  const raw = actor.atk * power * mult - target.def * 0.5;
  const dmg = Math.max(1, Math.round(target.defending ? raw * 0.5 : raw));
  return dmg;
}

function applyDamage(target: Combatant, dmg: number) {
  target.hp = Math.max(0, target.hp - dmg);
  target.awakening = Math.min(100, target.awakening + 20);
}

function anyAlive(arr: Combatant[]): boolean {
  return arr.some((c) => c.hp > 0);
}

function snapshotAll(heroes: Combatant[], enemies: Combatant[]): CombatSnapshot[] {
  const map = (c: Combatant): CombatSnapshot => ({
    side: c.side,
    index: c.index,
    name: c.name,
    hp: c.hp,
    maxHp: c.maxHp,
    mana: c.mana,
    maxMana: c.maxMana,
    awakening: c.awakening,
  });
  return [...heroes.map(map), ...enemies.map(map)];
}
