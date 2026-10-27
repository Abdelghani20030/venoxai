# Supabase Setup Guide for Venoxa

The app has been migrated from Firebase to Supabase. Everything now syncs
through Supabase: **account auth, profile, words, SRS progress, XP/streak,
calendar, achievements, and every history/favorites list**, plus custom
word-list CSV uploads in Supabase Storage.

There is no Firebase left in the codebase — `firebase-config.js` was deleted
and the `firebase` dependency was removed.

---

## 1. Create the project

1. Go to [https://supabase.com](https://supabase.com) → **Start your project** (free tier is fine).
2. Create a new organization → **New project**. Any name (e.g. `venoxa`), any region.
3. Note the **Database password** you set (you won't need it for the app, just keep it safe).

## 2. Paste the keys into the app

Open **Project Settings → API** in the Supabase dashboard and copy two values:

- **Project URL** → looks like `https://xxxxxxxxxxxxx.supabase.co`
- **anon / public key** → the long `eyJ...` string labeled `anon public`

Paste them into **both** `.env` files, replacing the placeholders:

| File | Change |
|---|---|
| `artifacts/venoxa/.env` | `VITE_SUPABASE_URL=...` and `VITE_SUPABASE_ANON_KEY=...` |
| `.env` (workspace root) | same two lines |

## 3. Run the schema

In the Supabase dashboard open **SQL Editor → New query**, paste the entire
contents of `artifacts/venoxa/supabase-schema.sql`, and press **Run**.

This creates:

- `public.users` — one row per account. Every state field (words, SRS, XP,
  streak, histories, favorites, custom vocab lists…) lives in the `data`
  JSONB column, mirroring the old Firestore document.
- Row Level Security — a user can only ever read/write their own row.
- A signup trigger that auto-creates the row and seeds username/dob/gender.
- `merge_beacon_data()` — used by the unload-time sync beacon.
- `delete_own_account()` — used by "Delete account" in the Profile screen.
- The private `vocab` storage bucket (custom word-list CSVs per user).
- Realtime publication entry (live progress updates).

## 4. Switch email verification to 6-digit codes

Your sign-up flow uses an OTP screen. Supabase defaults to a confirmation
**link**, so change the template:

1. Dashboard → **Authentication → Emails → Templates → "Confirm signup"**.
2. Set the body to:

```html
<h2>Welcome to Venoxa!</h2>
<p>Your verification code is:</p>
<p style="font-size: 24px; letter-spacing: 6px; font-weight: bold;">{{ .Token }}</p>
```

3. Save. **Authentication → Emails** also has an option to redirect links to
   your domain (Site URL). Set **Authentication → URL Configuration → Site
   URL** to your deployed domain (e.g. `https://venoxai.vercel.app`), plus
   `http://localhost:3000` for local use.

> New accounts: Sign up → receive code → enter it → in. Existing Firebase
> accounts don't carry over (fresh start agreed).

## 5. Run locally

```powershell
.\run-venoxa.ps1
# or
pnpm dev
```

Frontend: http://localhost:3000 — Backend (AI endpoints): port 3001.

Until the env vars are set, the app logs a clear console error and runs in
guest mode (local-only progress), exactly like the previous Firebase build
behaved when unconfigured.

## 6. Production (Vercel)

`vercel.json` builds the frontend from `artifacts/venoxa`. Add the two env
vars in **Vercel → Project → Settings → Environment Variables** for
Production/Preview:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Then redeploy. (The old `VITE_FIREBASE_*`/`VITE_INSFORGE_*` vars can be
removed from Vercel; they are no longer read.)

---

## How the sync now works (was → is)

| Concern | Before (Firebase) | Now (Supabase) |
|---|---|---|
| Auth | Firebase Auth email/password | Supabase Auth email/password |
| Email verification | verification link | 6-digit OTP (verify screen) |
| User document | Firestore `users/{uid}` | Postgres `users.id/data` JSONB |
| Custom vocab CSVs | Firebase Storage `users/{uid}/vocab/{section}.csv` | Supabase Storage bucket `vocab`, same path pattern |
| Progress pull/push | Firestore get/set w/ timeout | PostgREST reads/upserts w/ timeout |
| Unload beacon | `/api/sync-beacon` (404'd — broken) | `rpc merge_beacon_data` via `fetch(keepalive:true)` |
| Realtime subscribe | Firestore onSnapshot | Supabase Realtime `postgres_changes` |
| Account delete | FB Auth client delete | `delete_own_account()` RPC |

All merge logic (`mergeArraysById`, SRS object merge, XP/streak max scalar
merge, profile-field precedence) was copied verbatim from the Firebase
implementation, so conflict behavior across devices is unchanged.
