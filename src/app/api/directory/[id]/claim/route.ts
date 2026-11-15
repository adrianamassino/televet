import { z } from "zod";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { emailMatchesWebsite, hashCode, newCode } from "@/lib/directory";
import { findVetPlace, getPlace } from "@/lib/google-places";
import { sendEmail } from "@/lib/notify";

const Body = z.discriminatedUnion("method", [
  z.object({ method: z.literal("email_domain"), email: z.string().email().max(200) }),
  z.object({ method: z.literal("document"), documentPath: z.string().max(300) }),
]);

/**
 * POST /api/directory/:id/claim — a signed-in vet starts claiming a listing.
 * email_domain (recommended): the clinic is matched with its Google Business Profile; the work e-mail must be on
 *   the website domain shown there; a 6-digit code is e-mailed to that address (proves the inbox).
 * document: proof uploaded to private storage, reviewed by the Televet team.
 */
export const POST = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const body = Body.parse(await req.json());
  const db = adminClient();
  const { data: l } = await db.from("directory_listings").select("id, name, address, postal_code, city, country, website, google_place_id, status").eq("id", id).single();
  if (!l || l.status === "claimed" || l.status === "removed") throw new HttpError(409, "listing not claimable");

  if (body.method === "document") {
    const { data: claim, error } = await db.from("listing_claims").insert({ listing_id: id, user_id: user.id, method: "document", document_path: body.documentPath }).select("id").single();
    if (error) throw new HttpError(409, "a claim is already open");
    await db.from("directory_listings").update({ status: "claim_pending" }).eq("id", id);
    return json({ claimId: claim.id, next: "wait_review" });
  }

  // 1. Google Business Profile of the clinic
  const place = l.google_place_id ? await getPlace(l.google_place_id)
    : await findVetPlace([l.name, l.address, l.postal_code, l.city].filter(Boolean).join(" "), l.country);
  if (!place || !place.operational) throw new HttpError(422, "no operational Google Business Profile found: use a document");
  if (!l.google_place_id) await db.from("directory_listings").update({ google_place_id: place.id }).eq("id", id);
  const website = place.website ?? l.website;
  // 2. work e-mail on the website domain
  if (!website) throw new HttpError(422, "no website on the Google profile: use a document");
  const email = body.email.toLowerCase();
  if (!emailMatchesWebsite(email, website)) throw new HttpError(400, `e-mail must be on ${new URL(website.startsWith("http") ? website : `https://${website}`).hostname}`);
  // 3. code sent to that inbox
  const { data: claim, error } = await db.from("listing_claims").insert({ listing_id: id, user_id: user.id, method: "email_domain", email }).select("id").single();
  if (error) throw new HttpError(409, "a claim is already open");
  const code = newCode();
  await db.from("listing_claims").update({ code_hash: hashCode(code, claim.id), code_expires_at: new Date(Date.now() + 30 * 60000).toISOString() }).eq("id", claim.id);
  await sendEmail(email, `Televet · code de vérification ${code}`, `<p>Votre code pour activer <b>${l.name.replace(/[<>&]/g, "")}</b> sur Televet : <b style="font-size:20px">${code}</b></p><p>Il expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`);
  return json({ claimId: claim.id, next: "enter_code", website: new URL(website.startsWith("http") ? website : `https://${website}`).hostname });
});
