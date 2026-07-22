import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const RATE_LIMIT_MS = 2000;
const lastSent = new Map<string, number>();

const BLOCKED = ["porra", "caralho"]; // filtro mínimo — expandível

function sanitize(input: string) {
  let s = input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  for (const w of BLOCKED) {
    s = s.replace(new RegExp(w, "gi"), "*".repeat(w.length));
  }
  return s;
}

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { channel: string }) =>
    z.object({ channel: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: rows } = await context.supabase
      .from("chat_messages")
      .select("id, channel_key, user_id, character_name, content, created_at")
      .eq("channel_key", data.channel)
      .order("created_at", { ascending: false })
      .limit(200);
    return (rows ?? []).reverse();
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { channel: string; content: string }) =>
    z
      .object({
        channel: z.string().min(1).max(64),
        content: z.string().trim().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const now = Date.now();
    const last = lastSent.get(context.userId) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      throw new Error("Aguarde um instante antes de enviar outra mensagem.");
    }
    lastSent.set(context.userId, now);

    const { data: character } = await context.supabase
      .from("characters")
      .select("name")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    const name = character?.name ?? "Aventureiro";

    const content = sanitize(data.content);
    if (!content) throw new Error("Mensagem vazia.");

    const { error } = await context.supabase.from("chat_messages").insert({
      channel_key: data.channel,
      user_id: context.userId,
      character_name: name,
      content,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
