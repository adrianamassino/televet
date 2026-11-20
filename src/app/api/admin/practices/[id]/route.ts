import { z } from "zod";
import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { audit, bookingStats, parsePct } from "@/lib/admin-data";

type Ctx = { params: Promise<{ id: string }> };

/** GET — full detail: practice, vets with their stats, patients and latest bookings. */
export const GET = handle(async (req, ctx) => {
  await requireStaff(req);
  const { id } = await (ctx as Ctx).params, db = adminClient();
  const { data: p, error } = await db.from("practices").select("*, practitioners(id, display_name, title, photo_url, active, approved, approved_at, commission_pct, slug, user_id)").eq("id", id).single();
  if (error || !p) throw new HttpError(404, "not found");
  const { data: country } = await db.from("countries").select("default_commission_pct, currency, payment_provider").eq("code", p.country).single();
  const { data: owner } = await db.auth.admin.getUserById(p.owner_user_id);
  const { byPractice, byVet } = await bookingStats(db, id);
  const { data: rows } = await db.from("bookings")
    .select("id, starts_at, type, status, payment_status, price_cents, commission_cents, currency, motive, practitioner_id, owner_id, pet_id, owners(full_name, phone), pets(name, species), practitioners(display_name), services(custom_name, catalog_code)")
    .eq("practice_id", id).order("starts_at", { ascending: false }).limit(1000);
  type R = NonNullable<typeof rows>[number] & { owners: any; pets: any; practitioners: any; services: any };
  const bookings = ((rows ?? []) as R[]).map((b) => ({ id: b.id, starts_at: b.starts_at, type: b.type, status: b.status, payment_status: b.payment_status, price_cents: b.price_cents, commission_cents: b.commission_cents, currency: b.currency, motive: b.motive, vet: b.practitioners?.display_name ?? "", client: b.owners?.full_name ?? "", clientPhone: b.owners?.phone ?? "", pet: b.pets?.name ?? "", species: b.pets?.species ?? "", service: b.services?.custom_name ?? b.services?.catalog_code ?? "" }));
  const pm = new Map<string, { pet: string; species: string; client: string; visits: number; last: string }>();
  for (const b of bookings) { if (b.status === "declined" || b.status === "cancelled") continue; const k = `${b.pet}|${b.client}`; const e = pm.get(k); if (e) { e.visits++; if (b.starts_at > e.last) e.last = b.starts_at; } else pm.set(k, { pet: b.pet, species: b.species, client: b.client, visits: 1, last: b.starts_at }); }
  const { data: sec } = await db.from("practice_secrets").select("practice_id").eq("practice_id", id).maybeSingle();
  const { practitioners, ...practice } = p;
  return json({
    practice: { ...practice, ownerEmail: owner?.user?.email ?? null, hasSecrets: !!sec }, country,
    vets: (practitioners ?? []).map((v: any) => ({ ...v, stats: byVet.get(v.id) ?? null })),
    stats: byPractice.get(id) ?? null, patients: [...pm.values()].sort((a, b) => b.last.localeCompare(a.last)), bookings,
  });
});

const Patch = z.object({
  action: z.enum(["approve", "reject", "suspend", "reopen"]).optional(),
  note: z.string().max(1000).optional(),
  commission_pct: z.union([z.number(), z.string(), z.null()]).optional(),
  clearVetOverrides: z.boolean().optional(),
  booking_enabled: z.boolean().optional(),
});

/** PATCH — approve / reject / suspend, set the clinic-wide commission, optionally reset every vet to the clinic value. */
export const PATCH = handle(async (req, ctx) => {
  const staff = await requireStaff(req);
  const { id } = await (ctx as Ctx).params, db = adminClient();
  const b = Patch.parse(await req.json().catch(() => ({})));
  const { data: p } = await db.from("practices").select("id, name").eq("id", id).single();
  if (!p) throw new HttpError(404, "not found");
  const who = staff.email ?? "staff", upd: Record<string, unknown> = {};
  if (b.action) {
    const approved = b.action === "approve";
    Object.assign(upd, { review_status: b.action === "reopen" ? "pending" : approved ? "approved" : b.action === "reject" ? "rejected" : "suspended", published: approved, reviewed_at: new Date().toISOString(), reviewed_by: who, review_note: b.note ?? null });
  }
  if (b.commission_pct !== undefined) { try { upd.commission_pct = parsePct(b.commission_pct); } catch (e) { throw new HttpError(400, (e as Error).message); } }
  if (b.booking_enabled !== undefined) upd.booking_enabled = b.booking_enabled;
  if (Object.keys(upd).length) { const { error } = await db.from("practices").update(upd).eq("id", id); if (error) throw new Error(error.message); }
  if (b.action === "approve") await db.from("practitioners").update({ approved: true, approved_at: new Date().toISOString() }).eq("practice_id", id).eq("approved", false);
  if (b.clearVetOverrides) await db.from("practitioners").update({ commission_pct: null }).eq("practice_id", id);
  await audit(db, who, b.action ?? (b.commission_pct !== undefined ? "set_commission" : "update"), { type: "practice", id, label: p.name }, { ...b });
  return json({ ok: true });
});

/** DELETE — only when the practice has no bookings (history and accounting must stay intact); otherwise suspend it. */
export const DELETE = handle(async (req, ctx) => {
  const staff = await requireStaff(req);
  const { id } = await (ctx as Ctx).params, db = adminClient();
  const { data: p } = await db.from("practices").select("id, name").eq("id", id).single();
  if (!p) throw new HttpError(404, "not found");
  const { count } = await db.from("bookings").select("id", { count: "exact", head: true }).eq("practice_id", id);
  if ((count ?? 0) > 0) throw new HttpError(409, `has_bookings:${count}`);
  const { error } = await db.from("practices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await audit(db, staff.email ?? "staff", "delete", { type: "practice", id, label: p.name });
  return json({ ok: true });
});
