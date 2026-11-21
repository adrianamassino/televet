import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { cancelPayment } from "@/lib/payments/stripe";
import { refund } from "@/lib/payments/mercadopago";
import { pushBooking } from "@/lib/push";
import { sendDeclined } from "@/lib/booking-mail";

/** POST /api/bookings/:id/decline — vet declines; owner is never charged (Stripe) or refunded (Mercado Pago). */
export const POST = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { reply } = (await req.json().catch(() => ({}))) as { reply?: string };
  const db = adminClient();
  const { data: b } = await db.from("bookings").select("id, status, provider, payment_ref, payment_status, practice_id, practices(owner_user_id)").eq("id", id).single();
  if (!b || (b as unknown as { practices: { owner_user_id: string } }).practices.owner_user_id !== user.id) throw new HttpError(404, "not found");
  if (b.status !== "pending") throw new HttpError(409, "not pending");
  let payment_status = b.payment_status;
  if (b.provider === "stripe" && b.payment_ref && b.payment_status === "authorized") { await cancelPayment(b.payment_ref); payment_status = "refunded"; }
  if (b.provider === "mercadopago" && b.payment_ref && b.payment_status === "captured") {
    const { data: sec } = await db.from("practice_secrets").select("mp_access_token").eq("practice_id", b.practice_id).single();
    if (sec?.mp_access_token) { await refund(sec.mp_access_token, b.payment_ref); payment_status = "refunded"; }
  }
  await db.from("bookings").update({ status: "declined", vet_reply: reply?.slice(0, 300) ?? null, payment_status }).eq("id", id);
  await pushBooking(id, "owner_declined");
  await sendDeclined(id, reply?.slice(0, 300) ?? null, b.provider !== null); // by e-mail too: not every owner uses the app
  return json({ ok: true });
});
