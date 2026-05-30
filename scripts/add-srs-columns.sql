-- ═══════════════════════════════════════════════════════════════════════════
--  Migration: Add 3 missing SRS columns to the users table
--  
--  These 3 SRS stores were previously local-only (never synced).
--  Now they sync along with srsData and langeekSrsData.
--  
--  Run this SQL against your PostgreSQL database:
--    DATABASE_URL=postgresql://postgres:67be7881350307660879f1851cca91e4@6hphx37v.us-east.database.insforge.app:5432/insforge?sslmode=require
-- ═══════════════════════════════════════════════════════════════════════════

-- Add phrasal SRS data column
ALTER TABLE users ADD COLUMN IF NOT EXISTS phrasal_srs JSONB DEFAULT '{}'::jsonb NOT NULL;

-- Add idioms SRS data column
ALTER TABLE users ADD COLUMN IF NOT EXISTS idioms_srs JSONB DEFAULT '{}'::jsonb NOT NULL;

-- Add idioms proper SRS data column
ALTER TABLE users ADD COLUMN IF NOT EXISTS idioms_proper_srs JSONB DEFAULT '{}'::jsonb NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
--  Verify: Check that all sync-related columns exist
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;
