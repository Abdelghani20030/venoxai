const fs = require('fs');
const path = require('path');

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

const dataDir = path.join(__dirname, '..', 'artifacts', 'venoxa', 'public', 'data');
const files = ['global.csv', 'phrasal.csv', 'slang.csv', 'idioms.csv', 'langeek.csv'];
const parsers = {
  'global.csv': _parseGlobalCSV,
  'phrasal.csv': _parsePhrasalCSV,
  'slang.csv': _parseSlangCSV,
  'idioms.csv': _parseIdiomsCSV,
  'langeek.csv': _parseLangeekCSV
};

for (const file of files) {
  try {
    const text = fs.readFileSync(path.join(dataDir, file), 'utf8');
    const result = parsers[file](text);
    console.log(`${file}: parsed ${result.length} records. Sample:`, result[0]);
  } catch (err) {
    console.error(`Error parsing ${file}:`, err.message);
  }
}
