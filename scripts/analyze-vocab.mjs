// scripts/analyze-vocab.mjs — full statistical analysis of the recovered LanGeek CSV
// (Category, Level, Word, Type, Meaning, Sentence)
import { readFileSync } from "fs";

function parseCSVLine(line, sep = ",") {
  const result = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
    else if (c === '"') q = !q;
    else if (c === sep && !q) { result.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  result.push(cur.trim());
  return result;
}

const file = process.argv[2] ?? "attached_assets/langeek_full.csv";
const text = readFileSync(file, "utf8");
const lines = text.split(/\r?\n/);
const rows = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const r = parseCSVLine(lines[i]);
  if (r.length >= 4 && r[2]) rows.push({ category: r[0] || "General", level: r[1] || "?", word: r[2], type: r[3] || "", meaning: r[4] || "", example: r[5] || "" });
}
console.log(`file: ${file}`);
console.log(`data rows: ${rows.length}`);

// ── levels ──
const byLevel = new Map();
for (const w of rows) byLevel.set(w.level, (byLevel.get(w.level) ?? 0) + 1);
console.log("\n== ROWS PER LEVEL ==");
for (const [lv, n] of [...byLevel.entries()].sort()) console.log(`  ${lv}: ${n}`);

// ── unique words ──
const uniq = new Set(rows.map((w) => w.word.toLowerCase()));
console.log(`\nunique words (case-insensitive): ${uniq.size}`);
const dupWords = new Map();
for (const w of rows) {
  const k = w.word.toLowerCase();
  if (!dupWords.has(k)) dupWords.set(k, []);
  dupWords.get(k).push(`${w.level}/${w.category}`);
}
const dups = [...dupWords.entries()].filter(([, v]) => v.length > 1);
console.log(`words appearing multiple times: ${dups.length}`);
console.log("  sample:", dups.slice(0, 8).map(([k, v]) => `${k} → ${v.join(" | ")}`).join("\n          "));

// ── categories ──
const byCat = new Map();
for (const w of rows) {
  if (!byCat.has(w.category)) byCat.set(w.category, {});
  const m = byCat.get(w.category);
  m[w.level] = (m[w.level] ?? 0) + 1;
  m.total = (m.total ?? 0) + 1;
}
console.log(`\n== CATEGORIES: ${byCat.size} total ==`);
const catArr = [...byCat.entries()].sort((a, b) => b[1].total - a[1].total);
for (const [cat, m] of catArr) {
  const lv = [...Object.entries(m)].filter(([k]) => k !== "total").map(([k, v]) => `${k}:${v}`).join(" ");
  console.log(`  ${cat.padEnd(42)} ${String(m.total).padStart(4)}   ${lv}`);
}

// ── word types ──
const byType = new Map();
for (const w of rows) byType.set(w.type || "(empty)", (byType.get(w.type || "(empty)") ?? 0) + 1);
console.log("\n== ROWS PER WORD TYPE ==");
for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${t}: ${n}`);

// ── meaning/example quality ──
const noMeaning = rows.filter((w) => !w.meaning).length;
const noExample = rows.filter((w) => !w.example).length;
const shortMeaning = rows.filter((w) => w.meaning && w.meaning.length < 8).length;
console.log(`\nquality: noMeaning=${noMeaning} noExample=${noExample} shortMeaning(<8ch)=${shortMeaning}`);

// ── category → level matrix sanity: does each category appear at 1 level or many? ──
const multiLevelCats = catArr.filter(([, m]) => Object.keys(m).filter((k) => k !== "total").length > 1);
console.log(`\ncategories spanning multiple levels: ${multiLevelCats.length} of ${catArr.length}`);
console.log("  e.g.", multiLevelCats.slice(0, 6).map(([c]) => c).join(", "));

// ── per-level category counts (curriculum design view) ──
console.log("\n== FOR EACH LEVEL: category breakdown ==");
for (const lv of [...byLevel.keys()].sort()) {
  const cats = catArr.filter(([, m]) => m[lv]).map(([c, m]) => `${c}(${m[lv]})`);
  console.log(`  ${lv} [${byLevel.get(lv)} words]:\n    ${cats.join(", ")}`);
}
