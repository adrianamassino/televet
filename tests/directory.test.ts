import { test } from "node:test";
import assert from "node:assert/strict";
import { emailMatchesWebsite, hashCode, parseCsvLine, slugForListing } from "../src/lib/directory";

test("email-domain claim requires the clinic's own domain", () => {
  assert.equal(emailMatchesWebsite("dr@clinique-parc.fr", "https://www.clinique-parc.fr"), true);
  assert.equal(emailMatchesWebsite("dr@mail.clinique-parc.fr", "clinique-parc.fr"), true);
  assert.equal(emailMatchesWebsite("dr@gmail.com", "https://www.clinique-parc.fr"), false);
  assert.equal(emailMatchesWebsite("dr@clinique-parc.fr", null), false);
});

test("codes are hashed per claim", () => {
  assert.notEqual(hashCode("123456", "a"), hashCode("123456", "b"));
});

test("SIRENE CSV lines with quotes are parsed", () => {
  assert.deepEqual(parseCsvLine('123,"CLINIQUE ""DU PARC""",75.00Z,,Paris'), ["123", 'CLINIQUE "DU PARC"', "75.00Z", "", "Paris"]);
});

test("listing slugs are readable and unique", () => {
  assert.equal(slugForListing("Clinique Vétérinaire du Parc", "Lyon", "12345678901234"), "clinique-veterinaire-du-parc-lyon-01234");
});

import { toPlace } from "../src/lib/google-places";
test("Google Places (New) response is mapped", () => {
  const p = toPlace({ id: "ChIJ1", displayName: { text: "Clinique du Parc" }, formattedAddress: "12 rue X, 75012 Paris", websiteUri: "https://www.cliniqueduparc.fr/", businessStatus: "OPERATIONAL", types: ["veterinary_care", "point_of_interest"] });
  assert.equal(p.operational, true);
  assert.equal(p.isVet, true);
  assert.equal(p.website, "https://www.cliniqueduparc.fr/");
});
