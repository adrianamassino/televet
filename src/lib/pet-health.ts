/** Pet health record: types, validation of what the AI reads from a booklet photo, and the reminder schedule. Pure (no server imports) so the browser can use it too. */
export const RECORD_KINDS = ["vaccine", "antiparasitic", "treatment", "surgery", "visit", "test", "other"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];
export type Proposal = { kind: RecordKind; name: string; done_on: string | null; next_due: string | null; vet_name: string | null; notes: string | null };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Accepts only real calendar dates between 1990 and 2100. */
export function cleanDate(v: unknown): string | null {
  if (typeof v !== "string" || !ISO.test(v)) return null;
  const d = new Date(`${v}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return null;
  const y = d.getUTCFullYear();
  return y >= 1990 && y <= 2100 ? v : null;
}
const txt = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Keeps only well-formed entries from the model's answer; never trusts it blindly. */
export function sanitizeProposals(raw: unknown): Proposal[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: Proposal[] = [];
  for (const r of list.slice(0, 80)) {
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

/** Days from `today` (YYYY-MM-DD) to `due` (YYYY-MM-DD); negative when overdue. */
export const daysUntil = (due: string, today: string) => Math.round((Date.parse(`${due}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);

export type Stage = "30" | "7" | "0";
/** Which reminder (if any) is due now for an entry: 30 days before, 7 days before, and on the due day (up to a week late). Each is sent once. */
export function reminderStage(nextDue: string | null, today: string, sent: { r30: boolean; r7: boolean; r0: boolean }): Stage | null {
  if (!nextDue) return null;
  const d = daysUntil(nextDue, today);
  if (d <= 0 && d >= -7 && !sent.r0) return "0";
  if (d >= 1 && d <= 7 && !sent.r7) return "7";
  if (d >= 8 && d <= 30 && !sent.r30) return "30";
  return null;
}

export const SCAN_PROMPT = `You read photos of a pet's vaccination booklet / health record (carnet de santé, libretto sanitario, cartilla sanitaria, pet passport) and extract every dated entry.
Rules:
- Extract ONLY what is actually written. Never guess or invent. If a field is unreadable or absent, leave it null.
- Dates must be YYYY-MM-DD. Booklets often use DD/MM/YY or DD/MM/YYYY (day first). Two-digit years are 20xx.
- "name" is the product or the act (e.g. "Rage (rabies)", "CHPPiL", "Nobivac Tricat", "Drontal", "Stérilisation").
- "next_due" only when the booklet states a booster / next date ("rappel", "revaccination", "valable jusqu'au", "next due").
- kind: vaccine, antiparasitic (flea/tick/worming), treatment, surgery, visit, test, other.
- Stickers and stamps count as entries. Return an empty list if the page has no entries.`;

export const SCAN_TOOL = {
  name: "record_entries",
  description: "Return the dated health entries read from the booklet page.",
  input_schema: {
    type: "object",
    properties: { entries: { type: "array", items: { type: "object", properties: {
      kind: { type: "string", enum: [...RECORD_KINDS] }, name: { type: "string" },
      done_on: { type: ["string", "null"], description: "YYYY-MM-DD" }, next_due: { type: ["string", "null"], description: "YYYY-MM-DD" },
      vet_name: { type: ["string", "null"] }, notes: { type: ["string", "null"] },
    }, required: ["kind", "name"] } } },
    required: ["entries"],
  },
} as const;
