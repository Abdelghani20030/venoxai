import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_7JIMWvRZw4xU@ep-quiet-unit-apsq0z80-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require',
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
