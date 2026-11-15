import { loadBooking } from "@/lib/booking-mail";
import { verifyVisioLink } from "@/lib/video";
import { accessFor } from "@/lib/visio-access";

const page = (title: string, body: string) => new Response(
  `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Televet</title><body style="font-family:system-ui;background:#F6F8FB;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0"><div style="max-width:420px;background:#fff;border:1px solid #E3E8EF;border-radius:14px;padding:24px;text-align:center"><p style="color:#053ABE;font-weight:800;font-size:20px;margin:0 0 12px">televet</p><h1 style="font-size:20px;margin:0 0 8px">${title}</h1><p style="color:#526077;margin:0">${body}</p></div>`,
  { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

/** GET /visio/:id?r=owner|vet&s=… — link from the e-mails: opens the call without logging in. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const role = q.get("r") ?? "", sig = q.get("s") ?? "";
  if (!verifyVisioLink(id, role, sig)) return page("Lien invalide", "Ce lien de téléconsultation n'est pas valide.");
  const b = await loadBooking(id);
  if (!b) return page("Rendez-vous introuvable", "");
  const a = await accessFor(b, role as "owner" | "vet");
  if (a.ok) return Response.redirect(a.url, 302);
  if (a.reason === "too_early") {
    const t = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: b.practice.timezone }).format(new Date(a.opensAt!));
    return page("La salle n'est pas encore ouverte", `Elle ouvrira le ${t}. Revenez sur ce lien à ce moment-là.`);
  }
  return page(a.reason === "closed" ? "Téléconsultation terminée" : "Rendez-vous non confirmé", "");
}
