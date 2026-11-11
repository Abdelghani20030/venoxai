// scripts/apply-sql.mjs — execute one SQL file against the Supabase DATABASE_URL.
//
// Usage:  node scripts/apply-sql.mjs migrations/learning-path.sql
//
// The whole file is sent as a single simple-protocol query, so the script is
// atomic in the sense that Postgres runs the statements top to top; an error
// aborts everything after it. Errors print the offending SQL snippet via
// err.position so multi-hundred-line migrations stay debuggable.
import { readFileSync } from "fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-sql.mjs <file.sql>");
  process.exit(1);
}

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
if (!line) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");

const sql = readFileSync(file, "utf8");
const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log(`OK: ${file} applied.`);
} catch (err) {
  console.error(`FAILED: ${file}`);
  console.error(err.message);
  if (err.position) {
    const pos = Number(err.position);
    const start = Math.max(0, pos - 90);
    console.error("near:", JSON.stringify(sql.slice(start, pos + 90)));
  }
  process.exitCode = 1;
} finally {
  await client.end();
}
