import OwnerAccount from "@/components/OwnerAccount";

export const dynamic = "force-dynamic";
const TITLE: Record<string, string> = { fr: "Mon compte", it: "Il mio account", en: "My account", es: "Mi cuenta" };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: `${TITLE[lang] ?? TITLE.en} · Televet`, robots: { index: false } };
}

export default async function Page({ params }: { params: Promise<{ lang: string; country: string }> }) {
  const { lang } = await params;
  return <main className="narrow"><h1>{TITLE[lang] ?? TITLE.en}</h1><OwnerAccount lang={lang} /></main>;
}
