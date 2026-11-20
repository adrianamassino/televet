import test from "node:test";
import assert from "node:assert/strict";
import { isExpoToken, pushLang, pushText } from "../src/lib/push-copy";

test("push text is localised and falls back to English", () => {
  assert.equal(pushText("vet_request", "it", { who: "Giulia — Luna", when: "lun 3 mar, 10:00" }).title, "Nuova richiesta di appuntamento");
  assert.equal(pushText("vet_request", "it", { who: "Giulia — Luna", when: "lun 3 mar, 10:00" }).body, "Giulia — Luna · lun 3 mar, 10:00");
  assert.equal(pushText("owner_confirmed", "de", { practice: "Clinica Blu", when: "Mon 3 Mar" }).title, "Appointment confirmed");
  assert.equal(pushLang("fr-FR"), 0); assert.equal(pushLang(null), 2);
});
test("missing values never leave dangling separators", () => {
  assert.equal(pushText("vet_request", "en", { when: "Mon 10:00" }).body, "Mon 10:00");
  assert.equal(pushText("owner_confirmed", "fr", { practice: "Clinique du Parc" }).body, "Clinique du Parc");
});
test("pet reminder mentions how many more are due", () => {
  const t = pushText("owner_pet_due", "it", { pet: "Luna", item: "Rabbia", when: "3 marzo", more: 2 });
  assert.equal(t.title, "Promemoria salute: Luna"); assert.equal(t.body, "Rabbia · 3 marzo (+2 altri)");
});
test("only Expo push tokens are accepted", () => {
  assert.ok(isExpoToken("ExponentPushToken[abcDEF123456_-xyz]")); assert.ok(isExpoToken("ExpoPushToken[abcdefgh12345678]"));
  assert.ok(!isExpoToken("abc")); assert.ok(!isExpoToken("ExponentPushToken[]")); assert.ok(!isExpoToken(null));
});
