/**
 * Practice management software (PIMS) connectors: Vetup (FR), VetIt and Petbooqz (AU).
 * The current app.televet.co already talks to these three: port its connector code here
 * (same endpoints, same credentials) so connected clinics keep working without reconnecting.
 * Their APIs are partner-only: endpoints and auth are provided under contract.
 * Implement the two methods below once the partner documentation is received;
 * the rest of the platform (sync job, availability, booking push) already uses them.
 */
export interface PimsInterval { start: Date; end: Date; uid: string }
export interface PimsBooking { id: string; start: Date; end: Date; title: string; clientName: string; petName?: string; notes?: string }

export interface PimsAdapter {
  /** Busy times (appointments, blocks) for the practitioner in [from, to]. */
  getBusy(credentials: { apiKey: string; externalCalendarId?: string | null }, from: Date, to: Date): Promise<PimsInterval[]>;
  /** Writes a confirmed Televet booking into the practice calendar; returns the external id. */
  pushBooking(credentials: { apiKey: string; externalCalendarId?: string | null }, booking: PimsBooking): Promise<string>;
}

export class PimsNotConfigured extends Error {}

function pending(name: string, envVar: string): PimsAdapter {
  const fail = async (): Promise<never> => {
    throw new PimsNotConfigured(`${name} API not configured: set ${envVar} and implement src/lib/calendar/pims.ts once the partner documentation is available.`);
  };
  return { getBusy: fail, pushBooking: fail };
}

export type PimsProvider = "vetup" | "vetit" | "petbooqz";

export const ADAPTERS: Record<PimsProvider, PimsAdapter> = {
  vetup: pending("Vetup", "VETUP_API_BASE"),
  vetit: pending("VetIt", "VETIT_API_BASE"),
  petbooqz: pending("Petbooqz", "PETBOOQZ_API_BASE"),
};
