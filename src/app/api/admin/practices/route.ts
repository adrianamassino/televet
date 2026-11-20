import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { bookingStats } from "@/lib/admin-data";
import { checklist } from "@/lib/onboarding";

/** GET /api/admin/practices?status=&kind=&country=&q= — clinics and independent vets with their numbers. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const u = new URL(req.url), db = adminClient();
  let q = db.from("practices").select("id, name, slug, kind, country, address, postal_code, city, email, phone, published, review_status, review_note, stripe_status, mp_status, commission_pct, commission_fixed_cents, created_at, owner_user_id, onboarding_reminders, practitioners(id, approved, active)").order("created_at", { ascending: false }).limit(500);
  for (const f of ["status:review_status", "kind:kind", "country:country"]) { const [k, col] = f.split(":"); const v = u.searchParams.get(k); if (v) q = q.eq(col, v); }
  const text = (u.searchParams.get("q") ?? "").trim().slice(0, 80).replace(/[,()%]/g, " ");
  if (text) q = q.or(`name.ilike.%${text}%,city.ilike.%${text}%,email.ilike.%${text}%,address.ilike.%${text}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const { byPractice } = await bookingStats(db);
  const missing = await checklist(db);
  const { data: countries } = await db.from("countries").select("code, default_commission_pct, default_commission_fixed_cents, currency");
  const def = Object.fromEntries((countries ?? []).map((c) => [c.code, Number(c.default_commission_pct)]));
  const defFixed = Object.fromEntries((countries ?? []).map((c) => [c.code, c.default_commission_fixed_cents as number | null]));
  return json({ items: (data ?? []).map((p) => ({ ...p, vets: p.practitioners?.length ?? 0, vetsPending: (p.practitioners ?? []).filter((v) => !v.approved).length, practitioners: undefined, countryCommission: def[p.country] ?? 0, countryFixed: defFixed[p.country] ?? null, missing: missing.get(p.id) ?? [], stats: byPractice.get(p.id) ?? null })) });
});
