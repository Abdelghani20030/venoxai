/**
 * Unit tests for the Venoxa Level Test engine.
 *
 * Run with:  node --test lib/level-test-engine.test.ts
 * (Node 22.6+; Node 24 strips TypeScript natively.)
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CONFIG,
  QUICK_CONFIG,
  SEED_DIFFICULTY,
  clampEarlyTheta,
  cefrFromScore,
  computeSectionScores,
  estimateAbility,
  itemInformation,
  logistic,
  rangeFromTheta,
  scoreFromTheta,
  scoreResult,
  selectNextItem,
  stopReason,
  updateAbility,
  type EngineItem,
  type ItemType,
  type ScoredResponse,
} from './level-test-engine.ts';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function item(
  id: string,
  type: ItemType,
  difficulty: number,
  extra: Partial<EngineItem> = {},
): EngineItem {
  return { id, type, cefrTag: 'B1', difficulty, ...extra };
}

function bank(): EngineItem[] {
  const items: EngineItem[] = [];
  for (let i = 0; i < 40; i++) {
    items.push(item(`g${i}`, 'grammar', -2 + (i % 20) * 0.2));
    items.push(item(`v${i}`, 'vocab', -2 + (i % 20) * 0.2));
    items.push(item(`l${i}`, 'listening', -2 + (i % 20) * 0.2));
  }
  for (let p = 0; p < 14; p++) {
    for (let q = 0; q < 3; q++) {
      items.push(
        item(`r${p}-${q}`, 'reading', -2 + (p % 12) * 0.3, {
          passageId: `p${p}`,
          passageOrder: q + 1,
        }),
      );
    }
  }
  return items;
}

/* ── math / model ────────────────────────────────────────────────────────── */

test('logistic is stable and symmetric', () => {
  assert.equal(logistic(0), 0.5);
  assert.ok(Math.abs(logistic(2) + logistic(-2) - 1) < 1e-12);
  assert.equal(logistic(1000), 1);
  assert.equal(logistic(-1000), 0);
});

test('Fisher information peaks when b equals theta', () => {
  const atTheta = itemInformation(1.2, 1.2);
  assert.ok(Math.abs(atTheta - 0.25) < 1e-12);
  assert.ok(itemInformation(1.2, 1.2) > itemInformation(1.2, 0.2));
  assert.ok(itemInformation(1.2, 1.2) > itemInformation(1.2, 2.2));
});

test('all-correct answers raise theta and shrink SE', () => {
  const responses: ScoredResponse[] = Array.from({ length: 8 }, () => ({
    difficulty: 0,
    correct: true,
    type: 'grammar',
  }));
  const estimate = estimateAbility(responses);
  assert.ok(estimate.theta > 0, `theta ${estimate.theta}`);
  assert.ok(estimate.se < DEFAULT_CONFIG.priorSd);
  assert.ok(Math.abs(estimate.theta - estimate.rawTheta) < 1e-12);
});

test('all-wrong answers lower theta', () => {
  const responses: ScoredResponse[] = Array.from({ length: 8 }, () => ({
    difficulty: 0,
    correct: false,
    type: 'grammar',
  }));
  assert.ok(estimateAbility(responses).theta < 0);
});

test('more responses reduce the standard error', () => {
  const make = (n: number): ScoredResponse[] =>
    Array.from({ length: n }, () => ({ difficulty: 0, correct: true, type: 'grammar' }));
  assert.ok(estimateAbility(make(4)).se > estimateAbility(make(20)).se);
});

test('empty responses return the prior', () => {
  const estimate = estimateAbility([]);
  assert.ok(Math.abs(estimate.theta) < 1e-9);
  // The grid is truncated at +/-4, so the prior SD is a hair below 1.5.
  assert.ok(Math.abs(estimate.se - DEFAULT_CONFIG.priorSd) < 0.05);
});

/* ── early-step clipping ─────────────────────────────────────────────────── */

test('clampEarlyTheta caps early movement at one logit', () => {
  assert.equal(clampEarlyTheta(0, 2.4, 0), 1);
  assert.equal(clampEarlyTheta(0, -2.4, 0), -1);
  assert.equal(clampEarlyTheta(0.5, 1.2, 2), 1.2);
  // After the early window the cap no longer applies.
  assert.equal(clampEarlyTheta(0, 2.4, DEFAULT_CONFIG.earlyItems), 2.4);
});

test('updateAbility applies the early-step clip', () => {
  // Six easy items answered correctly move the raw EAP by ~0.77 logits.
  // A tighter maxEarlyStep proves the reported theta is the clipped one.
  const responses: ScoredResponse[] = Array.from({ length: 6 }, () => ({
    difficulty: SEED_DIFFICULTY.A1,
    correct: true,
    type: 'grammar',
  }));
  const strict = { ...DEFAULT_CONFIG, maxEarlyStep: 0.2 };
  const estimate = updateAbility(0, responses, strict);
  assert.ok(estimate.rawTheta > 0.5, `raw ${estimate.rawTheta}`);
  assert.ok(Math.abs(estimate.theta - 0.2) < 1e-9, `clipped ${estimate.theta}`);
  assert.ok(estimate.se > 0);

  // With the production cap of 1 logit this early pattern is not clipped.
  const normal = updateAbility(0, responses);
  assert.ok(Math.abs(normal.theta - normal.rawTheta) < 1e-9);
});

/* ── score / bands / range ───────────────────────────────────────────────── */

test('score mapping is 50 + 20*theta, clamped', () => {
  assert.equal(scoreFromTheta(0), 50);
  assert.equal(scoreFromTheta(1), 70);
  assert.equal(scoreFromTheta(-2.5), 0);
  assert.equal(scoreFromTheta(2.5), 100);
  assert.equal(scoreFromTheta(3.4), 100);
  assert.equal(scoreFromTheta(-4), 0);
});

test('CEFR band boundaries', () => {
  const cases: Array<[number, string]> = [
    [0, 'A1'],
    [9, 'A1'],
    [10, 'A2'],
    [29, 'A2'],
    [30, 'B1'],
    [49, 'B1'],
    [50, 'B2'],
    [69, 'B2'],
    [70, 'C1'],
    [89, 'C1'],
    [90, 'C2'],
    [100, 'C2'],
  ];
  for (const [score, level] of cases) assert.equal(cefrFromScore(score), level, `score ${score}`);
});

test('confidence range is score +/- 1.96*SE*20, clamped', () => {
  assert.deepEqual(rangeFromTheta(0, 0.35), { low: 36, high: 64 });
  assert.deepEqual(rangeFromTheta(3, 1), { low: 71, high: 100 });
  assert.deepEqual(rangeFromTheta(-3, 1), { low: 0, high: 29 });
});

/* ── item selection ──────────────────────────────────────────────────────── */

test('selection prefers informative items and never repeats', () => {
  const items: EngineItem[] = Array.from({ length: 20 }, (_, i) =>
    item(`g${i}`, 'grammar', -3 + i * 0.3),
  );
  const used = new Set<string>();
  for (let step = 0; step < 10; step++) {
    const result = selectNextItem({
      theta: 1,
      items,
      usedIds: used,
      counts: { grammar: step },
      answered: step,
      rng: () => 0.999,
    });
    assert.ok(result.item);
    assert.ok(!used.has(result.item!.id));
    // Chosen item must be within the 5 most informative unused items.
    const info = itemInformation(1, result.item!.difficulty);
    const better = items
      .filter((candidate) => !used.has(candidate.id))
      .map((candidate) => itemInformation(1, candidate.difficulty))
      .sort((a, b) => b - a);
    assert.ok(info >= better[Math.min(4, better.length - 1)] - 1e-12);
    used.add(result.item!.id);
  }
});

test('content balancing keeps the 35/20/30/15 mix roughly', () => {
  const items = bank();
  const used = new Set<string>();
  const counts: Partial<Record<ItemType, number>> = {};
  let theta = 0;
  let activePassageId: string | null = null;
  for (let step = 0; step < 20; step++) {
    const result = selectNextItem({
      theta,
      items,
      usedIds: used,
      counts,
      answered: step,
      activePassageId,
      rng: () => 0.5,
    });
    assert.ok(result.item, `no item at step ${step}`);
    const chosen = result.item!;
    used.add(chosen.id);
    counts[chosen.type] = (counts[chosen.type] ?? 0) + 1;
    activePassageId = result.passageId;
    if (activePassageId) {
      const left = items.some(
        (candidate) =>
          candidate.passageId === activePassageId && !used.has(candidate.id),
      );
      if (!left) activePassageId = null;
    }
    theta += 0.1;
  }
  const grammar = counts.grammar ?? 0;
  const vocab = counts.vocab ?? 0;
  const reading = counts.reading ?? 0;
  const listening = counts.listening ?? 0;
  assert.ok(grammar >= 5 && grammar <= 9, `grammar ${grammar}`);
  assert.ok(vocab >= 2 && vocab <= 6, `vocab ${vocab}`);
  assert.ok(reading >= 3 && reading <= 9, `reading ${reading}`);
  assert.ok(listening >= 1 && listening <= 5, `listening ${listening}`);
  assert.equal(grammar + vocab + reading + listening, 20);
});

test('reading passages are finished before a new one starts', () => {
  const items = bank();
  const used = new Set<string>(['r0-0']);
  const result = selectNextItem({
    theta: 0,
    items,
    usedIds: used,
    counts: { reading: 1 },
    answered: 1,
    activePassageId: 'p0',
    rng: () => 0,
  });
  assert.equal(result.item?.passageId, 'p0');
  assert.equal(result.item?.passageOrder, 2);
});

test('selection falls back when a section is exhausted', () => {
  const items = [item('g1', 'grammar', 0)];
  const result = selectNextItem({
    theta: 0,
    items,
    usedIds: new Set(),
    counts: { vocab: 4, reading: 6, listening: 3 },
    answered: 13,
    rng: () => 0,
  });
  assert.equal(result.item?.id, 'g1');
});

test('selection returns null for an empty pool', () => {
  const result = selectNextItem({
    theta: 0,
    items: [],
    usedIds: new Set(),
    counts: {},
    answered: 0,
  });
  assert.equal(result.item, null);
});

/* ── stopping rule ───────────────────────────────────────────────────────── */

test('stopping rule honours min items, max items, SE and timeout', () => {
  assert.equal(stopReason({ answered: 19, se: 0.2 }), null);
  assert.equal(stopReason({ answered: 20, se: 0.34 }), 'se');
  assert.equal(stopReason({ answered: 20, se: 0.36 }), null);
  assert.equal(stopReason({ answered: 32, se: 0.2 }), 'max-items');
  assert.equal(stopReason({ answered: 5, se: 0.2, timedOut: true }), 'timeout');
  assert.equal(stopReason({ answered: 5, se: 0.2, remainingItems: 0 }), 'no-items');
  assert.equal(stopReason({ answered: 32, se: 0.2, timedOut: true }), 'timeout');
});

test('quick mode stops earlier and is marked quick', () => {
  assert.equal(QUICK_CONFIG.quick, true);
  assert.equal(QUICK_CONFIG.maxItems, 15);
  assert.equal(stopReason({ answered: 9, se: 0.2, config: QUICK_CONFIG }), null);
  assert.equal(stopReason({ answered: 10, se: 0.49, config: QUICK_CONFIG }), 'se');
  assert.equal(stopReason({ answered: 15, se: 0.49, config: QUICK_CONFIG }), 'max-items');
});

/* ── sections / result ───────────────────────────────────────────────────── */

test('section scores flag fewer than four items as low confidence', () => {
  const responses: ScoredResponse[] = [
    ...Array.from({ length: 4 }, () => ({ difficulty: 0, correct: true, type: 'grammar' as const })),
    ...Array.from({ length: 2 }, () => ({ difficulty: 0, correct: true, type: 'vocab' as const })),
  ];
  const sections = computeSectionScores(responses);
  assert.equal(sections.grammar?.items, 4);
  assert.equal(sections.grammar?.lowConfidence, false);
  assert.equal(sections.vocab?.items, 2);
  assert.equal(sections.vocab?.lowConfidence, true);
  assert.equal(sections.reading, undefined);
  assert.equal(sections.listening, undefined);
});

test('scoreResult combines level, score, range and sections', () => {
  const responses: ScoredResponse[] = Array.from({ length: 20 }, (_, i) => ({
    difficulty: -1 + (i % 10) * 0.2,
    correct: i % 3 !== 0,
    type: (['grammar', 'vocab', 'reading', 'listening'] as ItemType[])[i % 4],
  }));
  const result = scoreResult(responses);
  assert.equal(result.answered, 20);
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.range.low <= result.score && result.range.high >= result.score);
  assert.equal(result.level, cefrFromScore(result.score));
  assert.ok(result.sections.grammar);
  assert.ok(result.sections.listening);
});

test('stored theta is used for the final score when supplied', () => {
  const responses: ScoredResponse[] = [{ difficulty: 0, correct: true, type: 'grammar' }];
  const stored = scoreResult(responses, DEFAULT_CONFIG, { theta: 2, se: 0.3 });
  assert.equal(stored.score, 90);
  assert.equal(stored.level, 'C2');
});
