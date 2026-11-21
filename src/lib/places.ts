/**
 * Free place search (autocomplete) based on OpenStreetMap data via Photon.
 * Public instance: https://photon.komoot.io (fair use, no key). For production traffic,
 * self-host Photon (open source) or set PHOTON_URL to a paid/hosted instance.
 */
export interface Place { label: string; street?: string; city?: string; postcode?: string; country: string; lat: number; lng: number }

const PHOTON_LANGS = new Set(["en", "de", "fr", "it"]);

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; street?: string; housenumber?: string; city?: string; district?: string; locality?: string; postcode?: string; countrycode?: string; state?: string };
}

export async function searchPlaces(q: string, country: string, lang: string, near?: { lat: number; lng: number }): Promise<Place[]> {
  const base = process.env.PHOTON_URL || "https://photon.komoot.io";
  const u = new URL("/api/", base);
  u.searchParams.set("q", q);
  u.searchParams.set("limit", "12");
  if (PHOTON_LANGS.has(lang)) u.searchParams.set("lang", lang);
  if (near) { u.searchParams.set("lat", String(near.lat)); u.searchParams.set("lon", String(near.lng)); }
  const res = await fetch(u, { headers: { "user-agent": "Televet/1.0 (contact@televet.co)" }, next: { revalidate: 86400 } } as RequestInit);
  if (!res.ok) return [];
  const json = (await res.json()) as { features: PhotonFeature[] };
  return json.features
    .filter((f) => (f.properties.countrycode || "").toUpperCase() === country.toUpperCase())
    .slice(0, 6)
    .map((f) => {
      const p = f.properties;
      const street = p.street ? `${p.housenumber ? p.housenumber + " " : ""}${p.street}` : undefined;
      const city = p.city || p.locality || p.district;
      const label = [street ?? p.name, [p.postcode, city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      return { label, street, city, postcode: p.postcode, country, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
    });
}

/** The address nearest to a point (used when a vet moves the centre of their area on the map). Null when nothing is found. */
export async function reversePlace(lat: number, lng: number, lang: string): Promise<Place | null> {
  const base = process.env.PHOTON_URL || "https://photon.komoot.io";
  const u = new URL("/reverse", base);
  u.searchParams.set("lat", String(lat)); u.searchParams.set("lon", String(lng));
  if (PHOTON_LANGS.has(lang)) u.searchParams.set("lang", lang);
  const res = await fetch(u, { headers: { "user-agent": "Televet/1.0 (contact@televet.co)" } });
  if (!res.ok) return null;
  const f = ((await res.json()) as { features?: PhotonFeature[] }).features?.[0];
  if (!f) return null;
  const p = f.properties;
  const street = p.street ? `${p.housenumber ? p.housenumber + " " : ""}${p.street}` : undefined;
  const city = p.city || p.locality || p.district;
  const label = [street ?? p.name, [p.postcode, city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return { label, street, city, postcode: p.postcode, country: (p.countrycode || "").toUpperCase(), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
}

