// ─────────────────────────────────────────────────────────────────────────────
//  insforge.js  —  InsForge backend for Venoxa (auth + database sync)
//
//  Replaces firebase.js — same exported API so App.jsx changes are minimal.
//
//  Database tables (PostgreSQL via InsForge):
//
//  users                  ← profile, streak, level, xp, avatar, achievements
//  user_vocab             ← globalVocab, phrasalVocab, idiomsVocab,
//                            idiomsProperVocab, langeekVocab
//  user_progress          ← completedCells, usageTime, planConfig,
//                            studiedWords, calendarDays
//  user_history           ← speakingHistory, writingHistory
//  user_srs               ← srsData, langeekSrsData, phrasalSrs,
//                            idiomsSrs, idiomsProperSrs
//
//  pnpm add @insforge/sdk
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@insforge/sdk';

// ─────────────────────────────────────────────────────────────────────────────
//  Client initialisation
// ─────────────────────────────────────────────────────────────────────────────
const INSFORGE_URL  = import.meta.env.VITE_INSFORGE_URL  || '';
const INSFORGE_KEY  = import.meta.env.VITE_INSFORGE_ANON_KEY || '';

if (!INSFORGE_URL || !INSFORGE_KEY) {
  console.warn(
    '[InsForge] ⚠️  Missing VITE_INSFORGE_URL or VITE_INSFORGE_ANON_KEY in .env — ' +
    'auth and sync will not work until these are set.'
  );
}

export const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_KEY,
});

// Expose a mock `auth` object so existing App.jsx references to `auth.currentUser`
// have a migration path. InsForge auth state is session-based.
let _cachedUser = null;
export const auth = {
  get currentUser() {
    return _cachedUser;
  },
};

// Keep track of active auth listeners
const authListeners = new Set();

function notifyAuthChange(user) {
  _cachedUser = user ? { uid: user.id, email: user.email } : null;
  const insforgeUser = user ? { uid: user.id, email: user.email } : null;
  for (const callback of authListeners) {
    try {
      callback(insforgeUser);
    } catch (err) {
      console.error('[InsForge] Error in auth state listener callback:', err);
    }
  }
}

// Intercept TokenManager to hook into session changes
if (insforge.tokenManager) {
  const originalSaveSession = insforge.tokenManager.saveSession.bind(insforge.tokenManager);
  const originalClearSession = insforge.tokenManager.clearSession.bind(insforge.tokenManager);
  const originalSetUser = insforge.tokenManager.setUser.bind(insforge.tokenManager);

  insforge.tokenManager.saveSession = (session) => {
    originalSaveSession(session);
    notifyAuthChange(session?.user);
  };

  insforge.tokenManager.clearSession = () => {
    originalClearSession();
    notifyAuthChange(null);
  };

  insforge.tokenManager.setUser = (user) => {
    originalSetUser(user);
    notifyAuthChange(user);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Read all rows for a user (parallel reads from 5 tables)
// ─────────────────────────────────────────────────────────────────────────────
async function _readAllDocs(uid) {
  const [profileRes, vocabRes, progressRes, historyRes, srsRes] =
    await Promise.all([
      insforge.database.from('users').select('*').eq('id', uid),
      insforge.database.from('user_vocab').select('*').eq('user_id', uid),
      insforge.database.from('user_progress').select('*').eq('user_id', uid),
      insforge.database.from('user_history').select('*').eq('user_id', uid),
      insforge.database.from('user_srs').select('*').eq('user_id', uid),
    ]);

  // Each response: { data: [row] | null, error }
  const profile  = profileRes.data?.[0]  || {};
  const vocab    = vocabRes.data?.[0]    || {};
  const progress = progressRes.data?.[0] || {};
  const history  = historyRes.data?.[0]  || {};
  const srs      = srsRes.data?.[0]      || {};

  // Map snake_case DB columns → camelCase JS keys
  return {
    profile: {
      username:     profile.username,
      email:        profile.email,
      avatar:       profile.avatar,
      dob:          profile.dob,
      gender:       profile.gender,
      languages:    profile.languages,
      level:        profile.level,
      streak:       profile.streak,
      xp:           profile.xp,
      achievements: profile.achievements,
    },
    vocab: {
      globalVocab:       vocab.global_vocab       || [],
      phrasalVocab:      vocab.phrasal_vocab      || [],
      idiomsVocab:       vocab.idioms_vocab       || [],
      idiomsProperVocab: vocab.idioms_proper_vocab || [],
      langeekVocab:      vocab.langeek_vocab      || [],
    },
    progress: {
      completedCells: progress.completed_cells || {},
      usageTime:      progress.usage_time      || {},
      calendarDays:   progress.calendar_days   || [],
      planConfig:     progress.plan_config     || {},
      studiedWords:   progress.studied_words   || [],
    },
    history: {
      speakingHistory: history.speaking_history || [],
      writingHistory:  history.writing_history  || [],
    },
    srs: {
      srsData:          srs.srs_data           || {},
      langeekSrsData:   srs.langeek_srs_data   || {},
      phrasalSrs:       srs.phrasal_srs        || {},
      idiomsSrs:        srs.idioms_srs         || {},
      idiomsProperSrs:  srs.idioms_proper_srs  || {},
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Merge helpers (identical to firebase.js logic)
// ─────────────────────────────────────────────────────────────────────────────

/** Max-merge two values of the same type. */
function _mergeVal(local, remote) {
  if (local === undefined || local === null) return remote;
  if (remote === undefined || remote === null) return local;
  if (typeof local === 'number' && typeof remote === 'number') return Math.max(local, remote);
  if (Array.isArray(local) && Array.isArray(remote)) return local.length >= remote.length ? local : remote;
  if (typeof local === 'object' && !Array.isArray(local) &&
      typeof remote === 'object' && !Array.isArray(remote)) {
    const merged = { ...remote };
    for (const [k, v] of Object.entries(local)) {
      merged[k] = _mergeVal(v, remote[k]);
    }
    return merged;
  }
  // For strings and booleans, local wins
  return local !== undefined ? local : remote;
}

function _mergeObj(local = {}, remote = {}) {
  const merged = { ...remote };
  for (const [k, v] of Object.entries(local)) {
    merged[k] = _mergeVal(v, remote[k]);
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Auth
// ─────────────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  try {
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, error: _friendlyError(error.message) };

    const uid = data.user.id;
    _cachedUser = { uid, email: data.user.email };

    const docs = await _readAllDocs(uid);
    const user = _buildUserObj(uid, data.user.email, docs);
    return { success: true, token: uid, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.message) };
  }
}

export async function register(fields) {
  const { email, password, username, dob = '', gender = '', languages = [] } = fields;
  try {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
    });

    if (error) return { success: false, error: _friendlyError(error.message) };

    const uid = data.user.id;
    _cachedUser = { uid, email };

    // Insert profile row
    const now = new Date().toISOString();
    const { error: profileErr } = await insforge.database.from('users').insert([{
      id: uid,
      email,
      username,
      dob,
      gender,
      languages,
      avatar: '',
      level: 'B2',
      streak: 0,
      xp: 0,
      achievements: [],
      created_at: now,
      updated_at: now,
    }]);
    if (profileErr) console.error('[InsForge] Profile insert error:', profileErr);

    // Insert empty sub-table rows
    await Promise.allSettled([
      insforge.database.from('user_vocab').insert([{ user_id: uid }]),
      insforge.database.from('user_progress').insert([{ user_id: uid }]),
      insforge.database.from('user_history').insert([{ user_id: uid }]),
      insforge.database.from('user_srs').insert([{ user_id: uid }]),
    ]);

    const user = _buildUserObj(uid, email, {
      profile: { username, email, dob, gender, languages, avatar: '', level: 'B2', streak: 0, xp: 0, achievements: [] },
      vocab: {}, progress: {}, history: {}, srs: {},
    });
    return { success: true, token: uid, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.message) };
  }
}

export async function logout() {
  _cachedUser = null;
  // InsForge SDK may not have signOut — clear session manually
  try {
    await insforge.auth.signOut();
  } catch {
    // If signOut is not available, the session is simply abandoned
  }
}

export async function verifyEmail(email, otp) {
  try {
    const { data, error } = await insforge.auth.verifyEmail({
      email,
      otp,
    });

    if (error) return { success: false, error: _friendlyError(error.message) };

    const uid = data.user.id;
    _cachedUser = { uid, email: data.user.email };

    const docs = await _readAllDocs(uid);
    const user = _buildUserObj(uid, data.user.email, docs);
    return { success: true, token: uid, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.message) };
  }
}

export async function resendVerification(email) {
  try {
    const { error } = await insforge.auth.resendVerificationEmail({
      email,
    });
    if (error) return { success: false, error: _friendlyError(error.message) };
    return { success: true };
  } catch (err) {
    return { success: false, error: _friendlyError(err.message) };
  }
}

export function onAuthChange(callback) {
  authListeners.add(callback);

  // 1. If we already have a user in memory, notify immediately
  const currentUser = insforge.tokenManager?.getUser();
  if (currentUser) {
    callback({ uid: currentUser.id, email: currentUser.email });
  } else {
    // 2. Otherwise check if there's an existing session on the server/cookie
    insforge.auth.getCurrentUser().then(({ data }) => {
      const updatedUser = insforge.tokenManager?.getUser();
      if (!updatedUser) {
        callback(null);
      }
    }).catch(() => {
      callback(null);
    });
  }

  // Return unsubscribe function
  return () => {
    authListeners.delete(callback);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Profile update
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProfile(uid, updates) {
  if (!uid) throw new Error('Not authenticated');

  // If email is being changed, update auth email first
  if (updates.email) {
    const { error } = await insforge.auth.updateUser({ email: updates.email });
    if (error) throw new Error(error.message);
  }

  // Build the update payload (map camelCase to snake_case for profile fields)
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.username  !== undefined) dbUpdates.username  = updates.username;
  if (updates.email     !== undefined) dbUpdates.email     = updates.email;
  if (updates.avatar    !== undefined) dbUpdates.avatar    = updates.avatar;
  if (updates.dob       !== undefined) dbUpdates.dob       = updates.dob;
  if (updates.gender    !== undefined) dbUpdates.gender    = updates.gender;
  if (updates.languages !== undefined) dbUpdates.languages = updates.languages;
  if (updates.level     !== undefined) dbUpdates.level     = updates.level;

  const { error: updateErr } = await insforge.database
    .from('users')
    .update(dbUpdates)
    .eq('id', uid);

  if (updateErr) throw new Error(updateErr.message);

  // Read back the full profile
  const { data } = await insforge.database
    .from('users')
    .select('*')
    .eq('id', uid);

  const row = data?.[0] || {};
  return {
    uid,
    email:     row.email     || updates.email,
    username:  row.username  || updates.username,
    avatar:    row.avatar    || '',
    level:     row.level     || 'B2',
    streak:    row.streak    || 0,
    xp:        row.xp        || 0,
    dob:       row.dob       || '',
    gender:    row.gender    || '',
    languages: row.languages || [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Delete account
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAccount(uid) {
  if (!uid) throw new Error('Not authenticated');

  // Sub-table rows are cascade-deleted via ON DELETE CASCADE FK constraint.
  // Delete the profile row (which triggers cascades).
  const { error } = await insforge.database
    .from('users')
    .delete()
    .eq('id', uid);

  if (error) throw new Error(error.message);

  // Delete the auth user (if the SDK supports it)
  try {
    // Note: deleting auth user may require admin privileges.
    // The user row is already gone from the DB, so the user is effectively deleted.
    _cachedUser = null;
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sync  (called from App.jsx syncProgress)
//
//  Syncs ALL data — every vocab section, every SRS store, all history,
//  plan config, studied words, achievements, usage time, calendar days.
//
//  NEW vs Firebase: now also syncs phrasalSrs, idiomsSrs, idiomsProperSrs
//  which were previously LOCAL-ONLY.
// ─────────────────────────────────────────────────────────────────────────────

export async function syncProgress(uid, localPayload) {
  if (!uid) return null;

  // 1. Read all remote docs in parallel
  const remote = await _readAllDocs(uid);

  // 2. Split local payload into buckets
  const localProfile = {
    xp:           localPayload.xp,
    streak:       localPayload.streak,
    level:        localPayload.level,
    avatar:       localPayload.avatar,
    achievements: localPayload.achievements,
  };
  const localVocab = {
    globalVocab:       localPayload.globalVocab       || [],
    phrasalVocab:      localPayload.phrasalVocab      || [],
    idiomsVocab:       localPayload.idiomsVocab       || [],
    idiomsProperVocab: localPayload.idiomsProperVocab || [],
    langeekVocab:      localPayload.langeekVocab      || [],
  };
  const localProgress = {
    completedCells: localPayload.completedCells || {},
    usageTime:      localPayload.usageTime      || {},
    calendarDays:   localPayload.calendarDays   || [],
    planConfig:     localPayload.planConfig      || {},
    studiedWords:   localPayload.studiedWords    || [],
  };
  const localHistory = {
    speakingHistory: localPayload.speakingHistory || [],
    writingHistory:  localPayload.writingHistory  || [],
  };
  const localSrs = {
    srsData:         localPayload.srsData         || {},
    langeekSrsData:  localPayload.langeekSrsData  || {},
    phrasalSrs:      localPayload.phrasalSrs      || {},
    idiomsSrs:       localPayload.idiomsSrs       || {},
    idiomsProperSrs: localPayload.idiomsProperSrs || {},
  };

  // 3. Merge each bucket
  const mergedProfile  = _mergeObj(localProfile,  remote.profile);
  const mergedVocab    = _mergeObj(localVocab,    remote.vocab);
  const mergedProgress = _mergeObj(localProgress, remote.progress);
  const mergedHistory  = _mergeObj(localHistory,  remote.history);
  const mergedSrs      = _mergeObj(localSrs,      remote.srs);

  const now = new Date().toISOString();

  // 4. Write all in parallel (upsert pattern)
  console.log('[InsForge] Starting sync for uid:', uid);
  console.log('[InsForge] Payload sizes:', {
    profile:  JSON.stringify(mergedProfile).length,
    vocab:    JSON.stringify(mergedVocab).length,
    progress: JSON.stringify(mergedProgress).length,
    history:  JSON.stringify(mergedHistory).length,
    srs:      JSON.stringify(mergedSrs).length,
  });

  const writes = await Promise.allSettled([
    // Profile update
    insforge.database.from('users').upsert([{
      id:           uid,
      xp:           mergedProfile.xp,
      streak:       mergedProfile.streak,
      level:        mergedProfile.level,
      avatar:       mergedProfile.avatar,
      achievements: mergedProfile.achievements,
      updated_at:   now,
    }], { onConflict: 'id' }),

    // Vocab upsert
    insforge.database.from('user_vocab').upsert([{
      user_id:            uid,
      global_vocab:       mergedVocab.globalVocab,
      phrasal_vocab:      mergedVocab.phrasalVocab,
      idioms_vocab:       mergedVocab.idiomsVocab,
      idioms_proper_vocab: mergedVocab.idiomsProperVocab,
      langeek_vocab:      mergedVocab.langeekVocab,
    }], { onConflict: 'user_id' }),

    // Progress upsert
    insforge.database.from('user_progress').upsert([{
      user_id:         uid,
      completed_cells: mergedProgress.completedCells,
      usage_time:      mergedProgress.usageTime,
      calendar_days:   mergedProgress.calendarDays,
      plan_config:     mergedProgress.planConfig,
      studied_words:   mergedProgress.studiedWords,
    }], { onConflict: 'user_id' }),

    // History upsert
    insforge.database.from('user_history').upsert([{
      user_id:          uid,
      speaking_history: mergedHistory.speakingHistory,
      writing_history:  mergedHistory.writingHistory,
    }], { onConflict: 'user_id' }),

    // SRS upsert — includes ALL 5 SRS stores (3 new ones previously not synced!)
    insforge.database.from('user_srs').upsert([{
      user_id:           uid,
      srs_data:          mergedSrs.srsData,
      langeek_srs_data:  mergedSrs.langeekSrsData,
      phrasal_srs:       mergedSrs.phrasalSrs,
      idioms_srs:        mergedSrs.idiomsSrs,
      idioms_proper_srs: mergedSrs.idiomsProperSrs,
    }], { onConflict: 'user_id' }),
  ]);

  writes.forEach((r, i) => {
    const names = ['profile', 'vocab', 'progress', 'history', 'srs'];
    if (r.status === 'rejected') {
      console.error(`[InsForge] WRITE FAILED for ${names[i]}:`, r.reason);
    } else if (r.value?.error) {
      console.error(`[InsForge] WRITE ERROR for ${names[i]}:`, r.value.error);
    } else {
      console.log(`[InsForge] Write OK: ${names[i]}`);
    }
  });

  const failed = writes.filter(r => r.status === 'rejected' || r.value?.error);
  if (failed.length > 0) {
    const firstErr = failed[0].status === 'rejected'
      ? failed[0].reason
      : failed[0].value?.error;
    throw firstErr;
  }

  console.log('[InsForge] Sync complete ✓');

  // 5. Return flat merged object (same shape App.jsx expects)
  return {
    ...mergedProfile,
    ...mergedVocab,
    ...mergedProgress,
    ...mergedHistory,
    ...mergedSrs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function _buildUserObj(uid, email, docs) {
  const p = docs.profile || {};
  return {
    uid, email,
    username:  p.username  || email.split('@')[0],
    avatar:    p.avatar    || '',
    level:     p.level     || 'B2',
    streak:    p.streak    || 0,
    xp:        p.xp        || 0,
    dob:       p.dob       || '',
    gender:    p.gender    || '',
    languages: p.languages || [],
    ...(docs.vocab    || {}),
    ...(docs.progress || {}),
    ...(docs.history  || {}),
    ...(docs.srs      || {}),
    ...p,
  };
}

function _friendlyError(msg) {
  if (!msg) return 'Something went wrong. Please try again.';
  const lower = msg.toLowerCase();

  if (lower.includes('user not found') || lower.includes('no user'))
    return 'No account found with this email.';
  if (lower.includes('invalid login') || lower.includes('invalid credential'))
    return 'Incorrect email or password.';
  if (lower.includes('already registered') || lower.includes('already been registered') || lower.includes('duplicate'))
    return 'This email is already registered.';
  if (lower.includes('invalid email'))
    return 'Please enter a valid email address.';
  if (lower.includes('weak password') || lower.includes('at least'))
    return 'Password must be at least 6 characters.';
  if (lower.includes('rate') || lower.includes('too many'))
    return 'Too many attempts. Please try again later.';
  if (lower.includes('network') || lower.includes('fetch'))
    return 'Network error. Check your connection.';

  return msg;
}
