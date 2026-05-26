import pg from 'pg';

const dbUrl = "postgresql://neondb_owner:npg_7JIMWvRZw4xU@ep-quiet-unit-apsq0z80-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

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
