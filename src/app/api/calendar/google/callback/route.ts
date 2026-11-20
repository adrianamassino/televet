import { adminClient, handle } from "@/lib/supabase";
import { exchangeCode } from "@/lib/calendar/google";
import { syncConnection } from "@/lib/calendar/sync";
import { readState } from "@/lib/state";
import { COUNTRIES } from "@/lib/countries";

export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const back = (country: string | undefined, flag: string) => { const cc = COUNTRIES[country ?? ""] ? country! : "FR"; return Response.redirect(`${process.env.APP_URL}/${COUNTRIES[cc].languages[0]}/${cc.toLowerCase()}/pro/dashboard?calendar=${flag}`, 302); };
  const { practitionerId } = readState(q.get("state") ?? "");
  if (q.get("error")) { // the vet declined on Google's consent screen
    const { data: pv } = await adminClient().from("practitioners").select("practices(country)").eq("id", practitionerId).maybeSingle();
    return back((pv as unknown as { practices?: { country?: string } } | null)?.practices?.country, "cancelled");
  }
  const t = await exchangeCode(q.get("code") ?? "", `${process.env.APP_URL}/api/calendar/google/callback`);
  const db = adminClient();
  const { data: conn } = await db.from("calendar_connections")
    .upsert({ practitioner_id: practitionerId, provider: "google", status: "active", external_calendar_id: "primary" }, { onConflict: "practitioner_id,provider" })
    .select("id, practitioner_id, provider, external_calendar_id").single();
  await db.from("connection_secrets").upsert({
    connection_id: conn!.id, access_token: t.access_token, refresh_token: t.refresh_token ?? null,
    expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
  });
  await syncConnection(conn!).catch(() => undefined);
  const { data: pv } = await db.from("practitioners").select("practices(country)").eq("id", practitionerId).maybeSingle();
  return back((pv as unknown as { practices?: { country?: string } } | null)?.practices?.country, "google");
});
