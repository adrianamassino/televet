import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SERVICE_SLUGS, SITE, serviceFromSlug, slugify, veterinaryCareLd } from "@/lib/seo";

/**
 * SEO landing pages, server-rendered: /fr/fr/veterinaire-a-domicile/paris-11e, /es/ar/veterinario-online/palermo …
 * One page per (service × city) where at least one published practice exists — no empty pages.
 */
type P = { params: Promise<{ lang: string; country: string; service: string; city: string }> };
const H1: Record<string, Record<string, string>> = {
  fr: { home: "Vétérinaire à domicile à {c}", video: "Vétérinaire en ligne", clinic: "Clinique vétérinaire à {c}" },
  en: { home: "Home visit vet in {c}", video: "Online vet", clinic: "Vet clinic in {c}" },
  it: { home: "Veterinario a domicilio a {c}", video: "Veterinario online", clinic: "Clinica veterinaria a {c}" },
  es: { home: "Veterinario a domicilio en {c}", video: "Veterinario online", clinic: "Clínica veterinaria en {c}" },
  pt: { home: "Veterinário ao domicílio em {c}", video: "Veterinário online", clinic: "Clínica veterinária em {c}" },
  de: { home: "Tierarzt-Hausbesuch in {c}", video: "Online-Tierarzt", clinic: "Tierarztpraxis in {c}" },
  pl: { home: "Weterynarz z dojazdem: {c}", video: "Weterynarz online", clinic: "Klinika weterynaryjna: {c}" },
  nl: { home: "Dierenarts aan huis in {c}", video: "Online dierenarts", clinic: "Dierenartspraktijk in {c}" },
};
/** Title end and description, in the page's language. {h} = the H1, {n} = number of vets. */
const META: Record<string, { title: string; desc: (n: number) => string }> = {
  fr: { title: "{h} : disponibilités et prise de RDV en ligne", desc: (n) => `{h} : ${n} vétérinaire${n > 1 ? "s" : ""} sur Televet. Tarifs, prochains créneaux libres et réservation en ligne.` },
  it: { title: "{h}: disponibilità e prenotazione online", desc: (n) => `{h}: ${n} veterinari${n > 1 ? "" : "o"} su Televet. Prezzi, prossimi orari liberi e prenotazione online.` },
  en: { title: "{h}: availability and online booking", desc: (n) => `{h}: ${n} vet${n > 1 ? "s" : ""} on Televet. Prices, next free times and online booking.` },
  es: { title: "{h}: disponibilidad y reserva online", desc: (n) => `{h}: ${n} veterinario${n > 1 ? "s" : ""} en Televet. Precios, próximos horarios libres y reserva online.` },
  pt: { title: "{h}: disponibilidade e marcação online", desc: (n) => `{h}: ${n} veterinário${n > 1 ? "s" : ""} na Televet. Preços, próximos horários livres e marcação online.` },
  de: { title: "{h}: freie Termine und Online-Buchung", desc: (n) => `{h}: ${n} Tierärzt${n > 1 ? "e" : "in/Tierarzt"} auf Televet. Preise, nächste freie Termine und Online-Buchung.` },
  pl: { title: "{h}: wolne terminy i rezerwacja online", desc: (n) => `{h}: ${n} weterynarz${n > 1 ? "y" : ""} w Televet. Ceny, najbliższe wolne terminy i rezerwacja online.` },
  nl: { title: "{h}: beschikbaarheid en online afspraak", desc: (n) => `{h}: ${n} dierenarts${n > 1 ? "en" : ""} op Televet. Prijzen, eerstvolgende vrije tijden en online boeken.` },
};
const base = (l: string) => l.split("-")[0];

async function load(lang: string, country: string, service: string, city: string) {
  const cc = country.toUpperCase();
  const svc = serviceFromSlug(lang, service);
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang) || !svc) return null;
  const db = adminClient();
  const { data } = await db.from("practices")
    .select("id, name, slug, headline, address, postal_code, city, languages, phone, services!inner(type, active), service_zones(postal_codes)")
    .eq("country", cc).eq("published", true).eq("services.type", svc).eq("services.active", true);
  const inCity = (p: { city: string | null; address: string | null; postal_code: string | null }) =>
    p.city ? slugify(p.city) === city : slugify(`${p.address ?? ""} ${p.postal_code ?? ""}`).includes(city);
  const list = (data ?? []).filter((p) => svc === "video" || inCity(p)
    || (p.service_zones ?? []).some((z: { postal_codes: string[] }) => (z.postal_codes ?? []).some((pc) => slugify(pc) === city)));
  // the city as written by the clinics themselves (accents, capitals), not rebuilt from the address
  const named = list.find((p) => p.city && slugify(p.city) === city)?.city;
  return { cc, svc, list, cityName: named ?? city.replace(/-/g, " ").replace(/\b\p{L}/gu, (m) => m.toUpperCase()) };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, service, city } = await params;
  const d = await load(lang, country, service, city);
  if (!d) return {};
  const h1 = (H1[base(lang)] ?? H1.en)[d.svc].replace("{c}", d.cityName), m = META[base(lang)] ?? META.en;
  return pageMetadata({
    title: `${m.title.replace("{h}", h1)} | Televet`,
    description: m.desc(d.list.length).replace("{h}", h1),
    lang, country: d.cc, onlyCountry: d.cc, index: d.list.length > 0,
    path: (l, c) => `/${l}/${c.toLowerCase()}/${SERVICE_SLUGS[d.svc][l] ?? service}/${city}`,
  });
}

export default async function CityPage({ params }: P) {
  const { lang, country, service, city } = await params;
  const d = await load(lang, country, service, city);
  if (!d || !d.list.length) notFound();
  const h1 = (H1[base(lang)] ?? H1.en)[d.svc].replace("{c}", d.cityName);
  const root = `${SITE}/${lang}/${country}`;
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${root}/` }, { name: h1, url: `${root}/${service}/${city}` }]),
    ...d.list.map((p) => veterinaryCareLd({ name: p.name, url: `${root}/veterinaire/${p.slug}`, description: p.headline ?? undefined, address: p.address ?? undefined, postalCode: p.postal_code ?? undefined, country: d.cc, phone: p.phone ?? undefined, languages: p.languages }))];
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`/${lang}/${country}/`}>Televet</a> › {h1}</nav>
      <h1>{h1}</h1>
      <ul>{d.list.map((p) => <li key={p.id}><h2><a href={`/${lang}/${country}/veterinaire/${p.slug}`}>{p.name}</a></h2><p>{p.headline}</p></li>)}</ul>
    </main>
  );
}
