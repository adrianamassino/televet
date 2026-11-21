import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES, ZERO_DECIMAL } from "@/lib/countries";
import { clientPricer } from "@/lib/client-price";
import { nextSlot } from "@/lib/next-slot";
import { breadcrumbLd, ldJson, organizationLd, pageMetadata, SERVICE_SLUGS, SITE, serviceFromSlug, slugify, veterinaryCareLd } from "@/lib/seo";

/**
 * SEO landing pages, server-rendered: /fr/fr/veterinaire-a-domicile/paris-11e, /es/ar/veterinario-online/palermo …
 * One page per (service × city) where at least one published practice exists — no empty pages.
 */
type P = { params: Promise<{ lang: string; country: string; service: string; city: string }> };
const H1: Record<string, Record<string, string>> = {
  fr: { home: "Vétérinaire à domicile à {c}", video: "Vétérinaire en ligne", clinic: "Clinique vétérinaire à {c}" },
  en: { home: "Home visit vet in {c}", video: "Online vet", clinic: "Vet clinic in {c}" },
  it: { home: "Veterinario a domicilio a {c}", video: "Veterinario online", clinic: "Clinica veterinaria a {c}" },
  es: { home: "Veterinario a domicilio en {c}", video: "Veterinario online", clinic: "Clínica veterinaria en {c}" },
  pt: { home: "Veterinário ao domicílio em {c}", video: "Veterinário online", clinic: "Clínica veterinária em {c}" },
  de: { home: "Tierarzt-Hausbesuch in {c}", video: "Online-Tierarzt", clinic: "Tierarztpraxis in {c}" },
  pl: { home: "Weterynarz z dojazdem: {c}", video: "Weterynarz online", clinic: "Klinika weterynaryjna: {c}" },
  nl: { home: "Dierenarts aan huis in {c}", video: "Online dierenarts", clinic: "Dierenartspraktijk in {c}" },
};
/** Title end and description, in the page's language. {h} = the H1, {n} = number of vets. */
const META: Record<string, { title: string; desc: (n: number) => string }> = {
  fr: { title: "{h} : disponibilités et prise de RDV en ligne", desc: (n) => `{h} : ${n} vétérinaire${n > 1 ? "s" : ""} sur Televet. Tarifs, prochains créneaux libres et réservation en ligne.` },
  it: { title: "{h}: disponibilità e prenotazione online", desc: (n) => `{h}: ${n} veterinari${n > 1 ? "" : "o"} su Televet. Prezzi, prossimi orari liberi e prenotazione online.` },
  en: { title: "{h}: availability and online booking", desc: (n) => `{h}: ${n} vet${n > 1 ? "s" : ""} on Televet. Prices, next free times and online booking.` },
  es: { title: "{h}: disponibilidad y reserva online", desc: (n) => `{h}: ${n} veterinario${n > 1 ? "s" : ""} en Televet. Precios, próximos horarios libres y reserva online.` },
  pt: { title: "{h}: disponibilidade e marcação online", desc: (n) => `{h}: ${n} veterinário${n > 1 ? "s" : ""} na Televet. Preços, próximos horários livres e marcação online.` },
  de: { title: "{h}: freie Termine und Online-Buchung", desc: (n) => `{h}: ${n} Tierärzt${n > 1 ? "e" : "in/Tierarzt"} auf Televet. Preise, nächste freie Termine und Online-Buchung.` },
  pl: { title: "{h}: wolne terminy i rezerwacja online", desc: (n) => `{h}: ${n} weterynarz${n > 1 ? "y" : ""} w Televet. Ceny, najbliższe wolne terminy i rezerwacja online.` },
  nl: { title: "{h}: beschikbaarheid en online afspraak", desc: (n) => `{h}: ${n} dierenarts${n > 1 ? "en" : ""} op Televet. Prijzen, eerstvolgende vrije tijden en online boeken.` },
};
const base = (l: string) => l.split("-")[0];

async function load(lang: string, country: string, service: string, city: string) {
  const cc = country.toUpperCase();
  const svc = serviceFromSlug(lang, service);
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang) || !svc) return null;
  const db = adminClient();
  const { data } = await db.from("practices")
    .select("id, name, slug, headline, address, postal_code, city, languages, phone, timezone, country, booking_enabled, commission_pct, commission_fixed_cents, services!inner(type, active, price_cents, currency, online_payment), service_zones(postal_codes)")
    .eq("country", cc).eq("published", true).eq("services.type", svc).eq("services.active", true);
  const inCity = (p: { city: string | null; address: string | null; postal_code: string | null }) =>
    p.city ? slugify(p.city) === city : slugify(`${p.address ?? ""} ${p.postal_code ?? ""}`).includes(city);
  const list = (data ?? []).filter((p) => svc === "video" || inCity(p)
    || (p.service_zones ?? []).some((z: { postal_codes: string[] }) => (z.postal_codes ?? []).some((pc) => slugify(pc) === city)));
  // the city as written by the clinics themselves (accents, capitals), not rebuilt from the address
  const named = list.find((p) => p.city && slugify(p.city) === city)?.city;
  return { cc, svc, list, cityName: named ?? city.replace(/-/g, " ").replace(/\b\p{L}/gu, (m) => m.toUpperCase()) };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, service, city } = await params;
  const d = await load(lang, country, service, city);
  if (!d) return {};
  const h1 = (H1[base(lang)] ?? H1.en)[d.svc].replace("{c}", d.cityName), m = META[base(lang)] ?? META.en;
  return pageMetadata({
    title: `${m.title.replace("{h}", h1)} | Televet`,
    description: m.desc(d.list.length).replace("{h}", h1),
    lang, country: d.cc, onlyCountry: d.cc, index: d.list.length > 0,
    path: (l, c) => `/${l}/${c.toLowerCase()}/${SERVICE_SLUGS[d.svc][l] ?? service}/${city}`,
  });
}

/** Labels of the list, in the page's language. */
const UI: Record<string, { from: string; next: string; book: string; profile: string; langs: string; urgent: string; count: (n: number) => string }> = {
  fr: { from: "À partir de", next: "Prochain créneau", book: "Réserver", profile: "Voir le profil", langs: "Langues", urgent: "Urgence (difficulté à respirer, saignement, intoxication, convulsions) : allez tout de suite dans une clinique vétérinaire d'urgence. Un rendez-vous en ligne ne remplace pas les soins urgents.", count: (n) => `${n} vétérinaire${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""} sur Televet.` },
  it: { from: "Da", next: "Primo orario libero", book: "Prenota", profile: "Vedi il profilo", langs: "Lingue", urgent: "Emergenza (difficoltà a respirare, emorragia, avvelenamento, convulsioni): vai subito in una clinica veterinaria di pronto soccorso. Un appuntamento online non sostituisce le cure urgenti.", count: (n) => `${n} veterinari${n > 1 ? "" : "o"} disponibil${n > 1 ? "i" : "e"} su Televet.` },
  en: { from: "From", next: "Next free time", book: "Book", profile: "View profile", langs: "Languages", urgent: "Emergency (trouble breathing, bleeding, poisoning, seizures): go to an emergency vet clinic now. An online booking does not replace urgent care.", count: (n) => `${n} vet${n > 1 ? "s" : ""} available on Televet.` },
  es: { from: "Desde", next: "Próximo horario libre", book: "Reservar", profile: "Ver el perfil", langs: "Idiomas", urgent: "Urgencia (dificultad para respirar, hemorragia, intoxicación, convulsiones): ve ya a una clínica veterinaria de urgencias. Una cita online no reemplaza la atención urgente.", count: (n) => `${n} veterinario${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""} en Televet.` },
  pt: { from: "A partir de", next: "Próximo horário livre", book: "Marcar", profile: "Ver o perfil", langs: "Línguas", urgent: "Urgência (dificuldade em respirar, hemorragia, intoxicação, convulsões): vá já a uma clínica veterinária de urgência. Uma marcação online não substitui cuidados urgentes.", count: (n) => `${n} veterinário${n > 1 ? "s" : ""} disponíve${n > 1 ? "is" : "l"} na Televet.` },
  de: { from: "Ab", next: "Nächster freier Termin", book: "Buchen", profile: "Profil ansehen", langs: "Sprachen", urgent: "Notfall (Atemnot, Blutung, Vergiftung, Krampfanfall): sofort in eine Tierklinik mit Notdienst. Eine Online-Buchung ersetzt keine Notfallversorgung.", count: (n) => `${n} Tierärzt${n > 1 ? "e" : "in/Tierarzt"} auf Televet verfügbar.` },
  pl: { from: "Od", next: "Najbliższy wolny termin", book: "Zarezerwuj", profile: "Zobacz profil", langs: "Języki", urgent: "Nagły przypadek (duszność, krwawienie, zatrucie, drgawki): jedź od razu do całodobowej kliniki weterynaryjnej. Rezerwacja online nie zastępuje pilnej pomocy.", count: (n) => `Weterynarze w Televet: ${n}.` },
  nl: { from: "Vanaf", next: "Eerstvolgende vrije tijd", book: "Boeken", profile: "Profiel bekijken", langs: "Talen", urgent: "Spoed (ademnood, bloeding, vergiftiging, stuipen): ga meteen naar een dierenkliniek met spoeddienst. Een online afspraak vervangt geen spoedzorg.", count: (n) => `${n} dierenarts${n > 1 ? "en" : ""} beschikbaar op Televet.` },
};

export default async function CityPage({ params }: P) {
  const { lang, country, service, city } = await params;
  const d = await load(lang, country, service, city);
  if (!d || !d.list.length) notFound();
  const h1 = (H1[base(lang)] ?? H1.en)[d.svc].replace("{c}", d.cityName), u = UI[base(lang)] ?? UI.en;
  const root = `${SITE}/${lang}/${country}`, rel = `/${lang}/${country}`;
  const db = adminClient(), loc = `${lang}-${d.cc}`;
  const money = (c: number, cur: string) => { try { return new Intl.NumberFormat(loc, { style: "currency", currency: cur }).format(ZERO_DECIMAL.has(cur) ? c : c / 100); } catch { return `${c} ${cur}`; } };
  // real facts only: the lowest price the client pays for this kind of service and the next free time, as computed for booking
  const rows = await Promise.all(d.list.slice(0, 30).map(async (p) => {
    const svcs = ((p.services ?? []) as { type: string; active: boolean; price_cents: number; currency: string; online_payment: boolean }[]).filter((x) => x.active && x.type === d.svc);
    const pricer = await clientPricer(db, p);
    const prices = svcs.map((x) => ({ c: x.online_payment ? pricer(x.price_cents) : x.price_cents, cur: x.currency })).sort((a, b) => a.c - b.c);
    const next = p.booking_enabled !== false ? await nextSlot(p.id, p.timezone, d.svc).catch(() => null) : null;
    return { p, from: prices[0], next };
  }));
  const when = (iso: string, tz: string) => { try { return new Intl.DateTimeFormat(loc, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso)); } catch { return iso; } };
  const names = (l: string[]) => l.map((x) => { try { return new Intl.DisplayNames([lang], { type: "language" }).of(x) ?? x; } catch { return x; } }).join(", ");
  const ld = [organizationLd(), breadcrumbLd([{ name: "Televet", url: `${root}/` }, { name: h1, url: `${root}/${service}/${city}` }]),
    { "@context": "https://schema.org", "@type": "ItemList", name: h1, itemListElement: rows.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${root}/veterinaire/${r.p.slug}` })) },
    ...d.list.map((p) => veterinaryCareLd({ name: p.name, url: `${root}/veterinaire/${p.slug}`, description: p.headline ?? undefined, address: p.address ?? undefined, postalCode: p.postal_code ?? undefined, city: p.city ?? undefined, country: d.cc, phone: p.phone ?? undefined, languages: p.languages }))];
  return (
    <main className="wrap narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`${rel}/`}>Televet</a> › <a href={`${rel}/${service}`}>{(H1[base(lang)] ?? H1.en)[d.svc].replace(/(?:\s+(?:à|a|in|en|em))?\s*:?\s*\{c\}$/, "")}</a> › {d.cityName}</nav>
      <h1>{h1}</h1>
      <p className="lead-p">{u.count(d.list.length)}</p>
      <ul className="vet-list">{rows.map(({ p, from, next }) => (
        <li key={p.id} className="is-online">
          <div><h2 style={{ fontSize: 20, margin: 0 }}><a href={`${rel}/veterinaire/${p.slug}`}>{p.name}</a></h2>
            {p.headline && <p>{p.headline}</p>}
            <small>{[d.svc !== "home" ? [p.address, p.postal_code, p.city].filter(Boolean).join(", ") : p.city, p.languages?.length ? `${u.langs}: ${names(p.languages)}` : ""].filter(Boolean).join(" · ")}</small>
            <p className="ok-p">{[from ? `${u.from} ${money(from.c, from.cur)}` : "", next ? `${u.next}: ${when(next.start, p.timezone)}` : ""].filter(Boolean).join(" · ")}</p></div>
          {p.booking_enabled !== false ? <a className="btn" href={`${rel}/reserver/${p.slug}`}>{u.book}</a> : <a className="btn btn-ghost" href={`${rel}/veterinaire/${p.slug}`}>{u.profile}</a>}
        </li>))}</ul>
      <p className="alert" style={{ marginTop: 28 }}>{u.urgent}</p>
    </main>
  );
}
