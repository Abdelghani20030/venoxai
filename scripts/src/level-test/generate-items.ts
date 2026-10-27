// ─────────────────────────────────────────────────────────────────────────────
// generate-items.ts — Venoxa Level Test item bank generator.
//
// Generates ≥240 original CEFR-tagged items (40 per level: grammar 14, vocab 8,
// reading 12 (4 passages × 3), listening 6) using OpenRouter, then validates
// every item automatically:
//   1. strict JSON schema / exactly 4 distinct options / one correct index
//   2. pass-1 requires the model to justify the correct answer
//   3. pass-2 independently re-answers the item (fresh context, no key shown)
//      and mismatches are dropped
//   4. duplicate stems rejected (normalized)
//   5. reading passages / listening scripts must meet CEFR word-count bands
//   6. distractors must be "plausible but wrong" (prompted + structural checks)
// by listening items is pre-generated with the existing Edge TTS stack
// (edge-ws.ts) unless --skip-audio.
//
// Outputs (written next to this workspace's scripts/ folder):
//   scripts/level-test-items.json   full bank + per-item justification (for human review)
//   scripts/level-test-seed.sql     INSERTs for lt_items (drafted, reviewed=false)
//   scripts/level-test-audio/<id>.mp3   listening audio (seeded separately into DB)
//
// Usage:
//   pnpm --filter @workspace/scripts exec tsx src/level-test/generate-items.ts [--skip-audio] [--skip-gen]
//
// Env:
//   OPENROUTER_API_KEYY   (required — note the intentional double Y)
//   LEVEL_TEST_GEN_MODEL  optional, default "google/gemini-2.5-flash"
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  CEFR_SEED_B,
  type CefrLevel, type ItemType,
} from "../../../artifacts/api-server/src/lib/level-test-engine";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const TYPES: ItemType[] = ["grammar", "vocab", "reading", "listening"];
// 40/level: 35% grammar / 20% vocab / 30% reading / 15% listening
const TARGET: Record<ItemType, number> = { grammar: 14, vocab: 8, reading: 12, listening: 6 };

const MODEL = (process.env.LEVEL_TEST_GEN_MODEL || "google/gemini-2.5-flash").trim();
const KEY = (process.env.OPENROUTER_API_KEYY || "").trim();

const SKIP_AUDIO = process.argv.includes("--skip-audio");
const SKIP_GEN = process.argv.includes("--skip-gen");

const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const AUDIO_DIR = path.join(SCRIPTS_DIR, "level-test-audio");
const JSON_OUT = path.join(SCRIPTS_DIR, "level-test-items.json");
const SQL_OUT = path.join(SCRIPTS_DIR, "level-test-seed.sql");

// CEFR word-count bands (validated hard)
const READING_WORDS: Record<CefrLevel, [number, number]> = {
  A1: [55, 85], A2: [75, 105], B1: [95, 130], B2: [115, 150], C1: [135, 170], C2: [155, 185],
};
// ≈2.5 words/sec → 15–45 s
const LISTEN_WORDS: Record<CefrLevel, [number, number]> = {
  A1: [45, 60], A2: [55, 75], B1: [70, 90], B2: [80, 100], C1: [95, 115], C2: [100, 120],
};

const TOPICS = ["daily routines", "at school", "travel", "jobs and work", "technology and phones",
  "friends and family", "food and health", "sports", "shopping", "hobbies", "city life",
  "environment", "music and movies", "moving house", "planning a party", "medieval history"];

const CEFR_DESC: Record<CefrLevel, string> = {
  A1: "very basic (can understand/fuse simple everyday phrases about self and immediate surroundings)",
  A2: "elementary (can understand sentences and frequent expressions on familiar matters, simple routine communication)",
  B1: "intermediate (can understand the main points of clear standard input on familiar matters, simple connected text)",
  B2: "upper intermediate (can understand the main ideas of complex text on both concrete and abstract topics, natural interaction)",
  C1: "advanced (can understand demanding, longer texts, implicit meaning, flexible effective use)",
  C2: "near-native (can understand virtually everything read or heard, summarize, express fluently with nuance)",
};

// ── tiny helpers ─────────────────────────────────────────────────────────────
const words = (s: string) => (s.match(/[A-Za-z']+/g) || []).length;
const normStem = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function hashId(prefix: string, salt: string): string {
  return `${prefix}_${createHash("sha1").update(salt).digest("hex").slice(0, 16)}`;
}

async function pMap<T, R>(items: T[], fn: (x: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

// ── OpenRouter call (plain fetch, retries on 429/5xx/timeout) ────────────────
async function orChat(messages: Array<{ role: string; content: string }>, opts: { temperature?: number; maxTokens?: number; tries?: number } = {}): Promise<string> {
  const tries = opts.tries ?? 6;
  let waitMs = 4000;
  for (let attempt = 1; attempt <= tries; attempt++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 150_000);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 2000,
        }),
        signal: ctl.signal,
      });
      clearTimeout(t);
      if (res.status === 429 || res.status >= 500) {
        console.log(`  [${attempt}/${tries}] ${MODEL} → ${res.status}; waiting ${(waitMs / 1000).toFixed(0)}s`);
        await sleep(waitMs + Math.random() * 3000);
        waitMs = Math.min(waitMs * 1.7, 70_000);
        continue;
      }
      if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = j.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("empty completion");
      return content;
    } catch (e) {
      clearTimeout(t);
      if (attempt === tries) throw e;
      console.log(`  [${attempt}/${tries}] ${e instanceof Error ? e.message.slice(0, 110) : e}; retrying in ${(waitMs / 1000).toFixed(0)}s`);
      await sleep(waitMs);
      waitMs = Math.min(waitMs * 1.7, 70_000);
    }
  }
  throw new Error("unreachable");
}

/** Robust JSON extraction: strips code fences, slices first balanced bracket. */
function extractJson(text: string): unknown {
  let t = text.trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const first = t.search(/[{[]/);
  if (first < 0) throw new Error(`no JSON found in: ${text.slice(0, 80)}`);
  t = t.slice(first);
  const open = t[0];
  const close = open === "{" ? "}" : "]";
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') inStr = !inStr;
    else if (!inStr) {
      if (c === open) depth++;
      else if (c === close && --depth === 0) { end = i; break; }
    }
  }
  if (end < 0) throw new Error("unbalanced JSON");
  return JSON.parse(t.slice(0, end + 1));
}

// ── prompts ──────────────────────────────────────────────────────────────────
const SYSTEM = `You are an expert Cambridge-style English test developer building an ORIGINAL, non-copyrighted placement bank (do NOT quote or copy items from EF SET, IELTS, TOEFL, Cambridge or any known test). Output ONLY valid JSON — no commentary, no markdown fences.`;

function grammarPrompt(level: CefrLevel, n: number, topic: string): string {
  return `Write ${n} ORIGINAL grammar cloze MCQ items for CEFR ${level} learners (target: ${CEFR_DESC[level]}).
Rules:
- stem: a single natural sentence containing exactly the literal blank "___" (one blank only).
- exactly 4 options, each a short answer fitting the blank; grammatically it must be clear only ONE is defensibly correct.
- 3 distractors must be plausible-looking (same word family/shape, common confusions: prepositions, tense, articles, comparatives, quantifiers) but objectively wrong in this sentence.
- topic orbit: "${topic}". Keep vocabulary at ${level} level or simpler.
- For each item include "key": one short sentence justifying why the correct option is right and why the best distractor is wrong.
Return a JSON array of ${n} objects: {"stem": string, "options": [string,string,string,string], "correct_index": 0|1|2|3, "key": string}`;
}

function vocabPrompt(level: CefrLevel, n: number, topic: string): string {
  return `Write ${n} ORIGINAL vocabulary "meaning in context" MCQ items for CEFR ${level} learners (target: ${CEFR_DESC[level]}).
Rules:
- stem: one sentence (10–20 words at ${level} vocabulary) containing a target word or phrase; END the stem with a question — don't bold or bracket the word.
- exactly 4 options; one is the correct meaning of the target word in THIS sentence, three are plausible but wrong (near-synonyms in other senses, similar-sounding words, wrong register).
- topic orbit: "${topic}".
- Include "key": one short justification.
Return a JSON array of ${n} objects: {"stem": string, "options": [...4 strings], "correct_index": 0|1|2|3, "key": string}`;
}

function passagePrompt(level: CefrLevel, topic: string, num: number): string {
  const [lo, hi] = READING_WORDS[level];
  return `Write ${num} ORIGINAL reading passages for CEFR ${level} learners (target: ${CEFR_DESC[level]}).
Rules per passage:
- 3rd-person expository text; tone friendly and neutral; topic orbit "${topic}" (make the passages distinct from each other).
- Length: ${lo}–${hi} words (hard requirement). Natural paragraphs (1–3).
- Vocabulary and grammar must sit at ${level} level — a ${level} learner understands it with minimal effort.
- No list, no headers, no title, plain prose only.
Return a JSON array of ${num} strings (just the passage texts).`;
}

function readingQuestionsPrompt(level: CefrLevel, passage: string, n: number): string {
  return `Here is a reading passage at CEFR ${level}:

"""
${passage}
"""

Write ${n} ORIGINAL four-option comprehension MCQs about it (${level} level). Mix these skills across questions: literal detail, main idea / gist, vocabulary-in-context, or simple inference.
- stem must be answerable ONLY from the passage (not general knowledge).
- exactly 4 options; one defensibly correct; three plausible but wrong. Do NOT mention the other questions.
- Include "key": short justification citing the passage.
Return a JSON array of ${n} objects: {"stem": string, "options": [4 strings], "correct_index": 0|1|2|3, "key": string}`;
}

function listeningPrompt(level: CefrLevel, topic: string): string {
  const [lo, hi] = LISTEN_WORDS[level];
  return `Write ONE ORIGINAL listening script + question for CEFR ${level} learners (target: ${CEFR_DESC[level]}).
Rules:
- script: a natural short monologue or 2–4-turn dialogue about "${topic}"; set a concrete scene (names ok: Sam, Maria, etc.).
- script length ${lo}–${hi} words (hard requirement; ~${Math.round((lo + hi) / 2 / 2.5)} seconds of speech). ${level === "A1" || level === "A2" ? "Strictly simple ${level} vocabulary and grammar, short sentences." : "Vocabulary/grammar at ${level} complexity."}
- ONE four-option question testing main idea or key detail (answerable from audio alone, words in options not copied verbatim from the script).
- exactly 4 options, one defensibly correct, three plausible but wrong.
Return ONE JSON object: {"script": string, "stem": string, "options": [4 strings], "correct_index": 0|1|2|3, "key": string}`;
}

// ── structural validation ────────────────────────────────────────────────────
export function structError(stem: unknown, options: unknown, ci: unknown, needCloze: boolean, type: ItemType): string | null {
  if (typeof stem !== "string" || stem.trim().length < 12) return "stem too short";
  if (/\b___\b/.test(stem) !== (type === "grammar")) return type === "grammar" ? "grammar stem must contain ___" : "non-grammar stem contains ___";
  if (!Array.isArray(options) || options.length !== 4) return "options must be exactly 4";
  const opts = options.map(o => String(o ?? "").trim());
  if (opts.some(o => !o)) return "empty option";
  if (new Set(opts.map(o => o.toLowerCase())).size !== 4) return "duplicate options";
  if (typeof ci !== "number" || !Number.isInteger(ci) || ci < 0 || ci > 3) return "bad correct_index";
  return null;
}

// ── pass 2: independent blind solve ──────────────────────────────────────────
const SOLVER_SYSTEM = `You are a careful English test-taker solving a placement question. Use only the information shown. Answer ONLY with valid JSON.`;

async function blindSolve(item: { stem: string; options: string[]; passage?: string; level: CefrLevel }): Promise<number | null> {
  const lines = [
    item.passage ? `Passage:\n"""${item.passage}"""\n` : "",
    `Question: ${item.stem}`,
    ...item.options.map((o, i) => `${"ABCD"[i]}. ${o}`),
    `\nChoose the single best answer (0=A,1=B,2=C,3=D).`,
  ];
  try {
    const text = await orChat([
      { role: "system", content: SOLVER_SYSTEM },
      { role: "user", content: lines.join("\n") + `\nReturn EXACTLY: {"answer": <0-3>}` },
    ], { temperature: 0, maxTokens: 400 });
    const j = extractJson(text) as { answer?: unknown };
    const a = typeof j?.answer === "number" ? j.answer : typeof j?.answer === "string" && /^[0-3]$/.test(j.answer) ? Number(j.answer) : null;
    return a !== null && a >= 0 && a <= 3 ? a : null;
  } catch (e) {
    console.log(`    solver error: ${e instanceof Error ? e.message.slice(0, 80) : e} → counting as mismatch-safe (drop)`);
    return null;
  }
}

// ── bank assembly ────────────────────────────────────────────────────────────
export interface BankItem {
  id: string;
  type: ItemType;
  cefr_tag: CefrLevel;
  difficulty_b: number;
  stem: string;
  options: string[];
  correct_index: number;
  passage_text: string | null;
  audio_script: string | null;
  key: string;           // pass-1 justification (NOT written to DB)
  solved: string;        // pass-2 reviewer model note (NOT written to DB)
  audio_ready: boolean;  // listening only
}

let rndSeed = 0x1b17;
function rnd(): number { rndSeed = (rndSeed * 1664525 + 1013904223) >>> 0; return rndSeed / 4294967296; }

const seenStems = new Set<string>();
const stats = { dups: 0, structural: 0, solveMismatch: 0, bandRejected: 0 };

function difficultyFor(level: CefrLevel): number {
  return Math.round((CEFR_SEED_B[level] + (rnd() - 0.5) * 1.0) * 1000) / 1000;
}

export function acceptItem(type: ItemType, level: CefrLevel, stem: string, options: string[], ci: number, extra: { passage?: string; script?: string; key: string; solved: string }): BankItem | null {
  const err = structError(stem, options, ci, type === "grammar", type);
  if (err) { stats.structural++; console.log(`    ✗ structural: ${err}`); return null; }
  const n = normStem(stem);
  if (seenStems.has(n)) { stats.dups++; console.log(`    ✗ duplicate stem (dropped)`); return null; }
  seenStems.add(n);
  const id = hashId(`lt_${type[0]}${level.toLowerCase()}`, `${type}|${level}|${stem}`);
  return {
    id, type, cefr_tag: level,
    difficulty_b: difficultyFor(level),
    stem: stem.trim(), options: options.map(o => o.trim()), correct_index: ci,
    passage_text: extra.passage ?? null,
    audio_script: extra.script ?? null,
    key: extra.key, solved: extra.solved,
    audio_ready: false,
  };
}

// generate until `need` accepted items produced for a (type, level) lane
async function genLane(type: Exclude<ItemType, "reading">, level: CefrLevel, need: number, laneTag: string): Promise<BankItem[]> {
  const got: BankItem[] = [];
  let batch = 0;
  while (got.length < need && batch < 12) {
    batch++;
    const topic = TOPICS[(LEVELS.indexOf(level) * 4 + TYPES.indexOf(type) + batch * 3 + laneTag.length) % TOPICS.length];
    const n = Math.min(5, need - got.length + 2);
    const prompt = type === "grammar" ? grammarPrompt(level, n, topic) : type === "vocab" ? vocabPrompt(level, n, topic) : listeningPrompt(level, topic);
    let candidates: Array<any> = [];
    try {
      const raw = await orChat([{ role: "system", content: SYSTEM }, { role: "user", content: prompt }], { temperature: 0.8 });
      const j = extractJson(raw);
      candidates = Array.isArray(j) ? j : [j];
    } catch (e) {
      console.log(`    gen error: ${e instanceof Error ? e.message.slice(0, 90) : e}`);
      continue;
    }
    for (const c of candidates) {
      if (got.length >= need) break;
      const stem = c?.stem, options = c?.options, ci = c?.correct_index;
      if (structError(stem, options, ci, type === "grammar", type)) { stats.structural++; continue; }
      const nstem = normStem(stem);
      if (seenStems.has(nstem)) { stats.dups++; continue; }
      seenStems.add(nstem);
      if (type === "listening") {
        const [lo, hi] = LISTEN_WORDS[level];
        const wc = words(String(c.script || ""));
        if (wc < lo || wc > hi) { stats.bandRejected++; console.log(`    ✗ listening script ${wc} words (want ${lo}–${hi})`); continue; }
      }
      // pass 2: independent blind solve
      const pass = type === "listening" ? String(c.script) : undefined;
      const ans = await blindSolve({ stem, options: options.map(String), passage: pass, level });
      const ok = ans === ci && ans !== null;
      if (!ok) { stats.solveMismatch++; console.log(`    ✗ pass-2 mismatch (model picked ${ans}, key ${ci})`); continue; }
      const item = acceptItem(type, level, stem, options.map(String), ci, {
        script: type === "listening" ? String(c.script).trim() : undefined,
        key: String(c.key || ""), solved: `solved-model-${MODEL}`,
      });
      if (item) got.push(item);
    }
    console.log(`  [${type}/${level}] batch ${batch}: have ${got.length}/${need}`);
  }
  return got;
}

async function genReading(level: CefrLevel, need: number): Promise<BankItem[]> {
  const [lo, hi] = READING_WORDS[level];
  let passages: string[] = [];
  for (let attempt = 0; attempt < 8 && passages.length < 5; attempt++) {
    const topic = TOPICS[(LEVELS.indexOf(level) * 5 + 2 + attempt) % TOPICS.length];
    try {
      const raw = await orChat([
        { role: "system", content: SYSTEM },
        { role: "user", content: passagePrompt(level, topic, 5 - passages.length) },
      ], { temperature: 0.75, maxTokens: 3000 });
      const j = extractJson(raw);
      if (!Array.isArray(j)) continue;
      for (const p of j) {
        const txt = String(p || "").trim();
        const wc = words(txt);
        if (wc >= lo && wc <= hi) { passages.push(txt); console.log(`  [reading/${level}] passage ok (${wc}w)`); }
        else { stats.bandRejected++; console.log(`  ✗ passage ${wc}w (want ${lo}–${hi})`); }
        if (passages.length >= 5) break;
      }
    } catch (e) {
      console.log(`  passage gen error: ${e instanceof Error ? e.message.slice(0, 90) : e}`);
    }
  }
  // pass 2 level check on passages (independent judge)
  passages = await pMap(passages, async (p) => {
    try {
      const raw = await orChat([
        { role: "system", content: SYSTEM },
        { role: "user", content: `Judge whether this passage is appropriate difficulty and length for CEFR ${level} reading. Reply EXACTLY {"ok": true|false, "note": "..."}.\n\n"""${p}"""` },
      ], { temperature: 0, maxTokens: 400 });
      const jj = extractJson(raw) as { ok?: boolean };
      if (jj.ok === false) { stats.bandRejected++; console.log(`  ✗ passage judged off-level → dropped`); return null; }
      return p;
    } catch { return p; } // judge failed: keep passage (word-count already enforced)
  }, 2).then(arr => arr.filter((x): x is string => x !== null));

  // questions: up to 3 per passage, generated concurrently, trimmed to `need`
  const qTasks = passages.map((p, k) => ({ p, k }));
  const itemsLists = await pMap(qTasks, async ({ p, k }) => {
    const out: BankItem[] = [];
    const list: Array<any> = [];
    try {
      const raw = await orChat([
        { role: "system", content: SYSTEM },
        { role: "user", content: readingQuestionsPrompt(level, p, 3) },
      ], { temperature: 0.7 });
      const j = extractJson(raw);
      if (Array.isArray(j)) list.push(...j);
    } catch (e) {
      console.log(`  [reading/${level}] question gen error: ${e instanceof Error ? e.message.slice(0, 90) : e}`);
      return out;
    }
    for (const c of list) {
      if (out.length >= 3) break;
      const stem = c?.stem, options = c?.options, ci = c?.correct_index;
      if (structError(stem, options, ci, false, "reading")) { stats.structural++; console.log(`  ✗ reading q structural`); continue; }
      const nstem = normStem(stem);
      if (seenStems.has(nstem)) { stats.dups++; continue; }
      seenStems.add(nstem);
      const ans = await blindSolve({ stem, options: options.map(String), passage: p, level });
      if (ans !== ci || ans === null) { stats.solveMismatch++; console.log(`  ✗ reading pass-2 mismatch (${ans} vs ${ci})`); continue; }
      const item = acceptItem("reading", level, stem, options.map(String), ci, {
        passage: p, key: String(c.key || ""), solved: `solved-model-${MODEL}`,
      });
      if (item) out.push(item);
    }
    console.log(`  [reading/${level}] passage ${k + 1}: +${out.length}`);
    return out;
  }, 3);
  const acc = itemsLists.flat();
  if (acc.length > need) acc.length = need;
  const got = acc;
  if (got.length < need) console.log(`  ! [reading/${level}] ended with ${got.length}/${need}`);
  return got;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!KEY) {
    console.error("OPENROUTER_API_KEYY is not set (double Y, intentional). Aborting before any calls.");
    process.exit(1);
  }
  console.log(`model: ${MODEL} · audio: ${SKIP_AUDIO ? "skipped" : "enabled"} · out: ${path.basename(SCRIPTS_DIR)}`);

  let items: BankItem[] = [];
  if (!SKIP_GEN) {
    for (const level of LEVELS) {
      console.log(`\n══ CEFR ${level} ${"═".repeat(30)}`);
      const lanes = await Promise.all([
        genLane("grammar", level, TARGET.grammar, level),
        genLane("vocab", level, TARGET.vocab, level),
        genReading(level, TARGET.reading),
        genLane("listening", level, TARGET.listening, level),
      ]);
      const batch = lanes.flat();
      console.log(`  ${level}: ${batch.length} items (grammar ${batch.filter(b => b.type === "grammar").length}, vocab ${batch.filter(b => b.type === "vocab").length}, reading ${batch.filter(b => b.type === "reading").length}, listening ${batch.filter(b => b.type === "listening").length})`);
      items.push(...batch);
    }
    console.log(`\nstats: dups=${stats.dups} structural=${stats.structural} solveMismatch=${stats.solveMismatch} bandRejected=${stats.bandRejected}`);
  } else {
    const j = JSON.parse(readFileSync(JSON_OUT, "utf8"));
    items = j.items as BankItem[];
    for (const it of items) seenStems.add(normStem(it.stem));
  }

  // ── audio (Edge TTS via the app's existing stack) ──
  if (!SKIP_AUDIO) {
    const listening = items.filter(i => i.type === "listening" && !i.audio_ready);
    if (listening.length) {
      mkdirSync(AUDIO_DIR, { recursive: true });
      try {
        const { edgeSynthesizeMp3 } = await import("../../../artifacts/api-server/src/routes/edge-ws");
        const voices = ["en-US-AriaNeural", "en-US-GuyNeural", "en-GB-SoniaNeural", "en-US-JennyNeural", "en-US-ChristopherNeural", "en-GB-RyanNeural", "en-AU-NatashaNeural", "en-US-EricNeural"];
        let ok = 0;
        await pMap(listening, async (it) => {
          const fp = path.join(AUDIO_DIR, `${it.id}.mp3`);
          if (existsSync(fp)) { it.audio_ready = true; return; }
          try {
            const v = parseInt(hashId("v", it.id).slice(3, 9), 16) % voices.length;
            const buf = await edgeSynthesizeMp3(voices[v], it.audio_script || it.stem, 25_000);
            if (buf.length < 4000) throw new Error(`suspiciously small mp3 (${buf.length}B)`);
            writeFileSync(fp, buf);
            it.audio_ready = true; ok++;
          } catch (e) {
            console.log(`  audio ${it.id}: ${e instanceof Error ? e.message.slice(0, 80) : e} — will retry on next run`);
          }
        }, 2);
        console.log(`audio: ${ok}/${listening.length} synthesized → ${AUDIO_DIR}`);
      } catch (e) {
        console.log(`TTS unavailable (${e instanceof Error ? e.message.slice(0, 90) : e}) — rerun later with --skip-gen to finish audio.`);
      }
    }
  }

  // ── outputs ──
  const meta = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    totals: Object.fromEntries(TYPES.map(t => [t, items.filter(i => i.type === t).length])),
    perLevel: Object.fromEntries(LEVELS.map(l => [l, items.filter(i => i.cefr_tag === l).length])),
    validationStats: stats,
  };
  writeFileSync(JSON_OUT, JSON.stringify({ meta, items }, null, 2));
  console.log(`\nwrote ${JSON_OUT} (${items.length} items)`);

  writeFileSync(SQL_OUT, buildSql(items));
  console.log(`wrote ${SQL_OUT}`);
}

// ── SQL builder (drafted status; teacher review required) ────────────────────
function sqlLit(s: string): string {
  return `'` + s.replace(/^\uFEFF/, "").replace(/'/g, "''") + `'`;
}
export function buildSql(items: BankItem[]): string {
  const head = `-- ═══════════════════════════════════════════════════════════════════════════
--  level-test-seed.sql — generated item bank (AUTO-GENERATED, DO NOT EDIT)
--  Run AFTER level-test-schema.sql, in the Supabase SQL editor.
--  All rows are source='ai', reviewed=false, status='draft' by design:
--  prod tests only serve active/reviewed rows, or drafts when LT_ALLOW_DRAFT=1.
-- ═══════════════════════════════════════════════════════════════════════════
`;
  const rows = items.map(i => {
    const opts = sqlLit(JSON.stringify(i.options));
    return `INSERT INTO lt_items (id, type, cefr_tag, difficulty_b, stem, options, correct_index, passage_text, audio_script, source, reviewed, status, times_shown, times_correct)
VALUES (${sqlLit(i.id)}, ${sqlLit(i.type)}, ${sqlLit(i.cefr_tag)}, ${i.difficulty_b}, ${sqlLit(i.stem)}, ${opts}, ${i.correct_index}, ${i.passage_text ? sqlLit(i.passage_text) : "NULL"}, ${i.audio_script ? sqlLit(i.audio_script) : "NULL"}, 'ai', false, 'draft', 0, 0)
ON CONFLICT (id) DO NOTHING;`;
  });
  return head + rows.join("\n") + `\n`;
}

// Run only when executed directly (not when the module is imported by tests).
if (process.argv[1]) {
  const { pathToFileURL } = await import("node:url");
  const isMain = pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
  if (isMain) main().catch(e => { console.error("GENERATION FAILED:", e instanceof Error ? e.stack : e); process.exit(1); });
}

