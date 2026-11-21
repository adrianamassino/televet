import { test } from "node:test";
import assert from "node:assert/strict";
import { clampTravel, directionsUrl, tooClose, withTravel } from "../src/lib/travel";
import { cleanZoneForm, coarsePlace, matchZones, parsePostalList, postalMatches, zoneFormFromRows, zoneRows, zoneSummary } from "../src/lib/zones";
import { computeSlots } from "../src/lib/availability";

const d = (h: number, m = 0) => new Date(Date.UTC(2026, 11, 7, h, m));

test("travel: an existing home visit blocks its travel time for any new appointment", () => {
  const [b] = withTravel([{ start: d(10), end: d(11), travelMin: 30 }], false, 45);
  assert.equal(b.start.toISOString(), d(9, 30).toISOString());
  assert.equal(b.end.toISOString(), d(11, 30).toISOString());
});
test("travel: a new home visit widens clinic appointments and days off by the vet's travel time", () => {
  const [b] = withTravel([{ start: d(10), end: d(11) }], true, 20);
  assert.equal(b.start.toISOString(), d(9, 40).toISOString());
  const [c] = withTravel([{ start: d(10), end: d(11) }], false, 20);
  assert.equal(c.start.toISOString(), d(10).toISOString()); // clinic next to clinic: no gap
});
test("travel: between two home visits the larger travel time counts once", () => {
  const others = [{ start: d(10), end: d(11), travelMin: 30 }];
  assert.equal(tooClose({ start: d(11, 30), end: d(12, 30) }, true, 20, others), false);
  assert.equal(tooClose({ start: d(11, 15), end: d(12, 15) }, true, 20, others), true);
  assert.equal(tooClose({ start: d(11, 15), end: d(12, 15) }, true, 45, others), true);
  assert.equal(tooClose({ start: d(11, 45), end: d(12, 45) }, true, 45, others), false);
});
test("travel: slots are not offered right after a home visit", () => {
  const rules = [{ weekday: 1, start_time: "09:00", end_time: "13:00", slot_min: 30 }];
  const busy = withTravel([{ start: d(10), end: d(11), travelMin: 30 }], true, 30);
  const slots = computeSlots({ rules, timeZone: "UTC", durationMin: 60, from: d(0), days: 1, busy, leadTimeMin: 0, now: d(0) } as never).map((s) => s.start.slice(11, 16));
  assert.ok(!slots.includes("09:00") && !slots.includes("11:00"), slots.join(","));
  assert.ok(slots.includes("11:30"), slots.join(","));
});
test("travel: clamp and directions link", () => {
  assert.equal(clampTravel("45"), 45); assert.equal(clampTravel(999), 240); assert.equal(clampTravel(-3), 0); assert.equal(clampTravel(null), 30);
  assert.equal(directionsUrl(" Via Roma 1, Milano "), "https://www.google.com/maps/dir/?api=1&destination=Via%20Roma%201%2C%20Milano");
});
test("postal: lists, prefixes and ranges", () => {
  assert.deepEqual(parsePostalList("20121, 20122;201* 20121  bad!! 20140-20149"), ["20121", "20122", "201*", "20140-20149"]);
  assert.ok(postalMatches("20135", ["201*"]));
  assert.ok(postalMatches("20145", ["20140-20149"]));
  assert.ok(!postalMatches("20150", ["20140-20149"]));
  assert.ok(postalMatches("00-001", ["00-001"]));          // Polish code, not a range
  assert.ok(postalMatches("SW1A 1AA", ["sw1a1aa"]));
  assert.ok(!postalMatches(null, ["201*"]));
  assert.ok(matchZones([{ mode: "postal", postal_codes: ["75*"], center_lat: null, center_lng: null, radius_km: null, polygon: null, extra_fee_cents: 0, weekdays: [] }], { postalCode: "75011", lat: null, lng: null, weekday: 1 }).covered);
});
test("zone form: radius with wider area round-trips; client summary hides the street", () => {
  const f = cleanZoneForm({ mode: "radius", label: "Via Roma 12, 20121 Milano", lat: 45.46, lng: 9.19, km: "12", extended: { km: 25, feeCents: 1500 } })!;
  assert.equal(f.mode, "radius");
  const rows = zoneRows(f);
  assert.equal(rows.length, 2); assert.equal(rows[1].extra_fee_cents, 1500);
  assert.deepEqual(zoneFormFromRows(rows), f);
  assert.equal(coarsePlace(f.mode === "radius" ? f.label : ""), "20121 Milano");
  assert.equal(coarsePlace("Via Roma 12"), "");
  assert.deepEqual(zoneSummary(f), { mode: "radius", km: 12, place: "20121 Milano", extended: { km: 25, feeCents: 1500 } });
  const m = matchZones(rows.map((r) => ({ ...r, polygon: null, weekdays: [] })), { postalCode: null, lat: 45.46 + 0.15, lng: 9.19, weekday: 1 }); // ~16.7 km north
  assert.deepEqual(m, { covered: true, extraFeeCents: 1500 });
});
test("zone form: refuses unusable input", () => {
  assert.equal(cleanZoneForm({ mode: "radius", lat: 0, lng: 0, km: 10 }), null);
  assert.equal(cleanZoneForm({ mode: "radius", lat: 45, lng: 9, km: 0 }), null);
  assert.equal(cleanZoneForm({ mode: "postal", codes: " ,, " }), null);
  const p = cleanZoneForm({ mode: "postal", codes: "20121,20122", extended: { codes: "20121, 20900", feeCents: 0 } })!;
  assert.equal(p.extended, null); // no fee → no wider area
  const q = cleanZoneForm({ mode: "postal", codes: "20121", extended: { codes: "20121, 20900", feeCents: 1000 } })!;
  assert.deepEqual(q.mode === "postal" && q.extended?.codes, ["20900"]);
});
