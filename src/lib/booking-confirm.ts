import { adminClient } from "@/lib/supabase";
import { capturePayment } from "@/lib/payments/stripe";
import { pushBookingToGoogle } from "@/lib/calendar/push";
import { ensureRoom, loadBooking, sendConfirmation } from "@/lib/booking-mail";
import { pushBooking } from "@/lib/push";
import { calendarSynced } from "@/lib/calendar/sync";

/**
 * Confirms a pending booking: captures a Stripe authorization, marks it confirmed, creates the video room and e-mails the owner.
 * Used by the vet's manual "accept" and by automatic confirmation (see confirmsAutomatically). Safe to call twice: only one call wins.
 * Returns false when the booking was not pending (already handled).
 */
export async function confirmBooking(id: string): Promise<boolean> {
  const db = adminClient();
  const { data: b } = await db.from("bookings").select("id, status, provider, payment_ref, payment_status").eq("id", id).single();
  if (!b || b.status !== "pending") return false;
  if (b.provider === "stripe" && b.payment_ref && b.payment_status === "authorized") await capturePayment(b.payment_ref);
  const { data: won } = await db.from("bookings").update({ status: "confirmed" }).eq("id", id).eq("status", "pending").select("id");
  if (!won?.length) return false;
  const full = await loadBooking(id);
  if (full) {
    await ensureRoom(full).catch((e) => console.error("video room", e));
    await pushBookingToGoogle(full);
    await sendConfirmation(full).catch((e) => console.error("confirmation email", e));
  }
  await pushBooking(id, "owner_confirmed");
  return true;
}

/**
 * Will a booking with this vet be confirmed without asking the vet?
 * Yes when the vet's calendar is connected and up to date (Google Calendar…): Televet then knows the time is really free.
 * Yes also when the clinic switched "automatic confirmation" on. Otherwise the vet receives a request to accept or decline.
 */
export async function confirmsAutomatically(practice: { auto_confirm?: boolean | null } | null | undefined, practitionerId: string): Promise<boolean> {
  return !!practice?.auto_confirm || await calendarSynced(practitionerId);
}

/** Confirms the booking when the rule above says so and any online payment is secured. */
export async function autoConfirmIfEnabled(id: string): Promise<void> {
  const { data: b } = await adminClient().from("bookings").select("status, provider, payment_status, practitioner_id, practices(auto_confirm)").eq("id", id).single();
  if (!b || b.status !== "pending") return;
  const paid = b.provider === null || b.payment_status === "none" || b.payment_status === "authorized" || b.payment_status === "captured";
  if (!paid) return;
  const practice = (b as unknown as { practices: { auto_confirm: boolean } | null }).practices;
  if (await confirmsAutomatically(practice, b.practitioner_id)) await confirmBooking(id).catch((e) => console.error("auto confirm", e));
}
