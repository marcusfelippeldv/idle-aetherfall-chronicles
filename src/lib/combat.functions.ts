import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { simulateCombat } from "@/lib/game/formulas.server";

export const fightBoss = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { regionId: string }) =>
    z.object({ regionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: character } = await context.supabase
      .from("characters")
      .select(
        "id, name, level, current_hp, max_hp, attack, defense, speed, defeated_bosses",
      )
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) throw new Error("Nenhum herói ativo.");

    const { data: region } = await context.supabase
      .from("regions")
      .select("id, name, required_level")
      .eq("id", data.regionId)
      .maybeSingle();
    if (!region) throw new Error("Região inválida.");
    if (character.level < region.required_level)
      throw new Error(`Nível ${region.required_level} necessário.`);

    const { data: boss } = await context.supabase
      .from("enemies")
      .select("id, name, hp, attack, defense, xp_reward, gold_min, gold_max")
      .eq("region_id", region.id)
      .eq("is_boss", true)
      .eq("active", true)
      .maybeSingle();
    if (!boss) throw new Error("Nenhum chefe nesta região.");

    const seed = Math.floor(Math.random() * 2_000_000_000);
    const result = simulateCombat(
      {
        name: character.name,
        hp: character.max_hp,
        maxHp: character.max_hp,
        attack: character.attack,
        defense: character.defense,
        speed: character.speed,
      },
      {
        name: boss.name,
        hp: boss.hp,
        maxHp: boss.hp,
        attack: boss.attack,
        defense: boss.defense,
        speed: 5,
      },
      seed,
    );

    let rewardXp = 0;
    let rewardGold = 0;
    let unlocked = false;

    if (result.winner === "hero") {
      rewardXp = boss.xp_reward * 3;
      rewardGold = Math.floor((boss.gold_min + boss.gold_max) * 1.5);
      const newDefeated = Array.from(
        new Set([...(character.defeated_bosses ?? []), region.id]),
      );
      unlocked = !(character.defeated_bosses ?? []).includes(region.id);
      await context.supabase
        .from("characters")
        .update({
          defeated_bosses: newDefeated,
          current_hp: Math.max(1, result.heroHpAfter),
          current_xp: Number(character.level > 0 ? 0 : 0) + 0, // xp handled below
        })
        .eq("id", character.id);

      // Aplica XP via reuse simples: recarrega para pegar current_xp.
      const { data: refreshed } = await context.supabase
        .from("characters")
        .select("current_xp, level, class_id, max_hp, attack, defense, speed")
        .eq("id", character.id)
        .maybeSingle();
      if (refreshed) {
        const { applyXp, growthFor } = await import(
          "@/lib/game/formulas.server"
        );
        const { data: cls } = await context.supabase
          .from("classes")
          .select("slug")
          .eq("id", refreshed.class_id)
          .maybeSingle();
        const leveled = applyXp({
          currentLevel: refreshed.level,
          currentXp: Number(refreshed.current_xp),
          gainedXp: rewardXp,
          growth: growthFor(cls?.slug ?? ""),
          baseHp: refreshed.max_hp,
          baseAtk: refreshed.attack,
          baseDef: refreshed.defense,
          baseSpeed: refreshed.speed,
        });
        await context.supabase
          .from("characters")
          .update({
            level: leveled.level,
            current_xp: leveled.xp,
            max_hp: leveled.hp,
            attack: leveled.attack,
            defense: leveled.defense,
            speed: leveled.speed,
            power: leveled.attack + leveled.defense + leveled.speed,
          })
          .eq("id", character.id);
      }

      if (rewardGold > 0) {
        const { data: wallet } = await context.supabase
          .from("wallets")
          .select("gold_balance")
          .eq("user_id", context.userId)
          .maybeSingle();
        const newBalance = Number(wallet?.gold_balance ?? 0) + rewardGold;
        await context.supabase
          .from("wallets")
          .update({ gold_balance: newBalance })
          .eq("user_id", context.userId);
        await context.supabase.from("currency_transactions").insert({
          user_id: context.userId,
          currency: "gold",
          amount: rewardGold,
          reason: "boss_reward",
          reference_id: region.id,
          balance_after: newBalance,
        });
      }
    } else {
      // Derrota: perde HP mas mantém metade.
      await context.supabase
        .from("characters")
        .update({ current_hp: Math.max(1, Math.floor(character.max_hp / 2)) })
        .eq("id", character.id);
    }

    const combatLog = {
      seed,
      winner: result.winner,
      heroName: character.name,
      bossName: boss.name,
      turns: result.turns,
      heroHpAfter: result.heroHpAfter,
      rewardXp,
      rewardGold,
      unlocked,
      regionId: region.id,
      regionName: region.name,
      at: new Date().toISOString(),
    };

    await context.supabase
      .from("characters")
      .update({ last_combat: combatLog })
      .eq("id", character.id);

    return combatLog;
  });
