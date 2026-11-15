import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SERVICE_SLUGS, serviceFromSlug, SITE, veterinaryCareLd } from "@/lib/seo";

/**
 * Country-level page for a service: /fr/fr/veterinaire-en-ligne, /es/ar/veterinario-a-domicilio …
 * Online vets answer from anywhere in their country, so the online page needs no city: it lists every online vet of the country.
 * Home visits / clinics list the vets of the country (city pages live one level below: /{service}/{city}).
 * With no vet yet the page still answers (noindex) instead of a 404, because the chat assistant sends visitors here.
 */
type P = { params: Promise<{ lang: string; country: string; service: string }> };
type Svc = "home" | "video" | "clinic";
const TXT: Record<string, { h1: Record<Svc, string>; intro: Record<Svc, string>; empty: string; list: string; ask: string }> = {
  fr: { h1: { video: "Vétérinaire en ligne", home: "Vétérinaire à domicile", clinic: "Cliniques vétérinaires" }, intro: { video: "Parlez à un vétérinaire en visio, où que vous soyez en {c} : pas besoin de ville ni de déplacement.", home: "Un vétérinaire qui vient chez vous, moins de stress pour votre animal.", clinic: "Trouvez une clinique vétérinaire et prenez rendez-vous." }, empty: "Televet n'a pas encore de vétérinaire ici ({c}). Dites-nous que ça vous intéresse, on vous préviendra.", list: "Vétérinaires", ask: "Écrire à l'équipe" },
  it: { h1: { video: "Veterinario online", home: "Veterinario a domicilio", clinic: "Cliniche veterinarie" }, intro: { video: "Parla con un veterinario in video, ovunque tu sia in {c}: non serve scegliere una città né spostarsi.", home: "Un veterinario che viene a casa tua, meno stress per il tuo animale.", clinic: "Trova una clinica veterinaria e prenota una visita." }, empty: "Televet non ha ancora veterinari qui ({c}). Scrivici se ti interessa, ti avviseremo.", list: "Veterinari", ask: "Scrivi al team" },
  en: { h1: { video: "Online vet", home: "Home-visit vet", clinic: "Vet clinics" }, intro: { video: "Talk to a vet by video from anywhere in {c}: no city to choose, no travel.", home: "A vet who comes to you: less stress for your pet.", clinic: "Find a vet clinic and book a visit." }, empty: "Televet doesn't have vets here yet ({c}). Tell us you're interested and we'll let you know.", list: "Vets", ask: "Contact the team" },
  es: { h1: { video: "Veterinario online", home: "Veterinario a domicilio", clinic: "Clínicas veterinarias" }, intro: { video: "Habla con un veterinario por video desde cualquier lugar de {c}: sin elegir ciudad ni desplazarte.", home: "Un veterinario que va a tu casa, menos estrés para tu mascota.", clinic: "Encuentra una clínica veterinaria y reserva una cita." }, empty: "Televet todavía no tiene veterinarios aquí ({c}). Escríbenos si te interesa y te avisaremos.", list: "Veterinarios", ask: "Escribir al equipo" },
  pt: { h1: { video: "Veterinário online", home: "Veterinário ao domicílio", clinic: "Clínicas veterinárias" }, intro: { video: "Fale com um veterinário por vídeo, onde quer que esteja em {c}: sem escolher cidade nem se deslocar.", home: "Um veterinário que vai a sua casa, menos stress para o seu animal.", clinic: "Encontre uma clínica veterinária e marque uma consulta." }, empty: "A Televet ainda não tem veterinários aqui ({c}). Diga-nos se tem interesse e avisamos.", list: "Veterinários", ask: "Escrever à equipa" },
  de: { h1: { video: "Online-Tierarzt", home: "Tierarzt-Hausbesuch", clinic: "Tierarztpraxen" }, intro: { video: "Sprich per Video mit einem Tierarzt, von überall in {c}: keine Stadt wählen, kein Weg.", home: "Ein Tierarzt, der zu dir kommt – weniger Stress für dein Tier.", clinic: "Finde eine Tierarztpraxis und buche einen Termin." }, empty: "Televet hat hier ({c}) noch keine Tierärzte. Schreib uns, wenn du Interesse hast – wir melden uns.", list: "Tierärzte", ask: "Dem Team schreiben" },
  pl: { h1: { video: "Weterynarz online", home: "Weterynarz z dojazdem", clinic: "Kliniki weterynaryjne" }, intro: { video: "Porozmawiaj z weterynarzem przez wideo, skądkolwiek w {c}: bez wyboru miasta i dojazdu.", home: "Weterynarz, który przyjeżdża do Ciebie – mniej stresu dla zwierzaka.", clinic: "Znajdź klinikę weterynaryjną i umów wizytę." }, empty: "Televet nie ma tu jeszcze weterynarzy ({c}). Napisz, jeśli jesteś zainteresowany – damy znać.", list: "Weterynarze", ask: "Napisz do zespołu" },
  nl: { h1: { video: "Online dierenarts", home: "Dierenarts aan huis", clinic: "Dierenartspraktijken" }, intro: { video: "Praat via video met een dierenarts, waar je ook bent in {c}: geen stad kiezen, niet reizen.", home: "Een dierenarts die bij je thuis komt – minder stress voor je dier.", clinic: "Vind een dierenartspraktijk en maak een afspraak." }, empty: "Televet heeft hier ({c}) nog geen dierenartsen. Laat het ons weten als je interesse hebt, dan melden we ons.", list: "Dierenartsen", ask: "Schrijf het team" },
};

async function load(lang: string, country: string, service: string) {
  const cc = country.toUpperCase(), svc = serviceFromSlug(lang, service);
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang) || !svc) return null;
  const { data } = await adminClient().from("practices")
    .select("id, name, slug, headline, address, postal_code, languages, phone, services!inner(type, active)")
    .eq("country", cc).eq("published", true).eq("services.type", svc).eq("services.active", true).order("name").limit(60);
  return { cc, svc, list: data ?? [], countryName: new Intl.DisplayNames([lang], { type: "region" }).of(cc) ?? cc };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, service } = await params;
  const d = await load(lang, country, service);
  if (!d) return {};
  const t = TXT[lang] ?? TXT.en;
  return pageMetadata({
    title: `${t.h1[d.svc]} — ${d.countryName} | Televet`, description: t.intro[d.svc].replace("{c}", d.countryName),
    lang, country: d.cc, onlyCountry: d.cc, index: d.list.length > 0,
    path: (l, c) => `/${l}/${c.toLowerCase()}/${SERVICE_SLUGS[d.svc][l] ?? service}`,
  });
}

export default async function ServicePage({ params }: P) {
  const { lang, country, service } = await params;
  const d = await load(lang, country, service);
  if (!d) notFound();
  const t = TXT[lang] ?? TXT.en;
  const base = `${SITE}/${lang}/${country}`;
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: t.h1[d.svc], url: `${base}/${service}` }]),
    ...d.list.map((p) => veterinaryCareLd({ name: p.name, url: `${base}/veterinaire/${p.slug}`, description: p.headline ?? undefined, address: p.address ?? undefined, postalCode: p.postal_code ?? undefined, country: d.cc, phone: p.phone ?? undefined, languages: p.languages }))];
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui", lineHeight: 1.55 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <h1>{t.h1[d.svc]}</h1>
      <p>{t.intro[d.svc].replace("{c}", d.countryName)}</p>
      {d.list.length === 0
        ? <p>{t.empty.replace("{c}", d.countryName)} <a href="mailto:contact@televet.co">{t.ask}</a></p>
        : (<><h2>{t.list}</h2><ul>{d.list.map((p) => <li key={p.id}><h3><a href={`/${lang}/${country}/veterinaire/${p.slug}`}>{p.name}</a></h3><p>{p.headline}</p></li>)}</ul></>)}
    </main>
  );
}
