import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { sanitizeProposals, SCAN_PROMPT, SCAN_TOOL } from "@/lib/pet-health";

export const maxDuration = 60;

/** POST /api/owner/pets/:id/scan { documentId } → { proposals }. Reads ONE booklet photo with Claude; nothing is saved until the owner confirms. */
export const POST = handle(async (req, ctx) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { id: petId } = await ctx.params;
  const { documentId } = (await req.json()) as { documentId?: string };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(503, "scan_unavailable");
  const db = adminClient();
  const { data: doc } = await db.from("pet_documents").select("id, storage_path, owner_id, pet_id").eq("id", documentId ?? "").maybeSingle();
  if (!doc || doc.owner_id !== user.id || doc.pet_id !== petId) throw new HttpError(404, "not found");
  const { data: file, error } = await db.storage.from("pet-docs").download(doc.storage_path);
  if (error || !file) throw new HttpError(404, "file not found");
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 4_500_000) throw new HttpError(413, "image too large");
  const media = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.PET_SCAN_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 3000,
      tools: [SCAN_TOOL], tool_choice: { type: "tool", name: SCAN_TOOL.name },
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: media, data: buf.toString("base64") } }, { type: "text", text: SCAN_PROMPT }] }],
    }),
  });
  if (!res.ok) { await db.from("pet_documents").update({ scan_status: "failed" }).eq("id", doc.id); throw new HttpError(502, `scan_failed_${res.status}`); }
  const out = (await res.json()) as { content?: { type: string; input?: { entries?: unknown } }[] };
  const proposals = sanitizeProposals(out.content?.find((c) => c.type === "tool_use")?.input?.entries);
  await db.from("pet_documents").update({ scan_status: "done" }).eq("id", doc.id);
  return json({ proposals });
});
