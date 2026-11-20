import test from "node:test";
import assert from "node:assert/strict";
import { amounts, resolveRule, parseFixed } from "../src/lib/commission";

const country = { pct: 10, fixed: null };
test("percentage is taken out of the vet's price", () => {
  const r = resolveRule({ country });
  assert.deepEqual(amounts(5000, r), { total: 5000, fee: 500, net: 4500 });
});
test("fixed fee (cents) is added on top: 1000 = 10 euros", () => {
  const r = resolveRule({ practice: { fixed: 1000 }, country });
  assert.deepEqual(amounts(5000, r), { total: 6000, fee: 1000, net: 5000 });
});
test("vet level wins over clinic and country; fixed beats pct at the same level", () => {
  assert.equal(resolveRule({ practitioner: { pct: 5 }, practice: { fixed: 1000 }, country }).mode, "pct");
  assert.equal(resolveRule({ practitioner: { pct: 5, fixed: 300 }, country }).fixed, 300);
  assert.equal(resolveRule({ practitioner: { pct: null, fixed: null }, practice: null, country: { pct: 12 } }).pct, 12);
});
test("a fixed fee of 0 is a real rule (no commission), not 'inherit'", () => {
  assert.equal(resolveRule({ practice: { fixed: 0 }, country }).mode, "fixed");
});
test("parseFixed accepts whole cents only", () => {
  assert.equal(parseFixed("1000"), 1000); assert.equal(parseFixed(""), null); assert.equal(parseFixed(null), null);
  assert.throws(() => parseFixed("10.5")); assert.throws(() => parseFixed(-1));
});
