/**
 * Vet clinics of other countries from OpenStreetMap (amenity=veterinary), saved to data/directory-<cc>.json.
 * Data © OpenStreetMap contributors (ODbL): the directory pages show the attribution.
 * When a clinic has no town in its tags, it gets the nearest town or village (within 15 km) from OpenStreetMap too.
 * Usage: npx tsx scripts/fetch-osm.ts IT ES AR
 */
import { mkdirSync, writeFileSync } from "fs";
import { slugForListing } from "../src/lib/directory";

type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function overpass(q: string): Promise<El[]> {
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(OVERPASS[i % OVERPASS.length], { method: "POST", body: new URLSearchParams({ data: q }), headers: { "user-agent": "Televet directory (contact@televet.co)" } });
      if (r.ok) {
        const j = (await r.json()) as { elements: El[]; remark?: string };
        if (!j.remark) return j.elements;
        console.log(`overpass incomplete (${j.remark.slice(0, 120)}), retry`); // a time-out returns partial data: never keep it
      }
      console.log(`overpass ${r.status}, retry`);
    } catch (e) { console.log(`overpass error ${(e as Error).message}, retry`); }
    await wait(10000 * (i + 1));
  }
  throw new Error("overpass unavailable");
}
const km = (a: [number, number], b: [number, number]) => {
  const dLat = (b[0] - a[0]) * Math.PI / 180, dLng = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
};

/** Big countries are fetched region by region (ISO 3166-2 codes): one query for all of France times out. */
const REGIONS: Record<string, string[]> = {
  FR: ["FR-ARA", "FR-BFC", "FR-BRE", "FR-CVL", "FR-20R", "FR-GES", "FR-HDF", "FR-IDF", "FR-NOR", "FR-NAQ", "FR-OCC", "FR-PDL", "FR-PAC", "FR-971", "FR-972", "FR-973", "FR-974", "FR-976"],
};
async function byArea(cc: string, what: string): Promise<El[]> {
  const parts = REGIONS[cc]?.map((r) => `area["ISO3166-2"="${r}"]->.a;`) ?? [`area["ISO3166-1"="${cc}"][admin_level=2]->.a;`];
  const seen = new Map<string, El>();
  for (const area of parts) {
    for (const e of await overpass(`[out:json][timeout:900][maxsize:1073741824];${area}${what}(area.a);out center tags;`)) seen.set(`${e.type}/${e.id}`, e);
    await wait(3000);
  }
  return [...seen.values()];
}

async function country(cc: string) {
  const vets = await byArea(cc, `nwr["amenity"="veterinary"]`);
  const towns = vets.some((e) => !e.tags?.["addr:city"])
    ? (await byArea(cc, `node["place"~"^(city|town|village)$"]["name"]`))
      .filter((p) => p.lat != null).map((p) => ({ name: p.tags!.name, at: [p.lat!, p.lon!] as [number, number], big: p.tags!.place !== "village" }))
    : [];
  console.log(`${cc}: ${vets.length} vet places, ${towns.length} towns`);
  const grid = new Map<string, typeof towns>(); // coarse grid: the nearest-town lookup stays fast
  for (const t of towns) { const k = `${Math.floor(t.at[0] * 5)}:${Math.floor(t.at[1] * 5)}`; if (!grid.has(k)) grid.set(k, []); grid.get(k)!.push(t); }
  const nearest = (p: [number, number]) => {
    let best: { name: string; d: number } | null = null;
    const gx = Math.floor(p[0] * 5), gy = Math.floor(p[1] * 5);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const t of grid.get(`${gx + i}:${gy + j}`) ?? []) {
      const d = km(p, t.at) - (t.big ? 1.5 : 0);
      if (!best || d < best.d) best = { name: t.name, d };
    }
    return best && best.d < 15 ? best.name : null;
  };
  const rows = vets.filter((e) => e.tags?.name && !/^(yes|vet|veterinary|veterinario|veterinaria)$/i.test(e.tags.name.trim())).map((e) => {
    const t = e.tags!, lat = e.lat ?? e.center?.lat ?? null, lng = e.lon ?? e.center?.lon ?? null;
    const city = t["addr:city"] ?? (lat != null && lng != null ? nearest([lat, lng]) : null);
    return {
      country: cc, name: t.name.trim(), address: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || null,
      postal_code: t["addr:postcode"] ?? null, city, lat, lng,
      phone: t.phone ?? t["contact:phone"] ?? null, website: t.website ?? t["contact:website"] ?? null,
      source: "osm", source_ref: `${e.type}/${e.id}`, slug: slugForListing(t.name, city, String(e.id)), last_checked_at: new Date().toISOString(),
    };
  });
  mkdirSync("data", { recursive: true });
  writeFileSync(`data/directory-${cc === "FR" ? "osm-fr" : cc.toLowerCase()}.json`, JSON.stringify(rows)); // France keeps its SIRENE file
  console.log(`${cc}: ${rows.length} clinics, ${rows.filter((r) => r.city).length} with a town, ${rows.filter((r) => r.address).length} with a street address`);
}

(async () => { for (const cc of process.argv.slice(2).map((x) => x.toUpperCase())) { await country(cc); await wait(5000); } })().catch((e) => { console.error(e); process.exit(1); });
