import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listStoreCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const client = createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined as any },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data: products, error } = await client
    .from("products")
    .select("*")
    .eq("active", true)
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);

  // Enrich shop_items with item details
  const itemIds = (products ?? [])
    .filter((p) => p.product_kind === "shop_item")
    .map((p) => (p.metadata as any)?.item_id)
    .filter(Boolean);

  let itemsById: Record<string, any> = {};
  if (itemIds.length > 0) {
    const { data: items } = await client.from("items").select("*").in("id", itemIds);
    itemsById = Object.fromEntries((items ?? []).map((i) => [i.id, i]));
  }

  const crystals = (products ?? [])
    .filter((p) => p.product_kind === "premium_pack" || p.product_kind === "founder_pack")
    .map((p) => ({ ...p, item: null }));
  const bazar = (products ?? [])
    .filter((p) => p.product_kind === "shop_item" && (p.premium_amount ?? 0) > 0)
    .map((p) => ({ ...p, item: itemsById[(p.metadata as any)?.item_id] ?? null }));
  const mercado = (products ?? [])
    .filter((p) => p.product_kind === "shop_item" && (p.metadata as any)?.gold_price)
    .map((p) => ({ ...p, item: itemsById[(p.metadata as any)?.item_id] ?? null }));

  return { crystals, bazar, mercado };
});

const purchaseInput = z.object({ productId: z.string().uuid() });

export const purchaseWithCurrency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => purchaseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", data.productId)
      .eq("active", true)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product) throw new Error("Produto indisponível.");
    if (product.product_kind !== "shop_item") throw new Error("Este item exige pagamento em dinheiro real.");

    const meta = (product.metadata as any) ?? {};
    const itemId = meta.item_id as string | undefined;
    const quantity = Math.max(1, Number(meta.quantity ?? 1));
    if (!itemId) throw new Error("Produto mal configurado.");

    const goldPrice = Number(meta.gold_price ?? 0);
    const crystalPrice = Number(product.premium_amount ?? 0);
    const usesCrystals = crystalPrice > 0;
    const usesGold = goldPrice > 0;
    if (!usesCrystals && !usesGold) throw new Error("Preço não definido.");

    const { data: wallet, error: wErr } = await supabase
      .from("wallets")
      .select("gold_balance, premium_balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (wErr) throw new Error(wErr.message);
    if (!wallet) throw new Error("Carteira não encontrada.");

    const goldBefore = Number(wallet.gold_balance);
    const crystalsBefore = Number(wallet.premium_balance);

    if (usesCrystals && crystalsBefore < crystalPrice) throw new Error("Cristais insuficientes.");
    if (usesGold && goldBefore < goldPrice) throw new Error("Ouro insuficiente.");

    const goldAfter = usesGold ? goldBefore - goldPrice : goldBefore;
    const crystalsAfter = usesCrystals ? crystalsBefore - crystalPrice : crystalsBefore;

    const { error: uErr } = await supabase
      .from("wallets")
      .update({ gold_balance: goldAfter, premium_balance: crystalsAfter })
      .eq("user_id", userId);
    if (uErr) throw new Error(uErr.message);

    // Log transaction
    await supabase.from("currency_transactions").insert({
      user_id: userId,
      currency_type: usesCrystals ? "premium" : "gold",
      transaction_kind: "debit",
      amount: usesCrystals ? crystalPrice : goldPrice,
      balance_before: usesCrystals ? crystalsBefore : goldBefore,
      balance_after: usesCrystals ? crystalsAfter : goldAfter,
      source_type: "shop_purchase",
      source_id: product.id,
      description: `Compra: ${product.name}`,
    });

    // Deliver item to character
    const { data: character } = await supabase
      .from("characters")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!character) throw new Error("Crie um herói antes de comprar itens.");

    const { data: existing } = await supabase
      .from("inventory_items")
      .select("id, quantity")
      .eq("character_id", character.id)
      .eq("item_id", itemId)
      .eq("equipped", false)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("inventory_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);
    } else {
      await supabase.from("inventory_items").insert({
        character_id: character.id,
        item_id: itemId,
        quantity,
        equipped: false,
      });
    }

    return {
      ok: true,
      productName: product.name,
      newGold: goldAfter,
      newCrystals: crystalsAfter,
    };
  });

export const getMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ currency: z.enum(["gold", "premium"]).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("currency_transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.currency) q = q.eq("currency_type", data.currency);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { transactions: rows ?? [] };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, products(name, premium_amount)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });
