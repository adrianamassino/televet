import { isCronRequest } from "@/lib/cron-auth";
import { sendPetReminders } from "@/lib/pet-reminder-mail";

/** Daily: e-mails owners about vaccines / treatments coming due (30 days, 7 days, on the day). */
export async function GET(req: Request) {
  if (!(await isCronRequest(req))) return new Response("unauthorized", { status: 401 });
  return Response.json(await sendPetReminders());
}
