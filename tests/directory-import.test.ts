import { test } from "node:test";
import assert from "node:assert/strict";
import { DEPARTMENTS, rowsFromCompany, searchUrl } from "../src/lib/directory-import";
import { buildEntries } from "../src/lib/sitemap";

test("directory import: keeps active vet establishments with a public trade name", () => {
  const rows = rowsFromCompany({
    siren: "123456789", nom_complet: "SELARL VETO BASTILLE", nom_raison_sociale: "SELARL VETO BASTILLE", nature_juridique: "5485",
    matching_etablissements: [
      { siret: "12345678900011", activite_principale: "75.00Z", etat_administratif: "A", adresse: "12 RUE DE LA ROQUETTE 75011 PARIS", code_postal: "75011", libelle_commune: "PARIS", latitude: "48.85", longitude: "2.37", liste_enseignes: ["CLINIQUE VETERINAIRE BASTILLE"] },
      { siret: "12345678900029", activite_principale: "75.00Z", etat_administratif: "F", adresse: "1 RUE X 75012 PARIS", code_postal: "75012", libelle_commune: "PARIS" },
      { siret: "12345678900037", activite_principale: "47.11A", etat_administratif: "A", adresse: "2 RUE Y 75012 PARIS", code_postal: "75012", libelle_commune: "PARIS" },
    ],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Clinique Veterinaire Bastille");
  assert.equal(rows[0].address, "12 Rue De La Roquette");
  assert.equal(rows[0].city, "Paris");
  assert.equal(rows[0].lat, 48.85);
  assert.equal(rows[0].source_ref, "12345678900011");
});
test("directory import: never a private person's name, never non-diffusible entries", () => {
  assert.equal(rowsFromCompany({ nom_complet: "JEAN DUPONT", nature_juridique: "1000", matching_etablissements: [{ siret: "1", activite_principale: "75.00Z", etat_administratif: "A", code_postal: "69001", libelle_commune: "LYON" }] }).length, 0);
  assert.equal(rowsFromCompany({ nom_complet: "X", statut_diffusion: "P", matching_etablissements: [{ siret: "2", activite_principale: "75.00Z" }] }).length, 0);
  assert.equal(rowsFromCompany({ nom_raison_sociale: "[NON-DIFFUSIBLE]", nature_juridique: "5499", matching_etablissements: [{ siret: "3", activite_principale: "75.00Z" }] }).length, 0);
  // a sole trader with a trade name is fine: the clinic's name, not the person's
  assert.equal(rowsFromCompany({ nom_complet: "JEAN DUPONT", nature_juridique: "1000", matching_etablissements: [{ siret: "4", activite_principale: "75.00Z", etat_administratif: "A", code_postal: "69001", libelle_commune: "LYON", liste_enseignes: ["CABINET VETERINAIRE DU PARC"] }] })[0].name, "Cabinet Veterinaire Du Parc");
});
test("directory import: departments and query", () => {
  assert.equal(DEPARTMENTS.length, 101);
  assert.ok(DEPARTMENTS.includes("2A") && !DEPARTMENTS.includes("20"));
  assert.match(searchUrl("75", 2), /activite_principale=75\.00Z&departement=75&etat_administratif=A&per_page=25&page=2/);
});
test("sitemap: directory clinic pages only with a full address, not once claimed", () => {
  const e = buildEntries({ countries: ["FR"], faqLangs: [], blog: [], practices: [], directoryCities: [
    { country: "FR", city: "Paris", slug: "clinique-a-paris-00011", address: "12 Rue X", postal_code: "75011", status: "unclaimed" },
    { country: "FR", city: "Paris", slug: "clinique-b-paris-00022", address: null, postal_code: "75011", status: "unclaimed" },
    { country: "FR", city: "Paris", slug: "clinique-c-paris-00033", address: "1 Rue Y", postal_code: "75012", status: "claimed" },
  ] }).map((x) => x.path);
  assert.ok(e.includes("/fr/fr/annuaire/paris/clinique-a-paris-00011"));
  assert.ok(!e.some((p) => p.includes("clinique-b") || p.includes("clinique-c")));
  assert.ok(e.includes("/fr/fr/annuaire/paris") && e.includes("/fr/fr/annuaire"));
});
test("directory import: arrondissements belong to their city", () => {
  const r = rowsFromCompany({ nom_raison_sociale: "SELARL X", nature_juridique: "5485", matching_etablissements: [{ siret: "9", activite_principale: "75.00Z", etat_administratif: "A", code_postal: "75011", libelle_commune: "PARIS 11", adresse: "1 RUE A 75011 PARIS 11" }] });
  assert.equal(r[0].city, "Paris"); assert.equal(r[0].address, "1 Rue A");
});
