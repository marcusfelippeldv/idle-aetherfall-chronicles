import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: character } = await context.supabase
      .from("characters")
      .select("id, level")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) return { items: [], character: null };

    const { data, error } = await context.supabase
      .from("inventory_items")
      .select(
        "id, quantity, equipped, items(id, name, description, item_type, rarity, required_level, attack_bonus, defense_bonus, hp_bonus, speed_bonus, sell_price)",
      )
      .eq("character_id", character.id)
      .order("acquired_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [], character };
  });

async function recomputeAndSaveStats(
  supabase: any,
  characterId: string,
): Promise<void> {
  const { data: character } = await supabase
    .from("characters")
    .select(
      "id, level, current_xp, class_id, classes(base_hp, base_attack, base_defense, base_speed)",
    )
    .eq("id", characterId)
    .maybeSingle();
  if (!character) return;

  const { data: equipped } = await supabase
    .from("inventory_items")
    .select(
      "items(attack_bonus, defense_bonus, hp_bonus, speed_bonus)",
    )
    .eq("character_id", characterId)
    .eq("equipped", true);

  const cls = character.classes;
  const lvl = character.level;
  // recomputa atributos base por nível usando growthFor via módulo server-only
  const { growthFor } = await import("@/lib/game/formulas.server");
  // approximate: use current class growth key from a separate lookup — but we have base_* on the class.
  // Since growth slug is not returned here, re-fetch:
  const { data: cls2 } = await supabase
    .from("classes")
    .select("slug")
    .eq("id", character.class_id)
    .maybeSingle();
  const growth = growthFor(cls2?.slug ?? "");
  const gainedLevels = lvl - 1;
  let maxHp = cls.base_hp + growth.hp * gainedLevels;
  let atk = cls.base_attack + growth.attack * gainedLevels;
  let def = cls.base_defense + growth.defense * gainedLevels;
  let spd = cls.base_speed + growth.speed * gainedLevels;

  for (const row of equipped ?? []) {
    const it = row.items;
    if (!it) continue;
    atk += it.attack_bonus ?? 0;
    def += it.defense_bonus ?? 0;
    maxHp += it.hp_bonus ?? 0;
    spd += it.speed_bonus ?? 0;
  }

  await supabase
    .from("characters")
    .update({
      max_hp: maxHp,
      current_hp: maxHp,
      attack: atk,
      defense: def,
      speed: spd,
      power: atk + def + spd,
    })
    .eq("id", characterId);
}

export const equipItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inventoryItemId: string }) =>
    z.object({ inventoryItemId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: character } = await context.supabase
      .from("characters")
      .select("id, level")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) throw new Error("Nenhum herói ativo.");

    const { data: inv } = await context.supabase
      .from("inventory_items")
      .select("id, character_id, items(id, item_type, required_level)")
      .eq("id", data.inventoryItemId)
      .maybeSingle();
    if (!inv || inv.character_id !== character.id)
      throw new Error("Item não encontrado.");
    const item = inv.items as {
      item_type: string;
      required_level: number;
    } | null;
    if (!item) throw new Error("Item inválido.");
    if (character.level < item.required_level)
      throw new Error(`Requer nível ${item.required_level}.`);

    // Desequipa qualquer outro item do mesmo slot.
    const { data: sameSlot } = await context.supabase
      .from("inventory_items")
      .select("id, items(item_type)")
      .eq("character_id", character.id)
      .eq("equipped", true);
    for (const row of sameSlot ?? []) {
      if ((row.items as { item_type: string } | null)?.item_type === item.item_type) {
        await context.supabase
          .from("inventory_items")
          .update({ equipped: false })
          .eq("id", row.id);
      }
    }

    await context.supabase
      .from("inventory_items")
      .update({ equipped: true })
      .eq("id", data.inventoryItemId);

    await recomputeAndSaveStats(context.supabase, character.id);
    return { ok: true };
  });

export const unequipItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inventoryItemId: string }) =>
    z.object({ inventoryItemId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: character } = await context.supabase
      .from("characters")
      .select("id")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) throw new Error("Nenhum herói ativo.");

    await context.supabase
      .from("inventory_items")
      .update({ equipped: false })
      .eq("id", data.inventoryItemId)
      .eq("character_id", character.id);

    await recomputeAndSaveStats(context.supabase, character.id);
    return { ok: true };
  });

export const sellItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inventoryItemId: string }) =>
    z.object({ inventoryItemId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: character } = await context.supabase
      .from("characters")
      .select("id")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!character) throw new Error("Nenhum herói ativo.");

    const { data: inv } = await context.supabase
      .from("inventory_items")
      .select("id, quantity, equipped, items(sell_price)")
      .eq("id", data.inventoryItemId)
      .eq("character_id", character.id)
      .maybeSingle();
    if (!inv) throw new Error("Item não encontrado.");
    if (inv.equipped) throw new Error("Desequipe antes de vender.");

    const price =
      (inv.items as { sell_price: number } | null)?.sell_price ?? 0;
    const total = price * inv.quantity;

    await context.supabase
      .from("inventory_items")
      .delete()
      .eq("id", data.inventoryItemId);

    if (total > 0) {
      const { data: wallet } = await context.supabase
        .from("wallets")
        .select("gold_balance")
        .eq("user_id", context.userId)
        .maybeSingle();
      const newBalance = Number(wallet?.gold_balance ?? 0) + total;
      await context.supabase
        .from("wallets")
        .update({ gold_balance: newBalance })
        .eq("user_id", context.userId);
      await context.supabase.from("currency_transactions").insert({
        user_id: context.userId,
        currency_type: "gold",
        transaction_kind: "credit",
        amount: total,
        balance_before: newBalance - total,
        balance_after: newBalance,
        source_type: "sell_item",
        source_id: data.inventoryItemId,
        description: "Venda de item",
      });
    }

    return { ok: true, gold: total };
  });
