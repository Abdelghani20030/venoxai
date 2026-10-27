#!/usr/bin/env node
// Dump a structural layout spec of a PDF: page size, background rects,
// text runs with font size + position. Used to reconstruct the
// "Venoxa Level Test Preview" spec without a raster backend in Node.
// Usage: node scripts/dump-pdf-spec.mjs "<path-to-pdf>" [--filter substr]
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const pdfPath = process.argv[2];
const filter = process.argv.includes("--filter") ? process.argv[process.argv.indexOf("--filter") + 1] : null;
if (!pdfPath || !fs.existsSync(pdfPath)) {
  console.error("Usage: node scripts/dump-pdf-spec.mjs <pdf> [--filter substr]");
  process.exit(1);
}

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, disableFontFace: true, isEvalSupported: false }).promise;

for (let p = 1; p <= doc.numPages; p++) {
  if (filter && !(p + "").startsWith(filter) && filter !== "all") continue;
  const page = await doc.getPage(p);
  const vp = page.getViewport({ scale: 1 });
  console.log(`\n══ PAGE ${p} (w=${Math.round(vp.width)} h=${Math.round(vp.height)}) ══`);

  // background/full-width rects from the content stream (fill ops)
  const ops = await page.getOperatorList();
  const OPS = pdfjs.OPS;
  let curFill = null, curXformStack = [];
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i], args = ops.argsArray[i];
    if (fn === OPS.setFillColorRGB) curFill = args.slice(0, 3).map(v => Math.round(v * 255));
    else if (fn === OPS.constructPath && args[2]?.length >= 8) {
      const pts = args[2];
      const x0 = Math.min(pts[0], pts[4], pts[2] ?? pts[0], pts[6] ?? pts[4]);
      const y0 = Math.min(pts[1], pts[5]);
      const x1 = Math.max(pts[0], pts[4]);
      const y1 = Math.max(pts[1], pts[5]);
      const w = x1 - x0, h = y1 - y0;
      if (w > 4 && h > 2 && curFill) {
        const rgb = `rgb(${curFill.join(",")})`;
        if (rgb !== "rgb(255,255,255)" || (w < vp.width * 0.9))
          console.log(`  rect x=${Math.round(x0)} y=${Math.round(vp.height - y1)} w=${Math.round(w)} h=${Math.round(h)} fill=${rgb}`);
      }
    }
  }

  const tc = await page.getTextContent();
  const lines = new Map();
  for (const it of tc.items) {
    if (!it.str || !it.str.trim()) continue;
    const x = Math.round(it.transform[4]);
    const yTop = Math.round(vp.height - it.transform[5]);
    const size = Math.round(it.transform[3] * 10) / 10;
    const key = `${yTop - Math.round(size)}_${size}`;
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push({ x, s: it.str, size });
  }
  const sorted = [...lines.entries()].sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  for (const [, runs] of sorted) {
    runs.sort((a, b) => a.x - b.x);
    const sizes = [...new Set(runs.map(r => r.size))];
    const xs = Math.min(...runs.map(r => r.x));
    const text = runs.map(r => r.s).join(" ").replace(/\s+/g, " ").trim();
    console.log(`  y~${runs[0].y ?? "?" ?? ""} x=${xs} size=${sizes.join("/")} | ${text.slice(0, 150)}`);
  }
}
console.log("\n(end)");
