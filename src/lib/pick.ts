/** Picks copy for lang, preferring a country variant (e.g. es-AR) when one exists. */
export function pick<T>(m: Record<string, T>, lang: string, country: string, fb: string = "en"): T {
  return m[`${lang}-${country.toUpperCase()}`] ?? m[lang] ?? m[fb];
}
