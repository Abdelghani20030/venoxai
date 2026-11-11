// scripts/list-lessons.mjs — dump path_lessons rows for the map screen build.
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL=")).slice(13).trim().replace(/^["']|["']$/g, "");
const c = new pg.Client({ connectionString: url });
await c.connect();
const rows = (
  await c.query(
    `select level_code, order_index, lesson_no, title, subtitle, kind, status, est_minutes
       from path_lessons order by level_code, order_index`,
  )
).rows;
await c.end();
for (const r of rows) {
  console.log(
    `${r.level_code} #${String(r.order_index).padStart(2, "0")} no=${String(r.lesson_no ?? "-").padStart(2, " ")} ` +
      `${r.kind.padEnd(10)} ${r.status.padEnd(9)} ${String(r.est_minutes).padStart(2)}m | ${r.title} | ${r.subtitle}`,
  );
}
