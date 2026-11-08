-- ═══════════════════════════════════════════════════════════════════════════
--  Venoxa Learning Path — builder v2 migration (CHECKPOINT 2)
--
--  Run order:
--    (1) migrations/learning-path.sql      — creates all tables and RLS
--    (2) migrations/path-lesson-steps.sql  — adds status column, step pipeline
--    (3) migrations/path-builder-v2.sql    — this file (grammar cache table +
--                                            idempotent cleanup of old rows)
--
--  Safe to re-run. Never DROPs any table or column. Never touches rows that
--  have user_path_progress references.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Grammar explanation cache ────────────────────────────────────────────
--  rule_hash = sha256(rule_text || lang)  — computed by the builder process.
--  This table is populated lazily when the API first serves an explanation;
--  RLS is enabled with no policies, so only the DATABASE_URL server role can
--  read or write it.

create table if not exists public.path_lesson_explanations (
  rule_hash    text primary key,          -- sha256(rule_text || lang)
  rule_text    text not null,
  lang         text not null check (lang in ('en', 'ar')),
  explanation  text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at in sync automatically when the row is touched.
-- Use a DO block so this is idempotent (function may already exist).
do $$
begin
  if not exists (
    select 1 from pg_proc
     where proname = 'set_updated_at'
       and pronamespace = (select oid from pg_namespace where nspname = 'public')
  ) then
    execute $fn$
      create function public.set_updated_at()
      returns trigger language plpgsql as $body$
      begin
        new.updated_at := now();
        return new;
      end;
      $body$;
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
     where tgname = 'path_lesson_explanations_updated_at'
  ) then
    execute $tr$
      create trigger path_lesson_explanations_updated_at
        before update on public.path_lesson_explanations
        for each row execute procedure public.set_updated_at();
    $tr$;
  end if;
end $$;

-- ── 2. RLS on explanations table (no policies = server-only via DATABASE_URL)
alter table public.path_lesson_explanations enable row level security;

comment on table public.path_lesson_explanations is
  'Grammar-rule explanation cache keyed by sha256(rule_text||lang). '
  'Populated lazily by the API; no Supabase client policies — server role only.';

-- ── 3. Idempotent cleanup: remove old invented A1 outline rows ───────────────
--  These slugs were the placeholder "a1-01-…" through "a1-20-…" rows that
--  shipped in learning-path.sql before Checkpoint 2 replaced them with the
--  25 real authored slugs. We only delete them when no user has progress on
--  them (NOT EXISTS subquery). The A2–C1 outline rows at positions 21-60
--  are also refreshed to avoid slug conflicts when real content ships later.
--
--  Real A1 slugs (positions 1-25) are upserted by build-path-from-content.mjs
--  and must NOT be deleted here.

-- Delete old A1 invented rows (slugs like a1-01-*, a1-02-*, … a1-20-*)
-- only when user_path_progress has zero rows referencing them.
delete from public.path_lessons
where slug ~ '^a1-\d{2}-'
  and not exists (
    select 1 from public.user_path_progress upp
     where upp.lesson_id = path_lessons.id
  );

-- Delete old A2–C1 outline rows (slugs a2-01- … c1-10-assessment) only
-- when they have no user progress. The builder script will re-insert fresh
-- outline rows if needed; for now we keep them if any user has started them.
delete from public.path_lessons
where slug ~ '^(a2|b1|b2|c1)-\d{2}-'
  and published = false
  and not exists (
    select 1 from public.user_path_progress upp
     where upp.lesson_id = path_lessons.id
  );

-- ═══════════════════════════════════════════════════════════════════════════
--  End of path-builder-v2.sql
-- ═══════════════════════════════════════════════════════════════════════════
