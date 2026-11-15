import ical from "node-ical";

// ------------------------------------------------------------------ export
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** RFC 5545 line folding at 75 octets. */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch, "utf8") > (parts.length ? 74 : 75)) { parts.push(cur); cur = ""; }
    cur += ch;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

export interface FeedEvent { uid: string; start: Date; end: Date; summary: string; description?: string; location?: string; status?: "CONFIRMED" | "TENTATIVE" }

/** Builds the private feed that vets subscribe to from Apple Calendar, Outlook, etc. */
export function buildFeed(name: string, events: FeedEvent[], now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Televet//Agenda//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`, "REFRESH-INTERVAL;VALUE=DURATION:PT15M", "X-PUBLISHED-TTL:PT15M",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}@televet.co`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`,
      `SUMMARY:${esc(e.summary)}`, `STATUS:${e.status ?? "CONFIRMED"}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

// ------------------------------------------------------------------ import
export interface BusyInterval { start: Date; end: Date; uid: string }

/** Parses an .ics document and returns busy intervals within [from, to], expanding recurrences. */
export function parseBusy(icsText: string, from: Date, to: Date): BusyInterval[] {
  const data = ical.sync.parseICS(icsText);
  const out: BusyInterval[] = [];
  for (const k of Object.keys(data)) {
    const ev = data[k] as ical.VEvent;
    if (!ev || ev.type !== "VEVENT" || !ev.start) continue;
    if (String(ev.transparency ?? "").toUpperCase() === "TRANSPARENT") continue; // "free" events
    if (String((ev as { status?: string }).status ?? "").toUpperCase() === "CANCELLED") continue;
    const start = new Date(ev.start as Date);
    const end = ev.end ? new Date(ev.end as Date) : new Date(start.getTime() + 60 * 60000);
    const dur = end.getTime() - start.getTime();
    if (ev.rrule) {
      const exdates = new Set(Object.values(ev.exdate ?? {}).map((d) => new Date(d as Date).getTime()));
      for (const occ of ev.rrule.between(new Date(from.getTime() - dur), to, true)) {
        if (exdates.has(occ.getTime())) continue;
        out.push({ start: occ, end: new Date(occ.getTime() + dur), uid: String(ev.uid) });
      }
    } else if (start < to && end > from) {
      out.push({ start, end, uid: String(ev.uid) });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function fetchBusy(url: string, from: Date, to: Date): Promise<BusyInterval[]> {
  const res = await fetch(url.replace(/^webcal:/i, "https:"), { headers: { accept: "text/calendar" } });
  if (!res.ok) throw new Error(`iCal fetch ${res.status}`);
  return parseBusy(await res.text(), from, to);
}
