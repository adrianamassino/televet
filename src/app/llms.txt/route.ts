import { COUNTRIES } from "@/lib/countries";
import { adminClient } from "@/lib/supabase";
import { SERVICE_SLUGS, SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";
/**
 * /llms.txt — a short, factual map of the site for AI assistants and answer engines (llmstxt.org format):
 * what Televet is, then the main pages of each open country. Built from the database, like the sitemaps.
 */
export async function GET() {
  const { data } = await adminClient().from("countries").select("code").eq("published", true);
  const live = (data ?? []).map((c) => c.code).filter((c) => COUNTRIES[c]);
  const lines = [
    "# Televet",
    "",
    "> Televet connects pet owners with veterinarians: home visits, video consultations and clinic appointments, booked and paid online. Founded in Paris (Station F). Online advice never replaces emergency care: in an emergency, go to the nearest emergency veterinary clinic.",
    "",
  ];
  for (const cc of live) {
    const l = COUNTRIES[cc].languages[0], c = cc.toLowerCase(), name = new Intl.DisplayNames(["en"], { type: "region" }).of(cc) ?? cc;
    lines.push(`## ${name}`, "", `- [Home](${SITE}/${l}/${c}/)`);
    for (const s of ["home", "video", "clinic"] as const) if (SERVICE_SLUGS[s][l]) lines.push(`- [${s === "home" ? "Home-visit vets" : s === "video" ? "Online vet consultation" : "Vet clinics"}](${SITE}/${l}/${c}/${SERVICE_SLUGS[s][l]})`);
    lines.push(`- [Clinic directory](${SITE}/${l}/${c}/annuaire)`, `- [Prices and fees](${SITE}/${l}/${c}/pricing)`, `- [For vets and clinics](${SITE}/${l}/${c}/pro)`, "");
  }
  lines.push("## Sitemaps", "", `- [Sitemap index](${SITE}/sitemap_index.xml)`, "");
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
