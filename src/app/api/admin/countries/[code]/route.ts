import { z } from "zod";
import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { audit, parsePct, parseFixed } from "@/lib/admin-data";

/** PATCH { default_commission_pct | default_commission_fixed_cents } — platform-wide default, used when neither the vet nor the clinic has their own.
 *  Either a percentage taken from the vet's price, or a fixed fee in cents added on top of it. */
export const PATCH = handle(async (req, ctx) => {
  const staff = await requireStaff(req);
  const { code } = await ctx.params;
  const b = z.object({ default_commission_pct: z.union([z.number(), z.string(), z.null()]).optional(), default_commission_fixed_cents: z.union([z.number(), z.string(), z.null()]).optional() }).parse(await req.json().catch(() => ({})));
  let pct: number | null, fixed: number | null;
  try { pct = parsePct(b.default_commission_pct ?? null); fixed = parseFixed(b.default_commission_fixed_cents ?? null); } catch (e) { throw new HttpError(400, (e as Error).message); }
  if (pct !== null && fixed !== null) throw new HttpError(400, "choose either a percentage or a fixed fee");
  if (pct === null && fixed === null) throw new HttpError(400, "commission required");
  const db = adminClient();
  const { error } = await db.from("countries").update({ default_commission_pct: pct ?? 0, default_commission_fixed_cents: fixed }).eq("code", code.toUpperCase());
  if (error) throw new Error(error.message);
  await audit(db, staff.email ?? "staff", "set_default_commission", { type: "country", id: code.toUpperCase() }, { pct, fixed });
  return json({ ok: true });
});
