# Venoxa Level Test — verification log

Date: 2026-10-29 (UTC)

## Automated checks

| Check | Command | Result |
| --- | --- | --- |
| Engine unit tests | `node --test lib/level-test-engine.test.ts` | 21/21 pass |
| Learner simulation | `node scripts/level-test-simulate.ts` | 2,000 learners: MAE 0.296, RMSE 0.370, bias −0.000, avg 32.0 items, band exact 74.9 %, within one band 100 %, CI coverage 94.5 %, avg SE 0.365 |
| Quick-mode simulation | `node scripts/level-test-simulate.ts --quick --learners=1000` | MAE 0.422, avg 14.9 items |
| Frontend production build | `pnpm --filter @workspace/venoxa build` | pass (chunk-size warning only) |
| Local API build | `pnpm --filter @workspace/api-server build` | pass (pre-existing duplicate-key warning in `routes/user.ts`) |
| Scripts typecheck | `pnpm --filter @workspace/scripts typecheck` | pass |

## Browser QA (mocked API)

The Supabase session was faked in `localStorage` and `/api/level-test/*` was
mocked in `window.fetch`; no database rows were created. Mock item bank: one
grammar item, one vocabulary item, one reading item with a passage. Mock result:
B1, score 47, range 38–56, cert `VX-2026-ABCD-EFGH`.

Verified:

- Arabic and English start screens; Beta badge and “Venoxa Level Test” branding.
- Grammar and vocabulary items render one per screen with four options.
- Reading item uses the two-column layout on desktop and stacks on mobile.
- Listening item shows a waveform, plays once, then disables with “Plays left: 0”.
- Keyboard `2` selects option B; `Enter` submits and advances.
- Browser back opens the exit-confirmation modal; “Stay” keeps the test.
- Timeout path: a past server deadline triggers `/expire`; the result screen
  appears and no new session is created.
- Result screen: level badge, score `/100`, `dir="ltr"` range `38–56`,
  section breakdown, certificate buttons.
- Certificate preview is English-only, shows the learner name, level, score,
  date, cert ID, QR code, and the exact footer.
- Public verify page renders the minimal fields for a valid cert ID.
- Dark and light modes both render correctly.
- Mobile 390×844 (same-origin iframe): dashboard, start, grammar, reading, and
  results are single-column with no horizontal overflow
  (`innerWidth = 388`, `scrollWidth = 388`).
- English stems/options/passages are left-aligned LTR inside the Arabic UI;
  counters and numeric ranges read left-to-right.

## Certificate PDF

- Endpoint requires a Bearer token and owner match.
- `pdf-lib` renders A4 landscape, Helvetica, blue frame, QR code to the verify
  URL, and English-only labels.
- Names are sanitized to Latin characters; Arabic names fall back to
  “Venoxa Learner”.
- Certificate title matches the preview: “Certificate of English Level”.

## Plan-PDF (separate feature)

- 26-week plan: 6,184,737-byte blob, header `%PDF-1.3`, tail `%%EOF`,
  rendered in Chrome’s PDF viewer.
- 3-week plan: 659,981-byte blob, header/tail valid, rendered in Chrome’s
  viewer; page thumbnails confirmed content.
- The browser automation recorded the 26-week download entry as `failed` with
  `bytes=0`, but the intercepted blob was valid and rendered. This appears to
  be a harness download-capture limitation; confirm once in a normal browser.

## Not yet verified

- Live API flow against Supabase (blocked until `migrations/level-test.sql` and
  `migrations/level-test-seed.sql` are applied).
- Audio caching and signed audio playback against real `lt_audio` rows.
- Certificate PDF generated from a real `lt_results` row.
- Full item bank (B2–C2) and teacher review.
