"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CONSULT_CATEGORIES, CONSULTS, consultCategoryName, consultName, norm, searchConsults, type Consult, type Mode } from "@/lib/consult-catalog";

/**
 * Name of a consultation in the vet's editor. While the vet types, the Televet catalogue suggests matching consultations
 * (names shown in every language to clients). Nothing matches → similar entries ("did you mean…") and the choice to
 * create a consultation in the vet's own words. With an empty field, the vet can browse the catalogue by category.
 */
const L = {
  fr: { ph: "Ex. : vaccination, dermatologie, bilan senior…", sug: "Catalogue Televet", near: "Vous cherchiez peut-être", create: "Créer « {q} » avec mes propres mots", browse: "Parcourir le catalogue", fromCat: "Consultation du catalogue : son nom s'affiche dans la langue de chaque client.", custom: "Consultation personnalisée : affichée telle que vous l'avez écrite.", change: "Changer", none: "Aucune consultation du catalogue ne correspond." },
  it: { ph: "Es.: vaccinazione, dermatologia, visita geriatrica…", sug: "Catalogo Televet", near: "Forse cercavi", create: "Crea «{q}» con parole mie", browse: "Sfoglia il catalogo", fromCat: "Consulto del catalogo: il nome appare nella lingua di ogni cliente.", custom: "Consulto personalizzato: appare come l'hai scritto.", change: "Cambia", none: "Nessun consulto del catalogo corrisponde." },
  en: { ph: "E.g. vaccination, dermatology, senior check-up…", sug: "Televet catalogue", near: "Did you mean", create: "Create “{q}” in my own words", browse: "Browse the catalogue", fromCat: "Catalogue consultation: its name is shown in each client's language.", custom: "Custom consultation: shown exactly as you wrote it.", change: "Change", none: "No catalogue consultation matches." },
  es: { ph: "Ej.: vacunación, dermatología, revisión geriátrica…", sug: "Catálogo Televet", near: "Quizás buscabas", create: "Crear «{q}» con mis palabras", browse: "Ver el catálogo", fromCat: "Consulta del catálogo: su nombre aparece en el idioma de cada cliente.", custom: "Consulta personalizada: aparece tal como la escribiste.", change: "Cambiar", none: "Ninguna consulta del catálogo coincide." },
  pl: { ph: "Np. szczepienie, dermatologia, badanie seniora…", sug: "Katalog Televet", near: "Czy chodziło o", create: "Utwórz „{q}” własnymi słowami", browse: "Przeglądaj katalog", fromCat: "Konsultacja z katalogu: nazwa wyświetla się w języku każdego klienta.", custom: "Własna konsultacja: wyświetlana tak, jak ją napisano.", change: "Zmień", none: "Żadna konsultacja z katalogu nie pasuje." },
} as const;

export interface ConsultValue { code: string; customName: string }

export default function ConsultPicker({ lang, mode, value, onChange }: { lang: string; mode?: Mode; value: ConsultValue; onChange: (v: ConsultValue, picked?: Consult) => void }) {
  const t = L[(lang in L ? lang : "en") as keyof typeof L];
  const chosen = value.code && !value.customName ? consultName(value.code, lang) : undefined;
  const [text, setText] = useState(chosen ?? value.customName ?? ""), [open, setOpen] = useState(false), [browse, setBrowse] = useState(false), [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null), listId = useId();
  useEffect(() => { setText(chosen ?? value.customName ?? ""); }, [value.code, value.customName, chosen]);
  useEffect(() => {
    const out = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) { setOpen(false); setBrowse(false); } };
    document.addEventListener("mousedown", out); return () => document.removeEventListener("mousedown", out);
  }, []);

  const matches = useMemo(() => searchConsults(text, lang, { mode, limit: 8 }), [text, lang, mode]);
  const strong = matches.filter((m) => !m.close), near = matches.filter((m) => m.close).slice(0, 4);
  const exact = matches.some((m) => m.exact);
  const q = text.trim();
  const rows: ({ kind: "pick"; c: Consult } | { kind: "create" })[] = [...strong.map((m) => ({ kind: "pick" as const, c: m.consult })), ...near.map((m) => ({ kind: "pick" as const, c: m.consult })), ...(q && !exact ? [{ kind: "create" as const }] : [])];

  const pick = (c: Consult) => { onChange({ code: c.code, customName: "" }, c); setText(consultName(c.code, lang) ?? ""); setOpen(false); setBrowse(false); };
  const custom = () => { onChange({ code: "custom", customName: q }); setOpen(false); };
  const type = (v: string) => {
    setText(v); setOpen(true); setBrowse(false); setHi(0);
    // typing keeps the field in sync: the exact name of a catalogue entry selects it, anything else is the vet's own wording
    const ex = CONSULTS.find((c) => norm(consultName(c.code, lang) ?? "") === norm(v));
    onChange(ex ? { code: ex.code, customName: "" } : { code: v.trim() ? "custom" : "", customName: v.trim() });
  };
  const key = (e: React.KeyboardEvent) => {
    if (!open || !rows.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % rows.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + rows.length) % rows.length); }
    else if (e.key === "Enter") { e.preventDefault(); const r = rows[hi]; if (r) r.kind === "pick" ? pick(r.c) : custom(); }
    else if (e.key === "Escape") setOpen(false);
  };
  const isCat = !!chosen;
  let i = -1;
  const item = (c: Consult) => { i++; const my = i; return (
    <li key={c.code} role="option" aria-selected={hi === my} className={hi === my ? "on" : ""} onMouseEnter={() => setHi(my)} onMouseDown={(e) => { e.preventDefault(); pick(c); }}>
      <span>{consultName(c.code, lang)}</span><small>{consultCategoryName(c.category, lang)} · {c.minutes} min</small>
    </li>); };

  return (
    <div className="cpick" ref={box}>
      <input className="field" role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" placeholder={t.ph} value={text}
        onChange={(e) => type(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={key} />
      {(isCat || value.customName) && <p className={`cpick-note ${isCat ? "cat" : "own"}`}>{isCat ? t.fromCat : t.custom}</p>}
      {open && q && (
        <ul className="cpick-list" id={listId} role="listbox">
          {strong.length > 0 && <li className="cpick-h" aria-hidden>{t.sug}</li>}
          {strong.map((m) => item(m.consult))}
          {near.length > 0 && <li className="cpick-h" aria-hidden>{strong.length ? t.near : `${t.none} ${t.near}`}</li>}
          {near.map((m) => item(m.consult))}
          {!strong.length && !near.length && <li className="cpick-h" aria-hidden>{t.none}</li>}
          {!exact && (() => { i++; const my = i; return <li role="option" aria-selected={hi === my} className={`cpick-new${hi === my ? " on" : ""}`} onMouseEnter={() => setHi(my)} onMouseDown={(e) => { e.preventDefault(); custom(); }}>+ {t.create.replace("{q}", q)}</li>; })()}
        </ul>
      )}
      {open && !q && <button type="button" className="btn btn-quiet cpick-browse" onMouseDown={(e) => { e.preventDefault(); setBrowse(!browse); }}>{t.browse}</button>}
      {browse && !q && (
        <div className="cpick-cat" role="listbox">
          {CONSULT_CATEGORIES.map((cat) => {
            const list = CONSULTS.filter((c) => c.category === cat.code && (!mode || c.modes.includes(mode)));
            if (!list.length) return null;
            return <details key={cat.code}><summary>{consultCategoryName(cat.code, lang)} <small>({list.length})</small></summary>
              <ul>{list.map((c) => <li key={c.code}><button type="button" onClick={() => pick(c)}>{consultName(c.code, lang)}</button></li>)}</ul></details>;
          })}
        </div>
      )}
    </div>
  );
}
