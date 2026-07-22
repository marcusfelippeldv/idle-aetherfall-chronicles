export type AbilitySlug = "basic" | "skill_1" | "skill_2" | "awakening" | "defend";

export type TargetKind =
  | "lowest_hp_ally"
  | "lowest_hp_enemy"
  | "highest_atk_enemy"
  | "self"
  | "random_enemy";

export type ConditionKind =
  | "always"
  | "hp_below_50"
  | "hp_below_25"
  | "mana_ok"
  | "awakening_ready";

export type PriorityRule = {
  ability: AbilitySlug;
  target: TargetKind;
  condition: ConditionKind;
};

export type CombatSide = "hero" | "enemy";

export type CombatSnapshot = {
  side: CombatSide;
  index: number;
  name: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  awakening: number;
};

export type CombatEvent = {
  turn: number;
  actor: { side: CombatSide; index: number; name: string };
  ability: AbilitySlug;
  abilityName: string;
  targets: { side: CombatSide; index: number; name: string; damage: number; healing: number; hpAfter: number }[];
  snapshot: CombatSnapshot[];
};

export type CombatOutcome = "victory" | "defeat";

export type CombatResult = {
  outcome: CombatOutcome;
  events: CombatEvent[];
  heroes: { name: string; classSlug: string; maxHp: number; maxMana: number }[];
  enemies: { name: string; slug: string; element: string; maxHp: number; isBoss: boolean }[];
  rewardXp: number;
  rewardGold: number;
};
