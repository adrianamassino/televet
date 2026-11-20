/** Formatting helpers. Everything goes through Intl with a plain fallback, so a missing locale on a phone never crashes a screen. */
const ZERO_DECIMAL = new Set(["CLP", "JPY", "KRW"]);

export function money(cents: number, currency: string, lang: string): string {
  const amount = ZERO_DECIMAL.has(currency) ? cents : cents / 100;
  try { return new Intl.NumberFormat(lang, { style: "currency", currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount); }
  catch { return `${amount} ${currency}`; }
}

type Opts = Intl.DateTimeFormatOptions;
function fmt(iso: string | Date, lang: string, o: Opts): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  try { return new Intl.DateTimeFormat(lang, o).format(d); }
  catch { try { return new Intl.DateTimeFormat(lang, { ...o, timeZone: undefined }).format(d); } catch { return d.toISOString().slice(0, 16).replace("T", " "); } }
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "lun 3 mar, 10:30" in the given time zone (the clinic's, so the hour is the one of the appointment's place). */
export const dateTime = (iso: string, lang: string, timeZone?: string) => fmt(iso, lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone });
export const longDateTime = (iso: string, lang: string, timeZone?: string) => cap(fmt(iso, lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone }));
export const dayLabel = (iso: string, lang: string, timeZone?: string) => cap(fmt(iso, lang, { weekday: "long", day: "numeric", month: "long", timeZone }));
export const shortDay = (iso: string, lang: string, timeZone?: string) => fmt(iso, lang, { weekday: "short", timeZone }).replace(".", "");
export const dayNum = (iso: string, lang: string, timeZone?: string) => fmt(iso, lang, { day: "numeric", timeZone });
export const monthLabel = (iso: string, lang: string, timeZone?: string) => fmt(iso, lang, { month: "short", timeZone }).replace(".", "");
export const hour = (iso: string, lang: string, timeZone?: string) => fmt(iso, lang, { hour: "2-digit", minute: "2-digit", timeZone });
/** Calendar date stored as YYYY-MM-DD (vaccines, due dates): shown without any time-zone shift. */
export const plainDate = (ymd: string, lang: string) => fmt(`${ymd}T12:00:00Z`, lang, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** YYYY-MM-DD of an instant in a time zone (used to group appointments by day). */
export function dayKey(iso: string | Date, timeZone?: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  try {
    const p = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).formatToParts(d);
    const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
    if (g("year") && g("month") && g("day")) return `${g("year")}-${g("month")}-${g("day")}`;
  } catch { /* fall through */ }
  return d.toISOString().slice(0, 10);
}
export const addDays = (ymd: string, n: number) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
/** Days from `today` to `due` (both YYYY-MM-DD); negative when overdue. */
export const daysUntil = (due: string, today: string) => Math.round((Date.parse(`${due}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);
export const todayYmd = () => new Date().toISOString().slice(0, 10);

export const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

/** "25/12/2025" (or 25.12.25, 25-12-2025) → "2025-12-25"; null when it is not a real date between 1990 and 2100. */
export function parseDayMonthYear(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4}|\d{2})$/);
  if (!m) return null;
  const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const iso = `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso || y < 1990 || y > 2100) return null;
  return iso;
}
export const toDayMonthYear = (ymd: string | null) => (ymd ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}` : "");
/** Adds the slashes while the person types digits: 25122025 → 25/12/2025. */
export function maskDate(text: string): string {
  const d = text.replace(/\D/g, "").slice(0, 8);
  return d.length <= 2 ? d : d.length <= 4 ? `${d.slice(0, 2)}/${d.slice(2)}` : `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Decodes base64 (photo data from the image tools) into bytes for the upload. */
export function base64ToBytes(b64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256); for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = lookup[clean.charCodeAt(i)], b = lookup[clean.charCodeAt(i + 1)], c = lookup[clean.charCodeAt(i + 2)], d = lookup[clean.charCodeAt(i + 3)];
    if (p < len) out[p++] = (a << 2) | (b >> 4);
    if (p < len) out[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < len) out[p++] = ((c & 3) << 6) | d;
  }
  return out;
}
