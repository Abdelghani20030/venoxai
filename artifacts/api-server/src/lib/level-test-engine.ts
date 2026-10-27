// ─────────────────────────────────────────────────────────────────────────────
// level-test-engine.ts — Pure adaptive engine for the Venoxa Level Test.
//
// No I/O, no randomness import — all primitives are deterministic except where
// an explicit caller-provided RNG is used (exposure control). This keeps the
// whole thing unit-testable and lets the backend import it directly.
//
// Model: Rasch 1PL IRT.
//   p(correct | theta, b) = 1 / (1 + exp(-(theta - b)))
//   theta: learner ability (logits). b: item difficulty (logits).
//
// Ability estimation: EAP (Expected A Posteriori) over a fixed grid with a
// N(0, 1.5) prior. SE = posterior standard deviation.
//
// Early-step clamp: a lucky guess cannot jump theta by more than one CEFR band
// (0.5 logits? -> we use 1.0 logit, see CLAMP docs below) in a single item.
// ─────────────────────────────────────────────────────────────────────────────

/** Grid resolution for EAP integration. 0.1 → 81 points over [-4, 4]. */
const GRID_STEP = 0.1;
const GRID_MIN = -4;
const GRID_MAX = 4;

/** Prior N(0, 1.5) — wide enough that 30 items outweigh it, tight enough that early answers can't run away. */
const PRIOR_SD = 1.5;

/** Fisher information cap for one item = p(1-p) ≤ 0.25 at b = theta. */

/** One CEFR band = 1.0 logit (bands are 2 logits wide: A1 -3..-2? see CEFR_SEED_B). */
export const BAND_LOGITS = 1.0;
export const MAX_THETA_STEP = BAND_LOGITS; // clamp the per-item theta change at ±1 logit

export const MIN_ITEMS = 20;
export const MAX_ITEMS = 32;
export const SE_STOP_THRESHOLD = 0.35;
/** Quick version: fixed, short stop rule — labeled "less precise" in the UI. */
export const QUICK_MODE_MAX_ITEMS = 15;

/**
 * Seed difficulty per CEFR tag (logits).
 * Task spec: A1=-2.5, A2=-1.5, B1=-0.5, B2=0.5, C1=1.5, C2=2.5
 */
export const CEFR_SEED_B: Record<CefrLevel, number> = {
  A1: -2.5, A2: -1.5, B1: -0.5, B2: 0.5, C1: 1.5, C2: 2.5,
};

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ItemType = 'grammar' | 'vocab' | 'reading' | 'listening';

/** Target section mix (task spec): 35% grammar, 20% vocab, 30% reading, 15% listening. */
export const SECTION_MIX: Record<ItemType, number> = {
  grammar: 0.35, vocab: 0.20, reading: 0.30, listening: 0.15,
};

export const ALL_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export interface EngineItem {
  id: string;
  type: ItemType;
  cefr_tag: CefrLevel;
  difficulty_b: number;
}

export interface EngineState {
  answeredIds: string[];
  /** itemId -> 0 | 1 */
  responses: Record<string, 0 | 1>;
  theta: number;
  se: number;
  /** incremental counts used for mix balancing */
  counts: Record<ItemType, number>;
  quickMode?: boolean;
}

export function newEngineState(quickMode = false): EngineState {
  return {
    answeredIds: [],
    responses: {},
    theta: 0, // start at the B1/B2 boundary per spec
    se: PRIOR_SD,
    counts: { grammar: 0, vocab: 0, reading: 0, listening: 0 },
    quickMode,
  };
}

// ── Core math ────────────────────────────────────────────────────────────────

export function raschP(theta: number, b: number): number {
  const z = theta - b;
  // guard overflow — sigmoid saturates well before 709 anyway
  if (z > 30) return 1;
  if (z < -30) return 0;
  return 1 / (1 + Math.exp(-z));
}

/** Posterior probability of ability theta given one response r to item b. */
function logLik(theta: number, b: number, r: 0 | 1): number {
  const p = raschP(theta, b);
  const pClamped = Math.min(1 - 1e-10, Math.max(1e-10, p));
  return r === 1 ? Math.log(pClamped) : Math.log(1 - pClamped);
}

const PHI_1_OVER_SQRT2PI = 0.3989422804014327;

function priorDensity(theta: number): number {
  const z = (theta - 0) / PRIOR_SD;
  return PHI_1_OVER_SQRT2PI / PRIOR_SD * Math.exp(-0.5 * z * z);
}

/** EAP posterior over the grid. Returns { post, theta, se } where post is a normalized density. */
export function eapPosterior(
  items: { b: number; r: 0 | 1 }[],
): { theta: number; se: number; post: Float64Array; grid: Float64Array } {
  const n = Math.round((GRID_MAX - GRID_MIN) / GRID_STEP) + 1;
  const grid = new Float64Array(n);
  const post = new Float64Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const th = GRID_MIN + i * GRID_STEP;
    grid[i] = th;
    let ll = 0;
    for (const it of items) ll += logLik(th, it.b, it.r);
    const w = Math.exp(ll) * priorDensity(th);
    post[i] = w;
    total += w;
  }
  let mean = 0;
  for (let i = 0; i < n; i++) { post[i] = total > 0 ? post[i] / total : 0; mean += post[i] * grid[i]; }
  let varr = 0;
  for (let i = 0; i < n; i++) varr += post[i] * (grid[i] - mean) * (grid[i] - mean);
  return { theta: mean, se: Math.sqrt(varr), post, grid };
}

/**
 * One-answer theta update with the early-step clamp: applied inline in
 * applyAnswer() — the delta is limited to ±1 logit (one CEFR band) so a lucky
 * or failed guess cannot move the estimate by more than one level per item.
 * Documented choice: with a N(0,1.5) prior and top-5 exposure randomness the
 * clamp only binds for the first few answers, where information is lowest.
 */

export interface ApplyResult {
  state: EngineState;
  /** true if the clamp bound this step (used in tests/debug) */
  clamped: boolean;
}

export function applyAnswer(items: EngineItem[], state: EngineState, itemId: string, correct: boolean): ApplyResult {
  const item = items.find(i => i.id === itemId);
  if (!item) throw new Error(`unknown item ${itemId}`);
  if (state.responses[itemId] !== undefined) throw new Error(`item already answered: ${itemId}`);
  const r: 0 | 1 = correct ? 1 : 0;
  if (state.answeredIds.includes(itemId)) throw new Error('already answered');
  const done = [...state.answeredIds, itemId];
  // Build the full response history for the posterior: (difficulty, r) pairs.
  const byId = new Map(items.map(i => [i.id, i.difficulty_b]));
  const history: { b: number; r: 0 | 1 }[] = done.map(id => ({
    b: byId.get(id)!,
    r: id === itemId ? r : state.responses[id],
  }));
  if (history.some(h => h.r === undefined)) throw new Error('missing response in history');
  const post = eapPosterior(history as { b: number; r: 0 | 1 }[]);
  let nextTheta = post.theta;
  const clamped = Math.abs(nextTheta - state.theta) > MAX_THETA_STEP;
  if (clamped) nextTheta = state.theta + Math.sign(nextTheta - state.theta) * MAX_THETA_STEP;
  return {
    state: {
      answeredIds: done,
      responses: { ...state.responses, [itemId]: r },
      theta: nextTheta,
      se: post.se,
      counts: { ...state.counts, [item.type]: state.counts[item.type] + 1 },
      quickMode: state.quickMode,
    },
    clamped,
  };
}

// ── Item selection ───────────────────────────────────────────────────────────

/** Fisher information for 1PL at ability theta for an item of difficulty b. */
export function fisherInformation(theta: number, b: number): number {
  const p = raschP(theta, b);
  return p * (1 - p);
}

export interface PickOptions {
  /** exposure control: pick randomly among the top N candidates (spec: 5) */
  topN?: number;
  excludedIds?: Set<string>;
  rng?: () => number;
  /** items marked retired/inactive are filtered by the caller before passing `items` */
}

/**
 * Choose the next item:
 *   1. Filter unused items.
 *   2. Compute current mix mis-balance: for each type, how far it is from its
 *      target share relative to the remaining questions.
 *   3. Within a candidate pool sized to respect the mix, pick the items with
 *      maximum Fisher information at theta; break ties randomly among top N.
 */
export function pickNextItem(allItems: EngineItem[], state: EngineState, opts: PickOptions = {}): EngineItem | null {
  const topN = opts.topN ?? 5;
  const rng = opts.rng ?? Math.random;
  const excluded = opts.excludedIds ?? new Set<string>();
  const used = new Set(state.answeredIds);
  const unused = allItems.filter(i => !used.has(i.id) && !excluded.has(i.id));
  if (unused.length === 0) return null;

  const quick = state.quickMode === true;
  const maxItems = quick ? QUICK_MODE_MAX_ITEMS : MAX_ITEMS;
  const remaining = maxItems - state.answeredIds.length;

  // Expected remaining allocation per type if we follow the plan exactly.
  // target_i (remaining credits) = max(0, round(SHARE_i * remaining) - counts_i)
  const typeOrder: ItemType[] = ['grammar', 'vocab', 'reading', 'listening'];
  const credit: Record<string, number> = {};
  for (const t of typeOrder) {
    const target = Math.round(SECTION_MIX[t] * remaining);
    credit[t] = Math.max(0, target - (state.counts[t] || 0));
  }
  // If everything's credited to zero but items remain, fall back to unconstrained.
  const totalCredit = typeOrder.reduce((s, t) => s + credit[t], 0);

  const scored = unused
    .map(i => ({ item: i, info: fisherInformation(state.theta, i.difficulty_b) }))
    .sort((a, b) => b.info - a.info);

  // Preferred types first (those still under quota), then any type.
  const preferred = totalCredit > 0 ? scored.filter(s => credit[s.item.type] > 0) : scored;
  const pool = preferred.length > 0 ? preferred : scored;

  const top = pool.slice(0, Math.max(1, topN));
  return top[Math.floor(rng() * top.length)].item;
}

// ── Stopping rule ────────────────────────────────────────────────────────────

export interface StopDecision {
  stop: boolean;
  reason: 'se' | 'max_items' | 'quick_max' | 'bank_empty' | 'timeout' | 'not-yet';
}

export function shouldStop(state: EngineState, hasNextItem: boolean): StopDecision {
  const answeredCount = state.answeredIds.length;

  if (state.quickMode) {
    if (answeredCount >= QUICK_MODE_MAX_ITEMS) return { stop: true, reason: 'quick_max' };
  } else {
    if (answeredCount >= MIN_ITEMS && state.se < SE_STOP_THRESHOLD) return { stop: true, reason: 'se' };
    if (answeredCount >= MAX_ITEMS) return { stop: true, reason: 'max_items' };
  }
  if (!hasNextItem) return { stop: true, reason: 'bank_empty' };
  return { stop: false, reason: 'not-yet' };
}

// ── Scoring ──────────────────────────────────────────────────────────────────

/** score = clamp(round(50 + 20*theta), 0, 100) */
export function thetaToScore(theta: number): number {
  return Math.min(100, Math.max(0, Math.round(50 + 20 * theta)));
}

/** CI halfwidth = 1.96 * SE * 20 (score units), clamped to [0, 100]. */
export function scoreRange(score: number, se: number): { low: number; high: number } {
  const half = 1.96 * se * 20;
  return { low: Math.max(0, Math.round(score - half)), high: Math.min(100, Math.round(score + half)) };
}

/** CEFR bands by score: A1 <10, A2 10–29, B1 30–49, B2 50–69, C1 70–89, C2 90+ */
export function scoreToCefr(score: number): CefrLevel {
  if (score < 10) return 'A1';
  if (score < 30) return 'A2';
  if (score < 50) return 'B1';
  if (score < 70) return 'B2';
  if (score < 90) return 'C1';
  return 'C2';
}

export const CEFR_NAMES: Record<CefrLevel, string> = {
  A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate',
  B2: 'Upper Intermediate', C1: 'Advanced', C2: 'Proficiency',
};

// ── Final report ─────────────────────────────────────────────────────────────

export interface SectionScore {
  type: ItemType;
  answered: number;
  correct: number;
  /** 0–100; null when the section had no items */
  score: number | null;
  lowConfidence: boolean;
}

export interface TestReport {
  score: number;
  ciLow: number;
  ciHigh: number;
  cefr: CefrLevel;
  cefrName: string;
  sections: SectionScore[];
  answered: number;
  theta: number;
  se: number;
}

/** Sub-scores per section, computed from ability on that section's items only. */
export function buildReport(items: EngineItem[], state: EngineState): TestReport {
  const score = thetaToScore(state.theta);
  const range = scoreRange(score, state.se);
  const sections: SectionScore[] = (Object.keys(SECTION_MIX) as ItemType[]).map(type => {
    const rows = state.answeredIds
      .map(id => items.find(i => i.id === id))
      .filter(i => i && i.type === type) as EngineItem[];
    if (rows.length === 0) return { type, answered: 0, correct: 0, score: null, lowConfidence: true };
    // ability from just this section, then map to score scale
    const hist = rows.map(i => ({ b: i.difficulty_b, r: state.responses[i.id] }));
    if (hist.some(h => h.r === undefined)) throw new Error('missing response for section score');
    try {
      const post = eapPosterior(hist as { b: number; r: 0 | 1 }[]);
      const s = thetaToScore(post.theta);
      const lowConfidence = rows.length < 4;
      return {
        type,
        answered: rows.length,
        correct: rows.filter(r => state.responses[r.id]).length,
        score: s,
        lowConfidence,
      };
    } catch {
      return { type, answered: rows.length, correct: 0, score: null, lowConfidence: true };
    }
  });
  return {
    score,
    ciLow: range.low,
    ciHigh: range.high,
    cefr: scoreToCefr(score),
    cefrName: CEFR_NAMES[scoreToCefr(score)],
    sections,
    answered: state.answeredIds.length,
    theta: state.theta,
    se: state.se,
  };
}

/** Rate a single response under the Rasch model (used by the simulator). */
export function simulateResponse(theta: number, b: number, rng: () => number): 0 | 1 {
  return rng() < raschP(theta, b) ? 1 : 0;
}
