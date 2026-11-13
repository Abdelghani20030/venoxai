// scripts/build-inject.mjs — build the browser evaluate script that injects the
// minted Supabase session into localStorage (supabase-js stores raw JSON.stringify(session),
// plus the app's own venoxa_token / venoxa_user copies).
import { readFileSync, writeFileSync } from "fs";

const j = JSON.parse(readFileSync("attached_assets/mint-out.json", "utf8"));
const s = j.session;
if (!s?.access_token) { console.error("no session in mint-out.json"); process.exit(1); }

const esc = (t) => JSON.stringify(t);
const user = {
  id: j.userId,
  email: j.email,
  aud: "authenticated",
  role: "authenticated",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { email: j.email, email_verified: true, sub: j.userId },
};
const script = `(() => {
  const session = ${esc({ access_token: s.access_token, token_type: s.token_type || "bearer", expires_in: s.expires_in, expires_at: s.expires_at, refresh_token: s.refresh_token, user })};
  localStorage.setItem("sb-erekjfrguwgiqfkpbdqi-auth-token", JSON.stringify(session));
  localStorage.setItem("venoxa_token", ${esc(s.access_token)});
  localStorage.setItem("venoxa_user", JSON.stringify({ uid: ${esc(j.userId)}, email: ${esc(j.email)}, username: "UI Test" }));
  return { ok: true, exp: ${s.expires_at}, email: ${esc(j.email)} };
})()`;

writeFileSync("attached_assets/inject-script.txt", script);
console.log("wrote attached_assets/inject-script.txt");
console.log("length:", script.length);
console.log("expires_at:", s.expires_at);
