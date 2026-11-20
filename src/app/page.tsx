import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

export const dynamic = "force-dynamic";

// Language -> default country when the visitor's country is not served
const LANG_DEFAULT: Record<string, string> = { fr: "FR", it: "IT", es: "ES", pt: "PT", de: "DE", pl: "PL", en: "GB" };

function geoCountry(h: Headers): string | null {
  try {
    const raw = h.get("x-nf-geo");
    if (raw) {
      const code = JSON.parse(Buffer.from(raw, "base64").toString("utf8"))?.country?.code;
      if (code) return String(code).toUpperCase();
    }
  } catch {}
  const c = h.get("x-country") || h.get("x-vercel-ip-country");
  return c ? c.toUpperCase() : null;
}

export default async function Home() {
  const h = await headers();
  const accepted = (h.get("accept-language") || "")
    .split(",").map((p) => p.trim().split(";")[0].toLowerCase()).filter(Boolean);
  const preferred = accepted.map((a) => a.split("-")[0]);

  let country = geoCountry(h);
  if (!country || !COUNTRIES[country]) {
    const first = preferred.find((l) => LANG_DEFAULT[l]);
    country = first ? LANG_DEFAULT[first] : "FR";
  }
  const cfg = COUNTRIES[country];
  const lang = preferred.find((l) => cfg.languages.includes(l)) || cfg.languages[0];
  redirect(`/${lang}/${country.toLowerCase()}`);
}
