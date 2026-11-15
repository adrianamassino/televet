/** Transactional e-mail through Resend (swap for any provider). Push notifications: see README (Expo). */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.warn("[email skipped] RESEND_API_KEY missing:", subject); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) console.error("email failed", res.status, await res.text());
}
