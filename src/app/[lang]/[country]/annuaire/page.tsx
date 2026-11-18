import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { VI } from "@/components/VI";
import { PhotoStrip } from "@/components/PhotoStrip";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SITE, slugify } from "@/lib/seo";
import { DIR } from "./copy";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params; const t = DIR[lang] ?? DIR.en;
  return pageMetadata({ title: t.title, description: t.desc, lang, country: country.toUpperCase(), onlyCountry: country.toUpperCase(), path: (l, c) => `/${l}/${c.toLowerCase()}/annuaire` });
}

export default async function DirectoryIndex({ params }: P) {
  const { lang, country } = await params; const cc = country.toUpperCase(), t = DIR[lang] ?? DIR.en, base = `/${lang}/${country}`;
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  let rows: { city: string | null; status: string }[] = [];
  try { const { data } = await adminClient().from("directory_listings").select("city, status").eq("country", cc).neq("status", "removed").limit(5000); rows = data ?? []; } catch { /* none yet */ }
  const m = new Map<string, { name: string; n: number; online: number }>();
  for (const r of rows) { if (!r.city) continue; const k = slugify(r.city); const c = m.get(k) ?? { name: r.city, n: 0, online: 0 }; c.n++; if (r.status === "claimed") c.online++; m.set(k, c); }
  const cities = [...m.entries()].sort((a, b) => b[1].online - a[1].online || b[1].n - a[1].n).slice(0, 120);
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([organizationLd(), breadcrumbLd([{ name: "Televet", url: `${SITE}${base}/` }, { name: t.back, url: `${SITE}${base}/annuaire` }])]) }} />
      <nav aria-label="breadcrumb"><a href={`${base}/`}>Televet</a> › {t.back}</nav>
      <h1>{t.h1}</h1><p className="lead-p">{t.lead}</p>
      <PhotoStrip set="a" />
      <h2><span className="h2i"><VI n="pin" size={26} /></span>{t.cities}</h2>
      {cities.length ? <ul className="city-grid">{cities.map(([slug, c]) => (
        <li key={slug}><a href={`${base}/annuaire/${slug}`}><span className="ico" aria-hidden><VI n="clinic" size={34} /></span><span><strong>{c.name}</strong><small>{t.clinics(c.n)}{c.online ? ` · ${c.online} ${t.online.toLowerCase()}` : ""}</small></span></a></li>))}</ul> : <p className="muted">{t.empty}</p>}
    </main>
  );
}
