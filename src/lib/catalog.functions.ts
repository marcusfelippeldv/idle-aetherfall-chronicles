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

export const listRanking = createServerFn({ method: "GET" })
  .inputValidator((input?: { sortBy?: "power" | "level" | "bosses" }) => {
    const v = input?.sortBy ?? "power";
    if (!["power", "level", "bosses"].includes(v))
      throw new Error("sortBy inválido");
    return { sortBy: v as "power" | "level" | "bosses" };
  })
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const sortBy = data?.sortBy ?? "power";
    let query = supabase
      .from("characters")
      .select("id, name, level, power, defeated_bosses, classes(name)")
      .limit(50);
    if (sortBy === "level") {
      query = query.order("level", { ascending: false }).order("power", { ascending: false });
    } else {
      query = query.order("power", { ascending: false }).order("level", { ascending: false });
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    let mapped = (rows ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      power: c.power,
      bossesCount: Array.isArray(c.defeated_bosses) ? c.defeated_bosses.length : 0,
      className:
        (c.classes as { name: string } | { name: string }[] | null) &&
        (Array.isArray(c.classes) ? c.classes[0]?.name : c.classes?.name),
    }));
    if (sortBy === "bosses") {
      mapped = mapped.sort((a, b) => b.bossesCount - a.bossesCount || b.power - a.power);
    }
    return mapped;
  });
