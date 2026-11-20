import { z } from "zod";
import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { audit, parsePct } from "@/lib/admin-data";

/** PATCH { default_commission_pct } — platform-wide default, used when neither the vet nor the clinic has their own. */
export const PATCH = handle(async (req, ctx) => {
  const staff = await requireStaff(req);
  const { code } = await ctx.params;
  const b = z.object({ default_commission_pct: z.union([z.number(), z.string()]) }).parse(await req.json().catch(() => ({})));
  let pct: number | null;
  try { pct = parsePct(b.default_commission_pct); } catch (e) { throw new HttpError(400, (e as Error).message); }
  if (pct === null) throw new HttpError(400, "commission required");
  const db = adminClient();
  const { error } = await db.from("countries").update({ default_commission_pct: pct }).eq("code", code.toUpperCase());
  if (error) throw new Error(error.message);
  await audit(db, staff.email ?? "staff", "set_default_commission", { type: "country", id: code.toUpperCase() }, { pct });
  return json({ ok: true });
});
