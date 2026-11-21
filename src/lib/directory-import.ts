/**
 * France: veterinary establishments (NAF 75.00Z) from the State's public company search
 * (recherche-entreprises.api.gouv.fr, built on the INSEE SIRENE open data, Licence Ouverte / Etalab).
 * Pure mapping, tested; the network calls are in /api/cron/import-directory.
 *
 * Privacy rules kept from the SIRENE import script: only active establishments, never an entry marked non-diffusible,
 * and never a private person's name as the clinic name (a sole trader without a trade name is skipped).
 */
import { slugForListing } from "./directory";

export const API = "https://recherche-entreprises.api.gouv.fr/search";
export const VET_NAF = "75.00Z";
/** Metropolitan departments + Corsica + overseas. */
export const DEPARTMENTS = [
  ...Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(2, "0")).filter((d) => d !== "20"), "2A", "2B", "971", "972", "973", "974", "976",
];

type Etab = {
  siret?: string; activite_principale?: string; etat_administratif?: string; est_siege?: boolean;
  adresse?: string; code_postal?: string; libelle_commune?: string; latitude?: string | number | null; longitude?: string | number | null;
  liste_enseignes?: string[] | null; nom_commercial?: string | null; statut_diffusion_etablissement?: string;
};
export type ApiCompany = {
  siren?: string; nom_complet?: string; nom_raison_sociale?: string | null; nature_juridique?: string; statut_diffusion?: string;
  siege?: Etab; matching_etablissements?: Etab[];
};

const NON_DIFF = /non[\s-]?diffusible/i;
const clean = (s?: string | null) => (s ?? "").replace(/\s+/g, " ").trim();
const title = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase()) : s);
const num = (v: unknown) => { const n = typeof v === "number" ? v : parseFloat(String(v ?? "")); return Number.isFinite(n) ? n : null; };

/** One API result → the directory rows for its veterinary establishments. */
export function rowsFromCompany(c: ApiCompany) {
  if (c.statut_diffusion && c.statut_diffusion !== "O") return [];
  const soleTrader = (c.nature_juridique ?? "").startsWith("1"); // 1000 = entrepreneur individuel
  const etabs = (c.matching_etablissements?.length ? c.matching_etablissements : c.siege ? [c.siege] : []);
  const out: Record<string, unknown>[] = [];
  for (const e of etabs) {
    if (!e.siret || (e.activite_principale && e.activite_principale.replace(/\./g, "") !== VET_NAF.replace(/\./g, ""))) continue;
    if (e.etat_administratif && e.etat_administratif !== "A") continue;
    if (e.statut_diffusion_etablissement && e.statut_diffusion_etablissement !== "O") continue;
    const brand = clean(e.liste_enseignes?.[0] ?? e.nom_commercial);
    const company = soleTrader ? "" : clean(c.nom_raison_sociale ?? c.nom_complet);
    const name = title(brand || company);
    if (!name || NON_DIFF.test(name) || NON_DIFF.test(e.adresse ?? "")) continue;
    // "PARIS 11" / "LYON 3EME" / "MARSEILLE 8E ARRONDISSEMENT": the city is Paris, Lyon, Marseille (the district stays in the postcode)
    const city = title(clean(e.libelle_commune).replace(/^(PARIS|LYON|MARSEILLE)\s+\d+.*$/i, "$1"));
    const postal = clean(e.code_postal);
    // the API address ends with "postal code + town": keep only the street part
    const street = title(clean((e.adresse ?? "").replace(new RegExp(`\\s*${postal}\\s+.*$`), "")));
    out.push({
      country: "FR", name, address: street || null, postal_code: postal || null, city: city || null,
      lat: num(e.latitude), lng: num(e.longitude), source: "sirene", source_ref: e.siret,
      slug: slugForListing(name, city || null, e.siret), last_checked_at: new Date().toISOString(),
    });
  }
  return out;
}

export function searchUrl(dep: string, page: number) {
  const u = new URL(API);
  u.searchParams.set("activite_principale", VET_NAF);
  u.searchParams.set("departement", dep);
  u.searchParams.set("etat_administratif", "A");
  u.searchParams.set("per_page", "25");
  u.searchParams.set("page", String(page));
  return u.toString();
}
