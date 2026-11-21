import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { calendarState } from "@/lib/calendar/sync";
import { clampTravel, TRAVEL_DEFAULT } from "@/lib/travel";
import { cleanZoneForm, zoneFormFromRows, zoneRows, type ServiceZone } from "@/lib/zones";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(userId: string) {
  const db = adminClient();
  const { data: practice } = await db.from("practices").select("id, country, auto_confirm").eq("owner_user_id", userId).order("created_at").limit(1).maybeSingle();
  if (!practice) return null;
  const [{ data: vets }, withTravel, { data: svcs }, { data: zones }] = await Promise.all([
    db.from("practitioners").select("id, display_name, title").eq("practice_id", practice.id).eq("active", true).order("display_name"),
    db.from("practitioners").select("id, travel_min").eq("practice_id", practice.id),   // fails until the database is updated (migration 0016)
    db.from("services").select("practitioner_id, type, active").eq("practice_id", practice.id).eq("type", "home").eq("active", true),
    db.from("service_zones").select("*").eq("practice_id", practice.id),
  ]);
  const ids = (vets ?? []).map((v) => v.id), cal = await calendarState(ids);
  const travel = new Map(((withTravel.data ?? []) as { id: string; travel_min: number }[]).map((v) => [v.id, v.travel_min]));
  const all = (zones ?? []) as ServiceZone[];
  return {
    practice,
    body: {
      ready: !withTravel.error, country: practice.country, currency: COUNTRIES[practice.country]?.currency ?? "EUR", autoConfirm: !!practice.auto_confirm,
      vets: (vets ?? []).map((v) => ({
        id: v.id, name: [v.title, v.display_name].filter(Boolean).join(" "),
        travelMin: clampTravel(travel.get(v.id), TRAVEL_DEFAULT),
        hasHomeService: (svcs ?? []).some((s) => !s.practitioner_id || s.practitioner_id === v.id),
        calendarConnected: cal.get(v.id)?.connected ?? false,
        zone: zoneFormFromRows(all.filter((z) => z.practitioner_id === v.id)),
      })),
    },
  };
}

/** GET /api/pro/home-visits — the signed-in clinic's home-visit settings: for each vet the area covered and the travel time; plus the confirmation switch. */
export const GET = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const d = await load(user.id);
  if (!d) throw new HttpError(404, "no practice");
  return json(d.body);
});

/**
 * PUT /api/pro/home-visits { practitionerId?, travelMin?, zone?, autoConfirm? } — saves one vet's travel time and area (zone: null removes it),
 * and/or the clinic's "confirm automatically" switch. Used by the dashboard and by the Televet Pro app.
 */
export const PUT = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const d = await load(user.id);
  if (!d) throw new HttpError(404, "no practice");
  const body = (await req.json().catch(() => ({}))) as { practitionerId?: string; travelMin?: unknown; zone?: unknown; autoConfirm?: unknown };
  const db = adminClient();

  if (typeof body.autoConfirm === "boolean") {
    const { error } = await db.from("practices").update({ auto_confirm: body.autoConfirm }).eq("id", d.practice.id);
    if (error) throw new HttpError(500, error.message);
  }
  if (body.practitionerId !== undefined) {
    const vetId = String(body.practitionerId);
    if (!UUID.test(vetId) || !d.body.vets.some((v) => v.id === vetId)) throw new HttpError(404, "vet not found");
    if (body.travelMin !== undefined) {
      const { error } = await db.from("practitioners").update({ travel_min: clampTravel(body.travelMin) }).eq("id", vetId);
      if (error) throw new HttpError(409, "database_not_updated"); // the column arrives with migration 0016
    }
    if (body.zone !== undefined) {
      const form = body.zone === null ? null : cleanZoneForm(body.zone);
      if (body.zone !== null && !form) throw new HttpError(400, "invalid_zone");
      // new rows first, old ones removed after: a failure can never leave the vet without an area
      const { data: old } = await db.from("service_zones").select("id").eq("practice_id", d.practice.id).eq("practitioner_id", vetId).in("mode", ["radius", "postal"]);
      if (form) {
        const { error } = await db.from("service_zones").insert(zoneRows(form).map((r) => ({ ...r, practice_id: d.practice.id, practitioner_id: vetId })));
        if (error) throw new HttpError(/label/.test(error.message) ? 409 : 500, /label/.test(error.message) ? "database_not_updated" : error.message);
      }
      if (old?.length) await db.from("service_zones").delete().in("id", old.map((o) => o.id));
    }
  }
  return json((await load(user.id))!.body);
});
