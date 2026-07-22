import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  applyXp,
  DROP_CHANCE,
  growthFor,
  makeRng,
  pickInt,
} from "@/lib/game/formulas.server";

async function loadCharacter(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("characters")
    .select(
      "id, user_id, level, current_xp, max_hp, current_hp, attack, defense, speed, defeated_bosses, class_id, classes(slug, base_hp, base_attack, base_defense, base_speed)",
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Nenhum herói ativo.");
  return data;
}

export const startExpedition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { regionId: string; durationMinutes: number }) =>
    z
      .object({
        regionId: z.string().uuid(),
        durationMinutes: z.number().int().min(1).max(60),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const character = await loadCharacter(context.supabase, context.userId);

    // Verifica se já existe expedição rodando.
    const { data: running } = await context.supabase
      .from("expeditions")
      .select("id")
      .eq("character_id", character.id)
      .eq("status", "running")
      .maybeSingle();
    if (running) throw new Error("Você já tem uma expedição em andamento.");

    const { data: region } = await context.supabase
      .from("regions")
      .select("id, required_level")
      .eq("id", data.regionId)
      .eq("active", true)
      .maybeSingle();
    if (!region) throw new Error("Região inválida.");
    if (character.level < region.required_level)
      throw new Error(
        `Nível ${region.required_level} necessário para esta região.`,
      );

    const startedAt = new Date();
    const endAt = new Date(startedAt.getTime() + data.durationMinutes * 60_000);
    const seed = Math.floor(Math.random() * 2_000_000_000);

    const { data: exp, error } = await context.supabase
      .from("expeditions")
      .insert({
        character_id: character.id,
        region_id: region.id,
        status: "running",
        duration_minutes: data.durationMinutes,
        started_at: startedAt.toISOString(),
        expected_end_at: endAt.toISOString(),
        rng_seed: seed,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: exp.id };
  });

export const cancelExpedition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { expeditionId: string }) =>
    z.object({ expeditionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const character = await loadCharacter(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("expeditions")
      .update({ status: "abandoned" })
      .eq("id", data.expeditionId)
      .eq("character_id", character.id)
      .eq("status", "running");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const claimExpedition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { expeditionId: string }) =>
    z.object({ expeditionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const character = await loadCharacter(context.supabase, context.userId);

    const { data: exp } = await context.supabase
      .from("expeditions")
      .select(
        "id, character_id, region_id, status, duration_minutes, expected_end_at, rng_seed, result_data, generated_xp, generated_gold",
      )
      .eq("id", data.expeditionId)
      .eq("character_id", character.id)
      .maybeSingle();
    if (!exp) throw new Error("Expedição não encontrada.");
    if (exp.status !== "running") {
      // Idempotente: devolve o resultado já gravado.
      return {
        alreadyClaimed: true,
        xp: exp.generated_xp,
        gold: exp.generated_gold,
        rewards: exp.result_data,
      };
    }
    if (new Date(exp.expected_end_at).getTime() > Date.now())
      throw new Error("Expedição ainda em andamento.");

    // Carrega inimigos comuns da região.
    const { data: enemies } = await context.supabase
      .from("enemies")
      .select("id, name, level, xp_reward, gold_min, gold_max, is_boss")
      .eq("region_id", exp.region_id)
      .eq("is_boss", false)
      .eq("active", true);

    // Itens elegíveis (nível ≤ herói + 2, filtro por raridade).
    const { data: itemPool } = await context.supabase
      .from("items")
      .select("id, name, rarity, required_level, sell_price")
      .eq("active", true)
      .lte("required_level", character.level + 2);

    const rng = makeRng(exp.rng_seed);
    // Encontros = 1 por minuto (mín 3, máx 20).
    const encounters = Math.max(3, Math.min(20, exp.duration_minutes));
    let totalXp = 0;
    let totalGold = 0;
    const kills: Array<{ name: string; xp: number; gold: number }> = [];
    const drops: Array<{ item_id: string; name: string; rarity: string }> = [];

    for (let i = 0; i < encounters; i++) {
      if (!enemies || enemies.length === 0) break;
      const enemy = enemies[pickInt(rng, 0, enemies.length - 1)];
      totalXp += enemy.xp_reward;
      const g = pickInt(rng, enemy.gold_min, enemy.gold_max);
      totalGold += g;
      kills.push({ name: enemy.name, xp: enemy.xp_reward, gold: g });

      // chance de drop
      if (itemPool && itemPool.length > 0) {
        const roll = rng();
        // seleção ponderada por raridade
        const candidates = itemPool.filter(
          (it) => rng() < (DROP_CHANCE[it.rarity] ?? 0.05),
        );
        if (candidates.length > 0 && roll < 0.35) {
          const it = candidates[pickInt(rng, 0, candidates.length - 1)];
          drops.push({ item_id: it.id, name: it.name, rarity: it.rarity });
        }
      }
    }

    // Aplica XP/nível.
    const growth = growthFor(
      (character.classes as { slug: string } | null)?.slug ?? "",
    );
    const leveled = applyXp({
      currentLevel: character.level,
      currentXp: Number(character.current_xp),
      gainedXp: totalXp,
      growth,
      baseHp: character.max_hp,
      baseAtk: character.attack,
      baseDef: character.defense,
      baseSpeed: character.speed,
    });

    const rewards = { kills, drops, xp: totalXp, gold: totalGold };

    // Persistência (sequencial para respeitar RLS + trigger).
    await context.supabase
      .from("expeditions")
      .update({
        status: "completed",
        claimed_at: new Date().toISOString(),
        generated_xp: totalXp,
        generated_gold: totalGold,
        result_data: rewards,
      })
      .eq("id", exp.id);

    await context.supabase
      .from("characters")
      .update({
        level: leveled.level,
        current_xp: leveled.xp,
        max_hp: leveled.hp,
        current_hp: leveled.hp,
        attack: leveled.attack,
        defense: leveled.defense,
        speed: leveled.speed,
        power: leveled.attack + leveled.defense + leveled.speed,
      })
      .eq("id", character.id);

    // Ouro na carteira.
    if (totalGold > 0) {
      const { data: wallet } = await context.supabase
        .from("wallets")
        .select("gold_balance")
        .eq("user_id", context.userId)
        .maybeSingle();
      const newBalance = Number(wallet?.gold_balance ?? 0) + totalGold;
      await context.supabase
        .from("wallets")
        .update({ gold_balance: newBalance })
        .eq("user_id", context.userId);
      await context.supabase.from("currency_transactions").insert({
        user_id: context.userId,
        currency: "gold",
        amount: totalGold,
        reason: "expedition_reward",
        reference_id: exp.id,
        balance_after: newBalance,
      });
    }

    // Drops no inventário.
    for (const d of drops) {
      const { data: existing } = await context.supabase
        .from("inventory_items")
        .select("id, quantity")
        .eq("character_id", character.id)
        .eq("item_id", d.item_id)
        .eq("equipped", false)
        .maybeSingle();
      if (existing) {
        await context.supabase
          .from("inventory_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
      } else {
        await context.supabase.from("inventory_items").insert({
          character_id: character.id,
          item_id: d.item_id,
          quantity: 1,
          equipped: false,
        });
      }
    }

    return {
      alreadyClaimed: false,
      xp: totalXp,
      gold: totalGold,
      leveledUp: leveled.leveledUp,
      newLevel: leveled.level,
      rewards,
    };
  });
