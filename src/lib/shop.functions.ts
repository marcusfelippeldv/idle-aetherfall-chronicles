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

export const listShop = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("items")
    .select("id, slug, name, description, slot, rarity, tier, class_restriction, hp_bonus, mana_bonus, attack_bonus, defense_bonus, speed_bonus, gold_value, sell_price, icon_url")
    .eq("sold_in_shop", true)
    .order("tier")
    .order("rarity");
  if (error) throw new Error(error.message);
  return data ?? [];
});

const buySchema = z.object({ itemId: z.string().uuid(), quantity: z.number().int().min(1).max(20).default(1) });

export const buyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => buySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: item, error: iErr } = await context.supabase
      .from("items").select("id, slug, gold_value, sold_in_shop, slot").eq("id", data.itemId).maybeSingle();
    if (iErr) throw new Error(iErr.message);
    if (!item || !item.sold_in_shop) throw new Error("Item indisponível na loja.");

    const cost = item.gold_value * data.quantity;
    const { data: wallet, error: wErr } = await context.supabase
      .from("wallets").select("gold_balance").eq("user_id", context.userId).maybeSingle();
    if (wErr) throw new Error(wErr.message);
    if (!wallet || wallet.gold_balance < cost) throw new Error("Ouro insuficiente.");

    const { error: uErr } = await context.supabase
      .from("wallets").update({ gold_balance: wallet.gold_balance - cost }).eq("user_id", context.userId);
    if (uErr) throw new Error(uErr.message);

    // Stackable for consumables/materials; otherwise 1 row per copy
    if (item.slot === "consumivel" || item.slot === "material") {
      const { data: existing } = await context.supabase
        .from("inventory").select("id, quantity").eq("user_id", context.userId).eq("item_id", item.id).maybeSingle();
      if (existing) {
        await context.supabase.from("inventory").update({ quantity: existing.quantity + data.quantity }).eq("id", existing.id);
      } else {
        await context.supabase.from("inventory").insert({ user_id: context.userId, item_id: item.id, quantity: data.quantity });
      }
    } else {
      const rows = Array.from({ length: data.quantity }, () => ({ user_id: context.userId, item_id: item.id, quantity: 1 }));
      const { error: insErr } = await context.supabase.from("inventory").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }

    const { bumpMetric } = await import("./progression.server");
    await bumpMetric(context.supabase, context.userId, "shop_buys", data.quantity);
    return { ok: true, spent: cost };
  });

const sellSchema = z.object({ inventoryId: z.string().uuid(), quantity: z.number().int().min(1).default(1) });

export const sellItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => sellSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: inv, error } = await context.supabase
      .from("inventory")
      .select("id, item_id, quantity, items:item_id(sell_price, slot)")
      .eq("id", data.inventoryId).eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!inv) throw new Error("Item não encontrado.");
    // Guard: cannot sell equipped items
    const { data: heroWithIt } = await context.supabase
      .from("heroes").select("id")
      .or(`equipped_arma.eq.${inv.id},equipped_ofmao.eq.${inv.id},equipped_elmo.eq.${inv.id},equipped_peito.eq.${inv.id},equipped_pernas.eq.${inv.id},equipped_pes.eq.${inv.id},equipped_amuleto.eq.${inv.id},equipped_anel.eq.${inv.id}`)
      .maybeSingle();
    if (heroWithIt) throw new Error("Desequipe o item antes de vender.");

    const qty = Math.min(inv.quantity, data.quantity);
    const price = (inv.items?.sell_price ?? 1) * qty;

    if (inv.quantity - qty <= 0) {
      await context.supabase.from("inventory").delete().eq("id", inv.id);
    } else {
      await context.supabase.from("inventory").update({ quantity: inv.quantity - qty }).eq("id", inv.id);
    }
    const { data: w } = await context.supabase.from("wallets").select("gold_balance").eq("user_id", context.userId).maybeSingle();
    await context.supabase.from("wallets").update({ gold_balance: (w?.gold_balance ?? 0) + price }).eq("user_id", context.userId);
    return { ok: true, gold: price };
  });
