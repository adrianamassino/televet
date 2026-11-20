import { test } from "node:test";
import assert from "node:assert/strict";
import { missingItems, ONBOARDING_COPY, REMINDER_DAYS } from "../src/lib/onboarding-copy";
import { onboardingEmail } from "../src/lib/onboarding";

const base = { kind: "vet", phone: "0612345678", postal_code: "75004", address: null, stripe_status: "active", mp_status: "none" };
const svc = [{ active: true, price_cents: 2000 }];

test("a complete profile has nothing missing", () => assert.deepEqual(missingItems(base, svc, 5), []));
test("a brand-new draft misses everything", () => assert.deepEqual(missingItems({ kind: "vet", phone: null, postal_code: null, address: null, stripe_status: "none", mp_status: "none" }, [], 0), ["profile", "services", "hours", "payments"]));
test("clinic needs an address, independent vet does not", () => {
  assert.deepEqual(missingItems({ ...base, kind: "clinic" }, svc, 1), ["profile"]);
  assert.deepEqual(missingItems({ ...base, kind: "clinic", address: "1 rue X" }, svc, 1), []);
});
test("services need an active one with a price", () => {
  assert.deepEqual(missingItems(base, [{ active: false, price_cents: 2000 }], 1), ["services"]);
  assert.deepEqual(missingItems(base, [{ active: true, price_cents: 0 }], 1), ["services"]);
});
test("Mercado Pago counts as payments connected", () => assert.deepEqual(missingItems({ ...base, stripe_status: "none", mp_status: "active" }, svc, 1), []));

test("reminder e-mail lists what is missing, links to the resume page, and the last one says so", () => {
  const m = onboardingEmail("it", "IT", "Giulia", ["services", "payments"], 0);
  assert.match(m.html, /Giulia/); assert.match(m.html, /\/it\/it\/pro\/inscription/);
  assert.match(m.html, new RegExp(ONBOARDING_COPY.it.items.services)); assert.doesNotMatch(m.html, new RegExp(ONBOARDING_COPY.it.items.hours));
  assert.notEqual(onboardingEmail("it", "IT", "", ["hours"], 0).subject, onboardingEmail("it", "IT", "", ["hours"], REMINDER_DAYS.length - 1).subject);
});
test("unknown language falls back to English; pt-BR uses the Brazilian variant", () => {
  assert.match(onboardingEmail("xx", "FR", "", ["hours"], 0).subject, /Televet/);
  assert.ok(onboardingEmail("pt", "BR", "", ["hours"], 0).html.length > 100);
});
test("every language covers every step", () => { for (const [l, c] of Object.entries(ONBOARDING_COPY)) for (const k of ["profile", "services", "hours", "payments"] as const) assert.ok(c.items[k], `${l}.${k}`); });
