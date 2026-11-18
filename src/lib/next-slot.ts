import { adminClient } from "./supabase";
import { computeSlots, filterWeekdays } from "./availability";
import { busyFor } from "./busy";

/** First free slot (next 7 days) of a practice for a service type; null when none or booking disabled. Best-effort: errors → null. */
export async function nextSlot(practiceId: string, tz: string, type?: string): Promise<{ start: string; serviceId: string } | null> {
  try {
    const db = adminClient();
    let sq = db.from("services").select("id, practitioner_id, duration_min, weekdays, type").eq("practice_id", practiceId).eq("active", true).not("practitioner_id", "is", null);
    if (type) sq = sq.eq("type", type);
    const { data: svcs } = await sq.limit(4);
    const from = new Date(), to = new Date(from.getTime() + 8 * 86400000);
    let best: { start: string; serviceId: string } | null = null;
    for (const s of svcs ?? []) {
      const [{ data: rules }, { data: prac }] = await Promise.all([
        db.from("opening_rules").select("weekday, start_time, end_time, slot_min").eq("practitioner_id", s.practitioner_id!),
        db.from("practitioners").select("lead_time_min").eq("id", s.practitioner_id!).single(),
      ]);
      const slots = filterWeekdays(computeSlots({ rules: rules ?? [], timeZone: tz, durationMin: s.duration_min, from, days: 7, busy: await busyFor(s.practitioner_id!, from, to), leadTimeMin: prac?.lead_time_min ?? 120 }), s.weekdays);
      if (slots[0] && (!best || slots[0].start < best.start)) best = { start: slots[0].start, serviceId: s.id };
    }
    return best;
  } catch { return null; }
}
