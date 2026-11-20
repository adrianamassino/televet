/**
 * Regenerates the app icons, splash images and in-app logos from the Televet logo (../public/logo.svg).
 * One-off tool: needs Playwright (`npm i -D playwright` or run from a machine that has it). Not used at build time.
 *   node scripts/make-assets.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const svg = fs.readFileSync(path.join(root, "..", "public", "logo.svg"), "utf8");
const paths = svg.match(/<path[^>]*\/>/g) || [];
// heart + paw = the paths on the left of the wordmark (indices found by bounding box: x < 770 of 3448)
const EMBLEM = [0, 4, 5, 6, 11, 12];
const emblem = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="28 26 760 760"><g fill="${fill}">${EMBLEM.map((i) => paths[i]).join("")}</g></svg>`;
const wordmark = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3448 800"><g fill="${fill}">${paths.join("")}</g></svg>`;

const GRAD_OWNER = "linear-gradient(150deg,#0a2a9c 0%,#0a3fd6 34%,#1e7bff 62%,#22b8ea 82%,#3fd9c9 108%)";
const GRAD_VET = "linear-gradient(150deg,#06123f 0%,#0a2a9c 48%,#0a3fd6 78%,#1e7bff 112%)";
const waves = `<svg viewBox="0 0 1024 1024" style="position:absolute;inset:0" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 720 C 220 600 420 860 640 740 S 940 560 1024 640 L1024 1024 L0 1024 Z" fill="rgba(255,255,255,.10)"/>
  <path d="M0 820 C 260 720 460 940 700 830 S 960 700 1024 760 L1024 1024 L0 1024 Z" fill="rgba(255,255,255,.10)"/>
  <circle cx="860" cy="150" r="330" fill="rgba(120,240,230,.22)"/></svg>`;

const icon = (grad, extra = "", scale = 0.6) => `<div style="position:relative;width:1024px;height:1024px;background:${grad};overflow:hidden">${waves}
  <div style="position:absolute;left:50%;top:50%;width:${1024 * scale}px;height:${1024 * scale}px;transform:translate(-50%,-52%);filter:drop-shadow(0 18px 30px rgba(4,16,70,.35))">${emblem("#fff")}</div>${extra}</div>`;
const proTag = `<div style="position:absolute;right:86px;bottom:92px;padding:18px 44px;border-radius:999px;background:#3fd9c9;color:#06123f;font:800 92px/1 Figtree,system-ui,sans-serif;letter-spacing:4px;box-shadow:0 14px 30px rgba(4,16,70,.4)">PRO</div>`;
const box = (w, h, inner, bg = "transparent") => `<div style="width:${w}px;height:${h}px;background:${bg};display:flex;align-items:center;justify-content:center">${inner}</div>`;
const sized = (w, inner) => `<div style="width:${w}px">${inner}</div>`;

const jobs = [
  ["owner/icon.png", 1024, 1024, icon(GRAD_OWNER), false],
  ["vet/icon.png", 1024, 1024, icon(GRAD_VET, proTag), false],
  ["owner/adaptive-background.png", 1024, 1024, `<div style="position:relative;width:1024px;height:1024px;background:${GRAD_OWNER};overflow:hidden">${waves}</div>`, false],
  ["vet/adaptive-background.png", 1024, 1024, `<div style="position:relative;width:1024px;height:1024px;background:${GRAD_VET};overflow:hidden">${waves}</div>`, false],
  // adaptive foreground: the launcher crops to the inner 66 %, so the emblem stays within ~46 % of the canvas
  ["owner/adaptive-foreground.png", 1024, 1024, box(1024, 1024, sized(470, emblem("#fff"))), true],
  ["vet/adaptive-foreground.png", 1024, 1024, `<div style="position:relative;width:1024px;height:1024px">${box(1024, 1024, sized(440, emblem("#fff")))}<div style="position:absolute;left:50%;top:716px;transform:translateX(-50%);padding:8px 26px;border-radius:999px;background:#3fd9c9;color:#06123f;font:800 50px/1 system-ui,sans-serif;letter-spacing:3px">PRO</div></div>`, true],
  ["brand/adaptive-monochrome.png", 1024, 1024, box(1024, 1024, sized(470, emblem("#fff"))), true],
  ["brand/splash.png", 600, 600, box(600, 600, sized(520, emblem("#fff"))), true],
  ["brand/notification.png", 96, 96, box(96, 96, sized(84, emblem("#fff"))), true],
  ["brand/favicon.png", 96, 96, `<div style="width:96px;height:96px;border-radius:22px;background:${GRAD_OWNER};display:flex;align-items:center;justify-content:center">${sized(62, emblem("#fff"))}</div>`, true],
  ["brand/emblem-white.png", 360, 360, sized(360, emblem("#fff")), true],
  ["brand/emblem-blue.png", 360, 360, sized(360, emblem("#0a3fd6")), true],
  ["brand/logo-white.png", 1080, 251, sized(1080, wordmark("#fff")), true],
  ["brand/logo-blue.png", 1080, 251, sized(1080, wordmark("#0a3fd6")), true],
];

(async () => {
  const browser = await chromium.launch();
  for (const [file, w, h, html, transparent] of jobs) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:${transparent ? "transparent" : "#fff"}">${html}</body></html>`);
    await page.screenshot({ path: path.join(root, "assets", file), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
    console.log("wrote", file);
  }
  await browser.close();
})();
