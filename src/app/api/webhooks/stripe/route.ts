import type Stripe from "stripe";
import { adminClient } from "@/lib/supabase";
import { cancelPayment, statusFromAccount, stripe } from "@/lib/payments/stripe";
import { autoConfirmIfEnabled } from "@/lib/booking-confirm";
import { notifyVetNewBooking } from "@/lib/vet-notify";

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
      const pi = event.data.object.id;
      const { data: rows } = await db.from("bookings").select("id, status").eq("payment_ref", pi);
      for (const r of rows ?? []) {
        if (r.status !== "pending") {
          // The time was given back before the payment went through (finished too late, or the request was withdrawn): nothing is kept on the card.
          if (r.status !== "confirmed") { await cancelPayment(pi).catch(() => undefined); await db.from("bookings").update({ payment_status: "refunded" }).eq("id", r.id); }
          continue;
        }
        // only the first delivery of this event finds the payment still "pending": the vet is told once
        const { data: first } = await db.from("bookings").update({ payment_status: "authorized" }).eq("id", r.id).in("payment_status", ["pending", "failed"]).select("id");
        await autoConfirmIfEnabled(r.id);   // confirmed at once when the vet's calendar is synced or automatic confirmation is on
        if (first?.length) await notifyVetNewBooking(r.id);
      }
      break;
    }
    case "payment_intent.succeeded":
      await db.from("bookings").update({ payment_status: "captured" }).eq("payment_ref", event.data.object.id); break;
    case "payment_intent.payment_failed":
      // A refused card is not the end: the client can try another one on the same page. The booking keeps its time for a while
      // and is released by expireUnpaid() if no payment succeeds.
      break;
    case "charge.refunded":
      if (typeof event.data.object.payment_intent === "string")
        await db.from("bookings").update({ payment_status: "refunded" }).eq("payment_ref", event.data.object.payment_intent);
      break;
  }
  return new Response("ok");
}
