import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProSignup from "@/components/ProSignup";
import { COUNTRIES } from "@/lib/countries";

export const metadata: Metadata = { robots: { index: false, follow: false } };
type P = { params: Promise<{ lang: string; country: string }> };

export default async function Page({ params }: P) {
  const { lang, country } = await params;
  const c = COUNTRIES[country.toUpperCase()];
  if (!c || !c.languages.includes(lang)) notFound();
  return (
    <main className="wrap narrow">
      <ProSignup lang={lang} country={c.code} currency={c.currency} languages={c.languages} timezone={c.timezone} provider={c.provider} />
    </main>
  );
}
