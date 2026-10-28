-- ═══════════════════════════════════════════════════════════════════════════
--  level-test-schema.sql — Venoxa Level Test tables
--
--  Run this ONCE in the Supabase Dashboard → SQL Editor → New query,
--  BEFORE level-test-seed.sql.
--
--  Tables (all prefixed lt_*):
--
--    lt_items       the question bank. Generated items are seeded as
--                   status='draft', reviewed=false; only active/reviewed rows
--                   (or drafts with LT_ALLOW_DRAFT=1) are ever served.
--                   `audio_mp3` holds pre-generated listening audio bytes; the
--                   browser never gets them directly — a short-lived signed
--                   URL exposes them via the API. `passage_text` is
--                   denormalized onto each reading item (passage_id reserved).
--
--    lt_sessions    one adaptive test attempt (state machine). Ability state
--                  lives server-side only: browser never sees difficulty,
--                  theta, correct answers or the stop internals.
--
--    lt_responses   one row per answered item; UNIQUE (session, item) makes
--                  replays impossible, UNIQUE (session, seq) makes reordering
--                  impossible.
--
--    lt_results     the finished result + certificate (cert_id VX-YYYY-XXXX-
--                  XXXX, unguessable). Contains the scores snapshot the
--                  certificate and /verify page read.
--
--  RLS is intentionally NOT enabled: the API connects with an admin role
--  (DATABASE_URL, like the users table sync) and users never touch lt_* rows
--  directly — there is nothing they should read (correct answers!). Do not
--  expose this table set through Supabase client libraries.
--
--  Safe to re-run: CREATE TABLE IF NOT EXISTS everywhere.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Item bank ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_items (
  id             text PRIMARY KEY,                      -- e.g. lt_gb1_a1b2c3d4e5f6a7b8
  type           text NOT NULL CHECK (type IN ('grammar','vocab','reading','listening')),
  cefr_tag       text NOT NULL CHECK (cefr_tag IN ('A1','A2','B1','B2','C1','C2')),
  difficulty_b   real NOT NULL,                         -- Rasch difficulty (logits)
  stem           text NOT NULL,
  options        jsonb NOT NULL DEFAULT '[]'::jsonb,    -- canonical order; randomized per session
  correct_index  smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  passage_id     text,                                  -- reserved (v1 keeps passage_text per item)
  passage_text   text,
  audio_script   text,
  audio_mp3      bytea,                                 -- listening MP3 bytes (served via signed URL)
  source         text NOT NULL DEFAULT 'ai',
  reviewed       boolean NOT NULL DEFAULT false,
  times_shown    integer NOT NULL DEFAULT 0,
  times_correct  integer NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT options_size CHECK (jsonb_array_length(options) = 4)
);
CREATE INDEX IF NOT EXISTS lt_items_bank_idx ON lt_items (status, type, cefr_tag);

-- ── 2. Sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode          text NOT NULL DEFAULT 'full' CHECK (mode IN ('full','quick')),
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','expired','abandoned')),
  server_state  jsonb NOT NULL DEFAULT '{}'::jsonb,     -- {theta, se, answeredIds[], counts{}, quickMode, currentItemId, itemsShown[]
  theta         real,                                   -- final ability (kept for recalibration)
  se            real,
  started_at    timestamptz NOT NULL DEFAULT now(),
  deadline      timestamptz NOT NULL,                   -- server-enforced time limit
  completed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS lt_sessions_user_idx ON lt_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS lt_sessions_active_idx ON lt_sessions (user_id, status);

-- ── 3. Responses ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_responses (
  id          bigserial PRIMARY KEY,
  session_id  uuid NOT NULL REFERENCES lt_sessions(id) ON DELETE CASCADE,
  item_id     text NOT NULL REFERENCES lt_items(id) ON DELETE CASCADE,
  seq         integer NOT NULL,                         -- 1-based position in the session
  choice      smallint NOT NULL CHECK (choice BETWEEN 0 AND 3), -- the user's displayed choice
  correct     boolean NOT NULL,
  time_ms     integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, item_id),                         -- no replays
  UNIQUE (session_id, seq)                              -- no fore/back-skipping
);

-- ── 4. Results / certificates ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lt_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid NOT NULL REFERENCES lt_sessions(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cert_id        text NOT NULL UNIQUE,                  -- VX-YYYY-XXXX-XXXX
  name           text NOT NULL,                         -- certificate display name (snapshot)
  level          text NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  score          smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  ci_low         smallint NOT NULL CHECK (ci_low BETWEEN 0 AND 100),
  ci_high        smallint NOT NULL CHECK (ci_high BETWEEN 0 AND 100),
  theta          real NOT NULL,
  se             real NOT NULL,
  section_scores jsonb NOT NULL DEFAULT '[]'::jsonb,    -- [{type,answered,correct,score,lowConfidence}]
  mode           text NOT NULL DEFAULT 'full' CHECK (mode IN ('full','quick')),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lt_results_user_idx ON lt_results (user_id, created_at DESC);

-- Cooldown queries look up the latest completed attempt per user:
CREATE INDEX IF NOT EXISTS lt_sessions_completed_idx
  ON lt_sessions (user_id, completed_at DESC) WHERE status = 'completed';
