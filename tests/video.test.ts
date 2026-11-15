import { test } from "node:test";
import assert from "node:assert/strict";
import { canJoin, joinWindow, signedVisioLink, verifyVisioLink } from "../src/lib/video";
import { confirmationEmail, reminderEmail } from "../src/lib/email/templates";

test("video room opens 15 min before and closes 60 min after", () => {
  const s = new Date("2026-10-05T10:00:00Z"), e = new Date("2026-10-05T10:20:00Z");
  assert.equal(joinWindow(s, e).opensAt.toISOString(), "2026-10-05T09:45:00.000Z");
  assert.equal(canJoin(s, e, new Date("2026-10-05T09:40:00Z")), false);
  assert.equal(canJoin(s, e, new Date("2026-10-05T09:50:00Z")), true);
  assert.equal(canJoin(s, e, new Date("2026-10-05T11:30:00Z")), false);
});

test("signed e-mail links are bound to booking and role", () => {
  const url = new URL(signedVisioLink("https://televet.co", "b1", "owner"));
  const sig = url.searchParams.get("s")!;
  assert.equal(verifyVisioLink("b1", "owner", sig), true);
  assert.equal(verifyVisioLink("b1", "vet", sig), false);
  assert.equal(verifyVisioLink("b2", "owner", sig), false);
});

test("emails are localized and contain the join link only for video", () => {
  const base = { name: "Marie", when: "lundi 5 octobre à 12:00", withName: "Dr Martin", service: "Téléconseil", appUrl: "https://televet.co" };
  const c = confirmationEmail({ ...base, lang: "fr", joinUrl: "https://televet.co/visio/b1?r=owner&s=x" });
  assert.match(c.subject, /Rendez-vous confirmé/);
  assert.match(c.html, /Rejoindre la visio/);
  const r = reminderEmail({ ...base, lang: "es", address: "Av. Corrientes 1000" });
  assert.match(r.subject, /Recordatorio/);
  assert.doesNotMatch(r.html, /videollamada/);
});
