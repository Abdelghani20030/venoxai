/**
 * CollocationFinder.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Type a word and see the natural word combinations English speakers
 * actually use. Categorises results by syntactic pattern:
 *   • Verb + (target)        e.g. "make" → "make a decision"
 *   • Adjective + (target)   e.g. "decision" → "tough decision"
 *   • (target) + Noun        e.g. "make" → "make sense"
 *   • Preposition + (target) e.g. "decision" → "on the decision"
 *   • Fixed expressions      e.g. "make do with"
 *
 * This is intentionally different from the WordReference-style analysis
 * inside Smart Translation — that one focuses on *meaning senses*,
 * while this one focuses on *combinatorial patterns*.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import {
  Link2, Sparkles, Loader2, AlertCircle, Volume2
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose } from './aiHelpers';

const PROMPT = (word) => `You are a corpus lexicographer. For the English word "${word}", return a SINGLE JSON object (no markdown, no preamble) listing the most common collocations grouped by pattern.

{
  "word": "${word}",
  "groups": [
    {
      "pattern": "verb + ${word}        | adjective + ${word} | ${word} + noun | ${word} + verb | preposition + ${word} | ${word} + preposition | fixed expression",
      "patternAr": "Arabic translation of the pattern label",
      "items": [
        {
          "phrase":     "the full collocation, e.g. 'make a decision'",
          "meaning":    "short English gloss",
          "meaningAr":  "ترجمة عربية مختصرة",
          "example":    "natural example sentence",
          "frequency":  "very common | common | less common"
        }
      ]
    }
  ]
}

Rules:
- Include 4-6 groups. Pick the patterns that genuinely apply.
- 4-6 items per group, sorted by frequency (most common first).
- Examples should be 6-12 words and sound natural.
- Output ONLY valid JSON. No markdown. No code fences. No commentary.`;

const speakWord = (text) => {
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.9;
  window.speechSynthesis.speak(utt);
};

const FREQ_COLOR = {
  'very common':  { bg: 'bg-green-500/15',  text: 'text-green-600' },
  'common':       { bg: 'bg-blue-500/15',   text: 'text-blue-500'  },
  'less common':  { bg: 'bg-gray-500/15',   text: 'text-gray-500'  },
};
const freqStyle = (f = '') => FREQ_COLOR[f.toLowerCase()] || FREQ_COLOR['common'];

export default function CollocationFinder({ lang: uiLang = 'ar', theme = 'dark' }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [word, setWord] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const find = useCallback(async () => {
    if (!word.trim() || busy) return;
    setBusy(true);
    setError('');
    setData(null);
    const raw = await fetchFromAPI(PROMPT(word.trim()), 3000);
    const parsed = parseJSONLoose(raw);
    if (!parsed) {
      setError(t('Lookup failed. Please try again.', 'فشل البحث. حاول مرة أخرى.'));
    } else {
      setData(parsed);
    }
    setBusy(false);
  }, [word, busy, t]);

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-8 animate-fadeIn"
         dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--app-accent1)] flex items-center justify-center shadow-lg">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('Collocation Finder', 'متلازمات الكلمات')}
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('See which words natives actually use together',
               'شاهد الكلمات التي يستخدمها الناطقون معاً')}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl liquid-glass ${
        isDark ? 'bg-white/5' : 'bg-white/60'
      }`}>
        <input
          value={word}
          onChange={e => setWord(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') find(); }}
          dir="ltr"
          placeholder={t('Type a word, e.g. "make"…', 'اكتب كلمة، مثل "make"…')}
          className={`flex-1 bg-transparent outline-none text-base font-medium ${
            isDark ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
          }`}
        />
        <button
          onClick={find}
          disabled={!word.trim() || busy}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {t('Find', 'ابحث')}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 py-4 px-5 rounded-2xl liquid-glass bg-red-500/8">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm text-red-400 font-medium">{error}</span>
        </div>
      )}

      {busy && !data && !error && (
        <div className="flex items-center gap-3 justify-center py-8">
          <Loader2 className="w-5 h-5 text-[var(--app-accent1)] animate-spin" />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('Mining the corpus…', 'جارٍ البحث في المدوّنة…')}
          </span>
        </div>
      )}

      {data?.groups?.map((group, gi) => (
        <div key={gi} className={`rounded-3xl overflow-hidden liquid-glass ${
          isDark ? 'bg-white/3' : 'bg-white/40'
        }`}>
          <div className={`px-5 py-3 flex items-center justify-between text-xs font-extrabold uppercase tracking-widest ${
            isDark ? 'bg-white/5 text-[var(--app-accent2)]' : 'bg-black/4 text-[var(--app-accent2)]'
          }`}>
            <span dir="ltr">{group.pattern}</span>
            {group.patternAr && uiLang === 'ar' && (
              <span className="opacity-60 text-[10px] normal-case">{group.patternAr}</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {group.items?.map((it, i) => {
                  const fs = freqStyle(it.frequency);
                  return (
                    <tr key={i} className={`border-b transition-colors ${
                      isDark ? 'border-white/5 hover:bg-white/4' : 'border-black/4 hover:bg-black/3'
                    } ${i % 2 === 1 ? (isDark ? 'bg-white/2' : 'bg-black/2') : ''}`}>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">
                            {it.phrase}
                          </span>
                          <button
                            onClick={() => speakWord(it.phrase)}
                            className={`p-1 rounded-lg transition-all ${
                              isDark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
                            }`}
                            title="Speak"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          {it.frequency && (
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${fs.bg} ${fs.text}`}>
                              {it.frequency}
                            </span>
                          )}
                        </div>
                        {it.example && (
                          <p className={`text-xs italic mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} dir="ltr">“{it.example}”</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-right" style={{ minWidth: 180 }}>
                        <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                           dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>
                          {uiLang === 'ar' && it.meaningAr ? it.meaningAr : it.meaning}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}