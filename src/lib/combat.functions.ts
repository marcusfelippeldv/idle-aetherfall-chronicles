import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PriorityRule } from "./combat/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listStages = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [regionsRes, stagesRes] = await Promise.all([
    supabase.from("regions").select("slug, name, chapter, description, recommended_level, sort_order").order("sort_order"),
    supabase.from("stages").select("id, region_slug, stage_number, is_boss, enemy_pool, boss_slug").order("stage_number"),
  ]);
  if (regionsRes.error) throw new Error(regionsRes.error.message);
  if (stagesRes.error) throw new Error(stagesRes.error.message);
  return { regions: regionsRes.data ?? [], stages: stagesRes.data ?? [] };
});

const simulateSchema = z.object({ stageId: z.string().uuid() });

export const simulateFight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => simulateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { simulate } = await import("./combat.server");

    const { data: party, error: pErr } = await context.supabase
      .from("parties")
      .select("slot1, slot2, slot3, slot4")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!party) throw new Error("Party não encontrada.");

    const slotIds = [party.slot1, party.slot2, party.slot3, party.slot4].filter((x): x is string => !!x);
    if (slotIds.length === 0) throw new Error("Sua equipe está vazia.");

    const { data: heroesRaw, error: hErr } = await context.supabase
      .from("heroes")
      .select("id, name, class_slug, element, hp, mana, atk, def, spd, awakening_energy, priorities")
      .in("id", slotIds);
    if (hErr) throw new Error(hErr.message);
    const byId = new Map(heroesRaw?.map((h) => [h.id, h]) ?? []);
    const heroesInput = slotIds
      .map((id) => byId.get(id))
      .filter((h): h is NonNullable<typeof h> => !!h)
      .map((h) => ({
        id: h.id,
        name: h.name,
        classSlug: h.class_slug,
        element: h.element,
        hp: h.hp,
        mana: h.mana,
        atk: h.atk,
        def: h.def,
        spd: h.spd,
        awakening: h.awakening_energy ?? 0,
        priorities: (Array.isArray(h.priorities) ? (h.priorities as unknown as PriorityRule[]) : []),
      }));

    const supabase = publicClient();
    const { data: stage, error: sErr } = await supabase
      .from("stages")
      .select("id, region_slug, stage_number, is_boss, enemy_pool, boss_slug")
      .eq("id", data.stageId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!stage) throw new Error("Estágio não encontrado.");

    const enemySlugs: string[] = stage.is_boss && stage.boss_slug
      ? [stage.boss_slug]
      : (stage.enemy_pool ?? []).slice(0, 3);
    if (enemySlugs.length === 0) throw new Error("Estágio sem inimigos.");

    const { data: enemiesRaw, error: eErr } = await supabase
      .from("enemies")
      .select("slug, name, element, is_boss, hp, atk, def, spd, xp_reward, gold_reward")
      .in("slug", enemySlugs);
    if (eErr) throw new Error(eErr.message);
    const enemyBySlug = new Map(enemiesRaw?.map((e) => [e.slug, e]) ?? []);
    const enemiesInput = enemySlugs
      .map((s) => enemyBySlug.get(s))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .map((e) => ({
        slug: e.slug,
        name: e.name,
        element: e.element,
        hp: e.hp,
        atk: e.atk,
        def: e.def,
        spd: e.spd,
        isBoss: e.is_boss,
        xpReward: e.xp_reward,
        goldReward: e.gold_reward,
      }));

    const classSlugs = Array.from(new Set(heroesInput.map((h) => h.classSlug)));
    const { data: abilitiesRaw } = await supabase
      .from("abilities")
      .select("slug, name, class_slug, kind, element, mana_cost, power, target")
      .in("class_slug", classSlugs);
    const abilitiesByClass = new Map<string, Awaited<ReturnType<typeof import("./combat.server").simulate>> extends never ? never : never>() as unknown as Map<string, import("./combat.server").AbilityDef[]>;
    for (const a of abilitiesRaw ?? []) {
      const list = abilitiesByClass.get(a.class_slug) ?? [];
      list.push({
        slug: a.slug,
        classSlug: a.class_slug,
        kind: a.slug.endsWith("_s1") ? "skill_1" : a.slug.endsWith("_s2") ? "skill_2" : "skill_1",
        element: a.element,
        manaCost: a.mana_cost,
        power: Number(a.power),
        target: a.target as import("./combat/types").TargetKind,
        name: a.name,
      });
      abilitiesByClass.set(a.class_slug, list);
    }

    const { data: matchupsRaw } = await supabase.from("element_matchups").select("attacker, defender, multiplier");
    const matchups = new Map<string, number>();
    for (const m of matchupsRaw ?? []) matchups.set(`${m.attacker}>${m.defender}`, Number(m.multiplier));

    return simulate(heroesInput, enemiesInput, abilitiesByClass, matchups);
  });
