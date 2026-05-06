# Venoxa AI Platform

Arabic/English language-learning web app with AI-powered features (vocabulary, grammar, listening, reading, writing, speaking, conversation).

## Run & Operate

- Frontend dev: managed by workflow `artifacts/venoxa: web`
- Backend dev: managed by workflow `artifacts/api-server: API Server`
- Required secrets: `OPENROUTER_API_KEYY`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`

## Stack

- Frontend: React + Vite (`artifacts/venoxa/src/App.jsx`, ~5000 lines)
- Backend: Express 5 (`artifacts/api-server/src/`)
- Build: esbuild (`artifacts/api-server/build.mjs`)
- Monorepo: pnpm workspaces

## Where things live

- Chat AI: `artifacts/api-server/src/routes/chat.ts` — OpenRouter only (`OPENROUTER_API_KEYY`)
- Edge TTS: `artifacts/api-server/src/routes/edge-tts.ts` — free, unlimited, SSML rate supported
- Gemini TTS: `artifacts/api-server/src/routes/gemini-tts.ts` — `GEMINI_API_KEY`, returns WAV
- ElevenLabs TTS: `artifacts/api-server/src/routes/tts.ts` — `ELEVENLABS_API_KEY`
- Config endpoint: `artifacts/api-server/src/routes/config.ts`

## Architecture decisions

- **AI provider**: OpenRouter only via `OPENROUTER_API_KEYY`. Model list in `chat.ts` with per-model circuit breaker (rate-limit cooldown).
- **TTS chain**: `elevenLabsSpeak()` tries (1) Edge TTS → (2) ElevenLabs direct → (3) browser speechSynthesis. Edge TTS is always first — it streams audio in ~200 ms.
- **Edge TTS speed**: +15% SSML prosody rate injected via `buildInput()` in `edge-tts.ts`.
- **Reply before correction**: `handleSend` streams the plain reply first (no JSON), then fires a background `fetchFromGemini` call for the correction panel — user sees clean text immediately.
- **Call mode recording**: `recognition.continuous = true` prevents the ~2s silence timeout that was cutting recordings short.
- **IndexedDB audio cache**: Client-side LRU cache (500 entries) so any text heard once plays instantly from cache — keyed on `(text, voiceId)` hash via djb2.

## Product

- Dashboard, Study Plan (CEFR-based), Vocabulary + Phrasal Verbs + Idioms, Grammar (AI), Listening, Reading (AI), Writing (AI), Conversation/Speaking (AI call mode)
- Call mode: full-screen voice UI with morphing blob, scrollable fade-to-top transcript, continuous-mode voice recording, Gemini/Edge/ElevenLabs TTS

## User preferences

- Arabic is primary language for UI, English is learning target
- OpenRouter key name is `OPENROUTER_API_KEYY` (double Y) — do not change
- Voice speed should be natural/native, not slow or over-enunciated
- Gemini TTS (`gemini-2.5-flash-preview-tts`) is the preferred voice engine

## Gotchas

- `OPENROUTER_API_KEYY` (double Y) — the env var name is intentional
- Edge TTS with SSML: `buildInput(voice, text, rate)` constructs SSML; cache key is on the full input (text or SSML), not just text
- The `elevenLabsSpeak` function name is misleading — it tries Gemini → Edge → ElevenLabs → browser
- Gemini TTS route returns `audio/wav` (PCM + header), not MP3
- Message bubble `dir="auto"` lets the browser detect Arabic vs English text direction

## Pointers

- `.local/skills/pnpm-workspace` — monorepo conventions
- `.local/skills/react-vite` — frontend patterns
