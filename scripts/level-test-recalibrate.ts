/**
 * Venoxa Level Test — Rasch recalibration (run manually after ~100 responses).
 *
 * Re-estimates item difficulties from real `lt_responses` and blends them with
 * the CEFR seed prior (A1 -2.5 … C2 2.5). It also computes each item's
 * rest-score point-biserial correlation and flags items below 0.15, which are
 * candidates for rewriting/retiring.
 *
 * By default it only writes review files:
 *   scripts/output/level-test-recalibration.sql
 *   docs/level-test/recalibration-report.md
 *
 * Apply the SQL yourself in Supabase, or pass --apply to run it through
 * DATABASE_URL inside a transaction.
 *
 * Run:
 *   node --env-file=.env scripts/level-test-recalibrate.ts
 *   node --env-file=.env scripts/level-test-recalibrate.ts --apply
 *
 * Env:
 *   DATABASE_URL  required
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Pool } from 'pg';

import { SEED_DIFFICULTY, type CefrLevel } from '../lib/level-test-engine.ts';

const DB_URL = (process.env.DATABASE_URL ?? '').trim();
const MIN_RESPONSES = Math.max(1, Number(process.env.LEVEL_TEST_RECAL_MIN_RESPONSES ?? 5));
const PRIOR_WEIGHT = Math.max(0, Number(process.env.LEVEL_TEST_RECAL_PRIOR_WEIGHT ?? 10));
const APPLY = process.argv.slice(2).includes('--apply');
const SQL_PATH = 'scripts/output/level-test-recalibration.sql';
const REPORT_PATH = 'docs/level-test/recalibration-report.md';

interface ItemStats {
  id: string;
  cefr_tag: CefrLevel;
  type: string;
  prior_b: number;
  n: number;
  correct: number;
}

interface ResponseRow {
  session_id: string;
  item_id: string;
  correct: boolean;
}

interface CalibrationRow {
  id: string;
  type: string;
  cefrTag: CefrLevel;
  prior: number;
  n: number;
  p: number;
  observed: number;
  blended: number;
  r: number | null;
  flag: string;
}

function logit(p: number): number {
  const clipped = Math.min(0.98, Math.max(0.02, p));
  return Math.log((1 - clipped) / clipped);
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}

async function main(): Promise<void> {
  if (!DB_URL) {
    console.error('Missing DATABASE_URL. Add it to .env and retry.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: DB_URL });
  const client = await pool.connect();
  try {
    const responseResult = await client.query<ResponseRow>(
      `select session_id::text as session_id, item_id, correct from lt_responses order by id`,
    );
    const responses = responseResult.rows;
    if (responses.length < 100) {
      console.error(
        `[recal] only ${responses.length} responses — wait for at least 100 before recalibrating.`,
      );
      process.exit(1);
    }

    const totals = new Map<string, number>();
    for (const response of responses) {
      totals.set(response.session_id, (totals.get(response.session_id) ?? 0) + (response.correct ? 1 : 0));
    }

    const itemResult = await client.query<ItemStats>(
      `select i.id, i.cefr_tag, i.type, i.difficulty_b as prior_b,
              count(r.id)::int as n,
              coalesce(sum(case when r.correct then 1 else 0 end), 0)::int as correct
         from lt_items i
         left join lt_responses r on r.item_id = i.id
        group by i.id
        order by i.id`,
    );
    const items = itemResult.rows;

    const byItem = new Map<string, ResponseRow[]>();
    for (const response of responses) {
      const list = byItem.get(response.item_id) ?? [];
      list.push(response);
      byItem.set(response.item_id, list);
    }

    const rows: CalibrationRow[] = items.map((item) => {
      const itemResponses = byItem.get(item.id) ?? [];
      const n = itemResponses.length;
      const p = n > 0 ? itemResponses.filter((response) => response.correct).length / n : 0.5;
      const observed = logit(p);
      const prior = SEED_DIFFICULTY[item.cefr_tag] ?? Number(item.prior_b);
      const blended =
        n > 0
          ? (n * observed + PRIOR_WEIGHT * prior) / (n + PRIOR_WEIGHT)
          : prior;

      const xs: number[] = [];
      const ys: number[] = [];
      for (const response of itemResponses) {
        xs.push(response.correct ? 1 : 0);
        ys.push((totals.get(response.session_id) ?? 0) - (response.correct ? 1 : 0));
      }
      const r = pearson(xs, ys);

      let flag = '';
      if (n < MIN_RESPONSES) flag = 'low-n';
      else if (r !== null && r < 0.15) flag = 'low-discrimination';

      return {
        id: item.id,
        type: item.type,
        cefrTag: item.cefr_tag,
        prior,
        n,
        p,
        observed,
        blended,
        r,
        flag,
      };
    });

    const updates = rows.filter((row) => row.n >= MIN_RESPONSES);
    const flagged = rows.filter((row) => row.flag === 'low-discrimination');

    const sql: string[] = [];
    sql.push('-- Venoxa Level Test — Rasch recalibration');
    sql.push(`-- Generated: ${new Date().toISOString()}`);
    sql.push(`-- Responses: ${responses.length} · items updated: ${updates.length}`);
    sql.push('-- Review this file before running it. Items flagged low-discrimination are listed in the report.');
    sql.push('');
    sql.push('begin;');
    sql.push('');
    for (const row of updates) {
      sql.push(
        `update lt_items set difficulty_b = ${row.blended.toFixed(4)} where id = '${row.id.replace(/'/g, "''")}';`,
      );
    }
    sql.push('');
    sql.push('commit;');
    sql.push('');

    mkdirSync(dirname(resolve(SQL_PATH)), { recursive: true });
    writeFileSync(resolve(SQL_PATH), sql.join('\n'), 'utf8');

    const report: string[] = [];
    report.push('# Venoxa Level Test — recalibration report');
    report.push('');
    report.push(`- Generated: ${new Date().toISOString()}`);
    report.push(`- Responses: **${responses.length}** across **${totals.size}** sessions`);
    report.push(`- Items with ≥${MIN_RESPONSES} responses: **${updates.length}** of ${rows.length}`);
    report.push(`- Flagged low discrimination (r < 0.15): **${flagged.length}**`);
    report.push(`- CEFR prior weight: ${PRIOR_WEIGHT}`);
    report.push('');
    report.push('## Items updated');
    report.push('');
    report.push('| Item | Level | Type | n | p | b observed | b blended | r | Flag |');
    report.push('| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |');
    for (const row of updates) {
      report.push(
        `| ${row.id} | ${row.cefrTag} | ${row.type} | ${row.n} | ${row.p.toFixed(2)} | ${row.observed.toFixed(2)} | ${row.blended.toFixed(2)} | ${
          row.r === null ? '—' : row.r.toFixed(2)
        } | ${row.flag || 'ok'} |`,
      );
    }
    report.push('');
    report.push('## Review queue');
    report.push('');
    if (flagged.length === 0) {
      report.push('No items below the 0.15 discrimination threshold.');
    } else {
      for (const row of flagged) {
        report.push(
          `- **${row.id}** (${row.cefrTag}, ${row.type}): n=${row.n}, p=${row.p.toFixed(2)}, r=${row.r?.toFixed(2)}`,
        );
      }
    }
    report.push('');
    report.push('## Method');
    report.push('');
    report.push('- Observed difficulty: `b = logit(1 - p)` with p clipped to [0.02, 0.98].');
    report.push(`- Blended difficulty: \`(n·b_observed + ${PRIOR_WEIGHT}·b_CEFR) / (n + ${PRIOR_WEIGHT})\`.`);
    report.push('- Discrimination: Pearson correlation between item correctness and the session rest score.');
    report.push('- Low-n items are not updated; low-discrimination items are listed for human review.');
    report.push('');

    mkdirSync(dirname(resolve(REPORT_PATH)), { recursive: true });
    writeFileSync(resolve(REPORT_PATH), report.join('\n'), 'utf8');

    console.log(`[recal] responses=${responses.length} sessions=${totals.size}`);
    console.log(`[recal] items updated=${updates.length} flagged=${flagged.length}`);
    console.log(`[recal] SQL   → ${resolve(SQL_PATH)}`);
    console.log(`[recal] report→ ${resolve(REPORT_PATH)}`);

    if (APPLY) {
      await client.query('begin');
      try {
        for (const row of updates) {
          await client.query(`update lt_items set difficulty_b = $1 where id = $2`, [
            Number(row.blended.toFixed(4)),
            row.id,
          ]);
        }
        await client.query('commit');
        console.log(`[recal] applied ${updates.length} updates to the database`);
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[recal] fatal:', error);
  process.exit(1);
});
