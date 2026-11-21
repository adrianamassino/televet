import type { SupabaseClient } from "@supabase/supabase-js";
import { searchPlaces } from "./places";
import { slugify } from "./seo";

/**
 * Keeps the SEO entities in step with what clinics enter: each clinic has a primary location matching its address,
 * located on the map and attached to a city (created the first time a clinic of that city appears); each vet is linked
 * to it. Nothing is invented: the city comes from the address the clinic typed, located by the map service.
 */
export async function ensureCity(db: SupabaseClient, country: string, name: string, lat?: number | null, lng?: number | null, region?: string | null): Promise<string | null> {
  const slug = slugify(name);
  if (!slug) return null;
  const { data: found } = await db.from("cities").select("id").eq("country", country).eq("slug", slug).maybeSingle();
  if (found) return found.id;
  const { data, error } = await db.from("cities").insert({ country, slug, name: name.trim(), lat: lat ?? null, lng: lng ?? null, region: region ?? null }).select("id").single();
  if (error) return (await db.from("cities").select("id").eq("country", country).eq("slug", slug).maybeSingle()).data?.id ?? null; // created at the same moment by another call
  return data.id;
}

export async function syncPractice(db: SupabaseClient, practiceId: string): Promise<"ok" | "no_address" | "not_found" | "not_located"> {
  const { data: p } = await db.from("practices").select("id, country, address, postal_code, city").eq("id", practiceId).maybeSingle();
  if (!p) return "not_found";
  let { data: loc } = await db.from("practice_locations").select("id, address, postal_code, city_id, lat").eq("practice_id", p.id).eq("is_primary", true).maybeSingle();
  if (!loc) loc = (await db.from("practice_locations").insert({ practice_id: p.id, slug: "main", address: p.address, postal_code: p.postal_code, is_primary: true }).select("id, address, postal_code, city_id, lat").single()).data;
  if (!loc) return "not_found";
  const moved = loc.address !== p.address || loc.postal_code !== p.postal_code;
  const { data: vets } = await db.from("practitioners").select("id").eq("practice_id", p.id);
  if (vets?.length) await db.from("practitioner_affiliations").upsert(vets.map((v) => ({ practitioner_id: v.id, location_id: loc!.id })), { onConflict: "practitioner_id,location_id", ignoreDuplicates: true });
  if (!p.address && !p.postal_code) return "no_address";
  if (!moved && loc.city_id && loc.lat != null) return "ok";
  const query = [p.address, p.postal_code, p.city].filter(Boolean).join(", ");
  const place = (await searchPlaces(query, p.country, "en").catch(() => []))[0];
  const cityName = p.city?.trim() || place?.city;
  const cityId = cityName ? await ensureCity(db, p.country, cityName, place?.lat, place?.lng) : null;
  await db.from("practice_locations").update({ address: p.address, postal_code: p.postal_code, lat: place?.lat ?? null, lng: place?.lng ?? null, city_id: cityId, verified_at: place ? new Date().toISOString() : null }).eq("id", loc.id);
  if (cityName && !p.city) await db.from("practices").update({ city: cityName }).eq("id", p.id); // the clinic's page and city pages use it
  return place || cityId ? "ok" : "not_located";
}

/** Directory entries get their city id from the city name they already carry. */
export async function syncDirectory(db: SupabaseClient, limit = 500): Promise<number> {
  const { data } = await db.from("directory_listings").select("id, country, city").is("city_id", null).not("city", "is", null).neq("status", "removed").limit(limit);
  let n = 0;
  for (const x of data ?? []) {
    const id = await ensureCity(db, x.country, x.city!);
    if (id) { await db.from("directory_listings").update({ city_id: id }).eq("id", x.id); n++; }
  }
  return n;
}
