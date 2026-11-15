import type Stripe from "stripe";
import { adminClient } from "@/lib/supabase";
import { statusFromAccount, stripe } from "@/lib/payments/stripe";
import { autoConfirmIfEnabled } from "@/lib/booking-confirm";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try { event = stripe().webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET!); }
  catch { return new Response("bad signature", { status: 400 }); }
  const db = adminClient();
  switch (event.type) {
    case "account.updated": {
      const a = event.data.object;
      await db.from("practices").update({ stripe_status: statusFromAccount(a) }).eq("stripe_account_id", a.id);
      break;
    }
    case "payment_intent.amount_capturable_updated": {
      const { data: rows } = await db.from("bookings").update({ payment_status: "authorized" }).eq("payment_ref", event.data.object.id).select("id");
      for (const r of rows ?? []) await autoConfirmIfEnabled(r.id);   // no-op when the vet confirms by hand
      break;
    }
    case "payment_intent.succeeded":
      await db.from("bookings").update({ payment_status: "captured" }).eq("payment_ref", event.data.object.id); break;
    case "payment_intent.payment_failed":
      await db.from("bookings").update({ payment_status: "failed", status: "cancelled" }).eq("payment_ref", event.data.object.id); break;
    case "charge.refunded":
      if (typeof event.data.object.payment_intent === "string")
        await db.from("bookings").update({ payment_status: "refunded" }).eq("payment_ref", event.data.object.payment_intent);
      break;
  }
  return new Response("ok");
}
