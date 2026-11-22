import { pick } from "@/lib/pick";
import { brazilian } from "@/lib/brazilian";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, faqLd, ldJson, organizationLd, pageMetadata, SERVICE_SLUGS, serviceFromSlug, SITE, slugify, veterinaryCareLd } from "@/lib/seo";
import { GUIDE_FR } from "./guide-fr";
import SpeciesPage, { speciesMetadata, speciesPageFor } from "./species-page";

/**
 * Country-level page for a service: /fr/fr/veterinaire-en-ligne, /es/ar/veterinario-a-domicilio …
 * Online vets answer from anywhere in their country, so the online page needs no city: it lists every online vet of the country.
 * Home visits / clinics list the vets of the country (city pages live one level below: /{service}/{city}).
 * With no vet yet the page still answers (noindex) instead of a 404, because the chat assistant sends visitors here.
 */
type P = { params: Promise<{ lang: string; country: string; service: string }> };
type Svc = "home" | "video" | "clinic";
const TXT: Record<string, { h1: Record<Svc, string>; intro: Record<Svc, string>; empty: string; list: string; ask: string }> = {
  fr: { h1: { video: "Téléconsultation vétérinaire en ligne", home: "Vétérinaire à domicile", clinic: "Cliniques vétérinaires" }, intro: { video: "Parlez à un vétérinaire en visio, où que vous soyez en {c} : pas besoin de ville ni de déplacement.", home: "Un vétérinaire qui vient chez vous, moins de stress pour votre animal.", clinic: "Trouvez une clinique vétérinaire et prenez rendez-vous." }, empty: "Televet n'a pas encore de vétérinaire ici ({c}). Dites-nous que ça vous intéresse, on vous préviendra.", list: "Vétérinaires", ask: "Écrire à l'équipe" },
  it: { h1: { video: "Televisita veterinaria online", home: "Veterinario a domicilio", clinic: "Cliniche veterinarie" }, intro: { video: "Parla con un veterinario in video, ovunque tu sia in {c}: non serve scegliere una città né spostarsi.", home: "Un veterinario che viene a casa tua, meno stress per il tuo animale.", clinic: "Trova una clinica veterinaria e prenota una visita." }, empty: "Televet non ha ancora veterinari qui ({c}). Scrivici se ti interessa, ti avviseremo.", list: "Veterinari", ask: "Scrivi al team" },
  en: { h1: { video: "Online vet consultation (telemedicine)", home: "Home-visit vet", clinic: "Vet clinics" }, intro: { video: "Talk to a vet by video from anywhere in {c}: no city to choose, no travel.", home: "A vet who comes to you: less stress for your pet.", clinic: "Find a vet clinic and book a visit." }, empty: "Televet doesn't have vets here yet ({c}). Tell us you're interested and we'll let you know.", list: "Vets", ask: "Contact the team" },
  es: { h1: { video: "Teleconsulta veterinaria online", home: "Veterinario a domicilio", clinic: "Clínicas veterinarias" }, intro: { video: "Habla con un veterinario por video desde cualquier lugar de {c}: sin elegir ciudad ni desplazarte.", home: "Un veterinario que va a tu casa, menos estrés para tu mascota.", clinic: "Encuentra una clínica veterinaria y reserva una cita." }, empty: "Televet todavía no tiene veterinarios aquí ({c}). Escríbenos si te interesa y te avisaremos.", list: "Veterinarios", ask: "Escribir al equipo" },
  pt: { h1: { video: "Veterinário online", home: "Veterinário ao domicílio", clinic: "Clínicas veterinárias" }, intro: { video: "Fale com um veterinário por vídeo, onde quer que esteja em {c}: sem escolher cidade nem se deslocar.", home: "Um veterinário que vai a sua casa, menos stress para o seu animal.", clinic: "Encontre uma clínica veterinária e marque uma consulta." }, empty: "A Televet ainda não tem veterinários aqui ({c}). Diga-nos se tem interesse e avisamos.", list: "Veterinários", ask: "Escrever à equipa" },
  de: { h1: { video: "Online-Tierarzt", home: "Tierarzt-Hausbesuch", clinic: "Tierarztpraxen" }, intro: { video: "Sprich per Video mit einem Tierarzt, von überall in {c}: keine Stadt wählen, kein Weg.", home: "Ein Tierarzt, der zu dir kommt – weniger Stress für dein Tier.", clinic: "Finde eine Tierarztpraxis und buche einen Termin." }, empty: "Televet hat hier ({c}) noch keine Tierärzte. Schreib uns, wenn du Interesse hast – wir melden uns.", list: "Tierärzte", ask: "Dem Team schreiben" },
  pl: { h1: { video: "Weterynarz online", home: "Weterynarz z dojazdem", clinic: "Kliniki weterynaryjne" }, intro: { video: "Porozmawiaj z weterynarzem przez wideo, skądkolwiek w {c}: bez wyboru miasta i dojazdu.", home: "Weterynarz, który przyjeżdża do Ciebie – mniej stresu dla zwierzaka.", clinic: "Znajdź klinikę weterynaryjną i umów wizytę." }, empty: "Televet nie ma tu jeszcze weterynarzy ({c}). Napisz, jeśli jesteś zainteresowany – damy znać.", list: "Weterynarze", ask: "Napisz do zespołu" },
  nl: { h1: { video: "Online dierenarts", home: "Dierenarts aan huis", clinic: "Dierenartspraktijken" }, intro: { video: "Praat via video met een dierenarts, waar je ook bent in {c}: geen stad kiezen, niet reizen.", home: "Een dierenarts die bij je thuis komt – minder stress voor je dier.", clinic: "Vind een dierenartspraktijk en maak een afspraak." }, empty: "Televet heeft hier ({c}) nog geen dierenartsen. Laat het ons weten als je interesse hebt, dan melden we ons.", list: "Dierenartsen", ask: "Schrijf het team" },
};
TXT["pt-BR"] = brazilian(TXT.pt);


/** Guide content exists for French pages in France (video and home visits first). */
const guideFor = (lang: string, cc: string, svc: Svc) => (lang === "fr" && cc === "FR" && (svc === "video" || svc === "home") ? GUIDE_FR[svc] : undefined);

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
  const sp = speciesPageFor(lang, country, service);
  if (sp) return speciesMetadata(lang, sp.cc, sp.code);
  const d = await load(lang, country, service);
  if (!d) return {};
  const t = pick(TXT, lang, country), g = guideFor(lang, d.cc, d.svc);
  return pageMetadata({
    title: g ? `${g.title} | Televet` : `${t.h1[d.svc]} — ${d.countryName} | Televet`, description: g ? g.lead.slice(0, 158) : t.intro[d.svc].replace("{c}", d.countryName),
    lang, country: d.cc, onlyCountry: d.cc, index: d.list.length > 0 || !!g, // the guide makes the page useful even before the first vet

    path: (l, c) => `/${l}/${c.toLowerCase()}/${SERVICE_SLUGS[d.svc][l] ?? service}`,
  });
}

export default async function ServicePage({ params }: P) {
  const { lang, country, service } = await params;
  const sp = speciesPageFor(lang, country, service);
  if (sp) return <SpeciesPage lang={lang} cc={sp.cc} code={sp.code} />;
  const d = await load(lang, country, service);
  if (!d) notFound();
  const t = pick(TXT, lang, country), g = guideFor(lang, d.cc, d.svc);
  const base = `${SITE}/${lang}/${country}`, rel = `/${lang}/${country}`;
  // biggest towns of the directory, for the home-visit guide (internal links to the city pages)
  let towns: { name: string; slug: string }[] = [];
  if (g?.cities) {
    const { data } = await adminClient().from("cities").select("name, slug, directory_listings(count)").eq("country", d.cc).limit(400);
    towns = ((data ?? []) as unknown as { name: string; slug: string; directory_listings: { count: number }[] }[])
      .sort((a, b) => (b.directory_listings?.[0]?.count ?? 0) - (a.directory_listings?.[0]?.count ?? 0)).slice(0, 24).map((x) => ({ name: x.name, slug: x.slug || slugify(x.name) }));
  }
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: t.h1[d.svc], url: `${base}/${service}` }]),
    ...(g ? [faqLd(g.faq), { "@context": "https://schema.org", "@type": "Service", serviceType: t.h1[d.svc], provider: { "@type": "Organization", name: "Televet", url: SITE }, areaServed: { "@type": "Country", name: d.countryName } }] : []),
    ...d.list.map((p) => veterinaryCareLd({ name: p.name, url: `${base}/veterinaire/${p.slug}`, description: p.headline ?? undefined, address: p.address ?? undefined, postalCode: p.postal_code ?? undefined, country: d.cc, phone: p.phone ?? undefined, languages: p.languages }))];
  return (
    <main className="wrap narrow svc-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`${rel}/`}>Televet</a> › {t.h1[d.svc]}</nav>
      <h1>{g ? g.title : t.h1[d.svc]}</h1>
      <p className="lead-p">{g ? g.lead : t.intro[d.svc].replace("{c}", d.countryName)}</p>
      <p><a className="btn" href={`${rel}/recherche?type=${d.svc}`}>{d.svc === "video" ? "Voir les vétérinaires en visio" : d.svc === "home" ? "Trouver un vétérinaire qui se déplace" : t.list} →</a></p>
      {d.list.length === 0
        ? (!g && <p>{t.empty.replace("{c}", d.countryName)} <a href="mailto:contact@televet.co">{t.ask}</a></p>)
        : (<><h2>{t.list}</h2><ul className="cards">{d.list.map((p) => <li key={p.id}><h3><a href={`${rel}/veterinaire/${p.slug}`}>{p.name}</a></h3><p>{p.headline}</p></li>)}</ul></>)}
      {g && <>
        <h2>Comment ça marche</h2>
        <ol className="svc-steps">{g.steps.map((x) => <li key={x}>{x}</li>)}</ol>
        {g.sections.map((sec) => <section key={sec.h}><h2>{sec.h}</h2>{sec.p && <p>{sec.p}</p>}{sec.li && <ul>{sec.li.map((x) => <li key={x}>{x}</li>)}</ul>}</section>)}
        {towns.length > 0 && <section><h2>Cliniques et vétérinaires par ville</h2>
          <ul className="svc-towns">{towns.map((x) => <li key={x.slug}><a href={`${rel}/annuaire/${x.slug}`}>{x.name}</a></li>)}</ul></section>}
        <h2>Questions fréquentes</h2>
        {g.faq.map((f) => <details key={f.q} className="svc-faq"><summary>{f.q}</summary><p>{f.a}</p></details>)}
        <p className="sr-urgent" style={{ marginTop: 24 }}>En cas d&apos;urgence, allez immédiatement dans une clinique vétérinaire d&apos;urgence.</p>
      </>}
    </main>
  );
}
