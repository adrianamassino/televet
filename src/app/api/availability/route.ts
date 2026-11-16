import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { computeSlots, filterWeekdays } from "@/lib/availability";
import { busyFor } from "@/lib/busy";

/** GET /api/availability?service=<uuid>&practitioner=<uuid>&from=2026-10-01&days=7 */
export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const serviceId = q.get("service"), practitionerId = q.get("practitioner");
  if (!serviceId || !practitionerId) throw new HttpError(400, "service and practitioner are required");
  const days = Math.min(21, Math.max(1, Number(q.get("days") ?? 7)));
  const from = q.get("from") ? new Date(`${q.get("from")}T00:00:00Z`) : new Date();
  const db = adminClient();
  const { data: svc } = await db.from("services").select("duration_min, practice_id, active, weekdays, practices(timezone, published, booking_enabled)").eq("id", serviceId).single();
  const practice = (svc as unknown as { practices: { timezone: string; published: boolean; booking_enabled: boolean } } | null)?.practices;
  if (!svc || !svc.active || !practice?.published || !practice.booking_enabled) throw new HttpError(404, "service not found");
  const { data: prac } = await db.from("practitioners").select("lead_time_min").eq("id", practitionerId).single();
  const { data: rules } = await db.from("opening_rules").select("weekday, start_time, end_time, slot_min").eq("practitioner_id", practitionerId);
  const to = new Date(from.getTime() + (days + 1) * 86400000);
  const slots = filterWeekdays(computeSlots({
    rules: rules ?? [], timeZone: practice.timezone, durationMin: svc.duration_min,
    from, days, busy: await busyFor(practitionerId, from, to), leadTimeMin: prac?.lead_time_min ?? 120,
  }), svc.weekdays);
  return json({ slots });
});
