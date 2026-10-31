import pg from 'pg';
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it (or run from the repo root with a root .env) before using this script - never hard-code credentials here.');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;

async function main() {
  const pool = new pg.Pool({ connectionString: dbUrl });
  try {
    console.log("Connecting to database...");
    const client = await pool.connect();
    console.log("Connected! Checking and altering users table...");

    const queries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS global_vocab jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phrasal_vocab jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS idioms_vocab jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS idioms_proper_vocab jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS langeek_vocab jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS srs_data jsonb NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS langeek_srs_data jsonb NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS speaking_history jsonb NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS writing_history jsonb NOT NULL DEFAULT '[]'::jsonb`,
    ];

    for (const query of queries) {
      console.log(`Running: ${query}`);
      await client.query(query);
    }

    console.log("Database migration successful!");
    client.release();
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

main();
