import { z } from "zod";
import { handle, HttpError, json } from "@/lib/supabase";
import { sendEmail } from "@/lib/notify";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  topic: z.string().trim().max(120).optional(),
  message: z.string().trim().min(5).max(4000),
  lang: z.string().max(5).optional(),
  website: z.string().max(200).optional(), // honeypot
});
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const hits = new Map<string, number[]>();

/** POST /api/contact — sends the message to the Televet inbox. Honeypot + tiny per-IP rate limit. */
export const POST = handle(async (req) => {
  const b = Body.parse(await req.json().catch(() => ({})));
  if (b.website) return json({ ok: true }); // bots get a silent success
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const now = Date.now(), recent = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= 5) throw new HttpError(429, "Too many messages, try again later.");
  hits.set(ip, [...recent, now]);
  const to = process.env.CONTACT_TO || "contact@televet.co";
  await sendEmail(to, `[Televet contact] ${b.topic || "Message"} — ${b.name}`,
    `<p><b>${esc(b.name)}</b> &lt;${esc(b.email)}&gt; (${esc(b.lang ?? "")})</p><p><b>${esc(b.topic ?? "")}</b></p><p style="white-space:pre-wrap">${esc(b.message)}</p>`);
  return json({ ok: true });
});
