import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";

/** GET /api/reports/:bookingId — vet: draft or sent; owner: only once sent. */
export const GET = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient();
  const { data: b } = await db.from("bookings").select("owner_id, practices(owner_user_id)").eq("id", id).single();
  if (!b) throw new HttpError(404, "not found");
  const r = b as unknown as { owner_id: string; practices: { owner_user_id: string } };
  const isVet = r.practices.owner_user_id === user.id, isOwner = r.owner_id === user.id;
  const { data: rep } = await db.from("consultation_reports").select("status, ai_generated, fields, sent_at").eq("booking_id", id).single();
  if (!rep || (!isVet && !(isOwner && rep.status === "sent"))) throw new HttpError(404, "not found");
  return json(rep);
});
