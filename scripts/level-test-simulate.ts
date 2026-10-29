/**
 * Venoxa Level Test — Phase A simulation.
 *
 * Simulates N virtual learners with known abilities answering a synthetic
 * 240-item Rasch bank, runs the real adaptive engine against them, and writes
 * a short accuracy/exposure report.
 *
 * Run:
 *   node scripts/level-test-simulate.ts
 *   $env:LEARNERS="2000"; node scripts/level-test-simulate.ts
 *
 * Output: docs/level-test/phase-a-simulation.md
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  CEFR_LEVELS,
  DEFAULT_CONFIG,
  QUICK_CONFIG,
  SEED_DIFFICULTY,
  cefrFromScore,
  logistic,
  scoreFromTheta,
  scoreResult,
  selectNextItem,
  stopReason,
  updateAbility,
  type CefrLevel,
  type EngineConfig,
  type EngineItem,
  type ItemType,
  type ScoredResponse,
  type StopReason,
} from '../lib/level-test-engine.ts';

/* ── deterministic RNG ───────────────────────────────────────────────────── */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rng: () => number): number {
  // Box–Muller (no caching needed for a one-off simulation).
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ── synthetic item bank ─────────────────────────────────────────────────── */

interface SimBank {
  items: EngineItem[];
  byId: Map<string, EngineItem>;
}

function buildBank(): SimBank {
  const rng = mulberry32(424242);
  const items: EngineItem[] = [];
  const perLevel: Record<ItemType, number> = { grammar: 14, vocab: 8, listening: 6, reading: 12 };

  for (const level of CEFR_LEVELS) {
    const seed = SEED_DIFFICULTY[level];
    const difficulty = () => {
      const jitter = Math.max(-0.55, Math.min(0.55, normal(rng) * 0.3));
      return Number((seed + jitter).toFixed(4));
    };

    for (let i = 0; i < perLevel.grammar; i++) {
      items.push({
        id: `g-${level}-${i + 1}`,
        type: 'grammar',
        cefrTag: level,
        difficulty: difficulty(),
      });
    }
    for (let i = 0; i < perLevel.vocab; i++) {
      items.push({
        id: `v-${level}-${i + 1}`,
        type: 'vocab',
        cefrTag: level,
        difficulty: difficulty(),
      });
    }
    for (let i = 0; i < perLevel.listening; i++) {
      items.push({
        id: `l-${level}-${i + 1}`,
        type: 'listening',
        cefrTag: level,
        difficulty: difficulty(),
      });
    }
    // Four reading passages per level, three questions each. Questions in a
    // passage share a passage difficulty with a little item-level noise.
    const passageCount = perLevel.reading / 3;
    for (let p = 0; p < passageCount; p++) {
      const passageB = difficulty();
      for (let q = 0; q < 3; q++) {
        items.push({
          id: `r-${level}-${p + 1}-${q + 1}`,
          type: 'reading',
          cefrTag: level,
          difficulty: Number((passageB + normal(rng) * 0.12).toFixed(4)),
          passageId: `p-${level}-${p + 1}`,
          passageOrder: q + 1,
        });
      }
    }
  }

  return { items, byId: new Map(items.map((item) => [item.id, item])) };
}

/* ── one simulated learner ───────────────────────────────────────────────── */

interface LearnerOutcome {
  trueTheta: number;
  theta: number;
  se: number;
  score: number;
  level: CefrLevel;
  trueLevel: CefrLevel;
  items: number;
  stop: StopReason;
  responses: ScoredResponse[];
}

/* ── metrics ─────────────────────────────────────────────────────────────── */

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function bandDistance(a: CefrLevel, b: CefrLevel): number {
  return Math.abs(CEFR_LEVELS.indexOf(a) - CEFR_LEVELS.indexOf(b));
}

interface Summary {
  learners: number;
  mae: number;
  rmse: number;
  bias: number;
  avgItems: number;
  medianItems: number;
  bandExact: number;
  bandWithinOne: number;
  ciCoverage: number;
  avgSe: number;
  byBand: Array<{ level: CefrLevel; n: number; mae: number; bandExact: number }>;
  stopCounts: Record<string, number>;
  exposure: {
    mean: number;
    median: number;
    max: number;
    p95: number;
    unused: number;
    top: Array<{ id: string; shown: number }>;
  };
}

function summarise(outcomes: LearnerOutcome[]): Summary {
  const errors = outcomes.map((o) => o.theta - o.trueTheta);
  const abs = errors.map((e) => Math.abs(e));
  const mae = abs.reduce((a, b) => a + b, 0) / abs.length;
  const rmse = Math.sqrt(errors.reduce((a, e) => a + e * e, 0) / errors.length);
  const bias = errors.reduce((a, b) => a + b, 0) / errors.length;

  const bandExact =
    outcomes.filter((o) => o.level === o.trueLevel).length / outcomes.length;
  const bandWithinOne =
    outcomes.filter((o) => bandDistance(o.level, o.trueLevel) <= 1).length / outcomes.length;
  const ciCoverage =
    outcomes.filter((o) => Math.abs(o.theta - o.trueTheta) <= 1.96 * o.se).length /
    outcomes.length;

  const byBand = CEFR_LEVELS.map((level) => {
    const subset = outcomes.filter((o) => o.trueLevel === level);
    return {
      level,
      n: subset.length,
      mae: subset.length
        ? subset.reduce((a, o) => a + Math.abs(o.theta - o.trueTheta), 0) / subset.length
        : 0,
      bandExact: subset.length
        ? subset.filter((o) => o.level === level).length / subset.length
        : 0,
    };
  });

  const stopCounts: Record<string, number> = {};
  for (const outcome of outcomes) stopCounts[outcome.stop] = (stopCounts[outcome.stop] ?? 0) + 1;

  return {
    learners: outcomes.length,
    mae,
    rmse,
    bias,
    avgItems: outcomes.reduce((a, o) => a + o.items, 0) / outcomes.length,
    medianItems: median(outcomes.map((o) => o.items)),
    bandExact,
    bandWithinOne,
    ciCoverage,
    avgSe: outcomes.reduce((a, o) => a + o.se, 0) / outcomes.length,
    byBand,
    stopCounts,
    exposure: {
      mean: 0,
      median: 0,
      max: 0,
      p95: 0,
      unused: 0,
      top: [],
    },
  };
}

/* ── exposure (needs response ids, tracked separately) ───────────────────── */

interface OutcomeWithIds extends LearnerOutcome {
  ids: string[];
}

function runWithIds(
  learners: number,
  seed: number,
  config: EngineConfig,
): { summary: Summary; outcomes: OutcomeWithIds[]; bank: SimBank } {
  const bank = buildBank();
  const rng = mulberry32(seed);
  const outcomes: OutcomeWithIds[] = [];

  for (let i = 0; i < learners; i++) {
    const trueTheta = -3 + (6 * (i + 0.5)) / learners;
    const used = new Set<string>();
    const counts: Partial<Record<ItemType, number>> = {};
    const responses: ScoredResponse[] = [];
    const ids: string[] = [];
    let theta = 0;
    let se = config.priorSd;
    let activePassageId: string | null = null;
    let stop: StopReason = 'max-items';

    for (;;) {
      const remaining = bank.items.filter((item) => !used.has(item.id)).length;
      const reason = stopReason({ answered: responses.length, se, remainingItems: remaining, config });
      if (reason) {
        stop = reason;
        break;
      }
      const picked = selectNextItem({
        theta,
        items: bank.items,
        usedIds: used,
        counts,
        answered: responses.length,
        activePassageId,
        config,
        rng,
      });
      if (!picked.item) {
        stop = 'no-items';
        break;
      }
      const chosen = picked.item;
      const correct = rng() < logistic(trueTheta - chosen.difficulty);
      used.add(chosen.id);
      ids.push(chosen.id);
      counts[chosen.type] = (counts[chosen.type] ?? 0) + 1;
      responses.push({ difficulty: chosen.difficulty, correct, type: chosen.type });
      if (chosen.type === 'reading' && chosen.passageId) {
        activePassageId = chosen.passageId;
        const passageRemaining = bank.items.some(
          (candidate) => candidate.passageId === chosen.passageId && !used.has(candidate.id),
        );
        if (!passageRemaining) activePassageId = null;
      } else {
        activePassageId = null;
      }
      const estimate = updateAbility(theta, responses, config);
      theta = estimate.theta;
      se = estimate.se;
    }

    const result = scoreResult(responses, config, { theta, se });
    outcomes.push({
      trueTheta,
      theta,
      se,
      score: result.score,
      level: result.level,
      trueLevel: cefrFromScore(scoreFromTheta(trueTheta)),
      items: responses.length,
      stop,
      responses,
      ids,
    });
  }

  const summary = summarise(outcomes);
  const shown = new Map<string, number>();
  for (const item of bank.items) shown.set(item.id, 0);
  for (const outcome of outcomes) {
    for (const id of outcome.ids) shown.set(id, (shown.get(id) ?? 0) + 1);
  }
  const counts = [...shown.values()];
  const total = counts.reduce((a, b) => a + b, 0);
  const top = [...shown.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, count]) => ({ id, shown: count }));

  summary.exposure = {
    mean: total / counts.length,
    median: median(counts),
    max: Math.max(...counts),
    p95: percentile(counts, 95),
    unused: counts.filter((count) => count === 0).length,
    top,
  };

  return { summary, outcomes, bank };
}

/* ── report ──────────────────────────────────────────────────────────────── */

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function reportMarkdown(
  learners: number,
  seed: number,
  standard: { summary: Summary; bank: SimBank },
  quick: { summary: Summary },
  quickLearners: number,
): string {
  const s = standard.summary;
  const q = quick.summary;
  const lines: string[] = [];

  lines.push('# Venoxa Level Test — Phase A simulation report');
  lines.push('');
  lines.push(`- Learners: **${learners.toLocaleString()}** in standard mode, **${quickLearners.toLocaleString()}** in quick mode (abilities evenly spread from −3 to +3 logits)`);
  lines.push(`- RNG seed: \`${seed}\` (deterministic)`);
  lines.push(`- Bank: ${standard.bank.items.length} synthetic Rasch items (40 per CEFR level; grammar 14 / vocab 8 / reading 12 / listening 6)`);
  lines.push('- Engine: 1PL EAP, N(0, 1.5) prior, grid −4…4 step 0.05, early-step clip 1 logit for the first 6 answers');
  lines.push('');
  lines.push('## Standard mode (max 32 items)');
  lines.push('');
  lines.push('| Metric | Result | Target |');
  lines.push('| --- | ---: | ---: |');
  lines.push(`| Mean absolute error (logits) | **${s.mae.toFixed(3)}** | < 0.40 |`);
  lines.push(`| RMSE (logits) | ${s.rmse.toFixed(3)} | — |`);
  lines.push(`| Bias (estimated − true) | ${s.bias.toFixed(3)} | ≈ 0 |`);
  lines.push(`| Average items answered | ${s.avgItems.toFixed(1)} (median ${s.medianItems}) | 20–32 |`);
  lines.push(`| CEFR band exact | ${pct(s.bandExact)} | — |`);
  lines.push(`| CEFR band within one | ${pct(s.bandWithinOne)} | — |`);
  lines.push(`| 95% CI coverage | ${pct(s.ciCoverage)} | ≈ 95% |`);
  lines.push(`| Average posterior SE | ${s.avgSe.toFixed(3)} | — |`);
  lines.push('');
  lines.push('### Accuracy by true CEFR band');
  lines.push('');
  lines.push('| True band | Learners | MAE | Band exact |');
  lines.push('| --- | ---: | ---: | ---: |');
  for (const row of s.byBand) {
    lines.push(`| ${row.level} | ${row.n} | ${row.mae.toFixed(3)} | ${pct(row.bandExact)} |`);
  }
  lines.push('');
  lines.push('### Stop reasons');
  lines.push('');
  lines.push('| Reason | Sessions | Share |');
  lines.push('| --- | ---: | ---: |');
  for (const [reason, count] of Object.entries(s.stopCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${reason} | ${count} | ${pct(count / learners)} |`);
  }
  lines.push('');
  lines.push('### Item exposure');
  lines.push('');
  lines.push(`- Mean shows per item: ${s.exposure.mean.toFixed(1)} (${pct(s.exposure.mean / learners)} of learners)`);
  lines.push(`- Median: ${s.exposure.median.toFixed(0)} · 95th percentile: ${s.exposure.p95.toFixed(0)} · max: ${s.exposure.max} (${pct(s.exposure.max / learners)})`);
  lines.push(`- Items never shown: ${s.exposure.unused} / ${standard.bank.items.length} (${pct(s.exposure.unused / standard.bank.items.length)})`);
  lines.push('- Most exposed items: ' + s.exposure.top.map((entry) => `\`${entry.id}\` (${entry.shown})`).join(', '));
  lines.push('');
  lines.push('## Quick mode (max 15 items, less precise)');
  lines.push('');
  lines.push('| Metric | Result |');
  lines.push('| --- | ---: |');
  lines.push(`| Mean absolute error (logits) | **${q.mae.toFixed(3)}** |`);
  lines.push(`| CEFR band exact | ${pct(q.bandExact)} |`);
  lines.push(`| CEFR band within one | ${pct(q.bandWithinOne)} |`);
  lines.push(`| Average items answered | ${q.avgItems.toFixed(1)} |`);
  lines.push(`| 95% CI coverage | ${pct(q.ciCoverage)} |`);
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- The synthetic bank uses seed difficulties by CEFR tag with ±0.55-logit jitter, so these numbers measure the engine, not the quality of the real item bank. Real-bank accuracy depends on item calibration and review.');
  lines.push('- The early-step clip limits how far one lucky answer can move the reported theta in the first six items; the posterior SE is unaffected.');
  lines.push('- With 1PL, 32 perfectly targeted items yield SE ≈ 0.354, so the SE < 0.35 stop rule is reached only in a small minority of sessions; most learners use the 32-item cap. This is expected from the specified model and matches the ~25-minute target. The 20-item minimum still applies when a session times out or runs out of items.');
  lines.push('- Exposure control picks randomly among the five most informative candidates (or passages), which spreads usage across the bank; items near the middle of the ability range are naturally shown most often.');
  lines.push('- Item selection targets the 35/20/30/15 content mix. Reading is served passage-by-passage, so the mix can overshoot by one passage early in a session and self-corrects later.');
  lines.push('');

  return lines.join('\n');
}

/* ── main ────────────────────────────────────────────────────────────────── */

function main(): void {
  const learners = Number(process.env.LEARNERS ?? 2000);
  const seed = Number(process.env.SEED ?? 20261029);
  if (!Number.isFinite(learners) || learners < 10) {
    throw new Error('LEARNERS must be a number >= 10');
  }

  console.log(`[sim] standard mode — ${learners} learners…`);
  const standard = runWithIds(learners, seed, DEFAULT_CONFIG);
  console.log(
    `[sim] MAE ${standard.summary.mae.toFixed(3)} · band exact ${pct(standard.summary.bandExact)} · avg items ${standard.summary.avgItems.toFixed(1)}`,
  );

  const quickLearners = Math.max(200, Math.round(learners / 2));
  console.log(`[sim] quick mode — ${quickLearners} learners…`);
  const quick = runWithIds(quickLearners, seed + 1, QUICK_CONFIG);
  console.log(`[sim] quick MAE ${quick.summary.mae.toFixed(3)} · avg items ${quick.summary.avgItems.toFixed(1)}`);

  const outPath = resolve(process.cwd(), 'docs/level-test/phase-a-simulation.md');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, reportMarkdown(learners, seed, standard, quick, quickLearners), 'utf8');
  console.log(`[sim] report written to ${outPath}`);
}

main();
