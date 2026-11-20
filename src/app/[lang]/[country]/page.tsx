import { pick } from "@/lib/pick";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Activity, ArrowRight, Brain, Check, Clock, Leaf, MapPin, MessageCircle, Mic, PhoneOff, Salad, Siren, Bird, Cat, CalendarCheck, ClipboardList, Dog, FileText, Fish, Hospital, House, Rabbit, Rat, Search, ShieldCheck, Stethoscope, Turtle, Video, BellRing, HeartPulse, Syringe, Pill, Microscope, Bone, PawPrint, Sparkles, Heart, Cross, Thermometer } from "lucide-react";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, faqLd, ldJson, organizationLd, pageMetadata, SITE } from "@/lib/seo";
import { VI } from "@/components/VI";
import { PhotoStrip } from "@/components/PhotoStrip";
import { DIR } from "./annuaire/copy";
import { slugify } from "@/lib/seo";
import { CONSULT, FOCUS, HOME } from "./home-copy";
import { ABOUT } from "./about-copy";
import { TV } from "./tv-copy";
import "./home-brand.css";
import { SERVICE_SLUGS } from "@/lib/seo";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params; const t = pick(HOME, lang, country);
  return pageMetadata({ title: t.title, description: t.desc, lang, country: country.toUpperCase(), path: (l, c) => `/${l}/${c.toLowerCase()}` });
}

export default async function OwnerHome({ params }: P) {
  const { lang, country } = await params; const cc = country.toUpperCase(), t = pick(HOME, lang, country);
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const base = `/${lang}/${country}`;
  let vets: { id: string; name: string; slug: string; kind: string; headline: string | null; address: string | null }[] = [];
  try { const { data } = await adminClient().from("practices").select("id, name, slug, kind, headline, address").eq("country", cc).eq("published", true).order("created_at", { ascending: false }).limit(6); vets = data ?? []; } catch { /* no data yet */ }
  let cities: { slug: string; name: string; n: number }[] = [];
  try { const { data } = await adminClient().from("directory_listings").select("city").eq("country", cc).neq("status", "removed").limit(5000); const m = new Map<string, { name: string; n: number }>(); for (const r of data ?? []) { if (!r.city) continue; const k = slugify(r.city); const c = m.get(k) ?? { name: r.city, n: 0 }; c.n++; m.set(k, c); } cities = [...m.entries()].map(([slug, c]) => ({ slug, ...c })).sort((a, b) => b.n - a.n).slice(0, 12); } catch { /* none */ }
  const D = DIR[lang] ?? DIR.en, F = pick(FOCUS, lang, country);
  const A = pick(ABOUT, lang, country), TVc = pick(TV, lang, country);
  const C = pick(CONSULT, lang, country), CP = { home: "vet-family", video: "vet-white-cat", clinic: "vet-dachshund" } as const;
  const AI = ["dog", "cat", "rabbit", "bird", "turtle", "hamster"], MI = ["stethoscope", "syringe", "bottle", "pill", "thermometer", "bandage", "bone", "pawHeart"], TI = ["shield", "calendar", "chat", "clipboard"], SI = ["magnifier", "calendar", "vet"];
  return (
    <main className="tv">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([organizationLd(), breadcrumbLd([{ name: "Televet", url: `${SITE}${base}/` }]), faqLd(A.faq), ...(["home", "video"] as const).map((k) => ({ "@context": "https://schema.org", "@type": "Service", name: (pick(FOCUS, lang, country))[k].h, description: (FOCUS[lang] ?? FOCUS.en)[k].p, serviceType: k === "home" ? "Veterinary home visit" : "Veterinary telemedicine", provider: { "@type": "Organization", name: "Televet", url: SITE }, areaServed: { "@type": "Country", name: COUNTRIES[cc].code }, url: `${SITE}${base}/${SERVICE_SLUGS[k][lang] ?? SERVICE_SLUGS[k].en}` }))]) }} />
      <section className="tv-hero" aria-labelledby="tv-h1">
        <div className="tv-bg" aria-hidden><span className="tv-orb o1" /><span className="tv-orb o2" /><svg className="tv-ecg" viewBox="0 0 900 120" preserveAspectRatio="none"><path d="M0 60h250l22-36 26 78 24-60 16 18h120l20-34 24 70 20-52 14 14H900" /></svg>{[1, 2, 3, 4, 5, 6].map((n) => <i key={n} className={`tv-dot d${n}`} />)}</div>
        <div className="tv-wrap tv-hero-grid">
          <div className="tv-hero-text">
            <h1 id="tv-h1">{t.h1}</h1>
            <p className="tv-lead">{t.lead}</p>
            <div className="tv-cta"><a className="tv-btn tv-btn-light" href={`${base}/recherche`}>{t.book}<ArrowRight aria-hidden /></a><a className="tv-btn tv-btn-ghost" href="#services">{TVc.discover}</a></div>
          </div>
          <div className="tv-cluster" aria-hidden>
            <figure className="tv-ph p1"><img src="/photos/vet-exam.jpg" alt="" width={733} height={1100} /></figure>
            <figure className="tv-ph p2"><img src="/photos/vet-cat.jpg" alt="" width={1100} height={733} /></figure>
            <figure className="tv-ph p3"><img src="/photos/vet-chihuahua.jpg" alt="" width={733} height={1100} /></figure>
          </div>
        </div>
        <div className="tv-wrap"><ul className="tv-strip">{t.trust.map((x, i) => { const Ic = [ShieldCheck, CalendarCheck, BellRing, FileText][i] ?? ShieldCheck; return <li key={x}><Ic aria-hidden /><span>{x}</span></li>; })}</ul></div>
      </section>

      <div className="tv-wrap">
      <section className="tv-search" aria-label={t.go}>
        <form action={`${base}/recherche`} method="get">
          <div className="tv-tabs" role="radiogroup">{(["home", "video", "clinic"] as const).map((k, i) => { const Ic = { home: House, video: Video, clinic: Hospital }[k]; return <label key={k}><input type="radio" name="type" value={k} defaultChecked={i === 0} /><span><Ic aria-hidden />{t.tabs[k]}</span></label>; })}</div>
          <div className="tv-search-row"><input name="q" type="search" placeholder={t.ph} aria-label={t.ph} autoComplete="address-level2" /><button className="tv-btn tv-btn-primary" type="submit"><Search aria-hidden />{t.go}</button></div>
        </form>
      </section>

      <section id="services" className="tv-sec" aria-labelledby="svc-h">
        <header className="tv-head"><h2 id="svc-h">{F.title}</h2><p>{A.specLead}</p></header>
        <div className="tv-focus">{(["home", "video"] as const).map((k) => (
          <article key={k} className={`tv-card tv-focus-card ${k}`}>
            <figure className="tv-round"><img src={`/photos/${k === "home" ? "vet-family" : "vet-white-cat"}.jpg`} alt="" width={1100} height={734} loading="lazy" /></figure>
            <div><h3>{F[k].h}</h3><p>{F[k].p}</p><ul>{F[k].pts.map((x) => <li key={x}><Check aria-hidden />{x}</li>)}</ul>
              <a className="tv-link" href={`${base}/${SERVICE_SLUGS[k][lang] ?? SERVICE_SLUGS[k].en}`}>{F[k].cta}<ArrowRight aria-hidden /></a></div>
          </article>))}</div>
        <ul className="tv-spec">{A.spec.map((x, i) => { const Ic = [Siren, Salad, Brain, Leaf, Rabbit, Activity][i] ?? Stethoscope; return <li key={x.t} className="tv-card"><span className="tv-ico"><Ic aria-hidden /></span><h3>{x.t}</h3><p>{x.d}</p></li>; })}</ul>
        <p className="tv-more"><a className="tv-link" href={`${base}/${SERVICE_SLUGS.clinic[lang] ?? SERVICE_SLUGS.clinic.en}`}>{F.clinic}<ArrowRight aria-hidden /></a></p>
      </section>
      </div>

      <section id="how" className="tv-how" aria-labelledby="how-h"><div className="tv-wrap">
        <header className="tv-head light"><h2 id="how-h">{t.how}</h2></header>
        <ol className="tv-steps">{t.steps.map((s, i) => { const Ic = [Search, CalendarCheck, Video][i] ?? Search; return <li key={s.t}><span className="tv-num">{i + 1}</span><Ic className="tv-step-ic" aria-hidden /><h3>{s.t}</h3><p>{s.d}</p></li>; })}</ol>
      </div></section>

      <div className="tv-wrap">
      <section className="tv-sec tv-pets" aria-labelledby="pets-h">
        <header className="tv-head"><h2 id="pets-h">{TVc.gallery}</h2><p>{t.animals}</p></header>
        <div className="tv-gallery" aria-hidden>
          {["vet-dachshund", "vet-cat", "vet-chihuahua", "vet-white-cat", "girl-cat"].map((n, i) => <figure key={n} className={`g${i + 1}`}><img src={`/photos/${n}.jpg`} alt="" loading="lazy" width={n === "vet-cat" || n === "vet-white-cat" ? 1100 : 733} height={n === "vet-cat" || n === "vet-white-cat" ? 733 : 1100} /></figure>)}
        </div>
        <ul className="tv-chips">{t.animalsList.map((a, i) => { const Ic = [Dog, Cat, Rabbit, Bird, Turtle, Rat][i] ?? Dog; return <li key={a}><Ic aria-hidden />{a}</li>; })}</ul>
      </section>

      <section className="tv-sec" aria-labelledby="vets-h">
        <header className="tv-head"><h2 id="vets-h">{t.vets}</h2></header>
        {vets.length ? <ul className="tv-vets">{vets.map((v) => (
          <li key={v.id} className="tv-card"><span className="tv-avatar" aria-hidden><Stethoscope /></span>
            <div><h3><a href={`${base}/veterinaire/${v.slug}`}>{v.name}</a></h3><small>{t.kind[v.kind] ?? t.kind.vet}{v.address ? ` · ${v.address}` : ""}</small>{v.headline && <p>{v.headline}</p>}</div>
            <a className="tv-btn tv-btn-outline" href={`${base}/reserver/${v.slug}`}>{t.book}</a></li>))}</ul> : <p className="tv-muted">{t.none}</p>}
        {vets.length > 0 && <p className="tv-more"><a className="tv-link" href={`${base}/recherche`}>{t.all}<ArrowRight aria-hidden /></a></p>}
      </section>

      <section className="tv-sec tv-why" aria-labelledby="why-h">
        <div className="tv-why-text">
          <h2 id="why-h">{A.missionH}</h2>
          {A.mission.map((x) => <p key={x}>{x}</p>)}
          <ul>{A.missionPts.map((x) => <li key={x}><Check aria-hidden />{x}</li>)}</ul>
        </div>
        <div className="tv-device" aria-hidden>
          <div className="tv-call"><div className="tv-call-bar"><i /><i /><i /><span>{TVc.call}</span></div>
            <div className="tv-call-body"><div className="tv-call-main"><span className="tv-call-avatar"><Stethoscope /></span><em>Dr.</em></div><div className="tv-call-self"><Cat /></div></div>
            <div className="tv-call-ctl"><span><Mic /></span><span><Video /></span><span className="end"><PhoneOff /></span><span><MessageCircle /></span></div></div>
          <div className="tv-book"><div className="tv-book-h"><CalendarCheck /><b>{t.book}</b></div><div className="tv-slots"><span>09:30</span><span className="on">10:15</span><span>11:00</span><span>16:45</span></div><div className="tv-book-note"><Clock />{F.video.pts[2]}</div></div>
        </div>
      </section>

      <section className="tv-sec tv-about" aria-labelledby="about-h">
        <header className="tv-head"><h2 id="about-h">{A.aboutH}</h2></header>
        <div className="tv-cols">{A.about.map((x) => <p key={x}>{x}</p>)}</div>
      </section>

      <section className="tv-sec tv-faq" aria-labelledby="faq-h">
        <header className="tv-head"><h2 id="faq-h">{A.faqH}</h2></header>
        {A.faq.map((x) => <details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}
      </section>

      <section className="tv-sec tv-dir" aria-labelledby="dir-h">
        <header className="tv-head"><h2 id="dir-h">{D.h1}</h2><p>{D.lead}</p></header>
        {cities.length > 0 && <ul className="tv-chips link">{cities.map((c) => <li key={c.slug}><a href={`${base}/annuaire/${c.slug}`}><MapPin aria-hidden />{c.name}</a></li>)}</ul>}
        <p className="tv-more"><a className="tv-link" href={`${base}/annuaire`}>{D.all ?? D.h1}<ArrowRight aria-hidden /></a></p>
      </section>
      </div>

      <section className="tv-final" aria-labelledby="fin-h"><div className="tv-bg" aria-hidden><span className="tv-orb o1" /><svg className="tv-ecg" viewBox="0 0 900 120" preserveAspectRatio="none"><path d="M0 60h250l22-36 26 78 24-60 16 18h120l20-34 24 70 20-52 14 14H900" /></svg></div>
        <div className="tv-wrap"><h2 id="fin-h">{TVc.finalH}</h2><p>{TVc.finalP}</p><div className="tv-cta"><a className="tv-btn tv-btn-light" href={`${base}/recherche`}>{t.book}<ArrowRight aria-hidden /></a><a className="tv-btn tv-btn-ghost" href={`mailto:contact@televet.co`}>{A.contactBtn}</a></div>
          <p className="tv-pro"><a href={`${base}/pro`}>{t.pro} {t.proBtn}</a></p></div></section>
    </main>
  );
}
