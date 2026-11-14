// scripts/check-c1-dups.mjs — are the 856 dropped C1 rows real duplicates?
import { readFileSync } from "fs";
import { parseCSVLine } from "./build-vocab-parsers.mjs";

const text = readFileSync("attached_assets/langeek_full.csv", "utf8");
const lines = text.split(/\r?\n/);
const rows = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const r = parseCSVLine(lines[i]);
  if (r.length >= 4 && r[2]) rows.push({ category: r[0].trim(), level: r[1].trim(), word: r[2].trim(), meaning: r[4].trim() });
}
const c1 = rows.filter((r) => r.level === "C1");
console.log("C1 raw rows:", c1.length);
const seen = new Map();
let dups = 0;
const samples = [];
for (const r of c1) {
  const k = `${r.level}|${r.category}|${r.word.toLowerCase()}`;
  if (seen.has(k)) {
    dups++;
    if (samples.length < 8) samples.push({ first: seen.get(k), dup: r });
  } else seen.set(k, r);
}
console.log("C1 exact (level+category+word) dup rows:", dups);
for (const s of samples) console.log("  dup:", JSON.stringify(s.first), "⟷", JSON.stringify(s.dup));
