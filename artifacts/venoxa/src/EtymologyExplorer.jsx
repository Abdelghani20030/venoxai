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
  ScrollText, Sparkles, Loader2, AlertCircle, Globe, Lightbulb, Heart, Clock, RotateCcw, Trash2, ChevronUp, ChevronDown
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

export default function EtymologyExplorer({ lang: uiLang = 'ar', theme = 'dark', favorites = [], setFavorites, history = [], setHistory }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [word, setWord] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [panelTab, setPanelTab] = useState('favorites');

  const toggleFavorite = () => {
    if (!data || busy) return;
    setFavorites(prev => {
      const trimmed = word.trim().toLowerCase();
      const exists = prev.some(x => x.word.toLowerCase() === trimmed);
      let next;
      if (exists) {
        next = prev.filter(x => x.word.toLowerCase() !== trimmed);
      } else {
        next = [{
          id: Date.now().toString(),
          word: data.word || word.trim(),
          data,
          timestamp: Date.now()
        }, ...prev];
      }
      return next;
    });
  };

  const isFavorited = data && favorites.some(x => x.word.toLowerCase() === (data.word || word).trim().toLowerCase());

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
      setHistory(prev => {
        const trimmed = (parsed.word || word).trim().toLowerCase();
        const next = [{
          id: Date.now().toString(),
          word: parsed.word || word.trim(),
          data: parsed,
          timestamp: Date.now()
        }, ...prev.filter(x => x.word.toLowerCase() !== trimmed)].slice(0, 50);
        return next;
      });
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
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
              <button
                onClick={toggleFavorite}
                title={isFavorited ? t('Remove from favorites', 'إزالة من المفضلة') : t('Save to favorites', 'حفظ في المفضلة')}
                className={`p-2 rounded-xl transition-all ${
                  isFavorited
                    ? 'text-red-500 hover:bg-red-500/10'
                    : isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-500/8'
                }`}
              >
                <Heart className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
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
      {/* ── Saved & History Panel ── */}
      <div className="rounded-3xl overflow-hidden mt-2" style={{ background: isDark ? '#0F0F16' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}>
        <button
          onClick={() => setShowHistoryPanel(v => !v)}
          className={`w-full flex items-center justify-between px-5 py-4 text-sm font-bold transition-all ${
            isDark ? 'text-gray-200 hover:bg-white/5' : 'text-gray-700 hover:bg-black/3'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--app-accent1)]" />
            {t('History & Saved Etymologies', 'السجل والأصول المحفوظة')}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]">
              {favorites.length + history.length}
            </span>
          </div>
          {showHistoryPanel
            ? <ChevronUp className="w-4 h-4 opacity-50" />
            : <ChevronDown className="w-4 h-4 opacity-50" />}
        </button>

        {showHistoryPanel && (
          <div className="p-4 pt-0 flex flex-col gap-4">
            {/* Tabs selector */}
            <div className="flex border-b border-white/5 pb-2 gap-4">
              <button
                onClick={() => setPanelTab('favorites')}
                className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                  panelTab === 'favorites'
                    ? 'border-[var(--app-accent1)] text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {t('Saved', 'المحفوظات')} ({favorites.length})
              </button>
              <button
                onClick={() => setPanelTab('history')}
                className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                  panelTab === 'history'
                    ? 'border-[var(--app-accent1)] text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {t('Recent', 'الأخيرة')} ({history.length})
              </button>
              
              <button
                onClick={() => {
                  if (panelTab === 'favorites') {
                    setFavorites([]);
                  } else {
                    setHistory([]);
                  }
                }}
                className="ml-auto text-xs font-bold text-red-400 hover:text-red-300 transition-all"
              >
                {t('Clear all', 'مسح الكل')}
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {(panelTab === 'favorites' ? favorites : history).length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">{t('No items found.', 'لا توجد عناصر.')}</p>
              ) : (
                (panelTab === 'favorites' ? favorites : history).map((item) => (
                  <div key={item.id} className={`flex items-start justify-between gap-3 p-3 rounded-2xl transition-all ${
                    isDark ? 'bg-white/3 hover:bg-white/5' : 'bg-black/2 hover:bg-black/4'
                  }`} dir="ltr">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {item.data?.originLanguage && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]">
                            {item.data.originLanguage}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-medium">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                        {item.word}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setWord(item.word);
                          setData(item.data);
                          setError('');
                        }}
                        title={t('Load', 'تحميل')}
                        className={`p-1.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800'}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (panelTab === 'favorites') {
                            setFavorites(prev => {
                              const next = prev.filter(x => x.id !== item.id);
                              return next;
                            });
                          } else {
                            setHistory(prev => {
                              const next = prev.filter(x => x.id !== item.id);
                              return next;
                            });
                          }
                        }}
                        title={t('Delete', 'حذف')}
                        className={`p-1.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-red-400' : 'hover:bg-black/5 text-gray-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}