import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";

/** GET /api/admin/bookings?type=&status=&practice=&from=&to=&q= — every appointment with client, pet and vet names. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const u = new URL(req.url), db = adminClient();
  let q = db.from("bookings").select("id, starts_at, type, status, payment_status, price_cents, commission_cents, currency, motive, practice_id, owners(full_name, phone), pets(name, species), practitioners(display_name), practices(name)").order("starts_at", { ascending: false }).limit(500);
  for (const f of ["type", "status"]) { const v = u.searchParams.get(f); if (v) q = q.eq(f, v); }
  const pr = u.searchParams.get("practice"); if (pr) q = q.eq("practice_id", pr);
  const from = u.searchParams.get("from"), to = u.searchParams.get("to");
  if (from && !Number.isNaN(Date.parse(from))) q = q.gte("starts_at", from);
  if (to && !Number.isNaN(Date.parse(to))) q = q.lte("starts_at", to);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const text = (u.searchParams.get("q") ?? "").trim().toLowerCase();
  const items = (data ?? []).map((b: any) => ({ id: b.id, starts_at: b.starts_at, type: b.type, status: b.status, payment_status: b.payment_status, price_cents: b.price_cents, commission_cents: b.commission_cents, currency: b.currency, motive: b.motive, practice: b.practices?.name ?? "", vet: b.practitioners?.display_name ?? "", client: b.owners?.full_name ?? "", clientPhone: b.owners?.phone ?? "", pet: b.pets?.name ?? "", species: b.pets?.species ?? "" }))
    .filter((b) => !text || `${b.client} ${b.pet} ${b.vet} ${b.practice}`.toLowerCase().includes(text));
  return json({ items });
});
