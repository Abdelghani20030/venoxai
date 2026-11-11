/**
 * Learning-path rules (spec §6) — pure functions, no I/O.
 *
 * Everything the server enforces about unlocking, XP and streaks lives here
 * so it can be unit-tested without a database (`node --test lib/path-rules.test.ts`)
 * and reused verbatim by lib/path-server.ts.
 *
 * The five visual states (spec §3.7) map from data like this:
 *
 *   completed  — node in the progress chain with status='completed'
 *   current    — the single next non-revision node in the walk (one per user)
 *   locked     — behind the chain or behind the level gate (server 403s opens)
 *   revision   — recap nodes (always open, never block) and every node in
 *                levels below the placement start ("open for revision",
 *                never marked completed — §6.3/§6.4)
 *   assessment — the client renders kind='assessment' nodes with the check
 *                styling; the state itself is computed like any other node.
 *
 * Draft nodes are part of the chain (they block what comes after them) but
 * can never be opened: the API answers 403 { error: 'draft' } and the UI
 * shows the "being finalized" treatment.
 */

export const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type LevelCode = (typeof LEVEL_ORDER)[number];

export type LessonKind = 'lesson' | 'revision' | 'assessment';
export type LessonStatus = 'draft' | 'published';
export type NodeState = 'completed' | 'current' | 'locked' | 'revision' | 'assessment';

/** The slice of a path_lessons row the rules need. */
export interface PathNode {
  id: string;
  slug: string;
  level_code: string;
  order_index: number;
  kind: LessonKind;
  status: LessonStatus;
}

/** The slice of a user_path_progress row the rules need. */
export interface PathProgressRow {
  lesson_id: string;
  status: string; // 'completed' counts; anything else is not completed
}

export interface NodeView {
  state: NodeState;
  draft: boolean;
  completed: boolean;
  /** Why a node is locked: behind the level gate or behind the chain. */
  reason: 'level_locked' | 'chain_locked' | null;
}

export interface ComputedPath {
  nodes: Map<string, NodeView>;
  /** The single current lesson (§6.1); null when every unlocked chain is done. */
  currentLessonId: string | null;
  lockedLevels: string[];
  /** Levels below the placement start — open for revision only. */
  revisionLevels: string[];
}

export function levelIndexOf(code: string): number {
  return (LEVEL_ORDER as readonly string[]).indexOf(code);
}

/** True when the node's level sits below the placement start level. */
export function isBelowStart(nodeLevel: string, startLevel: string): boolean {
  const a = levelIndexOf(nodeLevel);
  const b = levelIndexOf(startLevel);
  if (a < 0 || b < 0) return false;
  return a < b;
}

/**
 * Walk the whole curriculum once. Levels below start are open-for-revision;
 * the start level and any unlocked higher level are walked linearly: the
 * first incomplete non-revision node becomes the one current lesson, and
 * everything after it stays locked (§6.1/§6.2). A level above start unlocks
 * only when the previous level's gate (its final assessment) is completed.
 */
export function computeStates(
  nodes: PathNode[],
  progress: PathProgressRow[],
  startLevel: string,
): ComputedPath {
  const completed = new Set(
    progress.filter((p) => p.status === 'completed').map((p) => p.lesson_id),
  );
  const view = new Map<string, NodeView>();
  const byLevel = new Map<string, PathNode[]>();
  for (const raw of nodes) {
    const node: PathNode = {
      ...raw,
      kind: raw.kind === 'revision' || raw.kind === 'assessment' ? raw.kind : 'lesson',
      status: raw.status === 'published' ? 'published' : 'draft',
    };
    const list = byLevel.get(node.level_code);
    if (list) list.push(node);
    else byLevel.set(node.level_code, [node]);
  }
  for (const list of byLevel.values()) {
    list.sort((a, b) => a.order_index - b.order_index);
  }

  const startIdx = Math.max(0, levelIndexOf(startLevel));
  let currentLessonId: string | null = null;
  let currentAssigned = false;
  const lockedLevels: string[] = [];
  const revisionLevels: string[] = [];

  for (let li = 0; li < LEVEL_ORDER.length; li++) {
    const code = LEVEL_ORDER[li];
    const levelNodes = byLevel.get(code);
    if (!levelNodes || levelNodes.length === 0) continue;

    // Levels below the start: open for revision, never completed (§6.3).
    if (li < startIdx) {
      revisionLevels.push(code);
      for (const node of levelNodes) {
        view.set(node.id, {
          state: 'revision',
          draft: node.status === 'draft',
          completed: completed.has(node.id),
          reason: null,
        });
      }
      continue;
    }

    // Levels above the start wait for the previous level's gate (§6.1).
    if (li > startIdx) {
      const prev = byLevel.get(LEVEL_ORDER[li - 1]) ?? [];
      if (!levelGatePassed(prev, completed)) {
        lockedLevels.push(code);
        for (const node of levelNodes) {
          view.set(node.id, {
            state: 'locked',
            draft: node.status === 'draft',
            completed: completed.has(node.id),
            reason: 'level_locked',
          });
        }
        continue;
      }
    }

    // Linear walk of the start level and any unlocked higher level.
    for (const node of levelNodes) {
      const isDone = completed.has(node.id);
      const draft = node.status === 'draft';
      if (node.kind === 'revision') {
        view.set(node.id, { state: 'revision', draft, completed: isDone, reason: null });
        continue;
      }
      if (isDone) {
        view.set(node.id, { state: 'completed', draft, completed: true, reason: null });
        continue;
      }
      if (!currentAssigned) {
        currentAssigned = true;
        currentLessonId = node.id;
        view.set(node.id, { state: 'current', draft, completed: false, reason: null });
      } else {
        view.set(node.id, { state: 'locked', draft, completed: false, reason: 'chain_locked' });
      }
    }
  }

  return { nodes: view, currentLessonId, lockedLevels, revisionLevels };
}

/**
 * The gate of a level is its final assessment node (highest order_index);
 * when a level has no assessment, the last non-revision node. A level with
 * no nodes at all never unlocks the next one. Content must be authored
 * BEFORE the level check — anything after the gate is unreachable by design.
 */
function levelGatePassed(levelNodes: PathNode[], completed: Set<string>): boolean {
  if (levelNodes.length === 0) return false;
  const reversed = [...levelNodes].reverse();
  const gate =
    reversed.find((n) => n.kind === 'assessment') ??
    reversed.find((n) => n.kind !== 'revision');
  if (!gate) return false;
  return completed.has(gate.id);
}

/* ── XP (§6 / showcase formula) ──────────────────────────────────────────── */

export const LESSON_XP_BONUS_MAX = 12;
/** Bonus base: round((score − 70) / 5) × 2, capped at +12, floored at 0. */
export const LESSON_XP_BONUS_BASE = 70;

export function lessonXpBonus(score: number): number {
  return Math.min(
    LESSON_XP_BONUS_MAX,
    Math.max(0, Math.round((score - LESSON_XP_BONUS_BASE) / 5) * 2),
  );
}

/**
 * XP for one graded attempt. `baseXp` is the lesson's xp_reward column
 * (lessons 40, assessments 60, recaps 0). Failed attempts never award XP;
 * passing a recap awards none either (revision is free, §6.4).
 */
export function xpForAttempt(
  kind: LessonKind,
  score: number,
  passScore: number,
  baseXp: number,
): { passed: boolean; xp: number } {
  const passed = score >= passScore;
  if (!passed) return { passed, xp: 0 };
  if (kind === 'revision') return { passed, xp: 0 };
  if (kind === 'assessment') return { passed, xp: baseXp };
  return { passed, xp: baseXp + lessonXpBonus(score) };
}

/* ── Grading ─────────────────────────────────────────────────────────────── */

export type ExerciseType = 'mcq' | 'type_in' | 'listen_mcq' | 'order';

/** The grading slice of a path_exercises row (answer stays server-side). */
export interface ExerciseForGrade {
  type: ExerciseType;
  answer: unknown; // mcq/listen_mcq: option index; type_in: accepted strings; order: correct sequence
}

export function normAnswer(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isExerciseCorrect(ex: ExerciseForGrade, userAnswer: unknown): boolean {
  if (ex.type === 'mcq' || ex.type === 'listen_mcq') {
    return String(ex.answer) === String(userAnswer ?? '').trim();
  }
  if (ex.type === 'type_in') {
    const accepted = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
    const given = normAnswer(userAnswer);
    return given.length > 0 && accepted.some((a) => normAnswer(a) === given);
  }
  if (ex.type === 'order') {
    const correct = Array.isArray(ex.answer) ? ex.answer.map(normAnswer) : [];
    const given = Array.isArray(userAnswer) ? userAnswer.map(normAnswer) : [];
    return correct.length === given.length && correct.every((c, i) => c === given[i]);
  }
  return false;
}

/** `answers[i]` grades against the i-th exercise in submission order. */
export function scoreAttempt(
  exercises: ExerciseForGrade[],
  answers: unknown[],
): { correct: number; total: number; score: number } {
  let correct = 0;
  for (let i = 0; i < exercises.length; i++) {
    if (isExerciseCorrect(exercises[i], answers[i])) correct++;
  }
  const total = exercises.length;
  return { correct, total, score: total === 0 ? 0 : Math.round((correct / total) * 100) };
}

/* ── Streak (server-side mirror of the client counter) ───────────────────── */

export function nextStreak(current: number, lastDate: string | null, today: string): number {
  if (lastDate === today) return current;
  if (!lastDate) return 1;
  const diff = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDate}T00:00:00Z`)) / 86_400_000,
  );
  if (diff === 1) return current + 1;
  return 1;
}

/* ── Level completion (for the progress ring / map chips) ────────────────── */

export interface LevelCompletion {
  done: number;
  total: number;
}

/**
 * Published non-revision nodes per level: how many are completed vs total.
 * Drafts are excluded on both sides — the ring reads 100% when everything
 * published is done, even while the chain waits on a draft lesson.
 */
export function levelCompletion(
  nodes: PathNode[],
  computed: ComputedPath,
): Map<string, LevelCompletion> {
  const out = new Map<string, LevelCompletion>();
  for (const raw of nodes) {
    if (raw.status !== 'published' || raw.kind === 'revision') continue;
    const entry = out.get(raw.level_code) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (computed.nodes.get(raw.id)?.state === 'completed') entry.done += 1;
    out.set(raw.level_code, entry);
  }
  return out;
}
