/**
 * Integrated video consultations with Daily (https://www.daily.co).
 * Chosen for ease of integration and customisation: prebuilt call UI that can be embedded
 * or opened by link, branding/colours configurable in the Daily dashboard, React Native SDK
 * for the Televet apps, private rooms protected by per-participant meeting tokens.
 * A practitioner can still override it with their own link (practitioners.video_link).
 */
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const API = "https://api.daily.co/v1";
const EARLY_MIN = 15; // room opens 15 minutes before the appointment
const LATE_MIN = 60; // and closes 60 minutes after its planned end

function key() {
  const k = process.env.DAILY_API_KEY;
  if (!k) throw new Error("DAILY_API_KEY missing");
  return k;
}

async function daily<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${key()}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Daily ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const unix = (d: Date) => Math.floor(d.getTime() / 1000);

export function joinWindow(start: Date, end: Date) {
  return { opensAt: new Date(start.getTime() - EARLY_MIN * 60000), closesAt: new Date(end.getTime() + LATE_MIN * 60000) };
}

export function canJoin(start: Date, end: Date, now = new Date()) {
  const w = joinWindow(start, end);
  return now >= w.opensAt && now <= w.closesAt;
}

/** Creates a private room that only exists around the appointment time. */
export async function createRoom(bookingId: string, start: Date, end: Date, lang = "fr") {
  const w = joinWindow(start, end);
  const name = `tv-${bookingId.replace(/-/g, "").slice(0, 10)}-${randomBytes(4).toString("hex")}`;
  const room = await daily<{ name: string; url: string }>("/rooms", {
    name,
    privacy: "private",
    properties: {
      nbf: unix(w.opensAt),
      exp: unix(w.closesAt),
      eject_at_room_exp: true,
      enable_prejoin_ui: true,
      enable_chat: false,
      max_participants: 4,
      lang: ["fr", "it", "en", "es", "pt", "de", "pl"].includes(lang) ? lang : "en",
      ...(process.env.DAILY_GEO ? { geo: process.env.DAILY_GEO } : {}),
    },
  });
  return { name: room.name, url: room.url };
}

/** Per-participant token: the vet is room owner (can admit/remove), the owner is a guest. */
export async function meetingToken(roomName: string, userName: string, isOwner: boolean, exp: Date) {
  const r = await daily<{ token: string }>("/meeting-tokens", {
    properties: { room_name: roomName, user_name: userName.slice(0, 60), is_owner: isOwner, exp: unix(exp) },
  });
  return r.token;
}

// ---------------------------------------------------------------- signed links (e-mails)
const secret = () => process.env.VISIO_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";

/** Private link sent by e-mail: works without logging in, only for this booking and role. */
export function signedVisioLink(appUrl: string, bookingId: string, role: "owner" | "vet") {
  const sig = createHmac("sha256", secret()).update(`${bookingId}:${role}`).digest("base64url").slice(0, 32);
  return `${appUrl}/visio/${bookingId}?r=${role}&s=${sig}`;
}

export function verifyVisioLink(bookingId: string, role: string, sig: string) {
  if (role !== "owner" && role !== "vet") return false;
  const expected = createHmac("sha256", secret()).update(`${bookingId}:${role}`).digest("base64url").slice(0, 32);
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
