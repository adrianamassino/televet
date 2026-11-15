import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { buildPrompt, draftWithAI, EMPTY_REPORT } from "@/lib/report";

/**
 * POST /api/reports/:bookingId/draft
 * - called by the transcription pipeline (Authorization: Bearer CRON_SECRET, body { transcript })
 *   when the call transcript is ready, or
 * - called by the vet ("Préparer le compte rendu") to (re)generate the draft.
 * Without the owner's consent, an empty draft is created for the vet to write manually.
 */
export const POST = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const internal = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const db = adminClient();
  const { data: b } = await db.from("bookings")
    .select("id, type, status, motive, transcript_consent, practices(owner_user_id, country), pets(name, species), owners(language)")
    .eq("id", id).single();
  if (!b) throw new HttpError(404, "not found");
  const row = b as unknown as { type: string; status: string; motive: string | null; transcript_consent: boolean; practices: { owner_user_id: string; country: string }; pets: { name: string; species: string } | null; owners: { language: string } | null };
  if (!internal) {
    const user = await userFromRequest(req);
    if (!user || user.id !== row.practices.owner_user_id) throw new HttpError(404, "not found");
  }
  if (row.status !== "confirmed") throw new HttpError(409, "not confirmed");
  const body = (await req.json().catch(() => ({}))) as { transcript?: string };
  if (internal && body.transcript && row.transcript_consent) await db.from("consultation_transcripts").upsert({ booking_id: id, text: body.transcript.slice(0, 200000) });
  const { data: tr } = row.transcript_consent ? await db.from("consultation_transcripts").select("text").eq("booking_id", id).single() : { data: null };
  let fields = { ...EMPTY_REPORT, reason: row.motive ?? "" }, ai = false;
  if (tr?.text) {
    fields = await draftWithAI(buildPrompt({ transcript: tr.text, lang: row.owners?.language ?? "fr", country: row.practices.country, petName: row.pets?.name ?? "", species: row.pets?.species ?? "", reason: row.motive ?? "" }));
    ai = true;
  }
  const { data: existing } = await db.from("consultation_reports").select("status").eq("booking_id", id).single();
  if (existing?.status === "sent") throw new HttpError(409, "already sent");
  await db.from("consultation_reports").upsert({ booking_id: id, status: "draft", ai_generated: ai, fields });
  return json({ status: "draft", ai_generated: ai, fields });
});
