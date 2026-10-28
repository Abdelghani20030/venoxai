// Ground-truth experiment: how does pdf-lib actually render Arabic?
// Confirmed so far: Amiri + presentation-forms (visual order) renders joined
// letters. This version isolates single words + the exact segmented name.
// Output: scripts/cert-arabic-test.pdf
// @ts-nocheck
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shapeArabicRun, segmentName } from "../../../artifacts/api-server/src/lib/fonts/arabic-shaper";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FONTS = path.join(dir, "../../../artifacts/api-server/src/lib/fonts");

const doc = await PDFDocument.create();
doc.registerFontkit(fontkit);
const page = doc.addPage([700, 430]);
const helv = await doc.embedFont(StandardFonts.HelveticaBold);
const amiriF = existsSync(path.join(FONTS, "Amiri-Regular.ttf"))
  ? await doc.embedFont(readFileSync(path.join(FONTS, "Amiri-Regular.ttf")), { subset: false })
  : null;

let y = 396;
const row = async (label, font, text, size = 26) => {
  page.drawText(`${label}`, { x: 18, y, size: 8, font: helv, color: rgb(0.45, 0.45, 0.45) });
  if (!font) { y -= 46; return; }
  try {
    page.drawText(text, { x: 18, y: y - 26, size, font, color: rgb(0, 0, 0) });
  } catch (e) {
    page.drawText("drawText FAILED: " + String(e?.message ?? e).slice(0, 70), { x: 18, y: y - 26, size: 9, font: helv, color: rgb(0.8, 0, 0) });
  }
  y -= 46;
};

// exactly how the certificate draws a name: per-run font + advance
const drawName = async (label, runs) => {
  page.drawText(label, { x: 18, y, size: 8, font: helv, color: rgb(0.45, 0.45, 0.45) });
  const size = 26;
  let x = 18;
  for (const rn of runs) {
    const f = rn.isArabic ? amiriF : helv;
    page.drawText(rn.text, { x, y: y - 26, size, font: f, color: rgb(0, 0, 0) });
    x += f.widthOfTextAtSize(rn.text, size);
  }
  y -= 46;
};

await row("1. word 'al-Ghamdi'", amiriF, shapeArabicRun("الغامدي"), 44);
await row("2. words 'Mohammed Abdallah'", amiriF, shapeArabicRun("محمد عبد الله"), 44);
await row("3. words 'Fatima al-Zahra'", amiriF, shapeArabicRun("فاطمة الزهراء"), 44);
await row("4. word 'Ahmed'", amiriF, shapeArabicRun("أحمد"), 44);
await drawName("5. segmentName [Maria O'Brien-<Arabic>]", segmentName("María O'Brien-الغامدي"));

const out = await doc.save();
const outPath = path.join(dir, "../../cert-arabic-test.pdf");
writeFileSync(outPath, out);
console.log(`wrote ${outPath} (${(out.length / 1024).toFixed(0)} KB)`);
