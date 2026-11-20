import { amounts, resolveRule } from "@/lib/commission";

type Db = { from: (t: string) => any };
/** Prices as the CLIENT sees them: the vet's price + the fixed Televet fee when the rule is a fixed fee (percentages come out of the vet's price, so the client price is unchanged). */
export async function clientPricer(db: Db, practice: { country: string; commission_pct?: number | null; commission_fixed_cents?: number | null }) {
  const { data: c } = await db.from("countries").select("default_commission_pct, default_commission_fixed_cents").eq("code", practice.country).maybeSingle();
  return (priceCents: number, vet?: { commission_pct?: number | null; commission_fixed_cents?: number | null } | null) =>
    amounts(priceCents, resolveRule({ practitioner: vet ? { pct: vet.commission_pct, fixed: vet.commission_fixed_cents } : null, practice: { pct: practice.commission_pct, fixed: practice.commission_fixed_cents }, country: { pct: c?.default_commission_pct, fixed: c?.default_commission_fixed_cents } })).total;
}
