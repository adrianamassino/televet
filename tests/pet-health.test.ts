import test from "node:test";
import assert from "node:assert/strict";
import { cleanDate, sanitizeProposals, reminderStage, daysUntil } from "../src/lib/pet-health";

const none = { r30: false, r7: false, r0: false };
test("cleanDate accepts ISO, rejects junk", () => {
  assert.equal(cleanDate("2025-03-04"), "2025-03-04");
  assert.equal(cleanDate("pippo"), null);
  assert.equal(cleanDate(null), null);
});
test("sanitizeProposals drops invalid entries", () => {
  const out = sanitizeProposals([{ kind: "vaccine", name: "Rabies", done_on: "2025-01-02", next_due: "2026-01-02" }, { kind: "nope", name: "" }, "x"]);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, "Rabies");
});
test("daysUntil", () => assert.equal(daysUntil("2026-01-10", "2026-01-01"), 9));
test("reminderStage windows", () => {
  const t = "2026-06-10";
  assert.equal(reminderStage("2026-07-05", t, none), "30");
  assert.equal(reminderStage("2026-06-15", t, none), "7");
  assert.equal(reminderStage("2026-06-10", t, none), "0");
  assert.equal(reminderStage("2026-06-05", t, none), "0");
  assert.equal(reminderStage("2026-06-01", t, none), null);
  assert.equal(reminderStage("2027-01-01", t, none), null);
  assert.equal(reminderStage(null, t, none), null);
  assert.equal(reminderStage("2026-06-15", t, { ...none, r7: true }), null);
});

import { findDates, parseBookletText } from "../src/lib/pet-ocr-parse";
test("findDates handles numeric and written dates", () => {
  assert.deepEqual(findDates("vacc 12/03/2024 rappel 12.03.25", 2026).map((d) => d.iso), ["2024-03-12", "2025-03-12"]);
  assert.deepEqual(findDates("le 5 mars 2023", 2026).map((d) => d.iso), ["2023-03-05"]);
  assert.equal(findDates("31/02/2024", 2026).length, 0);
});
test("parseBookletText finds product + dates, ignores lines without dates", () => {
  const out = parseBookletText("Nobivac Rabies lotto A123 14/05/2024 richiamo 14/05/2025\nNote del veterinario\nDrontal 02-01-2025", "2026-06-01");
  assert.equal(out.length, 2);
  assert.equal(out[0].kind, "vaccine"); assert.equal(out[0].done_on, "2024-05-14"); assert.equal(out[0].next_due, "2025-05-14");
  assert.equal(out[1].kind, "antiparasitic"); assert.equal(out[1].done_on, "2025-01-02");
});
test("a future date alone is treated as the next due date", () => {
  const [p] = parseBookletText("Vaccin rage 01/09/2026", "2026-06-01");
  assert.equal(p.done_on, null); assert.equal(p.next_due, "2026-09-01");
});
