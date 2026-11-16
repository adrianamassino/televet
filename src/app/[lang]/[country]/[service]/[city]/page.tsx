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
};

async function load(lang: string, country: string, service: string, city: string) {
  const cc = country.toUpperCase();
  const svc = serviceFromSlug(lang, service);
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang) || !svc) return null;
  const db = adminClient();
  const { data } = await db.from("practices")
    .select("id, name, slug, headline, address, postal_code, languages, phone, services!inner(type, active), service_zones(postal_codes)")
    .eq("country", cc).eq("published", true).eq("services.type", svc).eq("services.active", true);
  const list = (data ?? []).filter((p) => svc === "video" || slugify(`${p.address ?? ""} ${p.postal_code ?? ""}`).includes(city)
    || (p.service_zones ?? []).some((z: { postal_codes: string[] }) => z.postal_codes.some((pc) => slugify(pc) === city)));
  return { cc, svc, list, cityName: city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, service, city } = await params;
  const d = await load(lang, country, service, city);
  if (!d) return {};
  const h1 = (H1[lang] ?? H1.en)[d.svc].replace("{c}", d.cityName);
  return pageMetadata({
    title: `${h1} : disponibilités et prise de RDV en ligne | Televet`,
    description: `${h1} : comparez ${d.list.length} vétérinaires, leurs tarifs et leurs créneaux libres, et réservez en ligne.`,
    lang, country: d.cc, onlyCountry: d.cc, index: d.list.length > 0,
    path: (l, c) => `/${l}/${c.toLowerCase()}/${SERVICE_SLUGS[d.svc][l] ?? service}/${city}`,
  });
}

export default async function CityPage({ params }: P) {
  const { lang, country, service, city } = await params;
  const d = await load(lang, country, service, city);
  if (!d || !d.list.length) notFound();
  const h1 = (H1[lang] ?? H1.en)[d.svc].replace("{c}", d.cityName);
  const base = `${SITE}/${lang}/${country}`;
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: h1, url: `${base}/${service}/${city}` }]),
    ...d.list.map((p) => veterinaryCareLd({ name: p.name, url: `${base}/veterinaire/${p.slug}`, description: p.headline ?? undefined, address: p.address ?? undefined, postalCode: p.postal_code ?? undefined, country: d.cc, phone: p.phone ?? undefined, languages: p.languages }))];
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`/${lang}/${country}/`}>Televet</a> › {h1}</nav>
      <h1>{h1}</h1>
      <ul>{d.list.map((p) => <li key={p.id}><h2><a href={`/${lang}/${country}/veterinaire/${p.slug}`}>{p.name}</a></h2><p>{p.headline}</p></li>)}</ul>
    </main>
  );
}
