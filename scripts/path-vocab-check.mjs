// scripts/path-vocab-check.mjs — what's attached to path lessons right now?
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const client = new pg.Client({ connectionString: url });
await client.connect();

const lessons = await client.query(`
  select level_code, count(*) n, count(*) filter (where status = 'published') published
  from public.path_lessons group by level_code order by level_code`);
console.log("== path_lessons by level ==");
for (const r of lessons.rows) console.log(`  ${r.level_code}: ${r.n} lessons (${r.published} published)`);

const sample = await client.query(`
  select level_code, unit_id, order_index, title, subtitle, jsonb_array_length(steps) steps
  from public.path_lessons where level_code = 'A1' order by order_index limit 8`);
console.log("\n== A1 lessons (first 8) ==");
for (const r of sample.rows) console.log(`  u${r.unit_id} L${r.order_index} [${r.steps} steps] ${r.title}`);

const links = await client.query(`
  select l.level_code, count(pv.*) attached
  from public.path_lessons l left join public.path_lesson_vocab pv on pv.lesson_id = l.id
  group by l.level_code order by l.level_code`);
console.log("\n== path_lesson_vocab attachments by level ==");
for (const r of links.rows) console.log(`  ${r.level_code}: ${r.attached} senses attached`);

const stepsVocab = await client.query(`
  select count(*) n from public.path_lessons l, jsonb_array_elements(l.steps) s
  where s->>'type' = 'vocab'`);
console.log(`\nlessons with a vocab step in steps[]: ${stepsVocab.rows[0].n}`);

// where do the "24 words" come from? check a lesson that has vocab items in steps
const itemsSample = await client.query(`
  select l.title, s->>'title' step_title, s->'items' items
  from public.path_lessons l, jsonb_array_elements(l.steps) s
  where s->>'type' = 'vocab' limit 3`);
for (const r of itemsSample.rows) {
  const n = Array.isArray(r.items) ? r.items.length : 0;
  console.log(`  vocab step "${r.step_title}" in "${r.title}": ${n} items`);
}

await client.end();
