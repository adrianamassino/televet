import { pick } from "@/lib/pick";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VI } from "@/components/VI";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES, ZERO_DECIMAL } from "@/lib/countries";
import { pageMetadata, SERVICE_SLUGS } from "@/lib/seo";
import { nextSlot } from "@/lib/next-slot";
import { clientPricer } from "@/lib/client-price";
import { extractPostalCode, locate, matchZones, type ServiceZone } from "@/lib/zones";
import { HOME } from "../home-copy";
import { sr } from "./copy";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string }>; searchParams: Promise<{ q?: string; type?: string }> };
type Svc = { type: string; active: boolean; price_cents: number; currency: string; online_payment: boolean };
type Row = { id: string; name: string; slug: string; kind: string; headline: string | null; address: string | null; postal_code: string | null; city: string | null; timezone: string; country: string;
  logo_url: string | null; cover_url: string | null; languages: string[] | null; booking_enabled: boolean | null; commission_pct: number | null; commission_fixed_cents: number | null; services: Svc[]; service_zones: ServiceZone[] };
const TYPES = ["home", "video", "clinic"] as const;
const ICON: Record<string, string> = { home: "housePaw", video: "monitor", clinic: "clinic" };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params; const t = pick(HOME, lang, country);
  return pageMetadata({ title: `${t.results} | Televet`, description: t.desc, lang, country: country.toUpperCase(), index: false, path: (l, c) => `/${l}/${c.toLowerCase()}/recherche` });
}

export default async function Results({ params, searchParams }: P) {
  const { lang, country } = await params; const sp = await searchParams;
  const cc = country.toUpperCase(), t = pick(HOME, lang, country), s = sr(lang), base = `/${lang}/${country}`;
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const raw = (sp.q ?? "").trim().slice(0, 80), type = (TYPES as readonly string[]).includes(sp.type ?? "") ? sp.type! : "";
  const db = adminClient();
  let list: Row[] = [];
  try {
    const { data } = await db.from("practices").select("id, name, slug, kind, headline, address, postal_code, city, timezone, country, logo_url, cover_url, languages, booking_enabled, commission_pct, commission_fixed_cents, services(type, active, price_cents, currency, online_payment), service_zones(*)").eq("country", cc).eq("published", true).limit(500);
    list = (data ?? []) as unknown as Row[];
  } catch { /* none */ }

  // where: a home visit counts when the vet travels to the searched place (postal code or distance), not only when the clinic is there
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q = norm(raw), postal = raw ? extractPostalCode(raw, cc) ?? (/^\d{4,5}$/.test(raw) ? raw : null) : null;
  const point = raw && type !== "video" ? await locate(raw, cc).catch(() => null) : null;
  const offers = (p: Row, k: string) => (p.services ?? []).some((x) => x.active && x.type === k);
  const covers = (p: Row) => (p.service_zones ?? []).length > 0 && matchZones(p.service_zones, { postalCode: postal ?? point?.postcode ?? null, lat: point?.lat ?? null, lng: point?.lng ?? null, weekday: new Date().getDay() }).covered;
  const textHit = (p: Row) => norm([p.address, p.postal_code, p.city, p.name].join(" ")).includes(q);
  const hits = list.filter((p) => {
    if (type && !offers(p, type)) return false;
    if (!q || type === "video") return true;                           // a video consultation works from anywhere
    if (type === "home") return covers(p) || textHit(p);
    return textHit(p) || (offers(p, "home") && covers(p));
  });

  const pricer = await clientPricer(db, { country: cc });
  const rows = await Promise.all(hits.slice(0, 30).map(async (p) => {
    const prc = await clientPricer(db, p).catch(() => pricer);
    const svcs = (p.services ?? []).filter((x) => x.active && (!type || x.type === type));
    const prices = svcs.map((x) => ({ c: x.online_payment ? prc(x.price_cents) : x.price_cents, cur: x.currency })).sort((a, b) => a.c - b.c);
    const next = p.booking_enabled !== false ? await nextSlot(p.id, p.timezone, type || undefined).catch(() => null) : null;
    return { p, from: prices[0], next, kinds: TYPES.filter((k) => offers(p, k)), goesHome: !!q && offers(p, "home") && covers(p) };
  }));
  rows.sort((a, b) => (a.next ? Date.parse(a.next.start) : Infinity) - (b.next ? Date.parse(b.next.start) : Infinity));

  const loc = `${lang}-${cc}`;
  const money = (c: number, cur: string) => { try { return new Intl.NumberFormat(loc, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(ZERO_DECIMAL.has(cur) ? c : c / 100); } catch { return `${c} ${cur}`; } };
  const when = (iso: string, tz: string) => { const d = new Date(iso); const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: tz, ...o }).format(d);
    const day = f({ year: "numeric", month: "2-digit", day: "2-digit" }), today = new Intl.DateTimeFormat(loc, { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" }), diff = Math.round((Date.parse(day.split("/").reverse().join("-")) - Date.parse(today.split("/").reverse().join("-"))) / 86400000);
    const label = Number.isFinite(diff) && diff >= 0 && diff <= 1 ? rtf.format(diff, "day") : f({ weekday: "short", day: "numeric", month: "short" });
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} · ${f({ hour: "2-digit", minute: "2-digit" })}`; };
  const langNames = (l: string[]) => l.map((x) => { try { return new Intl.DisplayNames([lang], { type: "language" }).of(x) ?? x; } catch { return x; } }).join(", ");
  const link = (k: string) => `${base}/recherche?${new URLSearchParams({ ...(raw ? { q: raw } : {}), ...(k ? { type: k } : {}) })}`;
  const where = raw && type !== "video" ? `${s.near} ${raw}` : s.anywhere;
  const city = raw.replace(/\d+/g, "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

  return (
    <main className="sr">
      <section className="sr-top">
        <div className="sr-in">
          <nav aria-label="breadcrumb" className="sr-crumb"><a href={`${base}/`}>Televet</a> › {t.results}</nav>
          <form className="sr-search" action={`${base}/recherche`} method="get" role="search">
            <div className="sr-tabs" role="radiogroup" aria-label={t.results}>
              {TYPES.map((k) => <label key={k}><input type="radio" name="type" value={k} defaultChecked={type === k} /><span><VI n={ICON[k]} size={20} />{t.tabs[k]}</span></label>)}
            </div>
            <div className="sr-row">
              <span className="sr-field"><VI n="pin" size={22} /><input name="q" type="search" defaultValue={raw} placeholder={t.ph} aria-label={t.ph} autoComplete="address-level2" /></span>
              <button className="sr-go" type="submit">{t.go} <span aria-hidden>→</span></button>
            </div>
          </form>
          <h1 className="sr-title">{s.found(rows.length)} <span className="sr-grad">{type ? t.tabs[type as "home"].toLowerCase() : ""} {where}</span></h1>
          {rows.length > 1 && <p className="sr-sub">{s.sortNext}</p>}
        </div>
      </section>

      <div className="sr-in sr-body">
        {rows.length ? <ol className="sr-list">{rows.map(({ p, from, next, kinds, goesHome }) => (
          <li key={p.id} className="sr-card">
            <a className="sr-media" href={`${base}/veterinaire/${p.slug}`} tabIndex={-1} aria-hidden>
              {p.logo_url || p.cover_url ? <img src={(p.logo_url || p.cover_url)!} alt="" loading="lazy" /> : <span className="sr-mono">{p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>}
            </a>
            <div className="sr-main">
              <h2 className="sr-name"><a href={`${base}/veterinaire/${p.slug}`}>{p.name}</a></h2>
              <p className="sr-meta">{[t.kind[p.kind] ?? t.kind.vet, kinds.length && type !== "video" ? [p.postal_code, p.city].filter(Boolean).join(" ") : ""].filter(Boolean).join(" · ")}</p>
              {p.headline && <p className="sr-head">{p.headline}</p>}
              <ul className="sr-chips">
                {kinds.map((k) => <li key={k} className={type === k ? "on" : ""}><VI n={ICON[k]} size={16} />{t.tabs[k]}</li>)}
                {goesHome && <li className="ok"><VI n="check" size={16} />{s.covers}</li>}
                {p.languages?.length ? <li>{s.langs} {langNames(p.languages)}</li> : null}
              </ul>
            </div>
            <div className="sr-side">
              {from && <p className="sr-price"><small>{s.from}</small> {money(from.c, from.cur)}</p>}
              {next ? <a className="sr-slot" href={`${base}/reserver/${p.slug}`}><small>{s.next}</small><b>{when(next.start, p.timezone)}</b></a>
                : <p className="sr-noslot">{s.noSlot}</p>}
              {p.booking_enabled !== false ? <a className="sr-book" href={`${base}/reserver/${p.slug}`}>{s.book} <span aria-hidden>→</span></a>
                : <a className="sr-book ghost" href={`${base}/veterinaire/${p.slug}`}>{s.profile}</a>}
            </div>
          </li>))}</ol>
          : <div className="sr-empty"><VI n="magnifier" size={56} /><h2>{s.emptyTitle}</h2><p>{s.emptyText}</p>
              <p className="sr-empty-links">{TYPES.filter((k) => k !== type).map((k) => <a key={k} href={link(k)}>{t.tabs[k]}</a>)}</p></div>}

        <aside className="sr-aside">
          {type !== "video" && <div className="sr-promo"><VI n="monitor" size={40} tone="white" /><h3>{s.videoTitle}</h3><p>{s.videoText}</p><a href={link("video")}>{s.videoBtn} <span aria-hidden>→</span></a></div>}
          {city && <div className="sr-note"><h3>{s.dirTitle}</h3><p>{s.dirText}</p><a href={`${base}/annuaire/${city}`}>{s.dirBtn} →</a></div>}
          {SERVICE_SLUGS.home[lang] && null}
          <p className="sr-urgent"><VI n="cross" size={20} />{s.urgent}</p>
        </aside>
      </div>
    </main>
  );
}
