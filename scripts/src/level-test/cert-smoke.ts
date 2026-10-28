// Offline render test of the Level Test certificate PDF (no DB, no auth).
// Writes scripts/cert-preview.pdf — visually checked in the browser in phase (f).
// Run: pnpm --filter @workspace/scripts exec tsx src/level-test/cert-smoke.ts
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { registerLevelTestRoutes } = await import("../../../artifacts/api-server/src/lib/level-test-api");

// minimal fake app + pool so the module can register itself
const routeTable = new Map<string, any>();
const fakeApp = {
  get: (p: string, h: any) => routeTable.set(`GET ${p}`, h),
  post: (p: string, h: any) => routeTable.set(`POST ${p}`, h),
};
const fakePool = () => { throw new Error("no DB in this test"); };

registerLevelTestRoutes(fakeApp, { pool: fakePool });

const r = {
  cert_id: "VX-2026-K7NM-9XQJ",
  name: "María O'Brien-الغامدي",   // mixed script: exercises the Noto fallback
  level: "B2",
  score: 58,
  ci_low: 54,
  ci_high: 62,
  section_scores: [
    { type: "grammar", answered: 10, correct: 7, score: 61, lowConfidence: false },
    { type: "vocab", answered: 6, correct: 3, score: 55, lowConfidence: false },
    { type: "reading", answered: 9, correct: 5, score: 60, lowConfidence: false },
    { type: "listening", answered: 6, correct: 1, score: 54, lowConfidence: false },
  ],
  mode: "full",
  created_at: new Date("2026-10-27T09:30:00Z").toISOString(),
};

const build = routeTable.has("GET /api/level-test/verify/:certId") ? null : null; // sanity marker only
let out: any = null;
// reach into the registration to call buildCertificate directly
{
  const passthrough = registerLevelTestRoutes(
    {
      get: () => {}, post: () => {},
    },
    { pool: fakePool },
  );
  out = await passthrough.buildCertificate(r);
}
const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../cert-preview.pdf");
writeFileSync(outPath, Buffer.from(out));
console.log(`wrote ${outPath} (${(out.length / 1024).toFixed(0)} KB)`);
