import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bird, Cat, CalendarCheck, ClipboardList, Dog, FileText, Hospital, House, Rabbit, Rat, Search, ShieldCheck, Stethoscope, Turtle, Video, BellRing } from "lucide-react";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SITE } from "@/lib/seo";
import { HOME } from "./home-copy";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params; const t = HOME[lang] ?? HOME.en;
  return pageMetadata({ title: t.title, description: t.desc, lang, country: country.toUpperCase(), path: (l, c) => `/${l}/${c.toLowerCase()}` });
}

export default async function OwnerHome({ params }: P) {
  const { lang, country } = await params; const cc = country.toUpperCase(), t = HOME[lang] ?? HOME.en;
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const base = `/${lang}/${country}`;
  let vets: { id: string; name: string; slug: string; kind: string; headline: string | null; address: string | null }[] = [];
  try { const { data } = await adminClient().from("practices").select("id, name, slug, kind, headline, address").eq("country", cc).eq("published", true).order("created_at", { ascending: false }).limit(6); vets = data ?? []; } catch { /* no data yet */ }
  const AI = [Dog, Cat, Rabbit, Bird, Turtle, Rat], TI = [ShieldCheck, CalendarCheck, BellRing, FileText], SI = [Search, CalendarCheck, Stethoscope];
  return (
    <main className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([organizationLd(), breadcrumbLd([{ name: "Televet", url: `${SITE}${base}/` }])]) }} />
      <section className="hero-panel">
        <div className="hero">
          <h1>{t.h1}</h1><p className="lead">{t.lead}</p>
          <form className="search-card" action={`${base}/recherche`} method="get">
            <div className="tabs" role="radiogroup">
              {(["home", "video", "clinic"] as const).map((k, i) => { const Ic = { home: House, video: Video, clinic: Hospital }[k]; return (
                <label key={k}><input type="radio" name="type" value={k} defaultChecked={i === 0} /><span><Ic aria-hidden />{t.tabs[k]}</span></label>); })}
            </div>
            <div className="row"><input name="q" type="search" placeholder={t.ph} aria-label={t.ph} autoComplete="address-level2" /><button className="btn" type="submit"><Search aria-hidden />{t.go}</button></div>
          </form>
        </div>
      </section>
      <ul className="trust">{t.trust.map((x, i) => { const Ic = TI[i]; return <li key={i}><Ic aria-hidden />{x}</li>; })}</ul>
      <section className="block"><h2>{t.vets}</h2>
        {vets.length ? <ul className="vet-list">{vets.map((v) => (
          <li key={v.id}><span className="ico" aria-hidden><Stethoscope /></span>
            <div><h3><a href={`${base}/veterinaire/${v.slug}`}>{v.name}</a></h3><small>{t.kind[v.kind] ?? t.kind.vet}{v.address ? ` · ${v.address}` : ""}</small>{v.headline && <p>{v.headline}</p>}</div>
            <a className="btn btn-ghost" href={`${base}/reserver/${v.slug}`}>{t.book}</a></li>))}</ul> : <p className="muted">{t.none}</p>}
        {vets.length > 0 && <p><a href={`${base}/recherche`}>{t.all}</a></p>}
      </section>
      <section className="block"><h2>{t.animals}</h2><ul className="animals">{t.animalsList.map((a, i) => { const Ic = AI[i]; return <li key={a}><Ic aria-hidden />{a}</li>; })}</ul></section>
      <section className="block"><h2>{t.how}</h2><ol className="steps">{t.steps.map((s, i) => { const Ic = SI[i]; return <li key={i}><span className="ico" aria-hidden><Ic /></span><h3>{s.t}</h3><p>{s.d}</p></li>; })}</ol></section>
      <div className="band"><h2>{t.pro}</h2><a className="btn btn-sun" href={`${base}/pro`}><ClipboardList aria-hidden />{t.proBtn}</a></div>
    </main>
  );
}
