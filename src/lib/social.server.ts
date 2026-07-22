// Server-only helpers for guilds and raids. Import inside server-function handlers only.

type Sb = any;

export async function recomputeGuildStats(sb: Sb, guildId: string) {
  const { data: members } = await sb
    .from("guild_members")
    .select("user_id, characters:character_id(power)")
    .eq("guild_id", guildId);
  const count = (members ?? []).length;
  let power = 0;
  for (const m of members ?? []) {
    const c: any = (m as any).characters;
    if (c) power += Number(c.power ?? 0);
  }
  await sb
    .from("guilds")
    .update({ member_count: count, total_power: power, updated_at: new Date().toISOString() })
    .eq("id", guildId);
}

export async function settleRaidIfDefeated(sb: Sb, raidId: string) {
  const { data: raid } = await sb
    .from("raids")
    .select("id, status, current_hp, template_id, raid_templates(reward_gold, reward_crystals, reward_xp)")
    .eq("id", raidId)
    .maybeSingle();
  if (!raid) return;
  if (raid.status !== "active") return;
  if (Number(raid.current_hp) > 0) return;

  await sb
    .from("raids")
    .update({ status: "defeated", defeated_at: new Date().toISOString() })
    .eq("id", raidId);

  const tpl: any = raid.raid_templates;
  const baseGold = Number(tpl?.reward_gold ?? 0);
  const baseCrystals = Number(tpl?.reward_crystals ?? 0);
  const baseXp = Number(tpl?.reward_xp ?? 0);

  const { data: contribs } = await sb
    .from("raid_contributions")
    .select("user_id, damage")
    .eq("raid_id", raidId);
  const total = (contribs ?? []).reduce((a: number, r: any) => a + Number(r.damage ?? 0), 0);
  if (total <= 0) {
    await sb.from("raids").update({ status: "settled", settled_at: new Date().toISOString() }).eq("id", raidId);
    return;
  }

  const rewards = (contribs ?? []).map((r: any) => {
    const share = Number(r.damage) / total;
    return {
      raid_id: raidId,
      user_id: r.user_id,
      gold: Math.floor(baseGold * share) + Math.floor(baseGold * 0.1),
      crystals: Math.floor(baseCrystals * share),
      xp: Math.floor(baseXp * share),
    };
  });
  if (rewards.length > 0) {
    await sb.from("raid_rewards").upsert(rewards, { onConflict: "raid_id,user_id" });
  }
  await sb.from("raids").update({ status: "settled", settled_at: new Date().toISOString() }).eq("id", raidId);
}
