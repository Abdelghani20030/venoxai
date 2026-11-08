-- ═══════════════════════════════════════════════════════════════════════════
--  Venoxa Learning Path — lesson-step pipeline (Phase 2, additive)
--
--  Run AFTER migrations/learning-path.sql. Safe to run more than once.
--
--  Adds:
--   1. The approved lesson-player step vocabulary (Learn, Words, Listen/Read,
--      Write, Practice, Check) to path_lesson_content.step.
--   2. A draft → approved lifecycle for path_lesson_exercises. Generated
--      questions land as `draft`; only `approved` questions are served and
--      graded. Answer keys never leave the server.
--   3. Optional-step completion + XP records. Optional steps never gate
--      progress. Only the Check step (or Learn when no approved Check exists)
--      can complete a lesson.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Lesson content steps ────────────────────────────────────────────────
do $$
begin
  if exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'path_lesson_content'
  ) then
    alter table public.path_lesson_content
      drop constraint if exists path_lesson_content_step_check;
    alter table public.path_lesson_content
      add constraint path_lesson_content_step_check
      check (step in (
        'learn', 'words', 'listen', 'read', 'write',
        'grammar', 'vocab', 'listening', 'pronunciation',
        'practice', 'check'
      ));
  end if;
end $$;

-- ── 2. Exercise review lifecycle ───────────────────────────────────────────
alter table public.path_lesson_exercises
  add column if not exists status text not null default 'draft';

do $$
begin
  if exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'path_lesson_exercises'
  )
  and not exists (
    select 1 from pg_constraint
     where conrelid = 'public.path_lesson_exercises'::regclass
       and conname = 'path_lesson_exercises_status_check'
  ) then
    alter table public.path_lesson_exercises
      add constraint path_lesson_exercises_status_check
      check (status in ('draft', 'approved', 'retired'));
  end if;
end $$;

create index if not exists path_lesson_exercises_approved_idx
  on public.path_lesson_exercises (lesson_id, step, position)
  where status = 'approved';

-- ── 3. Optional step completion + XP ───────────────────────────────────────
create table if not exists public.user_path_step_progress (
  user_id      uuid not null references public.users(id) on delete cascade,
  lesson_id    uuid not null references public.path_lessons(id) on delete cascade,
  step         text not null check (step in ('learn', 'words', 'listen', 'read', 'write', 'practice')),
  xp           integer not null default 0 check (xp between 0 and 100),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id, step)
);

create index if not exists user_path_step_progress_user_idx
  on public.user_path_step_progress (user_id);
create index if not exists user_path_step_progress_lesson_idx
  on public.user_path_step_progress (lesson_id);

alter table public.user_path_step_progress enable row level security;

drop policy if exists user_path_step_progress_select_own on public.user_path_step_progress;
create policy user_path_step_progress_select_own
  on public.user_path_step_progress
  for select
  using (auth.uid() = user_id);

comment on table public.path_lesson_content is
  'Authored lesson steps (EN + AR). step ∈ learn/words/listen/read/write/practice/check.';
comment on column public.path_lesson_exercises.status is
  'draft = generated, needs review; approved = served + graded; retired = hidden.';
comment on table public.user_path_step_progress is
  'Optional lesson-step completions. XP is display-only and never gates progress.';
