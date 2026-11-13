// scripts/list-a1-slugs.mjs
import { readFileSync } from "fs";
import pg from "pg";
const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
const url = line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
const client = new pg.Client({ connectionString: url });
await client.connect();
const r = await client.query(
  "select order_index, slug, title from public.path_lessons where level_code = 'A1' and status = 'published' order by order_index"
);
for (const x of r.rows) console.log(x.order_index, x.slug, "-", x.title);
await client.end();
