// scripts/path-smoke.mjs — end-to-end smoke test for the /api/path router.
//
// Usage: node scripts/path-smoke.mjs
//
// Checks, in order:
//   1. guest map/summary + 401 guards
//   2. sign up a throwaway Supabase session (skips the authed block on failure)
//   3. lesson detail (answers stripped), perfect attempt graded server-side
//   4. unlock chain: next lesson becomes current, locked lesson → 403
//   5. placement → below-start revision access + draft 403
//
// Exits 0 only when every executed check passes.
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
function envValue(key) {
  const line = env.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
}

const BASE = "http://127.0.0.1:3001/api/path";
const SUPABASE_URL = (envValue("VITE_SUPABASE_URL") || "").replace(/\/$/, "");
const SUPABASE_ANON = envValue("VITE_SUPABASE_ANON_KEY");

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-json */ }
  return { status: res.status, json };
}

/* ── 1. guest map + guards ──────────────────────────────────────────────── */

const map = await api("/map");
check("guest map 200", map.status === 200);
check(
  "guest map: A1 first lesson is current",
  map.json?.levels?.[0]?.units?.[0]?.lessons?.[0]?.state === "current" &&
    map.json?.levels?.[0]?.units?.[0]?.lessons?.[0]?.slug === "a1-alphabet-and-sounds",
);
check("guest summary 200 with zeroed xp", (await api("/summary")).json?.xp === 0);
check("guest attempt 401", (await api("/lessons/a1-alphabet-and-sounds/attempt", { method: "POST", body: { answers: [] } })).status === 401);
check("guest lesson detail 401", (await api("/lessons/a1-alphabet-and-sounds")).status === 401);

/* ── 2. a throwaway session ─────────────────────────────────────────────── */

const email = `venoxa-phase2-smoke-${Date.now()}@example.com`;
const password = `Vx-${Math.random().toString(36).slice(2)}9!a`;
let token = null;
if (SUPABASE_URL && SUPABASE_ANON) {
  const signup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await signup.json().catch(() => ({}));
  token = data?.access_token ?? null;

  // Email confirmation is ON: confirm the throwaway user directly, then do a
  // password grant. Cleanup at the end removes every smoke user.
  // GoTrue's REST /signup returns the user object directly (supabase-js wraps
  // it in { user }); handle both shapes.
  const newUserId = data?.user?.id ?? data?.id ?? null;
  if (!token && signup.status === 200 && newUserId) {
    const dbAdmin = new pg.Client({ connectionString: envValue("DATABASE_URL") });
    await dbAdmin.connect();
    // confirmed_at is a generated column (derived from email_confirmed_at).
    await dbAdmin.query(
      `update auth.users set email_confirmed_at = now() where id = $1`,
      [newUserId],
    );
    await dbAdmin.end();
    const login = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const session = await login.json().catch(() => ({}));
    token = session?.access_token ?? null;
    check("password grant after direct confirm", Boolean(token), token ? "" : `status ${login.status}`);
  } else {
    check("supabase signup returned a session", Boolean(token), token ? "" : `status ${signup.status}${data?.msg ? `: ${data.msg}` : ""}`);
  }
} else {
  console.log("SKIP  supabase session (VITE_SUPABASE_URL/ANON_KEY not set)");
}

/* ── 3-5. the authed flow ───────────────────────────────────────────────── */

if (token) {
  const auth = { token };

  const detail = await api("/lessons/a1-alphabet-and-sounds", auth);
  check("lesson detail 200", detail.status === 200);
  check(
    "lesson detail: answers stripped, prompts present",
    detail.json?.exercises?.length > 0 &&
      detail.json.exercises.every((ex) => !("answer" in ex) && !("explanation" in ex) && ex.prompt),
  );

  // Build a perfect answer sheet from the server-side answer keys.
  const db = new pg.Client({ connectionString: envValue("DATABASE_URL") });
  await db.connect();
  const keys = await db.query(
    `select e.type, e.answer
       from path_exercises e
       join path_lessons l on l.id = e.lesson_id
      where l.slug = 'a1-alphabet-and-sounds'
      order by e.order_index`,
  );
  const lessonRow = await db.query(`select id, xp_reward, kind from path_lessons where slug = 'a1-alphabet-and-sounds'`);
  await db.end();
  const answers = keys.rows.map((row) =>
    row.type === "type_in" ? (Array.isArray(row.answer) ? row.answer[0] : row.answer)
      : row.type === "order" ? row.answer
      : String(row.answer),
  );

  const attempt = await api("/lessons/a1-alphabet-and-sounds/attempt", { ...auth, method: "POST", body: { answers } });
  check("perfect attempt: score 100 + completed", attempt.json?.score === 100 && attempt.json?.completed === true, `score=${attempt.json?.score}`);
  const expectedXp = lessonRow.rows[0].kind === "lesson" ? lessonRow.rows[0].xp_reward + 12 : lessonRow.rows[0].xp_reward;
  check("perfect attempt: base XP + max bonus", attempt.json?.xpAwarded === expectedXp, `xp=${attempt.json?.xpAwarded} expected=${expectedXp}`);
  check("unlock: next lesson is a1-subject-pronouns", attempt.json?.next?.slug === "a1-subject-pronouns", `next=${attempt.json?.next?.slug}`);

  const after = await api("/summary", auth);
  check("summary reflects XP + new current", after.json?.xp === expectedXp && after.json?.current?.slug === "a1-subject-pronouns");

  // a1-unit-1-check (order 6) is ahead of the current lesson → locked.
  check("locked lesson detail 403", (await api("/lessons/a1-unit-1-check", auth)).status === 403);
  check("locked lesson attempt 403", (await api("/lessons/a1-unit-1-check/attempt", { ...auth, method: "POST", body: { answers: [] } })).status === 403);
  // A2 is level-locked → its draft lesson is 403 too.
  check("level-locked draft 403", (await api("/lessons/a2-past-simple-was-were", auth)).status === 403);

  // Placement to B2: A1/A2 become revision (below start), A2 draft stays 403 draft.
  const placement = await api("/placement", { ...auth, method: "POST", body: { level: "B2", source: "manual" } });
  check("placement sets start level", placement.json?.startLevel === "B2" && placement.json?.current?.slug === "b2-passive-voice", `current=${placement.json?.current?.slug}`);
  const belowStartDetail = await api("/lessons/a1-alphabet-and-sounds", auth);
  check("below-start published lesson open for revision", belowStartDetail.status === 200 && belowStartDetail.json?.lesson?.belowStart === true);
  const belowStartDraft = await api("/lessons/a2-past-simple-was-were", auth);
  check("below-start draft still 403 draft", belowStartDraft.status === 403 && belowStartDraft.json?.error === "draft");

  // Restore placement to A1 so the smoke test is re-runnable.
  const restore = await api("/placement", { ...auth, method: "POST", body: { level: "A1" } });
  check("placement back to A1", restore.json?.startLevel === "A1" && restore.json?.current?.slug === "a1-subject-pronouns", `current=${restore.json?.current?.slug}`);

  // §6.4: revisiting a completed lesson never re-awards XP.
  const revisit = await api("/lessons/a1-alphabet-and-sounds/attempt", { ...auth, method: "POST", body: { answers } });
  check(
    "revisit completed lesson: no XP, stays completed",
    revisit.json?.xpAwarded === 0 && revisit.json?.alreadyCompleted === true && revisit.json?.completed === true,
    `xp=${revisit.json?.xpAwarded} alreadyCompleted=${revisit.json?.alreadyCompleted}`,
  );
  // A failed attempt never completes and never awards XP.
  const failed = await api("/lessons/a1-subject-pronouns/attempt", { ...auth, method: "POST", body: { answers: [] } });
  check(
    "failed attempt: no completion, no XP, chain unchanged",
    failed.json?.completed === false && failed.json?.xpAwarded === 0 && failed.json?.passed === false,
    `score=${failed.json?.score}`,
  );
  const afterFailed = await api("/summary", auth);
  check("failed attempt keeps XP and current unchanged", afterFailed.json?.xp === expectedXp && afterFailed.json?.current?.slug === "a1-subject-pronouns");
} else {
  console.log("SKIP  authed flow (no session available)");
}

/* ── cleanup: remove the throwaway smoke users ──────────────────────────── */
try {
  const cleanup = new pg.Client({ connectionString: envValue("DATABASE_URL") });
  await cleanup.connect();
  await cleanup.query(`delete from public.users where email like 'venoxa-phase2-smoke-%'`);
  await cleanup.query(`delete from auth.users where email like 'venoxa-phase2-smoke-%'`);
  await cleanup.end();
  console.log("cleanup: smoke users removed");
} catch (err) {
  console.log(`cleanup failed: ${err.message}`);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
