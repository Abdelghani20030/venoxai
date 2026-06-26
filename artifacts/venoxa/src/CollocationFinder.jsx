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
  Link2, Sparkles, Loader2, AlertCircle, Volume2, Database, Cpu, Heart, Clock, RotateCcw, Trash2, ChevronUp, ChevronDown
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose, speakEdge, getToolsAccent, setToolsAccent } from './aiHelpers';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
  ? import.meta.env.BASE_URL : '/';

// ── AI fallback prompt ────────────────────────────────────────────────────────
const AI_PROMPT = (word) => `You are a corpus lexicographer helping Arabic-speaking learners. For the English word "${word}", return a SINGLE JSON object listing collocations.

{
  "word": "${word}",
  "groups": [
    {
      "pattern": "VERB + WORD | ADJ. | WORD + NOUN | PHRASES",
      "collocations": ["make", "take", "reach"],
      "example": "one natural example sentence in English",
      "exampleAr": "ترجمة عربية للجملة المثال"
    }
  ]
}

Rules: 4-6 groups, 5-10 short collocations per group, one example sentence per group with Arabic translation.
Output ONLY valid JSON. No markdown. No code fences.`;


export default function CollocationFinder({ lang: uiLang = 'ar', theme = 'dark', favorites = [], setFavorites, history = [], setHistory }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [word, setWord] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accent, setAccent] = useState(getToolsAccent);
  const handleAccent = (a) => { setAccent(a); setToolsAccent(a); };

  const [source, setSource] = useState(null); // 'ozdic' | 'ai' | null

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
          source: source,
          timestamp: Date.now()
        }, ...prev];
      }
      return next;
    });
  };

  const isFavorited = data && favorites.some(x => x.word.toLowerCase() === (data.word || word).trim().toLowerCase());

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
          const fetchedData = { word: json.word, groups: json.groups, source: 'ozdic' };
          setData(fetchedData);
          setSource('ozdic');
          setHistory(prev => {
            const trimmed = json.word.trim().toLowerCase();
            const next = [{
              id: Date.now().toString(),
              word: json.word,
              data: fetchedData,
              source: 'ozdic',
              timestamp: Date.now()
            }, ...prev.filter(x => x.word.toLowerCase() !== trimmed)].slice(0, 50);
            return next;
          });
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
      const fetchedData = { ...parsed, source: 'ai' };
      setData(fetchedData);
      setSource('ai');
      setHistory(prev => {
        const trimmed = (parsed.word || w).trim().toLowerCase();
        const next = [{
          id: Date.now().toString(),
          word: parsed.word || word.trim(),
          data: fetchedData,
          source: 'ai',
          timestamp: Date.now()
        }, ...prev.filter(x => x.word.toLowerCase() !== trimmed)].slice(0, 50);
        return next;
      });
    }
    setBusy(false);
  }, [word, busy, t, source]);

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

      {data && source && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
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
            {/* Accent toggle — single control for all groups */}
            <div className="flex items-center gap-1">
              <button onClick={() => handleAccent('en-US')} title="American English" className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all ${accent === 'en-US' ? 'bg-[var(--app-accent1)] text-white border-[var(--app-accent1)]' : isDark ? 'border-white/20 text-gray-400 hover:border-white/40' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>US</button>
              <button onClick={() => handleAccent('en-GB')} title="British English" className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all ${accent === 'en-GB' ? 'bg-[var(--app-accent2)] text-white border-[var(--app-accent2)]' : isDark ? 'border-white/20 text-gray-400 hover:border-white/40' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>UK</button>
            </div>
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
                  onClick={() => speakEdge(coll, accent)}
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
              <div>
                <div className="flex items-start gap-2">
                  <p className={`flex-1 text-sm italic border-l-2 border-[var(--app-accent1)]/40 pl-3 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`} dir="ltr">
                    "{group.example}"
                  </p>
                  <button
                    onClick={() => speakEdge(group.example, accent)}
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
                {group.exampleAr && (
                  <p className="text-sm mt-1 text-[var(--app-accent1)]/85 pl-3 border-l-2 border-transparent" dir="rtl">{group.exampleAr}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
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
            {t('History & Saved Collocations', 'السجل والمتلازمات المحفوظة')}
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
            <div className="flex border-b border-black/5 dark:border-white/5 pb-2 gap-4">
              <button
                onClick={() => setPanelTab('favorites')}
                className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                  panelTab === 'favorites'
                    ? 'border-[var(--app-accent1)] text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('Saved', 'المحفوظات')} ({favorites.length})
              </button>
              <button
                onClick={() => setPanelTab('history')}
                className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                  panelTab === 'history'
                    ? 'border-[var(--app-accent1)] text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]">
                          {item.source === 'ozdic' ? 'Oxford/BNC' : 'AI'}
                        </span>
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
                          setSource(item.source);
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