import { isCronRequest } from "@/lib/cron-auth";
import { adminClient } from "@/lib/supabase";
import { rowsFromCompany, searchUrl, type ApiCompany } from "@/lib/directory-import";

export const dynamic = "force-dynamic";
export const maxDuration = 26;

/**
 * GET /api/cron/import-directory?dep=75&page=1 — imports a few pages of one French department into the directory and
 * says which page comes next ({ next: null } when the department is done). Called in a loop by the GitHub workflow
 * "Import directory". Existing listings are updated (address, coordinates); claimed ones keep their status.
 */
export async function GET(req: Request) {
  if (!(await isCronRequest(req))) return new Response("unauthorized", { status: 401 });
  const q = new URL(req.url).searchParams;
  const dep = (q.get("dep") ?? "").toUpperCase(), start = Math.max(1, Number(q.get("page") ?? 1) || 1);
  if (!/^(\d{2}|2A|2B|97\d)$/.test(dep)) return Response.json({ error: "dep" }, { status: 400 });
  const db = adminClient();
  let page = start, totalPages = 1, saved = 0;
  const until = Date.now() + 18000;
  while (page <= totalPages && Date.now() < until) {
    const res = await fetch(searchUrl(dep, page), { headers: { accept: "application/json", "user-agent": "Televet directory (contact@televet.co)" } });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 1500)); continue; } // the public API allows a few calls per second
    if (!res.ok) return Response.json({ error: `api ${res.status}`, dep, page }, { status: 502 });
    const j = (await res.json()) as { results?: ApiCompany[]; total_pages?: number };
    totalPages = Math.min(j.total_pages ?? 1, 400);
    const rows = [...new Map((j.results ?? []).flatMap(rowsFromCompany).map((r) => [r.source_ref, r])).values()]; // same establishment met twice (other department run) = same row, updated
    if (rows.length) {
      // never overwrite the status / practice link of a listing someone has claimed
      const { error } = await db.from("directory_listings").upsert(rows, { onConflict: "source,source_ref", ignoreDuplicates: false });
      if (error) return Response.json({ error: error.message, dep, page }, { status: 500 });
      saved += rows.length;
    }
    page++;
    await new Promise((r) => setTimeout(r, 200));
  }
  return Response.json({ dep, saved, next: page <= totalPages ? page : null, totalPages });
}
