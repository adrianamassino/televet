import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFeed, parseBusy } from "../src/lib/calendar/ical";

test("export feed is valid RFC 5545 with escaped text and CRLF", () => {
  const ics = buildFeed("Televet · Dr Martin", [{ uid: "b1", start: new Date("2026-10-05T07:00:00Z"), end: new Date("2026-10-05T07:30:00Z"), summary: "Luna, chat; vaccin", location: "12 rue Oberkampf, 75011 Paris" }], new Date("2026-10-01T00:00:00Z"));
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261005T070000Z\r\n/);
  assert.match(ics, /SUMMARY:Luna\\, chat\\; vaccin/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});

test("import expands recurring events and ignores free/cancelled ones", () => {
  const src = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "BEGIN:VEVENT", "UID:r1", "DTSTART:20261005T120000Z", "DTEND:20261005T130000Z", "RRULE:FREQ=DAILY;COUNT=3", "SUMMARY:Lunch", "END:VEVENT",
    "BEGIN:VEVENT", "UID:f1", "DTSTART:20261005T150000Z", "DTEND:20261005T160000Z", "TRANSP:TRANSPARENT", "SUMMARY:Free", "END:VEVENT",
    "BEGIN:VEVENT", "UID:c1", "DTSTART:20261005T170000Z", "DTEND:20261005T180000Z", "STATUS:CANCELLED", "SUMMARY:Cancelled", "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const busy = parseBusy(src, new Date("2026-10-05T00:00:00Z"), new Date("2026-10-10T00:00:00Z"));
  assert.equal(busy.length, 3);
  assert.equal(busy[2].start.toISOString(), "2026-10-07T12:00:00.000Z");
});
