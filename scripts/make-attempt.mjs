// scripts/make-attempt.mjs — submit a perfect attempt for a lesson using a
// Supabase token passed via argv. Usage:
//   node scripts/make-attempt.mjs <token> <slug> [answersJson]
// With no answersJson, perfect answers are built from the server-side keys.
import { readFileSync } from "fs";
import pg from "pg";

const [, , token, slug, answersJson] = process.argv;
if (!token || !slug) {
  console.error("usage: node scripts/make-attempt.mjs <token> <slug> [answersJson]");
  process.exit(1);
}

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const v = (k) => {
  const line = env.split(/\r?\n/).find((l) => l.startsWith(`${k}=`));
  return line ? line.slice(k.length + 1).trim().replace(/^["']|["']$/g, "") : "";
};

let answers;
if (answersJson) {
  answers = JSON.parse(answersJson);
} else {
  const c = new pg.Client({ connectionString: v("DATABASE_URL") });
  await c.connect();
  const keys = (
    await c.query(
      `select e.type, e.answer from path_exercises e join path_lessons l on l.id = e.lesson_id
        where l.slug = $1 order by e.order_index`,
      [slug],
    )
  ).rows;
  await c.end();
  answers = keys.map((r) =>
    r.type === "type_in" ? (Array.isArray(r.answer) ? r.answer[0] : r.answer)
      : r.type === "order" ? r.answer
      : String(r.answer),
  );
}

const res = await fetch(`http://127.0.0.1:3001/api/path/lessons/${slug}/attempt`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ answers }),
});
const j = await res.json().catch(() => null);
console.log(JSON.stringify({ status: res.status, ...j }, null, 1));
