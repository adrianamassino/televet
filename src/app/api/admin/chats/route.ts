import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";

/** GET /api/admin/chats?status=&audience=&urgency=&q=&before=<iso>&limit=  — staff only (ADMIN_EMAILS). */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const u = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(u.searchParams.get("limit")) || 50));
  const db = adminClient();
  let q = db.from("chat_conversations")
    .select("id, created_at, last_message_at, lang, country, page_path, audience, urgency, topic, message_count, status, cta_clicked, staff_note")
    .order("last_message_at", { ascending: false }).limit(limit);
  for (const f of ["status", "audience", "urgency"] as const) { const v = u.searchParams.get(f); if (v) q = q.eq(f, v); }
  const before = u.searchParams.get("before"); if (before && !Number.isNaN(Date.parse(before))) q = q.lt("last_message_at", before);
  const text = (u.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (text) {
    const like = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const { data: hits } = await db.from("chat_messages").select("conversation_id").ilike("content", like).limit(300);
    const ids = [...new Set((hits ?? []).map((h) => h.conversation_id))];
    if (!ids.length) return json({ items: [] });
    q = q.in("id", ids);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return json({ items: data ?? [] });
});
