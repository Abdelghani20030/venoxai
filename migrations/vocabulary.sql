-- ═══════════════════════════════════════════════════════════════════════════
--  Venoxa Vocabulary — canonical classification schema (additive, v1)
--
--  Apply with:  node scripts/apply-sql.mjs migrations/vocabulary.sql
--  Seed with:   node scripts/apply-sql.mjs migrations/vocabulary-seed.sql
--
--  Source dataset: LanGeek A1→C1 thematic list (8,840 senses / 6,802 unique
--  words / 208 category-level rows), recovered from git history at 0981f50
--  and normalized by scripts/build-vocab.mjs.
--
--  Model
--  ────
--  vocab_categories  one row per (category name, CEFR level). LanGeek
--                    categories are mostly level-exclusive; the few that
--                    reappear across levels (Transportation, Time, …) get a
--                    row per level so unit mapping stays clean.
--  vocab_senses      one row per (word, level, category) sense — the same
--                    surface word legitimately appears at several levels with
--                    different meanings ("please" A1 greeting vs B2 verb).
--  vocab_grammar_rules  curated CEFR grammar topics (code, titles, blurb).
--  vocab_sense_grammar  which grammar topics a sense is taught WITH (1–3 per
--                    sense), derived deterministically from level + category
--                    group + part of speech (scripts/vocab-grammar-map.mjs).
--  path_lesson_vocab planned join for the learning path: lessons pull their
--                    word lists from here (populated when path units expand).
--
--  Security model: identical to the learning path — RLS enabled with NO
--  policies; the API (DATABASE_URL role) is the only reader/writer, so raw
--  word rows never need to be user-readable. SRS/progress lives elsewhere.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Categories (one row per category × level) ──────────────────────────────
create table if not exists public.vocab_categories (
  id          integer primary key,
  slug        text not null,
  level       text not null check (level in ('A1','A2','B1','B2','C1')),
  name        text not null,
  name_ar     text,
  icon        text,                                  -- svg asset name, optional
  word_count  integer not null default 0,
  unique (slug, level)
);
create index if not exists vocab_categories_level_idx
  on public.vocab_categories (level, word_count desc);

-- ── Senses (word × level × category, with meaning/example/ar) ──────────────
create table if not exists public.vocab_senses (
  id          integer primary key,                   -- stable, from the seed
  source_key  text not null unique,                  -- 'A1|family|hello' (disambiguated)
  word        text not null,
  word_norm   text not null,                         -- lowercase for search/dedupe
  pos         text not null default '',              -- n. v. adj. adv. prep. pron. num. conj. det. intj. phr.
  level       text not null check (level in ('A1','A2','B1','B2','C1')),
  category_id integer not null references public.vocab_categories(id) on delete cascade,
  meaning     text not null default '',
  example     text not null default '',
  meaning_ar  text,
  example_ar  text,
  sort        integer not null default 0             -- stable teaching order
);
create index if not exists vocab_senses_word_idx   on public.vocab_senses (word_norm);
create index if not exists vocab_senses_level_idx  on public.vocab_senses (level, category_id, sort);
create index if not exists vocab_senses_pos_idx    on public.vocab_senses (level, pos);

-- ── Grammar rules (curated CEFR topics) ────────────────────────────────────
create table if not exists public.vocab_grammar_rules (
  id        integer primary key,
  code      text not null unique,                      -- 'A1-PRES-AFF'
  level     text not null check (level in ('A1','A2','B1','B2','C1')),
  title_en  text not null,
  title_ar  text,
  blurb     text not null default '',
  sort      integer not null default 0
);
create index if not exists vocab_grammar_rules_level_idx
  on public.vocab_grammar_rules (level, sort);

-- ── Sense ↔ grammar-rule links (1–3 rules per sense) ───────────────────────
create table if not exists public.vocab_sense_grammar (
  sense_id integer not null references public.vocab_senses(id) on delete cascade,
  rule_id  integer not null references public.vocab_grammar_rules(id) on delete cascade,
  primary key (sense_id, rule_id)
);
create index if not exists vocab_sense_grammar_rule_idx
  on public.vocab_sense_grammar (rule_id);

-- ── Learning-path join (populated when path units expand to the blueprint) ─
create table if not exists public.path_lesson_vocab (
  lesson_id uuid not null references public.path_lessons(id) on delete cascade,
  sense_id  integer not null references public.vocab_senses(id) on delete cascade,
  order_in_lesson integer not null default 0,
  primary key (lesson_id, sense_id)
);
create index if not exists path_lesson_vocab_lesson_idx
  on public.path_lesson_vocab (lesson_id, order_in_lesson);

-- ── RLS: server-only tables (no policies, same model as path_*) ────────────
alter table public.vocab_categories     enable row level security;
alter table public.vocab_senses         enable row level security;
alter table public.vocab_grammar_rules  enable row level security;
alter table public.vocab_sense_grammar  enable row level security;
alter table public.path_lesson_vocab    enable row level security;

-- ── Comments ───────────────────────────────────────────────────────────────
comment on table public.vocab_categories is
  'Canonical vocabulary categories, one row per category name × CEFR level (LanGeek source).';
comment on table public.vocab_senses is
  'Canonical word senses: one row per (word, level, category). meaning_ar/example_ar filled by the translation pipeline.';
comment on table public.vocab_grammar_rules is
  'Curated CEFR grammar topics; senses link to 1-3 rules via vocab_sense_grammar.';
comment on table public.vocab_sense_grammar is
  'Deterministic mapping (level × category-group × pos) computed by scripts/build-vocab.mjs.';
comment on table public.path_lesson_vocab is
  'Ordered word lists per learning-path lesson; filled by the path unit expansion.';
