// scripts/check-ar-progress.mjs — sample the Arabic checkpoint files for quality.
import { readFileSync, existsSync } from "fs";

const file = "attached_assets/vocab-ar-progress.json";
if (!existsSync(file)) { console.log("no checkpoint yet"); process.exit(0); }
const prog = JSON.parse(readFileSync(file, "utf8"));
const ids = Object.keys(prog);
console.log("checkpoint senses:", ids.length);

const catFile = "attached_assets/vocab-cat-ar-progress.json";
if (existsSync(catFile)) {
  const cp = JSON.parse(readFileSync(catFile, "utf8"));
  console.log("checkpoint categories:", Object.keys(cp).length);
  for (const [id, t] of Object.entries(cp).slice(0, 5)) console.log(`  cat ${id}: ${t}`);
}

const norm = JSON.parse(readFileSync("attached_assets/vocab-normalized.json", "utf8"));
const byId = new Map(norm.senses.map((s) => [s.id, s]));

// show a spread: first 3, middle 3, last 3
const pick = [ids[0], ids[1], ids[2], ids[Math.floor(ids.length / 2)], ids[Math.floor(ids.length / 2) + 1], ids[ids.length - 3], ids[ids.length - 2], ids[ids.length - 1]];
for (const id of pick) {
  const s = byId.get(Number(id));
  const t = prog[id];
  console.log(`\n#${id} ${s?.word} (${s?.pos}, ${s?.level})`);
  console.log(`  EN: ${s?.meaning}`);
  console.log(`  AR m: ${t?.m}`);
  console.log(`  AR e: ${t?.e}`);
}

// sanity: does any entry look like untranslated English?
let englishish = 0, empty = 0, arabic = 0;
for (const [, t] of Object.entries(prog)) {
  const m = String(t?.m ?? "");
  if (!m.trim()) empty++;
  else if (/[\u0600-\u06FF]/.test(m)) arabic++;
  else englishish++;
}
console.log(`\nquality: arabic-script=${arabic} no-script=${englishish} empty=${empty}`);
