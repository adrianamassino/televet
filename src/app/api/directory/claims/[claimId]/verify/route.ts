import { z } from "zod";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { hashCode } from "@/lib/directory";
import { approveClaim } from "@/lib/directory-claims";

/** POST /api/directory/claims/:claimId/verify { code } — max 5 attempts, 15 minutes. */
export const POST = handle(async (req, ctx) => {
  const { claimId } = await ctx.params;
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { code } = z.object({ code: z.string().regex(/^\d{6}$/) }).parse(await req.json());
  const db = adminClient();
  const { data: c } = await db.from("listing_claims").select("id, listing_id, user_id, status, code_hash, code_expires_at, attempts").eq("id", claimId).single();
  if (!c || c.user_id !== user.id || c.status !== "pending") throw new HttpError(404, "not found");
  if (c.attempts >= 5 || !c.code_expires_at || new Date(c.code_expires_at) < new Date()) { await db.from("listing_claims").update({ status: "expired" }).eq("id", claimId); throw new HttpError(410, "code expired"); }
  if (hashCode(code, claimId) !== c.code_hash) { await db.from("listing_claims").update({ attempts: c.attempts + 1 }).eq("id", claimId); throw new HttpError(400, "wrong code"); }
  await approveClaim(claimId, c.listing_id, user.id, null);
  return json({ ok: true, next: "create_practice" });
});
