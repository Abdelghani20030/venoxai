#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  generate-path-exercises.mjs
//
//  Inserts authored grammar exercises (from A1_LESSON_CONTENT) and AI
//  placeholder stubs into path_lesson_exercises for all A1 lessons.
//
//  Prerequisites:
//    path_lessons rows must already exist (run build-path-from-content.mjs first)
//    migrations/path-lesson-steps.sql must have been applied (adds status col)
//
//  Usage:
//    node scripts/generate-path-exercises.mjs [--dry-run] [--lesson=<slug>] [--approve-all]
//
//  Flags:
//    --dry-run       Print what would be inserted; never connect to DB.
//    --lesson=<slug> Process only the named lesson slug.
//    --approve-all   Update all draft exercises to approved status.
// ─────────────────────────────────────────────────────────────────────────────

import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

import { A1_LESSON_CONTENT } from './path-content/a1.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN     = args.includes('--dry-run');
const APPROVE_ALL = args.includes('--approve-all');
const lessonArg   = args.find((a) => a.startsWith('--lesson='));
const ONLY_SLUG   = lessonArg ? lessonArg.split('=')[1] : null;

// ── Grammar rules per lesson (mirrors build-path-from-content.mjs) ────────────
const GRAMMAR_RULES = {
  'a1-adjectives-and-adverbs': [
    'Adjectives vs adverbs: word formation & word order (good → well, quick → quickly)',
    'Comparative adjectives with -er and more (happier, more comfortable)',
    'Superlative adjectives with -est and the most (the happiest, the most comfortable)',
  ],
  'a1-articles-and-quantifiers': [
    'Articles: a, an, the, zero article (I am a singer. I have books. I feel love.)',
    'Superlative with the (the best, the most interesting)',
  ],
  'a1-conditionals': [
    'Zero conditional (If you are ill, go to the doctor.)',
  ],
  'a1-future-tenses': [
    'Future with will for sudden decisions (I will help you.)',
    'Future with going to for plans (I am going to see my sister.)',
    'Will for requests (Will you carry my bag, please?)',
  ],
  'a1-gerund-and-infinitive': [
    'Verbs followed by infinitive or gerund: like, love, want, would like (I like reading. I want to see my family.)',
    'Stative verbs: know, like, seem, love, have, want, see',
  ],
  'a1-past-tenses': [
    'Past simple for actions in the past (I worked last night. I didn\'t work.)',
    'Past simple of TO BE (I was, You were, She was…)',
    'Past simple: regular and irregular verbs (I visited London. I went to see a film.)',
  ],
  'a1-modal-verbs-1': [
    'Can / can\'t for abilities (I can\'t swim. I can cook.)',
    'Could / couldn\'t for past abilities (I could swim when I was five.)',
    'Could for polite requests (Could you help me?)',
  ],
  'a1-modal-verbs-2': [
    'Must / mustn\'t for obligation & prohibition (I must study. You mustn\'t smoke.)',
    'Need / needn\'t for necessity (You need to finish. You needn\'t hurry.)',
    'Can for permission & possibility (Can I bring my dog? I can see you after work.)',
  ],
  'a1-modal-verbs-3': [
    'Shall for suggestions (Shall I walk you to work?)',
  ],
  'a1-prepositions': [
    'Prepositions of place: at, in, on, in front of, under, behind, among, beside, near, next to, between, across, into, through, onto, out of',
    'By, of, etc.',
  ],
  'a1-pronouns-1': [
    'Personal pronouns (I, he, she, it, we, you, they)',
    'Possessive pronouns (my, your, his, her, its, our, their)',
    "Possessive with 's (Paul's daughter, my sister's house)",
  ],
  'a1-pronouns-2': [
    'Object pronouns (me, you, him, her, it, us, them)',
    'Demonstrative pronouns (this, that, these, those)',
    'Pronouns: something, anything',
  ],
  'a1-present-tenses-1': [
    'Have got: positive, negative, question (I have got blond hair. Has she got a car?)',
    'Have (I have breakfast at 8.)',
    'To be (I am, You are, He is…)',
  ],
  'a1-present-tenses-2': [
    'There is / There are (There is a book. There are books.)',
    'Present simple for habits (I wake up at 8 every day.)',
    'Adverbs of frequency: always, never, often, seldom, usually (I usually drink coffee.)',
  ],
  'a1-present-tenses-3': [
    'Present progressive for actions now (I am working now.)',
    'Present perfect with since and for (I have lived alone since 2000.)',
  ],
  'a1-present-tenses-4': [
    'Present perfect with ever and never (Have you ever been to Britain?)',
    'Present perfect with already and yet (I haven\'t been yet. I have already done that.)',
    'Imperative (Stand up! Do this!)',
  ],
  'a1-questions-1': [
    'Interrogative pronouns: Where, When, Who, How, What, Which, Whose, What time',
    'Questions with TO BE (Are they relatives?)',
    'Questions with HAVE GOT (Have you got a car?)',
  ],
  'a1-questions-2': [
    'Questions with Present simple (Do you speak English?)',
    'Questions with Past simple (Did he do it? Was he at home?)',
    'Question tags (She is Spanish, isn\'t she?)',
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert authored grammar question into a DB-ready exercise row. */
function authoredToRow(lessonId, q, position) {
  // answer_key: {"index": n} for multiple_choice, {"accept": [...]} for fill_blank
  let answerKey;
  if (q.type === 'multiple_choice') {
    answerKey = { index: q.answer };
  } else {
    answerKey = { accept: q.accept };
  }
  return {
    lesson_id:      lessonId,
    step:           q.step,           // 'practice' or 'check'
    type:           q.type,
    prompt_en:      q.promptEn,
    prompt_ar:      q.promptAr ?? '',
    options:        JSON.stringify(q.options ?? []),
    answer_key:     JSON.stringify(answerKey),
    explanation_en: q.explanationEn ?? '',
    explanation_ar: q.explanationAr ?? '',
    position,
    status:         'draft',
    note_en:        null,
  };
}

/** Build a placeholder stub row. */
function stubRow(lessonId, ruleName, position) {
  // positions 2-4 → practice stubs, 5-7 → check stubs
  const step = position <= 4 ? 'practice' : 'check';
  return {
    lesson_id:      lessonId,
    step,
    type:           'fill_blank',
    prompt_en:      `AI-PLACEHOLDER: generate fill-blank for rule: ${ruleName}`,
    prompt_ar:      '',
    options:        JSON.stringify([]),
    answer_key:     JSON.stringify({}),
    explanation_en: '',
    explanation_ar: '',
    position,
    status:         'draft',
    note_en:        'AI-generated placeholder, needs review',
  };
}

/** Escape a CSV field. */
function csvField(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const slugs = Object.keys(A1_LESSON_CONTENT).filter(
    (s) => !ONLY_SLUG || s === ONLY_SLUG
  );

  if (slugs.length === 0) {
    console.error(`[gen-exercises] No matching lesson found for slug: ${ONLY_SLUG}`);
    process.exit(1);
  }

  console.log(`[gen-exercises] Processing ${slugs.length} A1 lesson(s)  dry-run: ${DRY_RUN}`);

  // Ensure exports/ dir exists
  const exportsDir = join(__dirname, '..', 'exports');
  mkdirSync(exportsDir, { recursive: true });

  if (DRY_RUN) {
    // ── Dry-run output & export review CSV ──────────────────────────────────
    let totalAuthored = 0;
    let totalStubs = 0;
    const csvRows = [];

    for (const slug of slugs) {
      const content = A1_LESSON_CONTENT[slug];
      const rules   = GRAMMAR_RULES[slug] ?? [];
      const qCount  = content.grammar.length;        // should be 2
      const stubCount = 6;                            // always 6 stubs

      console.log('');
      console.log(`  Lesson: ${slug}`);
      for (let i = 0; i < qCount; i++) {
        const q = content.grammar[i];
        console.log(`    [authored ${i}] step=${q.step}  type=${q.type}  prompt="${q.promptEn}"`);
        const isCheck = q.step === 'check';
        const opts = Array.isArray(q.options) ? q.options.join(' | ') : '';
        const ans = isCheck ? '***' : JSON.stringify(q.answer ?? q.accept ?? {});
        csvRows.push([slug, i, q.step, q.type, q.promptEn, opts, ans, q.explanationEn || '']);
      }
      for (let i = 0; i < 3; i++) {
        const rule = rules[i % rules.length] ?? '(no rule)';
        console.log(`    [stub pos ${i + 2}] step=practice  rule="${rule.slice(0, 60)}..."`);
        csvRows.push([slug, i + 2, 'practice', 'fill_blank', `Practice rule: ${rule}`, '', '{}', '']);
      }
      for (let i = 0; i < 3; i++) {
        const rule = rules[(i + 3) % rules.length] ?? '(no rule)';
        console.log(`    [stub pos ${i + 5}] step=check     rule="${rule.slice(0, 60)}..."`);
        csvRows.push([slug, i + 5, 'check', 'fill_blank', `Check rule: ${rule}`, '', '***', '']);
      }
      totalAuthored += qCount;
      totalStubs    += stubCount;
    }

    const csvPath = join(exportsDir, 'path-exercises-review.csv');
    const csvStream = createWriteStream(csvPath, { encoding: 'utf8' });
    const csvHeader = ['lesson_slug','position','step','type','prompt_en','options','answer_key_masked','explanation_en'];
    csvStream.write(csvHeader.map(csvField).join(',') + '\n');
    for (const row of csvRows) {
      csvStream.write(row.map(csvField).join(',') + '\n');
    }
    await new Promise((resolve, reject) => {
      csvStream.end();
      csvStream.on('finish', resolve);
      csvStream.on('error', reject);
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Lessons processed: ${slugs.length}`);
    console.log(`  Authored exercises that would be inserted: ${totalAuthored}`);
    console.log(`  Stub exercises that would be inserted: ${totalStubs}`);
    console.log(`  CSV written to: ${csvPath}`);
    console.log('[dry-run complete] No DB connection was made.');
    return;
  }

  // ── Live DB run ─────────────────────────────────────────────────────────────
  if (!process.env.DATABASE_URL) {
    console.error('[gen-exercises] ERROR: DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // If --approve-all, do that and exit
    if (APPROVE_ALL) {
      const { rowCount } = await client.query(
        `update public.path_lesson_exercises
            set status = 'approved'
          where status = 'draft'
            and step in ('practice','check')
            and lesson_id in (
              select id from public.path_lessons where slug like 'a1-%'
            )`
      );
      console.log(`[gen-exercises] Approved ${rowCount} draft exercise(s).`);
      return;
    }

    // Fetch lesson IDs for A1 slugs
    const { rows: lessonRows } = await client.query(
      `select id, slug from public.path_lessons where slug = any($1)`,
      [slugs]
    );
    const slugToId = Object.fromEntries(lessonRows.map((r) => [r.slug, r.id]));

    let totalAuthored = 0;
    let totalStubs    = 0;
    const csvRows = [];

    for (const slug of slugs) {
      const lessonId = slugToId[slug];
      if (!lessonId) {
        console.warn(`[gen-exercises] WARNING: lesson not found in DB: ${slug} — skipping`);
        continue;
      }

      const content = A1_LESSON_CONTENT[slug];
      const rules   = GRAMMAR_RULES[slug] ?? [];

      // Insert 2 authored questions (positions 0 and 1)
      for (let i = 0; i < content.grammar.length; i++) {
        const row = authoredToRow(lessonId, content.grammar[i], i);
        const { rowCount } = await client.query(
          `insert into public.path_lesson_exercises
             (lesson_id, step, type, prompt_en, prompt_ar, options, answer_key,
              explanation_en, explanation_ar, position, status)
           values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11)
           on conflict (lesson_id, position) do nothing`,
          [
            row.lesson_id, row.step, row.type, row.prompt_en, row.prompt_ar,
            row.options, row.answer_key, row.explanation_en, row.explanation_ar,
            row.position, row.status,
          ]
        );
        totalAuthored += rowCount;
        // CSV
        const isCheck = row.step === 'check';
        csvRows.push([
          slug, row.position, row.step, row.type,
          row.prompt_en,
          JSON.parse(row.options).join(' | '),
          isCheck ? '***' : row.answer_key,
          row.explanation_en,
        ]);
      }

      // Insert 6 stubs (positions 2-7)
      for (let pos = 2; pos <= 7; pos++) {
        const ruleIdx = pos - 2;
        const rule = rules[ruleIdx % rules.length] ?? '(no rule)';
        const row = stubRow(lessonId, rule, pos);
        const { rowCount } = await client.query(
          `insert into public.path_lesson_exercises
             (lesson_id, step, type, prompt_en, prompt_ar, options, answer_key,
              explanation_en, explanation_ar, position, status)
           values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11)
           on conflict (lesson_id, position) do nothing`,
          [
            row.lesson_id, row.step, row.type, row.prompt_en, row.prompt_ar,
            row.options, row.answer_key, row.explanation_en, row.explanation_ar,
            row.position, row.status,
          ]
        );
        totalStubs += rowCount;
        const isCheck = row.step === 'check';
        csvRows.push([
          slug, pos, row.step, row.type,
          row.prompt_en,
          '',
          isCheck ? '***' : '{}',
          '',
        ]);
      }
    }

    // Write CSV
    const csvPath = join(exportsDir, 'path-exercises-review.csv');
    const csvStream = createWriteStream(csvPath, { encoding: 'utf8' });
    const csvHeader = ['lesson_slug','position','step','type','prompt_en','options','answer_key_masked','explanation_en'];
    csvStream.write(csvHeader.map(csvField).join(',') + '\n');
    for (const row of csvRows) {
      csvStream.write(row.map(csvField).join(',') + '\n');
    }
    await new Promise((resolve, reject) => {
      csvStream.end();
      csvStream.on('finish', resolve);
      csvStream.on('error', reject);
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Lessons processed: ${slugs.length}`);
    console.log(`  Authored exercises inserted: ${totalAuthored}`);
    console.log(`  Stub exercises inserted: ${totalStubs}`);
    console.log(`  CSV written to: ${csvPath}`);
    console.log('═══════════════════════════════════════════════════════════════');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[gen-exercises] Fatal error:', err.message);
  process.exit(1);
});
