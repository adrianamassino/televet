import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";
import { pick } from "@/lib/pick";
import { LEGAL, LEGAL_DOCS, LEGAL_LABEL, type LegalDoc } from "@/lib/site-copy";
import { pageMetadata } from "@/lib/seo";
import "../../home-brand.css";

type P = { params: Promise<{ lang: string; country: string; doc: string }> };
const isDoc = (d: string): d is LegalDoc => (LEGAL_DOCS as readonly string[]).includes(d);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, doc } = await params;
  if (!isDoc(doc)) return {};
  const title = pick(LEGAL_LABEL, lang, country)[doc];
  return pageMetadata({ title: `${title} | Televet`, description: title, lang, country: country.toUpperCase(), path: (l, k) => `/${l}/${k.toLowerCase()}/legal/${doc}`, index: false });
}

export default async function LegalPage({ params }: P) {
  const { lang, country, doc } = await params;
  const cc = country.toUpperCase();
  if (!isDoc(doc) || !COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const L = LEGAL[lang] ?? LEGAL.en, labels = pick(LEGAL_LABEL, lang, country), base = `/${lang}/${country}`;
  return (
    <main className="tv tv-page">
      <div className="tv-page-hero"><div className="tv-wrap"><h1>{labels[doc]}</h1><p>{L.draft}</p></div></div>
      <div className="tv-wrap tv-page-body tv-legal">
        <nav className="tv-tabs" aria-label="Legal">{LEGAL_DOCS.map((d) => <a key={d} href={`${base}/legal/${d}`} aria-current={d === doc ? "page" : undefined}>{labels[d]}</a>)}</nav>
        {(L[doc] as string[][]).map(([h, p]) => <section key={h}><h2>{h}</h2><p>{p}</p></section>)}
      </div>
    </main>
  );
}

export const generateStaticParams = () => Object.values(COUNTRIES).flatMap((c) => c.languages.flatMap((l) => LEGAL_DOCS.map((doc) => ({ lang: l, country: c.code.toLowerCase(), doc }))));
