import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* -------------------------- Character CRUD -------------------------- */

export const getMyCharacter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: character } = await context.supabase
      .from("characters")
      .select(
        "id, user_id, name, level, current_xp, current_hp, max_hp, attack, defense, speed, power, is_active, defeated_bosses, last_combat, class_id, classes(id, name, slug, description, base_hp, base_attack, base_defense, base_speed)",
      )
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!character) return { character: null, expedition: null, wallet: null };

    const [{ data: expedition }, { data: wallet }] = await Promise.all([
      context.supabase
        .from("expeditions")
        .select(
          "id, region_id, status, duration_minutes, started_at, expected_end_at, rng_seed, regions(name, slug, required_level)",
        )
        .eq("character_id", character.id)
        .eq("status", "running")
        .maybeSingle(),
      context.supabase
        .from("wallets")
        .select("gold_balance, premium_balance")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);

    return { character, expedition, wallet };
  });

export const createCharacter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; classId: string }) =>
    z
      .object({
        name: z
          .string()
          .trim()
          .min(3, "Mínimo 3 caracteres")
          .max(20, "Máximo 20 caracteres")
          .regex(/^[a-zA-Z0-9À-ÿ _-]+$/, "Use apenas letras, números e espaços"),
        classId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    // 1 herói ativo por conta (garantido também por unique index).
    const { data: existing } = await context.supabase
      .from("characters")
      .select("id")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (existing) throw new Error("Você já possui um herói ativo.");

    const { data: cls } = await context.supabase
      .from("classes")
      .select("id, base_hp, base_attack, base_defense, base_speed")
      .eq("id", data.classId)
      .eq("active", true)
      .maybeSingle();
    if (!cls) throw new Error("Classe inválida.");

    const { data: character, error } = await context.supabase
      .from("characters")
      .insert({
        user_id: context.userId,
        name: data.name,
        class_id: cls.id,
        level: 1,
        current_xp: 0,
        current_hp: cls.base_hp,
        max_hp: cls.base_hp,
        attack: cls.base_attack,
        defense: cls.base_defense,
        speed: cls.base_speed,
        power: cls.base_attack + cls.base_defense + cls.base_speed,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: character.id };
  });

export const renameCharacter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string }) =>
    z.object({ name: z.string().trim().min(3).max(20) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("characters")
      .update({ name: data.name })
      .eq("user_id", context.userId)
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
