import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bumpMetric } from "./progression.server";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const NORMAL_CLEAR_SECONDS = 20;
const BOSS_CLEAR_SECONDS = 60;
const OFFLINE_THRESHOLD_MS = 60_000;
const OFFLINE_XP_MULT = 0.5;

type StageRow = {
  id: string;
  region_slug: string;
  stage_number: number;
  is_boss: boolean;
  enemy_pool: string[] | null;
  boss_slug: string | null;
};

type StageRewardRate = {
  stage: StageRow;
  xpPerSec: number;
  goldPerSec: number;
  clearSeconds: number;
  xpPerClear: number;
  goldPerClear: number;
};

async function loadStageRate(stageId: string): Promise<StageRewardRate> {
  const sb = publicClient();
  const { data: stage, error: sErr } = await sb
    .from("stages")
    .select("id, region_slug, stage_number, is_boss, enemy_pool, boss_slug")
    .eq("id", stageId)
    .maybeSingle();
  if (sErr) throw new Error(sErr.message);
  if (!stage) throw new Error("Estágio não encontrado.");

  const slugs: string[] = stage.is_boss && stage.boss_slug ? [stage.boss_slug] : (stage.enemy_pool ?? []).slice(0, 3);
  if (slugs.length === 0) throw new Error("Estágio sem inimigos.");

  const { data: enemies, error: eErr } = await sb
    .from("enemies")
    .select("slug, xp_reward, gold_reward")
    .in("slug", slugs);
  if (eErr) throw new Error(eErr.message);

  const xpPerClear = (enemies ?? []).reduce((a, e) => a + (e.xp_reward ?? 0), 0);
  const goldPerClear = (enemies ?? []).reduce((a, e) => a + (e.gold_reward ?? 0), 0);
  const clearSeconds = stage.is_boss ? BOSS_CLEAR_SECONDS : NORMAL_CLEAR_SECONDS;
  return {
    stage: stage as StageRow,
    xpPerClear,
    goldPerClear,
    clearSeconds,
    xpPerSec: xpPerClear / clearSeconds,
    goldPerSec: goldPerClear / clearSeconds,
  };
}

function computeAccrual(
  rate: StageRewardRate,
  lastTickAt: string,
  lastSeenAt: string,
  now = new Date(),
): { xp: number; gold: number; onlineSecs: number; offlineSecs: number } {
  const tickMs = new Date(lastTickAt).getTime();
  const seenMs = new Date(lastSeenAt).getTime();
  const nowMs = now.getTime();
  if (nowMs <= tickMs) return { xp: 0, gold: 0, onlineSecs: 0, offlineSecs: 0 };

  // Online window: from tick until (seen + threshold), capped at now.
  const onlineEnd = Math.min(nowMs, seenMs + OFFLINE_THRESHOLD_MS);
  const onlineMs = Math.max(0, onlineEnd - tickMs);
  const offlineMs = Math.max(0, nowMs - Math.max(tickMs, onlineEnd));

  const onlineSecs = onlineMs / 1000;
  const offlineSecs = offlineMs / 1000;

  const xp = Math.floor(onlineSecs * rate.xpPerSec + offlineSecs * rate.xpPerSec * OFFLINE_XP_MULT);
  const gold = Math.floor((onlineSecs + offlineSecs) * rate.goldPerSec);

  return { xp, gold, onlineSecs, offlineSecs };
}

const startSchema = z.object({ stageId: z.string().uuid() });

export const startIdleRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => startSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Validate stage exists via public client
    await loadStageRate(data.stageId);
    const now = new Date().toISOString();
    const { error } = await context.supabase
      .from("idle_runs")
      .upsert(
        {
          user_id: context.userId,
          stage_id: data.stageId,
          started_at: now,
          last_tick_at: now,
          last_seen_at: now,
          pending_xp: 0,
          pending_gold: 0,
          pending_drops: [],
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const stopIdleRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("idle_runs").delete().eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const heartbeatIdleRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("idle_runs")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getIdleStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: run, error } = await context.supabase
      .from("idle_runs")
      .select("stage_id, started_at, last_tick_at, last_seen_at, pending_xp, pending_gold")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!run) return { active: false as const };

    const rate = await loadStageRate(run.stage_id);
    const acc = computeAccrual(rate, run.last_tick_at, run.last_seen_at);
    const nowMs = Date.now();
    const sinceSeenMs = nowMs - new Date(run.last_seen_at).getTime();
    const offline = sinceSeenMs > OFFLINE_THRESHOLD_MS;

    const sb = publicClient();
    const { data: region } = await sb
      .from("regions")
      .select("name")
      .eq("slug", rate.stage.region_slug)
      .maybeSingle();

    return {
      active: true as const,
      stageId: run.stage_id,
      stageNumber: rate.stage.stage_number,
      regionName: region?.name ?? rate.stage.region_slug,
      isBoss: rate.stage.is_boss,
      startedAt: run.started_at,
      lastTickAt: run.last_tick_at,
      lastSeenAt: run.last_seen_at,
      basePendingXp: Number(run.pending_xp ?? 0),
      basePendingGold: Number(run.pending_gold ?? 0),
      accruedXp: acc.xp,
      accruedGold: acc.gold,
      pendingXp: Number(run.pending_xp ?? 0) + acc.xp,
      pendingGold: Number(run.pending_gold ?? 0) + acc.gold,
      xpPerSec: rate.xpPerSec,
      goldPerSec: rate.goldPerSec,
      clearSeconds: rate.clearSeconds,
      offline,
      offlineXpMultiplier: OFFLINE_XP_MULT,
    };
  });

export const claimIdleRewards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: run, error } = await context.supabase
      .from("idle_runs")
      .select("stage_id, last_tick_at, last_seen_at, pending_xp, pending_gold")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!run) throw new Error("Nenhuma expedição idle ativa.");

    const rate = await loadStageRate(run.stage_id);
    const acc = computeAccrual(rate, run.last_tick_at, run.last_seen_at);
    const totalXp = Number(run.pending_xp ?? 0) + acc.xp;
    const totalGold = Number(run.pending_gold ?? 0) + acc.gold;

    if (totalXp <= 0 && totalGold <= 0) {
      // Nothing to claim yet — still advance tick.
      await context.supabase
        .from("idle_runs")
        .update({ last_tick_at: new Date().toISOString(), pending_xp: 0, pending_gold: 0 })
        .eq("user_id", context.userId);
      return { ok: true, xp: 0, gold: 0, perHeroXp: 0 };
    }

    // Distribute XP across party heroes (equal split, floor).
    const { data: party } = await context.supabase
      .from("parties")
      .select("slot1, slot2, slot3, slot4")
      .eq("user_id", context.userId)
      .maybeSingle();

    const slotIds = [party?.slot1, party?.slot2, party?.slot3, party?.slot4].filter(
      (x): x is string => !!x,
    );

    let perHeroXp = 0;
    if (slotIds.length > 0 && totalXp > 0) {
      perHeroXp = Math.floor(totalXp / slotIds.length);
      const { data: heroes } = await context.supabase
        .from("heroes")
        .select("id, xp, level")
        .in("id", slotIds);
      for (const h of heroes ?? []) {
        let xp = Number(h.xp ?? 0) + perHeroXp;
        let level = Number(h.level ?? 1);
        // Curva simples: precisa de 100 * level^1.5 xp para subir.
        while (xp >= Math.floor(100 * Math.pow(level, 1.5))) {
          xp -= Math.floor(100 * Math.pow(level, 1.5));
          level += 1;
        }
        await context.supabase.from("heroes").update({ xp, level }).eq("id", h.id);
      }
    }

    if (totalGold > 0) {
      const { data: w } = await context.supabase
        .from("wallets")
        .select("gold_balance")
        .eq("user_id", context.userId)
        .maybeSingle();
      await context.supabase
        .from("wallets")
        .update({ gold_balance: Number(w?.gold_balance ?? 0) + totalGold })
        .eq("user_id", context.userId);
    }

    await context.supabase
      .from("idle_runs")
      .update({
        last_tick_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        pending_xp: 0,
        pending_gold: 0,
      })
      .eq("user_id", context.userId);

    // Best-effort progression bumps.
    await bumpMetric(context.supabase, context.userId, "gold_earned", totalGold);
    await bumpMetric(context.supabase, context.userId, "idle_claims", 1);

    return { ok: true, xp: totalXp, gold: totalGold, perHeroXp };
  });
