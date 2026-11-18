import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { VI } from "@/components/VI";
import { PhotoStrip } from "@/components/PhotoStrip";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SITE, slugify } from "@/lib/seo";
import { DIR } from "../copy";

export const dynamic = "force-dynamic";
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
  const { lang, country, city } = await params; const t = DIR[lang] ?? DIR.en;
  const d = await load(country, city);
  if (!d) return {};
  return pageMetadata({ title: `${t.h1} — ${d.cityName} (${d.list.length}) | Televet`, description: `${t.clinics(d.list.length)} · ${d.cityName}. ${t.desc}`, lang, country: d.cc, onlyCountry: d.cc, index: d.list.length > 0, path: (l, c) => `/${l}/${c.toLowerCase()}/annuaire/${city}` });
}

export default async function DirectoryCity({ params }: P) {
  const { lang, country, city } = await params; const t = DIR[lang] ?? DIR.en;
  const d = await load(country, city);
  if (!d || !d.list.length) notFound();
  const base = `${SITE}/${lang}/${country}`, rel = `/${lang}/${country}`;
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: t.back, url: `${base}/annuaire` }, { name: d.cityName, url: `${base}/annuaire/${city}` }]),
    { "@context": "https://schema.org", "@type": "ItemList", itemListElement: d.list.map((x, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "VeterinaryCare", name: x.name, address: { "@type": "PostalAddress", streetAddress: x.address, postalCode: x.postal_code, addressLocality: x.city, addressCountry: d.cc } } })) }];
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`${rel}/`}>Televet</a> › <a href={`${rel}/annuaire`}>{t.back}</a> › {d.cityName}</nav>
      <h1>{t.h1} · {d.cityName}</h1><p className="lead-p">{t.clinics(d.list.length)}</p>
      <PhotoStrip set="b" />
      <ul className="vet-list">{d.list.map((x) => (
        <li key={x.id} className={x.status === "claimed" ? "is-online" : ""}>
          <span className="ico" aria-hidden><VI n={x.status === "claimed" ? "pawHeart" : "clinic"} size={34} /></span>
          <div><h3>{x.status === "claimed" ? <a href={`${rel}/veterinaire/${x.slug}`}>{x.name}</a> : x.name}</h3>
            <small>{[x.address, x.postal_code, x.city].filter(Boolean).join(", ")}</small>
            <p className={x.status === "claimed" ? "ok-p" : "muted-p"}>{x.status === "claimed" ? t.online : `${t.offline} · ${t.claim}`}</p></div>
          {x.status === "claimed" && <a className="btn btn-ghost" href={`${rel}/reserver/${x.slug}`}>{t.book}</a>}
        </li>))}</ul>
      {d.list.some((x) => x.source === "osm") && <p style={{ fontSize: 12 }}>{t.osm}</p>}
    </main>
  );
}
