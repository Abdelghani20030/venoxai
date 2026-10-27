// artifacts/venoxa/src/supabase-config.js
//
// Supabase client — replaces firebase-config.js.
// Backs auth, the `users` table (words/progress/history sync) and
// Supabase Storage (custom vocab CSVs).
//
// Create a free project at https://supabase.com, then paste the values
// from Project Settings → API into your .env:
//   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
//   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
// Then run artifacts/venoxa/supabase-schema.sql in the SQL Editor.

import { createClient } from '@supabase/supabase-js';

const URL    = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const configured =
  URL && ANON_KEY &&
  !String(URL).includes('YOUR-PROJECT-REF') &&
  !String(ANON_KEY).includes('YOUR-ANON-PUBLIC-KEY');

if (!configured) {
  console.error(
    '[venoxa] Supabase is not configured. Add VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY to artifacts/venoxa/.env, and run ' +
    'supabase-schema.sql in your project\'s SQL Editor. The app will run ' +
    'in guest mode (local-only progress) until then.'
  );
}

export const supabase = createClient(
  configured ? URL : 'https://placeholder.supabase.co',
  configured ? ANON_KEY : 'placeholder-anon-key',
  {
    auth: {
      // Keep the session in a local-store-managed spot; the app persists
      // its own 'venoxa_user'/'venoxa_token' copies on top of this.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // we verify with 6-digit codes, not redirect links
    },
  }
);

export const VOCAB_BUCKET = 'vocab';
