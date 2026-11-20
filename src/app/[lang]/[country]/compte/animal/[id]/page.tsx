import PetHealth from "@/components/PetHealth";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Carnet de santé · Televet", robots: { index: false } }; }

export default async function Page({ params }: { params: Promise<{ lang: string; country: string; id: string }> }) {
  const { lang, country, id } = await params;
  return <main className="narrow"><PetHealth lang={lang} country={country} petId={id} /></main>;
}
