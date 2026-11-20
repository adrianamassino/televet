/**
 * Televet commission. Each level (vet → clinic → country) can use EITHER
 *  - a percentage taken out of the price the vet set (pct), or
 *  - a fixed fee ADDED on top of the vet's price (fixed, in cents: 1000 = 10.00).
 * The first level that has a rule wins; a fixed fee beats a percentage at the same level.
 */
export type Rule = { pct?: number | string | null; fixed?: number | null };
export type Resolved = { mode: "pct" | "fixed"; pct: number; fixed: number };

const has = (r?: Rule | null) => !!r && ((r.fixed ?? null) !== null || (r.pct ?? null) !== null);

export function resolveRule(levels: { practitioner?: Rule | null; practice?: Rule | null; country: Rule }): Resolved {
  const r = [levels.practitioner, levels.practice].find(has) ?? levels.country;
  if ((r.fixed ?? null) !== null) return { mode: "fixed", pct: 0, fixed: Math.max(0, Math.round(Number(r.fixed))) };
  return { mode: "pct", pct: Math.max(0, Number(r.pct ?? 0)), fixed: 0 };
}

/** What the client pays (total), what Televet keeps (fee) and what the vet receives (net). */
export function amounts(priceCents: number, rule: Resolved): { total: number; fee: number; net: number } {
  if (rule.mode === "fixed") return { total: priceCents + rule.fixed, fee: rule.fixed, net: priceCents };
  const fee = Math.max(0, Math.round((priceCents * rule.pct) / 100));
  return { total: priceCents, fee, net: priceCents - fee };
}

/** Back-compat helper (percentage only). */
export function commissionCents(priceCents: number, pct: { practitioner?: number | null; practice?: number | null; country: number }): number {
  const p = pct.practitioner ?? pct.practice ?? pct.country;
  return Math.max(0, Math.round((priceCents * Number(p)) / 100));
}

/** Parses what staff type for a fixed fee in cents ("1000" → 1000). Empty → null. */
export function parseFixed(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw new Error("fixed fee must be a whole number of cents (e.g. 1000 = 10,00)");
  return n;
}
