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
  GitFork, Sparkles, Loader2, AlertCircle, Volume2
} from 'lucide-react';
import { fetchFromAPI, parseJSONLoose, speakEdge } from './aiHelpers';

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

function FormChip({ form, label, isDark }) {
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
        onClick={() => speakEdge(form)}
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
    <div className={`rounded-3xl overflow-hidden liquid-glass ${
      isDark ? 'bg-white/3' : 'bg-white/40'
    }`}>
      <div className={`px-5 py-3 text-xs font-extrabold uppercase tracking-widest ${
        isDark ? 'bg-white/5' : 'bg-black/4'
      }`} style={{ color }}>
        {title}
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

export default function WordFamilyExplorer({ lang: uiLang = 'ar', theme = 'dark' }) {
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
    const raw = await fetchFromAPI(PROMPT(word.trim()), 2200);
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
      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl liquid-glass ${
        isDark ? 'bg-white/5' : 'bg-white/60'
      }`}>
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
          <div className={`rounded-3xl px-6 py-5 flex items-center gap-4 liquid-glass ${
            isDark ? 'bg-white/3' : 'bg-white/55'
          }`}>
            <span className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">{data.base}</span>
            {data.ipa && (
              <span className={`text-sm font-mono font-bold px-3 py-1 rounded-xl ${
                isDark ? 'bg-white/8 text-gray-200' : 'bg-black/5 text-gray-700'
              }`}>{data.ipa}</span>
            )}
            <button
              onClick={() => speakEdge(data.base)}
              className={`ml-auto p-2 rounded-xl transition-all ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
              }`}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Verb forms */}
          {data.verb && (data.verb.base || data.verb.past) && (
            <Section title={t('Verb forms', 'صيغ الفعل')} color="#22c55e" isDark={isDark}>
              <div className="flex flex-wrap gap-2">
                <FormChip form={data.verb.base}           label="base"  isDark={isDark} />
                <FormChip form={data.verb.thirdPerson}    label="-s"    isDark={isDark} />
                <FormChip form={data.verb.past}           label="past"  isDark={isDark} />
                <FormChip form={data.verb.pastParticiple} label="p.p."  isDark={isDark} />
                <FormChip form={data.verb.ing}            label="-ing"  isDark={isDark} />
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
                    <FormChip form={n.form} isDark={isDark} />
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
                    <FormChip form={a.form}        label="adj"  isDark={isDark} />
                    <FormChip form={a.comparative} label="-er"  isDark={isDark} />
                    <FormChip form={a.superlative} label="-est" isDark={isDark} />
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
                  <FormChip form={a.form} isDark={isDark} />
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
                    <FormChip form={r.form} isDark={isDark} />
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
    </div>
  );
}