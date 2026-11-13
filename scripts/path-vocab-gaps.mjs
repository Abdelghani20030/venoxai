// scripts/path-vocab-gaps.mjs — which mapped A1 lessons lack a vocab step, and what do steps look like?
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const client = new pg.Client({ connectionString: url });
await client.connect();

const rows = (await client.query(`
  select order_index, title, status, steps from public.path_lessons
  where level_code = 'A1' order by order_index`)).rows;

const withVocab = [], without = [];
for (const r of rows) {
  const v = (r.steps ?? []).find((s) => s.type === "vocab");
  (v ? withVocab : without).push(r);
}
console.log("== WITH vocab step ==");
for (const r of withVocab) {
  const v = r.steps.find((s) => s.type === "vocab");
  console.log(`  L${String(r.order_index).padStart(2)} ${r.status.padEnd(9)} "${r.title}" → step "${v.title}" items=${(v.items ?? []).length}`);
}
console.log("\n== WITHOUT vocab step ==");
for (const r of without) console.log(`  L${String(r.order_index).padStart(2)} ${r.status.padEnd(9)} "${r.title}" steps=[${(r.steps ?? []).map((s) => s.type).join(", ")}]`);

// dump one full vocab step + one lesson's step list to copy the exact shape
const sample = withVocab.find((r) => r.order_index === 3);
if (sample) {
  const v = sample.steps.find((s) => s.type === "vocab");
  console.log("\n== sample vocab step JSON (L3) ==");
  console.log(JSON.stringify(v, null, 1).slice(0, 900));
  console.log("\n== L3 step titles/types ==");
  for (const s of sample.steps) console.log(`  ${s.type.padEnd(12)} "${s.title}"`);
}
await client.end();
