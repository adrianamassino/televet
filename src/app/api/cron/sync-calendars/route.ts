import { syncAll } from "@/lib/calendar/sync";

/** Called every 10 minutes by the scheduler (Vercel Cron / Supabase cron) with the CRON_SECRET. */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  return Response.json(await syncAll());
}
