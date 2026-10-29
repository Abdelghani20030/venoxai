// artifacts/venoxa/src/insforge.jsx
//
// Venoxa cloud-sync service layer — now powered by Supabase
// (auth + `users` table + Supabase Storage) instead of Firebase.
//
// The export surface is identical to the previous Firebase version, so
// App.jsx / ProfileDashboard.jsx keep working unchanged:
//
//   Auth:    onAuthChange, login, register, logout, verifyEmail, resendVerification,
//            sendPasswordReset, deleteAccount, auth (currentUser shim)
//   Sync:    syncProgress, pullProgress, pushProgress, syncBeacon, subscribeToProgress
//   Vocab:   uploadVocabCSV, downloadVocabCSV, loadAllVocabFromStorage
//
// Data model (one Postgres row mirrors the old Firestore document):
//   users(id uuid pk → auth.users, email, data jsonb, created_at, updated_at)
// every words/progress/history field lives inside the `data` JSONB column.

import { supabase, VOCAB_BUCKET } from './supabase-config.js';
import { loadBundledVocab } from './vocabData.js';

export const insforge = { auth: supabase.auth, db: supabase };

// ─── Session cache (sync access for the auth.currentUser shim) ──────────────

let _session = null;

function trackSession(session) { _session = session; }

// Keep _session fresh (getSession resolves instantly from local storage)
supabase.auth.getSession().then(({ data }) => trackSession(data.session)).catch(() => {});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function docToUser(uid, email, data = {}) {
  return {
    uid,
    email:                email || '',
    username:             data.username             || 'New Learner',
    avatar:               data.avatar               || '',
    dob:                  data.dob                  || '',
    gender:               data.gender               || '',
    languages:            data.languages            || ['English'],
    plan:                 data.plan                 || 'basic plan',
    xp:                   data.xp                   || 0,
    streak:               data.streak               || 0,
    level:                data.level                || 'B2',
    dailyGoalMins:        data.dailyGoalMins        || 15,
    rank30Days:           data.rank30Days           || 29336,
    streakRank:           data.streakRank           || 601,
    completedCells:       data.completedCells       || {},
    usageTime:            data.usageTime            || {},
    calendarDays:         data.calendarDays         || [],
    achievements:         data.achievements         || [],
    levelTest:            data.levelTest            || null,

    srsData:              data.srsData              || {},
    langeekSrsData:       data.langeekSrsData       || {},
    phrasalSrs:           data.phrasalSrs           || {},
    idiomsSrs:            data.idiomsSrs            || {},
    idiomsProperSrs:      data.idiomsProperSrs      || {},
    speakingHistory:      data.speakingHistory      || [],
    writingHistory:       data.writingHistory       || [],
    planConfig:           data.planConfig           || {},
    studiedWords:         data.studiedWords         || [],
    translationHistory:   data.translationHistory   || [],
    translationFavorites: data.translationFavorites || [],
    savedWords:                  data.savedWords                  || [],
    savedIdioms:                 data.savedIdioms                 || [],
    toneRewriterFavorites:       data.toneRewriterFavorites       || [],
    toneRewriterHistory:         data.toneRewriterHistory         || [],
    sentenceDiagrammerFavorites: data.sentenceDiagrammerFavorites || [],
    sentenceDiagrammerHistory:   data.sentenceDiagrammerHistory   || [],
    wordFamilyFavorites:         data.wordFamilyFavorites         || [],
    wordFamilyHistory:           data.wordFamilyHistory           || [],
    collocationFavorites:        data.collocationFavorites        || [],
    collocationHistory:          data.collocationHistory          || [],
    etymologyFavorites:          data.etymologyFavorites          || [],
    etymologyHistory:            data.etymologyHistory            || [],
    pronBookmarks:               data.pronBookmarks               || [],
    pronCompleted:               data.pronCompleted               || [],
    testSessions:                data.testSessions                || [],
    listeningHistory:            data.listeningHistory            || [],
    listeningFavorites:          data.listeningFavorites          || [],
    readingHistory:              data.readingHistory              || [],
    readingFavorites:            data.readingFavorites            || [],
    speakingFavorites:           data.speakingFavorites           || [],
    wordOfDayHistory:            data.wordOfDayHistory            || [],
    idiomOfDayHistory:           data.idiomOfDayHistory           || [],
    customGlobalVocab:           data.customGlobalVocab           || [],
    customPhrasalVocab:          data.customPhrasalVocab          || [],
    customIdiomsVocab:           data.customIdiomsVocab           || [],
    customIdiomsProperVocab:     data.customIdiomsProperVocab     || [],
    customLangeekVocab:          data.customLangeekVocab          || [],
  };
}

function mergeArraysById(localList = [], remoteList = [], key = 'id') {
  const map = new Map();
  const getActualKey = (item) => {
    if (!item) return null;
    if (item[key] != null) return key;
    if (item.id != null) return 'id';
    if (item.word != null) return 'word';
    if (item.idiom != null) return 'idiom';
    if (item.date != null) return 'date';
    return null;
  };

  const addItems = (list) => {
    for (const item of (list || [])) {
      const k = getActualKey(item);
      if (k !== null) {
        map.set(String(item[k]).toLowerCase(), item);
      } else {
        map.set(JSON.stringify(item), item);
      }
    }
  };

  addItems(remoteList);
  addItems(localList);
  return Array.from(map.values());
}

function mergeSrsObjects(local = {}, remote = {}) {
  const merged = { ...(remote || {}), ...(local || {}) };
  return merged;
}

// ─── Postgres row access (mirrors the Firestore doc operations) ──────────────

const USERS_TABLE = 'users';

async function readRow(uid) {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('id, email, data')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;
  return data; // { id, email, data } | null
}

/** Reads a row and returns its `data` document, or a fresh {} for new users. */
async function readDoc(uid) {
  try {
    const row = await readRow(uid);
    return { doc: row?.data || {}, email: row?.email || '' };
  } catch (err) {
    console.warn('readDoc failed, using empty document', err);
    return { doc: {}, email: '' };
  }
}

async function writeDoc(uid, email, docData) {
  const row = {
    id: uid,
    email: email || null,
    data: JSON.parse(JSON.stringify(docData)),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from(USERS_TABLE)
    .upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

/** Merges `partial` into the row's `data` (read-modify-write, like updateDoc). */
async function patchDoc(uid, partial) {
  const { doc: current, email } = await readDoc(uid);
  const merged = { ...current, ...partial };
  await writeDoc(uid, email || _session?.user?.email || '', merged);
  return merged;
}

const withTimeout = (promise, ms) => new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error(
    `Supabase operation timed out after ${ms}ms. You might be offline or blocked by a firewall.`)), ms);
  promise.then(resolve, reject).finally(() => clearTimeout(t));
});

/** Maps raw Supabase auth errors onto the app's expected messages. */
function normalizeAuthError(error) {
  const msg = error?.message || 'Authentication failed';
  if (/not confirmed|confirmed_email|confirm.*email/i.test(msg)) {
    return Object.assign(error instanceof Error ? error : new Error(msg), {
      message: 'Verification required — check your inbox for the 6-digit code.',
    });
  }
  return error;
}

// ─── auth.currentUser shim (Firebase-compatible sync reads) ─────────────────

export const auth = {
  get currentUser() {
    if (!_session?.user) return null;
    const user = _session.user;
    return {
      uid: user.id,
      email: user.email || '',
      getIdToken: async () => {
        // Supabase auto-refreshes; re-read the session for the freshest token
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) trackSession(data.session);
        } catch { /* use cached */ }
        return _session?.access_token || null;
      },
    };
  },
};

// ─── Auth State ───────────────────────────────────────────────────────────────

export function onAuthChange(callback) {
  let active = true;
  let lastEmittedUid = Symbol('none');

  const emit = async (session) => {
    if (!active) return;
    const u = session?.user;
    if (!u) {
      if (lastEmittedUid !== null) {
        lastEmittedUid = null;
        callback(null);
      }
      return;
    }
    if (u.id === lastEmittedUid) return; // dedupe INITIAL_SESSION/live echo
    lastEmittedUid = u.id;
    try {
      const { doc } = await readDoc(u.id);
      if (active) callback(docToUser(u.id, u.email || '', doc));
    } catch {
      if (active) callback(docToUser(u.id, u.email || ''));
    }
  };

  supabase.auth.getSession()
    .then(({ data }) => { trackSession(data.session); return emit(data.session); })
    .catch(() => {});

  const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
    trackSession(session);
    if (evt === 'SIGNED_OUT') {
      lastEmittedUid = Symbol('none');
      callback(null);
      return;
    }
    // Re-emit on explicit sign-in/verification even for the same user id
    if (evt === 'SIGNED_IN' || evt === 'USER_UPDATED') lastEmittedUid = Symbol('none');
    emit(session);
  });

  return () => { active = false; sub.subscription.unsubscribe(); };
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw normalizeAuthError(error);
  trackSession(data.session);

  const u = data.user;
  const { doc } = await readDoc(u.id);
  const user = docToUser(u.id, u.email || '', doc);
  const token = data.session?.access_token || '';
  return { success: true, token, user };
}

export async function register(fields = {}) {
  const {
    email    = '',
    password = '',
    username = 'New Learner',
    dob      = '',
    gender   = '',
  } = typeof fields === 'object' ? fields : { email: fields };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Persisted to auth.users.raw_user_meta_data; the DB trigger copies these
    // into the new users.data row so profile survives email confirmation.
    options: { data: { username, dob, gender } },
  });
  if (error) throw normalizeAuthError(error);

  const u = data.user;
  if (data.session) {
    // Email confirmation disabled in Supabase → user is immediately usable.
    trackSession(data.session);
    const userData = docToUser(u.id, u.email || '', { username, dob, gender });
    try { await patchDoc(u.id, { username, dob, gender }); } catch { /* best effort */ }
    const token = data.session?.access_token || '';
    return { success: true, token, user: userData };
  }

  // Email confirmation required — a 6-digit code email is on its way.
  // App.jsx shows the "verify" screen (mode === 'verify') and calls
  // verifyEmail(email, code) when the user submits it.
  return { success: true, needsVerification: true };
}

export async function logout() {
  await supabase.auth.signOut();
  trackSession(null);
}

/**
 * Verify the 6-digit signup code. Signature kept compatible with the
 * Firebase version, but now actually uses (email, code) as App.jsx expects.
 */
export async function verifyEmail(email, code) {
  if (!email || !code) throw new Error('Email and verification code are required');
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: String(code).trim(),
    type: 'email',
  });
  if (error) throw normalizeAuthError(error);
  trackSession(data.session);

  const u = data.user;
  const { doc } = await readDoc(u.id);
  const user = docToUser(u.id, u.email || '', doc);
  const token = data.session?.access_token || '';
  return { success: true, token, user };
}

export async function resendVerification(email) {
  if (!email) throw new Error('Email is required');
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw normalizeAuthError(error);
  return { success: true };
}

export async function sendPasswordReset(email) {
  if (!email) throw new Error('Email is required');
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw normalizeAuthError(error);
  return { success: true };
}

export async function deleteAccount() {
  const session = _session;
  if (!session?.user) throw new Error('No user signed in');
  // SECURITY DEFINER RPC from supabase-schema.sql — deletes the auth user;
  // the FK cascade removes the users row and storage objects go with it.
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  await supabase.auth.signOut();
  trackSession(null);
  return { success: true };
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(uidOrToken, updates = {}) {
  // App.jsx passes the session token (JWT) as the first arg — resolve the
  // real uid from the signed-in Supabase user (RLS already enforces ownership).
  const session = _session;
  if (!session?.user) throw new Error('No user signed in');
  const uid = session.user.id;
  const merged = await patchDoc(uid, { ...updates, updatedAt: new Date().toISOString() });
  return docToUser(uid, session.user.email || '', merged);
}

// ─── Progress Sync ────────────────────────────────────────────────────────────

export async function syncProgress(_tokenOrUid, localData = {}) {
  // App.jsx passes the session token (JWT) as the first arg — NOT the uid.
  // Always resolve the real uid from the current Supabase session.
  const session = _session;
  const uid = session?.user?.id;
  if (!uid) return localData;

  try {
    const { doc: remote, email } = await readDoc(uid);

    // Merge array fields (local wins on conflicts by id)
    const arrayFields = [
      'achievements',
      'calendarDays', 'speakingHistory', 'writingHistory', 'studiedWords',
      'translationHistory', 'translationFavorites', 'savedWords', 'savedIdioms',
      'toneRewriterFavorites', 'toneRewriterHistory',
      'sentenceDiagrammerFavorites', 'sentenceDiagrammerHistory',
      'wordFamilyFavorites', 'wordFamilyHistory',
      'collocationFavorites', 'collocationHistory',
      'etymologyFavorites', 'etymologyHistory',
      'pronBookmarks', 'pronCompleted', 'testSessions',
      'listeningHistory', 'listeningFavorites', 'readingHistory', 'readingFavorites',
      'speakingFavorites', 'wordOfDayHistory', 'idiomOfDayHistory',
    ];
    const srsFields = [
      'srsData', 'langeekSrsData', 'phrasalSrs', 'idiomsSrs', 'idiomsProperSrs',
    ];

    const merged = { ...remote };
    for (const field of arrayFields) {
      merged[field] = mergeArraysById(localData[field], remote[field]);
    }
    for (const field of srsFields) {
      merged[field] = mergeSrsObjects(localData[field], remote[field]);
    }

    // Scalar — keep the higher value
    merged.xp     = Math.max(localData.xp    || 0, remote.xp    || 0);
    merged.streak = Math.max(localData.streak || 0, remote.streak || 0);
    merged.usageTime = { ...(remote.usageTime || {}), ...(localData.usageTime || {}) };

    // Profile fields — local overrides remote when provided
    if (localData.level)    merged.level    = localData.level;
    if (localData.avatar)   merged.avatar   = localData.avatar;
    if (localData.username) merged.username = localData.username;
    if (localData.levelTest) merged.levelTest = localData.levelTest;
    if (localData.completedCells && Object.keys(localData.completedCells).length > 0) {
      merged.completedCells = { ...(remote.completedCells || {}), ...localData.completedCells };
    }
    if (localData.planConfig && Object.keys(localData.planConfig).length > 0) {
      merged.planConfig = localData.planConfig;
    }

    try {
      await writeDoc(uid, session.user.email || email || '', merged);
    } catch (err) {
      // New users may race the signup trigger — retry once after creating the row
      console.warn('syncProgress upsert failed, retrying', err);
      await writeDoc(uid, session.user.email || email || '', merged);
    }
    return docToUser(uid, session.user?.email || email || '', merged);
  } catch (err) {
    console.warn('syncProgress failed, using local data', err);
    return localData;
  }
}

export async function pullProgress(uid) {
  if (!uid) return null;
  try {
    const session = _session;
    if (!session?.user || session.user.id !== uid) return null;
    const { doc, email } = await withTimeout(readDoc(uid), 10000);
    return docToUser(uid, session.user?.email || email || '', doc);
  } catch (err) {
    console.warn('pullProgress failed', err);
    return null;
  }
}

export async function pushProgress(uid, delta) {
  if (!uid) return;
  if (!_session?.user || _session.user.id !== uid) return;
  const safeDelta = JSON.parse(JSON.stringify(delta));
  try {
    await withTimeout(patchDoc(uid, { ...safeDelta, updatedAt: new Date().toISOString() }), 10000);
  } catch (e) {
    console.error('pushProgress completely failed', e);
    throw e;
  }
}

/**
 * Fires on page unload.
 * The old version POSTed to /api/sync-beacon (a route no running server
 * exposed, so it 404'd silently). Now we PATCH the user's row directly via
 * the SQL helper merge_beacon_data() from supabase-schema.sql. The fetch uses
 * keepalive:true so it survives the tab closing — the modern sendBeacon.
 */
export function syncBeacon(_tokenOrUid, localData = {}) {
  const session = _session;
  if (!session?.user?.id) return;
  try {
    const payload = {
      p_data: {
        xp:           localData.xp           || 0,
        streak:       localData.streak       || 0,
        usageTime:    localData.usageTime    || {},
        calendarDays: localData.calendarDays || [],
      },
    };
    fetch(`${supabase.supabaseUrl}/rest/v1/rpc/merge_beacon_data`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: supabase.supabaseKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'params=single-object',
      },
      body: JSON.stringify(payload),
    }).catch(() => { /* best effort */ });
  } catch { /* best effort */ }
}

export function subscribeToProgress(uid, callback) {
  if (!uid) return () => {};
  const channel = supabase
    .channel(`venoxa-progress-${uid}`)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: USERS_TABLE, filter: `id=eq.${uid}` },
      (payload) => {
        const row = payload.new;
        if (row) callback(docToUser(uid, row.email || '', row.data || {}));
      })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ─── Cloud Vocabulary Storage ─────────────────────────────────────────────────
// Each vocabulary section's CSV is stored in Supabase Storage at:
//   users/{uid}/vocab/{section}.csv
// Sections: 'global' | 'phrasal' | 'slang' | 'idioms' | 'langeek'

export async function uploadVocabCSV(section, csvText) {
  const session = _session;
  if (!session?.user?.id || !csvText) return;
  const path = `users/${session.user.id}/vocab/${section}.csv`;
  const blob = new Blob([csvText], { type: 'text/csv' });
  const { error } = await supabase.storage
    .from(VOCAB_BUCKET)
    .upload(path, blob, { contentType: 'text/csv', upsert: true });
  if (error) throw error;
}

export async function downloadVocabCSV(section) {
  const session = _session;
  if (!session?.user?.id) return null;
  try {
    const path = `users/${session.user.id}/vocab/${section}.csv`;
    const { data, error } = await supabase.storage.from(VOCAB_BUCKET).download(path);
    if (error || !data) return null; // file doesn't exist yet — not an error
    return await data.text();
  } catch {
    return null;
  }
}

// Parses each section's CSV using the same column format as App.jsx
function _parseGlobalCSV(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], ',');
    if (r.length >= 4 && r[0]) out.push({
      word:     r[0].replace(/^"|"$/g, ''),
      type:     r[1]?.replace(/^"|"$/g, '') || '',
      level:    r[2]?.replace(/^"|"$/g, '') || '',
      meaning:  r[3]?.replace(/^"|"$/g, '') || '',
      example:  r[4]?.replace(/^"|"$/g, '') || '',
      synonyms: r[5]?.replace(/^"|"$/g, '') || '',
    });
  }
  return out;
}

function _parsePhrasalCSV(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], ',');
    if (r.length >= 2 && r[0]) out.push({
      word:    r[0].replace(/^"|"$/g, ''),
      meaning: r[1]?.replace(/^"|"$/g, '') || '',
      example: r[2]?.replace(/^"|"$/g, '') || '',
    });
  }
  return out;
}

function _parseSlangCSV(text) {
  const lines = text.split('\n');
  const header = lines[0] || '';
  const sep = header.includes(';') ? ';' : ',';
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], sep);
    if (r.length >= 3 && r[1]) out.push({
      topic:   r[0]?.replace(/^"|"$/g, '').trim() || '',
      word:    r[1].replace(/^"|"$/g, '').trim(),
      meaning: r[2]?.replace(/^"|"$/g, '').trim() || '',
      example: r[3]?.replace(/^"|"$/g, '').trim() || '',
    });
  }
  return out;
}

function _parseIdiomsCSV(text) {
  const lines = text.split('\n');
  const header = lines[0] || '';
  const sep = header.includes(';') ? ';' : ',';
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], sep);
    if (r.length >= 3 && r[1]) out.push({
      word:    r[1].replace(/^"|"$/g, '').trim(),
      meaning: r[2]?.replace(/^"|"$/g, '').trim() || '',
      example: r[3]?.replace(/^"|"$/g, '').trim() || '',
    });
  }
  return out;
}

function _parseLangeekCSV(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const r = _parseCSVLine(lines[i], ',');
    if (r.length >= 4 && r[2]) out.push({
      category: r[0]?.replace(/^"|"$/g, '') || 'General',
      level:    r[1]?.replace(/^"|"$/g, '') || '',
      word:     r[2]?.replace(/^"|"$/g, '') || '',
      type:     r[3]?.replace(/^"|"$/g, '') || '',
      meaning:  r[4]?.replace(/^"|"$/g, '') || '',
      example:  r[5]?.replace(/^"|"$/g, '') || '',
      synonyms: '',
    });
  }
  return out;
}

function _parseCSVLine(line, sep = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
    else if (char === '"') { inQuotes = !inQuotes; }
    else if (char === sep && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

/**
 * Called on startup or login. Loads core default CSVs from the public folder,
 * checks Supabase Storage for custom user uploads, and merges them.
 */
export async function loadAllVocabFromStorage() {
  // ── 1. Load default bundled data ──
  const bundled = await loadBundledVocab();

  const session = _session;
  const uid = session?.user?.id;
  let uploaded = {
    globalVocab:  null,
    phrasalVocab: null,
    slangVocab:   null,
    idiomsVocab:  null,
    langeekVocab: null,
  };

  if (uid) {
    try {
      const { doc } = await readDoc(uid);
      uploaded.globalVocab  = doc.customGlobalVocab       || null;
      uploaded.phrasalVocab = doc.customPhrasalVocab      || null;
      uploaded.slangVocab   = doc.customIdiomsVocab       || null;       // maps to slangVocab / idiomsVocab key in App.jsx
      uploaded.idiomsVocab  = doc.customIdiomsProperVocab || null;       // maps to idiomsVocab / idiomsProperVocab key in App.jsx
      uploaded.langeekVocab = doc.customLangeekVocab      || null;
    } catch (err) {
      console.warn('Failed to load custom vocab from the users table', err);
    }

    // Fallback to Supabase Storage if the users table has no custom vocab data
    const hasCustomVocabInDb =
      (uploaded.globalVocab && uploaded.globalVocab.length > 0) ||
      (uploaded.phrasalVocab && uploaded.phrasalVocab.length > 0) ||
      (uploaded.slangVocab && uploaded.slangVocab.length > 0) ||
      (uploaded.idiomsVocab && uploaded.idiomsVocab.length > 0) ||
      (uploaded.langeekVocab && uploaded.langeekVocab.length > 0);

    if (!hasCustomVocabInDb) {
      console.log('No custom vocabs in the users table; checking Supabase Storage fallback...');
      const sections = ['global', 'phrasal', 'slang', 'idioms', 'langeek'];
      const parsers = {
        global:  _parseGlobalCSV,
        phrasal: _parsePhrasalCSV,
        slang:   _parseSlangCSV,
        idioms:  _parseIdiomsCSV,
        langeek: _parseLangeekCSV,
      };

      const results = await Promise.allSettled(
        sections.map(s => downloadVocabCSV(s))
      );

      uploaded.globalVocab  = results[0].value ? parsers.global(results[0].value)  : null;
      uploaded.phrasalVocab = results[1].value ? parsers.phrasal(results[1].value) : null;
      uploaded.slangVocab   = results[2].value ? parsers.slang(results[2].value)   : null;
      uploaded.idiomsVocab  = results[3].value ? parsers.idioms(results[3].value)  : null;
      uploaded.langeekVocab = results[4].value ? parsers.langeek(results[4].value) : null;

      // Automatically migrate downloaded Storage CSV data into the users table!
      const migrationDelta = {};
      if (uploaded.globalVocab && uploaded.globalVocab.length > 0) migrationDelta.customGlobalVocab = uploaded.globalVocab;
      if (uploaded.phrasalVocab && uploaded.phrasalVocab.length > 0) migrationDelta.customPhrasalVocab = uploaded.phrasalVocab;
      if (uploaded.slangVocab && uploaded.slangVocab.length > 0) migrationDelta.customIdiomsVocab = uploaded.slangVocab;
      if (uploaded.idiomsVocab && uploaded.idiomsVocab.length > 0) migrationDelta.customIdiomsProperVocab = uploaded.idiomsVocab;
      if (uploaded.langeekVocab && uploaded.langeekVocab.length > 0) migrationDelta.customLangeekVocab = uploaded.langeekVocab;

      if (Object.keys(migrationDelta).length > 0) {
        try {
          await patchDoc(uid, migrationDelta);
          console.log('Migrated custom vocabs from Supabase Storage to the users table successfully.');
        } catch (err) {
          console.warn('Migration of custom vocabs to the users table failed', err);
        }
      }
    }
  }

  // ── 3. Merge helper: user overrides bundled by `word` key ──
  function mergeByWord(base = [], override) {
    if (!override || override.length === 0) return base;
    const map = new Map(base.map(w => [w.word?.toLowerCase(), w]));
    for (const w of override) {
      if (w.word) map.set(w.word.toLowerCase(), w);
    }
    return Array.from(map.values());
  }

  return {
    globalVocab:  mergeByWord(bundled.globalVocab,  uploaded.globalVocab),
    phrasalVocab: mergeByWord(bundled.phrasalVocab, uploaded.phrasalVocab),
    slangVocab:   mergeByWord(bundled.slangVocab,   uploaded.slangVocab),
    idiomsVocab:  mergeByWord(bundled.idiomsVocab,  uploaded.idiomsVocab),
    langeekVocab: mergeByWord(bundled.langeekVocab, uploaded.langeekVocab),
  };
}
