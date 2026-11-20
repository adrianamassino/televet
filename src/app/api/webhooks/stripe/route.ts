import type Stripe from "stripe";
import { adminClient } from "@/lib/supabase";
import { statusFromAccount, stripe } from "@/lib/payments/stripe";
import { autoConfirmIfEnabled } from "@/lib/booking-confirm";
import { notifyVetNewBooking } from "@/lib/push";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") ?? "";
  // Stripe signs platform events (payments) and Connect events (account.updated of connected accounts) with different secrets.
  const body = await req.text();
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter((x): x is string => !!x);
  let event: Stripe.Event | null = null;
  for (const secret of secrets) { try { event = stripe().webhooks.constructEvent(body, sig, secret); break; } catch { /* try the next secret */ } }
  if (!event) return new Response("bad signature", { status: 400 });
  const db = adminClient();
  switch (event.type) {
    case "account.updated": {
      const a = event.data.object;
      await db.from("practices").update({ stripe_status: statusFromAccount(a) }).eq("stripe_account_id", a.id);
      break;
    }
    case "payment_intent.amount_capturable_updated": {
      // bookings that were not yet authorized: the vet hears about them now (a webhook delivered twice must not notify twice)
      const { data: fresh } = await db.from("bookings").select("id").eq("payment_ref", event.data.object.id).eq("payment_status", "pending");
      const { data: rows } = await db.from("bookings").update({ payment_status: "authorized" }).eq("payment_ref", event.data.object.id).select("id");
      for (const r of rows ?? []) await autoConfirmIfEnabled(r.id);   // no-op when the vet confirms by hand
      for (const r of fresh ?? []) await notifyVetNewBooking(r.id);
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
