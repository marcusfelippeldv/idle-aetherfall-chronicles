import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// Deterministic PRNG (mulberry32) for daily quest selection.
function seededPick<T>(items: T[], count: number, seed: number): T[] {
  let s = seed >>> 0;
  const rng = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const getDailyQuests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const date = todayUtc();
    const sb = context.supabase;

    let { data: quests } = await sb
      .from("daily_quests")
      .select("id, template_id, progress, target, claimed_at, quest_date, daily_quest_templates(slug, title, description, goal_type, reward_gold, reward_xp, reward_season_xp)")
      .eq("user_id", context.userId)
      .eq("quest_date", date);

    if (!quests || quests.length === 0) {
      const { data: templates } = await sb
        .from("daily_quest_templates")
        .select("id, target")
        .eq("active", true);
      if (templates && templates.length > 0) {
        const seed = hashString(context.userId + date);
        const picked = seededPick(templates as any[], Math.min(3, templates.length), seed);
        const rows = picked.map((t: any) => ({
          user_id: context.userId,
          template_id: t.id,
          target: t.target,
          quest_date: date,
        }));
        await sb.from("daily_quests").upsert(rows, { onConflict: "user_id,template_id,quest_date" });
        const refetch = await sb
          .from("daily_quests")
          .select("id, template_id, progress, target, claimed_at, quest_date, daily_quest_templates(slug, title, description, goal_type, reward_gold, reward_xp, reward_season_xp)")
          .eq("user_id", context.userId)
          .eq("quest_date", date);
        quests = refetch.data;
      }
    }

    return { quests: quests ?? [], date };
  });

export const claimDailyQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { questId: string }) =>
    z.object({ questId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: quest } = await sb
      .from("daily_quests")
      .select("id, progress, target, claimed_at, template_id, daily_quest_templates(reward_gold, reward_xp, reward_season_xp, title)")
      .eq("id", data.questId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!quest) throw new Error("Missão não encontrada.");
    if (quest.claimed_at) throw new Error("Missão já resgatada.");
    if (quest.progress < quest.target) throw new Error("Missão ainda não concluída.");

    const tpl = quest.daily_quest_templates as any;
    const rewardGold = Number(tpl?.reward_gold ?? 0);
    const rewardXp = Number(tpl?.reward_xp ?? 0);
    const rewardSeasonXp = Number(tpl?.reward_season_xp ?? 0);

    await sb.from("daily_quests").update({ claimed_at: new Date().toISOString() }).eq("id", quest.id);

    if (rewardGold > 0) {
      const { data: wallet } = await sb.from("wallets").select("gold_balance").eq("user_id", context.userId).maybeSingle();
      const newBalance = Number(wallet?.gold_balance ?? 0) + rewardGold;
      await sb.from("wallets").update({ gold_balance: newBalance }).eq("user_id", context.userId);
      await sb.from("currency_transactions").insert({
        user_id: context.userId,
        currency_type: "gold",
        transaction_kind: "credit",
        amount: rewardGold,
        balance_before: newBalance - rewardGold,
        balance_after: newBalance,
        source_type: "daily_quest",
        source_id: quest.id,
        description: `Missão diária: ${tpl?.title ?? ""}`,
      });
    }

    if (rewardXp > 0) {
      const { data: character } = await sb
        .from("characters")
        .select("id, level, current_xp, class_id, max_hp, attack, defense, speed, classes(slug)")
        .eq("user_id", context.userId)
        .eq("is_active", true)
        .maybeSingle();
      if (character) {
        const { applyXp, growthFor } = await import("@/lib/game/formulas.server");
        const leveled = applyXp({
          currentLevel: character.level,
          currentXp: Number(character.current_xp),
          gainedXp: rewardXp,
          growth: growthFor((character.classes as any)?.slug ?? ""),
          baseHp: character.max_hp,
          baseAtk: character.attack,
          baseDef: character.defense,
          baseSpeed: character.speed,
        });
        await sb.from("characters").update({
          level: leveled.level,
          current_xp: leveled.xp,
          max_hp: leveled.hp,
          attack: leveled.attack,
          defense: leveled.defense,
          speed: leveled.speed,
          power: leveled.attack + leveled.defense + leveled.speed,
        }).eq("id", character.id);
      }
    }

    if (rewardSeasonXp > 0) {
      const { addSeasonXp } = await import("@/lib/progression.server");
      await addSeasonXp(sb, context.userId, rewardSeasonXp);
    }

    return { ok: true, rewardGold, rewardXp, rewardSeasonXp };
  });
