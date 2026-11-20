import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";
import { pick } from "@/lib/pick";
import { CONTACT } from "@/lib/site-copy";
import { breadcrumbLd, ldJson, pageMetadata, SITE } from "@/lib/seo";
import { ContactForm } from "./ContactForm";
import "../home-brand.css";

type P = { params: Promise<{ lang: string; country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params;
  const c = pick(CONTACT, lang, country);
  return pageMetadata({ title: `${c.title} | Televet`, description: c.lead, lang, country: country.toUpperCase(), path: (l, k) => `/${l}/${k.toLowerCase()}/contact` });
}

export default async function ContactPage({ params }: P) {
  const { lang, country } = await params;
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const c = pick(CONTACT, lang, country), base = `/${lang}/${country}`;
  const ld = [breadcrumbLd([{ name: "Televet", url: `${SITE}${base}/` }, { name: c.title, url: `${SITE}${base}/contact` }])];
  return (
    <main className="tv tv-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <div className="tv-page-hero"><div className="tv-wrap"><h1>{c.title}</h1><p>{c.lead}</p></div></div>
      <div className="tv-wrap tv-page-body tv-contact">
        <ContactForm c={c} lang={lang} />
        <aside className="tv-alert" role="note"><strong>!</strong><p>{c.urgent}</p></aside>
      </div>
    </main>
  );
}

export const generateStaticParams = () => Object.values(COUNTRIES).flatMap((c) => c.languages.map((l) => ({ lang: l, country: c.code.toLowerCase() })));
