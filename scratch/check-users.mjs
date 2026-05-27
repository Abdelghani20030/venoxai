import pg from 'pg';
import crypto from 'node:crypto';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_7JIMWvRZw4xU@ep-quiet-unit-apsq0z80-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

try {
  const result = await pool.query('SELECT id, email, username, password_hash, salt, xp, streak, level, global_vocab, completed_cells, plan_config, studied_words FROM users ORDER BY id');
  
  for (const row of result.rows) {
    console.log(`\n=== User #${row.id}: ${row.email} (${row.username}) ===`);
    console.log(`  password_hash length: ${row.password_hash?.length || 0}`);
    console.log(`  salt length: ${row.salt?.length || 0}`);
    console.log(`  xp: ${row.xp}, streak: ${row.streak}, level: ${row.level}`);
    console.log(`  global_vocab count: ${Array.isArray(row.global_vocab) ? row.global_vocab.length : 'N/A'}`);
    console.log(`  completed_cells keys: ${row.completed_cells ? Object.keys(row.completed_cells).length : 0}`);
    console.log(`  plan_config keys: ${row.plan_config ? Object.keys(row.plan_config).length : 0}`);
    console.log(`  studied_words count: ${Array.isArray(row.studied_words) ? row.studied_words.length : 0}`);
    
    // Verify hash is in expected format
    if (row.password_hash && row.salt) {
      console.log(`  hash format OK: ${row.password_hash.length === 128 && row.salt.length === 32}`);
    }
  }
} catch (err) {
  console.error('DB Error:', err.message);
} finally {
  await pool.end();
}
