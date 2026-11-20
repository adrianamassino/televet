/**
 * GET /api/app/config — what the mobile apps need to start. Only public values (the same ones the website
 * already sends to every browser), so the apps are built with a single setting: the address of this site.
 */
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
    siteUrl: process.env.APP_URL ?? null,
    payments: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    minVersion: process.env.APP_MIN_VERSION ?? null, // set it to force old app versions to update
  }, { headers: { "cache-control": "public, max-age=60", "access-control-allow-origin": "*" } });
}
