import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { loadBooking } from "@/lib/booking-mail";
import { accessFor } from "@/lib/visio-access";

/** GET /api/bookings/:id/video — join button in the owner space and in Televet Pro (web + apps). */
export const GET = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient();
  const { data: row } = await db.from("bookings").select("owner_id, practitioner_id, practices(owner_user_id), practitioners(user_id)").eq("id", id).single();
  if (!row) throw new HttpError(404, "not found");
  const r = row as unknown as { owner_id: string; practices: { owner_user_id: string }; practitioners: { user_id: string | null } };
  const role = r.owner_id === user.id ? "owner" : (r.practices.owner_user_id === user.id || r.practitioners.user_id === user.id) ? "vet" : null;
  if (!role) throw new HttpError(404, "not found");
  const b = await loadBooking(id);
  return json(await accessFor(b!, role));
});
