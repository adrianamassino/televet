import { getCountry, ZERO_DECIMAL } from "../countries";

export function providerFor(country: string) { return getCountry(country).provider; }

/** Stripe expects minor units; Mercado Pago expects decimal amounts. */
export function toProviderAmount(cents: number, currency: string, provider: "stripe" | "mercadopago") {
  if (provider === "stripe") return cents;
  return ZERO_DECIMAL.has(currency) ? cents : cents / 100;
}
