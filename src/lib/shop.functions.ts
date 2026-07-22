import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listShop = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("items")
      .select(
        "id, slug, name, description, slot, tier, rarity, attack_bonus, defense_bonus, hp_bonus, mana_bonus, speed_bonus, gold_value, sell_price",
      )
      .eq("buyable", true)
      .order("slot")
      .order("tier")
      .order("gold_value");
    return { items: data ?? [] };
  });

export const buyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { itemId: string; quantity?: number }) =>
    z.object({ itemId: z.string().uuid(), quantity: z.number().int().positive().max(99).optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const qty = data.quantity ?? 1;

    const { data: item } = await supabaseAdmin
      .from("items")
      .select("id, name, slot, gold_value, buyable")
      .eq("id", data.itemId)
      .maybeSingle();
    if (!item || !item.buyable) throw new Error("Item indisponível para compra.");

    const cost = item.gold_value * qty;

    const { data: w } = await supabaseAdmin
      .from("wallets")
      .select("gold_balance")
      .eq("user_id", context.userId)
      .maybeSingle();
    const balance = Number(w?.gold_balance ?? 0);
    if (balance < cost) throw new Error(`Ouro insuficiente (custa ${cost}, você tem ${balance}).`);

    await supabaseAdmin
      .from("wallets")
      .update({ gold_balance: balance - cost })
      .eq("user_id", context.userId);

    // Consumíveis empilham; equipamentos são individuais para permitir raridades.
    if (item.slot === "consumivel" || item.slot === "material") {
      const { data: existing } = await supabaseAdmin
        .from("inventory")
        .select("id, quantity")
        .eq("user_id", context.userId)
        .eq("item_id", item.id)
        .maybeSingle();
      if (existing) {
        await supabaseAdmin
          .from("inventory")
          .update({ quantity: existing.quantity + qty })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin
          .from("inventory")
          .insert({ user_id: context.userId, item_id: item.id, quantity: qty });
      }
    } else {
      const rows = Array.from({ length: qty }).map(() => ({
        user_id: context.userId,
        item_id: item.id,
        quantity: 1,
      }));
      await supabaseAdmin.from("inventory").insert(rows);
    }

    return { ok: true, cost, name: item.name, quantity: qty };
  });
