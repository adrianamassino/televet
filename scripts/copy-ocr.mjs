// Copies the open-source OCR engine (Tesseract.js, Apache-2.0) and its language data into public/ocr so the
// phone reads booklet photos locally: no external service, no per-scan cost, the photo never leaves the device.
import fs from "node:fs"; import path from "node:path";
const nm = path.join(process.cwd(), "node_modules"), out = path.join(process.cwd(), "public", "ocr");
fs.mkdirSync(out, { recursive: true });
const cp = (from, to) => fs.existsSync(from) && fs.copyFileSync(from, path.join(out, to ?? path.basename(from)));
cp(path.join(nm, "tesseract.js/dist/worker.min.js"));
const core = path.join(nm, "tesseract.js-core");
if (fs.existsSync(core)) for (const f of fs.readdirSync(core)) if (/^tesseract-core.*lstm.*\.wasm\.js$/.test(f)) cp(path.join(core, f));
for (const l of ["ita", "fra", "spa", "eng"]) cp(path.join(nm, "@tesseract.js-data", l, "4.0.0", `${l}.traineddata.gz`));
console.log("ocr assets ready:", fs.readdirSync(out).length, "files");
