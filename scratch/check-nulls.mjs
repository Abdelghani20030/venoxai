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
  // Check if new columns have NULL values for existing users
  const result = await pool.query('SELECT id, email, plan_config, studied_words, plan_config IS NULL as pc_null, studied_words IS NULL as sw_null FROM users ORDER BY id');
  for (const row of result.rows) {
    console.log(`User #${row.id} (${row.email}): plan_config=${JSON.stringify(row.plan_config)} (null=${row.pc_null}), studied_words=${JSON.stringify(row.studied_words)} (null=${row.sw_null})`);
  }
  
  // Check column defaults
  const colInfo = await pool.query(`
    SELECT column_name, column_default, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name IN ('plan_config', 'studied_words')
  `);
  console.log('\nColumn info:');
  for (const col of colInfo.rows) {
    console.log(`  ${col.column_name}: default=${col.column_default}, nullable=${col.is_nullable}`);
  }

  // Also check user #3 (just registered) to see if select works
  const user3 = await pool.query('SELECT * FROM users WHERE id = 3');
  if (user3.rows.length > 0) {
    const u = user3.rows[0];
    console.log(`\nUser #3 password_hash length: ${u.password_hash?.length}, salt: ${u.salt?.length}`);
    console.log(`User #3 all columns present: ${Object.keys(u).length}`);
  }
} catch (err) {
  console.error('DB Error:', err.message);
} finally {
  await pool.end();
}
