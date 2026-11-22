import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONSULTS, CONSULT_LANGS, consultName, consultsFor, searchConsults, serviceTitle } from "../src/lib/consult-catalog";
import { CATEGORIES, PET_SPECIES_CODES, SPECIES, SPECIES_LANGS, SPECIES_PAGES, codesTreating, speciesFromSlug, speciesName, speciesSlug, speciesSummary, toggleSpecies, treats } from "../src/lib/species";
import { SERVICE_SLUGS } from "../src/lib/seo";
import { buildEntries } from "../src/lib/sitemap";

test("every consultation has a unique code and a name in each language", () => {
  assert.equal(new Set(CONSULTS.map((c) => c.code)).size, CONSULTS.length);
  assert.ok(CONSULTS.length >= 90);
  for (const c of CONSULTS) for (const l of CONSULT_LANGS) assert.ok(c.names[l]?.trim(), `${c.code} ${l}`);
});

test("typing finds the consultation in the vet's language, another language, a common word or with a typo", () => {
  assert.equal(searchConsults("vacc", "it")[0].consult.code, "vaccination");
  assert.equal(searchConsults("dermato", "fr")[0].consult.code, "dermatology");
  assert.equal(searchConsults("puce", "fr")[0].consult.code, "microchip");
  assert.equal(searchConsults("teeth", "it")[0].consult.category, "dental");
  const typo = searchConsults("vacinazzione", "it");
  assert.ok(typo.length && typo[0].close && typo[0].consult.code.startsWith("vacc"));
  assert.equal(searchConsults("xyzqw", "fr").length, 0);
  assert.ok(searchConsults("Vaccinazione", "it")[0].exact);
});

test("a catalogue consultation shows in the visitor's language, the vet's own words stay as written", () => {
  assert.equal(serviceTitle({ catalog_code: "vaccination", custom_name: null }, "es", "x"), "Vacunación");
  assert.equal(serviceTitle({ catalog_code: "custom", custom_name: "Visite chiot + puce" }, "en", "x"), "Visite chiot + puce");
  assert.equal(serviceTitle({ catalog_code: "video_consult", custom_name: null }, "fr", "En visio"), "En visio");
  assert.equal(consultName("dental_scaling", "pt-BR"), "Destartarização");
});

test("animals: names, categories and slugs", () => {
  for (const s of SPECIES) for (const l of SPECIES_LANGS) assert.ok(s.names[l]?.sg && s.names[l]?.pl, `${s.code} ${l}`);
  assert.equal(speciesName("guinea_pig", "fr", true), "Cochons d'Inde");
  assert.equal(speciesName("rodent", "it", true), "Roditori");
  for (const l of SPECIES_LANGS) {
    const slugs = SPECIES_PAGES.map((c) => speciesSlug(c, l));
    assert.equal(new Set(slugs).size, slugs.length, l);
    for (const svc of Object.values(SERVICE_SLUGS)) assert.ok(!slugs.includes(svc[l]), l);
    for (const c of SPECIES_PAGES) assert.equal(speciesFromSlug(l, speciesSlug(c, l)), c);
  }
  assert.equal(speciesSlug("exotic", "fr"), "veterinaire-nac");
  assert.equal(speciesSlug("cat", "fr"), "veterinaire-chats");
});

test("a category can be ticked whole or animal by animal", () => {
  let v = toggleSpecies(["dog"], "rodent", true);
  assert.deepEqual(v, ["dog", "rodent"]);
  v = toggleSpecies(v, "hamster", false); // all rodents but the hamster
  assert.ok(!v.includes("rodent") && !v.includes("hamster") && v.includes("guinea_pig"));
  v = toggleSpecies(v, "hamster", true); // every member again → the category
  assert.deepEqual(v, ["dog", "rodent"]);
  v = toggleSpecies(["horse"], "pony", true);
  assert.deepEqual(v, ["horse", "pony"]);
  assert.ok(treats(["rodent"], "chinchilla") && treats(["chinchilla"], "rodent") && !treats(["dog"], "rodent"));
  assert.ok(codesTreating("exotic").includes("guinea_pig"));
  assert.deepEqual(speciesSummary(["cat", "dog", "hamster", "rat"], "fr"), ["Chiens", "Chats", "Rongeurs (hamsters, rats)"]);
  assert.ok(CATEGORIES.every((c) => c.members.length > 0));
});

test("consultations for a species page fit the animal", () => {
  const fish = consultsFor(codesTreating("fish")).map((c) => c.code);
  assert.ok(fish.includes("fish_consult") && !fish.includes("dental_scaling") && !fish.includes("litter_problems"));
  assert.ok(consultsFor(["cat"]).some((c) => c.code === "litter_problems"));
});

test("the database accepts every animal of the list (migration 0019)", () => {
  const sql = readFileSync("supabase/migrations/0019_species_catalog.sql", "utf8");
  const list = [...sql.matchAll(/species in \(([^)]*)\)/g)].pop()![1].split(",").map((x) => x.trim().replace(/'/g, ""));
  assert.deepEqual([...list].sort(), [...PET_SPECIES_CODES].sort());
});

test("species pages are in the sitemap", () => {
  const e = buildEntries({ countries: ["FR", "IT"], faqLangs: [], blog: [], practices: [], directoryCities: [] });
  assert.ok(e.some((x) => x.path === "/fr/fr/veterinaire-chats"));
  assert.ok(e.some((x) => x.path === "/it/it/veterinario-roditori"));
});
