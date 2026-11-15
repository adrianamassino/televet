/**
 * Google Places API (New) — used only to VALIDATE a clinic during a claim (does it exist, is it
 * operational, which website does its Google Business Profile show). Google's terms do not allow
 * building our directory from Places data or storing it: we keep only the place_id.
 */
const BASE = "https://places.googleapis.com/v1";
const FIELDS = "id,displayName,formattedAddress,websiteUri,businessStatus,types";

export interface GPlace { id: string; name: string; address: string; website: string | null; operational: boolean; isVet: boolean }

function key() {
  const k = process.env.GOOGLE_MAPS_API_KEY;
  if (!k) throw new Error("GOOGLE_MAPS_API_KEY missing");
  return k;
}

export function toPlace(p: { id: string; displayName?: { text?: string }; formattedAddress?: string; websiteUri?: string; businessStatus?: string; types?: string[] }): GPlace {
  return { id: p.id, name: p.displayName?.text ?? "", address: p.formattedAddress ?? "", website: p.websiteUri ?? null, operational: p.businessStatus === "OPERATIONAL", isVet: (p.types ?? []).includes("veterinary_care") };
}

/** Finds the clinic's Google profile from the directory data (name + address). */
export async function findVetPlace(text: string, regionCode: string): Promise<GPlace | null> {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": key(), "X-Goog-FieldMask": FIELDS.split(",").map((f) => `places.${f}`).join(",") },
    body: JSON.stringify({ textQuery: text, regionCode, includedType: "veterinary_care", pageSize: 1 }),
  });
  if (!res.ok) throw new Error(`Places ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { places?: Parameters<typeof toPlace>[0][] };
  return data.places?.[0] ? toPlace(data.places[0]) : null;
}

export async function getPlace(placeId: string): Promise<GPlace | null> {
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, { headers: { "X-Goog-Api-Key": key(), "X-Goog-FieldMask": FIELDS } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Places ${res.status}: ${await res.text()}`);
  return toPlace(await res.json());
}
