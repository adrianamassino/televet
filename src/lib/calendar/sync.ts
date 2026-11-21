import { adminClient } from "../supabase";
import * as google from "./google";
import { fetchBusy } from "./ical";
import { ADAPTERS } from "./pims";

interface Conn { id: string; practitioner_id: string; provider: "google" | "ical" | "vetup" | "vetit" | "petbooqz"; external_calendar_id: string | null }
export interface Secret { access_token: string | null; refresh_token: string | null; expires_at: string | null; api_key: string | null; ical_url: string | null }

/** Valid Google access token for a connection (refreshes and stores it when expired). */
export async function googleToken(connId: string, s: Secret): Promise<string> {
  if (s.access_token && s.expires_at && new Date(s.expires_at).getTime() >= Date.now() + 60000) return s.access_token;
  const t = await google.refresh(s.refresh_token!);
  await adminClient().from("connection_secrets").update({ access_token: t.access_token, expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString() }).eq("connection_id", connId);
  return t.access_token;
}

/** Replaces the cached busy intervals of one connection for the next `days` days. */
export async function syncConnection(conn: Conn, days = 60) {
  const db = adminClient();
  const from = new Date(), to = new Date(Date.now() + days * 86400000);
  const { data: s } = await db.from("connection_secrets").select("*").eq("connection_id", conn.id).single<Secret>();
  if (!s) throw new Error("missing secrets");
  let busy: { start: Date; end: Date; uid?: string }[] = [];

  if (conn.provider === "google") {
    const token = await googleToken(conn.id, s);
    busy = await google.freeBusy(token, conn.external_calendar_id ?? "primary", from, to);
  } else if (conn.provider === "ical") {
    busy = await fetchBusy(s.ical_url!, from, to);
  } else {
    busy = await ADAPTERS[conn.provider].getBusy({ apiKey: s.api_key!, externalCalendarId: conn.external_calendar_id }, from, to);
  }

  await db.from("external_busy").delete().eq("connection_id", conn.id);
  if (busy.length) {
    await db.from("external_busy").insert(busy.map((b) => ({
      connection_id: conn.id, practitioner_id: conn.practitioner_id,
      starts_at: b.start.toISOString(), ends_at: b.end.toISOString(), source_uid: b.uid ?? null,
    })));
  }
  await db.from("calendar_connections").update({ last_sync_at: new Date().toISOString(), status: "active", last_error: null }).eq("id", conn.id);
  return busy.length;
}

export async function syncAll() {
  const db = adminClient();
  const { data } = await db.from("calendar_connections").select("id, practitioner_id, provider, external_calendar_id").eq("status", "active");
  const results: Record<string, string> = {};
  for (const c of (data ?? []) as Conn[]) {
    try { results[c.id] = `ok:${await syncConnection(c)}`; }
    catch (e) {
      results[c.id] = `error:${(e as Error).message}`;
      await db.from("calendar_connections").update({ last_error: (e as Error).message.slice(0, 500) }).eq("id", c.id);
    }
  }
  return results;
}

/** Calendars Televet really reads today. Links to practice software are stored but not live yet, so they do not count. */
const READABLE = ["google", "ical"];
/** A calendar is "in sync" when it was read successfully within this many minutes. */
export const SYNC_FRESH_MIN = 90;

type ConnRow = Conn & { status: string; last_sync_at: string | null; last_error: string | null };

/**
 * For each vet: is a readable calendar connected (`connected`), and was it read recently enough to trust it (`fresh`)?
 * `connected` is what clients are told before booking; `fresh` is what decides whether a booking is confirmed by itself.
 */
export async function calendarState(practitionerIds: string[]): Promise<Map<string, { connected: boolean; fresh: boolean }>> {
  const out = new Map<string, { connected: boolean; fresh: boolean }>();
  if (!practitionerIds.length) return out;
  const { data } = await adminClient().from("calendar_connections").select("practitioner_id, provider, status, last_sync_at, last_error")
    .in("practitioner_id", practitionerIds).in("provider", READABLE).eq("status", "active");
  for (const c of (data ?? []) as Pick<ConnRow, "practitioner_id" | "last_sync_at" | "last_error">[]) {
    const prev = out.get(c.practitioner_id) ?? { connected: false, fresh: false };
    const fresh = !!c.last_sync_at && Date.now() - new Date(c.last_sync_at).getTime() < SYNC_FRESH_MIN * 60000;
    out.set(c.practitioner_id, { connected: prev.connected || (!!c.last_sync_at && !c.last_error), fresh: prev.fresh || fresh });
  }
  return out;
}

/** True when the vet's calendar is connected and up to date: Televet knows the vet's real availability. */
export async function calendarSynced(practitionerId: string): Promise<boolean> {
  return (await calendarState([practitionerId])).get(practitionerId)?.fresh ?? false;
}

/**
 * Reads the vet's connected calendars again when our copy is older than `maxAgeMin`, so a time just taken in Google Calendar
 * is not offered or booked. Works without the scheduled job. Gives up after `timeoutMs`; never throws.
 */
export async function refreshCalendars(practitionerId: string, maxAgeMin = 2, timeoutMs = 6000): Promise<void> {
  const work = (async () => {
    const db = adminClient();
    const { data } = await db.from("calendar_connections").select("id, practitioner_id, provider, external_calendar_id, status, last_sync_at, last_error")
      .eq("practitioner_id", practitionerId).in("provider", READABLE).eq("status", "active");
    await Promise.all(((data ?? []) as ConnRow[]).filter((c) => !c.last_sync_at || Date.now() - new Date(c.last_sync_at).getTime() > maxAgeMin * 60000).map(async (c) => {
      try { await syncConnection(c); }
      catch (e) { await db.from("calendar_connections").update({ last_error: (e as Error).message.slice(0, 500) }).eq("id", c.id); }
    }));
  })().catch((e) => console.error("calendar refresh", e));
  await Promise.race([work, new Promise<void>((r) => setTimeout(r, timeoutMs))]);
}

