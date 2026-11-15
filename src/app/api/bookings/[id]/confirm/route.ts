import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { capturePayment } from "@/lib/payments/stripe";
import { ensureRoom, loadBooking, sendConfirmation } from "@/lib/booking-mail";

/** POST /api/bookings/:id/confirm — vet accepts: payment captured, video room created, confirmation e-mail sent. */
export const POST = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient();
  const { data: b } = await db.from("bookings").select("id, status, provider, payment_ref, payment_status, practices(owner_user_id)").eq("id", id).single();
  if (!b || (b as unknown as { practices: { owner_user_id: string } }).practices.owner_user_id !== user.id) throw new HttpError(404, "not found");
  if (b.status !== "pending") throw new HttpError(409, "not pending");
  if (b.provider === "stripe" && b.payment_ref && b.payment_status === "authorized") await capturePayment(b.payment_ref);
  await db.from("bookings").update({ status: "confirmed" }).eq("id", id);
  // video room (Daily) + confirmation e-mail with the private link
  const full = await loadBooking(id);
  if (full) {
    await ensureRoom(full).catch((e) => console.error("video room", e));
    await sendConfirmation(full).catch((e) => console.error("confirmation email", e));
  }
  // TODO: push notification to the owner app + write event to connected calendars (lib/calendar)
  return json({ ok: true });
});
