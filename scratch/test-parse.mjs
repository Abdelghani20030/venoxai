import fs from 'fs';
import path from 'path';

function _parseCSVLine(line, sep = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
    else if (char === '"') { inQuotes = !inQuotes; }
    else if (char === sep && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function _parseGlobalCSV(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], ',');
    if (r.length >= 4 && r[0]) out.push({
      word:     r[0].replace(/^"|"$/g, ''),
      type:     r[1]?.replace(/^"|"$/g, '') || '',
      level:    r[2]?.replace(/^"|"$/g, '') || '',
      meaning:  r[3]?.replace(/^"|"$/g, '') || '',
      example:  r[4]?.replace(/^"|"$/g, '') || '',
      synonyms: r[5]?.replace(/^"|"$/g, '') || '',
    });
  }
  return out;
}

function _parsePhrasalCSV(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], ',');
    if (r.length >= 2 && r[0]) out.push({
      word:    r[0].replace(/^"|"$/g, ''),
      meaning: r[1]?.replace(/^"|"$/g, '') || '',
      example: r[2]?.replace(/^"|"$/g, '') || '',
    });
  }
  return out;
}

function _parseSlangCSV(text) {
  const lines = text.split('\n');
  const header = lines[0] || '';
  const sep = header.includes(';') ? ';' : ',';
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], sep);
    if (r.length >= 3 && r[1]) out.push({
      topic:   r[0]?.replace(/^"|"$/g, '').trim() || '',
      word:    r[1].replace(/^"|"$/g, '').trim(),
      meaning: r[2]?.replace(/^"|"$/g, '').trim() || '',
      example: r[3]?.replace(/^"|"$/g, '').trim() || '',
    });
  }
  return out;
}

function _parseIdiomsCSV(text) {
  const lines = text.split('\n');
  const header = lines[0] || '';
  const sep = header.includes(';') ? ';' : ',';
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], sep);
    if (r.length >= 3 && r[1]) out.push({
      word:    r[1].replace(/^"|"$/g, '').trim(),
      meaning: r[2]?.replace(/^"|"$/g, '').trim() || '',
      example: r[3]?.replace(/^"|"$/g, '').trim() || '',
    });
  }
  return out;
}

function _parseLangeekCSV(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], ',');
    if (r.length >= 4 && r[2]) out.push({
      category: r[0]?.replace(/^"|"$/g, '') || 'General',
      level:    r[1]?.replace(/^"|"$/g, '') || '',
      word:     r[2]?.replace(/^"|"$/g, '') || '',
      type:     r[3]?.replace(/^"|"$/g, '') || '',
      meaning:  r[4]?.replace(/^"|"$/g, '') || '',
      example:  r[5]?.replace(/^"|"$/g, '') || '',
      synonyms: '',
    });
  }
  return out;
}

const dir = 'artifacts/venoxa/public/data';
const files = {
  global: 'global.csv',
  phrasal: 'phrasal.csv',
  slang: 'slang.csv',
  idioms: 'idioms.csv',
  langeek: 'langeek.csv'
};

for (const [key, filename] of Object.entries(files)) {
  const p = path.join(dir, filename);
  try {
    const text = fs.readFileSync(p, 'utf-8');
    let parsed = [];
    if (key === 'global') parsed = _parseGlobalCSV(text);
    else if (key === 'phrasal') parsed = _parsePhrasalCSV(text);
    else if (key === 'slang') parsed = _parseSlangCSV(text);
    else if (key === 'idioms') parsed = _parseIdiomsCSV(text);
    else if (key === 'langeek') parsed = _parseLangeekCSV(text);
    console.log(`${key} parsed successfully: ${parsed.length} items`);
  } catch (err) {
    console.error(`Error parsing ${key}:`, err);
  }
}
