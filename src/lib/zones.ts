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
  practitioner_id?: string | null;
  /** Address the radius is measured from, as the vet typed it. Private: clients only ever see `coarsePlace(label)`. */
  label?: string | null;
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

const normPostal = (v: string) => v.toUpperCase().replace(/[\s-]/g, "");

/**
 * Turns what a vet typed ("20121, 20122 201* 20140-20149") into a clean list of postal-code patterns.
 * A pattern is a full code, a group ending with * (every code starting with those characters) or a range of numeric codes.
 */
export function parsePostalList(text: string | string[]): string[] {
  const raw = Array.isArray(text) ? text : String(text ?? "").split(/[,;\n\t ]+/);
  const out: string[] = [];
  for (const piece of raw) {
    const v = String(piece ?? "").trim().toUpperCase().replace(/\*+/g, "*");
    if (!/^[A-Z0-9][A-Z0-9-]{0,11}\*?$/.test(v) || /^-|-$|--/.test(v.replace("*", ""))) continue;
    if (!out.includes(v)) out.push(v);
  }
  return out.slice(0, 400);
}

/** Does the postal code found in a client's address belong to the vet's list? */
export function postalMatches(code: string | null | undefined, patterns: string[]): boolean {
  if (!code) return false;
  const c = normPostal(code);
  if (!c) return false;
  return patterns.some((raw) => {
    const p = String(raw ?? "").trim().toUpperCase();
    if (p.endsWith("*")) { const pre = normPostal(p.slice(0, -1)); return pre.length > 0 && c.startsWith(pre); }
    const range = /^(\d+)-(\d+)$/.exec(p);
    if (range && range[1].length === range[2].length && range[1].length >= 4) { // 20121-20162 (a Polish "00-001" is one code, not a range)
      return /^\d+$/.test(c) && c.length === range[1].length && Number(c) >= Number(range[1]) && Number(c) <= Number(range[2]);
    }
    const n = normPostal(p);
    // where only the first part of a code can be read from an address (Portugal 1000-001, Brazil 01310-100) a full code entered by the vet still matches
    return n === c || (n.length > c.length && n.startsWith(c) && /^\d+$/.test(n));
  });
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
    if (z.weekdays?.length && !z.weekdays.includes(input.weekday)) return false; // no days listed = every day
    if (z.mode === "postal") return postalMatches(input.postalCode, z.postal_codes);
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

/** Like geocode, plus the postal code of the place when the provider knows it (used when the client did not type one). */
export async function locate(address: string, country: string): Promise<{ lat: number; lng: number; postcode: string | null } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    const { searchPlaces } = await import("./places");
    const first = (await searchPlaces(address, country, "en"))[0];
    return first ? { lat: first.lat, lng: first.lng, postcode: first.postcode ?? null } : null;
  }
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("components", `country:${country}`);
  url.searchParams.set("key", key);
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: { geometry: { location: { lat: number; lng: number } }; address_components?: { short_name: string; types: string[] }[] }[] };
  const r = json.results?.[0];
  return r ? { ...r.geometry.location, postcode: r.address_components?.find((c) => c.types.includes("postal_code"))?.short_name ?? null } : null;
}

// ---------------------------------------------------------------------------------------------------------------------
// What a vet edits ("where I travel"), kept deliberately simple: one main zone and, if wanted, a wider one with a surcharge.

export type ZoneForm =
  | { mode: "radius"; label: string; lat: number; lng: number; km: number; extended: { km: number; feeCents: number } | null }
  | { mode: "postal"; codes: string[]; extended: { codes: string[]; feeCents: number } | null };

export const ZONE_KM_MAX = 150, ZONE_FEE_MAX = 50000;
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);

/** Checks and tidies a zone sent by the dashboard or the app. Returns null when it cannot be used (missing place, no code, absurd numbers). */
export function cleanZoneForm(input: unknown): ZoneForm | null {
  const z = (input ?? {}) as Record<string, unknown>, ext = (z.extended ?? null) as Record<string, unknown> | null;
  const fee = ext ? Math.round(num(ext.feeCents)) : NaN, feeOk = Number.isFinite(fee) && fee > 0 && fee <= ZONE_FEE_MAX;
  if (z.mode === "radius") {
    const lat = num(z.lat), lng = num(z.lng), km = Math.round(num(z.km) * 10) / 10;
    if (!(Math.abs(lat) <= 90) || !(Math.abs(lng) <= 180) || (lat === 0 && lng === 0) || !(km >= 1 && km <= ZONE_KM_MAX)) return null;
    const km2 = ext ? Math.round(num(ext.km) * 10) / 10 : NaN;
    return { mode: "radius", label: String(z.label ?? "").trim().slice(0, 200), lat, lng, km,
      extended: feeOk && km2 > km && km2 <= ZONE_KM_MAX * 2 ? { km: km2, feeCents: fee } : null };
  }
  if (z.mode === "postal") {
    const codes = parsePostalList((z.codes ?? []) as string | string[]);
    if (!codes.length) return null;
    const more = ext ? parsePostalList((ext.codes ?? []) as string | string[]).filter((c) => !codes.includes(c)) : [];
    return { mode: "postal", codes, extended: feeOk && more.length ? { codes: more, feeCents: fee } : null };
  }
  return null;
}

type ZoneRow = Pick<ServiceZone, "mode" | "postal_codes" | "center_lat" | "center_lng" | "radius_km" | "extra_fee_cents" | "label">;

/** Rows to store for a form: the main zone first, then the wider one with its surcharge. */
export function zoneRows(form: ZoneForm): ZoneRow[] {
  if (form.mode === "radius") {
    const base = { mode: "radius" as const, postal_codes: [], center_lat: form.lat, center_lng: form.lng, label: form.label || null };
    return [{ ...base, radius_km: form.km, extra_fee_cents: 0 }, ...(form.extended ? [{ ...base, radius_km: form.extended.km, extra_fee_cents: form.extended.feeCents }] : [])];
  }
  const base = { mode: "postal" as const, center_lat: null, center_lng: null, radius_km: null, label: null };
  return [{ ...base, postal_codes: form.codes, extra_fee_cents: 0 }, ...(form.extended ? [{ ...base, postal_codes: form.extended.codes, extra_fee_cents: form.extended.feeCents }] : [])];
}

/** The reverse: stored rows of one vet → the form. Drawn areas (polygons) from the old app have no form and are left alone. */
export function zoneFormFromRows(rows: ZoneRow[]): ZoneForm | null {
  const usable = rows.filter((r) => r.mode === "radius" || r.mode === "postal")
    .sort((a, b) => a.extra_fee_cents - b.extra_fee_cents || Number(a.radius_km ?? 0) - Number(b.radius_km ?? 0));
  const main = usable[0];
  if (!main) return null;
  const wider = usable.find((r) => r !== main && r.mode === main.mode && r.extra_fee_cents > 0);
  if (main.mode === "radius") {
    if (main.center_lat == null || main.center_lng == null || main.radius_km == null) return null;
    return { mode: "radius", label: main.label ?? "", lat: main.center_lat, lng: main.center_lng, km: Number(main.radius_km),
      extended: wider?.radius_km != null && Number(wider.radius_km) > Number(main.radius_km) ? { km: Number(wider.radius_km), feeCents: wider.extra_fee_cents } : null };
  }
  return { mode: "postal", codes: main.postal_codes ?? [], extended: wider?.postal_codes?.length ? { codes: wider.postal_codes, feeCents: wider.extra_fee_cents } : null };
}

/** "Via Roma 12, 20121 Milano" → "20121 Milano": what clients may see of the place a vet starts from. Never the street. */
export function coarsePlace(label: string | null | undefined): string {
  const parts = String(label ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) return "";                       // a single piece could be the street itself: show nothing
  return parts[parts.length - 1].slice(0, 60);
}

/** What clients are told about where a vet travels (no street, no coordinates). */
export interface ZoneSummary { mode: "radius" | "postal"; km?: number; place?: string; codes?: string[]; extended?: { km?: number; codes?: string[]; feeCents: number } }
export function zoneSummary(form: ZoneForm | null): ZoneSummary | null {
  if (!form) return null;
  if (form.mode === "radius") return { mode: "radius", km: form.km, place: coarsePlace(form.label) || undefined, ...(form.extended ? { extended: { km: form.extended.km, feeCents: form.extended.feeCents } } : {}) };
  return { mode: "postal", codes: form.codes.slice(0, 40), ...(form.extended ? { extended: { codes: form.extended.codes.slice(0, 40), feeCents: form.extended.feeCents } } : {}) };
}
