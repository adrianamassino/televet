import { adminClient } from "../supabase";
import * as google from "./google";
import { fetchBusy } from "./ical";
import { ADAPTERS } from "./pims";

interface Conn { id: string; practitioner_id: string; provider: "google" | "ical" | "vetup" | "vetit" | "petbooqz"; external_calendar_id: string | null }
interface Secret { access_token: string | null; refresh_token: string | null; expires_at: string | null; api_key: string | null; ical_url: string | null }

/** Replaces the cached busy intervals of one connection for the next `days` days. */
export async function syncConnection(conn: Conn, days = 60) {
  const db = adminClient();
  const from = new Date(), to = new Date(Date.now() + days * 86400000);
  const { data: s } = await db.from("connection_secrets").select("*").eq("connection_id", conn.id).single<Secret>();
  if (!s) throw new Error("missing secrets");
  let busy: { start: Date; end: Date; uid?: string }[] = [];

  if (conn.provider === "google") {
    let token = s.access_token!;
    if (!s.expires_at || new Date(s.expires_at).getTime() < Date.now() + 60000) {
      const t = await google.refresh(s.refresh_token!);
      token = t.access_token;
      await db.from("connection_secrets").update({ access_token: token, expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString() }).eq("connection_id", conn.id);
    }
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
