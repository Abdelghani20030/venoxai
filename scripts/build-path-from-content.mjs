#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  build-path-from-content.mjs
//
//  Idempotent builder that upserts the full A1 learning-path curriculum
//  (25 nodes: 18 lessons + 3 revisions + 3 unit checks + 1 level check)
//  from the authored content in scripts/path-content/a1.mjs.
//
//  Run order (prerequisites):
//    migrations/learning-path.sql
//    migrations/path-lesson-steps.sql
//    migrations/path-builder-v2.sql
//
//  Usage:
//    node scripts/build-path-from-content.mjs [--dry-run] [--level=A1]
//
//  Flags:
//    --dry-run   Print what would be upserted; never connect to the DB.
//    --level=A1  Level to build (default: A1). Easy to extend for A2+.
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

import { A1_LESSON_CONTENT } from './path-content/a1.mjs';

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const levelArg = args.find((a) => a.startsWith('--level='));
const LEVEL = levelArg ? levelArg.split('=')[1].toUpperCase() : 'A1';

// ── Grammar rules per lesson ──────────────────────────────────────────────────
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

// ── Vocabulary topic mapping ──────────────────────────────────────────────────
const VOCAB_MAP = {
  'a1-adjectives-and-adverbs':   { topic: 'Describing People & Things', category: 'adjectives', wordStart: 1,  wordEnd: 20  },
  'a1-articles-and-quantifiers': { topic: 'Everyday Objects',           category: 'objects',    wordStart: 1,  wordEnd: 20  },
  'a1-conditionals':             { topic: 'Health & Conditions',         category: 'health',     wordStart: 1,  wordEnd: 20  },
  'a1-future-tenses':            { topic: 'Future Plans',                category: 'future',     wordStart: 1,  wordEnd: 20  },
  'a1-gerund-and-infinitive':    { topic: 'Hobbies & Activities',        category: 'hobbies',    wordStart: 1,  wordEnd: 20  },
  'a1-past-tenses':              { topic: 'Past Events',                 category: 'past',       wordStart: 1,  wordEnd: 20  },
  'a1-modal-verbs-1':            { topic: 'Abilities & Skills',          category: 'abilities',  wordStart: 1,  wordEnd: 20  },
  'a1-modal-verbs-2':            { topic: 'Requests & Permissions',      category: 'requests',   wordStart: 21, wordEnd: 40  },
  'a1-modal-verbs-3':            { topic: 'Necessity & Obligation',      category: 'necessity',  wordStart: 41, wordEnd: 60  },
  'a1-prepositions':             { topic: 'Places & Directions',         category: 'places',     wordStart: 1,  wordEnd: 20  },
  'a1-pronouns-1':               { topic: 'People & Relationships',      category: 'people',     wordStart: 1,  wordEnd: 20  },
  'a1-pronouns-2':               { topic: 'Family',                      category: 'family',     wordStart: 1,  wordEnd: 20  },
  'a1-present-tenses-1':         { topic: 'Daily Routines',              category: 'routines',   wordStart: 1,  wordEnd: 20  },
  'a1-present-tenses-2':         { topic: 'Actions & Verbs',             category: 'actions',    wordStart: 21, wordEnd: 40  },
  'a1-present-tenses-3':         { topic: 'Home & Living',               category: 'home',       wordStart: 41, wordEnd: 60  },
  'a1-present-tenses-4':         { topic: 'Time & Frequency',            category: 'time',       wordStart: 61, wordEnd: 80  },
  'a1-questions-1':              { topic: 'Questions & Answers',         category: 'questions',  wordStart: 1,  wordEnd: 20  },
  'a1-questions-2':              { topic: 'Information & Details',       category: 'information',wordStart: 21, wordEnd: 40  },
};

// ── Writing topic mapping (lessons that include a writing activity) ───────────
const WRITING_MAP = {
  'a1-future-tenses':  { topicAr: 'خطط المستقبل',          topicEn: 'Future Plans'      },
  'a1-past-tenses':    { topicAr: 'ذكريات الطفولة',         topicEn: 'Childhood'          },
  'a1-modal-verbs-2':  { topicAr: 'العمل والمقابلات',       topicEn: 'Work & Interviews'  },
  'a1-pronouns-2':     { topicAr: 'العائلة والأصدقاء',      topicEn: 'Family & Friends'   },
  'a1-present-tenses-2': { topicAr: 'الروتين اليومي',       topicEn: 'Daily Routine'      },
  'a1-questions-2':    { topicAr: 'محادثة حرة',             topicEn: 'Free Talk'          },
};

// ── Listening source (A1 only: listen-spotlight) ─────────────────────────────
const LISTEN_SOURCE = {
  id:   'listen-spotlight',
  url:  'https://spotlightenglish.com/',
  name: 'Spotlight English podcast',
};

// ── Reading sources for A1 (round-robin) ─────────────────────────────────────
const READ_SOURCES = [
  { id: 'read-gutenberg',  url: 'https://www.gutenberg.org',     name: 'Project Gutenberg' },
  { id: 'read-eslfast',    url: 'https://www.eslfast.com',        name: 'ESL Fast'          },
  { id: 'read-storynory',  url: 'https://www.storynory.com',      name: 'Storynory'         },
  { id: 'read-manythings', url: 'https://www.manythings.org',     name: 'ManyThings.org'    },
];

// ── A1 path nodes (25 total) ──────────────────────────────────────────────────
// Positions are 1-based and global (match the schema CHECK constraint).
const A1_NODES = [
  // ─── Unit 1: Adjectives & Adverbs → Past Tenses ───────────────────────────
  { pos: 1,  slug: 'a1-adjectives-and-adverbs',   unit: 1, kind: 'lesson',
    titleEn: 'Adjectives & Adverbs',      titleAr: 'الصفات والأحوال',
    unitTitleEn: 'Adjectives & Adverbs → Past Tenses',
    unitTitleAr: 'الصفات والأفعال الناقصة → الماضي' },
  { pos: 2,  slug: 'a1-articles-and-quantifiers', unit: 1, kind: 'lesson',
    titleEn: 'Articles & Quantifiers',    titleAr: 'أدوات التعريف والكميات',
    unitTitleEn: 'Adjectives & Adverbs → Past Tenses',
    unitTitleAr: 'الصفات والأفعال الناقصة → الماضي' },
  { pos: 3,  slug: 'a1-conditionals',             unit: 1, kind: 'lesson',
    titleEn: 'Conditionals',              titleAr: 'الشرط',
    unitTitleEn: 'Adjectives & Adverbs → Past Tenses',
    unitTitleAr: 'الصفات والأفعال الناقصة → الماضي' },
  { pos: 4,  slug: 'a1-future-tenses',            unit: 1, kind: 'lesson',
    titleEn: 'Future Tenses',             titleAr: 'المستقبل',
    unitTitleEn: 'Adjectives & Adverbs → Past Tenses',
    unitTitleAr: 'الصفات والأفعال الناقصة → الماضي' },
  { pos: 5,  slug: 'a1-gerund-and-infinitive',    unit: 1, kind: 'lesson',
    titleEn: 'Gerund & Infinitive',       titleAr: 'المصدر وصيغة -ing',
    unitTitleEn: 'Adjectives & Adverbs → Past Tenses',
    unitTitleAr: 'الصفات والأفعال الناقصة → الماضي' },
  { pos: 6,  slug: 'a1-past-tenses',             unit: 1, kind: 'lesson',
    titleEn: 'Past Tenses',               titleAr: 'الماضي',
    unitTitleEn: 'Adjectives & Adverbs → Past Tenses',
    unitTitleAr: 'الصفات والأفعال الناقصة → الماضي' },
  { pos: 7,  slug: 'a1-unit-1-revision',          unit: 1, kind: 'revision',
    titleEn: 'Unit 1 Revision',           titleAr: 'مراجعة الوحدة الأولى',
    unitTitleEn: 'Adjectives & Adverbs → Past Tenses',
    unitTitleAr: 'الصفات والأفعال الناقصة → الماضي' },
  { pos: 8,  slug: 'a1-unit-1-check',             unit: 1, kind: 'assessment',
    titleEn: 'Unit 1 Check',              titleAr: 'اختبار الوحدة الأولى',
    unitTitleEn: 'Adjectives & Adverbs → Past Tenses',
    unitTitleAr: 'الصفات والأفعال الناقصة → الماضي' },
  // ─── Unit 2: Modal Verbs → Pronouns ──────────────────────────────────────
  { pos: 9,  slug: 'a1-modal-verbs-1',            unit: 2, kind: 'lesson',
    titleEn: 'Modal Verbs 1',             titleAr: 'الأفعال الناقصة 1',
    unitTitleEn: 'Modal Verbs → Pronouns',
    unitTitleAr: 'الأفعال الناقصة → الضمائر' },
  { pos: 10, slug: 'a1-modal-verbs-2',            unit: 2, kind: 'lesson',
    titleEn: 'Modal Verbs 2',             titleAr: 'الأفعال الناقصة 2',
    unitTitleEn: 'Modal Verbs → Pronouns',
    unitTitleAr: 'الأفعال الناقصة → الضمائر' },
  { pos: 11, slug: 'a1-modal-verbs-3',            unit: 2, kind: 'lesson',
    titleEn: 'Modal Verbs 3',             titleAr: 'الأفعال الناقصة 3',
    unitTitleEn: 'Modal Verbs → Pronouns',
    unitTitleAr: 'الأفعال الناقصة → الضمائر' },
  { pos: 12, slug: 'a1-prepositions',             unit: 2, kind: 'lesson',
    titleEn: 'Prepositions',              titleAr: 'حروف الجر',
    unitTitleEn: 'Modal Verbs → Pronouns',
    unitTitleAr: 'الأفعال الناقصة → الضمائر' },
  { pos: 13, slug: 'a1-pronouns-1',               unit: 2, kind: 'lesson',
    titleEn: 'Pronouns 1',               titleAr: 'الضمائر 1',
    unitTitleEn: 'Modal Verbs → Pronouns',
    unitTitleAr: 'الأفعال الناقصة → الضمائر' },
  { pos: 14, slug: 'a1-pronouns-2',               unit: 2, kind: 'lesson',
    titleEn: 'Pronouns 2',               titleAr: 'الضمائر 2',
    unitTitleEn: 'Modal Verbs → Pronouns',
    unitTitleAr: 'الأفعال الناقصة → الضمائر' },
  { pos: 15, slug: 'a1-unit-2-revision',          unit: 2, kind: 'revision',
    titleEn: 'Unit 2 Revision',           titleAr: 'مراجعة الوحدة الثانية',
    unitTitleEn: 'Modal Verbs → Pronouns',
    unitTitleAr: 'الأفعال الناقصة → الضمائر' },
  { pos: 16, slug: 'a1-unit-2-check',             unit: 2, kind: 'assessment',
    titleEn: 'Unit 2 Check',              titleAr: 'اختبار الوحدة الثانية',
    unitTitleEn: 'Modal Verbs → Pronouns',
    unitTitleAr: 'الأفعال الناقصة → الضمائر' },
  // ─── Unit 3: Present Tenses → Questions ──────────────────────────────────
  { pos: 17, slug: 'a1-present-tenses-1',         unit: 3, kind: 'lesson',
    titleEn: 'Present Tenses 1',          titleAr: 'المضارع 1',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
  { pos: 18, slug: 'a1-present-tenses-2',         unit: 3, kind: 'lesson',
    titleEn: 'Present Tenses 2',          titleAr: 'المضارع 2',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
  { pos: 19, slug: 'a1-present-tenses-3',         unit: 3, kind: 'lesson',
    titleEn: 'Present Tenses 3',          titleAr: 'المضارع 3',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
  { pos: 20, slug: 'a1-present-tenses-4',         unit: 3, kind: 'lesson',
    titleEn: 'Present Tenses 4',          titleAr: 'المضارع 4',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
  { pos: 21, slug: 'a1-questions-1',              unit: 3, kind: 'lesson',
    titleEn: 'Questions 1',               titleAr: 'الأسئلة 1',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
  { pos: 22, slug: 'a1-questions-2',              unit: 3, kind: 'lesson',
    titleEn: 'Questions 2',               titleAr: 'الأسئلة 2',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
  { pos: 23, slug: 'a1-unit-3-revision',          unit: 3, kind: 'revision',
    titleEn: 'Unit 3 Revision',           titleAr: 'مراجعة الوحدة الثالثة',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
  { pos: 24, slug: 'a1-unit-3-check',             unit: 3, kind: 'assessment',
    titleEn: 'Unit 3 Check',              titleAr: 'اختبار الوحدة الثالثة',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
  { pos: 25, slug: 'a1-level-check',              unit: 3, kind: 'assessment',
    titleEn: 'A1 Level Check',            titleAr: 'اختبار مستوى A1',
    unitTitleEn: 'Present Tenses → Questions',
    unitTitleAr: 'المضارع → الأسئلة' },
];

// ── Unit lesson slug lists (for revision/assessment activities) ───────────────
const UNIT_LESSONS = {
  1: ['a1-adjectives-and-adverbs','a1-articles-and-quantifiers','a1-conditionals',
      'a1-future-tenses','a1-gerund-and-infinitive','a1-past-tenses'],
  2: ['a1-modal-verbs-1','a1-modal-verbs-2','a1-modal-verbs-3',
      'a1-prepositions','a1-pronouns-1','a1-pronouns-2'],
  3: ['a1-present-tenses-1','a1-present-tenses-2','a1-present-tenses-3',
      'a1-present-tenses-4','a1-questions-1','a1-questions-2'],
};

// ── Build activities array for a given node ───────────────────────────────────
function buildActivities(node, lessonIndex) {
  const { slug, kind, unit } = node;

  if (kind === 'revision') {
    return [{ type: 'revision', unitLessons: UNIT_LESSONS[unit] }];
  }

  if (kind === 'assessment') {
    // a1-level-check covers all units
    const scope = slug === 'a1-level-check' ? 'level' : 'unit';
    const unitLessons = scope === 'level'
      ? [...UNIT_LESSONS[1], ...UNIT_LESSONS[2], ...UNIT_LESSONS[3]]
      : UNIT_LESSONS[unit];
    return [{ type: 'assessment', scope, unitLessons }];
  }

  // Regular lesson
  const activities = [];

  // Grammar
  const grammarRules = GRAMMAR_RULES[slug] || [];
  activities.push({ type: 'grammar', grammarRules });

  // Vocab
  const vocab = VOCAB_MAP[slug];
  if (vocab) {
    activities.push({
      type: 'vocab',
      topic: vocab.topic,
      category: vocab.category,
      wordRange: [vocab.wordStart, vocab.wordEnd],
    });
  }

  // Listening (every 3rd lesson to avoid repetition)
  if (lessonIndex % 3 === 0) {
    activities.push({ type: 'listen', sourceId: LISTEN_SOURCE.id, url: LISTEN_SOURCE.url, name: LISTEN_SOURCE.name });
  }

  // Reading (round-robin from 4 sources)
  const readSource = READ_SOURCES[lessonIndex % READ_SOURCES.length];
  activities.push({ type: 'read', sourceId: readSource.id, url: readSource.url, name: readSource.name });

  // Writing (only for selected lessons)
  const writing = WRITING_MAP[slug];
  if (writing) {
    activities.push({ type: 'write', topicAr: writing.topicAr, topicEn: writing.topicEn });
  }

  return activities;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (LEVEL !== 'A1') {
    console.log(`[build-path] Only A1 is supported in this version. Got: ${LEVEL}`);
    process.exit(1);
  }

  console.log(`[build-path] Level: ${LEVEL}  dry-run: ${DRY_RUN}`);
  console.log('');

  // Track real lesson index (0-based) for round-robin rotation
  let lessonIdx = 0;

  // Build plan rows
  const planRows = A1_NODES.map((node) => {
    const isLesson = node.kind === 'lesson';
    const contentSlug = isLesson ? node.slug : null;
    const content = contentSlug ? A1_LESSON_CONTENT[contentSlug] : null;
    const activities = buildActivities(node, isLesson ? lessonIdx : 0);
    if (isLesson) lessonIdx++;

    return {
      node,
      content,
      activities,
      hasContent: !!content,
    };
  });

  if (DRY_RUN) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  DRY RUN — no DB connection will be made');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Nodes that would be upserted into path_lessons:');
    console.log('');

    // Header
    const col = (s, w) => String(s ?? '').padEnd(w).slice(0, w);
    const header = `${col('pos', 4)} ${col('slug', 36)} ${col('kind', 12)} ${col('unit', 5)} ${col('steps', 50)}`;
    console.log(header);
    console.log('─'.repeat(header.length));

    for (const row of planRows) {
      const { node, activities, hasContent } = row;
      const stepTypes = activities.map((a) => a.type).join(', ');
      console.log(
        `${col(node.pos, 4)} ${col(node.slug, 36)} ${col(node.kind, 12)} ${col(node.unit, 5)} ${col(stepTypes, 50)}`
      );
      if (hasContent) {
        const c = A1_LESSON_CONTENT[node.slug];
        console.log(`     ↳ content: learn step present, ${c.grammar.length} grammar exercise(s)`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total nodes: ${planRows.length}`);
    console.log(`  Lessons with authored content: ${planRows.filter((r) => r.hasContent).length}`);
    console.log(`  Revision nodes: ${planRows.filter((r) => r.node.kind === 'revision').length}`);
    console.log(`  Assessment nodes: ${planRows.filter((r) => r.node.kind === 'assessment').length}`);
    console.log('');
    console.log('Vocabulary config (sample):');
    for (const [slug, v] of Object.entries(VOCAB_MAP).slice(0, 3)) {
      console.log(`  ${slug}: topic="${v.topic}" words=[${v.wordStart},${v.wordEnd}]`);
    }
    console.log('  … (18 lessons total)');
    console.log('');
    console.log('Writing topics:');
    for (const [slug, w] of Object.entries(WRITING_MAP)) {
      console.log(`  ${slug}: "${w.topicAr} (${w.topicEn})"`);
    }
    console.log('');
    console.log('[dry-run complete] No DB connection was made.');
    return;
  }

  // ── Live DB run ─────────────────────────────────────────────────────────────
  if (!process.env.DATABASE_URL) {
    console.error('[build-path] ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // Safety check: count progress rows for old invented slugs
    const oldSlugPattern = '^a1-\\d{2}-';
    const { rows: safetyRows } = await client.query(
      `select count(*) as n from public.user_path_progress upp
         join public.path_lessons pl on pl.id = upp.lesson_id
        where pl.slug ~ $1`,
      [oldSlugPattern]
    );
    const progressCount = parseInt(safetyRows[0].n, 10);

    if (progressCount > 0) {
      console.log(`[build-path] WARNING: ${progressCount} user_path_progress row(s) reference old invented A1 slugs.`);
      console.log('[build-path] Skipping deletion of old rows to avoid data loss.');
    } else {
      const { rowCount: deleted } = await client.query(
        `delete from public.path_lessons where slug ~ $1`,
        [oldSlugPattern]
      );
      console.log(`[build-path] Deleted ${deleted} old invented A1 row(s).`);
    }

    // Upsert all 25 path_lessons nodes
    let contentRowsInserted = 0;
    const summary = [];

    for (const row of planRows) {
      const { node, content, activities } = row;

      // Upsert lesson node
      const { rows: upserted } = await client.query(
        `insert into public.path_lessons
           (level, unit, unit_title_en, unit_title_ar, position, slug,
            title_en, title_ar, objective_en, objective_ar,
            activities, kind, published)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         on conflict (slug) do update set
           level          = excluded.level,
           unit           = excluded.unit,
           unit_title_en  = excluded.unit_title_en,
           unit_title_ar  = excluded.unit_title_ar,
           position       = excluded.position,
           title_en       = excluded.title_en,
           title_ar       = excluded.title_ar,
           objective_en   = excluded.objective_en,
           objective_ar   = excluded.objective_ar,
           activities     = excluded.activities,
           kind           = excluded.kind,
           published      = excluded.published
         returning id`,
        [
          LEVEL,
          node.unit,
          node.unitTitleEn,
          node.unitTitleAr,
          node.pos,
          node.slug,
          node.titleEn,
          node.titleAr,
          content?.objectiveEn ?? '',
          content?.objectiveAr ?? '',
          JSON.stringify(activities),
          node.kind,
          true, // published
        ]
      );

      const lessonId = upserted[0].id;
      let contentRows = 0;

      // Insert learn step for real lessons
      if (content) {
        const { rowCount } = await client.query(
          `insert into public.path_lesson_content
             (lesson_id, step, position, explanation_en, explanation_ar, examples, notes_en, notes_ar)
           values ($1, 'learn', 0, $2, $3, $4, $5, $6)
           on conflict (lesson_id, step, position) do nothing`,
          [
            lessonId,
            content.learn.explanationEn,
            content.learn.explanationAr,
            JSON.stringify(content.learn.examples),
            content.learn.notesEn ?? '',
            content.learn.notesAr ?? '',
          ]
        );
        contentRows += rowCount;
        contentRowsInserted += rowCount;
      }

      summary.push({
        slug: node.slug,
        pos: node.pos,
        kind: node.kind,
        steps: activities.map((a) => a.type).join(', '),
        contentRows,
      });
    }

    // Print summary table
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Build complete — summary');
    console.log('═══════════════════════════════════════════════════════════════');
    const col = (s, w) => String(s ?? '').padEnd(w).slice(0, w);
    console.log(`${col('pos',4)} ${col('slug',36)} ${col('kind',12)} ${col('content',8)} ${col('steps',50)}`);
    console.log('─'.repeat(115));
    for (const r of summary) {
      console.log(`${col(r.pos,4)} ${col(r.slug,36)} ${col(r.kind,12)} ${col(r.contentRows,8)} ${col(r.steps,50)}`);
    }
    console.log('');
    console.log(`Nodes upserted: ${summary.length}`);
    console.log(`Content (learn) rows inserted: ${contentRowsInserted}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[build-path] Fatal error:', err.message);
  process.exit(1);
});
