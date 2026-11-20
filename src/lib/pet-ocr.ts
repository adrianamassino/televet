/** On-device OCR (Tesseract.js, Apache-2.0). Engine and language data are served from /ocr on our own site. */
type Worker = { recognize: (img: Blob) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> };
let cached: { key: string; w: Promise<Worker> } | null = null;

export async function ocrText(img: Blob, lang: string): Promise<string> {
  const code = ({ it: "ita", fr: "fra", es: "spa" } as Record<string, string>)[lang];
  const langs = code ? `${code}+eng` : "eng";
  if (!cached || cached.key !== langs) {
    cached?.w.then((w) => w.terminate()).catch(() => {});
    const { createWorker } = await import("tesseract.js");
    cached = { key: langs, w: createWorker(langs.split("+"), 1, { workerPath: "/ocr/worker.min.js", corePath: "/ocr", langPath: "/ocr", gzip: true }) as unknown as Promise<Worker> };
  }
  const w = await cached.w;
  return (await w.recognize(img)).data.text;
}
export const stopOcr = () => { cached?.w.then((w) => w.terminate()).catch(() => {}); cached = null; };
