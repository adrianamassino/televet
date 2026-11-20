import { RECORD_KINDS, type Proposal, type RecordKind } from "./types";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Accepts only real calendar dates between 1990 and 2100 (same rule as the website). */
export function cleanDate(v: unknown): string | null {
  if (typeof v !== "string" || !ISO.test(v)) return null;
  const d = new Date(`${v}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return null;
  const y = d.getUTCFullYear();
  return y >= 1990 && y <= 2100 ? v : null;
}
const txt = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Keeps only well-formed entries from what a reader (on-device or AI) returned; nothing is trusted blindly. */
export function sanitizeProposals(raw: unknown): Proposal[] {
  const out: Proposal[] = [];
  for (const r of (Array.isArray(raw) ? raw : []).slice(0, 80)) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const name = txt(o.name, 120); if (!name) continue;
    const kind = (RECORD_KINDS as readonly string[]).includes(String(o.kind)) ? (o.kind as RecordKind) : "other";
    const done_on = cleanDate(o.done_on); let next_due = cleanDate(o.next_due);
    if (done_on && next_due && next_due < done_on) next_due = null; // a "next" date before the done date is a misreading
    out.push({ kind, name, done_on, next_due, vet_name: txt(o.vet_name, 80), notes: txt(o.notes, 300) });
  }
  return out;
}

/** Same entry already present? (same type, name and date) */
export const sameEntry = (a: { kind: string; name: string; done_on: string | null }, b: { kind: string; name: string; done_on: string | null }) =>
  a.kind === b.kind && a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && a.done_on === b.done_on;

export const plusOneYear = (ymd: string) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCFullYear(d.getUTCFullYear() + 1); return d.toISOString().slice(0, 10); };
