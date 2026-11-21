import { test } from "node:test";
import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "crypto";
import { CRON_AUDIENCE, hasCronSecret, verifyGithubOidc } from "../src/lib/cron-auth";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...(publicKey.export({ format: "jwk" }) as { n: string; e: string; kty: string }), kid: "k1" };
const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
function token(claims: object, kid = "k1") {
  const h = enc({ alg: "RS256", kid }), p = enc(claims);
  return `${h}.${p}.${createSign("RSA-SHA256").update(`${h}.${p}`).sign(privateKey).toString("base64url")}`;
}
const now = Date.now(), ok = { iss: "https://token.actions.githubusercontent.com", aud: CRON_AUDIENCE, repository: "adrianamassino/televet", ref: "refs/heads/main", exp: Math.floor(now / 1000) + 300 };
const keys = async () => [jwk];

test("cron auth: GitHub OIDC token of this repository is accepted", async () => {
  assert.equal(await verifyGithubOidc(token(ok), now, keys), true);
});
test("cron auth: wrong repo, audience, branch, expired or forged token refused", async () => {
  assert.equal(await verifyGithubOidc(token({ ...ok, repository: "someone/else" }), now, keys), false);
  assert.equal(await verifyGithubOidc(token({ ...ok, aud: "other" }), now, keys), false);
  assert.equal(await verifyGithubOidc(token({ ...ok, ref: "refs/heads/dev" }), now, keys), false);
  assert.equal(await verifyGithubOidc(token({ ...ok, exp: Math.floor(now / 1000) - 10 }), now, keys), false);
  const t = token(ok).split("."); t[1] = enc({ ...ok, repository: "x/y" });
  assert.equal(await verifyGithubOidc(t.join("."), now, keys), false);
  assert.equal(await verifyGithubOidc(token(ok, "unknown"), now, keys), false);
});
test("cron auth: no secret configured never lets 'Bearer undefined' in", () => {
  delete process.env.CRON_SECRET;
  assert.equal(hasCronSecret(new Request("http://x", { headers: { authorization: "Bearer undefined" } })), false);
  process.env.CRON_SECRET = "a-long-enough-secret-123";
  assert.equal(hasCronSecret(new Request("http://x", { headers: { authorization: "Bearer a-long-enough-secret-123" } })), true);
  assert.equal(hasCronSecret(new Request("http://x", { headers: { authorization: "Bearer wrong" } })), false);
  delete process.env.CRON_SECRET;
});
