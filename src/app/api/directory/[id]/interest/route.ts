import { z } from "zod";
import { adminClient, handle, json } from "@/lib/supabase";

/** POST /api/directory/:id/interest { email } — "notify me" on a clinic without online booking. */
export const POST = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const { email } = z.object({ email: z.string().email().max(200) }).parse(await req.json());
  await adminClient().from("listing_interest").upsert({ listing_id: id, email: email.toLowerCase() });
  return json({ ok: true });
});
