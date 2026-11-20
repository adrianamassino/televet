/**
 * Push notifications to the Televet mobile apps through Expo's push service (free, no key needed;
 * set EXPO_ACCESS_TOKEN only if "enhanced security" is switched on in the Expo account).
 * Every function here is best-effort: it never throws, so a failed notification can never break a booking.
 */
import { adminClient } from "./supabase";
import { pushText, type PushKind, type PushVars } from "./push-copy";

const EXPO_URL = "https://exp.host/--/api/v2/push/send";
type TokenRow = { token: string; language: string };

/** Sends one notification to every phone of these users that runs the given app. Returns how many were accepted. */
export async function pushToUsers(
  userIds: (string | null | undefined)[], app: "owner" | "vet",
  build: (lang: string) => { title: string; body: string }, data: Record<string, string> = {},
): Promise<number> {
  try {
    const ids = [...new Set(userIds.filter((x): x is string => !!x))];
    if (!ids.length) return 0;
    const db = adminClient();
    const { data: rows, error } = await db.from("push_tokens").select("token, language").in("user_id", ids).eq("app", app);
    if (error || !rows?.length) return 0; // table missing (migration 0015 not run yet) or nobody uses the app: nothing to do
    const messages = (rows as TokenRow[]).map((r) => ({ to: r.token, sound: "default", channelId: "default", priority: "high", ...build(r.language), data }));
    const dead: string[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const res = await fetch(EXPO_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json", ...(process.env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) },
        body: JSON.stringify(chunk),
      });
      const j = (await res.json().catch(() => null)) as { data?: { status: string; details?: { error?: string } }[] } | null;
      if (!res.ok) console.error("push failed", res.status, JSON.stringify(j));
      (Array.isArray(j?.data) ? j.data : []).forEach((ticket, k) => { if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") dead.push(chunk[k].to); });
    }
    if (dead.length) await db.from("push_tokens").delete().in("token", dead); // app uninstalled: forget the phone
    return messages.length - dead.length;
  } catch (e) { console.error("push", e); return 0; }
}

type Ctx = {
  status: string; starts_at: string; owner_id: string;
  practices: { name: string; timezone: string; owner_user_id: string } | null;
  practitioners: { user_id: string | null } | null;
  owners: { full_name: string } | null; pets: { name: string } | null;
};
async function bookingCtx(id: string): Promise<Ctx | null> {
  const { data } = await adminClient().from("bookings")
    .select("status, starts_at, owner_id, practices(name, timezone, owner_user_id), practitioners(user_id), owners(full_name), pets(name)").eq("id", id).maybeSingle();
  return (data as unknown as Ctx | null) ?? null;
}
const when = (iso: string, lang: string, tz: string) => {
  try { return new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso)); }
  catch { return new Date(iso).toISOString().slice(0, 16).replace("T", " "); }
};

/** Notification about one booking, to the vet's phones (vet_* kinds) or to the owner's phones (owner_* kinds). */
export async function pushBooking(bookingId: string, kind: Exclude<PushKind, "owner_pet_due">): Promise<void> {
  try {
    const b = await bookingCtx(bookingId);
    if (!b || !b.practices) return;
    const tz = b.practices.timezone, forVet = kind.startsWith("vet_");
    const vars = (lang: string): PushVars => ({ who: [b.owners?.full_name, b.pets?.name].filter(Boolean).join(" — "), practice: b.practices!.name, when: when(b.starts_at, lang, tz) });
    await pushToUsers(forVet ? [b.practices.owner_user_id, b.practitioners?.user_id] : [b.owner_id], forVet ? "vet" : "owner",
      (lang) => pushText(kind, lang, vars(lang)), { kind, bookingId });
  } catch (e) { console.error("push booking", e); }
}

/** Tells the vet about a booking that just became visible to them: a request to accept, or an appointment already confirmed automatically. */
export async function notifyVetNewBooking(bookingId: string): Promise<void> {
  try {
    const { data } = await adminClient().from("bookings").select("status").eq("id", bookingId).maybeSingle();
    if (data?.status === "pending") await pushBooking(bookingId, "vet_request");
    else if (data?.status === "confirmed") await pushBooking(bookingId, "vet_booked");
  } catch (e) { console.error("push new booking", e); }
}

/** Vaccine / treatment reminder for one owner (first item, plus how many more). */
export async function pushPetDue(ownerId: string, items: { pet: string; name: string; due: string }[]): Promise<void> {
  if (!items.length) return;
  const first = items[0];
  const date = (lang: string) => { try { return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${first.due}T12:00:00Z`)); } catch { return first.due; } };
  await pushToUsers([ownerId], "owner", (lang) => pushText("owner_pet_due", lang, { pet: first.pet, item: first.name, when: date(lang), more: items.length - 1 }), { kind: "owner_pet_due" });
}
