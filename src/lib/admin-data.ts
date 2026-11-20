import type { SupabaseClient } from "@supabase/supabase-js";

export type Money = Record<string, { gross: number; commission: number; net: number }>;
export type Stat = { total: number; byType: Record<string, number>; byStatus: Record<string, number>; revenue: Money; patients: number; clients: number };
type B = { practice_id: string; practitioner_id: string; owner_id: string; pet_id: string | null; type: string; status: string; payment_status: string; price_cents: number; commission_cents: number; currency: string };

export const emptyStat = (): Stat => ({ total: 0, byType: {}, byStatus: {}, revenue: {}, patients: 0, clients: 0 });

/** Money counts only payments actually captured (online). Commission is the amount stored on the booking when it was made. */
export function addBooking(s: Stat, b: B, seen: { pets: Set<string>; owners: Set<string> }) {
  s.total++;
  s.byType[b.type] = (s.byType[b.type] ?? 0) + 1;
  s.byStatus[b.status] = (s.byStatus[b.status] ?? 0) + 1;
  if (b.payment_status === "captured" && b.status !== "declined" && b.status !== "cancelled") {
    const m = (s.revenue[b.currency] ??= { gross: 0, commission: 0, net: 0 });
    m.gross += b.price_cents; m.commission += b.commission_cents; m.net += b.price_cents - b.commission_cents;
  }
  if (b.status !== "declined" && b.status !== "cancelled") {
    if (b.pet_id) seen.pets.add(b.pet_id);
    seen.owners.add(b.owner_id);
  }
}

/** Aggregates bookings per practice and per practitioner (done in code: volumes are small at this stage). */
export async function bookingStats(db: SupabaseClient, practiceId?: string) {
  let q = db.from("bookings").select("practice_id, practitioner_id, owner_id, pet_id, type, status, payment_status, price_cents, commission_cents, currency").limit(50000);
  if (practiceId) q = q.eq("practice_id", practiceId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const byPractice = new Map<string, Stat>(), byVet = new Map<string, Stat>(), total = emptyStat();
  const sp = new Map<string, { pets: Set<string>; owners: Set<string> }>(), sv = new Map<string, { pets: Set<string>; owners: Set<string> }>(), st = { pets: new Set<string>(), owners: new Set<string>() };
  for (const b of (data ?? []) as B[]) {
    const p = byPractice.get(b.practice_id) ?? byPractice.set(b.practice_id, emptyStat()).get(b.practice_id)!;
    const v = byVet.get(b.practitioner_id) ?? byVet.set(b.practitioner_id, emptyStat()).get(b.practitioner_id)!;
    const ps = sp.get(b.practice_id) ?? sp.set(b.practice_id, { pets: new Set(), owners: new Set() }).get(b.practice_id)!;
    const vs = sv.get(b.practitioner_id) ?? sv.set(b.practitioner_id, { pets: new Set(), owners: new Set() }).get(b.practitioner_id)!;
    addBooking(p, b, ps); addBooking(v, b, vs); addBooking(total, b, st);
  }
  for (const [k, s] of byPractice) { s.patients = sp.get(k)!.pets.size; s.clients = sp.get(k)!.owners.size; }
  for (const [k, s] of byVet) { s.patients = sv.get(k)!.pets.size; s.clients = sv.get(k)!.owners.size; }
  total.patients = st.pets.size; total.clients = st.owners.size;
  return { byPractice, byVet, total };
}

/** Records an admin action (best-effort: never blocks the action itself). */
export async function audit(db: SupabaseClient, actor: string, action: string, target: { type: string; id?: string; label?: string }, detail: object = {}) {
  await db.from("admin_audit").insert({ actor, action, target_type: target.type, target_id: target.id ?? null, target_label: target.label ?? null, detail });
}

/** Percentage guard: null clears the override (inherit), otherwise 0–100 with two decimals. */
export { parseFixed } from "./commission";
export function parsePct(v: unknown): number | null {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("commission must be between 0 and 100");
  return Math.round(n * 100) / 100;
}
