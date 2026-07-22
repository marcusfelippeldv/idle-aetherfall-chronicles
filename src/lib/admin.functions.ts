import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [accountsTotal, accountsRecent, characters, incursions, goldSum] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()),
      supabaseAdmin.from("characters").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("incursions").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("wallets").select("gold_balance"),
    ]);
    const totalGold = (goldSum.data ?? []).reduce((acc, r: any) => acc + Number(r.gold_balance ?? 0), 0);
    return {
      accountsTotal: accountsTotal.count ?? 0,
      accountsLast7d: accountsRecent.count ?? 0,
      charactersActive: characters.count ?? 0,
      incursionsTotal: incursions.count ?? 0,
      totalGold,
    };
  });

export const claimBootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { granted: false, reason: "admin_already_exists" as const };
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { roles: (data ?? []).map((r) => r.role as string) };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, wallet] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, email, username, display_name, account_status, created_at, last_login_at")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
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

export const adminListAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { limit?: number }) =>
    z.object({ limit: z.number().int().min(1).max(500).optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("admin_audit_logs")
      .select(
        "id, admin_user_id, action, target_type, target_id, previous_data, new_data, justification, created_at, profiles!admin_audit_logs_admin_user_id_fkey(username, email)",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
