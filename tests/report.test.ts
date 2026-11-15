import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, parseReport } from "../src/lib/report";
import { reportEmail } from "../src/lib/email/templates";

test("prompt forbids invention and remote prescription in France", () => {
  const p = buildPrompt({ transcript: "Vet: bonjour", lang: "fr", country: "FR", petName: "Luna", species: "cat", reason: "ne mange plus" });
  assert.match(p, /Write in French/);
  assert.match(p, /do not include any prescription/);
  assert.match(p, /Use ONLY information stated/);
});

test("model output is parsed defensively", () => {
  const r = parseReport('Voici :\n{"reason":"Anorexie","observations":"Chat abattu","advice":"Surveiller","follow_up":"48 h","warning_signs":"Vomissements","extra":1}');
  assert.equal(r.reason, "Anorexie");
  assert.equal(parseReport("pas de JSON").advice, "");
});

test("report email lists validated sections", () => {
  const m = reportEmail({ lang: "fr", name: "Marie", when: "lundi", withName: "Dr Martin", service: "Téléconseil", appUrl: "https://televet.co" },
    { reason: "Anorexie", observations: "", advice: "Alimentation humide", follow_up: "", warning_signs: "Vomissements" });
  assert.match(m.subject, /Compte rendu/);
  assert.match(m.html, /Alimentation humide/);
  assert.doesNotMatch(m.html, /Observations/);
});
