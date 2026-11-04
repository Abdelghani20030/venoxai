// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Lesson Player (Phase 4, PDF pages 05–09)
//
//  Loads one lesson from GET /api/path/lessons/:slug, renders the authored
//  content steps, gives instant server-checked practice feedback, then grades
//  the check exercises ON THE SERVER. Correct answers come back per exercise
//  only AFTER submission — this file never sees an answer_key.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, BookOpen, CheckCircle2, XCircle, Loader2, Lock,
  RefreshCcw, Volume2, Sparkles, Lightbulb, ClipboardCheck, PartyPopper,
  ChevronRight,
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { fetchLesson, submitAttempt, PATH_ERROR } from './pathApi.js';

/* ── helpers ───────────────────────────────────────────────────────────────── */

function pick(lang, obj, enKey, arKey, fallback = '') {
  if (lang === 'ar') return (obj?.[arKey] && String(obj[arKey])) || (obj?.[enKey] && String(obj[enKey])) || fallback;
  return (obj?.[enKey] && String(obj[enKey])) || (obj?.[arKey] && String(obj[arKey])) || fallback;
}

const STEP_META = {
  grammar: { ar: 'القاعدة', en: 'Grammar rule', icon: BookOpen },
  vocab: { ar: 'المفردات', en: 'Vocabulary', icon: Sparkles },
  listening: { ar: 'الاستماع', en: 'Listening', icon: Volume2 },
  pronunciation: { ar: 'النطق', en: 'Pronunciation', icon: Volume2 },
  practice: { ar: 'تدريب', en: 'Practice', icon: RefreshCcw },
  check: { ar: 'الاختبار القصير', en: 'Short check', icon: ClipboardCheck },
};

function shuffled(tokens) {
  const arr = tokens.map((t, i) => ({ t, i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── exercise renderers ────────────────────────────────────────────────────── */

function ChoiceRow({ ex, value, onChange, disabled }) {
  const options = Array.isArray(ex.options) ? ex.options : [];
  return (
    <div className="grid gap-2">
      {options.map((opt, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onChange(idx)}
          className={`text-start px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
            value === idx
              ? 'border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300'
              : 'border-white/10 bg-black/10 dark:bg-white/[0.03] hover:border-sky-500/40 text-gray-700 dark:text-gray-300'
          } disabled:opacity-70`}
        >
          {String(opt)}
        </button>
      ))}
    </div>
  );
}

function BooleanRow({ ex, value, onChange, disabled, lang }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((b) => (
        <button
          key={String(b)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(b)}
          className={`flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
            value === b
              ? 'border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300'
              : 'border-white/10 bg-black/10 dark:bg-white/[0.03] text-gray-700 dark:text-gray-300'
          } disabled:opacity-70`}
        >
          {b
            ? _resolveTranslation(lang, 'صح ✔', 'True ✔')
            : _resolveTranslation(lang, 'خطأ ✘', 'False ✘')}
        </button>
      ))}
    </div>
  );
}

function TextInputRow({ ex, value, onChange, disabled }) {
  return (
    <input
      type="text"
      dir="ltr"
      disabled={disabled}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="…"
      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/10 dark:bg-white/[0.03] text-sm text-gray-900 dark:text-white placeholder:text-gray-500 outline-none focus:border-sky-500"
    />
  );
}

function WordOrderRow({ ex, value, onChange, disabled }) {
  const pool = useMemo(() => shuffled(Array.isArray(ex.options) ? ex.options : []), [ex.id]);
  const chosen = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-2" dir="ltr">
      <div className="min-h-12 flex flex-wrap gap-2 p-3 rounded-xl border border-dashed border-sky-500/30 bg-sky-500/5">
        {chosen.length === 0 && <span className="text-xs text-gray-500 self-center">Tap the words in order…</span>}
        {chosen.map((t, idx) => (
          <button key={`${t}-${idx}`} type="button" disabled={disabled} onClick={() => onChange(chosen.filter((_, i) => i !== idx))} className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sm font-semibold text-gray-900 dark:text-white">
            {t}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map(({ t, i }) => {
          const used = chosen.filter((c) => c === t).length >= pool.filter((p) => p.t === t).length;
          return (
            <button
              key={`${t}-${i}`}
              type="button"
              disabled={disabled || used}
              onClick={() => onChange([...chosen, t])}
              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
                used
                  ? 'border-white/5 bg-black/5 text-gray-600 dark:text-gray-600 opacity-40'
                  : 'border-white/10 bg-black/10 dark:bg-white/[0.03] hover:border-sky-500/40 text-gray-900 dark:text-white'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchRow({ ex, value, onChange, disabled }) {
  const pairs = Array.isArray(ex.options) ? ex.options : [];
  const lefts = pairs.map((p) => (Array.isArray(p) ? p[0] : '')).filter(Boolean);
  const rights = Array.from(new Set(pairs.map((p) => (Array.isArray(p) ? p[1] : '')).filter(Boolean)));
  const chosen = Array.isArray(value) ? value : [];
  const valFor = (l) => chosen.find((c) => c && Array.isArray(c) && c[0] === l)?.[1] ?? '';
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {lefts.map((l) => (
        <label key={l} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/10 dark:bg-white/[0.03]">
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{l}</span>
          <span className="flex items-center gap-1">
            <ArrowRight size={12} className="text-gray-400 rtl:hidden" />
            <ArrowLeft size={12} className="text-gray-400 hidden rtl:inline" />
            <select
              disabled={disabled}
              value={valFor(l)}
              onChange={(e) => {
                const next = lefts.map((x) => [x, x === l ? e.target.value : valFor(x)]);
                onChange(next);
              }}
              className="rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-gray-900 dark:text-white px-2 py-1.5 outline-none"
            >
              <option value="">—</option>
              {rights.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </span>
        </label>
      ))}
    </div>
  );
}

function AnswerInput({ ex, value, onChange, disabled, lang }) {
  switch (ex.type) {
    case 'multiple_choice': return <ChoiceRow ex={ex} value={value} onChange={onChange} disabled={disabled} />;
    case 'true_false': return <BooleanRow ex={ex} value={value} onChange={onChange} disabled={disabled} lang={lang} />;
    case 'type_answer':
    case 'fill_blank': return <TextInputRow ex={ex} value={value} onChange={onChange} disabled={disabled} />;
    case 'word_order': return <WordOrderRow ex={ex} value={value} onChange={onChange} disabled={disabled} />;
    case 'match': return <MatchRow ex={ex} value={value} onChange={onChange} disabled={disabled} />;
    default: return null;
  }
}

/* ── content step card ─────────────────────────────────────────────────────── */

function ContentCard({ lang, row }) {
  const meta = STEP_META[row.step] || { ar: row.step, en: row.step, icon: BookOpen };
  const Icon = meta.icon;
  const words = Array.isArray(row.config?.words) ? row.config.words : [];
  const examples = Array.isArray(row.examples) ? row.examples : [];
  return (
    <section className="rounded-2xl p-5 sm:p-6 premium-card border border-white/10 dark:border-white/5">
      <div className="flex items-center gap-2 text-sky-500 dark:text-sky-400 mb-3">
        <Icon size={16} />
        <span className="text-xs font-extrabold uppercase tracking-widest">{_resolveTranslation(lang, meta.ar, meta.en)}</span>
      </div>
      {pick(lang, row, 'explanationEn', 'explanationAr') && (
        <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-line">
          {pick(lang, row, 'explanationEn', 'explanationAr')}
        </p>
      )}
      {words.length > 0 && (
        <ul className="mt-4 grid sm:grid-cols-2 gap-2" dir="ltr">
          {words.map((w, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-black/10 dark:bg-white/[0.03] border border-white/10">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{typeof w === 'object' ? w?.en ?? JSON.stringify(w) : w}</span>
              {typeof w === 'object' && w?.ar && <span className="text-sm text-gray-500 dark:text-gray-400" dir="rtl">{w.ar}</span>}
            </li>
          ))}
        </ul>
      )}
      {examples.length > 0 && (
        <ul className="mt-4 space-y-2">
          {examples.map((ex, i) => (
            <li key={i} className="flex gap-2 px-3 py-2 rounded-xl bg-sky-500/5 border border-sky-500/15">
              <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm" dir="ltr">
                <p className="font-semibold text-gray-900 dark:text-white">{ex?.en ?? ''}</p>
                {ex?.ar && <p className="text-gray-500 dark:text-gray-400" dir="rtl">{ex.ar}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pick(lang, row, 'notesEn', 'notesAr') && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">💡 {pick(lang, row, 'notesEn', 'notesAr')}</p>
      )}
    </section>
  );
}

/* ── exercise card (shared by practice + check) ────────────────────────────── */

function ExerciseCard({ lang, ex, answer, onAnswer, result, disabled, action }) {
  const status = result ? (result.correct ? 'ok' : 'bad') : null;
  return (
    <div className={`rounded-2xl p-5 premium-card border ${
      status === 'ok' ? 'border-emerald-500/30' : status === 'bad' ? 'border-rose-500/30' : 'border-white/10 dark:border-white/5'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-gray-900 dark:text-white leading-snug">{pick(lang, ex, 'promptEn', 'promptAr')}</p>
        {status === 'ok' && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
        {status === 'bad' && <XCircle size={20} className="text-rose-500 shrink-0" />}
      </div>
      <div className="mt-4">
        <AnswerInput ex={ex} value={answer} onChange={onAnswer} disabled={disabled} lang={lang} />
      </div>
      {result && (result.explanationEn || result.explanationAr) && (
        <p className="mt-3 text-xs rounded-xl px-3 py-2 bg-white/40 dark:bg-white/[0.04] border border-white/10 text-gray-600 dark:text-gray-300">
          {pick(lang, result, 'explanationEn', 'explanationAr')}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ── the player ────────────────────────────────────────────────────────────── */

export default function LessonPlayer({ slug, lang, theme, onExit, onOpenLesson }) {
  const [phase, setPhase] = useState('loading'); // loading | ready | locked | gone | submitting | error
  const [data, setData] = useState(null);
  const [lockedInfo, setLockedInfo] = useState(null);
  const [answers, setAnswers] = useState({});
  const [practice, setPractice] = useState({});   // exId -> {correct, explanationEn, explanationAr}
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    if (!slug) { setPhase('gone'); return; }
    setPhase('loading');
    setAnswers({});
    setPractice({});
    setCheckResult(null);
    const res = await fetchLesson(slug);
    if (res.ok) {
      setData(res.data);
      setPhase('ready');
    } else if (res.status === 403 && res.data?.error === PATH_ERROR.LOCKED) {
      setLockedInfo(res.data);
      setPhase('locked');
    } else if (res.status === 403 || res.status === 404) {
      setPhase('gone');
    } else {
      setPhase('error');
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const setAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));

  const content = useMemo(() => (data?.content || []).filter((row) => !['practice', 'check'].includes(row.step)), [data]);
  const practiceEx = useMemo(() => (data?.exercises || []).filter((ex) => ex.step === 'practice'), [data]);
  const checkEx = useMemo(() => (data?.exercises || []).filter((ex) => ex.step !== 'practice'), [data]);
  const exById = useMemo(() => { const m = {}; for (const ex of [...practiceEx, ...checkEx]) m[ex.id] = ex; return m; }, [practiceEx, checkEx]);

  const checkOnePractice = async (ex) => {
    if (practice[ex.id]) return;
    setChecking(true);
    const res = await submitAttempt(slug, 'practice', { [ex.id]: answers[ex.id] });
    setChecking(false);
    const row = res?.data?.results?.[0];
    if (row) setPractice((p) => ({ ...p, [ex.id]: { correct: row.correct, explanationEn: row.explanationEn, explanationAr: row.explanationAr } }));
  };

  const runCheck = async () => {
    setChecking(true);
    const res = await submitAttempt(slug, 'check', answers);
    setChecking(false);
    if (res?.status === 403) {
      setLockedInfo(res.data);
      setPhase('locked');
      return;
    }
    if (res?.data && !res.data.error) setCheckResult(res.data);
  };

  /* ── phase renders ── */
  if (phase === 'loading') {
    return <div className="grid place-items-center py-28 text-sky-500 dark:text-sky-400"><Loader2 size={26} className="animate-spin" /></div>;
  }

  if (phase === 'locked') {
    return (
      <div className="rounded-3xl p-8 premium-card border border-amber-500/30 bg-amber-500/5 text-center py-14">
        <Lock size={30} className="mx-auto text-amber-500 dark:text-amber-400" />
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          {_resolveTranslation(lang, 'هذا الدرس مقفل 🔒', 'This lesson is locked 🔒')}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {_resolveTranslation(lang, 'أكمل درسك الحالي أولاً.', 'Finish your current lesson first.')}
        </p>
        <div className="mt-5 flex justify-center gap-3 flex-wrap">
          {lockedInfo?.currentSlug && (
            <button type="button" onClick={() => onOpenLesson(lockedInfo.currentSlug)} className="px-5 py-2.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 transition-colors inline-flex items-center gap-2">
              {_resolveTranslation(lang, 'اذهب للدرس الحالي', 'Go to current lesson')}
              <ChevronRight size={14} className="rtl:rotate-180" />
            </button>
          )}
          <button type="button" onClick={onExit} className="px-5 py-2.5 rounded-xl font-semibold text-gray-800 dark:text-white bg-white/60 dark:bg-white/5 border border-white/10 transition-colors">
            {_resolveTranslation(lang, 'رجوع للمسار', 'Back to path')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'gone' || phase === 'error') {
    return (
      <div className="rounded-3xl p-8 premium-card border border-white/10 dark:border-white/5 text-center py-14">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {_resolveTranslation(lang, 'هذا الدرس غير متوفر بعد.', 'This lesson is not available yet.')}
        </p>
        <button type="button" onClick={onExit} className="mt-4 px-5 py-2.5 rounded-xl font-semibold text-white bg-sky-500 hover:bg-sky-400 transition-colors">
          {_resolveTranslation(lang, 'رجوع للمسار', 'Back to path')}
        </button>
      </div>
    );
  }

  const lesson = data?.lesson || {};
  const passScore = lesson.passScore || 70;
  const answeredCount = checkEx.filter((ex) => answers[ex.id] !== undefined && answers[ex.id] !== '').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <button type="button" onClick={onExit} className="shrink-0 mt-1 grid place-items-center w-10 h-10 rounded-xl border border-white/10 bg-black/10 dark:bg-white/[0.03] text-gray-500 hover:text-sky-500 transition-colors">
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-widest text-sky-500 dark:text-sky-400">
              {lesson.level} · {_resolveTranslation(lang, `الوحدة ${lesson.unit}`, `Unit ${lesson.unit}`)}
              {lesson.kind === 'assessment' ? ' · ' + _resolveTranslation(lang, 'اختبار', 'Assessment') : ''}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug">{pick(lang, lesson, 'titleEn', 'titleAr')}</h1>
            {pick(lang, lesson, 'objectiveEn', 'objectiveAr') && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{pick(lang, lesson, 'objectiveEn', 'objectiveAr')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {_resolveTranslation(lang, `النجاح ${passScore}%+`, `Pass ${passScore}%+`)}
          </span>
          {data?.userProgress?.completed && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {_resolveTranslation(lang, 'مكتمل ✓', 'Done ✓')}
            </span>
          )}
        </div>
      </div>

      {/* Content steps */}
      {content.map((row) => <ContentCard key={row.id} lang={lang} row={row} />)}

      {/* Practice */}
      {practiceEx.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-sky-500 dark:text-sky-400 flex items-center gap-2">
            <RefreshCcw size={12} /> {_resolveTranslation(lang, 'تدريب — بدون نقاط', 'Practice — no stakes')}
          </h3>
          {practiceEx.map((ex) => (
            <ExerciseCard
              key={ex.id}
              lang={lang}
              ex={ex}
              answer={answers[ex.id]}
              onAnswer={(v) => setAnswer(ex.id, v)}
              result={practice[ex.id]}
              disabled={Boolean(practice[ex.id]) || checking}
              action={(
                <button
                  type="button"
                  disabled={checking || practice[ex.id] || answers[ex.id] === undefined || answers[ex.id] === ''}
                  onClick={() => checkOnePractice(ex)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition-colors"
                >
                  {practice[ex.id]
                    ? _resolveTranslation(lang, 'تم', 'Checked')
                    : _resolveTranslation(lang, 'تحقق من إجابتي', 'Check my answer')}
                </button>
              )}
            />
          ))}
        </section>
      )}

      {/* Check */}
      {checkEx.length > 0 && !checkResult && (
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400 flex items-center gap-2">
            <ClipboardCheck size={12} /> {_resolveTranslation(lang, 'الاختبار — يفتح الدرس التالي', 'The check — unlocks the next lesson')}
          </h3>
          {checkEx.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              lang={lang}
              ex={ex}
              answer={answers[ex.id]}
              onAnswer={(v) => setAnswer(ex.id, v)}
              result={null}
              disabled={checking}
              title={`${i + 1}.`}
            />
          ))}
          <button
            type="button"
            onClick={runCheck}
            disabled={checking || answeredCount === 0}
            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-sky-500 to-violet-500 hover:brightness-110 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
          >
            {checking ? <Loader2 size={18} className="animate-spin" /> : <ClipboardCheck size={18} />}
            {_resolveTranslation(lang, `إنهاء الاختبار (${answeredCount}/${checkEx.length})`, `Submit check (${answeredCount}/${checkEx.length})`)}
          </button>
        </section>
      )}

      {/* Result */}
      {checkResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl p-8 premium-card border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-transparent to-violet-500/10 text-center"
        >
          <span className="mx-auto grid place-items-center w-20 h-20 rounded-full text-3xl font-black text-white bg-gradient-to-br from-sky-500 to-violet-500">
            {checkResult.score}%
          </span>
          {checkResult.passed ? (
            <>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <PartyPopper size={22} className="text-amber-500" />
                {_resolveTranslation(lang, 'أحسنت — اكتمل الدرس!', 'Nice — lesson complete!')}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {_resolveTranslation(lang, `+${checkResult.xpAwarded} نقطة خبرة · ${checkResult.newWords} كلمات جديدة`, `+${checkResult.xpAwarded} XP · ${checkResult.newWords} new words`)}
              </p>
              {checkResult.nextLesson ? (
                <button type="button" onClick={() => onOpenLesson(checkResult.nextLesson.slug)} className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white bg-sky-500 hover:bg-sky-400 transition-colors">
                  {_resolveTranslation(lang, 'الدرس التالي', 'Next lesson')}
                  <ChevronRight size={16} className="rtl:rotate-180" />
                  <span className="font-semibold opacity-80">{pick(lang, checkResult.nextLesson, 'titleEn', 'titleAr')}</span>
                </button>
              ) : (
                <p className="mt-5 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {_resolveTranslation(lang, 'هذا آخر درس متاح حالياً — سيزيد المحتوى قريباً!', "That's the last available lesson for now — more is coming soon!")}
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                {_resolveTranslation(lang, 'ليس بعد — تحتاج  ', 'Not yet — you need')}
                {' '}{passScore}% {checkResult.score < 100 ? _resolveTranslation(lang, 'لفتح الدرس التالي', 'to unlock the next lesson') : ''}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{_resolveTranslation(lang, 'راجع الشرح ثم حاول مجدداً — أفضل نتيجة تُحفظ.', 'Review the lesson, then try again — your best score is kept.')}</p>
              <div className="mt-5 flex justify-center gap-3 flex-wrap">
                <button type="button" onClick={() => { setCheckResult(null); setAnswers({}); setPractice({}); }} className="px-5 py-2.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 transition-colors">
                  {_resolveTranslation(lang, 'إعادة المحاولة', 'Try again')}
                </button>
                <button type="button" onClick={onExit} className="px-5 py-2.5 rounded-xl font-semibold text-gray-800 dark:text-white bg-white/60 dark:bg-white/5 border border-white/10 transition-colors">
                  {_resolveTranslation(lang, 'رجوع للمسار', 'Back to path')}
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
