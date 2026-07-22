import type { PriorityRule } from "./types";

export function defaultPrioritiesForRole(role: string): PriorityRule[] {
  switch (role) {
    case "tanque":
      return [
        { ability: "defend", target: "self", condition: "hp_below_25" },
        { ability: "skill_1", target: "lowest_hp_ally", condition: "mana_ok" },
        { ability: "awakening", target: "highest_atk_enemy", condition: "awakening_ready" },
        { ability: "skill_2", target: "highest_atk_enemy", condition: "mana_ok" },
        { ability: "basic", target: "highest_atk_enemy", condition: "always" },
      ];
    case "suporte":
      return [
        { ability: "skill_1", target: "lowest_hp_ally", condition: "mana_ok" },
        { ability: "awakening", target: "lowest_hp_enemy", condition: "awakening_ready" },
        { ability: "skill_2", target: "highest_atk_enemy", condition: "mana_ok" },
        { ability: "basic", target: "lowest_hp_enemy", condition: "always" },
      ];
    case "magico":
      return [
        { ability: "awakening", target: "highest_atk_enemy", condition: "awakening_ready" },
        { ability: "skill_1", target: "lowest_hp_enemy", condition: "mana_ok" },
        { ability: "skill_2", target: "highest_atk_enemy", condition: "mana_ok" },
        { ability: "basic", target: "lowest_hp_enemy", condition: "always" },
      ];
    case "assassino":
      return [
        { ability: "awakening", target: "lowest_hp_enemy", condition: "awakening_ready" },
        { ability: "skill_1", target: "lowest_hp_enemy", condition: "mana_ok" },
        { ability: "skill_2", target: "self", condition: "hp_below_50" },
        { ability: "basic", target: "lowest_hp_enemy", condition: "always" },
      ];
    case "fisico":
    case "lancista":
    default:
      return [
        { ability: "awakening", target: "highest_atk_enemy", condition: "awakening_ready" },
        { ability: "skill_1", target: "highest_atk_enemy", condition: "mana_ok" },
        { ability: "skill_2", target: "random_enemy", condition: "mana_ok" },
        { ability: "basic", target: "lowest_hp_enemy", condition: "always" },
      ];
  }
}

export const ABILITY_LABELS: Record<string, string> = {
  basic: "Ataque básico",
  skill_1: "Habilidade 1",
  skill_2: "Habilidade 2",
  awakening: "Despertar",
  defend: "Defender",
};

export const TARGET_LABELS: Record<string, string> = {
  lowest_hp_ally: "Aliado mais ferido",
  lowest_hp_enemy: "Inimigo mais ferido",
  highest_atk_enemy: "Inimigo mais forte",
  self: "Si mesmo",
  random_enemy: "Inimigo aleatório",
};

export const CONDITION_LABELS: Record<string, string> = {
  always: "Sempre",
  hp_below_50: "HP < 50%",
  hp_below_25: "HP < 25%",
  mana_ok: "Mana suficiente",
  awakening_ready: "Despertar pronto",
};
