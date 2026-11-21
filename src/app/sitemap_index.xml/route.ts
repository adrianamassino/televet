import { indexXml } from "@/lib/sitemap";
import { sitemapFiles } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
/** /sitemap_index.xml — lists every sitemap file that has at least one page (one per site version and kind of page). */
export async function GET() {
  return new Response(indexXml(new Map(await sitemapFiles())), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=1800" } });
}
