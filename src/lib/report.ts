/**
 * Consultation report: the AI drafts it from the video transcript, the vet edits and validates,
 * then it is sent to the owner. The AI never sends anything by itself.
 */
export interface ReportFields { reason: string; observations: string; advice: string; follow_up: string; warning_signs: string }
export const EMPTY_REPORT: ReportFields = { reason: "", observations: "", advice: "", follow_up: "", warning_signs: "" };

const LANG_NAME: Record<string, string> = { fr: "French", it: "Italian", en: "English", es: "Spanish", pt: "Portuguese", de: "German", pl: "Polish" };

export function buildPrompt(p: { transcript: string; lang: string; country: string; petName: string; species: string; reason: string; remoteRulesNote?: string }) {
  return `You draft a veterinary consultation report for a vet to review before it is sent to the pet owner.
Write in ${LANG_NAME[p.lang] ?? "English"}, in plain words the owner understands.
Use ONLY information stated in the transcript. Do not invent findings, doses or diagnoses. If something is unclear, write "[to be completed by the vet]" in the report language.
${p.country === "FR" ? "Remote advice in France: do not state a diagnosis and do not include any prescription." : ""}${p.remoteRulesNote ?? ""}
Pet: ${p.petName} (${p.species}). Reason given at booking: ${p.reason || "not given"}.

Return ONLY a JSON object with these string keys: reason, observations, advice, follow_up, warning_signs.

Transcript:
<<<
${p.transcript.slice(0, 60000)}
>>>`;
}

export function parseReport(text: string): ReportFields {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { ...EMPTY_REPORT };
  try {
    const o = JSON.parse(m[0]) as Partial<ReportFields>;
    const s = (v: unknown) => (typeof v === "string" ? v.slice(0, 4000) : "");
    return { reason: s(o.reason), observations: s(o.observations), advice: s(o.advice), follow_up: s(o.follow_up), warning_signs: s(o.warning_signs) };
  } catch { return { ...EMPTY_REPORT }; }
}

/** Calls Claude (Anthropic Messages API). Requires ANTHROPIC_API_KEY. */
export async function draftWithAI(prompt: string): Promise<ReportFields> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return parseReport(data.content.filter((c) => c.type === "text").map((c) => c.text).join("\n"));
}
