import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { bookingStats } from "@/lib/admin-data";

/** GET /api/admin/practitioners?approved=false&q= — every vet with clinic, commission and numbers. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const u = new URL(req.url), db = adminClient();
  let q = db.from("practitioners").select("id, display_name, title, active, approved, commission_pct, practice_id, practices(id, name, country, review_status, commission_pct)").limit(1000);
  const a = u.searchParams.get("approved"); if (a === "true" || a === "false") q = q.eq("approved", a === "true");
  const text = (u.searchParams.get("q") ?? "").trim().slice(0, 80).replace(/[,()%]/g, " ");
  if (text) q = q.ilike("display_name", `%${text}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const { byVet } = await bookingStats(db);
  const { data: countries } = await db.from("countries").select("code, default_commission_pct");
  const def = Object.fromEntries((countries ?? []).map((c) => [c.code, Number(c.default_commission_pct)]));
  return json({ items: (data ?? []).map((v: any) => ({ ...v, countryCommission: def[v.practices?.country] ?? 0, stats: byVet.get(v.id) ?? null })) });
});
