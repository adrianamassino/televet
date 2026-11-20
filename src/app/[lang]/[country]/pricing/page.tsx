import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { pick } from "@/lib/pick";
import { PRICING } from "@/lib/site-copy";
import { breadcrumbLd, ldJson, pageMetadata, SITE } from "@/lib/seo";
import "../home-brand.css";

type P = { params: Promise<{ lang: string; country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params;
  const c = pick(PRICING, lang, country);
  return pageMetadata({ title: `${c.title} | Televet`, description: c.lead, lang, country: country.toUpperCase(), path: (l, k) => `/${l}/${k.toLowerCase()}/pricing` });
}

export default async function PricingPage({ params }: P) {
  const { lang, country } = await params;
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const c = pick(PRICING, lang, country), base = `/${lang}/${country}`;
  const ld = [breadcrumbLd([{ name: "Televet", url: `${SITE}${base}/` }, { name: c.title, url: `${SITE}${base}/pricing` }])];
  return (
    <main className="tv tv-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <div className="tv-page-hero"><div className="tv-wrap"><h1>{c.title}</h1><p>{c.lead}</p></div></div>
      <div className="tv-wrap tv-page-body">
        <h2 className="tv-h2">{c.ownersH}</h2>
        <div className="tv-price-grid">
          {c.cards.map((x: any) => (
            <article className="tv-card tv-price" key={x.n}>
              <h3>{x.n}</h3><p className="tv-price-p">{x.p}</p><p>{x.d}</p>
              <ul>{x.pts.map((t: string) => <li key={t}><Check aria-hidden size={16} />{t}</li>)}</ul>
            </article>
          ))}
        </div>
        <p className="tv-note">{c.note}</p>
        <div className="tv-actions"><a className="tv-btn tv-btn-primary" href={`${base}/recherche`}>{c.book}</a></div>
        <h2 className="tv-h2">{c.vetsH}</h2>
        <ul className="tv-checks">{c.vets.map((t: string) => <li key={t}><Check aria-hidden size={18} />{t}</li>)}</ul>
        <div className="tv-actions"><a className="tv-btn tv-btn-ghost" href={`${base}/pro`}>{c.vetsCta}</a></div>
      </div>
    </main>
  );
}

export const generateStaticParams = () => Object.values(COUNTRIES).flatMap((c) => c.languages.map((l) => ({ lang: l, country: c.code.toLowerCase() })));
