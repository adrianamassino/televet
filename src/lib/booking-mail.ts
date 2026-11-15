import { adminClient } from "./supabase";
import { sendEmail } from "./notify";
import { confirmationEmail, reminderEmail, type MailData } from "./email/templates";
import { createRoom, signedVisioLink } from "./video";

const VIDEO_TYPES = new Set(["video", "expertise"]);

export interface BookingCtx {
  id: string; type: string; starts_at: string; ends_at: string; status: string; address: string | null;
  video_room: string | null; video_url: string | null;
  practice: { name: string; timezone: string; email: string | null; address: string | null; country: string; reminders: { e24?: boolean; e2?: boolean } };
  practitioner: { id: string; display_name: string; video_link: string | null };
  service: { custom_name: string | null; catalog_code: string; confirmation_note: string | null; reminder_note: string | null };
  owner: { name: string; email: string | null; language: string };
}

export async function loadBooking(id: string): Promise<BookingCtx | null> {
  const db = adminClient();
  const { data } = await db.from("bookings")
    .select("id, type, starts_at, ends_at, status, address, video_room, video_url, owner_id, practices(name, timezone, email, address, country, reminders), practitioners(id, display_name, video_link), services(custom_name, catalog_code, confirmation_note, reminder_note)")
    .eq("id", id).single();
  if (!data) return null;
  const r = data as unknown as Record<string, unknown> & { owner_id: string };
  const { data: owner } = await db.from("owners").select("full_name, language").eq("id", r.owner_id).single();
  const { data: u } = await db.auth.admin.getUserById(r.owner_id);
  return {
    ...(r as unknown as BookingCtx),
    practice: r.practices as BookingCtx["practice"],
    practitioner: r.practitioners as BookingCtx["practitioner"],
    service: r.services as BookingCtx["service"],
    owner: { name: owner?.full_name ?? "", email: u.user?.email ?? null, language: owner?.language ?? "fr" },
  };
}

export const isVideo = (b: { type: string }) => VIDEO_TYPES.has(b.type);

/** Creates the Daily room once (unless the vet uses their own link). */
export async function ensureRoom(b: BookingCtx) {
  if (!isVideo(b) || b.practitioner.video_link || b.video_room) return;
  const room = await createRoom(b.id, new Date(b.starts_at), new Date(b.ends_at), b.owner.language);
  await adminClient().from("bookings").update({ video_room: room.name, video_url: room.url }).eq("id", b.id);
  b.video_room = room.name; b.video_url = room.url;
}

function mailData(b: BookingCtx, forVet: boolean, note: string | null): MailData {
  const appUrl = process.env.APP_URL!;
  const lang = forVet ? (b.practice.country === "FR" ? "fr" : b.owner.language) : b.owner.language;
  const when = new Intl.DateTimeFormat(`${lang}-${b.practice.country}`, { dateStyle: "full", timeStyle: "short", timeZone: b.practice.timezone }).format(new Date(b.starts_at));
  return {
    lang, when, appUrl, note,
    name: forVet ? b.practitioner.display_name : b.owner.name,
    withName: forVet ? b.owner.name : b.practitioner.display_name,
    service: b.service.custom_name ?? b.service.catalog_code,
    address: isVideo(b) ? null : b.type === "home" ? b.address : b.practice.address,
    joinUrl: isVideo(b) ? signedVisioLink(appUrl, b.id, forVet ? "vet" : "owner") : null,
  };
}

export async function sendConfirmation(b: BookingCtx) {
  if (!b.owner.email) return;
  const m = confirmationEmail(mailData(b, false, b.service.confirmation_note));
  await sendEmail(b.owner.email, m.subject, m.html);
  await adminClient().from("bookings").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", b.id);
}

export async function sendReminder(b: BookingCtx, kind: "24h" | "2h") {
  const col = kind === "24h" ? "reminder_24h_sent_at" : "reminder_2h_sent_at";
  if (b.owner.email) { const m = reminderEmail(mailData(b, false, b.service.reminder_note)); await sendEmail(b.owner.email, m.subject, m.html); }
  // the vet also receives the video link before a teleconsultation
  if (kind === "2h" && isVideo(b) && b.practice.email) { const m = reminderEmail(mailData(b, true, null), true); await sendEmail(b.practice.email, m.subject, m.html); }
  await adminClient().from("bookings").update({ [col]: new Date().toISOString() }).eq("id", b.id);
}
