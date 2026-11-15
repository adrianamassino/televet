import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { breadcrumbLd, ldJson, pageMetadata, SITE, veterinaryCareLd } from "@/lib/seo";

/** Public profile of a vet / clinic: /{lang}/{country}/veterinaire/{slug}. Only published practices; the price shown is the one the vet set. */
type P = { params: Promise<{ lang: string; country: string; slug: string }> };
const TXT: Record<string, { kind: Record<string, string>; services: string; types: Record<string, string>; min: string; langs: string; about: string; book: string; home: string; contact: string }> = {
  fr: { kind: { clinic: "Clinique vétérinaire", vet: "Vétérinaire", home: "Vétérinaire à domicile" }, services: "Consultations", types: { video: "En visio", home: "À domicile", clinic: "En clinique", expertise: "Avis d'expert" }, min: "min", langs: "Langues parlées", about: "À propos", book: "Prendre rendez-vous", home: "Accueil", contact: "Une question sur ce profil ?" },
  it: { kind: { clinic: "Clinica veterinaria", vet: "Veterinario", home: "Veterinario a domicilio" }, services: "Visite", types: { video: "In video", home: "A domicilio", clinic: "In clinica", expertise: "Parere esperto" }, min: "min", langs: "Lingue parlate", about: "Chi è", book: "Prenota una visita", home: "Home", contact: "Una domanda su questo profilo?" },
  en: { kind: { clinic: "Vet clinic", vet: "Veterinarian", home: "Home-visit vet" }, services: "Consultations", types: { video: "By video", home: "At home", clinic: "At the clinic", expertise: "Expert opinion" }, min: "min", langs: "Languages spoken", about: "About", book: "Book a visit", home: "Home", contact: "A question about this profile?" },
  es: { kind: { clinic: "Clínica veterinaria", vet: "Veterinario", home: "Veterinario a domicilio" }, services: "Consultas", types: { video: "Por video", home: "A domicilio", clinic: "En clínica", expertise: "Opinión experta" }, min: "min", langs: "Idiomas", about: "Sobre", book: "Reservar cita", home: "Inicio", contact: "¿Dudas sobre este perfil?" },
  pt: { kind: { clinic: "Clínica veterinária", vet: "Veterinário", home: "Veterinário ao domicílio" }, services: "Consultas", types: { video: "Por vídeo", home: "Ao domicílio", clinic: "Na clínica", expertise: "Parecer especializado" }, min: "min", langs: "Idiomas", about: "Sobre", book: "Marcar consulta", home: "Início", contact: "Dúvidas sobre este perfil?" },
  de: { kind: { clinic: "Tierarztpraxis", vet: "Tierarzt", home: "Tierarzt-Hausbesuch" }, services: "Beratungen", types: { video: "Per Video", home: "Zu Hause", clinic: "In der Praxis", expertise: "Fachmeinung" }, min: "Min.", langs: "Sprachen", about: "Über", book: "Termin buchen", home: "Startseite", contact: "Fragen zu diesem Profil?" },
  pl: { kind: { clinic: "Klinika weterynaryjna", vet: "Weterynarz", home: "Weterynarz z dojazdem" }, services: "Konsultacje", types: { video: "Wideo", home: "W domu", clinic: "W klinice", expertise: "Opinia eksperta" }, min: "min", langs: "Języki", about: "O nas", book: "Umów wizytę", home: "Strona główna", contact: "Pytanie o ten profil?" },
  nl: { kind: { clinic: "Dierenartspraktijk", vet: "Dierenarts", home: "Dierenarts aan huis" }, services: "Consulten", types: { video: "Via video", home: "Aan huis", clinic: "In de praktijk", expertise: "Deskundig advies" }, min: "min", langs: "Talen", about: "Over", book: "Afspraak maken", home: "Home", contact: "Vragen over dit profiel?" },
};

async function load(lang: string, country: string, slug: string) {
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) return null;
  const { data } = await adminClient().from("practices")
    .select("id, name, slug, kind, headline, about, address, postal_code, phone, languages, species, country, services(type, catalog_code, custom_name, description, duration_min, price_cents, currency, active)")
    .eq("slug", slug).eq("country", cc).eq("published", true).maybeSingle();
  return data ? { cc, p: data } : null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, slug } = await params;
  const d = await load(lang, country, slug);
  if (!d) return { robots: { index: false } };
  const t = TXT[lang] ?? TXT.en;
  return pageMetadata({
    title: `${d.p.name} — ${t.kind[d.p.kind] ?? t.kind.vet} | Televet`, description: d.p.headline ?? `${d.p.name} · Televet`,
    lang, country: d.cc, onlyCountry: d.cc, path: (l, c) => `/${l}/${c.toLowerCase()}/veterinaire/${slug}`,
  });
}

export default async function VetProfile({ params }: P) {
  const { lang, country, slug } = await params;
  const d = await load(lang, country, slug);
  if (!d) notFound();
  const { p } = d, t = TXT[lang] ?? TXT.en;
  const services = (p.services ?? []).filter((s) => s.active);
  const money = (c: number, cur: string) => { try { return new Intl.NumberFormat(lang, { style: "currency", currency: cur }).format(c / 100); } catch { return `${c / 100} ${cur}`; } };
  const names = (l: string[]) => l.map((x) => { try { return new Intl.DisplayNames([lang], { type: "language" }).of(x) ?? x; } catch { return x; } }).join(", ");
  const base = `${SITE}/${lang}/${country}`;
  // Booking UI is not part of this module yet: the button only appears when BOOKING_URL is set (e.g. https://televet.co/{lang}/{country}/reserver/{slug}).
  const book = process.env.BOOKING_URL?.replace("{lang}", lang).replace("{country}", country).replace("{slug}", p.slug);
  const ld = [veterinaryCareLd({ name: p.name, url: `${base}/veterinaire/${p.slug}`, description: p.headline ?? undefined, address: p.address ?? undefined, postalCode: p.postal_code ?? undefined, country: d.cc, phone: p.phone ?? undefined, languages: p.languages }),
    breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: p.name, url: `${base}/veterinaire/${p.slug}` }])];
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 64px", fontFamily: "system-ui", lineHeight: 1.6, color: "#14213d" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav><a href={`/${lang}/${country}/`}>{t.home}</a></nav>
      <p style={{ margin: "24px 0 0", color: "#4a5568" }}>{t.kind[p.kind] ?? t.kind.vet}</p>
      <h1 style={{ margin: "4px 0 8px" }}>{p.name}</h1>
      {p.headline && <p style={{ fontSize: 18, margin: 0 }}>{p.headline}</p>}
      {p.address && <p style={{ color: "#4a5568" }}>{p.address}{p.postal_code ? `, ${p.postal_code}` : ""}</p>}
      {book && <p><a href={book} style={{ display: "inline-block", background: "#0b3bbf", color: "#fff", fontWeight: 700, padding: "12px 20px", borderRadius: 10, textDecoration: "none" }}>{t.book}</a></p>}
      {p.about && <section><h2>{t.about}</h2><p style={{ whiteSpace: "pre-line" }}>{p.about}</p></section>}
      {services.length > 0 && <section><h2>{t.services}</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>{services.map((s, i) => (
          <li key={i} style={{ border: "1px solid #e3e8f4", borderRadius: 12, padding: 14, margin: "10px 0" }}>
            <strong>{s.custom_name ?? t.types[s.type]}</strong> <span style={{ color: "#4a5568" }}>· {t.types[s.type]} · {s.duration_min} {t.min}</span>
            <div style={{ fontWeight: 600 }}>{money(s.price_cents, s.currency)}</div>
            {s.description && <p style={{ margin: "6px 0 0" }}>{s.description}</p>}
          </li>))}</ul></section>}
      {p.languages?.length > 0 && <p><strong>{t.langs}:</strong> {names(p.languages)}</p>}
      <p style={{ marginTop: 32 }}><a href="mailto:contact@televet.co">{t.contact}</a></p>
    </main>
  );
}
