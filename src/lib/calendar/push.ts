import { directionsUrl } from "../travel";
import { adminClient } from "../supabase";
import * as google from "./google";
import { googleToken, type Secret } from "./sync";
import { signedVisioLink } from "../video";
import type { BookingCtx } from "../booking-mail";

const LABEL: Record<string, string> = { home: "Visite à domicile", video: "Téléconsultation", clinic: "Cabinet", expertise: "Expertise" };

/**
 * Writes a confirmed Televet booking into the vet's Google Calendar (if connected).
 * The event id is derived from the booking id, so calling it twice never creates a duplicate.
 * Never throws: a calendar problem must not block the confirmation.
 */
export async function pushBookingToGoogle(b: BookingCtx): Promise<void> {
  try {
    const db = adminClient();
    const { data: conn } = await db.from("calendar_connections").select("id, external_calendar_id")
      .eq("practitioner_id", b.practitioner.id).eq("provider", "google").eq("status", "active").maybeSingle();
    if (!conn) return;
    const { data: s } = await db.from("connection_secrets").select("*").eq("connection_id", conn.id).single<Secret>();
    if (!s) return;
    const { data: pet } = await db.from("bookings").select("motive, pets(name, species)").eq("id", b.id).single();
    const p = (pet as unknown as { motive: string | null; pets: { name: string; species: string } | null } | null);
    const video = ["video", "expertise"].includes(b.type) ? (b.practitioner.video_link || signedVisioLink(process.env.APP_URL!, b.id, "vet")) : null;
    await google.insertEvent(await googleToken(conn.id, s), conn.external_calendar_id ?? "primary", {
      id: b.id,
      summary: `Televet · ${p?.pets?.name ?? b.owner.name} (${LABEL[b.type] ?? b.type})`,
      description: [`Client : ${b.owner.name}`, p?.pets ? `Animal : ${p.pets.name} (${p.pets.species})` : "", p?.motive ? `Motif : ${p.motive}` : "", video ? `Visio : ${video}` : "", b.address ? `Itinéraire : ${directionsUrl(b.address)}` : "", `Réservé via Televet`].filter(Boolean).join("\n"),
      location: b.address ?? undefined, start: new Date(b.starts_at), end: new Date(b.ends_at),
    });
  } catch (e) {
    // 409 = event already exists (retry): fine. Anything else is logged on the connection for the vet to see.
    if (!String((e as Error).message).includes(" 409")) {
      console.error("google push", e);
      await adminClient().from("calendar_connections").update({ last_error: `push: ${(e as Error).message}`.slice(0, 500) }).eq("practitioner_id", b.practitioner.id).eq("provider", "google");
    }
  }
}
