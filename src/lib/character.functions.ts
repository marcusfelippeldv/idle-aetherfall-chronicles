import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Retorna herói líder da coorte + carteira + incursão ativa (se houver).
 * MVP: 1 herói ativo por conta; a coorte plena virá em fases seguintes.
 */
export const getMyCharacter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: character } = await context.supabase
      .from("characters")
      .select(
        "id, user_id, name, level, current_xp, current_hp, max_hp, current_mana, max_mana, attack, defense, speed, is_active, archetype_id, archetypes(id, slug, name, role, description)",
      )
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!character) return { character: null, wallet: null, incursion: null };

    const [{ data: wallet }, { data: incursion }] = await Promise.all([
      context.supabase
        .from("wallets")
        .select("gold_balance, premium_balance")
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("incursions")
        .select(
          "id, zone_id, mode, status, current_wave, started_at, expected_end_at, rewards_json, zones(name, slug, duration_minutes, required_level)",
        )
        .eq("user_id", context.userId)
        .eq("status", "running")
        .maybeSingle(),
    ]);

    return { character, wallet, incursion };
  });

export const createCharacter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; archetypeId: string }) =>
    z
      .object({
        name: z
          .string()
          .trim()
          .min(3, "Mínimo 3 caracteres")
          .max(20, "Máximo 20 caracteres")
          .regex(/^[a-zA-Z0-9À-ÿ _-]+$/, "Use apenas letras, números e espaços"),
        archetypeId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("characters")
      .select("id")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (existing) throw new Error("Você já possui um herói ativo.");

    const { data: arche, error: aErr } = await supabaseAdmin
      .from("archetypes")
      .select("id, base_hp, base_mana, base_attack, base_defense, base_speed")
      .eq("id", data.archetypeId)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!arche) throw new Error("Arquétipo inválido.");

    const { data: character, error } = await supabaseAdmin
      .from("characters")
      .insert({
        user_id: context.userId,
        archetype_id: arche.id,
        name: data.name,
        level: 1,
        current_xp: 0,
        current_hp: arche.base_hp,
        max_hp: arche.base_hp,
        current_mana: arche.base_mana,
        max_mana: arche.base_mana,
        attack: arche.base_attack,
        defense: arche.base_defense,
        speed: arche.base_speed,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      const msg = error.message ?? "";
      if (error.code === "23505" || /duplicate|unique/i.test(msg)) {
        throw new Error("Este nome já está em uso — escolha outro.");
      }
      throw new Error(msg || "Não foi possível criar o herói.");
    }

    // Cria coorte com o líder recém-criado (upsert idempotente).
    await supabaseAdmin
      .from("cohorts")
      .upsert(
        { user_id: context.userId, leader_character_id: character.id, slots_unlocked: 1 },
        { onConflict: "user_id" },
      );

    return { id: character.id };
  });
