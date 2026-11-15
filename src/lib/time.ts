/** Offset (minutes) of `timeZone` at the given UTC instant, e.g. +120 for Paris in summer. */
export function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Converts a wall-clock time in `timeZone` (YYYY-MM-DD + HH:MM) to a UTC Date. DST-safe. */
export function zonedToUtc(day: string, hhmm: string, timeZone: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let off = tzOffsetMinutes(new Date(guess), timeZone);
  let utc = guess - off * 60000;
  const off2 = tzOffsetMinutes(new Date(utc), timeZone);
  if (off2 !== off) utc = guess - off2 * 60000;
  return new Date(utc);
}

/** Local calendar day (YYYY-MM-DD) and weekday (0=Sunday) of an instant in a time zone. */
export function localDay(date: Date, timeZone: string): { day: string; weekday: number } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(date).map((x) => [x.type, x.value]),
  );
  const day = `${p.year}-${p.month}-${p.day}`;
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { day, weekday };
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return x.toISOString().slice(0, 10);
}
