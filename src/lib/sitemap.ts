/**
 * Sitemaps built from the database: one index, then one file per site version (language + country) and kind of page.
 * Only canonical, indexable pages go in; every entry carries its translations (reciprocal hreflang) and, when known,
 * the date its content last changed. A new clinic, vet or city appears in the right file on the next request.
 */
import { COUNTRIES } from "./countries";
import { SERVICE_SLUGS, SITE, slugify } from "./seo";
import { SPECIES_LANGS, SPECIES_PAGES, speciesSlug } from "./species";

export type Kind = "pages" | "services" | "cities" | "clinics" | "vets" | "directory" | "listings" | "blog";
export const KINDS: Kind[] = ["pages", "services", "cities", "clinics", "vets", "directory", "listings", "blog"];
/** Below Google's limit of 50,000 URLs per file, with room for the hreflang links. */
export const PER_FILE = 45000;

export interface Entry { kind: Kind; lang: string; country: string; path: string; lastmod?: string; alternates: Record<string, string> }
/** "fr-FR" style code for hreflang; the file key is lower-case "fr-fr". */
export const hreflang = (lang: string, country: string) => `${lang}-${country.toUpperCase()}`;
export const localeKey = (lang: string, country: string) => `${lang}-${country.toLowerCase()}`;

/**
 * One page that exists in several versions. `versions` lists [lang, country, path]; each version becomes an entry whose
 * alternates point to all the others and to itself (hreflang must be reciprocal and self-referencing).
 */
export function group(kind: Kind, versions: [string, string, string][], lastmod?: string): Entry[] {
  const alternates = Object.fromEntries(versions.map(([l, c, p]) => [hreflang(l, c), `${SITE}${p}`]));
  return versions.map(([l, c, p]) => ({ kind, lang: l, country: c.toUpperCase(), path: p, lastmod, alternates }));
}

/** Versions of a page for the published countries, in each country's languages (optionally only some countries/languages). */
export function versionsOf(countries: string[], path: (l: string, c: string) => string | null, langOk: (l: string, c: string) => boolean = () => true): [string, string, string][] {
  const out: [string, string, string][] = [];
  for (const cc of countries) for (const l of COUNTRIES[cc]?.languages ?? []) {
    if (!langOk(l, cc)) continue;
    const p = path(l, cc.toLowerCase());
    if (p) out.push([l, cc, p]);
  }
  return out;
}

export interface SitemapData {
  countries: string[];
  faqLangs: string[];
  blog: { lang: string; posts: { slug: string; modified?: string }[] }[];
  practices: { id: string; slug: string; country: string; city: string | null; updated_at?: string | null;
    services: { type: string; active: boolean }[]; practitioners: { slug: string | null; active: boolean; approved: boolean }[] }[];
  directoryCities: { country: string; city: string; slug?: string | null; address?: string | null; postal_code?: string | null; status?: string; updated_at?: string | null }[];
}

/** Every indexable URL of the site, grouped as translations of the same page. Pure: the caller loads the data. */
export function buildEntries(d: SitemapData): Entry[] {
  const out: Entry[] = [];
  const live = d.countries.filter((c) => COUNTRIES[c]);
  out.push(...group("pages", versionsOf(live, (l, c) => `/${l}/${c}/`)));
  for (const pg of ["pro", "pricing", "contact"]) out.push(...group("pages", versionsOf(live, (l, c) => `/${l}/${c}/${pg}`)));
  out.push(...group("pages", versionsOf(live, (l, c) => `/${l}/${c}/faq`, (l) => d.faqLangs.includes(l))));

  // blog: one file per language; served in each country of that language
  for (const b of d.blog) {
    if (!b.posts.length) continue; // an empty blog index is not worth indexing
    const where = live.filter((c) => COUNTRIES[c].languages.includes(b.lang));
    for (const cc of where) {
      const c = cc.toLowerCase();
      out.push({ kind: "blog", lang: b.lang, country: cc, path: `/${b.lang}/${c}/blog`, alternates: { [hreflang(b.lang, cc)]: `${SITE}/${b.lang}/${c}/blog` } });
      for (const p of b.posts) out.push({ kind: "blog", lang: b.lang, country: cc, path: `/${b.lang}/${c}/blog/${encodeURI(p.slug)}`, lastmod: p.modified || undefined, alternates: { [hreflang(b.lang, cc)]: `${SITE}/${b.lang}/${c}/blog/${encodeURI(p.slug)}` } });
    }
  }

  const cityServices = new Map<string, { cc: string; svc: "home" | "clinic"; city: string; lastmod?: string }>();
  const countryServices = new Set<string>();
  for (const p of d.practices) {
    const cc = p.country;
    if (!live.includes(cc)) continue;
    const lm = p.updated_at ?? undefined;
    out.push(...group("clinics", versionsOf([cc], (l, c) => `/${l}/${c}/veterinaire/${p.slug}`), lm));
    for (const v of p.practitioners ?? []) if (v.active && v.approved && v.slug) out.push(...group("vets", versionsOf([cc], (l, c) => `/${l}/${c}/veterinaire/${p.slug}/${v.slug}`), lm));
    const city = slugify(p.city ?? "");
    for (const s of p.services ?? []) {
      if (!s.active || !(s.type in SERVICE_SLUGS)) continue;
      countryServices.add(`${cc}|${s.type}`);
      if (s.type !== "video" && city) {
        const k = `${cc}|${s.type}|${city}`, prev = cityServices.get(k);
        if (!prev || (lm && (!prev.lastmod || lm > prev.lastmod))) cityServices.set(k, { cc, svc: s.type as "home" | "clinic", city, lastmod: lm });
      }
    }
  }
  // French guide pages (video, home visits) are useful before the first vet joins: always listed for France, in French
  if (live.includes("FR")) for (const svc of ["video", "home"] as const) { countryServices.delete(`FR|${svc}`); out.push(...group("services", [["fr", "FR", `/fr/fr/${SERVICE_SLUGS[svc].fr}`]])); }
  for (const k of countryServices) {
    const [cc, svc] = k.split("|") as [string, "home" | "video" | "clinic"];
    out.push(...group("services", versionsOf([cc], (l, c) => (SERVICE_SLUGS[svc][l] ? `/${l}/${c}/${SERVICE_SLUGS[svc][l]}` : null))));
  }
  for (const x of cityServices.values()) out.push(...group("cities", versionsOf([x.cc], (l, c) => (SERVICE_SLUGS[x.svc][l] ? `/${l}/${c}/${SERVICE_SLUGS[x.svc][l]}/${x.city}` : null)), x.lastmod));

  // one page per animal and per category of animals, in every published version whose language has the texts
  for (const code of SPECIES_PAGES) out.push(...group("services", versionsOf(live, (l, c) => `/${l}/${c}/${speciesSlug(code, l)}`, (l) => (SPECIES_LANGS as readonly string[]).includes(l.slice(0, 2)))));

  // directory: country index + one page per city that has listings
  const dirCountries = new Set<string>();
  const dirCities = new Set<string>();
  for (const x of d.directoryCities) {
    if (!live.includes(x.country)) continue;
    const city = slugify(x.city);
    if (!city) continue;
    dirCountries.add(x.country);
    if (!dirCities.has(`${x.country}|${city}`)) { dirCities.add(`${x.country}|${city}`); out.push(...group("directory", versionsOf([x.country], (l, c) => `/${l}/${c}/annuaire/${city}`))); }
    // the clinic's own directory page, when it has a full public address (same rule as the page's index tag);
    // a claimed listing is replaced by the clinic's profile, already listed under "clinics"
    if (x.slug && x.address && x.postal_code && x.status !== "claimed") out.push(...group("listings", versionsOf([x.country], (l, c) => `/${l}/${c}/annuaire/${city}/${x.slug}`), x.updated_at ?? undefined));
  }
  for (const cc of dirCountries) out.push(...group("directory", versionsOf([cc], (l, c) => `/${l}/${c}/annuaire`)));

  const seen = new Set<string>();
  return out.filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)));
}

/** Entries split into files: key = "fr-fr/clinics-1". */
export function splitFiles(entries: Entry[]): Map<string, Entry[]> {
  const byKey = new Map<string, Entry[]>();
  for (const e of entries) {
    const base = `${localeKey(e.lang, e.country)}/${e.kind}`;
    const list = byKey.get(base) ?? [];
    list.push(e); byKey.set(base, list);
  }
  const files = new Map<string, Entry[]>();
  for (const [base, list] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    list.sort((a, b) => a.path.localeCompare(b.path));
    for (let i = 0; i * PER_FILE < list.length; i++) files.set(`${base}-${i + 1}`, list.slice(i * PER_FILE, (i + 1) * PER_FILE));
  }
  return files;
}

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function urlsetXml(entries: Entry[]): string {
  const rows = entries.map((e) => {
    const alt = Object.entries(e.alternates).sort(([a], [b]) => a.localeCompare(b))
      .map(([h, u]) => `<xhtml:link rel="alternate" hreflang="${h}" href="${xmlEsc(u)}"/>`).join("");
    return `<url><loc>${xmlEsc(SITE + e.path)}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ""}${alt}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join("\n")}\n</urlset>\n`;
}

export function indexXml(files: Map<string, Entry[]>): string {
  const rows = [...files.entries()].map(([key, list]) => {
    const last = list.map((e) => e.lastmod).filter(Boolean).sort().pop();
    return `<sitemap><loc>${xmlEsc(`${SITE}/sitemaps/${key}.xml`)}</loc>${last ? `<lastmod>${new Date(last).toISOString()}</lastmod>` : ""}</sitemap>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</sitemapindex>\n`;
}
