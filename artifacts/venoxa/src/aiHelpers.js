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

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
  ? import.meta.env.BASE_URL
  : '/';

/**
 * streamFromAPI(prompt, onDelta, maxTokens?, timeoutMs?)
 * Streams text chunks from /api/chat/stream via Server-Sent Events.
 *  • onDelta(chunk: string) is called for each token chunk.
 *  • Returns the full accumulated text when the stream ends.
 *  • Throws on HTTP error or timeout.
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
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
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
  'en-US': 'en-US-AvaMultilingualNeural',
  'en-GB': 'en-GB-RyanNeural',
};

let _currentEdgeAudio = null;

const _browserFallback = (text, accent) => {
  if (!('speechSynthesis' in window)) return;
  const utt = new SpeechSynthesisUtterance(text.trim());
  utt.lang  = accent;
  utt.rate  = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const pick = voices.find(v => v.lang === accent && !v.localService)
    || voices.find(v => v.lang === accent)
    || voices.find(v => v.lang.startsWith(accent.split('-')[0]));
  if (pick) utt.voice = pick;
  window.speechSynthesis.speak(utt);
};

/**
 * speakEdge(text, accent?)
 * Speaks text using the Edge Neural TTS proxy (/api/edge-tts).
 *   accent: 'en-US' (default) | 'en-GB'
 * Cancels any previous playback first.
 * Falls back to browser speechSynthesis if the proxy is unreachable.
 */
export const speakEdge = async (text, accent = 'en-US') => {
  if (!text?.trim()) return;

  // Cancel whatever is currently playing
  if (_currentEdgeAudio) { _currentEdgeAudio.pause(); _currentEdgeAudio = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();

  const voice = _EDGE_VOICES[accent] ?? _EDGE_VOICES['en-US'];

  try {
    const params = new URLSearchParams({ text: text.trim(), voice });
    const url    = `${BASE}api/edge-tts?${params}`;
    const audio  = new Audio(url);
    audio.preload = 'auto';
    _currentEdgeAudio = audio;
    audio.onended = () => { if (_currentEdgeAudio === audio) _currentEdgeAudio = null; };
    audio.onerror = () => {
      if (_currentEdgeAudio === audio) _currentEdgeAudio = null;
      _browserFallback(text, accent);
    };
    await audio.play();          // resolves once playback starts (streaming)
  } catch {
    _browserFallback(text, accent);
  }
};
