import { z } from "zod";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { computeSlots } from "@/lib/availability";
import { busyFor } from "@/lib/busy";
import { extractPostalCode, geocode, matchZones, type ServiceZone } from "@/lib/zones";
import { localDay } from "@/lib/time";
import { commissionCents } from "@/lib/commission";
import { createBookingPayment } from "@/lib/payments/stripe";
import { createPreference } from "@/lib/payments/mercadopago";
import { providerFor, toProviderAmount } from "@/lib/payments";
import { autoConfirmIfEnabled } from "@/lib/booking-confirm";

const Body = z.object({
  serviceId: z.string().uuid(),
  practitionerId: z.string().uuid(),
  start: z.string().datetime(),
  petId: z.string().uuid().optional(),
  motive: z.string().max(1000).optional(),
  address: z.string().max(300).optional(),
  accessNotes: z.string().max(300).optional(),
  transcriptConsent: z.boolean().optional(),
});

/** POST /api/bookings — re-checks availability and home-visit zone server side, then starts payment. */
export const POST = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const body = Body.parse(await req.json());
  const db = adminClient();

  const { data: svc } = await db.from("services")
    .select("id, type, duration_min, price_cents, currency, online_payment, custom_name, catalog_code, practice_id, active, practices(id, country, timezone, published, commission_pct, stripe_account_id, stripe_status, mp_status, name)")
    .eq("id", body.serviceId).single();
  type P = { id: string; country: string; timezone: string; published: boolean; commission_pct: number | null; stripe_account_id: string | null; stripe_status: string; mp_status: string; name: string };
  const practice = (svc as unknown as { practices: P } | null)?.practices;
  if (!svc || !svc.active || !practice?.published) throw new HttpError(404, "service not found");

  const { data: pr } = await db.from("practitioners").select("id, practice_id, commission_pct, active").eq("id", body.practitionerId).single();
  if (!pr || pr.practice_id !== practice.id || !pr.active) throw new HttpError(400, "invalid practitioner");

  // 1) slot still free?
  const start = new Date(body.start), end = new Date(start.getTime() + svc.duration_min * 60000);
  const { data: rules } = await db.from("opening_rules").select("weekday, start_time, end_time, slot_min").eq("practitioner_id", pr.id);
  const dayStart = new Date(start.getTime() - 86400000);
  const slots = computeSlots({ rules: rules ?? [], timeZone: practice.timezone, durationMin: svc.duration_min, from: dayStart, days: 3, busy: await busyFor(pr.id, dayStart, new Date(end.getTime() + 86400000)) });
  if (!slots.some((s) => s.start === start.toISOString())) throw new HttpError(409, "slot_unavailable");

  // 2) home visit: address must be inside the practitioner's zone
  let extraFee = 0, postal: string | null = null;
  if (svc.type === "home") {
    if (!body.address) throw new HttpError(400, "address_required");
    postal = extractPostalCode(body.address, practice.country);
    const geo = await geocode(body.address, practice.country);
    const { data: zones } = await db.from("service_zones").select("*").eq("practice_id", practice.id).or(`practitioner_id.is.null,practitioner_id.eq.${pr.id}`);
    const match = matchZones((zones ?? []) as ServiceZone[], { postalCode: postal, lat: geo?.lat ?? null, lng: geo?.lng ?? null, weekday: localDay(start, practice.timezone).weekday });
    if (!match.covered) throw new HttpError(422, "out_of_zone");
    extraFee = match.extraFeeCents;
  }

  // 3) create booking (the exclusion constraint prevents races / double booking)
  const { data: country } = await db.from("countries").select("default_commission_pct").eq("code", practice.country).single();
  const price = svc.price_cents + extraFee;
  const fee = commissionCents(price, { practitioner: pr.commission_pct, practice: practice.commission_pct, country: Number(country?.default_commission_pct ?? 0) });
  const provider = providerFor(practice.country);
  const { data: booking, error } = await db.from("bookings").insert({
    practice_id: practice.id, practitioner_id: pr.id, service_id: svc.id, owner_id: user.id, pet_id: body.petId ?? null,
    starts_at: start.toISOString(), ends_at: end.toISOString(), type: svc.type, address: body.address ?? null, postal_code: postal,
    access_notes: body.accessNotes ?? null, motive: body.motive ?? null, transcript_consent: !!body.transcriptConsent, price_cents: price, currency: svc.currency,
    commission_cents: fee, provider: svc.online_payment ? provider : null, payment_status: svc.online_payment ? "pending" : "none",
  }).select("id").single();
  if (error) throw new HttpError(error.code === "23P01" ? 409 : 500, error.code === "23P01" ? "slot_unavailable" : error.message);

  if (!svc.online_payment) { await autoConfirmIfEnabled(booking.id); return json({ bookingId: booking.id, payment: null }); }

  // 4) payment
  if (provider === "stripe") {
    if (practice.stripe_status !== "active" || !practice.stripe_account_id) throw new HttpError(409, "payments_not_enabled");
    const pi = await createBookingPayment({ amount: price, currency: svc.currency, feeAmount: fee, destination: practice.stripe_account_id, bookingId: booking.id, customerEmail: user.email });
    await db.from("bookings").update({ payment_ref: pi.id }).eq("id", booking.id);
    return json({ bookingId: booking.id, payment: { provider, clientSecret: pi.client_secret } });
  }
  const { data: sec } = await db.from("practice_secrets").select("mp_access_token").eq("practice_id", practice.id).single();
  if (practice.mp_status !== "active" || !sec?.mp_access_token) throw new HttpError(409, "payments_not_enabled");
  const pref = await createPreference({
    sellerToken: sec.mp_access_token, bookingId: booking.id, title: `${practice.name} · ${svc.custom_name ?? svc.catalog_code}`,
    amount: toProviderAmount(price, svc.currency, "mercadopago"), currency: svc.currency,
    marketplaceFee: toProviderAmount(fee, svc.currency, "mercadopago"), appUrl: process.env.APP_URL!, payerEmail: user.email,
  });
  return json({ bookingId: booking.id, payment: { provider, redirectUrl: pref.init_point } });
});
