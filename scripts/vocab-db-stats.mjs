// scripts/vocab-db-stats.mjs — verify the seeded vocabulary tables.
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const client = new pg.Client({ connectionString: url });
await client.connect();

const one = async (sql) => Number((await client.query(sql)).rows[0]?.n ?? -1);
const counts = {
  categories: await one("select count(*) n from public.vocab_categories"),
  senses: await one("select count(*) n from public.vocab_senses"),
  rules: await one("select count(*) n from public.vocab_grammar_rules"),
  links: await one("select count(*) n from public.vocab_sense_grammar"),
  senses_ar: await one("select count(*) n from public.vocab_senses where meaning_ar is not null"),
};
console.log("counts:", counts);

const byLevel = await client.query("select level, count(*) n from public.vocab_senses group by level order by level");
console.log("senses by level:", byLevel.rows.map((r) => `${r.level}:${r.n}`).join(" "));

const catsByLevel = await client.query("select level, count(*) n from public.vocab_categories group by level order by level");
console.log("categories by level:", catsByLevel.rows.map((r) => `${r.level}:${r.n}`).join(" "));

const sample = await client.query(`
  select s.word, s.pos, s.level, c.name as category, s.meaning
  from public.vocab_senses s join public.vocab_categories c on c.id = s.category_id
  where s.level = 'A1' and c.name = 'Food and Drinks'
  order by s.sort limit 3`);
for (const r of sample.rows) console.log(`  ${r.word} (${r.pos}) — ${r.category}: ${r.meaning}`);

const ruleSample = await client.query(`
  select g.code, g.title_en, count(*) n
  from public.vocab_sense_grammar l join public.vocab_grammar_rules g on g.id = l.rule_id
  group by g.code, g.title_en order by n desc limit 6`);
console.log("most-linked rules:", ruleSample.rows.map((r) => `${r.code}(${r.n})`).join(" "));

const untagged = await one("select count(*) n from public.vocab_senses s where not exists (select 1 from public.vocab_sense_grammar l where l.sense_id = s.id)");
console.log("untagged senses:", untagged);

await client.end();
