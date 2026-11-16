import { addDays, localDay, zonedToUtc } from "./time";

export interface OpeningRule { weekday: number; start_time: string; end_time: string; slot_min: number }
export interface Interval { start: Date; end: Date }

export interface AvailabilityInput {
  rules: OpeningRule[];
  timeZone: string;
  durationMin: number;
  from: Date; // search window start (UTC)
  days: number; // number of local days to compute
  busy: Interval[]; // bookings + blocks + external calendars
  now?: Date;
  leadTimeMin?: number; // minimum notice before a slot
  bufferMin?: number; // travel/cleanup buffer around busy intervals
}

export interface Slot { start: string; end: string; day: string }

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** Pure function: computes bookable slots. Covered by tests/availability.test.ts */
export function computeSlots(i: AvailabilityInput): Slot[] {
  const now = i.now ?? new Date();
  const earliest = new Date(now.getTime() + (i.leadTimeMin ?? 30) * 60000);
  const buffer = (i.bufferMin ?? 0) * 60000;
  const busy = i.busy.map((b) => ({ start: new Date(b.start.getTime() - buffer), end: new Date(b.end.getTime() + buffer) }));
  const first = localDay(i.from, i.timeZone).day;
  const out: Slot[] = [];
  for (let n = 0; n < i.days; n++) {
    const day = addDays(first, n);
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    for (const r of i.rules.filter((x) => x.weekday === weekday)) {
      const [sh, sm] = r.start_time.slice(0, 5).split(":").map(Number);
      const [eh, em] = r.end_time.slice(0, 5).split(":").map(Number);
      for (let m = sh * 60 + sm; m + i.durationMin <= eh * 60 + em; m += r.slot_min) {
        const hhmm = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        const start = zonedToUtc(day, hhmm, i.timeZone);
        const end = new Date(start.getTime() + i.durationMin * 60000);
        if (start < earliest) continue;
        if (busy.some((b) => overlaps({ start, end }, b))) continue;
        out.push({ start: start.toISOString(), end: end.toISOString(), day });
      }
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

/** Keeps only the slots on days of the week the service is offered. `day` is the local date (YYYY-MM-DD) of the slot. */
export function filterWeekdays(slots: Slot[], weekdays: number[] | null | undefined): Slot[] {
  if (!weekdays || weekdays.length === 0 || weekdays.length >= 7) return slots;
  return slots.filter((s) => weekdays.includes(new Date(`${s.day}T00:00:00Z`).getUTCDay()));
}
