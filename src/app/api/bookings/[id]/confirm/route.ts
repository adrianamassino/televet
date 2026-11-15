import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { confirmBooking } from "@/lib/booking-confirm";

/** POST /api/bookings/:id/confirm — vet accepts: payment captured, video room created, confirmation e-mail sent. */
export const POST = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { data: b } = await adminClient().from("bookings").select("id, status, practices(owner_user_id)").eq("id", id).single();
  if (!b || (b as unknown as { practices: { owner_user_id: string } }).practices.owner_user_id !== user.id) throw new HttpError(404, "not found");
  if (b.status !== "pending") throw new HttpError(409, "not pending");
  await confirmBooking(id);
  return json({ ok: true });
});
