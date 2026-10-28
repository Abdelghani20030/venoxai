// One-off diagnostic: what do the committed fonts actually map U+FE70–FEFF to,
// and does fontkit shape Arabic (GSUB) when given the LOGICAL string?
// Run: pnpm --filter @workspace/scripts exec tsx src/level-test/fontkit-inspect.ts
// @ts-nocheck
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONTS = path.join(HERE, "../../../artifacts/api-server/src/lib/fonts");
const fk = ((await import("@pdf-lib/fontkit")) as any).default ?? (await import("@pdf-lib/fontkit"));

// canonical names for presentation codepoints from the cached UCD file
const udLines = readFileSync(path.join(process.env.TEMP || "/tmp", "UnicodeData.txt"), "utf8").split("\n");
const NAME = new Map<string, string>();
for (const l of udLines) { const f = l.split(";"); if (f.length >= 2) NAME.set(f[0], f[1]); }
const nm = (cp: number) => NAME.get(cp.toString(16).toUpperCase().padStart(4, "0")) ?? "?";

function probe(label: string, bytes: Buffer) {
  console.log(`\n══ ${label} (${(bytes.length / 1024).toFixed(0)} KB) ══`);
  let font: any;
  try { font = fk.create(new Uint8Array(bytes)); } catch (e) { console.log("open failed:", e?.message); return; }

  // FE70–FEFF coverage census
  let have = 0, missing: number[] = [];
  for (let cp = 0xFE70; cp <= 0xFEFF; cp++) {
    const g = font.glyphForCodePoint?.(cp);
    if (g && g.id !== 0) have++; else missing.push(cp);
  }
  console.log(`cmap: ${have} / ${0xFEFF - 0xFE70 + 1} presentation forms mapped (${missing.length} → .notdef)`);
  if (missing.length && missing.length < 40) console.log("  missing:", missing.map(c => "U+" + c.toString(16)).join(" "));

  // spot probes
  for (const cp of [0xFE8D, 0xFE8E, 0xFEDF, 0xFEE0, 0xFEE1, 0xFEE2, 0xFEAA, 0xFEE3, 0xFEE5, 0xFED0, 0xFEF1, 0xFEF0]) {
    const g = font.glyphForCodePoint?.(cp);
    console.log(`  U+${cp.toString(16)} ${nm(cp).replace("ARABIC LETTER ", "").padEnd(34)} → gid ${g ? g.id : "MISSING"}`);
  }

  const word = "الغامدي";
  try {
    const lay = font.layout(word);
    const gs = [...lay.glyphs];
    console.log(`layout("${word}") logical glyph ids: ${gs.map(g => g.id).join(" ")}`);
  } catch (e) { console.log("layout() failed:", e?.message); }
  try {
    const gs = font.glyphsForString(word);
    console.log(`glyphsForString("${word}") plain cmap ids: ${gs.map(g => g.id).join(" ")}`);
  } catch (e) { console.log("glyphsForString failed:", e?.message); }
}

probe("Noto Sans Arabic [wdth,wght] variable", readFileSync(path.join(FONTS, "NotoSansArabic-Regular.ttf")));
if (existsSync(path.join(FONTS, "Amiri-Regular.ttf"))) {
  probe("Amiri Regular static", readFileSync(path.join(FONTS, "Amiri-Regular.ttf")));
}

// our shaper's output, decoded through UCD names (ground truth check)
const { shapeArabicRun } = await import("../../../artifacts/api-server/src/lib/fonts/arabic-shaper");
const shaped = shapeArabicRun("الغامدي");
console.log("\n── shapeArabicRun('الغامدي') decoded ──");
for (const ch of shaped) {
  console.log(`   U+${ch.codePointAt(0)!.toString(16).padStart(4, "0")}  ${nm(ch.codePointAt(0)!)}`);
}
