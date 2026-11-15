import { z } from "zod";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { fetchBusy } from "@/lib/calendar/ical";
import { syncConnection } from "@/lib/calendar/sync";

const Body = z.object({ practitionerId: z.string().uuid(), url: z.string().regex(/^(https?|webcal):\/\/.+/i) });

/** POST /api/calendar/ical { practitionerId, url } — imports busy times from an .ics URL (iCloud, Outlook, other software). */
export const POST = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const body = Body.parse(await req.json());
  const db = adminClient();
  const { data: pr } = await db.from("practitioners").select("id, user_id, practices(owner_user_id)").eq("id", body.practitionerId).single();
  const owner = (pr as unknown as { practices: { owner_user_id: string } } | null)?.practices.owner_user_id;
  if (!pr || (owner !== user.id && pr.user_id !== user.id)) throw new HttpError(404, "not found");
  await fetchBusy(body.url, new Date(), new Date(Date.now() + 86400000)).catch(() => { throw new HttpError(422, "invalid_ical_url"); });
  const { data: conn } = await db.from("calendar_connections")
    .upsert({ practitioner_id: pr.id, provider: "ical", status: "active" }, { onConflict: "practitioner_id,provider" })
    .select("id, practitioner_id, provider, external_calendar_id").single();
  await db.from("connection_secrets").upsert({ connection_id: conn!.id, ical_url: body.url });
  const count = await syncConnection(conn!);
  return json({ ok: true, busyIntervals: count });
});
