// ─────────────────────────────────────────────────────────────────────────────
//  insforge.js  —  Auth + database sync for Venoxa
//
//  Uses the local API server (/api/...) for authentication and data sync.
//  All data is stored in a single PostgreSQL "users" table via the Express API.
//
//  Synced data:
//    Profile:  xp, streak, level, avatar, achievements
//    Vocab:    globalVocab, phrasalVocab, idiomsVocab, idiomsProperVocab, langeekVocab
//    Progress: completedCells, usageTime, calendarDays, planConfig, studiedWords
//    History:  speakingHistory, writingHistory
//    SRS:      srsData, langeekSrsData, phrasalSrs, idiomsSrs, idiomsProperSrs
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  API base URL — works in both dev (Vite proxy) and production (same origin)
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

// ─────────────────────────────────────────────────────────────────────────────
//  Token management
// ─────────────────────────────────────────────────────────────────────────────
function _getToken() {
  return localStorage.getItem('venoxa_token') || null;
}

function _setToken(token) {
  if (token) {
    localStorage.setItem('venoxa_token', token);
  } else {
    localStorage.removeItem('venoxa_token');
  }
}

function _authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// Expose a mock `auth` object so existing App.jsx references to `auth.currentUser`
// have a migration path.
let _cachedUser = null;
export const auth = {
  get currentUser() {
    return _cachedUser;
  },
};

// Keep track of active auth listeners
const authListeners = new Set();

function notifyAuthChange(user) {
  _cachedUser = user ? { uid: user.uid || user.id, email: user.email } : null;
  for (const callback of authListeners) {
    try {
      callback(_cachedUser);
    } catch (err) {
      console.error('[Venoxa] Error in auth state listener callback:', err);
    }
  }
}

// Expose a mock `insforge` object so App.jsx references don't break
export const insforge = {
  auth: {
    getCurrentUser: () => {
      const user = _cachedUser;
      return user ? { email: user.email } : null;
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Auth
// ─────────────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: _friendlyError(data.error || `HTTP ${res.status}`) };

    const { token, user: userData } = data;
    _setToken(token);

    const user = _buildUserObj(userData);
    _cachedUser = { uid: user.uid, email: user.email };

    return { success: true, token, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.message) };
  }
}

export async function register(fields) {
  const { email, password, username, dob = '', gender = '', languages = [] } = fields;
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, dob, gender, languages }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: _friendlyError(data.error || `HTTP ${res.status}`) };

    const { token, user: userData } = data;
    _setToken(token);

    const user = _buildUserObj(userData);
    _cachedUser = { uid: user.uid, email: user.email };

    return { success: true, token, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.message) };
  }
}

export async function logout() {
  _cachedUser = null;
  _setToken(null);
  localStorage.removeItem('venoxa_user');
}

// Stubs for email verification (not supported by API server)
export async function verifyEmail(_email, _otp) {
  return { success: false, error: 'Email verification is not required.' };
}

export async function resendVerification(_email) {
  return { success: false, error: 'Email verification is not required.' };
}

export function onAuthChange(callback) {
  authListeners.add(callback);

  // Check if we have a stored token and validate it
  const token = _getToken();
  if (token) {
    // Validate token by fetching profile
    fetch(`${API_BASE}/api/user/profile`, {
      headers: _authHeaders(token),
    })
      .then(res => {
        if (res.ok) return res.json();
        // Token expired or invalid — clear it
        _setToken(null);
        throw new Error('Invalid token');
      })
      .then(userData => {
        const user = _buildUserObj(userData);
        notifyAuthChange(user);
      })
      .catch(() => {
        callback(null);
      });
  } else {
    // No token — not logged in
    callback(null);
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
  const token = _getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/api/user/profile`, {
    method: 'PUT',
    headers: _authHeaders(token),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to update profile (HTTP ${res.status})`);
  }

  const userData = await res.json();
  return _buildUserObj(userData);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Delete account
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAccount(uid) {
  const token = _getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/api/user/profile`, {
    method: 'DELETE',
    headers: _authHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete account');
  }

  _cachedUser = null;
  _setToken(null);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sync  (called from App.jsx syncProgress)
//
//  Sends ALL local data to the API server which merges it with the DB
//  and returns the merged result. This covers:
//    - All 5 vocab lists
//    - All 5 SRS stores
//    - Speaking + Writing history
//    - Completed cells, usage time, calendar days
//    - Plan config, studied words
//    - XP, streak, level, avatar, achievements
// ─────────────────────────────────────────────────────────────────────────────

export async function syncProgress(uid, localPayload) {
  const token = _getToken();
  if (!token) return null;

  console.log('[Venoxa] Starting sync...');
  console.log('[Venoxa] Payload keys:', Object.keys(localPayload).filter(k => k !== '_local'));

  const res = await fetch(`${API_BASE}/api/user/sync`, {
    method: 'POST',
    headers: _authHeaders(token),
    body: JSON.stringify(localPayload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData.error || `Sync failed (HTTP ${res.status})`;
    console.error('[Venoxa] Sync error:', msg);
    throw new Error(msg);
  }

  const merged = await res.json();
  console.log('[Venoxa] Sync complete ✓');

  // Return flat merged object (same shape App.jsx expects)
  return _buildUserObj(merged);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Beacon sync (for beforeunload — uses navigator.sendBeacon)
// ─────────────────────────────────────────────────────────────────────────────

export function syncBeacon(syncBody) {
  const token = _getToken();
  if (!token) return;

  try {
    const payload = JSON.stringify({ token, ...syncBody });
    navigator.sendBeacon(
      `${API_BASE}/api/user/sync-beacon`,
      new Blob([payload], { type: 'application/json' })
    );
  } catch (err) {
    console.warn('[Venoxa] Beacon sync failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function _buildUserObj(data) {
  if (!data) return null;
  return {
    uid:               data.id ?? data.uid ?? '',
    email:             data.email ?? '',
    username:          data.username ?? '',
    avatar:            data.avatar ?? '',
    level:             data.level ?? 'B2',
    streak:            data.streak ?? 0,
    xp:                data.xp ?? 0,
    dob:               data.dob ?? '',
    gender:            data.gender ?? '',
    languages:         data.languages ?? [],
    achievements:      data.achievements ?? [],
    // Progress
    completedCells:    data.completedCells ?? data.completed_cells ?? {},
    usageTime:         data.usageTime ?? data.usage_time ?? {},
    calendarDays:      data.calendarDays ?? data.calendar_days ?? [],
    planConfig:        data.planConfig ?? data.plan_config ?? {},
    studiedWords:      data.studiedWords ?? data.studied_words ?? [],
    // Vocab
    globalVocab:       data.globalVocab ?? data.global_vocab ?? [],
    phrasalVocab:      data.phrasalVocab ?? data.phrasal_vocab ?? [],
    idiomsVocab:       data.idiomsVocab ?? data.idioms_vocab ?? [],
    idiomsProperVocab: data.idiomsProperVocab ?? data.idioms_proper_vocab ?? [],
    langeekVocab:      data.langeekVocab ?? data.langeek_vocab ?? [],
    // History
    speakingHistory:   data.speakingHistory ?? data.speaking_history ?? [],
    writingHistory:    data.writingHistory ?? data.writing_history ?? [],
    // SRS (all 5)
    srsData:           data.srsData ?? data.srs_data ?? {},
    langeekSrsData:    data.langeekSrsData ?? data.langeek_srs_data ?? {},
    phrasalSrs:        data.phrasalSrs ?? data.phrasal_srs ?? {},
    idiomsSrs:         data.idiomsSrs ?? data.idioms_srs ?? {},
    idiomsProperSrs:   data.idiomsProperSrs ?? data.idioms_proper_srs ?? {},
  };
}

function _friendlyError(msg) {
  if (!msg) return 'Something went wrong. Please try again.';
  const lower = msg.toLowerCase();

  if (lower.includes('user not found') || lower.includes('no user'))
    return 'No account found with this email.';
  if (lower.includes('invalid login') || lower.includes('invalid credential') || lower.includes('invalid email or password'))
    return 'Incorrect email or password.';
  if (lower.includes('already registered') || lower.includes('already been registered') || lower.includes('duplicate') || lower.includes('already exists'))
    return 'This email is already registered.';
  if (lower.includes('invalid email'))
    return 'Please enter a valid email address.';
  if (lower.includes('weak password') || lower.includes('at least'))
    return 'Password must be at least 6 characters.';
  if (lower.includes('rate') || lower.includes('too many'))
    return 'Too many attempts. Please try again later.';
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch'))
    return 'Network error. Check your connection.';

  return msg;
}
