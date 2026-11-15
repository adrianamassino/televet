/** Televet commission: practitioner override → practice override → country default. */
export function commissionCents(
  priceCents: number,
  pct: { practitioner?: number | null; practice?: number | null; country: number },
): number {
  const p = pct.practitioner ?? pct.practice ?? pct.country;
  return Math.max(0, Math.round((priceCents * Number(p)) / 100));
}
