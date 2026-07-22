import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultPrioritiesForRole } from "./combat/defaults";
import type { PriorityRule } from "./combat/types";

const createSchema = z.object({
  name: z.string().trim().min(2).max(24),
  classSlug: z.string().trim().min(2).max(40),
});


const COMPANION_MAP: Record<string, string[]> = {
  guardiao: ["vidente", "arqueiro", "arcanista"],
  espadachim: ["guardiao", "vidente", "arcanista"],
  arqueiro: ["guardiao", "vidente", "punho"],
  arcanista: ["guardiao", "vidente", "arqueiro"],
  vidente: ["guardiao", "espadachim", "arcanista"],
  punho: ["guardiao", "vidente", "arcanista"],
};

const COMPANION_NAMES: Record<string, string[]> = {
  guardiao: ["Bram", "Kaeloth", "Ilya"],
  espadachim: ["Sylas", "Renn", "Aeris"],
  arqueiro: ["Lyra", "Fenn", "Cyra"],
  arcanista: ["Ordin", "Vaelis", "Mira"],
  vidente: ["Elowen", "Séraphine", "Nyx"],
  punho: ["Rurik", "Tama", "Zhen"],
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listBaseClasses = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("classes")
    .select("slug, name, role, description, base_hp, base_mana, base_atk, base_def, base_spd, awakening_name, awakening_desc")
    .eq("tier", 1)
    .order("slug");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getMyHeroes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("heroes")
      .select("id, name, class_slug, is_protagonist, level, hp, mana, atk, def, spd, awakening_energy")
      .eq("user_id", context.userId)
      .order("is_protagonist", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyParty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("parties")
      .select("id, slot1, slot2, slot3, slot4, entity_slug")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const setSlotSchema = z.object({
  slot: z.enum(["slot1", "slot2", "slot3", "slot4"]),
  heroId: z.string().uuid().nullable(),
});

export const setPartySlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => setSlotSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: party, error: pErr } = await context.supabase
      .from("parties")
      .select("id, slot1, slot2, slot3, slot4")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!party) throw new Error("Party inexistente.");

    const patch: {
      slot1?: string | null;
      slot2?: string | null;
      slot3?: string | null;
      slot4?: string | null;
    } = { [data.slot]: data.heroId };
    if (data.heroId) {
      for (const s of ["slot1", "slot2", "slot3", "slot4"] as const) {
        if (s !== data.slot && party[s] === data.heroId) {
          patch[s] = party[data.slot] ?? null;
        }
      }
    }

    const { error: uErr } = await context.supabase
      .from("parties")
      .update(patch)
      .eq("id", party.id);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

export const createProtagonist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("heroes")
      .select("id")
      .eq("user_id", context.userId)
      .eq("is_protagonist", true)
      .maybeSingle();
    if (existing) throw new Error("Você já criou seu Condutor.");

    const companionSlugs = COMPANION_MAP[data.classSlug] ?? ["guardiao", "vidente", "arqueiro"];
    const allSlugs = [data.classSlug, ...companionSlugs];

    const { data: classes, error: clsErr } = await context.supabase
      .from("classes")
      .select("slug, role, base_hp, base_mana, base_atk, base_def, base_spd")
      .in("slug", allSlugs)
      .eq("tier", 1);
    if (clsErr) throw new Error(clsErr.message);
    const bySlug = new Map(classes?.map((c) => [c.slug, c]) ?? []);
    if (!bySlug.has(data.classSlug)) throw new Error("Classe inválida.");

    const rows = allSlugs.map((slug, idx) => {
      const c = bySlug.get(slug)!;
      const isProt = idx === 0;
      const compName = COMPANION_NAMES[data.classSlug]?.[idx - 1] ?? `Companheiro ${idx}`;
      return {
        user_id: context.userId,
        name: isProt ? data.name : compName,
        class_slug: slug,
        element: "neutro" as const,
        is_protagonist: isProt,
        level: 1,
        xp: 0,
        hp: c.base_hp,
        mana: c.base_mana,
        atk: c.base_atk,
        def: c.base_def,
        spd: c.base_spd,
        awakening_energy: 0,
        priorities: defaultPrioritiesForRole(c.role) as unknown as Database["public"]["Tables"]["heroes"]["Insert"]["priorities"],
      };
    });


    const { data: inserted, error: insErr } = await context.supabase
      .from("heroes")
      .insert(rows)
      .select("id, is_protagonist, created_at")
      .order("is_protagonist", { ascending: false })
      .order("created_at", { ascending: true });
    if (insErr) throw new Error(insErr.message);
    if (!inserted || inserted.length < 4) throw new Error("Falha ao criar heróis.");

    const [h1, h2, h3, h4] = inserted;
    const { error: partyErr } = await context.supabase.from("parties").insert({
      user_id: context.userId,
      slot1: h1.id,
      slot2: h2.id,
      slot3: h3.id,
      slot4: h4.id,
    });
    if (partyErr) throw new Error(partyErr.message);

    return { id: h1.id };
  });
