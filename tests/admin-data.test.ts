import { test } from "node:test";
import assert from "node:assert/strict";
import { addBooking, emptyStat, parsePct } from "../src/lib/admin-data";
import { reviewEmail } from "../src/lib/review-mail";

const b = (o: object) => ({ practice_id: "p", practitioner_id: "v", owner_id: "o1", pet_id: "pet1", type: "home", status: "confirmed", payment_status: "captured", price_cents: 8000, commission_cents: 960, currency: "EUR", ...o });

test("only captured payments count as revenue; patients and clients are distinct", () => {
  const s = emptyStat(), seen = { pets: new Set<string>(), owners: new Set<string>() };
  addBooking(s, b({}), seen); addBooking(s, b({ type: "video", payment_status: "pending" }), seen); addBooking(s, b({ owner_id: "o2", pet_id: "pet2", status: "cancelled" }), seen);
  assert.equal(s.total, 3);
  assert.deepEqual(s.byType, { home: 2, video: 1 });
  assert.deepEqual(s.revenue.EUR, { gross: 8000, commission: 960, net: 7040 });
  assert.equal(seen.pets.size, 1); assert.equal(seen.owners.size, 1); // cancelled booking is not a patient
});

test("commission percentage: empty clears, bounds enforced", () => {
  assert.equal(parsePct(""), null); assert.equal(parsePct(null), null);
  assert.equal(parsePct("12.345"), 12.35); assert.equal(parsePct(0), 0);
  assert.throws(() => parsePct(101)); assert.throws(() => parsePct(-1)); assert.throws(() => parsePct("abc"));
});

test("review e-mail has five rating links with the booking token, in the owner's language", () => {
  const m = reviewEmail("it", "Luca", "IT", "tok-123");
  assert.match(m.subject, /appuntamento/i);
  for (const n of [1, 2, 3, 4, 5]) assert.ok(m.html.includes(`/it/it/avis/tok-123?r=${n}`));
  assert.ok(reviewEmail("xx", "", "FR", "t").html.includes("/en/fr/avis/t?r=5")); // unknown language falls back to English
});

import { brazilian } from "../src/lib/brazilian";
test("Brazilian Portuguese derivation", () => {
  assert.equal(brazilian("Marcar consulta"), "Agendar consulta");
  assert.equal(brazilian("O seu animal merece atenção. Veterinário ao domicílio."), "Seu animal merece atenção. Veterinário a domicílio.");
  assert.equal(brazilian("A enviar…"), "Enviando…");
  assert.equal(brazilian("Escreva-nos pelo contacto ou telemóvel"), "Escreva para nós pelo contato ou celular");
  assert.equal(brazilian("Os nossos serviços e a nossa equipa"), "Nossos serviços e nossa equipe");
  assert.equal(brazilian("A casa e a mulher"), "A casa e a mulher"); // no false positives on plain articles
  assert.deepEqual(brazilian({ a: ["os seus cães"] }), { a: ["seus cachorros"] });
});

import { validate } from "../scripts/import-legacy-practices";
test("legacy practice import validation", () => {
  const ok = { kind: "clinic" as const, name: "Lilas", owner_email: "a@b.fr", country: "fr", stripe_account_id: "acct_1AbC" };
  assert.deepEqual(validate(ok), []);
  assert.ok(validate({ ...ok, owner_email: "x" }).length);
  assert.ok(validate({ ...ok, country: "ZZ" }).length);
  assert.ok(validate({ ...ok, stripe_account_id: "sk_live_x" }).length); // never accept a secret key by mistake
  assert.ok(validate({ ...ok, services: [{ type: "home", duration_min: 1, price_cents: 100 }] }).length);
});
