/**
 * CollocationFinder.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Type a word → see natural collocations from the Oxford Collocations
 * Dictionary (BNC data) via ozdic.com.
 *
 * Data priority:
 *   1. /api/ozdic  — scrapes ozdic.com (BNC / Oxford Collocations Dict)
 *   2. AI fallback — fetchFromAPI when Ozdic doesn't have the word
 *
 * Groups are rendered with a chip-grid for quick scanning + an example
 * sentence per group when available.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import {
  Link2, Sparkles, Loader2, AlertCircle, Volume2, Database, Cpu
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose, speakEdge } from './aiHelpers';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
  ? import.meta.env.BASE_URL : '/';

// ── AI fallback prompt ────────────────────────────────────────────────────────
const AI_PROMPT = (word) => `You are a corpus lexicographer. For the English word "${word}", return a SINGLE JSON object listing collocations.

{
  "word": "${word}",
  "groups": [
    {
      "pattern": "VERB + WORD | ADJ. | WORD + NOUN | PHRASES",
      "collocations": ["make", "take", "reach"],
      "example": "one natural example sentence"
    }
  ]
}

Rules: 4-6 groups, 5-10 short collocations per group, one example sentence per group.
Output ONLY valid JSON. No markdown. No code fences.`;


export default function CollocationFinder({ lang: uiLang = 'ar', theme = 'dark' }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [word, setWord] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [source, setSource] = useState(null); // 'ozdic' | 'ai' | null

  const find = useCallback(async () => {
    if (!word.trim() || busy) return;
    setBusy(true);
    setError('');
    setData(null);
    setSource(null);

    const w = word.trim().toLowerCase();

    // ── 1. Try Ozdic (BNC / Oxford Collocations Dictionary) ──────────────
    try {
      const res = await fetch(`${BASE}api/ozdic?word=${encodeURIComponent(w)}`, {
        signal: AbortSignal.timeout(12_000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.found && json.groups?.length) {
          setData({ word: json.word, groups: json.groups, source: 'ozdic' });
          setSource('ozdic');
          setBusy(false);
          return;
        }
      }
    } catch { /* ozdic unreachable — fall through to AI */ }

    // ── 2. AI fallback ────────────────────────────────────────────────────
    const raw    = await fetchFromAPI(AI_PROMPT(w), 2000);
    const parsed = parseJSONLoose(raw);
    if (!parsed?.groups?.length) {
      setError(t('Lookup failed. Please try again.', 'فشل البحث. حاول مرة أخرى.'));
    } else {
      setData({ ...parsed, source: 'ai' });
      setSource('ai');
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
      <div className="glass-panel flex items-center gap-2 px-4 py-2 rounded-2xl">
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

      {/* Source badge */}
      {data && source && (
        <div className="flex items-center gap-2">
          {source === 'ozdic' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-widest bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]">
              <Database className="w-3 h-3" />
              Oxford Collocations · BNC
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-widest bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]">
              <Cpu className="w-3 h-3" />
              AI generated
            </span>
          )}
        </div>
      )}

      {data?.groups?.map((group, gi) => (
        <div key={gi} className="glass-panel rounded-3xl overflow-hidden">
          <div className={`px-5 py-3 text-xs font-extrabold uppercase tracking-widest ${
            isDark ? 'bg-white/5 text-[var(--app-accent2)]' : 'bg-black/4 text-[var(--app-accent2)]'
          }`} dir="ltr">
            {group.pattern}
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2" dir="ltr">
              {group.collocations?.map((coll, ci) => (
                <button
                  key={ci}
                  onClick={() => speakEdge(coll)}
                  title={`Speak "${coll}"`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    isDark
                      ? 'bg-white/6 text-white hover:bg-white/12 hover:text-[var(--app-accent1)]'
                      : 'bg-white/70 text-gray-800 hover:bg-white hover:text-[var(--app-accent1)]'
                  }`}
                >
                  {coll}
                  <Volume2 className="w-3 h-3 opacity-40" />
                </button>
              ))}
            </div>
            {group.example && (
              <div className="flex items-start gap-2">
                <p className={`flex-1 text-sm italic border-l-2 border-[var(--app-accent1)]/40 pl-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`} dir="ltr">
                  "{group.example}"
                </p>
                <button
                  onClick={() => speakEdge(group.example)}
                  title="Play full sentence"
                  className={`shrink-0 p-1.5 rounded-xl transition-all ${
                    isDark
                      ? 'text-gray-500 hover:text-white hover:bg-white/10'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}