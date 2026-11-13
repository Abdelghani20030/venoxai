// scripts/path-vocab-plan.mjs — list A1 lessons + A1 categories to design the mapping.
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const client = new pg.Client({ connectionString: url });
await client.connect();

const lessons = await client.query(`
  select id, unit_id, order_index, title, status,
         coalesce((select sum from (select count(*) sum from jsonb_array_elements(steps) s where s->>'type'='vocab') t),0) vocab_steps
  from public.path_lessons where level_code = 'A1' order by order_index`);
console.log("== A1 lessons ==");
for (const r of lessons.rows) console.log(`  L${String(r.order_index).padStart(2)} u=${r.unit_id.slice(0, 8)} ${r.status.padEnd(9)} "${r.title}"`);

const cats = await client.query(`
  select c.id, c.name, c.word_count
  from public.vocab_categories c where c.level = 'A1' order by c.word_count desc`);
console.log("\n== A1 categories ==");
for (const r of cats.rows) console.log(`  ${String(r.id).padStart(3)} ${String(r.word_count).padStart(3)}  ${r.name}`);

await client.end();
