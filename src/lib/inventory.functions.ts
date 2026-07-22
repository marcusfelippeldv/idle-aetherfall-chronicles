import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EQUIP_COLS = ["arma", "ofmao", "elmo", "peito", "pernas", "pes", "amuleto", "anel"] as const;
type EquipCol = (typeof EQUIP_COLS)[number];

export const listInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("inventory")
      .select("id, quantity, acquired_at, items:item_id(id, slug, name, description, slot, rarity, tier, class_restriction, hp_bonus, mana_bonus, attack_bonus, defense_bonus, speed_bonus, sell_price, icon_url)")
      .eq("user_id", context.userId)
      .order("acquired_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("wallets").select("gold_balance, premium_balance").eq("user_id", context.userId).maybeSingle();
    return { gold: data?.gold_balance ?? 0, premium: data?.premium_balance ?? 0 };
  });

const equipSchema = z.object({ heroId: z.string().uuid(), inventoryId: z.string().uuid() });

export const equipItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => equipSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: inv, error } = await context.supabase
      .from("inventory").select("id, items:item_id(slot)").eq("id", data.inventoryId).eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!inv?.items) throw new Error("Item inválido.");
    const slot = inv.items.slot as EquipCol;
    if (!EQUIP_COLS.includes(slot)) throw new Error("Este item não é equipável.");
    const update = equipUpdate(slot, inv.id);
    const { error: uErr } = await context.supabase
      .from("heroes").update(update).eq("id", data.heroId).eq("user_id", context.userId);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

const unequipSchema = z.object({ heroId: z.string().uuid(), slot: z.enum(EQUIP_COLS) });

export const unequipItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => unequipSchema.parse(d))
  .handler(async ({ data, context }) => {
    const update = equipUpdate(data.slot, null);
    const { error } = await context.supabase
      .from("heroes").update(update).eq("id", data.heroId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);

function equipUpdate(slot: EquipCol, value: string | null) {
  switch (slot) {
    case "arma": return { equipped_arma: value };
    case "ofmao": return { equipped_ofmao: value };
    case "elmo": return { equipped_elmo: value };
    case "peito": return { equipped_peito: value };
    case "pernas": return { equipped_pernas: value };
    case "pes": return { equipped_pes: value };
    case "amuleto": return { equipped_amuleto: value };
    case "anel": return { equipped_anel: value };
  }
}
    return { ok: true };
  });
