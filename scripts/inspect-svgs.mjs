// scripts/inspect-svgs.mjs — look at a few SVGs from the langeek zip for metadata.
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { readZip } from "./zipreader.mjs";

const zipName = readdirSync("attached_assets").find((f) => f.endsWith(".zip"));
const zip = readZip(join("attached_assets", zipName));
const names = [...zip.keys()].filter((n) => n.endsWith(".svg")).sort((a, b) => {
  const na = Number(a.match(/(\d+)/)?.[1] ?? 0);
  const nb = Number(b.match(/(\d+)/)?.[1] ?? 0);
  return na - nb;
});
console.log("count:", names.length, "range:", names[0], "→", names[names.length - 1]);

// Dump full content of the first 3 + sizes of all
for (const n of names.slice(0, 3)) {
  const svg = zip.get(n).toString("utf8");
  console.log(`\n===== ${n} (${svg.length} chars) =====`);
  console.log(svg.slice(0, 1200));
}

const stats = names.map((n) => {
  const s = zip.get(n).toString("utf8");
  return { name: n, chars: s.length, hasTitle: /<title/i.test(s), hasLabel: /(aria-label|data-name)/i.test(s) };
});
console.log("\nwith <title>:", stats.filter((s) => s.hasTitle).length, "with label:", stats.filter((s) => s.hasLabel).length);
console.log("sizes min/median/max:", Math.min(...stats.map(s => s.chars)), stats.map(s => s.chars).sort((a,b)=>a-b)[Math.floor(stats.length/2)], Math.max(...stats.map(s => s.chars)));
writeFileSync("scripts/.svg-stats.json", JSON.stringify(stats, null, 1));
