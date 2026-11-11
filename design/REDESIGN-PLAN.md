# Venoxa AI — Learning-Path Redesign: Implementation Plan

Source of truth: `design/pages/page-01..22.png` (rasterized showcase) + `venoxa-redesign-prompt.md`.
Executed phase by phase per §12; app must stay green between phases; commit after each phase.

## Current-state map (verified by reading, not assumed)

Frontend: `artifacts/venoxa` (React 18 + Vite 7 + Tailwind 4). `src/App.jsx` = 12,553 lines.
Navigation is tab-state based: `activeTab` state (init from `location.hash` for `#/verify/*`
and `#/<site-id>` deep links), one `renderContent()` switch (App.jsx:3350) renders every page,
`navItems` (App.jsx:3568) drives the two-tier glass header + mobile drawer.

### Tab id → new route map (26 destinations, all preserved)

| # | Legacy tab id | Lives in | New route |
|---|---|---|---|
| 1 | `dashboard` | App.jsx inline `<Dashboard>` | `/dashboard` (new DashboardScreen) |
| 2 | `level-test` | `LevelTest.jsx` | `/path/placement` (placement entry) |
| 3 | `vocab` | App.jsx inline `<Vocabulary>` | `/library/vocabulary` (sub-tab Review) |
| 4 | `phrasal` | inline `<PhrasalVerbs>` | `/library/vocabulary/phrasal` |
| 5 | `idioms` (Slang) | inline `<IdiomsSlang>` | `/library/vocabulary/slang` |
| 6 | `idioms-proper` | inline `<IdiomsProper>` | `/library/vocabulary/idioms` |
| 7 | `langeek` | inline `<Langeek>` | `/library/vocabulary/langeek` |
| 8 | `grammar` | inline `<Grammar>` | `/library/grammar` |
| 9 | `listening` | inline `<ListeningReading type=listening>` | `/library/skills/listening` |
| 10 | `reading` | inline `<ListeningReading type=reading>` | `/library/skills/reading` |
| 11 | `speaking` | inline `<Speaking>` | `/library/skills/speaking` (fullscreen call mode kept) |
| 12 | `writing` | inline `<Writing>` | `/library/skills/writing` |
| 13 | `pronunciation` | `Pronunciation.jsx` | `/library/skills/pronunciation` |
| 14 | `test-gen` | inline `<TestGenerator>` | `/library/skills/test-generator` |
| 15 | `smart-translation` | `SmartTranslation.jsx` | `/library/tools/smart-translation` |
| 16 | `tone-rewriter` | `ToneRewriter.jsx` | `/library/tools/tone-rewriter` |
| 17 | `sentence-diagrammer` | `SentenceDiagrammer.jsx` | `/library/tools/sentence-diagrammer` |
| 18 | `minimal-pairs` | `MinimalPairs.jsx` | `/library/tools/minimal-pairs` |
| 19 | `word-family` | `WordFamilyExplorer.jsx` | `/library/tools/word-family` |
| 20 | `collocations` | `CollocationFinder.jsx` | `/library/tools/collocations` |
| 21 | `etymology` | `EtymologyExplorer.jsx` | `/library/tools/etymology` |
| 22 | `word-of-day` | `WordOfTheDay.jsx` | `/library/tools/word-of-the-day` |
| 23 | `idiom-of-day` | `IdiomOfTheDay.jsx` | `/library/tools/idiom-of-the-day` |
| 24 | `timer` | `TimerTool.jsx` | `/library/tools/timer` (persistent timer state kept) |
| 25 | `profile` | `ProfileDashboard.jsx` | `/progress/profile` |
| 26 | `plan` | inline `<StudyPlan>` | `/progress/plan` |
| — | site tabs (`about contact community cookies faq help premium privacy report terms`) | `SitePage.jsx` | `/site/:id` (+ legacy `#/:id` fallback) |
| — | `mobile` | `PlaceholderPage.jsx` | `/site/mobile` |
| — | certificate verify | `EnglishCertificate.jsx` / LevelTest verify mode | `#/verify/<id>` (hash, untouched) |

New destinations: `/path` (Learning Path home), `/path/a1/:slug` (lesson player),
`/path/placement` (welcome + test + result), `/library` (hub), `/progress` (hub).

### Data flows (as-is)

- **Auth**: Supabase (`supabase-config.js`) wrapped by `insforge.jsx` — email+password,
  6-digit OTP verification, reset, account deletion. Session JWT exposed via `auth.getToken()`,
  events via `onAuthChange`. App persists `venoxa_user` / `venoxa_token`.
- **User profile/progress sync**: `users` table document via InsForge-compatible API
  (`syncProgress`/`pullProgress`/beacon). Vocabulary/SRS/history live in localStorage first,
  synced when signed in.
- **Server-graded features**: level test (`/api/level-test` via `lib/level-test-server.ts`),
  TTS (`/api/edge-tts` chain), chat/AI routes. DB access: `@workspace/db` (drizzle + pg pool
  from `DATABASE_URL`).
- **Study plan**: planMeta/completedCells/cellDates in localStorage + sync; auto-tick hooks
  exist via `recordActivity`.

### Design-token baseline

`index.css` already carries the Nov-3 `vx-*` system (glass header, footer, site pages) +
motion tokens. Phase 1 adds the PDF §3.2 palette as `--vx-*` vars (light `.dark`-scoped),
Inter via `@fontsource/inter`, and the new component kit; legacy vars remain untouched so
existing screens never regress until restyled.

## New files planned

```
artifacts/venoxa/src/ui/index.jsx            # Button, Chip, Card, Progress bar/ring, StatTile,
                                            # Breadcrumb, AudioButton, EmptyState, Avatar (§3.6)
artifacts/venoxa/src/layout/AppHeader.jsx    # single-row header (§3.4) + avatar menu
artifacts/venoxa/src/layout/MobileTabBar.jsx # bottom nav <768px (§3.5)
artifacts/venoxa/src/router.jsx              # wouter route table + tab↔path bridge (§3.9)
artifacts/venoxa/src/path/pathApi.js         # client for /api/path*
artifacts/venoxa/src/path/DashboardScreen.jsx
artifacts/venoxa/src/path/PathScreen.jsx     # level tabs, units, zig-zag nodes, right rail
artifacts/venoxa/src/path/LessonPlayer.jsx   # step shell, practice, completion, fail (5.3–5.4)
artifacts/venoxa/src/path/PlacementFlow.jsx  # welcome / adaptive / result (5.5)
artifacts/venoxa/src/path/LibraryHub.jsx     # 4 sub-tabs + search + 22 tool cards (5.6, 5.11–5.16)
artifacts/venoxa/src/path/ProgressHub.jsx    # overview, plan re-home, results, cert, profile (5.6,5.10,5.15,5.17)
artifacts/venoxa/src/path/LessonConfetti.jsx
migrations/learning-path.sql                 # additive tables + RLS + indexes (8.1)
migrations/learning-path-seed.sql            # A1 curriculum per §7 (published + draft)
lib/path-rules.ts                            # pure unlock/grade/placement rules (unit-tested)
lib/path-server.ts                           # Express handlers: map/current/lesson/attempt/placement/summary
lib/path-server.test.ts                      # node --test over pure rules (8.2/8.3/§6)
artifacts/api-server/src/routes/path.ts      # mounts lib/path-server (auth + 403 semantics)
```

## Endpoint set (§8.2)

- `GET /api/path` — levels/units/lessons with per-user computed state
- `GET /api/path/current` — next unlocked lesson (all "Continue" buttons)
- `GET /api/path/summary` — dashboard data (current lesson, ring %, streak, XP, words, time, reviews, achievements)
- `GET /api/path/lessons/:slug` — content if unlocked else **403** (+current lesson in body); exercises without answers
- `POST /api/path/lessons/:slug/attempt` — server grading, feedback, completion+XP+unlock in one transaction, idempotent
- `POST /api/path/placement` — set start level; lower levels "open for revision"; unlock first lesson
- Auth: `Authorization: Bearer <Supabase JWT>` verified via `GET {SUPABASE_URL}/auth/v1/user`
  (same approach the level-test already uses); anonymous users get guest map (no progress writes).

## XP formula (documented once, §6.9)

- Lesson check passed: `+40 XP` baseline, `+ round((score − 70) / 5) * 2` bonus (max +12), revision revisits award nothing.
- Placement result: no XP. Assessment (unit check): `+60 XP`. Streak: counted per active day.

## Phase ↔ spec checklist

- Phase 0 → §0–§1 (this file). ✔
- Phase 1 → §3.1–3.6, §3.9–3.10 (tokens, Inter, kit, header, bottom nav, routing+fallbacks, avatar menu, footer/static restyle)
- Phase 2 → §6, §7, §8 (migrations, seed, endpoints, rules + tests)
- Phase 3 → §5.1 dashboard
- Phase 4 → §5.2, §5.7(mobile path), §5.8(dark) path screen
- Phase 5 → §5.3–5.4 lesson player + practice + completion/fail
- Phase 6 → §5.5 placement (3 screens) wired to adaptive test
- Phase 7 → §5.6 library hub, §5.11–5.16 tool homes with breadcrumbs + "In your path" tags
- Phase 8 → §5.6 progress hub, §5.10 study plan, §5.15 results/certificate, §5.17 profile
- Phase 9 → §5.8 dark everywhere, RTL, a11y, empty/loading/error, lazy routes, QA vs pages + §13 checklist

## Assumptions logged (grows during build)

- Header utility items (Dictionary, Mobile App, Contact, Premium, theme, language, sign-out)
  move into the avatar dropdown (spec §3.4 assumption to apply).
- Old dashboard tool-grid content is superseded by the new Dashboard; the old component
  remains in the codebase (nothing removed) but is no longer routed.
- Guests see the path map read-only (states computed without persistence); sign-in required
  to start/complete lessons (server enforces).
