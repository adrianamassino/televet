import { z } from "zod";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { loadBooking } from "@/lib/booking-mail";
import { reportEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/notify";

const Body = z.object({ fields: z.object({ reason: z.string().max(4000), observations: z.string().max(4000), advice: z.string().max(4000), follow_up: z.string().max(4000), warning_signs: z.string().max(4000) }) });

/** POST /api/reports/:bookingId/validate — the vet's edited report is saved, sent to the owner, transcript deleted. */
export const POST = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { fields } = Body.parse(await req.json());
  const db = adminClient();
  const { data: b } = await db.from("bookings").select("id, practices(owner_user_id)").eq("id", id).single();
  if (!b || (b as unknown as { practices: { owner_user_id: string } }).practices.owner_user_id !== user.id) throw new HttpError(404, "not found");
  const now = new Date().toISOString();
  await db.from("consultation_reports").upsert({ booking_id: id, status: "sent", fields, validated_by: user.id, validated_at: now, sent_at: now });
  await db.from("consultation_transcripts").delete().eq("booking_id", id);
  const ctxB = await loadBooking(id);
  if (ctxB?.owner.email) {
    const when = new Intl.DateTimeFormat(`${ctxB.owner.language}-${ctxB.practice.country}`, { dateStyle: "full", timeStyle: "short", timeZone: ctxB.practice.timezone }).format(new Date(ctxB.starts_at));
    const m = reportEmail({ lang: ctxB.owner.language, name: ctxB.owner.name, when, withName: ctxB.practitioner.display_name, service: ctxB.service.custom_name ?? ctxB.service.catalog_code, appUrl: process.env.APP_URL! }, fields);
    await sendEmail(ctxB.owner.email, m.subject, m.html);
  }
  return json({ ok: true, status: "sent" });
});
