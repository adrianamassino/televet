import { PRO_X } from "@/lib/pro-extra";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BellRing, Bird, Bone, Cat, CalendarCheck, CreditCard, Dog, HeartPulse, PawPrint, Rabbit, Settings2, Stethoscope, Syringe, Video } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { PRO } from "@/lib/pro-copy";
import { breadcrumbLd, faqLd, ldJson, organizationLd, pageMetadata, SITE } from "@/lib/seo";

type P = { params: Promise<{ lang: string; country: string }> };
const ok = (lang: string, cc: string) => !!COUNTRIES[cc] && COUNTRIES[cc].languages.includes(lang);
const copy = (lang: string, country = "") => PRO[`${lang}-${country.toUpperCase()}`] ?? PRO[lang] ?? PRO.en;   // languages without a translation show English and are not indexed

/** Where "Create my profile" leads: the built-in sign-up page, unless PRO_SIGNUP_URL overrides it. */
const signupUrl = (lang: string, cc: string) => process.env.PRO_SIGNUP_URL?.replace("{lang}", lang).replace("{country}", cc.toLowerCase()) || `/${lang}/${cc.toLowerCase()}/pro/inscription`;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, country } = await params;
  const cc = country.toUpperCase();
  if (!ok(lang, cc)) return {};
  const t = copy(lang, country);
  return pageMetadata({ title: t.title, description: t.description, lang, country: cc, path: (l, c) => `/${l}/${c.toLowerCase()}/pro`, index: !!PRO[lang] });
}

export default async function ProPage({ params }: P) {
  const { lang, country } = await params;
  const cc = country.toUpperCase();
  if (!ok(lang, cc)) notFound();
  const t = copy(lang, country);
  const base = `${SITE}/${lang}/${country}`;
  const ld = [organizationLd(), faqLd([...t.faq, ...(PRO_X[`${lang}-${cc}`] ?? PRO_X[lang])?.moreFaq ?? []].map(([q, a]) => ({ q, a }))), breadcrumbLd([{ name: "Televet", url: `${base}/` }, { name: "Televet Pro", url: `${base}/pro` }])];
  const X = PRO_X[`${lang}-${cc}`] ?? PRO_X[lang];
  const cta = signupUrl(lang, cc);
  const icons = [[CalendarCheck, "t-sky"], [Settings2, "t-lilac"], [CreditCard, "t-mint"], [Video, "t-coral"], [BellRing, "t-sun"]] as const;
  return (
    <main className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <section className="hero-panel">
        <span className="float f1" aria-hidden><PawPrint /></span><span className="float f2" aria-hidden><Stethoscope /></span><span className="float f3" aria-hidden><HeartPulse /></span><span className="float f4" aria-hidden><Syringe /></span><span className="float f5" aria-hidden><Bone /></span>
        <div className="hero">
          <div>
            <h1>{t.h1}</h1>
            <p className="lead">{t.sub}</p>
            <p><a className="btn btn-sun btn-lg" href={cta}>{t.cta}</a><span className="note">{t.ctaNote}</span></p>
          </div>
          <figure style={{ margin: 0 }} aria-label={t.ticket.sample}>
            <div className="ticket">
              <div className="top"><div className="kind"><span>Televet</span><span>{t.ticket.kind}</span></div><div className="pet">Luna</div><div className="breed">Labrador</div></div>
              <div className="bot"><div className="when">{t.ticket.when}</div>
                <span className="status"><span className="chip wait s0">{t.ticket.s0}</span><span className="chip ok s1">{t.ticket.s1}</span></span>
                <div>{t.ticket.paid}</div><p className="sample">{t.ticket.sample}</p><span className="paw-dot" aria-hidden><PawPrint /></span></div>
            </div>
          </figure>
        </div>
      </section>

      <div className="pets"><span className="row-ico" aria-hidden><span className="ico t-sky"><Dog /></span><span className="ico t-coral"><Cat /></span><span className="ico t-mint"><Rabbit /></span><span className="ico t-sun"><Bird /></span></span><p>{t.pets}</p></div>

      <section aria-labelledby="b"><h2 id="b">{t.benefitsTitle}</h2>
        <ul className="facts">{t.benefits.map(([h, d], i) => { const [I, c] = icons[i] ?? icons[0]; return <li key={h}><span className={`ico ${c}`} aria-hidden><I /></span><h3>{h}</h3><p>{d}</p></li>; })}</ul></section>

      {X && <section aria-labelledby="mb"><h2 id="mb" className="sr-only">{t.benefitsTitle}</h2><ul className="facts">{X.moreBenefits.map(([h, d]) => <li key={h}><h3>{h}</h3><p>{d}</p></li>)}</ul><p className="free-note">{X.free}</p></section>}
      {X && <section aria-labelledby="df"><h2 id="df">{X.diffH}</h2><div className="pro-diff"><div><h3>{X.diffTa[0]}</h3><p>{X.diffTa[1]}</p></div><div><h3>{X.diffTc[0]}</h3><p>{X.diffTc[1]}</p></div></div></section>}
      {X && <section aria-labelledby="rg"><h2 id="rg">{X.regH}</h2><p>{X.regIntro}</p><div className="pro-diff"><ul className="pro-list">{X.regPts.map((x) => <li key={x}>{x}</li>)}</ul><ul className="pro-list">{X.regCond.map((x) => <li key={x}>{x}</li>)}</ul></div><p className="fineprint">{X.regNote}</p>
        <h3>{X.rxH}</h3><p>{X.rxP}</p><ul className="pro-list">{X.rxPts.map((x) => <li key={x}>{x}</li>)}</ul></section>}

      <section aria-labelledby="s"><h2 id="s">{t.stepsTitle}</h2><ol className="steps">{t.steps.map((x) => <li key={x}>{x}</li>)}</ol></section>

      <section aria-labelledby="f"><h2 id="f">{t.faqTitle}</h2>
        {[...t.faq, ...(X?.moreFaq ?? [])].map(([q, a]) => <details key={q} className="qa"><summary>{q}</summary><p>{a}</p></details>)}</section>

      <div className="band"><h2>{t.h1}</h2><a className="btn btn-lg" href={cta}>{t.cta}</a></div>
      <p className="fineprint">{t.legal}</p>
    </main>
  );
}
