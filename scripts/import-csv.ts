/**
 * Imports clinics from any CSV file (a registry, an open-data portal, a licensed list, your own research) into directory_listings.
 * Only name + address data are stored (no phone numbers, no names of people).
 *
 *   npx tsx scripts/import-csv.ts <file.csv> <country ISO> <source label> [--dry]
 *   e.g. npx tsx scripts/import-csv.ts piemonte.csv IT regione-piemonte --dry
 *
 * Columns are recognised by header (any order, "," or ";" separated, UTF-8):
 *   name: name | nome | denominazione | ragione sociale | nom
 *   address: address | indirizzo | via | adresse
 *   postal code: postal_code | cap | code postal | cp
 *   city: city | comune | città | citta | ville | localidad
 *   optional: lat, lng (or lon), website | sito
 * Rows already in the directory (same country, same name, same postal code or same address) are skipped.
 * Make sure you have the right to reuse the data and keep the source label accurate: it identifies where every row came from.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { adminClient } from "../src/lib/supabase";
import { slugForListing } from "../src/lib/directory";

const norm = (x: string | null | undefined) => (x ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const ALIAS: Record<string, string[]> = {
  name: ["name", "nome", "denominazione", "ragione sociale", "nom", "nombre"], address: ["address", "indirizzo", "via", "adresse", "direccion"],
  postal_code: ["postal code", "postal_code", "cap", "code postal", "cp", "codigo postal"], city: ["city", "comune", "citta", "ville", "localidad", "localita"],
  lat: ["lat", "latitude", "latitudine"], lng: ["lng", "lon", "longitude", "longitudine"], website: ["website", "sito", "sito web", "site web", "url"],
};

function parseCsv(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0], delim = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === delim) { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur.replace(/\r$/, "")); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

async function main() {
  const [file, ccRaw, label] = process.argv.slice(2).filter((a) => !a.startsWith("--")), dry = process.argv.includes("--dry");
  const cc = (ccRaw ?? "").toUpperCase();
  if (!file || !/^[A-Z]{2}$/.test(cc) || !label) throw new Error("usage: import-csv.ts <file.csv> <country ISO> <source label> [--dry]");
  const [head, ...body] = parseCsv(readFileSync(file, "utf8").replace(/^﻿/, ""));
  const col: Record<string, number> = {};
  for (const [k, names] of Object.entries(ALIAS)) { const i = head.findIndex((h) => names.includes(norm(h))); if (i >= 0) col[k] = i; }
  if (col.name === undefined) throw new Error(`no name column found in header: ${head.join(" | ")}`);
  const get = (r: string[], k: string) => (col[k] === undefined ? null : r[col[k]]?.trim() || null);

  const db = adminClient(), seen = new Set<string>();
  const { data: existing } = await db.from("directory_listings").select("name, address, postal_code").eq("country", cc).limit(100000);
  for (const e of existing ?? []) { seen.add(`${norm(e.name)}|${norm(e.postal_code)}`); if (e.address) seen.add(`${norm(e.name)}|${norm(e.address)}`); }

  const rows = []; let dup = 0;
  for (const r of body) {
    const name = get(r, "name"); if (!name) continue;
    const address = get(r, "address"), postal = get(r, "postal_code"), city = get(r, "city");
    const k1 = `${norm(name)}|${norm(postal)}`, k2 = address ? `${norm(name)}|${norm(address)}` : "";
    if ((postal && seen.has(k1)) || (k2 && seen.has(k2))) { dup++; continue; }
    seen.add(k1); if (k2) seen.add(k2);
    const ref = `${label}:${createHash("sha1").update(`${norm(name)}|${norm(address)}|${norm(postal)}`).digest("hex").slice(0, 16)}`;
    const lat = Number(get(r, "lat")?.replace(",", ".")), lng = Number(get(r, "lng")?.replace(",", "."));
    rows.push({ country: cc, name, address, postal_code: postal, city, lat: Number.isFinite(lat) && lat ? lat : null, lng: Number.isFinite(lng) && lng ? lng : null,
      website: get(r, "website"), source: "other", source_ref: ref, slug: slugForListing(name, city, ref.slice(-8)) });
  }
  console.log(`${body.length} rows read, ${dup} duplicates skipped (already in the directory or repeated in the file), ${rows.length} new${dry ? " (dry run: nothing written)" : ""}`);
  if (dry) { console.table(rows.slice(0, 8).map(({ name, address, postal_code, city }) => ({ name, address, postal_code, city }))); return; }
  for (let i = 0; i < rows.length; i += 500) { const { error } = await db.from("directory_listings").upsert(rows.slice(i, i + 500), { onConflict: "source,source_ref" }); if (error) throw error; }
  console.log("done");
}
main().catch((e) => { console.error(e); process.exit(1); });
