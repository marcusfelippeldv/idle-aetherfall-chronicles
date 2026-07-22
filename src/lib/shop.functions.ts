import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listShop = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: char } = await supabaseAdmin
      .from("characters")
      .select("archetype_id, archetypes(slug)")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    const arche: any = char ? (Array.isArray((char as any).archetypes) ? (char as any).archetypes[0] : (char as any).archetypes) : null;
    const archeSlug: string | null = arche?.slug ?? null;

    const { data } = await supabaseAdmin
      .from("items")
      .select(
        "id, slug, name, description, slot, tier, rarity, attack_bonus, defense_bonus, hp_bonus, mana_bonus, speed_bonus, gold_value, sell_price, icon_url, allowed_archetypes",
      )
      .eq("buyable", true)
      .order("slot")
      .order("tier")
      .order("gold_value");

    const items = (data ?? []).filter((it: any) => {
      const allowed: string[] = it.allowed_archetypes ?? [];
      if (!allowed || allowed.length === 0) return true;
      return archeSlug ? allowed.includes(archeSlug) : false;
    });

    return { items, archetypeSlug: archeSlug };
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
      .select("id, name, slot, gold_value, buyable, allowed_archetypes")
      .eq("id", data.itemId)
      .maybeSingle();
    if (!item || !item.buyable) throw new Error("Item indisponível para compra.");

    const allowed: string[] = (item as any).allowed_archetypes ?? [];
    if (allowed.length > 0) {
      const { data: char } = await supabaseAdmin
        .from("characters")
        .select("archetypes(slug)")
        .eq("user_id", context.userId)
        .eq("is_active", true)
        .maybeSingle();
      const arche: any = char ? (Array.isArray((char as any).archetypes) ? (char as any).archetypes[0] : (char as any).archetypes) : null;
      if (!arche || !allowed.includes(arche.slug)) {
        throw new Error("Este item é exclusivo de outro arquétipo.");
      }
    }

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
