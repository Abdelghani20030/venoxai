// scripts/db-inspect.mjs — quick DB inspection used by the redesign phases.
// Usage: node scripts/db-inspect.mjs
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
if (!line) { console.error("DATABASE_URL not found in .env"); process.exit(1); }
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url });
await client.connect();
const t = await client.query(
  "select table_name from information_schema.tables where table_schema='public' order by table_name",
);
console.log("tables:", t.rows.map((r) => r.table_name).join(", "));
for (const table of ["path_levels", "path_units", "path_lessons", "path_exercises", "user_path_progress", "user_path_state", "users"]) {
  try {
    const n = await client.query(`select count(*)::int as n from public.${table}`);
    console.log(`${table}: ${n.rows[0].n} rows`);
  } catch {
    console.log(`${table}: (missing)`);
  }
}

try {
  const status = await client.query(
    "select level_code, status, count(*)::int as n from public.path_lessons group by level_code, status order by level_code, status",
  );
  console.log("lessons by level/status:", status.rows.map((r) => `${r.level_code}:${r.status}:${r.n}`).join("  "));
  const kinds = await client.query(
    "select kind, status, count(*)::int as n from public.path_lessons where level_code='A1' group by kind, status order by kind",
  );
  console.log("A1 by kind:", kinds.rows.map((r) => `${r.kind}:${r.status}:${r.n}`).join("  "));
  const ex = await client.query(
    "select l.slug, count(e.id)::int as n from public.path_lessons l left join public.path_exercises e on e.lesson_id = l.id where l.status='published' group by l.slug order by l.slug",
  );
  console.log("exercises per published lesson:", ex.rows.map((r) => `${r.slug}:${r.n}`).join("  "));
  const rls = await client.query(
    "select tablename, rowsecurity from pg_tables where schemaname='public' and (tablename like 'path_%' or tablename like 'user_path%') order by tablename",
  );
  console.log("rls:", rls.rows.map((r) => `${r.tablename}:${r.rowsecurity ? "on" : "OFF"}`).join("  "));
} catch (err) {
  console.log("breakdown failed:", err.message);
}

await client.end();
