// ─────────────────────────────────────────────────────────────────────────────
//  firebase.js  —  Firebase backend for Venoxa (auth + Firestore sync)
//
//  Data is split across subcollections to avoid Firestore's 1MB doc limit:
//
//  /users/{uid}                  ← profile, streak, level, xp, avatar
//  /users/{uid}/data/vocab       ← globalVocab, phrasalVocab, idiomsVocab,
//                                   idiomsProperVocab, langeekVocab
//  /users/{uid}/data/progress    ← completedCells, usageTime, planConfig,
//                                   studiedWords, calendarDays
//  /users/{uid}/data/history     ← speakingHistory, writingHistory
//  /users/{uid}/data/srs         ← srsData, langeekSrsData
//
//  npm install firebase
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp }  from 'firebase/app';
import { getAnalytics }   from 'firebase/analytics';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  deleteUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyCDuL8EzR9_BhYQNtmgBdrTmRJwUy_pTqw",
  authDomain:        "venoxa.firebaseapp.com",
  projectId:         "venoxa",
  storageBucket:     "venoxa.firebasestorage.app",
  messagingSenderId: "269333924572",
  appId:             "1:269333924572:web:740de14cc00371e3b68219",
  measurementId:     "G-105GVYDC5X",
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
const db        = getFirestore(app);

// ─────────────────────────────────────────────────────────────────────────────
//  Doc refs
// ─────────────────────────────────────────────────────────────────────────────
const userRef     = (uid) => doc(db, 'users', uid);
const dataRef     = (uid, name) => doc(db, 'users', uid, 'data', name);

// ─────────────────────────────────────────────────────────────────────────────
//  Read all subcollection docs in one go
// ─────────────────────────────────────────────────────────────────────────────
async function _readAllDocs(uid) {
  const [profileSnap, vocabSnap, progressSnap, historySnap, srsSnap] =
    await Promise.all([
      getDoc(userRef(uid)),
      getDoc(dataRef(uid, 'vocab')),
      getDoc(dataRef(uid, 'progress')),
      getDoc(dataRef(uid, 'history')),
      getDoc(dataRef(uid, 'srs')),
    ]);

  return {
    profile:  profileSnap.exists()  ? profileSnap.data()  : {},
    vocab:    vocabSnap.exists()    ? vocabSnap.data()    : {},
    progress: progressSnap.exists() ? progressSnap.data() : {},
    history:  historySnap.exists()  ? historySnap.data()  : {},
    srs:      srsSnap.exists()      ? srsSnap.data()      : {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
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
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;
    const docs = await _readAllDocs(uid);
    const user = _buildUserObj(uid, cred.user.email, docs);
    return { success: true, token: uid, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.code) };
  }
}

export async function register(fields) {
  const { email, password, username, dob = '', gender = '', languages = [] } = fields;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    await setDoc(userRef(uid), {
      username, email, dob, gender, languages,
      avatar: '', level: 'B2', streak: 0, xp: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });

    const user = _buildUserObj(uid, email, { profile: { username, email, dob, gender, languages, avatar: '', level: 'B2', streak: 0, xp: 0 }, vocab: {}, progress: {}, history: {}, srs: {} });
    return { success: true, token: uid, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.code) };
  }
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Profile update
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProfile(uid, updates) {
  if (!uid) throw new Error('Not authenticated');
  if (updates.email && auth.currentUser) {
    await updateEmail(auth.currentUser, updates.email);
  }
  await updateDoc(userRef(uid), { ...updates, updatedAt: serverTimestamp() });
  const snap = await getDoc(userRef(uid));
  return { uid, email: auth.currentUser?.email || updates.email, ...(snap.data() || {}) };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Delete account
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAccount(uid) {
  if (!uid) throw new Error('Not authenticated');
  // Delete subcollection docs first
  const batch = writeBatch(db);
  for (const name of ['vocab', 'progress', 'history', 'srs']) {
    batch.delete(dataRef(uid, name));
  }
  batch.delete(userRef(uid));
  await batch.commit();
  if (auth.currentUser) await deleteUser(auth.currentUser);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sync  (called from App.jsx syncProgress)
// ─────────────────────────────────────────────────────────────────────────────

export async function syncProgress(uid, localPayload) {
  if (!uid) return null;

  // 1. Read all remote docs in parallel
  const remote = await _readAllDocs(uid);

  // 2. Split local payload into buckets
  const localProfile = {
    xp:        localPayload.xp,
    streak:    localPayload.streak,
    level:     localPayload.level,
    avatar:    localPayload.avatar,
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
    srsData:        localPayload.srsData        || {},
    langeekSrsData: localPayload.langeekSrsData || {},
  };

  // 3. Merge each bucket
  const mergedProfile  = _mergeObj(localProfile,  remote.profile);
  const mergedVocab    = _mergeObj(localVocab,    remote.vocab);
  const mergedProgress = _mergeObj(localProgress, remote.progress);
  const mergedHistory  = _mergeObj(localHistory,  remote.history);
  const mergedSrs      = _mergeObj(localSrs,      remote.srs);

  mergedProfile.updatedAt = serverTimestamp();

  // 4. Write all in parallel with detailed error logging
  console.log('[Firebase] Starting sync for uid:', uid);
  console.log('[Firebase] Payload sizes:', {
    profile:  JSON.stringify(mergedProfile).length,
    vocab:    JSON.stringify(mergedVocab).length,
    progress: JSON.stringify(mergedProgress).length,
    history:  JSON.stringify(mergedHistory).length,
    srs:      JSON.stringify(mergedSrs).length,
  });

  const writes = await Promise.allSettled([
    setDoc(userRef(uid),            mergedProfile,  { merge: true }),
    setDoc(dataRef(uid, 'vocab'),    mergedVocab,    { merge: true }),
    setDoc(dataRef(uid, 'progress'), mergedProgress, { merge: true }),
    setDoc(dataRef(uid, 'history'),  mergedHistory,  { merge: true }),
    setDoc(dataRef(uid, 'srs'),      mergedSrs,      { merge: true }),
  ]);

  writes.forEach((r, i) => {
    const names = ['profile', 'vocab', 'progress', 'history', 'srs'];
    if (r.status === 'rejected') {
      console.error(`[Firebase] WRITE FAILED for ${names[i]}:`, r.reason);
    } else {
      console.log(`[Firebase] Write OK: ${names[i]}`);
    }
  });

  const failed = writes.filter(r => r.status === 'rejected');
  if (failed.length > 0) throw failed[0].reason;

  console.log('[Firebase] Sync complete ✓');

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

function _friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/email-already-in-use':   'This email is already registered.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/too-many-requests':      'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

/* ═══════════════════════════════════════════════════════════════════════════
   FIRESTORE SECURITY RULES  —  paste in Firebase Console → Firestore → Rules
   ═══════════════════════════════════════════════════════════════════════════

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /data/{doc} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}

   ═══════════════════════════════════════════════════════════════════════════ */
