import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSlots } from "../src/lib/availability";
import { zonedToUtc } from "../src/lib/time";
import { extractPostalCode, matchZones } from "../src/lib/zones";
import { commissionCents } from "../src/lib/commission";

const rules = [{ weekday: 1, start_time: "09:00", end_time: "12:00", slot_min: 30 }]; // Mondays

test("slots are generated in the practice time zone", () => {
  const slots = computeSlots({ rules, timeZone: "Europe/Paris", durationMin: 30, from: new Date("2026-10-05T00:00:00Z"), days: 1, busy: [], now: new Date("2026-10-01T00:00:00Z") });
  assert.equal(slots.length, 6);
  assert.equal(slots[0].start, "2026-10-05T07:00:00.000Z"); // 09:00 Paris (UTC+2)
});

test("DST change is handled (Paris winter time)", () => {
  assert.equal(zonedToUtc("2026-11-02", "09:00", "Europe/Paris").toISOString(), "2026-11-02T08:00:00.000Z");
  assert.equal(zonedToUtc("2026-10-05", "09:00", "Australia/Sydney").toISOString(), "2026-10-04T22:00:00.000Z");
});

test("busy intervals (bookings, Google, iCal, Vetup) remove overlapping slots", () => {
  const busy = [{ start: new Date("2026-10-05T07:15:00Z"), end: new Date("2026-10-05T08:00:00Z") }];
  const slots = computeSlots({ rules, timeZone: "Europe/Paris", durationMin: 30, from: new Date("2026-10-05T00:00:00Z"), days: 1, busy, now: new Date("2026-10-01T00:00:00Z") });
  assert.deepEqual(slots.map((s) => s.start.slice(11, 16)), ["08:00", "08:30", "09:00", "09:30"]);
  assert.ok(!slots.some((s) => s.start.startsWith("2026-10-05T07")));
});

test("lead time hides slots too close to now", () => {
  const slots = computeSlots({ rules, timeZone: "Europe/Paris", durationMin: 30, from: new Date("2026-10-05T00:00:00Z"), days: 1, busy: [], now: new Date("2026-10-05T07:40:00Z"), leadTimeMin: 30 });
  assert.equal(slots[0].start, "2026-10-05T08:30:00.000Z");
});

test("postal codes are extracted per country", () => {
  assert.equal(extractPostalCode("12 rue Oberkampf, 75011 Paris", "FR"), "75011");
  assert.equal(extractPostalCode("Av. Corrientes 1000, C1043AAB CABA", "AR"), "C1043");
  assert.equal(extractPostalCode("100 Oxford St, Darlinghurst NSW 2010", "AU"), "2010");
  assert.equal(extractPostalCode("10 Upper Street, London N1 0PQ", "GB"), "N1");
});

test("home-visit zones: main zone, extended zone with fee, out of zone", () => {
  const zones = [
    { mode: "postal" as const, postal_codes: ["75011"], center_lat: null, center_lng: null, radius_km: null, polygon: null, extra_fee_cents: 0, weekdays: [1, 2, 3, 4, 5] },
    { mode: "radius" as const, postal_codes: [], center_lat: 48.8566, center_lng: 2.3522, radius_km: 10, polygon: null, extra_fee_cents: 1500, weekdays: [1, 2, 3, 4, 5] },
  ];
  assert.deepEqual(matchZones(zones, { postalCode: "75011", lat: null, lng: null, weekday: 1 }), { covered: true, extraFeeCents: 0 });
  assert.deepEqual(matchZones(zones, { postalCode: "94300", lat: 48.8475, lng: 2.4394, weekday: 1 }), { covered: true, extraFeeCents: 1500 });
  assert.equal(matchZones(zones, { postalCode: "78000", lat: 48.8049, lng: 2.1204, weekday: 1 }).covered, false);
  assert.equal(matchZones(zones, { postalCode: "75011", lat: null, lng: null, weekday: 0 }).covered, false);
});

test("commission: practitioner > practice > country", () => {
  assert.equal(commissionCents(8000, { country: 10 }), 800);
  assert.equal(commissionCents(8000, { practice: 15, country: 10 }), 1200);
  assert.equal(commissionCents(8000, { practitioner: 5, practice: 15, country: 10 }), 400);
});
