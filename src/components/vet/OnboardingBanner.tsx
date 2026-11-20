"use client";
import { useEffect, useState } from "react";
import { ONBOARDING_COPY, type Missing } from "@/lib/onboarding-copy";

/** Setup checklist shown at the top of the vet space until the profile can take bookings. */
export default function OnboardingBanner({ lang, t, token, go, refreshKey }: { lang: string; t: (k: string) => string; token: () => Promise<string>; go: (m: Missing) => void; refreshKey: unknown }) {
  const [missing, setMissing] = useState<Missing[]>([]);
  useEffect(() => { (async () => { try { const r = await fetch("/api/pro/onboarding", { headers: { authorization: `Bearer ${await token()}` } }); if (r.ok) setMissing((await r.json()).missing ?? []); } catch {} })(); }, [token, refreshKey]);
  if (!missing.length) return null;
  const items = (ONBOARDING_COPY[lang] ?? ONBOARDING_COPY.en).items;
  return (
    <div className="ob-banner" role="status">
      <strong>{t("obTitle")}</strong><p>{t("obSub")}</p>
      <ul>{missing.map((m) => <li key={m}><button onClick={() => go(m)}>{items[m]} →</button></li>)}</ul>
    </div>
  );
}
