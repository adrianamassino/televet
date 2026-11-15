import { adminClient } from "./supabase";
import type { Interval } from "./availability";

/** All busy intervals of a practitioner: Televet bookings, manual blocks, synced calendars. */
export async function busyFor(practitionerId: string, from: Date, to: Date): Promise<Interval[]> {
  const db = adminClient();
  const f = from.toISOString(), t = to.toISOString();
  const [b, bl, ex] = await Promise.all([
    db.from("bookings").select("starts_at, ends_at").eq("practitioner_id", practitionerId).in("status", ["pending", "confirmed"]).lt("starts_at", t).gt("ends_at", f),
    db.from("blocks").select("starts_at, ends_at").eq("practitioner_id", practitionerId).lt("starts_at", t).gt("ends_at", f),
    db.from("external_busy").select("starts_at, ends_at").eq("practitioner_id", practitionerId).lt("starts_at", t).gt("ends_at", f),
  ]);
  return [...(b.data ?? []), ...(bl.data ?? []), ...(ex.data ?? [])].map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at) }));
}
