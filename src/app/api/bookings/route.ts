import { z } from "zod";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { computeSlots, filterWeekdays } from "@/lib/availability";
import { busyFor, expireUnpaid, travelMinOf } from "@/lib/busy";
import { checkAddress } from "@/lib/zone-check";
import { refreshCalendars } from "@/lib/calendar/sync";
import { tooClose, TRAVEL_MAX } from "@/lib/travel";
import { amounts, resolveRule } from "@/lib/commission";
import { notifyVetNewBooking } from "@/lib/vet-notify";
import { createBookingPayment } from "@/lib/payments/stripe";
import { createPreference } from "@/lib/payments/mercadopago";
import { providerFor, toProviderAmount } from "@/lib/payments";
import { autoConfirmIfEnabled, confirmsAutomatically } from "@/lib/booking-confirm";

const Body = z.object({
  serviceId: z.string().uuid(),
  practitionerId: z.string().uuid(),
  start: z.string().datetime(),
  petId: z.string().uuid().optional(),
  motive: z.string().max(1000).optional(),
  address: z.string().max(300).optional(),
  accessNotes: z.string().max(300).optional(),
  transcriptConsent: z.boolean().optional(),
  source: z.enum(["web", "app"]).optional(), // "app": after an online payment the return page sends the client back into the mobile app
});

/**
 * POST /api/bookings — re-checks availability (travel time around home visits included) and the home-visit zone on the server,
 * creates the booking, then starts the payment. The answer says whether the appointment is confirmed at once or waits for the vet.
 */
export const POST = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const body = Body.parse(await req.json());
  const db = adminClient();

  const { data: svc } = await db.from("services")
    .select("id, type, duration_min, price_cents, currency, online_payment, custom_name, catalog_code, practice_id, active, weekdays, practices(id, country, timezone, published, booking_enabled, auto_confirm, commission_pct, commission_fixed_cents, stripe_account_id, stripe_status, mp_status, name)")
    .eq("id", body.serviceId).single();
  type P = { id: string; country: string; timezone: string; published: boolean; booking_enabled: boolean; auto_confirm: boolean | null; commission_pct: number | null; commission_fixed_cents: number | null; stripe_account_id: string | null; stripe_status: string; mp_status: string; name: string };
  const practice = (svc as unknown as { practices: P } | null)?.practices;
  if (!svc || !svc.active || !practice?.published || !practice.booking_enabled) throw new HttpError(404, "service not found");

  const { data: pr } = await db.from("practitioners").select("id, practice_id, commission_pct, commission_fixed_cents, active, approved, lead_time_min").eq("id", body.practitionerId).single();
  if (!pr || pr.practice_id !== practice.id || !pr.active || !pr.approved) throw new HttpError(400, "invalid practitioner");

  // 0) the vet's day as it is right now: connected calendar re-read, time slots held by unfinished payments given back
  const home = svc.type === "home";
  await Promise.all([refreshCalendars(pr.id), expireUnpaid(pr.id)]);
  const travel = await travelMinOf(pr.id);

  // 1) slot still free? A home visit also needs the vet's travel time before and after it.
  const start = new Date(body.start), end = new Date(start.getTime() + svc.duration_min * 60000);
  const { data: rules } = await db.from("opening_rules").select("weekday, start_time, end_time, slot_min").eq("practitioner_id", pr.id);
  const dayStart = new Date(start.getTime() - 86400000);
  const slots = filterWeekdays(computeSlots({ rules: rules ?? [], timeZone: practice.timezone, durationMin: svc.duration_min, from: dayStart, days: 3, busy: await busyFor(pr.id, dayStart, new Date(end.getTime() + 86400000), home, travel), leadTimeMin: pr.lead_time_min ?? 120 }), svc.weekdays);
  if (!slots.some((s) => s.start === start.toISOString())) throw new HttpError(409, "slot_unavailable");

  // 2) home visit: the address must be inside the area the vet travels to
  let extraFee = 0, postal: string | null = null;
  if (home) {
    if (!body.address) throw new HttpError(400, "address_required");
    const zone = await checkAddress(db, practice, pr.id, body.address, start);
    if (!zone.covered) throw new HttpError(422, "out_of_zone");
    extraFee = zone.extraFeeCents; postal = zone.postal;
  }

  // 3) create booking (the exclusion constraint prevents races / double booking)
  const { data: country } = await db.from("countries").select("default_commission_pct, default_commission_fixed_cents").eq("code", practice.country).single();
  const rule = resolveRule({ practitioner: { pct: pr.commission_pct, fixed: pr.commission_fixed_cents }, practice: { pct: practice.commission_pct, fixed: practice.commission_fixed_cents }, country: { pct: country?.default_commission_pct, fixed: country?.default_commission_fixed_cents } });
  // fixed fee: the client pays the vet's price + the fee; percentage: taken out of the vet's price
  const base = svc.price_cents + extraFee;
  const { total: price, fee } = svc.online_payment || rule.mode === "pct" ? amounts(base, rule) : { total: base, fee: 0 }; // a fixed fee is only charged on online payments
  const provider = providerFor(practice.country);
  // online payment must be possible before anything is reserved (otherwise a booking nobody can pay would hold the time)
  let mpToken: string | null = null;
  if (svc.online_payment && provider === "stripe" && (practice.stripe_status !== "active" || !practice.stripe_account_id)) throw new HttpError(409, "payments_not_enabled");
  if (svc.online_payment && provider === "mercadopago") {
    const { data: sec } = await db.from("practice_secrets").select("mp_access_token").eq("practice_id", practice.id).single();
    if (practice.mp_status !== "active" || !sec?.mp_access_token) throw new HttpError(409, "payments_not_enabled");
    mpToken = sec.mp_access_token;
  }
  const row: Record<string, unknown> = {
    practice_id: practice.id, practitioner_id: pr.id, service_id: svc.id, owner_id: user.id, pet_id: body.petId ?? null,
    starts_at: start.toISOString(), ends_at: end.toISOString(), type: svc.type, address: body.address ?? null, postal_code: postal,
    access_notes: body.accessNotes ?? null, motive: body.motive ?? null, transcript_consent: !!body.transcriptConsent, price_cents: price, currency: svc.currency,
    commission_cents: fee, provider: svc.online_payment ? provider : null, payment_status: svc.online_payment ? "pending" : "none",
  };
  const keepTravel = home && travel > 0; // the visit keeps the travel time it was booked with, even if the vet changes the setting later
  let ins = await db.from("bookings").insert(keepTravel ? { ...row, travel_min: travel } : row).select("id, created_at").single();
  if (ins.error && keepTravel && /travel_min/.test(ins.error.message)) ins = await db.from("bookings").insert(row).select("id, created_at").single(); // database not updated yet (migration 0016)
  const { data: booking, error } = ins;
  if (error || !booking) throw new HttpError(error?.code === "23P01" ? 409 : 500, error?.code === "23P01" ? "slot_unavailable" : error?.message ?? "insert failed");

  // Two clients choosing neighbouring times at the same instant: the database refuses overlaps, this refuses a missing travel gap.
  // Whoever booked first keeps the time; the later one is asked to choose again.
  const pad = TRAVEL_MAX * 60000;
  const { data: near } = await db.from("bookings").select("id, starts_at, ends_at, type, travel_min, created_at").eq("practitioner_id", pr.id).in("status", ["pending", "confirmed"]).neq("id", booking.id)
    .lt("starts_at", new Date(end.getTime() + pad).toISOString()).gt("ends_at", new Date(start.getTime() - pad).toISOString());
  const earlier = (near ?? []).filter((o) => o.created_at < booking.created_at || (o.created_at === booking.created_at && o.id < booking.id))
    .map((o) => ({ start: new Date(o.starts_at), end: new Date(o.ends_at), travelMin: o.type === "home" ? (o.travel_min > 0 ? o.travel_min : travel) : 0 }));
  if (tooClose({ start, end }, home, travel, earlier)) { await db.from("bookings").delete().eq("id", booking.id); throw new HttpError(409, "slot_unavailable"); }

  if (!svc.online_payment) {
    await autoConfirmIfEnabled(booking.id); await notifyVetNewBooking(booking.id);
    const { data: now } = await db.from("bookings").select("status").eq("id", booking.id).single();
    return json({ bookingId: booking.id, payment: null, status: now?.status ?? "pending", total: price });
  }
  // told to the client before paying: confirmed as soon as the payment goes through, or sent to the vet as a request
  const autoConfirm = await confirmsAutomatically(practice, pr.id);

  // 4) payment
  if (provider === "stripe") {
    const pi = await createBookingPayment({ amount: price, currency: svc.currency, feeAmount: fee, destination: practice.stripe_account_id!, bookingId: booking.id, customerEmail: user.email });
    await db.from("bookings").update({ payment_ref: pi.id }).eq("id", booking.id);
    return json({ bookingId: booking.id, payment: { provider, clientSecret: pi.client_secret }, total: price, autoConfirm });
  }
  const pref = await createPreference({
    sellerToken: mpToken!, bookingId: booking.id, title: `${practice.name} · ${svc.custom_name ?? svc.catalog_code}`,
    amount: toProviderAmount(price, svc.currency, "mercadopago"), currency: svc.currency,
    marketplaceFee: toProviderAmount(fee, svc.currency, "mercadopago"), appUrl: process.env.APP_URL!, payerEmail: user.email, fromApp: body.source === "app",
  });
  return json({ bookingId: booking.id, payment: { provider, redirectUrl: pref.init_point }, total: price, autoConfirm });
});
