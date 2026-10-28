// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// level-test-api.ts — Venoxa Level Test backend (server-side adaptive test).
//
// Mounted by BOTH production surfaces:
//   • api/index.ts        (Vercel serverless — what production actually runs)
//   • api-server routes   (dev Express mirror)
//
// HARD RULES enforced here:
//   • item difficulty, correct answers and engine internals NEVER reach the
//     browser (only: id, type, stem, passage text, shuffled options, audio URL)
//   • one pending item per session; UNIQUE (session,item) / (session,seq) make
//     replays and reordering impossible
//   • the overall time limit is enforced server-side (deadline in the DB)
//   • listening audio is served ONCE per session through a short-lived HMAC
//     URL (auth headers are impossible inside <audio>)
//   • rate limits on every endpoint
//   • option order is shuffled per session; the mapping stays server-side
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { segmentName } from "./fonts/arabic-shaper";
import {
  newEngineState, applyAnswer, pickNextItem, shouldStop, buildReport,
  CEFR_NAMES, MAX_ITEMS, type EngineItem, type EngineState, type CefrLevel,
} from "./level-test-engine";

// ── config knobs (env, never hardcoded secrets) ──────────────────────────────
function envNum(name: string, dflt: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : dflt;
}
const COOLDOWN_DAYS = envNum("LT_COOLDOWN_DAYS", 7);
const TIME_FULL_MIN = envNum("LT_TIME_LIMIT_FULL_MIN", 30);
const TIME_QUICK_MIN = envNum("LT_TIME_LIMIT_QUICK_MIN", 16);
const AUDIO_TTL_SEC = envNum("LT_AUDIO_TTL_SEC", 60);
const APP_URL = (process.env.PUBLIC_APP_URL || "https://venoxai.vercel.app").replace(/\/+$/, "");
// HMAC key for audio links — separate from the JWT secret, all from env
const AUDIO_SECRET = crypto.createHash("sha256")
  .update((process.env.LT_AUDIO_SECRET || process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "venoxa-lt-audio-dev-fallback").trim())
  .digest();

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;      // session ids, item ids, cert ids
const safeId = (v: unknown): string | null => (typeof v === "string" && ID_RE.test(v) ? v : null);

// ── Supabase JWT verification ────────────────────────────────────────────────
const jwksCache = new Map<string, { jwks: any; at: number }>();
function b64urlJson(part: string): any | null {
  try { return JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); } catch { return null; }
}
async function verifySupabaseUser(authHeader: string | undefined): Promise<{ uid: string; email: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (token.split(".").length !== 3) return null;
  const header = b64urlJson(token.split(".")[0]);
  const payload = b64urlJson(token.split(".")[1]);
  if (!header?.alg || !payload?.sub) return null;
  try {
    if (String(header.alg).startsWith("HS")) {
      const secret = (process.env.SUPABASE_JWT_SECRET || "").trim();
      if (!secret) return null;
      const { payload: p } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256", "HS384", "HS512"] });
      return { uid: String(p.sub), email: String(p.email ?? "") };
    }
    const iss = String(payload.iss || process.env.SUPABASE_URL || "");
    if (!iss) return null;
    let entry = jwksCache.get(iss);
    if (!entry || Date.now() - entry.at > 60 * 60 * 1000) {
      entry = { jwks: createRemoteJWKSet(new URL(`${iss.replace(/\/+$/, "")}/.well-known/jwks.json`)), at: Date.now() };
      jwksCache.set(iss, entry);
    }
    const { payload: p } = await jwtVerify(token, entry.jwks, { algorithms: ["RS256", "ES256", "PS256", "EdDSA"] });
    return { uid: String(p.sub), email: String(p.email ?? "") };
  } catch {
    return null;
  }
}

// ── tiny rate limiter (fixed window, per process) ────────────────────────────
const rlBuckets = new Map<string, { n: number; reset: number }>();
function rateLimit(key: string, limit: number, winMs: number): boolean {
  const now = Date.now();
  const b = rlBuckets.get(key);
  if (!b || now > b.reset) { rlBuckets.set(key, { n: 1, reset: now + winMs }); return true; }
  if (b.n >= limit) return false;
  b.n++;
  rlBuckets.set(key, b);
  return true;
}
const ipOf = (req: any): string => String((req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "?")).split(",")[0].trim();

// ── small helpers ────────────────────────────────────────────────────────────
const j = (res: any, code: number, body: any) => { res.status(code).json(body); return res; };

const CERT_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I,L,O,0,1 — unambiguous
function newCertId(): string {
  const pick = () => Array.from(crypto.randomBytes(4)).reduce((s, b) => s + CERT_ALPHABET[b % CERT_ALPHABET.length], "");
  return `VX-${new Date().getFullYear()}-${pick()}-${pick()}`;
}

function shuffledPermutation(): number[] {
  const out = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const k = crypto.randomInt(i + 1);
    [out[i], out[k]] = [out[k], out[i]];
  }
  return out;
}

function buildAudioUrl(sessionId: string, itemId: string): string {
  const exp = (Date.now() + AUDIO_TTL_SEC * 1000).toString(36);
  const sig = crypto.createHmac("sha256", AUDIO_SECRET).update(`${sessionId}|${itemId}|${exp}`).digest("base64url");
  return `/api/level-test/audio/${sessionId}/${itemId}?x=${exp}&t=${sig}`;
}

/** Everything the browser may ever see about an item. */
function serveItem(item: any, perm: number[], sessionId: string | null) {
  const out: any = {
    id: item.id,
    type: item.type,
    stem: item.stem,
    options: perm && perm.length === 4 ? perm.map((i: number) => item.options[i]) : item.options,
  };
  if (item.passage_text) out.passageText = item.passage_text;
  if (item.type === "listening" && sessionId) out.audioUrl = buildAudioUrl(sessionId, item.id);
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
export function registerLevelTestRoutes(app: any, opts: { pool: () => any }) {
  const pool = opts.pool;

  // bank cache (short-lived; serverless cold starts re-fetch naturally)
  let bankCache: { items: EngineItem[]; at: number } | null = null;
  async function loadBank(): Promise<EngineItem[]> {
    if (bankCache && Date.now() - bankCache.at < 30_000) return bankCache.items;
    const statuses = process.env.LT_ALLOW_DRAFT === "1" ? ["active", "draft"] : ["active"];
    const { rows } = await pool().query(
      `SELECT id, type, cefr_tag, difficulty_b FROM lt_items WHERE status = ANY($1)`, [statuses]);
    const items = rows.map((r: any) => ({ id: r.id, type: r.type, cefr_tag: r.cefr_tag, difficulty_b: Number(r.difficulty_b) }));
    bankCache = { items, at: Date.now() };
    return items;
  }

  function fromServerState(raw: any, quick: boolean): any {
    const st: any = newEngineState(quick);
    if (raw && typeof raw === "object") {
      st.answeredIds = Array.isArray(raw.answeredIds) ? raw.answeredIds : [];
      st.responses = raw.responses && typeof raw.responses === "object" ? raw.responses : {};
      st.theta = typeof raw.theta === "number" ? raw.theta : 0;
      st.se = typeof raw.se === "number" ? raw.se : 1.5;
      st.counts = raw.counts || { grammar: 0, vocab: 0, reading: 0, listening: 0 };
      st.quickMode = quick;
      st.currentPendingId = typeof raw.currentPendingId === "string" ? raw.currentPendingId : null;
      st.opts = raw.opts || {};
      st.plays = raw.plays || {};
    }
    return st;
  }

  const saveServerState = (sessionId: string, st: any) =>
    pool().query(`UPDATE lt_sessions SET server_state = $2 WHERE id = $1`, [sessionId, JSON.stringify(st)]);

  async function itemRow(id: string) {
    const { rows } = await pool().query(`SELECT id, type, stem, options, passage_text FROM lt_items WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }

  // Guarantees the session has a pending item; picks one from the bank if not.
  async function ensurePendingItem(sessionId: string, st: any, bank: EngineItem[]): Promise<{ row: any; perm: number[] } | null> {
    let perm: number[] | null = st.currentPendingId ? st.opts?.[st.currentPendingId] ?? null : null;
    if (st.currentPendingId && perm) {
      const row = await itemRow(st.currentPendingId);
      if (row) return { row, perm };
    }
    const picked = pickNextItem(bank, st, { topN: 5 });
    if (!picked) return null;
    const permNew = shuffledPermutation();
    st.currentPendingId = picked.id;
    st.opts = { ...st.opts, [picked.id]: permNew };
    await saveServerState(sessionId, st);
    const row = await itemRow(picked.id);
    return row ? { row, perm: permNew } : null;
  }

  function sessionResponse(sessionId: string, mode: string, deadline: string, st: any, pending: { row: any; perm: number[] } | null) {
    return {
      sessionId, mode, deadline,
      remainingSeconds: Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 1000)),
      answered: st.answeredIds.length,
      item: pending ? serveItem(pending.row, pending.perm, sessionId) : null,
    };
  }

  function resultPublic(r: any) {
    return { certId: r.cert_id, level: r.level, score: r.score, ciLow: r.ci_low, ciHigh: r.ci_high, mode: r.mode, date: r.created_at };
  }

  async function userName(uid: string): Promise<string> {
    try {
      const { rows } = await pool().query(
        `SELECT coalesce(nullif(data->>'username',''), split_part(email,'@',1)) AS n FROM public.users WHERE id = $1`, [uid]);
      return (rows[0]?.n || "New Learner").toString().slice(0, 60);
    } catch { return "New Learner"; }
  }

  /** Build the final report, persist it as a certificate and flip the session. */
  async function finalize(sessionRow: any, st: any, bank: EngineItem[]): Promise<any> {
    const rep = buildReport(bank, st);
    const name = await userName(sessionRow.user_id);
    // race-safe insert with retry (cert_id collisions are astronomically rare)
    const payload = [
      sessionRow.id, sessionRow.user_id, name, rep.cefr, rep.score,
      rep.ciLow, rep.ciHigh, rep.theta, rep.se,
      JSON.stringify(rep.sections.map((sc: any) => ({ type: sc.type, answered: sc.answered, correct: sc.correct, score: sc.score, lowConfidence: sc.lowConfidence }))),
      sessionRow.mode ?? "full",
    ];
    let certId: string | null = null;
    for (let i = 0; i < 5 && certId === null; i++) {
      try {
        const id = newCertId();
        await pool().query(
          `INSERT INTO lt_results (session_id, user_id, cert_id, name, level, score, ci_low, ci_high, theta, se, section_scores, mode)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (session_id) DO NOTHING`,
          [payload[0], payload[1], id, payload[2], payload[3], payload[4], payload[5], payload[6], payload[7], payload[8], payload[9], payload[10]]);
        certId = id;
      } catch (e) {
        if (e?.code === "23505") continue; // cert_id collision — new id
        throw e;
      }
    }
    await pool().query(
      `UPDATE lt_sessions SET status = 'completed', theta = $2, se = $3, completed_at = now() WHERE id = $1 AND status = 'active'`,
      [sessionRow.id, rep.theta, rep.se]);

    return {
      result: {
        certId,
        name,
        level: rep.cefr, levelName: CEFR_NAMES[rep.cefr],
        score: rep.score, ciLow: rep.ciLow, ciHigh: rep.ciHigh,
        sections: rep.sections.map((sc: any) => ({ type: sc.type, score: sc.score, answered: sc.answered, lowConfidence: sc.lowConfidence })),
        answered: rep.answered,
        mode: sessionRow.mode ?? "full",
      },
      date: new Date().toISOString(),
    };
  }

  // Sessions that expired but were never finalized (user closed the tab) —
  // only mint a result if they actually answered something meaningful.
  async function finalizeExpiredSessions(uid: string): Promise<void> {
    const { rows } = await pool().query(
      `SELECT id, user_id, mode, server_state, started_at, deadline FROM lt_sessions
        WHERE user_id = $1 AND status = 'active' AND deadline <= now()`, [uid]);
    for (const s of rows) {
      try {
        const st = fromServerState(s.server_state, s.mode === "quick");
        if (st.answeredIds.length >= 6) {
          await finalize(s, st, await loadBank());
        } else {
          await pool().query(`UPDATE lt_sessions SET status = 'abandoned', completed_at = now() WHERE id = $1`, [s.id]);
        }
      } catch (e) {
        console.error("lt/expiry finalize failed:", e?.message || e);
      }
    }
  }

  // ── POST /api/level-test/start ──────────────────────────────────────────────
  app.post("/api/level-test/start", async (req: any, res: any) => {
    const u = await verifySupabaseUser(req.headers.authorization);
    if (!u) return j(res, 401, { error: "unauthorized" });
    if (!rateLimit(`lt-start:${u.uid}`, 6, 10 * 60_000)) return j(res, 429, { error: "slow down" });
    if (!pool()) return j(res, 503, { error: "database not configured" });

    try {
      await finalizeExpiredSessions(u.uid);

      // resume the newest active session instead of creating a new one
      const { rows: act } = await pool().query(
        `SELECT id, mode, server_state, started_at, deadline FROM lt_sessions
          WHERE user_id = $1 AND status = 'active' AND deadline > now()
          ORDER BY started_at DESC LIMIT 1`, [u.uid]);
      const bank = await loadBank();
      if (act[0]) {
        const st = fromServerState(act[0].server_state, act[0].mode === "quick");
        const pending = await ensurePendingItem(act[0].id, st, bank);
        if (!pending) return j(res, 503, { error: "item bank not ready" });
        return j(res, 200, sessionResponse(act[0].id, act[0].mode, act[0].deadline, st, pending));
      }

      // cooldown between completed attempts (spec)
      const { rows: last } = await pool().query(
        `SELECT created_at FROM lt_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [u.uid]);
      if (last[0]) {
        const days = COOLDOWN_DAYS - (Date.now() - new Date(last[0].created_at).getTime()) / 86400_000;
        if (days > 0) return j(res, 429, {
          error: "cooldown",
          retryAfterDays: Math.ceil(days),
          message: `You can retake the test in ${Math.ceil(days)} day(s).`,
        });
      }

      if (!bank || bank.length < MAX_ITEMS) return j(res, 503, { error: "item bank not ready", bankSize: bank?.length ?? 0 });

      const mode = req.body?.mode === "quick" ? "quick" : "full";
      const limitMin = mode === "quick" ? TIME_QUICK_MIN : TIME_FULL_MIN;
      const st = fromServerState(null, mode === "quick");
      const deadline = new Date(Date.now() + limitMin * 60_000);
      const { rows: sr } = await pool().query(
        `INSERT INTO lt_sessions (user_id, mode, server_state, deadline) VALUES ($1,$2,$3,$4) RETURNING id, deadline, mode`,
        [u.uid, mode, JSON.stringify(st), deadline]);
      const s = sr[0];
      const pending = await ensurePendingItem(s.id, st, bank);
      if (!pending) return j(res, 503, { error: "item bank not ready" });
      return j(res, 200, sessionResponse(s.id, s.mode, s.deadline, st, pending));
    } catch (e) {
      console.error("lt/start failed:", e?.message || e);
      return j(res, 500, { error: "start failed" });
    }
  });

  // ── GET /api/level-test/state (resume after refresh) ────────────────────────
  app.get("/api/level-test/state", async (req: any, res: any) => {
    const u = await verifySupabaseUser(req.headers.authorization);
    if (!u) return j(res, 401, { error: "unauthorized" });
    if (!rateLimit(`lt-state:${u.uid}`, 30, 60_000)) return j(res, 429, { error: "slow down" });
    if (!pool()) return j(res, 503, { error: "database not configured" });
    try {
      await finalizeExpiredSessions(u.uid);
      const { rows: act } = await pool().query(
        `SELECT id, mode, server_state, started_at, deadline FROM lt_sessions
          WHERE user_id = $1 AND status = 'active' AND deadline > now()
          ORDER BY started_at DESC LIMIT 1`, [u.uid]);
      const bank = await loadBank();
      if (act[0]) {
        const st = fromServerState(act[0].server_state, act[0].mode === "quick");
        const pending = await ensurePendingItem(act[0].id, st, bank);
        if (!pending) return j(res, 503, { error: "item bank not ready" });
        return j(res, 200, sessionResponse(act[0].id, act[0].mode, act[0].deadline, st, pending));
      }
      const { rows: r0 } = await pool().query(
        `SELECT cert_id, level, score, ci_low, ci_high, mode, created_at FROM lt_results
          WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [u.uid]);
      let cooldownDays: number | null = null;
      if (r0[0]) {
        const days = COOLDOWN_DAYS - (Date.now() - new Date(r0[0].created_at).getTime()) / 86400_000;
        if (days > 0) cooldownDays = Math.ceil(days);
      }
      return j(res, 200, { active: false, lastResult: r0[0] ? resultPublic(r0[0]) : null, cooldownDays });
    } catch (e) {
      console.error("lt/state failed:", e?.message || e);
      return j(res, 500, { error: "state failed" });
    }
  });

  // ── POST /api/level-test/answer ──────────────────────────────────────────────
  app.post("/api/level-test/answer", async (req: any, res: any) => {
    const u = await verifySupabaseUser(req.headers.authorization);
    if (!u) return j(res, 401, { error: "unauthorized" });
    if (!rateLimit(`lt-answer:${u.uid}`, 90, 60_000)) return j(res, 429, { error: "slow down" });
    if (!pool()) return j(res, 503, { error: "database not configured" });

    try {
      const sessionId = safeId(req.body?.sessionId);
      const itemId = safeId(req.body?.itemId);
      const choice = req.body?.choice;
      const timeMs = Math.min(600_000, Math.max(0, Number(req.body?.timeMs) || 0));
      if (!sessionId || !itemId || ![0, 1, 2, 3].includes(choice)) return j(res, 400, { error: "bad body" });

      const { rows: sr } = await pool().query(`SELECT * FROM lt_sessions WHERE id = $1`, [sessionId]);
      const s = sr[0];
      if (!s || s.user_id !== u.uid) return j(res, 404, { error: "session not found" });
      if (s.status !== "active") return j(res, 409, { error: `session ${s.status}` });

      const st = fromServerState(s.server_state, s.mode === "quick");
      const timeout = Date.now() > new Date(s.deadline).getTime();
      if (timeout) {
        // the deadline closes the test with the answers we already have
        await finalize(s, st, await loadBank());
        const { rows: r0 } = await pool().query(`SELECT * FROM lt_results WHERE session_id = $1`, [s.id]);
        return j(res, 200, { done: true, timedOut: true, ...(r0[0] ? { result: resultPublic(r0[0]) } : {}) });
      }

      if (st.currentPendingId !== itemId) {
        // not the pending item → replay/back-skip attempt (or duplicate retry)
        return j(res, 409, { error: "not the pending item" });
      }

      // canonical choice via the per-session permutation
      const perm: number[] = st.opts?.[itemId] ?? [0, 1, 2, 3];
      const canonical = perm[choice] ?? choice;
      const { rows: ir } = await pool().query(`SELECT id, correct_index FROM lt_items WHERE id = $1`, [itemId]);
      if (!ir[0]) return j(res, 404, { error: "item not found" });
      const correct = canonical === ir[0].correct_index;

      const bank = await loadBank();
      const resState = applyAnswer(bank, st, itemId, correct).state;
      const seq = st.answeredIds.length + 1;
      await pool().query(
        `INSERT INTO lt_responses (session_id, item_id, seq, choice, correct, time_ms) VALUES ($1,$2,$3,$4,$5,$6)`,
        [sessionId, itemId, seq, choice, correct, timeMs]);
      // a shown item is one that got a response; resume-served repeats aren't counted
      await pool().query(`UPDATE lt_items SET times_shown = times_shown + 1, times_correct = times_correct + $2 WHERE id = $1`, [itemId, correct ? 1 : 0]);

      if (shouldStop(resState, bank.length > 0).stop) {
        await finalize(s, resState, bank);
        const { rows: r0 } = await pool().query(`SELECT * FROM lt_results WHERE session_id = $1`, [s.id]);
        return j(res, 200, { done: true, ...(r0[0] ? { result: resultPublic(r0[0]) } : {}) });
      }

      const pending = await ensurePendingItem(sessionId, resState, bank);
      if (!pending) {
        await finalize(s, resState, bank);
        const { rows: r0 } = await pool().query(`SELECT * FROM lt_results WHERE session_id = $1`, [s.id]);
        return j(res, 200, { done: true, ...(r0[0] ? { result: resultPublic(r0[0]) } : {}) });
      }
      return j(res, 200, {
        done: false,
        item: serveItem(pending.row, pending.perm, sessionId),
        answered: resState.answeredIds.length,
        remainingSeconds: Math.max(0, Math.round((new Date(s.deadline).getTime() - Date.now()) / 1000)),
      });
    } catch (e) {
      if (e?.code === "23505") return j(res, 409, { error: "replay rejected" });
      console.error("lt/answer failed:", e?.message || e);
      return j(res, 500, { error: "answer failed" });
    }
  });

  // ── GET /api/level-test/result/:sessionId ───────────────────────────────────
  app.get("/api/level-test/result/:sessionId", async (req: any, res: any) => {
    const u = await verifySupabaseUser(req.headers.authorization);
    if (!u) return j(res, 401, { error: "unauthorized" });
    if (!rateLimit(`lt-result:${u.uid}`, 60, 60_000)) return j(res, 429, { error: "slow down" });
    if (!pool()) return j(res, 503, { error: "database not configured" });
    try {
      const { rows } = await pool().query(
        `SELECT r.* FROM lt_results r JOIN lt_sessions s ON s.id = r.session_id
          WHERE r.session_id = $1 AND s.user_id = $2`, [req.params.sessionId, u.uid]);
      if (!rows[0]) return j(res, 404, { error: "not finalized yet" });
      const r = rows[0];
      return j(res, 200, {
        ...resultPublic(r),
        name: r.name,
        theta: r.theta, se: r.se,
        sections: (r.section_scores || []).map((sc: any) => ({ type: sc.type, score: sc.score, answered: sc.answered, lowConfidence: sc.lowConfidence })),
      });
    } catch (e) {
      console.error("lt/result failed:", e?.message || e);
      return j(res, 500, { error: "result failed" });
    }
  });

  // ── GET /api/level-test/verify/:certId (PUBLIC) ─────────────────────────────
  app.get("/api/level-test/verify/:certId", async (req: any, res: any) => {
    if (!rateLimit(`lt-verify:${ipOf(req)}`, 20, 60_000)) return j(res, 429, { error: "slow down" });
    if (!pool()) return j(res, 503, { error: "database not configured" });
    try {
      const cid = safeId(req.params.certId);
      if (!cid) return j(res, 400, { valid: false, error: "bad id format" });
      const { rows } = await pool().query(`SELECT name, level, score, created_at FROM lt_results WHERE cert_id = $1`, [cid]);
      if (!rows[0]) return j(res, 404, { valid: false, error: "unknown certificate" });
      const r = rows[0];
      // spec: only name, level, score, date and valid
      return j(res, 200, { valid: true, name: r.name, level: r.level, score: r.score, date: r.created_at });
    } catch (e) {
      return j(res, 500, { error: "verify failed" });
    }
  });

  // ── GET /api/level-test/certificate/:certId (PUBLIC, PDF) ───────────────────
  app.get("/api/level-test/certificate/:certId", async (req: any, res: any) => {
    if (!rateLimit(`lt-cert:${ipOf(req)}`, 12, 60_000)) return j(res, 429, { error: "slow down" });
    if (!pool()) return j(res, 503, { error: "database not configured" });
    try {
      const cid = safeId(req.params.certId);
      if (!cid) return j(res, 400, { error: "bad id format" });
      const { rows } = await pool().query(
        `SELECT cert_id, name, level, score, ci_low, ci_high, section_scores, mode, created_at
          FROM lt_results WHERE cert_id = $1`, [cid]);
      if (!rows[0]) return j(res, 404, { error: "unknown certificate" });
      const bytes = await buildCertificate(rows[0]);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="venoxa-certificate-${cid}.pdf"`);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.status(200).send(Buffer.from(bytes));
    } catch (e) {
      console.error("lt/certificate failed:", e?.stack || e);
      return j(res, 500, { error: "certificate failed" });
    }
  });

  // ── GET /api/level-test/audio/:sessionId/:itemId (HMAC, plays once) ─────────
  app.get("/api/level-test/audio/:sessionId/:itemId", async (req: any, res: any) => {
    if (!rateLimit(`lt-audio:${ipOf(req)}`, 60, 60_000)) return j(res, 429, { error: "slow down" });
    if (!pool()) return j(res, 503, { error: "database not configured" });
    try {
      const sessionId = safeId(req.params.sessionId);
      const itemId = safeId(req.params.itemId);
      if (!sessionId || !itemId) return j(res, 400, { error: "bad params" });
      const exp = String(req.query.x || "");
      const sig = String(req.query.t || "");
      if (!/^[0-9a-z]{6,24}$/.test(exp) || !sig || sig.length > 120) return j(res, 403, { error: "bad token" });
      if (parseInt(exp, 36) < Date.now()) return j(res, 403, { error: "audio link expired" });
      const expect = crypto.createHmac("sha256", AUDIO_SECRET).update(`${sessionId}|${itemId}|${exp}`).digest("base64url");
      const a = Buffer.from(sig), b = Buffer.from(expect);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return j(res, 403, { error: "bad signature" });

      const { rows: sr } = await pool().query(`SELECT status, server_state, mode FROM lt_sessions WHERE id = $1`, [sessionId]);
      const s = sr[0];
      if (!s || s.status !== "active") return j(res, 404, { error: "session inactive" });
      const plays = fromServerState(s.server_state, s.mode === "quick").plays || {};
      if ((plays[itemId] || 0) >= 1) return j(res, 410, { error: "audio already played" });
      const { rows: ir } = await pool().query(`SELECT audio_mp3 FROM lt_items WHERE id = $1 AND audio_mp3 IS NOT NULL`, [itemId]);
      if (!ir[0]) return j(res, 404, { error: "audio missing" });

      await pool().query(
        `UPDATE lt_sessions SET server_state = jsonb_set(server_state, ARRAY['plays','${itemId}']::text[], '1'::jsonb, true) WHERE id = $1`,
        [sessionId]);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "no-store");
      res.status(200).send(Buffer.from(ir[0].audio_mp3));
    } catch (e) {
      console.error("lt/audio failed:", e?.message || e);
      return j(res, 500, { error: "audio failed" });
    }
  });

  // ── certificate PDF (A4 landscape, preview-style) ────────────────────────────
  async function buildCertificate(r: any): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    doc.setTitle(`Venoxa Level Test certificate ${r.cert_id}`);
    doc.setAuthor("Venoxa AI");
    doc.setSubject("CEFR-aligned adaptive English placement certificate");
    doc.registerFontkit(fontkit);

    const W = 842, H = 595;
    const page = doc.addPage([W, H]);
    const helv = await doc.embedFont(StandardFonts.Helvetica);
    const helvB = await doc.embedFont(StandardFonts.HelveticaBold);
    const times = await doc.embedFont(StandardFonts.TimesRomanBold);

    // Arabic-capable font: Amiri ships with the app (Naskh, includes the
    // presentation-form glyphs our shaper emits; Noto's variable build
    // re-shapes them through GSUB and breaks with pdf-lib).
    let noto: any = null;
    try {
      const fontPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "fonts", "Amiri-Regular.ttf");
      noto = await doc.embedFont(await import("node:fs").then(fs => fs.readFileSync(fontPath)), { subset: false });
    } catch (e) {
      console.error("cert font: Amiri unavailable:", e?.message || e);
    }

    // (name font selection happens per-run inside the name block below)

    // frames (double border)
    page.drawRectangle({ x: 12, y: 12, width: W - 24, height: H - 24, borderWidth: 1.2, borderColor: rgb(0.75, 0.78, 0.85) });
    page.drawRectangle({ x: 20, y: 20, width: W - 40, height: H - 40, borderWidth: 3.5, borderColor: rgb(0.10, 0.35, 0.75) });

    // (name font selection happens per-run inside the name block below)

    // frames (double border)
    page.drawRectangle({ x: 12, y: 12, width: W - 24, height: H - 24, borderWidth: 1.2, borderColor: rgb(0.75, 0.78, 0.85) });
    page.drawRectangle({ x: 20, y: 20, width: W - 40, height: H - 40, borderWidth: 3.5, borderColor: rgb(0.10, 0.35, 0.75) });

    const cX = W / 2;
    const BLUE = rgb(0.10, 0.35, 0.75);
    const DARK = rgb(0.07, 0.10, 0.17);
    const GRAY = rgb(0.42, 0.46, 0.54);
    const center = (t: string, font: any, size: number, yy: number, color: any = DARK) => {
      const w = font.widthOfTextAtSize(t, size);
      page.drawText(t, { x: cX - w / 2, y: yy, size, font, color });
      return yy;
    };

    // top-center brand: rounded V badge + VENOXA wordmark (per mockup)
    {
      const wordmark = "VENOXA";
      const wmW = helvB.widthOfTextAtSize(wordmark, 13);
      const gap = 8, bSize = 22;
      const total = bSize + gap + wmW;
      let x = cX - total / 2;
      page.drawRectangle({ x, y: 545, width: bSize, height: bSize, color: BLUE, borderRadius: 5 });
      const vw = helvB.widthOfTextAtSize("V", 13);
      page.drawText("V", { x: x + (bSize - vw) / 2, y: 551, size: 13, font: helvB, color: rgb(1, 1, 1) });
      page.drawText(wordmark, { x: x + bSize + gap, y: 551, size: 13, font: helvB, color: BLUE });
      x = cX;
    }

    center("Certificate of English Level", times, 30, 498);
    center("This certifies that", helv, 10, 458, rgb(0.45, 0.48, 0.55));
    {
      // name: Latin runs in Times bold (blue, per mockup), Arabic runs in Amiri
      const runs = segmentName(String(r.name)).filter(rn => rn.text.length);
      const size0 = 30;
      const sizeRuns = (size: number) => runs.map(rn => ({
        ...rn,
        font: rn.isArabic && noto ? noto : times,
        width: (rn.isArabic && noto ? noto : times).widthOfTextAtSize(rn.text, size),
      }));
      let size = size0;
      while (size > 12 && sizeRuns(size).reduce((s, rn2) => s + rn2.width, 0) > W - 240) size -= 2;
      const run2 = sizeRuns(size);
      const totalW = run2.reduce((s, rn2) => s + rn2.width, 0);
      let x = cX - totalW / 2;
      for (const rn2 of run2) {
        try {
          page.drawText(rn2.text, { x, y: 418, size, font: rn2.font, color: BLUE });
        } catch {
          // WinAnsi can't encode this name (accents beyond Latin-1, Cyrillic, …)
          // → fall back to Amiri, which carries a full Latin+Arabic charset
          if (noto) page.drawText(rn2.text, { x, y: 418, size, font: noto, color: BLUE });
        }
        x += rn2.width;
      }
      const uw = Math.max(totalW + 28, 180);
      page.drawLine({ start: { x: cX - uw / 2, y: 406 }, end: { x: cX + uw / 2, y: 406 }, thickness: 1, color: rgb(0.7, 0.74, 0.82) });
    }
    center("has completed the Venoxa Level Test with the following result", helv, 10, 384, rgb(0.45, 0.48, 0.55));

    // overall result: big level letters + right-hand detail lines, centered group
    {
      const level = String(r.level);
      const title = CEFR_NAMES[r.level as CefrLevel] ?? level;
      const line1 = title;
      const line2 = `Overall score ${r.score} / 100`;
      const modeLabel = r.mode === "quick" ? "Quick version" : "Full test";
      const line3 = `95% range ${r.ci_low} – ${r.ci_high} · ${modeLabel}`;
      const bW = helvB.widthOfTextAtSize(level, 48);
      const rW = Math.max(helvB.widthOfTextAtSize(line1, 15), helvB.widthOfTextAtSize(line2, 11), helv.widthOfTextAtSize(line3, 9.5));
      const gap = 18;
      let x = cX - (bW + gap + rW) / 2;
      page.drawText(level, { x, y: 322, size: 48, font: helvB, color: BLUE });
      x += bW + gap;
      page.drawText(line1, { x, y: 348, size: 15, font: helvB, color: DARK });
      page.drawText(line2, { x, y: 330, size: 11, font: helvB, color: DARK });
      page.drawText(line3, { x, y: 314, size: 9.5, font: helv, color: GRAY });
    }

    // per-section columns: blue number above gray caps label,
    // evenly spread and centered (mockup order R/G/V/L)
    {
      const secs = r.section_scores || [];
      const labels: Record<string, string> = { grammar: "GRAMMAR", vocab: "VOCABULARY", reading: "READING", listening: "LISTENING" };
      const order = ["reading", "grammar", "vocab", "listening"];
      const byType: Record<string, any> = {};
      for (const sc of secs) byType[sc.type] = sc;
      const colW = 124, x0 = W / 2 - 1.5 * colW;
      order.forEach((type, idx) => {
        const sc = byType[type];
        if (!sc) return;
        const cx = x0 + idx * colW;
        const val = sc.score == null ? "—" : String(sc.score);
        const vw2 = helvB.widthOfTextAtSize(val, 18);
        page.drawText(val, { x: cx - vw2 / 2, y: 252, size: 18, font: helvB, color: BLUE });
        const lw2 = helv.widthOfTextAtSize(labels[type], 7.5);
        page.drawText(labels[type], { x: cx - lw2 / 2, y: 236, size: 7.5, font: helv, color: GRAY });
        if (sc.lowConfidence) {
          const note = "low conf.";
          const nw = helv.widthOfTextAtSize(note, 7);
          page.drawText(note, { x: cx - nw / 2, y: 224, size: 7, font: helv, color: rgb(0.66, 0.45, 0.1) });
        }
      });
    }

    // date + cert id + verify URL (bottom-left), roundel (bottom-center), QR (bottom-right)
    const d = new Date(r.created_at);
    const dateStr = `Date: ${String(d.getDate()).padStart(2, "0")} ${d.toLocaleDateString("en-US", { month: "long" })} ${d.getFullYear()}`;
    page.drawText(dateStr, { x: 62, y: 122, size: 10, font: helv, color: rgb(0.30, 0.34, 0.42) });
    page.drawText(`Certificate ID: ${r.cert_id}`, { x: 62, y: 106, size: 9, font: helv, color: rgb(0.30, 0.34, 0.42) });
    page.drawText(`Verify: ${APP_URL.replace(/^https?:\/\//, "")}/verify/${r.cert_id}`, { x: 62, y: 91, size: 8.5, font: helv, color: BLUE });

    // VENOXA VERIFIED roundel — bottom-center (per mockup)
    {
      const rx = cX, ry = 108, rad = 26;
      page.drawCircle({ x: rx, y: ry, size: rad, color: rgb(1, 1, 1), borderWidth: 1.6, borderColor: BLUE });
      const lw = helvB.widthOfTextAtSize("VENOXA", 6.5);
      page.drawText("VENOXA", { x: rx - lw / 2, y: ry + 3, size: 6.5, font: helvB, color: BLUE });
      const vw = helv.widthOfTextAtSize("VERIFIED", 6.5);
      page.drawText("VERIFIED", { x: rx - vw / 2, y: ry - 8, size: 6.5, font: helv, color: rgb(0.25, 0.28, 0.34) });
    }

    try {
      const png = await QRCode.toBuffer(`${APP_URL}/verify/${r.cert_id}`, { margin: 1, width: 240, color: { dark: "#0b1220", light: "#ffffff" } });
      const img = await doc.embedPng(png);
      page.drawImage(img, { x: W - 140, y: 52, width: 88, height: 88 });
      const sw = helv.widthOfTextAtSize("Scan to verify", 7.5);
      page.drawText("Scan to verify", { x: W - 140 + (88 - sw) / 2, y: 40, size: 7.5, font: helv, color: rgb(0.45, 0.48, 0.55) });
    } catch (e) {
      console.error("cert QR failed:", e?.message || e);
    }

    const FOOTER = "Aligned to the CEFR scale. Not an official qualification and not equivalent to IELTS, TOEFL or EF SET.";
    const footerMaxW = W - 100; // spans the full card, well under it in practice
    let fs = 8;
    while (fs > 5.5 && helv.widthOfTextAtSize(FOOTER, fs) > footerMaxW) fs -= 0.5;
    center(FOOTER, helv, fs, 26, rgb(0.55, 0.58, 0.65));

    return doc.save();
  }

  return { verifySupabaseUser, buildCertificate };
}
