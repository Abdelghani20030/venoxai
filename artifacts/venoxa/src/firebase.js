// ─────────────────────────────────────────────────────────────────────────────
//  firebase.js  —  Drop-in Firebase backend for Venoxa (auth + Firestore sync)
//
//  Remaining setup (one-time, in Firebase Console):
//  1. Authentication → Sign-in method → enable Email/Password
//  2. Firestore Database → Create database (production mode)
//  3. Firestore Rules → paste the security rules block at the bottom of this file
//
//  npm install firebase
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAnalytics }  from 'firebase/analytics';
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

const app      = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);   // powers Firebase Analytics dashboard
export const auth = getAuth(app);
const db       = getFirestore(app);

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Read the Firestore user document and return it merged with uid/email. */
async function _fetchUserDoc(firebaseUser) {
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
  const data = snap.exists() ? snap.data() : {};
  return {
    uid:       firebaseUser.uid,
    email:     firebaseUser.email,
    username:  data.username  || firebaseUser.displayName || firebaseUser.email.split('@')[0],
    avatar:    data.avatar    || '',
    level:     data.level     || 'B2',
    streak:    data.streak    || 0,
    xp:        data.xp        || 0,
    dob:       data.dob       || '',
    gender:    data.gender    || '',
    languages: data.languages || [],
    ...data,
  };
}

/** Deep-merge two objects, taking the higher numeric value for number fields. */
function _mergeData(local, remote) {
  if (!remote) return local;
  const merged = { ...remote };
  for (const [k, v] of Object.entries(local)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'number' && typeof remote[k] === 'number') {
      merged[k] = Math.max(v, remote[k]);
    } else if (Array.isArray(v) && Array.isArray(remote[k])) {
      merged[k] = v.length >= remote[k].length ? v : remote[k];
    } else if (typeof v === 'object' && !Array.isArray(v) && typeof remote[k] === 'object') {
      const sub = { ...remote[k] };
      for (const [sk, sv] of Object.entries(v)) {
        if (typeof sv === 'number' && typeof sub[sk] === 'number') {
          sub[sk] = Math.max(sv, sub[sk]);
        } else if (sv !== undefined) {
          sub[sk] = sub[sk] !== undefined ? sub[sk] : sv;
        }
      }
      merged[k] = sub;
    } else {
      merged[k] = v !== undefined ? v : remote[k];
    }
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Auth — login / register / logout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * login(email, password)
 * Returns { success: true, token: uid, user: object }
 *      or { success: false, error: string }
 */
export async function login(email, password) {
  try {
    const cred  = await signInWithEmailAndPassword(auth, email, password);
    const token = cred.user.uid;          // uid is used as "token" throughout
    const user  = await _fetchUserDoc(cred.user);
    return { success: true, token, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.code) };
  }
}

/**
 * register(fields)
 * fields: { email, password, username, dob?, gender?, languages? }
 */
export async function register(fields) {
  const { email, password, username, dob = '', gender = '', languages = [] } = fields;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      username,
      email,
      dob,
      gender,
      languages,
      avatar:    '',
      level:     'B2',
      streak:    0,
      xp:        0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const token = uid;
    const user  = await _fetchUserDoc(cred.user);
    return { success: true, token, user };
  } catch (err) {
    return { success: false, error: _friendlyError(err.code) };
  }
}

/** logout() */
export async function logout() {
  await signOut(auth);
}

/**
 * onAuthChange(callback)
 * Subscribe to Firebase auth state. Returns the unsubscribe function.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * updateProfile(uid, updates)
 * Merges updates into Firestore and returns the full updated user object.
 */
export async function updateProfile(uid, updates) {
  if (!uid) throw new Error('Not authenticated');
  const ref = doc(db, 'users', uid);

  if (updates.email && auth.currentUser) {
    await updateEmail(auth.currentUser, updates.email);
  }

  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  return {
    uid,
    email: auth.currentUser?.email || updates.email,
    ...data,
  };
}

/**
 * deleteAccount(uid)
 * Deletes the Firestore document then the Firebase Auth user.
 */
export async function deleteAccount(uid) {
  if (!uid) throw new Error('Not authenticated');
  await deleteDoc(doc(db, 'users', uid));
  if (auth.currentUser) await deleteUser(auth.currentUser);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * syncProgress(uid, localPayload)
 *
 * Replaces POST /api/user/sync.
 * Reads remote → merges with local (max-wins for numbers) → writes back.
 * Returns the merged data object.
 */
export async function syncProgress(uid, localPayload) {
  if (!uid) return null;
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const remote = snap.exists() ? snap.data() : {};

  const merged = _mergeData(localPayload, remote);
  merged.updatedAt = serverTimestamp();

  await setDoc(ref, merged, { merge: true });
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Error messages
// ─────────────────────────────────────────────────────────────────────────────
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
    }
  }
}

   ═══════════════════════════════════════════════════════════════════════════ */
