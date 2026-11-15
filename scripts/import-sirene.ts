/**
 * France: imports every active veterinary establishment (NAF 75.00Z) from the INSEE SIRENE open data
 * (Licence Ouverte / Etalab). Download "StockEtablissement_utf8.csv" from data.gouv.fr (≈ several GB), then:
 *   npx tsx scripts/import-sirene.ts StockEtablissement_utf8.csv
 * Only establishments with statutDiffusionEtablissement = "O" are imported: partially diffusible entries
 * (individuals who opted out) must never be published.
 */
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { adminClient } from "../src/lib/supabase";
import { parseCsvLine, slugForListing } from "../src/lib/directory";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: import-sirene.ts <StockEtablissement_utf8.csv>");
  const rl = createInterface({ input: createReadStream(file, "utf8"), crlfDelay: Infinity });
  let header: string[] | null = null, batch: Record<string, unknown>[] = [], n = 0;
  const db = adminClient();
  const flush = async () => { if (!batch.length) return; const { error } = await db.from("directory_listings").upsert(batch, { onConflict: "source,source_ref", ignoreDuplicates: false }); if (error) throw error; n += batch.length; batch = []; console.log(`${n} imported`); };
  for await (const line of rl) {
    if (!header) { header = parseCsvLine(line); continue; }
    if (!line.includes("75.00Z")) continue; // fast pre-filter
    const r = Object.fromEntries(parseCsvLine(line).map((v, i) => [header![i], v]));
    if (r.activitePrincipaleEtablissement !== "75.00Z" || r.etatAdministratifEtablissement !== "A" || r.statutDiffusionEtablissement !== "O") continue;
    const name = r.enseigne1Etablissement || r.denominationUsuelleEtablissement;
    if (!name) continue; // no public trade name: skip rather than publish a person's name
    const address = [r.numeroVoieEtablissement, r.indiceRepetitionEtablissement, r.typeVoieEtablissement, r.libelleVoieEtablissement].filter(Boolean).join(" ");
    batch.push({ country: "FR", name, address, postal_code: r.codePostalEtablissement, city: r.libelleCommuneEtablissement, source: "sirene", source_ref: r.siret, slug: slugForListing(name, r.libelleCommuneEtablissement, r.siret) });
    if (batch.length >= 500) await flush();
  }
  await flush();
  console.log(`done: ${n} listings`);
}
main().catch((e) => { console.error(e); process.exit(1); });
