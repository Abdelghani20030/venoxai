-- ═══════════════════════════════════════════════════════════════════════════
--  InsForge Database Schema for Venoxa
--  Run this SQL in your InsForge project dashboard → SQL Editor
--
--  This creates 5 tables mirroring the old Firestore subcollection structure:
--    users          ← profile, streak, level, xp, avatar, achievements
--    user_vocab     ← all 5 vocabulary sections
--    user_progress  ← completed cells, usage time, plan config, etc.
--    user_history   ← speaking & writing history
--    user_srs       ← all 5 SRS data stores (3 more than Firebase had!)
--
--  Row Level Security ensures users can only access their own data.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
--  1. Main users profile table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  username      TEXT DEFAULT 'New Learner' NOT NULL,
  avatar        TEXT DEFAULT '',
  dob           TEXT DEFAULT '',
  gender        TEXT DEFAULT '',
  languages     JSONB DEFAULT '[]'::jsonb NOT NULL,
  level         TEXT DEFAULT 'B2' NOT NULL,
  streak        INTEGER DEFAULT 0 NOT NULL,
  xp            INTEGER DEFAULT 0 NOT NULL,
  achievements  JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
--  2. Vocabulary data (all 5 vocab sections)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_vocab (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  global_vocab        JSONB DEFAULT '[]'::jsonb NOT NULL,
  phrasal_vocab       JSONB DEFAULT '[]'::jsonb NOT NULL,
  idioms_vocab        JSONB DEFAULT '[]'::jsonb NOT NULL,
  idioms_proper_vocab JSONB DEFAULT '[]'::jsonb NOT NULL,
  langeek_vocab       JSONB DEFAULT '[]'::jsonb NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
--  3. Progress tracking
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  completed_cells JSONB DEFAULT '{}'::jsonb NOT NULL,
  usage_time      JSONB DEFAULT '{}'::jsonb NOT NULL,
  calendar_days   JSONB DEFAULT '[]'::jsonb NOT NULL,
  plan_config     JSONB DEFAULT '{}'::jsonb NOT NULL,
  studied_words   JSONB DEFAULT '[]'::jsonb NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
--  4. Practice history
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_history (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  speaking_history JSONB DEFAULT '[]'::jsonb NOT NULL,
  writing_history  JSONB DEFAULT '[]'::jsonb NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
--  5. Spaced Repetition System (SRS) data — ALL 5 stores
--     Note: phrasalSrs, idiomsSrs, and idiomsProperSrs are NEW —
--     they were previously local-only and never synced with Firebase!
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_srs (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  srs_data          JSONB DEFAULT '{}'::jsonb NOT NULL,
  langeek_srs_data  JSONB DEFAULT '{}'::jsonb NOT NULL,
  phrasal_srs       JSONB DEFAULT '{}'::jsonb NOT NULL,
  idioms_srs        JSONB DEFAULT '{}'::jsonb NOT NULL,
  idioms_proper_srs JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════════
--  Row Level Security (RLS)
--  Ensures each user can only read/write their own rows.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocab    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_srs      ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own profile"   ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (id = auth.uid());

-- Sub-table policies (single ALL policy per table for simplicity)
CREATE POLICY "Users own vocab"    ON user_vocab    FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own progress" ON user_progress FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own history"  ON user_history  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own srs"     ON user_srs      FOR ALL USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
--  Done! Your InsForge backend is ready for Venoxa.
-- ═══════════════════════════════════════════════════════════════════════════
