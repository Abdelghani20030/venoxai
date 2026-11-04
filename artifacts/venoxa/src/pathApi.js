// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa Learning Path — API client (Phase 4)
//
//  Talks to the server-graded Learning Path API (lib/path-server.ts) mounted
//  at /api/path on BOTH backends (Vercel production + local :3001 dev proxy).
//
//  Rules mirrored from LevelTest.jsx: Supabase access token per request,
//  client NEVER computes locking or scores, and the map payload is cached in
//  localStorage so the Dashboard hero can render instantly without a fetch.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from './supabase-config.js';

const API = '/api/path';
const CACHE_KEY = 'venoxa_path_cache_v1';

async function getPathToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function pathFetch(path, options = {}) {
  const token = await getPathToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    return { ok: false, status: 0, data: null, network: true };
  }
  let data = null;
  try {
    data = await response.json();
  } catch { /* empty body */ }
  return { ok: response.ok, status: response.status, data };
}

/** Instant hydration for the Dashboard hero (no fetch, may be stale). */
export function readCachedPathMap() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cachePathMap(map) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...map, cachedAt: Date.now() }));
  } catch { /* quota — hero simply won't hydrate offline */ }
}

export function invalidatePathCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch { /* noop */ }
}

/** GET /api/path — full server-computed map (statuses, current lesson…). */
export async function fetchPathMap() {
  const res = await pathFetch('/');
  if (res.ok && res.data) {
    cachePathMap(res.data);
    return { ...res, fresh: true };
  }
  return res;
}

/** GET /api/path/lessons/:slug — 403 lesson_locked when ahead of the frontier. */
export async function fetchLesson(slug) {
  return pathFetch(`/lessons/${encodeURIComponent(slug)}`);
}

/**
 * POST /api/path/lessons/:slug/attempt
 *   step 'practice' → transient feedback, nothing stored
 *   step 'check'    → graded + stored; passing unlocks the next lesson server-side
 */
export async function submitAttempt(slug, step, answers) {
  invalidatePathCache();
  return pathFetch(`/lessons/${encodeURIComponent(slug)}/attempt`, {
    method: 'POST',
    body: { step, answers },
  });
}

/**
 * POST /api/path/placement — {} uses the latest level-test result,
 * { level: 'A1' } is the "Start from A1" welcome-screen action.
 */
export async function setPlacement(body) {
  const res = await pathFetch('/placement', { method: 'POST', body });
  if (res.ok && res.data) cachePathMap(res.data);
  return res;
}

export const PATH_ERROR = {
  SETUP_MISSING: 'schema_missing',
  LOCKED: 'lesson_locked',
  NOT_FOUND: 'not_found',
};
