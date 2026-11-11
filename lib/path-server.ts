// @ts-nocheck
// Why @ts-nocheck: this module is type-stripped at runtime (esbuild bundle /
// Node 24), the workspace has no @types/express or @types/pg, and its imports
// use the '.ts' extensions Node 24 strips natively — the same convention as
// lib/level-test-server.ts and lib/pg-pool.ts. The pure gating/grading rules
// it leans on ARE typechecked and unit-tested (lib/path-rules.ts).
/**
 * Learning-path API (spec §8) — mounted at /api/path.
 *
 * Endpoints
 *   GET  /map                    — the full curriculum + per-node states (guests: read-only)
 *   GET  /summary                — dashboard payload: xp, streak, current lesson, completion
 *   GET  /current                — the single current lesson card (auth)
 *   GET  /lessons/:slug          — lesson detail: steps + exercises, answers stripped (auth)
 *   POST /lessons/:slug/attempt  — grade the check step; idempotent completion + XP + unlock (auth)
 *   POST /placement              — set the start level (auth)
 *
 * Security model
 *   - Auth mirrors the level test: Bearer Supabase access token verified
 *     against {SUPABASE_URL}/auth/v1/user, with a short-TTL token cache.
 *   - Guests may read /map and /summary (read-only, no progress); every other
 *     endpoint answers 401.
 *   - Locked and draft lessons answer 403 — the order is server-enforced
 *     (spec §6.2), the client can never unlock by URL or API.
 *   - path_exercises.answer / .explanation NEVER leave the server: grading
 *     happens here and only the per-exercise verdict is returned.
 *   - All writes go through DATABASE_URL (RLS has no policies — same model
 *     as the lt_* tables).
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool, PoolClient } from 'pg';
import { describeDbError } from './pg-pool.ts';
import {
  LEVEL_ORDER,
  computeStates,
  isBelowStart,
  levelCompletion,
  nextStreak,
  scoreAttempt,
  xpForAttempt,
  type ComputedPath,
  type LessonKind,
  type LessonStatus,
  type NodeState,
  type PathNode,
} from './path-rules.ts';

/* ────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PathServerDeps {
  pool: Pool;
  logger?: (message: string, error?: unknown) => void;
}

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

interface LevelRow {
  code: string;
  title: string;
  tagline: string;
  order_index: number;
}

interface UnitRow {
  id: string;
  level_code: string;
  order_index: number;
  title: string;
}

interface LessonRow {
  id: string;
  slug: string;
  level_code: string;
  unit_id: string;
  order_index: number;
  lesson_no: number | null;
  title: string;
  subtitle: string;
  objective: string;
  est_minutes: number;
  kind: LessonKind;
  pass_score: number;
  xp_reward: number;
  status: LessonStatus;
  steps?: unknown;
}

interface ExerciseRow {
  id: string;
  step_index: number;
  order_index: number;
  type: 'mcq' | 'type_in' | 'listen_mcq' | 'order';
  prompt: string;
  options: unknown;
  answer: unknown;
  explanation: string;
  audio_script: string | null;
}

interface ProgressRow {
  lesson_id: string;
  status: string;
  best_score: number | null;
  attempts: number;
  xp_awarded: number;
  completed_at: string | null;
}

interface StateRow {
  user_id: string;
  current_lesson_id: string | null;
  start_level: string;
  placement_source: string;
  xp_total: number;
  streak_current: number;
  streak_last_date: string | null;
}

/** The default state used before the user's first write (guests, new users). */
const DEFAULT_STATE: Omit<StateRow, 'user_id' | 'current_lesson_id'> = {
  start_level: 'A1',
  placement_source: 'default',
  xp_total: 0,
  streak_current: 0,
  streak_last_date: null,
};

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers shared with the level-test server (kept local on purpose)
 * ──────────────────────────────────────────────────────────────────────────── */

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<unknown>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

function rateLimit(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${clientIp(req)}:${req.method}:${req.baseUrl}${req.path}`;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    if (entry.count > limit) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).json({ error: 'rate_limited', retryAfter: new Date(entry.resetAt).toISOString() });
      return;
    }
    next();
  };
}

async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Auth — Supabase access token, cached briefly to spare /auth/v1/user
 * ──────────────────────────────────────────────────────────────────────────── */

const TOKEN_CACHE_TTL_MS = 60_000;
const tokenCache = new Map<string, { user: AuthUser; expiresAt: number }>();

async function verifySupabaseUser(req: Request): Promise<AuthUser | null> {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
  const anon = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';
  if (!url || !anon) return null;

  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const user = (await response.json()) as {
      id?: string;
      email?: string;
      user_metadata?: { username?: string; name?: string; full_name?: string };
    };
    if (!user.id) return null;
    const authUser: AuthUser = {
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.username ?? user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
    };
    if (tokenCache.size > 2000) {
      const now = Date.now();
      for (const [key, value] of tokenCache) if (value.expiresAt <= now) tokenCache.delete(key);
    }
    tokenCache.set(token, { user: authUser, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
    return authUser;
  } catch {
    return null;
  }
}

function requireUser() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await verifySupabaseUser(req);
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    res.locals.user = user;
    next();
  };
}

/** Guests allowed: res.locals.user is set only when a valid token was sent. */
function optionalUser() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.locals.user = await verifySupabaseUser(req);
    next();
  };
}

/** user_path_* rows reference public.users(id); create the row on demand. */
async function ensureUserRow(client: Pool | PoolClient, user: AuthUser): Promise<void> {
  await client.query(
    `insert into public.users (id, email)
     values ($1, $2)
     on conflict (id) do nothing`,
    [user.id, user.email],
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * DB loaders
 * ──────────────────────────────────────────────────────────────────────────── */

const LESSON_COLUMNS = `l.id, l.slug, l.level_code, l.unit_id, l.order_index, l.lesson_no,
  l.title, l.subtitle, l.objective, l.est_minutes, l.kind, l.pass_score, l.xp_reward, l.status`;

async function loadLevels(client: Pool | PoolClient): Promise<LevelRow[]> {
  const result = await client.query<LevelRow>(
    `select code, title, tagline, order_index from path_levels order by order_index`,
  );
  return result.rows;
}

async function loadUnits(client: Pool | PoolClient): Promise<UnitRow[]> {
  const result = await client.query<UnitRow>(
    `select id, level_code, order_index, title from path_units order by level_code, order_index`,
  );
  return result.rows;
}

async function loadAllLessons(client: Pool | PoolClient): Promise<LessonRow[]> {
  const result = await client.query<LessonRow>(
    `select ${LESSON_COLUMNS}
       from path_lessons l
       join path_levels lv on lv.code = l.level_code
      order by lv.order_index, l.order_index`,
  );
  return result.rows;
}

async function loadLessonBySlug(client: Pool | PoolClient, slug: string): Promise<LessonRow | null> {
  const result = await client.query<LessonRow & { steps: unknown }>(
    `select ${LESSON_COLUMNS}, l.steps
       from path_lessons l
      where l.slug = $1`,
    [slug],
  );
  return result.rows[0] ?? null;
}

async function loadUnit(client: Pool | PoolClient, unitId: string): Promise<UnitRow | null> {
  const result = await client.query<UnitRow>(
    `select id, level_code, order_index, title from path_units where id = $1`,
    [unitId],
  );
  return result.rows[0] ?? null;
}

async function loadExercises(client: Pool | PoolClient, lessonId: string): Promise<ExerciseRow[]> {
  const result = await client.query<ExerciseRow>(
    `select id, step_index, order_index, type, prompt, options, answer, explanation, audio_script
       from path_exercises
      where lesson_id = $1
      order by order_index`,
    [lessonId],
  );
  return result.rows;
}

async function loadProgress(client: Pool | PoolClient, userId: string): Promise<ProgressRow[]> {
  const result = await client.query<ProgressRow>(
    `select lesson_id, status, best_score, attempts, xp_awarded, completed_at
       from user_path_progress
      where user_id = $1`,
    [userId],
  );
  return result.rows;
}

async function loadStateRow(client: Pool | PoolClient, userId: string): Promise<StateRow | null> {
  const result = await client.query<StateRow>(
    `select user_id, current_lesson_id, start_level, placement_source, xp_total,
            streak_current, streak_last_date
       from user_path_state
      where user_id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

/**
 * Everything the read endpoints need in three queries: curriculum, progress,
 * state. Guests get the default state (start A1, no progress) — read-only.
 */
interface PathContext {
  lessons: LessonRow[];
  progress: ProgressRow[];
  state: StateRow | null;
  computed: ComputedPath;
}

async function loadContext(
  client: Pool | PoolClient,
  userId: string | null,
): Promise<PathContext> {
  const lessons = await loadAllLessons(client);
  let progress: PathProgressRow[] = [];
  let state: StateRow | null = null;
  if (userId) {
    [progress, state] = await Promise.all([
      loadProgress(client, userId),
      loadStateRow(client, userId),
    ]);
  }
  const startLevel = state?.start_level ?? DEFAULT_STATE.start_level;
  const computed = computeStates(
    lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      level_code: l.level_code,
      order_index: l.order_index,
      kind: l.kind,
      status: l.status,
    })),
    progress,
    startLevel,
  );
  return { lessons, progress, state, computed };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Payload builders
 * ──────────────────────────────────────────────────────────────────────────── */

interface LessonCard {
  id: string;
  slug: string;
  lessonNo: number | null;
  title: string;
  subtitle: string;
  kind: LessonKind;
  status: LessonStatus;
  estMinutes: number;
  state: NodeState;
  draft: boolean;
  completed: boolean;
  reason: string | null;
  bestScore: number | null;
}

function asPathNode(lesson: LessonRow): PathNode {
  return {
    id: lesson.id,
    slug: lesson.slug,
    level_code: lesson.level_code,
    order_index: lesson.order_index,
    kind: lesson.kind,
    status: lesson.status,
  };
}

function lessonCard(lesson: LessonRow, computed: ComputedPath, scores?: Map<string, number | null>): LessonCard {
  const view = computed.nodes.get(lesson.id);
  return {
    id: lesson.id,
    slug: lesson.slug,
    lessonNo: lesson.lesson_no,
    title: lesson.title,
    subtitle: lesson.subtitle,
    kind: lesson.kind,
    status: lesson.status,
    estMinutes: lesson.est_minutes,
    state: view?.state ?? 'locked',
    draft: view?.draft ?? lesson.status !== 'published',
    completed: view?.completed ?? false,
    reason: view?.reason ?? null,
    bestScore: scores?.get(lesson.id) ?? null,
  };
}

/** Public exercise shape — answer/explanation are stripped here, forever. */
function publicExercise(ex: ExerciseRow) {
  return {
    id: ex.id,
    stepIndex: ex.step_index,
    orderIndex: ex.order_index,
    type: ex.type,
    prompt: ex.prompt,
    options: ex.options ?? null,
    audioScript: ex.audio_script ?? null,
  };
}

function findLesson(lessons: LessonRow[], lessonId: string | null): LessonRow | null {
  if (!lessonId) return null;
  return lessons.find((l) => l.id === lessonId) ?? null;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Router
 * ──────────────────────────────────────────────────────────────────────────── */

export function createPathRouter(deps: PathServerDeps): Router {
  const router = Router();
  const logger = deps.logger ?? ((message: string, error?: unknown) => console.error(`[path] ${message}`, error ?? ''));
  const pool = deps.pool;

  /* ── GET /map — full curriculum with computed states (guests: read-only) ── */
  router.get(
    '/map',
    optionalUser(),
    asyncHandler(async (_req, res) => {
      const user = res.locals.user as AuthUser | null;
      const ctx = await loadContext(pool, user?.id ?? null);
      const scores = new Map(ctx.progress.map((p) => [p.lesson_id, p.best_score ?? null]));
      const levels = await loadLevels(pool);
      const units = await loadUnits(pool);
      const completion = levelCompletion(
        ctx.lessons.map(asPathNode),
        ctx.computed,
      );

      const currentLesson = findLesson(ctx.lessons, ctx.computed.currentLessonId);
      res.json({
        authenticated: Boolean(user),
        startLevel: ctx.state?.start_level ?? DEFAULT_STATE.start_level,
        placementSource: ctx.state?.placement_source ?? DEFAULT_STATE.placement_source,
        xp: ctx.state?.xp_total ?? 0,
        streak: ctx.state?.streak_current ?? 0,
        current: currentLesson ? lessonCard(currentLesson, ctx.computed, scores) : null,
        completion: Object.fromEntries(completion),
        levels: levels.map((level) => ({
          code: level.code,
          title: level.title,
          tagline: level.tagline,
          orderIndex: level.order_index,
          units: units
            .filter((u) => u.level_code === level.code)
            .sort((a, b) => a.order_index - b.order_index)
            .map((unit) => ({
              id: unit.id,
              orderIndex: unit.order_index,
              title: unit.title,
              lessons: ctx.lessons
                .filter((l) => l.unit_id === unit.id)
                .sort((a, b) => a.order_index - b.order_index)
                .map((l) => lessonCard(l, ctx.computed, scores)),
            })),
        })),
      });
    }),
  );

  /* ── GET /summary — dashboard payload (guests get zeroed defaults) ──────── */
  router.get(
    '/summary',
    optionalUser(),
    asyncHandler(async (_req, res) => {
      const user = res.locals.user as AuthUser | null;
      const ctx = await loadContext(pool, user?.id ?? null);
      const scores = new Map(ctx.progress.map((p) => [p.lesson_id, p.best_score ?? null]));
      const completion = levelCompletion(ctx.lessons.map(asPathNode), ctx.computed);
      const currentLesson = findLesson(ctx.lessons, ctx.computed.currentLessonId);
      let current: (LessonCard & { objective: string; level: string; unitTitle: string }) | null =
        currentLesson ? lessonCard(currentLesson, ctx.computed, scores) : null;
      if (current && currentLesson) {
        const unit = await loadUnit(pool, currentLesson.unit_id);
        current = {
          ...current,
          objective: currentLesson.objective,
          level: currentLesson.level_code,
          unitTitle: unit?.title ?? '',
        };
      }
      res.json({
        authenticated: Boolean(user),
        xp: ctx.state?.xp_total ?? 0,
        streak: ctx.state?.streak_current ?? 0,
        startLevel: ctx.state?.start_level ?? DEFAULT_STATE.start_level,
        placementSource: ctx.state?.placement_source ?? DEFAULT_STATE.placement_source,
        current,
        completion: Object.fromEntries(completion),
      });
    }),
  );

  /* ── GET /current — the one current lesson (auth) ───────────────────────── */
  router.get(
    '/current',
    requireUser(),
    asyncHandler(async (_req, res) => {
      const user = res.locals.user as AuthUser;
      const ctx = await loadContext(pool, user.id);
      const currentLesson = findLesson(ctx.lessons, ctx.computed.currentLessonId);
      res.json({
        current: currentLesson ? lessonCard(currentLesson, ctx.computed) : null,
        xp: ctx.state?.xp_total ?? 0,
        streak: ctx.state?.streak_current ?? 0,
      });
    }),
  );

  /* ── GET /lessons/:slug — detail; 401 guest, 403 locked/draft ───────────── */
  router.get(
    '/lessons/:slug',
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const slug = String(req.params.slug ?? '');
      const lesson = await loadLessonBySlug(pool, slug);
      if (!lesson) {
        res.status(404).json({ error: 'not_found' });
        return;
      }

      const ctx = await loadContext(pool, user.id);
      const view = ctx.computed.nodes.get(lesson.id);
      if (!view) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      if (view.state === 'locked') {
        // Server-enforced order (§6.2): no opening locked lessons by URL.
        res.status(403).json({ error: 'locked', reason: view.reason });
        return;
      }
      if (lesson.status !== 'published') {
        res.status(403).json({ error: 'draft' });
        return;
      }

      const unit = await loadUnit(pool, lesson.unit_id);
      const exercises = await loadExercises(pool, lesson.id);
      const progress = ctx.progress.find((p) => p.lesson_id === lesson.id) ?? null;

      res.json({
        lesson: {
          id: lesson.id,
          slug: lesson.slug,
          level: lesson.level_code,
          levelTitle: (await loadLevels(pool)).find((l) => l.code === lesson.level_code)?.title ?? '',
          unitTitle: unit?.title ?? '',
          lessonNo: lesson.lesson_no,
          title: lesson.title,
          subtitle: lesson.subtitle,
          objective: lesson.objective,
          estMinutes: lesson.est_minutes,
          kind: lesson.kind,
          passScore: lesson.pass_score,
          xpReward: lesson.xp_reward,
          state: view.state,
          draft: false,
          completed: view.completed,
          belowStart: isBelowStart(lesson.level_code, ctx.state?.start_level ?? DEFAULT_STATE.start_level),
          bestScore: progress?.best_score ?? null,
          attempts: progress?.attempts ?? 0,
          xpAwarded: progress?.xp_awarded ?? 0,
        },
        steps: lesson.steps ?? [],
        exercises: exercises.map(publicExercise),
      });
    }),
  );

  /* ── POST /lessons/:slug/attempt — grade, complete, unlock, award XP ────── */
  router.post(
    '/lessons/:slug/attempt',
    rateLimit(30, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const slug = String(req.params.slug ?? '');
      const lesson = await loadLessonBySlug(pool, slug);
      if (!lesson) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      if (lesson.status !== 'published') {
        res.status(403).json({ error: 'draft' });
        return;
      }

      const ctx = await loadContext(pool, user.id);
      const view = ctx.computed.nodes.get(lesson.id);
      if (!view || view.state === 'locked') {
        res.status(403).json({ error: 'locked', reason: view?.reason ?? 'chain_locked' });
        return;
      }

      const exercises = await loadExercises(pool, lesson.id);
      if (exercises.length === 0) {
        res.status(409).json({ error: 'no_exercises' });
        return;
      }
      const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
      const { correct, total, score } = scoreAttempt(exercises, answers);

      const belowStart = isBelowStart(
        lesson.level_code,
        ctx.state?.start_level ?? DEFAULT_STATE.start_level,
      );
      const today = todayUtc();

      const result = await withTransaction(pool, async (client) => {
        await ensureUserRow(client, user);

        // Serialize per-user writes.
        await client.query(
          `select user_id from user_path_state where user_id = $1 for update`,
          [user.id],
        );
        await client.query(
          `insert into user_path_state (user_id) values ($1) on conflict (user_id) do nothing`,
          [user.id],
        );

        const existing = await client.query<ProgressRow>(
          `select lesson_id, status, best_score, attempts, xp_awarded, completed_at
             from user_path_progress
            where user_id = $1 and lesson_id = $2
            for update`,
          [user.id, lesson.id],
        );
        const prior = existing.rows[0] ?? null;

        let xpAwarded = 0;
        let completedNow = false;
        let alreadyCompleted = Boolean(prior?.status === 'completed');
        const bestBefore = prior?.best_score ?? null;
        let bestScore = bestBefore;

        if (belowStart) {
          // §6.3: below-start lessons stay open for revision — never
          // completed, never XP; the best score is still recorded.
          if (bestBefore === null || score > (bestBefore as number)) bestScore = score;
          await client.query(
            `insert into user_path_progress
               (user_id, lesson_id, status, best_score, attempts, xp_awarded, updated_at)
             values ($1, $2, 'current', $3, 1, 0, now())
             on conflict (user_id, lesson_id) do update
               set best_score = $3, attempts = user_path_progress.attempts + 1, updated_at = now()`,
            [user.id, lesson.id, bestScore],
          );
        } else if (alreadyCompleted) {
          // §6.4: revisiting a completed lesson keeps its status/XP; only a
          // better score is recorded.
          if (bestBefore === null || score > (bestBefore as number)) {
            bestScore = score;
            await client.query(
              `update user_path_progress set best_score = $3, attempts = attempts + 1, updated_at = now()
                where user_id = $1 and lesson_id = $2`,
              [user.id, lesson.id, score],
            );
          } else {
            await client.query(
              `update user_path_progress set attempts = attempts + 1, updated_at = now()
                where user_id = $1 and lesson_id = $2`,
              [user.id, lesson.id],
            );
          }
        } else {
          const { passed, xp } = xpForAttempt(lesson.kind, score, lesson.pass_score, lesson.xp_reward);
          if (passed) {
            completedNow = true;
            xpAwarded = xp;
            bestScore = bestBefore === null ? score : Math.max(bestBefore, score);
            await client.query(
              `insert into user_path_progress
                 (user_id, lesson_id, status, best_score, attempts, xp_awarded, completed_at, updated_at)
               values ($1, $2, 'completed', $3, 1, $4, now(), now())
               on conflict (user_id, lesson_id) do update
                 set status = 'completed', best_score = $3, xp_awarded = $4,
                     completed_at = now(), updated_at = now()`,
              [user.id, lesson.id, bestScore, xp],
            );
          } else {
            // Failed attempt: keep it uncompleted; track the best score.
            bestScore = bestBefore === null ? score : Math.max(bestBefore, score);
            await client.query(
              `insert into user_path_progress
                 (user_id, lesson_id, status, best_score, attempts, updated_at)
               values ($1, $2, 'current', $3, 1, now())
               on conflict (user_id, lesson_id) do update
                 set best_score = $3, attempts = user_path_progress.attempts + 1, updated_at = now()`,
              [user.id, lesson.id, bestScore],
            );
          }
        }

        // Refresh the state row: XP, streak and the recomputed current lesson
        // (the unlock happens here, inside the same transaction).
        const stateRow = (await client.query<StateRow>(
          `select user_id, current_lesson_id, start_level, placement_source, xp_total,
                  streak_current, streak_last_date
             from user_path_state
            where user_id = $1`,
          [user.id],
        )).rows[0];

        const xpDelta = completedNow ? xpAwarded : 0;
        const passedSomething = completedNow || (view.state === 'revision' && score >= lesson.pass_score);
        let streak = stateRow?.streak_current ?? 0;
        let streakLast = stateRow?.streak_last_date ?? null;
        if (passedSomething) {
          streak = nextStreak(streak, streakLast, today);
          streakLast = today;
        }

        const progressAfter = await loadProgress(client, user.id);
        const lessons = await loadAllLessons(client);
        const computed = computeStates(
          lessons.map(asPathNode),
          progressAfter,
          stateRow?.start_level ?? DEFAULT_STATE.start_level,
        );

        await client.query(
          `update user_path_state
              set current_lesson_id = $2,
                  xp_total = xp_total + $3,
                  streak_current = $4,
                  streak_last_date = $5,
                  updated_at = now()
            where user_id = $1`,
          [user.id, computed.currentLessonId, xpDelta, streak, streakLast],
        );

        const nextLesson = findLesson(lessons, computed.currentLessonId);
        return {
          xpAwarded,
          xpTotal: (stateRow?.xp_total ?? 0) + xpDelta,
          streak,
          completed: completedNow || alreadyCompleted,
          alreadyCompleted,
          bestScore,
          next: nextLesson
            ? { slug: nextLesson.slug, title: nextLesson.title, kind: nextLesson.kind, level: nextLesson.level_code }
            : null,
        };
      });

      res.json({
        score,
        passed: belowStart ? score >= lesson.pass_score : result.completed || score >= lesson.pass_score,
        correct,
        total,
        belowStart,
        xpAwarded: result.xpAwarded,
        xpTotal: result.xpTotal,
        streak: result.streak,
        completed: result.completed,
        alreadyCompleted: result.alreadyCompleted,
        bestScore: result.bestScore,
        next: result.next,
      });
    }),
  );

  /* ── POST /placement — set the start level (auth, rate limited) ─────────── */
  router.post(
    '/placement',
    rateLimit(5, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const level = String(req.body?.level ?? '').toUpperCase();
      if (!(LEVEL_ORDER as readonly string[]).includes(level)) {
        res.status(400).json({ error: 'invalid_level', allowed: LEVEL_ORDER });
        return;
      }
      const source = req.body?.source === 'level_test' ? 'level_test' : 'manual';

      const summary = await withTransaction(pool, async (client) => {
        await ensureUserRow(client, user);
        await client.query(
          `insert into user_path_state (user_id) values ($1) on conflict (user_id) do nothing`,
          [user.id],
        );
        await client.query(
          `select user_id from user_path_state where user_id = $1 for update`,
          [user.id],
        );
        await client.query(
          `update user_path_state
              set start_level = $2, placement_source = $3, updated_at = now()
            where user_id = $1`,
          [user.id, level, source],
        );
        // Recompute the current lesson for the new start level.
        const lessons = await loadAllLessons(client);
        const progress = await loadProgress(client, user.id);
        const computed = computeStates(lessons.map(asPathNode), progress, level);
        await client.query(
          `update user_path_state set current_lesson_id = $2, updated_at = now()
            where user_id = $1`,
          [user.id, computed.currentLessonId],
        );
        return computed.currentLessonId;
      });

      const ctx = await loadContext(pool, user.id);
      const completion = levelCompletion(ctx.lessons.map(asPathNode), ctx.computed);
      const currentLesson = findLesson(ctx.lessons, summary);
      res.json({
        startLevel: level,
        placementSource: source,
        current: currentLesson ? lessonCard(currentLesson, ctx.computed) : null,
        completion: Object.fromEntries(completion),
      });
    }),
  );

  /* ── error middleware (same shape as the level test) ────────────────────── */
  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger('unhandled error', error);
    const msg = error instanceof Error ? error.message : String(error);
    let message = 'An unexpected error occurred. Please try again.';
    if (msg.toLowerCase().includes('does not exist')) {
      message =
        'Learning-path tables not found. Please run migrations/learning-path.sql and migrations/learning-path-seed.sql against the database.';
    } else {
      const described = describeDbError(error);
      if (described) message = described.message;
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal_error', message, details: msg });
    }
  });

  return router;
}
