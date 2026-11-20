import Stripe from "stripe";

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY missing");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Creates an Express connected account for a practice. */
export async function createConnectedAccount(p: { country: string; email?: string | null; practiceId: string }) {
  return stripe().accounts.create({
    type: "express",
    country: p.country,
    email: p.email ?? undefined,
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    metadata: { practice_id: p.practiceId },
  });
}

/** Hosted onboarding page (identity, bank details…) managed by Stripe. */
export async function onboardingLink(accountId: string, backUrl: string) {
  return stripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${backUrl}?stripe=refresh`,
    return_url: `${backUrl}?stripe=done`,
  });
}

export function statusFromAccount(a: Stripe.Account): "onboarding" | "verifying" | "active" | "restricted" {
  if (a.charges_enabled && a.payouts_enabled) return "active";
  if (a.requirements?.disabled_reason) return a.details_submitted ? "restricted" : "onboarding";
  return a.details_submitted ? "verifying" : "onboarding";
}

/**
 * Authorizes the owner's payment now and captures it only when the vet confirms.
 * Destination charge: funds go to the vet's account, Televet keeps application_fee_amount.
 * NOTE: card authorizations expire after ~7 days. For bookings further ahead,
 * save the card with a SetupIntent and charge it closer to the appointment.
 */
export async function createBookingPayment(p: {
  amount: number; currency: string; feeAmount: number; destination: string;
  bookingId: string; customerEmail?: string;
}) {
  return stripe().paymentIntents.create({
    amount: p.amount,
    currency: p.currency.toLowerCase(),
    capture_method: "manual",
    automatic_payment_methods: { enabled: true },
    application_fee_amount: p.feeAmount,
    transfer_data: { destination: p.destination },
    receipt_email: p.customerEmail,
    metadata: { booking_id: p.bookingId },
  }, { idempotencyKey: `booking-${p.bookingId}` });
}

export const capturePayment = (id: string) => stripe().paymentIntents.capture(id);
/** Cancels an uncaptured authorization (the owner is never charged). */
export const cancelPayment = (id: string) => stripe().paymentIntents.cancel(id);
export const refundPayment = (id: string) => stripe().refunds.create({ payment_intent: id, reverse_transfer: true, refund_application_fee: true });
