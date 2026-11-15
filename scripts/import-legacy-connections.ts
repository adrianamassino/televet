/**
 * Migrates the calendar/PIMS connections of the current app.televet.co into the new platform,
 * so clinics already synced with Google Calendar, Vetup, VetIt or Petbooqz do not have to reconnect.
 *
 * Input: a JSON export from the old database (ask the previous developer), one object per connection:
 *   { "legacy_id": "...", "practitioner_email": "...", "provider": "google|vetup|vetit|petbooqz|ical",
 *     "external_calendar_id": "...", "api_key": "...", "access_token": "...", "refresh_token": "...", "ical_url": "..." }
 *
 * Google tokens can only be reused if the new platform uses the SAME Google OAuth client
 * (same Google Cloud project / GOOGLE_CLIENT_ID). Otherwise vets must click "Connect" once.
 *
 * Usage: npx tsx scripts/import-legacy-connections.ts legacy-connections.json
 */
import { readFileSync } from "fs";
import { adminClient } from "../src/lib/supabase";

interface Legacy {
  legacy_id: string; practitioner_email: string; provider: "google" | "vetup" | "vetit" | "petbooqz" | "ical";
  external_calendar_id?: string; api_key?: string; access_token?: string; refresh_token?: string; ical_url?: string;
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: import-legacy-connections.ts <export.json>");
  const rows = JSON.parse(readFileSync(file, "utf8")) as Legacy[];
  const db = adminClient();
  const report = { imported: 0, skipped: [] as string[] };
  const all: { id: string; email?: string }[] = [];
  for (let page = 1; ; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    all.push(...data.users);
    if (data.users.length < 1000) break;
  }
  for (const r of rows) {
    const user = all.find((u) => u.email?.toLowerCase() === r.practitioner_email.toLowerCase());
    if (!user) { report.skipped.push(`${r.legacy_id}: no account for ${r.practitioner_email}`); continue; }
    const { data: pr } = await db.from("practitioners").select("id").eq("user_id", user.id).limit(1).single();
    if (!pr) { report.skipped.push(`${r.legacy_id}: no practitioner profile`); continue; }
    const { data: conn, error } = await db.from("calendar_connections")
      .upsert({ practitioner_id: pr.id, provider: r.provider, status: "active", external_calendar_id: r.external_calendar_id ?? null, legacy_id: r.legacy_id }, { onConflict: "practitioner_id,provider" })
      .select("id").single();
    if (error || !conn) { report.skipped.push(`${r.legacy_id}: ${error?.message}`); continue; }
    await db.from("connection_secrets").upsert({
      connection_id: conn.id, api_key: r.api_key ?? null, access_token: r.access_token ?? null,
      refresh_token: r.refresh_token ?? null, ical_url: r.ical_url ?? null, expires_at: null,
    });
    report.imported++;
  }
  console.log(JSON.stringify(report, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
