/**
 * Other countries: imports veterinary clinics from OpenStreetMap (tag amenity=veterinary) via the Overpass API.
 * Data © OpenStreetMap contributors, ODbL: show the attribution on the directory pages and keep the
 * imported database open under ODbL if it is redistributed.
 *   npx tsx scripts/import-osm.ts IT
 */
import { adminClient } from "../src/lib/supabase";
import { slugForListing } from "../src/lib/directory";

interface El { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }

async function main() {
  const cc = (process.argv[2] ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) throw new Error("usage: import-osm.ts <ISO country code>");
  const query = `[out:json][timeout:300];area["ISO3166-1"="${cc}"][admin_level=2]->.a;(nwr["amenity"="veterinary"](area.a););out center tags;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: query }), headers: { "user-agent": "Televet directory import (contact@televet.co)" } });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const { elements } = (await res.json()) as { elements: El[] };
  const rows = elements.filter((e) => e.tags?.name).map((e) => {
    const t = e.tags!, ref = `${e.type}/${e.id}`;
    return {
      country: cc, name: t.name, address: [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ") || null,
      postal_code: t["addr:postcode"] ?? null, city: t["addr:city"] ?? null,
      lat: e.lat ?? e.center?.lat ?? null, lng: e.lon ?? e.center?.lon ?? null,
      phone: t.phone ?? t["contact:phone"] ?? null, website: t.website ?? t["contact:website"] ?? null,
      source: "osm", source_ref: ref, slug: slugForListing(t.name, t["addr:city"] ?? null, String(e.id)),
    };
  });
  const db = adminClient();
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("directory_listings").upsert(rows.slice(i, i + 500), { onConflict: "source,source_ref" });
    if (error) throw error;
  }
  console.log(`${cc}: ${rows.length} clinics imported from OpenStreetMap`);
}
main().catch((e) => { console.error(e); process.exit(1); });
