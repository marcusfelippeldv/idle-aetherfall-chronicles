// Server-only helpers for daily quests, achievements and season progress.
// Import only inside server function handlers.

type Sb = any;

export type ProgressEvent =
  | { kind: "expedition_completed"; gold: number; leveledUp: boolean; newLevel: number }
  | { kind: "boss_killed" }
  | { kind: "item_sold"; quantity: number }
  | { kind: "level_up"; newLevel: number };

const GOAL_MATCH: Record<ProgressEvent["kind"], string[]> = {
  expedition_completed: ["expeditions", "gold_earned", "levels_gained"],
  boss_killed: ["boss_kills"],
  item_sold: ["items_sold"],
  level_up: ["levels_gained"],
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function increment(sb: Sb, questId: string, delta: number, target: number, current: number) {
  const next = Math.min(target, current + delta);
  await sb.from("daily_quests").update({ progress: next }).eq("id", questId);
}

export async function trackProgress(sb: Sb, userId: string, event: ProgressEvent) {
  const date = todayUtc();
  const { data: quests } = await sb
    .from("daily_quests")
    .select("id, template_id, progress, target, claimed_at, daily_quest_templates!inner(goal_type)")
    .eq("user_id", userId)
    .eq("quest_date", date)
    .is("claimed_at", null);

  const relevant = GOAL_MATCH[event.kind] ?? [];
  for (const q of quests ?? []) {
    const gt = (q.daily_quest_templates as any)?.goal_type;
    if (!relevant.includes(gt)) continue;
    let delta = 0;
    if (gt === "expeditions" && event.kind === "expedition_completed") delta = 1;
    else if (gt === "boss_kills" && event.kind === "boss_killed") delta = 1;
    else if (gt === "items_sold" && event.kind === "item_sold") delta = event.quantity;
    else if (gt === "gold_earned" && event.kind === "expedition_completed") delta = event.gold;
    else if (gt === "levels_gained" && event.kind === "expedition_completed" && event.leveledUp) delta = 1;
    else if (gt === "levels_gained" && event.kind === "level_up") delta = 1;
    if (delta > 0 && q.progress < q.target) {
      await increment(sb, q.id, delta, q.target, q.progress);
    }
  }
}

export async function checkAchievements(sb: Sb, userId: string) {
  const { data: templates } = await sb
    .from("achievement_templates")
    .select("id, goal_type, threshold")
    .eq("active", true);
  if (!templates || templates.length === 0) return;

  const { data: existing } = await sb
    .from("achievements")
    .select("template_id")
    .eq("user_id", userId);
  const owned = new Set((existing ?? []).map((r: any) => r.template_id));

  // Stats: character level, expedition count, boss count, gold earned, items owned
  const { data: character } = await sb
    .from("characters")
    .select("id, level, defeated_bosses")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  let expeditionsDone = 0;
  let itemsOwned = 0;
  if (character) {
    const [{ count: expC }, { data: invRows }] = await Promise.all([
      sb.from("expeditions").select("*", { count: "exact", head: true })
        .eq("character_id", character.id).eq("status", "claimed"),
      sb.from("inventory_items").select("quantity").eq("character_id", character.id),
    ]);
    expeditionsDone = expC ?? 0;
    itemsOwned = (invRows ?? []).reduce((a: number, r: any) => a + Number(r.quantity ?? 0), 0);
  }
  const bossKills = character?.defeated_bosses?.length ?? 0;

  const { data: goldTx } = await sb
    .from("currency_transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("currency_type", "gold")
    .eq("transaction_kind", "credit");
  const goldEarned = (goldTx ?? []).reduce((a: number, r: any) => a + Number(r.amount ?? 0), 0);

  const [{ data: raidHitsRows }, { data: guildRow }] = await Promise.all([
    sb.from("raid_contributions").select("hits").eq("user_id", userId),
    sb.from("guilds").select("id").eq("leader_id", userId).maybeSingle(),
  ]);
  const raidHits = (raidHitsRows ?? []).reduce((a: number, r: any) => a + Number(r.hits ?? 0), 0);
  const guildFounded = guildRow ? 1 : 0;

  const stats: Record<string, number> = {
    level: character?.level ?? 0,
    expeditions: expeditionsDone,
    boss_kills: bossKills,
    gold_earned: goldEarned,
    items_owned: itemsOwned,
    raid_hits: raidHits,
    guild_founded: guildFounded,
  };

  const toInsert = (templates as any[])
    .filter((t) => !owned.has(t.id) && (stats[t.goal_type] ?? 0) >= t.threshold)
    .map((t) => ({ user_id: userId, template_id: t.id }));

  if (toInsert.length > 0) {
    await sb.from("achievements").insert(toInsert);
  }
}

export async function addSeasonXp(sb: Sb, userId: string, xp: number) {
  if (xp <= 0) return;
  const { data: season } = await sb
    .from("seasons")
    .select("id, ends_at")
    .eq("active", true)
    .lte("starts_at", new Date().toISOString())
    .gte("ends_at", new Date().toISOString())
    .maybeSingle();
  if (!season) return;

  const { data: existing } = await sb
    .from("season_progress")
    .select("id, season_xp")
    .eq("user_id", userId)
    .eq("season_id", season.id)
    .maybeSingle();

  if (existing) {
    await sb
      .from("season_progress")
      .update({ season_xp: Number(existing.season_xp) + xp, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await sb.from("season_progress").insert({
      user_id: userId,
      season_id: season.id,
      season_xp: xp,
    });
  }
}
