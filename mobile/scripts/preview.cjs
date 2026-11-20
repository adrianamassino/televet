/**
 * Visual check of the apps without a phone: serves a web export (`npx expo export --platform web --output-dir dist-web-owner`)
 * and photographs screens in a phone-sized browser, with the Televet API and the database replaced by sample data.
 *   node scripts/preview.cjs <dist dir> <out dir> [scale]
 * Development tool only (needs Playwright); nothing here ships in the apps.
 */
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");

const dist = path.resolve(process.argv[2] || "dist-web-owner"), out = path.resolve(process.argv[3] || "shots"), scale = Number(process.argv[4] || 1);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".ico": "image/x-icon", ".json": "application/json", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  let f = path.join(dist, p);
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, "index.html"); // single-page app: every route is index.html
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

const SB = "https://mock.supabase.co", API = "https://televet.netlify.app";
const iso = (days, h = 10, m = 0) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d.toISOString(); };
const ymd = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
const user = { id: "11111111-1111-4111-8111-111111111111", aud: "authenticated", role: "authenticated", email: "giulia@example.com", user_metadata: { full_name: "Giulia Rossi" }, app_metadata: {}, identities: [{}], created_at: iso(-30) };
const session = { access_token: "header.payload.sig", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "refresh", user };

const practices = [
  { id: "a0000000-0000-4000-8000-000000000001", name: "Clinica Veterinaria Navigli", slug: "clinica-navigli", kind: "clinic", headline: "Medicina interna, chirurgia e videoconsulti sette giorni su sette.", city: "Milano", address: "Via Vigevano 18", postalCode: "20144", logoUrl: null, timezone: "Europe/Rome", types: ["clinic", "video", "home"], bookable: true, nextSlot: iso(1, 9, 30) },
  { id: "a0000000-0000-4000-8000-000000000002", name: "Dott.ssa Elena Marchetti", slug: "elena-marchetti", kind: "home", headline: "Visite a domicilio per cani e gatti, anche la sera.", city: "Torino", address: null, postalCode: "10121", logoUrl: null, timezone: "Europe/Rome", types: ["home", "video"], bookable: true, nextSlot: iso(2, 18, 0) },
  { id: "a0000000-0000-4000-8000-000000000003", name: "Ambulatorio San Rocco", slug: "san-rocco", kind: "clinic", headline: null, city: "Bologna", address: "Via San Rocco 4", postalCode: "40122", logoUrl: null, timezone: "Europe/Rome", types: ["clinic"], bookable: true, nextSlot: null },
];
const detail = {
  practice: { ...practices[0], about: "Dal 2009 curiamo cani, gatti e piccoli animali nel cuore dei Navigli. Tre veterinari, sala operatoria e laboratorio interno.", phone: "+39 02 5555 0142", coverUrl: null, languages: ["it", "en"], species: ["dog", "cat", "rabbit"], country: "IT", provider: "stripe", paymentsReady: true },
  vets: [{ id: "b0000000-0000-4000-8000-000000000001", name: "Dott. Marco Bianchi", photoUrl: null, specialties: ["Medicina interna", "Dermatologia"] }, { id: "b0000000-0000-4000-8000-000000000002", name: "Dott.ssa Sara Conti", photoUrl: null, specialties: ["Chirurgia"] }],
  services: [
    { id: "c0000000-0000-4000-8000-000000000001", vetId: null, type: "video", name: "Videoconsulto", description: "Un parere veloce da casa: pelle, alimentazione, piccoli disturbi.", duration: 20, price: 3500, currency: "EUR", onlinePayment: true },
    { id: "c0000000-0000-4000-8000-000000000002", vetId: null, type: "clinic", name: "Visita in clinica", description: null, duration: 30, price: 5000, currency: "EUR", onlinePayment: false },
    { id: "c0000000-0000-4000-8000-000000000003", vetId: null, type: "home", name: "Visita a domicilio", description: "Milano città e prima cintura.", duration: 45, price: 9000, currency: "EUR", onlinePayment: true },
  ],
};
const slots = () => { const out = []; for (const d of [1, 2, 4]) for (const [h, m] of [[9, 0], [9, 30], [10, 30], [11, 0], [15, 0], [16, 30], [17, 0]]) { const s = iso(d, h, m); out.push({ start: s, end: new Date(Date.parse(s) + 20 * 60000).toISOString(), day: s.slice(0, 10) }); } return out; };
const pets = [{ id: "d0000000-0000-4000-8000-000000000001", name: "Luna", species: "dog" }, { id: "d0000000-0000-4000-8000-000000000002", name: "Micio", species: "cat" }];
const ownerBookings = [
  { id: "e0000000-0000-4000-8000-000000000001", starts_at: new Date(Date.now() + 5 * 60000).toISOString(), ends_at: new Date(Date.now() + 25 * 60000).toISOString(), type: "video", status: "confirmed", payment_status: "captured", price_cents: 3500, currency: "EUR", vet_reply: null, practices: { name: "Clinica Veterinaria Navigli", timezone: "Europe/Rome" }, pets: { name: "Luna" }, practitioners: { display_name: "Marco Bianchi" } },
  { id: "e0000000-0000-4000-8000-000000000002", starts_at: iso(3, 17, 0), ends_at: iso(3, 17, 45), type: "home", status: "pending", payment_status: "authorized", price_cents: 9000, currency: "EUR", vet_reply: null, practices: { name: "Dott.ssa Elena Marchetti", timezone: "Europe/Rome" }, pets: { name: "Micio" }, practitioners: { display_name: "Elena Marchetti" } },
  { id: "e0000000-0000-4000-8000-000000000003", starts_at: iso(-12, 11, 0), ends_at: iso(-12, 11, 30), type: "clinic", status: "confirmed", payment_status: "none", price_cents: 5000, currency: "EUR", vet_reply: null, practices: { name: "Clinica Veterinaria Navigli", timezone: "Europe/Rome" }, pets: { name: "Luna" }, practitioners: { display_name: "Sara Conti" } },
  { id: "e0000000-0000-4000-8000-000000000004", starts_at: iso(-30, 9, 0), ends_at: iso(-30, 9, 30), type: "clinic", status: "declined", payment_status: "refunded", price_cents: 5000, currency: "EUR", vet_reply: "Quel giorno la clinica è chiusa: può prenotare da lunedì.", practices: { name: "Ambulatorio San Rocco", timezone: "Europe/Rome" }, pets: { name: "Luna" }, practitioners: { display_name: "Paolo Neri" } },
];
const records = [
  { id: "f1", pet_id: pets[0].id, kind: "vaccine", name: "Rabbia (Nobivac)", done_on: ymd(-345), next_due: ymd(20), vet_name: "Dott. Bianchi", document_id: null },
  { id: "f2", pet_id: pets[0].id, kind: "vaccine", name: "Trivalente", done_on: ymd(-200), next_due: ymd(165), vet_name: null, document_id: null },
  { id: "f3", pet_id: pets[0].id, kind: "antiparasitic", name: "Bravecto", done_on: ymd(-95), next_due: ymd(-5), vet_name: null, document_id: null },
  { id: "f4", pet_id: pets[0].id, kind: "surgery", name: "Sterilizzazione", done_on: ymd(-700), next_due: null, vet_name: "Dott.ssa Conti", document_id: null },
];
const proBooking = (id, start, mins, type, status, pay, owner, phone, pet, species, svc, extra = {}) => ({ id, starts_at: start, ends_at: new Date(Date.parse(start) + mins * 60000).toISOString(), type, status, address: null, motive: null, access_notes: null, price_cents: type === "home" ? 9000 : type === "video" ? 3500 : 5000, currency: "EUR", payment_status: pay, video_room: type === "video" ? "room" : null, owners: { full_name: owner, phone }, pets: { name: pet, species }, services: { custom_name: svc, catalog_code: "x" }, ...extra });
const proBookings = [
  proBooking("90000000-0000-4000-8000-000000000001", new Date(Date.now() + 8 * 60000).toISOString(), 20, "video", "confirmed", "captured", "Giulia Rossi", "+39 333 123 4567", "Luna", "dog", "Videoconsulto", { motive: "Si gratta spesso l'orecchio destro da tre giorni." }),
  proBooking("90000000-0000-4000-8000-000000000002", iso(0, 17, 30), 30, "clinic", "confirmed", "none", "Paolo Ferri", "+39 347 555 0101", "Briciola", "cat", "Visita in clinica"),
  proBooking("90000000-0000-4000-8000-000000000003", iso(1, 9, 0), 45, "home", "confirmed", "captured", "Anna Greco", "+39 320 777 8899", "Rocky", "dog", "Visita a domicilio", { address: "Corso Buenos Aires 21, Milano", access_notes: "Citofono Greco, 3° piano" }),
  proBooking("90000000-0000-4000-8000-000000000004", iso(2, 11, 30), 30, "clinic", "pending", "authorized", "Luca Moretti", "+39 331 222 3344", "Zoe", "rabbit", "Visita in clinica", { motive: "Controllo dopo l'intervento della settimana scorsa." }),
  proBooking("90000000-0000-4000-8000-000000000005", iso(3, 16, 0), 20, "video", "pending", "authorized", "Marta Villa", null, "Pepe", "bird", "Videoconsulto"),
  proBooking("90000000-0000-4000-8000-000000000006", iso(-3, 10, 0), 30, "clinic", "confirmed", "none", "Giulia Rossi", "+39 333 123 4567", "Luna", "dog", "Visita in clinica"),
];
const clients = [
  { id: "c1", name: "Giulia Rossi", phone: "+39 333 123 4567", email: "giulia@example.com", pets: { Luna: "dog", Micio: "cat" }, visits: 7, types: { clinic: 4, video: 3 }, spent: { EUR: 28500 }, last: iso(-3) },
  { id: "c2", name: "Paolo Ferri", phone: "+39 347 555 0101", email: "paolo@example.com", pets: { Briciola: "cat" }, visits: 2, types: { clinic: 2 }, spent: { EUR: 10000 }, last: iso(-20) },
  { id: "c3", name: "Anna Greco", phone: "+39 320 777 8899", email: "anna@example.com", pets: { Rocky: "dog" }, visits: 4, types: { home: 4 }, spent: { EUR: 36000 }, last: iso(-41) },
];
const practice = { id: detail.practice.id, name: detail.practice.name, slug: "clinica-navigli", country: "IT", timezone: "Europe/Rome", city: "Milano", logo_url: null, published: true, review_status: "approved", stripe_status: "active", mp_status: "none", booking_enabled: true };

const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
const json = (route, body, status = 200) => route.fulfill({ status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(body) });

async function mock(page, { signedIn, lang }) {
  await page.addInitScript(({ signedIn, session, lang }) => {
    try {
      localStorage.setItem("tv.lang", lang); localStorage.setItem("tv.country", "IT");
      if (signedIn) localStorage.setItem("sb-mock-auth-token", JSON.stringify(session)); else localStorage.removeItem("sb-mock-auth-token");
    } catch {}
  }, { signedIn, session, lang });
  await page.route(`${API}/**`, async (route) => {
    const req = route.request(), u = new URL(req.url());
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const p = u.pathname;
    if (p === "/api/app/config") return json(route, { supabaseUrl: SB, supabaseAnonKey: "anon", payments: true, minVersion: null });
    if (p === "/api/app/practices") return json(route, { practices: practices.filter((x) => !u.searchParams.get("type") || x.types.includes(u.searchParams.get("type"))) });
    if (p.startsWith("/api/app/practices/")) return json(route, detail);
    if (p === "/api/availability") return json(route, { slots: slots() });
    if (p === "/api/pro/bookings") return json(route, { bookings: proBookings });
    if (p === "/api/pro/clients") return json(route, { clients });
    if (/\/api\/bookings\/[^/]+\/video$/.test(p)) return json(route, { ok: false, reason: "too_early", opensAt: iso(0, 23, 0) });
    if (p === "/api/bookings") return json(route, { bookingId: "e0000000-0000-4000-8000-0000000000aa", payment: null });
    return json(route, { ok: true });
  });
  await page.route(`${SB}/**`, async (route) => {
    const req = route.request(), u = new URL(req.url());
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const p = u.pathname;
    if (p.startsWith("/auth/v1/token")) return json(route, session);
    if (p.startsWith("/auth/v1/user")) return json(route, user);
    if (p.startsWith("/auth/v1/")) return json(route, {});
    const one = (req.headers()["accept"] || "").includes("vnd.pgrst.object");
    if (p === "/rest/v1/bookings") return json(route, ownerBookings);
    const idEq = (u.searchParams.get("id") || "").replace(/^eq\./, "");
    if (p === "/rest/v1/pets") { const list = idEq ? pets.filter((x) => x.id === idEq) : pets; return json(route, one ? list[0] ?? pets[0] : list); }
    if (p === "/rest/v1/pet_health_records") return json(route, u.searchParams.get("pet_id") ? records.filter((r) => `eq.${r.pet_id}` === u.searchParams.get("pet_id")) : records.filter((r) => r.next_due && r.next_due >= ymd(0)).sort((x, y) => x.next_due.localeCompare(y.next_due)));
    if (p === "/rest/v1/pet_documents") return json(route, []);
    if (p === "/rest/v1/owners") return json(route, one ? { full_name: "Giulia Rossi", phone: "+39 333 123 4567" } : [{ full_name: "Giulia Rossi", phone: "+39 333 123 4567" }]);
    if (p === "/rest/v1/practices") return json(route, one ? practice : [practice]);
    return json(route, one ? {} : []);
  });
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();
  const shots = JSON.parse(process.env.SHOTS || "[]");
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: s.height || 844 }, deviceScaleFactor: scale, isMobile: true, hasTouch: true, locale: "it-IT", timezoneId: "Europe/Rome" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await mock(page, { signedIn: !!s.signedIn, lang: s.lang || "it" });
    await page.goto(base + s.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(s.wait || 900);
    for (const step of s.steps || []) {
      try {
        if (step.click) await page.getByText(step.click, { exact: !!step.exact }).first().click({ timeout: 6000 });
        if (step.label) await page.getByLabel(step.label).first().click({ timeout: 6000 });
        if (step.fill) await page.getByLabel(step.fill[0]).first().fill(step.fill[1], { timeout: 6000 });
        if (step.scroll) await page.mouse.wheel(0, step.scroll);
      } catch (e) { errors.push(`step ${JSON.stringify(step)}: ${String(e).split("\n")[0]}`); }
      await page.waitForTimeout(step.wait || 500);
    }
    await page.screenshot({ path: path.join(out, `${s.name}.png`), fullPage: !!s.full });
    console.log(s.name, page.url().replace(base, ""), errors.length ? `ERRORS: ${errors.slice(0, 4).join(" | ")}` : "ok");
    await ctx.close();
  }
  await browser.close(); server.close();
})();
