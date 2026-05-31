/**
 * SentenceDiagrammer.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Breaks an English sentence into its grammatical structure:
 *   • Token-by-token POS tags
 *   • Subject / verb / object / modifiers
 *   • Main clause and subordinate clauses
 *   • Plain-English (and Arabic) explanation
 *
 * Backend returns a JSON object that we render as a coloured bracket
 * diagram + an explanation card.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import { GitBranch, Sparkles, Loader2, AlertCircle, Heart, Clock, RotateCcw, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchFromAPI, parseJSONLoose } from './aiHelpers';

// POS-tag colour palette (subset of SmartTranslation's, extended for
// extra phrase/clause tags we expect from the diagrammer prompt).
const POS_COLORS = {
  N:    { bg: 'bg-blue-500/15',    text: 'text-blue-500',    label: 'Noun' },
  PRON: { bg: 'bg-blue-400/15',    text: 'text-blue-400',    label: 'Pronoun' },
  V:    { bg: 'bg-green-500/15',   text: 'text-green-600',   label: 'Verb' },
  AUX:  { bg: 'bg-emerald-500/15', text: 'text-emerald-600', label: 'Auxiliary' },
  ADJ:  { bg: 'bg-purple-500/15',  text: 'text-purple-500',  label: 'Adjective' },
  ADV:  { bg: 'bg-orange-500/15',  text: 'text-orange-500',  label: 'Adverb' },
  PREP: { bg: 'bg-pink-500/15',    text: 'text-pink-500',    label: 'Preposition' },
  CONJ: { bg: 'bg-red-500/15',     text: 'text-red-500',     label: 'Conjunction' },
  DET:  { bg: 'bg-amber-500/15',   text: 'text-amber-600',   label: 'Determiner' },
  INTJ: { bg: 'bg-yellow-500/15',  text: 'text-yellow-600',  label: 'Interjection' },
  PUNC: { bg: 'bg-gray-500/15',    text: 'text-gray-500',    label: 'Punctuation' },
};
const posStyle = (raw = '') => {
  const k = raw.toUpperCase().replace(/[^A-Z]/g, '');
  return POS_COLORS[k] || POS_COLORS.N;
};

const PROMPT = (sentence) => `You are a linguist. Analyse the structure of this English sentence and return a SINGLE JSON object (no markdown, no preamble) matching EXACTLY this schema:

{
  "sentence": "the original sentence",
  "type": "declarative | interrogative | imperative | exclamatory",
  "tokens": [
    { "text": "word or punctuation", "pos": "N|PRON|V|AUX|ADJ|ADV|PREP|CONJ|DET|INTJ|PUNC", "lemma": "base form" }
  ],
  "structure": {
    "subject":  "the simple subject phrase",
    "verb":     "the main verb phrase",
    "object":   "direct object phrase or null",
    "indirectObject": "indirect object or null",
    "modifiers": ["adverbial / prepositional / adjectival modifiers"]
  },
  "clauses": [
    { "type": "main | subordinate | relative | adverbial | noun", "text": "clause text", "role": "what it does in the sentence" }
  ],
  "explanation": "2-3 sentence plain-English summary of how the sentence is built.",
  "explanationAr": "نفس الشرح باللغة العربية، 2-3 جمل."
}

Sentence to analyse:
"""
${sentence}
"""

Output ONLY valid JSON. No markdown. No code fences.`;

export default function SentenceDiagrammer({ lang: uiLang = 'ar', theme = 'dark', favorites = [], setFavorites, history = [], setHistory }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [sentence, setSentence] = useState('');
  const [data, setData]         = useState(null);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [panelTab, setPanelTab] = useState('favorites');

  const toggleFavorite = () => {
    if (!data || busy) return;
    setFavorites(prev => {
      const trimmed = sentence.trim();
      const exists = prev.some(x => x.sentence === trimmed);
      let next;
      if (exists) {
        next = prev.filter(x => x.sentence !== trimmed);
      } else {
        next = [{
          id: Date.now().toString(),
          sentence: trimmed,
          data,
          timestamp: Date.now()
        }, ...prev];
      }
      return next;
    });
  };

  const isFavorited = favorites.some(x => x.sentence === sentence.trim());

  const analyse = useCallback(async () => {
    if (!sentence.trim() || busy) return;
    setBusy(true);
    setError('');
    setData(null);
    const raw = await fetchFromAPI(PROMPT(sentence.trim()), 2500);
    const parsed = parseJSONLoose(raw);
    if (!parsed) {
      setError(t('Analysis failed. Please try again.', 'فشل التحليل. حاول مرة أخرى.'));
    } else {
      setData(parsed);
      setHistory(prev => {
        const trimmed = sentence.trim();
        const next = [{
          id: Date.now().toString(),
          sentence: trimmed,
          data: parsed,
          timestamp: Date.now()
        }, ...prev.filter(x => x.sentence !== trimmed)].slice(0, 50);
        return next;
      });
    }
    setBusy(false);
  }, [sentence, busy, t]);

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-8 animate-fadeIn"
         dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--app-accent1)] flex items-center justify-center shadow-lg">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('Sentence Diagrammer', 'محلّل الجمل')}
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('See the grammatical anatomy of any sentence',
               'شاهد التشريح القواعدي لأي جملة')}
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="card-shine glass-panel rounded-3xl flex flex-col">
        <textarea
          value={sentence}
          onChange={e => setSentence(e.target.value)}
          dir="ltr"
          placeholder={t('Type or paste an English sentence…', 'اكتب أو الصق جملة إنجليزية…')}
          className={`w-full resize-none bg-transparent outline-none p-5 text-base leading-relaxed font-medium ${
            isDark ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
          }`}
          style={{ minHeight: 100 }}
        />
        <div className={`flex items-center justify-between px-5 py-3 border-t ${
          isDark ? 'border-white/5' : 'border-black/4'
        }`}>
          <span className="text-[11px] font-bold opacity-30">
            {sentence.length.toLocaleString()} {t('characters', 'حرف')}
          </span>
          <button
            onClick={analyse}
            disabled={!sentence.trim() || busy}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {t('Analyse', 'حلّل')}
          </button>
        </div>
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
            {t('Diagramming…', 'جارٍ التحليل…')}
          </span>
        </div>
      )}

      {data && (
        <>
          {/* Sentence type chip and Save button */}
          <div className="flex items-center justify-between">
            {data.type ? (
              <span className="px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-widest bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]">
                {data.type}
              </span>
            ) : <div />}
            <button
              onClick={toggleFavorite}
              title={isFavorited ? t('Remove from favorites', 'إزالة من المفضلة') : t('Save to favorites', 'حفظ في المفضلة')}
              className={`p-2 rounded-xl transition-all ${
                isFavorited
                  ? 'text-red-500 hover:bg-red-500/10'
                  : isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-500/8'
              }`}
            >
              <Heart className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Token diagram */}
          {data.tokens?.length > 0 && (
            <div className={`rounded-3xl p-5 flex flex-wrap gap-2 liquid-glass ${
              isDark ? 'bg-white/3' : 'bg-white/55'
            }`} dir="ltr">
              {data.tokens.map((tok, i) => {
                const s = posStyle(tok.pos);
                return (
                  <div key={i} className="flex flex-col items-center">
                    <span className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {tok.text}
                    </span>
                    <span className={`mt-1 text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}
                          title={s.label}>
                      {tok.pos}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Structure breakdown */}
          {data.structure && (
            <div className={`rounded-3xl overflow-hidden liquid-glass ${
              isDark ? 'bg-white/3' : 'bg-white/40'
            }`}>
              <div className={`px-5 py-3 text-xs font-extrabold uppercase tracking-widest ${
                isDark ? 'bg-white/5 text-gray-300' : 'bg-black/4 text-gray-600'
              }`}>
                {t('Structure', 'البنية')}
              </div>
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { k: 'subject',         enLabel: 'Subject',          arLabel: 'الفاعل',           color: 'text-blue-500' },
                  { k: 'verb',            enLabel: 'Verb',             arLabel: 'الفعل',            color: 'text-green-600' },
                  { k: 'object',          enLabel: 'Object',           arLabel: 'المفعول به',       color: 'text-pink-500' },
                  { k: 'indirectObject',  enLabel: 'Indirect Object',  arLabel: 'مفعول غير مباشر',  color: 'text-purple-500' },
                ].filter(x => data.structure[x.k]).map(x => (
                  <div key={x.k}>
                    <div className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${x.color}`}>
                      {uiLang === 'ar' ? x.arLabel : x.enLabel}
                    </div>
                    <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`} dir="ltr">
                      {data.structure[x.k]}
                    </div>
                  </div>
                ))}
                {data.structure.modifiers?.length > 0 && (
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest mb-1 text-orange-500">
                      {t('Modifiers', 'المعدِّلات')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.structure.modifiers.map((m, i) => (
                        <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-500/12 text-orange-500" dir="ltr">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clauses */}
          {data.clauses?.length > 0 && (
            <div className={`rounded-3xl overflow-hidden liquid-glass ${
              isDark ? 'bg-white/3' : 'bg-white/40'
            }`}>
              <div className={`px-5 py-3 text-xs font-extrabold uppercase tracking-widest ${
                isDark ? 'bg-white/5 text-gray-300' : 'bg-black/4 text-gray-600'
              }`}>
                {t('Clauses', 'الجمل الفرعية')}
              </div>
              <div className="flex flex-col gap-2 p-4">
                {data.clauses.map((c, i) => (
                  <div key={i} className={`rounded-2xl p-3 border ${isDark ? 'border-white/6 bg-white/3' : 'border-black/5 bg-white/60'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]">
                        {c.type}
                      </span>
                      {c.role && (
                        <span className="text-[10px] opacity-50 font-bold">{c.role}</span>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`} dir="ltr">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {(data.explanation || data.explanationAr) && (
            <div className={`rounded-3xl px-5 py-4 liquid-glass ${
              isDark ? 'bg-yellow-500/5' : 'bg-yellow-50/70'
            }`} style={{ '--lg-border-color': 'rgba(234,179,8,0.3)' }}>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-500 mb-2">
                {t('Explanation', 'الشرح')}
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`} dir="auto">
                {uiLang === 'ar' ? (data.explanationAr || data.explanation) : data.explanation}
              </p>
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
            {t('History & Saved Diagrams', 'السجل والمخططات المحفوظة')}
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
                        {item.data?.type && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]">
                            {item.data.type}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-medium">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                        {item.sentence}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSentence(item.sentence);
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