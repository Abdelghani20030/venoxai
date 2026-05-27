import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_7JIMWvRZw4xU@ep-quiet-unit-apsq0z80-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require' });

// Check for triggers on the users table
const triggers = await pool.query(`
  SELECT trigger_name, event_manipulation, action_statement, action_timing
  FROM information_schema.triggers 
  WHERE event_object_table = 'users'
`);
console.log('Triggers on users table:');
for (const t of triggers.rows) {
  console.log(`  ${t.trigger_name} (${t.action_timing} ${t.event_manipulation}): ${t.action_statement}`);
}

// Check for trigger functions
const funcs = await pool.query(`
  SELECT routine_name, routine_definition 
  FROM information_schema.routines 
  WHERE routine_type = 'FUNCTION' AND routine_name LIKE '%update%'
`);
console.log('\nUpdate-related functions:');
for (const f of funcs.rows) {
  console.log(`  ${f.routine_name}: ${f.routine_definition?.substring(0, 200)}`);
}

// Also check pg_trigger directly for more detail
const pgTriggers = await pool.query(`
  SELECT tgname, pg_get_triggerdef(oid) as def 
  FROM pg_trigger 
  WHERE tgrelid = 'users'::regclass AND NOT tgisinternal
`);
console.log('\npg_trigger details:');
for (const t of pgTriggers.rows) {
  console.log(`  ${t.tgname}: ${t.def}`);
}

await pool.end();
