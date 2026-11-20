import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { apiMessage } from "./actions";
import { api } from "./api";
import { useI18n } from "./i18n";
import { useSession } from "./session";
import { sb } from "./supabase";
import type { Practice, ProBooking } from "./types";

type Ctx = {
  /** undefined = still loading, null = this account has no clinic yet */
  practice: Practice | null | undefined;
  bookings: ProBooking[] | null;
  error: string;
  reload: () => Promise<void>;
  /** Accepts or declines a request, then refreshes the lists. Throws ApiError (e.g. "not pending" when someone already handled it). */
  act: (id: string, action: "confirm" | "decline", reply?: string) => Promise<void>;
};
const ProCtx = createContext<Ctx | null>(null);

/** A request the vet can answer: waiting for them, and the client's online payment (if any) is already secured. */
export const isRequest = (b: ProBooking) => b.status === "pending" && b.payment_status !== "pending" && b.payment_status !== "failed";

/** Data of the vets' app: the clinic of the signed-in account and its bookings (upcoming + last 30 days). */
export function ProProvider({ children }: { children: ReactNode }) {
  const { session } = useSession(), { t } = useI18n();
  const uid = session?.user.id;
  const [practice, setPractice] = useState<Practice | null | undefined>(undefined), [bookings, setBookings] = useState<ProBooking[] | null>(null), [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!uid) return;
    try {
      const [p, b] = await Promise.all([
        sb().from("practices").select("id, name, slug, country, timezone, city, logo_url, published, review_status, stripe_status, mp_status, booking_enabled").eq("owner_user_id", uid).order("created_at").limit(1),
        api<{ bookings: ProBooking[] }>("/api/pro/bookings"),
      ]);
      if (p.error) throw p.error;
      setPractice(((p.data ?? [])[0] as Practice | undefined) ?? null); setBookings(b.bookings); setError("");
    } catch (e) { setError(apiMessage(e, t)); }
  }, [uid, t]);

  useEffect(() => { setPractice(undefined); setBookings(null); reload(); }, [reload]);
  // fresh data when the app comes back to the front, and every two minutes while it stays open
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") reload(); });
    const timer = setInterval(() => { if (AppState.currentState === "active") reload(); }, 120000);
    return () => { sub.remove(); clearInterval(timer); };
  }, [reload]);

  const act = useCallback(async (id: string, action: "confirm" | "decline", reply?: string) => {
    try { await api(`/api/bookings/${id}/${action}`, { method: "POST", body: action === "decline" ? { reply: reply?.trim() || undefined } : {} }); }
    finally { await reload(); }
  }, [reload]);

  const value = useMemo(() => ({ practice, bookings, error, reload, act }), [practice, bookings, error, reload, act]);
  return <ProCtx.Provider value={value}>{children}</ProCtx.Provider>;
}

export function usePro(): Ctx {
  const c = useContext(ProCtx);
  if (!c) throw new Error("ProProvider missing");
  return c;
}
