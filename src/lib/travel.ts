/**
 * Travel time around home visits. Pure (no server imports): shared by the slot search, the booking check and the tests.
 *
 * A home visit keeps the vet on the road before and after it, so nothing else may start too close to it.
 * The vet chooses how many minutes that is (practitioners.travel_min); each home visit keeps the value it was booked with.
 */
export interface Span { start: Date; end: Date }
/** Something already in the vet's day. `travelMin` is set only for home visits: the minutes reserved before and after them. */
export interface BusyItem extends Span { travelMin?: number }

export const TRAVEL_DEFAULT = 30, TRAVEL_MAX = 240;
/** Choices offered to the vet in the dashboard and the app. */
export const TRAVEL_CHOICES = [0, 15, 20, 30, 45, 60, 90] as const;

export function clampTravel(v: unknown, fallback = TRAVEL_DEFAULT): number {
  const n = Math.round(Number(v));
  return v === null || v === undefined || v === "" || !Number.isFinite(n) ? fallback : Math.min(TRAVEL_MAX, Math.max(0, n));
}

/**
 * The vet's day as it must be seen when looking for room for a NEW appointment.
 * - an existing home visit is widened by its own travel time, whatever the new appointment is;
 * - when the new appointment is itself a home visit, everything else (clinic or video appointment, day off, event of the synced
 *   calendar) is widened by the vet's travel time too: the vet has to get there, and back;
 * - between two home visits the travel time counts once (the larger of the two), not twice.
 */
export function withTravel(items: BusyItem[], newIsHome: boolean, travelMin: number): Span[] {
  const mine = newIsHome ? Math.max(0, travelMin) : 0;
  return items.map((b) => {
    const pad = Math.max(mine, b.travelMin ?? 0) * 60000;
    return pad ? { start: new Date(b.start.getTime() - pad), end: new Date(b.end.getTime() + pad) } : { start: b.start, end: b.end };
  });
}

/** True when a new appointment overlaps one of the others or leaves too little travel time next to it. */
export function tooClose(candidate: Span, newIsHome: boolean, travelMin: number, others: BusyItem[]): boolean {
  return withTravel(others, newIsHome, travelMin).some((b) => candidate.start < b.end && b.start < candidate.end);
}

/** Google Maps link that opens directions to an address (from wherever the vet is). Works in a browser and opens the Maps app on a phone. */
export function directionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
}
