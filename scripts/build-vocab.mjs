// scripts/build-vocab.mjs
// ─────────────────────────────────────────────────────────────────────────────
//  Builds the canonical vocabulary dataset from the LanGeek CSV.
//
//  Inputs : attached_assets/langeek_full.csv (recovered from git 0981f50)
//  Outputs:
//    migrations/vocabulary-seed.sql              categories + senses + rules + links
//    artifacts/venoxa/public/data/vocab-catalog.json  frontend catalog
//    attached_assets/vocab-normalized.json       machine-readable build output
//    console report
//
//  Usage:  node scripts/build-vocab.mjs [--dry]
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { GRAMMAR_RULES, rulesForSense, groupFor, LEVELS } from "./vocab-grammar-map.mjs";

// ── helpers ─────────────────────────────────────────────────────────────────
const norm = (s) => String(s ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const smartQuotes = (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
const cleanText = (s) => smartQuotes(norm(s));

function parseCSVLine(line, sep = ",") {
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

export function slugify(s) {
  return norm(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ── 1. parse + normalize ────────────────────────────────────────────────────
const file = process.env.VOCAB_SRC ?? "attached_assets/langeek_full.csv";
const text = readFileSync(file, "utf8");
const lines = text.split(/\r?\n/);

const raw = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const r = parseCSVLine(lines[i]);
  if (r.length >= 4 && r[2]) {
    raw.push({ category: cleanText(r[0]) || "General", level: norm(r[1]).toUpperCase(), word: cleanText(r[2]), type: cleanText(r[3]), meaning: cleanText(r[4]), example: cleanText(r[5]) });
  }
}
console.log(`parsed rows: ${raw.length}`);

// canonical POS spelling
const POS_CANON = { "int.": "intj.", phrase: "phr.", sentence: "phr." };

// dedupe: same (level, category, word_norm) → merge
const senses = [];
const seen = new Map(); // key → sense
let dupExact = 0, dupConflict = 0;
for (const r of raw) {
  if (!LEVELS.includes(r.level)) { console.error("  ! bad level:", JSON.stringify(r.level), "word:", r.word); continue; }
  const pos = POS_CANON[r.type] ?? r.type;
  const key = `${r.level}|${slugify(r.category)}|${r.word.toLowerCase().replace(/\s+/g, "-")}`;
  const prev = seen.get(key);
  if (prev) {
    // same word+level+category: identical meaning → drop; different → keep both senses (key #2)
    if (prev.meaning.toLowerCase() === r.meaning.toLowerCase()) { dupExact++; continue; }
    dupConflict++;
    let n = 2;
    let k2 = `${key}#${n}`;
    while (seen.has(k2)) { n++; k2 = `${key}#${n}`; }
    const s = { ...r, pos, source_key: k2 };
    seen.set(k2, s); senses.push(s);
    continue;
  }
  const s = { ...r, pos, source_key: key };
  seen.set(key, s); senses.push(s);
}
console.log(`senses after dedupe: ${senses.length} (exact dups dropped: ${dupExact}, meaning-conflicts kept as separate senses: ${dupConflict})`);

// stable ordering: level → category name → original order
const levelRank = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
const catNameBySlugLevel = new Map();
for (const s of senses) {
  const slug = slugify(s.category);
  const key = `${slug}|${s.level}`;
  if (!catNameBySlugLevel.has(key)) catNameBySlugLevel.set(key, { slug, level: s.level, name: s.category, count: 0 });
  catNameBySlugLevel.get(key).count++;
}
const categories = [...catNameBySlugLevel.values()].sort((a, b) =>
  levelRank[a.level] - levelRank[b.level] || a.name.localeCompare(b.name));
const catIdByKey = new Map(categories.map((c, i) => [`${c.slug}|${c.level}`, i + 1]));
// re-key: senses belong to category by slug+level
for (const s of senses) s.cat_id = catIdByKey.get(`${slugify(s.category)}|${s.level}`);

senses.sort((a, b) => levelRank[a.level] - levelRank[b.level] || a.cat_id - b.cat_id || 0);
// stable word ordering inside category: alphabetical by word, then original order fallback
senses.forEach((s, i) => (s.sort = i + 1));
{
  // assign sort within category: alphabetical words then sense order
  const byCat = new Map();
  for (const s of senses) {
    if (!byCat.has(s.cat_id)) byCat.set(s.cat_id, []);
    byCat.get(s.cat_id).push(s);
  }
  let running = 0;
  for (const [catId, list] of byCat) {
    list.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
    for (const s of list) s.sort = ++running;
  }
}

// ── 2. grammar tagging ──────────────────────────────────────────────────────
let tagged = 0;
for (const s of senses) {
  s.rules = rulesForSense({ level: s.level, category: s.category, pos: s.pos, word: s.word });
  if (s.rules.length > 0) tagged++;
}
console.log(`grammar-tagged: ${tagged}/${senses.length}`);

// ── 2b. stable ids (used by seed + links + catalog) ─────────────────────────
senses.forEach((s, i) => (s.id = i + 1));

// ── 3. seed SQL ─────────────────────────────────────────────────────────────
const q = (s) => `'${String(s ?? "").replace(/'/g, "''")}'`;
const qi = (s) => (s == null ? "null" : q(s));

function valuesBlock(rows, cols) {
  return rows.map((r) => `  (${cols.map((c) => r[c]).join(", ")})`).join(",\n");
}

const catRows = categories.map((c, i) => ({
  id: i + 1, slug: q(c.slug), level: q(c.level), name: q(c.name),
  word_count: c.count,
}));

const ruleRows = GRAMMAR_RULES.map((r, i) => ({
  id: i + 1, code: q(r.code), level: q(r.level), title_en: q(r.title_en),
  title_ar: qi(r.title_ar), blurb: q(r.blurb), sort: i + 1,
}));
const ruleIdByCode = Object.fromEntries(GRAMMAR_RULES.map((r, i) => [r.code, i + 1]));

const senseRows = senses.map((s) => ({
  id: s.id, source_key: q(s.source_key), word: q(s.word), word_norm: q(s.word.toLowerCase()),
  pos: q(s.pos), level: q(s.level), category_id: s.cat_id,
  meaning: q(s.meaning), example: q(s.example), sort: s.sort,
}));

const links = new Set();
const linkRows = [];
for (const s of senses) {
  for (const code of s.rules) {
    const rid = ruleIdByCode[code];
    if (!rid) { console.error("  ! unknown rule code:", code); continue; }
    const key = `${s.id}:${rid}`;
    if (!links.has(key)) { links.add(key); linkRows.push({ sense_id: s.id, rule_id: rid }); }
  }
}

function emitSeed() {
  const parts = [];
  parts.push(`-- Generated by scripts/build-vocab.mjs — DO NOT EDIT BY HAND
-- Senses: ${senses.length} · Categories: ${categories.length} · Grammar rules: ${GRAMMAR_RULES.length} · Sense-rule links: ${linkRows.length}

begin;

delete from public.vocab_sense_grammar;
delete from public.vocab_senses;
delete from public.vocab_categories;
delete from public.vocab_grammar_rules;
`);

  // rules
  parts.push(`-- ── grammar rules (${ruleRows.length}) ──`);
  for (let i = 0; i < ruleRows.length; i += 200) {
    parts.push(`insert into public.vocab_grammar_rules (id, code, level, title_en, title_ar, blurb, sort) values
${valuesBlock(ruleRows.slice(i, i + 200), ["id", "code", "level", "title_en", "title_ar", "blurb", "sort"])}
on conflict (code) do nothing;`);
  }

  // categories
  parts.push(`\n-- ── categories (${catRows.length}) ──`);
  for (let i = 0; i < catRows.length; i += 100) {
    parts.push(`insert into public.vocab_categories (id, slug, level, name, word_count) values
${valuesBlock(catRows.slice(i, i + 100), ["id", "slug", "level", "name", "word_count"])}
on conflict (slug, level) do nothing;`);
  }

  // senses
  parts.push(`\n-- ── senses (${senseRows.length}) ──`);
  for (let i = 0; i < senseRows.length; i += 300) {
    parts.push(`insert into public.vocab_senses (id, source_key, word, word_norm, pos, level, category_id, meaning, example, sort) values
${valuesBlock(senseRows.slice(i, i + 300), ["id", "source_key", "word", "word_norm", "pos", "level", "category_id", "meaning", "example", "sort"])}
on conflict (source_key) do nothing;`);
  }

  // links
  parts.push(`\n-- ── sense ↔ grammar links (${linkRows.length}) ──`);
  for (let i = 0; i < linkRows.length; i += 500) {
    parts.push(`insert into public.vocab_sense_grammar (sense_id, rule_id) values
${valuesBlock(linkRows.slice(i, i + 500), ["sense_id", "rule_id"])}
on conflict (sense_id, rule_id) do nothing;`);
  }

  // fix sequences so future inserts work
  parts.push(`
select setval(pg_get_serial_sequence('public.vocab_categories','id'), (select max(id) from public.vocab_categories));
select setval(pg_get_serial_sequence('public.vocab_senses','id'),      (select max(id) from public.vocab_senses));
select setval(pg_get_serial_sequence('public.vocab_grammar_rules','id'),(select max(id) from public.vocab_grammar_rules));

commit;
`);
  return parts.join("\n");
}

// ── 4. frontend catalog JSON ────────────────────────────────────────────────
function emitCatalog() {
  const catById = new Map(categories.map((c, i) => [i + 1, c]));
  return {
    generated: new Date().toISOString(),
    source: "LanGeek A1–C1 thematic list (git 0981f50, normalized)",
    levels: LEVELS,
    counts: {
      senses: senses.length,
      categories: categories.length,
      grammarRules: GRAMMAR_RULES.length,
      links: linkRows.length,
    },
    categories: categories.map((c, i) => ({
      id: i + 1, slug: c.slug, level: c.level, name: c.name, wordCount: c.count,
      group: groupFor(c.name),
    })),
    senses: senses.map((s) => ({
      id: s.id,
      word: s.word,
      pos: s.pos,
      level: s.level,
      category: s.category,
      categorySlug: slugify(s.category),
      meaning: s.meaning,
      example: s.example,
      rules: s.rules,
    })),
  };
}

// ── 5. write outputs + report ───────────────────────────────────────────────
const dry = process.argv.includes("--dry");
if (dry) { console.log("(dry run — nothing written)"); }
else {
  mkdirSync("migrations", { recursive: true });
  mkdirSync("artifacts/venoxa/public/data", { recursive: true });
  mkdirSync("attached_assets", { recursive: true });

  const seed = emitSeed();
  writeFileSync("migrations/vocabulary-seed.sql", seed, "utf8");

  const catalog = emitCatalog();
  writeFileSync("artifacts/venoxa/public/data/vocab-catalog.json", JSON.stringify(catalog), "utf8");

  // normalized working set for the translation pipeline
  const normOut = {
    categories: categories.map((c, i) => ({ id: i + 1, slug: c.slug, level: c.level, name: c.name })),
    senses: senses.map((s) => ({
      id: s.id, source_key: s.source_key, word: s.word, pos: s.pos, level: s.level,
      category: s.category, meaning: s.meaning, example: s.example, rules: s.rules,
    })),
  };
  writeFileSync("attached_assets/vocab-normalized.json", JSON.stringify(normOut), "utf8");

  const byLevel = {};
  for (const s of senses) byLevel[s.level] = (byLevel[s.level] ?? 0) + 1;
  const taggedByLevel = {};
  for (const s of senses) if (s.rules.length) taggedByLevel[s.level] = (taggedByLevel[s.level] ?? 0) + 1;
  console.log("\n=== REPORT ===");
  console.log("senses:", senses.length, "by level:", JSON.stringify(byLevel));
  console.log("categories:", categories.length, "· grammar rules:", GRAMMAR_RULES.length, "· links:", linkRows.length);
  console.log("tagged by level:", JSON.stringify(taggedByLevel));
  console.log("seed sql bytes:", seed.length);
  console.log("catalog json bytes:", JSON.stringify(catalog).length);
}

export { senses, categories };
