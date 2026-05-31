/**
 * ToneRewriter.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Rewrites a sentence / paragraph in a chosen tone:
 *   formal · casual · business · academic · friendly
 *
 * Streams the result via /api/chat/stream so the user sees text appear
 * token by token, matching the SmartTranslation aesthetic.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Sliders, Sparkles, Loader2, Copy, Check, X, ArrowDown, Heart, Trash2, Clock, RotateCcw, ChevronUp, ChevronDown
} from 'lucide-react';
import { streamFromAPI } from './aiHelpers';

const TONES = [
  { id: 'formal',   label: 'Formal',   labelAr: 'رسمي',     hint: 'Polite, professional, respectful' },
  { id: 'casual',   label: 'Casual',   labelAr: 'عادي',     hint: 'Conversational, relaxed' },
  { id: 'business', label: 'Business', labelAr: 'مهني',     hint: 'Concise, action-oriented' },
  { id: 'academic', label: 'Academic', labelAr: 'أكاديمي',  hint: 'Scholarly, structured' },
  { id: 'friendly', label: 'Friendly', labelAr: 'ودود',     hint: 'Warm, approachable, kind' },
];

function CopyBtn({ text, isDark }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handle}
      title="Copy"
      className={`p-2 rounded-xl transition-all ${isDark
        ? 'text-gray-400 hover:text-white hover:bg-white/10'
        : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'}`}
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function ToneRewriter({ lang: uiLang = 'ar', theme = 'dark', favorites = [], setFavorites, history = [], setHistory }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [input, setInput]       = useState('');
  const [output, setOutput]     = useState('');
  const [tone, setTone]         = useState('formal');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const abortRef = useRef(null);

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [panelTab, setPanelTab] = useState('favorites');

  const toggleFavorite = () => {
    if (!output || busy) return;
    setFavorites(prev => {
      const trimmed = input.trim();
      const exists = prev.some(x => x.input === trimmed && x.tone === tone);
      let next;
      if (exists) {
        next = prev.filter(x => !(x.input === trimmed && x.tone === tone));
      } else {
        next = [{
          id: Date.now().toString(),
          input: trimmed,
          output,
          tone,
          timestamp: Date.now()
        }, ...prev];
      }
      return next;
    });
  };

  const isFavorited = favorites.some(x => x.input === input.trim() && x.tone === tone);

  const rewrite = useCallback(async () => {
    if (!input.trim() || busy) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setBusy(true);
    setError('');
    setOutput('');

    const toneObj = TONES.find(x => x.id === tone) || TONES[0];
    const prompt = `You are an expert English editor. Rewrite the following text in a ${toneObj.label.toLowerCase()} tone.

Tone description: ${toneObj.hint}.

Rules:
- Keep the meaning intact.
- Output ONLY the rewritten text. No explanations, no preamble, no quotes.
- Preserve formatting (line breaks, bullet points, etc.) when present.

Original text:
"""
${input}
"""`;

    try {
      const finalOutput = await streamFromAPI(prompt, (delta) => {
        setOutput(prev => prev + delta);
      }, 1500);

      if (finalOutput) {
        setHistory(prev => {
          const trimmed = input.trim();
          const next = [{
            id: Date.now().toString(),
            input: trimmed,
            output: finalOutput,
            tone,
            timestamp: Date.now()
          }, ...prev.filter(x => !(x.input === trimmed && x.tone === tone))].slice(0, 50);
          return next;
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(t('Rewrite failed. Please try again.', 'فشل في إعادة الصياغة. حاول مرة أخرى.'));
      }
    } finally {
      setBusy(false);
    }
  }, [input, tone, busy, t]);

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-8 animate-fadeIn"
         dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--app-accent1)] flex items-center justify-center shadow-lg">
          <Sliders className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('Tone Rewriter', 'إعادة صياغة النبرة')}
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('Rewrite any sentence in 5 different tones',
               'أعد صياغة أي جملة بـ 5 نبرات مختلفة')}
          </p>
        </div>
      </div>

      {/* Tone selector pills */}
      <div className="flex flex-wrap gap-2">
        {TONES.map(tn => (
          <button
            key={tn.id}
            onClick={() => setTone(tn.id)}
            title={tn.hint}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all liquid-glass ${
              tone === tn.id
                ? 'bg-[var(--app-accent1)] text-white shadow-sm'
                : isDark
                  ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                  : 'bg-white/60 text-gray-700 hover:bg-white/80'
            }`}
          >
            {uiLang === 'ar' ? tn.labelAr : tn.label}
          </button>
        ))}
      </div>

      {/* Input panel */}
      <div className="card-shine glass-panel rounded-3xl flex flex-col min-h-[180px]">
        <div className={`flex items-center justify-between px-5 pt-4 pb-2 border-b ${
          isDark ? 'border-white/6' : 'border-black/5'
        }`}>
          <span className="text-xs font-bold opacity-50">{t('Original', 'الأصلي')}</span>
          <div className="flex items-center gap-1">
            <CopyBtn text={input} isDark={isDark} />
            {input && (
              <button
                onClick={() => { setInput(''); setOutput(''); setError(''); }}
                className={`p-2 rounded-xl transition-all ${isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          dir="auto"
          placeholder={t('Paste or type text here…', 'الصق النص أو اكتبه هنا…')}
          className={`flex-1 w-full resize-none bg-transparent outline-none p-5 text-base leading-relaxed font-medium ${
            isDark ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
          }`}
          style={{ minHeight: 140 }}
        />
        <div className={`flex items-center justify-between px-5 py-3 border-t ${
          isDark ? 'border-white/5' : 'border-black/4'
        }`}>
          <span className="text-[11px] font-bold opacity-30">
            {input.length.toLocaleString()} {t('characters', 'حرف')}
          </span>
          <button
            onClick={rewrite}
            disabled={!input.trim() || busy}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {t('Rewrite', 'أعد الصياغة')}
          </button>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center -my-2 opacity-50">
        <ArrowDown className="w-5 h-5" />
      </div>

      {/* Output panel */}
      <div className={`card-shine glass-panel rounded-3xl flex flex-col min-h-[180px] relative ${
        busy ? 'ring-1 ring-[var(--app-accent1)]/40' : ''
      }`}>
        <div className={`flex items-center justify-between px-5 pt-4 pb-2 border-b ${
          isDark ? 'border-white/6' : 'border-black/5'
        }`}>
          <span className="text-xs font-bold opacity-50">
            {t('Rewritten', 'بعد الصياغة')} ·{' '}
            <span className="text-[var(--app-accent1)]">
              {uiLang === 'ar'
                ? TONES.find(x => x.id === tone)?.labelAr
                : TONES.find(x => x.id === tone)?.label}
            </span>
          </span>
          <div className="flex items-center gap-1">
            {output && !busy && (
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
            )}
            <CopyBtn text={output} isDark={isDark} />
          </div>
        </div>
        <div className="flex-1 p-5 overflow-y-auto">
          {error ? (
            <p className="text-red-400 text-sm font-medium">{error}</p>
          ) : output ? (
            <p dir="auto" className={`text-base leading-relaxed font-medium whitespace-pre-wrap ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              {output}
              {busy && (
                <span className="inline-block w-2 h-4 bg-[var(--app-accent1)] ml-0.5 rounded-sm animate-pulse align-middle" />
              )}
            </p>
          ) : (
            <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('Rewritten text appears here…', 'يظهر النص بعد الصياغة هنا…')}
            </p>
          )}
        </div>
      </div>

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
            {t('History & Saved', 'السجل والمحفوظات')}
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
                (panelTab === 'favorites' ? favorites : history).map((item) => {
                  const itemToneObj = TONES.find(x => x.id === item.tone) || TONES[0];
                  return (
                    <div key={item.id} className={`flex items-start justify-between gap-3 p-3 rounded-2xl transition-all ${
                      isDark ? 'bg-white/3 hover:bg-white/5' : 'bg-black/2 hover:bg-black/4'
                    }`} dir="ltr">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]">
                            {uiLang === 'ar' ? itemToneObj.labelAr : itemToneObj.label}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-xs font-semibold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {item.input}
                        </p>
                        <p className={`text-xs mt-1 text-[var(--app-accent1)] font-medium line-clamp-2`}>
                          {item.output}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setInput(item.input);
                            setOutput(item.output);
                            setTone(item.tone);
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
                   );
                 })
               )}
             </div>
           </div>
         )}
       </div>
    </div>
  );
}