/**
 * WordOfTheDay.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Shows ONE advanced English word per calendar day.
 *
 * The result is cached in localStorage keyed by today's date so the
 * same word is shown all day — even across page reloads — and the AI
 * is only called once per day per device.
 *
 * The "Refresh" button bypasses the cache and asks the AI for a NEW
 * word (useful if the user wants several in one sitting).
 *
 * The card includes:
 *   • Word + IPA + part of speech
 *   • English definition + Arabic translation
 *   • One example sentence (EN + AR)
 *   • Mini etymology hint
 *   • Mnemonic / memory aid
 *   • Optional `onAddToVocab` callback for SRS integration
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookMarked, Sparkles, Loader2, AlertCircle, Volume2, RefreshCw, Plus, Check
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose, dailySeed, speakEdge } from './aiHelpers';

const CACHE_KEY = 'venoxa_word_of_day';

const PROMPT = (seed, avoidList) => `You are a vocabulary curator for an Arabic-speaking learner of English aiming at C1 level.

Pick ONE genuinely advanced English word (B2-C2) suitable for active vocabulary acquisition. Use this seed for variety: ${seed}.${avoidList?.length ? `\nDO NOT pick any of these words: ${avoidList.join(', ')}.` : ''}

Return a SINGLE JSON object (no markdown, no preamble) with this schema:

{
  "word":          "the word",
  "ipa":           "IPA pronunciation",
  "partOfSpeech":  "noun | verb | adjective | adverb | etc.",
  "definition":    "clear English definition (1 short sentence)",
  "definitionAr":  "ترجمة عربية واضحة للتعريف",
  "example":       "natural English example sentence (10-15 words)",
  "exampleAr":     "ترجمة عربية للجملة المثال",
  "etymologyHint": "short, interesting note about the word's origin (1 sentence)",
  "mnemonic":      "memory aid that helps the learner remember the word"
}

Rules:
- Avoid super-rare archaic words. Pick words that real C1 learners would benefit from.
- Avoid offensive or sensitive vocabulary.
- Output ONLY valid JSON. No markdown. No code fences. No commentary.`;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export default function WordOfTheDay({ lang: uiLang = 'ar', theme = 'dark', onAddToVocab }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [data, setData]       = useState(null);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [added, setAdded]     = useState(false);

  // Load from cache (or fetch) on mount.
  const fetchWord = useCallback(async (force = false) => {
    setBusy(true);
    setError('');
    setAdded(false);

    // Try the per-day cache first.
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached?.date === todayKey() && cached?.data?.word) {
          setData(cached.data);
          setBusy(false);
          return;
        }
      } catch { /* corrupt cache — ignore */ }
    }

    // Build avoid list from recent history so we don't repeat in the same week.
    let avoid = [];
    try {
      const hist = JSON.parse(localStorage.getItem(`${CACHE_KEY}_history`) || '[]');
      avoid = hist.slice(0, 7).map(x => x.word).filter(Boolean);
    } catch { /* ignore */ }

    const seed = force ? Date.now() : dailySeed();
    const raw = await fetchFromAPI(PROMPT(seed, avoid), 1500);
    const parsed = parseJSONLoose(raw);

    if (!parsed?.word) {
      setError(t('Could not fetch the word of the day. Please try again.',
                 'تعذّر جلب كلمة اليوم. حاول مرة أخرى.'));
      setBusy(false);
      return;
    }

    setData(parsed);
    setBusy(false);

    // Persist for the rest of the day.
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey(), data: parsed }));
      const hist = JSON.parse(localStorage.getItem(`${CACHE_KEY}_history`) || '[]');
      const next = [parsed, ...hist.filter(x => x.word !== parsed.word)].slice(0, 30);
      localStorage.setItem(`${CACHE_KEY}_history`, JSON.stringify(next));
    } catch { /* localStorage may be full or disabled — ignore */ }
  }, [t]);

  useEffect(() => { fetchWord(false); }, [fetchWord]);

  const handleAdd = () => {
    if (!data || added) return;
    if (typeof onAddToVocab === 'function') onAddToVocab(data);
    // Always also stash in a generic "saved words" bucket so the action
    // is meaningful even if the SRS wiring isn't connected yet.
    try {
      const saved = JSON.parse(localStorage.getItem('venoxa_saved_words') || '[]');
      if (!saved.find(s => s.word === data.word)) {
        saved.unshift({ ...data, savedAt: Date.now(), source: 'word-of-day' });
        localStorage.setItem('venoxa_saved_words', JSON.stringify(saved.slice(0, 200)));
      }
    } catch { /* ignore */ }
    setAdded(true);
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full pb-8 animate-fadeIn"
         dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--app-accent1)] flex items-center justify-center shadow-lg">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('Word of the Day', 'كلمة اليوم')}
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date().toLocaleDateString(uiLang === 'ar' ? 'ar-EG' : 'en-GB',
                { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchWord(true)}
          disabled={busy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all liquid-glass disabled:opacity-50 ${
            isDark ? 'text-gray-300 hover:bg-white/8' : 'text-gray-600 hover:bg-black/5'
          }`}
          title={t('Get a new word', 'احصل على كلمة جديدة')}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {t('New word', 'كلمة جديدة')}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 py-4 px-5 rounded-2xl liquid-glass bg-red-500/8">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm text-red-400 font-medium">{error}</span>
        </div>
      )}

      {busy && !data && !error && (
        <div className="flex items-center gap-3 justify-center py-12">
          <Loader2 className="w-5 h-5 text-[var(--app-accent1)] animate-spin" />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('Picking today\'s word…', 'جارٍ اختيار كلمة اليوم…')}
          </span>
        </div>
      )}

      {data && (
        <div className={`card-shine glass-panel rounded-3xl p-6 flex flex-col gap-5`}>
          {/* Word headline */}
          <div className="flex flex-col gap-2" dir="ltr">
            <div className="flex items-end gap-3 flex-wrap">
              <span className={`text-4xl font-extrabold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {data.word}
              </span>
              <button
                onClick={() => speakEdge(data.word)}
                className={`mb-1 p-2 rounded-xl transition-all ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
              {data.partOfSpeech && (
                <span className="mb-1 text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]">
                  {data.partOfSpeech}
                </span>
              )}
            </div>
            {data.ipa && (
              <span className={`text-sm font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {data.ipa}
              </span>
            )}
          </div>

          {/* Definitions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.definition && (
              <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-white/70'}`} dir="ltr">
                <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-1">EN</div>
                <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {data.definition}
                </p>
              </div>
            )}
            {data.definitionAr && (
              <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-white/70'}`} dir="rtl">
                <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-1">AR</div>
                <p className={`text-sm leading-relaxed font-medium text-[var(--app-accent1)]`}>
                  {data.definitionAr}
                </p>
              </div>
            )}
          </div>

          {/* Example */}
          {(data.example || data.exampleAr) && (
            <div className={`rounded-2xl p-4 border-l-4 border-[var(--app-accent1)] ${
              isDark ? 'bg-white/3' : 'bg-white/55'
            }`}>
              <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-2">
                {t('Example', 'مثال')}
              </div>
              {data.example && (
                <p className={`text-base italic font-medium ${isDark ? 'text-white' : 'text-gray-800'}`} dir="ltr">
                  “{data.example}”
                </p>
              )}
              {data.exampleAr && (
                <p className="text-sm italic mt-1 text-[var(--app-accent1)]/85" dir="rtl">{data.exampleAr}</p>
              )}
            </div>
          )}

          {/* Etymology + Mnemonic */}
          {(data.etymologyHint || data.mnemonic) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.etymologyHint && (
                <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/3' : 'bg-white/40'}`}>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--app-accent2)] mb-1">
                    {t('Etymology', 'الأصل')}
                  </div>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="auto">
                    {data.etymologyHint}
                  </p>
                </div>
              )}
              {data.mnemonic && (
                <div className={`rounded-2xl p-4 ${isDark ? 'bg-yellow-500/5' : 'bg-yellow-50/70'}`}>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-500 mb-1">
                    {t('Mnemonic', 'مساعد للحفظ')}
                  </div>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="auto">
                    {data.mnemonic}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Add to SRS */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleAdd}
              disabled={added}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                added
                  ? 'bg-green-500/15 text-green-500'
                  : 'bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95'
              }`}
            >
              {added
                ? <><Check className="w-4 h-4" /> {t('Added to vocab', 'تمت الإضافة')}</>
                : <><Plus className="w-4 h-4" /> {t('Add to vocab', 'أضف للمفردات')}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}