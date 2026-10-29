/**
 * Venoxa Level Test — item-bank generator (run manually).
 *
 * Generates original CEFR-tagged items with OpenRouter, validates them in two
 * passes, deduplicates, and writes:
 *   scripts/output/level-test-items.json
 *   migrations/level-test-seed.sql
 *   docs/level-test/item-bank-report.md
 *
 * Nothing is written to the database. Review the report, run the migration,
 * then run the seed SQL yourself.
 *
 * Usage:
 *   node scripts/level-test-generate-items.ts
 *   node scripts/level-test-generate-items.ts --levels=A1,B1 --types=grammar --target=2
 *   node scripts/level-test-generate-items.ts --levels=B2,C1,C2 --merge
 *     (append new items to the existing bank instead of replacing it)
 *   node scripts/level-test-generate-items.ts --from-json=scripts/output/level-test-items.json
 *     (rewrites passage_order + seed SQL/report from an existing bank, no API calls)
 *
 * Env:
 *   LEVEL_TEST_GEN_PROVIDER  openrouter (default) | gemini | deepseek | groq
 *   OPENROUTER_API_KEY (or OPENROUTER_API_KEYY)  — required for OpenRouter
 *   GEMINI_API_KEY / DEEPSEEK_API_KEY / GROQ_API_KEY — required for those providers
 *   LEVEL_TEST_GEN_MODEL      model id for the selected provider
 *   LEVEL_TEST_GEN_CONCURRENCY default 2
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  CEFR_LEVELS,
  SEED_DIFFICULTY,
  isCefrLevel,
  isItemType,
  type CefrLevel,
  type ItemType,
} from '../lib/level-test-engine.ts';

/* ── configuration ───────────────────────────────────────────────────────── */

type Provider = 'openrouter' | 'gemini' | 'deepseek' | 'groq';

const PROVIDER = (process.env.LEVEL_TEST_GEN_PROVIDER ?? 'openrouter').trim().toLowerCase() as Provider;

const PROVIDER_CONFIG: Record<Provider, { key: string; baseUrl: string; model: string }> = {
  openrouter: {
    key: (process.env.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEYY ?? '').trim(),
    baseUrl: (process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    model: 'google/gemini-2.5-pro',
  },
  gemini: {
    key: (process.env.GEMINI_API_KEY ?? '').trim(),
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-3.8-flash',
  },
  deepseek: {
    key: (process.env.DEEPSEEK_API_KEY ?? '').trim(),
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-flash',
  },
  groq: {
    key: (process.env.GROQ_API_KEY ?? '').trim(),
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-120b',
  },
};

if (!(PROVIDER in PROVIDER_CONFIG)) {
  throw new Error(`Unknown LEVEL_TEST_GEN_PROVIDER="${PROVIDER}" (use openrouter, gemini, deepseek, or groq)`);
}

const API_KEY = PROVIDER_CONFIG[PROVIDER].key;
const MODEL = (process.env.LEVEL_TEST_GEN_MODEL ?? PROVIDER_CONFIG[PROVIDER].model).trim();
const BASE_URL = PROVIDER_CONFIG[PROVIDER].baseUrl;
const CONCURRENCY = Math.max(1, Number(process.env.LEVEL_TEST_GEN_CONCURRENCY ?? 2));
const REQUEST_TIMEOUT_MS = 180_000;

const TYPE_TARGETS: Record<ItemType, number> = {
  grammar: 14,
  vocab: 8,
  reading: 12, // 4 passages x 3 questions
  listening: 6,
};
const READING_PASSAGE_TARGET = 4;

interface CliOptions {
  levels: CefrLevel[];
  types: ItemType[];
  targetOverride: number | null;
  verify: boolean;
  out: string;
  sql: string;
  report: string;
  /** When set, skip generation and only rewrite the SQL/report from this bank. */
  fromJson: string | null;
  /** Keep the existing output bank and append newly generated items. */
  merge: boolean;
  /** With --merge, generate only the missing items per level/type. */
  topUp: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    levels: [...CEFR_LEVELS],
    types: ['grammar', 'vocab', 'reading', 'listening'],
    targetOverride: null,
    verify: true,
    out: 'scripts/output/level-test-items.json',
    sql: 'migrations/level-test-seed.sql',
    report: 'docs/level-test/item-bank-report.md',
    fromJson: null,
    merge: false,
    topUp: false,
  };
  for (const arg of argv.slice(2)) {
    const [key, raw] = arg.replace(/^--/, '').split('=');
    const value = raw ?? '';
    if (key === 'levels') {
      const levels = value.split(',').map((part) => part.trim().toUpperCase());
      if (!levels.every(isCefrLevel)) throw new Error(`Unknown CEFR level in --levels=${value}`);
      options.levels = levels as CefrLevel[];
    } else if (key === 'types') {
      const types = value.split(',').map((part) => part.trim().toLowerCase());
      if (!types.every(isItemType)) throw new Error(`Unknown type in --types=${value}`);
      options.types = types as ItemType[];
    } else if (key === 'target') {
      options.targetOverride = Number(value);
      if (!Number.isFinite(options.targetOverride) || options.targetOverride < 1) {
        throw new Error('--target must be a positive number');
      }
    } else if (key === 'no-verify') {
      options.verify = false;
    } else if (key === 'out') {
      options.out = value;
    } else if (key === 'sql') {
      options.sql = value;
    } else if (key === 'report') {
      options.report = value;
    } else if (key === 'from-json') {
      if (!value) throw new Error('--from-json needs a path, e.g. --from-json=scripts/output/level-test-items.json');
      options.fromJson = value;
    } else if (key === 'merge') {
      options.merge = true;
    } else if (key === 'top-up') {
      options.topUp = true;
    } else if (key !== '') {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

/* ── item model ──────────────────────────────────────────────────────────── */

interface GeneratedQuestion {
  stem: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface GeneratedPassage {
  title?: string;
  text: string;
  questions: GeneratedQuestion[];
}

interface ItemRecord {
  id: string;
  type: ItemType;
  cefrTag: CefrLevel;
  difficultyB: number;
  stem: string;
  options: string[];
  correctIndex: number;
  passageId: string | null;
  /** 1-based question position inside the passage; null for standalone items. */
  passageOrder: number | null;
  audioScript: string | null;
  explanation: string;
  source: 'ai';
  reviewed: false;
  status: 'draft';
}

interface PassageRecord {
  id: string;
  cefrTag: CefrLevel;
  title: string;
  body: string;
  wordCount: number;
}

interface Bank {
  model: string;
  modelHistory?: string[];
  generatedAt: string;
  passages: PassageRecord[];
  items: ItemRecord[];
  rejected: Record<string, number>;
}

/* ── OpenRouter ──────────────────────────────────────────────────────────── */

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

async function chatJson(messages: ChatMessage[], label: string): Promise<unknown> {
  if (!API_KEY) {
    const keyName =
      PROVIDER === 'openrouter'
        ? 'OPENROUTER_API_KEY (or OPENROUTER_API_KEYY)'
        : `${PROVIDER.toUpperCase()}_API_KEY`;
    throw new Error(`${keyName} is missing. Add it to .env before running the generator.`);
  }
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 8000,
  };
  // Gemini's OpenAI-compatible layer and the other providers all accept JSON
  // mode, but Gemini rejects unknown response_format variants on some models.
  if (PROVIDER !== 'gemini') {
    body.response_format = { type: 'json_object' };
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          ...(PROVIDER === 'openrouter'
            ? {
                'HTTP-Referer': 'https://venoxa.ai',
                'X-Title': 'Venoxa Level Test generator',
              }
            : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await response.text();
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const message = `${PROVIDER} ${response.status}: ${text.slice(0, 300)}`;
        if (retryable && attempt < 3) {
          console.warn(`[gen] ${label}: ${message} — retry ${attempt + 1}/3`);
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        throw new Error(message);
      }
      const parsed = JSON.parse(text) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = parsed.choices?.[0]?.message?.content;
      if (!content) throw new Error(`${PROVIDER} returned no message content`);
      return parseJsonLoose(content);
    } catch (error) {
      if (attempt < 3) {
        console.warn(`[gen] ${label}: ${(error as Error).message} — retry ${attempt + 1}/3`);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('unreachable');
}

function parseJsonLoose(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Strip markdown fences and any prose before the first JSON value.
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        /* fall through */
      }
    }
    const firstObj = trimmed.indexOf('{');
    const lastObj = trimmed.lastIndexOf('}');
    if (firstObj >= 0 && lastObj > firstObj) {
      try {
        return JSON.parse(trimmed.slice(firstObj, lastObj + 1));
      } catch {
        /* fall through */
      }
    }
    const firstArr = trimmed.indexOf('[');
    const lastArr = trimmed.lastIndexOf(']');
    if (firstArr >= 0 && lastArr > firstArr) {
      try {
        return JSON.parse(trimmed.slice(firstArr, lastArr + 1));
      } catch {
        /* fall through */
      }
    }
    throw new Error(`Could not parse JSON from model output: ${trimmed.slice(0, 200)}`);
  }
}

/* ── prompts ─────────────────────────────────────────────────────────────── */

const LEVEL_GUIDE: Record<CefrLevel, string> = {
  A1: 'very basic phrases, present simple, articles, plurals, everyday objects, high-frequency words',
  A2: 'simple everyday situations, past simple, comparatives, common phrasal verbs, elementary connectors',
  B1: 'familiar topics, present perfect, conditionals 1/2, relative clauses, common collocations, opinions',
  B2: 'complex ideas, passive voice, perfect modals, mixed conditionals, abstract vocabulary, formal registers',
  C1: 'nuanced argument, inversion, cleft sentences, idioms, low-frequency academic vocabulary, subtle stance',
  C2: 'sophisticated prose, rare idioms, rhetorical devices, near-native collocations, precise register shifts',
};

const SYSTEM_PROMPT = `You are a senior CEFR assessment item writer building an original English placement test.
Rules:
- Write ORIGINAL items. Never copy or closely paraphrase IELTS, TOEFL, Cambridge, EF SET, or any published exam question.
- Use one spelling convention (British or American) within an item.
- Avoid politics, religion, violence, personal data, and anything unsuitable for a general audience.
- Every item has exactly four options and exactly one defensible correct answer.
- Distractors must be plausible for learners at the target level, not obviously wrong.
- Return ONLY valid JSON matching the requested shape. No markdown, no commentary.`;

function levelLine(level: CefrLevel): string {
  return `Target CEFR level: ${level} (${LEVEL_GUIDE[level]}).`;
}

function generationPrompt(type: ItemType, level: CefrLevel, count: number): string {
  if (type === 'grammar') {
    return `${levelLine(level)}
Write ${count} four-option multiple-choice GRAMMAR items.
Each item: a short context sentence (8-30 words) containing exactly one blank written as "____"; four options that complete the blank; exactly one correct answer. Distractors should be plausible grammar errors at ${level}. Vary the correct option position.
DIVERSITY REQUIREMENTS (strict):
- Cover at least 8 different grammar points across the set (e.g. articles, plurals, subject-verb agreement, past simple, comparatives, prepositions, pronouns, question forms, modals).
- Vary subjects (names, plural nouns, "there is/are"), sentence openings, time expressions, and sentence types (statement, question, negative).
- Do NOT reuse a sentence frame. In particular, use "usually ____" at most once and "every day" at most once in the whole set.
- Write at most two items about daily routines; include other topics such as travel, work, shopping, health, weather, and hobbies.
JSON shape:
{"items":[{"stem":"... ____ ...","options":["...","...","...","..."],"correctIndex":0,"explanation":"why the answer is correct and why the main distractor is wrong"}]}`;
  }
  if (type === 'vocab') {
    return `${levelLine(level)}
Write ${count} four-option VOCABULARY-IN-CONTEXT items.
Each stem must be a self-contained question of the form: In the sentence "SENTENCE", what does "WORD" most nearly mean? WORD must appear in SENTENCE. Options are short definitions or synonyms (1-4 words each). Exactly one correct answer; distractors should be plausible meanings at ${level}. Vary the correct option position.
DIVERSITY REQUIREMENTS (strict):
- Use a different target WORD in every item.
- Vary the topic domain (work, travel, education, health, technology, environment, relationships, everyday life).
- Vary the sentence structure; do not reuse the same sentence frame.
JSON shape:
{"items":[{"stem":"In the sentence \\"...\\", what does \\"WORD\\" most nearly mean?","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}`;
  }
  if (type === 'reading') {
    return `${levelLine(level)}
Write ${count} short READING passages, each followed by 3 four-option comprehension questions.
- Passage length: ${level === 'A1' || level === 'A2' ? '60-110' : level === 'B1' || level === 'B2' ? '90-150' : '120-180'} words.
- Questions must be answerable from the passage alone. Mix detail, inference, and vocabulary-in-context.
- Four options per question, exactly one correct. Vary the correct option position.
DIVERSITY REQUIREMENTS (strict):
- Give every passage a different topic, setting, and plot; do not reuse the same characters or situation.
- Vary the genre (news story, personal anecdote, notice, review, short report, interview).
JSON shape:
{"passages":[{"title":"...","text":"...","questions":[{"stem":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}]}`;
  }
  return `${levelLine(level)}
Write ${count} short LISTENING scripts, each followed by one four-option question.
- Each script should last 15-45 seconds when read aloud at about 150 words per minute (roughly 35-115 words).
- Natural spoken English: a short dialogue or monologue. No stage directions or speaker labels unless they are read aloud naturally (prefer clean prose).
- The question must be answerable from the audio alone. Four options, exactly one correct. Vary the correct option position.
DIVERSITY REQUIREMENTS (strict):
- Vary speaker roles, settings, and communicative purposes (announcement, voicemail, shop exchange, short interview, travel update).
- Do not reuse the same situation or question focus across scripts.
JSON shape:
{"items":[{"stem":"...","audioScript":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}`;
}

function verificationPrompt(items: Array<{
  id: string;
  type: ItemType;
  stem: string;
  options: string[];
  passage?: string;
  audioScript?: string | null;
}>): string {
  const payload = items.map((item) => ({
    id: item.id,
    type: item.type,
    stem: item.stem,
    options: item.options,
    ...(item.passage ? { passage: item.passage } : {}),
    ...(item.audioScript ? { audioScript: item.audioScript } : {}),
  }));
  return `Independently answer each English test item below. Do NOT assume any position is correct.
For each item, choose the single best option (0-3). Mark ambiguous=true if two or more options are genuinely defensible, otherwise false. Mark plausible=false if any distractor is obviously wrong for a learner at the target level (for example a non-word, a wildly different part of speech, or a meaning that cannot fit the context); otherwise plausible=true. Be strict but fair: do not mark an item ambiguous merely because a distractor is attractive.
Return ONLY JSON:
{"answers":[{"id":"...","choice":0,"ambiguous":false,"plausible":true}]}

Items:
${JSON.stringify(payload, null, 2)}`;
}

/* ── validation ──────────────────────────────────────────────────────────── */

interface ValidationContext {
  level: CefrLevel;
  type: ItemType;
  passageText?: string;
}

const BANNED_OPTIONS = /^(all|none) of the above$|^both a and b$|^not sure$|^no idea$/i;
const ARABIC = /[\u0600-\u06FF]/;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function validateQuestion(
  question: unknown,
  context: ValidationContext,
  reject: (reason: string) => void,
): GeneratedQuestion | null {
  if (!question || typeof question !== 'object') {
    reject('question-not-object');
    return null;
  }
  const q = question as Record<string, unknown>;
  const stem = typeof q.stem === 'string' ? q.stem.trim() : '';
  if (stem.length < 8 || stem.length > 500) {
    reject('stem-length');
    return null;
  }
  if (ARABIC.test(stem)) {
    reject('arabic-in-item');
    return null;
  }
  if (/<[a-z][\s\S]*>/i.test(stem)) {
    reject('html-in-stem');
    return null;
  }
  if (context.type === 'grammar' && !/_{3,}/.test(stem)) {
    reject('grammar-missing-blank');
    return null;
  }
  if (context.type === 'grammar' && (stem.match(/_{3,}/g)?.length ?? 0) !== 1) {
    reject('grammar-blank-count');
    return null;
  }
  if (context.type === 'vocab') {
    if (!/^In the sentence/i.test(stem) || !/what does/i.test(stem)) {
      reject('vocab-stem-shape');
      return null;
    }
  }

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    reject('options-count');
    return null;
  }
  const options = q.options.map((option) => (typeof option === 'string' ? option.trim() : ''));
  if (options.some((option) => option.length === 0 || option.length > 120)) {
    reject('option-length');
    return null;
  }
  if (options.some((option) => ARABIC.test(option))) {
    reject('arabic-in-option');
    return null;
  }
  const normalized = options.map((option) => option.toLowerCase().replace(/\s+/g, ' '));
  if (new Set(normalized).size !== 4) {
    reject('duplicate-options');
    return null;
  }
  if (options.some((option) => BANNED_OPTIONS.test(option))) {
    reject('banned-option');
    return null;
  }
  const lengths = options.map((option) => option.length);
  if (Math.max(...lengths) / Math.max(1, Math.min(...lengths)) > 4) {
    reject('option-length-outlier');
    return null;
  }
  if (typeof q.correctIndex !== 'number' || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
    reject('correct-index');
    return null;
  }
  const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
  if (explanation.length < 10) {
    reject('missing-explanation');
    return null;
  }
  if (context.type === 'reading' && context.passageText) {
    const words = wordCount(context.passageText);
    if (words < 50 || words > 200) {
      reject('passage-length');
      return null;
    }
  }

  return {
    stem,
    options,
    correctIndex: q.correctIndex,
    explanation,
  };
}

function validatePassage(
  passage: unknown,
  level: CefrLevel,
  reject: (reason: string) => void,
): { title: string; text: string; questions: GeneratedQuestion[] } | null {
  if (!passage || typeof passage !== 'object') {
    reject('passage-not-object');
    return null;
  }
  const p = passage as Record<string, unknown>;
  const text = typeof p.text === 'string' ? p.text.trim() : '';
  const words = wordCount(text);
  if (words < 60 || words > 180) {
    reject('passage-length');
    return null;
  }
  if (ARABIC.test(text)) {
    reject('arabic-in-passage');
    return null;
  }
  if (!Array.isArray(p.questions) || p.questions.length < 2 || p.questions.length > 3) {
    reject('passage-question-count');
    return null;
  }
  const questions: GeneratedQuestion[] = [];
  for (const raw of p.questions) {
    const question = validateQuestion(
      raw,
      { level, type: 'reading', passageText: text },
      reject,
    );
    if (question) questions.push(question);
  }
  if (questions.length < 2) return null;
  return {
    title: typeof p.title === 'string' ? p.title.trim().slice(0, 160) : '',
    text,
    questions,
  };
}

/* ── dedupe ──────────────────────────────────────────────────────────────── */

interface SeenStem {
  normalized: string;
  tokens: Set<string>;
  type?: ItemType;
  /** Grammar-only: the words around the blank, used to catch template repeats. */
  frame?: string | null;
  /** Vocab-only: the target word being defined. */
  target?: string | null;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'these', 'those',
  'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'does', 'did',
  'will', 'would', 'could', 'should', 'shall', 'might', 'must', 'can',
  'his', 'her', 'their', 'our', 'your', 'its', 'him', 'them', 'they', 'she',
  'you', 'not', 'but', 'because', 'when', 'while', 'there', 'here', 'into',
]);

function normalizeStem(stem: string): string {
  return stem
    .toLowerCase()
    .replace(/_{3,}/g, ' blank ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentTokens(normalized: string): Set<string> {
  return new Set(
    normalized
      .split(' ')
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  return intersection / Math.max(1, a.size + b.size - intersection);
}

const SUBJECT_WORDS = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they', 'there']);

/**
 * For grammar items, capture the words immediately before and after the blank.
 * This catches formulaic templates ("She usually ____ a ...") that share almost
 * no content words but are still effectively the same question.
 */
function grammarFrame(stem: string): string | null {
  const match = stem.match(
    /([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,2})\s*_{3,}\s*([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,1})/,
  );
  if (!match) return null;
  const before = match[1]
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !SUBJECT_WORDS.has(word));
  const after = match[2].toLowerCase().split(/\s+/);
  const pre = before.slice(-1).join(' ');
  const post = after.slice(0, 1).join(' ');
  return `${pre}|${post}`;
}

/** For vocab items, extract the quoted word being defined. */
function vocabTarget(stem: string): string | null {
  const match = stem.match(/what does\s+["“”']([^"“”']+)["“”']\s+most nearly mean/i);
  return match ? match[1].trim().toLowerCase() : null;
}

function makeSeen(stem: string, type?: ItemType): SeenStem {
  const normalized = normalizeStem(stem);
  return {
    normalized,
    tokens: contentTokens(normalized),
    type,
    frame: type === 'grammar' ? grammarFrame(stem) : null,
    target: type === 'vocab' ? vocabTarget(stem) : null,
  };
}

function isDuplicate(stem: string, seen: SeenStem[], type?: ItemType): boolean {
  const normalized = normalizeStem(stem);
  const tokens = contentTokens(normalized);
  const frame = type === 'grammar' ? grammarFrame(stem) : null;
  const target = type === 'vocab' ? vocabTarget(stem) : null;
  let sameFrame = 0;
  for (const other of seen) {
    if (other.normalized === normalized) return true;
    if (jaccard(tokens, other.tokens) >= 0.85) return true;
    if (target && other.target === target) return true;
    if (frame && other.frame === frame) {
      sameFrame++;
      // Two items may share a frame; a third is a template repeat.
      if (sameFrame >= 2) return true;
    }
  }
  return false;
}

/* ── generation pipeline ─────────────────────────────────────────────────── */

interface TypeResult {
  items: ItemRecord[];
  passages: PassageRecord[];
  rejections: Record<string, number>;
}

function bump(bag: Record<string, number>, key: string): void {
  bag[key] = (bag[key] ?? 0) + 1;
}

async function generateType(
  level: CefrLevel,
  type: ItemType,
  target: number,
  verify: boolean,
  seenStems: SeenStem[],
  usedPassageIds: Set<string>,
  counters: { nextItem: number; nextPassage: number },
  rejections: Record<string, number>,
): Promise<TypeResult> {
  const items: ItemRecord[] = [];
  const passages: PassageRecord[] = [];
  const targetPassages = type === 'reading' ? Math.max(1, Math.ceil(target / 3)) : target;
  const requested = type === 'reading' ? targetPassages : target;
  const label = `${level}/${type}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const stillNeeded =
      type === 'reading'
        ? Math.max(0, targetPassages - passages.length)
        : Math.max(0, target - items.length);
    if (stillNeeded === 0) break;

    console.log(`[gen] ${label}: requesting ${stillNeeded} (attempt ${attempt + 1})`);
    const raw = await chatJson(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: generationPrompt(type, level, stillNeeded) },
      ],
      label,
    );

    const batchItems: Array<{ item: ItemRecord; passageText?: string; audioScript?: string | null }> = [];
    const batchPassages: PassageRecord[] = [];

    if (type === 'reading') {
      const container = raw as { passages?: unknown[] };
      const rawPassages = Array.isArray(container?.passages) ? container.passages : [];
      for (const rawPassage of rawPassages) {
        if (passages.length + batchPassages.length >= targetPassages) break;
        const passage = validatePassage(rawPassage, level, (reason) => bump(rejections, reason));
        if (!passage) continue;

        const passageId = `ltp_${level.toLowerCase()}_${String(counters.nextPassage++).padStart(4, '0')}`;
        if (usedPassageIds.has(passageId)) continue;
        const passageRecord: PassageRecord = {
          id: passageId,
          cefrTag: level,
          title: passage.title || `Reading ${passageId}`,
          body: passage.text,
          wordCount: wordCount(passage.text),
        };

        const newItems: ItemRecord[] = [];
        for (let q = 0; q < passage.questions.length; q++) {
          const question = passage.questions[q];
          if (isDuplicate(question.stem, seenStems, 'reading')) {
            bump(rejections, 'duplicate-stem');
            continue;
          }
          const id = `lt_${level.toLowerCase()}_reading_${String(counters.nextItem++).padStart(4, '0')}`;
          newItems.push({
            id,
            type: 'reading',
            cefrTag: level,
            difficultyB: SEED_DIFFICULTY[level],
            stem: question.stem,
            options: question.options,
            correctIndex: question.correctIndex,
            passageId,
            passageOrder: q + 1,
            audioScript: null,
            explanation: question.explanation ?? '',
            source: 'ai',
            reviewed: false,
            status: 'draft',
          });
        }
        if (newItems.length < 2) {
          bump(rejections, 'passage-too-few-questions');
          continue;
        }
        // Passage id is reserved only when at least two questions survive.
        usedPassageIds.add(passageId);
        batchPassages.push(passageRecord);
        for (const item of newItems) {
          batchItems.push({ item, passageText: passage.text });
        }
      }
    } else {
      const container = raw as { items?: unknown[] };
      const rawItems = Array.isArray(container?.items) ? container.items : [];
      for (const rawItem of rawItems) {
        if (items.length + batchItems.length >= target) break;
        const question = validateQuestion(
          rawItem,
          { level, type },
          (reason) => bump(rejections, reason),
        );
        if (!question) continue;
        if (type === 'listening') {
          if (isDuplicate(question.stem, seenStems, 'listening')) {
            bump(rejections, 'duplicate-stem');
            continue;
          }
          const script =
            rawItem && typeof rawItem === 'object' && typeof (rawItem as Record<string, unknown>).audioScript === 'string'
              ? ((rawItem as Record<string, unknown>).audioScript as string).trim()
              : '';
          const words = wordCount(script);
          if (words < 30 || words > 130) {
            bump(rejections, 'audio-script-length');
            continue;
          }
          if (ARABIC.test(script)) {
            bump(rejections, 'arabic-in-audio');
            continue;
          }
          const id = `lt_${level.toLowerCase()}_listening_${String(counters.nextItem++).padStart(4, '0')}`;
          batchItems.push({
            item: {
              id,
              type,
              cefrTag: level,
              difficultyB: SEED_DIFFICULTY[level],
              stem: question.stem,
              options: question.options,
              correctIndex: question.correctIndex,
              passageId: null,
              passageOrder: null,
              audioScript: script,
              explanation: question.explanation ?? '',
              source: 'ai',
              reviewed: false,
              status: 'draft',
            },
            audioScript: script,
          });
        } else {
          if (isDuplicate(question.stem, seenStems, type)) {
            bump(rejections, 'duplicate-stem');
            continue;
          }
          const id = `lt_${level.toLowerCase()}_${type}_${String(counters.nextItem++).padStart(4, '0')}`;
          batchItems.push({
            item: {
              id,
              type,
              cefrTag: level,
              difficultyB: SEED_DIFFICULTY[level],
              stem: question.stem,
              options: question.options,
              correctIndex: question.correctIndex,
              passageId: null,
              passageOrder: null,
              audioScript: null,
              explanation: question.explanation ?? '',
              source: 'ai',
              reviewed: false,
              status: 'draft',
            },
          });
        }
      }
    }

    if (batchItems.length === 0) {
      bump(rejections, 'empty-batch');
      continue;
    }

    // Second pass: independent answers. Drop mismatches and ambiguous items.
    let accepted = batchItems;
    if (verify) {
      try {
        const verdict = (await chatJson(
          [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: verificationPrompt(
                batchItems.map(({ item, passageText, audioScript }) => ({
                  id: item.id,
                  type: item.type,
                  stem: item.stem,
                  options: item.options,
                  passage: passageText,
                  audioScript,
                })),
              ),
            },
          ],
          `${label}/verify`,
        )) as { answers?: Array<{ id?: string; choice?: number; ambiguous?: boolean; plausible?: boolean }> };

        const byId = new Map(
          (Array.isArray(verdict?.answers) ? verdict.answers : []).map((answer) => [
            String(answer.id ?? ''),
            answer,
          ]),
        );
        accepted = batchItems.filter(({ item }) => {
          const answer = byId.get(item.id);
          if (!answer) {
            bump(rejections, 'verify-missing');
            return false;
          }
          if (answer.ambiguous === true) {
            bump(rejections, 'verify-ambiguous');
            return false;
          }
          if (answer.plausible === false) {
            bump(rejections, 'verify-implausible-distractor');
            return false;
          }
          if (answer.choice !== item.correctIndex) {
            bump(rejections, 'verify-mismatch');
            return false;
          }
          return true;
        });
      } catch (error) {
        console.warn(`[gen] ${label}: verification failed (${(error as Error).message}) — keeping unverified batch`);
        bump(rejections, 'verify-failed-kept');
      }
    }

    for (const entry of accepted) {
      items.push(entry.item);
      seenStems.push(makeSeen(entry.item.stem, entry.item.type));
    }
    passages.push(...batchPassages.filter((passage) =>
      accepted.some((entry) => entry.item.passageId === passage.id),
    ));

    if (accepted.length < batchItems.length) {
      console.warn(
        `[gen] ${label}: ${accepted.length}/${batchItems.length} items survived verification`,
      );
    }
  }

  if (type === 'reading' && items.length > target) items.length = target;
  return { items, passages, rejections };
}

/* ── SQL output ──────────────────────────────────────────────────────────── */

function sqlString(value: string | null): string {
  if (value === null) return 'null';
  return `'${value.replace(/'/g, "''")}'`;
}

function writeSeedSql(bank: Bank, path: string): void {
  const lines: string[] = [];
  lines.push('-- Venoxa Level Test — generated seed data.');
  lines.push(`-- Model: ${bank.model}`);
  lines.push(`-- Generated: ${bank.generatedAt}`);
  lines.push('-- Run migrations/level-test.sql first, then this file.');
  lines.push('-- All items are reviewed=false / status=draft. Do not activate before teacher review.');
  lines.push('');
  lines.push('begin;');
  lines.push('');

  for (const passage of bank.passages) {
    lines.push(
      `insert into lt_passages (id, cefr_tag, title, body, word_count) values (${sqlString(
        passage.id,
      )}, ${sqlString(passage.cefrTag)}, ${sqlString(passage.title)}, ${sqlString(
        passage.body,
      )}, ${passage.wordCount}) on conflict (id) do nothing;`,
    );
  }
  lines.push('');

  for (const item of bank.items) {
    const optionsJson = sqlString(JSON.stringify(item.options));
    lines.push(
      `insert into lt_items (id, type, cefr_tag, difficulty_b, stem, options, correct_index, passage_id, passage_order, audio_script, source, reviewed, status) values (${sqlString(
        item.id,
      )}, ${sqlString(item.type)}, ${sqlString(item.cefrTag)}, ${item.difficultyB}, ${sqlString(
        item.stem,
      )}, ${optionsJson}::jsonb, ${item.correctIndex}, ${
        item.passageId ? sqlString(item.passageId) : 'null'
      }, ${item.passageOrder ?? 'null'}, ${item.audioScript ? sqlString(item.audioScript) : 'null'}, 'ai', false, 'draft') on conflict (id) do nothing;`,
    );
  }

  lines.push('');
  lines.push('commit;');
  lines.push('');
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), lines.join('\n'), 'utf8');
}

/* ── report ──────────────────────────────────────────────────────────────── */

function writeReport(bank: Bank, path: string, options: CliOptions): void {
  const lines: string[] = [];
  lines.push('# Venoxa Level Test — item bank generation report');
  lines.push('');
  lines.push(`- Model: \`${bank.model}\``);
  lines.push(`- Generated: ${bank.generatedAt}`);
  lines.push(`- Items: **${bank.items.length}** · passages: **${bank.passages.length}**`);
  lines.push(`- Verification pass: ${options.verify ? 'enabled' : 'disabled'}`);
  lines.push('');
  lines.push('## Counts by level and type');
  lines.push('');
  lines.push('| Level | Grammar | Vocabulary | Reading | Listening | Total |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
  for (const level of CEFR_LEVELS) {
    const row = (type: ItemType) => bank.items.filter((item) => item.cefrTag === level && item.type === type).length;
    const grammar = row('grammar');
    const vocab = row('vocab');
    const reading = row('reading');
    const listening = row('listening');
    lines.push(
      `| ${level} | ${grammar} | ${vocab} | ${reading} | ${listening} | ${grammar + vocab + reading + listening} |`,
    );
  }
  lines.push('');
  lines.push('## Correct-option distribution (before per-session shuffling)');
  lines.push('');
  const positions = [0, 0, 0, 0];
  for (const item of bank.items) positions[item.correctIndex]++;
  lines.push(`A: ${positions[0]} · B: ${positions[1]} · C: ${positions[2]} · D: ${positions[3]}`);
  lines.push('');
  lines.push('## Rejected during validation');
  lines.push('');
  const rejections = Object.entries(bank.rejected).sort((a, b) => b[1] - a[1]);
  if (rejections.length === 0) {
    lines.push('None.');
  } else {
    lines.push('| Reason | Count |');
    lines.push('| --- | ---: |');
    for (const [reason, count] of rejections) lines.push(`| ${reason} | ${count} |`);
  }
  lines.push('');
  lines.push('## Review requirements');
  lines.push('');
  lines.push('- Every generated item is `reviewed=false` and `status=draft`.');
  lines.push('- A teacher must review a sample of at least 20 items across levels before activation.');
  lines.push('- **All C1 and C2 items must be reviewed** before they are activated.');
  lines.push('- Check that no item reproduces a published exam question; the generator prompts for original content, but human review is the final safeguard.');
  lines.push('- After review, activate items with: `update lt_items set reviewed = true, status = \'active\' where id = ...;`');
  lines.push('');
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), lines.join('\n'), 'utf8');
}

/* ── main ────────────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  const options = parseArgs(process.argv);

  /* Rewrite an existing bank without calling OpenRouter. */
  if (options.fromJson) {
    const sourcePath = resolve(options.fromJson);
    const bank = JSON.parse(readFileSync(sourcePath, 'utf8')) as Bank;
    const byPassage = new Map<string, ItemRecord[]>();
    for (const item of bank.items) {
      if (item.type !== 'reading' || !item.passageId) {
        item.passageOrder = null;
        continue;
      }
      const list = byPassage.get(item.passageId) ?? [];
      list.push(item);
      byPassage.set(item.passageId, list);
    }
    for (const list of byPassage.values()) {
      list.sort((a, b) => a.id.localeCompare(b.id));
      list.forEach((item, index) => {
        item.passageOrder = index + 1;
      });
    }
    writeFileSync(sourcePath, JSON.stringify(bank, null, 2), 'utf8');
    writeSeedSql(bank, options.sql);
    writeReport(bank, options.report, options);
    console.log(`[gen] normalized ${bank.items.length} items from ${sourcePath}`);
    console.log(`[gen] SQL   → ${resolve(options.sql)}`);
    console.log(`[gen] report→ ${resolve(options.report)}`);
    return;
  }

  if (!API_KEY) {
    const keyName =
      PROVIDER === 'openrouter'
        ? 'OPENROUTER_API_KEY (or OPENROUTER_API_KEYY)'
        : `${PROVIDER.toUpperCase()}_API_KEY`;
    console.error(`Missing ${keyName}. Add it to .env and retry.`);
    process.exit(1);
  }
  console.log(`[gen] provider=${PROVIDER} model=${MODEL} levels=${options.levels.join(',')} types=${options.types.join(',')}`);
  console.log(`[gen] concurrency=${CONCURRENCY} verify=${options.verify}`);

  const bank: Bank = {
    model: MODEL,
    modelHistory: [MODEL],
    generatedAt: new Date().toISOString(),
    passages: [],
    items: [],
    rejected: {},
  };
  const seenStems: SeenStem[] = [];
  const usedPassageIds = new Set<string>();
  const counters = { nextItem: 1, nextPassage: 1 };

  if (options.merge) {
    const existingPath = resolve(options.out);
    if (!existsSync(existingPath)) {
      console.warn(`[gen] --merge requested but ${existingPath} does not exist; starting a new bank.`);
    } else {
      const existing = JSON.parse(readFileSync(existingPath, 'utf8')) as Bank;
      const previousModels = existing.modelHistory ?? (existing.model ? [existing.model] : []);
      bank.model = MODEL;
      bank.modelHistory = Array.from(new Set([...previousModels, MODEL]));
      bank.generatedAt = new Date().toISOString();
      bank.passages = existing.passages ?? [];
      bank.items = existing.items ?? [];
      bank.rejected = existing.rejected ?? {};
      for (const item of bank.items) {
        seenStems.push(makeSeen(item.stem, item.type));
      }
      for (const passage of bank.passages) usedPassageIds.add(passage.id);
      const maxSuffix = (ids: string[]) =>
        ids.reduce((max, id) => {
          const match = id.match(/(\d+)$/);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
      counters.nextItem = maxSuffix(bank.items.map((item) => item.id)) + 1;
      counters.nextPassage = maxSuffix(bank.passages.map((passage) => passage.id)) + 1;
      console.log(`[gen] merging with ${bank.items.length} existing items, ${bank.passages.length} passages`);
    }
  }

  const tasks: Array<() => Promise<void>> = [];
  for (const level of options.levels) {
    for (const type of options.types) {
      tasks.push(async () => {
        const target = options.targetOverride ?? TYPE_TARGETS[type];
        try {
          const result = await generateType(
            level,
            type,
            target,
            options.verify,
            seenStems,
            usedPassageIds,
            counters,
            bank.rejected,
          );
          bank.items.push(...result.items);
          bank.passages.push(...result.passages);
          console.log(`[gen] ${level}/${type}: ${result.items.length} items accepted`);
        } catch (error) {
          console.error(`[gen] ${level}/${type} failed: ${(error as Error).message}`);
          bank.rejected[`fatal-${level}-${type}`] = (bank.rejected[`fatal-${level}-${type}`] ?? 0) + 1;
        }
      });
    }
  }

  // Simple concurrency pool.
  let next = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, async () => {
    for (;;) {
      const index = next++;
      if (index >= tasks.length) return;
      await tasks[index]();
    }
  });
  await Promise.all(workers);

  // Final global dedupe: generation tasks run concurrently, so duplicates can
  // still slip through across levels/types. Keep the first occurrence.
  const finalSeen: SeenStem[] = [];
  bank.items = bank.items.filter((item) => {
    if (isDuplicate(item.stem, finalSeen, item.type)) {
      bump(bank.rejected, 'duplicate-stem-final');
      return false;
    }
    finalSeen.push(makeSeen(item.stem, item.type));
    return true;
  });
  const usedPassages = new Set(bank.items.map((item) => item.passageId).filter(Boolean));
  bank.passages = bank.passages.filter((passage) => usedPassages.has(passage.id));

  bank.items.sort((a, b) => a.id.localeCompare(b.id));
  bank.passages.sort((a, b) => a.id.localeCompare(b.id));

  const jsonPath = resolve(options.out);
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(bank, null, 2), 'utf8');
  writeSeedSql(bank, options.sql);
  writeReport(bank, options.report, options);

  console.log(`[gen] ${bank.items.length} items, ${bank.passages.length} passages`);
  console.log(`[gen] JSON  → ${jsonPath}`);
  console.log(`[gen] SQL   → ${resolve(options.sql)}`);
  console.log(`[gen] report→ ${resolve(options.report)}`);
  if (bank.items.length < 240) {
    console.warn('[gen] fewer than 240 items — re-run or widen the target before launch.');
  }
}

main().catch((error) => {
  console.error('[gen] fatal:', error);
  process.exit(1);
});
