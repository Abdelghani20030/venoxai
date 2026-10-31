import pg from 'pg';
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it (or run from the repo root with a root .env) before using this script - never hard-code credentials here.');
  process.exit(1);
}

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to database successfully.");

  // Check columns in users table
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
  `);
  
  console.log("Existing columns in 'users' table:");
  const columns = res.rows.map(r => r.column_name);
  console.log(columns.join(", "));

  // Define target columns that should exist in a single-table users schema
  const targetCols = [
    { name: "password_hash", type: "TEXT" },
    { name: "salt", type: "TEXT" },
    { name: "plan", type: "TEXT DEFAULT 'basic plan'" },
    { name: "last_active", type: "TIMESTAMP" },
    { name: "daily_goal_mins", type: "INTEGER DEFAULT 15" },
    { name: "rank_30_days", type: "INTEGER DEFAULT 29336" },
    { name: "streak_rank", type: "INTEGER DEFAULT 601" },
    { name: "completed_cells", type: "JSONB DEFAULT '{}'::jsonb" },
    { name: "usage_time", type: "JSONB DEFAULT '{}'::jsonb" },
    { name: "calendar_days", type: "JSONB DEFAULT '[]'::jsonb" },
    { name: "global_vocab", type: "JSONB DEFAULT '[]'::jsonb" },
    { name: "phrasal_vocab", type: "JSONB DEFAULT '[]'::jsonb" },
    { name: "idioms_vocab", type: "JSONB DEFAULT '[]'::jsonb" },
    { name: "idioms_proper_vocab", type: "JSONB DEFAULT '[]'::jsonb" },
    { name: "langeek_vocab", type: "JSONB DEFAULT '[]'::jsonb" },
    { name: "srs_data", type: "JSONB DEFAULT '{}'::jsonb" },
    { name: "langeek_srs_data", type: "JSONB DEFAULT '{}'::jsonb" },
    { name: "phrasal_srs", type: "JSONB DEFAULT '{}'::jsonb" },
    { name: "idioms_srs", type: "JSONB DEFAULT '{}'::jsonb" },
    { name: "idioms_proper_srs", type: "JSONB DEFAULT '{}'::jsonb" },
    { name: "speaking_history", type: "JSONB DEFAULT '[]'::jsonb" },
    { name: "writing_history", type: "JSONB DEFAULT '[]'::jsonb" },
    { name: "plan_config", type: "JSONB DEFAULT '{}'::jsonb" },
    { name: "studied_words", type: "JSONB DEFAULT '[]'::jsonb" }
  ];

  for (const col of targetCols) {
    if (!columns.includes(col.name)) {
      console.log(`Adding missing column: ${col.name}`);
      try {
        await client.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Successfully added ${col.name}.`);
      } catch (err) {
        console.error(`Failed to add ${col.name}:`, err.message);
      }
    } else {
      console.log(`Column already exists: ${col.name}`);
    }
  }

  await client.end();
}

main().catch(console.error);
