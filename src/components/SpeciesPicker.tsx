"use client";
import { CATEGORIES, COMMON, speciesChecked, speciesName, toggleSpecies } from "@/lib/species";

/**
 * Animals a clinic or vet treats: the most common first, then one line per category ("Rodents — all") that opens to
 * tick only some of them. A category ticked as a whole is saved as the category code (new animals added to it later count too).
 */
const ALL: Record<string, string> = { fr: "tous", it: "tutti", en: "all", es: "todos", pt: "todos", de: "alle", pl: "wszystkie", nl: "alle" };
const SOME: Record<string, string> = { fr: "Choisir lesquels", it: "Scegli quali", en: "Choose which", es: "Elegir cuáles", pt: "Escolher quais", de: "Auswählen", pl: "Wybierz które", nl: "Kies welke" };

export default function SpeciesPicker({ lang, value, onChange }: { lang: string; value: string[]; onChange: (v: string[]) => void }) {
  const l = lang.slice(0, 2);
  const set = (code: string, on: boolean) => onChange(toggleSpecies(value, code, on));
  return (
    <div className="sp-pick">
      <div className="days">
        {COMMON.map((c) => <label key={c}><input type="checkbox" checked={value.includes(c)} onChange={(e) => set(c, e.target.checked)} />{speciesName(c, lang, true)}</label>)}
      </div>
      {CATEGORIES.map((cat) => {
        const all = value.includes(cat.code), n = cat.members.filter((m) => speciesChecked(value, m)).length;
        return (
          <details key={cat.code} className="sp-cat" open={!all && n > 0 ? true : undefined}>
            <summary>
              <label onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={all} ref={(el) => { if (el) el.indeterminate = !all && n > 0; }} onChange={(e) => set(cat.code, e.target.checked)} />
                {speciesName(cat.code, lang, true)} <small>({all ? ALL[l] ?? ALL.en : `${n}/${cat.members.length}`})</small>
              </label>
              <span className="sp-more">{SOME[l] ?? SOME.en}</span>
            </summary>
            <div className="days">
              {cat.members.map((m) => <label key={m}><input type="checkbox" checked={speciesChecked(value, m)} onChange={(e) => set(m, e.target.checked)} />{speciesName(m, lang, true)}</label>)}
            </div>
          </details>
        );
      })}
      <div className="days"><label><input type="checkbox" checked={value.includes("other")} onChange={(e) => set("other", e.target.checked)} />{speciesName("other", lang, true)}</label></div>
    </div>
  );
}

/** <select> of a pet's species: most common first, then grouped by category. */
export function SpeciesSelect({ lang, value, onChange, className = "field" }: { lang: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {COMMON.map((c) => <option key={c} value={c}>{speciesName(c, lang)}</option>)}
      {CATEGORIES.map((cat) => <optgroup key={cat.code} label={speciesName(cat.code, lang, true)}>
        {cat.members.map((m) => <option key={m} value={m}>{speciesName(m, lang)}</option>)}
      </optgroup>)}
      <option value="other">{speciesName("other", lang)}</option>
    </select>
  );
}
