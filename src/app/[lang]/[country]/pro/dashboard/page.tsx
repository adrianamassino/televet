import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VetDashboard from "@/components/VetDashboard";
import { COUNTRIES } from "@/lib/countries";

export const metadata: Metadata = { robots: { index: false, follow: false } };
type P = { params: Promise<{ lang: string; country: string }> };

export default async function Page({ params }: P) {
  const { lang, country } = await params;
  const c = COUNTRIES[country.toUpperCase()];
  if (!c || !c.languages.includes(lang)) notFound();
  return (
    <main>
      <VetDashboard lang={lang} country={c.code} currency={c.currency} languages={c.languages} provider={c.provider} />
    </main>
  );
}
