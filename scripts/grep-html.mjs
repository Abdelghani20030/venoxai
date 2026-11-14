// scripts/grep-html.mjs — find occurrences of a pattern with context
import { readFileSync } from "fs";
const html = readFileSync(process.argv[2], "utf8");
const pat = new RegExp(process.argv[3], "g");
let m, i = 0;
while ((m = pat.exec(html)) && i < Number(process.argv[4] ?? 15)) {
  const start = Math.max(0, m.index - 250);
  console.log(`--- match ${++i} @${m.index} ---`);
  console.log(html.slice(start, m.index + 350).replace(/\s+/g, " "));
}
