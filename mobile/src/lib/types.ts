export type ServiceType = "video" | "home" | "clinic" | "expertise";
export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";
export type PaymentStatus = "none" | "pending" | "authorized" | "captured" | "refunded" | "failed";

export type PracticeCard = {
  id: string; name: string; slug: string; kind: string; headline: string | null; city: string | null; address: string | null; postalCode: string | null;
  logoUrl: string | null; timezone: string; types: ServiceType[]; bookable: boolean; nextSlot: string | null;
};
export type VetCard = { id: string; name: string; photoUrl: string | null; specialties: string[] };
export type Service = { id: string; vetId: string | null; type: ServiceType; name: string | null; description: string | null; duration: number; price: number; currency: string; onlinePayment: boolean };
export type PracticeDetail = {
  practice: {
    id: string; name: string; slug: string; kind: string; headline: string | null; about: string | null; address: string | null; postalCode: string | null; city: string | null; phone: string | null;
    logoUrl: string | null; coverUrl: string | null; languages: string[]; species: string[]; timezone: string; country: string; bookable: boolean; provider: "stripe" | "mercadopago"; paymentsReady: boolean;
  };
  vets: VetCard[]; services: Service[];
};
export type Slot = { start: string; end: string; day: string };

export type OwnerBooking = {
  id: string; starts_at: string; ends_at: string; type: ServiceType; status: BookingStatus; payment_status: PaymentStatus; price_cents: number; currency: string; vet_reply: string | null;
  practices: { name: string; timezone: string } | null; pets: { name: string } | null; practitioners: { display_name: string } | null;
};
export type ProBooking = {
  id: string; starts_at: string; ends_at: string; type: ServiceType; status: BookingStatus; address: string | null; motive: string | null; access_notes: string | null;
  price_cents: number; currency: string; payment_status: PaymentStatus; video_room: string | null;
  owners: { full_name: string; phone: string | null } | null; pets: { name: string; species: string } | null; services: { custom_name: string | null; catalog_code: string } | null;
};
export type Client = { id: string; name: string; phone: string; email: string; pets: Record<string, string>; visits: number; types: Record<string, number>; spent: Record<string, number>; last: string };
export type Practice = { id: string; name: string; slug: string; country: string; timezone: string; city: string | null; logo_url: string | null; published: boolean; review_status: string; stripe_status: string; mp_status: string; booking_enabled: boolean | null };

export type Pet = { id: string; name: string; species: string };
export const RECORD_KINDS = ["vaccine", "antiparasitic", "treatment", "surgery", "visit", "test", "other"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];
export type HealthRecord = { id: string; kind: RecordKind; name: string; done_on: string | null; next_due: string | null; vet_name: string | null; document_id: string | null };
export type PetDoc = { id: string; storage_path: string; created_at: string; url?: string };
export type Proposal = { kind: RecordKind; name: string; done_on: string | null; next_due: string | null; vet_name: string | null; notes: string | null };

export type VideoAccess = { ok: true; url: string } | { ok: false; reason: "not_video" | "not_confirmed" | "too_early" | "closed"; opensAt?: string };
