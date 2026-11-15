export type PaymentProvider = "stripe" | "mercadopago";

export interface CountryConfig {
  code: string;
  currency: string;
  languages: string[];
  locale: string; // used with Intl (e.g. "es-AR")
  timezone: string; // default practice timezone
  provider: PaymentProvider;
  /** Returns the normalized postal code found in an address, or null. */
  postalPattern: RegExp;
}

const C = (
  code: string, currency: string, languages: string[], timezone: string,
  provider: PaymentProvider, postalPattern: RegExp,
): CountryConfig => ({ code, currency, languages, locale: `${languages[0]}-${code}`, timezone, provider, postalPattern });

export const COUNTRIES: Record<string, CountryConfig> = {
  FR: C("FR", "EUR", ["fr", "en"], "Europe/Paris", "stripe", /\b(\d{5})\b/),
  BE: C("BE", "EUR", ["fr", "nl", "en"], "Europe/Brussels", "stripe", /\b(\d{4})\b/),
  CH: C("CH", "CHF", ["fr", "de", "it", "en"], "Europe/Zurich", "stripe", /\b(\d{4})\b/),
  IT: C("IT", "EUR", ["it", "en"], "Europe/Rome", "stripe", /\b(\d{5})\b/),
  ES: C("ES", "EUR", ["es", "en"], "Europe/Madrid", "stripe", /\b(\d{5})\b/),
  PT: C("PT", "EUR", ["pt", "en"], "Europe/Lisbon", "stripe", /\b(\d{4})-?\d{3}\b/),
  DE: C("DE", "EUR", ["de", "en"], "Europe/Berlin", "stripe", /\b(\d{5})\b/),
  AT: C("AT", "EUR", ["de", "en"], "Europe/Vienna", "stripe", /\b(\d{4})\b/),
  PL: C("PL", "PLN", ["pl", "en"], "Europe/Warsaw", "stripe", /\b(\d{2}-\d{3})\b/),
  GB: C("GB", "GBP", ["en"], "Europe/London", "stripe", /\b([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b/i),
  US: C("US", "USD", ["en", "es"], "America/New_York", "stripe", /\b(\d{5})(?:-\d{4})?\b/),
  AU: C("AU", "AUD", ["en"], "Australia/Sydney", "stripe", /\b(\d{4})\b/),
  MX: C("MX", "MXN", ["es", "en"], "America/Mexico_City", "mercadopago", /\b(\d{5})\b/),
  AR: C("AR", "ARS", ["es"], "America/Argentina/Buenos_Aires", "mercadopago", /\b([A-Z]\d{4})[A-Z]{0,3}\b/i),
  UY: C("UY", "UYU", ["es"], "America/Montevideo", "mercadopago", /\b(\d{5})\b/),
  CL: C("CL", "CLP", ["es"], "America/Santiago", "mercadopago", /\b(\d{7})\b/),
  BR: C("BR", "BRL", ["pt"], "America/Sao_Paulo", "mercadopago", /\b(\d{5})-?\d{3}\b/),
};

export function getCountry(code: string): CountryConfig {
  const c = COUNTRIES[code.toUpperCase()];
  if (!c) throw new Error(`Unsupported country: ${code}`);
  return c;
}

/** Currencies without minor units in Stripe/MP amounts. */
export const ZERO_DECIMAL = new Set(["CLP", "JPY", "KRW"]);

export function formatMoney(cents: number, currency: string, locale: string): string {
  const amount = ZERO_DECIMAL.has(currency) ? cents : cents / 100;
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
