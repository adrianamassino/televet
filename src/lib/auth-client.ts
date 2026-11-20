"use client";
/**
 * Owner sign-in (browser side): e-mail/password, Google and Apple through Supabase Auth.
 * Setup: Supabase dashboard → Authentication → Providers → enable Google and Apple
 * (Google OAuth client + Apple "Sign in with Apple" service ID/key), and add
 * `${APP_URL}/auth/callback` to the allowed redirect URLs.
 */
import { createClient } from "@supabase/supabase-js";

export const supabaseBrowser = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export function signInWithProvider(provider: "google" | "apple", next = "/") {
  return supabaseBrowser().auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
}

export function signUpWithEmail(email: string, password: string, fullName: string) {
  return supabaseBrowser().auth.signUp({
    email, password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
}

export const signInWithEmail = (email: string, password: string) =>
  supabaseBrowser().auth.signInWithPassword({ email, password });

export const signOut = () => supabaseBrowser().auth.signOut();

/** Readable text for any thrown value (Supabase errors are plain objects, not Error instances). */
export function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as { message?: string; details?: string; hint?: string; code?: string };
    return [o.message, o.details, o.hint].filter(Boolean).join(" — ") || JSON.stringify(e);
  }
  return String(e);
}
