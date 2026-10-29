/**
 * Venoxa Level Test — adaptive Rasch (1PL) engine.
 *
 * SERVER-SIDE ONLY. This module contains item difficulties and the scoring
 * model. It must never be imported by the browser bundle, and its outputs must
 * be reduced to { item, options, passage, audio } before leaving the server.
 *
 * Model
 * -----
 * P(correct | theta, b) = 1 / (1 + exp(-(theta - b)))
 *
 * Ability is estimated with EAP (expected a posteriori) on a fixed grid
 * [-4, 4] using a N(0, 1.5) prior. Item selection maximises Fisher
 * information (in 1PL that is P(1-P), maximal when b ~= theta), subject to
 * content balancing and exposure control.
 *
 * Early-step clipping
 * -------------------
 * A single lucky guess can move a raw EAP estimate by more than a full CEFR
 * band (1 logit = 20 score points). For the first `earlyItems` answers the
 * reported theta is therefore clamped to at most `maxEarlyStep` logits away
 * from the previous reported theta. The posterior SE is left untouched (it
 * describes the posterior, not the clipped point estimate). This is a v1
 * safeguard for 1PL without a guessing parameter; document it in results.
 *
 * Pure functions only: no I/O, no Date, no crypto, no environment access.
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ItemType = 'grammar' | 'vocab' | 'reading' | 'listening';

export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const ITEM_TYPES: readonly ItemType[] = ['grammar', 'vocab', 'reading', 'listening'];

/** Seed difficulties (logits) used until an item is recalibrated. */
export const SEED_DIFFICULTY: Readonly<Record<CefrLevel, number>> = {
  A1: -2.5,
  A2: -1.5,
  B1: -0.5,
  B2: 0.5,
  C1: 1.5,
  C2: 2.5,
};

/** Target share of items per section (grammar 35 / vocab 20 / reading 30 / listening 15). */
export const DEFAULT_MIX: Readonly<Record<ItemType, number>> = {
  grammar: 0.35,
  vocab: 0.2,
  reading: 0.3,
  listening: 0.15,
};

export interface EngineItem {
  id: string;
  type: ItemType;
  cefrTag: CefrLevel;
  /** Rasch difficulty in logits. */
  difficulty: number;
  /** Reading items that belong to the same passage share this id. */
  passageId?: string | null;
  /** Order inside the passage (1-based). */
  passageOrder?: number | null;
}

export interface ScoredResponse {
  difficulty: number;
  correct: boolean;
  type?: ItemType;
}

export interface EngineConfig {
  minItems: number;
  maxItems: number;
  /** Stop as soon as SE is below this (after minItems). */
  seThreshold: number;
  priorSd: number;
  gridMin: number;
  gridMax: number;
  gridStep: number;
  mix: Record<ItemType, number>;
  /** Max |theta change| per answer during the first `earlyItems` answers. */
  maxEarlyStep: number;
  earlyItems: number;
  /** Exposure control: random pick among the N most informative candidates. */
  candidatePool: number;
  quick: boolean;
}

export const DEFAULT_CONFIG: EngineConfig = {
  minItems: 20,
  maxItems: 32,
  seThreshold: 0.35,
  priorSd: 1.5,
  gridMin: -4,
  gridMax: 4,
  gridStep: 0.05,
  mix: { ...DEFAULT_MIX },
  maxEarlyStep: 1,
  earlyItems: 6,
  candidatePool: 5,
  quick: false,
};

/** Shorter, explicitly less precise variant offered on the start screen. */
export const QUICK_CONFIG: EngineConfig = {
  ...DEFAULT_CONFIG,
  minItems: 10,
  maxItems: 15,
  seThreshold: 0.5,
  quick: true,
};

export interface AbilityEstimate {
  /** Reported theta (early-step clipping applied by updateAbility). */
  theta: number;
  /** Standard error from the posterior. */
  se: number;
  /** Unclipped EAP estimate (useful for tests/diagnostics; never send to clients). */
  rawTheta: number;
}

export interface ScoreRange {
  low: number;
  high: number;
}

export interface SectionScore {
  score: number;
  theta: number;
  se: number;
  items: number;
  /** Fewer than 4 items in the section — show "low confidence". */
  lowConfidence: boolean;
}

export interface TestResult {
  theta: number;
  se: number;
  score: number;
  range: ScoreRange;
  level: CefrLevel;
  answered: number;
  sections: Partial<Record<ItemType, SectionScore>>;
}

export type StopReason = 'se' | 'max-items' | 'timeout' | 'no-items';

export interface SelectionInput {
  theta: number;
  items: readonly EngineItem[];
  usedIds: ReadonlySet<string>;
  counts: Partial<Record<ItemType, number>>;
  answered: number;
  /** Passage currently in progress (finish it before starting a new one). */
  activePassageId?: string | null;
  config?: EngineConfig;
  /** Injectable RNG for deterministic tests; defaults to Math.random. */
  rng?: () => number;
}

export interface SelectionResult {
  item: EngineItem | null;
  /** Set when the selected item starts/continues a reading passage. */
  passageId: string | null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Math helpers
 * ──────────────────────────────────────────────────────────────────────────── */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function logistic(x: number): number {
  // Numerically stable for large |x|.
  if (x >= 0) {
    const e = Math.exp(-x);
    return 1 / (1 + e);
  }
  const e = Math.exp(x);
  return e / (1 + e);
}

/** Fisher information of a 1PL item at theta. Max 0.25 when b == theta. */
export function itemInformation(theta: number, difficulty: number): number {
  const p = logistic(theta - difficulty);
  return p * (1 - p);
}

export function buildGrid(config: EngineConfig = DEFAULT_CONFIG): number[] {
  const span = config.gridMax - config.gridMin;
  const steps = Math.round(span / config.gridStep);
  const grid: number[] = new Array(steps + 1);
  for (let i = 0; i <= steps; i++) grid[i] = config.gridMin + i * config.gridStep;
  return grid;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Ability estimation
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * EAP estimate on the fixed grid with a N(0, priorSd) prior.
 * Empty responses return the prior mean (0) and prior SD.
 */
export function estimateAbility(
  responses: readonly ScoredResponse[],
  config: EngineConfig = DEFAULT_CONFIG,
): AbilityEstimate {
  const grid = buildGrid(config);
  const logPost: number[] = new Array(grid.length);
  const invPriorVar = 1 / (config.priorSd * config.priorSd);
  for (let i = 0; i < grid.length; i++) {
    logPost[i] = -0.5 * grid[i] * grid[i] * invPriorVar;
  }

  for (const response of responses) {
    const b = response.difficulty;
    for (let i = 0; i < grid.length; i++) {
      const p = logistic(grid[i] - b);
      // 1e-12 floor keeps log() finite for extreme grid/items.
      logPost[i] += response.correct
        ? Math.log(p > 1e-12 ? p : 1e-12)
        : Math.log(1 - p > 1e-12 ? 1 - p : 1e-12);
    }
  }

  let maxLog = -Infinity;
  for (let i = 0; i < logPost.length; i++) if (logPost[i] > maxLog) maxLog = logPost[i];

  let total = 0;
  const weights: number[] = new Array(grid.length);
  for (let i = 0; i < grid.length; i++) {
    const w = Math.exp(logPost[i] - maxLog);
    weights[i] = w;
    total += w;
  }

  let mean = 0;
  for (let i = 0; i < grid.length; i++) mean += grid[i] * weights[i];
  mean /= total;

  let variance = 0;
  for (let i = 0; i < grid.length; i++) {
    const d = grid[i] - mean;
    variance += d * d * weights[i];
  }
  variance /= total;

  return { theta: mean, se: Math.sqrt(variance), rawTheta: mean };
}

/**
 * Applies the early-step clip. `answeredBefore` is the number of answers
 * already recorded before this update (0 for the first answer).
 */
export function clampEarlyTheta(
  previousTheta: number,
  nextTheta: number,
  answeredBefore: number,
  config: EngineConfig = DEFAULT_CONFIG,
): number {
  if (answeredBefore >= config.earlyItems) return nextTheta;
  const delta = nextTheta - previousTheta;
  if (Math.abs(delta) <= config.maxEarlyStep) return nextTheta;
  return previousTheta + Math.sign(delta) * config.maxEarlyStep;
}

/** Full sequential update used by the answer endpoint. */
export function updateAbility(
  previousTheta: number,
  responses: readonly ScoredResponse[],
  config: EngineConfig = DEFAULT_CONFIG,
): AbilityEstimate {
  const estimate = estimateAbility(responses, config);
  const theta = clampEarlyTheta(previousTheta, estimate.theta, responses.length - 1, config);
  return { theta, se: estimate.se, rawTheta: estimate.rawTheta };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Item selection
 * ──────────────────────────────────────────────────────────────────────────── */

function pickRandom<T>(list: readonly T[], rng: () => number): T {
  if (list.length === 1) return list[0];
  const idx = Math.floor(rng() * list.length);
  return list[idx >= list.length ? list.length - 1 : idx];
}

function byInformation(theta: number) {
  return (a: EngineItem, b: EngineItem) =>
    itemInformation(theta, b.difficulty) - itemInformation(theta, a.difficulty);
}

interface PassageGroup {
  passageId: string;
  items: EngineItem[];
  meanInfo: number;
}

function groupPassages(items: readonly EngineItem[], theta: number): PassageGroup[] {
  const groups = new Map<string, EngineItem[]>();
  for (const item of items) {
    if (item.type !== 'reading' || !item.passageId) continue;
    const list = groups.get(item.passageId);
    if (list) list.push(item);
    else groups.set(item.passageId, [item]);
  }
  const result: PassageGroup[] = [];
  for (const [passageId, list] of groups) {
    list.sort((a, b) => (a.passageOrder ?? 0) - (b.passageOrder ?? 0));
    let sum = 0;
    for (const item of list) sum += itemInformation(theta, item.difficulty);
    result.push({ passageId, items: list, meanInfo: sum / list.length });
  }
  return result;
}

/**
 * Picks the next item. Deterministic given `rng`.
 *
 * 1. If a reading passage is in progress, finish it.
 * 2. Otherwise pick the section with the largest content deficit.
 * 3. Within that section, take the `candidatePool` most informative unused
 *    items (reading: passages) and pick one at random (exposure control).
 */
export function selectNextItem(input: SelectionInput): SelectionResult {
  const config = input.config ?? DEFAULT_CONFIG;
  const rng = input.rng ?? Math.random;
  const used = input.usedIds;
  const unused = input.items.filter((item) => !used.has(item.id));

  if (unused.length === 0) return { item: null, passageId: null };

  // 1) Finish the passage currently on screen.
  if (input.activePassageId) {
    const passageItems = unused
      .filter((item) => item.type === 'reading' && item.passageId === input.activePassageId)
      .sort((a, b) => (a.passageOrder ?? 0) - (b.passageOrder ?? 0));
    if (passageItems.length > 0) {
      return { item: passageItems[0], passageId: input.activePassageId };
    }
  }

  // 2) Content balancing by largest deficit.
  const deficits = ITEM_TYPES.map((type) => {
    const available = unused.filter((item) => item.type === type);
    const target = config.mix[type] * (input.answered + 1);
    const actual = input.counts[type] ?? 0;
    return { type, available, deficit: target - actual };
  })
    .filter((entry) => entry.available.length > 0)
    .sort((a, b) => b.deficit - a.deficit);

  const chosen = deficits[0];

  // 3a) Reading: choose a passage group, then its first unanswered question.
  if (chosen.type === 'reading') {
    const groups = groupPassages(chosen.available, input.theta);
    if (groups.length > 0) {
      groups.sort((a, b) => b.meanInfo - a.meanInfo);
      const pool = groups.slice(0, Math.max(1, config.candidatePool));
      const group = pickRandom(pool, rng);
      return { item: group.items[0], passageId: group.passageId };
    }
  }

  // 3b) Other sections: top-N by Fisher information, random among them.
  const sorted = [...chosen.available].sort(byInformation(input.theta));
  const pool = sorted.slice(0, Math.max(1, config.candidatePool));
  const item = pickRandom(pool, rng);
  return { item, passageId: null };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Stopping rule
 * ──────────────────────────────────────────────────────────────────────────── */

export interface StopInput {
  answered: number;
  se: number;
  timedOut?: boolean;
  /** How many active items are still unused (prevents an empty next request). */
  remainingItems?: number;
  config?: EngineConfig;
}

export function stopReason(input: StopInput): StopReason | null {
  const config = input.config ?? DEFAULT_CONFIG;
  if (input.timedOut) return 'timeout';
  if (input.answered >= config.maxItems) return 'max-items';
  if (input.remainingItems !== undefined && input.remainingItems <= 0) return 'no-items';
  if (input.answered >= config.minItems && input.se < config.seThreshold) return 'se';
  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Scoring and CEFR mapping
 * ──────────────────────────────────────────────────────────────────────────── */

/** score = clamp(round(50 + 20*theta), 0, 100) */
export function scoreFromTheta(theta: number): number {
  return clamp(Math.round(50 + 20 * theta), 0, 100);
}

/**
 * CEFR band by score:
 * A1 <10, A2 10–29, B1 30–49, B2 50–69, C1 70–89, C2 90+.
 */
export function cefrFromScore(score: number): CefrLevel {
  if (score < 10) return 'A1';
  if (score < 30) return 'A2';
  if (score < 50) return 'B1';
  if (score < 70) return 'B2';
  if (score < 90) return 'C1';
  return 'C2';
}

/** score ± 1.96*SE*20, clamped to 0–100. */
export function rangeFromTheta(theta: number, se: number): ScoreRange {
  const center = 50 + 20 * theta;
  const half = 1.96 * se * 20;
  return {
    low: clamp(Math.round(center - half), 0, 100),
    high: clamp(Math.round(center + half), 0, 100),
  };
}

/** Per-section scores; a section with fewer than 4 items is low confidence. */
export function computeSectionScores(
  responses: readonly ScoredResponse[],
  config: EngineConfig = DEFAULT_CONFIG,
): Partial<Record<ItemType, SectionScore>> {
  const grouped: Partial<Record<ItemType, ScoredResponse[]>> = {};
  for (const response of responses) {
    const type = response.type;
    if (!type) continue;
    const list = grouped[type];
    if (list) list.push(response);
    else grouped[type] = [response];
  }

  const sections: Partial<Record<ItemType, SectionScore>> = {};
  for (const type of ITEM_TYPES) {
    const list = grouped[type];
    if (!list || list.length === 0) continue;
    const estimate = estimateAbility(list, config);
    sections[type] = {
      score: scoreFromTheta(estimate.theta),
      theta: estimate.theta,
      se: estimate.se,
      items: list.length,
      lowConfidence: list.length < 4,
    };
  }
  return sections;
}

/**
 * Final result. Pass the stored theta/se from the session when available so
 * the certificate matches exactly what the learner was shown.
 */
export function scoreResult(
  responses: readonly ScoredResponse[],
  config: EngineConfig = DEFAULT_CONFIG,
  stored?: { theta: number; se: number },
): TestResult {
  const estimate = stored ?? estimateAbility(responses, config);
  const score = scoreFromTheta(estimate.theta);
  return {
    theta: estimate.theta,
    se: estimate.se,
    score,
    range: rangeFromTheta(estimate.theta, estimate.se),
    level: cefrFromScore(score),
    answered: responses.length,
    sections: computeSectionScores(responses, config),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Validation helpers (used by the generator and the API)
 * ──────────────────────────────────────────────────────────────────────────── */

export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === 'string' && (CEFR_LEVELS as readonly string[]).includes(value);
}

export function isItemType(value: unknown): value is ItemType {
  return typeof value === 'string' && (ITEM_TYPES as readonly string[]).includes(value);
}
