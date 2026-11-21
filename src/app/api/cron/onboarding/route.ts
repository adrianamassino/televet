import { isCronRequest } from "@/lib/cron-auth";
import { adminClient } from "@/lib/supabase";
import { checklist, sendOnboardingReminder } from "@/lib/onboarding";
import { REMINDER_DAYS } from "@/lib/onboarding-copy";

/** Daily check-up: finds vet profiles that are not fully set up and e-mails reminders (after 1, 3, 7, 14 and 30 days), until they finish. */
export async function GET(req: Request) {
  if (!(await isCronRequest(req))) return new Response("unauthorized", { status: 401 });
  const db = adminClient();
  const { data } = await db.from("practices").select("id, created_at, onboarding_reminders, onboarding_reminded_at")
    .in("review_status", ["pending", "approved"]).lt("onboarding_reminders", REMINDER_DAYS.length).lte("created_at", new Date(Date.now() - 86400000).toISOString()).limit(200);
  const missing = await checklist(db);
  const sent: string[] = [];
  for (const p of data ?? []) {
    if (!(missing.get(p.id)?.length)) continue;
    try { if ((await sendOnboardingReminder(p.id)) === "sent") sent.push(p.id); } catch (e) { console.error("onboarding mail", p.id, e); }
  }
  return Response.json({ checked: data?.length ?? 0, sent });
}
