/**
 * IdiomOfTheDay.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Shows ONE English idiom per calendar day.
 *
 * Same daily-cache pattern as WordOfTheDay: result is keyed by today's
 * date in localStorage so the same idiom shows all day, and the
 * "New idiom" button forces a fresh AI call.
 *
 * The card includes:
 *   • The idiom + literal meaning
 *   • Figurative meaning (EN + AR)
 *   • Origin / story behind it
 *   • 2 example sentences
 *   • Similar idioms (with short glosses)
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb, Loader2, AlertCircle, Volume2, RefreshCw, Quote
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose, dailySeed, speakEdge } from './aiHelpers';

const CACHE_KEY = 'venoxa_idiom_of_day';

const PROMPT = (seed, avoidList) => `You are an expert in English idiomatic expressions. Pick ONE genuinely useful English idiom suitable for a B2-C1 Arabic-speaking learner. Use this seed for variety: ${seed}.${avoidList?.length ? `\nDO NOT pick any of these idioms: ${avoidList.join(', ')}.` : ''}

Return a SINGLE JSON object (no markdown, no preamble) with this schema:

{
  "idiom":          "the idiom in its standard dictionary form",
  "literalMeaning": "what the idiom says word-for-word (1 short sentence)",
  "meaning":        "actual figurative meaning in English (1 short sentence)",
  "meaningAr":      "نفس المعنى الحقيقي بالعربية، جملة قصيرة",
  "story":          "2-3 sentence origin / cultural background. If the origin is uncertain, say so honestly.",
  "storyAr":        "نفس القصة بالعربية، 2-3 جمل",
  "examples": [
    { "en": "natural example sentence", "ar": "ترجمتها العربية" }
  ],
  "similar": [
    { "idiom": "another idiom with related meaning", "gloss": "short EN gloss" }
  ],
  "register": "formal | neutral | informal | very informal"
}

Rules:
- 2 examples in the array.
- 2-4 similar idioms.
- Avoid offensive idioms.
- Output ONLY valid JSON. No markdown. No code fences. No commentary.`;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const REGISTER_COLOR = {
  formal:          { bg: 'bg-blue-500/15',   text: 'text-blue-500'   },
  neutral:         { bg: 'bg-gray-500/15',   text: 'text-gray-500'   },
  informal:        { bg: 'bg-orange-500/15', text: 'text-orange-500' },
  'very informal': { bg: 'bg-red-500/15',    text: 'text-red-500'    },
};
const regStyle = (r = '') => REGISTER_COLOR[r.toLowerCase()] || REGISTER_COLOR.neutral;

export default function IdiomOfTheDay({ lang: uiLang = 'ar', theme = 'dark' }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [data, setData]   = useState(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const fetchIdiom = useCallback(async (force = false) => {
    setBusy(true);
    setError('');

    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached?.date === todayKey() && cached?.data?.idiom) {
          setData(cached.data);
          setBusy(false);
          return;
        }
      } catch { /* ignore */ }
    }

    let avoid = [];
    try {
      const hist = JSON.parse(localStorage.getItem(`${CACHE_KEY}_history`) || '[]');
      avoid = hist.slice(0, 7).map(x => x.idiom).filter(Boolean);
    } catch { /* ignore */ }

    const seed = force ? Date.now() : dailySeed();
    const raw = await fetchFromAPI(PROMPT(seed, avoid), 1800);
    const parsed = parseJSONLoose(raw);

    if (!parsed?.idiom) {
      setError(t('Could not fetch the idiom of the day. Please try again.',
                 'تعذّر جلب تعبير اليوم. حاول مرة أخرى.'));
      setBusy(false);
      return;
    }

    setData(parsed);
    setBusy(false);

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey(), data: parsed }));
      const hist = JSON.parse(localStorage.getItem(`${CACHE_KEY}_history`) || '[]');
      const next = [parsed, ...hist.filter(x => x.idiom !== parsed.idiom)].slice(0, 30);
      localStorage.setItem(`${CACHE_KEY}_history`, JSON.stringify(next));
    } catch { /* ignore */ }
  }, [t]);

  useEffect(() => { fetchIdiom(false); }, [fetchIdiom]);

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full pb-8 animate-fadeIn"
         dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--app-accent1)] flex items-center justify-center shadow-lg">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('Idiom of the Day', 'تعبير اليوم')}
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date().toLocaleDateString(uiLang === 'ar' ? 'ar-EG' : 'en-GB',
                { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchIdiom(true)}
          disabled={busy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all liquid-glass disabled:opacity-50 ${
            isDark ? 'text-gray-300 hover:bg-white/8' : 'text-gray-600 hover:bg-black/5'
          }`}
          title={t('Get a new idiom', 'احصل على تعبير جديد')}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {t('New idiom', 'تعبير جديد')}
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
            {t('Picking today\'s idiom…', 'جارٍ اختيار تعبير اليوم…')}
          </span>
        </div>
      )}

      {data && (
        <div className="card-shine glass-panel rounded-3xl p-6 flex flex-col gap-5">

          {/* Idiom headline */}
          <div className="flex items-start gap-3" dir="ltr">
            <Quote className="w-8 h-8 text-[var(--app-accent1)] opacity-60 shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-2xl sm:text-3xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {data.idiom}
                </span>
                <button
                  onClick={() => speakEdge(data.idiom)}
                  className={`p-2 rounded-xl transition-all ${
                    isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                {data.register && (
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${regStyle(data.register).bg} ${regStyle(data.register).text}`}>
                    {data.register}
                  </span>
                )}
              </div>
              {data.literalMeaning && (
                <p className={`text-sm italic mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('Literally', 'حرفياً')}: “{data.literalMeaning}”
                </p>
              )}
            </div>
          </div>

          {/* Meaning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.meaning && (
              <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-white/70'}`} dir="ltr">
                <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-1">
                  {t('Meaning', 'المعنى')} (EN)
                </div>
                <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {data.meaning}
                </p>
              </div>
            )}
            {data.meaningAr && (
              <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-white/70'}`} dir="rtl">
                <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-1">
                  {t('Meaning', 'المعنى')} (AR)
                </div>
                <p className="text-sm leading-relaxed font-medium text-[var(--app-accent1)]">
                  {data.meaningAr}
                </p>
              </div>
            )}
          </div>

          {/* Story / origin */}
          {(data.story || data.storyAr) && (
            <div className={`rounded-2xl p-4 border-l-4 border-[var(--app-accent2)] ${
              isDark ? 'bg-white/3' : 'bg-white/55'
            }`}>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--app-accent2)] mb-2">
                {t('Origin / story', 'الأصل / القصة')}
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-800'}`} dir="auto">
                {uiLang === 'ar' ? (data.storyAr || data.story) : data.story}
              </p>
            </div>
          )}

          {/* Examples */}
          {data.examples?.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">
                {t('Examples', 'أمثلة')}
              </div>
              {data.examples.map((ex, i) => (
                <div key={i} className={`rounded-2xl p-3 ${isDark ? 'bg-white/3' : 'bg-white/55'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`} dir="ltr">
                      “{ex.en}”
                    </p>
                    <button
                      onClick={() => speakEdge(ex.en)}
                      className={`shrink-0 p-1 rounded-lg transition-all ${
                        isDark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {ex.ar && (
                    <p className="text-sm mt-1 text-[var(--app-accent1)]/85" dir="rtl">{ex.ar}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Similar idioms */}
          {data.similar?.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">
                {t('Similar idioms', 'تعابير مشابهة')}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.similar.map((s, i) => (
                  <div key={i} className={`px-3 py-1.5 rounded-xl liquid-glass ${
                    isDark ? 'bg-white/5' : 'bg-white/70'
                  }`} dir="ltr">
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{s.idiom}</span>
                    {s.gloss && (
                      <span className={`text-xs ml-2 opacity-60 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        — {s.gloss}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}