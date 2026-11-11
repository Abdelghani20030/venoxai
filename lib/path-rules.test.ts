/**
 * Unit tests for the learning-path rules (spec §6).
 *
 * Run with:  node --test lib/path-rules.test.ts
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeStates,
  isBelowStart,
  isExerciseCorrect,
  levelCompletion,
  lessonXpBonus,
  nextStreak,
  normAnswer,
  scoreAttempt,
  xpForAttempt,
  type LessonKind,
  type PathNode,
} from './path-rules.ts';

/* ── fixtures ────────────────────────────────────────────────────────────── */

let nextId = 0;
function node(
  level: string,
  order: number,
  kind: LessonKind = 'lesson',
  status: 'draft' | 'published' = 'published',
): PathNode {
  nextId += 1;
  return {
    id: `n${nextId}`,
    slug: `${level.toLowerCase()}-${order}`,
    level_code: level,
    order_index: order,
    kind,
    status,
  };
}

const DONE = (n: PathNode) => ({ lesson_id: n.id, status: 'completed' });

/* ── the chain (§6.1) ────────────────────────────────────────────────────── */

test('fresh A1 user: lesson 1 is current, the chain and higher levels are locked', () => {
  const l1 = node('A1', 1);
  const l2 = node('A1', 2);
  const recap = node('A1', 3, 'revision');
  const check = node('A1', 4, 'assessment');
  const a2 = node('A2', 1);
  const computed = computeStates([l1, l2, recap, check, a2], [], 'A1');

  assert.equal(computed.currentLessonId, l1.id);
  assert.equal(computed.nodes.get(l1.id)?.state, 'current');
  assert.equal(computed.nodes.get(l2.id)?.state, 'locked');
  assert.equal(computed.nodes.get(recap.id)?.state, 'revision');
  assert.equal(computed.nodes.get(check.id)?.state, 'locked');
  assert.equal(computed.nodes.get(a2.id)?.state, 'locked');
  assert.equal(computed.nodes.get(a2.id)?.reason, 'level_locked');
  assert.deepEqual(computed.lockedLevels, ['A2']);
});

test('completing lesson N unlocks lesson N+1 only', () => {
  const l1 = node('A1', 1);
  const l2 = node('A1', 2);
  const l3 = node('A1', 3);
  const computed = computeStates([l1, l2, l3], [DONE(l1)], 'A1');

  assert.equal(computed.nodes.get(l1.id)?.state, 'completed');
  assert.equal(computed.nodes.get(l2.id)?.state, 'current');
  assert.equal(computed.nodes.get(l3.id)?.state, 'locked');
  assert.equal(computed.currentLessonId, l2.id);
});

test('revision nodes never block the chain (§6.4)', () => {
  const l1 = node('A1', 1);
  const recap = node('A1', 2, 'revision');
  const l2 = node('A1', 3);
  const computed = computeStates([l1, recap, l2], [DONE(recap)], 'A1');

  assert.equal(computed.nodes.get(recap.id)?.state, 'revision');
  assert.equal(computed.nodes.get(l1.id)?.state, 'current');
  assert.equal(computed.currentLessonId, l1.id);
});

test('draft lessons block what comes after them', () => {
  const l7 = node('A1', 7);
  const l8 = node('A1', 8);
  const draft = node('A1', 9, 'lesson', 'draft');
  const after = node('A1', 10, 'lesson', 'draft');
  const computed = computeStates([l7, l8, draft, after], [DONE(l7), DONE(l8)], 'A1');

  assert.equal(computed.nodes.get(draft.id)?.state, 'current');
  assert.equal(computed.nodes.get(draft.id)?.draft, true);
  assert.equal(computed.nodes.get(after.id)?.state, 'locked');
  assert.equal(computed.currentLessonId, draft.id);
});

/* ── level gates (§6.1) ──────────────────────────────────────────────────── */

test('the next level unlocks only when the level check is passed', () => {
  const a1 = [node('A1', 1), node('A1', 2), node('A1', 3, 'assessment')];
  const a2 = [node('A2', 1), node('A2', 2)];

  const locked = computeStates([...a1, ...a2], [DONE(a1[0]), DONE(a1[1])], 'A1');
  assert.equal(locked.nodes.get(a2[0].id)?.state, 'locked');
  assert.equal(locked.currentLessonId, a1[2].id);

  const unlocked = computeStates(
    [...a1, ...a2],
    [DONE(a1[0]), DONE(a1[1]), DONE(a1[2])],
    'A1',
  );
  assert.equal(unlocked.nodes.get(a1[2].id)?.state, 'completed');
  assert.equal(unlocked.nodes.get(a2[0].id)?.state, 'current');
  assert.equal(unlocked.nodes.get(a2[1].id)?.state, 'locked');
});

test('a draft level check keeps the next level locked', () => {
  const a1 = [node('A1', 1), node('A1', 2, 'assessment', 'draft')];
  const a2 = [node('A2', 1)];
  const computed = computeStates([...a1, ...a2], [DONE(a1[0])], 'A1');

  assert.equal(computed.nodes.get(a1[1].id)?.state, 'current');
  assert.equal(computed.nodes.get(a2[0].id)?.state, 'locked');
});

test('a level with no assessment gates on its last non-revision node', () => {
  const a1 = [node('A1', 1), node('A1', 2)];
  const a2 = [node('A2', 1)];

  const partial = computeStates([...a1, ...a2], [DONE(a1[0])], 'A1');
  assert.equal(partial.nodes.get(a2[0].id)?.state, 'locked');

  const allDone = computeStates([...a1, ...a2], [DONE(a1[0]), DONE(a1[1])], 'A1');
  assert.equal(allDone.nodes.get(a2[0].id)?.state, 'current');
});

test('an empty level never unlocks the next level', () => {
  const a2 = [node('A2', 1)];
  const computed = computeStates([...a2], [], 'A1');
  assert.equal(computed.nodes.get(a2[0].id)?.state, 'locked');
  assert.equal(computed.nodes.get(a2[0].id)?.reason, 'level_locked');
});

/* ── placement (§6.3) ────────────────────────────────────────────────────── */

test('placement opens below-start levels for revision, not completed', () => {
  const a1 = node('A1', 1);
  const a2 = node('A2', 1);
  const b1 = node('B1', 1);
  const b2 = node('B2', 1);
  const computed = computeStates([a1, a2, b1, b2], [], 'B1');

  assert.equal(computed.nodes.get(a1.id)?.state, 'revision');
  assert.equal(computed.nodes.get(a1.id)?.completed, false);
  assert.equal(computed.nodes.get(a2.id)?.state, 'revision');
  assert.equal(computed.nodes.get(b1.id)?.state, 'current');
  assert.equal(computed.nodes.get(b2.id)?.state, 'locked');
  assert.deepEqual(computed.revisionLevels, ['A1', 'A2']);
  assert.equal(computed.currentLessonId, b1.id);
});

test('completed work below the start level still reads as revision', () => {
  const a1 = node('A1', 1);
  const a2 = node('A2', 1);
  const computed = computeStates([a1, a2], [DONE(a1)], 'A2');
  assert.equal(computed.nodes.get(a1.id)?.state, 'revision');
  assert.equal(computed.nodes.get(a1.id)?.completed, true);
  assert.equal(computed.nodes.get(a2.id)?.state, 'current');
});

test('isBelowStart matches the level order', () => {
  assert.equal(isBelowStart('A1', 'B1'), true);
  assert.equal(isBelowStart('B1', 'B1'), false);
  assert.equal(isBelowStart('C1', 'A1'), false);
  assert.equal(isBelowStart('A1', 'A1'), false);
});

/* ── XP (showcase formula) ───────────────────────────────────────────────── */

test('lesson XP: base 40 plus the score bonus capped at +12', () => {
  assert.equal(lessonXpBonus(70), 0);
  assert.equal(lessonXpBonus(75), 2);
  assert.equal(lessonXpBonus(80), 4);
  assert.equal(lessonXpBonus(100), 12);
  assert.equal(lessonXpBonus(102), 12);
  assert.equal(lessonXpBonus(60), 0);

  assert.deepEqual(xpForAttempt('lesson', 70, 70, 40), { passed: true, xp: 40 });
  assert.deepEqual(xpForAttempt('lesson', 75, 70, 40), { passed: true, xp: 42 });
  assert.deepEqual(xpForAttempt('lesson', 100, 70, 40), { passed: true, xp: 52 });
});

test('failed attempts, assessments and revisions follow the flat rules', () => {
  assert.deepEqual(xpForAttempt('lesson', 69, 70, 40), { passed: false, xp: 0 });
  assert.deepEqual(xpForAttempt('assessment', 70, 70, 60), { passed: true, xp: 60 });
  assert.deepEqual(xpForAttempt('assessment', 100, 70, 60), { passed: true, xp: 60 });
  assert.deepEqual(xpForAttempt('revision', 100, 70, 0), { passed: true, xp: 0 });
});

/* ── grading ─────────────────────────────────────────────────────────────── */

test('mcq grading compares option indexes', () => {
  const ex = { type: 'mcq' as const, answer: '0' };
  assert.equal(isExerciseCorrect(ex, '0'), true);
  assert.equal(isExerciseCorrect(ex, 0), true);
  assert.equal(isExerciseCorrect(ex, '2'), false);
  assert.equal(isExerciseCorrect(ex, undefined), false);
});

test('type-in grading trims, folds case and collapses spaces', () => {
  const ex = { type: 'type_in' as const, answer: ['turn off', 'Turn  Off'] };
  assert.equal(isExerciseCorrect(ex, 'turn off'), true);
  assert.equal(isExerciseCorrect(ex, '  TURN   OFF '), true);
  assert.equal(isExerciseCorrect(ex, 'turn on'), false);
  assert.equal(isExerciseCorrect(ex, ''), false);
  assert.equal(normAnswer('Don’t   Give UP '), 'don’t give up');
});

test('order grading compares normalized sequences', () => {
  const ex = { type: 'order' as const, answer: ['I', 'am', 'ready'] };
  assert.equal(isExerciseCorrect(ex, ['I', 'am', 'ready']), true);
  assert.equal(isExerciseCorrect(ex, ['i', ' AM ', 'ready']), true);
  assert.equal(isExerciseCorrect(ex, ['am', 'I', 'ready']), false);
  assert.equal(isExerciseCorrect(ex, ['I', 'am']), false);
});

test('scoreAttempt rounds the percentage across a mixed attempt', () => {
  const exercises = [
    { type: 'mcq' as const, answer: '0' },
    { type: 'type_in' as const, answer: ['am'] },
    { type: 'listen_mcq' as const, answer: '1' },
  ];
  assert.deepEqual(scoreAttempt(exercises, ['0', 'am', '0']), {
    correct: 2,
    total: 3,
    score: 67,
  });
  assert.deepEqual(scoreAttempt(exercises, ['1', 'is', '0']), {
    correct: 0,
    total: 3,
    score: 0,
  });
  assert.deepEqual(scoreAttempt([], []), { correct: 0, total: 0, score: 0 });
});

/* ── streak ──────────────────────────────────────────────────────────────── */

test('streak continues on consecutive days and resets after a gap', () => {
  assert.equal(nextStreak(3, '2026-01-05', '2026-01-05'), 3);
  assert.equal(nextStreak(3, '2026-01-04', '2026-01-05'), 4);
  assert.equal(nextStreak(3, '2026-01-01', '2026-01-05'), 1);
  assert.equal(nextStreak(0, null, '2026-01-05'), 1);
});

/* ── completion counts ───────────────────────────────────────────────────── */

test('levelCompletion counts published non-revision nodes only', () => {
  const l1 = node('A1', 1);
  const l2 = node('A1', 2);
  const recap = node('A1', 3, 'revision');
  const draft = node('A1', 4, 'lesson', 'draft');
  const a2 = node('A2', 1);
  const computed = computeStates([l1, l2, recap, draft, a2], [DONE(l1)], 'A1');
  const completion = levelCompletion([l1, l2, recap, draft, a2], computed);

  assert.deepEqual(completion.get('A1'), { done: 1, total: 2 });
  assert.deepEqual(completion.get('A2'), { done: 0, total: 1 });
});
