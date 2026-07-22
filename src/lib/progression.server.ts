import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

/** Bumps daily missions and achievements matching a metric. Silently no-ops on error. */
export async function bumpMetric(sb: SB, userId: string, metric: string, amount = 1) {
  try {
    // Daily missions
    const { data: missions } = await sb
      .from("daily_missions")
      .select("slug, target")
      .eq("metric", metric);
    for (const m of missions ?? []) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: cur } = await sb
        .from("user_daily_progress")
        .select("progress, claimed")
        .eq("user_id", userId)
        .eq("mission_slug", m.slug)
        .eq("day", today)
        .maybeSingle();
      const next = Math.min(m.target, (cur?.progress ?? 0) + amount);
      await sb
        .from("user_daily_progress")
        .upsert(
          { user_id: userId, mission_slug: m.slug, day: today, progress: next, claimed: cur?.claimed ?? false },
          { onConflict: "user_id,mission_slug,day" },
        );
    }
    // Achievements
    const { data: achs } = await sb.from("achievements").select("slug, target").eq("metric", metric);
    for (const a of achs ?? []) {
      const { data: cur } = await sb
        .from("user_achievements")
        .select("progress, completed_at, claimed")
        .eq("user_id", userId)
        .eq("slug", a.slug)
        .maybeSingle();
      const next = Math.min(a.target, (cur?.progress ?? 0) + amount);
      const completed = next >= a.target ? (cur?.completed_at ?? new Date().toISOString()) : null;
      await sb.from("user_achievements").upsert(
        { user_id: userId, slug: a.slug, progress: next, completed_at: completed, claimed: cur?.claimed ?? false },
        { onConflict: "user_id,slug" },
      );
    }
  } catch {
    // best-effort
  }
}
