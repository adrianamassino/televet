import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bird, Cat, CalendarCheck, ClipboardList, Dog, FileText, Fish, Hospital, House, Rabbit, Rat, Search, ShieldCheck, Stethoscope, Turtle, Video, BellRing, HeartPulse, Syringe, Pill, Microscope, Bone, PawPrint, Sparkles, Heart, Cross, Thermometer, Activity } from "lucide-react";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SITE } from "@/lib/seo";
import { CONSULT, HOME } from "./home-copy";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params; const t = HOME[lang] ?? HOME.en;
  return pageMetadata({ title: t.title, description: t.desc, lang, country: country.toUpperCase(), path: (l, c) => `/${l}/${c.toLowerCase()}` });
}

const ECG = () => <svg className="ecg-div" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden><defs><linearGradient id="eg" x1="0" x2="1"><stop offset="0" stopColor="#0a38d6" stopOpacity="0"/><stop offset=".5" stopColor="#1f9bff"/><stop offset="1" stopColor="#35e0ff" stopOpacity="0"/></linearGradient></defs><path d="M0 30H470l14-6 12 6h20l12-24 16 48 14-24h30l10-8 10 8H1200" fill="none" stroke="url(#eg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

export default async function OwnerHome({ params }: P) {
  const { lang, country } = await params; const cc = country.toUpperCase(), t = HOME[lang] ?? HOME.en;
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const base = `/${lang}/${country}`;
  let vets: { id: string; name: string; slug: string; kind: string; headline: string | null; address: string | null }[] = [];
  try { const { data } = await adminClient().from("practices").select("id, name, slug, kind, headline, address").eq("country", cc).eq("published", true).order("created_at", { ascending: false }).limit(6); vets = data ?? []; } catch { /* no data yet */ }
  const C = CONSULT[lang] ?? CONSULT.en, CP = { home: "vet-family", video: "girl-cat", clinic: "vet-dachshund" } as const;
  const AI = [Dog, Cat, Rabbit, Bird, Turtle, Rat], MI = [Stethoscope, Syringe, Pill, Microscope, HeartPulse, Bone], TI = [ShieldCheck, CalendarCheck, BellRing, FileText], SI = [Search, CalendarCheck, Stethoscope];
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
        <div className="collage" aria-hidden><img src="/photos/vet-pomeranian.jpg" alt="" /><img src="/photos/nurse-cat.jpg" alt="" /><span className="fb b1"><HeartPulse /></span><span className="fb b2"><PawPrint /></span><span className="fb b3"><Syringe /></span><span className="fb b4"><Bone /></span></div>
      </section>
      <ul className="trust">{t.trust.map((x, i) => { const Ic = TI[i]; return <li key={i}><span className="ico" aria-hidden><Ic /></span>{x}</li>; })}</ul>
      <section className="block"><h2><span className="h2i"><Stethoscope /></span>{t.vets}</h2>
        {vets.length ? <ul className="vet-list">{vets.map((v) => (
          <li key={v.id}><span className="ico" aria-hidden><Stethoscope /></span>
            <div><h3><a href={`${base}/veterinaire/${v.slug}`}>{v.name}</a></h3><small>{t.kind[v.kind] ?? t.kind.vet}{v.address ? ` · ${v.address}` : ""}</small>{v.headline && <p>{v.headline}</p>}</div>
            <a className="btn btn-ghost" href={`${base}/reserver/${v.slug}`}>{t.book}</a></li>))}</ul> : <p className="muted">{t.none}</p>}
        {vets.length > 0 && <p><a href={`${base}/recherche`}>{t.all}</a></p>}
      </section>
      <ECG /><section className="block"><h2><span className="h2i"><HeartPulse /></span>{C.title}</h2><ul className="consult">{C.items.map((c) => (
        <li key={c.k}><a href={`${base}/recherche?type=${c.k}`}><img src={`/photos/${CP[c.k]}.jpg`} alt="" loading="lazy" /><div><h3>{c.t}</h3><p>{c.d}</p></div></a></li>))}</ul></section>
      <section className="block"><h2><span className="h2i"><PawPrint /></span>{t.animals}</h2><ul className="animals">{t.animalsList.map((a, i) => { const Ic = AI[i]; return <li key={a}><span className="ico" aria-hidden><Ic /></span>{a}</li>; })}</ul></section>
      <section className="block how"><h2><span className="h2i"><Sparkles /></span>{t.how}</h2><ol className="steps">{t.steps.map((s, i) => { const Ic = SI[i]; return <li key={i}><span className="ico" aria-hidden><Ic /></span><h3>{s.t}</h3><p>{s.d}</p></li>; })}</ol></section>
      <div className="med-strip" aria-hidden>{MI.map((Ic, i) => <Ic key={i} />)}<PawPrint /><Fish /></div>
      <div className="band"><h2>{t.pro}</h2><a className="btn btn-sun" href={`${base}/pro`}><ClipboardList aria-hidden />{t.proBtn}</a></div>
    </main>
  );
}
