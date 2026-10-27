// Offline smoke test for the generator's output pipeline (no network).
// Checks structural validation, dupe rejection, and SQL escaping with tricky
// strings (single quotes, newlines). Run:
//   pnpm --filter @workspace/scripts exec tsx src/level-test/seed-smoke.test.ts
import assert from "node:assert";
import { acceptItem, buildSql, structError } from "./generate-items";

console.log("── structError");
assert.equal(structError("It ___ here every day.", ["goes", "went", "gone", "going"], 0, true, "grammar"), null);
assert.ok(structError("It ___ here every day.", ["goes", "went"], 0, true, "grammar")?.includes("options"));
assert.ok(structError("It often ___ every day.", ["goes", "went", "gone", "going", "goes2"], 0, true, "grammar"));
assert.ok(structError("It ___ every day.", ["goes", "gone", "going", "going"], 0, true, "grammar")?.includes("duplicate"));
assert.ok(structError("Short.", ["goes", "went", "gone", "going"], 0, true, "grammar")?.includes("stem too short"));
assert.ok(structError("It ____ every day.", ["goes", "went", "gone", "going"], 0, true, "grammar")); // missing blank
console.log("  structError ok");

console.log("── acceptItem + dedup");
const tricky = `She said it's "ready" — then the
 explanation continues on a new line! It's a long sentence with a blank ___ and an
 apostrophe: don't worry, O'Brien's fine.`;
const a = acceptItem("grammar", "B1", tricky, ["goes", "went", "gone", "going".replace("g", "g")], 0, { key: "k", solved: "s" });
assert.ok(a, "accepted item 1");
assert.equal(a!.difficulty_b < 0 && a!.difficulty_b > -1.5, true, `b=${a!.difficulty_b}`);
const dup = acceptItem("grammar", "B1", tricky, ["goes", "went", "gone", "going"], 1, { key: "k", solved: "s" });
assert.equal(dup, null, "duplicate stem rejected");
const b = acceptItem("reading", "B1", "What is the main idea of the passage about early medieval trade routes?", ["Trade linked", "Kings banned", "Ships sank", "Roads ended"], 0, { passage: "Long ago traders moved silk across deserts. ".repeat(2), key: "k", solved: "s" });
assert.ok(b && b.passage_text !== null);
const l = acceptItem("listening", "A1", "Where does Sam want to go?", ["The school", "The bank", "The zoo", "The shop"], 2, { script: "Sam: Let's meet. Maria: Where? Sam: Near the shop. Maria: OK it's fine.", key: "k", solved: "s" });
assert.ok(l && l.audio_script !== null);

console.log("── buildSql");
const sql = buildSql([a!, b!, l!]);
const insertCount = (sql.match(/INSERT INTO lt_items/g) || []).length;
assert.equal(insertCount, 3, `inserts=${insertCount}`);
// every statement must end with `ON CONFLICT (id) DO NOTHING;`
assert.equal((sql.match(/ON CONFLICT \(id\) DO NOTHING;/g) || []).length, 3);
// the tricky stem: '' escaping — no raw unescaped quotes should terminate mid-value;
// count single-quotes per line: values either '…' pairs → even counts per statement
for (const stmt of sql.split("\n")) {
  if (!stmt.startsWith("INSERT")) continue;
  const q = (stmt.match(/'/g) || []).length;
  if (q % 2 !== 0) throw new Error(`odd quote count (${q}) in: ${stmt.slice(0, 120)}`);
}
console.log("  SQL escaping/structure ok");
console.log("\nsample INSERT:\n" + sql.split("\n").slice(2, 5).join("\n").slice(0, 500));
console.log("\nsmoke test passed");
