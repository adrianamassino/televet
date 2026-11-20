import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic"; // built on request (needs the database)
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { faqLanguages } from "@/lib/faq";
import { blogLanguages, listPosts } from "@/lib/blog";
import { SERVICE_SLUGS, SITE, slugify } from "@/lib/seo";

/** sitemap.xml with hreflang alternates: home, pro, FAQ, service×city pages and practice profiles. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [];
  const db = adminClient();
  const { data: countries } = await db.from("countries").select("code").eq("published", true);
  const live = new Set((countries ?? []).map((c) => c.code));
  const combos = Object.values(COUNTRIES).filter((c) => live.has(c.code)).flatMap((c) => c.languages.map((l) => ({ l, c: c.code.toLowerCase() })));
  const alt = (path: (l: string, c: string) => string, only?: (l: string) => boolean) =>
    Object.fromEntries(combos.filter((x) => !only || only(x.l)).map((x) => [`${x.l}-${x.c.toUpperCase()}`, `${SITE}${path(x.l, x.c)}`]));
  for (const x of combos) {
    out.push({ url: `${SITE}/${x.l}/${x.c}/`, changeFrequency: "daily", priority: 1, alternates: { languages: alt((l, c) => `/${l}/${c}/`) } });
    for (const pg of ["pricing", "contact"]) out.push({ url: `${SITE}/${x.l}/${x.c}/${pg}`, changeFrequency: "monthly", priority: 0.6, alternates: { languages: alt((l, c) => `/${l}/${c}/${pg}`) } });
    out.push({ url: `${SITE}/${x.l}/${x.c}/pro`, changeFrequency: "monthly", priority: 0.8, alternates: { languages: alt((l, c) => `/${l}/${c}/pro`) } });
    if (faqLanguages().includes(x.l)) out.push({ url: `${SITE}/${x.l}/${x.c}/faq`, changeFrequency: "monthly", priority: 0.7, alternates: { languages: alt((l, c) => `/${l}/${c}/faq`, (l) => faqLanguages().includes(l)) } });
  }
  for (const lang of blogLanguages()) {
    const posts = listPosts(lang);
    if (!posts.length) continue;
    out.push({ url: `${SITE}/${lang}/${lang}/blog`, changeFrequency: "weekly", priority: 0.6 });
    for (const p of posts) out.push({ url: `${SITE}/${lang}/${lang}/blog/${encodeURI(p.slug)}`, lastModified: p.modified || undefined, changeFrequency: "monthly", priority: 0.6 });
  }
  const { data: practices } = await db.from("practices").select("slug, country, postal_code, address, services(type, active)").eq("published", true);
  for (const p of practices ?? []) {
    const cc = String(p.country).toLowerCase();
    for (const l of COUNTRIES[p.country]?.languages ?? []) {
      out.push({ url: `${SITE}/${l}/${cc}/veterinaire/${p.slug}`, changeFrequency: "daily", priority: 0.9 });
      const city = slugify(String(p.postal_code ?? ""));
      for (const s of (p.services ?? []) as { type: "home" | "video" | "clinic"; active: boolean }[]) {
        if (!s.active || !(s.type in SERVICE_SLUGS) || (s.type !== "video" && !city)) continue;
        out.push({ url: `${SITE}/${l}/${cc}/${SERVICE_SLUGS[s.type][l]}/${s.type === "video" ? "" : city}`.replace(/\/$/, ""), changeFrequency: "daily", priority: 0.8 });
      }
    }
  }
  return Array.from(new Map(out.map((e) => [e.url, e])).values());
}
