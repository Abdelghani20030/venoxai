/**
 * EtymologyExplorer.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Type a word → see where it came from:
 *   • Origin language(s) and approximate date
 *   • Root + literal meaning of the root
 *   • Timeline of how the word evolved
 *   • Cognates in other languages
 *   • A fun fact or etymological surprise
 *
 * The timeline is rendered as a vertical line of milestones so the
 * historical journey of the word is visually striking.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import {
  ScrollText, Sparkles, Loader2, AlertCircle, Globe, Lightbulb
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose } from './aiHelpers';

const PROMPT = (word) => `You are a historical linguist. For the English word "${word}", return a SINGLE JSON object (no markdown, no preamble) with its etymology. Schema:

{
  "word": "${word}",
  "originLanguage": "e.g. Latin / Greek / Old English / Proto-Germanic / Arabic",
  "approximateDate": "e.g. 'circa 14th century' or 'Middle English, c. 1300'",
  "root": {
    "form":     "the root in its original script (transliterated if necessary)",
    "language": "the language of the root",
    "meaning":  "literal meaning of the root in plain English"
  },
  "morphemes": [
    { "part": "prefix/suffix/root piece", "meaning": "what it contributes" }
  ],
  "timeline": [
    { "era": "approximate date or period", "form": "form of the word at that time", "language": "language", "note": "what changed" }
  ],
  "cognates": [
    { "language": "language", "word": "cognate or borrowing in that language" }
  ],
  "funFact":   "one surprising or memorable fact about the word's history (1-2 sentences).",
  "funFactAr": "نفس الحقيقة باللغة العربية، 1-2 جمل."
}

Rules:
- 3-6 timeline entries showing the journey clearly.
- 3-6 cognates from genuinely related languages.
- Keep notes concise (under 15 words each).
- Output ONLY valid JSON. No markdown. No code fences. No commentary.`;

export default function EtymologyExplorer({ lang: uiLang = 'ar', theme = 'dark' }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [word, setWord] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const explore = useCallback(async () => {
    if (!word.trim() || busy) return;
    setBusy(true);
    setError('');
    setData(null);
    const raw = await fetchFromAPI(PROMPT(word.trim()), 2500);
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
          <ScrollText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('Etymology Explorer', 'أصول الكلمات')}
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('Trace where any English word came from',
               'تتبّع أصل أي كلمة إنجليزية')}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="glass-panel flex items-center gap-2 px-4 py-2 rounded-2xl">
        <input
          value={word}
          onChange={e => setWord(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') explore(); }}
          dir="ltr"
          placeholder={t('Type a word, e.g. "salary"…', 'اكتب كلمة، مثل "salary"…')}
          className={`flex-1 bg-transparent outline-none text-base font-medium ${
            isDark ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
          }`}
        />
        <button
          onClick={explore}
          disabled={!word.trim() || busy}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {t('Explore', 'استكشف')}
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
            {t('Tracing history…', 'جارٍ تتبّع التاريخ…')}
          </span>
        </div>
      )}

      {data && (
        <>
          {/* Header card */}
          <div className="glass-panel rounded-3xl px-6 py-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">{data.word}</span>
              {data.originLanguage && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]">
                  ← {data.originLanguage}
                </span>
              )}
              {data.approximateDate && (
                <span className="text-xs font-bold opacity-50">· {data.approximateDate}</span>
              )}
            </div>

            {data.root && (
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">
                  {t('Root', 'الجذر')}
                </span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">
                  {data.root.form}
                </span>
                {data.root.language && (
                  <span className="text-xs opacity-60 font-bold">({data.root.language})</span>
                )}
                {data.root.meaning && (
                  <span className={`text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    “{data.root.meaning}”
                  </span>
                )}
              </div>
            )}

            {data.morphemes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {data.morphemes.map((m, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-md ${
                    isDark ? 'bg-white/5 text-gray-200' : 'bg-black/5 text-gray-700'
                  }`} dir="ltr">
                    <span className="font-extrabold">{m.part}</span>
                    {m.meaning && <span className="opacity-60"> — {m.meaning}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          {data.timeline?.length > 0 && (
            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className={`px-5 py-3 text-xs font-extrabold uppercase tracking-widest ${
                isDark ? 'bg-white/5 text-gray-300' : 'bg-black/4 text-gray-600'
              }`}>
                {t('Timeline', 'الخط الزمني')}
              </div>
              <div className="px-5 py-4">
                <ol className="relative" dir="ltr" style={{ borderLeft: `2px solid var(--app-accent1)` }}>
                  {data.timeline.map((row, i) => (
                    <li key={i} className="ml-5 mb-5 last:mb-0">
                      <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-[var(--app-accent1)] shadow-[0_0_10px_var(--app-accent1)]" />
                      <div className={`text-[11px] font-extrabold uppercase tracking-widest ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>{row.era}</div>
                      <div className={`text-base font-bold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {row.form}
                        {row.language && <span className="ml-2 text-xs font-bold opacity-50">({row.language})</span>}
                      </div>
                      {row.note && (
                        <div className={`text-sm mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.note}</div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Cognates */}
          {data.cognates?.length > 0 && (
            <div className="glass-panel rounded-3xl overflow-hidden">
              <div className={`px-5 py-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest ${
                isDark ? 'bg-white/5 text-gray-300' : 'bg-black/4 text-gray-600'
              }`}>
                <Globe className="w-3.5 h-3.5" />
                {t('Cognates in other languages', 'كلمات مشابهة في لغات أخرى')}
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {data.cognates.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass ${
                    isDark ? 'bg-white/5' : 'bg-white/70'
                  }`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">{c.language}</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`} dir="ltr">{c.word}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fun fact */}
          {(data.funFact || data.funFactAr) && (
            <div className={`rounded-3xl px-5 py-4 flex gap-3 liquid-glass ${
              isDark ? 'bg-yellow-500/5' : 'bg-yellow-50/70'
            }`} style={{ '--lg-border-color': 'rgba(234,179,8,0.3)' }}>
              <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-yellow-500 mb-1">
                  {t('Fun fact', 'معلومة طريفة')}
                </p>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`} dir="auto">
                  {uiLang === 'ar' ? (data.funFactAr || data.funFact) : data.funFact}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}