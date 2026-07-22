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
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true }),
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

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_user_id: context.userId,
      action: "set_account_status",
      target_type: "profile",
      target_id: data.target_user_id,
      previous_data: previous ?? {},
      new_data: { account_status: data.status },
      justification: data.justification,
    });

    return { ok: true };
  });

/**
 * Bootstrap: the FIRST authenticated user to call this becomes admin,
 * IF no admin exists yet. After that, this fn is a no-op.
 * Safe to leave in place — after Etapa 1 it does nothing.
 */
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
    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_user_id: context.userId,
      action: "bootstrap_admin_granted",
      target_type: "user_role",
      target_id: context.userId,
      new_data: { role: "admin" },
      justification: "Primeiro admin do projeto (bootstrap).",
    });
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
