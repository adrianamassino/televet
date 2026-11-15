import { createClient } from "@supabase/supabase-js";

/** OAuth / magic-link return URL: exchanges the code, then creates the owner row on first sign-in. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  if (code) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { flowType: "pkce", persistSession: false } });
    const { data } = await sb.auth.exchangeCodeForSession(code);
    const user = data.user;
    if (user) {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
      const name = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split("@")[0] || "";
      await admin.from("owners").upsert({ id: user.id, full_name: name }, { onConflict: "id", ignoreDuplicates: true });
    }
  }
  return Response.redirect(new URL(next, url.origin), 302);
}
