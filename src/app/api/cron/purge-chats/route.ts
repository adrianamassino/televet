import { adminClient } from "@/lib/supabase";

/** Daily: deletes conversations older than CHAT_RETENTION_DAYS (default 90) — messages go with them (cascade). */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  const days = Math.max(7, Number(process.env.CHAT_RETENTION_DAYS || 90));
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  const { count, error } = await adminClient().from("chat_conversations").delete({ count: "exact" }).lt("last_message_at", cutoff);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deleted: count ?? 0, olderThanDays: days });
}
