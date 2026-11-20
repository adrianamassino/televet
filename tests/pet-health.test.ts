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
