import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Incursão idle: escolhe uma zona, o herói combate 10 ondas em `duration_minutes`.
 * Recompensa proporcional ao progresso quando reclamada.
 */

export const startIncursion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { zoneId: string }) =>
    z.object({ zoneId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: active } = await supabaseAdmin
      .from("incursions")
      .select("id")
      .eq("user_id", context.userId)
      .eq("status", "em_andamento")
      .maybeSingle();
    if (active) throw new Error("Você já tem uma incursão ativa.");

    const { data: char } = await supabaseAdmin
      .from("characters")
      .select("id, level")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!char) throw new Error("Crie um herói antes de iniciar uma incursão.");

    const { data: zone, error: zErr } = await supabaseAdmin
      .from("zones")
      .select("id, required_level, duration_minutes")
      .eq("id", data.zoneId)
      .maybeSingle();
    if (zErr) throw new Error(zErr.message);
    if (!zone) throw new Error("Zona inválida.");
    if (char.level < zone.required_level) {
      throw new Error(`Requer nível ${zone.required_level}.`);
    }

    const now = new Date();
    const end = new Date(now.getTime() + zone.duration_minutes * 60_000);

    const { data: inc, error } = await supabaseAdmin
      .from("incursions")
      .insert({
        user_id: context.userId,
        zone_id: zone.id,
        mode: "ativa",
        status: "em_andamento",
        current_wave: 0,
        started_at: now.toISOString(),
        expected_end_at: end.toISOString(),
        rng_seed: Math.floor(Math.random() * 2 ** 31),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inc.id };
  });

export const cancelIncursion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { incursionId: string }) =>
    z.object({ incursionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("incursions")
      .update({ status: "cancelada", ended_at: new Date().toISOString() })
      .eq("id", data.incursionId)
      .eq("user_id", context.userId)
      .eq("status", "em_andamento");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const claimIncursion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { incursionId: string }) =>
    z.object({ incursionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inc } = await supabaseAdmin
      .from("incursions")
      .select(
        "id, status, started_at, expected_end_at, zone_id, zones(xp_multiplier, loot_multiplier, difficulty_stars, required_level)",
      )
      .eq("id", data.incursionId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!inc) throw new Error("Incursão não encontrada.");
    if (inc.status !== "em_andamento") throw new Error("Esta incursão já foi encerrada.");

    const now = Date.now();
    const end = new Date(inc.expected_end_at).getTime();
    if (now < end) throw new Error("A incursão ainda está em andamento.");

    const zone: any = Array.isArray(inc.zones) ? inc.zones[0] : inc.zones;
    const stars = zone?.difficulty_stars ?? 1;
    const xpMult = Number(zone?.xp_multiplier ?? 1);
    const lootMult = Number(zone?.loot_multiplier ?? 1);

    const xpGain = Math.round(60 * stars * xpMult);
    const goldGain = Math.round(40 * stars * lootMult);

    // Atualiza carteira.
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("gold_balance")
      .eq("user_id", context.userId)
      .maybeSingle();
    await supabaseAdmin
      .from("wallets")
      .update({ gold_balance: Number(wallet?.gold_balance ?? 0) + goldGain })
      .eq("user_id", context.userId);

    // Atualiza herói (XP → level-up simples: 100xp * nível).
    const { data: char } = await supabaseAdmin
      .from("characters")
      .select("id, level, current_xp, max_hp, max_mana, attack, defense, speed")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();

    let leveledUp = false;
    let newLevel = char?.level ?? 1;
    if (char) {
      let xp = Number(char.current_xp ?? 0) + xpGain;
      let level = char.level;
      let maxHp = char.max_hp;
      let maxMana = char.max_mana;
      let atk = char.attack;
      let def = char.defense;
      let spd = char.speed;
      let needed = 100 * level;
      while (xp >= needed) {
        xp -= needed;
        level += 1;
        maxHp += 12;
        maxMana += 6;
        atk += 2;
        def += 2;
        spd += 1;
        leveledUp = true;
        needed = 100 * level;
      }
      newLevel = level;
      await supabaseAdmin
        .from("characters")
        .update({
          current_xp: xp,
          level,
          max_hp: maxHp,
          current_hp: maxHp,
          max_mana: maxMana,
          current_mana: maxMana,
          attack: atk,
          defense: def,
          speed: spd,
        })
        .eq("id", char.id);
    }

    // Drops: 2 + estrelas rolls; raridade ponderada.
    const drops: Array<{ id: string; name: string; rarity: string; slot: string }> = [];
    const rollCount = 2 + stars;
    const maxTier = Math.min(3, Math.max(1, Math.ceil(stars / 2)));

    // Distribuição de raridade por dificuldade.
    const table: Array<{ r: string; w: number }> =
      stars <= 2
        ? [{ r: "comum", w: 65 }, { r: "incomum", w: 27 }, { r: "raro", w: 7 }, { r: "epico", w: 1 }]
        : stars <= 4
        ? [{ r: "comum", w: 35 }, { r: "incomum", w: 38 }, { r: "raro", w: 20 }, { r: "epico", w: 6 }, { r: "lendario", w: 1 }]
        : [{ r: "incomum", w: 25 }, { r: "raro", w: 38 }, { r: "epico", w: 25 }, { r: "lendario", w: 10 }, { r: "mitico", w: 2 }];
    const totalW = table.reduce((s, t) => s + t.w, 0);
    const pick = () => {
      let r = Math.random() * totalW;
      for (const t of table) { if ((r -= t.w) <= 0) return t.r; }
      return "comum";
    };

    for (let i = 0; i < rollCount; i++) {
      const rarity = pick();
      const { data: pool } = await supabaseAdmin
        .from("items")
        .select("id, name, slot, rarity")
        .eq("rarity", rarity as any)
        .lte("tier", maxTier)
        .limit(50);
      if (!pool || pool.length === 0) continue;
      const chosen = pool[Math.floor(Math.random() * pool.length)] as any;
      const isStack = chosen.slot === "consumivel" || chosen.slot === "material";
      if (isStack) {
        const { data: existing } = await supabaseAdmin
          .from("inventory")
          .select("id, quantity")
          .eq("user_id", context.userId)
          .eq("item_id", chosen.id)
          .maybeSingle();
        if (existing) {
          await supabaseAdmin.from("inventory").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        } else {
          await supabaseAdmin.from("inventory").insert({ user_id: context.userId, item_id: chosen.id, quantity: 1 });
        }
      } else {
        await supabaseAdmin.from("inventory").insert({ user_id: context.userId, item_id: chosen.id, quantity: 1 });
      }
      drops.push({ id: chosen.id, name: chosen.name, rarity: chosen.rarity, slot: chosen.slot });
    }

    await supabaseAdmin
      .from("incursions")
      .update({
        status: "concluida",
        ended_at: new Date().toISOString(),
        current_wave: 10,
        rewards_json: { xp: xpGain, gold: goldGain, drops } as any,
      })
      .eq("id", inc.id);

    return { xp: xpGain, gold: goldGain, leveledUp, newLevel, drops };
  });
