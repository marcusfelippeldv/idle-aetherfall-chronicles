import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listArchetypes = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("archetypes")
    .select(
      "id, slug, name, role, description, base_hp, base_mana, base_attack, base_defense, base_speed, sort_order",
    )
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listZones = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("zones")
    .select(
      "id, slug, name, description, required_level, difficulty_stars, duration_minutes, xp_multiplier, loot_multiplier, sort_order",
    )
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listRanking = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("characters")
    .select("id, name, level, attack, defense, speed, archetypes(name, slug)")
    .eq("is_active", true)
    .order("level", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((c: any) => {
    const arche = Array.isArray(c.archetypes) ? c.archetypes[0] : c.archetypes;
    return {
      id: c.id,
      name: c.name,
      level: c.level,
      power: (c.attack ?? 0) + (c.defense ?? 0) + (c.speed ?? 0),
      archetypeName: arche?.name ?? "—",
    };
  });
});
