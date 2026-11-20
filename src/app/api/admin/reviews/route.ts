import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";

/** GET /api/admin/reviews?rating= — satisfaction ratings with comments, average and distribution. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const u = new URL(req.url), db = adminClient();
  const { data, error } = await db.from("bookings").select("id, review_rating, review_comment, review_at, review_sent_at, type, practice_id, owners(full_name), pets(name), practitioners(display_name), practices(name)").not("review_rating", "is", null).order("review_at", { ascending: false }).limit(1000);
  if (error) throw new Error(error.message);
  const all = (data ?? []) as any[];
  const dist = [0, 0, 0, 0, 0]; let sum = 0;
  for (const r of all) { dist[r.review_rating - 1]++; sum += r.review_rating; }
  const { count: sent } = await db.from("bookings").select("id", { count: "exact", head: true }).not("review_sent_at", "is", null);
  const rt = Number(u.searchParams.get("rating"));
  const items = all.filter((r) => !rt || r.review_rating === rt).map((r) => ({ id: r.id, rating: r.review_rating, comment: r.review_comment, at: r.review_at, type: r.type, client: r.owners?.full_name ?? "", pet: r.pets?.name ?? "", vet: r.practitioners?.display_name ?? "", practice: r.practices?.name ?? "" }));
  return json({ items, average: all.length ? Math.round((sum / all.length) * 100) / 100 : null, count: all.length, sent: sent ?? 0, dist });
});
