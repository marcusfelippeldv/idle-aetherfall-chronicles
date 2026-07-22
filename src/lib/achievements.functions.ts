import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [tpls, mine] = await Promise.all([
      sb.from("achievement_templates")
        .select("id, slug, title, description, category, goal_type, threshold, reward_premium, reward_gold, order_index")
        .eq("active", true)
        .order("order_index"),
      sb.from("achievements").select("template_id, unlocked_at, claimed_at").eq("user_id", context.userId),
    ]);
    const byId = new Map((mine.data ?? []).map((r: any) => [r.template_id, r]));
    return {
      items: (tpls.data ?? []).map((t: any) => ({
        ...t,
        unlocked: byId.has(t.id),
        unlocked_at: byId.get(t.id)?.unlocked_at ?? null,
        claimed_at: byId.get(t.id)?.claimed_at ?? null,
      })),
    };
  });

export const claimAchievement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { templateId: string }) =>
    z.object({ templateId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const { data: ach } = await sb
      .from("achievements")
      .select("id, claimed_at, template_id, achievement_templates(title, reward_premium, reward_gold)")
      .eq("template_id", data.templateId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!ach) throw new Error("Conquista ainda não desbloqueada.");
    if (ach.claimed_at) throw new Error("Recompensa já resgatada.");

    const tpl = ach.achievement_templates as any;
    const premium = Number(tpl?.reward_premium ?? 0);
    const gold = Number(tpl?.reward_gold ?? 0);

    await sb.from("achievements").update({ claimed_at: new Date().toISOString() }).eq("id", ach.id);

    if (premium > 0 || gold > 0) {
      const { data: wallet } = await sb
        .from("wallets")
        .select("gold_balance, premium_balance")
        .eq("user_id", context.userId)
        .maybeSingle();
      const newGold = Number(wallet?.gold_balance ?? 0) + gold;
      const newPremium = Number(wallet?.premium_balance ?? 0) + premium;
      await sb.from("wallets").update({ gold_balance: newGold, premium_balance: newPremium }).eq("user_id", context.userId);
      if (premium > 0) {
        await sb.from("currency_transactions").insert({
          user_id: context.userId,
          currency_type: "premium",
          transaction_kind: "credit",
          amount: premium,
          balance_before: newPremium - premium,
          balance_after: newPremium,
          source_type: "achievement",
          source_id: ach.id,
          description: `Conquista: ${tpl?.title ?? ""}`,
        });
      }
      if (gold > 0) {
        await sb.from("currency_transactions").insert({
          user_id: context.userId,
          currency_type: "gold",
          transaction_kind: "credit",
          amount: gold,
          balance_before: newGold - gold,
          balance_after: newGold,
          source_type: "achievement",
          source_id: ach.id,
          description: `Conquista: ${tpl?.title ?? ""}`,
        });
      }
    }

    return { ok: true, gold, premium };
  });
