/**
 * WordFamilyExplorer.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Type a word → see the whole word family:
 *   • Verb forms (base · 3rd person · past · past participle · -ing)
 *   • Noun forms (singular · plural · agent / abstract noun)
 *   • Adjective forms (positive · comparative · superlative)
 *   • Adverb forms
 *   • Related words (negations, derivatives)
 *
 * Each form is displayed with one example sentence so the learner sees
 * how the form is actually used, not just the spelling.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import {
  GitFork, Sparkles, Loader2, AlertCircle, Volume2, Heart, Clock, RotateCcw, Trash2, ChevronUp, ChevronDown
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose, speakEdge, getToolsAccent, setToolsAccent } from './aiHelpers';

const PROMPT = (word) => `You are a lexicographer. For the English word "${word}", return a SINGLE JSON object (no markdown, no preamble) with the complete word family. Schema:

{
  "base": "${word}",
  "ipa": "IPA of the base form",
  "verb": {
    "base":            "infinitive form",
    "thirdPerson":     "3rd person singular present (-s)",
    "past":            "simple past",
    "pastParticiple":  "past participle",
    "ing":             "present participle / gerund (-ing)",
    "example":         "one natural sentence using the verb"
  },
  "nouns": [
    { "form": "noun form", "type": "agent | abstract | concrete | gerund | etc.", "example": "sentence" }
  ],
  "adjectives": [
    { "form": "adjective form", "comparative": "comp", "superlative": "sup", "example": "sentence" }
  ],
  "adverbs": [
    { "form": "adverb form", "example": "sentence" }
  ],
  "related": [
    { "form": "related/derived word", "note": "what it is (e.g. negation, prefix re-, etc.)", "example": "sentence" }
  ]
}

Rules:
- Omit any section that genuinely doesn't apply to the word.
- Provide AT MOST 3 entries per array.
- Examples should be short (8-15 words) and natural.
- Output ONLY valid JSON. No markdown. No code fences. No commentary.`;

function FormChip({ form, label, isDark, accent = 'en-US' }) {
  if (!form) return null;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold liquid-glass ${
      isDark ? 'bg-white/5 text-white' : 'bg-white/70 text-gray-800'
    }`} dir="ltr">
      {label && <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
        isDark ? 'text-gray-500' : 'text-gray-400'
      }`}>{label}</span>}
      <span>{form}</span>
      <button
        onClick={() => speakEdge(form, accent)}
        className={`p-1 rounded-lg transition-all ${
          isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-400'
        }`}
        title="Speak"
      >
        <Volume2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function Section({ title, color, children, isDark }) {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden">
      <div className={`px-5 py-3 text-xs font-extrabold uppercase tracking-widest ${
        isDark ? 'bg-white/5' : 'bg-black/4'
      }`} style={{ color }}>
        {title}
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

export default function WordFamilyExplorer({ lang: uiLang = 'ar', theme = 'dark', favorites = [], setFavorites, history = [], setHistory }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [word, setWord] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accent, setAccent] = useState(getToolsAccent);
  const handleAccent = (a) => { setAccent(a); setToolsAccent(a); };

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
          word: data.base || word.trim(),
          data,
          timestamp: Date.now()
        }, ...prev];
      }
      return next;
    });
  };

  const isFavorited = data && favorites.some(x => x.word.toLowerCase() === (data.base || word).trim().toLowerCase());

  const explore = useCallback(async () => {
    if (!word.trim() || busy) return;
    setBusy(true);
    setError('');
    setData(null);
    const raw = await fetchFromAPI(PROMPT(word.trim()), 2200);
    const parsed = parseJSONLoose(raw);
    if (!parsed) {
      setError(t('Lookup failed. Please try again.', 'فشل البحث. حاول مرة أخرى.'));
    } else {
      setData(parsed);
      setHistory(prev => {
        const trimmed = (parsed.base || word).trim().toLowerCase();
        const next = [{
          id: Date.now().toString(),
          word: parsed.base || word.trim(),
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
          <GitFork className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('Word Family Explorer', 'عائلة الكلمة')}
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('See every form of a word: verb, noun, adjective, adverb…',
               'شاهد كل أشكال الكلمة: فعل، اسم، صفة، حال…')}
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
          placeholder={t('Type a word, e.g. "write"…', 'اكتب كلمة، مثل "write"…')}
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
            {t('Building family tree…', 'جارٍ بناء شجرة العائلة…')}
          </span>
        </div>
      )}

      {data && (
        <>
          {/* Header card with base + IPA */}
          <div className="glass-panel rounded-3xl px-6 py-5 flex items-center gap-4">
            <span className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">{data.base}</span>
            {data.ipa && (
              <span className={`text-sm font-mono font-bold px-3 py-1 rounded-xl ${
                isDark ? 'bg-white/8 text-gray-200' : 'bg-black/5 text-gray-700'
              }`}>{data.ipa}</span>
            )}
            <div className="ml-auto flex items-center gap-1">
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
              {/* Accent toggle + play */}
              <div className="flex items-center gap-1">
                <button onClick={() => handleAccent('en-US')} title="American English" className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all ${accent === 'en-US' ? 'bg-[var(--app-accent1)] text-white border-[var(--app-accent1)]' : isDark ? 'border-white/20 text-gray-400 hover:border-white/40' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>US</button>
                <button onClick={() => handleAccent('en-GB')} title="British English" className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all ${accent === 'en-GB' ? 'bg-[var(--app-accent2)] text-white border-[var(--app-accent2)]' : isDark ? 'border-white/20 text-gray-400 hover:border-white/40' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>UK</button>
                <button
                  onClick={() => speakEdge(data.base, accent)}
                  className={`p-2 rounded-xl transition-all ${
                    isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Verb forms */}
          {data.verb && (data.verb.base || data.verb.past) && (
            <Section title={t('Verb forms', 'صيغ الفعل')} color="#22c55e" isDark={isDark}>
              <div className="flex flex-wrap gap-2">
                <FormChip form={data.verb.base}           label="base"  isDark={isDark} accent={accent} />
                <FormChip form={data.verb.thirdPerson}    label="-s"    isDark={isDark} accent={accent} />
                <FormChip form={data.verb.past}           label="past"  isDark={isDark} accent={accent} />
                <FormChip form={data.verb.pastParticiple} label="p.p."  isDark={isDark} accent={accent} />
                <FormChip form={data.verb.ing}            label="-ing"  isDark={isDark} accent={accent} />
              </div>
              {data.verb.example && (
                <p className={`text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="ltr">
                  “{data.verb.example}”
                </p>
              )}
            </Section>
          )}

          {/* Nouns */}
          {data.nouns?.length > 0 && (
            <Section title={t('Noun forms', 'صيغ الاسم')} color="#3b82f6" isDark={isDark}>
              {data.nouns.map((n, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FormChip form={n.form} isDark={isDark} accent={accent} />
                    {n.type && (
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest opacity-50`}>{n.type}</span>
                    )}
                  </div>
                  {n.example && (
                    <p className={`text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="ltr">“{n.example}”</p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Adjectives */}
          {data.adjectives?.length > 0 && (
            <Section title={t('Adjective forms', 'صيغ الصفة')} color="#a855f7" isDark={isDark}>
              {data.adjectives.map((a, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2">
                    <FormChip form={a.form}        label="adj"  isDark={isDark} accent={accent} />
                    <FormChip form={a.comparative} label="-er"  isDark={isDark} accent={accent} />
                    <FormChip form={a.superlative} label="-est" isDark={isDark} accent={accent} />
                  </div>
                  {a.example && (
                    <p className={`text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="ltr">“{a.example}”</p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Adverbs */}
          {data.adverbs?.length > 0 && (
            <Section title={t('Adverb forms', 'صيغ الحال')} color="#f97316" isDark={isDark}>
              {data.adverbs.map((a, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <FormChip form={a.form} isDark={isDark} accent={accent} />
                  {a.example && (
                    <p className={`text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="ltr">“{a.example}”</p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Related */}
          {data.related?.length > 0 && (
            <Section title={t('Related & derived', 'مشتقات ومرتبطات')} color="#ec4899" isDark={isDark}>
              {data.related.map((r, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FormChip form={r.form} isDark={isDark} accent={accent} />
                    {r.note && (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">{r.note}</span>
                    )}
                  </div>
                  {r.example && (
                    <p className={`text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="ltr">“{r.example}”</p>
                  )}
                </div>
              ))}
            </Section>
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
            {t('History & Saved Words', 'السجل والكلمات المحفوظة')}
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
                        {item.data?.ipa && (
                          <span className="text-[10px] font-mono opacity-50 font-bold">
                            {item.data.ipa}
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