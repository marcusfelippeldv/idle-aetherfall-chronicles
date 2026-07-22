import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { EQUIP_SLOTS, type EquipSlot } from "@/lib/game/rarity";

const EQUIP_COLS: Record<EquipSlot, string> = {
  arma: "equipped_arma",
  ofmao: "equipped_ofmao",
  elmo: "equipped_elmo",
  peito: "equipped_peito",
  pernas: "equipped_pernas",
  pes: "equipped_pes",
  amuleto: "equipped_amuleto",
  anel: "equipped_anel",
};

export type InventoryRow = {
  id: string;
  quantity: number;
  equippedSlot: EquipSlot | null;
  item: {
    id: string;
    slug: string;
    name: string;
    description: string;
    slot: string;
    tier: number;
    rarity: string;
    attack_bonus: number;
    defense_bonus: number;
    hp_bonus: number;
    mana_bonus: number;
    speed_bonus: number;
    gold_value: number;
    sell_price: number;
  };
};

export const listInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: InventoryRow[]; equipped: Partial<Record<EquipSlot, string>> }> => {
    const [{ data: rows }, { data: char }] = await Promise.all([
      context.supabase
        .from("inventory")
        .select(
          "id, quantity, items(id, slug, name, description, slot, tier, rarity, attack_bonus, defense_bonus, hp_bonus, mana_bonus, speed_bonus, gold_value, sell_price)",
        )
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("characters")
        .select(
          "equipped_arma, equipped_ofmao, equipped_elmo, equipped_peito, equipped_pernas, equipped_pes, equipped_amuleto, equipped_anel",
        )
        .eq("user_id", context.userId)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    const equipped: Partial<Record<EquipSlot, string>> = {};
    if (char) {
      for (const s of EQUIP_SLOTS) {
        const inv = (char as any)[EQUIP_COLS[s]];
        if (inv) equipped[s] = inv;
      }
    }

    const items: InventoryRow[] = (rows ?? []).map((r: any) => {
      const item = Array.isArray(r.items) ? r.items[0] : r.items;
      let equippedSlot: EquipSlot | null = null;
      for (const s of EQUIP_SLOTS) if (equipped[s] === r.id) equippedSlot = s;
      return { id: r.id, quantity: r.quantity, equippedSlot, item };
    });

    return { items, equipped };
  });

export const equipItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inventoryId: string }) =>
    z.object({ inventoryId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inv } = await supabaseAdmin
      .from("inventory")
      .select("id, user_id, items(slot)")
      .eq("id", data.inventoryId)
      .maybeSingle();
    if (!inv || inv.user_id !== context.userId) throw new Error("Item não encontrado.");
    const item: any = Array.isArray(inv.items) ? inv.items[0] : inv.items;
    const slot = item?.slot as EquipSlot;
    if (!slot || !EQUIP_SLOTS.includes(slot)) {
      throw new Error("Este item não pode ser equipado.");
    }

    const { data: char } = await supabaseAdmin
      .from("characters")
      .select("id, " + EQUIP_SLOTS.map((s) => EQUIP_COLS[s]).join(", "))
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!char) throw new Error("Nenhum herói ativo.");

    // Se este inventoryId já está em outro slot, limpa-o antes.
    const patch: any = {};
    for (const s of EQUIP_SLOTS) {
      if ((char as any)[EQUIP_COLS[s]] === data.inventoryId) patch[EQUIP_COLS[s]] = null;
    }
    patch[EQUIP_COLS[slot]] = data.inventoryId;

    const { error } = await supabaseAdmin.from("characters").update(patch).eq("id", (char as any).id);
    if (error) throw new Error(error.message);
    return { ok: true, slot };
  });

export const unequipItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slot: EquipSlot }) =>
    z.object({ slot: z.enum(["arma","ofmao","elmo","peito","pernas","pes","amuleto","anel"]) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = { [EQUIP_COLS[data.slot]]: null };
    const { error } = await supabaseAdmin
      .from("characters")
      .update(patch)
      .eq("user_id", context.userId)
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sellItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inventoryId: string; quantity?: number }) =>
    z.object({ inventoryId: z.string().uuid(), quantity: z.number().int().positive().optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inv } = await supabaseAdmin
      .from("inventory")
      .select("id, user_id, quantity, items(sell_price, name)")
      .eq("id", data.inventoryId)
      .maybeSingle();
    if (!inv || inv.user_id !== context.userId) throw new Error("Item não encontrado.");
    const item: any = Array.isArray(inv.items) ? inv.items[0] : inv.items;
    const qtd = Math.min(inv.quantity, data.quantity ?? inv.quantity);
    const gold = qtd * (item?.sell_price ?? 0);

    // Desequipa se necessário.
    for (const s of EQUIP_SLOTS) {
      const col = EQUIP_COLS[s];
      await supabaseAdmin
        .from("characters")
        .update({ [col]: null } as any)
        .eq("user_id", context.userId)
        .eq(col, data.inventoryId);
    }

    if (qtd >= inv.quantity) {
      await supabaseAdmin.from("inventory").delete().eq("id", inv.id);
    } else {
      await supabaseAdmin.from("inventory").update({ quantity: inv.quantity - qtd }).eq("id", inv.id);
    }

    const { data: w } = await supabaseAdmin
      .from("wallets")
      .select("gold_balance")
      .eq("user_id", context.userId)
      .maybeSingle();
    await supabaseAdmin
      .from("wallets")
      .update({ gold_balance: Number(w?.gold_balance ?? 0) + gold })
      .eq("user_id", context.userId);

    return { gold, name: item?.name ?? "Item", quantity: qtd };
  });
