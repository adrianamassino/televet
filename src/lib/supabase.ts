import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/** Server-only client with full access. Never import this in client components. */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured (see .env.example)");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Returns the signed-in user from the `Authorization: Bearer <jwt>` header, or null. */
export async function userFromRequest(req: Request): Promise<User | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  return error ? null : data.user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

export function handle(fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      // Admin routes only run this branch after the staff check: show the cause to help set up the platform.
      const admin = new URL(req.url).pathname.startsWith("/api/admin");
      return json(admin ? { error: "internal_error", detail: e instanceof Error ? e.message : String(e) } : { error: "internal_error" }, 500);
    }
  };
}
