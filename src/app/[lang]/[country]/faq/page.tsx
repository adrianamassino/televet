import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";
import { faqFor, faqLanguages } from "@/lib/faq";
import { breadcrumbLd, faqLd, ldJson, organizationLd, pageMetadata, SITE } from "@/lib/seo";

type P = { params: Promise<{ lang: string; country: string }> };
const TITLE: Record<string, string> = { fr: "FAQ téléconseil, téléconsultation et vétérinaire à domicile | Televet" };
const DESC: Record<string, string> = { fr: "Toutes les réponses sur le téléconseil vétérinaire, la téléconsultation, le vétérinaire à domicile, les tarifs, le paiement et les ordonnances." };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params;
  const { translated } = faqFor(lang);
  return pageMetadata({
    title: TITLE[lang] ?? TITLE.fr, description: DESC[lang] ?? DESC.fr, lang, country: country.toUpperCase(),
    path: (l, c) => `/${l}/${c.toLowerCase()}/faq`,
    index: translated, // untranslated fallbacks are not indexed (avoid duplicate content)
  });
}

export default async function FaqPage({ params }: P) {
  const { lang, country } = await params;
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const { items } = faqFor(lang);
  const url = `${SITE}/${lang}/${country}/faq`;
  const ld = [organizationLd(), faqLd(items), breadcrumbLd([{ name: "Televet", url: `${SITE}/${lang}/${country}/` }, { name: "FAQ", url }])];
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`/${lang}/${country}/`}>Televet</a> › FAQ</nav>
      <h1>Foire aux questions</h1>
      {items.map((x, i) => (
        <details className="qa" key={i} open={i === 0}>
          <summary>{x.q}</summary>
          <p>{x.a}</p>
        </details>
      ))}
    </main>
  );
}

export const generateStaticParams = () => faqLanguages().flatMap((l) => Object.values(COUNTRIES).filter((c) => c.languages.includes(l)).map((c) => ({ lang: l, country: c.code.toLowerCase() })));
