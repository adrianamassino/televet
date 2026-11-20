import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { bookingStats } from "@/lib/admin-data";

/** GET /api/admin/overview — headline numbers for the dashboard. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const db = adminClient();
  const count = async (t: string, f?: (q: any) => any) => { let q = db.from(t).select("id", { count: "exact", head: true }); if (f) q = f(q); const { count: c } = await q; return c ?? 0; };
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [owners, pets, practices, pending, approved, rejected, suspended, vetsPending, newOwners, newPractices, claims, chats] = await Promise.all([
    count("owners"), count("pets"), count("practices"),
    count("practices", (q) => q.eq("review_status", "pending")), count("practices", (q) => q.eq("review_status", "approved")),
    count("practices", (q) => q.eq("review_status", "rejected")), count("practices", (q) => q.eq("review_status", "suspended")),
    count("practitioners", (q) => q.eq("approved", false)),
    count("owners", (q) => q.gte("created_at", since)), count("practices", (q) => q.gte("created_at", since)),
    count("listing_claims", (q) => q.eq("status", "pending")).catch(() => 0), count("chat_conversations", (q) => q.in("status", ["new", "needs_followup"])).catch(() => 0),
  ]);
  const { total } = await bookingStats(db);
  const { data: recent } = await db.from("practices").select("id, name, kind, country, created_at, review_status").eq("review_status", "pending").order("created_at", { ascending: false }).limit(8);
  return json({ owners, pets, practices, pending, approved, rejected, suspended, vetsPending, newOwners, newPractices, claims, chats, bookings: total, pendingList: recent ?? [] });
});
