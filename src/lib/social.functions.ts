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

// ---------- Guilds ----------
export const listGuilds = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("guilds").select("id, name, tag, description, member_count, leader_id, created_at").order("member_count", { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const myGuild = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: m } = await context.supabase.from("guild_members").select("guild_id, role").eq("user_id", context.userId).maybeSingle();
    if (!m) return null;
    const { data: g } = await context.supabase.from("guilds").select("id, name, tag, description, member_count, leader_id").eq("id", m.guild_id).maybeSingle();
    const { data: members } = await context.supabase.from("guild_members").select("user_id, role, joined_at, profiles:user_id(username, display_name)").eq("guild_id", m.guild_id);
    return { guild: g, membership: m, members: members ?? [] };
  });

const createGuildSchema = z.object({
  name: z.string().trim().min(3).max(30),
  tag: z.string().trim().min(2).max(5).regex(/^[A-Za-z0-9]+$/),
  description: z.string().max(280).default(""),
});

export const createGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createGuildSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase.from("guild_members").select("guild_id").eq("user_id", context.userId).maybeSingle();
    if (existing) throw new Error("Você já pertence a uma guilda.");
    const { data: g, error } = await context.supabase
      .from("guilds").insert({ name: data.name, tag: data.tag.toUpperCase(), description: data.description, leader_id: context.userId, member_count: 1 })
      .select("id").single();
    if (error) throw new Error(error.message);
    await context.supabase.from("guild_members").insert({ guild_id: g.id, user_id: context.userId, role: "leader" });
    return { ok: true, guildId: g.id };
  });

export const joinGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { guildId: string }) => z.object({ guildId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase.from("guild_members").select("guild_id").eq("user_id", context.userId).maybeSingle();
    if (existing) throw new Error("Você já pertence a uma guilda.");
    const { error } = await context.supabase.from("guild_members").insert({ guild_id: data.guildId, user_id: context.userId, role: "member" });
    if (error) throw new Error(error.message);
    // Recount
    const { count } = await context.supabase.from("guild_members").select("*", { count: "exact", head: true }).eq("guild_id", data.guildId);
    await context.supabase.from("guilds").update({ member_count: count ?? 1 }).eq("id", data.guildId);
    return { ok: true };
  });

export const leaveGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: m } = await context.supabase.from("guild_members").select("guild_id").eq("user_id", context.userId).maybeSingle();
    if (!m) throw new Error("Você não está em uma guilda.");
    await context.supabase.from("guild_members").delete().eq("user_id", context.userId);
    const { count } = await context.supabase.from("guild_members").select("*", { count: "exact", head: true }).eq("guild_id", m.guild_id);
    await context.supabase.from("guilds").update({ member_count: count ?? 0 }).eq("id", m.guild_id);
    return { ok: true };
  });

// ---------- Chat ----------
export const listChat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { channel?: string }) => z.object({ channel: z.string().default("global") }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_messages").select("id, user_id, username, body, created_at, channel")
      .eq("channel", data.channel).order("created_at", { ascending: false }).limit(80);
    if (error) throw new Error(error.message);
    return (rows ?? []).reverse();
  });

const postSchema = z.object({ channel: z.string().default("global"), body: z.string().trim().min(1).max(280) });

export const postChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => postSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: prof } = await context.supabase.from("profiles").select("username, display_name").eq("id", context.userId).maybeSingle();
    const username = prof?.display_name ?? prof?.username ?? "Herói";
    const { error } = await context.supabase.from("chat_messages").insert({ channel: data.channel, user_id: context.userId, username, body: data.body });
    if (error) throw new Error(error.message);
    const { bumpMetric } = await import("./progression.server");
    await bumpMetric(context.supabase, context.userId, "chat_messages", 1);
    return { ok: true };
  });

// ---------- World bosses ----------
export const listWorldBosses = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("world_bosses").select("slug, name, description, element, max_hp, current_hp, reward_gold, reward_xp, updated_at");
  if (error) throw new Error(error.message);
  const { data: hits } = await sb.from("world_boss_hits").select("boss_slug, username, damage, created_at").order("created_at", { ascending: false }).limit(30);
  return { bosses: data ?? [], hits: hits ?? [] };
});

const hitSchema = z.object({ slug: z.string() });

export const hitWorldBoss = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => hitSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Derive damage from strongest hero's ATK * random 4-8
    const { data: heroes } = await context.supabase
      .from("heroes").select("atk, level").eq("user_id", context.userId).order("atk", { ascending: false }).limit(1);
    const base = (heroes?.[0]?.atk ?? 10) * (4 + Math.floor(Math.random() * 5));
    const dmg = Math.max(50, Math.min(20000, base));
    const { data: res, error } = await context.supabase.rpc("hit_world_boss", { _slug: data.slug, _damage: dmg });
    if (error) throw new Error(error.message);
    const first = Array.isArray(res) ? res[0] : res;
    const killed = !!first?.killed;
    // Rewards
    if (killed) {
      const { data: boss } = await context.supabase.from("world_bosses").select("reward_gold, reward_xp, max_hp").eq("slug", data.slug).maybeSingle();
      if (boss) {
        const { data: w } = await context.supabase.from("wallets").select("gold_balance").eq("user_id", context.userId).maybeSingle();
        await context.supabase.from("wallets").update({ gold_balance: (w?.gold_balance ?? 0) + boss.reward_gold }).eq("user_id", context.userId);
        // Reset boss
        await context.supabase.from("world_bosses").update({ current_hp: boss.max_hp, reset_at: new Date().toISOString() }).eq("slug", data.slug);
      }
    }
    const { bumpMetric } = await import("./progression.server");
    await bumpMetric(context.supabase, context.userId, "boss_damage", dmg);
    return { damage: dmg, remaining: Number(first?.remaining_hp ?? 0), killed };
  });
