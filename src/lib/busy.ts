import { adminClient } from "./supabase";
import type { Interval } from "./availability";
import { cancelPayment } from "./payments/stripe";
import { clampTravel, TRAVEL_DEFAULT, TRAVEL_MAX, withTravel, type BusyItem } from "./travel";

/** The vet's travel time around home visits, in minutes (default until the vet chooses, or until the database knows the column). */
export async function travelMinOf(practitionerId: string): Promise<number> {
  const { data, error } = await adminClient().from("practitioners").select("travel_min").eq("id", practitionerId).maybeSingle();
  return error || !data ? TRAVEL_DEFAULT : clampTravel((data as { travel_min: unknown }).travel_min);
}

type BookingRow = { starts_at: string; ends_at: string; type?: string; travel_min?: number | null };

/** Everything in a vet's day between two instants: Televet bookings (home visits with their travel time), days off, synced calendars. */
export async function busyItems(practitionerId: string, from: Date, to: Date, vetTravelMin: number): Promise<BusyItem[]> {
  const db = adminClient();
  // look a little outside the window too: the travel time of a visit just before or after it reaches inside
  const f = new Date(from.getTime() - TRAVEL_MAX * 60000).toISOString(), t = new Date(to.getTime() + TRAVEL_MAX * 60000).toISOString();
  const bookings = async (): Promise<BookingRow[]> => {
    const q = (cols: string) => db.from("bookings").select(cols).eq("practitioner_id", practitionerId).in("status", ["pending", "confirmed"]).lt("starts_at", t).gt("ends_at", f);
    const full = await q("starts_at, ends_at, type, travel_min");
    if (!full.error) return (full.data ?? []) as unknown as BookingRow[];
    return ((await q("starts_at, ends_at, type")).data ?? []) as unknown as BookingRow[]; // database not updated yet (migration 0016)
  };
  const [b, bl, ex] = await Promise.all([
    bookings(),
    db.from("blocks").select("starts_at, ends_at").eq("practitioner_id", practitionerId).lt("starts_at", t).gt("ends_at", f),
    db.from("external_busy").select("starts_at, ends_at").eq("practitioner_id", practitionerId).lt("starts_at", t).gt("ends_at", f),
  ]);
  return [
    // a home visit keeps the travel time it was booked with; visits booked before this existed use the vet's current setting
    ...b.map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at), travelMin: r.type === "home" ? (r.travel_min && r.travel_min > 0 ? r.travel_min : vetTravelMin) : 0 })),
    ...[...(bl.data ?? []), ...(ex.data ?? [])].map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at) })),
  ];
}

/**
 * Busy intervals of a vet as seen by a NEW appointment of the given kind, travel time included (see travel.ts).
 * `forHome`: the appointment being placed is a home visit.
 */
export async function busyFor(practitionerId: string, from: Date, to: Date, forHome = false, vetTravelMin?: number): Promise<Interval[]> {
  const travel = vetTravelMin ?? await travelMinOf(practitionerId);
  return withTravel(await busyItems(practitionerId, from, to, travel), forHome, travel);
}

/** How long an online payment may stay unfinished before the time slot is given back. */
export const UNPAID_HOLD_MIN = 30;

/**
 * Releases time slots held by payments that were started and never finished (page closed, card refused and abandoned…).
 * Without this such a booking would block its slot for ever. Safe to call often; never throws.
 */
export async function expireUnpaid(practitionerId?: string): Promise<number> {
  try {
    const db = adminClient();
    let q = db.from("bookings").update({ status: "cancelled", payment_status: "failed" })
      .eq("status", "pending").not("provider", "is", null)
      // a payment that failed, or one never finished. A Mercado Pago payment still being processed (it has a reference) is left alone.
      .or("payment_status.eq.failed,and(payment_status.eq.pending,or(provider.eq.stripe,payment_ref.is.null))")
      .lt("created_at", new Date(Date.now() - UNPAID_HOLD_MIN * 60000).toISOString());
    if (practitionerId) q = q.eq("practitioner_id", practitionerId);
    const { data } = await q.select("id, provider, payment_ref");
    for (const b of data ?? []) {
      // so that a card entered much later can no longer be charged for a slot that is gone
      if (b.provider === "stripe" && b.payment_ref) await cancelPayment(b.payment_ref).catch(() => undefined);
    }
    return data?.length ?? 0;
  } catch (e) { console.error("expire unpaid", e); return 0; }
}
