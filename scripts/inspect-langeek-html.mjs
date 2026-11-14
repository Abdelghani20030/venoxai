// scripts/inspect-langeek-html.mjs — extract category names + icon refs from saved langeek page HTML
import { readFileSync, writeFileSync } from "fs";

const file = process.argv[2];
const html = readFileSync(file, "utf8");
console.log("html chars:", html.length);

// icon-*.svg references
const iconRefs = [...new Set(html.match(/icon-\d+[^"'\s)]*\.svg/g) ?? [])];
console.log("icon refs:", iconRefs.length, iconRefs.slice(0, 90));

// category hrefs like /en/vocab/some-slug
const hrefs = [...new Set((html.match(/\/en\/vocab\/[a-z0-9-]+/g) ?? []).map((h) => h.replace(/\\/g, "")))];
console.log("vocab hrefs:", hrefs.length, hrefs.slice(0, 90));

// try to pair category name text near icon refs: search for img src + alt
const imgTags = html.match(/<img[^>]*icon-\d+[^>]*>/g) ?? [];
console.log("img tags with icon:", imgTags.length);
console.log(imgTags.slice(0, 20).join("\n"));

writeFileSync("scripts/.langeek-html-links.json", JSON.stringify({ iconRefs, hrefs, imgTags }, null, 1));
