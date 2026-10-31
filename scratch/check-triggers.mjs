import pg from 'pg';
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it (or run from the repo root with a root .env) before using this script - never hard-code credentials here.');
  process.exit(1);
}
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
