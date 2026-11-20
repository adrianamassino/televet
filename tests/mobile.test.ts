// Pure helpers of the mobile apps (mobile/src): dates typed by hand, photo data, health-record entries, and the 4-language copy.
import test from "node:test";
import assert from "node:assert/strict";
import { addDays, base64ToBytes, dayKey, daysUntil, initials, maskDate, money, parseDayMonthYear, toDayMonthYear } from "../mobile/src/lib/format";
import { plusOneYear, sameEntry, sanitizeProposals } from "../mobile/src/lib/health";
import { COPY, COUNTRY_LANGS, COUNTRY_NAMES, COUNTRY_ORDER, LANGS, siteLang, translate } from "../mobile/src/copy";

test("dates typed as day/month/year", () => {
  assert.equal(parseDayMonthYear("25/12/2025"), "2025-12-25");
  assert.equal(parseDayMonthYear("5.3.24"), "2024-03-05");
  assert.equal(parseDayMonthYear("31/02/2024"), null);
  assert.equal(parseDayMonthYear("12/2025"), null);
  assert.equal(parseDayMonthYear("01/01/1980"), null);
  assert.equal(maskDate("25122025"), "25/12/2025"); assert.equal(maskDate("2512"), "25/12"); assert.equal(maskDate("2"), "2");
  assert.equal(toDayMonthYear("2025-12-25"), "25/12/2025"); assert.equal(toDayMonthYear(null), "");
});
test("days are counted in the clinic's time zone", () => {
  assert.equal(dayKey("2026-03-01T23:30:00Z", "Europe/Rome"), "2026-03-02");
  assert.equal(dayKey("2026-03-01T23:30:00Z", "America/Argentina/Buenos_Aires"), "2026-03-01");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(daysUntil("2026-01-10", "2026-01-01"), 9); assert.equal(daysUntil("2025-12-30", "2026-01-01"), -2);
});
test("money: cents, except currencies without decimals", () => {
  assert.match(money(3500, "EUR", "it"), /35/); assert.doesNotMatch(money(3500, "EUR", "it"), /3500/);
  assert.match(money(9000, "CLP", "es"), /9[.,\s]?000/);
  assert.equal(initials("giulia rossi bianchi"), "GR"); assert.equal(initials("  "), "?");
});
test("photo data decodes to the right bytes", () => {
  assert.equal(Buffer.from(base64ToBytes("SGVsbG8=")).toString(), "Hello");
  assert.equal(Buffer.from(base64ToBytes("VGVsZXZldCE=")).toString(), "Televet!");
  const big = Buffer.from(Array.from({ length: 1000 }, (_, i) => i % 256));
  assert.deepEqual(Buffer.from(base64ToBytes(big.toString("base64"))), big);
});
test("entries read from a booklet are checked before being shown", () => {
  const out = sanitizeProposals([{ kind: "vaccine", name: " Rabies ", done_on: "2025-01-02", next_due: "2024-01-02" }, { kind: "x", name: "Drontal", done_on: "nope" }, { name: "" }, 7]);
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], { kind: "vaccine", name: "Rabies", done_on: "2025-01-02", next_due: null, vet_name: null, notes: null });
  assert.equal(out[1].kind, "other"); assert.equal(out[1].done_on, null);
  assert.ok(sameEntry({ kind: "vaccine", name: "rabies ", done_on: "2025-01-02" }, out[0])); assert.ok(!sameEntry({ kind: "vaccine", name: "Rabies", done_on: null }, out[0]));
  assert.equal(plusOneYear("2025-05-14"), "2026-05-14");
});
test("every text exists in the four languages, with the same placeholders", () => {
  const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
  for (const [key, entry] of Object.entries(COPY)) {
    assert.equal(entry.length, 4, key);
    for (const s of entry) assert.ok(s.trim().length > 0, `${key} is empty in one language`);
    for (const s of entry) assert.equal(holes(s), holes(entry[0]), `${key}: placeholders differ`);
  }
  assert.equal(translate("nVisits", "it", { n: 3 }), "3 appuntamenti");
  assert.equal(translate("hAskDelPet", "en", { name: "Luna" }), "Delete Luna and its health record?");
});
test("countries of the app match the website", () => {
  assert.deepEqual([...COUNTRY_ORDER].sort(), Object.keys(COUNTRY_LANGS).sort());
  for (const cc of COUNTRY_ORDER) assert.equal(COUNTRY_NAMES[cc].length, LANGS.length);
  assert.equal(siteLang("it", "FR"), "fr"); assert.equal(siteLang("en", "FR"), "en"); assert.equal(siteLang("fr", "BR"), "pt");
});

import { COUNTRIES } from "../src/lib/countries";
test("the app's country/language table is the website's", () => {
  assert.deepEqual(Object.keys(COUNTRY_LANGS).sort(), Object.keys(COUNTRIES).sort());
  for (const cc of Object.keys(COUNTRIES)) assert.deepEqual(COUNTRY_LANGS[cc], COUNTRIES[cc].languages, cc);
});
