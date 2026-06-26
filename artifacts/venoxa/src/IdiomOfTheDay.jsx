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
  Lightbulb, Loader2, AlertCircle, Volume2, RefreshCw, Quote, Plus, Check, BookOpen, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose, dailySeed, speakEdge, getToolsAccent, setToolsAccent } from './aiHelpers';

const CACHE_KEY = 'venoxa_idiom_of_day';

const PROMPT = (seed, avoidList) => `You are an expert in English idiomatic expressions. Pick ONE genuinely useful English idiom suitable for a B2-C1 Arabic-speaking learner. Use this seed for variety: ${seed}.
To ensure extreme variety, creativity, and a completely fresh experience:
- Choose highly unique and diverse idioms across different themes and categories.
- Avoid overused standard textbook idioms like 'kick the bucket', 'bite the bullet', 'break a leg', 'spill the beans', or 'piece of cake'.
${avoidList?.length ? `\nCRITICAL RULE: You MUST NOT pick any of the following previously shown idioms under any circumstances: ${avoidList.join(', ')}.` : ''}

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

export default function IdiomOfTheDay({
  lang: uiLang = 'ar',
  theme = 'dark',
  savedIdioms: propSavedIdioms,
  setSavedIdioms: propSetSavedIdioms,
  history: propHistory,
  setHistory: propSetHistory,
}) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [data, setData]       = useState(null);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [added, setAdded]     = useState(false);
  const [accent, setAccent]   = useState(getToolsAccent);
  const handleAccent = (a) => { setAccent(a); setToolsAccent(a); };
  const [showSaved, setShowSaved] = useState(false);
  const [localSavedIdioms, setLocalSavedIdioms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_saved_idioms') || '[]'); } catch { return []; }
  });
  const savedIdioms = propSavedIdioms !== undefined ? propSavedIdioms : localSavedIdioms;
  const setSavedIdioms = propSetSavedIdioms !== undefined ? propSetSavedIdioms : setLocalSavedIdioms;

  const [localHistory, setLocalHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${CACHE_KEY}_history`) || '[]'); } catch { return []; }
  });
  const history = propHistory !== undefined ? propHistory : localHistory;
  const setHistory = propSetHistory !== undefined ? propSetHistory : setLocalHistory;

  const handleSave = () => {
    if (!data || added) return;
    const entry = { ...data, savedAt: Date.now(), source: 'idiom-of-day' };
    setSavedIdioms(prev => {
      if (prev.find(s => s.idiom === data.idiom)) return prev;
      const next = [entry, ...prev].slice(0, 200);
      try { localStorage.setItem('venoxa_saved_idioms', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setAdded(true);
  };

  const handleDelete = (idiomText) => {
    setSavedIdioms(prev => {
      const next = prev.filter(s => s.idiom !== idiomText);
      try { localStorage.setItem('venoxa_saved_idioms', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const fetchIdiom = useCallback(async (force = false) => {
    setBusy(true);
    setError('');
    setAdded(false);

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

    // Build avoid list from complete history so we NEVER repeat.
    const avoid = history.map(x => x.idiom).filter(Boolean);

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
      setHistory(prev => {
        const next = [parsed, ...prev.filter(x => x.idiom !== parsed.idiom)].slice(0, 150);
        try { localStorage.setItem(`${CACHE_KEY}_history`, JSON.stringify(next)); } catch { }
        return next;
      });
    } catch { /* ignore */ }
  }, [t, history, setHistory]);

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
                {/* Accent toggle + play */}
                <div className="flex items-center gap-1">
                  <button onClick={() => handleAccent('en-US')} title="American English" className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all ${accent === 'en-US' ? 'bg-[var(--app-accent1)] text-white border-[var(--app-accent1)]' : isDark ? 'border-white/20 text-gray-400 hover:border-white/40' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>US</button>
                  <button onClick={() => handleAccent('en-GB')} title="British English" className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all ${accent === 'en-GB' ? 'bg-[var(--app-accent2)] text-white border-[var(--app-accent2)]' : isDark ? 'border-white/20 text-gray-400 hover:border-white/40' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>UK</button>
                  <button onClick={() => speakEdge(data.idiom, accent)} className={`p-2 rounded-xl transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'}`}>
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
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
                      onClick={() => speakEdge(ex.en, accent)}
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

          {/* Save Idiom button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={added}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                added
                  ? 'bg-green-500/15 text-green-500'
                  : 'bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95'
              }`}
            >
              {added
                ? <><Check className="w-4 h-4" /> {t('Saved!', 'تم الحفظ!')}</>
                : <><Plus className="w-4 h-4" /> {t('Save idiom', 'احفظ التعبير')}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Saved Idioms Panel ── */}
      {savedIdioms.length > 0 && (
        <div className="rounded-3xl overflow-hidden" style={{ background: isDark ? '#0F0F16' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}>
          <button
            onClick={() => setShowSaved(v => !v)}
            className={`w-full flex items-center justify-between px-5 py-4 text-sm font-bold transition-all ${
              isDark ? 'text-gray-200 hover:bg-white/5' : 'text-gray-700 hover:bg-black/3'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--app-accent1)]" />
              {t('Saved Idioms', 'تعابير محفوظة')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]">
                {savedIdioms.length}
              </span>
            </div>
            {showSaved
              ? <ChevronUp className="w-4 h-4 opacity-50" />
              : <ChevronDown className="w-4 h-4 opacity-50" />}
          </button>

          {showSaved && (
            <div className="flex flex-col divide-y divide-white/5 px-2 pb-2">
              {savedIdioms.map((s, i) => (
                <div key={i} className={`flex items-start justify-between gap-3 px-3 py-3 rounded-2xl transition-all ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/3'
                }`} dir="ltr">
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.idiom}</p>
                    <p className={`text-xs mt-0.5 opacity-60 truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.meaning}</p>
                    {s.meaningAr && (
                      <p className="text-xs mt-0.5 text-[var(--app-accent1)]/70 truncate" dir="rtl">{s.meaningAr}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(s.idiom)}
                    className={`shrink-0 p-1.5 rounded-xl transition-all ${
                      isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title={t('Remove', 'حذف')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}