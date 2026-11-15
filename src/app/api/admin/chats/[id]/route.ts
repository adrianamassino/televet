import { z } from "zod";
import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";

const idOk = z.string().uuid();

/** GET /api/admin/chats/:id — conversation + full transcript. */
export const GET = handle(async (req, ctx) => {
  await requireStaff(req);
  const id = idOk.parse((await ctx.params).id);
  const db = adminClient();
  const [{ data: conversation }, { data: messages }] = await Promise.all([
    db.from("chat_conversations").select("*").eq("id", id).maybeSingle(),
    db.from("chat_messages").select("id, role, content, meta, created_at").eq("conversation_id", id).order("id"),
  ]);
  if (!conversation) throw new HttpError(404, "not found");
  return json({ conversation, messages: messages ?? [] });
});

/** PATCH /api/admin/chats/:id { status?, staff_note? } */
export const PATCH = handle(async (req, ctx) => {
  const user = await requireStaff(req);
  const id = idOk.parse((await ctx.params).id);
  const b = z.object({ status: z.enum(["new", "needs_followup", "handled", "archived"]).optional(), staff_note: z.string().max(2000).nullable().optional() }).parse(await req.json().catch(() => ({})));
  const patch: Record<string, unknown> = { ...b };
  if (b.status === "handled") { patch.handled_by = user.id; patch.handled_at = new Date().toISOString(); }
  const { error } = await adminClient().from("chat_conversations").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  return json({ ok: true });
});
