-- ═══════════════════════════════════════════════════════════════════════════
--  Venoxa Learning Path — schema migration (CHECKPOINT 2)
--
--  Run ONCE in Supabase Dashboard → SQL Editor → New query.
--  Companion to supabase-schema.sql (public.users) and level-test.sql (lt_*).
--  Additive and idempotent: this file only creates new objects and outline
--  rows; re-running it is safe. It never drops tables, columns or rows and it
--  never touches private.users/progress data.
--
--  Security model (identical to level-test.sql)
--  ------------------------------
--  The Learning Path API connects with DATABASE_URL (a Postgres role that
--  owns these tables and therefore bypasses RLS) and is the ONLY reader/
--  writer of lesson content and answer keys. RLS is enabled on every table.
--  path_lessons / path_lesson_content / path_lesson_exercises get NO policies:
--  the anon/authenticated Supabase clients cannot read them at all, so
--  answer_key Explanation text can never leak through the database.
--  user_path_progress / user_path_state get a single SELECT-your-own-row
--  policy per the redesign spec (§4); every write goes through the API.
--
--  Lesson ordering is linear by `position` (A1 seeds use 1..20 in a separate
--  idempotent seed file; outline rows below start at 21).
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Lessons (linear order; `position` is the global sequence) ──────────────
create table if not exists public.path_lessons (
  id             uuid primary key default gen_random_uuid(),
  level          text not null check (level in ('A1','A2','B1','B2','C1')),
  unit           integer not null,
  unit_title_en  text not null default '',
  unit_title_ar  text not null default '',
  position       integer not null unique check (position between 1 and 100000),
  slug           text not null unique,
  title_en       text not null,
  title_ar       text not null,
  objective_en   text not null default '',
  objective_ar   text not null default '',
  -- Blueprint: which steps this lesson shows and their config, e.g.
  -- [{"type":"grammar"},{"type":"vocab","config":{"source":"langeek","words":5}},...]
  activities     jsonb not null default '[]'::jsonb,
  pass_score     integer not null default 70 check (pass_score between 1 and 100),
  kind           text not null default 'lesson' check (kind in ('lesson','assessment','revision')),
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists path_lessons_order_idx
  on public.path_lessons (position);
create index if not exists path_lessons_level_idx
  on public.path_lessons (level, position) where published;

-- ── Authored lesson content (stored, NOT AI-generated; EN + AR) ─────────────
create table if not exists public.path_lesson_content (
  id              uuid primary key default gen_random_uuid(),
  lesson_id       uuid not null references public.path_lessons(id) on delete cascade,
  step            text not null check (step in ('grammar','vocab','listening','pronunciation','practice','check')),
  position        integer not null default 0,
  explanation_en  text not null default '',
  explanation_ar  text not null default '',
  -- [{ "en": "...", "ar": "..." }]
  examples        jsonb not null default '[]'::jsonb,
  notes_en        text not null default '',
  notes_ar        text not null default '',
  config          jsonb not null default '{}'::jsonb,
  unique (lesson_id, step, position)
);

create index if not exists path_lesson_content_lesson_idx
  on public.path_lesson_content (lesson_id, position);

-- ── Exercises — answer_key NEVER leaves the server ──────────────────────────
create table if not exists public.path_lesson_exercises (
  id              uuid primary key default gen_random_uuid(),
  lesson_id       uuid not null references public.path_lessons(id) on delete cascade,
  -- 'practice' rows are graded transiently for instant feedback; only
  -- 'check' rows count towards completion and the unlock.
  step            text not null default 'check' check (step in ('practice','check')),
  -- multiple_choice:  answer_key {"index": n}, submitted index
  -- true_false:       answer_key {"value": bool}
  -- type_answer:      answer_key {"accept": ["a","an"]} (any-of, normalized)
  -- fill_blank:       answer_key {"accept": [...]} (same semantics)
  -- word_order:       answer_key {"order": ["She","is","here"]}
  -- match:            answer_key {"pairs": [[l,r],[l,r]]}
  type            text not null check (type in ('multiple_choice','true_false','type_answer','fill_blank','word_order','match')),
  prompt_en       text not null,
  prompt_ar       text not null default '',
  options         jsonb not null default '[]'::jsonb,
  answer_key      jsonb not null,
  explanation_en  text not null default '',
  explanation_ar  text not null default '',
  position        integer not null default 0,
  unique (lesson_id, position)
);

create index if not exists path_lesson_exercises_lesson_idx
  on public.path_lesson_exercises (lesson_id, position);

-- ── Per-user progress (written ONLY by the API) ──────────────────────────────
create table if not exists public.user_path_progress (
  user_id       uuid not null references public.users(id) on delete cascade,
  lesson_id     uuid not null references public.path_lessons(id) on delete cascade,
  status        text not null default 'unlocked' check (status in ('unlocked','completed')),
  best_score    integer not null default 0 check (best_score between 0 and 100),
  attempts      integer not null default 0,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists user_path_progress_user_idx
  on public.user_path_progress (user_id);
create index if not exists user_path_progress_lesson_idx
  on public.user_path_progress (lesson_id);

-- ── Per-user path state (placement + current lesson pointer) ────────────────
create table if not exists public.user_path_state (
  user_id            uuid primary key references public.users(id) on delete cascade,
  placement_level    text not null default 'A1' check (placement_level in ('A1','A2','B1','B2','C1')),
  -- Certificates keep their own lives: if a lt_results row is ever deleted the
  -- placement survives (on delete set null below, added idempotently in a DO
  -- block so this file also works when level-test.sql has not run yet).
  placement_source   uuid,
  current_lesson_id  uuid references public.path_lessons(id) on delete set null,
  updated_at         timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'lt_results'
  )
  and not exists (
    select 1 from information_schema.table_constraints
     where table_schema = 'public' and table_name = 'user_path_state'
       and constraint_name = 'user_path_state_placement_source_fkey'
  )
  then
    execute 'alter table public.user_path_state
             add constraint user_path_state_placement_source_fkey
             foreign key (placement_source) references public.lt_results(session_id)
             on delete set null';
  end if;
end $$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.path_lessons          enable row level security;
alter table public.path_lesson_content   enable row level security;
alter table public.path_lesson_exercises enable row level security;
alter table public.user_path_progress    enable row level security;
alter table public.user_path_state       enable row level security;

-- Content tables get NO policies on purpose (server-only, like lt_*).
-- The API's DATABASE_URL role owns the tables and bypasses RLS.

-- Users may READ their own progress/state rows only; without insert/update
-- policies every client write is refused — the API is the only writer.
drop policy if exists user_path_progress_select_own on public.user_path_progress;
create policy user_path_progress_select_own
  on public.user_path_progress
  for select
  using (auth.uid() = user_id);

drop policy if exists user_path_state_select_own on public.user_path_state;
create policy user_path_state_select_own
  on public.user_path_state
  for select
  using (auth.uid() = user_id);

-- ── Comments ────────────────────────────────────────────────────────────────
comment on table public.path_lessons is
  'Venoxa Learning Path lessons (linear by position). Unpublished rows are visible outlines ("coming soon") served by the API only.';
comment on table public.path_lesson_content is
  'Stored (not AI) lesson explanations in English + Arabic; served via the API, never through RLS.';
comment on table public.path_lesson_exercises is
  'Server-graded exercises. answer_key must NEVER be sent to any client.';
comment on table public.user_path_progress is
  'Lesson completion/scores. Written only by the path API after requireUser(); clients hold a select-own-row policy.';
comment on table public.user_path_state is
  'Placement (from lt_results when used) + the current-lesson frontier pointer. Locked lessons are refused server-side (403).';

-- ═══════════════════════════════════════════════════════════════════════════
--  Unpublished outline placeholders — A2 / B1 / B2 / C1 (§6: no invented
--  lesson content). Positions 21..60; A1 (1..20) is seeded separately with
--  its authored content and published there. Re-running this block is a
--  no-op (ON CONFLICT (slug) DO NOTHING).
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.path_lessons
  (level, unit, unit_title_en, unit_title_ar, position, slug, title_en, title_ar, objective_en, objective_ar, kind, pass_score, published)
values
  -- A2 · position 21..30 ────────────────────────────────────────────────────
  ('A2', 1, 'Everyday routines', 'الروتين اليومي', 21, 'a2-01-past-simple',      'Past Simple: regular & irregular verbs',              'الماضي البسيط: الأفعال المنتظمة والشاذة',   'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 1, 'Everyday routines', 'الروتين اليومي', 22, 'a2-02-past-questions',  'Past Simple: questions & negatives',                  'الماضي البسيط: الأسئلة والنفي',              'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 1, 'Everyday routines', 'الروتين اليومي', 23, 'a2-03-future-will',     'Talking about the future: will & going to',           'الحديث عن المستقبل: will و going to',        'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 1, 'Everyday routines', 'الروتين اليومي', 24, 'a2-04-comparatives',    'Comparatives & superlatives',                         'صيغ المقارنة والتفضيل',                      'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 1, 'Everyday routines', 'الروتين اليومي', 25, 'a2-05-adverbs',         'Adverbs: frequency & manner',                         'الظروف: تكرار الحدث وكيفيته',                'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 2, 'Experiences & plans', 'التجارب والخطط', 26, 'a2-06-present-perfect', 'Present Perfect: life experiences',                'المضارع التام: التجارب السابقة',             'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 2, 'Experiences & plans', 'التجارب والخطط', 27, 'a2-07-quantifiers',   'Countable, uncountable & quantifiers',                'المعدود وغير المعدود وأدوات الكمية',         'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 2, 'Experiences & plans', 'التجارب والخطط', 28, 'a2-08-connectors',    'Connectors: and, but, because, so, or',               'أدوات الربط: and، but، because، so',          'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 2, 'Experiences & plans', 'التجارب والخطط', 29, 'a2-09-arrangements',  'Present Continuous for future arrangements',          'المضارع المستمر للتعبير عن المستقبل',        'Sequenced A2 lesson (outline). Full content ships with the A2 release.', 'درس A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'lesson', 70, false),
  ('A2', 3, 'Level check', 'المراجعة النهائية', 30, 'a2-10-assessment',      'A2 assessment',                                       'اختبار نهاية مستوى A2',                      'Wrap-up assessment for A2 (outline). Full content ships with the A2 release.', 'اختبار ختامي لمستوى A2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى A2.', 'assessment', 70, false),

  -- B1 · position 31..40 ────────────────────────────────────────────────────
  ('B1', 1, 'Stories & time', 'الحكايات والزمن', 31, 'b1-01-past-continuous',       'Past continuous vs. past simple',          'الماضي المستمر مقابل الماضي البسيط',        'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 1, 'Stories & time', 'الحكايات والزمن', 32, 'b1-02-perfect-vs-past',       'Present Perfect vs. Past Simple',          'المضارع التام مقابل الماضي البسيط',         'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 1, 'Stories & time', 'الحكايات والزمن', 33, 'b1-03-perfect-continuous',    'Present Perfect Continuous',               'المضارع التام المستمر',                     'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 1, 'Stories & time', 'الحكايات والزمن', 34, 'b1-04-used-to',               'used to & would: past habits',             'تعبيرا used to و would لعادات الماضي',       'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 1, 'Stories & time', 'الحكايات والزمن', 35, 'b1-05-relative-clauses',      'Relative clauses: who, which, that',       'الجمل الوصفية: who، which، that',            'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 2, 'Rules & possibility', 'القواعد والاحتمال', 36, 'b1-06-first-conditional',  'First conditional & future time clauses',  'الشرط الأول وعبارات الوقت للمستقبل',        'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 2, 'Rules & possibility', 'القواعد والاحتمال', 37, 'b1-07-modals-obligation',  'Modals of obligation: must, have to, should', 'أفعال الوجوب: must و have to و should',     'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 2, 'Rules & possibility', 'القواعد والاحتمال', 38, 'b1-08-passive',            'Passive voice: present & past',            'المبني للمجهول: المضارع والماضي',            'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 2, 'Rules & possibility', 'القواعد والاحتمال', 39, 'b1-09-reported-basics',    'Reported speech: basics',                  'الخطاب غير المباشر: الأساسيات',             'Sequenced B1 lesson (outline). Full content ships with the B1 release.', 'درس B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'lesson', 70, false),
  ('B1', 3, 'Level check', 'المراجعة النهائية', 40, 'b1-10-assessment',            'B1 assessment',                            'اختبار نهاية مستوى B1',                     'Wrap-up assessment for B1 (outline). Full content ships with the B1 release.', 'اختبار ختامي لمستوى B1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B1.', 'assessment', 70, false),

  -- B2 · position 41..50 ────────────────────────────────────────────────────
  ('B2', 1, 'Looking back & forward', 'الماضي والمستقبل', 41, 'b2-01-past-perfect',       'Past Perfect & narrative tenses',        'الماضي التام وأزمنة السرد',                 'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 1, 'Looking back & forward', 'الماضي والمستقبل', 42, 'b2-02-future-forms',       'Future continuous & future perfect',     'المستقبل المستمر والمستقبل التام',         'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 1, 'Looking back & forward', 'الماضي والمستقبل', 43, 'b2-03-conditionals-2-3',   'Second & third conditional',             'الشرط الثاني والثالث',                      'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 1, 'Looking back & forward', 'الماضي والمستقبل', 44, 'b2-04-wish',               'wish / if only / would rather',          'التمني: wish و if only و would rather',      'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 2, 'Structures in depth', 'التراكيب بتفصيل', 45, 'b2-05-passive-range',         'Passive across tenses & causative have', 'المبني للمجهول في كل الأزمنة وتعبير causative have', 'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 2, 'Structures in depth', 'التراكيب بتفصيل', 46, 'b2-06-modals-deduction',      'Modals of deduction & regret',           'أفعال الاستنتاج والندم',                    'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 2, 'Structures in depth', 'التراكيب بتفصيل', 47, 'b2-07-relative-advanced',     'Advanced relative clauses: whom, whose, where', 'الجمل الوصفية المتقدمة: whom و whose و where', 'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 2, 'Structures in depth', 'التراكيب بتفصيل', 48, 'b2-08-reported-full',         'Reported speech: the full range',        'الخطاب غير المباشر: الصور الكاملة',         'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 3, 'Level check', 'المراجعة النهائية', 49, 'b2-09-articles-precision', 'Articles & determiners: precision',      'أدوات التعريف والتنكير بدقة',                'Sequenced B2 lesson (outline). Full content ships with the B2 release.', 'درس B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'lesson', 70, false),
  ('B2', 3, 'Level check', 'المراجعة النهائية', 50, 'b2-10-assessment',         'B2 assessment',                          'اختبار نهاية مستوى B2',                     'Wrap-up assessment for B2 (outline). Full content ships with the B2 release.', 'اختبار ختامي لمستوى B2 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى B2.', 'assessment', 70, false),

  -- C1 · position 51..60 ────────────────────────────────────────────────────
  ('C1', 1, 'Nuance & emphasis', 'الفروق الدقيقة والتركيز', 51, 'c1-01-inversion',         'Inversion & emphasis structures',        'تراكيب القلب والتركيز',                     'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 1, 'Nuance & emphasis', 'الفروق الدقيقة والتركيز', 52, 'c1-02-cleft',             'Cleft sentences for focus',              'جمل cleft للتركيز',                          'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 1, 'Nuance & emphasis', 'الفروق الدقيقة والتركيز', 53, 'c1-03-subjunctive',       'Subjunctive & formal register',          'صيغة subjunctive والسجل الرسمي',              'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 1, 'Nuance & emphasis', 'الفروق الدقيقة والتركيز', 54, 'c1-04-mixed-conditionals', 'Mixed & advanced conditionals',          'الشرط المختلط والمتقدم',                    'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 2, 'Complex sentences', 'الجمل المعقدة', 55, 'c1-05-participle-clauses', 'Participle & reduced clauses',           'عبارات النعت المختصرة',                     'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 2, 'Complex sentences', 'الجمل المعقدة', 56, 'c1-06-noun-clauses',       'Noun clauses & reported structures',     'جمل الأسماء وتراكيب النقل',                 'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 2, 'Complex sentences', 'الجمل المعقدة', 57, 'c1-07-concession',         'Concession & contrast: despite, whereas', 'التنازل والتضاد: despite و whereas',          'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 2, 'Complex sentences', 'الجمل المعقدة', 58, 'c1-08-hedging',            'Hedging & academic style',               'الحذر وأسلوب النص الأكاديمي',               'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 3, 'Level check', 'المراجعة النهائية', 59, 'c1-09-verb-patterns',      'Gerunds & infinitives (advanced)',       'المصادر والـ gerund في التراكيب المتقدمة',   'Sequenced C1 lesson (outline). Full content ships with the C1 release.', 'درس C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'lesson', 70, false),
  ('C1', 3, 'Level check', 'المراجعة النهائية', 60, 'c1-10-assessment',         'C1 assessment',                          'اختبار نهاية مستوى C1',                     'Wrap-up assessment for C1 (outline). Full content ships with the C1 release.', 'اختبار ختامي لمستوى C1 (مخطط أولي). يُنشر المحتوى الكامل مع إطلاق المستوى C1.', 'assessment', 70, false)
on conflict (slug) do nothing;
