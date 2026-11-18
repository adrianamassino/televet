import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { VI } from "@/components/VI";
import { Animals, Avatar, Hours, Section } from "@/components/ProfileParts";
import { COUNTRIES, ZERO_DECIMAL } from "@/lib/countries";
import { pc } from "@/lib/profile-copy";
import { breadcrumbLd, ldJson, pageMetadata, SITE } from "@/lib/seo";

/** Vet page: /{lang}/{country}/veterinaire/{clinic-slug}/{vet-slug}. Doctolib-style practitioner page; empty sections are hidden. */
export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string; slug: string; vet: string }> };

async function load(lang: string, country: string, slug: string, vet: string) {
  const cc = country.toUpperCase();
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) return null;
  const { data: p } = await adminClient().from("practices")
    .select("id, name, slug, address, postal_code, city, languages, booking_enabled, country, services(type, practitioner_id, custom_name, description, duration_min, price_cents, currency, active), practitioners(id, slug, title, display_name, photo_url, bio, specialties, languages, species, school, experience_years, active, opening_rules(weekday, start_time, end_time))")
    .eq("slug", slug).eq("country", cc).eq("published", true).maybeSingle();
  const v = p?.practitioners?.find((x) => x.active && x.slug === vet);
  return p && v ? { cc, p, v } : null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country, slug, vet } = await params;
  const d = await load(lang, country, slug, vet);
  if (!d) return { robots: { index: false } };
  const t = pc(lang), name = [d.v.title, d.v.display_name].filter(Boolean).join(" ");
  return pageMetadata({
    title: `${name} — ${t.kind.vet}${d.p.city ? ` · ${d.p.city}` : ""} | Televet`, description: d.v.specialties?.length ? `${name} · ${d.v.specialties.join(", ")} · ${d.p.name}` : `${name} · ${d.p.name}`,
    lang, country: d.cc, onlyCountry: d.cc, path: (l, c) => `/${l}/${c.toLowerCase()}/veterinaire/${slug}/${vet}`,
  });
}

export default async function VetPage({ params }: P) {
  const { lang, country, slug, vet } = await params;
  const d = await load(lang, country, slug, vet);
  if (!d) notFound();
  const { p, v } = d, t = pc(lang), rel = `/${lang}/${country}`, base = `${SITE}${rel}`;
  const name = [v.title, v.display_name].filter(Boolean).join(" ");
  const services = (p.services ?? []).filter((s) => s.active && (!s.practitioner_id || s.practitioner_id === v.id));
  const rules = v.opening_rules ?? [];
  const colleagues = (p.practitioners ?? []).filter((x) => x.active && x.id !== v.id && x.slug);
  const money = (c: number, cur: string) => { try { return new Intl.NumberFormat(lang, { style: "currency", currency: cur }).format(ZERO_DECIMAL.has(cur) ? c : c / 100); } catch { return `${c} ${cur}`; } };
  const names = (l: string[]) => l.map((x) => { try { return new Intl.DisplayNames([lang], { type: "language" }).of(x) ?? x; } catch { return x; } }).join(", ");
  const addr = [p.address, [p.postal_code, p.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const canBook = services.length > 0 && p.booking_enabled !== false;
  const SI = { video: "monitor", home: "housePaw", clinic: "clinic", expertise: "stethoscope" } as const;
  const ld = [{ "@context": "https://schema.org", "@type": "Person", name, jobTitle: t.kind.vet, image: v.photo_url ?? undefined, knowsLanguage: v.languages, worksFor: { "@type": "VeterinaryCare", name: p.name, url: `${base}/veterinaire/${p.slug}` } },
    breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: p.name, url: `${base}/veterinaire/${p.slug}` }, { name, url: `${base}/veterinaire/${p.slug}/${v.slug}` }])];
  return (
    <main className="wrap profile">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav className="crumbs"><a href={`${rel}/`}>{t.home}</a> › <a href={`${rel}/veterinaire/${p.slug}`}>{p.name}</a></nav>
      <header className="profile-head vet">
        <Avatar src={v.photo_url} name={v.display_name} size={120} />
        <div>
          <span className="chip">{t.kind.vet}</span>
          <h1>{name}</h1>
          {v.specialties?.length > 0 && <p className="lead">{v.specialties.join(" · ")}</p>}
          <p className="addr"><VI n="clinic" size={20} tone="white" /> {t.clinic} <a href={`${rel}/veterinaire/${p.slug}`}>{p.name}</a>{addr ? ` · ${addr}` : ""}</p>
        </div>
      </header>
      <div className="profile-cols">
        <div className="profile-main">
          {v.bio && <Section id="about" title={t.bio}><p style={{ whiteSpace: "pre-line" }}>{v.bio}</p></Section>}
          {(v.school || v.experience_years || v.languages?.length > 0) && <Section id="training" title={t.school}><ul className="facts">
            {v.school && <li><VI n="check" size={22} />{v.school}</li>}
            {v.experience_years != null && <li><VI n="check" size={22} />{v.experience_years} {t.years}</li>}
            {v.languages?.length > 0 && <li><VI n="check" size={22} />{t.langs}: {names(v.languages)}</li>}</ul></Section>}
          {services.length > 0 && <Section id="services" title={t.services}><ul className="svc-list">{services.map((s, i) => (
            <li key={i} className="svc"><span className="ico"><VI n={SI[s.type as keyof typeof SI] ?? "stethoscope"} size={38} /></span>
              <div><strong>{s.custom_name ?? t.types[s.type]}</strong><small>{s.custom_name ? `${t.types[s.type]} · ` : ""}{s.duration_min} {t.min}</small>{s.description && <p>{s.description}</p>}</div>
              <span className="price">{money(s.price_cents, s.currency)}</span></li>))}</ul></Section>}
          {v.species?.length > 0 && <Section id="animals" title={t.animals}><Animals t={t} items={v.species} /></Section>}
          {rules.length > 0 && <Section id="hours" title={t.hours}><Hours t={t} rules={rules} /></Section>}
          {colleagues.length > 0 && <Section id="team" title={t.others}><ul className="team-grid">{colleagues.map((c) => (
            <li key={c.id}><Avatar src={c.photo_url} name={c.display_name} size={64} /><div><strong>{[c.title, c.display_name].filter(Boolean).join(" ")}</strong>
              {c.specialties?.length > 0 && <small>{c.specialties.join(" · ")}</small>}<a href={`${rel}/veterinaire/${p.slug}/${c.slug}`}>{t.seeProfile}</a></div></li>))}</ul></Section>}
        </div>
        <aside className="book-card">
          {canBook ? <><strong>{t.bookFor} {name}</strong><a className="btn btn-lg" href={`${rel}/reserver/${p.slug}?vet=${v.id}`}>{t.book}</a></> : <p className="muted">{t.verified}</p>}
          <ul className="contact-list"><li><VI n="clinic" size={22} /><a href={`${rel}/veterinaire/${p.slug}`}>{p.name}</a></li>{addr && <li><VI n="pin" size={22} />{addr}</li>}</ul>
        </aside>
      </div>
    </main>
  );
}
