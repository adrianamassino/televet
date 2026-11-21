import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { checkAddress } from "@/lib/zone-check";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/zones/check?practitioner=<uuid>&address=<text>[&start=<ISO date>] — does this vet travel to this address?
 * Lets the booking screens say so (and show any surcharge) before the client goes further. The booking itself is checked again on the server.
 */
export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const practitionerId = q.get("practitioner") ?? "", address = (q.get("address") ?? "").trim();
  if (!UUID.test(practitionerId)) throw new HttpError(400, "practitioner required");
  if (address.length < 6 || address.length > 300) throw new HttpError(400, "address required");
  const db = adminClient();
  const { data: pr } = await db.from("practitioners").select("id, active, approved, practices(id, country, timezone, published)").eq("id", practitionerId).maybeSingle();
  const practice = (pr as unknown as { practices: { id: string; country: string; timezone: string; published: boolean } | null } | null)?.practices;
  if (!pr || !pr.active || !pr.approved || !practice?.published) throw new HttpError(404, "not found");
  const start = q.get("start"), at = start && !Number.isNaN(Date.parse(start)) ? new Date(start) : new Date();
  const r = await checkAddress(db, practice, pr.id, address, at);
  return json({ covered: r.covered, extraFeeCents: r.extraFeeCents, hasZone: r.hasZone });
});
