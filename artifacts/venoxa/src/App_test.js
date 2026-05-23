import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Home, BookOpen, PenTool, MessageSquare, Headphones, Brain, FileText, CheckCircle, Target, Calendar, Play, Pause, RotateCcw, Volume2, Mic, Send, Clock, ChevronRight, ChevronLeft, ChevronDown, Menu, X, Sparkles, Activity, Award, BookText, Lightbulb, Phone, PhoneOff, MicOff, CheckCircle2, HelpCircle, UploadCloud, Globe, Search, Filter, List, Star, Image as ImageIcon, Layers, Archive, Quote, Zap, Sun, Moon, Printer, Trash2, Copy } from 'lucide-react';
import { _resolveTranslation } from './translations.js';

function LanguageDropdown({ lang, setLang, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);
  const langs = [
    { code: 'en', label: 'English' }, { code: 'ar', label: 'عربي' },
    { code: 'es', label: 'Español' }, { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' }, { code: 'zh', label: '中文' }, { code: 'ja', label: '日本語' }
  ];
  return (
    <div className="relative flex-1" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 flex items-center gap-2 px-3 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer border ${theme === 'dark' ? 'bg-[var(--app-surface)] text-white border-[var(--app-border)] hover:bg-[var(--app-hover)] hover:text-black' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
      >
        <Globe className="w-4 h-4 shrink-0 order-2" />
        <span className="flex-1 text-start order-1 font-bold text-sm">{langs.find(l => l.code === lang)?.label || 'Language'}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 order-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="dropdown-menu bottom-full left-0 mb-2 w-full min-w-[140px] max-h-[300px] overflow-y-auto no-scrollbar">
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setIsOpen(false); }}
              className={`dropdown-item ${lang === l.code ? 'active' : ''}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomDropdown({ value, onChange, options, icon: Icon, theme, placeholder, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);
  const isDark = theme === 'dark';
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 flex items-center gap-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 outline-none cursor-pointer border ${isDark
          ? 'bg-[var(--app-bg)] text-white border-[var(--app-border)] hover:border-gray-700 hover:bg-[#121212]'
          : 'bg-white text-gray-700 border-gray-100 hover:border-gray-300 hover:bg-gray-50'
          } ${isOpen ? 'ring-2 ring-[var(--app-accent1)]/10 border-[var(--app-accent1)]/50' : ''}`}
      >
        {Icon && <Icon size={16} className={`${isDark ? 'text-white' : 'text-gray-400'} shrink-0`} />}
        <span className="flex-1 text-start truncate tracking-tight">{selectedLabel}</span>
        <ChevronDown size={14} className={`opacity-70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu top-full left-0 right-0 mt-2 w-full max-h-[320px] overflow-y-auto custom-scrollbar">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setIsOpen(false); }}
              className={`dropdown-item ${value === o.value ? 'active' : ''}`}
            >
              <span className="truncate">{o.label}</span>
              {value === o.value && <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-[var(--app-accent1)]'} shadow-[0_0_10px_rgba(99,102,241,0.5)]`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SolidDatePicker({ value, onChange, min, label, lang }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const getDaysGrid = () => {
    let firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const grid = [];
    for (let i = startOffset - 1; i >= 0; i--) grid.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrevMonth: true });
    for (let i = 1; i <= daysInMonth; i++) grid.push({ day: i, isCurrentMonth: true });
    const remainingSlots = 42 - grid.length;
    for (let i = 1; i <= remainingSlots; i++) grid.push({ day: i, isCurrentMonth: false, isNextMonth: true });
    return grid;
  };

  const handlePrevMonth = (e) => { e.preventDefault(); setCurrentMonth(new Date(year, month - 1, 1)); };
  const handleNextMonth = (e) => { e.preventDefault(); setCurrentMonth(new Date(year, month + 1, 1)); };

  const handleDateClick = (item) => {
    let newDate;
    if (item.isPrevMonth) newDate = new Date(year, month - 1, item.day);
    else if (item.isNextMonth) newDate = new Date(year, month + 1, item.day);
    else newDate = new Date(year, month, item.day);
    const d = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000));
    onChange(d.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const isDateDisabled = (item) => {
    if (!min) return false;
    let newDate;
    if (item.isPrevMonth) newDate = new Date(year, month - 1, item.day);
    else if (item.isNextMonth) newDate = new Date(year, month + 1, item.day);
    else newDate = new Date(year, month, item.day);
    const minDate = new Date(min);
    newDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);
    return newDate < minDate;
  };

  const grid = getDaysGrid();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="relative w-full" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-4 py-3 text-gray-900 dark:text-[var(--app-text)] font-bold text-left flex justify-between items-center focus:outline-none focus:border-[var(--app-accent1)] transition-colors"
      >
        <span>{value || label}</span>
        <Calendar className="w-5 h-5 text-gray-400 dark:text-[var(--app-text-muted)]" />
      </button>

      {isOpen && (
        <div className={`dropdown-menu mt-2 w-[280px] ${lang === 'ar' ? 'left-0' : 'right-0'}`} dir="ltr">
          <div className="text-center font-extrabold text-base mb-3 pb-3 border-b border-gray-100/20 dark:border-white/10 tracking-wide">
            {monthNames[month]} {year}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-bold text-gray-500 dark:text-[var(--app-text)] tracking-wider">
            <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
          </div>
          <div className="grid grid-cols-7 gap-1 gap-y-1 mb-3">
            {grid.map((item, i) => {
              const disabled = isDateDisabled(item);
              let itemDate;
              if (item.isPrevMonth) itemDate = new Date(year, month - 1, item.day);
              else if (item.isNextMonth) itemDate = new Date(year, month + 1, item.day);
              else itemDate = new Date(year, month, item.day);
              const d = new Date(itemDate.getTime() - (itemDate.getTimezoneOffset() * 60000));
              const itemDateStr = d.toISOString().split('T')[0];
              const isSelected = value === itemDateStr;

              return (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); !disabled && handleDateClick(item); }}
                  disabled={disabled}
                  className={`h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-xs transition-all duration-200 font-bold ${!item.isCurrentMonth ? 'text-gray-400 dark:text-[var(--app-accent1)]' : 'text-gray-800 dark:text-[var(--app-text)]'} ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-[var(--app-surface)] hover:scale-110 cursor-pointer'} ${isSelected && !disabled ? 'bg-[var(--app-accent1)] text-white shadow-md scale-110' : ''}`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
          <div className="flex justify-center items-center gap-3">
            <button onClick={handlePrevMonth} className="p-1.5 bg-gray-50 dark:bg-[var(--app-card)] hover:bg-gray-200 dark:hover:bg-[var(--app-hover)] hover:text-black border border-gray-200 dark:border-[var(--app-border)] rounded-lg transition-all">
              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-[var(--app-text)]" />
            </button>
            <button onClick={handleNextMonth} className="p-1.5 bg-gray-50 dark:bg-[var(--app-card)] hover:bg-gray-200 dark:hover:bg-[var(--app-hover)] hover:text-black border border-gray-200 dark:border-[var(--app-border)] rounded-lg transition-all">
              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-[var(--app-text)]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- API CONFIGURATION ---
const GEMINI_API_KEY = "proxied"; // Real key lives in backend; this just enables AI features in the UI.

// --- HELPER FUNCTION FOR BACKTICKS ---
const getBackticks = () => String.fromCharCode(96, 96, 96);

// --- AI API HELPER (proxied through our backend) ---
// Non-streaming version used for things like image prompt generation.
const fetchFromGemini = async (prompt, _apiKey, maxTokens = 512) => {
  const url = `${import.meta.env.BASE_URL}api/chat`;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
    if (!response.ok) {
      const body = await response.text();
      return body || '{"error": "AI is busy. Please try again."}';
    }
    const data = await response.json();
    return data.text || '{"error": "No response generated."}';
  } catch (error) {
    return '{"error": "Connection issue. Please try again."}';
  }
};

// Streaming version — calls /api/chat/stream, yields tokens via SSE.
// onDelta(chunk) is called for each text chunk as it arrives.
// Returns the full accumulated text when done.
const streamFromAPI = async (prompt, onDelta, maxTokens = 512) => {
  const url = `${import.meta.env.BASE_URL}api/chat/stream`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
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
        } catch { /* skip malformed */ }
      }
    }
    return full;
  } catch (err) {
    window.clearTimeout(timeout);
    throw err;
  }
};

// Convenience wrapper: streams into a React state setter so text appears word-by-word.
const streamText = async (prompt, setText) => {
  let accumulated = '';
  await streamFromAPI(prompt, (delta) => {
    accumulated += delta;
    setText(accumulated);
  });
  return accumulated;
};

const parseGeminiJSON = text => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.slice(start, end + 1));
    }
    return null;
  } catch (e) {
    return null;
  }
};
const cleanFallbackText = text => {
  if (!text) return "";
  const marker = getBackticks();
  return text.split(marker + 'json').join('').split(marker).join('').trim();
};
const hasArabicText = text => /[\u0600-\u06FF]/.test(String(text || ''));
const speakArabicFree = text => {
  if (!text || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice = voices.find(v => /^ar(-|_)?/i.test(v.lang) || /arab/i.test(v.name));
  utterance.lang = arabicVoice?.lang || 'ar-SA';
  utterance.voice = arabicVoice || null;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
};
const safeRender = val => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// --- TTS TEXT NORMALIZER ---
// Strips markdown formatting so "**Hello**" and "Hello" map to the same cache entry.
const normalizeTTSText = (raw) => raw
  .replace(/\*\*(.+?)\*\*/gs, '$1')
  .replace(/\*(.+?)\*/gs, '$1')
  .replace(/__(.+?)__/gs, '$1')
  .replace(/_(.+?)_/gs, '$1')
  .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
  .replace(/#{1,6}\s+/g, '')
  .replace(/\[(.+?)\]\(.+?\)/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

// --- AUDIO CACHE (IndexedDB) ---
// Stores synthesised audio as ArrayBuffers keyed by {text}|{voiceId} hash.
// A vocabulary app repeats the same words hundreds of times — caching them
// means ElevenLabs is called exactly once per unique (text, voice) pair,
// making the monthly quota effectively unlimited for normal usage.
const _CACHE_DB_NAME = 'venoxa-tts-v1';
const _CACHE_STORE = 'audio';
const _CACHE_MAX = 500; // max stored entries before LRU eviction

const _djb2 = s => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = Math.imul(h, 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
};
const _audioCacheKey = (text, voiceId) => _djb2(text.trim().toLowerCase() + '\x00' + voiceId);

let _audioCacheDb = null;
const _openAudioCache = () => {
  if (_audioCacheDb) return Promise.resolve(_audioCacheDb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(_CACHE_DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(_CACHE_STORE)) {
        const st = db.createObjectStore(_CACHE_STORE, { keyPath: 'k' });
        st.createIndex('ts', 'ts');
      }
    };
    req.onsuccess = e => { _audioCacheDb = e.target.result; resolve(_audioCacheDb); };
    req.onerror = () => reject(req.error);
  });
};

const _getCachedAudio = async (key) => {
  try {
    const db = await _openAudioCache();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(_CACHE_STORE, 'readonly')
        .objectStore(_CACHE_STORE).get(key);
      req.onsuccess = e => resolve(e.target.result?.buf ?? null);
      req.onerror = reject;
    });
  } catch { return null; }
};

const _setCachedAudio = async (key, arrayBuf) => {
  try {
    const db = await _openAudioCache();
    const tx = db.transaction(_CACHE_STORE, 'readwrite');
    const st = tx.objectStore(_CACHE_STORE);
    st.put({ k: key, buf: arrayBuf, ts: Date.now() });
    // Prune oldest entries when over the cap
    const cnt = st.count();
    cnt.onsuccess = () => {
      if (cnt.result > _CACHE_MAX) {
        const cur = st.index('ts').openCursor();
        let del = 0;
        cur.onsuccess = e => {
          const c = e.target.result;
          if (c && del < 60) { c.delete(); del++; c.continue(); }
        };
      }
    };
  } catch { /* non-critical */ }
};

const _playCachedAudio = async (arrayBuf) => {
  const blob = new Blob([arrayBuf], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  _currentTTSAudio = audio;
  return new Promise((resolve) => {
    const finish = () => {
      URL.revokeObjectURL(url);
      if (_currentTTSAudio === audio) _currentTTSAudio = null;
      resolve();
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  });
};

// --- ELEVENLABS TTS HELPER ---
// TTS calls are made DIRECTLY from the browser to ElevenLabs (not through the
// backend server). This is required because ElevenLabs free-tier blocks
// requests from server/cloud IPs (Replit production), but allows them from
// real user browser IPs.
const DEFAULT_ELEVENLABS_VOICE_ID = 'nPczCjzI2devNBz1zQrb'; // Brian — British male accent
// English voices (not trained on Arabic — swapped out automatically for Arabic text)
const ELEVENLABS_SARAH_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — British female accent
const ELEVENLABS_BRIAN_ID = 'nPczCjzI2devNBz1zQrb'; // Brian — British male accent
// True multilingual voices — handle Arabic correctly with eleven_multilingual_v2
const ARABIC_FEMALE_VOICE_ID = 'XB0fDUnXU5powFXDhCwa'; // Charlotte — multilingual female
const ARABIC_MALE_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George — multilingual male
const ELEVENLABS_VOICE_OPTIONS = [
  { id: 'nPczCjzI2devNBz1zQrb', label: 'Brian (British ♂)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah (British ♀)' },
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', label: 'Liam' },
  { id: 'XB0fDUnXU5powFXDhCwa', label: 'Charlotte' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice' },
  { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', label: 'Callum' },
];

// Tracks which TTS engine produced the last successful utterance.
// 'elevenlabs' | 'edge' | 'browser' | null
let _lastTTSEngine = null;
// Global accent preference — 'uk' or 'us'. Updated by the accent toggle.
let _voiceAccent = 'uk';

// Multilingual Neural voices are Microsoft's newest, most natural-sounding
// generation — they sound conversational and human, much closer to ElevenLabs
// quality than the older Neural voices. "BrianMultilingual" is the warm,
// confident American male voice the user wants.
const EDGE_VOICES = {
  uk: { male: 'charon', female: 'kore' },
  us: { male: 'puck', female: 'aoede' },
};

/**
 * edgeTTSSpeak(text, gender, voiceOverride, topLevelCacheKey?)
 * Free, unlimited Microsoft Edge TTS via the api-server proxy.
 * Caches audio in IndexedDB so any word heard once plays instantly from
 * cache on every future call — no network round-trip needed.
 * Returns true on success, false on failure (so caller can fall back).
 */
const edgeTTSSpeak = async (text, gender, voiceOverride, topLevelCacheKey) => {
  const accent = _voiceAccent === 'us' ? 'us' : 'uk';
  const genderKey = gender === 'female' ? 'female' : 'male';

  // 1. Try Groq (Orpheus) first as requested - very fast and high quality
  const okGroq = await groqTTSSpeak(text, genderKey);
  if (okGroq) return true;

  // 2. Try Kokoro second (Best local quality)
  const okKokoro = await kokoroTTSSpeak(text, genderKey, accent);
  if (okKokoro) return true;

  // 3. Try Gemini third (Cloud quality - works instantly with your key!)
  if (accent === 'us') {
    const okGemini = await geminiTTSSpeak(text, genderKey);
    if (okGemini) return true;
  }

  const voice = voiceOverride || EDGE_VOICES[accent][genderKey];
  const normalized = normalizeTTSText(text);
  const ck = _audioCacheKey(normalized, 'edge:' + voice);

  const cached = await _getCachedAudio(ck);
  if (cached) {
    await _playCachedAudio(cached);
    _lastTTSEngine = 'edge';
    return true;
  }

  try {
    const params = new URLSearchParams({ text: normalized, voice });
    const url = `${import.meta.env.BASE_URL}api/gemini-tts?${params}`;
    // Streaming playback — starts as soon as the first audio bytes arrive.
    const audio = new Audio(url);
    audio.preload = 'auto';
    _currentTTSAudio = audio;

    const wait = new Promise((resolve) => {
      audio.onended = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
    });

    // Background cache fill — does not block playback at all.
    fetch(url)
      .then(r => (r.ok ? r.arrayBuffer() : null))
      .then(buf => {
        if (!buf) return;
        _setCachedAudio(ck, buf);
        if (topLevelCacheKey && topLevelCacheKey !== ck) _setCachedAudio(topLevelCacheKey, buf);
      })
      .catch(() => { });

    await audio.play();
    _lastTTSEngine = 'edge';
    await wait;
    return true;
  } catch (err) {
    console.warn('[Venoxa] Gemini TTS (recreated Edge) failed:', err.message);
    return false;
  }
};

/**
 * High-quality, state-of-the-art TTS via Kokoro-FastAPI.
 * Proxies to the backend /api/kokoro-tts.
 * Falls back to Edge TTS if the service is unreachable.
 */
const kokoroTTSSpeak = async (text, gender, accent) => {
  // Map our accent/gender to Kokoro voice codes
  // US: af_heart (Female), am_fenrir (Male)
  // UK: bf_alice (Female), bm_george (Male)
  const prefix = (accent === 'uk' ? 'b' : 'a') + (gender === 'female' ? 'f' : 'm');
  const voices = {
    af: 'af_heart',
    am: 'am_fenrir',
    bf: 'bf_alice',
    bm: 'bm_george'
  };
  const voice = voices[prefix] || 'af_heart';

  const normalized = normalizeTTSText(text);
  const ck = _audioCacheKey(normalized, 'kokoro:' + voice);

  // 1. Cache hit - instant playback
  const cached = await _getCachedAudio(ck);
  if (cached) {
    await _playCachedAudio(cached);
    _lastTTSEngine = 'kokoro';
    return true;
  }

  // 2. Network synthesis
  try {
    const params = new URLSearchParams({ text: normalized, voice });
    const url = `${import.meta.env.BASE_URL}api/kokoro-tts?${params}`;

    const audio = new Audio(url);
    _currentTTSAudio = audio;

    const wait = new Promise((resolve) => {
      audio.onended = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
    });

    // Fill cache in background
    fetch(url)
      .then(r => (r.ok ? r.arrayBuffer() : null))
      .then(buf => buf && _setCachedAudio(ck, buf))
      .catch(() => { });

    await audio.play();
    _lastTTSEngine = 'kokoro';
    await wait;
    return true;
  } catch (err) {
    console.warn('[Venoxa] Kokoro TTS failed:', err.message);
    return false;
  }
};

/**
 * groqTTSSpeak(text, gender)
 * Ultra-fast synthesis via Groq's Orpheus model.
 * Proxies to /api/groq-tts.
 */
const groqTTSSpeak = async (text, gender) => {
  const voice = gender === 'female' ? 'alice' : 'adam';
  const normalized = normalizeTTSText(text);
  // Short limit for Orpheus on Groq (200 chars)
  if (normalized.length > 200) return false;

  const ck = _audioCacheKey(normalized, 'groq:' + voice);

  const cached = await _getCachedAudio(ck);
  if (cached) {
    await _playCachedAudio(cached);
    _lastTTSEngine = 'groq';
    return true;
  }

  try {
    const params = new URLSearchParams({ text: normalized, voice });
    const url = `${import.meta.env.BASE_URL}api/groq-tts?${params}`;
    const audio = new Audio(url);
    _currentTTSAudio = audio;
    const wait = new Promise((resolve) => {
      audio.onended = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
    });
    await audio.play();
    fetch(url).then(r => r.ok ? r.arrayBuffer() : null).then(buf => buf && _setCachedAudio(ck, buf)).catch(() => { });
    _lastTTSEngine = 'groq';
    await wait;
    return true;
  } catch {
    return false;
  }
};

/**
 * geminiTTSSpeak(text, gender)
 * High-quality synthesis via Google Gemini Multimodal.
 * Proxies to /api/gemini-tts. Works instantly with your Gemini API key.
 */
const geminiTTSSpeak = async (text, gender) => {
  // Use gender-appropriate Gemini voices
  const voice = gender === 'female' ? 'aoede' : 'puck';
  const normalized = normalizeTTSText(text);
  const ck = _audioCacheKey(normalized, 'gemini:' + voice);

  const cached = await _getCachedAudio(ck);
  if (cached) {
    await _playCachedAudio(cached);
    _lastTTSEngine = 'gemini';
    return true;
  }

  try {
    const params = new URLSearchParams({ text: normalized, voice });
    const url = `${import.meta.env.BASE_URL}api/gemini-tts?${params}`;
    const audio = new Audio(url);
    _currentTTSAudio = audio;
    const wait = new Promise((resolve) => {
      audio.onended = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
    });
    await audio.play();
    fetch(url).then(r => r.ok ? r.arrayBuffer() : null).then(buf => buf && _setCachedAudio(ck, buf)).catch(() => { });
    _lastTTSEngine = 'gemini';
    await wait;
    return true;
  } catch {
    return false;
  }
};


// Keeps a reference to the current Audio element so we can cancel it before
// starting a new utterance.
let _currentTTSAudio = null;

/**
 * elevenLabsSpeak(text, voiceId, interrupt = true)
 * Now purely Edge TTS (UK or US depending on accent toggle) with browser
 * speechSynthesis as the only fallback. ElevenLabs has been removed.
 */
const elevenLabsSpeak = async (text, voiceId = DEFAULT_ELEVENLABS_VOICE_ID, interrupt = true) => {
  if (!text || !text.trim()) return;

  const normalizedText = normalizeTTSText(text);
  if (!normalizedText) return;

  // Stop any currently-playing audio only if requested
  if (interrupt) {
    if (_currentTTSAudio) { _currentTTSAudio.pause(); _currentTTSAudio = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  const isArabic = hasArabicText(normalizedText);
  const gender = voiceId === ELEVENLABS_SARAH_ID ? 'female' : 'male';

  // --- Edge TTS (primary for all English text) ---
  if (!isArabic) {
    const ok = await edgeTTSSpeak(normalizedText, gender);
    if (ok) return;
  }

  // --- Browser speech synthesis (Arabic + Edge TTS failure fallback) ---
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (isArabic) {
      utterance.lang = 'ar-SA';
    } else {
      utterance.lang = _voiceAccent === 'us' ? 'en-US' : 'en-GB';
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find(v => v.lang === utterance.lang && !v.localService)
        || voices.find(v => v.lang === utterance.lang)
        || voices.find(v => v.lang.startsWith('en'));
      if (pick) utterance.voice = pick;
    }
    utterance.rate = 0.92;
    utterance.onstart = () => { _lastTTSEngine = 'browser'; };
    window.speechSynthesis.speak(utterance);
  }
};

/**
 * fetchTTSBlob(text, gender, accent)
 * Fetches the audio data as a Blob for pre-buffering.
 * Uses Groq (Orpheus) as the primary engine for speed.
 */
const fetchTTSBlob = async (text, gender, accent) => {
  const normalized = normalizeTTSText(text);
  const ck = _audioCacheKey(normalized, 'blob:' + (accent === 'us' ? 'us' : 'uk'));

  // Try local cache first
  const cached = await _getCachedAudio(ck);
  if (cached) return new Blob([cached], { type: 'audio/mpeg' });

  try {
    const voice = gender === 'female' ? 'alice' : 'adam';
    const params = new URLSearchParams({ text: normalized, voice });
    const url = `${import.meta.env.BASE_URL}api/groq-tts?${params}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed');
    const buf = await response.arrayBuffer();
    _setCachedAudio(ck, buf);
    return new Blob([buf], { type: 'audio/mpeg' });
  } catch (err) {
    // Fallback to Edge TTS (recreated as Gemini) if Groq fails
    try {
      const voice = EDGE_VOICES[accent === 'us' ? 'us' : 'uk'][gender];
      const params = new URLSearchParams({ text: normalized, voice });
      const url = `${import.meta.env.BASE_URL}api/gemini-tts?${params}`;
      const response = await fetch(url);
      const buf = await response.arrayBuffer();
      return new Blob([buf], { type: 'audio/wav' });
    } catch {
      return null;
    }
  }
};

/**
 * prefetchTTS(text, gender, accent)
 * Just a wrapper for fetchTTSBlob to keep compatibility or background fill.
 */
const prefetchTTS = (text, gender, accent) => {
  fetchTTSBlob(text, gender, accent).catch(() => { });
};

/**
 * _streamAudioResponse(response)
 * Pipes a streaming fetch Response into an <audio> element via MediaSource so
 * playback starts as soon as the first audio chunk arrives — no waiting for the
 * full download. Falls back to blob if MediaSource doesn't support audio/mpeg
 * (e.g. Firefox).
 */
const STREAM_MIME = 'audio/mpeg';
const _streamAudioResponse = async (response) => {
  const useMS = typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported(STREAM_MIME);

  if (!useMS) {
    // Blob fallback (Firefox / older Safari)
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentTTSAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); if (_currentTTSAudio === audio) _currentTTSAudio = null; };
    audio.onerror = () => { URL.revokeObjectURL(url); if (_currentTTSAudio === audio) _currentTTSAudio = null; };
    await audio.play();
    return audio;
  }

  const ms = new MediaSource();
  const url = URL.createObjectURL(ms);
  const audio = new Audio(url);
  _currentTTSAudio = audio;
  audio.onended = () => { URL.revokeObjectURL(url); if (_currentTTSAudio === audio) _currentTTSAudio = null; };
  audio.onerror = () => { URL.revokeObjectURL(url); if (_currentTTSAudio === audio) _currentTTSAudio = null; };

  // Begin playback immediately — browser starts as soon as enough data buffers
  const playPromise = audio.play();

  await new Promise(resolve => ms.addEventListener('sourceopen', resolve, { once: true }));
  const sb = ms.addSourceBuffer(STREAM_MIME);
  const reader = response.body.getReader();

  // Drain chunks into the SourceBuffer in the background
  (async () => {
    try {
      for (; ;) {
        const { done, value } = await reader.read();
        if (done) { if (ms.readyState === 'open') ms.endOfStream(); break; }
        if (sb.updating) await new Promise(r => sb.addEventListener('updateend', r, { once: true }));
        if (ms.readyState !== 'open') break;
        sb.appendBuffer(value);
      }
    } catch { /* stream aborted or audio element gone */ }
  })();

  await playPromise;
  return audio;
};

/**
 * cancelTTS()
 * Stops any in-progress ElevenLabs audio playback.
 */
const cancelTTS = () => {
  if (_currentTTSAudio) {
    _currentTTSAudio.pause();
    _currentTTSAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};

// --- DATA ---
const DEFAULT_VOCABULARY_LIST = [{
  word: "welfare",
  type: "n",
  level: "B2",
  meaning: "رفاهية، رعاية",
  example: "The government is responsible for public welfare.",
  synonyms: "Well-being, health"
}, {
  word: "widespread",
  type: "adj",
  level: "B2",
  meaning: "واسع الانتشار",
  example: "The news caused widespread concern.",
  synonyms: "Prevalent, extensive"
}, {
  word: "wholly",
  type: "adv",
  level: "C1",
  meaning: "كلياً، تماماً",
  example: "The decision was wholly unexpected.",
  synonyms: "Entirely, completely"
}, {
  word: "whereby",
  type: "adv",
  level: "C1",
  meaning: "بموجبه، بواسطته",
  example: "A system whereby students access resources.",
  synonyms: "By which, through which"
}, {
  word: "notwithstanding",
  type: "prep",
  level: "C1",
  meaning: "على الرغم من",
  example: "Notwithstanding the evidence, she believed him.",
  synonyms: "despite, in spite of"
}];
const GRAMMAR_LEVELS = [{
  level: "A1 - مبتدئ",
  topics: ["Subject Pronouns", "Verb to be", "Articles (a, an, the)", "Plural nouns", "Possessive adjectives", "Demonstratives", "Present Simple", "There is / There are", "Have / Has", "Can (ability & permission)", "Adjectives", "Prepositions of place & time", "Imperatives"]
}, {
  level: "A2 - أساسي",
  topics: ["Past Simple", "Past Simple questions & negatives", "Future with will and going to", "Present Continuous", "Countable & Uncountable nouns", "Comparatives & Superlatives", "Adverbs of frequency", "Object pronouns", "Possessive pronouns", "Quantifiers", "Prepositions of movement"]
}, {
  level: "B1 - تحت المتوسط",
  topics: ["Present Perfect Simple", "Present Perfect vs. Past Simple", "Present Perfect Continuous", "Past Continuous", "Future Continuous", "Be going to", "Modals", "Comparisons with as...as", "First Conditional", "Second Conditional", "Relative Clauses", "Question tags"]
}, {
  level: "B2 - فوق المتوسط",
  topics: ["Passive Voice", "Reported Speech", "Used to / Would", "Wish / If only", "Third Conditional", "Mixed Conditionals", "Modals of deduction", "Gerunds & Infinitives", "Complex sentences", "Future Perfect & Future Perfect Continuous"]
}, {
  level: "C1 - متقدم",
  topics: ["Inversion", "Emphasis (cleft sentences)", "Advanced Conditionals", "Subjunctive", "Nominalization", "Advanced Passive", "Phrasal verbs", "Collocations & idiomatic structures", "Reduced relative clauses", "Complex verb patterns"]
}];
const SPEAKING_TOPICS = ["محادثة حرة (Free Talk)", "السفر والمطارات (Travel & Airports)", "العمل والمقابلات (Work & Interviews)", "الهوايات والاهتمامات (Hobbies)", "الطعام والمطاعم (Food)", "التسوق (Shopping)", "الصحة واللياقة (Health & Fitness)", "التكنولوجيا الذكية (Technology)", "الرياضة (Sports)", "العائلة والأصدقاء (Family & Friends)", "التعليم والجامعة (Education)", "الترفيه والأفلام (Movies)", "الروتين اليومي (Daily Routine)", "خطط المستقبل (Future Plans)", "ذكريات الطفولة (Childhood)", "الثقافات والتقاليد (Cultures)", "البيئة والطبيعة (Environment)", "وسائل التواصل (Social Media)", "الكتب والأدب (Books)", "الأخبار والأحداث (News)", "الموضة والأزياء (Fashion)", "الفنون والموسيقى (Art & Music)", "العلوم والفضاء (Science)", "الأهداف والطموحات (Goals)", "وسائل النقل (Transportation)", "الحيوانات الأليفة (Pets)", "العطلات والمناسبات (Holidays)", "العلاقات الاجتماعية (Relationships)", "ريادة الأعمال (Entrepreneurship)", "التحديات والمصاعب (Challenges)"];

const formatCountdown = (nextReview) => {
  if (!nextReview) return '00:00:00';
  const diff = nextReview - Date.now();
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userLevel, setUserLevel] = useState(localStorage.getItem('userLevel') || 'B2');
  const [globalVocab, setGlobalVocab] = useState(() => {
    try {
      const saved = localStorage.getItem('venoxa_global_vocab');
      return saved ? JSON.parse(saved) : DEFAULT_VOCABULARY_LIST;
    } catch { return DEFAULT_VOCABULARY_LIST; }
  });
  const [phrasalVocab, setPhrasalVocab] = useState(() => JSON.parse(localStorage.getItem('venoxa_phrasal_vocab')) || []);
  const [idiomsVocab, setIdiomsVocab] = useState(() => JSON.parse(localStorage.getItem('venoxa_idioms_vocab')) || []);
  const [langeekVocab, setLangeekVocab] = useState(() => JSON.parse(localStorage.getItem('venoxa_langeek_vocab')) || []);
  const [speakingHistory, setSpeakingHistory] = useState(() => JSON.parse(localStorage.getItem('venoxa_speaking_history')) || []);
  const [writingHistory, setWritingHistory] = useState(() => JSON.parse(localStorage.getItem('venoxa_writing_history')) || []);

  useEffect(() => localStorage.setItem('venoxa_global_vocab', JSON.stringify(globalVocab)), [globalVocab]);
  useEffect(() => localStorage.setItem('venoxa_phrasal_vocab', JSON.stringify(phrasalVocab)), [phrasalVocab]);
  useEffect(() => localStorage.setItem('venoxa_idioms_vocab', JSON.stringify(idiomsVocab)), [idiomsVocab]);
  useEffect(() => localStorage.setItem('venoxa_langeek_vocab', JSON.stringify(langeekVocab)), [langeekVocab]);
  useEffect(() => localStorage.setItem('venoxa_speaking_history', JSON.stringify(speakingHistory)), [speakingHistory]);
  useEffect(() => localStorage.setItem('venoxa_writing_history', JSON.stringify(writingHistory)), [writingHistory]);
  const [srsRefreshTick, setSrsRefreshTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setSrsRefreshTick(t => t + 1), 30000);
    return () => clearInterval(int);
  }, []);
  const vocabDueCount = useMemo(() => {
    try {
      const srs = JSON.parse(localStorage.getItem('venoxa_srs_data')) || {};
      const now = Date.now();
      return globalVocab.filter(w => { const d = srs[w.word]; return d && d.nextReview <= now; }).length;
    } catch { return 0; }
  }, [globalVocab, srsRefreshTick]);
  const langeekDueCount = useMemo(() => {
    try {
      const srs = JSON.parse(localStorage.getItem('venoxa_langeek_srs_data')) || {};
      const now = Date.now();
      return langeekVocab.filter(w => { const d = srs[w.word]; return d && d.nextReview <= now; }).length;
    } catch { return 0; }
  }, [langeekVocab, srsRefreshTick]);
  const [theme, setTheme] = useState(localStorage.getItem('venoxa_theme') || 'light');
  const [lang, setLang] = useState(localStorage.getItem('venoxa_lang') || 'ar');
  useEffect(() => {
    localStorage.setItem('venoxa_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('venoxa_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  useEffect(() => {
    localStorage.setItem('userLevel', userLevel);
  }, [userLevel]);
  const renderContent = () => {
    const props = {
      userLevel,
      setUserLevel,
      AI_KEY: GEMINI_API_KEY,
      lang,
      theme
    };
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setTab={setActiveTab} {...props} />;
      case 'plan':
        return <StudyPlan {...props} globalVocab={globalVocab} />;
      case 'vocab':
        return <Vocabulary {...props} globalVocab={globalVocab} setGlobalVocab={setGlobalVocab} />;
      case 'phrasal':
        return <PhrasalVerbs {...props} phrasalVocab={phrasalVocab} setPhrasalVocab={setPhrasalVocab} />;
      case 'idioms':
        return <IdiomsSlang {...props} idiomsVocab={idiomsVocab} setIdiomsVocab={setIdiomsVocab} />;
      case 'grammar':
        return <Grammar {...props} />;
      case 'writing':
        return <Writing {...props} writingHistory={writingHistory} setWritingHistory={setWritingHistory} />;
      case 'speaking':
        return <Speaking {...props} speakingHistory={speakingHistory} setSpeakingHistory={setSpeakingHistory} />;
      case 'listening':
        return <ListeningReading type="listening" {...props} />;
      case 'reading':
        return <ListeningReading type="reading" {...props} />;
      case 'langeek':
        return <Langeek {...props} langeekVocab={langeekVocab} setLangeekVocab={setLangeekVocab} />;
      default:
        return <Dashboard setTab={setActiveTab} {...props} />;
    }
  };
  const navItems = [{
    id: 'dashboard',
    label: _resolveTranslation(lang, 'الرئيسية', 'Dashboard'),
    icon: Home
  }, {
    id: 'plan',
    label: _resolveTranslation(lang, 'خطة المذاكرة', 'Study Plan'),
    icon: Calendar
  }, {
    id: 'vocab',
    label: _resolveTranslation(lang, 'الكلمات والمراجعة', 'Vocabulary (SRS)'),
    icon: BookOpen,
    badge: vocabDueCount
  }, {
    id: 'phrasal',
    label: _resolveTranslation(lang, 'الأفعال المركبة', 'Phrasal Verbs'),
    icon: BookText
  }, {
    id: 'idioms',
    label: _resolveTranslation(lang, 'التعابير والعامية', 'Idioms & Slang'),
    icon: Quote
  }, {
    id: 'writing',
    label: _resolveTranslation(lang, 'الكتابة (AI)', 'Writing (AI)'),
    icon: PenTool
  }, {
    id: 'speaking',
    label: _resolveTranslation(lang, 'المحادثة والاتصال', 'Speaking (Call)'),
    icon: MessageSquare
  }, {
    id: 'grammar',
    label: _resolveTranslation(lang, 'القواعد (AI)', 'Grammar (AI)'),
    icon: FileText
  }, {
    id: 'listening',
    label: _resolveTranslation(lang, 'الاستماع', 'Listening'),
    icon: Headphones
  }, {
    id: 'reading',
    label: _resolveTranslation(lang, 'القراءة (AI)', 'Reading (AI)'),
    icon: Brain
  }, {
    id: 'langeek',
    label: _resolveTranslation(lang, 'لانجيك (PDF)', 'Langeek (PDF)'),
    icon: Archive,
    badge: langeekDueCount
  }];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-black' : 'bg-white'} font-sans`} dir={_resolveTranslation(lang, 'rtl', 'ltr')}>
      {/* ── Sidebar ── */}
      <aside className={`hidden lg:flex flex-col w-[280px] h-full shrink-0 z-50 border-e transition-all duration-300 ${theme === 'dark' ? 'bg-[var(--app-surface)] border-[var(--app-border)]' : 'bg-[var(--app-surface)] border-[var(--app-border)]'}`}>
        {/* Sidebar Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white dark:text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              فينوكسا<span className="text-[var(--app-accent1)]">.ai</span>
            </h1>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive ? (theme === 'dark' ? 'bg-[var(--app-card)] text-white shadow-md' : 'bg-white text-black shadow-sm border border-gray-100') : (theme === 'dark' ? 'text-[var(--app-text)] hover:bg-[var(--app-hover)] hover:text-black' : 'text-gray-500 hover:text-black hover:bg-white')}`}
              >
                <item.icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100'}`} />
                <span className="flex-1 text-start">{item.label}</span>
                {item.badge > 0 && (
                  <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-[var(--app-accent1)] text-white' : 'bg-gray-200 dark:bg-[var(--app-card)] text-gray-500'}`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 mt-auto border-t border-gray-100 dark:border-[var(--app-border)]">
          <div className="flex items-center gap-3">
            <LanguageDropdown lang={lang} setLang={setLang} theme={theme} />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all border ${theme === 'dark' ? 'bg-[var(--app-surface)] text-white border-[var(--app-card)] hover:border-white' : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className={`flex-1 h-full overflow-y-auto scroll-smooth transition-colors duration-300 print:overflow-visible print:h-auto ${theme === 'dark' ? 'bg-[var(--app-bg)]' : 'bg-[var(--app-bg)]'} ${isMobileMenuOpen ? 'overflow-hidden' : ''}`}>
        <div className={`p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 w-full max-w-[1400px] mx-auto print:p-0 print:pt-0`}>
          <div className="animate-fadeIn">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
function Dashboard({
  setTab,
  userLevel,
  AI_KEY,
  lang,
  theme
}) {
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  useEffect(() => {
    if (AI_KEY) {
      generateDailyInsight();
    } else {
      setInsight({
        quote: "Consistency is the key to mastery.",
        translated_quote: "الاستمرار هو مفتاح الإتقان.",
        pro_tip: "Try thinking in English for 5 minutes every morning.",
        translated_tip: "حاول التفكير بالإنجليزية لمدة 5 دقائق كل صباح."
      });
    }
  }, [userLevel, lang]);
  const generateDailyInsight = async () => {
    if (loadingInsight || !AI_KEY) return;
    setLoadingInsight(true);
    try {
      const prompt = `You are a helpful AI English coach.
      The user is at level ${userLevel}.
      Generate a unique JSON object with:
      1. "quote": An inspiring short English quote suitable for their level.
      2. "pro_tip": A short, actionable tip to improve their English today.
      3. "translated_quote": Translation of the quote into ${_resolveTranslation(lang, 'Arabic', 'English')}.
      4. "translated_tip": Translation of the tip into ${_resolveTranslation(lang, 'Arabic', 'English')}.
      Only return the JSON.`;
      const response = await fetchFromGemini(prompt, AI_KEY);
      const data = parseGeminiJSON(response);
      if (data && data.error) {
        setInsight({
          quote: data.error,
          translated_quote: "",
          pro_tip: "Please verify your API key configuration.",
          translated_tip: ""
        });
      } else if (data) {
        setInsight(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsight(false);
    }
  };
  const isDark = theme === 'dark';
  const t = {
    welcome: _resolveTranslation(lang, 'تعلّم الإنجليزية مع', 'Learn English with'),
    levelLabel: _resolveTranslation(lang, `المستوى ${userLevel}`, `Level ${userLevel}`),
    desc: _resolveTranslation(lang, 'جاهز لتطوير مستواك في اللغة الإنجليزية؟ يمكنك الآن إعداد خطتك الشخصية للوصول لهدفك في وقت قياسي.', 'Ready to improve your English? Set up your personalized plan to reach your goal in record time.'),
    createPlan: _resolveTranslation(lang, 'إنشاء الخطة والمستوى', 'Set Plan & Level'),
    quoteTitle: _resolveTranslation(lang, 'إلهام اليوم', 'Daily Inspiration'),
    tipTitle: _resolveTranslation(lang, `نصيحة ذكية للمستوى ${userLevel}`, `Smart Tip for Level ${userLevel}`),
    learningPaths: _resolveTranslation(lang, 'مسارات التعلم الأساسية', 'Core Learning Paths'),
    paths: [
      { id: 'vocab', icon: BookOpen, title: _resolveTranslation(lang, 'المفردات', 'Vocabulary'), desc: _resolveTranslation(lang, 'تعلّم مفردات الإنجليزية وراجعها بنظام التكرار.', 'Learn English vocabulary with spaced repetition.'), paletteIndex: 0 },
      { id: 'writing', icon: PenTool, title: _resolveTranslation(lang, 'الكتابة AI', 'Writing AI'), desc: _resolveTranslation(lang, 'اكتب نصوصاً وصحّحها مع الذكاء الاصطناعي.', 'Write and correct texts with AI.'), paletteIndex: 1 },
      { id: 'listening', icon: Headphones, title: _resolveTranslation(lang, 'الاستماع', 'Listening'), desc: _resolveTranslation(lang, 'درّب أذنك مع بودكاست حسب مستواك.', 'Train your ear with level-matched podcasts.'), paletteIndex: 2 },
      { id: 'speaking', icon: MessageSquare, title: _resolveTranslation(lang, 'المحادثة AI', 'Speaking AI'), desc: _resolveTranslation(lang, 'تدرّب على محادثات حقيقية مع AI.', 'Practice real conversations with AI.'), paletteIndex: 3 },
      { id: 'grammar', icon: Brain, title: _resolveTranslation(lang, 'القواعد AI', 'Grammar AI'), desc: _resolveTranslation(lang, 'دروس قواعد اللغة الإنجليزية التفاعلية.', 'Interactive English grammar lessons.'), paletteIndex: 4 },
    ]
  };
  const dotPositions = [
    [3, 8], [11, 5], [19, 12], [27, 3], [35, 9], [43, 15], [51, 6], [59, 11], [67, 4], [75, 13], [83, 7], [91, 10],
    [5, 30], [13, 25], [21, 35], [29, 28], [37, 22], [45, 38], [53, 27], [61, 33], [69, 20], [77, 36], [85, 24], [93, 31],
    [7, 55], [15, 48], [23, 62], [31, 50], [39, 58], [47, 44], [55, 65], [63, 52], [71, 60], [79, 47], [87, 68], [95, 56],
    [2, 80], [10, 75], [18, 88], [26, 82], [34, 72], [42, 85], [50, 78], [58, 90], [66, 74], [74, 83], [82, 70], [90, 87],
  ];
  return <div className="space-y-10 lg:space-y-16 animate-fadeIn">
    {/* ── Minimal Hero ── */}
    <div className="relative pt-12 pb-8 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-semibold tracking-wide uppercase transition-colors"
        style={{
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          color: isDark ? '#A1A1AA' : '#6B7280',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        }}>
        {t.levelLabel}
      </div>
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-black dark:text-white">
        {t.welcome} <span className="text-[var(--app-accent1)]">Venoxa</span>
      </h2>
      <p className="text-lg lg:text-xl mb-10 max-w-2xl mx-auto leading-relaxed text-gray-500 dark:text-gray-400">
        {t.desc}
      </p>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setTab('plan')}
          className="px-8 py-3 rounded-xl font-semibold bg-black dark:bg-white text-white dark:text-black transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
        >
          {t.createPlan}
        </button>
      </div>
    </div>

    {/* ── Quote + Tip ── */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="premium-card relative group">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.quoteTitle}</h3>
        </div>
        {loadingInsight ? (
          <div className="h-24 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[var(--app-accent1)] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 text-start rtl:text-right">
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed" dir="ltr">
              "{safeRender(insight?.quote)}"
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {safeRender(insight?.translated_quote)}
            </p>
          </div>
        )}
      </div>
      <div className="premium-card relative group">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[var(--app-accent2)]/10 text-[var(--app-accent2)]">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.tipTitle}</h3>
        </div>
        {loadingInsight ? (
          <div className="h-24 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[var(--app-accent2)] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 text-start rtl:text-right">
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed" dir="ltr">
              {safeRender(insight?.pro_tip)}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {safeRender(insight?.translated_tip)}
            </p>
          </div>
        )}
      </div>
    </div>

    {/* ── LanGeek Staggered Learning Paths ── */}
    <div>
      <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A] dark:text-[var(--app-text)] mb-5 flex items-center gap-2">
        <Activity className="w-5 h-5 text-gray-900 dark:text-black dark:text-white" /> {t.learningPaths}
      </h3>
      <div className="flex gap-3 sm:gap-4 items-start overflow-x-auto pb-6 sm:overflow-visible sm:pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {t.paths.map((path, i) => (
          <DashboardCard key={path.id} {...path} index={i} isDark={isDark} onClick={() => setTab(path.id)} />
        ))}
      </div>
    </div>
  </div>;
}
const CARD_PALETTES = [
  { bg: 'bg-white dark:bg-[var(--app-bg)]', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-[var(--app-accent1)]', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#A1A1AA]' },
  { bg: 'bg-white dark:bg-[var(--app-bg)]', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-[var(--app-accent2)]', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#A1A1AA]' },
  { bg: 'bg-white dark:bg-[var(--app-bg)]', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-[var(--app-accent1)]', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#A1A1AA]' },
  { bg: 'bg-white dark:bg-[var(--app-bg)]', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-rose-500', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#A1A1AA]' },
  { bg: 'bg-white dark:bg-[var(--app-bg)]', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-amber-500', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#A1A1AA]' },
];

function DashboardCard({ icon: Icon, title, desc, onClick, paletteIndex = 0, index = 0, isDark = false }) {
  const p = CARD_PALETTES[paletteIndex % CARD_PALETTES.length];
  return (
    <div
      onClick={onClick}
      className={`group relative flex-shrink-0 sm:flex-1 cursor-pointer overflow-hidden rounded-[32px] p-8 transition-all duration-500 border ${isDark ? 'bg-[var(--app-bg)] border-[var(--app-border)] hover:border-[var(--app-hover)] hover:bg-[var(--app-hover)]/10' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
      style={{ minWidth: '260px', minHeight: '220px' }}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${p.iconBg} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
        <Icon className={`w-6 h-6 ${p.iconColor}`} />
      </div>
      <div className="space-y-3 text-start rtl:text-right">
        <h3 className={`font-bold text-xl tracking-tight ${p.text}`}>{title}</h3>
        <p className={`text-sm leading-relaxed font-medium ${p.sub}`}>{desc}</p>
      </div>
      <div className="absolute top-6 right-6 rtl:right-auto rtl:left-6 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 rtl:-translate-x-2 rtl:group-hover:translate-x-0 transition-all duration-500">
        <div className="p-2 rounded-full bg-[var(--app-hover)]/20 text-[var(--app-hover)]">
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </div>
      </div>
    </div>
  );
}


function PlanWeekTable({
  weekNum,
  planData,
  userLevel,
  wordsPerDay,
  relevantGrammarTopics,
  t,
  formatTime,
  getVocabRange,
  getSpacedRepetition,
  dailyTotalMins,
  weeklyTotalMins,
  openVocabModal,
  openGrammarModal,
  interactive,
  completedCells,
  onToggleCell
}) {
  const B = "border-gray-200 dark:border-[var(--app-card)]";
  const headBase = `px-6 py-4 bg-gray-100 dark:bg-[var(--app-surface)] text-gray-800 dark:text-gray-100 font-bold text-[11px] uppercase tracking-widest text-center border-b ${B} sticky top-0 z-20`;
  const cellBase = `px-6 py-6 text-center border-b border-e ${B} relative transition-all duration-200`;

  return (
    <div className="premium-card overflow-hidden border border-gray-200 dark:border-[var(--app-border)]">
      <div className="overflow-x-auto">
        <table className="w-full border-separate [border-spacing:0] min-w-[900px]">
          <thead>
            <tr>
              <th className={`${headBase} border-e text-start pl-8 w-[220px]`}>{t.activity}</th>
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <th key={d} className={headBase}>
                  {t.day} {d}
                </th>
              ))}
              <th className={`${headBase} border-s w-[140px]`}>{t.summary}</th>
            </tr>
          </thead>
          <tbody>
            {planData.categories.map((cat, idx) => (
              <tr key={cat.id} className={`group hover:bg-indigo-50/30 dark:hover:bg-[var(--app-accent1)]/[0.03] transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-[var(--app-bg)]' : 'bg-gray-50/40 dark:bg-white/[0.01]'}`}>
                <td className={`px-8 py-6 border-b border-e ${B} font-bold text-[13px] text-gray-900 dark:text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] group-hover:scale-110 transition-transform">
                      <cat.icon className="w-4.5 h-4.5" />
                    </div>
                    {cat.name}
                  </div>
                </td>
                {[0, 1, 2, 3, 4, 5, 6].map(d => {
                  const cellKey = `${weekNum}-${cat.id}-${d}`;
                  const completion = completedCells?.[cellKey];
                  const isInteractive = interactive && (cat.id === 'vocab' || cat.id === 'grammar');
                  return (
                    <td
                      key={d}
                      className={`${cellBase} ${isInteractive ? 'cursor-pointer hover:bg-[var(--app-accent1)]/5' : ''}`}
                      onClick={isInteractive ? () => {
                        if (cat.id === 'vocab') openVocabModal(d);
                        if (cat.id === 'grammar') openGrammarModal(d);
                      } : undefined}
                      onContextMenu={interactive ? (e) => { e.preventDefault(); onToggleCell?.(weekNum, cat.id, d); } : undefined}
                    >
                      {completion && (
                        <div className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold ${completion === 'done' ? 'bg-[var(--app-accent2)]' : 'bg-rose-500'}`}>
                          {completion === 'done' ? '✓' : '✗'}
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center gap-1 min-h-[40px]">
                        {cat.id === 'vocab' ? (
                          <span className="text-sm font-bold text-gray-900 dark:text-white" dir="ltr">{getVocabRange(weekNum, d)}</span>
                        ) : cat.id === 'grammar' ? (
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 line-clamp-2 max-w-[80px]" dir="ltr">
                            {relevantGrammarTopics[((weekNum - 1) * 7 + d) % relevantGrammarTopics.length]}
                          </span>
                        ) : null}
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">{cat.mins}m</span>
                      </div>
                    </td>
                  );
                })}
                <td className={`px-6 py-6 border-b border-s ${B} text-center font-extrabold text-[13px] text-indigo-600 dark:text-indigo-300 bg-indigo-50/20 dark:bg-[var(--app-accent1)]/[0.05]`}>
                  {formatTime(cat.mins * 7)}
                </td>
              </tr>
            ))}

            {/* Summary Row */}
            <tr className="bg-gray-100/50 dark:bg-[var(--app-surface)]/80">
              <td className={`px-8 py-8 border-e ${B} font-extrabold text-sm text-gray-900 dark:text-white`}>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-emerald-100/50 dark:bg-[var(--app-accent2)]/10 text-emerald-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  {t.categories.total}
                </div>
              </td>
              {[0, 1, 2, 3, 4, 5, 6].map(d => (
                <td key={d} className={`px-6 py-8 text-center border-e ${B} font-extrabold text-sm text-gray-900 dark:text-white`}>
                  {formatTime(dailyTotalMins)}
                </td>
              ))}
              <td className={`px-6 py-8 border-s ${B} text-center font-black text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-[var(--app-accent2)]/[0.08]`}>
                {formatTime(weeklyTotalMins)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Words *per CEFR level* in the Venoxa wordlists (matches the public lesson catalogue).
const CEFR_LEVEL_WORDS = {
  A1: 609,
  A2: 1581,
  B1: 1850,
  B2: 2224,
  C1: 2481,
  C2: 2152
};
// Cumulative active vocabulary at the end of each level (running total of CEFR_LEVEL_WORDS).
// Used to auto-suggest the words-per-day pace from the user's chosen levels and dates.
const CEFR_VOCAB_TARGET = (() => {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  let acc = 0;
  const out = {};
  for (const lvl of order) {
    acc += CEFR_LEVEL_WORDS[lvl];
    out[lvl] = acc;
  }
  return out;
})();
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DEFAULT_SKILL_MINS = {
  listen: 30,
  read: 20,
  speak: 15,
  write: 10
};
const VOCAB_MINS = 10;
const GRAMMAR_MINS = 5;
const PLAN_STORAGE_KEY = 'venoxa-plan-v3';
function loadStoredPlan() {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function StudyPlan({
  userLevel,
  setUserLevel,
  lang,
  globalVocab,
  theme
}) {
  const stored = useMemo(() => loadStoredPlan(), []);
  const [targetLevel, setTargetLevel] = useState(stored?.targetLevel || 'C1');
  const todayISO = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(stored?.startDate || todayISO);
  const [targetDate, setTargetDate] = useState(stored?.targetDate || '');
  const [skillSettings, setSkillSettings] = useState(() => stored?.skillSettings || {
    listen: {
      useDefault: true,
      mins: DEFAULT_SKILL_MINS.listen
    },
    read: {
      useDefault: true,
      mins: DEFAULT_SKILL_MINS.read
    },
    speak: {
      useDefault: true,
      mins: DEFAULT_SKILL_MINS.speak
    },
    write: {
      useDefault: true,
      mins: DEFAULT_SKILL_MINS.write
    }
  });
  const [wordsMode, setWordsMode] = useState(stored?.wordsMode || 'auto'); // 'auto' | 'manual'
  const [totalInvestMinutes, setTotalInvestMinutes] = useState('');
  const [wordsManual, setWordsManual] = useState(stored?.wordsManual || 10);
  const [planMeta, setPlanMeta] = useState(stored?.planMeta || null); // serialisable plan
  const [currentWeek, setCurrentWeek] = useState(stored?.currentWeek || 1);
  const [vocabModal, setVocabModal] = useState(null);
  const [grammarModal, setGrammarModal] = useState(null);
  const [completedCells, setCompletedCells] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_completed_cells')) || {}; } catch { return {}; }
  });
  const toggleCellCompletion = (weekNum, catId, dayIdx) => {
    const key = `${weekNum}-${catId}-${dayIdx}`;
    setCompletedCells(prev => {
      const current = prev[key];
      const next = current === 'done' ? 'missed' : current === 'missed' ? null : 'done';
      const newData = { ...prev };
      if (next === null) delete newData[key]; else newData[key] = next;
      localStorage.setItem('venoxa_completed_cells', JSON.stringify(newData));
      return newData;
    });
  };
  const t = {
    title: _resolveTranslation(lang, 'إعداد خطة المذاكرة والمستوى', 'Set Up Study Plan & Level'),
    currentLvl: _resolveTranslation(lang, 'مستواك الحالي', 'Current Level'),
    targetLvl: _resolveTranslation(lang, 'المستوى المرغوب', 'Target Level'),
    startDateLbl: _resolveTranslation(lang, 'تاريخ بدء الخطة', 'Start Date'),
    dateLabel: _resolveTranslation(lang, 'تاريخ الوصول للهدف', 'Target Date'),
    skillsTitle: _resolveTranslation(lang, 'مدة كل مهارة يومياً', 'Daily time per skill'),
    skillsHint: _resolveTranslation(lang, 'فعّل "افتراضي" لاستخدام التوزيع الموصى به أو خصّص الدقائق يدوياً.', 'Toggle "Default" for the recommended pace, or customise the minutes.'),
    useDefault: _resolveTranslation(lang, 'افتراضي', 'Default'),
    minsUnit: _resolveTranslation(lang, 'دقيقة', 'min'),
    wordsTitle: _resolveTranslation(lang, 'الكلمات الجديدة يومياً', 'New words per day'),
    wordsAuto: _resolveTranslation(lang, 'تلقائي (حسب المستوى والتاريخ)', 'Auto (from levels & date)'),
    wordsManualLbl: _resolveTranslation(lang, 'يدوي', 'Manual'),
    wordsToLearn: _resolveTranslation(lang, 'كلمات يجب تعلمها', 'words to learn'),
    autoExplain: _resolveTranslation(lang, 'حساب تلقائي:', 'Auto-calculated:'),
    days: _resolveTranslation(lang, 'يوم', 'days'),
    perDay: _resolveTranslation(lang, '/ يوم', '/ day'),
    gen: _resolveTranslation(lang, 'توليد الجدول الأسبوعي', 'Generate Weekly Schedule'),
    week: _resolveTranslation(lang, 'الأسبوع', 'Week'),
    day: _resolveTranslation(lang, 'اليوم', 'Day'),
    reset: _resolveTranslation(lang, 'تعديل الخطة', 'Edit Plan'),
    exportPdf: _resolveTranslation(lang, 'طباعة كل الأسابيع', 'Print All Weeks'),
    exportCsv: _resolveTranslation(lang, 'تصدير CSV', 'Export CSV'),
    jumpWeek: _resolveTranslation(lang, 'الانتقال إلى الأسبوع', 'Jump to Week'),
    activity: _resolveTranslation(lang, 'النشاط', 'Activity'),
    summary: _resolveTranslation(lang, 'المجموع', 'Summary'),
    words: _resolveTranslation(lang, 'كلمات', 'words'),
    estimateTitle: _resolveTranslation(lang, 'ما الذي ستحتاج لتعلمه', 'What you will need to learn'),
    estimateHint: _resolveTranslation(lang, 'يتم حساب القيم تلقائياً من المستوى الحالي والمستوى المرغوب وتاريخ البداية والنهاية ووقت كل مهارة.', 'Auto-calculated from your current/target level, start & end dates, and the time you allocate per skill.'),
    rules: _resolveTranslation(lang, 'قاعدة', 'rules'),
    hours: _resolveTranslation(lang, 'ساعة', 'hours'),
    progressTitle: _resolveTranslation(lang, 'تقدمك في الخطة', 'Your plan progress'),
    weekProgress: _resolveTranslation(lang, 'تقدم الأسبوع', 'Week progress'),
    vocabProgress: _resolveTranslation(lang, 'تقدم المفردات', 'Vocabulary progress'),
    grammarProgress: _resolveTranslation(lang, 'تقدم القواعد', 'Grammar progress'),
    learned: _resolveTranslation(lang, 'تم تعلمه', 'learned'),
    mastered: _resolveTranslation(lang, 'تم إتقانه', 'mastered'),
    of: _resolveTranslation(lang, 'من', 'of'),
    weekOf: _resolveTranslation(lang, 'الأسبوع', 'Week'),
    invalidRange: _resolveTranslation(lang, 'يجب أن يكون تاريخ الهدف بعد تاريخ البداية', 'Target date must be after the start date'),
    vocabHeader: _resolveTranslation(lang, 'كلمات اليوم', 'Daily Vocabulary'),
    grammarHeader: _resolveTranslation(lang, 'قاعدة اليوم', 'Daily Grammar'),
    grammarTarget: _resolveTranslation(lang, 'القاعدة المطلوبة دراستها', 'Rule to study'),
    alertTime: _resolveTranslation(lang, 'يرجى تحديد وقت المذاكرة لكل مهارة!', 'Please set a study time for at least one skill!'),
    alertDate: _resolveTranslation(lang, 'يرجى تحديد تاريخ الهدف بشكل صحيح!', 'Please select a valid target date!'),
    spacedRep: _resolveTranslation(lang, 'مراجعة متباعدة', 'Spaced Review'),
    totalInvestTitle: _resolveTranslation(lang, 'إجمالي وقت المذاكرة اليومي', 'Total Daily Study Time'),
    totalInvestPlaceholder: _resolveTranslation(lang, '60', '60'),
    divideBtn: _resolveTranslation(lang, 'تقسيم الوقت تلقائياً', 'Auto-Divide Time'),
    categories: {
      listen: _resolveTranslation(lang, 'استماع', 'Listening'),
      read: _resolveTranslation(lang, 'قراءة', 'Reading'),
      speak: _resolveTranslation(lang, 'محادثة', 'Speaking'),
      write: _resolveTranslation(lang, 'كتابة', 'Writing'),
      vocab: _resolveTranslation(lang, 'مفردات', 'Vocabulary'),
      grammar: _resolveTranslation(lang, 'قواعد', 'Grammar'),
      total: _resolveTranslation(lang, 'المجموع اليومي', 'Daily Total')
    }
  };

  // Effective minutes for each editable skill (default value when toggle is on, custom otherwise).
  const effectiveSkillMins = id => {
    const s = skillSettings[id];
    if (!s) return DEFAULT_SKILL_MINS[id] || 0;
    return s.useDefault ? DEFAULT_SKILL_MINS[id] : Math.max(0, parseInt(s.mins, 10) || 0);
  };

  // Number of days between start and target dates (inclusive of effort).
  const daysToTarget = useMemo(() => {
    if (!startDate || !targetDate) return 0;
    const s = new Date(startDate);
    const e = new Date(targetDate);
    if (!(e > s)) return 0;
    return Math.ceil((e - s) / 86400000);
  }, [startDate, targetDate]);

  // Total NEW words to learn = sum of CEFR_LEVEL_WORDS for every level strictly above the user's current.
  const wordsDelta = useMemo(() => {
    const curIdx = LEVEL_ORDER.indexOf(userLevel);
    const tgtIdx = LEVEL_ORDER.indexOf(targetLevel);
    if (curIdx < 0 || tgtIdx < 0 || tgtIdx <= curIdx) return 0;
    let total = 0;
    for (let i = curIdx + 1; i <= tgtIdx; i++) total += CEFR_LEVEL_WORDS[LEVEL_ORDER[i]];
    return total;
  }, [userLevel, targetLevel]);

  // Total grammar rules across every level from current+1 up to target (inclusive).
  const rulesDelta = useMemo(() => {
    const curIdx = LEVEL_ORDER.indexOf(userLevel);
    const tgtIdx = LEVEL_ORDER.indexOf(targetLevel);
    if (curIdx < 0 || tgtIdx < 0 || tgtIdx <= curIdx) return 0;
    let total = 0;
    for (let i = curIdx + 1; i <= tgtIdx; i++) {
      const lvlKey = LEVEL_ORDER[i];
      const entry = GRAMMAR_LEVELS.find(g => g.level.startsWith(lvlKey));
      if (entry) total += entry.topics.length;
    }
    return total;
  }, [userLevel, targetLevel]);

  // Auto words-per-day: split the vocabulary delta over the days available.
  const autoWordsPerDay = useMemo(() => {
    if (!daysToTarget) return 10;
    if (wordsDelta === 0) return 5;
    return Math.max(1, Math.min(80, Math.ceil(wordsDelta / daysToTarget)));
  }, [wordsDelta, daysToTarget]);
  const wordsPerDay = planMeta?.wordsPerDay ?? (wordsMode === 'auto' ? autoWordsPerDay : Math.max(1, parseInt(wordsManual, 10) || 1));

  // Build the rich category list (with icons / colours) from the persisted minutes payload.
  const categories = useMemo(() => {
    if (!planMeta) return [];
    const m = planMeta.mins;
    return [{
      id: 'listen',
      name: t.categories.listen,
      icon: Headphones,
      mins: m.listen,
      textColor: 'text-indigo-600 dark:text-indigo-400'
    }, {
      id: 'read',
      name: t.categories.read,
      icon: BookText,
      mins: m.read,
      textColor: 'text-emerald-600 dark:text-emerald-400'
    }, {
      id: 'speak',
      name: t.categories.speak,
      icon: MessageSquare,
      mins: m.speak,
      textColor: 'text-rose-600 dark:text-rose-400'
    }, {
      id: 'write',
      name: t.categories.write,
      icon: PenTool,
      mins: m.write,
      textColor: 'text-indigo-600 dark:text-indigo-400'
    }, {
      id: 'vocab',
      name: t.categories.vocab,
      icon: BookOpen,
      mins: m.vocab,
      textColor: 'text-emerald-600 dark:text-emerald-400'
    }, {
      id: 'grammar',
      name: t.categories.grammar,
      icon: Brain,
      mins: m.grammar,
      textColor: 'text-indigo-600 dark:text-indigo-400'
    }];
  }, [planMeta, lang]);

  // The shape that PlanWeekTable / older code expects.
  const planData = planMeta ? {
    totalWeeks: planMeta.totalWeeks,
    categories,
    wordsPerDay
  } : null;

  // Persist everything that should survive a page reload.
  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({
        targetLevel,
        startDate,
        targetDate,
        skillSettings,
        wordsMode,
        wordsManual,
        planMeta,
        currentWeek
      }));
    } catch {/* quota or private mode — silently ignore */ }
  }, [targetLevel, startDate, targetDate, skillSettings, wordsMode, wordsManual, planMeta, currentWeek]);

  // Live pre-generation summary: total minutes per skill across the whole plan.
  const planEstimate = useMemo(() => {
    if (!daysToTarget) return null;
    const wpd = wordsMode === 'auto' ? autoWordsPerDay : Math.max(1, parseInt(wordsManual, 10) || 1);
    return {
      totalDays: daysToTarget,
      totalWeeks: Math.max(1, Math.ceil(daysToTarget / 7)),
      totalWords: wordsDelta || wpd * daysToTarget,
      wordsPerDay: wpd,
      totalRules: rulesDelta,
      hours: {
        listen: effectiveSkillMins('listen') * daysToTarget / 60,
        read: effectiveSkillMins('read') * daysToTarget / 60,
        speak: effectiveSkillMins('speak') * daysToTarget / 60,
        write: effectiveSkillMins('write') * daysToTarget / 60
      }
    };
  }, [daysToTarget, wordsDelta, rulesDelta, skillSettings, wordsMode, wordsManual, autoWordsPerDay]);
  const suitableVocab = useMemo(() => {
    const getLevelWeight = l => {
      if (!l) return 0;
      const str = l.toUpperCase();
      if (str.includes('A1')) return 1;
      if (str.includes('A2')) return 2;
      if (str.includes('B1')) return 3;
      if (str.includes('B2')) return 4;
      if (str.includes('C1')) return 5;
      if (str.includes('C2')) return 6;
      return 0;
    };
    const userWeight = getLevelWeight(userLevel) || 1;
    const filtered = globalVocab.filter(w => {
      const wWeight = getLevelWeight(w.level);
      return wWeight >= userWeight || wWeight === 0;
    });
    return filtered.length >= wordsPerDay ? filtered : globalVocab;
  }, [globalVocab, userLevel, wordsPerDay]);
  const relevantGrammarTopics = useMemo(() => {
    const levelsToInclude = GRAMMAR_LEVELS.filter(g => {
      return g.level.includes(userLevel) || g.level.includes(targetLevel);
    });
    if (levelsToInclude.length === 0) return GRAMMAR_LEVELS[2].topics;
    return levelsToInclude.flatMap(g => g.topics);
  }, [userLevel, targetLevel]);
  const generatePlan = () => {
    const mins = {
      listen: effectiveSkillMins('listen'),
      read: effectiveSkillMins('read'),
      speak: effectiveSkillMins('speak'),
      write: effectiveSkillMins('write'),
      vocab: VOCAB_MINS,
      grammar: GRAMMAR_MINS
    };
    const totalMins = mins.listen + mins.read + mins.speak + mins.write + mins.vocab + mins.grammar;
    if (totalMins <= 0) {
      alert(t.alertTime);
      return;
    }
    if (!startDate || !targetDate) {
      alert(t.alertDate);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(targetDate);
    if (!(end > start)) {
      alert(t.invalidRange);
      return;
    }
    const diffDays = Math.ceil((end - start) / 86400000);
    const calculatedWeeks = Math.max(1, Math.ceil(diffDays / 7));
    const wpd = wordsMode === 'auto' ? autoWordsPerDay : Math.max(1, parseInt(wordsManual, 10) || 1);
    setPlanMeta({
      totalWeeks: calculatedWeeks,
      mins,
      wordsPerDay: wpd
    });
    setCurrentWeek(1);
  };
  const setSkillDefault = (id, useDefault) => {
    setSkillSettings(prev => ({
      ...prev,
      [id]: {
        useDefault,
        mins: useDefault ? DEFAULT_SKILL_MINS[id] : prev[id]?.mins ?? DEFAULT_SKILL_MINS[id]
      }
    }));
  };
  const setSkillMins = (id, mins) => {
    setSkillSettings(prev => ({
      ...prev,
      [id]: {
        useDefault: false,
        mins: Math.max(0, parseInt(mins, 10) || 0)
      }
    }));
  };
  const handleAutoDivide = () => {
    const total = parseInt(totalInvestMinutes, 10);
    if (isNaN(total) || total <= 0) {
      alert(_resolveTranslation(lang, 'يرجى إدخال وقت صحيح!', 'Please enter a valid time!'));
      return;
    }
    // Simple logic to divide time based on a reasonable ratio
    // Listening: 30%, Reading: 25%, Speaking: 25%, Writing: 20%
    const listen = Math.round(total * 0.30);
    const read = Math.round(total * 0.25);
    const speak = Math.round(total * 0.25);
    const write = total - listen - read - speak;

    setSkillSettings({
      listen: { useDefault: false, mins: listen },
      read: { useDefault: false, mins: read },
      speak: { useDefault: false, mins: speak },
      write: { useDefault: false, mins: write }
    });
  };
  const handleNextWeek = () => {
    if (currentWeek < planData.totalWeeks) setCurrentWeek(prev => prev + 1);
  };
  const handlePrevWeek = () => {
    if (currentWeek > 1) setCurrentWeek(prev => prev - 1);
  };
  const openVocabModal = dayIndex => {
    const startIdx = ((currentWeek - 1) * 7 + dayIndex) * wordsPerDay;
    const dayWords = [];
    for (let i = 0; i < wordsPerDay; i++) {
      if (suitableVocab.length === 0) break;
      const globalIdx = (startIdx + i) % suitableVocab.length;
      dayWords.push(suitableVocab[globalIdx]);
    }
    setVocabModal({
      day: dayIndex + 1,
      words: dayWords
    });
  };
  const openGrammarModal = dayIndex => {
    const globalIdx = (currentWeek - 1) * 7 + dayIndex;
    const topic = relevantGrammarTopics[globalIdx % relevantGrammarTopics.length];
    setGrammarModal({
      day: dayIndex + 1,
      topic
    });
  };
  const handlePrint = () => {
    // Force light theme for printing — the dark theme is unreadable on paper.
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    if (wasDark) html.classList.remove('dark');
    const restore = () => {
      if (wasDark) html.classList.add('dark');
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    // Allow the browser one frame to recompute styles before opening the dialog.
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 50);
    });
  };
  const formatTime = mins => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };
  const getVocabRange = (weekIdx, dayIdx) => {
    const globalDay = (weekIdx - 1) * 7 + dayIdx + 1;
    const start = (globalDay - 1) * wordsPerDay + 1;
    const end = globalDay * wordsPerDay;
    return `${start}-${end}`;
  };
  // SRS review intervals (days after learning): +1, +4, +7, +12, +20
  // Derived from the user's spaced-repetition schedule spreadsheet.
  const SRS_REVIEW_OFFSETS = [1, 4, 7, 12, 20];
  const getSpacedRepetition = (weekIdx, dayIdx) => {
    const globalDay = (weekIdx - 1) * 7 + dayIdx + 1; // 1-indexed plan day
    const phases = [];
    for (const offset of SRS_REVIEW_OFFSETS) {
      const learnDay = globalDay - offset;
      if (learnDay >= 1) {
        const start = (learnDay - 1) * wordsPerDay + 1;
        const end = learnDay * wordsPerDay;
        phases.push(`${start}-${end}`);
      }
    }
    return phases;
  };
  const exportCSV = () => {
    if (!planData) return;
    const rows = [];
    const header = ['Week', 'Activity', ...[1, 2, 3, 4, 5, 6, 7].map(d => `Day ${d}`), 'Weekly Total'];
    rows.push(header);
    for (let w = 1; w <= planData.totalWeeks; w++) {
      planData.categories.forEach(cat => {
        const row = [`Week ${w}`, cat.name];
        for (let d = 0; d < 7; d++) {
          if (cat.id === 'vocab') {
            row.push(`${getVocabRange(w, d)} (${cat.mins}m)`);
          } else if (cat.id === 'grammar') {
            const idx = (w - 1) * 7 + d;
            const topic = relevantGrammarTopics[idx % relevantGrammarTopics.length] || '';
            row.push(`${topic} (${cat.mins}m)`);
          } else {
            row.push(`${cat.mins}m`);
          }
        }
        row.push(formatTime(cat.mins * 7));
        rows.push(row);
      });
      const srRow = [`Week ${w}`, t.spacedRep];
      for (let d = 0; d < 7; d++) {
        const phases = getSpacedRepetition(w, d);
        srRow.push(phases.length ? phases.join(' | ') : '-');
      }
      srRow.push('-');
      rows.push(srRow);
      const totalRow = [`Week ${w}`, t.categories.total];
      for (let d = 0; d < 7; d++) totalRow.push(formatTime(dailyTotalMins));
      totalRow.push(formatTime(weeklyTotalMins));
      rows.push(totalRow);
      rows.push([]);
    }
    const csv = rows.map(r => r.map(c => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `venoxa-study-plan-${userLevel}-to-${targetLevel}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const dailyTotalMins = planData?.categories.reduce((acc, cat) => acc + cat.mins, 0) || 0;
  const weeklyTotalMins = dailyTotalMins * 7;
  const todayStr = new Date().toISOString().split('T')[0];
  return <div className="space-y-8 animate-fadeIn print:m-0 print:p-0">
    {!planData && <div className="bg-white dark:bg-[var(--app-card)] p-5 sm:p-8 lg:p-12 rounded-xl border border-gray-200 dark:border-[var(--app-border)] relative overflow-hidden transition-colors">

      <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-5 lg:mb-8 text-gray-900 dark:text-[var(--app-text)] flex items-center gap-3 relative z-10">
        <Sparkles className="text-black dark:text-white w-8 h-8" /> {t.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5 lg:mb-8 relative z-50">
        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 flex flex-col justify-center">
          <label className="block text-sm text-gray-500 dark:text-[var(--app-text)] mb-2 font-semibold">{t.currentLvl}</label>
          <CustomDropdown 
            value={userLevel} 
            onChange={setUserLevel} 
            options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => ({ value: l, label: l }))} 
            theme={theme}
            className="w-full"
          />
        </div>

        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 flex flex-col justify-center">
          <label className="block text-sm text-gray-500 dark:text-[var(--app-text)] mb-2 font-semibold">{t.targetLvl}</label>
          <CustomDropdown 
            value={targetLevel} 
            onChange={setTargetLevel} 
            options={['A2', 'B1', 'B2', 'C1', 'C2'].map(l => ({ value: l, label: l }))} 
            theme={theme}
            className="w-full"
          />
        </div>

        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 flex flex-col justify-center relative z-50">
          <label className="block text-sm text-gray-500 dark:text-[var(--app-text)] mb-2 font-semibold">{t.startDateLbl}</label>
          <SolidDatePicker value={startDate} onChange={setStartDate} label="Start Date" lang={lang} />
        </div>

        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 flex flex-col justify-center relative z-50">
          <label className="block text-sm text-gray-500 dark:text-[var(--app-text)] mb-2 font-semibold">{t.dateLabel}</label>
          <SolidDatePicker min={startDate || todayStr} value={targetDate} onChange={setTargetDate} label="Target Date" lang={lang} />
        </div>
      </div>

      {/* Per-skill durations with a Default toggle */}
      <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 mb-6 relative z-10">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
            <Clock className="w-5 h-5 text-black dark:text-white" /> {t.skillsTitle}
          </h3>
          <span className="text-xs text-gray-500 dark:text-[var(--app-text)]">{t.skillsHint}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {/* Smart Auto-Divide Tool */}
          <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-3 transition-all hover:border-gray-300 dark:hover:border-gray-600 flex flex-col justify-between h-full shadow-sm relative overflow-hidden group">
            <div className="mb-2">
              <div className="flex items-center gap-2 font-bold text-black dark:text-white">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-[12px] sm:text-[13px] leading-tight font-extrabold uppercase tracking-tight">{t.totalInvestTitle}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-auto">
              <input
                type="number"
                placeholder={t.totalInvestPlaceholder}
                value={totalInvestMinutes}
                onChange={e => setTotalInvestMinutes(e.target.value)}
                className="no-spinner w-full max-w-[100px] h-11 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-lg px-2 text-gray-900 dark:text-[var(--app-text)] font-bold text-center text-lg focus:outline-none focus:border-[var(--app-accent1)] shadow-sm min-w-0"
                style={{ textAlign: 'center' }}
              />
              <button
                onClick={handleAutoDivide}
                className="bg-gray-100 dark:bg-[var(--app-bg)] hover:bg-gray-200 dark:hover:bg-black text-black dark:text-white w-11 h-11 rounded-lg transition-all border border-gray-200 dark:border-[var(--app-border)] shadow-sm active:scale-95 flex items-center justify-center shrink-0"
                title={t.divideBtn}
              >
                <Zap className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>

          {[{
            id: 'listen',
            label: t.categories.listen,
            Icon: Headphones,
            color: 'text-black dark:text-white',
            ring: 'focus:border-[var(--app-accent1)]'
          }, {
            id: 'read',
            label: t.categories.read,
            Icon: BookText,
            color: 'text-emerald-600 dark:text-black dark:text-white',
            ring: 'focus:border-[var(--app-accent2)]'
          }, {
            id: 'speak',
            label: t.categories.speak,
            Icon: MessageSquare,
            color: 'text-pink-600 dark:text-pink-400',
            ring: 'focus:border-pink-500'
          }, {
            id: 'write',
            label: t.categories.write,
            Icon: PenTool,
            color: 'text-indigo-600 dark:text-[var(--app-accent2)]',
            ring: 'focus:border-[var(--app-accent1)]'
          }].map(({
            id,
            label,
            Icon,
            color,
            ring
          }) => {
            const s = skillSettings[id] || {
              useDefault: true,
              mins: DEFAULT_SKILL_MINS[id]
            };
            return <div key={id} className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-3 transition-all hover:border-gray-300 dark:hover:border-gray-600 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className={`flex items-center gap-2 font-bold ${color} min-w-0`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs sm:text-sm leading-tight truncate">{label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] font-bold uppercase tracking-tight ${s.useDefault ? 'text-black dark:text-white' : 'text-gray-400 dark:text-[var(--app-accent1)]'}`}>{t.useDefault}</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input type="checkbox" className="sr-only peer" checked={s.useDefault} onChange={e => setSkillDefault(id, e.target.checked)} />
                    <span className="block w-8 h-4 bg-gray-300 dark:bg-[var(--app-card)] rounded-full peer-checked:bg-[var(--app-accent1)] transition-colors"></span>
                    <span className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-auto">
                <input type="number" min="0" max="240" value={s.useDefault ? DEFAULT_SKILL_MINS[id] : s.mins} disabled={s.useDefault} onChange={e => setSkillMins(id, e.target.value)} className={`no-spinner w-full max-w-[100px] h-11 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-lg px-2 text-gray-900 dark:text-[var(--app-text)] font-bold text-center text-lg focus:outline-none ${ring} disabled:opacity-60 disabled:cursor-not-allowed min-w-0`} style={{ textAlign: 'center' }} />
                <span className="text-[11px] text-gray-500 dark:text-[var(--app-text)] font-bold whitespace-nowrap">{t.minsUnit}</span>
              </div>
            </div>;
          })}
        </div>
      </div>

      {/* Words per day — auto vs manual */}
      <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 mb-8 relative z-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--app-accent2)]" /> {t.wordsTitle}
          </h3>
          <div className="inline-flex bg-white dark:bg-[var(--app-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-1 text-sm font-bold">
            <button onClick={() => setWordsMode('auto')} className={`px-3 py-1.5 rounded-lg transition-colors ${wordsMode === 'auto' ? 'bg-[#FF0099] text-white' : 'text-gray-600 dark:text-[var(--app-text)] hover:bg-gray-100 dark:hover:bg-[var(--app-surface)]'}`}>
              {t.wordsAuto}
            </button>
            <button onClick={() => setWordsMode('manual')} className={`px-3 py-1.5 rounded-lg transition-colors ${wordsMode === 'manual' ? 'bg-[#FF0099] text-white' : 'text-gray-600 dark:text-[var(--app-text)] hover:bg-gray-100 dark:hover:bg-[var(--app-surface)]'}`}>
              {t.wordsManualLbl}
            </button>
          </div>
        </div>

        {wordsMode === 'auto' ? <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-600 dark:text-[var(--app-text)]" dir="ltr">
            <span className="font-bold text-[#FF0099] dark:text-[var(--app-accent2)]">{userLevel} → {targetLevel}</span>
            {' '}·{' '}
            <span className="font-bold">{wordsDelta}</span> {t.wordsToLearn}
            {daysToTarget > 0 && <> · <span className="font-bold">{daysToTarget}</span> {t.days}</>}
          </div>
          <div className="text-2xl font-extrabold text-[#FF0099] dark:text-[var(--app-accent2)]" dir="ltr">
            {autoWordsPerDay} <span className="text-sm font-bold opacity-70">{t.perDay}</span>
          </div>
        </div> : <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-4 flex items-center gap-3 flex-wrap">
          <input type="number" min="1" max="100" value={wordsManual} onChange={e => setWordsManual(e.target.value)} className="no-spinner w-32 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-lg px-3 py-2 text-gray-900 dark:text-[var(--app-text)] font-extrabold text-center text-2xl focus:outline-none focus:border-[#FF0099]/30" />
          <input type="number" min="1" max="100" value={wordsManual} onChange={e => setWordsManual(e.target.value)} className="no-spinner w-32 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-lg px-3 py-2 text-gray-900 dark:text-[var(--app-text)] font-extrabold text-center text-2xl focus:outline-none focus:border-[var(--app-accent1)]" />
          <span className="font-bold text-gray-700 dark:text-[var(--app-text)]">{t.wordsToLearn} {t.perDay}</span>
        </div>}
      </div>

      {/* Live estimate of what the user will need to learn */}
      {planEstimate && <div className="bg-gradient-to-br from-blue-50 to-fuchsia-50 dark:from-[#0f1730] dark:to-[#22112e] border border-gray-200 dark:border-[var(--app-border)]/50 p-6 rounded-2xl mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black dark:text-white" /> {t.estimateTitle}
          </h3>
          <span className="text-xs text-gray-500 dark:text-[var(--app-text)] max-w-md text-end">{t.estimateHint}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[{
            label: t.days,
            value: planEstimate.totalDays,
            color: 'text-[var(--app-accent1)] dark:text-[var(--app-accent2)]',
            bg: 'bg-[#1E90FF]/70 dark:bg-[var(--app-accent2)]/10',
            Icon: Calendar
          }, {
            label: t.words,
            value: planEstimate.totalWords.toLocaleString(),
            color: 'text-[#FF0099] dark:text-[var(--app-accent2)]',
            bg: 'bg-fuchsia-100/70 dark:bg-fuchsia-900/20',
            Icon: BookOpen
          }, {
            label: t.rules,
            value: planEstimate.totalRules,
            color: 'text-[var(--app-accent1)] dark:text-orange-400',
            bg: 'bg-orange-100/70 dark:bg-orange-900/20',
            Icon: FileText
          }, {
            label: `${t.categories.listen} (${t.hours})`,
            value: planEstimate.hours.listen.toFixed(1),
            color: 'text-black dark:text-white',
            bg: 'bg-blue-100/70 dark:bg-[var(--app-accent1)]/10',
            Icon: Headphones
          }, {
            label: `${t.categories.read} (${t.hours})`,
            value: planEstimate.hours.read.toFixed(1),
            color: 'text-emerald-600 dark:text-black dark:text-white',
            bg: 'bg-emerald-100/70 dark:bg-[var(--app-accent1)]/10',
            Icon: BookText
          }, {
            label: `${t.categories.speak} (${t.hours})`,
            value: planEstimate.hours.speak.toFixed(1),
            color: 'text-pink-600 dark:text-pink-400',
            bg: 'bg-pink-100/70 dark:bg-pink-900/20',
            Icon: MessageSquare
          }, {
            label: `${t.categories.write} (${t.hours})`,
            value: planEstimate.hours.write.toFixed(1),
            color: 'text-indigo-600 dark:text-[var(--app-accent2)]',
            bg: 'bg-indigo-100/70 dark:bg-[var(--app-accent2)]/10',
            Icon: PenTool
          }, {
            label: t.wordsTitle,
            value: `${planEstimate.wordsPerDay} ${t.perDay}`,
            color: 'text-[#FF0099] dark:text-[var(--app-accent2)]',
            bg: 'bg-fuchsia-100/70 dark:bg-fuchsia-900/20',
            Icon: Sparkles
          }].map(({
            label,
            value,
            color,
            bg,
            Icon
          }, i) => <div key={i} className={`${bg} rounded-xl p-3 border border-white/40 dark:border-white/5`}>
              <div className={`flex items-center gap-1.5 text-[11px] font-bold ${color} opacity-90 uppercase tracking-wide`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </div>
              <div className={`text-2xl font-extrabold ${color} mt-1`} dir="ltr">{value}</div>
            </div>)}
        </div>
      </div>}

      <button onClick={generatePlan} className="w-full bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black rounded-xl py-4 font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-2">{t.gen}</button>
    </div>}

    {planData && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-6 md:p-8 animate-fadeIn transition-colors relative print:shadow-none print:border-none print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[var(--app-card)] px-3 py-2 rounded-xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm">
            <button onClick={_resolveTranslation(lang, handleNextWeek, handlePrevWeek)} disabled={_resolveTranslation(lang, currentWeek === planData.totalWeeks, currentWeek === 1)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[var(--app-surface)] disabled:opacity-30 transition-colors">
              {_resolveTranslation(lang, <ChevronRight className="w-5 h-5 text-gray-600 dark:text-[var(--app-text)]" />, <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[var(--app-text)]" />)}
            </button>
            <span className="font-bold text-black dark:text-white min-w-[110px] text-center text-base">
              {t.week} {currentWeek} <span className="text-sm opacity-60">/ {planData.totalWeeks}</span>
            </span>
            <button onClick={_resolveTranslation(lang, handlePrevWeek, handleNextWeek)} disabled={_resolveTranslation(lang, currentWeek === 1, currentWeek === planData.totalWeeks)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[var(--app-surface)] disabled:opacity-30 transition-colors">
              {_resolveTranslation(lang, <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[var(--app-text)]" />, <ChevronRight className="w-5 h-5 text-gray-600 dark:text-[var(--app-text)]" />)}
            </button>
          </div>
          <CustomDropdown 
            value={currentWeek} 
            onChange={val => setCurrentWeek(Number(val))} 
            options={Array.from({ length: planData.totalWeeks }, (_, i) => ({ value: i + 1, label: `${t.week} ${i + 1}` }))} 
            theme={theme}
            className="min-w-[120px]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm font-bold transition-colors px-4 py-2 rounded-lg shadow-sm">
            <Archive className="w-4 h-4" /> {t.exportCsv}
          </button>
          <button onClick={handlePrint} className="bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black flex items-center gap-2 text-sm font-bold transition-colors px-4 py-2 rounded-lg shadow-sm">
            <Printer className="w-4 h-4" /> {t.exportPdf}
          </button>
          <button onClick={() => setPlanMeta(null)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 text-sm font-bold transition-colors bg-gray-100 dark:bg-[var(--app-surface)] px-4 py-2 rounded-lg">
            <RotateCcw className="w-4 h-4" /> {t.reset}
          </button>
        </div>
      </div>

      {/* Per-skill progress sliders — auto-advance with the current week */}
      <div className="bg-gray-50 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)]/50 rounded-2xl p-5 mb-6 print:hidden">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-black dark:text-white" /> {t.progressTitle}
          </h3>
          <span className="text-sm font-bold text-gray-600 dark:text-[var(--app-text)]">
            {t.weekOf} {currentWeek} {t.of} {planData.totalWeeks}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            id: 'listen',
            label: t.categories.listen,
            Icon: Headphones,
            bar: 'from-blue-500 to-blue-400',
            text: 'text-black dark:text-white'
          }, {
            id: 'read',
            label: t.categories.read,
            Icon: BookText,
            bar: 'from-[var(--app-accent2)] to-emerald-400',
            text: 'text-emerald-600 dark:text-black dark:text-white'
          }, {
            id: 'speak',
            label: t.categories.speak,
            Icon: MessageSquare,
            bar: 'from-pink-500 to-pink-400',
            text: 'text-pink-600 dark:text-pink-400'
          }, {
            id: 'write',
            label: t.categories.write,
            Icon: PenTool,
            bar: 'from-[var(--app-accent1)] to-indigo-400',
            text: 'text-indigo-600 dark:text-[var(--app-accent2)]'
          }].map(({
            id,
            label,
            Icon,
            bar,
            text
          }) => {
            const pct = Math.round(currentWeek / planData.totalWeeks * 100);
            const cat = planData.categories.find(c => c.id === id);
            const completedHours = ((currentWeek - 1) * 7 * (cat?.mins || 0) / 60).toFixed(1);
            const totalHours = (planData.totalWeeks * 7 * (cat?.mins || 0) / 60).toFixed(1);
            return <div key={id} className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-1.5 font-bold ${text}`}>
                  <Icon className="w-4 h-4" /> {label}
                </div>
                <span className={`text-xs font-extrabold ${text}`} dir="ltr">{pct}%</span>
              </div>
              {/* Slider-style progress bar */}
              <div className="relative h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${bar} transition-all duration-500 ease-out rounded-full`} style={{
                  width: `${pct}%`
                }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border border-gray-300 transition-all duration-500 ease-out" style={{
                  left: `calc(${pct}% - 7px)`
                }} />
              </div>
              <div className="text-[11px] text-gray-500 dark:text-[var(--app-text)] mt-2 font-semibold" dir="ltr">
                {completedHours} / {totalHours} {t.hours}
              </div>
            </div>;
          })}
        </div>

        {/* Vocab + Grammar stat bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {(() => {
            const completedDays = Math.max(0, (currentWeek - 1) * 7);
            const totalDays = planData.totalWeeks * 7;
            const learnedWords = Math.min(completedDays * planData.wordsPerDay, planMeta?.totalWords || totalDays * planData.wordsPerDay);
            const totalWords = wordsDelta || totalDays * planData.wordsPerDay;
            const wordsPct = totalWords ? Math.round(learnedWords / totalWords * 100) : 0;
            const totalRules = rulesDelta || planData.totalWeeks;
            const masteredRules = Math.min(currentWeek - 1, totalRules);
            const rulesPct = totalRules ? Math.round(masteredRules / totalRules * 100) : 0;
            return [{
              label: t.vocabProgress,
              done: learnedWords.toLocaleString(),
              total: totalWords.toLocaleString(),
              pct: wordsPct,
              suffix: t.learned,
              bar: 'from-[var(--app-accent2)] to-purple-500',
              text: 'text-[#FF0099] dark:text-[var(--app-accent2)]'
            }, {
              label: t.grammarProgress,
              done: masteredRules,
              total: totalRules,
              pct: rulesPct,
              suffix: t.mastered,
              bar: 'from-orange-500 to-amber-500',
              text: 'text-[var(--app-accent1)] dark:text-orange-400'
            }].map((row, i) => <div key={i} className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 text-sm font-bold">
                <span className={row.text}>{row.label}</span>
                <span className={`${row.text}`} dir="ltr">{row.pct}%</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${row.bar} transition-all duration-500 ease-out rounded-full`} style={{
                  width: `${row.pct}%`
                }} />
              </div>
              <div className="text-[11px] text-gray-500 dark:text-[var(--app-text)] mt-2 font-semibold" dir="ltr">
                {row.done} / {row.total} {row.suffix}
              </div>
            </div>);
          })()}
        </div>
      </div>

      {/* Screen view: current week only */}
      <div className="print:hidden">
        <PlanWeekTable weekNum={currentWeek} planData={planData} userLevel={userLevel} wordsPerDay={wordsPerDay} relevantGrammarTopics={relevantGrammarTopics} t={t} formatTime={formatTime} getVocabRange={getVocabRange} getSpacedRepetition={getSpacedRepetition} dailyTotalMins={dailyTotalMins} weeklyTotalMins={weeklyTotalMins} openVocabModal={openVocabModal} openGrammarModal={openGrammarModal} interactive completedCells={completedCells} onToggleCell={toggleCellCompletion} />
      </div>

      {/* Print view: every week, page break between */}
      <div className="hidden print:block">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-black">{_resolveTranslation(lang, 'الجدول الأسبوعي للمذاكرة - Venoxa AI', 'Weekly Study Plan - Venoxa AI')}</h1>
          <p className="text-gray-700 mt-1 text-sm">{t.currentLvl}: {userLevel} | {t.targetLvl}: {targetLevel} | {planData.totalWeeks} {_resolveTranslation(lang, 'أسابيع', 'weeks')}</p>
        </div>
        {Array.from({
          length: planData.totalWeeks
        }, (_, i) => i + 1).map(w => <div key={w} className={w < planData.totalWeeks ? 'mb-6 break-after-page' : 'mb-6'}>
          <h2 className="text-lg font-bold text-black mb-2 text-center">{t.week} {w}</h2>
          <PlanWeekTable weekNum={w} planData={planData} userLevel={userLevel} wordsPerDay={wordsPerDay} relevantGrammarTopics={relevantGrammarTopics} t={t} formatTime={formatTime} getVocabRange={getVocabRange} getSpacedRepetition={getSpacedRepetition} dailyTotalMins={dailyTotalMins} weeklyTotalMins={weeklyTotalMins} openVocabModal={openVocabModal} openGrammarModal={openGrammarModal} interactive={false} completedCells={completedCells} />
        </div>)}
      </div>

      {vocabModal && <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn print:hidden ${lang === 'ar' ? 'lg:pr-[280px]' : 'lg:pl-[280px]'}`} onClick={() => setVocabModal(null)}>
        <div className="bg-white dark:bg-[var(--app-card)] rounded-xl max-w-sm w-full border border-gray-200 dark:border-[var(--app-border)] overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
          <div className="bg-[var(--app-accent1)] p-5 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5" /> {t.vocabHeader} ({t.day} {vocabModal.day})</h3>
              <p className="text-sm opacity-80 mt-0.5">{wordsPerDay} {t.wordsToLearn}</p>
            </div>
            <button onClick={() => setVocabModal(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar bg-gray-50 dark:bg-[var(--app-card)]">
            {vocabModal.words.length === 0 ? <p className="text-center text-gray-500 py-10">لا توجد كلمات متاحة، يرجى رفع ملف الكلمات.</p> : vocabModal.words.map((w, i) => <div key={i} className="flex flex-col p-4 bg-white dark:bg-[var(--app-card)] rounded-2xl border border-gray-100 dark:border-[var(--app-border)] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-7 h-7 rounded-full bg-fuchsia-100 dark:bg-[var(--app-accent2)]/10 text-[#FF0099] dark:text-[var(--app-accent2)] flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                <span className="font-extrabold text-lg text-gray-900 dark:text-[var(--app-text)]" dir="ltr">{safeRender(w?.word)}</span>
              </div>
              {w?.meaning && <span className="text-sm text-gray-500 dark:text-[var(--app-text)] mr-10">{safeRender(w.meaning)}</span>}
            </div>)}
          </div>
        </div>
      </div>}

      {grammarModal && <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn print:hidden ${lang === 'ar' ? 'lg:pr-[280px]' : 'lg:pl-[280px]'}`} onClick={() => setGrammarModal(null)}>
        <div className="bg-white dark:bg-[var(--app-card)] rounded-xl max-w-sm w-full border border-gray-200 dark:border-[var(--app-border)] overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
          <div className="bg-[#1E90FF] p-5 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> {t.grammarHeader} ({t.day} {grammarModal.day})</h3>
              <p className="text-sm opacity-80 mt-0.5">{t.grammarTarget}</p>
            </div>
            <button onClick={() => setGrammarModal(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-8 text-center bg-gray-50 dark:bg-[var(--app-card)]">
            <div className="inline-flex p-4 rounded-full bg-orange-100 dark:bg-[#1E90FF]/20 text-[var(--app-accent1)] dark:text-orange-400 mb-6 shadow-sm">
              <Target className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-4" dir="ltr">{safeRender(grammarModal.topic)}</h4>
            <p className="text-sm text-gray-500 dark:text-[var(--app-text)] leading-relaxed">
              {_resolveTranslation(lang, 'يمكنك التوجه لقسم "القواعد الشاملة" لطلب شرح مفصل لهذه القاعدة مع الأمثلة من معلم الذكاء الاصطناعي.', 'Head over to the "Comprehensive Grammar" section to get a detailed AI explanation of this rule.')}
            </p>
          </div>
        </div>
      </div>}

    </div>}
  </div>;
}
function Vocabulary({
  AI_KEY,
  userLevel,
  lang,
  globalVocab,
  setGlobalVocab,
  theme
}) {
  const [srsData, setSrsData] = useState(() => JSON.parse(localStorage.getItem('venoxa_srs_data')) || {});
  const [vocabMode, setVocabMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(int);
  }, []);
  const [levelFilter, setLevelFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiStory, setAiStory] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingContextStory, setLoadingContextStory] = useState(false);
  const [contextStory, setContextStory] = useState('');
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const t = {
    browse: _resolveTranslation(lang, 'تصفح الكلمات', 'Browse Words'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'قوائم الكلمات', 'Word Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    emptyLists: _resolveTranslation(lang, 'لا توجد كلمات في هذه القائمة حالياً.', 'No words in this list currently.'),
    rateWordsMsg: _resolveTranslation(lang, 'قيم الكلمات في قسم "تصفح الكلمات" لتظهر هنا.', 'Rate words in Browse mode to see them here.'),
    contextBtn: _resolveTranslation(lang, 'اربط كل الكلمات الصعبة في قصة واحدة', 'Link Hard Words in a Story'),
    smartCards: _resolveTranslation(lang, 'البطاقات الذكية المخصصة', 'Custom Smart Cards'),
    totalWords: _resolveTranslation(lang, 'إجمالي الكلمات المتاحة:', 'Total Available Words:'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث عن كلمة', 'Search Word'),
    filterLevel: _resolveTranslation(lang, 'تصفية بالمستوى', 'Filter by Level'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    noWords: _resolveTranslation(lang, 'لا توجد كلمات مطابقة', 'No matching words'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'لقد أنهيت جميع المراجعات المستحقة في هذا الوقت.', 'You have completed all due reviews.'),
    comeBackLater: _resolveTranslation(lang, 'عُد لاحقاً أو تصفح لتعلم المزيد.', 'Come back later or browse to learn more.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم كلمات جديدة', 'Browse and Learn New Words'),
    noMatch: _resolveTranslation(lang, 'لا توجد كلمات مطابقة لبحثك.', 'No words match your search.'),
    clearFilters: _resolveTranslation(lang, 'مسح الفلاتر', 'Clear Filters'),
    storyBtn: _resolveTranslation(lang, 'قصة للربط الذهني', 'Story for Memory'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    synonyms: _resolveTranslation(lang, 'مرادفات:', 'Synonyms:'),
    aiGenerated: _resolveTranslation(lang, 'مولدة بالذكاء الاصطناعي', 'AI Generated'),
    storyTitle: _resolveTranslation(lang, 'قصة ذكية للحفظ:', 'Smart Memory Story:'),
    clickToShow: _resolveTranslation(lang, 'انقر على البطاقة لإظهار المعنى والتقييم', 'Click the card to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };
  const dueCards = useMemo(() => {
    const now = Date.now();
    return globalVocab.filter(card => {
      const data = srsData[card.word];
      if (!data) return false;
      return data.nextReview <= now;
    });
  }, [globalVocab, srsData, tick]);
  const hardWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [globalVocab, srsData, tick]);
  const learningWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'good'), [globalVocab, srsData, tick]);
  const masteredWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'easy'), [globalVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;
  const parseCSVLine = line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const lines = text.split('\n');
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const rowArr = parseCSVLine(lines[i]);
        if (rowArr.length >= 4 && rowArr[0]) {
          parsedData.push({
            word: rowArr[0].replace(/^"|"$/g, ''),
            type: rowArr[1]?.replace(/^"|"$/g, '') || '',
            level: rowArr[2]?.replace(/^"|"$/g, '') || '',
            meaning: rowArr[3]?.replace(/^"|"$/g, '') || '',
            example: rowArr[4]?.replace(/^"|"$/g, '') || '',
            synonyms: rowArr[5]?.replace(/^"|"$/g, '') || ''
          });
        }
      }
      if (parsedData.length > 0) {
        setGlobalVocab(parsedData);
        setLevelFilter('All');
        setSearchQuery('');
        setVocabMode('browse');
        setUploadMessage(`تم رفع ${parsedData.length} كلمة بنجاح! ✅`);
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        setUploadMessage('لم يتم العثور على كلمات، تأكد من صيغة الملف ❌');
      }
    };
    reader.readAsText(file);
  };
  const filteredVocabList = useMemo(() => {
    return globalVocab.filter(item => {
      const matchesLevel = levelFilter === 'All' || item.level?.toUpperCase().includes(levelFilter.toUpperCase());
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = item.word.toLowerCase().includes(searchLower) || item.meaning && item.meaning.toLowerCase().includes(searchLower);
      return matchesLevel && matchesSearch;
    });
  }, [globalVocab, levelFilter, searchQuery]);
  const safeIndex = activeWordIndex < filteredVocabList.length ? activeWordIndex : 0;
  const card = vocabMode === 'review' ? dueCards[0] : filteredVocabList[safeIndex];
  useEffect(() => { setAiStory(''); setCardImage(null); setCollocationData(''); }, [card?.word]);
  useEffect(() => {
    if (vocabMode === 'browse' && filteredVocabList.length > 0 && activeWordIndex >= filteredVocabList.length) {
      setActiveWordIndex(0);
    }
  }, [filteredVocabList.length, activeWordIndex, vocabMode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = now;
    if (rating === 'again') nextReview = now + 1 * 60 * 1000; else if (rating === 'hard') nextReview = now + 10 * 60 * 1000; else if (rating === 'good') nextReview = now + 24 * 60 * 60 * 1000; else if (rating === 'easy') nextReview = now + 4 * 24 * 60 * 60 * 1000;
    const newData = {
      ...srsData,
      [card.word]: {
        nextReview,
        rating,
        lastReviewed: now
      }
    };
    setSrsData(newData);
    localStorage.setItem('venoxa_srs_data', JSON.stringify(newData));
    setShowMeaning(false);
    setAiStory('');
    setCollocationData('');
    setCardImage(null);
    if (vocabMode === 'browse') {
      setActiveWordIndex((safeIndex + 1) % filteredVocabList.length);
    }
  };
  const resetWordProgress = wordString => {
    const newData = {
      ...srsData
    };
    delete newData[wordString];
    setSrsData(newData);
    localStorage.setItem('venoxa_srs_data', JSON.stringify(newData));
  };
  // Play a word's pronunciation — respects the accent code directly
  const playAudio = async (accentCode, wordToPlay = card?.word) => {
    if (!wordToPlay) return;
    const voiceName = accentCode === 'en-US' ? EDGE_VOICES.us.male
      : accentCode === 'en-GB' ? EDGE_VOICES.uk.male
        : undefined;
    await edgeTTSSpeak(wordToPlay, 'male', voiceName);
  };

  const generateStory = async () => {
    if (loadingAi || aiStory || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `أنت معلم لغة إنجليزية مرح. قم بتأليف قصة قصيرة جداً ومضحكة (سطرين أو ثلاثة فقط) باللغة الإنجليزية تتضمن الكلمة "${card.word}" (والتي تعني: ${card.meaning}) لمساعدة طالب مستواه ${userLevel} على تذكرها بسهولة.
      بعد القصة الإنجليزية، أضف سطرين باللغة ${_resolveTranslation(lang, 'العربية', 'الإنجليزية')} تشرح فيهما كيف تم استخدام الكلمة في القصة.`;
      await streamText(prompt, setAiStory);
    } catch (err) {
      setAiStory(t.storyError);
    } finally {
      setLoadingAi(false);
    }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      // Step 1: ask the AI for a concrete, single-scene visual description that conveys the word's meaning.
      const briefPrompt = `You are a visual director. For the English word "${card.word}" (which means: ${card.meaning || 'see context'}), describe a SINGLE, concrete, photorealistic scene that captures the LITERAL meaning. 
Rules:
1. One subject, one action.
2. NO abstract concepts, NO metaphors unless they are very visual.
3. NO text, NO letters, NO symbols.
4. Describe colors, lighting, and composition.
5. Output ONLY a 15-word English description.`;
      let visual = '';
      try {
        const raw = await fetchFromGemini(briefPrompt, AI_KEY);
        const errJson = parseGeminiJSON(raw);
        if (!errJson || !errJson.error) {
          visual = String(raw || '').trim().split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
          // Strip surrounding quotes if the model wrapped them.
          visual = visual.replace(/^["'`]+|["'`]+$/g, '').trim();
        }
      } catch (_) {/* fall through to default */ }
      if (!visual) {
        visual = `A high-quality photorealistic professional photograph visually representing the concept of "${card.word}"`;
      }
      const finalPrompt = `${visual}. Cinematic lighting, 8k resolution, highly detailed, professional photography, masterpiece, sharp focus, no text, no watermark.`;
      const seed = Math.floor(Math.random() * 1_000_000);
      // Use a free, no-key image service (no quota) so this works without a paid Imagen key.
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(finalPrompt)}&width=640&height=420&seed=${seed}`);
    } catch (err) {
      console.error("Image generation error", err);
      const fallback = `Photorealistic image showing the meaning of the English word ${card.word} (${card.meaning || ''}), no text, no letters.`;
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(fallback)}&width=640&height=420`);
    } finally {
      setLoadingImage(false);
    }
  };
  const generateContextStory = async () => {
    if (hardWords.length === 0 || loadingContextStory) return;
    setLoadingContextStory(true);
    try {
      const wordsStr = hardWords.map(w => w.word).join(', ');
      const prompt = `You are a creative writing teacher. Use ALL of these words: [${wordsStr}] in a single short, coherent, and interesting story in English. The story should be accessible for a ${userLevel} learner. After the story, explain the context of each word in ${_resolveTranslation(lang, 'Arabic', 'English')}.`;
      await streamText(prompt, setContextStory);
    } catch (e) {
      setContextStory(t.storyError);
    } finally {
      setLoadingContextStory(false);
    }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English collocations dictionary similar to ozdic.com. For the word "${card.word}", list the most common and natural collocations grouped by grammatical pattern. Use this exact format (skip patterns with no collocations, max 6 per group):\nVERB + ${card.word}: verb1, verb2, verb3\nADJ + ${card.word}: adj1, adj2, adj3\n${card.word} + NOUN: noun1, noun2\n${card.word} + VERB: verb1, verb2\nPREPOSITION: in ~, at ~, on ~\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">

    <div className="flex bg-gray-50 dark:bg-[var(--app-surface)] p-1 rounded-xl w-full max-w-md mx-auto mb-10 border border-gray-100 dark:border-[var(--app-border)]">
      <button
        onClick={() => { setVocabMode('browse'); setShowMeaning(false); setCardImage(null); setAiStory(''); }}
        className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${vocabMode === 'browse' ? 'bg-white dark:bg-[var(--app-card)] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
      >
        {t.browse}
      </button>
      <button
        onClick={() => { setVocabMode('review'); setShowMeaning(false); setCardImage(null); setAiStory(''); }}
        className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all relative ${vocabMode === 'review' ? 'bg-white dark:bg-[var(--app-card)] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
      >
        {t.review}
        {dueCards.length > 0 && <span className="absolute -top-1 -right-1 bg-[var(--app-accent1)] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{dueCards.length}</span>}
      </button>
      <button
        onClick={() => { setVocabMode('lists'); setShowMeaning(false); setCardImage(null); setAiStory(''); }}
        className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${vocabMode === 'lists' ? 'bg-white dark:bg-[var(--app-card)] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
      >
        {t.lists}
      </button>
    </div>

    {vocabMode === 'lists' && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>

      {listTab === 'hard' && hardWords.length > 0 && <div className="mb-6">
        <button onClick={generateContextStory} disabled={loadingContextStory} className="w-full py-4 bg-orange-50 dark:bg-orange-600/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-[#1E90FF]/20 transition-all shadow-sm">
          {loadingContextStory ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> ✨ {t.contextBtn}</>}
        </button>
        {contextStory && <div className={`mt-4 p-5 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl border border-gray-200 dark:border-[var(--app-border)] ${_resolveTranslation(lang, 'text-right', 'text-left')} prose prose-orange dark:prose-invert max-w-none`}><div style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(contextStory)}</div></div>}
      </div>}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateWordsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          return <div key={item.word} className="flex justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 dark:border-[var(--app-border)] transition-colors group">
            <div className="flex items-center gap-3">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 dark:text-[var(--app-accent1)] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Remove word from SRS">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[var(--app-card)] border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>

            <div className="text-right" dir="ltr">
              <p className="text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center justify-end gap-3">
                <button onClick={() => playAudio('en-US', item.word)} className="text-gray-500 hover:text-black dark:text-white dark:hover:text-blue-400 transition-colors order-1"><Volume2 className="w-4 h-4" /></button>
                <span className="order-2">{safeRender(item.word)}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-[var(--app-text)] mt-1">{safeRender(item.meaning)}</p>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {vocabMode === 'browse' && <>
      {vocabMode === 'browse' && (
        <div className="space-y-6">
          <div className="premium-card p-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-1">{t.smartCards}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.totalWords} {globalVocab.length}</p>
            </div>
            <div className="flex items-center gap-4">
              {uploadMessage && <span className="text-xs font-bold text-[var(--app-accent2)] animate-pulse">{safeRender(uploadMessage)}</span>}
              <label className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[var(--app-surface)] text-gray-700 dark:text-gray-300 text-sm font-semibold hover:text-black dark:hover:text-white transition-all cursor-pointer border border-gray-100 dark:border-[var(--app-border)]">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" /> {t.uploadCSV}
                </div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="premium-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.searchWord}</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search words..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-100 dark:border-[var(--app-border)] rounded-xl text-sm outline-none focus:border-[var(--app-accent1)] transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.filterLevel}</label>
              <CustomDropdown 
                value={levelFilter} 
                onChange={setLevelFilter} 
                options={[{ value: 'All', label: 'All Levels' }, ...['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => ({ value: lvl, label: lvl }))]} 
                theme={theme}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{t.manualSelect} ({filteredVocabList.length})</label>
              <CustomDropdown 
                value={safeIndex} 
                onChange={val => { setActiveWordIndex(Number(val)); setShowMeaning(false); setAiStory(''); setCardImage(null); }} 
                options={filteredVocabList.length === 0 ? [{ value: 0, label: t.noWords }] : filteredVocabList.map((item, idx) => ({ value: idx, label: safeRender(item.word) }))} 
                theme={theme}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>}

    {vocabMode === 'review' && !card && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setVocabMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-xl font-bold">{t.browseLearn}</button>
    </div>}

    {vocabMode === 'browse' && (filteredVocabList.length === 0 || !card) && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[300px] flex flex-col items-center justify-center p-8 shadow-sm text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-[var(--app-accent1)] mb-4" />
      <h3 className="text-xl text-gray-600 dark:text-[var(--app-text)] font-bold">{t.noMatch}</h3>
    </div>}

    {card && vocabMode !== 'lists' && (
      <div className="w-full">
        <div
          className="premium-card min-h-[450px] flex flex-col items-center justify-center p-12 cursor-pointer relative group transition-all duration-500"
          onClick={() => setShowMeaning(!showMeaning)}
        >
          {/* Accent Badge */}
          <div className="absolute top-8 left-8 flex flex-col gap-3 z-10">
            <button onClick={e => { e.stopPropagation(); playAudio('en-US'); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-[var(--app-surface)] text-gray-400 hover:text-[var(--app-accent1)] transition-colors shadow-sm">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute top-8 right-8">
            <span className="px-3 py-1 rounded-lg bg-[var(--app-accent1)]/10 text-[var(--app-accent1)] text-xs font-bold tracking-wider">
              {safeRender(card.level)}
            </span>
          </div>

          {!showMeaning ? (
            <div className="text-center">
              <h3 className="text-5xl md:text-6xl font-bold tracking-tight text-black dark:text-white mb-8" dir="ltr">
                {safeRender(card.word)}
              </h3>
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                {t.clickToShow}
              </p>
            </div>
          ) : (
            <div className="text-center space-y-8 animate-fadeIn w-full">
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold text-black dark:text-white leading-tight">
                  {safeRender(card.meaning)}
                </h3>
              </div>

              {card.example && (
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-100 dark:border-[var(--app-border)]">
                  <p className="text-lg text-gray-700 dark:text-gray-300 italic" dir="ltr">
                    "{safeRender(card.example)}"
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={e => { e.stopPropagation(); generateStory(); }} className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-[var(--app-accent1)]/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-100 transition-colors">
                  <Sparkles className="w-4 h-4 inline mr-2" /> {t.storyBtn}
                </button>
                <button onClick={e => { e.stopPropagation(); generateImage(); }} className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-[var(--app-accent2)]/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-100 transition-colors">
                  <ImageIcon className="w-4 h-4 inline mr-2" /> {t.imgBtn}
                </button>
                {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold hover:bg-teal-100 transition-colors">
                  <BookOpen className="w-4 h-4 inline mr-2" /> {t.collocationsBtn}
                </button>}
              </div>
              {collocationData && <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-500/5 text-gray-700 dark:text-gray-300 text-xs font-mono text-left leading-relaxed mt-4 whitespace-pre-wrap">{safeRender(collocationData)}</div>}

              {aiStory && (
                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-[var(--app-accent1)]/5 text-gray-600 dark:text-gray-400 text-sm text-left leading-relaxed">
                  {safeRender(aiStory)}
                </div>
              )}

              {cardImage && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[var(--app-border)] shadow-sm">
                  <img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[300px] object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        {showMeaning && (
          <div className="grid grid-cols-4 gap-3 mt-8 animate-slideUp">
            {[
              { id: 'again', color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10', label: t.rateAgain, time: t.time1m },
              { id: 'hard', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10', label: t.rateHard, time: t.time10m },
              { id: 'good', color: 'text-[var(--app-accent2)] bg-[var(--app-accent2)]/10', label: t.rateGood, time: t.time1d },
              { id: 'easy', color: 'text-[var(--app-accent1)] bg-[var(--app-accent1)]/10', label: t.rateEasy, time: t.time4d }
            ].map(r => (
              <button
                key={r.id}
                onClick={(e) => { e.stopPropagation(); handleRate(r.id); }}
                className={`flex flex-col items-center py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 ${r.color}`}
              >
                <span className="text-sm">{r.label}</span>
                <span className="text-[10px] font-medium opacity-60 mt-1">{r.time}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )}
  </div>;
}
function PhrasalVerbs({ AI_KEY, userLevel, lang, phrasalVocab, setPhrasalVocab, theme }) {
  const [srsData, setSrsData] = useState(() => JSON.parse(localStorage.getItem('venoxa_phrasal_srs')) || {});
  const [mode, setMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiStory, setAiStory] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  useEffect(() => { const int = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(int); }, []);
  const t = {
    browse: _resolveTranslation(lang, 'تصفح', 'Browse'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'القوائم', 'Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث', 'Search'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    noWords: _resolveTranslation(lang, 'لا توجد عناصر مطابقة', 'No matching items'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'أنهيت جميع المراجعات المستحقة.', 'All due reviews completed.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم', 'Browse and Learn'),
    clickToShow: _resolveTranslation(lang, 'انقر لإظهار المعنى والتقييم', 'Click to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    storyBtn: _resolveTranslation(lang, 'قصة للربط الذهني', 'Story for Memory'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    totalItems: _resolveTranslation(lang, 'إجمالي الأفعال:', 'Total phrasal verbs:'),
    emptyLists: _resolveTranslation(lang, 'لا توجد عناصر في هذه القائمة.', 'No items in this list.'),
    rateItemsMsg: _resolveTranslation(lang, 'قيم العناصر في قسم "تصفح" لتظهر هنا.', 'Rate items in Browse mode to see them here.'),
    csvHint: _resolveTranslation(lang, 'الصيغة: الفعل المركب، المعنى، الجملة', 'Format: phrasal verb, meaning, sentence'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };
  const dueCards = useMemo(() => { const now = Date.now(); return phrasalVocab.filter(c => { const d = srsData[c.word]; return d && d.nextReview <= now; }); }, [phrasalVocab, srsData, tick]);
  const hardWords = useMemo(() => phrasalVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [phrasalVocab, srsData, tick]);
  const learningWords = useMemo(() => phrasalVocab.filter(w => srsData[w.word]?.rating === 'good'), [phrasalVocab, srsData, tick]);
  const masteredWords = useMemo(() => phrasalVocab.filter(w => srsData[w.word]?.rating === 'easy'), [phrasalVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;
  const parseCSVLine = line => { const result = []; let current = ''; let inQuotes = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"' && line[i + 1] === '"') { current += '"'; i++; } else if (char === '"') { inQuotes = !inQuotes; } else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; } else { current += char; } } result.push(current.trim()); return result; };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const lines = e.target.result.split('\n');
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const r = parseCSVLine(lines[i]);
        if (r.length >= 2 && r[0]) parsedData.push({ word: r[0].replace(/^"|"$/g, ''), meaning: r[1]?.replace(/^"|"$/g, '') || '', example: r[2]?.replace(/^"|"$/g, '') || '' });
      }
      if (parsedData.length > 0) {
        setPhrasalVocab(parsedData);
        localStorage.setItem('venoxa_phrasal_vocab', JSON.stringify(parsedData));
        setSearchQuery(''); setMode('browse');
        setUploadMessage(`✅ ${parsedData.length} phrasal verbs uploaded!`);
        setTimeout(() => setUploadMessage(''), 3000);
      } else { setUploadMessage('❌ No data found. Check CSV format.'); }
    };
    reader.readAsText(file);
  };
  const filteredList = useMemo(() => { const s = searchQuery.toLowerCase(); return phrasalVocab.filter(item => item.word.toLowerCase().includes(s) || (item.meaning && item.meaning.toLowerCase().includes(s))); }, [phrasalVocab, searchQuery]);
  const safeIndex = activeWordIndex < filteredList.length ? activeWordIndex : 0;
  const card = mode === 'review' ? dueCards[0] : filteredList[safeIndex];
  useEffect(() => { setCollocationData(''); setCardImage(null); setAiStory(''); }, [card?.word]);
  useEffect(() => { if (mode === 'browse' && filteredList.length > 0 && activeWordIndex >= filteredList.length) setActiveWordIndex(0); }, [filteredList.length, activeWordIndex, mode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = rating === 'again' ? now + 60000 : rating === 'hard' ? now + 600000 : rating === 'good' ? now + 86400000 : now + 345600000;
    const newData = { ...srsData, [card.word]: { nextReview, rating, lastReviewed: now } };
    setSrsData(newData); localStorage.setItem('venoxa_phrasal_srs', JSON.stringify(newData));
    setShowMeaning(false); setAiStory(''); setCardImage(null); setCollocationData('');
    if (mode === 'browse') setActiveWordIndex((safeIndex + 1) % filteredList.length);
  };
  const resetWordProgress = wordStr => { const d = { ...srsData }; delete d[wordStr]; setSrsData(d); localStorage.setItem('venoxa_phrasal_srs', JSON.stringify(d)); };
  const playAudio = async (w = card?.word) => { if (!w) return; await edgeTTSSpeak(w, 'male'); };
  const generateStory = async () => {
    if (loadingAi || aiStory || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `You are a fun English teacher. Write a vivid, memorable 2-3 line story in English using the phrasal verb "${card.word}" (meaning: ${card.meaning}) to help a ${userLevel} learner remember it. Then add a brief ${_resolveTranslation(lang, 'Arabic', 'English')} note explaining how the phrasal verb was used.`;
      await streamText(prompt, setAiStory);
    } catch { setAiStory('Error generating story.'); } finally { setLoadingAi(false); }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English collocations dictionary. For the phrasal verb "${card.word}", list the most common and natural collocations or common usage patterns. Group them by grammatical context. Use this exact format (max 6 per group):\nPattern + ${card.word}: example1, example2\n${card.word} + Pattern: example1, example2\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      const briefPrompt = `You are a visual director. For the phrasal verb "${card.word}" (${card.meaning}), describe a SINGLE, concrete, photorealistic scene that captures the LITERAL meaning. 
Rules:
1. One subject, one action.
2. NO abstract concepts, NO text, NO letters.
3. Describe colors, lighting, and composition.
4. Output ONLY a 15-word English description.`;
      let visual = '';
      try { const raw = await fetchFromGemini(briefPrompt, AI_KEY); const ej = parseGeminiJSON(raw); if (!ej?.error) visual = String(raw || '').trim().split('\n')[0]?.replace(/^["'`]+|["'`]+$/g, '').trim() || ''; } catch { }
      if (!visual) visual = `A scene showing the phrasal verb "${card.word}"`;
      const visualClean = (visual + ' Photorealistic, natural lighting, no text.').replace(/[^\x00-\x7F]/g, "");
      const seed = Math.floor(Math.random() * 1_000_000);
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(visualClean)}&width=640&height=420&seed=${seed}`);
    } catch { setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(`Phrasal verb ${card?.word}`.replace(/[^\x00-\x7F]/g, ""))}&width=640&height=420`); } finally { setLoadingImage(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row bg-white dark:bg-[var(--app-card)] p-1.5 rounded-xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
      <button onClick={() => { setMode('browse'); setShowMeaning(false); setCardImage(null); setAiStory(''); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'browse' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => { setMode('review'); setShowMeaning(false); setCardImage(null); setAiStory(''); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${mode === 'review' ? 'bg-[var(--app-accent1)] text-white' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Layers className="w-4 h-4" /> {t.review}{dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">{dueCards.length}</span>}</button>
      <button onClick={() => { setMode('lists'); setShowMeaning(false); setCardImage(null); setAiStory(''); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'lists' ? 'bg-[#1E90FF] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>
    {mode === 'lists' && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateItemsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          return <div key={item.word} className="flex justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Remove from SRS"><Trash2 className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[var(--app-card)] border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>
            <div className="text-left" dir="ltr">
              <p className="text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2 justify-start">
                <button onClick={() => playAudio(item.word)} className="text-gray-500 hover:text-black dark:text-white transition-colors"><Volume2 className="w-4 h-4" /></button>
                <span>{safeRender(item.word)}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-[var(--app-text)] mt-1">{safeRender(item.meaning)}</p>
            </div>
          </div>;
        })}
      </div>
    </div>}
    {mode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[var(--app-card)] p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-1">{_resolveTranslation(lang, 'الأفعال المركبة', 'Phrasal Verbs')}</h2><p className="text-sm text-gray-600 dark:text-[var(--app-text)]">{t.totalItems} {phrasalVocab.length} · <span className="text-xs opacity-60">{t.csvHint}</span></p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-[#1E90FF]/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-[var(--app-accent1)] dark:hover:bg-[#1E90FF] dark:hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"><UploadCloud className="w-4 h-4" /> {t.uploadCSV}<input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" /></label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[var(--app-card)] p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Search className="w-4 h-4 text-black dark:text-white" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-4 py-3 text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><List className="w-4 h-4 text-black dark:text-white" /> {t.manualSelect} ({filteredList.length})</label>
          <select value={safeIndex} onChange={e => { setActiveWordIndex(Number(e.target.value)); setShowMeaning(false); setAiStory(''); setCardImage(null); }} className="w-full bg-gray-50 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-4 py-3 text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none appearance-none cursor-pointer" dir="ltr">
            {filteredList.length === 0 ? <option value={0}>{t.noWords}</option> : filteredList.map((item, idx) => <option key={idx} value={idx}>{safeRender(item.word)}</option>)}
          </select>
        </div>
      </div>
    </>}
    {mode === 'review' && !card && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-xl font-bold">{t.browseLearn}</button>
    </div>}
    {mode === 'browse' && (filteredList.length === 0 || !card) && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[300px] flex flex-col items-center justify-center p-8 shadow-sm text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-[var(--app-accent1)] mb-4" /><h3 className="text-xl text-gray-600 dark:text-[var(--app-text)] font-bold">{t.noWords}</h3>
    </div>}
    {card && mode !== 'lists' && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative hover:border-blue-300 transition-all duration-300 animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>
      <div className="absolute top-6 left-6 z-10">
        <button onClick={e => { e.stopPropagation(); playAudio(); }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-xl text-black dark:text-white shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /></button>
      </div>
      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-[var(--app-accent1)] text-sm mt-8 animate-pulse bg-gray-100 dark:bg-[var(--app-card)]/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-16 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 w-full"><p className="text-lg text-gray-800 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiStory && <button onClick={e => { e.stopPropagation(); generateStory(); }} disabled={loadingAi} className="flex-1 bg-orange-50 text-[var(--app-accent1)] px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Lightbulb className="w-5 h-5" /> {t.storyBtn}</>}</button>}
          {!cardImage && <button onClick={e => { e.stopPropagation(); generateImage(); }} disabled={loadingImage} className="flex-1 bg-[var(--app-accent1)]/10 text-black px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /> {t.imgBtn}</>}</button>}
          {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="flex-1 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/8 text-black dark:text-white px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingCollocation ? <Activity className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5" /> {t.collocationsBtn}</>}</button>}
        </div>
        {collocationData && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-teal-500 p-5 rounded-2xl w-full text-left mt-2" onClick={e => e.stopPropagation()}><div className="font-mono text-gray-800 dark:text-[var(--app-text)] text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(collocationData)}</div></div>}
        {aiStory && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-orange-500 p-5 rounded-2xl w-full text-left mt-4" onClick={e => e.stopPropagation()}><div className="prose prose-orange dark:prose-invert max-w-none text-gray-800 dark:text-[var(--app-text)] text-sm" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(aiStory)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl flex items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-blue-400 animate-bounce" /></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--app-border)] shadow-sm" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => { e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found'; }} /></div>}
      </div>}
    </div>}
    {showMeaning && card && mode !== 'lists' && <div className="grid grid-cols-4 gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-[#1E1830] text-red-600 border border-red-200 py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center">{t.rateAgain}<span className="text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] border border-orange-200 py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center">{t.rateHard}<span className="text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[var(--app-card)] text-green-600 border border-green-200 py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center">{t.rateGood}<span className="text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-[var(--app-accent1)]/10 dark:bg-[var(--app-card)] text-black dark:text-white border border-[var(--app-accent1)]/30 py-3 rounded-2xl font-bold hover:bg-blue-100 flex flex-col items-center">{t.rateEasy}<span className="text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
    </div>}
  </div>;
}

function IdiomsSlang({ AI_KEY, userLevel, lang, idiomsVocab, setIdiomsVocab, theme }) {
  const [srsData, setSrsData] = useState(() => JSON.parse(localStorage.getItem('venoxa_idioms_srs')) || {});
  const [mode, setMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiSentence, setAiSentence] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  useEffect(() => { const int = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(int); }, []);
  const t = {
    browse: _resolveTranslation(lang, 'تصفح', 'Browse'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'القوائم', 'Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث', 'Search'),
    filterTopic: _resolveTranslation(lang, 'تصفية بالموضوع', 'Filter by Topic'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    allTopics: _resolveTranslation(lang, 'كل المواضيع', 'All Topics'),
    noWords: _resolveTranslation(lang, 'لا توجد عناصر مطابقة', 'No matching items'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'أنهيت جميع المراجعات المستحقة.', 'All due reviews completed.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم', 'Browse and Learn'),
    clickToShow: _resolveTranslation(lang, 'انقر لإظهار المعنى والتقييم', 'Click to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    genSentenceBtn: _resolveTranslation(lang, 'توليد جملة بالذكاء الاصطناعي', 'Generate a Sentence (AI)'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    totalItems: _resolveTranslation(lang, 'إجمالي التعابير:', 'Total idioms/slang:'),
    emptyLists: _resolveTranslation(lang, 'لا توجد عناصر في هذه القائمة.', 'No items in this list.'),
    rateItemsMsg: _resolveTranslation(lang, 'قيم العناصر في قسم "تصفح" لتظهر هنا.', 'Rate items in Browse mode to see them here.'),
    csvHint: _resolveTranslation(lang, 'الصيغة: الموضوع؛ التعبير؛ المعنى؛ الجملة', 'Format: Topic; Slang; Meaning; Sentence'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };

  // Unique topics derived from the vocab list
  const allTopics = useMemo(() => {
    const topics = [...new Set(idiomsVocab.map(w => w.topic).filter(Boolean))].sort();
    return topics;
  }, [idiomsVocab]);

  const dueCards = useMemo(() => { const now = Date.now(); return idiomsVocab.filter(c => { const d = srsData[c.word]; return d && d.nextReview <= now; }); }, [idiomsVocab, srsData, tick]);
  const hardWords = useMemo(() => idiomsVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [idiomsVocab, srsData, tick]);
  const learningWords = useMemo(() => idiomsVocab.filter(w => srsData[w.word]?.rating === 'good'), [idiomsVocab, srsData, tick]);
  const masteredWords = useMemo(() => idiomsVocab.filter(w => srsData[w.word]?.rating === 'easy'), [idiomsVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;

  // Parse semicolon-delimited CSV line, handling quoted fields
  const parseCSVLine = (line, sep = ';') => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') { inQuotes = !inQuotes; }
      else if (char === sep && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const rawText = e.target.result;
      const lines = rawText.split('\n');
      // Auto-detect delimiter from header line
      const header = lines[0] || '';
      const sep = header.includes(';') ? ';' : ',';
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const r = parseCSVLine(lines[i], sep);
        // Columns: Topic(0) ; Slang(1) ; Meaning(2) ; Sentence(3)
        if (r.length >= 3 && r[1]) {
          parsedData.push({
            topic: r[0]?.replace(/^"|"$/g, '').trim() || '',
            word: r[1].replace(/^"|"$/g, '').trim(),
            meaning: r[2]?.replace(/^"|"$/g, '').trim() || '',
            example: r[3]?.replace(/^"|"$/g, '').trim() || '',
          });
        }
      }
      if (parsedData.length > 0) {
        setIdiomsVocab(parsedData);
        localStorage.setItem('venoxa_idioms_vocab', JSON.stringify(parsedData));
        setSearchQuery(''); setTopicFilter('All'); setMode('browse');
        setUploadMessage(`✅ ${parsedData.length} idioms/slang uploaded!`);
        setTimeout(() => setUploadMessage(''), 3000);
      } else { setUploadMessage('❌ No data found. Check CSV format.'); }
    };
    reader.readAsText(file);
  };

  const filteredList = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return idiomsVocab.filter(item => {
      const matchesTopic = topicFilter === 'All' || item.topic === topicFilter;
      const matchesSearch = item.word.toLowerCase().includes(s) || (item.meaning && item.meaning.toLowerCase().includes(s));
      return matchesTopic && matchesSearch;
    });
  }, [idiomsVocab, searchQuery, topicFilter]);

  const safeIndex = activeWordIndex < filteredList.length ? activeWordIndex : 0;
  const card = mode === 'review' ? dueCards[0] : filteredList[safeIndex];
  useEffect(() => { setCollocationData(''); setCardImage(null); setAiSentence(''); }, [card?.word]);
  useEffect(() => { if (mode === 'browse' && filteredList.length > 0 && activeWordIndex >= filteredList.length) setActiveWordIndex(0); }, [filteredList.length, activeWordIndex, mode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = rating === 'again' ? now + 60000 : rating === 'hard' ? now + 600000 : rating === 'good' ? now + 86400000 : now + 345600000;
    const newData = { ...srsData, [card.word]: { nextReview, rating, lastReviewed: now } };
    setSrsData(newData); localStorage.setItem('venoxa_idioms_srs', JSON.stringify(newData));
    setShowMeaning(false); setAiSentence(''); setCardImage(null); setCollocationData('');
    if (mode === 'browse') setActiveWordIndex((safeIndex + 1) % filteredList.length);
  };
  const resetWordProgress = wordStr => { const d = { ...srsData }; delete d[wordStr]; setSrsData(d); localStorage.setItem('venoxa_idioms_srs', JSON.stringify(d)); };
  const playAudio = async (w = card?.word) => { if (!w) return; await edgeTTSSpeak(w, 'male'); };
  const generateSentence = async () => {
    if (loadingAi || aiSentence || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `Create one natural, realistic English sentence using the idiom or slang expression "${card.word}" (which means: ${card.meaning}). The sentence should be suitable for a ${userLevel} learner. After the English sentence, add a short ${_resolveTranslation(lang, 'Arabic', 'English')} note explaining how the expression is used in context. Output the sentence first, then the note on a new line.`;
      await streamText(prompt, setAiSentence);
    } catch { setAiSentence('Error generating sentence.'); } finally { setLoadingAi(false); }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English collocations dictionary. For the idiom "${card.word}", list the most common and natural usage patterns or context pairs. Group them by grammatical context. Use this exact format (max 6 per group):\nPattern + ${card.word}: example1, example2\n${card.word} + Pattern: example1, example2\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      const briefPrompt = `You are a visual director. For the idiom "${card.word}" (${card.meaning}), describe a SINGLE, concrete, photorealistic scene that captures the LITERAL or most iconic visual representation. 
Rules:
1. One subject, one action.
2. NO text, NO letters, NO symbols.
3. Describe colors, lighting, and composition.
4. Output ONLY a 15-word English description.`;
      let visual = '';
      try { const raw = await fetchFromGemini(briefPrompt, AI_KEY); const ej = parseGeminiJSON(raw); if (!ej?.error) visual = String(raw || '').trim().split('\n')[0]?.replace(/^["'`]+|["'`]+$/g, '').trim() || ''; } catch { }
      if (!visual) visual = `A scene showing the meaning of "${card.word}"`;
      const seed = Math.floor(Math.random() * 1_000_000);
      const visualClean = (visual + ' Photorealistic, natural lighting, no text.').replace(/[^\x00-\x7F]/g, "");
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(visualClean)}&width=640&height=420&seed=${seed}`);
    } catch {
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(`Illustration ${card?.word}`.replace(/[^\x00-\x7F]/g, ""))}&width=640&height=420`);
    } finally { setLoadingImage(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row bg-white dark:bg-[var(--app-card)] p-1.5 rounded-xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
      <button onClick={() => { setMode('browse'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'browse' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => { setMode('review'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${mode === 'review' ? 'bg-[var(--app-accent1)] text-white' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Layers className="w-4 h-4" /> {t.review}{dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">{dueCards.length}</span>}</button>
      <button onClick={() => { setMode('lists'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'lists' ? 'bg-[#1E90FF] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>
    {mode === 'lists' && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateItemsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          return <div key={item.word} className="flex justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Remove from SRS"><Trash2 className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[var(--app-card)] border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>
            <div className="text-left" dir="ltr">
              <div className="flex items-center gap-2 flex-wrap justify-start">
                <p className="text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
                  <button onClick={() => playAudio(item.word)} className="text-gray-500 hover:text-black dark:text-white transition-colors"><Volume2 className="w-4 h-4" /></button>
                  <span>{safeRender(item.word)}</span>
                </p>
                {item.topic && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1E90FF]/10 dark:bg-[var(--app-accent2)]/10 text-[var(--app-accent1)] dark:text-[var(--app-accent2)] border border-[#1E90FF]/30 dark:border-purple-500/20">{safeRender(item.topic)}</span>}
              </div>
              <p className="text-sm text-gray-600 dark:text-[var(--app-text)] mt-1">{safeRender(item.meaning)}</p>
            </div>
          </div>;
        })}
      </div>
    </div>}
    {mode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[var(--app-card)] p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-1">{_resolveTranslation(lang, 'التعابير والعامية', 'Idioms & Slang')}</h2><p className="text-sm text-gray-600 dark:text-[var(--app-text)]">{t.totalItems} {idiomsVocab.length} · <span className="text-xs opacity-60">{t.csvHint}</span></p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-[#1E90FF]/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-[var(--app-accent1)] dark:hover:bg-[#1E90FF] dark:hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"><UploadCloud className="w-4 h-4" /> {t.uploadCSV}<input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" /></label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-[var(--app-card)] p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Search className="w-4 h-4 text-black dark:text-white" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setActiveWordIndex(0); setShowMeaning(false); setAiSentence(''); setCardImage(null); }} className="w-full bg-gray-50 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-4 py-3 text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-[var(--app-accent1)]" /> {t.filterTopic}</label>
          <CustomDropdown 
            value={topicFilter} 
            onChange={val => { setTopicFilter(val); setActiveWordIndex(0); setShowMeaning(false); setAiSentence(''); setCardImage(null); }} 
            options={[{ value: 'All', label: t.allTopics }, ...allTopics.map(topic => ({ value: topic, label: topic }))]} 
            theme={theme}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><List className="w-4 h-4 text-black dark:text-white" /> {t.manualSelect} ({filteredList.length})</label>
          <CustomDropdown 
            value={safeIndex} 
            onChange={val => { setActiveWordIndex(Number(val)); setShowMeaning(false); setAiSentence(''); setCardImage(null); }} 
            options={filteredList.length === 0 ? [{ value: 0, label: t.noWords }] : filteredList.map((item, idx) => ({ value: idx, label: safeRender(item.word) }))} 
            theme={theme}
            className="w-full"
          />
        </div>
      </div>
    </>}
    {mode === 'review' && !card && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-xl font-bold">{t.browseLearn}</button>
    </div>}
    {mode === 'browse' && (filteredList.length === 0 || !card) && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[300px] flex flex-col items-center justify-center p-8 shadow-sm text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-[var(--app-accent1)] mb-4" /><h3 className="text-xl text-gray-600 dark:text-[var(--app-text)] font-bold">{t.noWords}</h3>
    </div>}
    {card && mode !== 'lists' && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative hover:border-purple-300 transition-all duration-300 animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-purple-50 dark:from-purple-900/5 to-transparent rounded-xl pointer-events-none" />
      <div className="absolute top-6 left-6 z-10">
        <button onClick={e => { e.stopPropagation(); playAudio(); }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-xl text-[var(--app-accent1)] dark:text-[var(--app-accent2)] shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /></button>
      </div>
      {card.topic && <span className="absolute top-6 right-6 bg-[#1E90FF]/10 dark:bg-[var(--app-accent2)]/10 text-[var(--app-accent1)] dark:text-[var(--app-accent2)] border border-[#1E90FF]/30 dark:border-purple-500/20 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{safeRender(card.topic)}</span>}
      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-[var(--app-accent1)] text-sm mt-8 animate-pulse bg-gray-100 dark:bg-[var(--app-card)]/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-16 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 w-full"><p className="text-lg text-gray-800 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiSentence && <button onClick={e => { e.stopPropagation(); generateSentence(); }} disabled={loadingAi} className="flex-1 bg-orange-50 text-[var(--app-accent1)] px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> {t.genSentenceBtn}</>}</button>}
          {!cardImage && <button onClick={e => { e.stopPropagation(); generateImage(); }} disabled={loadingImage} className="flex-1 bg-[var(--app-accent1)]/10 text-black px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /> {t.imgBtn}</>}</button>}
          {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="flex-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingCollocation ? <Activity className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5" /> {t.collocationsBtn}</>}</button>}
        </div>
        {collocationData && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-teal-500 p-5 rounded-2xl w-full text-left mt-2" onClick={e => e.stopPropagation()}><div className="font-mono text-gray-800 dark:text-[var(--app-text)] text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(collocationData)}</div></div>}
        {aiSentence && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-[#1E90FF] p-5 rounded-2xl w-full text-left mt-4" onClick={e => e.stopPropagation()}><div className="prose prose-purple dark:prose-invert max-w-none text-gray-800 dark:text-[var(--app-text)] text-sm" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(aiSentence)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl flex items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-[var(--app-accent1)] animate-bounce" /></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--app-border)] shadow-sm" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => { e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found'; }} /></div>}
      </div>}
    </div>}
    {showMeaning && card && mode !== 'lists' && <div className="grid grid-cols-4 gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-[#1E1830] text-red-600 border border-red-200 py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center">{t.rateAgain}<span className="text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] border border-orange-200 py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center">{t.rateHard}<span className="text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[var(--app-card)] text-green-600 border border-green-200 py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center">{t.rateGood}<span className="text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-[var(--app-accent1)]/10 dark:bg-[var(--app-card)] text-black dark:text-white border border-[var(--app-accent1)]/30 py-3 rounded-2xl font-bold hover:bg-blue-100 flex flex-col items-center">{t.rateEasy}<span className="text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
    </div>}
  </div>;
}

function Grammar({
  AI_KEY,
  userLevel,
  lang,
  theme
}) {
  const [openLevel, setOpenLevel] = useState(0);
  const [activeTopic, setActiveTopic] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const t = {
    title: _resolveTranslation(lang, 'القواعد الشاملة', 'Comprehensive Grammar'),
    subtitle: _resolveTranslation(lang, '(مع معلم الذكاء الاصطناعي)', '(AI Teacher)'),
    desc: _resolveTranslation(lang, 'مرتبة منهجياً من مستوى A1 إلى C1. اضغط على أي قاعدة ليقوم الذكاء الاصطناعي بشرحها لك.', 'Structured from A1 to C1. Click any rule for an AI-generated explanation.'),
    explainBtn: _resolveTranslation(lang, 'اشرح لي بالذكاء الاصطناعي', 'Explain with AI'),
    loading: _resolveTranslation(lang, 'جاري توليد الشرح والأمثلة...', 'Generating explanation and examples...'),
    error: _resolveTranslation(lang, 'عذراً، حدث خطأ.', 'Error generating response.')
  };
  const handleExplain = async (topic, levelStr) => {
    if (activeTopic === topic) return;
    setActiveTopic(topic);
    setExplanation("");
    setLoading(true);
    try {
      const prompt = `You are an expert English grammar teacher. Explain the grammar rule: "${topic}" for a ${levelStr} level student.
      The explanation MUST be in ${_resolveTranslation(lang, 'Arabic', 'English')}. Keep it clear, simple, and provide 3 distinct examples in English with their translation in ${_resolveTranslation(lang, 'Arabic', 'English')}.`;
      await streamText(prompt, setExplanation);
    } catch (err) {
      setExplanation(t.error);
    } finally {
      setLoading(false);
    }
  };
  return <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-black dark:text-white mb-4">{t.title}</h2>
      <p className="text-gray-500 dark:text-gray-400">{t.desc}</p>
    </div>

    <div className="space-y-4">
      {GRAMMAR_LEVELS.map((level, idx) => {
        const isOpen = openLevel === idx;
        return (
          <div key={idx} className={`premium-card overflow-hidden transition-all duration-300 ${isOpen ? 'ring-1 ring-[var(--app-accent1)]/20' : ''}`}>
            <button
              onClick={() => { setOpenLevel(isOpen ? -1 : idx); setActiveTopic(null); }}
              className={`w-full px-6 py-5 flex justify-between items-center transition-colors ${isOpen ? 'bg-gray-50 dark:bg-[var(--app-surface)]' : 'hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-lg font-semibold ${isOpen ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {_resolveTranslation(lang, 'المستوى', 'Level')} {level.level}
                </span>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : 'text-gray-400'}`} />
            </button>

            {isOpen && (
              <div className="p-6 bg-white dark:bg-black border-t border-gray-100 dark:border-[var(--app-border)] space-y-3">
                {level.topics.map((topic, tidx) => {
                  const isActive = activeTopic === topic;
                  return (
                    <div key={tidx} className={`rounded-xl border transition-all ${isActive ? 'border-[var(--app-accent1)]/30 bg-[var(--app-accent1)]/5' : 'border-gray-100 dark:border-[var(--app-border)] hover:border-gray-200 dark:hover:border-[var(--app-card)]'}`}>
                      <div className="flex items-center justify-between p-4">
                        <span className={`text-base font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>{topic}</span>
                        <button
                          onClick={() => handleExplain(topic, level.level)}
                          className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-[var(--app-accent1)] text-white' : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[var(--app-surface)]'}`}
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                      {isActive && (
                        <div className="p-6 border-t border-[var(--app-accent1)]/10 bg-white dark:bg-black animate-fadeIn">
                          {loading ? (
                            <div className="flex items-center gap-3 text-[var(--app-accent1)]">
                              <Activity className="w-4 h-4 animate-spin" />
                              <span className="text-sm font-medium">{t.loading}</span>
                            </div>
                          ) : (
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-base prose-sm dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                              {safeRender(explanation)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>;
}
function ListeningReading({ type, AI_KEY, userLevel, lang, theme }) {
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);

  // Topic + length
  const [listenTopic, setListenTopic] = useState('');
  const [listenLength, setListenLength] = useState('medium');

  // Full-passage audio player
  const [audioState, setAudioState] = useState('idle'); // idle | loading | playing | paused
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);
  const audioBlobUrlRef = useRef(null);

  // Comprehension quiz
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Dictation mode
  const [dictMode, setDictMode] = useState(false);
  const [dictSentences, setDictSentences] = useState([]);
  const [dictIdx, setDictIdx] = useState(0);
  const [dictInput, setDictInput] = useState('');
  const [dictResults, setDictResults] = useState([]);
  const [dictAudioState, setDictAudioState] = useState('idle');
  const dictAudioRef = useRef(null);

  const [voiceAccent, setVoiceAccent] = useState('uk');
  useEffect(() => { _voiceAccent = voiceAccent; }, [voiceAccent]);

  const LISTEN_TOPICS = [
    'الحياة اليومية والروتين', 'السفر والثقافة', 'التكنولوجيا والذكاء الاصطناعي',
    'الصحة والعافية', 'البيئة والمناخ', 'العمل والوظيفة',
    'التعليم والتعلم', 'الطعام والطبخ', 'الرياضة واللياقة', 'العلوم والاكتشافات'
  ];
  const WORD_COUNTS = { short: 80, medium: 150, long: 250 };

  const getDynamicTitle = () => {
    const isBeginner = userLevel === 'A1' || userLevel === 'A2';
    const isInter = userLevel === 'B1' || userLevel === 'B2';
    if (lang === 'ar') {
      const skill = type === 'listening' ? 'الاستماع' : 'القراءة';
      const adj = isBeginner ? 'الأساسي' : isInter ? 'المتوسط' : 'المتقدم';
      return `تدريب ${skill} ${adj}`;
    }
    if (lang === 'es') return `${type === 'listening' ? 'Escucha' : 'Lectura'} ${isBeginner ? 'Básica' : isInter ? 'Intermedia' : 'Avanzada'}`;
    if (lang === 'fr') return `${type === 'listening' ? 'Écoute' : 'Lecture'} ${isBeginner ? 'Basique' : isInter ? 'Intermédiaire' : 'Avancée'}`;
    if (lang === 'de') return `${isBeginner ? 'Grundlegendes' : isInter ? 'Mittleres' : 'Erweitertes'} ${type === 'listening' ? 'Hören' : 'Lesen'}`;
    if (lang === 'zh') return `${isBeginner ? '基础' : isInter ? '中级' : '高级'}${type === 'listening' ? '听力' : '阅读'}`;
    if (lang === 'ja') return `${isBeginner ? '基礎' : isInter ? '中級' : '上級'}${type === 'listening' ? 'リスニング' : 'リーディング'}`;
    const skillEn = type === 'listening' ? 'Listening' : 'Reading';
    const adjEn = isBeginner ? 'Basic' : isInter ? 'Intermediate' : 'Advanced';
    return `${adjEn} ${skillEn}`;
  };

  const getDynamicDesc = () => {
    const isBeginner = userLevel === 'A1' || userLevel === 'A2';
    const isInter = userLevel === 'B1' || userLevel === 'B2';
    if (lang === 'ar') {
      const focus = isBeginner ? 'النصوص البسيطة والأساسية' : isInter ? 'النصوص المتوسطة' : 'النصوص المعقدة';
      return `بما أن مستواك ${userLevel}، سنركز على ${focus}.`;
    }
    if (lang === 'es') return `Dado que tu nivel es ${userLevel}, nos enfocaremos en textos ${isBeginner ? 'sencillos' : isInter ? 'intermedios' : 'complejos'}.`;
    if (lang === 'fr') return `Étant donné que votre niveau est ${userLevel}, nous nous concentrons sur des textes ${isBeginner ? 'simples' : isInter ? 'intermédiaires' : 'complexes'}.`;
    if (lang === 'de') return `Da dein Level ${userLevel} ist, konzentrieren wir uns auf ${isBeginner ? 'einfache' : isInter ? 'mittelschwere' : 'komplexe'} Texte.`;
    if (lang === 'zh') return `由于您的水平是 ${userLevel}，我们将专注于${isBeginner ? '简单' : isInter ? '中级' : '复杂'}文本。`;
    if (lang === 'ja') return `あなたのレベルは ${userLevel} なので、${isBeginner ? '簡単' : isInter ? '中級' : '複雑'}なテキストに焦点を当てます。`;
    const focusEn = isBeginner ? 'simple texts' : isInter ? 'intermediate texts' : 'complex texts';
    return `Since your level is ${userLevel}, we focus on ${focusEn}.`;
  };

  const t = {
    title: getDynamicTitle(),
    desc: getDynamicDesc(),
    btn: _resolveTranslation(lang, 'ولّد نصاً جديداً', 'Generate New Text')
  };

  // ── Stop all audio ─────────────────────────────────────────────────
  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (audioBlobUrlRef.current) { URL.revokeObjectURL(audioBlobUrlRef.current); audioBlobUrlRef.current = null; }
    try { if (_currentTTSAudio) { _currentTTSAudio.pause(); _currentTTSAudio.src = ''; } } catch { }
    window.speechSynthesis?.cancel();
    setAudioState('idle');
  };

  // ── Fetch audio via recreated Edge TTS (Gemini) and return Audio element ──
  const fetchAudioEl = async (text, speed) => {
    try {
      const params = new URLSearchParams({ text: text.slice(0, 2500), voice: EDGE_VOICES[_voiceAccent === 'us' ? 'us' : 'uk'].male });
      const url = `${import.meta.env.BASE_URL}api/gemini-tts?${params}`;
      const audio = new Audio(url);
      audio.playbackRate = speed;
      return { audio, url };
    } catch {
      return null;
    }
  };

  // ── Generate passage ───────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setStory('');
    setQuiz(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    setDictMode(false);
    setDictResults([]);
    stopAudio();
    try {
      const topicText = listenTopic || 'Daily Life';
      const wc = WORD_COUNTS[listenLength] || 150;
      const prompt = type === 'listening'
        ? `Write a natural, engaging ${wc}-word spoken passage (podcast-style monologue or short story) for a ${userLevel} English learner. Topic: "${topicText}". Use vocabulary and grammar appropriate for ${userLevel} level. Write naturally flowing speech. No bullet points, no headers, no markdown. Plain text only.`
        : `Write a ${wc}-word story/passage for a ${userLevel} English learner. Topic: "${topicText}". Include a short vocabulary list at the end with ${lang === 'ar' ? 'Arabic' : 'simple English'} meanings. Plain text, no markdown.`;
      let _full = '';
      await streamFromAPI(prompt, (delta) => { _full += delta; setStory(_full); });
      setStory(cleanFallbackText(_full) || _full);
    } catch { setStory('Error generating content.'); }
    setLoading(false);
  };

  // ── Play / Pause full passage ──────────────────────────────────────
  const handlePlayPause = async () => {
    if (audioState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setAudioState('paused');
      return;
    }
    if (audioState === 'paused' && audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      setAudioState('playing');
      return;
    }
    setAudioState('loading');
    stopAudio();
    const result = await fetchAudioEl(story, playbackSpeed);
    if (result) {
      const { audio, url } = result;
      audioBlobUrlRef.current = url;
      audio.onended = () => { URL.revokeObjectURL(url); audioBlobUrlRef.current = null; setAudioState('idle'); };
      audio.onerror = () => setAudioState('idle');
      audioRef.current = audio;
      await audio.play();
      setAudioState('playing');
    } else {
      window.speechSynthesis?.cancel();
      const ok = await edgeTTSSpeak(story, 'male');
      if (ok) {
        setAudioState('playing');
        if (_currentTTSAudio) {
          _currentTTSAudio.playbackRate = playbackSpeed;
          _currentTTSAudio.onended = () => setAudioState('idle');
        }
      } else {
        const u = new SpeechSynthesisUtterance(story);
        u.rate = playbackSpeed;
        u.onend = () => setAudioState('idle');
        window.speechSynthesis?.speak(u);
        setAudioState('playing');
      }
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  // ── Comprehension quiz ─────────────────────────────────────────────
  const handleGenerateQuiz = async () => {
    if (!story) return;
    setQuizLoading(true);
    setQuiz(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    try {
      const prompt = `Create exactly 4 multiple-choice comprehension questions about this passage. Return ONLY a JSON array with no extra text or markdown:\n[{"q":"Question?","options":["A. option1","B. option2","C. option3","D. option4"],"answer":"A"},{"q":"...","options":[...],"answer":"B"}]\nRules: "answer" must be exactly one uppercase letter A, B, C, or D. Base questions strictly on the passage content.\nPassage:\n${story.slice(0, 1200)}`;
      const raw = await fetchFromGemini(prompt, AI_KEY);
      let questions = null;
      const trimmed = raw.trim();
      const arrStart = trimmed.indexOf('[');
      const arrEnd = trimmed.lastIndexOf(']');
      const objStart = trimmed.indexOf('{');
      const objEnd = trimmed.lastIndexOf('}');
      if (arrStart !== -1 && arrEnd !== -1 && (objStart === -1 || arrStart < objStart)) {
        try { const arr = JSON.parse(trimmed.slice(arrStart, arrEnd + 1)); if (Array.isArray(arr)) questions = arr; } catch { }
      }
      if (!questions && objStart !== -1 && objEnd !== -1) {
        try { const obj = JSON.parse(trimmed.slice(objStart, objEnd + 1)); questions = obj.questions || obj.quiz || null; } catch { }
      }
      if (questions?.length) {
        questions = questions.map(q => ({ ...q, answer: String(q.answer || '').trim().toUpperCase().charAt(0) }));
      }
      setQuiz(questions?.length ? questions : []);
    } catch { setQuiz([]); }
    setQuizLoading(false);
  };

  const quizScore = quizSubmitted && quiz
    ? quiz.filter((q, i) => userAnswers[i] === q.answer).length
    : 0;

  // ── Dictation ──────────────────────────────────────────────────────
  const startDictation = () => {
    if (!story) return;
    stopAudio();
    const sents = story.match(/[^.!?]+[.!?]+/g)
      ?.map(s => s.trim())
      .filter(s => s.length > 15 && s.split(' ').length > 3) || [];
    setDictSentences(sents.slice(0, 8));
    setDictIdx(0);
    setDictInput('');
    setDictResults([]);
    setDictMode(true);
    setQuiz(null);
  };

  const playDictSentence = async (text) => {
    if (dictAudioRef.current) { dictAudioRef.current.pause(); dictAudioRef.current = null; }
    setDictAudioState('loading');
    const result = await fetchAudioEl(text, 0.85);
    if (result) {
      const { audio, url } = result;
      audio.onended = () => { URL.revokeObjectURL(url); setDictAudioState('idle'); };
      dictAudioRef.current = audio;
      await audio.play();
      setDictAudioState('playing');
    } else {
      window.speechSynthesis?.cancel();
      const ok = await edgeTTSSpeak(text, 'male');
      if (ok) {
        setDictAudioState('playing');
        if (_currentTTSAudio) {
          _currentTTSAudio.playbackRate = 0.85;
          _currentTTSAudio.onended = () => setDictAudioState('idle');
        }
      } else {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.85;
        u.onend = () => setDictAudioState('idle');
        window.speechSynthesis?.speak(u);
        setDictAudioState('playing');
      }
    }
  };

  const checkDictAnswer = () => {
    const expected = dictSentences[dictIdx] || '';
    const typed = dictInput.trim();
    const expWords = expected.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
    const typWords = typed.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
    const correct = expWords.filter((w, i) => typWords[i] === w).length;
    const score = expWords.length > 0 ? Math.round((correct / expWords.length) * 100) : 0;
    setDictResults(prev => [...prev, { expected, typed, score }]);
    setDictInput('');
    setDictIdx(prev => prev + 1);
  };

  const avgDictScore = dictResults.length
    ? Math.round(dictResults.reduce((a, r) => a + r.score, 0) / dictResults.length)
    : 0;

  const listeningLinks = [
    { level: _resolveTranslation(lang, "مبتدئ (A1-A2)", "Beginner (A1-A2)"), name: "Spotlight English podcast", url: "https://spotlightenglish.com/" },
    { level: _resolveTranslation(lang, "تحت المتوسط (B1)", "Pre-Intermediate (B1)"), name: "The LevelUp English Podcast", url: "https://www.levelupenglish.school/podcast/" },
    { level: _resolveTranslation(lang, "تحت المتوسط (B1)", "Pre-Intermediate (B1)"), name: "British Council", url: "https://learnenglish.britishcouncil.org/general-english/audio-series/podcasts" },
    { level: _resolveTranslation(lang, "متوسط (B1-B2)", "Intermediate (B1-B2)"), name: "Luke's English Podcast", url: "https://teacherluke.co.uk/archive-of-episodes-1-149/" },
    { level: _resolveTranslation(lang, "متوسط (B1-B2)", "Intermediate (B1-B2)"), name: "All Ears English Podcast", url: "https://www.allearsenglish.com/" },
    { level: _resolveTranslation(lang, "فوق المتوسط (B2)", "Upper-Intermediate (B2)"), name: "TED Talks", url: "https://youtube.com/@TED?si=8y1RTw0ImlDO7By9" },
    { level: _resolveTranslation(lang, "فوق المتوسط (B2)", "Upper-Intermediate (B2)"), name: "BBC Sounds", url: "https://www.bbc.co.uk/sounds/podcasts" },
    { level: _resolveTranslation(lang, "متقدم (C1-C2)", "Advanced (C1-C2)"), name: "This American Life", url: "https://www.thisamericanlife.org/archive" }
  ];
  const readingLinks = [
    { level: _resolveTranslation(lang, "مبتدئ - متوسط", "Beginner - Intermediate"), name: "Project Gutenberg", url: "https://www.gutenberg.org" },
    { level: _resolveTranslation(lang, "مبتدئ - متوسط", "Beginner - Intermediate"), name: "ESL Fast", url: "https://www.eslfast.com" },
    { level: _resolveTranslation(lang, "مبتدئ - متوسط", "Beginner - Intermediate"), name: "Storynory", url: "https://www.storynory.com" },
    { level: _resolveTranslation(lang, "مبتدئ - متوسط", "Beginner - Intermediate"), name: "ManyThings.org", url: "https://www.manythings.org" },
    { level: _resolveTranslation(lang, "متقدم", "Advanced"), name: "Medium", url: "https://medium.com" },
    { level: _resolveTranslation(lang, "متقدم", "Advanced"), name: "BBC News", url: "https://www.bbc.com/news" },
    { level: _resolveTranslation(lang, "متقدم", "Advanced"), name: "The New York Times", url: "https://www.nytimes.com" }
  ];
  const currentLinks = type === 'listening' ? listeningLinks : readingLinks;
  const contentSteps = type === 'listening'
    ? [
      _resolveTranslation(lang, "اسمع بودكاست بدلاً من الأفلام أو الأغاني (لأن التركيز يكون على الصوت فقط).", "Listen to podcasts instead of movies or songs."),
      _resolveTranslation(lang, "لا تترجم ولا تقرأ النص أثناء الاستماع لتعويد الأذن.", "Do not translate or read transcripts while listening."),
      _resolveTranslation(lang, "اسمع المقطع مرة واحدة فقط لتجنب الملل.", "Listen to the track only once to avoid boredom."),
      _resolveTranslation(lang, "اختار مصدر تكون نسبة فهمك له 30%-50% للتطور السريع.", "Choose a source where you understand 30%-50%.")
    ]
    : [
      _resolveTranslation(lang, "اقرأ قصص وروايات مبسطة (Graded Readers).", "Read simplified graded readers."),
      _resolveTranslation(lang, "اقرأ بدون ترجمة فورية لتعويد العقل على سرعة ربط المعنى.", "Read without immediate translation."),
      _resolveTranslation(lang, "يجب أن تكون نسبة فهمك للقصة 30%-50%.", "You should understand 30%-50% of the story.")
    ];

  return (
    <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-[var(--app-card)] p-8 rounded-xl border border-gray-200 dark:border-[var(--app-border)] flex flex-col md:flex-row justify-between items-center gap-6 transition-colors">
        <div className="text-center md:text-start flex-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-2">{t.title}</h2>
          <p className="text-gray-600 dark:text-[var(--app-text)]">{t.desc}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
          {type === 'reading' && (
            <>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-[var(--app-card)] rounded-xl p-1 border border-gray-200 dark:border-[var(--app-border)]">
                <button onClick={() => setVoiceAccent('uk')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${voiceAccent === 'uk' ? 'bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)] shadow-sm' : 'text-gray-500 dark:text-[var(--app-accent1)] hover:text-gray-700'}`}>🇬🇧 UK</button>
                <button onClick={() => setVoiceAccent('us')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${voiceAccent === 'us' ? 'bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)] shadow-sm' : 'text-gray-500 dark:text-[var(--app-accent1)] hover:text-gray-700'}`}>🇺🇸 US</button>
              </div>
              <button onClick={handleGenerate} disabled={loading} className="bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition whitespace-nowrap">
                {loading ? <Activity className="animate-spin w-5 h-5" /> : <><Sparkles className="w-5 h-5" /> {t.btn}</>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Listening: topic / length / generate controls ── */}
      {type === 'listening' && (
        <div className="bg-white dark:bg-[var(--app-card)] p-6 rounded-xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <div className="flex flex-wrap items-center gap-3">
            <CustomDropdown
              value={listenTopic}
              onChange={setListenTopic}
              options={[{ value: '', label: _resolveTranslation(lang, 'اختر موضوعاً...', 'Pick a topic...') }, ...LISTEN_TOPICS.map(tp => ({ value: tp, label: tp }))]}
              theme={theme}
              className="flex-1 min-w-[160px]"
            />

            <div className="flex gap-1 bg-gray-100 dark:bg-[var(--app-card)] rounded-xl p-1">
              {['short', 'medium', 'long'].map(l => (
                <button
                  key={l}
                  onClick={() => setListenLength(l)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition ${listenLength === l ? 'bg-[var(--app-accent1)] text-white shadow' : 'text-gray-500 dark:text-[var(--app-text)] hover:text-gray-800 dark:hover:text-[var(--app-text)]'}`}
                >{l}</button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black disabled:opacity-60 text-white dark:text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-sm whitespace-nowrap"
            >
              {loading ? <Activity className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {_resolveTranslation(lang, 'ولّد نصاً', 'Generate')}
            </button>
            {/* UK/US accent toggle for listening */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[var(--app-card)] rounded-xl p-1 border border-gray-200 dark:border-[var(--app-border)] ml-auto">
              <button onClick={() => setVoiceAccent('uk')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${voiceAccent === 'uk' ? 'bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)] shadow-sm' : 'text-gray-500 dark:text-[var(--app-accent1)] hover:text-gray-700'}`}>🇬🇧 UK</button>
              <button onClick={() => setVoiceAccent('us')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${voiceAccent === 'us' ? 'bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)] shadow-sm' : 'text-gray-500 dark:text-[var(--app-accent1)] hover:text-gray-700'}`}>🇺🇸 US</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Listening: passage + player ── */}
      {story && type === 'listening' && (
        <div className="bg-white dark:bg-[var(--app-card)] p-6 rounded-xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">

          {/* Player bar */}
          <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-gray-100 dark:border-[var(--app-border)]">
            <button
              onClick={handlePlayPause}
              disabled={audioState === 'loading'}
              className="flex items-center gap-2 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black disabled:opacity-60 text-white dark:text-black px-5 py-2 rounded-xl font-bold transition shadow"
            >
              {audioState === 'loading' ? <Activity className="animate-spin w-4 h-4" /> : audioState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {audioState === 'loading' ? _resolveTranslation(lang, 'جاري التحميل...', 'Loading...') : audioState === 'playing' ? _resolveTranslation(lang, 'إيقاف مؤقت', 'Pause') : _resolveTranslation(lang, 'تشغيل', 'Play')}
            </button>

            {audioState !== 'idle' && (
              <button onClick={stopAudio} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[var(--app-card)] text-gray-700 dark:text-[var(--app-text)] text-sm font-medium hover:bg-gray-200 dark:hover:bg-[var(--app-hover)] hover:text-black transition">
                <RotateCcw className="w-3.5 h-3.5" /> {_resolveTranslation(lang, 'إيقاف', 'Stop')}
              </button>
            )}

            <div className="flex gap-1 ml-auto bg-gray-100 dark:bg-[var(--app-card)] rounded-xl p-1">
              {[0.75, 1, 1.25, 1.5].map(s => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${playbackSpeed === s ? 'bg-[var(--app-accent1)] text-white shadow' : 'text-gray-500 dark:text-[var(--app-text)] hover:text-gray-800 dark:hover:text-[var(--app-text)]'}`}
                >{s}×</button>
              ))}
            </div>
          </div>

          {/* Passage text */}
          <div dir="ltr" className="text-base leading-8 text-gray-800 dark:text-[var(--app-text)] whitespace-pre-wrap font-medium mb-6">
            {story}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-[var(--app-border)]">
            <button
              onClick={handleGenerateQuiz}
              disabled={quizLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-sm transition shadow"
            >
              {quizLoading ? <Activity className="animate-spin w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
              {_resolveTranslation(lang, 'اختبر الفهم', 'Quiz Me')}
            </button>
            <button
              onClick={startDictation}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black font-bold text-sm transition shadow"
            >
              <Mic className="w-4 h-4" />
              {_resolveTranslation(lang, 'وضع الإملاء', 'Dictation Mode')}
            </button>
          </div>
        </div>
      )}

      {/* ── Comprehension Quiz ── */}
      {quiz !== null && !dictMode && (
        <div className="bg-white dark:bg-[var(--app-card)] p-6 rounded-xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--app-accent1)]" />
            {_resolveTranslation(lang, 'أسئلة الفهم', 'Comprehension Quiz')}
          </h3>
          {quiz.length === 0 ? (
            <p className="text-gray-500 dark:text-[var(--app-text)]">{_resolveTranslation(lang, 'تعذّر توليد الأسئلة، حاول مجدداً.', 'Could not generate questions. Try again.')}</p>
          ) : (
            <>
              {quiz.map((q, i) => (
                <div key={i} className="mb-6">
                  <p className="font-bold text-gray-900 dark:text-[var(--app-text)] mb-3 text-base">{i + 1}. {q.q}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(q.options || []).map((opt, j) => {
                      const letter = ['A', 'B', 'C', 'D'][j];
                      const isSelected = userAnswers[i] === letter;
                      const isCorrect = quizSubmitted && letter === q.answer;
                      const isWrong = quizSubmitted && isSelected && letter !== q.answer;
                      return (
                        <button
                          key={j}
                          disabled={quizSubmitted}
                          onClick={() => !quizSubmitted && setUserAnswers(prev => ({ ...prev, [i]: letter }))}
                          className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition ${isCorrect ? 'bg-green-100 dark:bg-[var(--app-accent1)]/12 border-green-500 text-green-800 dark:text-green-300' :
                            isWrong ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300' :
                              isSelected ? 'bg-blue-100 dark:bg-[var(--app-accent1)]/12 border-blue-500 text-blue-800 dark:text-black dark:text-white' :
                                'bg-gray-50 dark:bg-[var(--app-card)] border-gray-200 dark:border-[var(--app-border)] text-gray-800 dark:text-[var(--app-text)] hover:border-blue-400'
                            }`}
                        >
                          {opt}
                          {isCorrect && <CheckCircle2 className="inline w-4 h-4 ml-2 text-green-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(userAnswers).length < quiz.length}
                  className="mt-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-bold transition shadow"
                >
                  {_resolveTranslation(lang, 'إرسال الإجابات', 'Submit Answers')}
                </button>
              ) : (
                <div className={`mt-4 p-5 rounded-2xl text-center font-extrabold text-lg ${quizScore === quiz.length ? 'bg-green-100 dark:bg-[var(--app-accent1)]/12 text-green-700 dark:text-green-300' : quizScore >= quiz.length / 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {quizScore === quiz.length ? '🎉 ' : quizScore >= quiz.length / 2 ? '👍 ' : '📚 '}
                  {_resolveTranslation(lang, `نتيجتك: ${quizScore} / ${quiz.length}`, `Score: ${quizScore} / ${quiz.length}`)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Dictation Mode ── */}
      {dictMode && (
        <div className="bg-white dark:bg-[var(--app-card)] p-6 rounded-xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
              <Mic className="w-5 h-5 text-black dark:text-white" />
              {_resolveTranslation(lang, 'وضع الإملاء', 'Dictation Mode')}
            </h3>
            <button onClick={() => setDictMode(false)} className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-[var(--app-card)] text-gray-600 dark:text-[var(--app-text)] text-sm font-medium hover:bg-gray-200 dark:hover:bg-[var(--app-hover)] hover:text-black transition">
              {_resolveTranslation(lang, 'إغلاق', 'Close')}
            </button>
          </div>

          {dictIdx < dictSentences.length ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-[var(--app-text)]">
                <span>{_resolveTranslation(lang, `جملة ${dictIdx + 1} من ${dictSentences.length}`, `Sentence ${dictIdx + 1} of ${dictSentences.length}`)}</span>
                <div className="h-1.5 flex-1 bg-gray-200 dark:bg-[var(--app-card)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--app-accent1)] rounded-full transition-all" style={{ width: `${(dictIdx / dictSentences.length) * 100}%` }} />
                </div>
              </div>

              <button
                onClick={() => playDictSentence(dictSentences[dictIdx])}
                disabled={dictAudioState === 'loading'}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black rounded-xl font-bold transition shadow active:scale-95"
              >
                {dictAudioState === 'loading' ? <Activity className="animate-spin w-4 h-4" /> : dictAudioState === 'playing' ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                {dictAudioState === 'idle' ? _resolveTranslation(lang, 'استمع للجملة', 'Play Sentence') : dictAudioState === 'loading' ? _resolveTranslation(lang, 'جاري التحميل...', 'Loading...') : _resolveTranslation(lang, 'يتم التشغيل...', 'Playing...')}
              </button>

              <textarea
                value={dictInput}
                onChange={e => setDictInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && dictInput.trim()) { e.preventDefault(); checkDictAnswer(); } }}
                placeholder={_resolveTranslation(lang, 'اكتب ما سمعته...', 'Type what you heard...')}
                rows={2}
                className="w-full bg-gray-50 dark:bg-[var(--app-card)] border border-gray-300 dark:border-[var(--app-border)] text-gray-900 dark:text-[var(--app-text)] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--app-accent1)] resize-none"
                dir="ltr"
              />

              <button
                onClick={checkDictAnswer}
                disabled={!dictInput.trim()}
                className="px-6 py-2.5 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black disabled:opacity-50 text-white rounded-xl font-bold transition shadow"
              >
                {_resolveTranslation(lang, 'تحقق', 'Check')}
              </button>

              {dictResults.length > 0 && (
                <div className="space-y-2 mt-2">
                  {dictResults.map((r, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${r.score >= 80 ? 'bg-green-50 dark:bg-[var(--app-accent1)]/10 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${r.score >= 80 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{r.score}%</span>
                        <span className="text-gray-500 dark:text-[var(--app-text)] text-xs">{_resolveTranslation(lang, `جملة ${i + 1}`, `Sentence ${i + 1}`)}</span>
                      </div>
                      <div dir="ltr" className="text-gray-600 dark:text-[var(--app-text)] text-xs"><span className="font-semibold">{_resolveTranslation(lang, 'الصحيح:', 'Expected:')}</span> {r.expected}</div>
                      <div dir="ltr" className="text-gray-800 dark:text-[var(--app-text)] text-xs mt-0.5"><span className="font-semibold">{_resolveTranslation(lang, 'كتبت:', 'You wrote:')}</span> {r.typed}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-6 rounded-2xl text-center font-extrabold text-2xl ${avgDictScore >= 80 ? 'bg-green-100 dark:bg-[var(--app-accent1)]/12 text-green-700 dark:text-green-300' : avgDictScore >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {avgDictScore >= 80 ? '🎉 ' : avgDictScore >= 50 ? '👍 ' : '📚 '}
                {_resolveTranslation(lang, `متوسط الدقة: ${avgDictScore}%`, `Average Accuracy: ${avgDictScore}%`)}
              </div>
              <div className="space-y-2">
                {dictResults.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl text-sm ${r.score >= 80 ? 'bg-green-50 dark:bg-[var(--app-accent1)]/10 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${r.score >= 80 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{r.score}%</span>
                      <span className="text-gray-500 dark:text-[var(--app-text)] text-xs">{_resolveTranslation(lang, `جملة ${i + 1}`, `Sentence ${i + 1}`)}</span>
                    </div>
                    <div dir="ltr" className="text-gray-600 dark:text-[var(--app-text)] text-xs"><span className="font-semibold">{_resolveTranslation(lang, 'الصحيح:', 'Expected:')}</span> {r.expected}</div>
                    <div dir="ltr" className="text-gray-800 dark:text-[var(--app-text)] text-xs mt-0.5"><span className="font-semibold">{_resolveTranslation(lang, 'كتبت:', 'You wrote:')}</span> {r.typed}</div>
                  </div>
                ))}
              </div>
              <button onClick={startDictation} className="px-5 py-2.5 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black rounded-xl font-bold transition shadow flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> {_resolveTranslation(lang, 'أعد المحاولة', 'Try Again')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Reading: passage + read-aloud ── */}
      {story && type === 'reading' && (
        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-8 rounded-xl border border-gray-200 dark:border-[var(--app-border)] shadow-inner">
          <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-[var(--app-border)]">
            <button
              onClick={handlePlayPause}
              disabled={audioState === 'loading'}
              className="flex items-center gap-2 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black disabled:opacity-60 text-white px-4 py-2 rounded-xl font-bold text-sm transition shadow"
            >
              {audioState === 'loading' ? <Activity className="animate-spin w-4 h-4" /> : audioState === 'playing' ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {audioState === 'loading' ? _resolveTranslation(lang, 'جاري التحميل...', 'Loading...') : audioState === 'playing' ? _resolveTranslation(lang, 'إيقاف مؤقت', 'Pause') : _resolveTranslation(lang, 'قراءة بصوت', 'Read Aloud')}
            </button>
            {audioState !== 'idle' && (
              <button onClick={stopAudio} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-200 dark:bg-[var(--app-card)] text-gray-700 dark:text-[var(--app-text)] text-sm font-medium hover:bg-gray-300 dark:hover:bg-[var(--app-hover)] hover:text-black transition">
                <RotateCcw className="w-3.5 h-3.5" /> {_resolveTranslation(lang, 'إيقاف', 'Stop')}
              </button>
            )}
            <div className="flex gap-1 ml-auto bg-gray-200 dark:bg-[var(--app-card)] rounded-xl p-1">
              {[0.75, 1, 1.25, 1.5].map(s => (
                <button key={s} onClick={() => handleSpeedChange(s)} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${playbackSpeed === s ? 'bg-[var(--app-accent1)] text-white' : 'text-gray-500 dark:text-[var(--app-text)] hover:text-gray-700 dark:hover:text-[var(--app-text)]'}`}>{s}×</button>
              ))}
            </div>
          </div>
          <div dir="ltr" className="text-lg leading-loose font-medium text-gray-800 dark:text-[var(--app-text)] whitespace-pre-wrap">
            {safeRender(story)}
          </div>
        </div>
      )}

      {/* ── Golden Rules + Sources ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3 bg-white dark:bg-[var(--app-card)] p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-5 lg:mb-8 border-b border-gray-200 dark:border-[var(--app-border)] pb-4">{_resolveTranslation(lang, 'القواعد الذهبية', 'Golden Rules')}</h3>
          <ul className="space-y-6">
            {contentSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-blue-100 dark:bg-[var(--app-accent1)]/12 text-black dark:text-white font-bold">{idx + 1}</div>
                <span className="text-gray-700 dark:text-[var(--app-text)] text-lg leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-[var(--app-card)] p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-5 lg:mb-8 border-b border-gray-200 dark:border-[var(--app-border)] pb-4">{_resolveTranslation(lang, 'المصادر', 'Sources')}</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {currentLinks.map((link, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-[var(--app-card)] p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] transition-colors shadow-sm">
                <div className="text-left mb-3" dir="ltr">
                  <p className="font-bold text-gray-900 dark:text-[var(--app-text)] text-lg">{link.name}</p>
                  <span className="inline-block mt-1 text-xs font-bold text-black dark:text-white bg-blue-100 dark:bg-[var(--app-accent1)]/10 px-2 py-1 rounded">{link.level}</span>
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full py-2 bg-gray-200 dark:bg-[var(--app-card)] hover:bg-gray-300 dark:hover:bg-[var(--app-hover)] hover:text-black text-gray-800 dark:text-[var(--app-text)] rounded-xl text-sm font-bold transition-colors">
                  {_resolveTranslation(lang, 'تصفح المصدر', 'Visit Source')}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
function Writing({
  AI_KEY,
  lang,
  theme,
  writingHistory,
  setWritingHistory
}) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [writingTopic, setWritingTopic] = useState('');
  const [writingQuestion, setWritingQuestion] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  useEffect(() => {
    if (!writingTopic) { setWritingQuestion(''); return; }
    setLoadingQuestion(true);
    const prompt = `Generate a clear and engaging writing prompt question about the topic: "${writingTopic.split('(')[0].trim()}" for an English language learner. Make it one direct question that encourages 2-3 paragraphs of writing. Return only the question text, nothing else.`;
    let _wq = '';
    streamFromAPI(prompt, (delta) => { _wq += delta; setWritingQuestion(cleanFallbackText(_wq)); })
      .then(() => setLoadingQuestion(false))
      .catch(() => { setWritingQuestion(''); setLoadingQuestion(false); });
  }, [writingTopic]);
  const t = {
    title: _resolveTranslation(lang, 'مصحح الكتابة المتقدم', 'Advanced AI Corrector'),
    placeholder: _resolveTranslation(lang, "اكتب مقالاً قصيراً هنا (مثلاً عن طموحاتك)...", "Write a short essay here..."),
    btn: _resolveTranslation(lang, "تحليل وتصحيح النص ✨", "Analyze & Correct Text ✨"),
    corrected: _resolveTranslation(lang, "النص المصحح", "Corrected Text"),
    explanation: _resolveTranslation(lang, "الشرح:", "Explanation:"),
    history: _resolveTranslation(lang, "السجل", "History"),
    emptyHistory: _resolveTranslation(lang, "لا يوجد سجل بعد.", "No history yet.")
  };
  const handleCorrect = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const prompt = `Correct this English text and provide a review. Respond strictly in JSON format: { "corrected_text": "...", "explanation": "Explanation in ${_resolveTranslation(lang, 'Arabic', 'English')}", "score": "X/10" }. Text: "${text}"`;
      const raw = await fetchFromGemini(prompt, AI_KEY);
      const json = parseGeminiJSON(raw);
      if (json && json.error) {
        setFeedback({
          error: json.error
        });
      } else {
        const safeRaw = raw || "";
        const nextFeedback = json || {
          corrected_text: cleanFallbackText(safeRaw),
          explanation: _resolveTranslation(lang, "مشكلة في التنسيق.", "Formatting issue."),
          score: ""
        };
        setFeedback(nextFeedback);
        setWritingHistory(prev => [{
          id: Date.now(),
          input: text,
          output: nextFeedback.corrected_text || '',
          explanation: nextFeedback.explanation || '',
          score: nextFeedback.score || '',
          createdAt: new Date().toISOString()
        }, ...prev].slice(0, 25));
      }
    } catch (e) {
      setFeedback({
        error: _resolveTranslation(lang, "خطأ في الاتصال بالذكاء الاصطناعي.", "Error connecting to AI.")
      });
    }
    setLoading(false);
  };
  const startNewWriting = () => {
    if (text.trim() || feedback) {
      setWritingHistory(prev => [{
        id: Date.now(),
        input: text,
        output: feedback?.corrected_text || '',
        explanation: feedback?.explanation || '',
        score: feedback?.score || '',
        createdAt: new Date().toISOString()
      }, ...prev].slice(0, 25));
    }
    setText('');
    setFeedback(null);
  };
  return <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-black dark:text-white mb-4 flex items-center justify-center gap-4">
        <PenTool className="text-[var(--app-accent1)] w-8 h-8" />
        {t.title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400">Improve your writing with AI-powered feedback and corrections.</p>
    </div>

    <div className="space-y-6">
      <div className="premium-card p-6">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-gray-900 dark:text-white">Topic (Optional)</label>
          <CustomDropdown
            value={writingTopic}
            onChange={setWritingTopic}
            options={SPEAKING_TOPICS.map(tp => ({
              value: tp,
              label: lang === 'ar' ? tp.split('(')[0].trim() : (tp.match(/\(([^)]+)\)/)?.[1] || tp)
            }))}
            icon={List}
            theme={theme}
            placeholder={_resolveTranslation(lang, '— اختر موضوعاً —', '— Select a topic —')}
          />
          {loadingQuestion && <p className="text-xs text-[var(--app-accent1)] animate-pulse flex items-center gap-2"><Activity className="w-3.5 h-3.5 animate-spin" /> Generating prompt...</p>}
        </div>
      </div>

      <div className="premium-card p-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={writingQuestion || t.placeholder}
          className="w-full h-80 bg-transparent border-none p-6 text-lg text-gray-900 dark:text-white outline-none placeholder-gray-400 resize-none"
          dir="auto"
        />
      </div>

      <div className="flex gap-4">
        <button onClick={startNewWriting} className="flex-1 py-4 rounded-xl font-bold bg-gray-100 dark:bg-[var(--app-surface)] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all">
          New
        </button>
        <button onClick={handleCorrect} disabled={loading || !text.trim()} className="flex-[3] py-4 rounded-xl font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-sm disabled:opacity-50">
          {loading ? <Activity className="animate-spin w-6 h-6 mx-auto" /> : t.btn}
        </button>
      </div>
    </div>

    {feedback && !feedback.error && <div className="mt-10 space-y-6 animate-fadeIn">
      <div className="bg-green-50 dark:bg-[var(--app-card)] p-8 rounded-xl border border-green-200 dark:border-green-500/20 shadow-sm">
        <h3 className="text-green-700 dark:text-green-400 font-bold mb-4 flex justify-between items-center text-xl">{t.corrected} <span className="text-yellow-600 dark:text-yellow-400">{safeRender(feedback.score)}</span></h3>
        <p className="text-gray-900 dark:text-[var(--app-text)] text-xl leading-relaxed" dir="ltr">{safeRender(feedback.corrected_text)}</p>
      </div>
      {feedback.explanation && <div className="bg-white dark:bg-[var(--app-card)] p-8 rounded-xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm">
        <h3 className="text-black dark:text-white font-bold mb-2">{t.explanation}</h3>
        <p className="text-gray-700 dark:text-[var(--app-text)] leading-relaxed" style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(feedback.explanation)}</p>
      </div>}
    </div>}
    {feedback && feedback.error && <div className="mt-6 bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400 text-center font-bold">
      {safeRender(feedback.error)}
    </div>}
  </div>;
}
function Speaking({
  AI_KEY,
  userLevel,
  lang,
  theme,
  speakingHistory,
  setSpeakingHistory
}) {
  const t = {
    welcome: _resolveTranslation(lang, `مرحباً بك! بناءً على تقييمك، مهاراتك في التحدث ممتازة (${userLevel}). لنتدرب على بعض المواضيع المتقدمة.`, `Hello! Your speaking skills are evaluated at ${userLevel}. Let's practice some advanced topics.`),
    title: _resolveTranslation(lang, 'ممارسة طلاقة التحدث', 'Fluency Practice'),
    placeholder: _resolveTranslation(lang, 'اكتب رسالتك أو سجل صوتاً...', 'Type or record your message...'),
    thinking: _resolveTranslation(lang, 'الذكاء الاصطناعي يفكر...', 'AI is thinking...'),
    newChat: _resolveTranslation(lang, 'محادثة جديدة', 'New Chat'),
    callMode: _resolveTranslation(lang, 'مكالمة', 'Call'),
    roleplay: _resolveTranslation(lang, 'محاكاة (Roleplay)', 'Roleplay Scenario'),
    corrected: _resolveTranslation(lang, 'تم التصحيح التلقائي', 'Auto-Corrected'),
    clarity: _resolveTranslation(lang, 'الوضوح', 'Clarity'),
    grammar: _resolveTranslation(lang, 'القواعد', 'Grammar'),
    fluency: _resolveTranslation(lang, 'السلاسة', 'Fluency'),
    native: _resolveTranslation(lang, 'كيف يقولها المتحدث الأصلي؟', 'How would a native say it?'),
    listen: _resolveTranslation(lang, 'استمع للنطق الصحيح', 'Listen to correct pronunciation'),
    micOn: _resolveTranslation(lang, 'تحدث الآن، الميكروفون مفتوح...', 'Speak now, microphone is open...'),
    tapMic: _resolveTranslation(lang, 'اضغط للتحدث', 'Tap to speak'),
    callActive: _resolveTranslation(lang, 'مكالمة قيد الإجراء...', 'Call in progress...'),
    stopCall: _resolveTranslation(lang, 'إنهاء المكالمة', 'End Call'),
    informal: _resolveTranslation(lang, 'غير رسمي', 'Informal'),
    formal: _resolveTranslation(lang, 'رسمي', 'Formal'),
    male: _resolveTranslation(lang, 'ذكر', 'Male'),
    female: _resolveTranslation(lang, 'أنثى', 'Female'),
    uk: _resolveTranslation(lang, 'بريطانية', 'UK'),
    us: _resolveTranslation(lang, 'أمريكية', 'US'),
    accent: _resolveTranslation(lang, 'اللكنة', 'Accent'),
    scenario: _resolveTranslation(lang, 'سيناريو', 'Scenario'),
    autoPlay: _resolveTranslation(lang, 'تشغيل تلقائي', 'Auto Play'),
    level: _resolveTranslation(lang, 'المستوى', 'Level'),
    topic: _resolveTranslation(lang, 'الموضوع', 'Topic'),
    history: _resolveTranslation(lang, 'السجل', 'History'),
    selectTopic: _resolveTranslation(lang, '— اختر موضوعاً —', '— Select a topic —')
  };
  const [messages, setMessages] = useState([{
    id: 1,
    role: 'ai',
    text: t.welcome
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLevel, setChatLevel] = useState(userLevel);
  const [formality, setFormality] = useState('informal');
  const [topic, setTopic] = useState(SPEAKING_TOPICS[0]);
  const [isCallMode, setIsCallMode] = useState(false);
  const [showCallTranscript, setShowCallTranscript] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [micAutoMode, setMicAutoMode] = useState(true);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [voiceGender, setVoiceGender] = useState('male');
  const [callReview, setCallReview] = useState(null);
  const callAudioRef = useRef(null);
  const [usingBrowserTTS, setUsingBrowserTTS] = useState(false);
  const [ttsEngine, setTtsEngine] = useState('elevenlabs'); // 'elevenlabs' | 'edge' | 'browser'
  const [voiceAccent, setVoiceAccent] = useState('uk'); // 'uk' | 'us'
  const chatEndRef = useRef(null);
  const transcriptScrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const ttsQueueRef = useRef([]); // Stores { text, msgId } objects
  const prefetchCacheRef = useRef(new Map());
  const isTtsPlayingRef = useRef(false);

  const processTtsQueue = async () => {
    if (isTtsPlayingRef.current || ttsQueueRef.current.length === 0) return;
    isTtsPlayingRef.current = true;
    while (ttsQueueRef.current.length > 0) {
      const item = ttsQueueRef.current.shift();
      if (!item || !item.text) continue;

      const { text, msgId } = item;

      // 1. Get the pre-fetched blob promise
      const blobPromise = prefetchCacheRef.current.get(text);
      let blob = null;
      if (blobPromise) {
        blob = await blobPromise;
      } else {
        // Fallback if not pre-fetched
        blob = await fetchTTSBlob(text, voiceGender, voiceAccent);
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        _currentTTSAudio = audio;

        // --- SYNC TRANSCRIPT TO VOICE ---
        // If we have a msgId, append this segment to the visible text as it starts playing (Call Mode only)
        if (msgId && isCallMode) {
          setMessages(prev => prev.map(msg =>
            msg.id === msgId
              ? { ...msg, text: (msg.text || '') + (msg.text ? ' ' : '') + text }
              : msg
          ));
        }

        await new Promise((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          audio.play().catch(resolve);
        });
      }
      // Cleanup cache
      prefetchCacheRef.current.delete(text);
    }
    isTtsPlayingRef.current = false;
    // --- AUTO-MIC: Restart recording after AI finishes speaking ---
    if (isCallMode && micAutoMode && !isRecording) {
      setTimeout(() => {
        handleVoiceRecord();
      }, 400); // Small delay to ensure clean start
    }
  };

  const queueSpeech = (text, msgId = null) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // PRE-FETCH: Start synthesis IMMEDIATELY
    if (!prefetchCacheRef.current.has(trimmed)) {
      prefetchCacheRef.current.set(trimmed, fetchTTSBlob(trimmed, voiceGender, voiceAccent));
    }
    ttsQueueRef.current.push({ text: trimmed, msgId });
    processTtsQueue();
  };
  const saveConversationToHistory = (conversation) => {
    const lastAiMessage = [...conversation].reverse().find(msg => msg.role === 'ai' && msg.text && msg.text !== t.welcome);
    const lastUserMessage = [...conversation].reverse().find(msg => msg.role === 'user');
    if (!lastAiMessage && !lastUserMessage) return;
    const firstUserText = String(lastUserMessage?.text || '').trim();
    const firstAiText = String(lastAiMessage?.text || '').trim();
    const source = `${topic || ''} ${firstUserText} ${firstAiText}`.trim().toLowerCase();
    const title = source.includes('hi') || source.includes('hello') || source.includes('hey') || source.includes('greeting') ? 'Greeting' : source.includes('interview') ? 'Interview' : source.includes('travel') ? 'Travel' : source.includes('work') || source.includes('job') ? 'Work' : source.includes('study') || source.includes('learn') ? 'Study' : String(topic || 'Conversation').split('(')[0].trim().replace(/\s+/g, ' ') || 'Conversation';
    setSpeakingHistory(prev => [{
      id: Date.now(),
      mode: isCallMode ? 'call' : 'chat',
      topic,
      title,
      level: chatLevel,
      messages: conversation,
      summary: lastUserMessage?.text || lastAiMessage?.text || '',
      reply: lastAiMessage?.text || '',
      createdAt: new Date().toISOString()
    }, ...prev].slice(0, 25));
  };
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, expandedReviewId]);
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [messages]);
  // Use ElevenLabs for natural AI voice — falls back to browser TTS if key not set.
  // Male: Adam (pNInz6obpgDQGcFmaJgB) — American | Female: Rachel (21m00Tcm4TlvDq8ikWAM) — American
  // Keep module-level accent var in sync with React state
  useEffect(() => { _voiceAccent = voiceAccent; }, [voiceAccent]);

  // Pre-warm the Edge TTS WebSocket connection as soon as the component mounts
  // so the first speech request skips the ~300ms WebSocket handshake latency.
  useEffect(() => {
    const accent = _voiceAccent === 'us' ? 'us' : 'uk';
    const voice = EDGE_VOICES[accent][voiceGender === 'female' ? 'female' : 'male'];
    fetch(`/api/edge-tts-warmup?voice=${encodeURIComponent(voice)}`).catch(() => { });
  }, []);

  const speakText = async (text, interrupt = true) => {
    const voiceId = voiceGender === 'female' ? ELEVENLABS_SARAH_ID : ELEVENLABS_BRIAN_ID;
    await elevenLabsSpeak(text, voiceId, interrupt);
    // Update TTS mode indicator after each call
    const engine = _lastTTSEngine || 'edge';
    setTtsEngine(engine);
    setUsingBrowserTTS(engine === 'browser');
  };

  const handleSend = async (forcedText = null) => {
    const userMsg = forcedText || input;
    if (!userMsg.trim()) return;
    if (!forcedText) setInput('');
    const newMsgId = Date.now();
    const aiMsgId = newMsgId + 1;
    setMessages(prev => [...prev, { id: newMsgId, role: 'user', text: userMsg }]);
    setLoading(true);
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', streaming: true }]);
    try {
      const history = messages.slice(-2).map(m => `${m.role === 'ai' ? 'AI' : 'User'}: ${m.text}`).join('\n');
      const isArabicMsg = hasArabicText(userMsg);
      const langInstruction = isArabicMsg
        ? 'The user wrote in Arabic. Reply in Arabic naturally and warmly.'
        : 'Reply in English.';

      // ── Step 1: Stream the reply immediately — plain text, no JSON ──────────
      const replyPrompt = `You are a friendly, natural conversation partner helping an English learner. ${langInstruction} Level: ${chatLevel}. Topic: ${topic}. Style: ${formality}. Recent context: ${history}. User said: "${userMsg}". Reply warmly in 1-3 sentences. Output the reply text ONLY — no JSON, no labels, no analysis whatsoever.`;
      let replyText = '';
      let spokenSentencesCount = 0;

      // Clear queue for new message
      ttsQueueRef.current = [];

      await streamFromAPI(replyPrompt, (delta) => {
        replyText += delta;

        // --- SYNCED TRANSCRIPT LOGIC ---
        // If in Call Mode, we don't update the message text here. 
        // Instead, processTtsQueue will append text as it speaks.
        if (!isCallMode) {
          setMessages(prev => prev.map(msg =>
            msg.id === aiMsgId ? { ...msg, text: replyText } : msg
          ));
        }

        // ── Real-time High-Speed Rolling TTS ──
        if (isCallMode || autoRead) {
          const unsent = replyText.slice(spokenSentencesCount).trim();
          // Match any natural break: . ? ! \n , ; or a long segment (> 70 chars)
          const breakMatch = unsent.match(/[^.!?\n,;]{5,}[.!?\n,;]+/);

          if (breakMatch) {
            const segment = breakMatch[0];
            queueSpeech(segment, aiMsgId);
            // We use char count to track where we are in the stream
            spokenSentencesCount += (replyText.indexOf(segment, spokenSentencesCount) - spokenSentencesCount) + segment.length;
          } else if (unsent.length > 100) {
            // Safety break for very long sentences without punctuation
            const lastSpace = unsent.lastIndexOf(' ');
            if (lastSpace > 50) {
              const segment = unsent.slice(0, lastSpace);
              queueSpeech(segment, aiMsgId);
              spokenSentencesCount += (replyText.indexOf(segment, spokenSentencesCount) - spokenSentencesCount) + segment.length;
            }
          }
        }
      }, 256);

      replyText = replyText.trim();

      // Final flush for any remaining text
      const remaining = replyText.slice(spokenSentencesCount).trim();
      if (remaining.length > 2) {
        queueSpeech(remaining, aiMsgId);
      }

      setMessages(prev => prev.map(msg =>
        msg.id === aiMsgId ? { ...msg, text: isCallMode ? msg.text : replyText, streaming: false } : msg
      ));

      // ── Step 2: Background correction — fires in parallel, never blocks ─────
      fetchFromGemini(
        `Review this ${isArabicMsg ? 'Arabic' : 'English'} message from a ${chatLevel} learner: "${userMsg}". Return ONLY a valid JSON object with no markdown fences: {"clarity":"one short sentence","grammar":"one short sentence","fluency":"one short sentence","native_way":"how a native speaker would phrase this"}`,
        null
      ).then(reviewRaw => {
        const review = parseGeminiJSON(reviewRaw);
        if (review && !review.error && (review.clarity || review.grammar)) {
          setMessages(prev => prev.map(msg =>
            msg.id === newMsgId ? { ...msg, review } : msg
          ));
        }
      }).catch(() => { });
    } catch (err) {
      setMessages(prev => prev.map(msg =>
        msg.id === aiMsgId
          ? { ...msg, text: _resolveTranslation(lang, "فشل الاتصال بالذكاء الاصطناعي.", "Error connecting to AI."), streaming: false, role: 'system' }
          : msg
      ));
    } finally {
      setLoading(false);
    }
  };
  const startNewConversation = async () => {
    setLoading(true);
    const currentConversation = [...messages];
    saveConversationToHistory(currentConversation);
    const aiMsgId = Date.now();
    setMessages([{ id: aiMsgId, role: 'ai', text: '', streaming: true }]);
    let spokenSentencesCount = 0;
    try {
      const prompt = `Start a short ${formality === 'formal' ? 'formal' : 'casual'} English conversation for a ${chatLevel} learner about "${topic}". Ask one natural, engaging question only. No intro text, just the question.`;
      let accumulated = '';
      await streamFromAPI(prompt, (delta) => {
        accumulated += delta;
        if (!isCallMode) {
          setMessages([{ id: aiMsgId, role: 'ai', text: accumulated, streaming: true }]);
        }

        // Sync check for start conversation too
        if (isCallMode || autoRead) {
          const unsent = accumulated.slice(spokenSentencesCount).trim();
          const breakMatch = unsent.match(/[^.!?\n,;]{5,}[.!?\n,;]+/);
          if (breakMatch) {
            const segment = breakMatch[0];
            queueSpeech(segment, aiMsgId);
            spokenSentencesCount += (accumulated.indexOf(segment, spokenSentencesCount) - spokenSentencesCount) + segment.length;
          }
        }
      });

      const remaining = accumulated.trim().slice(spokenSentencesCount);
      if (remaining.length > 2) {
        queueSpeech(remaining, aiMsgId);
      }

      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, streaming: false } : m));
    } catch (e) {
      setMessages([{
        id: Date.now(),
        role: 'system',
        text: _resolveTranslation(lang, "فشل الاتصال.", "Connection failed.")
      }]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!topic) return;
    if (messages.length > 1) {
      const opener = `Let's talk about ${topic}. What interests you most about it?`;
      const aiMsgId = Date.now();
      setMessages([{ id: aiMsgId, role: 'ai', text: isCallMode ? '' : opener }]);
      if (autoRead) {
        if (isCallMode) queueSpeech(opener, aiMsgId);
        else speakText(opener);
      }
    }
  }, [topic]);
  const handleVoiceRecord = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(_resolveTranslation(lang, "متصفحك لا يدعم تسجيل الصوت. استخدم Chrome.", "Browser doesn't support voice. Use Chrome."));
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = !!isCallMode;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = event => {
      if (isCallMode) {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const phrase = event.results[i][0].transcript.trim();
            if (phrase) {
              recognition.stop();
              handleSend(phrase);
              break;
            }
          }
        }
      } else {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript.trim());
      }
    };
    recognition.onerror = (e) => {
      setIsRecording(false);
      console.warn("Speech error:", e.error);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };
  const toggleCallMode = () => {
    if (isCallMode) {
      // Ending call — collect corrections from conversation
      const corrections = messages.filter(m => m.role === 'user' && m.review);
      setCallReview(corrections.length > 0 ? corrections : null);
      if (callAudioRef.current) { callAudioRef.current.pause(); callAudioRef.current = null; }
      cancelTTS();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      setIsCallMode(false);
    } else {
      setCallReview(null);
      setIsCallMode(true);
      speakText("Call started. What would you like to talk about?");
    }
  };
  const generateScenario = async () => {
    setLoadingScenario(true);
    try {
      const prompt = `Generate a realistic and challenging roleplay scenario in English for a student at level ${chatLevel}.
      Example: "You are returning a broken laptop to a store and the clerk is being difficult."
      Provide the scenario in English and a short instruction in ${_resolveTranslation(lang, 'Arabic', 'English')}. Return text only.`;
      const response = await fetchFromGemini(prompt, AI_KEY);
      const errJson = parseGeminiJSON(response);
      if (errJson && errJson.error) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'system',
          text: errJson.error
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          text: response
        }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScenario(false);
    }
  };
  if (isCallMode) {
    const lastAiCallMsg = [...messages].reverse().find(m => m.role === 'ai' && m.text);
    const blobClass = loading ? 'blob-speak' : isRecording ? 'blob-listen' : 'blob-idle';
    const isDark = theme === 'dark';
    return <div className={`relative w-full h-[88vh] flex flex-col animate-fadeIn select-none transition-colors duration-300 ${isDark ? 'bg-[var(--app-bg)]' : 'bg-[#f2f2ee]'}`}>

      {/* ── Top-left: LIVE status + voice mode pill ── */}
      {/* ── Top Header: Status & Options ── */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase">Live</span>
          </div>

          <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setVoiceAccent(voiceAccent === 'uk' ? 'us' : 'uk')}
              className="px-3 py-1 text-[10px] font-bold text-white/70 hover:text-white transition-colors uppercase"
            >
              {voiceAccent === 'uk' ? t.uk : t.us}
            </button>
            <div className="w-px h-3 bg-white/10" />
            <button
              onClick={() => setVoiceGender(voiceGender === 'male' ? 'female' : 'male')}
              className="px-3 py-1 text-[10px] font-bold text-white/70 hover:text-white transition-colors uppercase"
            >
              {voiceGender === 'male' ? t.male : t.female}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{chatLevel}</p>
            <p className="text-xs font-semibold text-white/80">{
              lang === 'ar' ? topic.split('(')[0].trim() : (topic.match(/\(([^)]+)\)/)?.[1] || topic)
            }</p>
          </div>
          <button
            onClick={toggleCallMode}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-110 active:scale-95 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Center: blob + transcript ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-9 px-10">

        {/* Sesame-style morphing blob — no rings, no icons, pure shape */}
        <div
          className={`w-28 h-28 transition-colors duration-700 ${blobClass} ${isDark
            ? loading ? 'bg-[var(--app-accent2)]'
              : isRecording ? 'bg-[var(--app-accent1)]'
                : 'bg-[var(--app-surface)]'
            : loading ? 'bg-[#a0b4d0]'
              : isRecording ? 'bg-[#d0a0a0]'
                : 'bg-[#a4b49a]'
            }`}
        />

        {/* AI transcript — bounded scrollable box with fade-to-top effect */}
        <div className="w-full max-w-md relative px-4" style={{ height: '180px' }}>
          {/* Top fade — older messages dissolve upward */}
          <div className="absolute top-0 left-4 right-4 h-14 z-10 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${isDark ? 'var(--app-bg)' : '#f2f2ee'} 30%, transparent)` }} />
          {/* Scrollable transcript list */}
          <div ref={transcriptScrollRef} className="h-full overflow-y-auto flex flex-col justify-end pb-14 gap-4" style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {showCallTranscript ? (
              messages.filter(m => m.role === 'ai' && m.text).length > 0
                ? messages.filter(m => m.role === 'ai' && m.text).map(m => (
                  <div key={m.id} className="text-center px-4">
                    <p className={`text-lg md:text-xl leading-[1.6] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">
                      {/* Split by common sentence endings but keep them, then map to spans with reveal animation */}
                      {String(m.text).split(/(?<=[.!?])\s+/).map((segment, sIdx) => (
                        <span key={sIdx} className="animate-textReveal inline-block mr-1">
                          {safeRender(segment)}
                        </span>
                      ))}
                      {m.streaming && <span className={`inline-block w-[3px] h-5 ml-1 align-middle animate-pulse rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />}
                    </p>
                  </div>
                ))
                : <p className={`text-lg font-medium text-center ${isDark ? 'text-white/30' : 'text-black/30'}`}>{t.tapMic}</p>
            ) : (
              <p className={`text-lg font-medium text-center ${isDark ? 'text-white/20' : 'text-black/25'}`}>{_resolveTranslation(lang, 'النص مخفي', 'Transcript off')}</p>
            )}
          </div>
          {/* Bottom fade - height reduced to prevent obscuring text */}
          <div className="absolute bottom-0 left-4 right-4 h-6 z-10 pointer-events-none" style={{ background: `linear-gradient(to top, ${isDark ? 'var(--app-bg)' : '#f2f2ee'} 10%, transparent)` }} />
        </div>
      </div>

      {/* ── Bottom: Sesame-style pill control bar ── */}
      <div className="flex justify-center pb-10 pt-4">
        <div className={`inline-flex items-center rounded-2xl px-1.5 py-1.5 gap-0.5 transition-colors duration-300 ${isDark
          ? 'bg-[var(--app-surface)] shadow-[0_2px_20px_rgba(0,0,0,0.5)]'
          : 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)]'
          }`}>
          {/* Mute / Mic button */}
          <button onClick={handleVoiceRecord} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${isRecording
            ? isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-500'
            : isDark ? 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}>
            <Mic className={`w-4 h-4 flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`} />
            <span>{isRecording ? _resolveTranslation(lang, 'جاري الاستماع', 'Listening') : _resolveTranslation(lang, 'صامت', 'Mute')}</span>
          </button>

          {/* Divider */}
          <div className={`w-px h-5 mx-0.5 flex-shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />

          {/* Auto-Mic toggle */}
          <button onClick={() => setMicAutoMode(v => !v)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${micAutoMode
            ? isDark ? 'text-black dark:text-white bg-[var(--app-accent1)]/10' : 'text-emerald-700 bg-emerald-50'
            : isDark ? 'text-gray-600 hover:bg-white/[0.05] hover:text-gray-400' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}>
            <Zap className={`w-4 h-4 ${micAutoMode ? 'fill-current' : ''}`} />
            <span>{micAutoMode ? _resolveTranslation(lang, 'تلقائي: تشغيل', 'Auto: On') : _resolveTranslation(lang, 'تلقائي: إيقاف', 'Auto: Off')}</span>
          </button>

          {/* Divider */}
          <div className={`w-px h-5 mx-0.5 flex-shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />

          {/* Transcript toggle */}
          <button onClick={() => setShowCallTranscript(v => !v)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${showCallTranscript
            ? isDark ? 'text-gray-300 bg-white/[0.06]' : 'text-gray-700 bg-gray-100'
            : isDark ? 'text-gray-600 hover:bg-white/[0.05] hover:text-gray-400' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}>
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>{showCallTranscript ? _resolveTranslation(lang, 'النص: تشغيل', 'Text: On') : _resolveTranslation(lang, 'النص: إيقاف', 'Text: Off')}</span>
          </button>

          {/* Divider */}
          <div className={`w-px h-5 mx-0.5 flex-shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />

          {/* End call button */}
          <button onClick={toggleCallMode} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${isDark ? 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}>
            <span className="w-3 h-3 bg-red-500 rounded-[3px] flex-shrink-0" />
            <span>{t.stopCall}</span>
          </button>
        </div>
      </div>
    </div>;
  }
  return (
    <>
      <div className={`w-full h-[90vh] flex flex-col animate-fadeIn overflow-hidden bg-white dark:bg-black transition-colors ${isCallMode ? '' : 'border border-gray-100 dark:border-[var(--app-border)] rounded-2xl'}`}>
        {!isCallMode && (
          <header className="px-6 py-4 border-b border-gray-100 dark:border-[var(--app-border)] flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-black z-20">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold">{t.title}</h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Topic Selector */}
              <CustomDropdown
                value={topic}
                onChange={setTopic}
                options={SPEAKING_TOPICS.map(tp => ({
                  value: tp,
                  label: lang === 'ar' ? tp.split('(')[0].trim() : (tp.match(/\(([^)]+)\)/)?.[1] || tp)
                }))}
                icon={List}
                theme={theme}
                placeholder={t.selectTopic}
                className="w-44"
              />

              {/* Voice Config Pill */}
              <div className="flex h-10 items-center gap-1 bg-gray-50 dark:bg-[var(--app-surface)] p-1 rounded-xl border border-gray-100 dark:border-[var(--app-border)]">
                <button
                  onClick={() => setVoiceAccent(voiceAccent === 'uk' ? 'us' : 'uk')}
                  className="px-2.5 h-full flex items-center text-[10px] font-bold text-gray-500 hover:text-[var(--app-accent1)] transition-colors uppercase"
                >
                  {voiceAccent === 'uk' ? t.uk : t.us}
                </button>
                <div className="w-px h-3 bg-gray-200 dark:bg-[var(--app-card)]" />
                <button
                  onClick={() => setVoiceGender(voiceGender === 'male' ? 'female' : 'male')}
                  className="px-2.5 h-full flex items-center text-[10px] font-bold text-gray-500 hover:text-[var(--app-accent1)] transition-colors uppercase"
                >
                  {voiceGender === 'male' ? t.male : t.female}
                </button>
                <div className="w-px h-3 bg-gray-200 dark:bg-[var(--app-card)]" />
                <button
                  onClick={() => setAutoRead(!autoRead)}
                  className={`px-2.5 h-full flex items-center text-[10px] font-bold transition-colors ${autoRead ? 'text-[var(--app-accent2)]' : 'text-gray-300'}`}
                  title={t.autoPlay}
                >
                  <Volume2 size={16} />
                </button>
              </div>

              {/* Formality Toggle */}
              <div className="flex h-10 bg-gray-50 dark:bg-[var(--app-surface)] p-1 rounded-xl border border-gray-100 dark:border-[var(--app-border)]">
                {['informal', 'formal'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFormality(mode)}
                    className={`px-3 h-full flex items-center text-[10px] font-bold rounded-lg transition-all ${formality === mode ? 'bg-white dark:bg-[var(--app-card)] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    {mode === 'informal' ? t.informal : t.formal}
                  </button>
                ))}
              </div>

              <CustomDropdown
                value={chatLevel}
                onChange={setChatLevel}
                options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => ({ value: lvl, label: `${t.level} ${lvl}` }))}
                theme={theme}
                className="w-28"
              />

              <button onClick={generateScenario} disabled={loadingScenario} className="flex h-10 items-center gap-2 px-4 rounded-xl bg-[var(--app-accent1)] text-white text-[10px] font-bold hover:opacity-90 transition-all shadow-sm shadow-[var(--app-accent1)]/10 disabled:opacity-50">
                <Lightbulb size={16} />
                {loadingScenario ? '...' : t.scenario}
              </button>

              <button onClick={toggleCallMode} className="flex h-10 items-center gap-2 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold hover:opacity-90 transition-all shadow-sm">
                <Phone size={16} />
                {t.callMode}
              </button>

              <div className="flex h-10 items-center bg-gray-50 dark:bg-[var(--app-surface)] p-1 rounded-xl border border-gray-100 dark:border-[var(--app-border)]">
                <button onClick={() => setShowHistory(!showHistory)} title={t.history} className={`px-2 h-full flex items-center rounded-lg transition-colors ${showHistory ? 'bg-white dark:bg-[var(--app-card)] text-[var(--app-accent1)]' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Clock size={16} />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-[var(--app-card)]" />
                <button onClick={startNewConversation} title={t.newChat} className="px-2 h-full flex items-center rounded-lg text-gray-400 hover:text-[var(--app-accent1)] transition-colors">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white dark:bg-[var(--app-bg)] scroll-smooth">
          {showHistory && (
            <div className="mb-4 bg-white/90 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-4 shadow-sm">
              {speakingHistory.length === 0 ? (
                <p className="text-gray-500 dark:text-[var(--app-text)]">No history yet.</p>
              ) : (
                speakingHistory.map(item => (
                  <button key={item.id} onClick={() => setMessages(item.messages || [])} className="w-full text-left p-3 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] mb-3 last:mb-0 bg-gray-50 dark:bg-[var(--app-card)]">
                    <p className="text-xs text-gray-500 dark:text-[var(--app-text-muted)]">{new Date(item.createdAt).toLocaleString()}</p>
                    <p className="font-bold text-gray-900 dark:text-[var(--app-text)]">{item.title || item.topic}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slideUp`} style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className={`max-w-[85%] md:max-w-[75%] p-4 lg:p-5 rounded-2xl ${msg.role === 'user'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                : msg.role === 'system'
                  ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 w-full text-center'
                  : 'bg-gray-50 dark:bg-[var(--app-surface)] border border-gray-100 dark:border-[var(--app-border)] text-gray-900 dark:text-white shadow-sm'
                }`} dir="auto">
                <p className="text-base lg:text-lg leading-relaxed whitespace-pre-wrap">
                  {safeRender(msg.text)}
                  {msg.streaming && <span className="inline-block w-1 h-5 bg-[var(--app-accent1)] ml-1 align-middle animate-pulse rounded-full" />}
                </p>

                {msg.role === 'ai' && !msg.streaming && (
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-100 dark:border-[var(--app-card)] pt-3">
                    <button onClick={() => speakText(msg.text)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--app-card)] text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                      <Volume2 className="w-4.5 h-4.5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--app-card)] text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                      <Copy className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && msg.review && (
                <div className="mt-2 max-w-[85%] md:max-w-[70%] bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-2xl overflow-hidden shadow-sm animate-fadeIn transition-colors">
                  <button onClick={() => setExpandedReviewId(expandedReviewId === msg.id ? null : msg.id)} className="w-full px-4 py-3 bg-gray-50 dark:bg-[var(--app-card)] hover:bg-gray-100 dark:hover:bg-[var(--app-surface)] flex justify-between items-center text-sm font-bold text-gray-700 dark:text-[var(--app-text)] transition-colors">
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-[#FF4081]"><CheckCircle2 className="w-4 h-4" /> {t.corrected}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedReviewId === msg.id ? 'rotate-90' : ''}`} />
                  </button>

                  {expandedReviewId === msg.id && (
                    <div className="p-4 space-y-4 border-t border-gray-200 dark:border-[var(--app-border)] bg-white dark:bg-[var(--app-card)]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-3 rounded-xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm">
                          <p className="text-xs text-gray-500 mb-1 font-bold">{t.clarity}</p>
                          <p className="text-sm text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.clarity)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-3 rounded-xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm">
                          <p className="text-xs text-gray-500 mb-1 font-bold">{t.grammar}</p>
                          <p className="text-sm text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.grammar)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-3 rounded-xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm">
                          <p className="text-xs text-gray-500 mb-1 font-bold">{t.fluency}</p>
                          <p className="text-sm text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.fluency)}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 dark:bg-[var(--app-accent1)]/10 p-4 rounded-xl border border-emerald-100 dark:border-[var(--app-accent1)]/20 relative">
                        <h4 className="text-sm font-bold text-emerald-700 dark:text-[#FF4081] mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" /> {t.native}
                        </h4>
                        <p className="text-lg text-gray-900 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(msg.review.native_way)}"</p>

                        <div className="mt-4 flex gap-3">
                          <button onClick={() => speakText(safeRender(msg.review.native_way))} className="bg-[var(--app-accent1)] hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-md">
                            <Play className="w-4 h-4" /> {t.listen}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] p-5 rounded-2xl rounded-bl-none flex items-center gap-3 shadow-sm">
                <div className="w-2 h-2 bg-[var(--app-accent1)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--app-accent1)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[var(--app-accent1)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="px-6 py-6 border-t border-gray-100 dark:border-[var(--app-border)] bg-white dark:bg-black transition-colors">
          <div className="max-w-3xl mx-auto flex items-center gap-3 p-1.5 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-100 dark:border-[var(--app-border)] rounded-2xl focus-within:border-[var(--app-accent1)]/50 transition-all">
            <button onClick={handleVoiceRecord} className={`p-3 rounded-xl transition-all flex items-center justify-center ${isRecording ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}>
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={t.placeholder}
              className="flex-1 bg-transparent border-none text-gray-900 dark:text-white text-base px-2 py-2 outline-none placeholder-gray-400"
              dir="auto"
              disabled={loading}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className={`p-3 rounded-xl transition-all ${loading || !input.trim() ? 'text-gray-300' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-sm'}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {callReview && <div className="w-full mt-6 bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl overflow-hidden animate-fadeIn">
        <div className="bg-[var(--app-accent1)] p-4 text-white flex justify-between items-center">
          <h3 className="font-extrabold text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Call Corrections Review</h3>
          <button onClick={() => setCallReview(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {callReview.map((msg, i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl border border-gray-200 dark:border-[var(--app-border)]">
              <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider mb-2">You said:</p>
              <p className="text-gray-900 dark:text-[var(--app-text)] font-medium mb-3" dir="ltr">"{safeRender(msg.text)}"</p>
              {msg.review && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {msg.review.grammar && <div className="p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-xl"><p className="font-bold text-red-600 dark:text-red-400 text-xs mb-1">Grammar</p><p className="text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.grammar)}</p></div>}
                {msg.review.clarity && <div className="p-2.5 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30 rounded-xl"><p className="font-bold text-[#FF4081] dark:text-[#FF4081] text-xs mb-1">Clarity</p><p className="text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.clarity)}</p></div>}
                {msg.review.native_way && <div className="p-2.5 bg-emerald-50 dark:bg-[var(--app-accent1)]/10 border border-[#FF4081]/30 dark:border-[var(--app-accent1)]/30 rounded-xl"><p className="font-bold text-emerald-600 dark:text-[#FF4081] text-xs mb-1">Native way</p><p className="text-gray-800 dark:text-[var(--app-text)] italic">"{safeRender(msg.review.native_way)}"</p></div>}
              </div>}
            </div>
          ))}
        </div>
      </div>}
    </>
  );
}

function Langeek({
  AI_KEY,
  userLevel,
  lang,
  langeekVocab,
  setLangeekVocab
}) {
  const [srsData, setSrsData] = useState(() => JSON.parse(localStorage.getItem('venoxa_langeek_srs_data')) || {});
  const [vocabMode, setVocabMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(int);
  }, []);
  const [levelFilter, setLevelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiStory, setAiStory] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingContextStory, setLoadingContextStory] = useState(false);
  const [contextStory, setContextStory] = useState('');
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const t = {
    browse: _resolveTranslation(lang, 'تصفح كلمات لانجيك', 'Browse Langeek Words'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'قوائم الكلمات', 'Word Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    emptyLists: _resolveTranslation(lang, 'لا توجد كلمات في هذه القائمة حالياً.', 'No words in this list currently.'),
    rateWordsMsg: _resolveTranslation(lang, 'قيم الكلمات في قسم "تصفح الكلمات" لتظهر هنا.', 'Rate words in Browse mode to see them here.'),
    contextBtn: _resolveTranslation(lang, 'اربط كل الكلمات الصعبة في قصة واحدة', 'Link Hard Words in a Story'),
    smartCards: _resolveTranslation(lang, 'البطاقات الذكية المخصصة', 'Custom Smart Cards'),
    totalWords: _resolveTranslation(lang, 'إجمالي الكلمات المتاحة:', 'Total Available Words:'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث في لانجيك', 'Search Langeek'),
    filterLevel: _resolveTranslation(lang, 'تصفية بالمستوى', 'Filter by Level'),
    filterCategory: _resolveTranslation(lang, 'تصفية بالموضوع', 'Filter by Topic'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    noWords: _resolveTranslation(lang, 'لا توجد كلمات مطابقة', 'No matching words'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'لقد أنهيت جميع المراجعات المستحقة في هذا الوقت.', 'You have completed all due reviews.'),
    comeBackLater: _resolveTranslation(lang, 'عُد لاحقاً أو تصفح لتعلم المزيد.', 'Come back later or browse to learn more.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم كلمات جديدة', 'Browse and Learn New Words'),
    noMatch: _resolveTranslation(lang, 'لا توجد كلمات مطابقة لبحثك.', 'No words match your search.'),
    clearFilters: _resolveTranslation(lang, 'مسح الفلاتر', 'Clear Filters'),
    storyBtn: _resolveTranslation(lang, 'قصة للربط الذهني', 'Story for Memory'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    synonyms: _resolveTranslation(lang, 'مرادفات:', 'Synonyms:'),
    aiGenerated: _resolveTranslation(lang, 'مولدة بالذكاء الاصطناعي', 'AI Generated'),
    storyTitle: _resolveTranslation(lang, 'قصة ذكية للحفظ:', 'Smart Memory Story:'),
    clickToShow: _resolveTranslation(lang, 'انقر على البطاقة لإظهار المعنى والتقييم', 'Click the card to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };
  const dueCards = useMemo(() => {
    const now = Date.now();
    return langeekVocab.filter(card => {
      const data = srsData[card.word];
      if (!data) return false;
      return data.nextReview <= now;
    });
  }, [langeekVocab, srsData, tick]);
  const hardWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [langeekVocab, srsData, tick]);
  const learningWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'good'), [langeekVocab, srsData, tick]);
  const masteredWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'easy'), [langeekVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;
  const parseCSVLine = line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const lines = text.split('\n');
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const rowArr = parseCSVLine(lines[i]);
        if (rowArr.length >= 4 && rowArr[0]) {
          parsedData.push({
            category: rowArr[0]?.replace(/^\"|\"$/g, '') || 'General',
            level: rowArr[1]?.replace(/^\"|\"$/g, '') || '',
            word: rowArr[2]?.replace(/^\"|\"$/g, '') || '',
            type: rowArr[3]?.replace(/^\"|\"$/g, '') || '',
            meaning: rowArr[4]?.replace(/^\"|\"$/g, '') || '',
            example: rowArr[5]?.replace(/^\"|\"$/g, '') || '',
            synonyms: ''
          });
        }
      }
      if (parsedData.length > 0) {
        setLangeekVocab(parsedData);
        setLevelFilter('All');
        setSearchQuery('');
        setVocabMode('browse');
        setUploadMessage(`تم رفع ${parsedData.length} كلمة بنجاح! ✅`);
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        setUploadMessage('لم يتم العثور على كلمات، تأكد من صيغة الملف ❌');
      }
    };
    reader.readAsText(file);
  };
  const filteredVocabList = useMemo(() => {
    return langeekVocab.filter(item => {
      const matchesLevel = levelFilter === 'All' || item.level?.toUpperCase().includes(levelFilter.toUpperCase());
      const matchesCategory = categoryFilter === 'All' || item.category?.toUpperCase() === categoryFilter.toUpperCase();
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = item.word.toLowerCase().includes(searchLower) || item.meaning && item.meaning.toLowerCase().includes(searchLower);
      return matchesLevel && matchesCategory && matchesSearch;
    });
  }, [langeekVocab, levelFilter, categoryFilter, searchQuery]);
  const safeIndex = activeWordIndex < filteredVocabList.length ? activeWordIndex : 0;
  const card = vocabMode === 'review' ? dueCards[0] : filteredVocabList[safeIndex];
  useEffect(() => { setAiStory(''); setCardImage(null); setCollocationData(''); }, [card?.word]);
  useEffect(() => {
    if (vocabMode === 'browse' && filteredVocabList.length > 0 && activeWordIndex >= filteredVocabList.length) {
      setActiveWordIndex(0);
    }
  }, [filteredVocabList.length, activeWordIndex, vocabMode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = now;
    if (rating === 'again') nextReview = now + 1 * 60 * 1000; else if (rating === 'hard') nextReview = now + 10 * 60 * 1000; else if (rating === 'good') nextReview = now + 24 * 60 * 60 * 1000; else if (rating === 'easy') nextReview = now + 4 * 24 * 60 * 60 * 1000;
    const newData = {
      ...srsData,
      [card.word]: {
        nextReview,
        rating,
        lastReviewed: now
      }
    };
    setSrsData(newData);
    localStorage.setItem('venoxa_langeek_srs_data', JSON.stringify(newData));
    setShowMeaning(false);
    setAiStory('');
    setCollocationData('');
    setCardImage(null);
    if (vocabMode === 'browse') {
      setActiveWordIndex((safeIndex + 1) % filteredVocabList.length);
    }
  };
  const resetWordProgress = wordString => {
    const newData = {
      ...srsData
    };
    delete newData[wordString];
    setSrsData(newData);
    localStorage.setItem('venoxa_langeek_srs_data', JSON.stringify(newData));
  };
  // Play a word's pronunciation — respects the accent code directly
  const playAudio = async (accentCode, wordToPlay = card?.word) => {
    if (!wordToPlay) return;
    const voiceName = accentCode === 'en-US' ? EDGE_VOICES.us.male
      : accentCode === 'en-GB' ? EDGE_VOICES.uk.male
        : undefined;
    await edgeTTSSpeak(wordToPlay, 'male', voiceName);
  };

  const generateStory = async () => {
    if (loadingAi || aiStory || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `أنت معلم لغة إنجليزية مرح. قم بتأليف قصة قصيرة جداً ومضحكة (سطرين أو ثلاثة فقط) باللغة الإنجليزية تتضمن الكلمة "${card.word}" (والتي تعني: ${card.meaning}) لمساعدة طالب مستواه ${userLevel} على تذكرها بسهولة.
      بعد القصة الإنجليزية، أضف سطرين باللغة ${_resolveTranslation(lang, 'العربية', 'الإنجليزية')} تشرح فيهما كيف تم استخدام الكلمة في القصة.`;
      await streamText(prompt, setAiStory);
    } catch (err) {
      setAiStory(t.storyError);
    } finally {
      setLoadingAi(false);
    }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      // Step 1: ask the AI for a concrete, single-scene visual description that conveys the word's meaning.
      const briefPrompt = `You are a visual director. For the word "${card.word}", describe a SINGLE, concrete, photorealistic scene that captures the LITERAL meaning. 
Rules:
1. One subject, one action.
2. NO abstract concepts, NO text, NO letters.
3. Describe colors, lighting, and composition.
4. Output ONLY a 15-word English description.`;
      let visual = '';
      try {
        const raw = await fetchFromGemini(briefPrompt, AI_KEY);
        const errJson = parseGeminiJSON(raw);
        if (!errJson || !errJson.error) {
          visual = String(raw || '').trim().split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
          // Strip surrounding quotes if the model wrapped them.
          visual = visual.replace(/^["'`]+|["'`]+$/g, '').trim();
        }
      } catch (_) {/* fall through to default */ }
      if (!visual) {
        visual = `A photorealistic everyday scene that visually represents the English word "${card.word}"`;
      }
      const finalPrompt = `${visual} Photorealistic, natural lighting, clean composition, ultra detailed, no text, no letters, no captions, no watermark.`.replace(/[^\x00-\x7F]/g, "");
      const seed = Math.floor(Math.random() * 1_000_000);
      // Use image.pollinations.ai/prompt/ with flux model for better quality and reliability.
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(finalPrompt)}&width=640&height=420&seed=${seed}`);
    } catch (err) {
      console.error("Image generation error", err);
      const fallback = `Photorealistic image showing the meaning of the English word ${card.word}, no text, no letters.`;
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(fallback)}&width=640&height=420`);
    } finally {
      setLoadingImage(false);
    }
  };
  const generateContextStory = async () => {
    if (hardWords.length === 0 || loadingContextStory) return;
    setLoadingContextStory(true);
    try {
      const wordsStr = hardWords.map(w => w.word).join(', ');
      const prompt = `You are a creative writing teacher. Use ALL of these words: [${wordsStr}] in a single short, coherent, and interesting story in English. The story should be accessible for a ${userLevel} learner. After the story, explain the context of each word in ${_resolveTranslation(lang, 'Arabic', 'English')}.`;
      await streamText(prompt, setContextStory);
    } catch (e) {
      setContextStory(t.storyError);
    } finally {
      setLoadingContextStory(false);
    }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English collocations dictionary similar to ozdic.com. For the word "${card.word}", list the most common and natural collocations grouped by grammatical pattern. Use this exact format (skip patterns with no collocations, max 6 per group):\nVERB + ${card.word}: verb1, verb2, verb3\nADJ + ${card.word}: adj1, adj2, adj3\n${card.word} + NOUN: noun1, noun2\n${card.word} + VERB: verb1, verb2\nPREPOSITION: in ~, at ~, on ~\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row bg-white dark:bg-[var(--app-card)] p-1.5 rounded-xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
      <button onClick={() => {
        setVocabMode('browse');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'browse' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => {
        setVocabMode('review');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${vocabMode === 'review' ? 'bg-[var(--app-accent1)] text-white' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}>
        <Layers className="w-4 h-4" /> {t.review}
        {dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">{dueCards.length}</span>}
      </button>
      <button onClick={() => {
        setVocabMode('lists');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'lists' ? 'bg-[#1E90FF] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>

    {vocabMode === 'lists' && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>

      {listTab === 'hard' && hardWords.length > 0 && <div className="mb-6">
        <button onClick={generateContextStory} disabled={loadingContextStory} className="w-full py-4 bg-orange-50 dark:bg-orange-600/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-[#1E90FF]/20 transition-all shadow-sm">
          {loadingContextStory ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> ✨ {t.contextBtn}</>}
        </button>
        {contextStory && <div className={`mt-4 p-5 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl border border-gray-200 dark:border-[var(--app-border)] ${_resolveTranslation(lang, 'text-right', 'text-left')} prose prose-orange dark:prose-invert max-w-none`}><div style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(contextStory)}</div></div>}
      </div>}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateWordsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          return <div key={item.word} className="flex justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 dark:border-[var(--app-border)] transition-colors group">
            <div className="flex items-center gap-3">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 dark:text-[var(--app-accent1)] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Remove from SRS"><Trash2 className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[var(--app-card)] border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>
            <div className="text-left" dir="ltr">
              <p className="text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center justify-start gap-2">
                <button onClick={() => playAudio('en-US', item.word)} className="text-gray-500 hover:text-black dark:text-white dark:hover:text-blue-400 transition-colors"><Volume2 className="w-4 h-4" /></button>
                <span>{safeRender(item.word)}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-[var(--app-text)] mt-1">{safeRender(item.meaning)}</p>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {vocabMode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[var(--app-card)] p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-1">{t.smartCards}</h2><p className="text-sm text-gray-600 dark:text-[var(--app-text)]">{t.totalWords} {langeekVocab.length}</p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm text-green-600 dark:text-green-400 font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-[#1E90FF]/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-[var(--app-accent1)] dark:hover:bg-[#1E90FF] dark:hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            <UploadCloud className="w-4 h-4" /> {t.uploadCSV}
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-[var(--app-card)] p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Search className="w-4 h-4 text-black dark:text-white" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-4 py-3 text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-[var(--app-accent1)] dark:text-[var(--app-accent2)]" /> {t.filterLevel}</label>
          <CustomDropdown 
            value={levelFilter} 
            onChange={setLevelFilter} 
            options={['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => ({ value: lvl, label: lvl === 'All' ? 'All Levels' : lvl }))} 
            theme={theme}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-[var(--app-accent1)] dark:text-[var(--app-accent2)]" /> {t.filterCategory}</label>
          <CustomDropdown 
            value={categoryFilter} 
            onChange={setCategoryFilter} 
            options={[{ value: 'All', label: 'All Topics' }, ...[...new Set(langeekVocab.map(v => v.category).filter(Boolean))].map(c => ({ value: c, label: c }))]} 
            theme={theme}
            className="w-full"
          />

        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><List className="w-4 h-4 text-black dark:text-white dark:text-green-400" /> {t.manualSelect} ({filteredVocabList.length})</label>
          <CustomDropdown 
            value={safeIndex} 
            onChange={val => {
              setActiveWordIndex(Number(val));
              setShowMeaning(false);
              setAiStory('');
              setCardImage(null);
            }} 
            options={filteredVocabList.length === 0 ? [{ value: 0, label: t.noWords }] : filteredVocabList.map((item, idx) => ({ value: idx, label: safeRender(item.word) }))} 
            theme={theme}
            className="w-full"
          />
        </div>
      </div>
    </>}

    {vocabMode === 'review' && !card && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setVocabMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-xl font-bold">{t.browseLearn}</button>
    </div>}

    {vocabMode === 'browse' && (filteredVocabList.length === 0 || !card) && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[300px] flex flex-col items-center justify-center p-8 shadow-sm text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-[var(--app-accent1)] mb-4" />
      <h3 className="text-xl text-gray-600 dark:text-[var(--app-text)] font-bold">{t.noMatch}</h3>
    </div>}

    {card && vocabMode !== 'lists' && <div className="bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative hover:border-blue-300 transition-all duration-300 group animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>

      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
        <button onClick={e => {
          e.stopPropagation();
          playAudio('en-US');
        }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-xl text-black dark:text-white shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline">🇺🇸 US</span></button>
        <button onClick={e => {
          e.stopPropagation();
          playAudio('en-GB');
        }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-xl text-red-600 dark:text-red-400 shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline">🇬🇧 UK</span></button>
      </div>
      <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
        <span className="bg-gray-100 dark:bg-[var(--app-card)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-accent1)]/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{safeRender(card.level)}</span>
        {card.category && card.category !== 'All' && card.category !== 'General' && <span className="bg-indigo-50 dark:bg-[var(--app-accent1)]/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-[var(--app-accent1)]/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{safeRender(card.category)}</span>}
        {card.type && <span className="bg-emerald-50 dark:bg-[var(--app-accent2)]/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-[var(--app-accent2)]/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{safeRender(card.type)}</span>}
      </div>

      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-black dark:text-white text-sm mt-8 animate-pulse bg-gray-100 dark:bg-[var(--app-card)]/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-24 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 mt-4 w-full relative"><p className="text-lg md:text-xl text-gray-800 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        {card.synonyms && <div className="w-full bg-gray-100 dark:bg-[var(--app-card)]/30 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 dark:text-[var(--app-text)]" dir="ltr"><span className="font-bold text-gray-500 mr-2">{t.synonyms}</span> <span className="text-black dark:text-white">{safeRender(card.synonyms)}</span></div>}

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiStory && <button onClick={e => {
            e.stopPropagation();
            generateStory();
          }} disabled={loadingAi} className="flex-1 bg-orange-50 dark:bg-black dark:bg-white/10 text-black dark:text-white px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Lightbulb className="w-5 h-5" /> {t.storyBtn}</>}</button>}
          {!cardImage && <button onClick={e => {
            e.stopPropagation();
            generateImage();
          }} disabled={loadingImage} className="flex-1 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 text-black dark:text-white px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /> {t.imgBtn}</>}</button>}
          {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="flex-1 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/8 text-black dark:text-white px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingCollocation ? <Activity className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5" /> {t.collocationsBtn}</>}</button>}
        </div>

        {collocationData && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-teal-500 p-5 rounded-2xl w-full text-left mt-2" onClick={e => e.stopPropagation()}><div className="font-mono text-gray-800 dark:text-[var(--app-text)] text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(collocationData)}</div></div>}
        {aiStory && <div className={`bg-gray-50 dark:bg-[var(--app-card)] border-${_resolveTranslation(lang, 'r', 'l')}-4 border-orange-500 p-5 rounded-2xl w-full ${_resolveTranslation(lang, 'text-right', 'text-left')} mt-4`} onClick={e => e.stopPropagation()}><div className="prose prose-orange dark:prose-invert max-w-none text-gray-800 dark:text-[var(--app-text)] text-sm" style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(aiStory)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl flex flex-col items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-black dark:text-white mb-2 animate-bounce" /><span className="text-sm text-black dark:text-white font-bold">{t.loading}</span></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--app-border)] shadow-sm relative bg-gray-50 dark:bg-[var(--app-card)]" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => {
          e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found';
        }} /></div>}
      </div>}
    </div>}

    {showMeaning && card && vocabMode !== 'lists' && <div className="grid grid-cols-4 gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-rose-500/10 text-red-600 border border-red-200 py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center">{t.rateAgain} <span className="text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] border border-orange-200 py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center">{t.rateHard} <span className="text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[var(--app-accent2)]/10 text-green-600 border border-green-200 py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center">{t.rateGood} <span className="text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 text-black dark:text-white border border-[var(--app-accent1)]/30 py-3 rounded-2xl font-bold hover:bg-[var(--app-hover)] hover:text-black flex flex-col items-center">{t.rateEasy} <span className="text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
    </div>}
  </div>;
}

