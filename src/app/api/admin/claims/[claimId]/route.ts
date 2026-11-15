import { z } from "zod";
import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { approveClaim } from "@/lib/directory-claims";

/** POST /api/admin/claims/:claimId { approve, note } — Televet team reviews document-based claims (ADMIN_EMAILS). */
export const POST = handle(async (req, ctx) => {
  const { claimId } = await ctx.params;
  const user = await requireStaff(req);
  const { approve, note } = z.object({ approve: z.boolean(), note: z.string().max(500).optional() }).parse(await req.json());
  const db = adminClient();
  const { data: c } = await db.from("listing_claims").select("id, listing_id, user_id, status").eq("id", claimId).single();
  if (!c || c.status !== "pending") throw new HttpError(404, "not found");
  if (approve) await approveClaim(claimId, c.listing_id, c.user_id, user.id);
  else { await db.from("listing_claims").update({ status: "rejected", note: note ?? null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", claimId); await db.from("directory_listings").update({ status: "unclaimed" }).eq("id", c.listing_id).eq("status", "claim_pending"); }
  return json({ ok: true });
});
