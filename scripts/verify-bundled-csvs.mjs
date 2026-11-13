// scripts/verify-bundled-csvs.mjs — confirm the restored public/data CSVs parse
// into the shapes vocabData.js expects (headers + row counts).
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

const expect = {
  "global.csv":  { header: /Word.*Type.*Level.*Meaning.*Example.*Synonym/i, minRows: 5000 },
  "langeek.csv": { header: /Category.*Level.*Word.*Type.*Meaning.*Sentence/i, minRows: 8000 },
  "idioms.csv":  { header: /Topic.*Idiom.*Meaning.*Sentence/i, minRows: 700 },
  "phrasal.csv": { header: /Word.*Meaning.*Example/i, minRows: 200 },
  "slang.csv":   { header: /Topic.*Word.*Meaning.*Example/i, minRows: 150 },
};

let fail = 0;
for (const [name, { header, minRows }] of Object.entries(expect)) {
  const text = readFileSync(`artifacts/venoxa/public/data/${name}`, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const head = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine).filter((r) => r[0] || r[1]);
  const okHead = header.test(lines[0]);
  const okRows = rows.length >= minRows;
  const okUtf8 = !text.includes("\u0000"); // UTF-16 corruption check
  const status = okHead && okRows && okUtf8 ? "OK " : "FAIL";
  if (!(okHead && okRows && okUtf8)) fail++;
  console.log(`${status} ${name.padEnd(12)} rows=${String(rows.length).padStart(5)}  header=[${head.slice(0, 6).join(" | ")}]`);
}
console.log(fail === 0 ? "\nall bundled CSVs verified" : `\n${fail} FILE(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
