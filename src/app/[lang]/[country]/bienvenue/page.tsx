import { pick } from "@/lib/pick";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PawPrint, Stethoscope } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { pageMetadata } from "@/lib/seo";
import { HOME } from "../home-copy";

type P = { params: Promise<{ lang: string; country: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params; const t = pick(HOME, lang, country);
  return pageMetadata({ title: `${t.wTitle} | Televet`, description: t.desc, lang, country: country.toUpperCase(), index: false, path: (l, c) => `/${l}/${c.toLowerCase()}/bienvenue` });
}
export default async function Welcome({ params }: P) {
  const { lang, country } = await params; const cc = country.toUpperCase(), t = pick(HOME, lang, country), base = `/${lang}/${country}`;
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  return (
    <main className="wrap narrow"><h1>{t.wTitle}</h1>
      <div className="choose">
        <a href={`${base}/`}><span className="ico" aria-hidden><PawPrint /></span><h2>{t.wOwner}</h2><p>{t.wOwnerD}</p></a>
        <a href={`${base}/pro`}><span className="ico" aria-hidden><Stethoscope /></span><h2>{t.wVet}</h2><p>{t.wVetD}</p></a>
      </div></main>
  );
}
