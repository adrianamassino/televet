import { adminClient } from "./supabase";
import { sendEmail } from "./notify";
import { pushBooking } from "./push";
import { COUNTRIES, ZERO_DECIMAL } from "./countries";
import { serviceLabel, vetBookingEmail } from "./email/templates";
import { directionsUrl } from "./travel";

type Row = {
  id: string; status: string; type: string; starts_at: string; address: string | null; access_notes: string | null; motive: string | null;
  price_cents: number; currency: string; travel_min?: number | null;
  practices: { name: string; country: string; timezone: string; email: string | null; email_language: string | null; owner_user_id: string } | null;
  practitioners: { display_name: string } | null; services: { custom_name: string | null; catalog_code?: string | null } | null;
  owners: { full_name: string | null; phone: string | null } | null; pets: { name: string; species: string } | null;
};
const COLS = "id, status, type, starts_at, address, access_notes, motive, price_cents, currency, practices(name, country, timezone, email, email_language, owner_user_id), practitioners(display_name), services(custom_name, catalog_code), owners(full_name, phone), pets(name, species)";

/**
 * Tells the vet about a booking that just became visible to them: a request to accept or decline, or an appointment already
 * confirmed automatically. Phone notification (Televet Pro app) and e-mail; a home visit carries the address with a Google Maps
 * directions link. Never throws: a failed notification must not break a booking.
 */
export async function notifyVetNewBooking(bookingId: string): Promise<void> {
  try {
    const db = adminClient();
    let { data } = await db.from("bookings").select(`${COLS}, travel_min`).eq("id", bookingId).maybeSingle();
    if (!data) ({ data } = await db.from("bookings").select(COLS).eq("id", bookingId).maybeSingle()); // database not updated yet (migration 0016)
    const b = data as unknown as Row | null;
    if (!b || !b.practices || (b.status !== "pending" && b.status !== "confirmed")) return;
    const kind = b.status === "pending" ? "request" : "booked";
    await pushBooking(bookingId, kind === "request" ? "vet_request" : "vet_booked");

    const p = b.practices, c = COUNTRIES[p.country];
    let to = p.email;
    if (!to) to = (await db.auth.admin.getUserById(p.owner_user_id)).data.user?.email ?? null;
    if (!to) return;
    const lang = p.email_language || c?.languages[0] || "en", pathLang = c?.languages[0] ?? "en";
    const fmt = (l: string) => new Intl.DateTimeFormat(`${l}-${p.country}`, { dateStyle: "full", timeStyle: "short", timeZone: p.timezone }).format(new Date(b.starts_at));
    let when: string; try { when = fmt(lang); } catch { when = fmt("en"); }
    const home = b.type === "home" && !!b.address;
    const m = vetBookingEmail({
      lang, kind, vetName: b.practitioners?.display_name ?? p.name, when,
      client: b.owners?.full_name || "—", phone: b.owners?.phone, pet: b.pets ? `${b.pets.name} (${b.pets.species})` : null,
      service: serviceLabel(b.services?.custom_name, b.type, lang, b.services?.catalog_code), motive: b.motive,
      price: new Intl.NumberFormat(lang, { style: "currency", currency: b.currency }).format(ZERO_DECIMAL.has(b.currency) ? b.price_cents : b.price_cents / 100),
      address: home ? b.address : null, accessNotes: home ? b.access_notes : null, mapsUrl: home ? directionsUrl(b.address!) : null, travelMin: home ? b.travel_min ?? null : null,
      dashboardUrl: `${process.env.APP_URL}/${pathLang}/${p.country.toLowerCase()}/pro/dashboard`,
    });
    await sendEmail(to, m.subject, m.html);
  } catch (e) { console.error("vet notify", e); }
}
