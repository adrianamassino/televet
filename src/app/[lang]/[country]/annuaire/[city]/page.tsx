import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SITE, slugify } from "@/lib/seo";

/** Directory by city: /fr/fr/annuaire/lyon — every clinic, with online booking first. */
type P = { params: Promise<{ lang: string; country: string; city: string }> };

async function load(country: string, city: string) {
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc]) return null;
  const { data } = await adminClient().from("directory_listings").select("id, name, address, postal_code, city, status, slug, practice_id, source")
    .eq("country", cc).neq("status", "removed").limit(2000);
  const list = (data ?? []).filter((d) => slugify(d.city ?? "") === city).sort((a, b) => Number(b.status === "claimed") - Number(a.status === "claimed"));
  return { cc, list, cityName: list[0]?.city ?? city };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, city } = await params;
  const d = await load(country, city);
  if (!d) return {};
  return pageMetadata({ title: `Cliniques vétérinaires à ${d.cityName} (${d.list.length}) | Televet`, description: `Annuaire des ${d.list.length} cliniques vétérinaires à ${d.cityName} : adresses, et prise de rendez-vous en ligne avec les cliniques présentes sur Televet.`, lang, country: d.cc, onlyCountry: d.cc, index: d.list.length > 0, path: (l, c) => `/${l}/${c.toLowerCase()}/annuaire/${city}` });
}

export default async function DirectoryCity({ params }: P) {
  const { lang, country, city } = await params;
  const d = await load(country, city);
  if (!d || !d.list.length) notFound();
  const base = `${SITE}/${lang}/${country}`;
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: "Annuaire", url: `${base}/annuaire` }, { name: d.cityName, url: `${base}/annuaire/${city}` }]),
    { "@context": "https://schema.org", "@type": "ItemList", itemListElement: d.list.map((x, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "VeterinaryCare", name: x.name, address: { "@type": "PostalAddress", streetAddress: x.address, postalCode: x.postal_code, addressLocality: x.city, addressCountry: d.cc } } })) }];
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <h1>Cliniques vétérinaires à {d.cityName}</h1>
      <ul>{d.list.map((x) => (
        <li key={x.id}><h2 style={{ fontSize: 17 }}>{x.status === "claimed" ? <a href={`/${lang}/${country}/veterinaire/${x.slug}`}>{x.name}</a> : x.name}</h2>
          <p>{[x.address, x.postal_code, x.city].filter(Boolean).join(", ")}</p>
          <p>{x.status === "claimed" ? "Réservation en ligne disponible" : "Prise de rendez-vous en ligne non disponible · Vous travaillez ici ? Revendiquez cette clinique"}</p></li>))}</ul>
      {d.list.some((x) => x.source === "osm") && <p style={{ fontSize: 12 }}>Données partielles © contributeurs OpenStreetMap (ODbL).</p>}
    </main>
  );
}
