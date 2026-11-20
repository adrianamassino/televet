import { z } from "zod";
import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";
import { audit, parsePct, parseFixed } from "@/lib/admin-data";

type Ctx = { params: Promise<{ id: string }> };
const Patch = z.object({ approved: z.boolean().optional(), active: z.boolean().optional(), commission_pct: z.union([z.number(), z.string(), z.null()]).optional(), commission_fixed_cents: z.union([z.number(), z.string(), z.null()]).optional() });

/** PATCH — approve a vet, switch on/off, set the vet's own commission (null = follow the clinic). */
export const PATCH = handle(async (req, ctx) => {
  const staff = await requireStaff(req);
  const { id } = await (ctx as Ctx).params, db = adminClient();
  const b = Patch.parse(await req.json().catch(() => ({})));
  const { data: v } = await db.from("practitioners").select("id, display_name").eq("id", id).single();
  if (!v) throw new HttpError(404, "not found");
  const upd: Record<string, unknown> = {};
  if (b.approved !== undefined) { upd.approved = b.approved; upd.approved_at = b.approved ? new Date().toISOString() : null; }
  if (b.active !== undefined) upd.active = b.active;
  if (b.commission_pct !== undefined || b.commission_fixed_cents !== undefined) {
    try { upd.commission_pct = parsePct(b.commission_pct ?? null); upd.commission_fixed_cents = parseFixed(b.commission_fixed_cents ?? null); } catch (e) { throw new HttpError(400, (e as Error).message); }
    if (upd.commission_pct !== null && upd.commission_fixed_cents !== null) throw new HttpError(400, "choose either a percentage or a fixed fee");
  }
  const { error } = await db.from("practitioners").update(upd).eq("id", id);
  if (error) throw new Error(error.message);
  await audit(db, staff.email ?? "staff", b.approved !== undefined ? (b.approved ? "approve_vet" : "unapprove_vet") : "update_vet", { type: "practitioner", id, label: v.display_name }, { ...b });
  return json({ ok: true });
});

/** DELETE — only without bookings; otherwise switch it off. */
export const DELETE = handle(async (req, ctx) => {
  const staff = await requireStaff(req);
  const { id } = await (ctx as Ctx).params, db = adminClient();
  const { data: v } = await db.from("practitioners").select("id, display_name").eq("id", id).single();
  if (!v) throw new HttpError(404, "not found");
  const { count } = await db.from("bookings").select("id", { count: "exact", head: true }).eq("practitioner_id", id);
  if ((count ?? 0) > 0) throw new HttpError(409, `has_bookings:${count}`);
  const { error } = await db.from("practitioners").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await audit(db, staff.email ?? "staff", "delete_vet", { type: "practitioner", id, label: v.display_name });
  return json({ ok: true });
});
