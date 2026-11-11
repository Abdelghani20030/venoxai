-- ═══════════════════════════════════════════════════════════════════════════
--  Venoxa Learning Path — schema migration (redesign rebuild)
--
--  Apply with:  node scripts/apply-sql.mjs migrations/learning-path.sql
--
--  ⚠ DESTRUCTIVE BY DESIGN: this rebuild REPLACES the tables of the abandoned
--  November-8 path build (path_lessons, path_lesson_content,
--  path_lesson_exercises, path_lesson_explanations, user_path_progress,
--  user_path_state, user_path_step_progress). That build was wiped from the
--  codebase at the owner's request and its rows (25 placeholder-derived A1
--  lessons that did not match the showcase titles) are superseded by
--  migrations/learning-path-seed.sql. The level-test tables (lt_*) and
--  public.users are untouched.
--
--  Security model (same as the level test)
--  ---------------------------------------
--  The API connects with DATABASE_URL (a role that bypasses RLS) and is the
--  only reader/writer. RLS is enabled with NO policies, so anon/authenticated
--  Supabase clients cannot read lesson content, exercises, answer keys or any
--  progress rows directly — correct answers and locked content only ever
--  travel through the API's graded endpoints (spec §8.3).
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Drop the abandoned prior-build tables (idempotent) ─────────────────────
drop table if exists public.user_path_step_progress   cascade;
drop table if exists public.path_lesson_explanations  cascade;
drop table if exists public.path_lesson_exercises     cascade;
drop table if exists public.path_lesson_content       cascade;
drop table if exists public.user_path_progress        cascade;
drop table if exists public.user_path_state           cascade;
drop table if exists public.path_lessons              cascade;

-- ── Levels (A1 → C1; the showcase has no C2) ───────────────────────────────
drop table if exists public.path_levels cascade;
create table public.path_levels (
  code        text primary key check (code in ('A1','A2','B1','B2','C1')),
  title       text not null,
  tagline     text not null default '',
  order_index integer not null unique
);

-- ── Units (~4 lessons each, "UNIT 1 · Getting started") ────────────────────
create table public.path_units (
  id          uuid primary key default gen_random_uuid(),
  level_code  text not null references public.path_levels(code) on delete cascade,
  order_index integer not null,
  title       text not null,
  unique (level_code, order_index)
);

-- ── Lessons (steps are ordered JSON definitions; content refs by step) ─────
create table public.path_lessons (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  level_code  text not null references public.path_levels(code) on delete cascade,
  unit_id     uuid not null references public.path_units(id) on delete cascade,
  order_index integer not null,            -- position within the level (zig-zag order)
  lesson_no   integer,                     -- "Lesson 4 of 20" numbering; null for recap/check nodes
  title       text not null,
  subtitle    text not null default '',    -- chip text source, e.g. "Grammar · A1"
  objective   text not null default '',
  est_minutes integer not null default 10,
  kind        text not null default 'lesson' check (kind in ('lesson','revision','assessment')),
  steps       jsonb not null default '[]'::jsonb,
  pass_score  integer not null default 70 check (pass_score between 0 and 100),
  xp_reward   integer not null default 40, -- lessons: 40 (+bonus); assessments: 60 (see path-rules.ts)
  status      text not null default 'draft' check (status in ('draft','published')),
  created_at  timestamptz not null default now(),
  unique (level_code, order_index)
);

create index if not exists path_lessons_order_idx
  on public.path_lessons (level_code, order_index)
  where status = 'published';
create index if not exists path_lessons_unit_idx
  on public.path_lessons (unit_id, order_index);

-- ── Exercises — the answer column is SERVER-ONLY (never selected publicly) ─
create table public.path_exercises (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.path_lessons(id) on delete cascade,
  step_index   integer not null check (step_index >= 0),  -- index into path_lessons.steps
  order_index  integer not null,
  type         text not null check (type in ('mcq','type_in','listen_mcq','order')),
  prompt       text not null,
  options      jsonb,                                     -- mcq/listen_mcq: string[]
  answer       jsonb not null,                            -- mcq/listen_mcq: index; type_in: string[]; order: string[]
  explanation  text not null default '',
  audio_script text,                                      -- listen_mcq: spoken via the TTS chain
  unique (lesson_id, order_index)
);

create index if not exists path_exercises_lesson_idx
  on public.path_exercises (lesson_id, step_index, order_index);

-- ── Per-user lesson progress ───────────────────────────────────────────────
create table public.user_path_progress (
  user_id      uuid not null references public.users(id) on delete cascade,
  lesson_id    uuid not null references public.path_lessons(id) on delete cascade,
  status       text not null default 'current' check (status in ('current','completed')),
  best_score   integer check (best_score is null or best_score between 0 and 100),
  attempts     integer not null default 0,
  xp_awarded   integer not null default 0,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists user_path_progress_user_idx
  on public.user_path_progress (user_id, status);

-- ── Per-user path state (one current lesson, placement origin, XP, streak) ─
create table public.user_path_state (
  user_id           uuid primary key references public.users(id) on delete cascade,
  current_lesson_id uuid references public.path_lessons(id) on delete set null,
  start_level       text not null default 'A1' references public.path_levels(code),
  placement_source  text not null default 'default'
                    check (placement_source in ('default','level_test','manual')),
  xp_total          integer not null default 0,
  streak_current    integer not null default 0,
  streak_last_date  date,
  updated_at        timestamptz not null default now()
);

-- ── RLS: server-only tables (no policies, same model as lt_*) ──────────────
alter table public.path_levels         enable row level security;
alter table public.path_units          enable row level security;
alter table public.path_lessons        enable row level security;
alter table public.path_exercises      enable row level security;
alter table public.user_path_progress  enable row level security;
alter table public.user_path_state     enable row level security;

-- ── Comments ───────────────────────────────────────────────────────────────
comment on table public.path_lessons is
  'Learning-path curriculum. steps is an ordered JSON array of step definitions; exercises reference a step by step_index. Draft rows are outlines awaiting owner review (spec §7).';
comment on table public.path_exercises is
  'Lesson exercises. answer/explanation are server-only: the API strips them from every client response and only reveals them after grading.';
comment on table public.user_path_progress is
  'One row per user+lesson. status=completed rows are the unlock chain; API-only writes.';
comment on table public.user_path_state is
  'One row per user: the single current lesson (server-enforced, spec §6.1), placement origin, XP total and server-side streak.';
