// scripts/inspect-xlsx.mjs — dump structure of the LanGeek vocabulary workbook
// using only Node built-ins (xlsx = zip of xml). No args needed: auto-finds the
// only .xlsx in attached_assets.
import { readdirSync } from "fs";
import { join } from "path";
import { readZip, xmlTokens } from "./zipreader.mjs";

const dir = "attached_assets";
let file = process.argv[2];
if (!file) {
  const candidates = readdirSync(dir).filter((f) => f.endsWith(".xlsx"));
  if (candidates.length !== 1) {
    console.error("expected exactly one .xlsx in", dir, "got:", candidates);
    process.exit(1);
  }
  file = join(dir, candidates[0]);
}
console.log("file:", file);

const zip = readZip(file);
const names = [...zip.keys()];
console.log("zip entries:", names.filter((n) => !n.endsWith("/")).join(", "));

// --- workbook sheets (name + rid, in order) ---
const workbookXml = zip.get("xl/workbook.xml")?.toString("utf8") ?? "";
const relsXml = zip.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";
const ridToTarget = {};
for (const tok of xmlTokens(relsXml)) {
  if (tok.type === "self" && tok.name === "Relationship") {
    ridToTarget[tok.attrs.Id] = tok.attrs.Target;
  }
}
const sheets = [];
{
  let cur = null;
  for (const tok of xmlTokens(workbookXml)) {
    if (tok.type === "self" && tok.name === "sheet") {
      sheets.push({ name: tok.attrs.name, rid: tok.attrs["r:id"] });
    }
  }
}

// --- shared strings ---
const shared = [];
{
  const xml = zip.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  if (xml) {
    let inSi = false, inT = false, cur = "";
    for (const tok of xmlTokens(xml)) {
      if (tok.name === "si") {
        if (tok.type === "open") { inSi = true; cur = ""; }
        else if (tok.type === "close") { shared.push(cur); inSi = false; }
        continue;
      }
      if (!inSi) continue;
      if (tok.name === "t") {
        if (tok.type === "open" || tok.type === "self") { inT = true; if (tok.type === "self") { cur += ""; } }
        if (tok.type === "close") inT = false;
      }
      if (tok.type === "text" && inT) cur += tok.text;
    }
  }
}
console.log("shared strings:", shared.length);

// --- column letter → index ---
function colIndex(ref) {
  let n = 0;
  for (const ch of ref) {
    if (ch >= "A" && ch <= "Z") n = n * 26 + (ch.charCodeAt(0) - 64);
    else break;
  }
  return n - 1;
}

function parseSheet(xml) {
  const rows = [];
  let inRow = false, inCell = false, inIs = false, inT = false;
  let curRow = null, curCell = null, curText = "";
  let cellVal = "", cellType = "", cellRef = "";
  for (const tok of xmlTokens(xml)) {
    if (tok.name === "row") {
      if (tok.type === "open") { inRow = true; curRow = { cells: {} }; curText = ""; }
      else if (tok.type === "close") { rows.push(curRow); inRow = false; }
      continue;
    }
    if (!inRow) continue;
    if (tok.name === "c") {
      if (tok.type === "open" || tok.type === "self") {
        inCell = tok.type === "open";
        cellVal = ""; cellType = tok.attrs.t ?? "n";
        cellRef = tok.attrs.r ?? "";
        if (cellType === "inlineStr") inIs = true;
      } else if (tok.type === "close") {
        let value = cellVal;
        if (cellType === "s") value = shared[Number(cellVal)] ?? "";
        if (inIs) value = curText;
        curRow.cells[colIndex(cellRef)] = { v: value, t: cellType };
        inCell = false; inIs = false; curText = "";
      }
      continue;
    }
    if (inCell && tok.name === "v") {
      if (tok.type === "text") cellVal += tok.text;
      continue;
    }
    if (inIs && tok.name === "t") {
      if (tok.type === "open" || tok.type === "self") inT = true;
      else if (tok.type === "close") inT = false;
      continue;
    }
    if (inIs && tok.type === "text" && inT) curText += tok.text;
  }
  return rows;
}

const MAX_ROWS = Number(process.env.MAX_ROWS ?? 8);
for (const s of sheets) {
  let target = ridToTarget[s.rid] ?? "";
  if (target.startsWith("/")) target = target.slice(1); // absolute in-package path
  const path = target.startsWith("xl/") ? target : `xl/${target}`;
  const xml = zip.get(path)?.toString("utf8");
  console.log(`\n=== sheet "${s.name}" (${path}) ===`);
  if (!xml) { console.log("  MISSING"); continue; }
  const rows = parseSheet(xml);
  const maxCols = Math.max(0, ...rows.map((r) => Math.max(-1, ...Object.keys(r.cells).map(Number))));
  console.log(`  rows: ${rows.length}, columns: ${maxCols + 1}`);
  for (const row of rows.slice(0, MAX_ROWS)) {
    const arr = [];
    for (let c = 0; c <= maxCols; c++) arr.push(row.cells[c]?.v ?? "");
    console.log("  ", JSON.stringify(arr).slice(0, 500));
  }
}
