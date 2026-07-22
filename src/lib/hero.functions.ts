import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  name: z.string().trim().min(2).max(24),
  classSlug: z.string().trim().min(2).max(40),
});

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
      .select("id, name, class_slug, is_protagonist, level, hp, mana, atk, def, spd")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createProtagonist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Prevent duplicate protagonist
    const { data: existing } = await context.supabase
      .from("heroes")
      .select("id")
      .eq("user_id", context.userId)
      .eq("is_protagonist", true)
      .maybeSingle();
    if (existing) throw new Error("Você já criou seu protagonista.");

    const { data: cls, error: clsErr } = await context.supabase
      .from("classes")
      .select("slug, base_hp, base_mana, base_atk, base_def, base_spd")
      .eq("slug", data.classSlug)
      .eq("tier", 1)
      .maybeSingle();
    if (clsErr) throw new Error(clsErr.message);
    if (!cls) throw new Error("Classe inválida.");

    const { data: inserted, error: insErr } = await context.supabase
      .from("heroes")
      .insert({
        user_id: context.userId,
        name: data.name,
        class_slug: cls.slug,
        element: "neutro",
        is_protagonist: true,
        level: 1,
        xp: 0,
        hp: cls.base_hp,
        mana: cls.base_mana,
        atk: cls.base_atk,
        def: cls.base_def,
        spd: cls.base_spd,
        awakening_energy: 0,
        priorities: [],
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { id: inserted.id };
  });
