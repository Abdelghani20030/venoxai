// scripts/parse-langeek-topics.mjs — extract topic cards (icon + href + name) from saved HTML
import { readFileSync, writeFileSync } from "fs";

const html = readFileSync(process.argv[2], "utf8");

// Find anchors linking to /en/vocab/topic-related/<slug> that contain an img with icon-*.svg
const anchorRe = /<a[^>]*href="([^"]*\/en\/vocab\/topic-related\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
const seen = new Map();
let m;
while ((m = anchorRe.exec(html))) {
  const href = m[1];
  const inner = m[2];
  const iconMatch = inner.match(/icon-(\d+)\.svg/);
  const textMatch = inner.match(/>([^<>]{2,60})<\/span>/);
  const slug = href.replace(/\/en\/vocab\/topic-related\/?/, "").replace(/\/$/, "");
  if (!slug) continue;
  if (!seen.has(slug)) {
    seen.set(slug, {
      slug,
      icon: iconMatch ? Number(iconMatch[1]) : null,
      text: textMatch ? textMatch[1].trim() : "",
    });
  }
}
const items = [...seen.values()];
console.log("topic slugs found:", items.length);
for (const it of items) console.log(`  icon-${it.icon}  ${it.slug.padEnd(40)} ${it.text}`);
writeFileSync("scripts/.langeek-topics.json", JSON.stringify(items, null, 1));
