/** Rule-based reading of OCR text from a pet booklet page (no AI): finds dates + known product names. Pure. */
import { cleanDate, type Proposal, type RecordKind } from "./pet-health";

const MONTHS: Record<string, number> = {
  gen: 1, janv: 1, ene: 1, jan: 1, feb: 2, febr: 2, fev: 2, fév: 2, mar: 3, mars: 3, apr: 4, avr: 4, abr: 4, mag: 5, mai: 5, may: 5, giu: 6, juin: 6, jun: 6,
  lug: 7, juil: 7, jul: 7, ago: 8, aou: 8, aoû: 8, aug: 8, set: 9, sep: 9, sept: 9, ott: 10, oct: 10, nov: 11, dic: 12, dec: 12, déc: 12,
};
type Hit = { iso: string; at: number };

/** Finds dates like 12/03/2024, 12.3.24, 12-03-2024 (day first, as in Europe) and "12 mars 2024". */
export function findDates(line: string, nowYear = new Date().getFullYear()): Hit[] {
  const out: Hit[] = [];
  const fix = (y: number) => (y < 100 ? (y + 2000 > nowYear + 6 ? y + 1900 : y + 2000) : y);
  const push = (d: number, m: number, y: number, at: number) => {
    const iso = cleanDate(`${fix(y)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`); if (iso) out.push({ iso, at });
  };
  for (const m of line.matchAll(/\b(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4}|\d{2})\b/g)) push(+m[1], +m[2], +m[3], m.index ?? 0);
  for (const m of line.matchAll(/\b(\d{1,2})\s+([a-zéûA-ZÉÛ]{3,5})\.?\s+(\d{4})\b/g)) { const mo = MONTHS[m[2].toLowerCase()]; if (mo) push(+m[1], mo, +m[3], m.index ?? 0); }
  return out.sort((a, b) => a.at - b.at);
}

const P = (kind: RecordKind, names: string) => names.split("|").map((n) => ({ kind, re: new RegExp(n.replace(/\*/g, "\\w*"), "i"), label: n.replace(/\*/g, "") }));
const DICT = [
  ...P("vaccine", "nobivac|eurican|versican|purevax|rabisin|feligen|felocell|leucogen|leucofeligen|canigen|recombitek|vanguard|duramune|rabigen|virbagen|biocan|hexadog|primucell|fevaxyn|quantum|rabdomun|vaccin*|rage|rabbia|rabies|rabia|parvo*|leptospir*|distemper|cimurro|trivalent*|tetravalent*|lyme|toux de chenil|bordetella"),
  ...P("antiparasitic", "frontline|advantix|bravecto|nexgard|simparica|milbemax|drontal|stronghold|revolution|advocate|broadline|seresto|credelio|droncit|heartgard|cestal|profender|vermifug*|deworm*|antiparass*|antiparasit*|filaria*|zecche|tiques?|puces|pulci"),
  ...P("surgery", "sterilizz*|stérilis*|esteriliz*|castra*|ovariect*|ovariohyst*|détartrage"),
  ...P("test", "titrage|titolazione|snap test|test sanguin*|analisi"),
];

/** Standard canonical names for generic words, so entries read well. */
const CANON: Record<string, string> = { rage: "Rage", rabbia: "Rabbia", rabies: "Rabies", rabia: "Rabia", vaccin: "Vaccin", vaccino: "Vaccino", vaccinazione: "Vaccinazione", vermifuge: "Vermifuge", vermifugo: "Vermifugo" };
const cap = (s: string) => CANON[s.toLowerCase()] ?? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Returns proposals from OCR text. Needs a known product/keyword AND at least one date on the same line (or the next two lines). */
export function parseBookletText(text: string, today = new Date().toISOString().slice(0, 10)): Proposal[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const out: Proposal[] = []; const seen = new Set<string>(); const yr = +today.slice(0, 4);
  for (let i = 0; i < lines.length; i++) {
    const hit = DICT.map((d) => ({ d, m: lines[i].match(d.re) })).find((x) => x.m);
    if (!hit?.m) continue;
    let dates = findDates(lines[i], yr);
    for (let j = 1; j <= 2 && !dates.length && i + j < lines.length; j++) if (!DICT.some((d) => d.re.test(lines[i + j]))) dates = findDates(lines[i + j], yr);
    if (!dates.length) continue;
    const name = cap(hit.m[0]);
    const done_on = dates[0].iso; const later = dates.map((d) => d.iso).filter((d) => d > done_on).pop() ?? null;
    const key = `${hit.d.kind}|${name.toLowerCase()}|${done_on}`; if (seen.has(key)) continue; seen.add(key);
    out.push({ kind: hit.d.kind, name, done_on: done_on <= today ? done_on : null, next_due: done_on > today ? done_on : later, vet_name: null, notes: null });
  }
  return out;
}
