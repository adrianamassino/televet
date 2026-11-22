"use client";
import { speciesName } from "@/lib/species";
import { directionsUrl } from "@/lib/travel";
import JoinVideo from "@/components/JoinVideo";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type AgendaBooking = { id: string; starts_at: string; ends_at: string; type: string; status: string; address: string | null; motive: string | null; access_notes: string | null; travel_min?: number | null; price_cents: number; currency: string; video_room: string | null; owners: { full_name: string; phone: string | null } | null; pets: { name: string; species: string } | null };

const H0 = 7, H1 = 21, PX = 46; // visible hours and pixels per hour

/** Calendar date and minutes-from-midnight of an instant, in the practice's time zone. */
function local(iso: string, tz: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, min: Number(parts.hour) * 60 + Number(parts.minute) };
}
const addDay = (ymd: string, n: number) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const mondayOf = (ymd: string) => { const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay(); return addDay(ymd, dow === 0 ? -6 : 1 - dow); };

/** Week agenda: one column per day, appointments placed on the hour grid, click one for the details. */
export default function AgendaWeek({ lang, tz, t, money, token, onAct }: { lang: string; tz: string; t: (k: string) => string; money: (c: number, cur: string) => string; token: () => Promise<string>; onAct: (id: string, what: "confirm" | "decline") => Promise<void> }) {
  const todayYmd = useMemo(() => local(new Date().toISOString(), tz).day, [tz]);
  const [monday, setMonday] = useState(() => mondayOf(todayYmd)), [items, setItems] = useState<AgendaBooking[]>([]), [sel, setSel] = useState<AgendaBooking | null>(null), [busy, setBusy] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDay(monday, i)), [monday]);

  const load = useCallback(async () => {
    setBusy(true);
    // fetch a day of margin on each side so time-zone differences never hide an appointment
    const from = new Date(`${addDay(monday, -1)}T00:00:00Z`).toISOString(), to = new Date(`${addDay(monday, 8)}T00:00:00Z`).toISOString();
    const r = await fetch(`/api/pro/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers: { authorization: `Bearer ${await token()}` } });
    setItems(r.ok ? ((await r.json()).bookings as AgendaBooking[]) : []);
    setBusy(false);
  }, [monday, token]);
  useEffect(() => { load(); }, [load]);

  const shown = items.filter((b) => b.status === "confirmed" || b.status === "pending");
  const byDay = (d: string) => shown.filter((b) => local(b.starts_at, tz).day === d);
  const fmtDay = (d: string) => new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const title = `${new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${days[0]}T12:00:00Z`))} – ${new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${days[6]}T12:00:00Z`))}`;
  const hhmm = (iso: string) => new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso));
  const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);

  return (
    <div className="ag">
      <div className="ag-bar">
        <button className="btn btn-ghost" aria-label="←" onClick={() => setMonday(addDay(monday, -7))}><ChevronLeft size={18} aria-hidden /></button>
        <button className="btn btn-ghost" onClick={() => setMonday(mondayOf(todayYmd))}>{t("today")}</button>
        <button className="btn btn-ghost" aria-label="→" onClick={() => setMonday(addDay(monday, 7))}><ChevronRight size={18} aria-hidden /></button>
        <strong className="ag-title">{title}</strong>{busy && <small>…</small>}
      </div>
      <div className="ag-scroll">
        <div className="ag-grid" style={{ ["--hrs" as string]: H1 - H0, ["--px" as string]: `${PX}px` }}>
          <div className="ag-corner" />
          {days.map((d) => <div key={d} className={`ag-head${d === todayYmd ? " today" : ""}`}>{fmtDay(d)}</div>)}
          <div className="ag-hours">{hours.map((h) => <span key={h} style={{ height: PX }}>{String(h).padStart(2, "0")}:00</span>)}</div>
          {days.map((d) => (
            <div key={d} className={`ag-col${d === todayYmd ? " today" : ""}`}>
              {byDay(d).map((b) => {
                const s = local(b.starts_at, tz), e = local(b.ends_at, tz), top = Math.max(0, (s.min - H0 * 60) / 60 * PX), h = Math.max(22, ((e.day === s.day ? e.min : 24 * 60) - s.min) / 60 * PX);
                return <button key={b.id} className={`ag-ev ${b.type} ${b.status}`} style={{ top, height: h }} onClick={() => setSel(b)} title={`${hhmm(b.starts_at)} ${b.owners?.full_name ?? ""}`}>
                  <b>{hhmm(b.starts_at)}</b> {b.pets?.name || b.owners?.full_name}<small>{t("t_" + b.type).split(" (")[0]}</small></button>;
              })}
            </div>
          ))}
        </div>
      </div>
      {!busy && shown.filter((b) => days.includes(local(b.starts_at, tz).day)).length === 0 && <p className="ag-empty">{t("noWeek")}</p>}
      {sel && <div className="panel ag-detail" role="dialog" aria-label={sel.owners?.full_name ?? ""}>
        <button className="btn btn-quiet" style={{ float: "right" }} onClick={() => setSel(null)}>{t("close")}</button>
        <strong>{new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(sel.starts_at))}</strong>{" "}
        <span className={`chip ${sel.status === "confirmed" ? "ok" : "wait"}`}>{t("s_" + sel.status)}</span>
        <div>{t("t_" + sel.type).split(" (")[0]} · {money(sel.price_cents, sel.currency)}</div>
        <div>{sel.owners?.full_name}{sel.owners?.phone ? ` · ${sel.owners.phone}` : ""}{sel.pets?.name ? ` — ${sel.pets.name} (${speciesName(sel.pets.species, lang, false, false)})` : ""}</div>
        {sel.motive && <small>{sel.motive}</small>}{sel.address && <div><small><a href={directionsUrl(sel.address)} target="_blank" rel="noopener noreferrer">{sel.address} ↗</a>{sel.access_notes ? ` · ${sel.access_notes}` : ""}{sel.travel_min ? ` · 🚗 ${sel.travel_min} min` : ""}</small></div>}
        {sel.status === "confirmed" && sel.video_room && sel.type === "video" && <div style={{ marginTop: 6 }}><JoinVideo bookingId={sel.id} lang={lang} /></div>}
        {sel.status === "pending" && <p><button className="btn" disabled={busy} onClick={async () => { await onAct(sel.id, "confirm"); setSel(null); load(); }}>{t("accept")}</button>{" "}<button className="btn btn-ghost" disabled={busy} onClick={async () => { await onAct(sel.id, "decline"); setSel(null); load(); }}>{t("decline")}</button></p>}
      </div>}
    </div>
  );
}
