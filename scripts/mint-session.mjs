// scripts/mint-session.mjs — create one confirmed Supabase user + session for
// browser testing. Prints { email, password, userId, token } as JSON.
// The user is LEFT ALIVE; clean it up with:
//   node scripts/mint-session.mjs --cleanup <email>
import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
function envValue(key) {
  const line = env.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
}

const SUPABASE_URL = (envValue("VITE_SUPABASE_URL") || envValue("SUPABASE_URL") || "").replace(/\/$/, "");
const SUPABASE_ANON = envValue("VITE_SUPABASE_ANON_KEY") ?? envValue("SUPABASE_ANON_KEY");

if (process.argv[2] === "--cleanup") {
  const email = process.argv[3];
  const c = new pg.Client({ connectionString: envValue("DATABASE_URL") });
  await c.connect();
  await c.query(`delete from public.users where email = $1`, [email]);
  await c.query(`delete from auth.users where email = $1`, [email]);
  await c.end();
  console.log(`cleaned up ${email}`);
  process.exit(0);
}

const email = `venoxa-ui-test-${Date.now()}@example.com`;
const password = `Vx-${Math.random().toString(36).slice(2)}9!a`;

const signup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
  method: "POST",
  headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const data = await signup.json().catch(() => ({}));
const newUserId = data?.user?.id ?? data?.id ?? null;
if (signup.status !== 200 || !newUserId) {
  console.error(`signup failed: ${signup.status} ${JSON.stringify(data).slice(0, 200)}`);
  process.exit(1);
}

// Email confirmation is ON — confirm directly (confirmed_at is generated).
const db = new pg.Client({ connectionString: envValue("DATABASE_URL") });
await db.connect();
await db.query(`update auth.users set email_confirmed_at = now() where id = $1`, [newUserId]);
await db.end();

const login = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const session = await login.json().catch(() => ({}));
if (!session?.access_token) {
  console.error(`password grant failed: ${login.status}`);
  process.exit(1);
}

console.log(JSON.stringify({
  email,
  password,
  userId: newUserId,
  token: session.access_token,
  supabaseStorageKey: `${SUPABASE_URL.replace(/^https:\/\/([^./]+).*/, 'sb-$1-auth-token')}`,
  session: {
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    refresh_token: session.refresh_token,
    user: session.user,
  },
}));
