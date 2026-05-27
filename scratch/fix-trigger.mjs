import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_7JIMWvRZw4xU@ep-quiet-unit-apsq0z80-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require' });

try {
  // Drop the broken trigger
  await pool.query('DROP TRIGGER IF EXISTS trg_users_updated ON users');
  console.log('✅ Dropped trg_users_updated trigger');
  
  // Also drop the function since it's no longer needed
  await pool.query('DROP FUNCTION IF EXISTS touch_updated_at()');
  console.log('✅ Dropped touch_updated_at() function');
  
  // Verify it's gone
  const triggers = await pool.query(`
    SELECT trigger_name FROM information_schema.triggers 
    WHERE event_object_table = 'users'
  `);
  console.log(`Remaining triggers: ${triggers.rows.length === 0 ? 'none' : triggers.rows.map(r => r.trigger_name).join(', ')}`);
  
  // Test the update now
  await pool.query('UPDATE users SET last_active = $1 WHERE id = $2', [new Date(), 1]);
  console.log('✅ UPDATE users SET last_active works now!');
  
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
