"use client";
import { useEffect, useMemo, useState } from "react";

type Client = { id: string; name: string; phone: string; email: string; pets: Record<string, string>; visits: number; types: Record<string, number>; spent: Record<string, number>; last: string };

/** Everyone who booked with this practice: pets, appointment types, amount spent. */
export default function ClientsList({ lang, tz, t, money, token }: { lang: string; tz: string; t: (k: string) => string; money: (c: number, cur: string) => string; token: () => Promise<string> }) {
  const [rows, setRows] = useState<Client[] | null>(null), [q, setQ] = useState("");
  useEffect(() => { (async () => { const r = await fetch("/api/pro/clients", { headers: { authorization: `Bearer ${await token()}` } }); setRows(r.ok ? (await r.json()).clients : []); })(); }, [token]);
  const list = useMemo(() => { const s = q.trim().toLowerCase(); return (rows ?? []).filter((c) => !s || `${c.name} ${c.email} ${c.phone} ${Object.keys(c.pets).join(" ")}`.toLowerCase().includes(s)); }, [rows, q]);
  const date = (iso: string) => new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric", timeZone: tz }).format(new Date(iso));
  return (
    <section>
      <h1>{t("nClients")} {rows && <small>({rows.length} {t("cTotal")})</small>}</h1>
      <input className="field" style={{ maxWidth: 420 }} placeholder={t("clientSearch")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("clientSearch")} />
      {rows && !rows.length && <p>{t("clientsEmpty")}</p>}
      {list.length > 0 && <div className="adm-scroll" style={{ marginTop: 14 }}><table className="cl-table"><thead><tr><th>{t("cClient")}</th><th>{t("cContact")}</th><th>{t("cPets")}</th><th>{t("cVisits")}</th><th>{t("cTypes")}</th><th>{t("cSpent")}</th><th>{t("cLast")}</th></tr></thead><tbody>
        {list.map((c) => <tr key={c.id}>
          <td><strong>{c.name || "—"}</strong></td>
          <td>{c.email}<small>{c.phone}</small></td>
          <td>{Object.entries(c.pets).map(([n, sp]) => <div key={n}>{n} <small>({sp})</small></div>)}{!Object.keys(c.pets).length && "—"}</td>
          <td>{c.visits}</td>
          <td>{Object.entries(c.types).map(([k, n]) => `${t("t_" + k).split(" (")[0]} ×${n}`).join(", ")}</td>
          <td>{Object.entries(c.spent).map(([cur, v]) => money(v, cur)).join(" + ") || "—"}</td>
          <td>{date(c.last)}</td></tr>)}
      </tbody></table></div>}
    </section>
  );
}
