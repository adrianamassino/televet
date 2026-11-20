import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";

/** GET /api/admin/audit — latest admin actions. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const { data, error } = await adminClient().from("admin_audit").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return json({ items: data ?? [] });
});
