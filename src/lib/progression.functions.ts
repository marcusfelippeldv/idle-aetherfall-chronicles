import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listDailyMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = publicClient();
    const { data: missions } = await sb.from("daily_missions").select("*").order("sort_order");
    const today = new Date().toISOString().slice(0, 10);
    const { data: progress } = await context.supabase
      .from("user_daily_progress").select("mission_slug, progress, claimed").eq("user_id", context.userId).eq("day", today);
    const byMission = new Map(progress?.map((p) => [p.mission_slug, p]) ?? []);
    return (missions ?? []).map((m) => ({
      ...m,
      progress: byMission.get(m.slug)?.progress ?? 0,
      claimed: byMission.get(m.slug)?.claimed ?? false,
      complete: (byMission.get(m.slug)?.progress ?? 0) >= m.target,
    }));
  });

export const listAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = publicClient();
    const { data: achs } = await sb.from("achievements").select("*").order("sort_order");
    const { data: ua } = await context.supabase
      .from("user_achievements").select("slug, progress, completed_at, claimed").eq("user_id", context.userId);
    const map = new Map(ua?.map((r) => [r.slug, r]) ?? []);
    return (achs ?? []).map((a) => ({
      ...a,
      progress: map.get(a.slug)?.progress ?? 0,
      completed_at: map.get(a.slug)?.completed_at ?? null,
      claimed: map.get(a.slug)?.claimed ?? false,
    }));
  });

const claimSchema = z.object({ kind: z.enum(["daily", "achievement"]), slug: z.string() });

export const claimReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => claimSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = publicClient();
    if (data.kind === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      const { data: m } = await sb.from("daily_missions").select("target, reward_gold, reward_xp").eq("slug", data.slug).maybeSingle();
      if (!m) throw new Error("Missão inválida.");
      const { data: p } = await context.supabase
        .from("user_daily_progress").select("progress, claimed").eq("user_id", context.userId).eq("mission_slug", data.slug).eq("day", today).maybeSingle();
      if (!p || p.claimed) throw new Error("Recompensa já resgatada ou missão sem progresso.");
      if (p.progress < m.target) throw new Error("Missão incompleta.");
      await context.supabase.from("user_daily_progress").update({ claimed: true }).eq("user_id", context.userId).eq("mission_slug", data.slug).eq("day", today);
      const { data: w } = await context.supabase.from("wallets").select("gold_balance").eq("user_id", context.userId).maybeSingle();
      await context.supabase.from("wallets").update({ gold_balance: (w?.gold_balance ?? 0) + m.reward_gold }).eq("user_id", context.userId);
      return { ok: true, gold: m.reward_gold, xp: m.reward_xp };
    } else {
      const { data: a } = await sb.from("achievements").select("target, reward_gold, reward_premium").eq("slug", data.slug).maybeSingle();
      if (!a) throw new Error("Conquista inválida.");
      const { data: ua } = await context.supabase.from("user_achievements").select("progress, claimed").eq("user_id", context.userId).eq("slug", data.slug).maybeSingle();
      if (!ua || ua.claimed) throw new Error("Já resgatada.");
      if (ua.progress < a.target) throw new Error("Conquista incompleta.");
      await context.supabase.from("user_achievements").update({ claimed: true }).eq("user_id", context.userId).eq("slug", data.slug);
      const { data: w } = await context.supabase.from("wallets").select("gold_balance, premium_balance").eq("user_id", context.userId).maybeSingle();
      await context.supabase.from("wallets").update({
        gold_balance: (w?.gold_balance ?? 0) + a.reward_gold,
        premium_balance: (w?.premium_balance ?? 0) + a.reward_premium,
      }).eq("user_id", context.userId);
      return { ok: true, gold: a.reward_gold, premium: a.reward_premium };
    }
  });
