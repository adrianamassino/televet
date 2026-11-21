import { unstable_cache } from "next/cache";
import { adminClient } from "./supabase";
import { faqLanguages } from "./faq";
import { blogLanguages, listPosts } from "./blog";
import { buildEntries, splitFiles, type Entry, type SitemapData } from "./sitemap";

async function load(): Promise<SitemapData> {
  const db = adminClient();
  const [{ data: countries }, { data: practices }, dir] = await Promise.all([
    db.from("countries").select("code").eq("published", true),
    (async () => {
      const q = (cols: string) => db.from("practices").select(cols).eq("published", true).limit(50000);
      const r = await q("id, slug, country, city, updated_at, services(type, active), practitioners(slug, active, approved)");
      return r.error ? await q("id, slug, country, city, services(type, active), practitioners(slug, active, approved)") : r; // before migration 0017
    })(),
    db.from("directory_listings").select("country, city").neq("status", "removed").not("city", "is", null).limit(100000),
  ]);
  return {
    countries: (countries ?? []).map((c) => c.code),
    faqLangs: faqLanguages(),
    blog: blogLanguages().map((lang) => ({ lang, posts: listPosts(lang).map((p) => ({ slug: p.slug, modified: p.modified || p.published })) })),
    practices: (practices ?? []) as unknown as SitemapData["practices"],
    directoryCities: (dir.data ?? []) as SitemapData["directoryCities"],
  };
}

/** All sitemap files, rebuilt at most every 30 minutes (Google reads the index, then each file). */
export const sitemapFiles = unstable_cache(async (): Promise<[string, Entry[]][]> => [...splitFiles(buildEntries(await load())).entries()], ["sitemap-files"], { revalidate: 1800 });
