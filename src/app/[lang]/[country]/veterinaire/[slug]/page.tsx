import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { VI } from "@/components/VI";
import { PhotoStrip } from "@/components/PhotoStrip";
import { Animals, Avatar, Chips, Hours, Section, mapsUrl } from "@/components/ProfileParts";
import { COUNTRIES, ZERO_DECIMAL } from "@/lib/countries";
import { nextSlot } from "@/lib/next-slot";
import { pc } from "@/lib/profile-copy";
import { breadcrumbLd, ldJson, pageMetadata, SITE, veterinaryCareLd } from "@/lib/seo";

/** Clinic page: /{lang}/{country}/veterinaire/{slug}. Doctolib-style: header, anchor nav, sections, sticky booking card. Empty sections are hidden. */
export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string; slug: string }> };

async function load(lang: string, country: string, slug: string) {
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) return null;
  const { data } = await adminClient().from("practices")
    .select("id, name, slug, kind, headline, about, address, postal_code, city, phone, website, cover_url, logo_url, languages, species, facilities, payment_methods, access_info, founded_year, timezone, country, booking_enabled, services(type, practitioner_id, custom_name, description, duration_min, price_cents, currency, active), practitioners(id, slug, title, display_name, photo_url, specialties, active, opening_rules(weekday, start_time, end_time))")
    .eq("slug", slug).eq("country", cc).eq("published", true).maybeSingle();
  return data ? { cc, p: data } : null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, slug } = await params;
  const d = await load(lang, country, slug);
  if (!d) return { robots: { index: false } };
  const t = pc(lang);
  return pageMetadata({
    title: `${d.p.name} — ${t.kind[d.p.kind] ?? t.kind.vet}${d.p.city ? ` · ${d.p.city}` : ""} | Televet`, description: d.p.headline ?? `${d.p.name} · Televet`,
    lang, country: d.cc, onlyCountry: d.cc, path: (l, c) => `/${l}/${c.toLowerCase()}/veterinaire/${slug}`,
  });
}

export default async function ClinicPage({ params }: P) {
  const { lang, country, slug } = await params;
  const d = await load(lang, country, slug);
  if (!d) notFound();
  const { p } = d, t = pc(lang);
  const services = (p.services ?? []).filter((s) => s.active);
  const team = (p.practitioners ?? []).filter((v) => v.active);
  const rules = team.flatMap((v) => v.opening_rules ?? []);
  const money = (c: number, cur: string) => { try { return new Intl.NumberFormat(lang, { style: "currency", currency: cur }).format(ZERO_DECIMAL.has(cur) ? c : c / 100); } catch { return `${c} ${cur}`; } };
  const names = (l: string[]) => l.map((x) => { try { return new Intl.DisplayNames([lang], { type: "language" }).of(x) ?? x; } catch { return x; } }).join(", ");
  const base = `${SITE}/${lang}/${country}`, rel = `/${lang}/${country}`;
  const addr = [p.address, [p.postal_code, p.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const canBook = services.length > 0 && p.booking_enabled !== false;
  const next = canBook ? await nextSlot(p.id, p.timezone) : null;
  const fmtNext = next ? new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: p.timezone }).format(new Date(next.start)) : null;
  const book = `${rel}/reserver/${p.slug}`;
  const nav = [
    p.about && ["about", t.nav.about], team.length > 0 && ["team", t.nav.team], services.length > 0 && ["services", t.nav.services],
    rules.length > 0 && ["hours", t.nav.hours], (addr || p.access_info) && ["access", t.nav.access], p.species?.length > 0 && ["animals", t.nav.animals],
  ].filter(Boolean) as [string, string][];
  const SI = { video: "monitor", home: "housePaw", clinic: "clinic", expertise: "stethoscope" } as const;
  const ld = [veterinaryCareLd({ name: p.name, url: `${base}/veterinaire/${p.slug}`, description: p.headline ?? undefined, address: p.address ?? undefined, postalCode: p.postal_code ?? undefined, city: p.city ?? undefined, country: d.cc, phone: p.phone ?? undefined, languages: p.languages, image: p.cover_url ?? p.logo_url ?? undefined }),
    breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: p.name, url: `${base}/veterinaire/${p.slug}` }])];
  return (
    <main className="wrap profile">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav className="crumbs"><a href={`${rel}/`}>{t.home}</a></nav>
      <header className="profile-head" style={p.cover_url ? { backgroundImage: `linear-gradient(180deg, rgba(8,60,120,.15), rgba(8,60,120,.8)), url(${p.cover_url})` } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.logo_url ? <img className="p-logo" src={p.logo_url} alt="" /> : <span className="p-logo ph" aria-hidden><VI n="clinic" size={54} tone="white" /></span>}
        <div>
          <span className="chip">{t.kind[p.kind] ?? t.kind.vet}</span>
          <h1>{p.name}</h1>
          {p.headline && <p className="lead">{p.headline}</p>}
          {addr && <p className="addr"><VI n="pin" size={20} tone="white" /> {addr}</p>}
        </div>
      </header>
      {nav.length > 0 && <nav className="anchor-nav" aria-label="Sections">{nav.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>}
      <div className="profile-cols">
        <div className="profile-main">
          {p.about && <Section id="about" title={t.about}><p style={{ whiteSpace: "pre-line" }}>{p.about}</p>
            {p.founded_year && <p className="muted">{p.founded_year}</p>}</Section>}
          {team.length > 0 && <Section id="team" title={t.team}><ul className="team-grid">{team.map((v) => (
            <li key={v.id}><Avatar src={v.photo_url} name={v.display_name} size={72} />
              <div><strong>{[v.title, v.display_name].filter(Boolean).join(" ")}</strong>
                {v.specialties?.length > 0 && <small>{v.specialties.join(" · ")}</small>}
                {v.slug && <a href={`${rel}/veterinaire/${p.slug}/${v.slug}`}>{t.seeProfile}</a>}</div></li>))}</ul></Section>}
          {services.length > 0 && <Section id="services" title={t.services}><ul className="svc-list">{services.map((s, i) => (
            <li key={i} className="svc"><span className="ico"><VI n={SI[s.type as keyof typeof SI] ?? "stethoscope"} size={38} /></span>
              <div><strong>{s.custom_name ?? t.types[s.type]}</strong><small>{s.custom_name ? `${t.types[s.type]} · ` : ""}{s.duration_min} {t.min}</small>{s.description && <p>{s.description}</p>}</div>
              <span className="price">{money(s.price_cents, s.currency)}</span></li>))}</ul></Section>}
          <PhotoStrip set="c" />
          {rules.length > 0 && <Section id="hours" title={t.hours}><Hours t={t} rules={rules} /></Section>}
          {(addr || p.access_info) && <Section id="access" title={t.access}>
            {addr && <p><strong>{addr}</strong> · <a href={mapsUrl(`${p.name} ${addr}`)} target="_blank" rel="noopener noreferrer">{t.directions}</a></p>}
            {p.access_info && <p style={{ whiteSpace: "pre-line" }}>{p.access_info}</p>}
            {p.facilities?.length > 0 && <><h3>{t.facilities}</h3><Chips items={p.facilities} map={t.fac} icon="check" /></>}
            {p.payment_methods?.length > 0 && <><h3>{t.payments}</h3><Chips items={p.payment_methods} map={t.pay} /></>}</Section>}
          {p.species?.length > 0 && <Section id="animals" title={t.animals}><Animals t={t} items={p.species} />
            {p.languages?.length > 0 && <p><strong>{t.langs}:</strong> {names(p.languages)}</p>}</Section>}
          <p className="muted"><a href="mailto:contact@televet.co">{t.contact}</a></p>
        </div>
        <aside className="book-card" aria-label={t.book}>
          {canBook ? <>
            <strong>{t.next}</strong>
            <p className={fmtNext ? "next date" : "next"}>{fmtNext ?? t.noSlot}</p>
            <a className="btn btn-lg" href={next ? `${book}?service=${next.serviceId}` : book}>{t.book}</a></> : <p className="muted">{t.verified}</p>}
          <ul className="contact-list">
            {p.phone && <li><VI n="phone" size={22} /><a href={`tel:${p.phone}`}>{p.phone}</a></li>}
            {p.website && <li><VI n="mail" size={22} /><a href={p.website} target="_blank" rel="noopener noreferrer nofollow">{t.website}</a></li>}
            {addr && <li><VI n="pin" size={22} /><a href={mapsUrl(`${p.name} ${addr}`)} target="_blank" rel="noopener noreferrer">{t.directions}</a></li>}
          </ul>
        </aside>
      </div>
    </main>
  );
}
