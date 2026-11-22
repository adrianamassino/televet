import type { Metadata } from "next";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, faqLd, ldJson, organizationLd, pageMetadata, SERVICE_SLUGS, SITE } from "@/lib/seo";
import { CATEGORIES, COMMON, categoryOf, codesTreating, isCategory, pageName, SPECIES_LANGS, speciesFromSlug, speciesSlug, EXOTIC_GROUP } from "@/lib/species";
import { consultName, consultsFor } from "@/lib/consult-catalog";
import { FRAME, speciesNote } from "@/lib/species-content";

/**
 * One page per animal and per category of animals (SEO): what to see a vet for, the three ways to consult,
 * the vets on Televet who treat it, a short care note, FAQ and links to the related animals.
 * Lives under the [service] segment: /fr/fr/veterinaire-chats is a species page, /fr/fr/veterinaire-a-domicile a service page.
 */
export function speciesPageFor(lang: string, country: string, slug: string) {
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang) || !(SPECIES_LANGS as readonly string[]).includes(lang.slice(0, 2))) return null;
  const code = speciesFromSlug(lang, slug);
  return code ? { code, cc } : null;
}

const fill = (s: string, pl: string, c: string) => s.replaceAll("{pl}", pl).replaceAll("{c}", c);
const frameOf = (lang: string) => FRAME[lang.slice(0, 2)] ?? FRAME.en;

export function speciesMetadata(lang: string, cc: string, code: string): Metadata {
  const f = frameOf(lang), countryName = new Intl.DisplayNames([lang], { type: "region" }).of(cc) ?? cc;
  const pl = pageName(code, lang, true, false);
  return pageMetadata({
    title: `${fill(f.title, pl, countryName)} | Televet`, description: fill(f.intro, pl, countryName).slice(0, 158),
    lang, country: cc, onlyCountry: cc, index: true,
    path: (l, c) => `/${l}/${c.toLowerCase()}/${speciesSlug(code, l)}`,
  });
}

async function vetsTreating(cc: string, code: string) {
  const codes = codesTreating(code), db = adminClient();
  const [a, b] = await Promise.all([
    db.from("practices").select("id, name, slug, headline, city").eq("country", cc).eq("published", true).overlaps("species", codes).limit(40),
    db.from("practitioners").select("practice_id, practices!inner(id, name, slug, headline, city, country, published)").eq("active", true).overlaps("species", codes).eq("practices.country", cc).eq("practices.published", true).limit(40),
  ]);
  const out = new Map<string, { id: string; name: string; slug: string; headline: string | null; city: string | null }>();
  for (const p of a.data ?? []) out.set(p.id, p);
  for (const r of (b.data ?? []) as unknown as { practices: { id: string; name: string; slug: string; headline: string | null; city: string | null } }[]) if (r.practices) out.set(r.practices.id, r.practices);
  return [...out.values()].sort((x, y) => x.name.localeCompare(y.name)).slice(0, 40);
}

export default async function SpeciesPage({ lang, cc, code }: { lang: string; cc: string; code: string }) {
  const f = frameOf(lang), countryName = new Intl.DisplayNames([lang], { type: "region" }).of(cc) ?? cc;
  const country = cc.toLowerCase(), rel = `/${lang}/${country}`, base = `${SITE}${rel}`;
  const pl = pageName(code, lang, true, false), title = fill(f.h1, pl, countryName);
  const cat = code === "exotic" ? null : categoryOf(code);
  const note = speciesNote(code, cat, lang);
  const consults = consultsFor(codesTreating(code)).slice(0, 18);
  const vets = await vetsTreating(cc, code);
  // related animals: members of a category (or of the exotic group), the category of an animal, its siblings, then the main pages
  const members = code === "exotic" ? EXOTIC_GROUP : isCategory(code) ? CATEGORIES.find((c) => c.code === code)!.members : [];
  const siblings = cat ? [cat, ...CATEGORIES.find((c) => c.code === cat)!.members.filter((m) => m !== code)] : [];
  const main = [...COMMON, "exotic", ...CATEGORIES.map((c) => c.code)].filter((x) => x !== code && !members.includes(x) && !siblings.includes(x));
  const faq = f.faq.map(([q, a]) => ({ q: fill(q, pl, countryName), a: fill(a, pl, countryName) }));
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${base}/` }, ...(cat ? [{ name: pageName(cat, lang), url: `${base}/${speciesSlug(cat, lang)}` }] : []), { name: title, url: `${base}/${speciesSlug(code, lang)}` }]), faqLd(faq)];
  const link = (c: string) => <li key={c}><a href={`${rel}/${speciesSlug(c, lang)}`}>{pageName(c, lang)}</a></li>;

  return (
    <main className="wrap narrow svc-page species-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`${rel}/`}>Televet</a>{cat && <> › <a href={`${rel}/${speciesSlug(cat, lang)}`}>{pageName(cat, lang)}</a></>} › {pageName(code, lang)}</nav>
      <h1>{title}</h1>
      <p className="lead-p">{fill(f.intro, pl, countryName)}</p>
      <p><a className="btn" href={`${rel}/recherche`}>{f.seeAll} →</a></p>
      {note && <aside className="species-note"><strong>{f.good}</strong><p>{note}</p></aside>}

      {members.length > 0 && <section><h2>{f.members}</h2><ul className="svc-towns">{members.map(link)}</ul></section>}

      <section><h2>{f.how}</h2>
        <ul className="species-modes">
          {(["video", "home", "clinic"] as const).map((m) => <li key={m}><a href={`${rel}/${SERVICE_SLUGS[m][lang] ?? SERVICE_SLUGS[m].en}`}>{fill(f.modes[m], pl, countryName)}</a></li>)}
        </ul></section>

      <section><h2>{f.reasons}</h2><ul className="species-reasons">{consults.map((c) => <li key={c.code}>{consultName(c.code, lang)}</li>)}</ul></section>

      <section><h2>{fill(f.vets, pl, countryName)}</h2>
        {vets.length ? <ul className="cards">{vets.map((p) => <li key={p.id}><h3><a href={`${rel}/veterinaire/${p.slug}`}>{p.name}</a></h3>{(p.headline || p.city) && <p>{[p.headline, p.city].filter(Boolean).join(" · ")}</p>}</li>)}</ul>
          : <p>{fill(f.noVets, pl, countryName)} <a href={`${rel}/${SERVICE_SLUGS.video[lang] ?? SERVICE_SLUGS.video.en}`}>{f.modes.video.split(":")[0]} →</a></p>}
      </section>

      <section><h2>FAQ</h2>{faq.map((x) => <details key={x.q} className="svc-faq"><summary>{x.q}</summary><p>{x.a}</p></details>)}</section>

      {siblings.length > 0 && <section><h2>{f.members}</h2><ul className="svc-towns">{siblings.map(link)}</ul></section>}
      <section><h2>{f.others}</h2><ul className="svc-towns">{main.map(link)}</ul></section>
    </main>
  );
}
