import { pick } from "@/lib/pick";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VI } from "@/components/VI";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES, ZERO_DECIMAL } from "@/lib/countries";
import { pageMetadata } from "@/lib/seo";
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
  type Card = { p: Row; from?: { c: number; cur: string }; next: { start: string } | null; kinds: string[]; goesHome: boolean };
  const build = async (ps: Row[], k: string, max: number): Promise<Card[]> => {
    const out = await Promise.all(ps.slice(0, max).map(async (p) => {
      const prc = await clientPricer(db, p).catch(() => pricer);
      const svcs = (p.services ?? []).filter((x) => x.active && (!k || x.type === k));
      const prices = svcs.map((x) => ({ c: x.online_payment ? prc(x.price_cents) : x.price_cents, cur: x.currency })).sort((a, b) => a.c - b.c);
      const next = p.booking_enabled !== false ? await nextSlot(p.id, p.timezone, k || undefined).catch(() => null) : null;
      return { p, from: prices[0], next, kinds: TYPES.filter((t2) => offers(p, t2)), goesHome: !!q && offers(p, "home") && covers(p) };
    }));
    return out.sort((a, b) => (a.next ? Date.parse(a.next.start) : Infinity) - (b.next ? Date.parse(b.next.start) : Infinity));
  };
  // no service chosen: telemedicine first, then home visits near the place, then clinics (only for a place)
  const inPlace = (p: Row) => !q || textHit(p);
  const groups = type
    ? [{ k: type, cards: await build(hits, type, 30) }]
    : [
        { k: "video", cards: await build(list.filter((p) => offers(p, "video")), "video", 6) },
        { k: "home", cards: q ? await build(list.filter((p) => offers(p, "home") && (covers(p) || textHit(p))), "home", 8) : [] },
        { k: "clinic", cards: q ? await build(list.filter((p) => offers(p, "clinic") && inPlace(p)), "clinic", 6) : [] },
      ];
  const total = groups.reduce((n, g) => n + g.cards.length, 0);

  const loc = `${lang}-${cc}`;
  const money = (c: number, cur: string) => { try { return new Intl.NumberFormat(loc, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(ZERO_DECIMAL.has(cur) ? c : c / 100); } catch { return `${c} ${cur}`; } };
  const ymd = (d: Date, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const when = (iso: string, tz: string) => {
    const d = new Date(iso), diff = Math.round((Date.parse(ymd(d, tz)) - Date.parse(ymd(new Date(), tz))) / 86400000);
    const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: tz, ...o }).format(d);
    const label = diff >= 0 && diff <= 1 ? new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(diff, "day") : f({ weekday: "short", day: "numeric", month: "short" });
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} · ${f({ hour: "2-digit", minute: "2-digit" })}`;
  };
  const langNames = (l: string[]) => l.map((x) => { try { return new Intl.DisplayNames([lang], { type: "language" }).of(x) ?? x; } catch { return x; } }).join(", ");
  const link = (k: string) => `${base}/recherche?${new URLSearchParams({ ...(raw ? { q: raw } : {}), ...(k ? { type: k } : {}) })}`;
  const city = raw.replace(/\d+/g, "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  const SEC: Record<string, [string, string]> = { video: [s.secV, s.secVd], home: [s.secH, s.secHd], clinic: [s.secC, ""] };

  const card = ({ p, from, next, kinds, goesHome }: Card, i: number, k: string) => (
    <li key={p.id} className={`sr-card${k === "clinic" ? " compact" : ""}`} style={{ ["--i" as string]: i }}>
      <a className="sr-media" href={`${base}/veterinaire/${p.slug}`} tabIndex={-1} aria-hidden>
        {p.logo_url || p.cover_url ? <img src={(p.logo_url || p.cover_url)!} alt="" loading="lazy" /> : <span className="sr-mono">{p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>}
      </a>
      <div className="sr-main">
        <h3 className="sr-name"><a href={`${base}/veterinaire/${p.slug}`}>{p.name}</a></h3>
        <p className="sr-meta">{[t.kind[p.kind] ?? t.kind.vet, k !== "video" ? [p.postal_code, p.city].filter(Boolean).join(" ") : ""].filter(Boolean).join(" · ")}</p>
        {p.headline && k !== "clinic" && <p className="sr-head">{p.headline}</p>}
        <ul className="sr-chips">
          {kinds.map((x) => <li key={x} className={x === k ? "on" : ""}><VI n={ICON[x]} size={16} />{t.tabs[x as "home"]}</li>)}
          {goesHome && k !== "video" && <li className="ok"><VI n="check" size={16} />{s.covers}</li>}
          {p.languages?.length && k !== "clinic" ? <li>{s.langs} {langNames(p.languages)}</li> : null}
        </ul>
      </div>
      <div className="sr-side">
        {from && <p className="sr-price"><small>{s.from}</small> {money(from.c, from.cur)}</p>}
        {next ? <a className="sr-slot" href={`${base}/reserver/${p.slug}`}><small><i className="sr-live" aria-hidden />{s.next}</small><b>{when(next.start, p.timezone)}</b></a> : <p className="sr-noslot">{s.noSlot}</p>}
        {p.booking_enabled !== false ? <a className="sr-book" href={`${base}/reserver/${p.slug}`}>{s.book} <span aria-hidden>→</span></a> : <a className="sr-book ghost" href={`${base}/veterinaire/${p.slug}`}>{s.profile}</a>}
      </div>
    </li>
  );

  return (
    <main className="sr">
      <section className="sr-top">
        <svg className="sr-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
          <path className="w1" d="M0 210 C 240 150 420 270 720 210 S 1200 140 1440 200 L1440 320 L0 320 Z" />
          <path className="w2" d="M0 250 C 300 200 520 300 820 240 S 1260 200 1440 250 L1440 320 L0 320 Z" />
          <path className="ecg" d="M0 120 H 980 l 18 -34 l 20 66 l 18 -48 l 12 16 H 1440" />
        </svg>
        <div className="sr-in">
          <nav aria-label="breadcrumb" className="sr-crumb"><a href={`${base}/`}>Televet</a> › {t.results}</nav>
          <h1 className="sr-h1">{s.h1a} <span className="sr-grad">{s.h1b}</span></h1>
          <p className="sr-lead">{s.lead}</p>
          <form className="sr-search" action={`${base}/recherche`} method="get" role="search">
            <div className="sr-pick" role="radiogroup" aria-label={t.results}>
              {(["video", "home"] as const).map((k) => <label key={k} className="big"><input type="radio" name="type" value={k} defaultChecked={type === k} />
                <span><i className="sr-ico"><VI n={ICON[k]} size={30} tone="white" /></i><b>{t.tabs[k]}</b><small>{k === "video" ? s.vPitch : s.hPitch}</small></span></label>)}
              <label className="small"><input type="radio" name="type" value="clinic" defaultChecked={type === "clinic"} /><span><VI n="clinic" size={18} tone="white" />{s.cSmall}</span></label>
            </div>
            <div className="sr-row">
              <span className="sr-field"><VI n="pin" size={22} /><input name="q" type="search" defaultValue={type === "video" ? "" : raw} placeholder={t.ph} aria-label={t.ph} autoComplete="address-level2" /></span>
              <button className="sr-go" type="submit">{t.go} <span aria-hidden>→</span></button>
            </div>
          </form>
        </div>
      </section>

      <div className="sr-in sr-body">
        <div className="sr-results">
          {total === 0 && <div className="sr-empty"><VI n="magnifier" size={56} /><h2>{s.emptyTitle}</h2><p>{s.emptyText}</p>
            <p className="sr-empty-links">{TYPES.filter((k) => k !== type).map((k) => <a key={k} href={link(k)}>{t.tabs[k]}</a>)}</p></div>}
          {groups.map((g) => {
            if (!type && g.k === "clinic" && !g.cards.length) return null;
            const [title, desc] = SEC[g.k];
            return <section key={g.k} className={`sr-sec sr-sec-${g.k}`}>
              <header className="sr-sec-head"><span className="sr-sec-ico"><VI n={ICON[g.k]} size={26} tone="white" /></span>
                <div><h2>{title} <em>{g.cards.length ? s.found(g.cards.length) : ""}{g.k !== "video" && raw ? ` · ${s.near} ${raw}` : ""}</em></h2>{desc && <p>{desc}</p>}</div>
                {!type && g.cards.length > 0 && <a className="sr-all" href={link(g.k)}>{s.seeAll} →</a>}</header>
              {g.cards.length ? <ol className="sr-list">{g.cards.map((c, i) => card(c, i, g.k))}</ol>
                : <p className="sr-none">{g.k === "video" ? s.noVideo : s.noHome}</p>}
            </section>;
          })}
        </div>
        <aside className="sr-aside">
          {type && type !== "video" && <div className="sr-promo"><VI n="monitor" size={40} tone="white" /><h3>{s.videoTitle}</h3><p>{s.videoText}</p><a href={link("video")}>{s.videoBtn} <span aria-hidden>→</span></a></div>}
          {city && <div className="sr-note"><h3>{s.dirTitle}</h3><p>{s.dirText}</p><a href={`${base}/annuaire/${city}`}>{s.dirBtn} →</a></div>}
          <p className="sr-urgent"><VI n="cross" size={20} />{s.urgent}</p>
        </aside>
      </div>
    </main>
  );
}
