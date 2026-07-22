import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

async function logAudit(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  justification: string,
  previous: unknown = {},
  next: unknown = {},
) {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  await supabaseAdmin.from("admin_audit_logs").insert({
    admin_user_id: adminUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    previous_data: (previous ?? {}) as any,
    new_data: (next ?? {}) as any,
    justification,
  });
}

/* ============================== METRICS ============================== */

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const [
      accountsTotal,
      accountsRecent,
      expeditionsTotal,
      ordersCreated,
      ordersPaid,
      goldSum,
      premiumSum,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 86_400_000).toISOString(),
        ),
      supabaseAdmin
        .from("expeditions")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["paid", "delivered"]),
      supabaseAdmin.from("wallets").select("gold_balance"),
      supabaseAdmin.from("wallets").select("premium_balance"),
    ]);

    const totalGold = (goldSum.data ?? []).reduce(
      (acc, r) => acc + Number(r.gold_balance ?? 0),
      0,
    );
    const totalPremium = (premiumSum.data ?? []).reduce(
      (acc, r) => acc + Number(r.premium_balance ?? 0),
      0,
    );

    return {
      accountsTotal: accountsTotal.count ?? 0,
      accountsLast7d: accountsRecent.count ?? 0,
      expeditionsTotal: expeditionsTotal.count ?? 0,
      ordersCreated: ordersCreated.count ?? 0,
      ordersPaid: ordersPaid.count ?? 0,
      totalGold,
      totalPremium,
    };
  });

/* ============================== PLAYERS ============================== */

export const listPlayers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string }) =>
    z.object({ search: z.string().max(120).optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    let query = supabaseAdmin
      .from("profiles")
      .select(
        "id, email, username, display_name, account_status, created_at, last_login_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.search && data.search.trim().length > 0) {
      const s = data.search.trim();
      query = query.or(
        `email.ilike.%${s}%,username.ilike.%${s}%,display_name.ilike.%${s}%`,
      );
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPlayerFullView = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string }) =>
    z.object({ user_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const [profile, wallet, characters, roles] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, username, display_name, account_status, created_at, last_login_at")
        .eq("id", data.user_id)
        .maybeSingle(),
      supabaseAdmin
        .from("wallets")
        .select("gold_balance, premium_balance, updated_at")
        .eq("user_id", data.user_id)
        .maybeSingle(),
      supabaseAdmin
        .from("characters")
        .select("id, name, level, current_xp, power, current_hp, max_hp, attack, defense, speed, is_active, class_id, classes(name)")
        .eq("user_id", data.user_id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user_id),
    ]);
    return {
      profile: profile.data,
      wallet: wallet.data ?? { gold_balance: 0, premium_balance: 0, updated_at: null },
      characters: characters.data ?? [],
      roles: (roles.data ?? []).map((r) => r.role as string),
    };
  });

export const setAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      target_user_id: string;
      status: "active" | "suspended" | "banned";
      justification: string;
    }) =>
      z
        .object({
          target_user_id: z.string().uuid(),
          status: z.enum(["active", "suspended", "banned"]),
          justification: z.string().trim().min(5).max(500),
        })
        .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: previous } = await supabaseAdmin
      .from("profiles")
      .select("account_status")
      .eq("id", data.target_user_id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ account_status: data.status })
      .eq("id", data.target_user_id);
    if (error) throw new Error(error.message);

    await logAudit(
      context.userId,
      "set_account_status",
      "profile",
      data.target_user_id,
      data.justification,
      previous ?? {},
      { account_status: data.status },
    );

    return { ok: true };
  });

/* ============================== BOOTSTRAP / ME ============================== */

export const claimBootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      return { granted: false, reason: "admin_already_exists" as const };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    await logAudit(
      context.userId,
      "bootstrap_admin_granted",
      "user_role",
      context.userId,
      "Primeiro admin do projeto (bootstrap).",
      {},
      { role: "admin" },
    );
    return { granted: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { roles: (data ?? []).map((r) => r.role) };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const [profile, wallet] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, email, username, display_name, account_status, created_at, last_login_at",
        )
        .eq("id", context.userId)
        .maybeSingle(),
      supabase
        .from("wallets")
        .select("gold_balance, premium_balance")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    return {
      profile: profile.data,
      wallet: wallet.data ?? { gold_balance: 0, premium_balance: 0 },
    };
  });

/* ============================== CHARACTERS (ADMIN) ============================== */

export const adminListCharacters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { search?: string }) =>
    z.object({ search: z.string().max(120).optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    let query = supabaseAdmin
      .from("characters")
      .select(
        "id, user_id, name, level, current_xp, power, current_hp, max_hp, attack, defense, speed, is_active, created_at, classes(name), profiles!inner(username, email)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.search && data.search.trim().length > 0) {
      const s = data.search.trim();
      query = query.ilike("name", `%${s}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminCreateCharacter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      target_user_id: string;
      name: string;
      class_id: string;
      justification: string;
    }) =>
      z
        .object({
          target_user_id: z.string().uuid(),
          name: z.string().trim().min(3).max(20),
          class_id: z.string().uuid(),
          justification: z.string().trim().min(5).max(500),
        })
        .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: existing } = await supabaseAdmin
      .from("characters")
      .select("id")
      .eq("user_id", data.target_user_id)
      .eq("is_active", true)
      .maybeSingle();
    if (existing) throw new Error("Este jogador já possui um herói ativo.");

    const { data: cls, error: clsErr } = await supabaseAdmin
      .from("classes")
      .select("id, base_hp, base_attack, base_defense, base_speed")
      .eq("id", data.class_id)
      .eq("active", true)
      .maybeSingle();
    if (clsErr) throw new Error(clsErr.message);
    if (!cls) throw new Error("Classe inválida.");

    const { data: created, error } = await supabaseAdmin
      .from("characters")
      .insert({
        user_id: data.target_user_id,
        name: data.name,
        class_id: cls.id,
        level: 1,
        current_xp: 0,
        current_hp: cls.base_hp,
        max_hp: cls.base_hp,
        attack: cls.base_attack,
        defense: cls.base_defense,
        speed: cls.base_speed,
        power: cls.base_attack + cls.base_defense + cls.base_speed,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logAudit(
      context.userId,
      "admin_create_character",
      "character",
      created.id,
      data.justification,
      {},
      { name: data.name, class_id: cls.id, user_id: data.target_user_id },
    );
    return { id: created.id };
  });

export const adminUpdateCharacter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      character_id: string;
      patch: Partial<{
        level: number;
        current_xp: number;
        current_hp: number;
        max_hp: number;
        attack: number;
        defense: number;
        speed: number;
        is_active: boolean;
      }>;
      justification: string;
    }) =>
      z
        .object({
          character_id: z.string().uuid(),
          patch: z
            .object({
              level: z.number().int().min(1).max(999).optional(),
              current_xp: z.number().int().min(0).optional(),
              current_hp: z.number().int().min(0).optional(),
              max_hp: z.number().int().min(1).optional(),
              attack: z.number().int().min(0).optional(),
              defense: z.number().int().min(0).optional(),
              speed: z.number().int().min(0).optional(),
              is_active: z.boolean().optional(),
            })
            .refine((p) => Object.keys(p).length > 0, "Nada para atualizar"),
          justification: z.string().trim().min(5).max(500),
        })
        .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: prev } = await supabaseAdmin
      .from("characters")
      .select("id, level, current_xp, current_hp, max_hp, attack, defense, speed, is_active")
      .eq("id", data.character_id)
      .maybeSingle();
    if (!prev) throw new Error("Herói não encontrado.");

    const patch = { ...data.patch } as Record<string, unknown>;
    if (typeof patch.attack === "number" || typeof patch.defense === "number" || typeof patch.speed === "number") {
      const attack = (patch.attack as number) ?? prev.attack;
      const defense = (patch.defense as number) ?? prev.defense;
      const speed = (patch.speed as number) ?? prev.speed;
      patch.power = attack + defense + speed;
    }

    const { error } = await supabaseAdmin
      .from("characters")
      .update(patch)
      .eq("id", data.character_id);
    if (error) throw new Error(error.message);

    await logAudit(
      context.userId,
      "admin_update_character",
      "character",
      data.character_id,
      data.justification,
      prev,
      patch,
    );
    return { ok: true };
  });

export const adminDeleteCharacter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { character_id: string; justification: string }) =>
    z
      .object({
        character_id: z.string().uuid(),
        justification: z.string().trim().min(5).max(500),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: prev } = await supabaseAdmin
      .from("characters")
      .select("id, user_id, name")
      .eq("id", data.character_id)
      .maybeSingle();
    if (!prev) throw new Error("Herói não encontrado.");

    await supabaseAdmin
      .from("expeditions")
      .update({ status: "cancelled" })
      .eq("character_id", data.character_id)
      .eq("status", "running");

    const { error } = await supabaseAdmin
      .from("characters")
      .delete()
      .eq("id", data.character_id);
    if (error) throw new Error(error.message);

    await logAudit(
      context.userId,
      "admin_delete_character",
      "character",
      data.character_id,
      data.justification,
      prev,
      {},
    );
    return { ok: true };
  });

export const adminResetCooldowns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { target_user_id: string; justification: string }) =>
    z
      .object({
        target_user_id: z.string().uuid(),
        justification: z.string().trim().min(5).max(500),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: chars } = await supabaseAdmin
      .from("characters")
      .select("id")
      .eq("user_id", data.target_user_id);
    const ids = (chars ?? []).map((c) => c.id);
    if (ids.length > 0) {
      await supabaseAdmin
        .from("characters")
        .update({ last_combat: null })
        .in("id", ids);
      await supabaseAdmin
        .from("expeditions")
        .update({ status: "cancelled" })
        .in("character_id", ids)
        .eq("status", "running");
    }
    await logAudit(
      context.userId,
      "admin_reset_cooldowns",
      "profile",
      data.target_user_id,
      data.justification,
      { character_ids: ids },
      {},
    );
    return { ok: true, characters: ids.length };
  });

/* ============================== WALLET ============================== */

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      target_user_id: string;
      gold_delta: number;
      premium_delta: number;
      justification: string;
    }) =>
      z
        .object({
          target_user_id: z.string().uuid(),
          gold_delta: z.number().int().min(-10_000_000).max(10_000_000),
          premium_delta: z.number().int().min(-1_000_000).max(1_000_000),
          justification: z.string().trim().min(5).max(500),
        })
        .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("user_id, gold_balance, premium_balance")
      .eq("user_id", data.target_user_id)
      .maybeSingle();

    const prevGold = Number(wallet?.gold_balance ?? 0);
    const prevPrem = Number(wallet?.premium_balance ?? 0);
    const newGold = Math.max(0, prevGold + data.gold_delta);
    const newPrem = Math.max(0, prevPrem + data.premium_delta);

    if (!wallet) {
      const { error } = await supabaseAdmin.from("wallets").insert({
        user_id: data.target_user_id,
        gold_balance: newGold,
        premium_balance: newPrem,
      });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("wallets")
        .update({ gold_balance: newGold, premium_balance: newPrem })
        .eq("user_id", data.target_user_id);
      if (error) throw new Error(error.message);
    }

    const txRows: any[] = [];
    if (data.gold_delta !== 0) {
      txRows.push({
        user_id: data.target_user_id,
        currency_type: "gold",
        transaction_kind: data.gold_delta > 0 ? "credit" : "debit",
        amount: Math.abs(data.gold_delta),
        balance_before: prevGold,
        balance_after: newGold,
        source_type: "admin_adjustment",
        description: data.justification.slice(0, 200),
      });
    }
    if (data.premium_delta !== 0) {
      txRows.push({
        user_id: data.target_user_id,
        currency_type: "premium",
        transaction_kind: data.premium_delta > 0 ? "credit" : "debit",
        amount: Math.abs(data.premium_delta),
        balance_before: prevPrem,
        balance_after: newPrem,
        source_type: "admin_adjustment",
        description: data.justification.slice(0, 200),
      });
    }
    if (txRows.length > 0) {
      await supabaseAdmin.from("currency_transactions").insert(txRows);
    }

    await logAudit(
      context.userId,
      "admin_adjust_wallet",
      "wallet",
      data.target_user_id,
      data.justification,
      { gold_balance: prevGold, premium_balance: prevPrem },
      { gold_balance: newGold, premium_balance: newPrem },
    );
    return { ok: true, gold_balance: newGold, premium_balance: newPrem };
  });

/* ============================== ITEMS ============================== */

export const adminListItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("items")
      .select("id, name, item_type, rarity, required_level")
      .eq("active", true)
      .order("required_level")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGrantItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      target_user_id: string;
      item_id: string;
      quantity: number;
      justification: string;
    }) =>
      z
        .object({
          target_user_id: z.string().uuid(),
          item_id: z.string().uuid(),
          quantity: z.number().int().min(1).max(999),
          justification: z.string().trim().min(5).max(500),
        })
        .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: character } = await supabaseAdmin
      .from("characters")
      .select("id")
      .eq("user_id", data.target_user_id)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) throw new Error("Jogador não possui herói ativo.");

    const { data: existing } = await supabaseAdmin
      .from("inventory_items")
      .select("id, quantity")
      .eq("character_id", character.id)
      .eq("item_id", data.item_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("inventory_items")
        .update({ quantity: Number(existing.quantity ?? 0) + data.quantity })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("inventory_items").insert({
        character_id: character.id,
        item_id: data.item_id,
        quantity: data.quantity,
        equipped: false,
      });
      if (error) throw new Error(error.message);
    }

    await logAudit(
      context.userId,
      "admin_grant_item",
      "inventory",
      character.id,
      data.justification,
      {},
      { item_id: data.item_id, quantity: data.quantity },
    );
    return { ok: true };
  });

/* ============================== ROLES ============================== */

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      target_user_id: string;
      role: "admin" | "moderator" | "user";
      grant: boolean;
      justification: string;
    }) =>
      z
        .object({
          target_user_id: z.string().uuid(),
          role: z.enum(["admin", "moderator", "user"]),
          grant: z.boolean(),
          justification: z.string().trim().min(5).max(500),
        })
        .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.target_user_id === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("Você não pode remover o próprio papel de admin.");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: data.target_user_id, role: data.role },
          { onConflict: "user_id,role" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.target_user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    await logAudit(
      context.userId,
      data.grant ? "admin_grant_role" : "admin_revoke_role",
      "user_role",
      data.target_user_id,
      data.justification,
      {},
      { role: data.role },
    );
    return { ok: true };
  });

/* ============================== AUDIT ============================== */

export const adminListAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { limit?: number }) =>
    z.object({ limit: z.number().int().min(1).max(500).optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rows, error } = await supabaseAdmin
      .from("admin_audit_logs")
      .select("id, admin_user_id, action, target_type, target_id, justification, previous_data, new_data, created_at, profiles!admin_audit_logs_admin_user_id_fkey(username, email)")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
