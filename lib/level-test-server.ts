// @ts-nocheck
/**
 * Venoxa Level Test — shared Express router.
 *
 * Used by BOTH backends:
 *   - artifacts/api-server (local dev, port 3001)
 *   - api/index.ts (Vercel production)
 *
 * The caller supplies a pg Pool. Auth is verified against Supabase's
 * /auth/v1/user endpoint using the caller's access token; all rows are keyed
 * by the Supabase user UUID.
 *
 * Hard rule: no correct_index, difficulty_b, theta or SE ever leaves this
 * module. Item payloads contain only stem/options/passage/audio.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

import {
  QUICK_CONFIG,
  DEFAULT_CONFIG,
  SEED_DIFFICULTY,
  cefrFromScore,
  scoreResult,
  selectNextItem,
  stopReason,
  updateAbility,
  type CefrLevel,
  type EngineConfig,
  type EngineItem,
  type ItemType,
  type ScoredResponse,
} from './level-test-engine.ts';

/* ────────────────────────────────────────────────────────────────────────────
 * Public types / deps
 * ──────────────────────────────────────────────────────────────────────────── */

export interface LevelTestDeps {
  pool: Pool;
  /** Optional override, e.g. https://venoxa.ai. Otherwise the request origin. */
  appBaseUrl?: string;
  cooldownDays?: number;
  /** Local dev before teacher review: include draft items in the pool. */
  allowDraft?: boolean;
  logger?: (message: string, error?: unknown) => void;
}

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

interface ItemRow {
  id: string;
  type: ItemType;
  cefr_tag: CefrLevel;
  difficulty_b: number;
  stem: string;
  options: string[];
  correct_index: number;
  passage_id: string | null;
  passage_order: number | null;
  audio_script: string | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  mode: 'standard' | 'quick';
  status: 'active' | 'completed' | 'expired';
  theta: number;
  se: number;
  answered_ids: string[];
  counts: Partial<Record<ItemType, number>>;
  active_passage_id: string | null;
  option_orders: Record<string, number[]>;
  current_item_id: string | null;
  cert_name: string | null;
  started_at: Date;
  deadline: Date;
}

interface ResultRow {
  session_id: string;
  cert_id: string;
  user_id: string;
  name: string;
  level: CefrLevel;
  score: number;
  ci_low: number;
  ci_high: number;
  theta: number;
  se: number;
  section_scores: Record<string, { score: number; theta?: number; se?: number; items: number; lowConfidence: boolean }>;
  answered: number;
  provisional: boolean;
  created_at: Date;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Small helpers
 * ──────────────────────────────────────────────────────────────────────────── */

const CERT_ID_RE = /^VX-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const CERT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ARABIC_RE = /[\u0600-\u06FF]/;

function configFor(mode: string): EngineConfig {
  return mode === 'quick' ? QUICK_CONFIG : DEFAULT_CONFIG;
}

function publicBase(req: Request, deps: LevelTestDeps): string {
  const configured =
    deps.appBaseUrl ??
    process.env.LEVEL_TEST_VERIFY_BASE_URL ??
    process.env.PUBLIC_APP_URL ??
    '';
  if (configured) return configured.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] ?? req.protocol ?? 'https';
  const host = (req.headers['x-forwarded-host'] as string)?.split(',')[0] ?? req.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

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

function sanitizeCertName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().replace(/\s+/g, ' ');
  if (value.length < 2 || value.length > 60) return null;
  if (ARABIC_RE.test(value)) return null;
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(value)) return null;
  return value;
}

function randomCertId(year: number): string {
  const chunk = () => {
    let out = '';
    for (let i = 0; i < 4; i++) out += CERT_ALPHABET[crypto.randomInt(CERT_ALPHABET.length)];
    return out;
  };
  return `VX-${year}-${chunk()}-${chunk()}`;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? Math.round(value) : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function toEngineItem(row: ItemRow): EngineItem {
  return {
    id: row.id,
    type: row.type,
    cefrTag: row.cefr_tag,
    difficulty: Number(row.difficulty_b),
    passageId: row.passage_id,
    passageOrder: row.passage_order ?? 0,
  };
}

function shuffledOrder(): number[] {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Auth (Supabase access token)
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

/* ────────────────────────────────────────────────────────────────────────────
 * DB helpers
 * ──────────────────────────────────────────────────────────────────────────── */

async function loadItem(client: Pool | PoolClient, itemId: string): Promise<ItemRow | null> {
  const result = await client.query<ItemRow>(
    `select id, type, cefr_tag, difficulty_b, stem, options, correct_index,
            passage_id, passage_order, audio_script
       from lt_items
      where id = $1`,
    [itemId],
  );
  return result.rows[0] ?? null;
}

async function loadPool(client: Pool | PoolClient, allowDraft: boolean): Promise<ItemRow[]> {
  const result = await client.query<ItemRow>(
    `select id, type, cefr_tag, difficulty_b, stem, options, correct_index,
            passage_id, passage_order, audio_script
       from lt_items
      where status = 'active' or ($1::boolean and status = 'draft')
      order by id`,
    [allowDraft],
  );
  return result.rows;
}

async function loadResponses(client: Pool | PoolClient, sessionId: string): Promise<ScoredResponse[]> {
  const result = await client.query<{ difficulty_b: number; correct: boolean; type: ItemType }>(
    `select i.difficulty_b, r.correct, i.type
       from lt_responses r
       join lt_items i on i.id = r.item_id
      where r.session_id = $1
      order by r.id`,
    [sessionId],
  );
  return result.rows.map((row) => ({
    difficulty: Number(row.difficulty_b),
    correct: row.correct,
    type: row.type,
  }));
}

async function loadSession(client: Pool | PoolClient, sessionId: string, userId: string): Promise<SessionRow | null> {
  const result = await client.query<SessionRow>(
    `select * from lt_sessions where id = $1 and user_id = $2`,
    [sessionId, userId],
  );
  return result.rows[0] ?? null;
}

async function getProfileName(client: Pool | PoolClient, userId: string, email: string | null): Promise<string> {
  try {
    const result = await client.query<{ name: string | null }>(
      `select coalesce(data->>'username', data->>'name', data->>'full_name') as name
         from public.users where id = $1`,
      [userId],
    );
    const profile = sanitizeCertName(result.rows[0]?.name);
    if (profile) return profile;
  } catch {
    /* public.users may be unavailable in a bare dev database */
  }
  const emailPrefix = email?.split('@')[0] ?? '';
  return sanitizeCertName(emailPrefix) ?? 'Venoxa Learner';
}

/* ────────────────────────────────────────────────────────────────────────────
 * Item payload
 * ──────────────────────────────────────────────────────────────────────────── */

function audioSecret(): string | null {
  return (
    process.env.LEVEL_TEST_AUDIO_SECRET ??
    process.env.JWT_SECRET ??
    null
  );
}

function audioSignature(itemId: string, exp: number, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${itemId}.${exp}`).digest('base64url');
}

function signedAudioUrl(itemId: string): string | null {
  const secret = audioSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + 300;
  const sig = audioSignature(itemId, exp, secret);
  return `/api/level-test/audio/${encodeURIComponent(itemId)}?exp=${exp}&sig=${sig}`;
}

async function buildItemPayload(
  client: Pool | PoolClient,
  item: ItemRow,
  order: number[],
  session: SessionRow,
): Promise<Record<string, unknown>> {
  let passage: {
    id: string;
    title: string;
    body: string;
    questionOrder: number;
    questionCount: number;
  } | null = null;
  if (item.passage_id) {
    const result = await client.query<{
      id: string;
      title: string;
      body: string;
      question_count: string;
    }>(
      `select p.id, p.title, p.body,
              (select count(*) from lt_items i where i.passage_id = p.id) as question_count
         from lt_passages p where p.id = $1`,
      [item.passage_id],
    );
    const row = result.rows[0];
    if (row) {
      passage = {
        id: row.id,
        title: row.title,
        body: row.body,
        questionOrder: item.passage_order ?? 1,
        questionCount: Number(row.question_count) || 1,
      };
    }
  }
  const config = configFor(session.mode);
  const answered = Array.isArray(session.answered_ids) ? session.answered_ids.length : 0;
  return {
    id: item.id,
    type: item.type,
    // cefr_tag / difficulty / correct_index intentionally never leave the server.
    stem: item.stem,
    options: order.map((index) => item.options[index]),
    passage,
    audioUrl: item.type === 'listening' ? signedAudioUrl(item.id) : null,
    audioPlays: item.type === 'listening' ? 1 : 0,
    index: answered + 1,
    minItems: config.minItems,
    maxItems: config.maxItems,
    softLimitSec: item.type === 'reading' ? 180 : item.type === 'listening' ? 120 : 90,
    mode: session.mode,
    deadline: session.deadline,
    serverNow: new Date().toISOString(),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Finalisation
 * ──────────────────────────────────────────────────────────────────────────── */

async function finalizeSession(
  client: PoolClient,
  session: SessionRow,
  timedOut: boolean,
): Promise<ResultRow | null> {
  const responses = await loadResponses(client, session.id);
  if (responses.length === 0) {
    await client.query(
      `update lt_sessions set status = 'expired', current_item_id = null, completed_at = now() where id = $1`,
      [session.id],
    );
    return null;
  }

  const config = configFor(session.mode);
  const result = scoreResult(responses, config, { theta: session.theta, se: session.se });
  const provisional = responses.length < config.minItems;
  const name = sanitizeCertName(session.cert_name) ?? 'Venoxa Learner';
  const year = new Date().getUTCFullYear();

  let certId = randomCertId(year);
  let inserted: ResultRow | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const insert = await client.query<ResultRow>(
      `insert into lt_results
         (session_id, cert_id, user_id, name, level, score, ci_low, ci_high,
          theta, se, section_scores, answered, provisional)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13)
       on conflict do nothing
       returning *`,
      [
        session.id,
        certId,
        session.user_id,
        name,
        result.level,
        result.score,
        result.range.low,
        result.range.high,
        result.theta,
        result.se,
        JSON.stringify(result.sections),
        result.answered,
        provisional,
      ],
    );
    if (insert.rows[0]) {
      inserted = insert.rows[0];
      break;
    }
    // A conflict can only be on session_id (already finalized by a concurrent
    // request) or on cert_id (astronomically unlikely). `on conflict do
    // nothing` keeps the transaction usable in both cases.
    const existing = await client.query<ResultRow>(
      `select * from lt_results where session_id = $1`,
      [session.id],
    );
    if (existing.rows[0]) {
      inserted = existing.rows[0];
      break;
    }
    certId = randomCertId(year);
  }
  if (!inserted) throw new Error('Could not allocate a unique certificate id');

  await client.query(
    `update lt_sessions
        set status = 'completed', completed_at = now(), current_item_id = null,
            theta = $2, se = $3, answered_ids = $4::jsonb, counts = $5::jsonb
      where id = $1`,
    [
      session.id,
      session.theta,
      session.se,
      JSON.stringify(session.answered_ids ?? []),
      JSON.stringify(session.counts ?? {}),
    ],
  );

  if (timedOut) {
    // The timeout itself is not persisted separately; `provisional` plus the
    // session deadline are enough for the result screen.
  }

  return inserted;
}

function publicResult(row: ResultRow, baseUrl: string): Record<string, unknown> {
  const sections: Record<string, unknown> = {};
  for (const [type, value] of Object.entries(row.section_scores ?? {})) {
    sections[type] = {
      score: value.score,
      items: value.items,
      lowConfidence: value.lowConfidence,
    };
  }
  return {
    sessionId: row.session_id,
    certId: row.cert_id,
    name: row.name,
    level: row.level,
    score: row.score,
    range: { low: row.ci_low, high: row.ci_high },
    sections,
    answered: row.answered,
    provisional: row.provisional,
    date: row.created_at,
    verifyUrl: `${baseUrl}/#/verify/${row.cert_id}`,
    betaNote: 'Beta: accuracy improves as more learners take the test.',
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Certificate PDF
 * ──────────────────────────────────────────────────────────────────────────── */

const BLUE = rgb(0.055, 0.29, 0.643); // #0E4AA4
const BLUE_LIGHT = rgb(0.31, 0.49, 1); // #4F7CFF
const INK = rgb(0.1, 0.1, 0.12);
const MUTED = rgb(0.35, 0.39, 0.45);
const MINT = rgb(0.91, 0.97, 0.94);
const AMBER = rgb(1, 0.96, 0.9);
const LAVENDER = rgb(0.94, 0.93, 1);

function wrapLines(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderCertificate(row: ResultRow, verifyUrl: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  // Never draw non-Latin text with the built-in Helvetica fonts. Names are
  // sanitized when the result is stored, but re-check here so a manually
  // edited row cannot produce a broken or Arabic certificate.
  const nameSafe = sanitizeCertName(row.name) ?? 'Venoxa Learner';

  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: rgb(1, 1, 1) });
  page.drawRectangle({
    x: 22, y: 22, width: 798, height: 551,
    borderColor: BLUE, borderWidth: 2.5,
  });
  page.drawRectangle({
    x: 30, y: 30, width: 782, height: 535,
    borderColor: BLUE_LIGHT, borderWidth: 0.8,
  });

  const center = (text: string, y: number, size: number, font = regular, color = INK) => {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (842 - width) / 2, y, size, font, color });
  };

  center('VENOXA AI', 520, 12, bold, BLUE);
  center('Certificate of English Level', 475, 27, bold, INK);
  center('Venoxa Level Test · aligned to the CEFR scale', 455, 10.5, regular, MUTED);

  page.drawText('This certifies that', {
    x: 70, y: 410, size: 11, font: italic, color: MUTED,
  });
  // Shrink long names instead of wrapping into the level/score row below.
  let nameSize = 25;
  while (nameSize > 12 && bold.widthOfTextAtSize(nameSafe, nameSize) > 500) {
    nameSize -= 1;
  }
  page.drawText(nameSafe, {
    x: 70, y: 372, size: nameSize, font: bold, color: INK,
  });

  const levelLabel = `CEFR ${row.level}`;
  page.drawRectangle({
    x: 70, y: 292, width: 176, height: 62,
    color: MINT, borderColor: BLUE_LIGHT, borderWidth: 0.8,
  });
  page.drawText(levelLabel, { x: 88, y: 314, size: 26, font: bold, color: BLUE });

  page.drawText('Overall score', { x: 286, y: 338, size: 9.5, font: regular, color: MUTED });
  page.drawText(`${row.score}`, { x: 286, y: 296, size: 46, font: bold, color: INK });
  page.drawText('/ 100', { x: 338, y: 304, size: 12, font: regular, color: MUTED });
  page.drawText(`95% range ${row.ci_low}–${row.ci_high}`, {
    x: 286, y: 278, size: 9.5, font: regular, color: MUTED,
  });

  const sectionOrder: ItemType[] = ['reading', 'grammar', 'vocab', 'listening'];
  const sectionLabel: Record<string, string> = {
    reading: 'Reading', grammar: 'Grammar', vocab: 'Vocabulary', listening: 'Listening',
  };
  const sectionColor: Record<string, ReturnType<typeof rgb>> = {
    reading: MINT, grammar: AMBER, vocab: LAVENDER, listening: rgb(0.9, 0.95, 1),
  };
  let x = 70;
  for (const type of sectionOrder) {
    const section = row.section_scores?.[type];
    const value = section ? section.score : 0;
    page.drawRectangle({ x, y: 190, width: 150, height: 58, color: sectionColor[type] });
    page.drawText(sectionLabel[type], { x: x + 12, y: 228, size: 9, font: bold, color: MUTED });
    page.drawText(section ? String(value) : '—', { x: x + 12, y: 202, size: 24, font: bold, color: INK });
    if (section?.lowConfidence) {
      page.drawText('low confidence', { x: x + 62, y: 204, size: 6.5, font: regular, color: MUTED });
    }
    // Small bar.
    page.drawRectangle({ x: x + 12, y: 196, width: 126, height: 3, color: rgb(1, 1, 1) });
    page.drawRectangle({ x: x + 12, y: 196, width: 126 * (value / 100), height: 3, color: BLUE });
    x += 166;
  }

  const date = new Date(row.created_at);
  const dateText = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  page.drawText('Date issued', { x: 70, y: 145, size: 8, font: regular, color: MUTED });
  page.drawText(dateText, { x: 70, y: 131, size: 11, font: bold, color: INK });
  page.drawText('Certificate ID', { x: 70, y: 110, size: 8, font: regular, color: MUTED });
  page.drawText(row.cert_id, { x: 70, y: 96, size: 11, font: bold, color: BLUE });

  if (row.provisional) {
    page.drawText('Provisional result: fewer than 20 questions were answered.', {
      x: 70, y: 72, size: 7.5, font: italic, color: MUTED,
    });
  }

  // Seal.
  page.drawCircle({ x: 470, y: 130, size: 34, borderColor: BLUE, borderWidth: 1.5, color: rgb(1, 1, 1) });
  page.drawCircle({ x: 470, y: 130, size: 29, borderColor: BLUE_LIGHT, borderWidth: 0.7 });
  const seal1 = 'VENOXA';
  const seal2 = 'VERIFIED';
  page.drawText(seal1, {
    x: 470 - bold.widthOfTextAtSize(seal1, 8) / 2, y: 135, size: 8, font: bold, color: BLUE,
  });
  page.drawText(seal2, {
    x: 470 - bold.widthOfTextAtSize(seal2, 8) / 2, y: 123, size: 8, font: bold, color: BLUE,
  });

  // QR + verify link.
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 220,
    color: { dark: '#0E4AA4', light: '#FFFFFF' },
  });
  const qrImage = await pdf.embedPng(qrDataUrl);
  page.drawImage(qrImage, { x: 676, y: 66, width: 96, height: 96 });
  page.drawText('Scan to verify', { x: 676, y: 52, size: 7.5, font: regular, color: MUTED });

  const footer =
    'Aligned to the CEFR scale. Not an official qualification and not equivalent to IELTS, TOEFL or EF SET.';
  const footerLines = wrapLines(footer, regular, 8, 650);
  let footerY = 44;
  for (const line of footerLines) {
    center(line, footerY, 8, regular, MUTED);
    footerY -= 10;
  }

  return pdf.save();
}

/* ────────────────────────────────────────────────────────────────────────────
 * Router
 * ──────────────────────────────────────────────────────────────────────────── */

export function createLevelTestRouter(deps: LevelTestDeps): Router {
  const router = Router();
  const logger = deps.logger ?? ((message: string, error?: unknown) => console.error(`[level-test] ${message}`, error ?? ''));
  const cooldownDays = () => {
    const raw = Number(process.env.LEVEL_TEST_COOLDOWN_DAYS ?? deps.cooldownDays ?? 7);
    return Number.isFinite(raw) && raw >= 0 ? raw : 7;
  };
  const allowDraft = deps.allowDraft ?? process.env.LEVEL_TEST_ALLOW_DRAFT === '1';

  /* ── start ─────────────────────────────────────────────────────────────── */
  router.post(
    '/start',
    rateLimit(5, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const mode = req.body?.mode === 'quick' ? 'quick' : 'standard';
      const config = configFor(mode);
      const pool = deps.pool;

      // Resume an active session first.
      const activeResult = await pool.query<SessionRow>(
        `select * from lt_sessions
          where user_id = $1 and status = 'active'
          order by started_at desc limit 1`,
        [user.id],
      );
      const active = activeResult.rows[0];
      if (active) {
        if (new Date(active.deadline).getTime() <= Date.now()) {
          const client = await pool.connect();
          try {
            await client.query('begin');
            const locked = await client.query<SessionRow>(
              `select * from lt_sessions where id = $1 for update`,
              [active.id],
            );
            const result = await finalizeSession(client, locked.rows[0], true);
            await client.query('commit');
            if (!result) {
              res.json({ done: true, timedOut: true, sessionId: active.id, noResult: true });
              return;
            }
            res.json({
              done: true,
              timedOut: true,
              sessionId: active.id,
              result: publicResult(result, publicBase(req, deps)),
            });
            return;
          } catch (error) {
            await client.query('rollback');
            throw error;
          } finally {
            client.release();
          }
        }

        // Serve the pending item or select the next one.
        let item = active.current_item_id ? await loadItem(pool, active.current_item_id) : null;
        let order = item ? active.option_orders?.[item.id] : null;
        if (item && (!Array.isArray(order) || order.length !== 4)) {
          // Self-heal a session whose option order was lost: persist the new
          // order now so the answer endpoint maps the choice consistently.
          order = shuffledOrder();
          await pool.query(
            `update lt_sessions
                set option_orders = option_orders || jsonb_build_object($2, $3::jsonb)
              where id = $1`,
            [active.id, item.id, JSON.stringify(order)],
          );
          active.option_orders = { ...(active.option_orders ?? {}), [item.id]: order };
        }
        if (!item) {
          const all = await loadPool(pool, allowDraft);
          const used = new Set(active.answered_ids ?? []);
          const picked = selectNextItem({
            theta: Number(active.theta),
            items: all.map(toEngineItem),
            usedIds: used,
            counts: active.counts ?? {},
            answered: (active.answered_ids ?? []).length,
            activePassageId: active.active_passage_id,
            config,
          });
          if (!picked.item) {
            const client = await pool.connect();
            try {
              await client.query('begin');
              const locked = await client.query<SessionRow>(
                `select * from lt_sessions where id = $1 for update`,
                [active.id],
              );
              const result = await finalizeSession(client, locked.rows[0], false);
              await client.query('commit');
              res.json({
                done: true,
                sessionId: active.id,
                result: result ? publicResult(result, publicBase(req, deps)) : null,
              });
              return;
            } catch (error) {
              await client.query('rollback');
              throw error;
            } finally {
              client.release();
            }
          }
          item = await loadItem(pool, picked.item.id);
          if (!item) {
            res.status(503).json({ error: 'item_pool_unavailable' });
            return;
          }
          order = shuffledOrder();
          await pool.query(
            `update lt_sessions
                set current_item_id = $2, active_passage_id = $3,
                    option_orders = option_orders || jsonb_build_object($2, $4::jsonb)
              where id = $1`,
            [active.id, item.id, picked.passageId, JSON.stringify(order)],
          );
          await pool.query(`update lt_items set times_shown = times_shown + 1 where id = $1`, [item.id]);
          active.current_item_id = item.id;
          active.option_orders = { ...active.option_orders, [item.id]: order };
        }

        res.json({
          sessionId: active.id,
          resumed: true,
          mode: active.mode,
          item: await buildItemPayload(pool, item, order!, active),
          deadline: active.deadline,
        });
        return;
      }

      // Cooldown between completed attempts.
      const days = cooldownDays();
      if (days > 0) {
        const last = await pool.query<{ created_at: Date }>(
          `select created_at from lt_results where user_id = $1 order by created_at desc limit 1`,
          [user.id],
        );
        if (last.rows[0]) {
          const retryAt = new Date(last.rows[0].created_at).getTime() + days * 86_400_000;
          if (Date.now() < retryAt) {
            res.status(429).json({
              error: 'cooldown',
              retryAfter: new Date(retryAt).toISOString(),
              cooldownDays: days,
            });
            return;
          }
        }
      }

      const certName = sanitizeCertName(req.body?.name) ?? (await getProfileName(pool, user.id, user.email));
      const minutes = mode === 'quick'
        ? Number(process.env.LEVEL_TEST_QUICK_MINUTES ?? 15)
        : Number(process.env.LEVEL_TEST_MINUTES ?? 25);
      const deadline = new Date(Date.now() + Math.max(1, minutes) * 60_000);

      const all = await loadPool(pool, allowDraft);
      if (all.length === 0) {
        res.status(503).json({
          error: 'no_items',
          message: 'No active items. Run the seed SQL and activate reviewed items (or set LEVEL_TEST_ALLOW_DRAFT=1 locally).',
        });
        return;
      }

      const picked = selectNextItem({
        theta: 0,
        items: all.map(toEngineItem),
        usedIds: new Set(),
        counts: {},
        answered: 0,
        activePassageId: null,
        config,
      });
      if (!picked.item) {
        res.status(503).json({ error: 'no_items' });
        return;
      }
      const item = await loadItem(pool, picked.item.id);
      if (!item) {
        res.status(503).json({ error: 'no_items' });
        return;
      }
      const order = shuffledOrder();

      const created = await pool.query<SessionRow>(
        `insert into lt_sessions
           (user_id, mode, theta, se, answered_ids, counts, active_passage_id,
            option_orders, current_item_id, cert_name, deadline)
         values ($1,$2,0,1.5,'[]'::jsonb,'{}'::jsonb,$3,$4::jsonb,$5,$6,$7)
         returning *`,
        [
          user.id,
          mode,
          picked.passageId,
          JSON.stringify({ [item.id]: order }),
          item.id,
          certName,
          deadline,
        ],
      );
      const session = created.rows[0];
      await pool.query(`update lt_items set times_shown = times_shown + 1 where id = $1`, [item.id]);

      res.json({
        sessionId: session.id,
        resumed: false,
        mode,
        item: await buildItemPayload(pool, item, order, session),
        deadline: session.deadline,
      });
    }),
  );

  /* ── answer ────────────────────────────────────────────────────────────── */
  router.post(
    '/answer',
    rateLimit(180, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : '';
      const itemId = typeof req.body?.itemId === 'string' ? req.body.itemId : '';
      const rawChoice = req.body?.choiceIndex;
      const choiceIndex =
        typeof rawChoice === 'number' && Number.isInteger(rawChoice) && rawChoice >= 0 && rawChoice <= 3
          ? rawChoice
          : -1;
      const timeMs = clampInt(req.body?.timeMs, 0, 10 * 60_000, 0);
      if (!sessionId || !itemId || choiceIndex < 0) {
        res.status(400).json({ error: 'invalid_payload' });
        return;
      }

      const client = await deps.pool.connect();
      try {
        await client.query('begin');
        const sessionResult = await client.query<SessionRow>(
          `select * from lt_sessions where id = $1 and user_id = $2 for update`,
          [sessionId, user.id],
        );
        const session = sessionResult.rows[0];
        if (!session) {
          await client.query('rollback');
          res.status(404).json({ error: 'session_not_found' });
          return;
        }
        if (session.status !== 'active') {
          await client.query('rollback');
          res.status(409).json({ error: 'session_not_active' });
          return;
        }
        if (new Date(session.deadline).getTime() <= Date.now()) {
          const result = await finalizeSession(client, session, true);
          await client.query('commit');
          res.json({
            done: true,
            timedOut: true,
            sessionId,
            result: result ? publicResult(result, publicBase(req, deps)) : null,
          });
          return;
        }
        if (session.current_item_id !== itemId) {
          await client.query('rollback');
          res.status(409).json({ error: 'not_current_item' });
          return;
        }
        if ((session.answered_ids ?? []).includes(itemId)) {
          await client.query('rollback');
          res.status(409).json({ error: 'already_answered' });
          return;
        }

        const item = await loadItem(client, itemId);
        if (!item) {
          await client.query('rollback');
          res.status(404).json({ error: 'item_not_found' });
          return;
        }
        const order = session.option_orders?.[itemId];
        if (!Array.isArray(order) || order.length !== 4) {
          await client.query('rollback');
          res.status(409).json({ error: 'option_order_missing' });
          return;
        }
        const originalIndex = order[choiceIndex];
        if (!Number.isInteger(originalIndex) || originalIndex < 0 || originalIndex > 3) {
          await client.query('rollback');
          res.status(400).json({ error: 'invalid_choice' });
          return;
        }
        const correct = originalIndex === item.correct_index;

        await client.query(
          `insert into lt_responses (session_id, item_id, choice_index, correct, time_ms)
           values ($1,$2,$3,$4,$5)`,
          [sessionId, itemId, originalIndex, correct, timeMs],
        );
        if (correct) {
          await client.query(`update lt_items set times_correct = times_correct + 1 where id = $1`, [itemId]);
        }

        const responses = await loadResponses(client, sessionId);
        const config = configFor(session.mode);
        const estimate = updateAbility(Number(session.theta), responses, config);
        const answeredIds = [...(session.answered_ids ?? []), itemId];
        const counts = { ...(session.counts ?? {}) };
        counts[item.type] = (counts[item.type] ?? 0) + 1;

        let activePassageId = session.active_passage_id;
        if (item.type === 'reading' && item.passage_id) {
          const remaining = await client.query<{ exists: boolean }>(
            `select exists(
               select 1 from lt_items
                where passage_id = $1 and not (id = any($2::text[]))
             ) as exists`,
            [item.passage_id, answeredIds],
          );
          if (!remaining.rows[0]?.exists) activePassageId = null;
        }

        const all = await loadPool(client, allowDraft);
        const used = new Set(answeredIds);
        const remainingItems = all.filter((candidate) => !used.has(candidate.id)).length;
        const stop = stopReason({
          answered: answeredIds.length,
          se: estimate.se,
          remainingItems,
          config,
        });

        const updatedSession: SessionRow = {
          ...session,
          theta: estimate.theta,
          se: estimate.se,
          answered_ids: answeredIds,
          counts,
          active_passage_id: activePassageId,
        };

        if (stop) {
          await client.query(
            `update lt_sessions
                set theta = $2, se = $3, answered_ids = $4::jsonb, counts = $5::jsonb,
                    active_passage_id = $6, current_item_id = null, last_answer_at = now()
              where id = $1`,
            [
              sessionId,
              estimate.theta,
              estimate.se,
              JSON.stringify(answeredIds),
              JSON.stringify(counts),
              activePassageId,
            ],
          );
          const result = await finalizeSession(client, updatedSession, stop === 'timeout');
          await client.query('commit');
          res.json({
            done: true,
            timedOut: stop === 'timeout',
            sessionId,
            result: result ? publicResult(result, publicBase(req, deps)) : null,
          });
          return;
        }

        const picked = selectNextItem({
          theta: estimate.theta,
          items: all.map(toEngineItem),
          usedIds: used,
          counts,
          answered: answeredIds.length,
          activePassageId,
          config,
        });
        if (!picked.item) {
          await client.query(
            `update lt_sessions
                set theta = $2, se = $3, answered_ids = $4::jsonb, counts = $5::jsonb,
                    active_passage_id = $6, current_item_id = null, last_answer_at = now()
              where id = $1`,
            [
              sessionId,
              estimate.theta,
              estimate.se,
              JSON.stringify(answeredIds),
              JSON.stringify(counts),
              activePassageId,
            ],
          );
          const result = await finalizeSession(client, updatedSession, false);
          await client.query('commit');
          res.json({
            done: true,
            sessionId,
            result: result ? publicResult(result, publicBase(req, deps)) : null,
          });
          return;
        }

        const nextItem = await loadItem(client, picked.item.id);
        if (!nextItem) {
          await client.query('rollback');
          res.status(503).json({ error: 'item_pool_unavailable' });
          return;
        }
        const nextOrder = shuffledOrder();
        const optionOrders = { ...(session.option_orders ?? {}), [nextItem.id]: nextOrder };
        const nextSession: SessionRow = {
          ...updatedSession,
          current_item_id: nextItem.id,
          active_passage_id: picked.passageId,
          option_orders: optionOrders,
        };
        await client.query(
          `update lt_sessions
              set theta = $2, se = $3, answered_ids = $4::jsonb, counts = $5::jsonb,
                  active_passage_id = $6, current_item_id = $7, option_orders = $8::jsonb,
                  last_answer_at = now()
            where id = $1`,
          [
            sessionId,
            estimate.theta,
            estimate.se,
            JSON.stringify(answeredIds),
            JSON.stringify(counts),
            picked.passageId,
            nextItem.id,
            JSON.stringify(optionOrders),
          ],
        );
        await client.query(`update lt_items set times_shown = times_shown + 1 where id = $1`, [nextItem.id]);
        await client.query('commit');

        res.json({
          done: false,
          sessionId,
          item: await buildItemPayload(deps.pool, nextItem, nextOrder, nextSession),
          deadline: session.deadline,
        });
      } catch (error) {
        try {
          await client.query('rollback');
        } catch {
          /* ignore */
        }
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  /* ── timeout ───────────────────────────────────────────────────────────── */
  // Called by the client when its countdown reaches zero. The server remains
  // authoritative: if the deadline has not passed it returns 409 and the client
  // keeps going with the server's deadline.
  router.post(
    '/expire',
    rateLimit(30, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : '';
      if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
        res.status(400).json({ error: 'invalid_session' });
        return;
      }
      const client = await deps.pool.connect();
      try {
        await client.query('begin');
        const sessionResult = await client.query<SessionRow>(
          `select * from lt_sessions where id = $1 and user_id = $2 for update`,
          [sessionId, user.id],
        );
        const session = sessionResult.rows[0];
        if (!session) {
          await client.query('rollback');
          res.status(404).json({ error: 'session_not_found' });
          return;
        }
        if (session.status !== 'active') {
          const existing = await client.query<ResultRow>(
            `select * from lt_results where session_id = $1`,
            [sessionId],
          );
          await client.query('commit');
          res.json({
            done: true,
            timedOut: true,
            sessionId,
            result: existing.rows[0] ? publicResult(existing.rows[0], publicBase(req, deps)) : null,
          });
          return;
        }
        if (new Date(session.deadline).getTime() > Date.now()) {
          await client.query('rollback');
          res.status(409).json({ error: 'not_expired', deadline: session.deadline });
          return;
        }
        const result = await finalizeSession(client, session, true);
        await client.query('commit');
        res.json({
          done: true,
          timedOut: true,
          sessionId,
          result: result ? publicResult(result, publicBase(req, deps)) : null,
        });
      } catch (error) {
        try {
          await client.query('rollback');
        } catch {
          /* ignore */
        }
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  /* ── result ────────────────────────────────────────────────────────────── */
  router.get(
    '/result/:sessionId',
    rateLimit(30, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const sessionId = String(req.params.sessionId ?? '');
      if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
        res.status(400).json({ error: 'invalid_session' });
        return;
      }
      const result = await deps.pool.query<ResultRow>(
        `select * from lt_results where session_id = $1 and user_id = $2`,
        [sessionId, user.id],
      );
      if (result.rows[0]) {
        res.json(publicResult(result.rows[0], publicBase(req, deps)));
        return;
      }
      const session = await loadSession(deps.pool, sessionId, user.id);
      if (!session) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      if (session.status === 'active') {
        res.status(409).json({ error: 'not_finished', deadline: session.deadline });
        return;
      }
      res.status(404).json({ error: 'no_result' });
    }),
  );

  /* ── certificate ───────────────────────────────────────────────────────── */
  router.get(
    '/certificate/:certId',
    rateLimit(20, 60_000),
    requireUser(),
    asyncHandler(async (req, res) => {
      const user = res.locals.user as AuthUser;
      const certId = String(req.params.certId ?? '').toUpperCase();
      if (!CERT_ID_RE.test(certId)) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      const result = await deps.pool.query<ResultRow>(`select * from lt_results where cert_id = $1`, [certId]);
      const row = result.rows[0];
      if (!row || row.user_id !== user.id) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      const base = publicBase(req, deps);
      const pdf = await renderCertificate(row, `${base}/#/verify/${row.cert_id}`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="venoxa-level-test-${row.cert_id}.pdf"`);
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.send(Buffer.from(pdf));
    }),
  );

  /* ── public verify ─────────────────────────────────────────────────────── */
  router.get(
    '/verify/:certId',
    rateLimit(30, 60_000),
    asyncHandler(async (req, res) => {
      const certId = String(req.params.certId ?? '').toUpperCase();
      if (!CERT_ID_RE.test(certId)) {
        res.status(404).json({ valid: false });
        return;
      }
      const result = await deps.pool.query<ResultRow>(
        `select name, level, score, created_at from lt_results where cert_id = $1`,
        [certId],
      );
      const row = result.rows[0];
      if (!row) {
        res.status(404).json({ valid: false });
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json({
        valid: true,
        name: row.name,
        level: row.level,
        score: row.score,
        date: row.created_at,
      });
    }),
  );

  /* ── audio ─────────────────────────────────────────────────────────────── */
  router.get(
    '/audio/:itemId',
    rateLimit(120, 60_000),
    asyncHandler(async (req, res) => {
      const itemId = String(req.params.itemId ?? '');
      const exp = Number(req.query.exp ?? 0);
      const sig = typeof req.query.sig === 'string' ? req.query.sig : '';
      const secret = audioSecret();
      if (!secret || !itemId || !Number.isFinite(exp) || exp * 1000 < Date.now() || !sig) {
        res.status(403).json({ error: 'expired_or_invalid' });
        return;
      }
      const expected = audioSignature(itemId, exp, secret);
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(403).json({ error: 'expired_or_invalid' });
        return;
      }
      const result = await deps.pool.query<{ content_type: string; bytes: Buffer }>(
        `select content_type, bytes from lt_audio where item_id = $1`,
        [itemId],
      );
      const row = result.rows[0];
      if (!row) {
        res.status(404).json({ error: 'audio_not_cached' });
        return;
      }
      res.setHeader('Content-Type', row.content_type || 'audio/mpeg');
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.send(row.bytes);
    }),
  );

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger('unhandled error', error);
    const msg = error instanceof Error ? error.message : String(error);
    let message = 'An unexpected error occurred. Please try again.';
    if (msg.includes('lt_sessions') || msg.includes('lt_items') || msg.includes('does not exist')) {
      message = 'Level test database tables not found. Please run migrations/level-test.sql and migrations/level-test-seed.sql in your Supabase SQL Editor.';
    } else if (msg.includes('connection') || msg.includes('connect')) {
      message = 'Database connection failed. Please verify your DATABASE_URL.';
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal_error', message, details: msg });
    }
  });

  return router;
}
