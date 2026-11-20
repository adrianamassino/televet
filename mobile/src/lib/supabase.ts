import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

let client: SupabaseClient | null = null;

/** Creates the database/auth client once the public settings have been read from the Televet site (see boot.ts). */
export function initSupabase(url: string, anonKey: string): SupabaseClient {
  if (client) return client;
  client = createClient(url, anonKey, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
  // keep the session fresh only while the app is in front (recommended set-up for React Native)
  if (Platform.OS !== "web") AppState.addEventListener("change", (state) => { if (state === "active") client?.auth.startAutoRefresh(); else client?.auth.stopAutoRefresh(); });
  return client;
}
export function sb(): SupabaseClient {
  if (!client) throw new Error("Televet is not ready yet");
  return client;
}

/** Readable text for anything thrown (Supabase errors are plain objects, not Error instances). */
export function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") { const o = e as { message?: string; details?: string }; return [o.message, o.details].filter(Boolean).join(" — ") || "error"; }
  return String(e);
}
