import { adminClient } from "@/lib/supabase";
import { sendReviewRequest } from "@/lib/review-mail";

/** Every 30 min: sends the 1–5 star survey 2 h after the end of each confirmed appointment (up to 7 days later, never twice). */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  const now = Date.now(), db = adminClient();
  const { data } = await db.from("bookings").select("id").eq("status", "confirmed").is("review_sent_at", null)
    .lte("ends_at", new Date(now - 2 * 3600000).toISOString()).gte("ends_at", new Date(now - 7 * 86400000).toISOString()).limit(100);
  const sent: string[] = [];
  for (const r of data ?? []) { try { if (await sendReviewRequest(r.id)) sent.push(r.id); } catch (e) { console.error("review mail", r.id, e); } }
  return Response.json({ sent });
}
