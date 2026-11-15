import { test } from "node:test";
import assert from "node:assert/strict";
import { availabilityBlock, pickLocale, buildSystemPrompt, cleanLocale, ctaUrl, finalizeTurn, looksLikeEmergency, normalizeHistory, parseTurn, stripLinks, fallbackTurn, ctaLabel } from "../src/lib/chat";

test("model output: links and e-mails are stripped, unknown cta keys dropped, max 2 cta", () => {
  const t = parseTurn('Sure {"reply":"Voir https://evil.example/login ou écrire a@b.com. Restez calme.","audience":"owner","urgency":"none","cta":["book_video","https://x","book_home","faq"],"topic":"cat <script>","needs_human":false}')!;
  assert.ok(!/evil|@|http/.test(t.reply));
  assert.deepEqual(t.cta, ["book_video", "book_home"]);
  assert.equal(t.topic, "cat script");
  assert.equal(parseTurn("not json"), null);
  assert.equal(parseTurn('{"reply":""}'), null);
});

test("destinations come only from our own whitelist, per language", () => {
  assert.equal(ctaUrl("book_video", "it", "IT"), "/it/it/veterinario-online");
  assert.equal(ctaUrl("book_home", "fr", "FR"), "/fr/fr/veterinaire-a-domicile");
  assert.equal(ctaUrl("vet_signup", "es", "AR"), "/es/ar/pro");
  assert.equal(ctaLabel("book_video", "ja"), "Talk to a vet");   // unsupported language → English
  assert.equal(ctaLabel("book_video", "de"), "Mit einem Tierarzt sprechen");
});

test("emergency wording is detected server-side in fr/it/en/es", () => {
  for (const s of ["mon chien ne respire plus", "il a mangé du chocolat", "il gatto non riesce a urinare", "mio cane ha le convulsioni", "my cat can't breathe", "mi perro comió chocolate"]) assert.ok(looksLikeEmergency(s), s);
  assert.ok(!looksLikeEmergency("mon chat éternue un peu"));
});

test("finalize: owner + urgency forces the booking button; vet gets the sign-up button; urgency floor from text", () => {
  const base = { reply: "x", audience: "owner" as const, urgency: "none" as const, cta: [], topic: "", needs_human: false };
  assert.ok(finalizeTurn({ ...base, urgency: "urgent" }, "salut").cta.includes("book_video"));
  const f = finalizeTurn(base, "mon chat a des convulsions");
  assert.equal(f.urgency, "urgent"); assert.ok(f.cta.includes("book_video"));
  assert.deepEqual(finalizeTurn({ ...base, audience: "vet" }, "bonjour").cta, ["vet_signup"]);
  assert.ok(finalizeTurn({ ...base, needs_human: true }, "bonjour").cta.includes("contact"));
  assert.equal(finalizeTurn({ ...base, audience: "unknown" }, "salut", "vet").audience, "vet");
});

test("history is merged to alternate and starts/ends with the visitor", () => {
  const h = normalizeHistory([{ role: "assistant", content: "a0" }, { role: "user", content: "u1" }, { role: "user", content: "u2" }, { role: "assistant", content: "a1" }, { role: "user", content: "u3" }, { role: "assistant", content: "a2" }]);
  assert.deepEqual(h.map((m) => m.role), ["user", "assistant", "user"]);
  assert.equal(h[0].content, "u1\nu2");
});

test("locale falls back to fr/FR; prompt carries facts and forbids urls", () => {
  assert.deepEqual(cleanLocale("xx", "ZZ"), { lang: "fr", country: "FR" });
  assert.deepEqual(cleanLocale("it", "it"), { lang: "it", country: "IT" });
  const p = buildSystemPrompt({ lang: "it", country: "IT", page: "/it/it/faq" });
  assert.ok(p.includes("NEVER write URLs") && p.includes("Italian") && p.includes("front desk"));
  assert.ok(!/\d\s?€|€\s?\d/.test(p), "prices must not be in the prompt");
  assert.ok(p.includes("NEVER quote a price"));
  assert.ok(!/compléter/i.test(p));
  assert.equal(fallbackTurn("fr", "vet").cta[0], "vet_signup");
  assert.equal(stripLinks("a www.x.com b"), "a b");
});

test("pages without a locale: country from the IP header, language from Accept-Language", () => {
  const h = (o: Record<string, string>) => new Headers(o);
  assert.deepEqual(pickLocale({ localized: false }, h({ "x-vercel-ip-country": "AR", "accept-language": "es-AR,es;q=0.9" })), { lang: "es", country: "AR" });
  assert.deepEqual(pickLocale({ localized: false }, h({ "x-vercel-ip-country": "BE", "accept-language": "nl-BE,nl" })), { lang: "nl", country: "BE" });
  assert.deepEqual(pickLocale({ localized: false }, h({ "x-vercel-ip-country": "IT", "accept-language": "zh-CN" })), { lang: "it", country: "IT" });
  assert.deepEqual(pickLocale({ localized: false }, h({})), { lang: "fr", country: "FR" });
  assert.deepEqual(pickLocale({ localized: true, lang: "it", country: "it" }, h({ "x-vercel-ip-country": "AR" })), { lang: "it", country: "IT" });
});

test("availability: never offer a search page that is empty for the visitor's country", () => {
  const base = { reply: "x", audience: "owner" as const, urgency: "urgent" as const, cta: ["book_video", "book_home"] as ("book_video" | "book_home")[], topic: "", needs_human: false };
  const none = finalizeTurn(base, "ciao", "owner", { video: 0, home: 0, clinic: 0 });
  assert.deepEqual(none.cta, ["contact"]);
  const onlyVideo = finalizeTurn(base, "ciao", "owner", { video: 3, home: 0, clinic: 0 });
  assert.deepEqual(onlyVideo.cta, ["book_video"]);
  assert.deepEqual(finalizeTurn(base, "ciao", "owner", null).cta, ["book_video", "book_home"]);   // pre-launch: no filtering
});

test("availability block: honest about the country, unknown before launch", () => {
  assert.match(availabilityBlock({ FR: { video: 4, home: 2, clinic: 0 } }, "AR"), /Vets currently available there — online: 0/);
  assert.match(availabilityBlock({ FR: { video: 4, home: 2, clinic: 0 } }, "FR"), /online: 4, home visits: 2/);
  assert.match(availabilityBlock({}, "FR"), /not known yet/);
  assert.match(availabilityBlock(null, "FR"), /not known yet/);
  assert.match(buildSystemPrompt({ lang: "pt", country: "PT", page: "", coverage: { PT: { video: 1, home: 0, clinic: 0 } } }), /Portuguese/);
});
