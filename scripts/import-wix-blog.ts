/**
 * Import the Wix blog into content/blog/<lang>/<slug>.md (+ images in public/blog/<slug>/).
 *
 *   npx tsx scripts/import-wix-blog.ts            # all posts from the Wix sitemap
 *   npx tsx scripts/import-wix-blog.ts --limit 3  # quick test on 3 posts
 *
 * Run it on a machine with normal internet access (it fetches www.televet.co and static.wixstatic.com).
 * Wix can change its HTML: BODY_SELECTORS lists the candidates, tried in order. After the first run,
 * open 2-3 generated .md files and compare them with the live article before importing everything.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const ORIGIN = "https://www.televet.co";
const BODY_SELECTORS = ['[data-hook="post-description"]', '[data-hook="post-content"]', "article", "main"];
const limit = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;

/** Old absolute links inside the articles → new URLs (adjust once the new pages exist). */
const LINK_MAP: Record<string, string> = {
  "/teleconsultation-veterinaire": "/fr/fr/veterinaire-en-ligne",
  "/veterinaire-a-domicile": "/fr/fr/veterinaire-a-domicile",
  "/veterinaire": "/fr/fr/pro",
  "/services-veterinaires-1-2": "/fr/fr/",
  "/blog": "/fr/fr/blog",
};

const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced" });
td.remove(["script", "style", "noscript", "button"]);

const get = async (url: string) => {
  const r = await fetch(url, { headers: { "user-agent": "televet-blog-migration/1.0" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r;
};

/** Wix serves resized variants; strip `/v1/fill/...` to get the original file. */
const originalImage = (u: string) => u.replace(/\/v1\/(fill|fit)\/[^/]+\/[^/]+$/, "").replace(/^\/\//, "https://");

function rewriteLink(href: string) {
  try {
    const u = new URL(href, ORIGIN);
    if (!/(^|\.)televet\.co$/.test(u.hostname)) return href;
    const p = decodeURIComponent(u.pathname).replace(/\/$/, "");
    const m = p.match(/^(\/it)?\/post\/(.+)$/);
    if (m) return `/${m[1] ? "it/it" : "fr/fr"}/blog/${m[2]}`;
    if (p.startsWith("/blog/categories/") || p.startsWith("/blog/tags/")) return "/fr/fr/blog";
    return LINK_MAP[p] ?? href;
  } catch { return href; }
}

async function main() {
  const sitemap = await (await get(`${ORIGIN}/blog-posts-sitemap.xml`)).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, limit);
  console.log(`${urls.length} posts in the sitemap`);
  const index: unknown[] = [];

  for (const url of urls) {
    const u = new URL(url);
    const lang = u.pathname.startsWith("/it/") ? "it" : "fr";
    const slug = decodeURIComponent(u.pathname.replace(/^\/(it\/)?post\//, ""));
    try {
      const $ = cheerio.load(await (await get(encodeURI(decodeURI(url)))).text());
      const meta = (n: string) => $(`meta[property="${n}"],meta[name="${n}"]`).attr("content") ?? "";
      const title = meta("og:title") || $("h1").first().text().trim();
      const description = meta("description") || meta("og:description");
      const published = meta("article:published_time");
      const modified = meta("article:modified_time") || published;
      const author = meta("article:author") || "Dr. Televet";
      const category = $('a[href*="/blog/categories/"]').first().text().trim();

      const sel = BODY_SELECTORS.find((s) => $(s).first().text().trim().length > 800);
      if (!sel) throw new Error("body not found — check BODY_SELECTORS");
      const body = $(sel).first();
      body.find("nav,header,footer,[data-hook*='share'],[data-hook*='comment'],[data-hook*='related'],[data-hook*='social']").remove();

      // images → local files
      const dir = path.join("public", "blog", slug);
      let n = 0;
      let cover = "";
      for (const img of body.find("img").toArray()) {
        const src = $(img).attr("src") || $(img).attr("data-src");
        if (!src) continue;
        const orig = originalImage(src);
        const ext = (orig.match(/\.(png|jpe?g|webp|avif|gif)(?:$|\?)/i)?.[1] ?? "jpg").toLowerCase();
        const file = `img-${++n}.${ext}`;
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, file), Buffer.from(await (await get(orig)).arrayBuffer()));
        $(img).attr("src", `/blog/${encodeURI(slug)}/${file}`);
        if (n === 1) cover = `/blog/${encodeURI(slug)}/${file}`;
        // Wix puts the keyword list in alt: keep a short readable alt instead
        const alt = ($(img).attr("alt") ?? "").trim();
        $(img).attr("alt", alt.length > 120 || alt.includes(",") ? title : alt);
      }
      body.find("a[href]").each((_, a) => { $(a).attr("href", rewriteLink($(a).attr("href")!)); });

      let md = td.turndown(body.html() ?? "");
      md = md.replace(/^# .*\n+/, "");               // title is rendered by the page
      const fm = ["---", `title: ${JSON.stringify(title)}`, `description: ${JSON.stringify(description)}`, `lang: ${lang}`, `slug: ${JSON.stringify(slug)}`,
        `published: ${published}`, `modified: ${modified}`, `author: ${JSON.stringify(author)}`, `category: ${JSON.stringify(category)}`,
        `cover: ${JSON.stringify(cover)}`, "---", ""].join("\n");
      await mkdir(path.join("content", "blog", lang), { recursive: true });
      await writeFile(path.join("content", "blog", lang, `${slug}.md`), fm + md + "\n");
      index.push({ slug, lang, title, published, words: md.split(/\s+/).length, images: n });
      console.log("ok  ", lang, slug.slice(0, 60), `(${n} img)`);
    } catch (e) { console.error("FAIL", url, (e as Error).message); }
  }
  await writeFile("content/blog/_import-report.json", JSON.stringify(index, null, 2));
}
main();
