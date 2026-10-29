# Venoxa Level Test

Adaptive CEFR English placement test (grammar, vocabulary, reading, listening)
with server-side Rasch scoring, a downloadable PDF certificate, and a public
verification page.

> **Status: beta / pre-launch.** The engine and UI are complete and tested. The
> item bank currently contains 101 draft items (A1–B1 only) because the
> OpenRouter free-tier daily limit stopped generation. All items are
> `reviewed = false` / `status = draft`. Do not activate the test for learners
> until the remaining B2–C2 items are generated, reviewed, and the database
> migration/seed have been applied.

## Contents

- [Architecture](#architecture)
- [Database setup](#database-setup)
- [Environment variables](#environment-variables)
- [Item bank workflow](#item-bank-workflow)
- [Listening audio](#listening-audio)
- [API](#api)
- [Frontend](#frontend)
- [Testing](#testing)
- [Security invariants](#security-invariants)
- [Known limitations](#known-limitations)

## Architecture

| Layer | File | Notes |
| --- | --- | --- |
| Pure scoring engine | `lib/level-test-engine.ts` | Rasch 1PL, EAP over θ ∈ [−4, 4], content mix, stopping rules. Server-only. |
| Shared HTTP router | `lib/level-test-server.ts` | Used by both backends. Auth, sessions, answers, results, PDF, verify, audio. |
| Local backend | `artifacts/api-server/src/routes/index.ts` | Mounts the router at `/level-test`. |
| Production backend | `api/index.ts` | Vercel rewrite `/api/(.*)` → `/api/index.ts`; mounts at `/api/level-test`. |
| Frontend | `artifacts/venoxa/src/LevelTest.jsx` | Start, test, results, certificate preview, public verify. |
| App integration | `artifacts/venoxa/src/App.jsx` | `level-test` tab, sync, XP, achievement, plan update. |
| Schema | `migrations/level-test.sql` | `lt_passages`, `lt_items`, `lt_audio`, `lt_sessions`, `lt_responses`, `lt_results`. |
| Seed data | `migrations/level-test-seed.sql` | Generated inserts; all items draft. |

The engine never runs in the browser. Item payloads sent to the client contain
only `id`, `type`, `stem`, `options`, `passage`, and `audioUrl`; they never
contain `correct_index`, `difficulty_b`, θ, SE, or the CEFR tag.

## Database setup

Run these in the Supabase SQL Editor, in order:

1. `migrations/level-test.sql`
2. `migrations/level-test-seed.sql`

Both are idempotent (`if not exists` / `on conflict do nothing`) and run inside
a transaction where appropriate. No production migration is executed by the
codebase.

After review, activate items:

```sql
update lt_items
   set reviewed = true, status = 'active'
 where id = 'lt_a1_grammar_0001';
```

For local testing before review, set `LEVEL_TEST_ALLOW_DRAFT=1` so draft items
are eligible. Never set that flag in production.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (Supabase pooler). |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | yes (server) | Verify access tokens via `GET /auth/v1/user`. |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | yes (frontend build) | Supabase client. |
| `LEVEL_TEST_VERIFY_BASE_URL` | production | Public base URL used in QR codes and verify links. Falls back to `PUBLIC_APP_URL`, then the request origin. |
| `LEVEL_TEST_AUDIO_SECRET` | recommended | HMAC secret for short-lived audio URLs. Falls back to `JWT_SECRET`. If neither is set, listening audio URLs are `null`. |
| `LEVEL_TEST_COOLDOWN_DAYS` | no (default 7) | Days between completed attempts. `0` disables the cooldown. |
| `LEVEL_TEST_MINUTES` | no (default 25) | Standard total timer. |
| `LEVEL_TEST_QUICK_MINUTES` | no (default 15) | Quick-mode total timer. |
| `LEVEL_TEST_ALLOW_DRAFT` | local only | Include `status = 'draft'` items. |
| `OPENROUTER_API_KEY` | generation only | Item generator. |
| `LEVEL_TEST_GEN_MODEL` | no | Override the generator model. |
| `LEVEL_TEST_GEN_CONCURRENCY` | no | Generator parallelism. |
| `LEVEL_TEST_AUDIO_VOICE` | no | Edge TTS voice (default `en-US-AriaNeural`). |
| `LEVEL_TEST_AUDIO_CONCURRENCY` | no | Audio cache parallelism. |
| `LEVEL_TEST_RECAL_MIN_RESPONSES` | no | Minimum responses before recalibration (default 100). |
| `LEVEL_TEST_RECAL_PRIOR_WEIGHT` | no | Prior weight when blending item difficulties. |

## Item bank workflow

Generate with OpenRouter (free model by default):

```powershell
node --env-file=.env scripts/level-test-generate-items.ts --levels=B2,C1,C2 --merge
```

Useful flags:

- `--levels=A1,A2,B1,B2,C1,C2`
- `--types=grammar,vocab,reading,listening`
- `--target=N` — override the per-type target.
- `--no-verify` — skip the independent second pass (not recommended).
- `--merge` — append to the existing JSON bank and avoid ID collisions.
- `--from-json=scripts/output/level-test-items.json` — rewrite SQL/report from
  an existing bank without calling the API.

Outputs:

- `scripts/output/level-test-items.json`
- `migrations/level-test-seed.sql`
- `docs/level-test/item-bank-report.md`

Quality gates in the generator:

- Shape, length, Arabic-script, HTML, duplicate-option, and option-length checks.
- Independent second-pass verification: drops items whose answer disagrees,
  are ambiguous, or have obviously implausible distractors.
- Near-duplicate detection: normalized exact match, content-token Jaccard
  ≥ 0.85, repeated grammar frames (max two per frame), and repeated vocabulary
  target words.
- Reading passages are 60–180 words with 2–3 questions and explicit
  `passage_order`.

**Review requirements before launch**

- Every item starts as `reviewed = false`, `status = 'draft'`.
- A teacher must review at least a sample of 20 items across levels.
- **All C1 and C2 items must be reviewed** before activation.
- Confirm every item is original and does not reproduce a published exam
  question.
- Prefer replacing formulaic A1 grammar frames if they survived generation;
  the generator now caps repeated frames, but human review is the safeguard.

## Listening audio

After the schema and seed are applied:

```powershell
node --env-file=.env scripts/level-test-cache-audio.ts --dry-run
node --env-file=.env scripts/level-test-cache-audio.ts
```

The script uses Edge TTS, stores MP3 bytes in `lt_audio`, and can be re-run with
`--force`. The API returns short-lived signed URLs (`/api/level-test/audio/:id`)
and the client plays each clip once per item.

## API

All routes are mounted under `/api/level-test` in production and `/level-test`
on the local API server.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/start` | Bearer | Resume an active session or start a new one. Body: `{ mode?: 'standard' \| 'quick' }`. |
| POST | `/answer` | Bearer | Submit one answer. Validates the pending item, prevents replays, returns the next item or the result. |
| POST | `/expire` | Bearer | Finalize a timed-out session without creating a new one. |
| GET | `/result/:sessionId` | Bearer (owner) | Full result for a completed session. |
| GET | `/certificate/:certId` | Bearer (owner) | PDF certificate (`pdf-lib` + QR code). |
| GET | `/verify/:certId` | public, rate-limited | Minimal public verification payload. |
| GET | `/audio/:itemId?exp=&sig=` | signed URL | Short-lived listening audio. |

Scoring summary: EAP ability estimate with an N(0, 1.5) prior on a θ grid from
−4 to 4; stop at SE < 0.35 after at least 20 answers, at 32 items, or on
timeout. Score = `clamp(round(50 + 20θ), 0, 100)`; range = ±1.96·SE·20. Bands:
A1 < 10, A2 10–29, B1 30–49, B2 50–69, C1 70–89, C2 90+.

## Frontend

`LevelTest.jsx` is registered as the `level-test` tab inside `skills_group`.
It supports:

- One question per screen, no back navigation, keyboard `1`–`4` / `Enter`.
- Server-driven total timer and per-item soft timer.
- Resume after refresh from server state.
- Bilingual UI via `_resolveTranslation`; English item content is forced
  `dir="ltr"` inside the Arabic RTL layout.
- Dark mode and a single-column layout below 768 px.
- Results, certificate preview, authenticated PDF download, and public verify
  page at `#/verify/VX-YYYY-XXXX-XXXX`.
- Exit confirmation, timeout finalization, and a Beta accuracy note.

Completion persists `levelTest` (level, score, range, date, cert ID) through the
delta-sync payload, grants 150 XP, adds the “Level Explorer” achievement, and
offers to update the Study Plan starting level.

## Testing

```powershell
pnpm test:level-test          # 21 engine unit tests
pnpm sim:level-test           # 2,000-learner simulation
pnpm --filter @workspace/venoxa build
pnpm --filter @workspace/api-server build
```

Latest simulation: MAE 0.296 logits, RMSE 0.370, band exact 74.9 %, within one
band 100 %, 95 % CI coverage 94.5 %, average 32 items. See
`docs/level-test/phase-a-simulation.md`.

Visual QA (mocked API, no DB) covered Arabic/English start, grammar, reading,
listening, results, certificate preview, public verify, dark/light, mobile
390×844, keyboard shortcuts, back-button exit confirmation, timeout flow, and
one-play audio. See `docs/level-test/verification.md`.

## Security invariants

- Answers, difficulty, θ, SE, and CEFR tags never leave the server.
- Answer submissions are validated against the session's pending item and
  cannot be replayed.
- Results and certificate PDFs are owner-only; public verification exposes
  only the minimal fields needed to validate a certificate.
- Audio URLs are HMAC-signed and expire; the anon key is never used as the
  signing secret.
- Certificate PDFs contain English text only; names are sanitized to Latin
  characters before drawing.
- Rate limits: start 5/min, answer 180/min, expire 30/min, result 30/min,
  verify 30/min, audio 120/min.

## Known limitations

- Item bank is incomplete (101 items: A1 40, A2 39, B1 22; B2/C1/C2 0).
- The 101-item bank was generated before the stricter frame/target dedupe was
  added; several A1 grammar items repeat a “usually ____” routine frame. The
  next generation run uses the stricter prompts and dedupe, and teacher review
  should replace any remaining formulaic items.
- No live end-to-end run against Supabase yet because the migration/seed have
  not been applied by the project owner.
- C1/C2 items must be teacher-reviewed before launch.
- Writing/speaking scoring, proctoring, payments, official recognition, and
  multi-attempt analytics are out of scope for v1.
- The plan-PDF download was verified with an intercepted blob (valid
  `%PDF-1.3` header, `%%EOF` tail, rendered in Chrome); a normal browser
  download should be confirmed by the user.
