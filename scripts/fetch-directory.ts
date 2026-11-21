/**
 * Downloads every active veterinary establishment in France from the public company search (SIRENE open data)
 * and writes them to data/directory-fr.json, ready to load into the directory. Run by the GitHub workflow
 * "Fetch directory data" (the site itself is not needed). Usage: npx tsx scripts/fetch-directory.ts [deps…]
 */
import { mkdirSync, writeFileSync } from "fs";
import { DEPARTMENTS, rowsFromCompany, searchUrl, type ApiCompany } from "../src/lib/directory-import";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function get(url: string): Promise<{ results?: ApiCompany[]; total_pages?: number }> {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { headers: { accept: "application/json", "user-agent": "Televet directory (contact@televet.co)" } });
    if (r.ok) return r.json();
    if (r.status === 429 || r.status >= 500) { await wait(1500 * (i + 1)); continue; }
    throw new Error(`${r.status} ${url}`);
  }
  throw new Error(`gave up ${url}`);
}

async function main() {
  const deps = process.argv.slice(2).length ? process.argv.slice(2) : DEPARTMENTS;
  const all = new Map<string, Record<string, unknown>>();
  for (const d of deps) {
    let page = 1, total = 1, n = 0;
    do {
      const j = await get(searchUrl(d, page));
      total = Math.min(j.total_pages ?? 1, 400);
      for (const r of (j.results ?? []).flatMap(rowsFromCompany)) { all.set(String(r.source_ref), r); n++; }
      page++;
      await wait(180); // the public API allows about 7 calls per second
    } while (page <= total);
    console.log(`dep ${d}: ${n} establishments (${total} pages)`);
  }
  mkdirSync("data", { recursive: true });
  writeFileSync("data/directory-fr.json", JSON.stringify([...all.values()]));
  console.log(`total ${all.size}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
