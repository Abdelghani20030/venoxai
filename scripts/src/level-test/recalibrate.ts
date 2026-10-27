// ─────────────────────────────────────────────────────────────────────────────
// recalibrate.ts — manual item-bank recalibration for the Venoxa Level Test.
// (@ts-nocheck: `pg` resolves without type declarations in this workspace.)
// ─────────────────────────────────────────────────────────────────────────────
// @ts-nocheck
//
// For every non-retired item with ≥ --min-responses (default 100) real
// responses:
//   • re-estimate difficulty from observed data (logit-mean estimator) and
//     blend it with the CEFR seed prior so a small sample cannot move the
//     difficulty far:  b_new = w·b̂_obs + (1−w)·b_seed,  w = n/(n+100)
//   • compute the point-biserial item-total correlation; items below 0.15 are
//     FLAGGED for retirement (only actually retired with --retire)
//
// Dry-run by default (prints a report). Use --write to persist difficulty
// updates, --retire to also flip flagged items to status='retired'.
//
// Requires DATABASE_URL in the environment (points at the same Postgres that
// has the lt_* tables + lt_sessions.lt_* results). Never prints the URL.
//
// Run:
//   pnpm --filter @workspace/scripts exec tsx src/level-test/recalibrate.ts [--write] [--retire] [--min-responses 100]
// ─────────────────────────────────────────────────────────────────────────────
import pg from "pg";
import { CEFR_SEED_B, type CefrLevel } from "../../../artifacts/api-server/src/lib/level-test-engine";

const WRITE = process.argv.includes("--write");
const RETIRE = process.argv.includes("--retire");
const argIdx = process.argv.indexOf("--min-responses");
const MIN_RESPONSES = argIdx > 0 ? Math.max(1, Number(process.argv[argIdx + 1]) || 100) : 100;

const url = (process.env.DATABASE_URL || "").trim();
if (!url) { console.error("DATABASE_URL not set. This script only reads lt_* response data and updates difficulties — but it needs a DB connection."); process.exit(1); }

interface Agg {
  n: number; correct: number;
  thetaSum: number;
  itemTotalX: number; itemTotalY: number; itemTotalXY: number; itemTotalX2: number; itemTotalY2: number;
}
const items = new Map<string, { type: string; seedB: number; bNow: number; agg: Agg }>();

async function main() {
  const pool = new pg.Pool({ connectionString: url, max: 3, ssl: /sslmode=require/.test(url) || /supabase/.test(url) ? { rejectUnauthorized: false } : undefined });
  try {
    const { rows: itemRows } = await pool.query(
      `SELECT id, type, cefr_tag, difficulty_b FROM lt_items WHERE status <> 'retired'`);
    for (const r of itemRows) {
      items.set(r.id, { type: r.type, seedB: CEFR_SEED_B[r.cefr_tag as CefrLevel] ?? 0, bNow: Number(r.difficulty_b), agg: { n: 0, correct: 0, thetaSum: 0, itemTotalX: 0, itemTotalY: 0, itemTotalXY: 0, itemTotalX2: 0, itemTotalY2: 0 } });
    }
    const { rows: respRows } = await pool.query(
      `SELECT r.item_id, r.correct, s.theta FROM lt_responses r
        JOIN lt_sessions s ON s.id = r.session_id
       WHERE s.status = 'completed' AND s.theta IS NOT NULL`);
    // session totals first: per session, how many correct (only among answered set)
    const { rows: totals } = await pool.query(
      `SELECT r.session_id, COUNT(*)::int AS answered, SUM(CASE WHEN r.correct THEN 1 ELSE 0 END)::int AS correct
         FROM lt_responses r JOIN lt_sessions s ON s.id = r.session_id
        WHERE s.status = 'completed' AND s.theta IS NOT NULL GROUP BY r.session_id`);
    // point-biserial needs per-session total CORRECT within the test — map it
    const session = new Map<string, { total: number; n: number }>();
    for (const t of totals) session.set(t.session_id, { total: t.correct, n: t.answered });

    for (const r of respRows) {
      const it = items.get(r.item_id);
      if (!it) continue;
      const s = session.get(r.session_id);
      if (!s || s.n < 3) continue; // point-biserial needs variance
      const a = it.agg;
      a.n++; a.correct += r.correct ? 1 : 0;
      a.thetaSum += Number(r.theta);
      // point-biserial: x = 0/1 correctness, y = session total correct score
      a.itemTotalX += r.correct ? 1 : 0;
      a.itemTotalY += s.total;
      a.itemTotalXY += (r.correct ? 1 : 0) * s.total;
      a.itemTotalX2 += (r.correct ? 1 : 0) ** 2;
      a.itemTotalY2 += s.total * s.total;
    }

    console.log(`responses scanned across ${items.size} items · min-responses=${MIN_RESPONSES} · ${WRITE ? "WRITE MODE" : "dry-run"}${RETIRE ? " + retire" : ""}\n`);

    const updates: Array<{ id: string; bNew: number }> = [];
    const retireList: string[] = [];
    console.log("id".slice(0, 10) + "  n   p     b_old  b_seed→b_new  |  pb(-total)  flag");
    for (const [id, it] of items) {
      const a = it.agg;
      if (a.n < MIN_RESPONSES) continue;
      // observed difficulty: b̂ = mean(θ of solvers who averaged p correct?) — use the classic 1PL matrix estimator:
      // b̂_obs = mean(θ in answering sessions) − (logit(p) · adj) where adj = sq-ish correction.
      // We use the mean-of-θ minus logit(rate) estimator (consistent under Rasch for mild ability ranges).
      const meanTheta = a.thetaSum / a.n;
      const p = Math.min(0.98, Math.max(0.02, a.correct / a.n));
      const bObs = meanTheta - Math.log(p / (1 - p));
      const w = a.n / (a.n + 100); // CEFR prior blend: n=100 → w=0.5
      const bNew = Math.round((w * bObs + (1 - w) * it.seedB) * 1000) / 1000;

      // point-biserial item-total correlation
      const sx = a.itemTotalX, sy = a.itemTotalY, sxy = a.itemTotalXY, sx2 = a.itemTotalX2, sy2 = a.itemTotalY2;
      const cov = sxy / a.n - (sx / a.n) * (sy / a.n);
      const vx = sx2 / a.n - (sx / a.n) ** 2;
      const vy = sy2 / a.n - (sy / a.n) ** 2;
      const pb = vx > 0 && vy > 0 ? cov / Math.sqrt(vx * vy) : 0;

      const flag = pb < 0.15;
      console.log(`${id.slice(0, 12).padEnd(14)}${String(a.n).padStart(4)}  ${(a.correct / a.n).toFixed(2)}  ${it.bNow.toFixed(2).padStart(5)}  ${it.seedB.toFixed(1)}→${bNew.toFixed(2)}   ${pb.toFixed(3)}   ${flag ? "RETIRE?" : "ok"}`);
      if (Math.abs(bNew - it.bNow) > 0.02) updates.push({ id, bNew });
      if (flag) retireList.push(id);
    }

    if (WRITE && updates.length) {
      const tx = await pool.connect();
      try {
        await tx.query("BEGIN");
        for (const u of updates) await tx.query(`UPDATE lt_items SET difficulty_b = $1 WHERE id = $2`, [u.bNew, u.id]);
        await tx.query("COMMIT");
        console.log(`\nWROTE difficulty updates for ${updates.length} items`);
      } finally { tx.release(); }
    }
    if (RETIRE && retireList.length) {
      const tx = await pool.connect();
      try {
        await tx.query("BEGIN");
        for (const id of retireList) await tx.query(`UPDATE lt_items SET status = 'retired' WHERE id = $1`, [id]);
        await tx.query("COMMIT");
        console.log(`\nRETIRED ${retireList.length} low-discrimination items (pb < 0.15)`);
      } finally { tx.release(); }
    }
    if (!WRITE && !RETIRE) console.log(`\nDry-run only: ${updates.length} difficulty updates + ${retireList.length} retirement candidates. Re-run with --write [--retire] to persist.`);
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
