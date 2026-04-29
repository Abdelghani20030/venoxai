# Venoxa AI Platform

Arabic/English language-learning web app with AI-powered features (vocabulary, grammar, listening, reading, writing, speaking, conversation).

## Architecture

Monorepo with three artifacts:

- `artifacts/venoxa` — React + Vite frontend (path `/`). Single-file `src/App.jsx` ported verbatim from the user's source, with the AI helper rewritten to call the backend instead of Gemini directly.
- `artifacts/api-server` — Express 5 backend (path `/api`). Provides `/api/chat`, an OpenAI-compatible proxy.
- `artifacts/mockup-sandbox` — design preview server (path `/__mockup`).

## AI provider

`artifacts/api-server/src/routes/chat.ts` selects a provider in this order:

1. **Replit AI Integration** (default) — `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`. No user-managed key required, charged to Replit credits. Uses `gpt-5-nano`.
2. **OpenRouter** — `OPENROUTER_API_KEY` (must start with `sk-or-`). Uses the free `x-ai/grok-4-fast:free` model.
3. **OpenAI direct** — `OPENAI_API_KEY` (must start with `sk-`). Uses `gpt-4o-mini`.

The frontend posts `{ prompt }` to `${BASE_URL}api/chat` and receives `{ text }`.

Image generation for vocabulary cards uses the free, no-key `image.pollinations.ai` service.

## Notable changes vs the original source

- `fetchFromGemini` replaced with a thin wrapper around `POST /api/chat`.
- The direct Imagen call inside `generateImage` swapped for the Pollinations URL.
- Tailwind v3 directives in the original CSS rewritten to v4 (`@import "tailwindcss"`).

## Workflows

- `artifacts/venoxa: web` — Vite dev server (port assigned via `PORT`).
- `artifacts/api-server: API Server` — esbuild + Node server.
- `artifacts/mockup-sandbox: Component Preview Server` — Vite preview.
