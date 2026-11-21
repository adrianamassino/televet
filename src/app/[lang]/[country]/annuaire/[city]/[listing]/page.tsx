import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { ClaimListing } from "@/components/ClaimListing";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SERVICE_SLUGS, SITE, slugify } from "@/lib/seo";
import { DIR } from "../../copy";

export const dynamic = "force-dynamic";
/** One clinic of the directory: /fr/fr/annuaire/lyon/clinique-veterinaire-x-lyon-12345. Public facts only, with their source. */
type P = { params: Promise<{ lang: string; country: string; city: string; listing: string }> };

const L: Record<string, Record<string, string>> = {
  fr: { unclaimed: "Fiche non revendiquée", source: "Source : base SIRENE de l'INSEE (données publiques), vérifiée le", map: "Plan", nearby: "Vétérinaires réservables en ligne à", others: "Autres cliniques à", title: "{n} à {c} : adresse et plan", desc: "{n}, clinique vétérinaire à {c} ({a}). Adresse, plan et vétérinaires de {c} réservables en ligne sur Televet.", home: "Vétérinaire à domicile à", clinic: "Cliniques réservables à" },
  en: { unclaimed: "Unclaimed listing", source: "Source: INSEE SIRENE register (public data), checked on", map: "Map", nearby: "Vets bookable online in", others: "Other clinics in", title: "{n} in {c}: address and map", desc: "{n}, vet clinic in {c} ({a}). Address, map and vets in {c} you can book online on Televet.", home: "Home visit vets in", clinic: "Bookable clinics in" },
};

async function load(country: string, city: string, listing: string) {
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc]) return null;
  const db = adminClient();
  const { data: x } = await db.from("directory_listings").select("id, name, address, postal_code, city, lat, lng, status, slug, practice_id, source, last_checked_at, updated_at, practices(slug, published)").eq("country", cc).eq("slug", listing).neq("status", "removed").maybeSingle();
  if (!x) return null;
  const [{ data: others }, { data: bookable }] = await Promise.all([
    db.from("directory_listings").select("name, slug, city").eq("country", cc).eq("city", x.city ?? "").neq("id", x.id).neq("status", "removed").limit(12),
    db.from("practices").select("name, slug").eq("country", cc).eq("published", true).ilike("city", x.city ?? "-").limit(6),
  ]);
  return { cc, x, others: others ?? [], bookable: bookable ?? [] };
}
/** Indexed only with a full public address: otherwise the page is shown but kept out of search engines. */
const indexable = (x: { address: string | null; postal_code: string | null; city: string | null; status: string }) => !!(x.address && x.postal_code && x.city) && x.status !== "removed";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, city, listing } = await params;
  const d = await load(country, city, listing);
  if (!d) return {};
  const t = L[lang.split("-")[0]] ?? L.en, c = d.x.city ?? "";
  return pageMetadata({
    title: `${t.title.replace("{n}", d.x.name).replace("{c}", c)} | Televet`,
    description: t.desc.replace("{n}", d.x.name).replaceAll("{c}", c).replace("{a}", [d.x.address, d.x.postal_code].filter(Boolean).join(", ")),
    lang, country: d.cc, onlyCountry: d.cc, index: indexable(d.x),
    path: (l, cc2) => `/${l}/${cc2.toLowerCase()}/annuaire/${slugify(c)}/${d.x.slug}`,
  });
}

export default async function Listing({ params }: P) {
  const { lang, country, city, listing } = await params;
  const d = await load(country, city, listing);
  if (!d) notFound();
  const { x } = d, rel = `/${lang}/${country}`, base = `${SITE}${rel}`, citySlug = slugify(x.city ?? "");
  const p = x.practices as unknown as { slug: string; published: boolean } | null;
  if (x.status === "claimed" && p?.published) permanentRedirect(`${rel}/veterinaire/${p.slug}`); // the clinic's own page replaces the listing
  if (citySlug && city !== citySlug) permanentRedirect(`${rel}/annuaire/${citySlug}/${x.slug}`);
  const t = L[lang.split("-")[0]] ?? L.en, dir = DIR[lang] ?? DIR.en;
  const addr = [x.address, [x.postal_code, x.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const checked = x.last_checked_at ?? x.updated_at;
  const date = checked ? new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(new Date(checked)) : "";
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: dir.back, url: `${base}/annuaire` }, { name: x.city ?? "", url: `${base}/annuaire/${citySlug}` }, { name: x.name, url: `${base}/annuaire/${citySlug}/${x.slug}` }]),
    { "@context": "https://schema.org", "@type": "VeterinaryCare", name: x.name, url: `${base}/annuaire/${citySlug}/${x.slug}`,
      address: { "@type": "PostalAddress", streetAddress: x.address ?? undefined, postalCode: x.postal_code ?? undefined, addressLocality: x.city ?? undefined, addressCountry: d.cc },
      ...(x.lat != null && x.lng != null ? { geo: { "@type": "GeoCoordinates", latitude: x.lat, longitude: x.lng } } : {}) }];
  const svc = (k: "home" | "clinic") => SERVICE_SLUGS[k][lang];
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`${rel}/`}>Televet</a> › <a href={`${rel}/annuaire`}>{dir.back}</a> › <a href={`${rel}/annuaire/${citySlug}`}>{x.city}</a> › {x.name}</nav>
      <h1>{x.name}</h1>
      <p className="lead-p">{addr}</p>
      <p><span className="chip wait">{t.unclaimed}</span> <span className="muted-p">{dir.offline}</span></p>
      {x.lat != null && x.lng != null && <iframe title={`${t.map} · ${x.name}`} loading="lazy" style={{ width: "100%", height: 280, border: "1px solid var(--line)", borderRadius: 12 }}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${x.lng - 0.008},${x.lat - 0.005},${x.lng + 0.008},${x.lat + 0.005}&layer=mapnik&marker=${x.lat},${x.lng}`} />}
      {d.bookable.length > 0 && <section style={{ marginTop: 24 }}><h2 style={{ fontSize: 20 }}>{t.nearby} {x.city}</h2>
        <ul>{d.bookable.map((b) => <li key={b.slug}><a href={`${rel}/veterinaire/${b.slug}`}>{b.name}</a></li>)}</ul></section>}
      <p style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {svc("home") && citySlug && <a href={`${rel}/${svc("home")}/${citySlug}`}>{t.home} {x.city}</a>}
        {svc("clinic") && citySlug && <a href={`${rel}/${svc("clinic")}/${citySlug}`}>{t.clinic} {x.city}</a>}
      </p>
      <ClaimListing lang={lang} country={country} listingId={x.id} />
      {d.others.length > 0 && <section style={{ marginTop: 24 }}><h2 style={{ fontSize: 20 }}>{t.others} {x.city}</h2>
        <ul>{d.others.map((o) => <li key={o.slug}><a href={`${rel}/annuaire/${citySlug}/${o.slug}`}>{o.name}</a></li>)}</ul></section>}
      <p style={{ fontSize: 12, marginTop: 24 }}>{x.source === "sirene" ? `${t.source} ${date}.` : dir.osm}</p>
    </main>
  );
}
