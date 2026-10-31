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
  const result = await pool.query('SELECT completed_cells, global_vocab FROM users WHERE id = 1');
  if (result.rows.length > 0) {
    const user = result.rows[0];
    console.log('--- completed_cells ---');
    console.log(JSON.stringify(user.completed_cells, null, 2));
    console.log('\n--- global_vocab ---');
    console.log(JSON.stringify(user.global_vocab, null, 2));
  } else {
    console.log('User not found.');
  }
} catch (err) {
  console.error('Error:', err);
} finally {
  await pool.end();
}
