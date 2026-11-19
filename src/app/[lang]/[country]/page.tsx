import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bird, Cat, CalendarCheck, ClipboardList, Dog, FileText, Fish, Hospital, House, Rabbit, Rat, Search, ShieldCheck, Stethoscope, Turtle, Video, BellRing, HeartPulse, Syringe, Pill, Microscope, Bone, PawPrint, Sparkles, Heart, Cross, Thermometer, Activity } from "lucide-react";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SITE } from "@/lib/seo";
import { VI } from "@/components/VI";
import { PhotoStrip } from "@/components/PhotoStrip";
import { DIR } from "./annuaire/copy";
import { slugify } from "@/lib/seo";
import { CONSULT, FOCUS, HOME } from "./home-copy";
import { SERVICE_SLUGS } from "@/lib/seo";

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
  let cities: { slug: string; name: string; n: number }[] = [];
  try { const { data } = await adminClient().from("directory_listings").select("city").eq("country", cc).neq("status", "removed").limit(5000); const m = new Map<string, { name: string; n: number }>(); for (const r of data ?? []) { if (!r.city) continue; const k = slugify(r.city); const c = m.get(k) ?? { name: r.city, n: 0 }; c.n++; m.set(k, c); } cities = [...m.entries()].map(([slug, c]) => ({ slug, ...c })).sort((a, b) => b.n - a.n).slice(0, 12); } catch { /* none */ }
  const D = DIR[lang] ?? DIR.en, F = FOCUS[lang] ?? FOCUS.en;
  const C = CONSULT[lang] ?? CONSULT.en, CP = { home: "vet-family", video: "girl-cat", clinic: "vet-dachshund" } as const;
  const AI = ["dog", "cat", "rabbit", "bird", "turtle", "hamster"], MI = ["stethoscope", "syringe", "bottle", "pill", "thermometer", "bandage", "bone", "pawHeart"], TI = ["shield", "calendar", "chat", "clipboard"], SI = ["magnifier", "calendar", "vet"];
  return (
    <main className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([organizationLd(), breadcrumbLd([{ name: "Televet", url: `${SITE}${base}/` }]), ...(["home", "video"] as const).map((k) => ({ "@context": "https://schema.org", "@type": "Service", name: (FOCUS[lang] ?? FOCUS.en)[k].h, description: (FOCUS[lang] ?? FOCUS.en)[k].p, serviceType: k === "home" ? "Veterinary home visit" : "Veterinary telemedicine", provider: { "@type": "Organization", name: "Televet", url: SITE }, areaServed: { "@type": "Country", name: COUNTRIES[cc].code }, url: `${SITE}${base}/${SERVICE_SLUGS[k][lang] ?? SERVICE_SLUGS[k].en}` }))]) }} />
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
        <div className="sparkles" aria-hidden>{["s1","s2","s3","s4","s5","s6","s7","s8"].map((k) => <i key={k} className={`spk ${k}`} />)}</div>
        <div className="collage" aria-hidden><span className="shp shp-a"><img src="/photos/vet-pomeranian.jpg" alt="" /></span><span className="shp shp-b"><img src="/photos/nurse-cat.jpg" alt="" /></span><span className="fb b1"><VI n="heartPulse" size={34} /></span><span className="fb b2"><VI n="paw" size={32} /></span><span className="fb b3"><VI n="syringe" size={30} /></span><span className="fb b4"><VI n="bone" size={28} /></span></div>
      </section>
      <ul className="trust">{t.trust.map((x, i) => { return <li key={i}><span className="ico" aria-hidden><VI n={TI[i]} size={34} /></span>{x}</li>; })}</ul>
      <section className="focus" aria-labelledby="focus-h"><h2 id="focus-h" className="sr-only">{F.title}</h2><div className="focus-grid">
        {(["home", "video"] as const).map((k) => (
          <article key={k} className={`focus-card f-${k}`}>
            <span className="shp"><img src={`/photos/${k === "home" ? "vet-family" : "girl-cat"}.jpg`} alt="" loading="lazy" /></span>
            <div><span className="f-ico"><VI n={k === "home" ? "housePaw" : "monitor"} size={40} tone="white" /></span>
              <h3>{F[k].h}</h3><p>{F[k].p}</p>
              <ul>{F[k].pts.map((x) => <li key={x}><VI n="check" size={20} tone="white" />{x}</li>)}</ul>
              <a className="btn btn-lg" href={`${base}/${SERVICE_SLUGS[k][lang] ?? SERVICE_SLUGS[k].en}`}>{F[k].cta}</a></div>
          </article>))}</div>
        <p className="focus-clinic"><a href={`${base}/${SERVICE_SLUGS.clinic[lang] ?? SERVICE_SLUGS.clinic.en}`}>{F.clinic}</a></p></section>
      <section className="block"><h2><span className="h2i"><Stethoscope /></span>{t.vets}</h2>
        {vets.length ? <ul className="vet-list">{vets.map((v) => (
          <li key={v.id}><span className="ico" aria-hidden><VI n="vet" size={34} /></span>
            <div><h3><a href={`${base}/veterinaire/${v.slug}`}>{v.name}</a></h3><small>{t.kind[v.kind] ?? t.kind.vet}{v.address ? ` · ${v.address}` : ""}</small>{v.headline && <p>{v.headline}</p>}</div>
            <a className="btn btn-ghost" href={`${base}/reserver/${v.slug}`}>{t.book}</a></li>))}</ul> : <p className="muted">{t.none}</p>}
        {vets.length > 0 && <p><a href={`${base}/recherche`}>{t.all}</a></p>}
      </section>
      <section className="block"><h2><span className="h2i"><HeartPulse /></span>{C.title}</h2><ul className="consult">{C.items.map((c) => (
        <li key={c.k}><a href={`${base}/recherche?type=${c.k}`}><span className="photo"><img src={`/photos/${CP[c.k]}.jpg`} alt="" loading="lazy" /><span className="tag"><VI n={{ home: "housePaw", video: "monitor", clinic: "clinic" }[c.k]} size={36} /></span></span><div><h3>{c.t}</h3><p>{c.d}</p></div></a></li>))}</ul></section>
      <section className="block"><h2><span className="h2i"><PawPrint /></span>{t.animals}</h2><ul className="animals">{t.animalsList.map((a, i) => { return <li key={a}><span className="ico" aria-hidden><VI n={AI[i]} size={46} /></span>{a}</li>; })}</ul><PhotoStrip set="a" /></section>
      <section className="block"><h2><span className="h2i"><VI n="pin" size={26} /></span>{D.h1}</h2><p className="lead-p">{D.lead}</p>{cities.length > 0 && <ul className="city-chips">{cities.map((c) => <li key={c.slug}><a href={`${base}/annuaire/${c.slug}`}>{c.name} <small>{c.n}</small></a></li>)}</ul>}<p><a className="btn btn-ghost" href={`${base}/annuaire`}>{D.all}</a></p></section>
      <section className="block how"><h2><span className="h2i"><Sparkles /></span>{t.how}</h2><ol className="steps">{t.steps.map((s, i) => { return <li key={i}><span className="ico" aria-hidden><VI n={SI[i]} size={34} /></span><h3>{s.t}</h3><p>{s.d}</p></li>; })}</ol></section>
      <div className="med-strip" aria-hidden>{MI.map((n) => <span key={n}><VI n={n} size={34} /></span>)}</div>
      <div className="band"><h2>{t.pro}</h2><a className="btn btn-sun" href={`${base}/pro`}><ClipboardList aria-hidden />{t.proBtn}</a></div>
    </main>
  );
}
