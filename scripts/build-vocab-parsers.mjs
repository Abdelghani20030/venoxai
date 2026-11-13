// scripts/build-vocab-parsers.mjs — shared CSV line parser (kept in sync with build-vocab.mjs)
export function parseCSVLine(line, sep = ",") {
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
