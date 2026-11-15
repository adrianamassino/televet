import { getCountry } from "./countries";

export interface ServiceZone {
  mode: "postal" | "radius" | "polygon";
  postal_codes: string[];
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  polygon: [number, number][] | null;
  extra_fee_cents: number;
  weekdays: number[];
}

export function extractPostalCode(address: string, country: string): string | null {
  const m = String(address || "").match(getCountry(country).postalPattern);
  return m ? m[1].toUpperCase() : null;
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pointInPolygon(lat: number, lng: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export interface ZoneMatch { covered: boolean; extraFeeCents: number }

/**
 * Checks whether an address is inside one of the practitioner's zones.
 * The main zone (extra_fee_cents = 0) wins over extended zones.
 */
export function matchZones(
  zones: ServiceZone[],
  input: { postalCode: string | null; lat: number | null; lng: number | null; weekday: number },
): ZoneMatch {
  const hits = zones.filter((z) => {
    if (!z.weekdays.includes(input.weekday)) return false;
    if (z.mode === "postal") return !!input.postalCode && z.postal_codes.map((p) => p.toUpperCase()).includes(input.postalCode);
    if (input.lat == null || input.lng == null) return false;
    if (z.mode === "radius") return z.center_lat != null && z.center_lng != null && z.radius_km != null &&
      haversineKm(z.center_lat, z.center_lng, input.lat, input.lng) <= Number(z.radius_km);
    return !!z.polygon && pointInPolygon(input.lat, input.lng, z.polygon);
  });
  if (!hits.length) return { covered: false, extraFeeCents: 0 };
  return { covered: true, extraFeeCents: Math.min(...hits.map((z) => z.extra_fee_cents)) };
}

/** Geocodes an address with Google Maps (server side). Returns null when not found. */
export async function geocode(address: string, country: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    // Free fallback: OpenStreetMap (Photon), no API key required.
    const { searchPlaces } = await import("./places");
    const first = (await searchPlaces(address, country, "en"))[0];
    return first ? { lat: first.lat, lng: first.lng } : null;
  }
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("components", `country:${country}`);
  url.searchParams.set("key", key);
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: { geometry: { location: { lat: number; lng: number } } }[] };
  return json.results?.[0]?.geometry.location ?? null;
}
