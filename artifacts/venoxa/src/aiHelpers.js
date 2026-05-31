/**
 * aiHelpers.js
 * ─────────────────────────────────────────────────────────────────────
 * Shared streaming + non-streaming wrappers around the backend's
 *   /api/chat            (non-streaming, returns full text)
 *   /api/chat/stream     (SSE token-by-token)
 *
 * All venoxa tools should use these helpers instead of duplicating
 * the fetch / SSE plumbing inside each component.
 * ─────────────────────────────────────────────────────────────────────
 */

// VERCEL FIX: import.meta.env.BASE_URL can be '' or undefined on Vercel,
// which turns '/api/edge-tts' into 'api/edge-tts' (missing leading slash).
// Always normalise to a string that ends in '/' so path joins are safe.
const _rawBase = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const BASE = (_rawBase === '' || _rawBase === '.') ? '/' : (_rawBase.endsWith('/') ? _rawBase : _rawBase + '/');

// ─────────────────────────────────────────────────────────────────────────────
// Kick off warm-up requests for the two most common Edge TTS voices as soon
// as this module is imported. This won't play any audio — it just ensures the
// backend's WebSocket connections to Microsoft's TTS service are established
// before the user clicks anything, eliminating the first-request cold-start.
// ─────────────────────────────────────────────────────────────────────────────
export const prewarmTTS = () => {
  const voices = [
    'en-GB-RyanNeural',
    'en-GB-SoniaNeural',
    'en-US-BrianMultilingualNeural',
    'en-US-AvaMultilingualNeural',
  ];
  for (const voice of voices) {
    fetch(`${BASE}api/edge-tts-warmup?voice=${encodeURIComponent(voice)}`, {
      method: 'GET',
      // low-priority, don't block the page
      priority: 'low',
    }).catch(() => { /* non-critical */ });
  }
};

// Auto-warm on module load (best effort).
if (typeof window !== 'undefined') {
  // Delay slightly so the page's critical resources load first.
  setTimeout(prewarmTTS, 1500);
}

/**
 * streamFromAPI(prompt, onDelta, maxTokens?, timeoutMs?)
 *
 * Streams text chunks from /api/chat/stream via Server-Sent Events.
 *  • onDelta(chunk: string) is called for each token chunk.
 *  • Returns the full accumulated text when the stream ends.
 *  • Throws on HTTP error or timeout.
 *
 * FIX: Now tracks SSE event type so that 'error' and 'done' events are
 * never mistakenly passed to onDelta as content text.
 */
export const streamFromAPI = async (prompt, onDelta, maxTokens = 1024, timeoutMs = 90000) => {
  const url = `${BASE}api/chat/stream`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', full = '';
    // Track the current SSE event type so we can ignore non-delta events.
    let currentEvent = 'delta';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';

      for (const line of lines) {
        if (line === '') {
          // Blank line = end of SSE message; reset event type for next message.
          currentEvent = 'delta';
          continue;
        }
        if (line.startsWith('event:')) {
          // Record the event type; don't process as data.
          currentEvent = line.slice(6).trim();
          continue;
        }
        if (!line.startsWith('data:')) continue;

        // Only process data payloads for 'delta' events (ignore done / error).
        if (currentEvent !== 'delta') continue;

        const raw = line.slice(5).trim();
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'string' && parsed !== '') {
            full += parsed;
            onDelta(parsed);
          }
        } catch { /* skip malformed chunk */ }
      }
    }
    return full;
  } finally {
    window.clearTimeout(timeout);
  }
};

/**
 * fetchFromAPI(prompt, maxTokens?, timeoutMs?)
 * Non-streaming POST to /api/chat. Returns the model's text response,
 * or null on error / non-200.
 */
export const fetchFromAPI = async (prompt, maxTokens = 3000, timeoutMs = 90000) => {
  const url = `${BASE}api/chat`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
};

/**
 * parseJSONLoose(raw)
 * Strips markdown code-fences and pulls out the first JSON object/array
 * from a model response. Returns parsed JSON or null on failure.
 */
export const parseJSONLoose = (raw) => {
  if (!raw) return null;
  let cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  // Try direct parse first
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  // Pull out the first {...} or [...] block
  const objStart = cleaned.indexOf('{');
  const arrStart = cleaned.indexOf('[');
  let start = -1, endChar = '';
  if (objStart === -1 && arrStart === -1) return null;
  if (objStart === -1)      { start = arrStart; endChar = ']'; }
  else if (arrStart === -1) { start = objStart; endChar = '}'; }
  else if (objStart < arrStart) { start = objStart; endChar = '}'; }
  else                          { start = arrStart; endChar = ']'; }
  const end = cleaned.lastIndexOf(endChar);
  if (end === -1 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
};

/**
 * dailySeed()
 * Returns a stable integer seed for "X of the day" tools, changing once
 * per local calendar day. Consumers can use it to keep results stable
 * across reloads within the same day.
 */
export const dailySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

// ─── Edge TTS helper ──────────────────────────────────────────────────────────
/**
 * Voice map — matches exactly what App.jsx uses via edgeTTSSpeak():
 *   en-US → en-US-AvaMultilingualNeural  (American female)
 *   en-GB → en-GB-RyanNeural             (British male)
 */
const _EDGE_VOICES = {
  'en-US': { male: 'en-US-BrianMultilingualNeural', female: 'en-US-AvaMultilingualNeural' },
  'en-GB': { male: 'en-GB-RyanNeural',             female: 'en-GB-SoniaNeural' },
};

let _currentEdgeAudio = null;

/**
 * _playAudioUrl(url, signal?)
 * Creates an Audio element, starts playing it, and resolves when done.
 * Returns the Audio element so the caller can cancel it if needed.
 * Rejects quickly if the audio errors out or the signal fires.
 */
const _playAudioUrl = (url, signal) => {
  const audio = new Audio(url);
  audio.preload = 'auto';
  const promise = new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('aborted')); return; }
    const onAbort = () => { audio.pause(); audio.src = ''; reject(new Error('aborted')); };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });

    audio.onended  = () => { if (signal) signal.removeEventListener('abort', onAbort); resolve(); };
    audio.onerror  = () => { if (signal) signal.removeEventListener('abort', onAbort); reject(new Error('audio error')); };

    audio.play().catch(reject);
  });
  return { audio, promise };
};

/**
 * speakEdge(text, accent?, options?)
 *
 * Speaks text using the Edge Neural TTS proxy (/api/edge-tts).
 *   accent:  'en-US' (default) | 'en-GB'
 *   options.noWait: if true, starts playback and returns immediately
 *                   (fire-and-forget for single-word pronunciation).
 *   options.fallback: if true, also tries Gemini TTS when Edge TTS fails.
 *
 * FIX SUMMARY
 * ───────────
 * 1. Server now streams audio instead of buffering — browser starts playing
 *    as soon as the first bytes arrive, not after full generation.
 * 2. Uses AbortController so a new call immediately stops any prior audio.
 * 3. Added Gemini TTS fallback with a 6 s race — if Edge TTS hasn't started
 *    playing within 6 s, Gemini TTS takes over automatically.
 * 4. noWait option for fire-and-forget word playback (no blocking).
 */
export const speakEdge = async (text, accent = 'en-US', { noWait = false, fallback = true } = {}) => {
  if (!text?.trim()) return;

  // Cancel whatever is currently playing.
  if (_currentEdgeAudio) {
    _currentEdgeAudio.pause();
    try { _currentEdgeAudio.src = ''; } catch {}
    _currentEdgeAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  const preferredGender = (typeof localStorage !== 'undefined' && localStorage.getItem('venoxa_voice_gender')) || 'male';
  const voiceAccentKey = accent === 'en-GB' ? 'en-GB' : 'en-US';
  const voice = _EDGE_VOICES[voiceAccentKey][preferredGender === 'female' ? 'female' : 'male'];

  // Shared abort controller — whichever engine wins cancels the other.
  const ac = new AbortController();

  // ── Primary: Edge TTS ────────────────────────────────────────────────────
  const edgeURL = `${BASE}api/edge-tts?${new URLSearchParams({ text: text.trim().slice(0, 800), voice })}`;

  const tryEdge = async () => {
    const { audio, promise } = _playAudioUrl(edgeURL, ac.signal);
    _currentEdgeAudio = audio;
    audio.onended = () => { if (_currentEdgeAudio === audio) _currentEdgeAudio = null; };
    audio.onerror = () => { if (_currentEdgeAudio === audio) _currentEdgeAudio = null; };
    await promise;
  };

  // ── Fallback: Gemini TTS (races against Edge TTS with a 6 s head-start) ──
  const geminiVoice = preferredGender === 'female' ? 'aoede' : 'puck';
  const geminiURL = `${BASE}api/gemini-tts?${new URLSearchParams({ text: text.trim().slice(0, 800), voice: geminiVoice })}`;

  const tryGemini = async () => {
    // Give Edge TTS a 6-second head start before trying Gemini.
    await new Promise(r => setTimeout(r, 6000));
    if (ac.signal.aborted) return;
    const { audio, promise } = _playAudioUrl(geminiURL, ac.signal);
    _currentEdgeAudio = audio;
    await promise;
  };

  const run = async () => {
    try {
      if (fallback) {
        // Race: whichever TTS finishes playing first wins; the other is cancelled.
        await Promise.race([
          tryEdge().then(() => ac.abort()),
          tryGemini().then(() => ac.abort()),
        ]).catch(() => { /* one of the two will always "lose" gracefully */ });
      } else {
        await tryEdge();
      }
    } catch {
      // Both failed — silent.
    } finally {
      if (_currentEdgeAudio) { _currentEdgeAudio = null; }
    }
  };

  if (noWait) {
    run(); // fire-and-forget
  } else {
    await run();
  }
};