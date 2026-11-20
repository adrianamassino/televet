import { adminClient } from "@/lib/supabase";
import { capturePayment } from "@/lib/payments/stripe";
import { pushBookingToGoogle } from "@/lib/calendar/push";
import { ensureRoom, loadBooking, sendConfirmation } from "@/lib/booking-mail";

/**
 * Confirms a pending booking: captures a Stripe authorization, marks it confirmed, creates the video room and e-mails the owner.
 * Used by the vet's manual "accept" and by automatic confirmation (practices.auto_confirm). Safe to call twice: only one call wins.
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
  return true;
}

/** Confirms the booking if its practice has automatic confirmation on and any online payment is secured. */
export async function autoConfirmIfEnabled(id: string): Promise<void> {
  const { data: b } = await adminClient().from("bookings").select("status, provider, payment_status, practices(auto_confirm)").eq("id", id).single();
  const auto = (b as unknown as { practices: { auto_confirm: boolean } } | null)?.practices?.auto_confirm;
  if (!b || b.status !== "pending" || !auto) return;
  const paid = b.provider === null || b.payment_status === "none" || b.payment_status === "authorized" || b.payment_status === "captured";
  if (paid) await confirmBooking(id).catch((e) => console.error("auto confirm", e));
}
