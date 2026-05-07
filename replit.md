# Venoxa AI Platform

Arabic/English language-learning web app with AI-powered features (vocabulary, grammar, listening, reading, writing, speaking, conversation).

## Run & Operate

- Frontend dev: managed by workflow `artifacts/venoxa: web`
- Backend dev: managed by workflow `artifacts/api-server: API Server`
- Required secrets: `OPENROUTER_API_KEYY`, `ELEVENLABS_API_KEY` (unused), `GEMINI_API_KEY`

## Stack

- Frontend: React + Vite (`artifacts/venoxa/src/App.jsx`, ~4800 lines)
- Backend: Express 5 (`artifacts/api-server/src/`)
- Build: esbuild (`artifacts/api-server/build.mjs`)
- Monorepo: pnpm workspaces

## Where things live

- Chat AI: `artifacts/api-server/src/routes/chat.ts` — OpenRouter only (`OPENROUTER_API_KEYY`)
- Edge TTS: `artifacts/api-server/src/routes/edge-tts.ts` — free, unlimited, plain-text synthesis
- Gemini TTS: `artifacts/api-server/src/routes/gemini-tts.ts` — `GEMINI_API_KEY`, returns WAV (server route kept, not used in voice chain)
- ElevenLabs TTS: `artifacts/api-server/src/routes/tts.ts` — kept as route but not used in voice chain
- Config endpoint: `artifacts/api-server/src/routes/config.ts`

## Architecture decisions

- **AI provider**: OpenRouter via `OPENROUTER_API_KEYY`. Primary model `liquid/lfm-2.5-1.2b-instruct:free` (~700ms). Full verified model list in `chat.ts` with per-model circuit breaker. `GEMINI_API_KEY` exists but Gemini free-tier quota is exhausted — not used for chat.
- **TTS chain**: `elevenLabsSpeak()` (name kept for call-site compat) → (1) Edge TTS → (2) browser speechSynthesis. ElevenLabs fully removed from frontend voice chain.
- **Edge TTS voices**: UK default (`en-GB-RyanNeural` male / `en-GB-SoniaNeural` female); US accent (`en-US-BrianMultilingualNeural` / `en-US-AvaMultilingualNeural`). All voices use plain text synthesis (no SSML — Multilingual voices return 0 bytes with SSML prosody).
- **Reply before correction**: `handleSend` streams the plain reply first (no JSON), then fires a background `fetchFromGemini` call for the correction panel — user sees clean text immediately.
- **Call mode recording**: `recognition.continuous = true` prevents the ~2s silence timeout that was cutting recordings short.
- **IndexedDB audio cache**: Client-side LRU cache (500 entries) so any text heard once plays instantly from cache — keyed on `(text, voiceId)` hash via djb2.

## Product

- Dashboard, Study Plan (CEFR-based), Vocabulary + Phrasal Verbs + Idioms, Grammar (AI), Listening, Reading (AI), Writing (AI), Conversation/Speaking (AI call mode)
- Call mode: full-screen voice UI with morphing blob, scrollable fade-to-top transcript, continuous-mode voice recording, Edge TTS primary + browser fallback

## Design system (LanGeek brand tokens)

Tokens defined as CSS variables in `index.css` (`:root`):
- **Light**: bg `#F7F9FC`, surface `#FFFFFF`, border `#E6E6E6`, text `#0A0A0A`
- **Primary**: `#0E4AA4` / hover `#0c3d8a`
- **Accent palette**: mint `#78E3D9` / `#C8EFE8`, amber `#FFD78A` / `#FFECD6`, purple `#9E9EFF` / `#B68BFE`
- **Dark mode navy**: bg `#0B152E`, surface `#111C38`, card `#1A3570`, border `#1D3360`
- **Font**: Noto Sans — body/UI; 'The Year of The Camel' for Arabic RTL
- **Cards** (`CARD_PALETTES`): mint `#C8EFE8` + `#48725E` icon, blue `#EBF0F7` + `#0E4AA4` icon, amber `#FFECD6` + `#D88C34` icon
- **Sidebar active**: `bg-[#EBF0F7] text-[#0E4AA4]`; CTAs use `rounded-full` pill shape (LanGeek `9999px`)
- **Flat UI**: no gradients on surfaces, no heavy shadows in light mode (CSS override in `index.css`)

## User preferences

- Arabic is primary language for UI, English is learning target
- OpenRouter key name is `OPENROUTER_API_KEYY` (double Y) — do not change
- Voice speed should be natural/native, not slow or over-enunciated
- British accent is default; US accent toggle available
- UI design inspired by LanGeek.co — light, clean, Noto Sans, pastel cards

## Gotchas

- `OPENROUTER_API_KEYY` (double Y) — the env var name is intentional
- `elevenLabsSpeak()` function name is historical — it now calls Edge TTS → browser only
- Multilingual Neural voices (en-US-Brian/Ava) must use plain text, not SSML — SSML prosody causes 0-byte responses from Edge TTS service
- UK Neural voices (en-GB-Ryan/Sonia) also require plain text (not SSML)
- Message bubble `dir="auto"` lets the browser detect Arabic vs English text direction
- Server pre-warms UK voices on startup; US voices warm on first request (~750ms cold)

## Pointers

- `.local/skills/pnpm-workspace` — monorepo conventions
- `.local/skills/react-vite` — frontend patterns
