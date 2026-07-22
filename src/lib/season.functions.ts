import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getSeasonStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: season } = await sb
      .from("seasons")
      .select("id, name, description, starts_at, ends_at")
      .eq("active", true)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!season) return { season: null, rewards: [], progress: null };

    const [{ data: rewards }, { data: progress }] = await Promise.all([
      sb.from("season_rewards")
        .select("level, xp_required, reward_gold, reward_premium, reward_item_id, items(name, rarity)")
        .eq("season_id", season.id)
        .order("level"),
      sb.from("season_progress")
        .select("season_xp, claimed_levels")
        .eq("user_id", context.userId)
        .eq("season_id", season.id)
        .maybeSingle(),
    ]);

    return {
      season,
      rewards: rewards ?? [],
      progress: progress ?? { season_xp: 0, claimed_levels: [] },
    };
  });

export const claimSeasonLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { level: number }) =>
    z.object({ level: z.number().int().min(1).max(50) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: season } = await sb
      .from("seasons").select("id").eq("active", true)
      .lte("starts_at", new Date().toISOString())
      .gte("ends_at", new Date().toISOString())
      .maybeSingle();
    if (!season) throw new Error("Nenhuma temporada ativa.");

    const { data: reward } = await sb
      .from("season_rewards")
      .select("level, xp_required, reward_gold, reward_premium, reward_item_id")
      .eq("season_id", season.id)
      .eq("level", data.level)
      .maybeSingle();
    if (!reward) throw new Error("Nível de recompensa inválido.");

    const { data: progress } = await sb
      .from("season_progress")
      .select("id, season_xp, claimed_levels")
      .eq("user_id", context.userId)
      .eq("season_id", season.id)
      .maybeSingle();
    const xp = Number(progress?.season_xp ?? 0);
    if (xp < reward.xp_required) throw new Error("XP de temporada insuficiente.");
    const claimed: number[] = progress?.claimed_levels ?? [];
    if (claimed.includes(data.level)) throw new Error("Recompensa já resgatada.");

    const newClaimed = [...claimed, data.level].sort((a, b) => a - b);
    if (progress) {
      await sb.from("season_progress").update({ claimed_levels: newClaimed, updated_at: new Date().toISOString() }).eq("id", progress.id);
    } else {
      await sb.from("season_progress").insert({
        user_id: context.userId,
        season_id: season.id,
        season_xp: 0,
        claimed_levels: newClaimed,
      });
    }

    // Wallet updates
    if (reward.reward_gold > 0 || reward.reward_premium > 0) {
      const { data: wallet } = await sb
        .from("wallets")
        .select("gold_balance, premium_balance")
        .eq("user_id", context.userId)
        .maybeSingle();
      const newGold = Number(wallet?.gold_balance ?? 0) + reward.reward_gold;
      const newPremium = Number(wallet?.premium_balance ?? 0) + reward.reward_premium;
      await sb.from("wallets").update({ gold_balance: newGold, premium_balance: newPremium }).eq("user_id", context.userId);
      if (reward.reward_gold > 0) {
        await sb.from("currency_transactions").insert({
          user_id: context.userId,
          currency_type: "gold", transaction_kind: "credit",
          amount: reward.reward_gold,
          balance_before: newGold - reward.reward_gold,
          balance_after: newGold,
          source_type: "season_reward", source_id: season.id,
          description: `Temporada — nível ${data.level}`,
        });
      }
      if (reward.reward_premium > 0) {
        await sb.from("currency_transactions").insert({
          user_id: context.userId,
          currency_type: "premium", transaction_kind: "credit",
          amount: reward.reward_premium,
          balance_before: newPremium - reward.reward_premium,
          balance_after: newPremium,
          source_type: "season_reward", source_id: season.id,
          description: `Temporada — nível ${data.level}`,
        });
      }
    }

    // Item reward → inventory
    if (reward.reward_item_id) {
      const { data: character } = await sb
        .from("characters").select("id").eq("user_id", context.userId).eq("is_active", true).maybeSingle();
      if (character) {
        const { data: existing } = await sb
          .from("inventory_items")
          .select("id, quantity")
          .eq("character_id", character.id)
          .eq("item_id", reward.reward_item_id)
          .eq("equipped", false)
          .maybeSingle();
        if (existing) {
          await sb.from("inventory_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        } else {
          await sb.from("inventory_items").insert({
            character_id: character.id,
            item_id: reward.reward_item_id,
            quantity: 1,
            equipped: false,
          });
        }
      }
    }

    return { ok: true };
  });
