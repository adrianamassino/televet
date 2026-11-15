/**
 * Google Calendar (REST, no SDK). Scopes: create events + read free/busy.
 * The OAuth app must go through Google verification for these scopes,
 * otherwise vets see the "Google hasn't verified this app" warning.
 */
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

function cfg() {
  const id = process.env.GOOGLE_CLIENT_ID, secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Google OAuth not configured");
  return { id, secret };
}

export function authUrl(state: string, redirectUri: string): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", cfg().id);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPES.join(" "));
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("state", state);
  return u.toString();
}

export interface GoogleTokens { access_token: string; refresh_token?: string; expires_in: number }

async function token(body: Record<string, string>): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: cfg().id, client_secret: cfg().secret, ...body }),
  });
  if (!res.ok) throw new Error(`Google token ${res.status}: ${await res.text()}`);
  return res.json() as Promise<GoogleTokens>;
}

export const exchangeCode = (code: string, redirectUri: string) =>
  token({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });
export const refresh = (refreshToken: string) => token({ refresh_token: refreshToken, grant_type: "refresh_token" });

async function gcal<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`Google Calendar ${path} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function freeBusy(accessToken: string, calendarId: string, from: Date, to: Date) {
  const r = await gcal<{ calendars: Record<string, { busy: { start: string; end: string }[] }> }>(accessToken, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: calendarId }] }),
  });
  return (r.calendars[calendarId]?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

export function insertEvent(accessToken: string, calendarId: string, e: {
  id: string; summary: string; description?: string; location?: string; start: Date; end: Date;
}) {
  // Deterministic event id (base32hex) makes retries idempotent.
  const eventId = ("tv" + e.id.replace(/[^a-v0-9]/g, "")).slice(0, 64);
  return gcal<{ id: string }>(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify({
      id: eventId, summary: e.summary, description: e.description, location: e.location,
      start: { dateTime: e.start.toISOString() }, end: { dateTime: e.end.toISOString() },
    }),
  });
}
