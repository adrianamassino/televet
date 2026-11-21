import { adminClient } from "@/lib/supabase";
import { getPayment, refund } from "@/lib/payments/mercadopago";
import { autoConfirmIfEnabled } from "@/lib/booking-confirm";
import { notifyVetNewBooking } from "@/lib/vet-notify";

/**
 * Mercado Pago notifications. We never trust the payload: the payment is re-read
 * from the API with the seller's token, then matched through external_reference.
 * TODO (production): also validate the x-signature header with your webhook secret.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string }; user_id?: number };
  if (body.type !== "payment" || !body.data?.id || !body.user_id) return new Response("ignored");
  const db = adminClient();
  const { data: practice } = await db.from("practices").select("id").eq("mp_user_id", String(body.user_id)).single();
  if (!practice) return new Response("unknown seller");
  const { data: sec } = await db.from("practice_secrets").select("mp_access_token").eq("practice_id", practice.id).single();
  if (!sec?.mp_access_token) return new Response("no token");
  const p = await getPayment(sec.mp_access_token, body.data.id);
  const map: Record<string, string> = { approved: "captured", refunded: "refunded", rejected: "failed", cancelled: "failed", in_process: "pending", pending: "pending" };
  const { data: before } = await db.from("bookings").select("payment_status, status").eq("id", p.external_reference).eq("practice_id", practice.id).maybeSingle();
  if (before && map[p.status] === "captured" && (before.status === "cancelled" || before.status === "declined")) {
    // paid after the time was given back (payment finished too late) or after the vet declined: the money goes straight back
    await refund(sec.mp_access_token, String(p.id)).catch((e) => console.error("mp late refund", e));
    await db.from("bookings").update({ payment_ref: String(p.id), payment_status: "refunded" }).eq("id", p.external_reference).eq("practice_id", practice.id);
    return new Response("refunded");
  }
  await db.from("bookings").update({ payment_ref: String(p.id), payment_status: map[p.status] ?? "pending" })
    .eq("id", p.external_reference).eq("practice_id", practice.id);
  if (map[p.status] === "captured") {
    await autoConfirmIfEnabled(p.external_reference);
    if (before && before.payment_status !== "captured") await notifyVetNewBooking(p.external_reference); // only the first time the payment is seen as paid
  }
  return new Response("ok");
}
