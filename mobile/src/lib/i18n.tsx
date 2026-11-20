import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COUNTRY_LANGS, LANGS, translate, type CopyKey, type Lang } from "@/copy";

type Ctx = { lang: Lang; country: string; setLang: (l: Lang) => void; setCountry: (c: string) => void; t: (key: CopyKey, vars?: Record<string, string | number>) => string };
const I18n = createContext<Ctx | null>(null);

function deviceDefaults(): { lang: Lang; country: string } {
  let code = "en", region = "";
  try { const l = getLocales()[0]; code = (l?.languageCode ?? "en").toLowerCase(); region = (l?.regionCode ?? "").toUpperCase(); } catch { /* keep defaults */ }
  const lang = (LANGS as readonly string[]).includes(code) ? (code as Lang) : "en";
  // unknown region: the main country of the language (Italian → Italy…), so the first search shows relevant vets
  const byLang: Record<Lang, string> = { fr: "FR", it: "IT", es: "ES", en: "GB" };
  return { lang, country: COUNTRY_LANGS[region] ? region : byLang[lang] };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const d = useMemo(deviceDefaults, []);
  const [lang, setLangState] = useState<Lang>(d.lang), [country, setCountryState] = useState(d.country);
  useEffect(() => {
    AsyncStorage.multiGet(["tv.lang", "tv.country"]).then((rows) => {
      const l = rows[0]?.[1], c = rows[1]?.[1];
      if (l && (LANGS as readonly string[]).includes(l)) setLangState(l as Lang);
      if (c && COUNTRY_LANGS[c]) setCountryState(c);
    }).catch(() => {});
  }, []);
  const setLang = useCallback((l: Lang) => { setLangState(l); AsyncStorage.setItem("tv.lang", l).catch(() => {}); }, []);
  const setCountry = useCallback((c: string) => { setCountryState(c); AsyncStorage.setItem("tv.country", c).catch(() => {}); }, []);
  const t = useCallback((key: CopyKey, vars?: Record<string, string | number>) => translate(key, lang, vars), [lang]);
  const value = useMemo(() => ({ lang, country, setLang, setCountry, t }), [lang, country, setLang, setCountry, t]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18n);
  if (!c) throw new Error("I18nProvider missing");
  return c;
}
