import { z } from "zod";
import { adminClient, handle, json } from "@/lib/supabase";
import { CTA_KEYS } from "@/lib/chat";

/** POST /api/chat/event { conversationId, key } — records which button the visitor clicked (booking, sign-up…). */
export const POST = handle(async (req) => {
  const { conversationId, key } = z.object({ conversationId: z.string().uuid(), key: z.enum(CTA_KEYS) }).parse(await req.json().catch(() => ({})));
  const db = adminClient();
  const { data } = await db.from("chat_conversations").select("cta_clicked").eq("id", conversationId).maybeSingle();
  if (data && !data.cta_clicked.includes(key)) await db.from("chat_conversations").update({ cta_clicked: [...data.cta_clicked, key] }).eq("id", conversationId);
  return json({ ok: true });
});
