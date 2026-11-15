import { adminClient, handle } from "@/lib/supabase";
import { buildFeed } from "@/lib/calendar/ical";

/** GET /api/ical/<token>.ics — private feed of Televet appointments (Apple Calendar, Outlook, Google "from URL"). */
export const GET = handle(async (_req, ctx) => {
  const { token } = await ctx.params;
  const db = adminClient();
  const { data: feed } = await db.from("ical_feeds").select("practitioner_id").eq("token", token.replace(/\.ics$/, "")).single();
  if (!feed) return new Response("Not found", { status: 404 });
  const { data: pr } = await db.from("practitioners").select("display_name").eq("id", feed.practitioner_id).single();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: rows } = await db.from("bookings")
    .select("id, starts_at, ends_at, status, type, address, motive, pets(name, species)")
    .eq("practitioner_id", feed.practitioner_id).in("status", ["pending", "confirmed"]).gte("starts_at", since).order("starts_at");
  const events = (rows ?? []).map((r) => {
    const pet = (r as unknown as { pets: { name: string; species: string } | null }).pets;
    return {
      uid: r.id, start: new Date(r.starts_at), end: new Date(r.ends_at),
      summary: `Televet · ${pet?.name ?? ""} (${r.type})${r.status === "pending" ? " · à confirmer" : ""}`,
      description: r.motive ?? undefined, location: r.address ?? undefined,
      status: r.status === "confirmed" ? ("CONFIRMED" as const) : ("TENTATIVE" as const),
    };
  });
  return new Response(buildFeed(`Televet · ${pr?.display_name ?? ""}`, events), {
    headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "private, max-age=300" },
  });
});
