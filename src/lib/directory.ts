import { createHash, randomInt } from "crypto";

export const hashCode = (code: string, claimId: string) => createHash("sha256").update(`${claimId}:${code}`).digest("hex");
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/** e-mail method: the address must be on the clinic website's domain (not a free webmail). */
const FREE_MAIL = /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|aol|orange|free|sfr|laposte|wanadoo|gmx|web|libero|virgilio|proton|protonmail)\./i;
export function emailMatchesWebsite(email: string, website: string | null) {
  if (!website) return false;
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain || FREE_MAIL.test(domain)) return false;
  let host: string;
  try { host = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.toLowerCase().replace(/^www\./, ""); } catch { return false; }
  return domain === host || domain.endsWith(`.${host}`);
}

export const slugForListing = (name: string, city: string | null, ref: string) =>
  `${name} ${city ?? ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) + "-" + ref.slice(-5).toLowerCase();

/** Minimal CSV line parser (quoted fields, commas) used by the import scripts. */
export function parseCsvLine(line: string, sep = ","): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out;
}
