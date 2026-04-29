# Venoxa AI Platform

Arabic/English language-learning web app with AI-powered features (vocabulary, grammar, listening, reading, writing, speaking, conversation).

## Architecture

Monorepo with three artifacts:

- `artifacts/venoxa` — React + Vite frontend (path `/`). Single-file `src/App.jsx` ported verbatim from the user's source, with the AI helper rewritten to call the backend instead of Gemini directly.
- `artifacts/api-server` — Express 5 backend (path `/api`). Provides `/api/chat`, an OpenAI-compatible proxy.
- `artifacts/mockup-sandbox` — design preview server (path `/__mockup`).

## AI provider

`artifacts/api-server/src/routes/chat.ts` builds an ordered chain of every available provider at boot, then **tries them per-request**: if one fails (rate limit, network error, empty response) it transparently falls through to the next. Order:

1. **Google Gemini** — `GOOGLE_API_KEY` (`AIza…`). Uses `gemini-2.5-flash` to match the original Venoxa design.
2. **Replit AI Integration** — `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`. Charged to Replit credits. `gpt-5-nano`.
3. **OpenRouter** — `OPENROUTER_API_KEY` (`sk-or-…`). Free `x-ai/grok-4-fast:free`.
4. **OpenAI direct** — `OPENAI_API_KEY` (`sk-…`). `gpt-4o-mini`.

The frontend posts `{ prompt }` to `${BASE_URL}api/chat` and receives `{ text }`.

## Image generation

`generateImage` first asks the AI for a one-sentence concrete visual scene description for the vocabulary word, then renders it via the free, no-key `image.pollinations.ai` service (model=`flux`, 640×420, random seed). Falls back to a generic prompt if the AI brief fails.

## Notable changes vs the original source

- `fetchFromGemini` replaced with a thin wrapper around `POST /api/chat`.
- The direct Imagen call inside `generateImage` swapped for the Pollinations URL.
- Tailwind v3 directives in the original CSS rewritten to v4 (`@import "tailwindcss"`).

## Workflows

- `artifacts/venoxa: web` — Vite dev server (port assigned via `PORT`).
- `artifacts/api-server: API Server` — esbuild + Node server.
- `artifacts/mockup-sandbox: Component Preview Server` — Vite preview.
