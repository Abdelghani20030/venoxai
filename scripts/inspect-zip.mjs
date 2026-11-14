// scripts/inspect-zip.mjs — list entries of a zip (auto-finds the only .zip in attached_assets).
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { readZip } from "./zipreader.mjs";

let file = process.argv[2];
if (!file) {
  const candidates = readdirSync("attached_assets").filter((f) => f.endsWith(".zip"));
  if (candidates.length !== 1) { console.error("expected one zip, got:", candidates); process.exit(1); }
  file = join("attached_assets", candidates[0]);
}
const zip = readZip(file);
const names = [...zip.keys()].filter((n) => !n.endsWith("/"));
console.log("entries:", names.length);
// Group by directory prefix, strip extension → shows category structure
const groups = new Map();
for (const n of names) {
  const dir = n.includes("/") ? n.slice(0, n.lastIndexOf("/")) : "(root)";
  if (!groups.has(dir)) groups.set(dir, []);
  groups.get(dir).push(n);
}
for (const [dir, files] of groups) {
  console.log(`\n${dir} — ${files.length} files`);
  console.log("  e.g.", files.slice(0, 25).map((f) => f.split("/").pop()).join(" · "));
  if (files.length > 25) console.log(`  ... +${files.length - 25} more`);
}
writeFileSync("scripts/.zip-list.json", JSON.stringify(names, null, 1));
