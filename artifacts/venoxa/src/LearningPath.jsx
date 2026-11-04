// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Learning Path page (Phase 4, PDF pages 04–11)
//
//  The guided CEFR journey. Everything on this page is server-computed:
//  node states (completed/current/unlocked/locked/coming_soon), the current-
//  lesson pointer, placement and unit progress all come from GET /api/path.
//  The client never derives locking.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Route, CheckCircle2, Play, Lock, Loader2, RefreshCcw, Award, BookOpen,
  ChevronRight, Sparkles, RotateCcw, ClipboardCheck, Compass,
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { fetchPathMap, setPlacement } from './pathApi.js';

const LEVEL_META = {
  A1: { ar: 'مبتدئ', en: 'Beginner' },
  A2: { ar: 'ما قبل المتوسط', en: 'Elementary' },
  B1: { ar: 'متوسط', en: 'Intermediate' },
  B2: { ar: 'ما قبل المتقدم', en: 'Upper-Intermediate' },
  C1: { ar: 'متقدم', en: 'Advanced' },
};

function pick(lang, row, enKey, arKey, fallback = '') {
  if (lang === 'ar') return (row?.[arKey] && String(row[arKey])) || (row?.[enKey] && String(row[enKey])) || fallback;
  return (row?.[enKey] && String(row[enKey])) || (row?.[arKey] && String(row[arKey])) || fallback;
}

/* ── Node (one lesson) ─────────────────────────────────────────────────────── */

function PathNode({ lang, lesson, onOpenLesson, onStart, hint, setHint }) {
  const isRTL = lang === 'ar';
  const status = lesson.status;
  const locked = status === 'locked';
  const coming = status === 'coming_soon';

  const meta = {
    completed: {
      icon: CheckCircle2, ring: 'border-emerald-500/30 bg-emerald-500/10', tint: 'text-emerald-500 dark:text-emerald-400',
      chip: _resolveTranslation(lang, `أفضل نتيجة ${lesson.bestScore}%`, `Best ${lesson.bestScore}%`),
      label: _resolveTranslation(lang, 'مكتمل', 'Completed'),
    },
    current: {
      icon: Play, ring: 'border-sky-500/50 bg-sky-500/10 ring-2 ring-sky-500/30', tint: 'text-sky-500 dark:text-sky-400',
      chip: _resolveTranslation(lang, 'درسك الحالي — تابع من هنا', 'Your current lesson — continue here'),
      label: _resolveTranslation(lang, 'تابع', 'Continue'),
    },
    unlocked: {
      icon: Play, ring: 'border-sky-500/20 bg-sky-500/5', tint: 'text-sky-500 dark:text-sky-400',
      chip: _resolveTranslation(lang, 'متاح', 'Open'),
      label: _resolveTranslation(lang, 'ابدأ', 'Start'),
    },
    locked: {
      icon: Lock, ring: 'border-white/10 dark:border-white/5 bg-black/20 opacity-75', tint: 'text-gray-400',
      chip: _resolveTranslation(lang, 'أكمل الدروس السابقة أولاً', 'Finish the previous lessons to unlock'),
      label: _resolveTranslation(lang, 'مقفل', 'Locked'),
    },
    coming_soon: {
      icon: Sparkles, ring: 'border-white/10 dark:border-white/5 bg-black/20 opacity-60', tint: 'text-gray-400',
      chip: _resolveTranslation(lang, 'قريباً — مخطط الدرس', 'Coming soon — outline'),
      label: _resolveTranslation(lang, 'قريباً', 'Soon'),
    },
  }[status] || {};

  const Icon = meta.icon || Lock;
  const kindIcon = lesson.kind === 'assessment' ? ClipboardCheck : lesson.kind === 'revision' ? RotateCcw : null;
  const kindLabel = lesson.kind === 'assessment'
    ? _resolveTranslation(lang, 'اختبار', 'Assessment')
    : lesson.kind === 'revision' ? _resolveTranslation(lang, 'مراجعة', 'Revision') : null;

  const clickable = !locked && !coming;

  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3 }}
      className="relative pl-10 sm:pl-14"
    >
      {/* rail line + node */}
      <span aria-hidden className={`absolute ${isRTL ? 'right-4 sm:right-6' : 'left-4 sm:left-6'} top-6 bottom-[-14px] w-px bg-gradient-to-b from-sky-500/40 to-transparent`} />
      <span className={`absolute ${isRTL ? 'right-1 sm:right-3' : 'left-1 sm:left-3'} top-3 grid place-items-center w-9 h-9 rounded-xl border ${meta.ring} ${meta.tint}`}>
        <Icon size={16} />
      </span>

      <button
        type="button"
        disabled={!clickable}
        onClick={() => {
          if (clickable) onOpenLesson(lesson.slug);
          else if (!setHint) return;
          else setHint({ slug: lesson.slug, text: meta.chip });
        }}
        className={`w-full text-start rounded-2xl p-4 premium-card border border-white/10 dark:border-white/5 transition-all
          ${clickable ? 'hover:ring-2 hover:ring-sky-400/30 hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-bold leading-snug ${locked || coming ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                {pick(lang, lesson, 'titleEn', 'titleAr')}
              </h4>
              {kindIcon && kindLabel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {kindLabel}
                </span>
              )}
              {hint?.slug === lesson.slug && <span className="text-xs text-amber-500 dark:text-amber-400">{hint.text}</span>}
            </div>
            {(lesson.objectiveEn || lesson.objectiveAr) && clickable && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {pick(lang, lesson, 'objectiveEn', 'objectiveAr')}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] text-gray-400 dark:text-gray-500">
              <span>{meta.chip}</span>
              {(status === 'completed' || status === 'current' || status === 'unlocked') && (
                <span>· {lesson.passScore}%</span>
              )}
              {lesson.attempts > 0 && status === 'completed' && (
                <span>· {_resolveTranslation(lang, `${lesson.attempts} محاولة`, `${lesson.attempts} attempt${lesson.attempts > 1 ? 's' : ''}`)}</span>
              )}
            </div>
          </div>
          {clickable && (
            <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors
              ${status === 'current'
                ? 'bg-sky-500 text-white hover:bg-sky-400'
                : 'bg-white/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-white/10'}`}>
              {meta.label}
              <ChevronRight size={14} className="rtl:rotate-180" />
            </span>
          )}
        </div>
      </button>
    </motion.li>
  );
}

/* ── Placement welcome (PDF page 12) ───────────────────────────────────────── */

function WelcomeCard({ lang, placing, onStartFromA1, onTakeTest }) {
  return (
    <div className="rounded-3xl p-8 sm:p-12 premium-card border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-transparent to-violet-500/10 text-center">
      <span className="mx-auto grid place-items-center w-16 h-16 rounded-3xl bg-sky-500/15 text-sky-500 dark:text-sky-400">
        <Compass size={30} />
      </span>
      <h2 className="mt-5 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        {_resolveTranslation(lang, 'رحلتك الإنجليزية تبدأ هنا', 'Your guided English journey starts here')}
      </h2>
      <p className="mt-2 text-sm max-w-md mx-auto text-gray-500 dark:text-gray-400">
        {_resolveTranslation(
          lang,
          'درس واحد في كل مرة، من A1 إلى C1. ابدأ من المستوى الأول أو خُذ اختبار المستوى لنضعك في المكان الصحيح.',
          'One lesson at a time, from A1 to C1. Start from the beginning, or take the level test and we will place you correctly.',
        )}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={placing}
          onClick={onStartFromA1}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white bg-sky-500 hover:bg-sky-400 disabled:opacity-60 transition-colors"
        >
          {placing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {_resolveTranslation(lang, 'البدء من A1', 'Start from A1')}
        </button>
        <button
          type="button"
          onClick={onTakeTest}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 transition-colors"
        >
          <Award size={16} />
          {_resolveTranslation(lang, 'اِختبار تحديد المستوى', 'Take the placement test')}
        </button>
      </div>
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────────────────── */

export default function LearningPath({ lang, theme, setTab, onOpenLesson, onOpenAuth }) {
  const [phase, setPhase] = useState('loading'); // loading | auth | setup | empty | ready | error
  const [map, setMap] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [hint, setHint] = useState(null);

  const load = useCallback(async () => {
    setPhase('loading');
    const res = await fetchPathMap();
    if (res.ok && res.data) {
      const data = res.data;
      const totalPublished = data?.progress?.publishedLessons ?? 0;
      setMap(data);
      setPhase(totalPublished > 0 ? 'ready' : 'empty');
    } else if (res.status === 401) {
      setPhase('auth');
    } else if (res.data?.error === 'schema_missing' || res.status === 503) {
      setPhase('setup');
    } else {
      setPhase('error');
    }
  }, []);

  useEffect(() => { load(); }, [load, reloadKey]);

  const startFromA1 = async () => {
    setPlacing(true);
    const res = await setPlacement({ level: 'A1' });
    setPlacing(false);
    if (res.ok) setReloadKey((k) => k + 1);
  };

  const isRTL = lang === 'ar';
  const levelsWithContent = (map?.levels || []).filter((l) => l.published > 0);
  const levelsEmpty = (map?.levels || []).filter((l) => l.published === 0);

  /* ── states ── */
  if (phase === 'loading') {
    return (
      <div className="grid place-items-center py-32 text-sky-500 dark:text-sky-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (phase === 'auth') {
    return (
      <div className="rounded-3xl p-8 premium-card border border-white/10 dark:border-white/5 text-center py-16">
        <Lock size={28} className="mx-auto text-gray-400" />
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          {_resolveTranslation(lang, 'سجّل دخولك لبدء المسار', 'Sign in to open your path')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {_resolveTranslation(lang, 'تقدمك محفوظ على حسابك ولا يمكن كذبه من المتصفح.', 'Your progress lives on your account and cannot be faked from the browser.')}
        </p>
        <button type="button" onClick={onOpenAuth} className="mt-5 px-6 py-3 rounded-2xl font-bold text-white bg-sky-500 hover:bg-sky-400 transition-colors">
          {_resolveTranslation(lang, 'تسجيل الدخول', 'Sign in')}
        </button>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="rounded-3xl p-8 premium-card border border-amber-500/30 bg-amber-500/5 text-center py-14">
        <Route size={30} className="mx-auto text-amber-500 dark:text-amber-400" />
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          {_resolveTranslation(lang, 'المسار قيد الإعداد', 'The learning path is one step away')}
        </h2>
        <p className="mt-2 text-sm max-w-lg mx-auto text-gray-500 dark:text-gray-400 leading-relaxed">
          {_resolveTranslation(
            lang,
            'جداول المسار غير موجودة بعد في قاعدة البيانات. شغّل ملف migrations/learning-path.sql في محرر SQL داخل لوحة Supabase ثم أعد المحاولة.',
            'The path tables are not created yet in the database. Run migrations/learning-path.sql in the Supabase SQL Editor, then retry.',
          )}
        </p>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-gray-800 dark:text-white bg-white/60 dark:bg-white/5 border border-white/10 hover:bg-white transition-colors">
          <RefreshCcw size={14} />
          {_resolveTranslation(lang, 'إعادة المحاولة', 'Retry')}
        </button>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="rounded-3xl p-8 premium-card border border-white/10 dark:border-white/5 text-center py-14">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {_resolveTranslation(lang, 'تعذّر تحميل المسار. تحقق من الاتصال ثم أعد المحاولة.', 'Could not load the path. Check your connection and retry.')}
        </p>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-4 px-5 py-2.5 rounded-xl font-semibold text-white bg-sky-500 hover:bg-sky-400 transition-colors">
          {_resolveTranslation(lang, 'إعادة المحاولة', 'Retry')}
        </button>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-500 dark:text-sky-400"><Route size={22} /></span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{_resolveTranslation(lang, 'مسار التعلم', 'Learning Path')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{_resolveTranslation(lang, 'من A1 إلى C1 — درس واحد في كل مرة', 'A1 to C1 — one lesson at a time')}</p>
          </div>
        </header>
        <WelcomeCard lang={lang} placing={placing} onStartFromA1={startFromA1} onTakeTest={() => setTab('level-test')} />
        {/* Outline previews from the server map */}
        {levelsWithContent.length === 0 && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
            {_resolveTranslation(lang, 'مخططات المستويات القادمة تظهر بأسمائها من قاعدة البيانات.', 'Upcoming level outlines are shown with their real database titles.')}
          </p>
        )}
        <ComingSoonStrip lang={lang} levels={levelsWithContent.length ? levelsEmpty : (map?.levels || [])} />
      </div>
    );
  }

  /* ── ready ── */
  const pct = map?.progress?.publishedLessons
    ? Math.round(((map.progress.completedLessons || 0) / map.progress.publishedLessons) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-500 dark:text-sky-400"><Route size={22} /></span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{_resolveTranslation(lang, 'مسار التعلم', 'Learning Path')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {_resolveTranslation(lang, 'من A1 إلى C1 — درس واحد في كل مرة', 'A1 to C1 — one lesson at a time')}
            </p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{pct}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {map?.progress?.completedLessons || 0}/{map?.progress?.publishedLessons || 0} {_resolveTranslation(lang, 'درس', 'lessons')}
          </p>
        </div>
      </header>

      {/* Level rail */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(map?.levels || []).map((l) => {
          const active = l.published > 0;
          return (
            <div
              key={l.level}
              className={`shrink-0 px-4 py-2.5 rounded-2xl border text-center min-w-28 transition-colors ${
                active ? 'border-sky-500/30 bg-sky-500/10' : 'border-white/10 dark:border-white/5 bg-black/20 opacity-60'
              }`}
            >
              <p className="font-bold text-gray-900 dark:text-white">{l.level}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{LEVEL_META[l.level]?.[isRTL ? 'ar' : 'en']}</p>
              <p className={`mt-1 text-xs font-bold ${l.completed >= l.published && active ? 'text-emerald-500 dark:text-emerald-400' : 'text-sky-500 dark:text-sky-400'}`}>
                {l.published ? `${l.completed}/${l.published}` : _resolveTranslation(lang, 'قريباً', 'Soon')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Levels with published lessons */}
      {levelsWithContent.map((level) => (
        <section key={level.level} className="space-y-5">
          {level.units.map((unit) => (
            <div key={`${level.level}-${unit.unit}`} className="rounded-3xl p-5 sm:p-6 premium-card border border-white/10 dark:border-white/5">
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 dark:border-white/5">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-sky-500 dark:text-sky-400">
                  UNIT {unit.unit} · {pick(lang, unit, 'titleEn', 'titleAr')}
                </h3>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {unit.completed}/{unit.published} {_resolveTranslation(lang, 'مكتمل', 'done')}
                </span>
              </div>
              <ul className="space-y-3">
                {unit.lessons.map((lesson) => (
                  <PathNode
                    key={lesson.slug}
                    lang={lang}
                    lesson={lesson}
                    onOpenLesson={onOpenLesson}
                    hint={hint}
                    setHint={setHint}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <ComingSoonStrip lang={lang} levels={levelsEmpty} />
    </div>
  );
}

function ComingSoonStrip({ lang, levels = [] }) {
  if (!levels.length) return null;
  return (
    <div className="rounded-2xl px-5 py-4 premium-card border border-white/10 dark:border-white/5">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
        {_resolveTranslation(lang, 'مستويات قادمة', 'Coming next')}
      </p>
      <div className="flex flex-wrap gap-2">
        {levels.map((l) => (
          <span key={l.level} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/20 border border-white/10 text-gray-400">
            {l.level} · {l.comingSoon || l.published === 0 ? _resolveTranslation(lang, 'مخطط جاهز', 'outline ready') : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard hero (PDF page 03 "Continue the journey") ───────────────────── */

export function PathHero({ lang, theme, setTab, onOpenLesson, user }) {
  const cached = useMemo(() => {
    try {
      const raw = localStorage.getItem('venoxa_path_cache_v1');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const current = cached?.currentLesson;
  const totalPublished = cached?.progress?.publishedLessons ?? 0;

  if (!totalPublished) {
    return (
      <button
        type="button"
        onClick={() => setTab('path')}
        className="group w-full text-start rounded-3xl p-6 premium-card border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-transparent to-violet-500/10 hover:ring-2 hover:ring-sky-400/30 transition-all"
      >
        <div className="flex items-center gap-4">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-500 dark:text-sky-400"><Route size={24} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 dark:text-sky-400">
              {_resolveTranslation(lang, 'المسار الموجّه', 'Guided path')}
            </p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {_resolveTranslation(lang, 'ابدأ دورة الإنجليزية من A1', 'Start the guided English course')}
            </h3>
          </div>
          <ChevronRight size={18} className="rtl:rotate-180 text-sky-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </div>
      </button>
    );
  }

  const pct = totalPublished ? Math.round(((cached.progress.completedLessons || 0) / totalPublished) * 100) : 0;
  return (
    <div className="rounded-3xl p-6 premium-card border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-transparent to-violet-500/10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-500 dark:text-sky-400 shrink-0"><BookOpen size={22} /></span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 dark:text-sky-400">{_resolveTranslation(lang, 'تُكمل من هنا', 'Continue where you left off')}</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {current ? pick(lang, current, 'titleEn', 'titleAr') : _resolveTranslation(lang, 'كل الدروس المتاحة مكتملة 🎉', 'Every available lesson is done 🎉')}
            </h3>
            {current && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {current.level} · UNIT {current.unit} {pick(lang, current, 'unitTitleEn', 'unitTitleAr')}
              </p>
            )}
          </div>
        </div>
        <div className="text-end shrink-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{pct}%</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {cached.progress.completedLessons}/{totalPublished}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-1.5 rounded-full bg-white/10 dark:bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => (current ? onOpenLesson(current.slug) : setTab('path'))}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-sky-500 hover:bg-sky-400 transition-colors"
        >
          {current ? _resolveTranslation(lang, 'تابع الدرس', 'Continue lesson') : _resolveTranslation(lang, 'استعرض المسار', 'View path')}
          <ChevronRight size={14} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
