import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";

/** GET /api/admin/countries — default commission and payment provider per country. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const { data, error } = await adminClient().from("countries").select("code, currency, payment_provider, default_commission_pct, published").order("code");
  if (error) throw new Error(error.message);
  return json({ items: data ?? [] });
});
