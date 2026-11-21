import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEntries, indexXml, PER_FILE, splitFiles, urlsetXml, type SitemapData } from "../src/lib/sitemap";

const data: SitemapData = {
  countries: ["FR", "IT", "AR"], faqLangs: ["fr", "it", "es"],
  blog: [{ lang: "en", posts: [{ slug: "x" }] }, { lang: "fr", posts: [] }],
  practices: [
    { id: "1", slug: "clinique-a", country: "FR", city: "Paris 11e", updated_at: "2026-11-01T10:00:00Z", services: [{ type: "home", active: true }, { type: "video", active: true }, { type: "clinic", active: false }], practitioners: [{ slug: "dr-x", active: true, approved: true }, { slug: "dr-y", active: true, approved: false }] },
    { id: "2", slug: "clinica-b", country: "IT", city: null, services: [{ type: "clinic", active: true }], practitioners: [] },
    { id: "3", slug: "hidden", country: "DE", city: "Berlin", services: [{ type: "home", active: true }], practitioners: [] },
  ],
  directoryCities: [{ country: "IT", city: "Milano" }, { country: "IT", city: "milano" }],
};
const entries = buildEntries(data), paths = entries.map((e) => e.path);

test("sitemap: only real pages of open countries", () => {
  assert.ok(paths.includes("/fr/fr/veterinaire/clinique-a") && paths.includes("/en/fr/veterinaire/clinique-a"));
  assert.ok(paths.includes("/fr/fr/veterinaire/clinique-a/dr-x"));
  assert.ok(!paths.some((p) => p.includes("dr-y")), "unapproved vet");
  assert.ok(!paths.some((p) => p.includes("hidden")), "country not published");
  assert.ok(paths.includes("/fr/fr/veterinaire-a-domicile/paris-11e"));
  assert.ok(!paths.some((p) => p.includes("clinique-veterinaire/")), "inactive service");
  assert.ok(!paths.some((p) => p.startsWith("/it/it/clinica-veterinaria/")), "no city → no city page");
  assert.ok(paths.includes("/it/it/clinica-veterinaria"));
  assert.ok(paths.includes("/it/it/annuaire/milano") && paths.filter((p) => p === "/it/it/annuaire/milano").length === 1);
  assert.ok(!paths.some((p) => p.startsWith("/en/en/")), "no /en/en/");
  assert.ok(!paths.some((p) => p.includes("/blog") && p.startsWith("/fr/")), "empty blog left out");
  assert.ok(paths.includes("/en/fr/blog/x"));
  assert.ok(!paths.includes("/es/ar/faq") === false && paths.includes("/es/ar/faq"));
});
test("sitemap: hreflang is reciprocal and self-referencing", () => {
  const byUrl = new Map(entries.map((e) => [`https://televet.co${e.path}`, e]));
  for (const e of entries) {
    const self = Object.values(e.alternates).map((u) => u.replace(/^https?:\/\/[^/]+/, ""));
    assert.ok(self.includes(e.path), `self link ${e.path}`);
    for (const u of self) { const other = entries.find((x) => x.path === u); assert.ok(other, `target exists ${u}`); assert.deepEqual(other!.alternates, e.alternates); }
  }
  assert.ok(byUrl.size > 0);
});
test("sitemap: files per version and kind, valid XML, split at the limit", () => {
  const files = splitFiles(entries);
  assert.ok(files.has("fr-fr/clinics-1") && files.has("en-fr/clinics-1") && files.has("it-it/directory-1"));
  const xml = urlsetXml(files.get("fr-fr/clinics-1")!);
  assert.match(xml, /<loc>[^<]+\/fr\/fr\/veterinaire\/clinique-a<\/loc><lastmod>2026-11-01T10:00:00.000Z<\/lastmod><xhtml:link rel="alternate" hreflang="en-FR"/);
  assert.match(indexXml(files), /<loc>[^<]+\/sitemaps\/fr-fr\/clinics-1\.xml<\/loc>/);
  const many = Array.from({ length: PER_FILE + 5 }, (_, i) => ({ kind: "clinics" as const, lang: "fr", country: "FR", path: `/fr/fr/veterinaire/c${i}`, alternates: {} }));
  const split = splitFiles(many);
  assert.equal(split.get("fr-fr/clinics-1")!.length, PER_FILE); assert.equal(split.get("fr-fr/clinics-2")!.length, 5);
});
