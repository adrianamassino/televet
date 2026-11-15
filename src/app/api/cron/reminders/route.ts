import { adminClient } from "@/lib/supabase";
import { loadBooking, sendReminder } from "@/lib/booking-mail";

/** Every 15 minutes: 24 h and 2 h reminders (owner) + 2 h video link reminder (vet). */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  const db = adminClient();
  const now = Date.now();
  const sent: string[] = [];
  for (const [kind, hours, col] of [["24h", 24, "reminder_24h_sent_at"], ["2h", 2, "reminder_2h_sent_at"]] as const) {
    const { data } = await db.from("bookings").select("id, practices(reminders)")
      .eq("status", "confirmed").is(col, null)
      .gt("starts_at", new Date(now).toISOString())
      .lte("starts_at", new Date(now + hours * 3600000).toISOString());
    for (const row of data ?? []) {
      const rem = (row as unknown as { practices: { reminders: { e24?: boolean; e2?: boolean } } }).practices.reminders ?? {};
      if ((kind === "24h" && rem.e24 === false) || (kind === "2h" && rem.e2 === false)) continue;
      const b = await loadBooking(row.id);
      if (b) { await sendReminder(b, kind).catch((e) => console.error(e)); sent.push(`${kind}:${row.id}`); }
    }
  }
  return Response.json({ sent });
}
