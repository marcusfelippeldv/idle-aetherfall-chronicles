import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ATTACK_COOLDOWN_MS = 5 * 60 * 1000; // 5 min

export const listActiveRaids = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("raids")
      .select(
        "id, status, starts_at, ends_at, current_hp, total_hp, raid_templates(name, slug, description, min_level, window_hours, reward_gold, reward_crystals, reward_xp)",
      )
      .in("status", ["active", "defeated"])
      .order("created_at", { ascending: true });
    return data ?? [];
  });

export const getRaidDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { raidId: string }) =>
    z.object({ raidId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const [{ data: raid }, { data: contribs }, { data: myContrib }] = await Promise.all([
      context.supabase
        .from("raids")
        .select(
          "id, status, starts_at, ends_at, current_hp, total_hp, raid_templates(name, description, min_level, reward_gold, reward_crystals, reward_xp)",
        )
        .eq("id", data.raidId)
        .maybeSingle(),
      context.supabase
        .from("raid_contributions")
        .select("user_id, damage, hits, last_hit_at, characters:character_id(name, classes(name))")
        .eq("raid_id", data.raidId)
        .order("damage", { ascending: false })
        .limit(20),
      context.supabase
        .from("raid_contributions")
        .select("damage, hits, last_hit_at")
        .eq("raid_id", data.raidId)
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    return { raid, contribs: contribs ?? [], my: myContrib };
  });

export const attackRaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { raidId: string }) =>
    z.object({ raidId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: character } = await context.supabase
      .from("characters")
      .select("id, name, level, attack, defense, speed, power")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) throw new Error("Nenhum herói ativo.");

    const { data: raid } = await context.supabase
      .from("raids")
      .select("id, status, ends_at, current_hp, raid_templates(min_level)")
      .eq("id", data.raidId)
      .maybeSingle();
    if (!raid) throw new Error("Raid não encontrada.");
    if (raid.status !== "active") throw new Error("Raid não está mais ativa.");
    if (new Date(raid.ends_at).getTime() < Date.now())
      throw new Error("A janela desta raid expirou.");
    const minLvl = (raid.raid_templates as any)?.min_level ?? 1;
    if (character.level < minLvl)
      throw new Error(`Nível ${minLvl} necessário para atacar esta raid.`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("raid_contributions")
      .select("id, damage, hits, last_hit_at")
      .eq("raid_id", raid.id)
      .eq("character_id", character.id)
      .maybeSingle();

    if (existing?.last_hit_at) {
      const remaining =
        ATTACK_COOLDOWN_MS - (Date.now() - new Date(existing.last_hit_at).getTime());
      if (remaining > 0) {
        throw new Error(
          `Aguarde ${Math.ceil(remaining / 1000)}s antes de atacar novamente.`,
        );
      }
    }

    // Cálculo de dano: base no poder + variação aleatória (25%)
    const roll = 0.75 + Math.random() * 0.5;
    const damage = Math.max(1, Math.floor(character.power * roll * 5));
    const newHp = Math.max(0, Number(raid.current_hp) - damage);

    await supabaseAdmin
      .from("raids")
      .update({ current_hp: newHp })
      .eq("id", raid.id);

    if (existing) {
      await supabaseAdmin
        .from("raid_contributions")
        .update({
          damage: Number(existing.damage) + damage,
          hits: existing.hits + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("raid_contributions").insert({
        raid_id: raid.id,
        user_id: context.userId,
        character_id: character.id,
        damage,
        hits: 1,
        last_hit_at: new Date().toISOString(),
      });
    }

    if (newHp <= 0) {
      const { settleRaidIfDefeated } = await import("@/lib/social.server");
      await settleRaidIfDefeated(supabaseAdmin, raid.id);
    }

    // Hooks de progresso: raid_hits contagem via achievements
    try {
      const { checkAchievements, addSeasonXp } = await import(
        "@/lib/progression.server"
      );
      await addSeasonXp(context.supabase, context.userId, 20);
      await checkAchievements(context.supabase, context.userId);
    } catch (e) {
      console.error("raid progression hooks", e);
    }

    return { damage, currentHp: newHp, defeated: newHp <= 0 };
  });

export const claimRaidRewards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rewards } = await context.supabase
      .from("raid_rewards")
      .select("id, raid_id, gold, crystals, xp, claimed_at")
      .eq("user_id", context.userId)
      .is("claimed_at", null);
    if (!rewards || rewards.length === 0) return { claimed: 0, gold: 0, crystals: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const totalGold = rewards.reduce((a, r) => a + Number(r.gold ?? 0), 0);
    const totalCrystals = rewards.reduce((a, r) => a + Number(r.crystals ?? 0), 0);

    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("gold_balance, premium_balance")
      .eq("user_id", context.userId)
      .maybeSingle();
    const goldBefore = Number(wallet?.gold_balance ?? 0);
    const premBefore = Number(wallet?.premium_balance ?? 0);
    const goldAfter = goldBefore + totalGold;
    const premAfter = premBefore + totalCrystals;

    await supabaseAdmin
      .from("wallets")
      .update({ gold_balance: goldAfter, premium_balance: premAfter })
      .eq("user_id", context.userId);

    if (totalGold > 0) {
      await supabaseAdmin.from("currency_transactions").insert({
        user_id: context.userId,
        currency_type: "gold",
        transaction_kind: "credit",
        amount: totalGold,
        balance_before: goldBefore,
        balance_after: goldAfter,
        source_type: "raid_reward",
        description: `Recompensas de ${rewards.length} raid(s)`,
      });
    }
    if (totalCrystals > 0) {
      await supabaseAdmin.from("currency_transactions").insert({
        user_id: context.userId,
        currency_type: "premium",
        transaction_kind: "credit",
        amount: totalCrystals,
        balance_before: premBefore,
        balance_after: premAfter,
        source_type: "raid_reward",
        description: `Cristais de ${rewards.length} raid(s)`,
      });
    }

    const ids = rewards.map((r) => r.id);
    await supabaseAdmin
      .from("raid_rewards")
      .update({ claimed_at: new Date().toISOString() })
      .in("id", ids);

    return { claimed: rewards.length, gold: totalGold, crystals: totalCrystals };
  });
