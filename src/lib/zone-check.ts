import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPostalCode, locate, matchZones, zoneFormFromRows, zoneSummary, type ServiceZone, type ZoneSummary } from "./zones";
import { localDay } from "./time";

export interface AddressCheck { covered: boolean; extraFeeCents: number; postal: string | null; hasZone: boolean }

/** Zones that apply to the vets of a clinic. A vet's own zones win; zones set for the whole clinic apply to vets who have none. */
export async function zonesByVet(db: SupabaseClient, practiceId: string): Promise<(practitionerId: string) => ServiceZone[]> {
  const { data } = await db.from("service_zones").select("*").eq("practice_id", practiceId);
  const all = (data ?? []) as ServiceZone[];
  return (practitionerId) => { const own = all.filter((z) => z.practitioner_id === practitionerId); return own.length ? own : all.filter((z) => !z.practitioner_id); };
}

/** Is this address inside the area the vet travels to, and with which surcharge? Reads the postal code and, when needed, locates the address. */
export async function checkAddress(db: SupabaseClient, practice: { id: string; country: string; timezone: string }, practitionerId: string, address: string, at = new Date()): Promise<AddressCheck> {
  const zones = (await zonesByVet(db, practice.id))(practitionerId);
  let postal = extractPostalCode(address, practice.country);
  if (!zones.length) return { covered: false, extraFeeCents: 0, postal, hasZone: false };
  const needsPoint = zones.some((z) => z.mode !== "postal");
  const geo = needsPoint || !postal ? await locate(address, practice.country).catch(() => null) : null;
  if (!postal && geo?.postcode) postal = extractPostalCode(geo.postcode, practice.country) ?? geo.postcode.toUpperCase();
  const m = matchZones(zones, { postalCode: postal, lat: geo?.lat ?? null, lng: geo?.lng ?? null, weekday: localDay(at, practice.timezone).weekday });
  return { covered: m.covered, extraFeeCents: m.extraFeeCents, postal, hasZone: true };
}

/** What clients may be told about where each vet of a clinic travels (no street, no coordinates). */
export async function zoneSummaries(db: SupabaseClient, practiceId: string): Promise<(practitionerId: string) => ZoneSummary | null> {
  const of = await zonesByVet(db, practiceId);
  return (practitionerId) => zoneSummary(zoneFormFromRows(of(practitionerId)));
}
