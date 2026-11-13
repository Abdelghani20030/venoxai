// scripts/attach-path-vocab.mjs — attach classified A1 vocabulary to the A1 path lessons.
//
// For every A1 lesson: map its topic → vocab_categories (A1), pick words from
// vocab_senses (ordered, deduped across lessons), add Arabic meanings matched
// from the bundled global list (which already carries Arabic), then
//   1. rewrite the lesson's vocab step items as [{term, ar}]   (what LessonPlayer renders)
//   2. fill path_lesson_vocab (lesson_id, sense_id, order)     (relational join for future UI)
//
// Idempotent: re-running recomputes and overwrites. Assessment/check lessons
// are skipped. Usage:  node scripts/attach-path-vocab.mjs [--dry]
import { readFileSync } from "fs";
import pg from "pg";

const DRY = process.argv.includes("--dry");

// ── 1. Arabic meanings from the bundled global list ─────────────────────────
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
const globalText = readFileSync("artifacts/venoxa/public/data/global.csv", "utf8");
const arByWord = new Map(); // word_norm → Arabic meaning
for (const l of globalText.split(/\r?\n/).slice(1)) {
  if (!l.trim()) continue;
  const r = parseCSVLine(l);
  const en = (r[0] || "").replace(/^"|"$/g, "").toLowerCase().trim();
  const ar = (r[3] || "").replace(/^"|"$/g, "").trim();
  if (en && ar && /[\u0600-\u06FF]/.test(ar) && !arByWord.has(en)) arByWord.set(en, ar);
}
console.log("global list Arabic meanings loaded:", arByWord.size);

// ── 2. lesson → categories mapping (covers all 32 A1 categories) ────────────
// [lesson order_index, category names, cap]
const MAP = [
  [1,  ["Basic Verbs"], 12],                                  // alphabet: short everyday verbs
  [2,  ["Adverbs and Pronouns"], 15],                          // pronouns lesson
  [3,  ["Opposite Adjectives", "Describing People"], 18],      // be + adjectives
  [4,  ["Personal Information", "Countries and Nationalities"], 20],
  [5,  ["Hello and Goodbye"], 14],                             // recap: greetings
  [7,  ["Household Items"], 18],                               // articles + countable nouns
  [8,  ["Animals", "The Body"], 20],                           // plurals with countable nouns
  [9,  ["The Head and Face", "Directions and Continents"], 18], // hello & goodbye dialogues
  [10, ["Numbers 0 to 100"], 20],
  [11, ["City", "Transportation"], 18],                        // first words around town
  [13, ["Colors", "Clothes and Shoes"], 20],
  [14, ["Family", "People"], 20],
  [15, ["Food and Drinks", "Food and Ingredients"], 20],
  [16, ["Furniture and Home Appliances"], 12],                 // turn on → appliances
  [17, ["School", "Free Time Activities"], 20],                // everyday life recap
  [19, ["Useful Verbs"], 15],                                  // present simple
  [20, ["Simple Verbs"], 15],                                  // do/does questions
  [21, ["Prepositions and Determiners"], 14],
  [22, ["House and Apartment"], 15],                           // have/has → home
  [23, ["Months and Seasons"], 12],                            // grammar recap
  [25, ["Time and Date"], 14],                                 // daily routine + time
  [28, ["The Weather and Nature"], 16],
];
const SKIP_LESSONS = new Set([6, 12, 18, 24, 26, 29]); // checks + dedicated phrasal lesson keeps its own items

// ── 3. DB ───────────────────────────────────────────────────────────────────
const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const client = new pg.Client({ connectionString: url });
await client.connect();

const lessons = (await client.query(
  `select id, order_index, title, steps from public.path_lessons
   where level_code = 'A1' order by order_index`
)).rows;
const cats = (await client.query(
  `select id, name from public.vocab_categories where level = 'A1'`
)).rows;
const senses = (await client.query(
  `select id, word, word_norm, category_id, sort from public.vocab_senses
   where level = 'A1' order by sort`
)).rows;
const catNameById = new Map(cats.map((c) => [c.id, c.name]));
const sensesByCat = new Map();
for (const s of senses) {
  if (!sensesByCat.has(s.category_id)) sensesByCat.set(s.category_id, []);
  sensesByCat.get(s.category_id).push(s);
}

// ── 4. assign words to lessons ──────────────────────────────────────────────
const usedWords = new Set(); // no word taught twice across A1
const plan = [];             // {lesson, items:[{sense, term, ar}]}
const coverage = new Set();  // category ids touched

for (const [order, catNames, cap] of MAP) {
  const lesson = lessons.find((l) => l.order_index === order);
  if (!lesson) { console.error(`! no A1 lesson with order_index ${order}`); continue; }
  const items = [];
  for (const catName of catNames) {
    const cat = cats.find((c) => c.name === catName);
    if (!cat) { console.error(`! unknown A1 category "${catName}"`); continue; }
    coverage.add(cat.id);
    for (const s of sensesByCat.get(cat.id) ?? []) {
      if (items.length >= cap) break;
      if (usedWords.has(s.word_norm)) continue;
      usedWords.add(s.word_norm);
      items.push({ sense: s, term: s.word, ar: arByWord.get(s.word_norm) ?? "" });
    }
  }
  plan.push({ lesson, items });
}

// ── 5. apply: steps JSONB + path_lesson_vocab ───────────────────────────────
let updatedSteps = 0, insertedLinks = 0;
if (!DRY) await client.query("begin");
for (const { lesson, items } of plan) {
  if (items.length === 0) continue;
  if (!DRY) {
    // 5a. rewrite the vocab step's items (keep every other step untouched)
    const steps = lesson.steps ?? [];
    let touched = false;
    for (const s of steps) {
      if (s.type === "vocab") {
        s.items = items.map((it) => ({ term: it.term, ar: it.ar }));
        touched = true;
      }
    }
    if (touched) {
      await client.query(`update public.path_lessons set steps = $1::jsonb where id = $2`, [JSON.stringify(steps), lesson.id]);
      updatedSteps++;
    }
    // 5b. relational join
    await client.query(`delete from public.path_lesson_vocab where lesson_id = $1`, [lesson.id]);
    for (let i = 0; i < items.length; i++) {
      await client.query(
        `insert into public.path_lesson_vocab (lesson_id, sense_id, order_in_lesson) values ($1, $2, $3)
         on conflict (lesson_id, sense_id) do nothing`,
        [lesson.id, items[i].sense.id, i]
      );
      insertedLinks++;
    }
  }
  const arN = items.filter((i) => i.ar).length;
  console.log(`  L${String(lesson.order_index).padStart(2)} "${lesson.title}" → ${items.length} words (${arN} with Arabic): ${items.slice(0, 5).map((i) => i.term).join(", ")}${items.length > 5 ? "…" : ""}`);
}
if (!DRY) await client.query("commit");

console.log(`\n${DRY ? "(dry) " : ""}lessons updated: ${updatedSteps} · vocab links: ${insertedLinks} · unique words: ${usedWords.size}/608 A1 senses · categories covered: ${coverage.size}/32`);
await client.end();
