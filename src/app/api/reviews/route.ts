import { z } from "zod";
import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { sendEmail } from "@/lib/notify";

const Body = z.object({ token: z.string().uuid(), rating: z.number().int().min(1).max(5), comment: z.string().trim().max(2000).optional() });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** POST { token, rating, comment } — stores the rating once. 5 stars returns the Google review link; ≤3 alerts the team. */
export const POST = handle(async (req) => {
  const b = Body.parse(await req.json().catch(() => ({})));
  const db = adminClient();
  const { data: row } = await db.from("bookings").select("id, review_rating, practices(name), practitioners(display_name)").eq("review_token", b.token).single();
  if (!row) throw new HttpError(404, "not found");
  if (row.review_rating) throw new HttpError(409, "already rated");
  const { error } = await db.from("bookings").update({ review_rating: b.rating, review_comment: b.comment || null, review_at: new Date().toISOString() }).eq("id", row.id).is("review_rating", null);
  if (error) throw new Error(error.message);
  if (b.rating <= 3) {
    const r = row as unknown as { practices: { name: string }; practitioners: { display_name: string } };
    await sendEmail(process.env.CONTACT_TO || "contact@televet.co", `[Televet] Valutazione ${b.rating}/5 — ${r.practices?.name ?? ""}`,
      `<p><b>${b.rating}/5</b> — ${esc(r.practices?.name ?? "")} / ${esc(r.practitioners?.display_name ?? "")}</p><p style="white-space:pre-wrap">${esc(b.comment ?? "(nessun commento)")}</p><p>Dettagli: ${process.env.APP_URL ?? "https://televet.co"}/admin/reviews</p>`).catch(() => {});
  }
  return json({ ok: true, google: b.rating === 5 ? process.env.GOOGLE_REVIEW_URL || null : null });
});
