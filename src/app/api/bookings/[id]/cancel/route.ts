import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { cancelPayment } from "@/lib/payments/stripe";
import { refund } from "@/lib/payments/mercadopago";
import { pushBooking } from "@/lib/push";

/**
 * POST /api/bookings/:id/cancel — the owner withdraws a request the vet has not accepted yet (also used when a payment is abandoned).
 * Nothing is charged: a Stripe authorization is released, a Mercado Pago payment is refunded. Confirmed appointments are not cancelled here.
 */
export const POST = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient();
  const { data: b } = await db.from("bookings").select("id, owner_id, status, provider, payment_ref, payment_status, practice_id").eq("id", id).maybeSingle();
  if (!b || b.owner_id !== user.id) throw new HttpError(404, "not found");
  if (b.status !== "pending") throw new HttpError(409, "not_pending");
  let payment_status: string = b.payment_status;
  if (b.provider === "stripe" && b.payment_ref && (b.payment_status === "authorized" || b.payment_status === "pending")) {
    try { await cancelPayment(b.payment_ref); }
    catch (e) { if (!/status of canceled/i.test(e instanceof Error ? e.message : "")) throw new HttpError(502, "payment_cancel_failed"); }
    payment_status = b.payment_status === "authorized" ? "refunded" : "failed";
  }
  if (b.provider === "mercadopago" && b.payment_ref && b.payment_status === "captured") {
    const { data: sec } = await db.from("practice_secrets").select("mp_access_token").eq("practice_id", b.practice_id).single();
    if (!sec?.mp_access_token) throw new HttpError(502, "payment_cancel_failed");
    await refund(sec.mp_access_token, b.payment_ref); payment_status = "refunded";
  }
  const { data: won } = await db.from("bookings").update({ status: "cancelled", payment_status }).eq("id", id).eq("status", "pending").select("id");
  if (!won?.length) throw new HttpError(409, "not_pending");
  if (b.payment_status !== "pending") await pushBooking(id, "vet_cancelled"); // the vet had been told about this request
  return json({ ok: true });
});
