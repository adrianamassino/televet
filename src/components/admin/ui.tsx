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
