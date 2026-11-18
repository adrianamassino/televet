import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { pageMetadata } from "@/lib/seo";
import { HOME } from "../home-copy";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; country: string }>; searchParams: Promise<{ q?: string; type?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params; const t = HOME[lang] ?? HOME.en;
  return pageMetadata({ title: `${t.results} | Televet`, description: t.desc, lang, country: country.toUpperCase(), index: false, path: (l, c) => `/${l}/${c.toLowerCase()}/recherche` });
}

export default async function Results({ params, searchParams }: P) {
  const { lang, country } = await params; const sp = await searchParams;
  const cc = country.toUpperCase(), t = HOME[lang] ?? HOME.en, base = `/${lang}/${country}`;
  if (!COUNTRIES[cc] || !COUNTRIES[cc].languages.includes(lang)) notFound();
  const q = (sp.q ?? "").trim().slice(0, 80).toLowerCase(), type = ["home", "video", "clinic"].includes(sp.type ?? "") ? sp.type! : "";
  let list: { id: string; name: string; slug: string; kind: string; headline: string | null; address: string | null; postal_code: string | null; services: { type: string; active: boolean }[] }[] = [];
  try { const { data } = await adminClient().from("practices").select("id, name, slug, kind, headline, address, postal_code, services(type, active)").eq("country", cc).eq("published", true).limit(200); list = (data ?? []) as typeof list; } catch { /* none */ }
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  list = list.filter((p) => (!type || (p.services ?? []).some((s) => s.active && s.type === type)) && (!q || norm([p.address, p.postal_code, p.name].join(" ")).includes(norm(q))));
  return (
    <main className="wrap narrow">
      <nav aria-label="breadcrumb"><a href={`${base}/`}>Televet</a> › {t.results}</nav>
      <h1>{q ? `${t.resFor} ${sp.q}` : t.results}</h1>
      <form className="search-card" action={`${base}/recherche`} method="get">
        <div className="tabs">{(["home", "video", "clinic"] as const).map((k) => <label key={k}><input type="radio" name="type" value={k} defaultChecked={type === k} /><span>{t.tabs[k]}</span></label>)}</div>
        <div className="row"><input name="q" type="search" defaultValue={sp.q ?? ""} placeholder={t.ph} aria-label={t.ph} /><button className="btn" type="submit">{t.go}</button></div>
      </form>
      {list.length ? <ul className="vet-list">{list.map((v) => (
        <li key={v.id}><span className="ico" aria-hidden><Stethoscope /></span>
          <div><h3><a href={`${base}/veterinaire/${v.slug}`}>{v.name}</a></h3><small>{t.kind[v.kind] ?? t.kind.vet}{v.address ? ` · ${v.address}` : ""}</small>{v.headline && <p>{v.headline}</p>}</div>
          <a className="btn btn-ghost" href={`${base}/reserver/${v.slug}`}>{t.book}</a></li>))}</ul> : <p className="muted">{t.noRes}</p>}
    </main>
  );
}
