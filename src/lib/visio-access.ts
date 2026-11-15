import { canJoin, joinWindow, meetingToken } from "./video";
import { ensureRoom, isVideo, type BookingCtx } from "./booking-mail";

export type Access = { ok: true; url: string } | { ok: false; reason: "not_video" | "not_confirmed" | "too_early" | "closed"; opensAt?: string };

/** Returns the URL a participant should open, or why they can't join yet. */
export async function accessFor(b: BookingCtx, role: "owner" | "vet", now = new Date()): Promise<Access> {
  if (!isVideo(b)) return { ok: false, reason: "not_video" };
  if (b.status !== "confirmed") return { ok: false, reason: "not_confirmed" };
  const start = new Date(b.starts_at), end = new Date(b.ends_at);
  if (!canJoin(start, end, now)) {
    const w = joinWindow(start, end);
    return now < w.opensAt ? { ok: false, reason: "too_early", opensAt: w.opensAt.toISOString() } : { ok: false, reason: "closed" };
  }
  if (b.practitioner.video_link) return { ok: true, url: b.practitioner.video_link };
  await ensureRoom(b);
  const token = await meetingToken(b.video_room!, role === "vet" ? b.practitioner.display_name : b.owner.name || "Client", role === "vet", joinWindow(start, end).closesAt);
  return { ok: true, url: `${b.video_url}?t=${encodeURIComponent(token)}` };
}
