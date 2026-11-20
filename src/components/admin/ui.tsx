"use client";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "./AdminShell";

export type Money = Record<string, { gross: number; commission: number; net: number }>;
export type Stat = { total: number; byType: Record<string, number>; byStatus: Record<string, number>; revenue: Money; patients: number; clients: number };

export const TYPE: Record<string, string> = { home: "A domicilio", video: "Teleconsulto", clinic: "In clinica", expertise: "Perizia" };
export const KIND: Record<string, string> = { clinic: "Clinica", vet: "Veterinario", home: "Vet a domicilio" };
export const STATUS: Record<string, string> = { pending: "Da confermare", confirmed: "Confermato", declined: "Rifiutato", cancelled: "Annullato" };
export const REVIEW: Record<string, string> = { pending: "Da approvare", approved: "Approvata", rejected: "Rifiutata", suspended: "Sospesa" };
export const PAY: Record<string, string> = { none: "—", pending: "In attesa", authorized: "Autorizzato", captured: "Pagato", refunded: "Rimborsato", failed: "Fallito" };

export const eur = (cents: number, cur: string) => new Intl.NumberFormat("it-IT", { style: "currency", currency: cur }).format(cents / 100);
export const date = (s: string | null) => (s ? new Date(s).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : "—");
export const day = (s: string | null) => (s ? new Date(s).toLocaleDateString("it-IT") : "—");
export function Moneys({ m, k = "gross" }: { m?: Money; k?: "gross" | "commission" | "net" }) {
  const e = Object.entries(m ?? {});
  return <>{e.length ? e.map(([c, v]) => eur(v[k], c)).join(" + ") : "—"}</>;
}
export const Badge = ({ s, label }: { s: string; label: string }) => <span className={`adm-badge ${s}`}>{label}</span>;
export const Types = ({ s }: { s?: Stat | null }) => <>{s && s.total ? Object.entries(s.byType).map(([t, n]) => `${TYPE[t] ?? t}: ${n}`).join(" · ") : "—"}</>;

/** Loads JSON from an admin endpoint and reloads when the URL changes. */
export function useLoad<T>(url: string) {
  const { api } = useAdmin();
  const [data, setData] = useState<T | null>(null), [err, setErr] = useState(""), [busy, setBusy] = useState(true);
  const load = useCallback(async () => { setBusy(true); setErr(""); try { setData(await api<T>(url)); } catch (e) { setErr((e as Error).message); } setBusy(false); }, [api, url]);
  useEffect(() => { load(); }, [load]);
  return { data, err, busy, reload: load };
}
export const Err = ({ m }: { m: string }) => (m ? <p role="alert" className="adm-err">{m}</p> : null);

/** Country names in Italian, in the order they appear in the country filter. */
export const COUNTRY_NAMES: Record<string, string> = { FR: "Francia", IT: "Italia", ES: "Spagna", PT: "Portogallo", BE: "Belgio", CH: "Svizzera", DE: "Germania", AT: "Austria", PL: "Polonia", GB: "Regno Unito", US: "Stati Uniti", AU: "Australia", MX: "Messico", AR: "Argentina", UY: "Uruguay", CL: "Cile", BR: "Brasile" };
export const countryName = (c?: string | null) => (c ? COUNTRY_NAMES[c] ?? c : "—");

/** Country selector shared by every list: the choice is remembered between pages. */
export function useCountry(initial?: string | null) {
  const [country, set] = useState<string>(() => {
    if (initial) return initial;
    try { return localStorage.getItem("adm-country") ?? ""; } catch { return ""; }
  });
  const setCountry = (c: string) => { set(c); try { localStorage.setItem("adm-country", c); } catch {} };
  return [country, setCountry] as const;
}
export function CountrySelect({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Paese">
      <option value="">Tutti i paesi</option>
      {Object.entries(COUNTRY_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}

/** Downloads the rows currently shown as a CSV file that opens in Excel (UTF-8 with BOM, ';' separator). */
export function CsvButton({ name, rows }: { name: string; rows: (string | number | null | undefined)[][] }) {
  const go = () => {
    const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const blob = new Blob(["\ufeff" + rows.map((r) => r.map(esc).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  };
  return <button type="button" className="adm-btn" onClick={go} disabled={rows.length < 2}>Esporta CSV</button>;
}

/** Plain-words description of a commission rule (percentage taken from the vet's price, or a fixed fee added on top). */
export const ruleLabel = (pct: number | null | undefined, fixed: number | null | undefined, cur = "EUR") =>
  fixed !== null && fixed !== undefined ? `${eur(fixed, cur)} fissi in più` : pct !== null && pct !== undefined ? `${pct}%` : "—";

export type CommissionBody = { commission_pct: number | null; commission_fixed_cents: number | null };
/** Commission editor: percentage OR fixed fee in euros (stored as cents) added to the vet's price (10 = 10,00 €). `inherit` = label shown when nothing is set (omit to force a value). */
export function CommissionInput({ pct, fixed, inherit, cur = "EUR", onSave }: { pct: number | null; fixed: number | null; inherit?: string; cur?: string; onSave: (b: CommissionBody) => void | Promise<void> }) {
  const start = fixed !== null && fixed !== undefined ? "fixed" : pct !== null && pct !== undefined ? "pct" : inherit ? "inherit" : "pct";
  const [mode, setMode] = useState<"inherit" | "pct" | "fixed">(start as "inherit" | "pct" | "fixed");
  const [v, setV] = useState(start === "fixed" ? String((fixed as number) / 100) : start === "pct" ? String(pct) : "");
  const n = Number(v), ok = mode === "inherit" || (v !== "" && Number.isFinite(n) && n >= 0 && (mode === "pct" ? n <= 100 : n <= 10000 && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6));
  const save = () => onSave(mode === "inherit" ? { commission_pct: null, commission_fixed_cents: null } : mode === "pct" ? { commission_pct: n, commission_fixed_cents: null } : { commission_pct: null, commission_fixed_cents: Math.round(n * 100) });
  return (
    <div className="adm-commission">
      <div className="adm-inline">
        <select value={mode} onChange={(e) => setMode(e.target.value as "inherit" | "pct" | "fixed")} aria-label="Tipo di commissione">
          {inherit && <option value="inherit">{inherit}</option>}
          <option value="pct">Percentuale</option>
          <option value="fixed">Importo fisso</option>
        </select>
        {mode !== "inherit" && <><input type="number" min={0} max={mode === "pct" ? 100 : undefined} step={mode === "pct" ? "0.5" : "0.5"} value={v} onChange={(e) => setV(e.target.value)} aria-label="Valore commissione" /><span>{mode === "pct" ? "%" : "€"}</span></>}
        <button className="adm-btn" disabled={!ok} onClick={save}>Salva</button>
      </div>
      {mode === "fixed" && <small className="adm-sub">{ok && v !== "" ? `Il cliente paga ${eur(n * 100, cur)} in più del prezzo del veterinario` : "In euro, es. 10 = 10,00 €"}</small>}
      {mode === "pct" && <small className="adm-sub">Trattenuta dal prezzo del veterinario</small>}
    </div>
  );
}
