import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (
          key.startsWith("sb_") &&
          h.get("Authorization") === `Bearer ${key}`
        ) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listClasses = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = serverPublicClient();
    const { data, error } = await supabase
      .from("classes")
      .select(
        "id, name, slug, description, base_hp, base_attack, base_defense, base_speed, order_index",
      )
      .eq("active", true)
      .order("order_index");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const listRegions = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = serverPublicClient();
    const { data, error } = await supabase
      .from("regions")
      .select("id, name, slug, description, required_level, order_index")
      .eq("active", true)
      .order("order_index");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const listProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = serverPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, product_kind, price_cents, currency, premium_amount, order_index",
      )
      .eq("active", true)
      .order("order_index");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const listRanking = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = serverPublicClient();
    const { data, error } = await supabase
      .from("characters")
      .select(
        "id, name, level, power, classes(name)",
      )
      .order("power", { ascending: false })
      .order("level", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      power: c.power,
      className:
        (c.classes as { name: string } | { name: string }[] | null) &&
        (Array.isArray(c.classes) ? c.classes[0]?.name : c.classes?.name),
    }));
  },
);
