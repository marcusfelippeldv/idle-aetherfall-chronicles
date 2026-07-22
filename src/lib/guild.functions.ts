import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GUILD_COST_CRYSTALS = 50;

export const listGuilds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("guilds")
      .select("id, name, tag, description, emblem, member_count, total_power, created_at")
      .order("total_power", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const getMyGuild = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: membership } = await context.supabase
      .from("guild_members")
      .select("id, role, guild_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!membership) return { guild: null, members: [], role: null };

    const [{ data: guild }, { data: members }] = await Promise.all([
      context.supabase
        .from("guilds")
        .select("id, name, tag, description, emblem, leader_id, member_count, total_power, created_at")
        .eq("id", membership.guild_id)
        .maybeSingle(),
      context.supabase
        .from("guild_members")
        .select("id, user_id, role, contribution, joined_at, characters:character_id(name, level, power, classes(name))")
        .eq("guild_id", membership.guild_id)
        .order("role")
        .order("contribution", { ascending: false }),
    ]);

    return { guild, members: members ?? [], role: membership.role };
  });

export const createGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; tag: string; description: string }) =>
    z
      .object({
        name: z.string().trim().min(3).max(32),
        tag: z.string().trim().min(2).max(5).regex(/^[A-Za-z0-9]+$/, "Apenas letras e números"),
        description: z.string().trim().max(400),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("guild_members")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) throw new Error("Você já pertence a uma guilda.");

    const { data: character } = await context.supabase
      .from("characters")
      .select("id, power")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) throw new Error("Crie um herói antes de fundar uma guilda.");

    const { data: wallet } = await context.supabase
      .from("wallets")
      .select("premium_balance")
      .eq("user_id", context.userId)
      .maybeSingle();
    const bal = Number(wallet?.premium_balance ?? 0);
    if (bal < GUILD_COST_CRYSTALS)
      throw new Error(`São necessários ${GUILD_COST_CRYSTALS} cristais para fundar uma guilda.`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Debita cristais + registra transação
    const newBal = bal - GUILD_COST_CRYSTALS;
    await supabaseAdmin
      .from("wallets")
      .update({ premium_balance: newBal })
      .eq("user_id", context.userId);
    await supabaseAdmin.from("currency_transactions").insert({
      user_id: context.userId,
      currency_type: "premium",
      transaction_kind: "debit",
      amount: GUILD_COST_CRYSTALS,
      balance_before: bal,
      balance_after: newBal,
      source_type: "guild_founding",
      description: `Fundação da guilda ${data.name}`,
    });

    const { data: guild, error } = await supabaseAdmin
      .from("guilds")
      .insert({
        name: data.name,
        tag: data.tag.toUpperCase(),
        description: data.description,
        leader_id: context.userId,
        member_count: 1,
        total_power: Number(character.power ?? 0),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("guild_members").insert({
      guild_id: guild.id,
      user_id: context.userId,
      character_id: character.id,
      role: "leader",
    });

    // Hooks: conquista de fundador
    try {
      const { checkAchievements } = await import("@/lib/progression.server");
      await checkAchievements(context.supabase, context.userId);
    } catch (e) {
      console.error("guild achievements hook", e);
    }

    return { id: guild.id };
  });

export const joinGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { guildId: string }) =>
    z.object({ guildId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("guild_members")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) throw new Error("Você já pertence a uma guilda.");

    const { data: character } = await context.supabase
      .from("characters")
      .select("id, power")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) throw new Error("Crie um herói antes de entrar em uma guilda.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("guild_members").insert({
      guild_id: data.guildId,
      user_id: context.userId,
      character_id: character.id,
      role: "member",
    });
    if (error) throw new Error(error.message);

    const { recomputeGuildStats } = await import("@/lib/social.server");
    await recomputeGuildStats(supabaseAdmin, data.guildId);
    return { ok: true };
  });

export const leaveGuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: membership } = await context.supabase
      .from("guild_members")
      .select("id, guild_id, role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!membership) throw new Error("Você não está em uma guilda.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (membership.role === "leader") {
      // Dissolve a guilda (cascade limpa membros)
      await supabaseAdmin.from("guilds").delete().eq("id", membership.guild_id);
      return { ok: true, dissolved: true };
    }
    await supabaseAdmin.from("guild_members").delete().eq("id", membership.id);
    const { recomputeGuildStats } = await import("@/lib/social.server");
    await recomputeGuildStats(supabaseAdmin, membership.guild_id);
    return { ok: true, dissolved: false };
  });

export const kickMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string }) =>
    z.object({ memberId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: me } = await context.supabase
      .from("guild_members")
      .select("guild_id, role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!me || (me.role !== "leader" && me.role !== "officer"))
      throw new Error("Sem permissão.");

    const { data: target } = await context.supabase
      .from("guild_members")
      .select("id, guild_id, role")
      .eq("id", data.memberId)
      .maybeSingle();
    if (!target || target.guild_id !== me.guild_id) throw new Error("Membro inválido.");
    if (target.role === "leader") throw new Error("Não é possível remover o líder.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("guild_members").delete().eq("id", target.id);
    const { recomputeGuildStats } = await import("@/lib/social.server");
    await recomputeGuildStats(supabaseAdmin, me.guild_id);
    return { ok: true };
  });

export const promoteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string; role: "officer" | "member" }) =>
    z
      .object({ memberId: z.string().uuid(), role: z.enum(["officer", "member"]) })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: me } = await context.supabase
      .from("guild_members")
      .select("guild_id, role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!me || me.role !== "leader") throw new Error("Só o líder pode gerenciar cargos.");

    const { data: target } = await context.supabase
      .from("guild_members")
      .select("id, guild_id, role")
      .eq("id", data.memberId)
      .maybeSingle();
    if (!target || target.guild_id !== me.guild_id) throw new Error("Membro inválido.");
    if (target.role === "leader") throw new Error("O líder não pode ser rebaixado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("guild_members").update({ role: data.role }).eq("id", target.id);
    return { ok: true };
  });

export const listTopGuilds = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  // guilds SELECT is TO authenticated only; use admin here for public ranking.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("guilds")
    .select("id, name, tag, member_count, total_power")
    .order("total_power", { ascending: false })
    .limit(30);
  return data ?? [];
});
