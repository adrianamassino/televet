import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { computeSlots, filterWeekdays } from "@/lib/availability";
import { busyFor, expireUnpaid } from "@/lib/busy";
import { refreshCalendars } from "@/lib/calendar/sync";

/** GET /api/availability?service=<uuid>&practitioner=<uuid>&from=2026-10-01&days=7 — free times for one consultation of one vet. */
export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const serviceId = q.get("service"), practitionerId = q.get("practitioner");
  if (!serviceId || !practitionerId) throw new HttpError(400, "service and practitioner are required");
  const days = Math.min(21, Math.max(1, Number(q.get("days") ?? 7)));
  const from = q.get("from") ? new Date(`${q.get("from")}T00:00:00Z`) : new Date();
  const db = adminClient();
  const { data: svc } = await db.from("services").select("duration_min, type, practice_id, active, weekdays, practices(timezone, published, booking_enabled)").eq("id", serviceId).single();
  const practice = (svc as unknown as { practices: { timezone: string; published: boolean; booking_enabled: boolean } } | null)?.practices;
  if (!svc || !svc.active || !practice?.published || !practice.booking_enabled) throw new HttpError(404, "service not found");
  const { data: prac } = await db.from("practitioners").select("lead_time_min, approved").eq("id", practitionerId).single();
  if (!prac?.approved) throw new HttpError(404, "service not found");
  const { data: rules } = await db.from("opening_rules").select("weekday, start_time, end_time, slot_min").eq("practitioner_id", practitionerId);
  const to = new Date(from.getTime() + (days + 1) * 86400000);
  // keep what we show honest without waiting for the scheduled job: re-read a connected calendar that is more than 10 minutes old,
  // and give back the times held by payments that were never finished
  await Promise.all([refreshCalendars(practitionerId, 10, 4000), expireUnpaid(practitionerId)]);
  const slots = filterWeekdays(computeSlots({
    rules: rules ?? [], timeZone: practice.timezone, durationMin: svc.duration_min,
    from, days, busy: await busyFor(practitionerId, from, to, svc.type === "home"), leadTimeMin: prac?.lead_time_min ?? 120, // a home visit needs travel time around it
  }), svc.weekdays);
  return json({ slots });
});
