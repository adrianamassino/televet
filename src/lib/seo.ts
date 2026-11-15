import type { Metadata } from "next";
import { COUNTRIES } from "./countries";

export const SITE = process.env.APP_URL || "https://televet.co";

export const SERVICE_SLUGS: Record<"home" | "video" | "clinic", Record<string, string>> = {
  home: { fr: "veterinaire-a-domicile", it: "veterinario-a-domicilio", en: "home-visit-vet", es: "veterinario-a-domicilio", pt: "veterinario-ao-domicilio", de: "tierarzt-hausbesuch", pl: "weterynarz-z-dojazdem", nl: "dierenarts-aan-huis" },
  video: { fr: "veterinaire-en-ligne", it: "veterinario-online", en: "online-vet", es: "veterinario-online", pt: "veterinario-online", de: "online-tierarzt", pl: "weterynarz-online", nl: "online-dierenarts" },
  clinic: { fr: "clinique-veterinaire", it: "clinica-veterinaria", en: "vet-clinic", es: "clinica-veterinaria", pt: "clinica-veterinaria", de: "tierarztpraxis", pl: "klinika-weterynaryjna", nl: "dierenartspraktijk" },
};

export function serviceFromSlug(lang: string, slug: string) {
  return (Object.keys(SERVICE_SLUGS) as ("home" | "video" | "clinic")[]).find((k) => SERVICE_SLUGS[k][lang] === slug);
}

export const slugify = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** All published locale combinations as hreflang codes (e.g. "fr-FR", "es-AR"). */
export function localeCombos(onlyCountry?: string) {
  return Object.values(COUNTRIES)
    .filter((c) => !onlyCountry || c.code === onlyCountry)
    .flatMap((c) => c.languages.map((l) => ({ lang: l, country: c.code, hreflang: `${l}-${c.code}` })));
}

/** canonical + hreflang alternates (+ x-default) for a page available in every locale. */
export function alternates(lang: string, country: string, pathFor: (lang: string, country: string) => string, onlyCountry?: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const c of localeCombos(onlyCountry)) languages[c.hreflang] = `${SITE}${pathFor(c.lang, c.country)}`;
  languages["x-default"] = `${SITE}${pathFor("fr", "FR")}`;
  return { canonical: `${SITE}${pathFor(lang, country)}`, languages };
}

export function pageMetadata(p: { title: string; description: string; lang: string; country: string; path: (l: string, c: string) => string; image?: string; onlyCountry?: string; index?: boolean }): Metadata {
  const url = `${SITE}${p.path(p.lang, p.country)}`;
  return {
    title: p.title,
    description: p.description,
    alternates: alternates(p.lang, p.country, p.path, p.onlyCountry),
    robots: p.index === false ? { index: false, follow: false } : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: { title: p.title, description: p.description, url, siteName: "Televet", locale: `${p.lang}_${p.country}`, type: "website", images: [{ url: p.image ?? `${SITE}/og/televet-${p.lang}.jpg`, width: 1200, height: 630, alt: p.title }] },
    twitter: { card: "summary_large_image", title: p.title, description: p.description },
  };
}

// ---------------------------------------------------------------- JSON-LD
export const organizationLd = () => ({
  "@context": "https://schema.org", "@type": "Organization", name: "Televet", url: SITE, logo: `${SITE}/logo.png`, email: "contact@televet.co",
  address: { "@type": "PostalAddress", streetAddress: "Station F", postalCode: "75013", addressLocality: "Paris", addressCountry: "FR" },
  sameAs: ["https://www.facebook.com/televet.co/", "https://www.linkedin.com/company/televetfrance", "https://www.instagram.com/televet.co/"],
});

export const faqLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: items.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
});

export const breadcrumbLd = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: x.url })),
});

export const veterinaryCareLd = (p: { name: string; url: string; description?: string; address?: string; postalCode?: string; city?: string; country: string; phone?: string; languages?: string[]; image?: string; zones?: string[] }) => ({
  "@context": "https://schema.org", "@type": "VeterinaryCare", name: p.name, url: p.url, description: p.description, image: p.image, telephone: p.phone,
  address: p.address ? { "@type": "PostalAddress", streetAddress: p.address, postalCode: p.postalCode, addressLocality: p.city, addressCountry: p.country } : undefined,
  knowsLanguage: p.languages, areaServed: p.zones?.map((z) => ({ "@type": "PostalCodeRangeSpecification", postalCodeBegin: z, postalCodeEnd: z })),
});

/** Safe JSON-LD for a <script type="application/ld+json"> (escapes "<"). */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
