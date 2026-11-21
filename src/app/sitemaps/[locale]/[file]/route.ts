import { urlsetXml } from "@/lib/sitemap";
import { sitemapFiles } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
/** /sitemaps/fr-fr/clinics-1.xml — the pages of one kind for one site version, with their translations. */
export async function GET(_req: Request, ctx: { params: Promise<{ locale: string; file: string }> }) {
  const { locale, file } = await ctx.params;
  const key = `${locale}/${file.replace(/\.xml$/, "")}`;
  const entries = (await sitemapFiles()).find(([k]) => k === key)?.[1];
  if (!entries) return new Response("Not found", { status: 404 });
  return new Response(urlsetXml(entries), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=1800" } });
}
