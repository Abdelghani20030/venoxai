import pg from 'pg';
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it (or run from the repo root with a root .env) before using this script - never hard-code credentials here.');
  process.exit(1);
}
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

try {
  // Check if users table exists and has data
  const result = await pool.query('SELECT id, email, username, xp, streak, created_at FROM users ORDER BY id LIMIT 20');
  console.log(`Found ${result.rows.length} users:`);
  for (const row of result.rows) {
    console.log(`  #${row.id} | ${row.email} | ${row.username} | xp=${row.xp} streak=${row.streak} | ${row.created_at}`);
  }
  
  // Check columns exist
  const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`);
  console.log(`\nColumns (${cols.rows.length}):`, cols.rows.map(r => r.column_name).join(', '));
  
  // Check if plan_config and studied_words columns exist
  const newCols = cols.rows.filter(r => ['plan_config', 'studied_words'].includes(r.column_name));
  console.log(`\nNew columns present: ${newCols.map(r => r.column_name).join(', ') || 'NONE!'}`);
  
} catch (err) {
  console.error('DB Error:', err.message);
} finally {
  await pool.end();
}
