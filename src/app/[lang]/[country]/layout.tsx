import { ShapeDefs } from "@/components/ShapeDefs";
import type { ReactNode } from "react";
import { brazilian } from "@/lib/brazilian";
import { pick } from "@/lib/pick";
import { LEGAL_LABEL, MENU } from "@/lib/site-copy";

const NAV: Record<string, { vets: string; faq: string; blog: string; contact: string; rights: string; dir: string }> = {
  fr: { dir: "Annuaire", vets: "Espace vétérinaires", faq: "Questions fréquentes", blog: "Blog", contact: "Nous écrire", rights: "Des vétérinaires, à portée de visio." },
  it: { dir: "Elenco", vets: "Area veterinari", faq: "Domande frequenti", blog: "Blog", contact: "Scrivici", rights: "Veterinari a portata di video." },
  en: { dir: "Directory", vets: "For vets", faq: "FAQ", blog: "Blog", contact: "Contact us", rights: "Vets, one video call away." },
  es: { dir: "Directorio", vets: "Espacio veterinarios", faq: "Preguntas frecuentes", blog: "Blog", contact: "Escríbenos", rights: "Veterinarios a una videollamada." },
  pt: { dir: "Diretório", vets: "Área veterinários", faq: "Perguntas frequentes", blog: "Blog", contact: "Escreva-nos", rights: "Veterinários a uma videochamada." },
  de: { dir: "Verzeichnis", vets: "Für Tierärzte", faq: "Häufige Fragen", blog: "Blog", contact: "Kontakt", rights: "Tierärzte, ein Videoanruf entfernt." },
  pl: { dir: "Katalog", vets: "Strefa weterynarza", faq: "Pytania i odpowiedzi", blog: "Blog", contact: "Napisz do nas", rights: "Weterynarz na wyciągnięcie wideorozmowy." },
  nl: { dir: "Gids", vets: "Voor dierenartsen", faq: "Veelgestelde vragen", blog: "Blog", contact: "Contact", rights: "Dierenartsen, een videogesprek verderop." },
};

NAV["pt-BR"] = brazilian(NAV.pt);

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string; country: string }> }) {
  const { lang, country } = await params;
  const t = pick(NAV, lang, country), m = pick(MENU, lang, country), lg = pick(LEGAL_LABEL, lang, country), base = `/${lang}/${country}`;
  return (
    <>
      <ShapeDefs />
      <header className="site-header"><div className="in">
        <a className="brand" href={`${base}/`} aria-label="Televet"><img src="/logo.svg" alt="Televet" height={34} style={{ height: 34, width: "auto" }} /></a>
        <nav className="site-nav" aria-label="Main">
          <a href={`${base}/#services`}>{m.services}</a><a href={`${base}/pricing`}>{m.pricing}</a><a href={`${base}/#about-h`}>{m.about}</a><a href={`${base}/contact`}>{m.contact}</a><a href={`${base}/pro`}>{t.vets}</a><a className="cta" href={`${base}/recherche`}>{m.book}</a>
        </nav></div></header>
      {children}
      <footer className="site-footer"><div className="in"><span><img src="/logo-white.svg" alt="" height={26} style={{ height: 26, width: "auto", display: "block", marginBottom: 6 }} />{t.rights}</span>
        <nav className="foot-links" aria-label="Footer"><a href={`${base}/annuaire`}>{t.dir}</a><a href={`${base}/blog`}>{t.blog}</a><a href={`${base}/faq`}>{t.faq}</a><a href={`${base}/compte`}>{({ fr: "Mon compte", it: "Account", es: "Mi cuenta" } as Record<string, string>)[lang] ?? "Account"}</a><a href={`${base}/legal/privacy`}>{lg.privacy}</a><a href={`${base}/legal/terms`}>{lg.terms}</a><a href={`${base}/legal/medical`}>{lg.medical}</a></nav>
        <span><a href="mailto:contact@televet.co">{t.contact}</a> · televet.co</span></div></footer>
    </>
  );
}
