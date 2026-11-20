import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";
import { initSupabase } from "./supabase";

type Remote = { supabaseUrl: string | null; supabaseAnonKey: string | null; payments?: boolean; minVersion?: string | null };
const KEY = "tv.config.v1";
let remote: Remote | null = null;
export const remoteConfig = () => remote;

async function fetchRemote(): Promise<Remote> {
  const res = await fetch(`${API_URL}/api/app/config`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`config ${res.status}`);
  const j = (await res.json()) as Remote;
  if (!j.supabaseUrl || !j.supabaseAnonKey) throw new Error("config incomplete");
  return j;
}

/**
 * Reads the public settings (database address and key) from the Televet site. The last good answer is kept on the phone,
 * so the app opens instantly — and still opens offline — after the first launch; it is refreshed in the background.
 */
export async function boot(): Promise<void> {
  if (remote) return;
  const cached = await AsyncStorage.getItem(KEY).then((s) => (s ? (JSON.parse(s) as Remote) : null)).catch(() => null);
  if (cached?.supabaseUrl && cached.supabaseAnonKey) {
    remote = cached;
    initSupabase(cached.supabaseUrl, cached.supabaseAnonKey);
    fetchRemote().then((r) => AsyncStorage.setItem(KEY, JSON.stringify(r))).catch(() => {});
    return;
  }
  const fresh = await fetchRemote();
  remote = fresh;
  initSupabase(fresh.supabaseUrl!, fresh.supabaseAnonKey!);
  await AsyncStorage.setItem(KEY, JSON.stringify(fresh)).catch(() => {});
}
