import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";
import { PRO } from "@/lib/pro-copy";
import { breadcrumbLd, faqLd, ldJson, organizationLd, pageMetadata, SITE } from "@/lib/seo";

type P = { params: Promise<{ lang: string; country: string }> };
const ok = (lang: string, cc: string) => !!COUNTRIES[cc] && COUNTRIES[cc].languages.includes(lang);
const copy = (lang: string) => PRO[lang] ?? PRO.en;   // languages without a translation show English and are not indexed

/** Where the "Create my profile" button leads. Set PRO_SIGNUP_URL once the new sign-up flow (or the current app) is live. */
const signupUrl = (lang: string, cc: string) => process.env.PRO_SIGNUP_URL?.replace("{lang}", lang).replace("{country}", cc.toLowerCase()) || "mailto:contact@televet.co?subject=Televet%20Pro";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params;
  const cc = country.toUpperCase();
  if (!ok(lang, cc)) return {};
  const t = copy(lang);
  return pageMetadata({ title: t.title, description: t.description, lang, country: cc, path: (l, c) => `/${l}/${c.toLowerCase()}/pro`, index: !!PRO[lang] });
}

export default async function ProPage({ params }: P) {
  const { lang, country } = await params;
  const cc = country.toUpperCase();
  if (!ok(lang, cc)) notFound();
  const t = copy(lang);
  const base = `${SITE}/${lang}/${country}`;
  const ld = [organizationLd(), faqLd(t.faq.map(([q, a]) => ({ q, a }))), breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: "Televet Pro", url: `${base}/pro` }])];
  const cta = signupUrl(lang, cc);
  const btn = { display: "inline-block", background: "#0b3bbf", color: "#fff", fontWeight: 700, padding: "14px 22px", borderRadius: 10, textDecoration: "none" } as const;
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 64px", fontFamily: "system-ui", lineHeight: 1.6, color: "#14213d" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="breadcrumb"><a href={`/${lang}/${country}/`}>{t.home}</a></nav>
      <header style={{ margin: "32px 0" }}>
        <h1 style={{ fontSize: "clamp(28px,5vw,42px)", lineHeight: 1.15, margin: "0 0 12px" }}>{t.h1}</h1>
        <p style={{ fontSize: 18, margin: "0 0 20px" }}>{t.sub}</p>
        <a href={cta} style={btn}>{t.cta}</a> <small style={{ marginLeft: 8 }}>{t.ctaNote}</small>
      </header>
      <section aria-labelledby="b"><h2 id="b">{t.benefitsTitle}</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
          {t.benefits.map(([h, d]) => <li key={h} style={{ border: "1px solid #e3e8f4", borderRadius: 12, padding: 16 }}><h3 style={{ margin: "0 0 6px", fontSize: 17 }}>{h}</h3><p style={{ margin: 0 }}>{d}</p></li>)}
        </ul></section>
      <section aria-labelledby="s"><h2 id="s">{t.stepsTitle}</h2><ol>{t.steps.map((x) => <li key={x} style={{ margin: "8px 0" }}>{x}</li>)}</ol>
        <p><a href={cta} style={btn}>{t.cta}</a></p></section>
      <section aria-labelledby="f"><h2 id="f">{t.faqTitle}</h2>
        {t.faq.map(([q, a]) => <details key={q} style={{ borderBottom: "1px solid #e3e8f4", padding: "10px 0" }}><summary style={{ cursor: "pointer", fontWeight: 600 }}>{q}</summary><p>{a}</p></details>)}</section>
      <p style={{ fontSize: 14, color: "#4a5568", marginTop: 32 }}>{t.legal}</p>
      <p><a href="mailto:contact@televet.co">{t.contact}</a></p>
    </main>
  );
}
