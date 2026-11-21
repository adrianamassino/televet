import { API_URL } from "./config";
import { sb } from "./supabase";

/** Error returned by the Televet API: `code` is the server's short message (e.g. "slot_unavailable"), "network" when offline. */
export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

type Init = { method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; body?: unknown; auth?: boolean };

/** Calls the Televet API on the website, signed with the person's session when there is one. */
export async function api<T>(path: string, init: Init = {}): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.auth !== false) {
    const { data } = await sb().auth.getSession();
    if (data.session) headers.authorization = `Bearer ${data.session.access_token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: init.method ?? (init.body !== undefined ? "POST" : "GET"), headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined });
  } catch { throw new ApiError(0, "network"); }
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, json.error ?? String(res.status));
  return json as T;
}
