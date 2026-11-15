import { adminClient } from "./supabase";

/** Marks the claim verified and the listing claimed; the practice is created/linked at the end of sign-up. */
export async function approveClaim(claimId: string, listingId: string, userId: string, reviewer: string | null) {
  const db = adminClient();
  await db.from("listing_claims").update({ status: "verified", reviewed_by: reviewer, reviewed_at: new Date().toISOString() }).eq("id", claimId);
  await db.from("listing_claims").update({ status: "rejected", note: "another claim verified" }).eq("listing_id", listingId).eq("status", "pending");
  await db.from("directory_listings").update({ status: "claimed", updated_at: new Date().toISOString() }).eq("id", listingId);
  // link to the vet's practice if it already exists, otherwise sign-up pre-fills it from the listing
  const { data: p } = await db.from("practices").select("id").eq("owner_user_id", userId).limit(1).maybeSingle();
  if (p) { await db.from("practices").update({ listing_id: listingId }).eq("id", p.id); await db.from("directory_listings").update({ practice_id: p.id }).eq("id", listingId); }
}
