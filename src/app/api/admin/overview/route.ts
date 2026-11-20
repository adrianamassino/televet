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
  const { total, byPractice } = await bookingStats(db);
  const [{ data: allPractices }, { data: allOwners }] = await Promise.all([db.from("practices").select("id, country, review_status").limit(5000), db.from("owners").select("country").limit(50000)]);
  const rows: Record<string, { country: string; practices: number; pending: number; owners: number; bookings: number; revenue: Record<string, number> }> = {};
  const row = (c: string) => (rows[c] ??= { country: c, practices: 0, pending: 0, owners: 0, bookings: 0, revenue: {} });
  const pc = new Map<string, string>();
  for (const p of allPractices ?? []) { pc.set(p.id, p.country); const r = row(p.country); r.practices++; if (p.review_status === "pending") r.pending++; }
  for (const o of allOwners ?? []) if (o.country) row(o.country).owners++;
  for (const [id, s] of byPractice) { const c = pc.get(id); if (!c) continue; const r = row(c); r.bookings += s.total; for (const [cur, m] of Object.entries(s.revenue)) r.revenue[cur] = (r.revenue[cur] ?? 0) + m.gross; }
  const byCountry = Object.values(rows).sort((a, b) => b.practices + b.owners - (a.practices + a.owners));
  const { data: recent } = await db.from("practices").select("id, name, kind, country, created_at, review_status").eq("review_status", "pending").order("created_at", { ascending: false }).limit(8);
  return json({ owners, pets, practices, pending, approved, rejected, suspended, vetsPending, newOwners, newPractices, claims, chats, bookings: total, byCountry, pendingList: recent ?? [] });
});
