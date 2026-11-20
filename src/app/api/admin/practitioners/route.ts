import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { bookingStats } from "@/lib/admin-data";

/** GET /api/admin/practitioners?approved=false&q= — every vet with clinic, commission and numbers. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const u = new URL(req.url), db = adminClient();
  let q = db.from("practitioners").select("id, display_name, title, active, approved, commission_pct, commission_fixed_cents, practice_id, user_id, practices(id, name, country, email, phone, city, review_status, commission_pct, commission_fixed_cents)").limit(1000);
  const a = u.searchParams.get("approved"); if (a === "true" || a === "false") q = q.eq("approved", a === "true");
  const text = (u.searchParams.get("q") ?? "").trim().slice(0, 80).replace(/[,()%]/g, " ");
  if (text) q = q.ilike("display_name", `%${text}%`);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  const country = u.searchParams.get("country");
  const data = (rows ?? []).filter((v: any) => !country || v.practices?.country === country);
  const emails = new Map<string, string>();
  for (let page = 1; page <= 10; page++) {
    const { data: l } = await db.auth.admin.listUsers({ page, perPage: 200 });
    for (const x of l?.users ?? []) emails.set(x.id, x.email ?? "");
    if ((l?.users.length ?? 0) < 200) break;
  }
  const { byVet } = await bookingStats(db);
  const { data: countries } = await db.from("countries").select("code, default_commission_pct, default_commission_fixed_cents");
  const def = Object.fromEntries((countries ?? []).map((c) => [c.code, Number(c.default_commission_pct)]));
  const defFixed = Object.fromEntries((countries ?? []).map((c) => [c.code, c.default_commission_fixed_cents as number | null]));
  return json({ items: data.map((v: any) => ({ ...v, email: emails.get(v.user_id) ?? "", countryCommission: def[v.practices?.country] ?? 0, countryFixed: defFixed[v.practices?.country] ?? null, stats: byVet.get(v.id) ?? null })) });
});
