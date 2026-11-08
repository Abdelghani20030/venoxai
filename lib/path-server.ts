// @ts-nocheck
/**
 * Venoxa Learning Path — shared Express router (CHECKPOINT 2).
 *
 * Used by BOTH backends, exactly like lib/level-test-server.ts:
 *   - artifacts/api-server (local dev, port 3001)
 *   - api/index.ts (Vercel production)
 *
 * Hard rules enforced in this module:
 *   - `answer_key` and exercise explanations NEVER leave the module except as
 *     per-exercise feedback AFTER that exercise was submitted. Lesson
 *     payloads contain content + exercises only.
 *   - Locking/completion is computed from database state. A locked lesson
 *     returns 403 for content and attempts alike — direct URLs and direct
 *     API calls behave identically.
 *   - Client answers only; client-supplied scores are never read or trusted.
 *     Grading happens here; the lesson completion + next-lesson unlock are
 *     written in ONE transaction.
 *   - Writes go through the server's DATABASE_URL role; anonymous Supabase
 *     clients have no policies on these tables (see migrations/learning-path.sql).
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool, PoolClient } from 'pg';

/* ────────────────────────────────────────────────────────────────────────────
 * Public types / deps
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PathDeps {
  pool: Pool;
  logger?: (message: string, error?: unknown) => void;
}

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

type PathLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

const LEVELS: PathLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_RANK: Record<string, number> = {
  A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 4, // C2 (level-test can emit it) ≡ C1 for the path
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
/** Fast double-submit guard: a second check attempt for the same lesson within
 * this window returns the same outcome without recording another attempt. */
const REPLAY_WINDOW_MS = 1500;
const MAX_ANSWER_ENTRIES = 40;

interface LessonRow {
  id: string;
  slug: string;
  level: string;
  unit: number;
  unit_title_en: string;
  unit_title_ar: string;
  position: number;
  title_en: string;
  title_ar: string;
  objective_en: string;
  objective_ar: string;
  kind: string;
  pass_score: number;
  published: boolean;
  activities: unknown;
}

interface ExerciseRow {
  id: string;
  step: string;
  type: string;
  prompt_en: string;
  prompt_ar: string;
  options: unknown[];
  answer_key: any;
  explanation_en: string;
  explanation_ar: string;
  position: number;
}

interface ContentRow {
  id: string;
  step: string;
  position: number;
  explanation_en: string;
  explanation_ar: string;
  examples: unknown[];
  notes_en: string;
  notes_ar: string;
  config: any;
}

interface ProgressRow {
  lesson_id: string;
  status: string;
  best_score: number;
  attempts: number;
  completed_at: Date | string | null;
  updated_at: Date | string;
}

interface StateRow {
  user_id: string;
  placement_level: PathLevel;
  placement_source: string | null;
  current_lesson_id: string | null;
  updated_at: Date | string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Small utilities (same patterns as lib/level-test-server.ts)
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

function fail(
  res: Response,
  status: number,
  code: string,
  message?: string,
  messageAr?: string,
  extra?: Record<string, unknown>,
): void {
  res.status(status).json({
    error: code,
    ...(message ? { message } : {}),
    ...(messageAr ? { messageAr } : {}),
    ...(extra ?? {}),
  });
}

/** True when the error means "learning-path tables/columns not created yet". */
function isSchemaMissing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === '42P01' || code === '42703';
}

/* ────────────────────────────────────────────────────────────────────────────
 * Auth (Supabase access token) — same verification as the level test
 * ──────────────────────────────────────────────────────────────────────────── */

async function verifySupabaseUser(req: Request): Promise<AuthUser | null> {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

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
    return {
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.username ?? user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
    };
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

function optionalUser() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await verifySupabaseUser(req);
    res.locals.user = user ?? null;
    next();
  };
}

/**
 * user_path_progress / user_path_state rows reference public.users(id). That
 * row is normally created by the on_auth_user_created trigger; create it on
 * demand so path rows never fail on a foreign key (same approach as the
 * level test).
 */
async function ensureUserRow(client: Pool | PoolClient, user: AuthUser): Promise<void> {
  await client.query(
    `insert into public.users (id, email)
     values ($1, $2)
     on conflict (id) do nothing`,
    [user.id, user.email],
  );
}

async function ensureStateRow(client: Pool | PoolClient, userId: string): Promise<StateRow> {
  await client.query(
    `insert into user_path_state (user_id) values ($1) on conflict (user_id) do nothing`,
    [userId],
  );
  const result = await client.query<StateRow>(
    `select * from user_path_state where user_id = $1`,
    [userId],
  );
  return result.rows[0];
}

/**
 * The "frontier" pointer: the first published, uncompleted lesson of the
 * placement level. Used when current_lesson_id is null (fresh user, or the
 * placement level had no published lessons yet). No-op while a pointer
 * already exists.
 */
async function healCurrentLesson(
  client: Pool | PoolClient,
  userId: string,
  placementLevel: PathLevel,
): Promise<{ id: string; slug: string; position: number } | null> {
  let candidate: { id: string; slug: string; position: number } | null = null;
  const found = await client.query<{ id: string; slug: string; position: number }>(
    `select l.id, l.slug, l.position
       from path_lessons l
      where l.published
        and l.level = $2
        and not exists (
              select 1 from user_path_progress p
               where p.user_id = $1 and p.lesson_id = l.id and p.status = 'completed'
            )
      order by l.position asc
      limit 1`,
    [userId, placementLevel],
  );
  candidate = found.rows[0] ?? null;
  if (candidate) {
    await client.query(
      `update user_path_state
          set current_lesson_id = $2, updated_at = now()
        where user_id = $1 and current_lesson_id is null`,
      [userId, candidate.id],
    );
  }
  return candidate;
}

function levelRank(level: string): number {
  const rank = LEVEL_RANK[level];
  return rank === undefined ? 99 : rank;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Path map (computed server-side; the client never derives locking)
 * ──────────────────────────────────────────────────────────────────────────── */

interface ResolvedContext {
  state: StateRow;
  current: { id: string; slug: string; position: number } | null;
}

async function resolveContext(
  client: Pool | PoolClient,
  user: AuthUser,
): Promise<ResolvedContext & { healed: boolean }> {
  await ensureUserRow(client, user);
  const state = await ensureStateRow(client, user.id);

  let current: { id: string; slug: string; position: number } | null = null;
  if (state.current_lesson_id) {
    const found = await client.query<{ id: string; slug: string; position: number }>(
      `select id, slug, position from path_lessons where id = $1`,
      [state.current_lesson_id],
    );
    current = found.rows[0] ?? null;
  }
  if (!current) {
    current = await healCurrentLesson(client, user.id, state.placement_level);
  }
  return { state, current, healed: true };
}

async function loadPublishedLessons(
  client: Pool | PoolClient,
): Promise<LessonRow[]> {
  const result = await client.query<LessonRow>(
    `select id, slug, level, unit, unit_title_en, unit_title_ar, position,
            title_en, title_ar, objective_en, objective_ar, kind, pass_score, published,
            activities
       from path_lessons
      order by position asc`,
  );
  return result.rows;
}

async function loadProgress(
  client: Pool | PoolClient,
  userId: string,
): Promise<ProgressRow[]> {
  const result = await client.query<ProgressRow>(
    `select lesson_id, status, best_score, attempts, completed_at, updated_at
       from user_path_progress
      where user_id = $1`,
    [userId],
  );
  return result.rows;
}

/** Explanation strings for per-exercise feedback (after submission only). */
function explanationOf(ex: ExerciseRow): { explanationEn: string; explanationAr: string } {
  return { explanationEn: ex.explanation_en ?? '', explanationAr: ex.explanation_ar ?? '' };
}

function exerciseHeader(ex: ExerciseRow) {
  return {
    id: ex.id,
    step: ex.step,
    type: ex.type,
    promptEn: ex.prompt_en,
    promptAr: ex.prompt_ar,
    options: ex.options ?? [],
    position: ex.position,
  };
}

function nextLessonAfter(
  lessons: LessonRow[],
  position: number | null,
): { slug: string; titleEn: string; titleAr: string } | null {
  if (position === null) return null;
  const next = lessons.find((l) => l.published && l.position > position);
  if (!next) return null;
  return { slug: next.slug, titleEn: next.title_en, titleAr: next.title_ar };
}

async function latestLevelTest(
  client: Pool | PoolClient,
  userId: string,
): Promise<{ level: PathLevel; score: number; createdAt: string } | null> {
  try {
    const result = await client.query<{ level: string; score: number; created_at: Date }>(
      `select level, score, created_at
         from lt_results
        where user_id = $1
        order by created_at desc
        limit 1`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return { level: clampLevel(row.level), score: Number(row.score), createdAt: new Date(row.created_at).toISOString() };
  } catch (error) {
    if (isSchemaMissing(error)) return null; // level-test tables not created
    throw error;
  }
}

function clampLevel(level: unknown): PathLevel {
  const str = typeof level === 'string' ? level.trim().toUpperCase() : '';
  if (LEVELS.includes(str as PathLevel)) return str as PathLevel;
  if (str === 'C2') return 'C1'; // level-test can emit C2; the path stops at C1
  return 'A1';
}

/**
 * Safe summary of a lesson blueprint: activity types only. Configs and
 * answer keys never leave the server.
 */
function activitySteps(activities: unknown): string[] {
  if (!Array.isArray(activities)) return [];
  const out: string[] = [];
  for (const item of activities) {
    if (!item || typeof item !== 'object') continue;
    const type = (item as { type?: unknown }).type;
    if (typeof type === 'string' && !out.includes(type)) out.push(type);
  }
  return out;
}

/**
 * Build the full map the client renders. Lesson statuses are one of:
 *   'completed' | 'current' | 'unlocked' (open, e.g. revision levels) |
 *   'locked' | 'coming_soon' (unpublished outline)
 */
async function buildMap(pool: Pool, user: AuthUser | null): Promise<Record<string, unknown>> {
  const client = await pool.connect();
  try {
    let state: StateRow;
    let current: { id: string; slug: string; position: number } | null = null;
    let progress: ProgressRow[] = [];

    if (user) {
      const ctx = await resolveContext(client, user);
      state = ctx.state;
      current = ctx.current;
      progress = await loadProgress(client, user.id);
    } else {
      const firstA1 = await client.query<{ id: string; slug: string; position: number }>(
        `select id, slug, position from path_lessons where published = true and level = 'A1' order by position asc limit 1`
      );
      current = firstA1.rows[0] ?? null;
      state = {
        user_id: 'guest',
        placement_level: 'A1',
        placement_source: null,
        current_lesson_id: current?.id ?? null,
        updated_at: new Date(),
      };
      progress = [];
    }

    const lessons = await loadPublishedLessons(client);

    const completedSet = new Set<string>();
    const progressByLesson = new Map<string, ProgressRow>();
    for (const row of progress) {
      progressByLesson.set(row.lesson_id, row);
      if (row.status === 'completed') completedSet.add(row.lesson_id);
    }

    // Unlock rule — linear frontier (position <= current), plus the placement
    // latest-resort when the pointer is null: earlier levels are open for
    // revision, and the first published lesson of the placement level opens
    // once its level is seeded.
    const unlocked = (lesson: LessonRow): boolean => {
      if (completedSet.has(lesson.id)) return true;
      if (!lesson.published) return false;
      if (current) return lesson.position <= current.position;
      const lessonRank = levelRank(lesson.level);
      const placementRank = levelRank(state.placement_level);
      if (lessonRank < placementRank) return true;
      if (lessonRank === placementRank) {
        const first = lessons.find((l) => l.published && l.level === state.placement_level);
        return Boolean(first && first.id === lesson.id);
      }
      return false;
    };

    const statusOf = (lesson: LessonRow, level: { level: string }): string => {
      if (!lesson.published) return 'coming_soon';
      if (completedSet.has(lesson.id)) return 'completed';
      if (current && lesson.id === current.id) return 'current';
      return unlocked(lesson) ? 'unlocked' : 'locked';
    };

    const publicLesson = (lesson: LessonRow) => {
      const row = progressByLesson.get(lesson.id);
      return {
        slug: lesson.slug,
        position: lesson.position,
        titleEn: lesson.title_en,
        titleAr: lesson.title_ar,
        objectiveEn: lesson.objective_en,
        objectiveAr: lesson.objective_ar,
        kind: lesson.kind,
        passScore: lesson.pass_score,
        steps: activitySteps(lesson.activities),
        status: statusOf(lesson),
        bestScore: row?.best_score ?? null,
        attempts: row?.attempts ?? 0,
        // `current: true` marks exactly one node in the whole map.
        current: Boolean(current && lesson.id === current.id),
      };
    };

    const byLevel = new Map<string, LessonRow[]>();
    for (const lesson of lessons) {
      const list = byLevel.get(lesson.level) ?? [];
      list.push(lesson);
      byLevel.set(lesson.level, list);
    }

    const levels = LEVELS.map((level) => {
      const levelLessons = byLevel.get(level) ?? [];
      const published = levelLessons.filter((l) => l.published);
      const completedCount = published.filter((l) => completedSet.has(l.id)).length;
      const comingSoon = levelLessons.length - published.length;

      // Units only appear once a lesson of that unit is published.
      const units: Array<Record<string, unknown>> = [];
      const unitIndex = new Map<string, number>();
      for (const lesson of published) {
        const key = `${lesson.unit}`;
        if (!unitIndex.has(key)) {
          unitIndex.set(key, units.length);
          const unitPublished = published.filter((l) => l.unit === lesson.unit);
          units.push({
            unit: lesson.unit,
            titleEn: lesson.unit_title_en,
            titleAr: lesson.unit_title_ar,
            published: unitPublished.length,
            completed: unitPublished.filter((l) => completedSet.has(l.id)).length,
            lessons: [],
          });
        }
        units[unitIndex.get(key)].lessons.push(publicLesson(lesson));
      }

      return {
        level,
        published: published.length,
        completed: completedCount,
        comingSoon,
        percent: published.length ? Math.round((completedCount / published.length) * 100) : 0,
        units,
      };
    });

    const publishedCount = lessons.filter((l) => l.published).length;
    const completedTotal = lessons.filter((l) => completedSet.has(l.id)).length;
    const currentLessonRow = current ? lessons.find((l) => l.id === current.id) ?? null : null;

    return {
      user: user ? { id: user.id } : { id: 'guest', isGuest: true },
      placement: { level: state.placement_level, source: state.placement_source },
      progress: { completedLessons: completedTotal, publishedLessons: publishedCount },
      currentLesson: currentLessonRow
        ? {
            slug: currentLessonRow.slug,
            titleEn: currentLessonRow.title_en,
            titleAr: currentLessonRow.title_ar,
            objectiveEn: currentLessonRow.objective_en,
            objectiveAr: currentLessonRow.objective_ar,
            level: currentLessonRow.level,
            kind: currentLessonRow.kind,
            steps: activitySteps(currentLessonRow.activities),
            unit: currentLessonRow.unit,
            unitTitleEn: currentLessonRow.unit_title_en,
            unitTitleAr: currentLessonRow.unit_title_ar,
            position: currentLessonRow.position,
            passScore: currentLessonRow.pass_score,
          }
        : null,
      nextLesson: nextLessonAfter(lessons, currentLessonRow?.position ?? null),
      lastTest: user ? await latestLevelTest(client, user.id) : null,
      levels,
    };
  } finally {
    client.release();
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Grading — answers never leave; scores are computed here
 * ──────────────────────────────────────────────────────────────────────────── */

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase().replace(/[.,!?;:¡¿،؟]+$/u, '');
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

/**
 * Grades ONE exercise. `raw` is the client answer; unknown kernels are
 * malformed submissions, not cheating vectors — they simply grade incorrect.
 * Returns null when the submitted value is not even boolean/structurally
 * parseable (counts as incorrect).
 */
function gradeExercise(ex: ExerciseRow, raw: unknown): boolean {
  const key = ex.answer_key ?? {};
  switch (ex.type) {
    case 'multiple_choice': {
      const options = Array.isArray(ex.options) ? ex.options : [];
      if (typeof raw !== 'number' && typeof raw !== 'string') return false;
      const index = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isInteger(index) || index < 0 || index >= options.length) return false;
      return index === key.index;
    }
    case 'true_false': {
      const submitted = toBoolean(raw);
      if (submitted === null) return false;
      return submitted === Boolean(key.value);
    }
    case 'type_answer':
    case 'fill_blank': {
      const accepted = Array.isArray(key.accept) ? key.accept.map(normalizeText) : [];
      if (accepted.length === 0) return false;
      const submittedList = Array.isArray(raw) ? raw : [raw];
      if (submittedList.length === 0) return false;
      return submittedList.every((item) => accepted.includes(normalizeText(item)));
    }
    case 'word_order': {
      const expected = Array.isArray(key.order) ? key.order.map(normalizeText) : [];
      if (expected.length === 0) return false;
      let tokens: unknown[];
      if (Array.isArray(raw)) tokens = raw;
      else if (typeof raw === 'string') tokens = raw.split(/\s+/).filter(Boolean);
      else return false;
      if (tokens.length !== expected.length) return false;
      return tokens.every((token, i) => normalizeText(token) === expected[i]);
    }
    case 'match': {
      const pairs: Array<[number, number]> = Array.isArray(key.pairs)
        ? key.pairs.map((p: unknown) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] as [number, number] : null))
            .filter(Boolean)
        : [];
      if (pairs.length === 0 || !Array.isArray(raw)) return false;
      const submitted = raw.map((p: unknown) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] as [number, number] : null)).filter(Boolean);
      if (submitted.length !== pairs.length) return false;
      const byLeft = new Map(pairs.map(([l, r]) => [l, r]));
      for (const [l, r] of submitted) {
        if (!byLeft.has(l) || byLeft.get(l) !== r) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

/** Vocabulary hit count (for the "new words" line on the completion screen). */
function countVocabWords(content: ContentRow[]): number {
  let total = 0;
  for (const row of content) {
    if (row.step !== 'vocab') continue;
    const config = row.config ?? {};
    if (Array.isArray(config.words) && config.words.length) total += config.words.length;
    else if (Number.isFinite(Number(config.count))) total += Math.max(0, Number(config.count));
  }
  return total;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Router
 * ──────────────────────────────────────────────────────────────────────────── */

export function createPathRouter(deps: PathDeps): Router {
  const router = Router();
  const logger = deps.logger ?? ((message: string, error?: unknown) => console.error(`[learning-path] ${message}`, error ?? ''));

  /* ── GET /api/path — the full map (statuses computed here) ──────────────── */
  router.get(
    '/',
    rateLimit(120, 60_000),
    optionalUser(),
    asyncHandler(async (req, res) => {
      const user = (res.locals.user as AuthUser) || null;
      const map = await buildMap(deps.pool, user);
      res.json(map);
    }),
  );

  /* ── GET /api/path/lessons/:slug — content if unlocked, 403 if locked ──── */
  router.get(
    '/lessons/:slug',
    rateLimit(90, 60_000),
    optionalUser(),
    asyncHandler(async (req, res) => {
      const user = (res.locals.user as AuthUser) || null;
      const slug = typeof req.params?.slug === 'string' ? req.params.slug : '';
      if (!SLUG_RE.test(slug)) {
        fail(res, 400, 'invalid_slug');
        return;
      }

      const client = await deps.pool.connect();
      try {
        let state: StateRow;
        let current: { id: string; slug: string; position: number } | null = null;
        if (user) {
          const ctx = await resolveContext(client, user);
          state = ctx.state;
          current = ctx.current;
        } else {
          const firstA1 = await client.query<{ id: string; slug: string; position: number }>(
            `select id, slug, position from path_lessons where published = true and level = 'A1' order by position asc limit 1`
          );
          current = firstA1.rows[0] ?? null;
          state = {
            user_id: 'guest',
            placement_level: 'A1',
            placement_source: null,
            current_lesson_id: current?.id ?? null,
            updated_at: new Date(),
          };
        }

        const lessonQ = await client.query<LessonRow>(
          `select id, slug, level, unit, unit_title_en, unit_title_ar, position,
                  title_en, title_ar, objective_en, objective_ar, kind, pass_score, published, activities
             from path_lessons
            where slug = $1`,
          [slug],
        );
        const lesson = lessonQ.rows[0];
        if (!lesson || !lesson.published) {
          fail(res, 404, 'not_found');
          return;
        }

        const progressRows = user ? await loadProgress(client, user.id) : [];
        const own = progressRows.find((row) => row.lesson_id === lesson.id);
        const completed = own?.status === 'completed';

        // Locking: linear frontier. Direct URLs and API calls behave identically.
        if (!completed && current && lesson.position > current.position) {
          fail(res, 403, 'lesson_locked', 'This lesson is still locked. Finish the current lesson first.', 'هذا الدرس لا يزال مقفلاً. أكمل الدرس الحالي أولاً.', {
            currentSlug: current.slug,
          });
          return;
        }
        if (!completed && !current) {
          const unlockedWithoutPointer =
            levelRank(lesson.level) < levelRank(state.placement_level) ||
            (levelRank(lesson.level) === levelRank(state.placement_level) &&
              lesson.position ===
                (await firstPublishedPositionOfLevel(client, state.placement_level)));
          if (!unlockedWithoutPointer) {
            fail(res, 403, 'lesson_locked', 'This lesson is still locked.', 'هذا الدرس لا يزال مقفلاً.');
            return;
          }
        }

        const contentQ = await client.query<ContentRow>(
          `select id, step, position, explanation_en, explanation_ar, examples, notes_en, notes_ar, config
             from path_lesson_content
            where lesson_id = $1
            order by position asc`,
          [lesson.id],
        );
        // answer_key and explanation_* are INTENTIONALLY not selected here.
        // Only reviewed questions are ever served to learners.
        const exercisesQ = await client.query<ExerciseRow>(
          `select id, step, type, prompt_en, prompt_ar, options, position
             from path_lesson_exercises
            where lesson_id = $1 and status = 'approved'
            order by position asc`,
          [lesson.id],
        );

        const stepQ = user
          ? await client.query<{ step: string; xp: number }>(
              `select step, xp
                 from user_path_step_progress
                where user_id = $1 and lesson_id = $2`,
              [user.id, lesson.id],
            )
          : { rows: [] };
        const completedSteps = stepQ.rows.map((row) => row.step);
        const optionalXp = stepQ.rows.reduce((sum, row) => sum + (Number(row.xp) || 0), 0);
        const hasApprovedCheck = exercisesQ.rows.some((row) => row.step === 'check');

        res.json({
          lesson: {
            slug: lesson.slug,
            level: lesson.level,
            unit: lesson.unit,
            unitTitleEn: lesson.unit_title_en,
            unitTitleAr: lesson.unit_title_ar,
            position: lesson.position,
            titleEn: lesson.title_en,
            titleAr: lesson.title_ar,
            objectiveEn: lesson.objective_en,
            objectiveAr: lesson.objective_ar,
            kind: lesson.kind,
            passScore: lesson.pass_score,
            activities: lesson.activities ?? [],
          },
          content: contentQ.rows.map((row) => ({
            id: row.id,
            step: row.step,
            position: row.position,
            explanationEn: row.explanation_en,
            explanationAr: row.explanation_ar,
            examples: row.examples ?? [],
            notesEn: row.notes_en,
            notesAr: row.notes_ar,
            config: row.config ?? {},
          })),
          exercises: exercisesQ.rows.map(exerciseHeader),
          completedSteps,
          optionalXp,
          hasApprovedCheck,
          requiredStep: hasApprovedCheck ? 'check' : 'learn',
          userProgress: {
            completed,
            bestScore: own?.best_score ?? null,
            attempts: own?.attempts ?? 0,
          },
          newWords: countVocabWords(contentQ.rows),
        });
      } finally {
        client.release();
      }
    }),
  );

  /* ── POST /api/path/lessons/:slug/attempt — server-graded ─────────────────
   * body: { step?: 'practice' | 'check' (default 'check'),
   *         answers: { [exerciseId]: unknown } }
   * 'practice' → transient per-exercise feedback; nothing is stored.
   * 'check'    → graded, stored, and (when the lesson passes) the next lesson
   *              is unlocked in the same transaction. Idempotent/replay-safe.
   */
  router.post(
    '/lessons/:slug/attempt',
    rateLimit(60, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const slug = typeof req.params?.slug === 'string' ? req.params.slug : '';
      if (!SLUG_RE.test(slug)) {
        fail(res, 400, 'invalid_slug');
        return;
      }
      const step = req.body?.step === 'practice' ? 'practice' : 'check';
      const answers = (req.body?.answers && typeof req.body.answers === 'object' && !Array.isArray(req.body.answers))
        ? req.body.answers
        : {};
      if (Object.keys(answers).length > MAX_ANSWER_ENTRIES) {
        fail(res, 400, 'payload_too_large', 'Too many answers submitted.', 'عدد كبير جداً من الإجابات.');
        return;
      }

      const client = await deps.pool.connect();
      try {
        const { state, current } = await resolveContext(client, user);
        const lessonQ = await client.query<LessonRow>(
          `select id, slug, level, unit, position, title_en, title_ar, pass_score, published, kind, activities
             from path_lessons
            where slug = $1`,
          [slug],
        );
        const lesson = lessonQ.rows[0];
        if (!lesson || !lesson.published) {
          fail(res, 404, 'not_found');
          return;
        }

        /* Facing state — identical rule for content and attempts. */
        const progressRows = await loadProgress(client, user.id);
        const own = progressRows.find((row) => row.lesson_id === lesson.id);
        const alreadyCompleted = own?.status === 'completed';

        let locked = false;
        if (!alreadyCompleted) {
          if (current) locked = lesson.position > current.position;
          else {
            const unlockedWithoutPointer =
              levelRank(lesson.level) < levelRank(state.placement_level) ||
              (levelRank(lesson.level) === levelRank(state.placement_level) &&
                lesson.position === (await firstPublishedPositionOfLevel(client, state.placement_level)));
            locked = !unlockedWithoutPointer;
          }
        }
        if (locked) {
          fail(res, 403, 'lesson_locked', 'This lesson is still locked.', 'هذا الدرس لا يزال مقفلاً.', {
            currentSlug: current?.slug ?? null,
          });
          return;
        }

        // Exercises WITH answer keys (module-local; never serialized).
        const exerciseQ = await client.query<ExerciseRow>(
          `select id, step, type, prompt_en, prompt_ar, options, answer_key, explanation_en, explanation_ar, position
             from path_lesson_exercises
            where lesson_id = $1 and step = $2 and status = 'approved'
            order by position asc`,
          [lesson.id, step],
        );
        const exercises = exerciseQ.rows;
        if (exercises.length === 0) {
          fail(res, 409, 'no_exercises', step === 'check'
            ? 'This lesson has no check questions yet.'
            : 'This lesson has no practice questions yet.',
            step === 'check' ? 'لا توجد أسئلة اختبار في هذا الدرس بعد.' : 'لا توجد أسئلة تدريب في هذا الدرس بعد.');
          return;
        }
        const byId = new Map(exercises.map((ex) => [ex.id, ex]));

        if (step === 'practice') {
          // Transient per-exercise feedback: graded, explained, never stored.
          const results = exercises
            .filter((ex) => answers[ex.id] !== undefined)
            .slice(0, MAX_ANSWER_ENTRIES)
            .map((ex) => {
              const correct = gradeExercise(ex, answers[ex.id]);
              const { explanationEn, explanationAr } = explanationOf(ex);
              return { exerciseId: ex.id, correct, explanationEn, explanationAr };
            });
          res.json({ step, results });
          return;
        }

        // ── check step ──
        // Everything counts: missing submissions grade as incorrect, so a
        // partial replay cannot cherry-pick a higher score.
        let correctCount = 0;
        const results = exercises.map((ex) => {
          const correct = gradeExercise(ex, answers[ex.id]);
          if (correct) correctCount++;
          return {
            exerciseId: ex.id,
            submitted: answers[ex.id] !== undefined,
            correct,
            ...explanationOf(ex),
          };
        });
        const score = Math.round((correctCount / exercises.length) * 100);

        await client.query('begin');
        try {
          const existing = await client.query<ProgressRow>(
            `select lesson_id, status, best_score, attempts, completed_at, updated_at
               from user_path_progress
              where user_id = $1 and lesson_id = $2
              for update`,
            [user.id, lesson.id],
          );
          const row = existing.rows[0];

          // Fast double-submit guard.
          if (row && Date.now() - new Date(row.updated_at).getTime() < REPLAY_WINDOW_MS) {
            await client.query('rollback');
            res.json({
              step,
              replayed: true,
              score: row.best_score,
              passScore: lesson.pass_score,
              passed: row.best_score >= lesson.pass_score,
              attempts: row.attempts,
              bestScore: row.best_score,
              completed: row.status === 'completed',
              xpAwarded: row.status === 'completed' ? 15 + 5 * exercises.length : 0,
              newWords: await countVocabWordsAsync(client, lesson.id),
              nextLesson: null,
              results,
            });
            return;
          }

          const passed = score >= lesson.pass_score;

          if (row) {
            await client.query(
              `update user_path_progress
                  set attempts = attempts + 1,
                      best_score = greatest(best_score, $3),
                      status = case when $4 then 'completed' else status end,
                      completed_at = case when $4 and completed_at is null then now() else completed_at end,
                      updated_at = now()
                where user_id = $1 and lesson_id = $2`,
              [user.id, lesson.id, score, passed],
            );
          } else {
            await client.query(
              `insert into user_path_progress (user_id, lesson_id, status, best_score, attempts, completed_at)
               values ($1, $2, $3, $4, 1, case when $5 then now() else null end)`,
              [user.id, lesson.id, passed ? 'completed' : 'unlocked', score, passed],
            );
          }

          // Advancing the frontier happens only when the completed lesson IS
          // the pointer (revision completions of earlier lessons never move it).
          let nextLesson: { slug: string; titleEn: string; titleAr: string } | null = null;
          if (passed && current && current.id === lesson.id) {
            await client.query(
              `update user_path_state
                  set current_lesson_id = (
                        select l.id from path_lessons l
                         where l.published and l.position > $2
                         order by l.position asc
                         limit 1
                      ),
                      updated_at = now()
                where user_id = $1 and current_lesson_id = $3`,
              [user.id, lesson.position, current.id],
            );
            const refreshed = await client.query<{ slug: string; title_en: string; title_ar: string }>(
              `select l.slug, l.title_en, l.title_ar
                 from user_path_state s join path_lessons l on l.id = s.current_lesson_id
                where s.user_id = $1`,
              [user.id],
            );
            const next = refreshed.rows[0];
            if (next) {
              nextLesson = { slug: next.slug, titleEn: next.title_en, titleAr: next.title_ar };
            }
          }

          await client.query('commit');

          res.json({
            step,
            replayed: false,
            score,
            passScore: lesson.pass_score,
            passed,
            attempts: (row?.attempts ?? 0) + 1,
            bestScore: Math.max(row?.best_score ?? 0, score),
            completed: alreadyCompleted || passed,
            // Deterministic, server-computed display value (the existing XP
            // ledger in users.data stays client-side exactly as before).
            xpAwarded: passed ? 15 + 5 * exercises.length : 0,
            newWords: await countVocabWordsAsync(client, lesson.id),
            nextLesson,
            results,
          });
        } catch (error) {
          await client.query('rollback');
          throw error;
        }
      } catch (error) {
        if (isSchemaMissing(error)) {
          fail(res, 503, 'schema_missing',
            'Run migrations/learning-path.sql and migrations/path-lesson-steps.sql in the Supabase SQL Editor.',
            'يرجى تشغيل ملفي migrations/learning-path.sql و migrations/path-lesson-steps.sql في محرر SQL في Supabase.');
          return;
        }
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  /* ── POST /api/path/lessons/:slug/steps/:step — optional-step XP ──────────
   * Records completion of an optional step (Learn, Words, Listen, Read, Write,
   * Practice). Never gates progress and never writes lesson completion.
   */
  const OPTIONAL_STEPS = new Set(['learn', 'words', 'listen', 'read', 'write', 'practice']);
  const OPTIONAL_STEP_XP: Record<string, number> = {
    learn: 5, words: 5, listen: 5, read: 5, write: 10, practice: 10,
  };

  router.post(
    '/lessons/:slug/steps/:step',
    rateLimit(60, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const slug = typeof req.params?.slug === 'string' ? req.params.slug : '';
      const step = typeof req.params?.step === 'string' ? req.params.step : '';
      if (!SLUG_RE.test(slug)) {
        fail(res, 400, 'invalid_slug');
        return;
      }
      if (!OPTIONAL_STEPS.has(step)) {
        fail(res, 400, 'invalid_step', 'Unknown optional step.');
        return;
      }

      const client = await deps.pool.connect();
      try {
        const { state, current } = await resolveContext(client, user);
        const lessonQ = await client.query<LessonRow>(
          `select id, slug, level, unit, position, title_en, title_ar, pass_score, published, kind, activities
             from path_lessons
            where slug = $1`,
          [slug],
        );
        const lesson = lessonQ.rows[0];
        if (!lesson || !lesson.published) {
          fail(res, 404, 'not_found');
          return;
        }

        const progressRows = await loadProgress(client, user.id);
        const alreadyCompleted = progressRows.find(
          (row) => row.lesson_id === lesson.id && row.status === 'completed',
        );
        let locked = false;
        if (!alreadyCompleted) {
          if (current) locked = lesson.position > current.position;
          else {
            const unlockedWithoutPointer =
              levelRank(lesson.level) < levelRank(state.placement_level) ||
              (levelRank(lesson.level) === levelRank(state.placement_level) &&
                lesson.position === (await firstPublishedPositionOfLevel(client, state.placement_level)));
            locked = !unlockedWithoutPointer;
          }
        }
        if (locked) {
          fail(res, 403, 'lesson_locked', 'This lesson is still locked.', 'هذا الدرس لا يزال مقفلاً.', {
            currentSlug: current?.slug ?? null,
          });
          return;
        }

        if (step === 'practice') {
          const hasPractice = await client.query(
            `select 1 from path_lesson_exercises
              where lesson_id = $1 and step = 'practice' and status = 'approved'
              limit 1`,
            [lesson.id],
          );
          if (hasPractice.rows.length === 0) {
            fail(res, 409, 'no_exercises', 'This lesson has no approved practice questions yet.');
            return;
          }
        } else {
          const hasContent = await client.query(
            `select 1 from path_lesson_content
              where lesson_id = $1 and step = $2
              limit 1`,
            [lesson.id, step],
          );
          if (hasContent.rows.length === 0) {
            fail(res, 404, 'step_not_found', 'This step is not part of the lesson.');
            return;
          }
        }

        const xp = OPTIONAL_STEP_XP[step];
        const inserted = await client.query(
          `insert into user_path_step_progress (user_id, lesson_id, step, xp)
           values ($1, $2, $3, $4)
           on conflict (user_id, lesson_id, step) do nothing
           returning xp`,
          [user.id, lesson.id, step, xp],
        );
        const xpAwarded = inserted.rows[0]?.xp ?? 0;
        res.json({
          step,
          xpAwarded,
          alreadyCompleted: inserted.rows.length === 0,
        });
      } catch (error) {
        if (isSchemaMissing(error)) {
          fail(res, 503, 'schema_missing',
            'Run migrations/learning-path.sql and migrations/path-lesson-steps.sql in the Supabase SQL Editor.',
            'يرجى تشغيل ملفي migrations/learning-path.sql و migrations/path-lesson-steps.sql في محرر SQL في Supabase.');
          return;
        }
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  /* ── POST /api/path/lessons/:slug/complete — Learn-only completion ─────────
   * The approved rule: Check is required when approved Check questions exist;
   * otherwise Learn is required. This endpoint refuses when an approved Check
   * exists, and requires a recorded Learn completion before it will complete
   * the lesson. Used by the lesson player's "Finish lesson" action.
   */
  router.post(
    '/lessons/:slug/complete',
    rateLimit(20, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const slug = typeof req.params?.slug === 'string' ? req.params.slug : '';
      if (!SLUG_RE.test(slug)) {
        fail(res, 400, 'invalid_slug');
        return;
      }

      const client = await deps.pool.connect();
      try {
        const { state, current } = await resolveContext(client, user);
        const lessonQ = await client.query<LessonRow>(
          `select id, slug, level, unit, position, title_en, title_ar, pass_score, published, kind, activities
             from path_lessons
            where slug = $1`,
          [slug],
        );
        const lesson = lessonQ.rows[0];
        if (!lesson || !lesson.published) {
          fail(res, 404, 'not_found');
          return;
        }

        const progressRows = await loadProgress(client, user.id);
        const own = progressRows.find((row) => row.lesson_id === lesson.id);
        const alreadyCompleted = own?.status === 'completed';

        let locked = false;
        if (!alreadyCompleted) {
          if (current) locked = lesson.position > current.position;
          else {
            const unlockedWithoutPointer =
              levelRank(lesson.level) < levelRank(state.placement_level) ||
              (levelRank(lesson.level) === levelRank(state.placement_level) &&
                lesson.position === (await firstPublishedPositionOfLevel(client, state.placement_level)));
            locked = !unlockedWithoutPointer;
          }
        }
        if (locked) {
          fail(res, 403, 'lesson_locked', 'This lesson is still locked.', 'هذا الدرس لا يزال مقفلاً.', {
            currentSlug: current?.slug ?? null,
          });
          return;
        }

        const approvedCheck = await client.query(
          `select 1 from path_lesson_exercises
            where lesson_id = $1 and step = 'check' and status = 'approved'
            limit 1`,
          [lesson.id],
        );
        if (approvedCheck.rows.length > 0) {
          fail(res, 409, 'check_required',
            'This lesson has approved Check questions. Complete the Check to finish it.',
            'هذا الدرس يحتوي على أسئلة اختبار معتمدة. أكمل الاختبار لإنهاء الدرس.');
          return;
        }

        const learnContent = await client.query(
          `select 1 from path_lesson_content
            where lesson_id = $1 and step = 'learn'
            limit 1`,
          [lesson.id],
        );
        if (learnContent.rows.length === 0) {
          fail(res, 409, 'no_content', 'This lesson has no approved content yet.');
          return;
        }
        const learned = await client.query(
          `select 1 from user_path_step_progress
            where user_id = $1 and lesson_id = $2 and step = 'learn'
            limit 1`,
          [user.id, lesson.id],
        );
        if (learned.rows.length === 0) {
          fail(res, 409, 'learn_required',
            'Open the Learn step before finishing this lesson.',
            'افتح خطوة التعلّم قبل إنهاء هذا الدرس.');
          return;
        }

        await client.query('begin');
        try {
          const existing = await client.query<ProgressRow>(
            `select lesson_id, status, best_score, attempts, completed_at, updated_at
               from user_path_progress
              where user_id = $1 and lesson_id = $2
              for update`,
            [user.id, lesson.id],
          );
          const row = existing.rows[0];

          if (row && row.status === 'completed') {
            await client.query('rollback');
            res.json({
              completed: true,
              replayed: true,
              score: row.best_score,
              xpAwarded: 0,
              passScore: lesson.pass_score,
              nextLesson: null,
            });
            return;
          }

          if (row) {
            await client.query(
              `update user_path_progress
                  set attempts = attempts + 1,
                      status = 'completed',
                      completed_at = now(),
                      updated_at = now()
                where user_id = $1 and lesson_id = $2`,
              [user.id, lesson.id],
            );
          } else {
            await client.query(
              `insert into user_path_progress (user_id, lesson_id, status, best_score, attempts, completed_at)
               values ($1, $2, 'completed', 0, 1, now())`,
              [user.id, lesson.id],
            );
          }

          let nextLesson: { slug: string; titleEn: string; titleAr: string } | null = null;
          if (current && current.id === lesson.id) {
            await client.query(
              `update user_path_state
                  set current_lesson_id = (
                        select l.id from path_lessons l
                         where l.published and l.position > $2
                         order by l.position asc
                         limit 1
                      ),
                      updated_at = now()
                where user_id = $1 and current_lesson_id = $3`,
              [user.id, lesson.position, current.id],
            );
            const refreshed = await client.query<{ slug: string; title_en: string; title_ar: string }>(
              `select l.slug, l.title_en, l.title_ar
                 from user_path_state s join path_lessons l on l.id = s.current_lesson_id
                where s.user_id = $1`,
              [user.id],
            );
            const next = refreshed.rows[0];
            if (next) nextLesson = { slug: next.slug, titleEn: next.title_en, titleAr: next.title_ar };
          }

          await client.query('commit');
          res.json({
            completed: true,
            replayed: false,
            score: null,
            passScore: lesson.pass_score,
            xpAwarded: 15,
            nextLesson,
          });
        } catch (error) {
          await client.query('rollback');
          throw error;
        }
      } catch (error) {
        if (isSchemaMissing(error)) {
          fail(res, 503, 'schema_missing',
            'Run migrations/learning-path.sql and migrations/path-lesson-steps.sql in the Supabase SQL Editor.',
            'يرجى تشغيل ملفي migrations/learning-path.sql و migrations/path-lesson-steps.sql في محرر SQL في Supabase.');
          return;
        }
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  /* ── POST /api/path/placement — from lt_results or an explicit level ─────
   * body: {} → use the latest level-test result; { level } → explicit
   * ("Start from A1"). Never marks any lesson completed.
   */
  router.post(
    '/placement',
    rateLimit(10, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;

      let level: PathLevel;
      let source: string | null = null;

      if (req.body && typeof req.body === 'object' && req.body.level !== undefined) {
        const requested = String(req.body.level).trim().toUpperCase();
        if (!LEVELS.includes(requested as PathLevel)) {
          fail(res, 400, 'invalid_level', 'Level must be one of A1, A2, B1, B2, C1.', 'يجب أن يكون المستوى A1 أو A2 أو B1 أو B2 أو C1.');
          return;
        }
        level = requested as PathLevel;
      } else {
        const client = await deps.pool.connect();
        try {
          const latest = await client.query<{ session_id: string; level: string }>(
            `select session_id, level from lt_results where user_id = $1 order by created_at desc limit 1`,
            [user.id],
          );
          const row = latest.rows[0];
          if (!row) {
            fail(res, 404, 'no_placement_test',
              'No level-test result yet. Take the placement test first.',
              'لا توجد نتيجة اختبار مستوى بعد. خذ اختبار المستوى أولاً.');
            return;
          }
          source = row.session_id;
          level = clampLevel(row.level);
        } finally {
          client.release();
        }
      }

      const client = await deps.pool.connect();
      try {
        await ensureUserRow(client, user);
        await ensureStateRow(client, user.id);
        await client.query(
          `update user_path_state
              set placement_level = $2,
                  placement_source = $3,
                  current_lesson_id = (
                    select l.id from path_lessons l
                     where l.published
                       and l.level = $2
                       and not exists (
                             select 1 from user_path_progress p
                              where p.user_id = $1 and p.lesson_id = l.id and p.status = 'completed'
                           )
                     order by l.position asc
                     limit 1
                  ),
                  updated_at = now()
            where user_id = $1`,
          [user.id, level, source],
        );
        res.json(await buildMap(deps.pool, user));
      } finally {
        client.release();
      }
    }),
  );

  /* ── Error normalization ─────────────────────────────────────────────────── */
  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (isSchemaMissing(error)) {
      fail(res, 503, 'schema_missing',
        'Learning-path tables are not created yet. Run migrations/learning-path.sql in the Supabase SQL Editor.',
        'جداول مسار التعلم غير موجودة. يرجى تشغيل ملف migrations/learning-path.sql في محرر SQL في Supabase.');
      return;
    }
    logger('request failed:', error);
    if (!res.headersSent) {
      fail(res, 500, 'internal_error');
    }
  });

  return router;
}

async function firstPublishedPositionOfLevel(
  client: Pool | PoolClient,
  level: PathLevel,
): Promise<number | null> {
  const result = await client.query<{ position: number }>(
    `select min(position) as position from path_lessons where published and level = $1`,
    [level],
  );
  return result.rows[0]?.position ?? null;
}

async function countVocabWordsAsync(
  client: Pool | PoolClient,
  lessonId: string,
): Promise<number> {
  const result = await client.query<ContentRow>(
    `select id, step, position, explanation_en, explanation_ar, examples, notes_en, notes_ar, config
       from path_lesson_content
      where lesson_id = $1 and step = 'vocab'`,
    [lessonId],
  );
  return countVocabWords(result.rows);
}
