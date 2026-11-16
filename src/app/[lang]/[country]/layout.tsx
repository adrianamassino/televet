import type { ReactNode } from "react";

const NAV: Record<string, { vets: string; faq: string; blog: string; contact: string; rights: string }> = {
  fr: { vets: "Espace vétérinaires", faq: "Questions fréquentes", blog: "Blog", contact: "Nous écrire", rights: "Des vétérinaires, à portée de visio." },
  it: { vets: "Area veterinari", faq: "Domande frequenti", blog: "Blog", contact: "Scrivici", rights: "Veterinari a portata di video." },
  en: { vets: "For vets", faq: "FAQ", blog: "Blog", contact: "Contact us", rights: "Vets, one video call away." },
  es: { vets: "Espacio veterinarios", faq: "Preguntas frecuentes", blog: "Blog", contact: "Escríbenos", rights: "Veterinarios a una videollamada." },
  pt: { vets: "Área veterinários", faq: "Perguntas frequentes", blog: "Blog", contact: "Escreva-nos", rights: "Veterinários a uma videochamada." },
  de: { vets: "Für Tierärzte", faq: "Häufige Fragen", blog: "Blog", contact: "Kontakt", rights: "Tierärzte, ein Videoanruf entfernt." },
  pl: { vets: "Strefa weterynarza", faq: "Pytania i odpowiedzi", blog: "Blog", contact: "Napisz do nas", rights: "Weterynarz na wyciągnięcie wideorozmowy." },
  nl: { vets: "Voor dierenartsen", faq: "Veelgestelde vragen", blog: "Blog", contact: "Contact", rights: "Dierenartsen, een videogesprek verderop." },
};

/** Paw-in-heart mark, echoing the original Televet logo. */
const Mark = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 29C6 21.6 2 17.2 2 11.6 2 7.4 5.2 4.5 9 4.5c2.6 0 5 1.4 7 4 2-2.6 4.4-4 7-4 3.8 0 7 2.9 7 7.1 0 5.6-4 10-14 17.4Z" />
    <g fill="#fff"><circle cx="11.6" cy="12.2" r="1.7" /><circle cx="15" cy="9.9" r="1.7" /><circle cx="19" cy="9.9" r="1.7" /><circle cx="22.4" cy="12.2" r="1.7" /><path d="M16.9 13.4c2.4 0 4.6 2.4 4.6 4.5 0 1.7-1.5 2.1-2.5 1.8-.8-.2-1.3-.6-2.1-.6s-1.3.4-2.1.6c-1 .3-2.5-.1-2.5-1.8 0-2.1 2.2-4.5 4.6-4.5Z" /></g></svg>
);

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string; country: string }> }) {
  const { lang, country } = await params;
  const t = NAV[lang] ?? NAV.en, base = `/${lang}/${country}`;
  return (
    <>
      <header className="site-header"><div className="in">
        <a className="brand" href={`${base}/`} aria-label="Televet"><Mark />televet</a>
        <nav className="site-nav" aria-label="Main">
          <a href={`${base}/blog`}>{t.blog}</a><a href={`${base}/faq`}>{t.faq}</a><a className="pill" href={`${base}/pro`}>{t.vets}</a>
        </nav></div></header>
      {children}
      <footer className="site-footer"><div className="in"><span>{t.rights}</span><span><a href="mailto:contact@televet.co">{t.contact}</a> · televet.co</span></div></footer>
    </>
  );
}
