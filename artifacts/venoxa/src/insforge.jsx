// artifacts/venoxa/src/insforge.js
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser as fbDeleteUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  getMetadata,
} from 'firebase/storage';
import { app, storage } from './firebase-config.js';
import { loadBundledVocab } from './vocabData.js';

export const auth = getAuth(app);
const db = getFirestore(app);
export const insforge = { auth, db };

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
    globalVocab:          data.globalVocab          || [],
    phrasalVocab:         data.phrasalVocab         || [],
    idiomsVocab:          data.idiomsVocab          || [],
    idiomsProperVocab:    data.idiomsProperVocab    || [],
    langeekVocab:         data.langeekVocab         || [],
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

// ─── Auth State ───────────────────────────────────────────────────────────────

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      const data = snap.exists() ? snap.data() : {};
      callback(docToUser(firebaseUser.uid, firebaseUser.email, data));
    } catch {
      callback(docToUser(firebaseUser.uid, firebaseUser.email));
    }
  });
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  const data = snap.exists() ? snap.data() : {};
  const user = docToUser(cred.user.uid, cred.user.email, data);
  const token = await cred.user.getIdToken();
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

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const userData = docToUser(cred.user.uid, cred.user.email, { username, dob, gender });
  await setDoc(doc(db, 'users', cred.user.uid), {
    ...userData,
    createdAt: serverTimestamp(),
  });
  await sendEmailVerification(cred.user);
  // Return the shape App.jsx expects: { success, token, user }
  const token = await cred.user.getIdToken();
  return { success: true, token, user: userData };
}

export async function logout() {
  await signOut(auth);
}

export async function verifyEmail() {
  const user = auth.currentUser;
  if (user) await sendEmailVerification(user);
}

export async function resendVerification() {
  const user = auth.currentUser;
  if (user) await sendEmailVerification(user);
}

export async function sendPasswordReset(email) {
  if (!email) throw new Error('Email is required');
  await sendPasswordResetEmail(auth, email);
  return { success: true };
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  try {
    await deleteDoc(doc(db, 'users', user.uid));
  } catch { /* best effort */ }
  await fbDeleteUser(user);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(uid, updates = {}) {
  if (!uid) throw new Error('uid required');
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  const snap = await getDoc(ref);
  return docToUser(uid, snap.data()?.email || '', snap.data() || {});
}

// ─── Progress Sync ────────────────────────────────────────────────────────────

export async function syncProgress(_tokenOrUid, localData = {}) {
  // App.jsx passes the Firebase ID token (JWT) as the first arg — NOT the uid.
  // Always resolve the real uid from the currently signed-in user.
  const uid = auth.currentUser?.uid;
  if (!uid) return localData;

  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    const remote = snap.exists() ? snap.data() : {};

    // Merge array fields (local wins on conflicts by id)
    const arrayFields = [
      'globalVocab', 'phrasalVocab', 'idiomsVocab',
      'idiomsProperVocab', 'langeekVocab', 'achievements',
      'calendarDays', 'speakingHistory', 'writingHistory', 'studiedWords',
      'translationHistory', 'translationFavorites', 'savedWords', 'savedIdioms',
      'toneRewriterFavorites', 'toneRewriterHistory',
      'sentenceDiagrammerFavorites', 'sentenceDiagrammerHistory',
      'wordFamilyFavorites', 'wordFamilyHistory',
      'collocationFavorites', 'collocationHistory',
      'etymologyFavorites', 'etymologyHistory',
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
    if (localData.completedCells && Object.keys(localData.completedCells).length > 0) {
      merged.completedCells = { ...(remote.completedCells || {}), ...localData.completedCells };
    }
    if (localData.planConfig && Object.keys(localData.planConfig).length > 0) {
      merged.planConfig = localData.planConfig;
    }

    await setDoc(ref, { ...merged, updatedAt: serverTimestamp() }, { merge: true });
    return docToUser(uid, auth.currentUser?.email || remote.email || '', merged);
  } catch (err) {
    console.warn('syncProgress failed, using local data', err);
    return localData;
  }
}

export function syncBeacon(_tokenOrUid, localData = {}) {
  // Fires on page unload. Resolve uid from auth — the passed arg is a JWT token.
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    const payload = JSON.stringify({
      uid,
      xp:           localData.xp           || 0,
      streak:       localData.streak        || 0,
      usageTime:    localData.usageTime     || {},
      calendarDays: localData.calendarDays  || [],
    });
    navigator.sendBeacon('/api/sync-beacon', new Blob([payload], { type: 'application/json' }));
  } catch { /* best effort */ }
}

// ─── Cloud Vocabulary Storage ─────────────────────────────────────────────────
// Each vocabulary section's CSV is stored in Firebase Storage at:
//   users/{uid}/vocab/{section}.csv
// Sections: 'global' | 'phrasal' | 'slang' | 'idioms' | 'langeek'

export async function uploadVocabCSV(section, csvText) {
  const uid = auth.currentUser?.uid;
  if (!uid || !csvText) return;
  const path = `users/${uid}/vocab/${section}.csv`;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, csvText, 'raw', {
    contentType: 'text/csv',
  });
}

export async function downloadVocabCSV(section) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  try {
    const path = `users/${uid}/vocab/${section}.csv`;
    const storageRef = ref(storage, path);
    // Check file exists before downloading
    await getMetadata(storageRef);
    const url = await getDownloadURL(storageRef);
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null; // file doesn't exist yet — not an error
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
    if (r.length >= 3 && r[0]) out.push({
      word:    r[0].replace(/^"|"$/g, '').trim(),
      meaning: r[1]?.replace(/^"|"$/g, '').trim() || '',
      example: r[2]?.replace(/^"|"$/g, '').trim() || '',
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
    if (r.length >= 4 && r[0]) out.push({
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
 * checks Firebase Storage for custom user uploads, and merges them.
 */
export async function loadAllVocabFromStorage() {
  // ── 1. Load default bundled data ──
  const bundled = await loadBundledVocab();

  // ── 2. Load user-specific overrides from Firebase Storage ──
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

  const uploaded = {
    globalVocab:  results[0].value ? parsers.global(results[0].value)  : null,
    phrasalVocab: results[1].value ? parsers.phrasal(results[1].value) : null,
    slangVocab:   results[2].value ? parsers.slang(results[2].value)   : null,
    idiomsVocab:  results[3].value ? parsers.idioms(results[3].value)  : null,
    langeekVocab: results[4].value ? parsers.langeek(results[4].value) : null,
  };

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