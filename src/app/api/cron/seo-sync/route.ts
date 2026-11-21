import { isCronRequest } from "@/lib/cron-auth";
import { adminClient } from "@/lib/supabase";
import { syncDirectory, syncPractice } from "@/lib/seo-sync";

export const dynamic = "force-dynamic";
/** Daily: every clinic has a located primary location tied to a city, its vets are linked to it, directory entries have a city id. */
export async function GET(req: Request) {
  if (!(await isCronRequest(req))) return new Response("unauthorized", { status: 401 });
  const db = adminClient();
  const { data } = await db.from("practices").select("id").in("review_status", ["pending", "approved"]).limit(1000);
  const out: Record<string, number> = {};
  for (const p of data ?? []) {
    const r = await syncPractice(db, p.id).catch(() => "error");
    out[r] = (out[r] ?? 0) + 1;
  }
  return Response.json({ practices: out, directory: await syncDirectory(db) });
}
