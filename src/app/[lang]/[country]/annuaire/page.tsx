import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { fetchAll } from "@/lib/fetch-all";
import { COUNTRIES } from "@/lib/countries";
import { VI } from "@/components/VI";
import { PhotoStrip } from "@/components/PhotoStrip";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SITE, slugify } from "@/lib/seo";
import { DIR } from "./copy";
import { FR_DEPARTMENTS, frDepartment } from "@/lib/fr-departments";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params; const t = DIR[lang] ?? DIR.en;
  return pageMetadata({ title: t.title, description: t.desc, lang, country: country.toUpperCase(), onlyCountry: country.toUpperCase(), path: (l, c) => `/${l}/${c.toLowerCase()}/annuaire` });
}

export default async function DirectoryIndex({ params }: P) {
  const { lang, country } = await params; const cc = country.toUpperCase(), t = DIR[lang] ?? DIR.en, base = `/${lang}/${country}`;
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  let rows: { city: string | null; status: string; postal_code: string | null }[] = [];
  try { rows = (await fetchAll<{ city: string | null; status: string; postal_code: string | null }>((f, t) => adminClient().from("directory_listings").select("city, status, postal_code").eq("country", cc).neq("status", "removed").order("id").range(f, t))).data; } catch { /* none yet */ }
  const m = new Map<string, { name: string; n: number; online: number }>();
  for (const r of rows) { if (!r.city) continue; const k = slugify(r.city); const c = m.get(k) ?? { name: r.city, n: 0, online: 0 }; c.n++; if (r.status === "claimed") c.online++; m.set(k, c); }
  const cities = [...m.entries()].sort((a, b) => b[1].online - a[1].online || b[1].n - a[1].n).slice(0, 48);
  // every city of the country stays one click away (crawlable links), grouped by department in France
  const byDep = new Map<string, Map<string, { name: string; n: number }>>();
  for (const r of rows) {
    if (!r.city) continue;
    const d = cc === "FR" ? frDepartment(r.postal_code) ?? "?" : r.city.charAt(0).toUpperCase();
    const g = byDep.get(d) ?? new Map(); const k = slugify(r.city); const c = g.get(k) ?? { name: r.city, n: 0 }; c.n++; g.set(k, c); byDep.set(d, g);
  }
  const deps = [...byDep.entries()].sort(([a], [b]) => a.localeCompare(b, "fr", { numeric: true }));
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([organizationLd(), breadcrumbLd([{ name: "Televet", url: `${SITE}${base}/` }, { name: t.back, url: `${SITE}${base}/annuaire` }])]) }} />
      <nav aria-label="breadcrumb"><a href={`${base}/`}>Televet</a> › {t.back}</nav>
      <h1>{t.h1}</h1><p className="lead-p">{t.lead}</p>
      <PhotoStrip set="a" />
      <h2><span className="h2i"><VI n="pin" size={26} /></span>{t.cities}</h2>
      {cities.length ? <ul className="city-grid">{cities.map(([slug, c]) => (
        <li key={slug}><a href={`${base}/annuaire/${slug}`}><span className="ico" aria-hidden><VI n="clinic" size={34} /></span><span><strong>{c.name}</strong><small>{t.clinics(c.n)}{c.online ? ` · ${c.online} ${t.online.toLowerCase()}` : ""}</small></span></a></li>))}</ul> : <p className="muted">{t.empty}</p>}
      {deps.length > 0 && <section className="dir-deps">
        <h2>{cc === "FR" ? (lang === "fr" ? "Toutes les villes, par département" : "Every town, by department") : t.cities}</h2>
        {deps.map(([d, g]) => {
          const list = [...g.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name, lang));
          const n = list.reduce((x, [, c]) => x + c.n, 0);
          return <details key={d}><summary><b>{cc === "FR" ? `${d} · ${FR_DEPARTMENTS[d] ?? d}` : d}</b><small>{t.clinics(n)}</small></summary>
            <ul>{list.map(([slug, c]) => <li key={slug}><a href={`${base}/annuaire/${slug}`}>{c.name}</a> <small>({c.n})</small></li>)}</ul></details>;
        })}
      </section>}
    </main>
  );
}
