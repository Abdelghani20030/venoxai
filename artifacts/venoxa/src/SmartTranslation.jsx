/**
 * SmartTranslation.jsx  — v4 (Accent Dropdown + Liquid Glass)
 * ─────────────────────────────────────────────────────────────────────
 * All v3 features preserved +
 *  • US / UK accent toggle (pill switcher) — Edge Neural TTS via proxy
 *     US: en-US-AvaMultilingualNeural (female) | UK: en-GB-RyanNeural (male)
 *  • Browser speechSynthesis fallback
 *  • Liquid-glass panel styling on all major surfaces
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeftRight, Copy, Check, X, Volume2, Sparkles, Loader2,
  ChevronDown, BookOpen, Clock, Trash2, RotateCcw,
  Globe, ChevronRight, ChevronUp, Zap, Info, Languages,
  MessageSquare, Link2, AlertCircle, Hash, Heart, Search, Star
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
  ? import.meta.env.BASE_URL
  : '/';

const streamFromAPI = async (prompt, onDelta, maxTokens = 1024) => {
  const url = `${BASE}api/chat/stream`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
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
          if (typeof parsed === 'string' && parsed !== '') { full += parsed; onDelta(parsed); }
        } catch { /* skip */ }
      }
    }
    return full;
  } catch (err) {
    window.clearTimeout(timeout);
    throw err;
  }
};

const fetchFromAPI = async (prompt, maxTokens = 3000) => {
  const url = `${BASE}api/chat`;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch { return null; }
};

// ─── SVG Flag Components ──────────────────────────────────────────────────────

const _flagStyle = (extra = {}) => ({
  display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...extra
});

// 🇬🇧 United Kingdom
const GBFlag = ({ style = {}, className = '' }) => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className={className}
    style={_flagStyle(style)}>
    <rect width="60" height="30" fill="#012169"/>
    <line x1="0" y1="0" x2="60" y2="30" stroke="white" strokeWidth="10"/>
    <line x1="60" y1="0" x2="0" y2="30" stroke="white" strokeWidth="10"/>
    <polygon points="0,0 3,0 30,13.5 27,15 0,3"   fill="#C8102E"/>
    <polygon points="57,0 60,0 60,3 33,15 30,13.5" fill="#C8102E"/>
    <polygon points="30,16.5 60,27 60,30 57,30"    fill="#C8102E"/>
    <polygon points="27,15 30,16.5 3,30 0,30 0,27" fill="#C8102E"/>
    <rect x="23"   y="0"    width="14" height="30" fill="white"/>
    <rect x="0"    y="11"   width="60" height="8"  fill="white"/>
    <rect x="25.5" y="0"    width="9"  height="30" fill="#C8102E"/>
    <rect x="0"    y="12.5" width="60" height="5"  fill="#C8102E"/>
  </svg>
);

// 🇸🇦 Saudi Arabia
const SAFlag = ({ style = {}, className = '' }) => (
  <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" className={className}
    style={_flagStyle(style)}>
    <rect width="900" height="600" fill="#006C35"/>
    <g fill="#fff">
      <path d="M220 180 h460 v30 h-460z"/>
      <path d="M220 210 h30 v160 h-30z"/>
      <path d="M610 210 h30 v160 h-30z"/>
      <path d="M220 340 h460 v30 h-460z"/>
      <path d="M335 210 h30 v100 q0 30 30 30 h120 q30 0 30-30 v-100 h30 v100 q0 55-60 55 h-120 q-60 0-60-55z"/>
      <path d="M455 210 h30 v130 h-30z"/>
      <path d="M455 340 h30 v30 h-30z"/>
    </g>
  </svg>
);

// 🇫🇷 France
const FRFlag = ({ style = {}, className = '' }) => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className={className}
    style={_flagStyle(style)}>
    <rect width="20" height="30" fill="#002395"/>
    <rect x="20" width="20" height="30" fill="#EDEDED"/>
    <rect x="40" width="20" height="30" fill="#ED2939"/>
  </svg>
);

// 🇪🇸 Spain
const ESFlag = ({ style = {}, className = '' }) => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className={className}
    style={_flagStyle(style)}>
    <rect width="60" height="30" fill="#C60B1E"/>
    <rect y="7.5" width="60" height="15" fill="#FFC400"/>
    {/* simplified coat of arms column */}
    <rect x="18" y="10" width="3" height="10" fill="#C60B1E"/>
    <rect x="18" y="10" width="3" height="2"  fill="#FFC400"/>
  </svg>
);

// 🇩🇪 Germany
const DEFlag = ({ style = {}, className = '' }) => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className={className}
    style={_flagStyle(style)}>
    <rect width="60" height="10" fill="#000"/>
    <rect y="10" width="60" height="10" fill="#DD0000"/>
    <rect y="20" width="60" height="10" fill="#FFCE00"/>
  </svg>
);

// 🇨🇳 China — red field + 1 large star + 4 small stars
const CNFlag = ({ style = {}, className = '' }) => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className={className}
    style={_flagStyle(style)}>
    <rect width="60" height="30" fill="#DE2910"/>
    {/* large star — center (10, 7.5), R=6, r=2.4 */}
    <polygon fill="#FFDE00"
      points="10,1.5 11.41,5.56 15.71,5.65 12.28,8.24 13.53,12.35 10,9.9 6.47,12.35 7.72,8.24 4.29,5.65 8.59,5.56"/>
    {/* small star 1 — center (20, 3) */}
    <polygon fill="#FFDE00"
      points="20,1 20.47,2.35 21.9,2.38 20.76,3.25 21.18,4.62 20,3.8 18.82,4.62 19.24,3.25 18.1,2.38 19.53,2.35"/>
    {/* small star 2 — center (24, 6) */}
    <polygon fill="#FFDE00"
      points="24,4 24.47,5.35 25.9,5.38 24.76,6.25 25.18,7.62 24,6.8 22.82,7.62 23.24,6.25 22.1,5.38 23.53,5.35"/>
    {/* small star 3 — center (24, 9) */}
    <polygon fill="#FFDE00"
      points="24,7 24.47,8.35 25.9,8.38 24.76,9.25 25.18,10.62 24,9.8 22.82,10.62 23.24,9.25 22.1,8.38 23.53,8.35"/>
    {/* small star 4 — center (20, 12) */}
    <polygon fill="#FFDE00"
      points="20,10 20.47,11.35 21.9,11.38 20.76,12.25 21.18,13.62 20,12.8 18.82,13.62 19.24,12.25 18.1,11.38 19.53,11.35"/>
  </svg>
);

// 🇯🇵 Japan — Hinomaru
const JAFlag = ({ style = {}, className = '' }) => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className={className}
    style={_flagStyle(style)}>
    <rect width="60" height="30" fill="white"/>
    <circle cx="30" cy="15" r="9" fill="#BC002D"/>
  </svg>
);

// 🇹🇷 Turkey — crescent + star
const TRFlag = ({ style = {}, className = '' }) => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className={className}
    style={_flagStyle(style)}>
    <rect width="60" height="30" fill="#E30A17"/>
    {/* crescent: white outer circle minus offset red inner circle */}
    <circle cx="22" cy="15" r="8.5" fill="white"/>
    <circle cx="24.8" cy="15" r="7" fill="#E30A17"/>
    {/* white 5-pointed star — center (34, 15), R=3.5, r=1.34 */}
    <polygon fill="white"
      points="34,11.5 34.79,13.92 37.33,13.92 35.27,15.41 36.06,17.83 34,16.34 31.94,17.83 32.73,15.41 30.67,13.92 33.21,13.92"/>
  </svg>
);

// ─── Flag renderer — always SVG ───────────────────────────────────────────────
const FLAG_SIZE = { width: 22, height: 14, borderRadius: 2 };

const FlagNode = ({ lang, style = {} }) => {
  const s = { ...FLAG_SIZE, ...style };
  switch (lang?.code) {
    case 'en':   return <GBFlag style={s} />;
    case 'ar':   return <SAFlag style={s} />;
    case 'fr':   return <FRFlag style={s} />;
    case 'es':   return <ESFlag style={s} />;
    case 'de':   return <DEFlag style={s} />;
    case 'zh':   return <CNFlag style={s} />;
    case 'ja':   return <JAFlag style={s} />;
    case 'tr':   return <TRFlag style={s} />;
    default:     return <span style={{ fontSize: 16, lineHeight: 1 }}>{lang?.flag}</span>;
  }
};

// ─── Language Config ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect', labelAr: 'كشف تلقائي', dir: 'ltr', flag: '🌐' },
  { code: 'en',   label: 'English',     labelAr: 'الإنجليزية', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar',   label: 'Arabic',      labelAr: 'العربية',    dir: 'rtl', flag: '🇸🇦' },
  { code: 'fr',   label: 'French',      labelAr: 'الفرنسية',   dir: 'ltr', flag: '🇫🇷' },
  { code: 'es',   label: 'Spanish',     labelAr: 'الإسبانية',  dir: 'ltr', flag: '🇪🇸' },
  { code: 'de',   label: 'German',      labelAr: 'الألمانية',  dir: 'ltr', flag: '🇩🇪' },
  { code: 'zh',   label: 'Chinese',     labelAr: 'الصينية',    dir: 'ltr', flag: '🇨🇳' },
  { code: 'ja',   label: 'Japanese',    labelAr: 'اليابانية',  dir: 'ltr', flag: '🇯🇵' },
  { code: 'tr',   label: 'Turkish',     labelAr: 'التركية',    dir: 'ltr', flag: '🇹🇷' },
];

const MODES = [
  { id: 'natural',  label: 'Natural',  labelAr: 'طبيعي',  hint: 'Conversational & fluent' },
  { id: 'formal',   label: 'Formal',   labelAr: 'رسمي',   hint: 'Academic / professional' },
  { id: 'literal',  label: 'Literal',  labelAr: 'حرفي',   hint: 'Word-for-word accuracy'  },
];

// ─── Accent Config ────────────────────────────────────────────────────────────────────────────────
// Two accents only: US (American female) and UK (British male)
// Uses the same Edge Neural voices as App.jsx’s edgeTTSSpeak()
const ACCENT_OPTIONS = [
  { code: 'en-US', label: 'US', edgeVoice: 'en-US-AvaMultilingualNeural' },
  { code: 'en-GB', label: 'UK', edgeVoice: 'en-GB-RyanNeural'            },
];

const HISTORY_KEY   = 'venoxa_translation_history';
const FAVORITES_KEY = 'venoxa_translation_favorites';

// ─── POS badge colours ────────────────────────────────────────────────────────

const POS_COLORS = {
  n:    { bg: 'bg-blue-500/15',    text: 'text-blue-500'    },
  v:    { bg: 'bg-green-500/15',   text: 'text-green-600'   },
  vi:   { bg: 'bg-teal-500/15',    text: 'text-teal-600'    },
  vt:   { bg: 'bg-emerald-500/15', text: 'text-emerald-600' },
  adj:  { bg: 'bg-purple-500/15',  text: 'text-purple-500'  },
  adv:  { bg: 'bg-orange-500/15',  text: 'text-orange-500'  },
  prep: { bg: 'bg-pink-500/15',    text: 'text-pink-500'    },
  conj: { bg: 'bg-red-500/15',     text: 'text-red-500'     },
  expr: { bg: 'bg-yellow-500/15',  text: 'text-yellow-600'  },
  phr:  { bg: 'bg-cyan-500/15',    text: 'text-cyan-600'    },
};
const posStyle = (pos = '') => {
  const key = pos.toLowerCase().replace(/[^a-z]/g, '');
  return POS_COLORS[key] || { bg: 'bg-gray-500/15', text: 'text-gray-500' };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LangDropdown({ value, onChange, exclude, uiLang, theme, position = 'bottom', allowAuto = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const opts = LANGUAGES.filter(l => (allowAuto || l.code !== 'auto') && l.code !== exclude);
  const sel  = LANGUAGES.find(l => l.code === value);
  const label = uiLang === 'ar' ? sel?.labelAr : sel?.label;

  return (
    <div ref={ref} className={`relative ${open ? 'z-[200]' : 'z-auto'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all liquid-glass ${
          isDark
            ? 'bg-white/7 text-white hover:bg-white/10'
            : 'bg-white/60 text-gray-700 hover:bg-white/80'
        }`}
      >
        <span
          className="inline-flex items-center justify-center shrink-0"
          style={{ width: 22, height: 14 }}
        >
          <FlagNode lang={sel} />
        </span>
        <span className="truncate max-w-[90px]">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
      </button>

      {open && (
        <div
          className="dropdown-menu absolute min-w-[175px] no-scrollbar"
          style={{ [position === 'top' ? 'bottom' : 'top']: 'calc(100% + 8px)', left: 0 }}
        >
          {opts.map(l => (
            <button
              key={l.code}
              onClick={() => { onChange(l.code); setOpen(false); }}
              className={`dropdown-item ${value === l.code ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left', gap: 12 }}
            >
              <span
                className="inline-flex items-center justify-center shrink-0"
                style={{ width: 22, height: 14 }}
              >
                <FlagNode lang={l} />
              </span>
              <span className="flex-1 text-left truncate">
                {uiLang === 'ar' ? l.labelAr : l.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accent Speak Button ────────────────────────────────────────────
/**
 * Volume2 trigger + US/UK pill toggle.
 * Primary: Edge Neural TTS via /api/edge-tts proxy (same voices as App.jsx).
 *   US → en-US-AvaMultilingualNeural  (American female)
 *   UK → en-GB-RyanNeural             (British male)
 * Fallback: browser speechSynthesis when proxy is unavailable.
 */
function AccentSpeakButton({ text, isDark, label = 'Listen' }) {
  const [accent,   setAccent]   = useState('en-US');
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const selectedAccent = ACCENT_OPTIONS.find(a => a.code === accent) ?? ACCENT_OPTIONS[0];

  const speak = async () => {
    if (!text?.trim() || speaking) return;

    // Stop any current playback
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setSpeaking(true);

    // ── Primary: Edge Neural TTS via proxy ──
    // Probe the URL first — on Vercel /api/edge-tts returns 503 JSON (not audio).
    // Checking content-type before playing prevents silent failure.
    try {
      const params = new URLSearchParams({ text: text.trim(), voice: selectedAccent.edgeVoice });
      const url = `${BASE}api/edge-tts?${params}`;
      const probe = await fetch(url);
      if (probe.ok && (probe.headers.get('content-type') || '').startsWith('audio')) {
        const buf = await probe.arrayBuffer();
        const blob = new Blob([buf], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        const audio = new Audio(blobUrl);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(blobUrl); audioRef.current = null; setSpeaking(false); };
        audio.onerror = () => { URL.revokeObjectURL(blobUrl); audioRef.current = null; setSpeaking(false); browserFallback(); };
        await audio.play();
        return; // success — setSpeaking(false) fires via onended
      }
      // Non-audio response (e.g. 503 on Vercel) — fall through to browser
    } catch {
      // Network error — fall through to browser
    }

    browserFallback();
  };

  const browserFallback = () => {
    if (!('speechSynthesis' in window)) { setSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(text.trim());
    utt.lang  = selectedAccent.code;
    utt.rate  = 0.92;
    const voices = window.speechSynthesis.getVoices();
    // Prefer neural / online voices matching the accent
    const pick = voices.find(v => v.lang === selectedAccent.code && !v.localService)
      || voices.find(v => v.lang === selectedAccent.code)
      || voices.find(v => v.lang.startsWith(selectedAccent.code.split('-')[0]));
    if (pick) utt.voice = pick;
    utt.onend  = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  return (
    <div className="flex items-center gap-1">

      {/* ── Listen trigger ── */}
      <button
        onClick={speak}
        disabled={!text?.trim()}
        title={`${label} – ${selectedAccent.label} accent`}
        className={`flex items-center gap-1.5 p-2 rounded-xl transition-all disabled:opacity-30 ${
          isDark
            ? 'text-gray-400 hover:text-white hover:bg-white/10'
            : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
        }`}
      >
        {speaking
          ? <Loader2 className="w-4 h-4 animate-spin text-[var(--app-accent1)]" />
          : <Volume2 className="w-4 h-4" />
        }
      </button>

      {/* ── US | UK pill toggle ── */}
      <div
        className="flex rounded-xl overflow-hidden text-[10px] font-extrabold uppercase tracking-wide"
        style={{
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}`,
        }}
      >
        {ACCENT_OPTIONS.map((a, i) => (
          <button
            key={a.code}
            onClick={() => setAccent(a.code)}
            className="px-2.5 py-1 transition-all duration-150"
            style={{
              background: accent === a.code
                ? 'var(--app-accent1)'
                : 'transparent',
              color: accent === a.code
                ? '#fff'
                : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
              borderRight: i === 0
                ? `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}`
                : 'none',
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

    </div>
  );
}
function CopyButton({ text, theme }) {
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';
  const handle = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handle}
      title="Copy"
      className={`p-2 rounded-xl transition-all ${isDark
        ? 'text-gray-400 hover:text-white hover:bg-white/10'
        : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
      }`}
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function HistoryItem({ item, onLoad, onDelete, isDark, uiLang }) {
  const srcLang = LANGUAGES.find(l => l.code === item.sourceLang);
  const tgtLang = LANGUAGES.find(l => l.code === item.targetLang);
  return (
    <div className={`rounded-2xl p-4 transition-all group liquid-glass ${
      isDark ? 'bg-white/4 hover:bg-white/7' : 'bg-white/50 hover:bg-white/70'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs opacity-50 font-bold">
          <span className="flex items-center gap-1"><FlagNode lang={srcLang} style={{width:16,height:10,borderRadius:1}}/> {uiLang === 'ar' ? srcLang?.labelAr : srcLang?.label}</span>
          <ArrowLeftRight className="w-3 h-3" />
          <span className="flex items-center gap-1"><FlagNode lang={tgtLang} style={{width:16,height:10,borderRadius:1}}/> {uiLang === 'ar' ? tgtLang?.labelAr : tgtLang?.label}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onLoad(item)} title="Load" className={`p-1.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            <RotateCcw className="w-3.5 h-3.5 text-[var(--app-accent1)]" />
          </button>
          <button onClick={() => onDelete(item.id)} title="Delete" className={`p-1.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      <p className={`text-sm font-medium line-clamp-1 mb-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`} dir="auto">{item.sourceText}</p>
      <p className={`text-sm line-clamp-1 ${isDark ? 'text-[var(--app-accent1)]/80' : 'text-[var(--app-accent1)]'}`} dir="auto">{item.translatedText}</p>
      <p className="text-[11px] mt-2 opacity-35">{new Date(item.timestamp).toLocaleString()}</p>
    </div>
  );
}

// ─── WordReference-style Analysis Renderer ────────────────────────────────────

function TranslationRow({ entry, isDark, tgtDir, isAlt = false }) {
  const [open, setOpen] = useState(false);
  const { bg, text: textColor } = posStyle(entry.pos);
  const hasExample = entry.examples?.length > 0;

  return (
    <>
      <tr className={`border-b transition-colors ${
        isDark ? 'border-white/5 hover:bg-white/4' : 'border-black/4 hover:bg-black/3'
      } ${isAlt ? (isDark ? 'bg-white/2' : 'bg-black/2') : ''}`}>
        <td className="px-4 py-3 align-top">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">
              {entry.english}
            </span>
            {entry.contextLabel && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold opacity-60 ${isDark ? 'bg-white/8 text-gray-300' : 'bg-black/5 text-gray-600'}`}>
                {entry.contextLabel}
              </span>
            )}
          </div>
        </td>
        <td className="px-2 py-3 align-top w-14 text-center">
          <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md ${bg} ${textColor}`}>
            {entry.pos}
          </span>
        </td>
        <td className="px-4 py-3 align-top">
          <div className="flex items-start justify-between gap-2">
            <span className={`text-sm font-bold leading-snug text-[var(--app-accent1)]`} dir={tgtDir}>
              {entry.arabic}
            </span>
            {hasExample && (
              <button
                onClick={() => setOpen(o => !o)}
                className={`shrink-0 p-1 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'}`}
                title="Show examples"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {entry.note && (
            <p className="text-[11px] mt-0.5 opacity-50 font-normal">{entry.note}</p>
          )}
        </td>
      </tr>
      {open && hasExample && (
        <tr className={isDark ? 'bg-white/3' : 'bg-blue-50/60'}>
          <td colSpan={3} className="px-4 py-3">
            <div className="flex flex-col gap-2">
              {entry.examples.map((ex, i) => (
                <div key={i} className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${
                  isDark ? 'border-white/6 bg-white/4' : 'border-black/5 bg-white/80'
                }`}>
                  <p className={`text-[13px] font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`} dir="ltr">{ex.en}</p>
                  <p className={`text-[13px] font-bold text-[var(--app-accent1)]/85`} dir={tgtDir}>{ex.ar}</p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TranslationsTable({ title, entries, isDark, tgtDir, accentColor = 'var(--app-accent1)' }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!entries?.length) return null;
  return (
    <div className={`rounded-2xl overflow-hidden liquid-glass ${isDark ? 'bg-white/3' : 'bg-white/40'}`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className={`w-full flex items-center justify-between px-4 py-3 font-extrabold text-xs uppercase tracking-widest transition-all ${
          isDark ? 'bg-white/5 text-gray-300 hover:bg-white/8' : 'bg-black/4 text-gray-600 hover:bg-black/6'
        }`}
      >
        <span style={{ color: accentColor }}>{title}</span>
        {collapsed ? <ChevronRight className="w-4 h-4 opacity-40" /> : <ChevronUp className="w-4 h-4 opacity-40" />}
      </button>
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className={`text-[10px] uppercase tracking-widest font-extrabold ${
                isDark ? 'text-gray-500 bg-white/3' : 'text-gray-400 bg-black/2'
              }`}>
                <th className="px-4 py-2 text-left font-extrabold">English</th>
                <th className="px-2 py-2 text-center font-extrabold w-14">POS</th>
                <th className="px-4 py-2 text-right font-extrabold">Arabic</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <TranslationRow key={i} entry={entry} isDark={isDark} tgtDir={tgtDir} isAlt={i % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompoundFormsTable({ compounds, isDark, tgtDir }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);
  if (!compounds?.length) return null;
  return (
    <div className={`rounded-2xl overflow-hidden liquid-glass ${isDark ? 'bg-white/3' : 'bg-white/40'}`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className={`w-full flex items-center justify-between px-4 py-3 font-extrabold text-xs uppercase tracking-widest transition-all ${
          isDark ? 'bg-white/5 text-gray-300 hover:bg-white/8' : 'bg-black/4 text-gray-600 hover:bg-black/6'
        }`}
      >
        <span style={{ color: 'var(--app-accent2)' }}>Compound Forms / Collocations</span>
        {collapsed ? <ChevronRight className="w-4 h-4 opacity-40" /> : <ChevronUp className="w-4 h-4 opacity-40" />}
      </button>
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className={`text-[10px] uppercase tracking-widest font-extrabold ${
                isDark ? 'text-gray-500 bg-white/3' : 'text-gray-400 bg-black/2'
              }`}>
                <th className="px-4 py-2 text-left font-extrabold">Form / Collocation</th>
                <th className="px-4 py-2 text-right font-extrabold">Arabic Equivalent</th>
              </tr>
            </thead>
            <tbody>
              {compounds.map((c, i) => (
                <React.Fragment key={i}>
                  <tr className={`border-b transition-colors ${
                    isDark ? 'border-white/5 hover:bg-white/4' : 'border-black/4 hover:bg-black/3'
                  } ${i % 2 === 1 ? (isDark ? 'bg-white/2' : 'bg-black/2') : ''}`}>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-2">
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">{c.english}</span>
                        {c.type && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold opacity-55 ${isDark ? 'bg-white/8 text-gray-300' : 'bg-black/5 text-gray-600'}`}>{c.type}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-[var(--app-accent2)]" dir={tgtDir}>{c.arabic}</span>
                        {c.example && (
                          <button
                            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                            className={`shrink-0 p-1 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedIdx === i && c.example && (
                    <tr className={isDark ? 'bg-white/3' : 'bg-purple-50/60'}>
                      <td colSpan={2} className="px-4 py-3">
                        <div className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${isDark ? 'border-white/6 bg-white/4' : 'border-black/5 bg-white/80'}`}>
                          <p className={`text-[13px] font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`} dir="ltr">{c.example.en}</p>
                          <p className="text-[13px] font-bold text-[var(--app-accent2)]" dir={tgtDir}>{c.example.ar}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CrossRefSection({ crossRefs, isDark }) {
  if (!crossRefs) return null;
  const sections = [
    { label: 'Synonyms', items: crossRefs.synonyms, color: 'text-green-500', bg: 'bg-green-500/12' },
    { label: 'Antonyms', items: crossRefs.antonyms, color: 'text-red-500',   bg: 'bg-red-500/12'   },
    { label: 'Related',  items: crossRefs.related,  color: 'text-blue-500',  bg: 'bg-blue-500/12'  },
  ].filter(s => s.items?.length);
  if (!sections.length) return null;
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-3 liquid-glass ${isDark ? 'bg-white/3' : 'bg-white/50'}`}>
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-[var(--app-accent1)] opacity-70" />
        <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cross-References</span>
      </div>
      <div className="flex flex-col gap-2">
        {sections.map(sec => (
          <div key={sec.label} className="flex items-start gap-2 flex-wrap">
            <span className={`text-[11px] font-extrabold min-w-[60px] mt-1 ${sec.color}`}>{sec.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {sec.items.map((item, i) => (
                <span key={i} className={`text-xs font-bold px-2.5 py-1 rounded-xl ${sec.bg} ${sec.color}`}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneticsBar({ phonetics, word, isDark }) {
  if (!phonetics) return null;
  return (
    <div className={`rounded-2xl px-5 py-4 flex items-center flex-wrap gap-4 liquid-glass ${
      isDark ? 'bg-white/3' : 'bg-white/60'
    }`}>
      <span className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>{word}</span>
      <div className="flex flex-wrap gap-3">
        {phonetics.GA && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">GA</span>
            <span className={`text-sm font-mono font-bold px-2.5 py-1 rounded-xl ${isDark ? 'bg-white/8 text-gray-200' : 'bg-black/5 text-gray-700'}`}>{phonetics.GA}</span>
          </div>
        )}
        {phonetics.RP && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">RP</span>
            <span className={`text-sm font-mono font-bold px-2.5 py-1 rounded-xl ${isDark ? 'bg-white/8 text-gray-200' : 'bg-black/5 text-gray-700'}`}>{phonetics.RP}</span>
          </div>
        )}
      </div>
      {phonetics.syllables && (
        <span className="text-xs font-bold opacity-40 ml-auto">{phonetics.syllables}</span>
      )}
    </div>
  );
}

function NuanceCard({ text, isDark }) {
  if (!text) return null;
  return (
    <div className={`rounded-2xl px-5 py-4 flex gap-3 liquid-glass ${
      isDark ? 'bg-yellow-500/5' : 'bg-yellow-50/70'
    }`} style={{ '--lg-border-color': 'rgba(234,179,8,0.3)' }}>
      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-yellow-500 mb-1">Nuance & Learner Notes</p>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
      </div>
    </div>
  );
}

function WRAnalysis({ data, isDark, tgtDir }) {
  if (!data) return null;
  return (
    <div className="flex flex-col gap-3 animate-fadeIn">
      <PhoneticsBar phonetics={data.phonetics} word={data.word} isDark={isDark} />
      <TranslationsTable title="Principal Translations"   entries={data.principalTranslations}   isDark={isDark} tgtDir={tgtDir} />
      <TranslationsTable title="Additional Translations"  entries={data.additionalTranslations}  isDark={isDark} tgtDir={tgtDir} accentColor="var(--app-accent2)" />
      <CompoundFormsTable compounds={data.compoundForms}  isDark={isDark} tgtDir={tgtDir} />
      <NuanceCard text={data.nuance}                                                              isDark={isDark} />
      <CrossRefSection crossRefs={data.crossReferences}   isDark={isDark} />
    </div>
  );
}

// ─── Favorites components ─────────────────────────────────────────────────────

function HeartButton({ isFav, onToggle, isDark }) {
  const [pop, setPop] = useState(false);
  const handle = () => {
    onToggle();
    if (!isFav) { setPop(true); setTimeout(() => setPop(false), 600); }
  };
  return (
    <button
      onClick={handle}
      title={isFav ? 'Remove from favorites' : 'Save to favorites'}
      className={`relative p-2 rounded-xl transition-all ${
        isFav ? 'text-red-500 hover:bg-red-500/10'
        : isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
        : 'text-gray-400 hover:text-red-500 hover:bg-red-500/8'
      }`}
      style={{ transform: pop ? 'scale(1.35)' : 'scale(1)', transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), color 0.2s' }}
    >
      <Heart className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
    </button>
  );
}

function FavoriteCard({ item, isDark, uiLang, onLoad, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const srcLang = LANGUAGES.find(l => l.code === item.sourceLang);
  const tgtLang = LANGUAGES.find(l => l.code === item.targetLang);
  const tgtDir  = tgtLang?.dir || 'rtl';

  return (
    <div className={`rounded-2xl transition-all group liquid-glass ${
      isDark ? 'bg-white/4 hover:bg-white/7' : 'bg-white/55 hover:bg-white/75'
    }`}>
      <div className="flex items-start gap-3 p-4">
        <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
          <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider opacity-45 mb-1.5 flex-wrap">
            <span className="flex items-center gap-1"><FlagNode lang={srcLang} style={{width:14,height:9,borderRadius:1}}/> {uiLang === 'ar' ? srcLang?.labelAr : srcLang?.label}</span>
            <ArrowLeftRight className="w-3 h-3" />
            <span className="flex items-center gap-1"><FlagNode lang={tgtLang} style={{width:14,height:9,borderRadius:1}}/> {uiLang === 'ar' ? tgtLang?.labelAr : tgtLang?.label}</span>
            {item.mode && <><span className="opacity-40">·</span><span className="opacity-60">{item.mode}</span></>}
          </div>
          <p className={`text-base font-extrabold leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`} dir="auto">{item.sourceText}</p>
          <p className="text-sm font-bold mt-1 text-[var(--app-accent1)]" dir={tgtDir}>{item.translatedText}</p>
          <p className="text-[10px] mt-2 opacity-30">
            {new Date(item.timestamp).toLocaleDateString(uiLang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onLoad(item)} title="Load into translator" className={`p-1.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            <RotateCcw className="w-3.5 h-3.5 text-[var(--app-accent1)]" />
          </button>
          <button onClick={() => onDelete(item.id)} title="Remove favorite" className={`p-1.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      {item.analysisData && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className={`w-full flex items-center justify-between px-4 py-2.5 border-t text-[11px] font-extrabold uppercase tracking-widest transition-all ${
              isDark ? 'border-white/6 text-[var(--app-accent2)] hover:bg-white/4' : 'border-black/5 text-[var(--app-accent2)] hover:bg-black/3'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {uiLang === 'ar' ? 'عرض التحليل المعجمي' : 'Dictionary Analysis'}
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 opacity-40" /> : <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
          </button>
          {expanded && (
            <div className="px-4 pb-4 animate-fadeIn">
              <WRAnalysis data={item.analysisData} isDark={isDark} tgtDir={tgtDir} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FavoritesTab({ favorites, isDark, uiLang, onLoad, onDelete, onClearAll }) {
  const [query, setQuery] = useState('');
  const t = (en, ar) => uiLang === 'ar' ? ar : en;
  const filtered = query.trim()
    ? favorites.filter(f =>
        f.sourceText.toLowerCase().includes(query.toLowerCase()) ||
        f.translatedText.toLowerCase().includes(query.toLowerCase())
      )
    : favorites;

  if (favorites.length === 0) {
    return (
      <div className={`card-shine glass-panel rounded-3xl flex flex-col items-center justify-center py-16 gap-4`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-black/4'}`}>
          <Heart className="w-8 h-8 opacity-25" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold opacity-40">{t('No favorites yet.', 'لا توجد مفضلة بعد.')}</p>
          <p className="text-xs opacity-25 mt-1">{t('Tap ♥ on any translation to save it.', 'اضغط ♥ على أي ترجمة لحفظها.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex items-center gap-2 flex-1 min-w-[180px] px-3.5 py-2 rounded-2xl liquid-glass ${
          isDark ? 'bg-white/5 text-white' : 'bg-white/60 text-gray-700'
        }`}>
          <Search className="w-3.5 h-3.5 opacity-40 shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('Search favorites…', 'ابحث في المفضلة…')}
            className="bg-transparent outline-none text-sm font-medium w-full placeholder-opacity-40"
          />
          {query && (
            <button onClick={() => setQuery('')} className="opacity-40 hover:opacity-70 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs font-bold opacity-50">
          {filtered.length !== favorites.length
            ? t(`${filtered.length} of ${favorites.length}`, `${filtered.length} من ${favorites.length}`)
            : t(`${favorites.length} saved`, `${favorites.length} محفوظة`)}
        </span>
        <button
          onClick={onClearAll}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all liquid-glass ${
            isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t('Clear all', 'مسح الكل')}
        </button>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm font-medium opacity-40 py-6 text-center">{t('No matches found.', 'لا توجد نتائج.')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <FavoriteCard key={item.id} item={item} isDark={isDark} uiLang={uiLang} onLoad={onLoad} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analysis JSON prompt ─────────────────────────────────────────────────────

const buildAnalysisPrompt = (word, srcLangLabel, tgtLangLabel) => `
You are an expert lexicographer. Return a SINGLE JSON object (no markdown, no preamble) for the ${srcLangLabel} word/phrase: "${word}"

The JSON must conform EXACTLY to this structure (omit keys with no data):

{
  "word": "${word}",
  "phonetics": {
    "GA": "IPA for General American",
    "RP": "IPA for Received Pronunciation",
    "syllables": "dot-separated syllable split e.g. la·bor"
  },
  "principalTranslations": [
    {
      "english": "the specific sense in English",
      "pos": "n|v|vi|vt|adj|adv|prep|expr",
      "contextLabel": "optional short context like [formal] or [US]",
      "arabic": "${tgtLangLabel} equivalent",
      "note": "optional short note",
      "examples": [
        { "en": "English example sentence.", "ar": "${tgtLangLabel} translation of that sentence." }
      ]
    }
  ],
  "additionalTranslations": [
    {
      "english": "less-common or specialized sense",
      "pos": "n|v|adj|adv|expr",
      "contextLabel": "e.g. [archaic] or [technical]",
      "arabic": "${tgtLangLabel} equivalent",
      "note": "optional note",
      "examples": [
        { "en": "Example.", "ar": "ترجمة." }
      ]
    }
  ],
  "compoundForms": [
    {
      "english": "compound or collocation e.g. labor union",
      "type": "idiom|phrasal verb|compound noun|collocation",
      "arabic": "${tgtLangLabel} equivalent",
      "example": { "en": "Example sentence.", "ar": "ترجمة." }
    }
  ],
  "nuance": "2-4 sentences: semantic nuance, common learner mistakes, register notes.",
  "crossReferences": {
    "synonyms": ["word1", "word2"],
    "antonyms": ["word1"],
    "related":  ["word1", "word2"]
  }
}

Rules:
- principalTranslations: 2-5 most common senses, each with 1 example.
- additionalTranslations: 0-4 rare/specialized senses.
- compoundForms: 4-8 real fixed expressions with examples.
- Output ONLY valid JSON. No markdown. No code fences. No extra text.
`;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SmartTranslation({ lang: uiLang = 'ar', theme = 'dark', AI_KEY, speakFn }) {
  const isDark = theme === 'dark';

  // ── Translation state
  const [sourceText,    setSourceText]    = useState('');
  const [translatedText, setTranslated]   = useState('');
  const [sourceLang,    setSourceLang]    = useState('en');
  const [targetLang,    setTargetLang]    = useState('ar');
  const [mode,          setMode]          = useState('natural');
  const [isTranslating, setIsTranslating] = useState(false);
  const [transError,    setTransError]    = useState('');

  // ── Analysis state
  const [isAnalyzing,   setIsAnalyzing]   = useState(false);
  const [showAnalysis,  setShowAnalysis]  = useState(false);
  const [analysisData,  setAnalysisData]  = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  // ── UI state
  const [activeTab, setActiveTab] = useState('translate');

  // ── History
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
  });

  // ── Favorites
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch { return []; }
  });

  const isFavorited = useCallback((sourceText, targetLang) =>
    favorites.some(f => f.sourceText === sourceText && f.targetLang === targetLang),
  [favorites]);

  const toggleFavorite = useCallback(() => {
    if (!translatedText) return;
    setFavorites(prev => {
      const exists = prev.some(f => f.sourceText === sourceText && f.targetLang === targetLang);
      const next = exists
        ? prev.filter(f => !(f.sourceText === sourceText && f.targetLang === targetLang))
        : [{
            id: Date.now().toString(),
            sourceText, translatedText, sourceLang, targetLang, mode,
            analysisData: analysisData || null,
            timestamp: Date.now(),
          }, ...prev];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, [sourceText, translatedText, sourceLang, targetLang, mode, analysisData]);

  const deleteFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem(FAVORITES_KEY);
  }, []);

  const saveHistory = useCallback((entry) => {
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 20);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteHistory = useCallback((id) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const translateAbortRef = useRef(null);

  const handleTranslate = useCallback(async (text = sourceText, srcL = sourceLang, tgtL = targetLang, md = mode) => {
    if (!text.trim()) return;
    if (srcL === tgtL && srcL !== 'auto') { setTranslated(text); return; }

    if (translateAbortRef.current) translateAbortRef.current.abort();
    translateAbortRef.current = new AbortController();

    setIsTranslating(true);
    setTransError('');
    setTranslated('');
    setShowAnalysis(false);
    setAnalysisData(null);

    const srcLangLabel = LANGUAGES.find(l => l.code === srcL)?.label || srcL;
    const tgtLangLabel = LANGUAGES.find(l => l.code === tgtL)?.label || tgtL;
    const modeDesc = {
      natural: 'natural, fluent, and conversational — use idioms where appropriate',
      formal:  'formal, academic, and professional — use sophisticated vocabulary',
      literal: 'as literal as possible while still being grammatically correct',
    }[md] || 'natural';

    const prompt = `You are an expert translator. Translate the following text ${srcL === 'auto' ? '' : `from ${srcLangLabel} `}to ${tgtLangLabel}.
Translation style: ${modeDesc}.
Rules:
- Output ONLY the translation. No explanations, no notes, no preamble.
- Preserve formatting (line breaks, bullet points, etc.).
- Preserve proper nouns, brand names, and technical terms unless a standard equivalent exists.
- Match the register and tone of the original.

Text to translate:
"""
${text}
"""`;

    try {
      await streamFromAPI(prompt, (delta) => {
        setTranslated(prev => prev + delta);
      }, 1500);

      const entry = {
        id: Date.now().toString(),
        sourceText: text, translatedText: '', sourceLang: srcL, targetLang: tgtL, mode: md, timestamp: Date.now(),
      };
      setTranslated(final => { entry.translatedText = final; saveHistory(entry); return final; });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setTransError(uiLang === 'ar' ? 'حدث خطأ في الترجمة، حاول مرة أخرى.' : 'Translation failed. Please try again.');
      }
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang, mode, saveHistory, uiLang]);

  const handleAnalyze = useCallback(async () => {
    const wordOrPhrase = sourceText.trim();
    if (!wordOrPhrase) return;

    setIsAnalyzing(true);
    setShowAnalysis(true);
    setAnalysisData(null);
    setAnalysisError('');

    const srcLangLabel = LANGUAGES.find(l => l.code === (sourceLang === 'auto' ? 'en' : sourceLang))?.label || 'English';
    const tgtLangLabel = LANGUAGES.find(l => l.code === targetLang)?.label || 'Arabic';
    const prompt = buildAnalysisPrompt(wordOrPhrase, srcLangLabel, tgtLangLabel);

    try {
      const raw = await fetchFromAPI(prompt, 3000);
      if (!raw) throw new Error('empty');
      const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      setAnalysisData(parsed);
    } catch {
      setAnalysisError(uiLang === 'ar' ? 'فشل التحليل. حاول مرة أخرى.' : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [sourceText, sourceLang, targetLang, uiLang]);

  const handleSwap = useCallback(() => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslated(sourceText);
    setShowAnalysis(false);
    setAnalysisData(null);
  }, [sourceLang, targetLang, sourceText, translatedText]);

  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const srcLangObj = LANGUAGES.find(l => l.code === sourceLang);
  const tgtLangObj = LANGUAGES.find(l => l.code === targetLang);
  const srcDir     = srcLangObj?.dir || 'ltr';
  const tgtDir     = tgtLangObj?.dir || 'ltr';
  const charCount  = sourceText.length;
  const charLimit  = 5000;

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-8 animate-fadeIn" dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--app-accent1)] flex items-center justify-center shadow-lg">
            <Languages className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('Smart Translation', 'الترجمة الذكية')}
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('AI-powered · Streaming · WordReference-style Analysis', 'ذكاء اصطناعي · تحليل على غرار WordReference')}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className={`flex rounded-2xl p-1 gap-1 liquid-glass ${isDark ? 'bg-white/5' : 'bg-black/4'}`}>
          {[
            { id: 'translate', label: t('Translate', 'ترجمة'),  icon: Languages },
            { id: 'favorites', label: t('Favorites', 'المفضلة'), icon: Heart     },
            { id: 'history',   label: t('History',   'السجل'),   icon: Clock    },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? tab.id === 'favorites'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-[var(--app-accent1)] text-white shadow-sm'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/8'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" fill={tab.id === 'favorites' && activeTab === 'favorites' ? 'currentColor' : 'none'} />
              {tab.label}
              {tab.id === 'favorites' && favorites.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'favorites' ? 'bg-white/25 text-white' : 'bg-red-500/15 text-red-500'
                }`}>{favorites.length}</span>
              )}
              {tab.id === 'history' && history.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  activeTab === 'history' ? 'bg-white/25 text-white' : 'bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]'
                }`}>{history.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════ TRANSLATE TAB ══════════════════ */}
      {activeTab === 'translate' && (
        <>
          {/* Mode selector */}
          <div className={`flex rounded-2xl p-1 gap-1 self-start liquid-glass ${isDark ? 'bg-white/5' : 'bg-black/4'}`}>
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); if (translatedText) handleTranslate(undefined, undefined, undefined, m.id); }}
                title={m.hint}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === m.id
                    ? 'bg-[var(--app-accent2)] text-white shadow-sm'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-white/8'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'
                }`}
              >
                {uiLang === 'ar' ? m.labelAr : m.label}
              </button>
            ))}
          </div>

          {/* Language bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <LangDropdown value={sourceLang} onChange={setSourceLang} exclude={targetLang} uiLang={uiLang} theme={theme} allowAuto />
            <button
              onClick={handleSwap}
              disabled={sourceLang === 'auto'}
              className={`p-2.5 rounded-2xl transition-all liquid-glass ${
                sourceLang === 'auto'
                  ? 'opacity-30 cursor-not-allowed'
                  : isDark
                    ? 'bg-white/5 text-white hover:bg-white/12 active:scale-90'
                    : 'bg-white/60 text-gray-700 hover:bg-white/90 active:scale-90'
              }`}
              title={t('Swap languages', 'تبديل اللغتين')}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <LangDropdown value={targetLang} onChange={setTargetLang} exclude={sourceLang === 'auto' ? undefined : sourceLang} uiLang={uiLang} theme={theme} />
          </div>

          {/* ── Main translation panels ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Source panel ── */}
            <div className={`card-shine glass-panel rounded-3xl flex flex-col min-h-[260px] transition-all`}>
              <div className={`flex items-center justify-between px-5 pt-4 pb-2 border-b ${isDark ? 'border-white/6' : 'border-black/5'}`}
                   style={{ position: 'relative', zIndex: 2 }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold opacity-50">
                    {srcLangObj ? (uiLang === 'ar' ? srcLangObj.labelAr : srcLangObj.label) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* ── Accent speak button for source text ── */}
                  <AccentSpeakButton
                    text={sourceText}
                    isDark={isDark}
                    label={t('Listen (source)', 'استمع للمصدر')}
                  />
                  <CopyButton text={sourceText} theme={theme} />
                  {sourceText && (
                    <button
                      onClick={() => { setSourceText(''); setTranslated(''); setShowAnalysis(false); setAnalysisData(null); }}
                      className={`p-2 rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                dir={srcDir}
                placeholder={t('Enter text to translate…', 'أدخل النص للترجمة…')}
                className={`flex-1 w-full resize-none bg-transparent outline-none p-5 text-base leading-relaxed font-medium relative z-[1] ${
                  isDark ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
                }`}
                style={{ minHeight: 180 }}
              />

              <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-white/5' : 'border-black/4'}`}
                   style={{ position: 'relative', zIndex: 2 }}>
                <span className={`text-[11px] font-bold ${charCount > charLimit * 0.9 ? 'text-red-400' : 'opacity-30'}`}>
                  {charCount.toLocaleString()} / {charLimit.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={!sourceText.trim() || isAnalyzing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all liquid-glass disabled:opacity-40 ${
                      isDark
                        ? 'bg-[var(--app-accent2)]/15 text-[var(--app-accent2)] hover:bg-[var(--app-accent2)]/25'
                        : 'bg-[var(--app-accent2)]/10 text-[var(--app-accent2)] hover:bg-[var(--app-accent2)]/18'
                    }`}
                    title={t('WordReference-style analysis', 'تحليل على غرار WordReference')}
                  >
                    {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                    {t('Analyze', 'تحليل')}
                  </button>
                  <button
                    onClick={() => handleTranslate()}
                    disabled={!sourceText.trim() || isTranslating}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {t('Translate', 'ترجم')}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Target panel ── */}
            <div className={`card-shine glass-panel rounded-3xl flex flex-col min-h-[260px] transition-all relative ${
              isTranslating ? 'ring-1 ring-[var(--app-accent1)]/40' : ''
            }`}>
              {isTranslating && (
                <div className="absolute inset-0 rounded-3xl pointer-events-none border-2 border-[var(--app-accent1)]/40 animate-pulse z-10" />
              )}

              <div className={`flex items-center justify-between px-5 pt-4 pb-2 border-b ${isDark ? 'border-white/6' : 'border-black/5'}`}
                   style={{ position: 'relative', zIndex: 2 }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold opacity-50">
                    {tgtLangObj ? (uiLang === 'ar' ? tgtLangObj.labelAr : tgtLangObj.label) : ''}
                  </span>
                  {isTranslating && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--app-accent1)] animate-pulse">
                      <Zap className="w-3 h-3" />
                      {t('Translating…', 'جارٍ الترجمة…')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* ── Accent speak button for translated text ── */}
                  <AccentSpeakButton
                    text={translatedText}
                    isDark={isDark}
                    label={t('Listen (translation)', 'استمع للترجمة')}
                  />
                  <HeartButton
                    isFav={isFavorited(sourceText, targetLang)}
                    onToggle={toggleFavorite}
                    isDark={isDark}
                  />
                  <CopyButton text={translatedText} theme={theme} />
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto" style={{ position: 'relative', zIndex: 1 }}>
                {transError ? (
                  <p className="text-red-400 text-sm font-medium">{transError}</p>
                ) : translatedText ? (
                  <p dir={tgtDir} className={`text-base leading-relaxed font-medium ${isDark ? 'text-white' : 'text-gray-800'}`} style={{ whiteSpace: 'pre-wrap' }}>
                    {translatedText}
                    {isTranslating && (
                      <span className="inline-block w-2 h-4 bg-[var(--app-accent1)] ml-0.5 rounded-sm animate-pulse align-middle" />
                    )}
                  </p>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('Translation appears here…', 'تظهر الترجمة هنا…')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── WordReference-style Analysis Section ── */}
          {showAnalysis && (
            <div className={`card-shine glass-panel rounded-3xl p-5 flex flex-col gap-4 animate-fadeIn`}>
              <div className="flex items-center justify-between" style={{ position: 'relative', zIndex: 2 }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--app-accent2)]/15 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[var(--app-accent2)]" />
                  </div>
                  <div>
                    <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('Dictionary Analysis', 'التحليل المعجمي')}
                    </p>
                    <p className="text-[11px] opacity-50">
                      {t('WordReference-style bilingual reference', 'مرجع ثنائي اللغة على غرار WordReference')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {analysisData && (
                    <HeartButton isFav={isFavorited(sourceText, targetLang)} onToggle={toggleFavorite} isDark={isDark} />
                  )}
                  <button
                    onClick={() => { setShowAnalysis(false); setAnalysisData(null); setAnalysisError(''); }}
                    className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-400'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isAnalyzing && !analysisData && !analysisError && (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <Loader2 className="w-5 h-5 text-[var(--app-accent2)] animate-spin" />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('Building dictionary profile…', 'جارٍ بناء الملف المعجمي…')}
                  </span>
                </div>
              )}

              {analysisError && (
                <div className="flex items-center gap-3 py-4">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-400 font-medium">{analysisError}</span>
                </div>
              )}

              {analysisData && (
                <WRAnalysis data={analysisData} isDark={isDark} tgtDir={tgtDir} />
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════ FAVORITES TAB ══════════════════ */}
      {activeTab === 'favorites' && (
        <FavoritesTab
          favorites={favorites}
          isDark={isDark}
          uiLang={uiLang}
          onLoad={item => {
            setSourceText(item.sourceText);
            setTranslated(item.translatedText);
            setSourceLang(item.sourceLang === 'auto' ? 'en' : item.sourceLang);
            setTargetLang(item.targetLang);
            setMode(item.mode || 'natural');
            setAnalysisData(item.analysisData || null);
            setShowAnalysis(!!item.analysisData);
            setActiveTab('translate');
          }}
          onDelete={deleteFavorite}
          onClearAll={clearFavorites}
        />
      )}

      {/* ══════════════════ HISTORY TAB ══════════════════ */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {history.length === 0 ? (
            <div className={`card-shine glass-panel rounded-3xl flex flex-col items-center justify-center py-16 gap-4`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-black/4'}`}>
                <Clock className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-bold opacity-40">{t('No translation history yet.', 'لا يوجد سجل ترجمة حتى الآن.')}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold opacity-50">{t(`${history.length} saved translations`, `${history.length} ترجمة محفوظة`)}</span>
                <button
                  onClick={clearHistory}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all liquid-glass ${
                    isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('Clear all', 'مسح الكل')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {history.map(item => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    isDark={isDark}
                    uiLang={uiLang}
                    onLoad={item => {
                      setSourceText(item.sourceText);
                      setTranslated(item.translatedText);
                      setSourceLang(item.sourceLang === 'auto' ? 'en' : item.sourceLang);
                      setTargetLang(item.targetLang);
                      setMode(item.mode || 'natural');
                      setActiveTab('translate');
                    }}
                    onDelete={deleteHistory}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}