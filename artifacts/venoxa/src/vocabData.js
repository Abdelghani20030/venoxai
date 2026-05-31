// ─────────────────────────────────────────────────────────────────────────────
//  vocabData.js — Bundled vocabulary loader
//
//  The 5 CSV files live in:  artifacts/venoxa/public/data/
//    global.csv    ← دليل_شامل_لتعلم_الكلمات_أول_3000_كلمة.csv
//    langeek.csv   ← A1_to_C1_langeek_list_.csv
//    phrasal.csv   ← Phrasal_verbs.csv
//    idioms.csv    ← English_Idioms.csv
//    slang.csv     ← Slang.csv
//
//  This module fetches them at runtime from the public folder (no upload
//  needed) using the same parsers already used in aiHelpers.js.
//
//  Usage in aiHelpers.js → loadAllVocabFromStorage():
//    import { loadBundledVocab } from './vocabData.js';
//    const bundled = await loadBundledVocab();
// ─────────────────────────────────────────────────────────────────────────────

// ── CSV parsing helpers (copied from aiHelpers.js to keep this self-contained)

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
  // English_Idioms.csv format:  Topic, Idiom, Meaning, Sentence
  const lines = text.split('\n');
  const header = lines[0] || '';
  const sep = header.includes(';') ? ';' : ',';
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], sep);
    // Columns: Topic(0), Idiom(1), Meaning(2), Sentence(3)
    if (r.length >= 3 && r[1]) out.push({
      word:    r[1].replace(/^"|"$/g, '').trim(),   // Idiom column
      meaning: r[2]?.replace(/^"|"$/g, '').trim() || '',
      example: r[3]?.replace(/^"|"$/g, '').trim() || '',
    });
  }
  return out;
}

function _parseLangeekCSV(text) {
  // A1_to_C1_langeek_list_.csv format: Category, Level, Word, Type, Meaning, Sentence
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

// ── In-memory cache so we only fetch once per session ────────────────────────

let _cache = null;

/**
 * Fetches all 5 bundled CSVs from /data/ (public folder) and returns
 * the parsed vocab arrays.  Results are cached after the first call.
 *
 * Returns the same shape as loadAllVocabFromStorage():
 * {
 *   globalVocab, phrasalVocab, slangVocab, idiomsVocab, langeekVocab
 * }
 */
export async function loadBundledVocab() {
  if (_cache) return _cache;

  const rawBase = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const BASE = (rawBase === '' || rawBase === '.') ? '/' : (rawBase.endsWith('/') ? rawBase : rawBase + '/');

  const fetchText = async (path) => {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  };

  const [globalText, phrasalText, slangText, idiomsText, langeekText] =
    await Promise.all([
      fetchText(`${BASE}data/global.csv`),
      fetchText(`${BASE}data/phrasal.csv`),
      fetchText(`${BASE}data/slang.csv`),
      fetchText(`${BASE}data/idioms.csv`),
      fetchText(`${BASE}data/langeek.csv`),
    ]);

  _cache = {
    globalVocab:  globalText  ? _parseGlobalCSV(globalText)   : [],
    phrasalVocab: phrasalText ? _parsePhrasalCSV(phrasalText) : [],
    slangVocab:   slangText   ? _parseSlangCSV(slangText)     : [],
    idiomsVocab:  idiomsText  ? _parseIdiomsCSV(idiomsText)   : [],
    langeekVocab: langeekText ? _parseLangeekCSV(langeekText) : [],
  };

  console.log(
    `[vocabData] Bundled vocab loaded — ` +
    `global:${_cache.globalVocab.length} phrasal:${_cache.phrasalVocab.length} ` +
    `slang:${_cache.slangVocab.length} idioms:${_cache.idiomsVocab.length} ` +
    `langeek:${_cache.langeekVocab.length}`
  );

  return _cache;
}

/** Invalidate the cache (e.g. after a user uploads a new CSV manually). */
export function clearBundledVocabCache() {
  _cache = null;
}
