// src/path/Dashboard.jsx — the redesigned dashboard (spec §5.1, design p.03).
//
// "Always one obvious next step": the server resolves the current lesson and
// the hero hands the user exactly one primary action — Continue learning.
// Everything else (journey stepper, stat tiles, CEFR levels, achievements,
// review card) is secondary and calm.
//
// Data comes from /api/path/summary + /api/path/map (guests get read-only
// zeroed defaults, so this screen works signed out). Legacy vocab state is
// passed down from App.jsx for the words-learned and review tiles.

import React, { useMemo } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Clock,
  Flame,
  Lock,
  Play,
  RotateCcw,
  Star,
  Trophy,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import {
  Btn,
  Card,
  CardTitle,
  Chip,
  Eyebrow,
  FOCUS_RING,
  ProgressBar,
  ProgressRing,
  StatTile,
} from '../ui/index.jsx';

const LEVEL_CODES = ['A1', 'A2', 'B1', 'B2', 'C1'];

/* ── greeting by time of day + name ─────────────────────────────────────── */

function greetingName(user) {
  const name =
    user?.name || user?.displayName || user?.username ||
    (typeof user?.email === 'string' ? user.email.split('@')[0] : '') || '';
  return String(name).trim();
}

/* ── helpers ────────────────────────────────────────────────────────────── */

function fmtStudyTime(min, T) {
  if (!min || min <= 0) return `0${T('د', 'm')}`;
  if (min < 60) return `${min}${T('د', 'm')}`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}${T('سا', 'h')} ${r}${T('د', 'm')}` : `${h}${T('سا', 'h')}`;
}

/* ── the screen ─────────────────────────────────────────────────────────── */

export function PathDashboard({
  lang,
  summary,
  map,
  loading = false,
  user = null,
  onNavigate,
  onOpenLesson,
  onOpenAuth,
  vocabDueCount = 0,
  wordsLearned = 0,
}) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);

  const levels = map?.levels ?? [];
  const completion = summary?.completion ?? {};
  const startLevel = summary?.startLevel ?? 'A1';
  const levelTitle = levels.find((l) => l.code === startLevel)?.title || startLevel;
  const cur = summary?.current ?? null;
  const authenticated = Boolean(summary?.authenticated);
  const totalDone = Object.values(completion).reduce((s, c) => s + (c?.done || 0), 0);

  // Published non-revision chain of the start level — the journey stepper and
  // the "Lesson N of M" meta both read from it (server-ordered).
  const chain = useMemo(() => {
    const lv = levels.find((l) => l.code === startLevel);
    if (!lv) return [];
    return (lv.units ?? [])
      .flatMap((u) => u.lessons ?? [])
      .filter((l) => !l.draft && l.kind !== 'revision');
  }, [levels, startLevel]);

  const doneCount = chain.filter((l) => l.state === 'completed').length;
  const levelDone = completion[startLevel] ?? { done: 0, total: 0 };
  const levelPct = levelDone.total ? levelDone.done / levelDone.total : 0;

  // Study time: sum of completed lessons' estimates across the whole map.
  const studyMinutes = useMemo(() => {
    let m = 0;
    for (const lv of levels) {
      for (const u of lv.units ?? []) {
        for (const l of u.lessons ?? []) {
          if (l.state === 'completed') m += l.estMinutes || 0;
        }
      }
    }
    return m;
  }, [levels]);

  /* ── loading skeleton (same silhouette, no flicker on refetch) ────────── */
  if (loading && !summary) {
    return (
      <div className="vx-font space-y-4" aria-busy="true">
        <div className="h-[240px] animate-pulse rounded-[22px] bg-[var(--vxp-surface-3)]" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.65fr_1fr]">
          <div className="h-[150px] animate-pulse rounded-[20px] bg-[var(--vxp-surface-3)]" />
          <div className="h-[150px] animate-pulse rounded-[20px] bg-[var(--vxp-surface-3)]" />
        </div>
      </div>
    );
  }

  /* ── hero content variants ────────────────────────────────────────────── */

  const name = greetingName(user);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? T('صباح الخير', 'Good morning')
    : hour < 17 ? T('مساء الخير', 'Good afternoon')
    : T('مساء الخير', 'Good evening');
  const eyebrowText = name ? `${greeting}، ${name}` : greeting;

  const draftCurrent = Boolean(cur?.draft);
  const hasCurrent = Boolean(cur);
  const heroTitle = hasCurrent
    ? cur.title
    : T('أحسنت — أنجزت كل الدروس المفتوحة', 'Nicely done — every unlocked lesson is complete');
  const heroDesc = hasCurrent
    ? cur.objective
    : T(
        'الدروس القادمة قيد الإعداد. استعرض المسار أو راجع درساً أكملته.',
        'Upcoming lessons are being finalized. Review the path or revisit a completed lesson.',
      );
  const metaText = hasCurrent && cur.lessonNo
    ? `${T('الدرس', 'Lesson')} ${cur.lessonNo} ${T('من', 'of')} ${chain.length || levelDone.total} · ${cur.level || startLevel} ${levelTitle}`
    : `${startLevel} ${levelTitle}`;

  const ctaClick = () => {
    if (!hasCurrent) {
      onNavigate('path-home');
      return;
    }
    if (draftCurrent) return;
    if (!authenticated) {
      onOpenAuth?.();
      return;
    }
    onOpenLesson?.(cur.level || startLevel, cur.slug);
  };
  const ctaLabel = !hasCurrent
    ? T('استعرض المسار', 'Review the path')
    : draftCurrent
      ? T('قيد الإنهاء', 'Being finalized')
      : T('تابع التعلم', 'Continue learning');

  /* ── CEFR rows ────────────────────────────────────────────────────────── */

  const startIdx = LEVEL_CODES.indexOf(startLevel);
  const cefrRows = levels.length
    ? levels
    : LEVEL_CODES.map((code) => ({ code, title: code, units: [] }));

  /* ── achievements ─────────────────────────────────────────────────────── */

  const badges = [
    {
      icon: Star,
      label: T('أول درس', 'First lesson'),
      unlocked: totalDone >= 1,
      tint: 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]',
    },
    {
      icon: Flame,
      label: T('سلسلة 3 أيام', '3-day streak'),
      unlocked: (summary?.streak || 0) >= 3,
      tint: 'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
    },
    {
      icon: Award,
      label: T('10 دروس', '10 lessons'),
      unlocked: totalDone >= 10,
      tint: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
    },
  ];

  /* ── journey right-aligned status ─────────────────────────────────────── */

  const journeyStatus = draftCurrent
    ? T('الدرس الحالي قيد الإنهاء', 'current lesson being finalized')
    : cur?.kind === 'revision'
      ? ''
      : cur?.lessonNo
        ? `${T('الفتح القادم:', 'next unlock:')} ${T('الدرس', 'Lesson')} ${cur.lessonNo}`
        : '';

  return (
    <div className="vx-font space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.65fr_1fr]">
        {/* ═══════════════ LEFT column ═══════════════ */}
        <div className="min-w-0 space-y-4">
          {/* Hero card (p.03: blue gradient, one primary action) */}
          <div className="overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,var(--vxp-hero-a),var(--vxp-hero-b))] p-6 text-white shadow-[var(--vxp-shadow)] sm:p-7">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9db9e8]">
                  {eyebrowText}
                </p>
                <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[28px]">
                  {heroTitle}
                </h1>
                <p className="mt-1.5 text-[13px] font-semibold text-white/85">{metaText}</p>
                <p className="mt-2 line-clamp-2 max-w-md text-[13px] leading-relaxed text-white/75">
                  {heroDesc}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Btn
                    variant="onGradient"
                    size="md"
                    icon={ArrowRight}
                    disabled={draftCurrent}
                    onClick={ctaClick}
                  >
                    {ctaLabel}
                  </Btn>
                  {hasCurrent && !draftCurrent && (
                    <span className="text-[12px] font-semibold text-white/70">
                      ≈ {cur.estMinutes} {T('د', 'min')}
                    </span>
                  )}
                </div>

                {draftCurrent && (
                  <Chip variant="amber" className="mt-4 !bg-white/15 !text-amber-100">
                    {T('هذا الدرس قيد الإنهاء وسيُفتح قريباً', 'This lesson is being finalized and will open soon')}
                  </Chip>
                )}
                {!authenticated && (
                  <p className="mt-4 text-[12px] font-semibold text-white/70">
                    {T('أنشئ حساباً مجانياً لحفظ تقدمك وفتح الدروس', 'Create a free account to save progress and unlock lessons')}
                  </p>
                )}
              </div>

              {/* Progress ring — white arc on translucent track (CSS-var scope) */}
              <div
                className="hidden shrink-0 sm:block"
                style={{
                  '--vxp-track': 'rgba(255,255,255,0.25)',
                  '--vxp-text': '#ffffff',
                  '--vxp-dim': 'rgba(255,255,255,0.75)',
                }}
              >
                <ProgressRing
                  value={levelPct}
                  size={118}
                  stroke={10}
                  color="#ffffff"
                  caption={`${startLevel} ${T('مكتمل', 'done')}`}
                />
              </div>
            </div>
          </div>

          {/* Journey stepper (p.03: green checks → blue play → grey locks) */}
          <Card>
            <CardTitle
              eyebrow={T('رحلتك', 'Your journey')}
              title={`${startLevel} · ${levelTitle}`}
              action={
                <span className="shrink-0 text-[12px] font-semibold text-[var(--vxp-dim)]">
                  {doneCount} {T('من', 'of')} {chain.length} {T('دروس', 'lessons')}
                  {journeyStatus && ` · ${journeyStatus}`}
                </span>
              }
            />
            <div className="-mx-1 flex items-center overflow-x-auto px-1 pb-1">
              {chain.map((l, i) => {
                const done = l.state === 'completed';
                const isCurrent = l.state === 'current';
                const isDraft = l.draft;
                return (
                  <React.Fragment key={l.id}>
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        className={`h-[3px] w-6 shrink-0 rounded-full sm:w-8 ${
                          chain[i].state === 'completed' || chain[i].state === 'current'
                            ? 'bg-[var(--vxp-success)]'
                            : 'bg-[var(--vxp-track)]'
                        }`}
                      />
                    )}
                    <button
                      type="button"
                      title={l.title}
                      aria-label={`${l.title} — ${l.state}`}
                      onClick={() => {
                        if (isDraft) return;
                        if (l.state === 'locked') { onNavigate('path-home'); return; }
                        onOpenLesson?.(l.level || startLevel, l.slug);
                      }}
                      className={`flex shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 ${FOCUS_RING} ${
                        isCurrent
                          ? 'h-11 w-11 bg-[var(--vxp-primary)] text-white ring-4 ring-[var(--vxp-primary-tint)]'
                          : done
                            ? 'h-9 w-9 bg-[var(--vxp-success)] text-white'
                            : 'h-9 w-9 bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]'
                      }`}
                    >
                      {isCurrent ? (
                        <Play className="h-[18px] w-[18px]" aria-hidden="true" />
                      ) : done ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
              {chain.length === 0 && (
                <span className="py-4 text-[13px] text-[var(--vxp-dim)]">
                  {T('سيظهر المسار هنا', 'The journey will appear here')}
                </span>
              )}
            </div>
          </Card>

          {/* Three stat tiles (p.03: streak / words / study time) */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <StatTile
                icon={Flame}
                tint="amber"
                value={summary?.streak ?? 0}
                caption={T('السلسلة الحالية', 'Current streak')}
              />
            </Card>
            <Card className="p-4">
              <StatTile
                icon={BookOpen}
                tint="mint"
                value={wordsLearned}
                caption={T('كلمات تعلمتها', 'Words learned')}
              />
            </Card>
            <Card className="p-4">
              <StatTile
                icon={Clock}
                tint="grey"
                value={fmtStudyTime(studyMinutes, T)}
                caption={T('وقت المذاكرة', 'Study time')}
              />
            </Card>
          </div>
        </div>

        {/* ═══════════════ RIGHT column ═══════════════ */}
        <div className="min-w-0 space-y-4">
          {/* CEFR levels (p.03: active row tinted, others locked) */}
          <Card>
            <CardTitle
              eyebrow={T('التقدم', 'Progress')}
              title={T('المستويات', 'CEFR levels')}
            />
            <div className="space-y-2">
              {cefrRows.map((lv, i) => {
                const active = lv.code === startLevel;
                const above = i > startIdx;
                const below = i < startIdx;
                const c = completion[lv.code] ?? { done: 0, total: 0 };
                const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
                return (
                  <div
                    key={lv.code}
                    className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 ${
                      active ? 'bg-[var(--vxp-primary-tint)]' : ''
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-extrabold ${
                        active
                          ? 'bg-[var(--vxp-primary)] text-[var(--vxp-on-primary)]'
                          : 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]'
                      }`}
                    >
                      {lv.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold text-[var(--vxp-text)]">
                        {lv.title || lv.code}
                      </div>
                      {active ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <ProgressBar value={levelPct} className="flex-1" ariaLabel={`${lv.code} progress`} />
                          <span className="text-[12px] font-bold text-[var(--vxp-primary)]">{pct}%</span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-semibold text-[var(--vxp-dim)]">
                          {below
                            ? T('متاح للمراجعة', 'open for revision')
                            : above
                              ? T('مقفل', 'Locked')
                              : T('لم يبدأ بعد', 'Not started')}
                        </div>
                      )}
                    </div>
                    {!active && (
                      above ? (
                        <Lock className="h-4 w-4 shrink-0 text-[var(--vxp-dim)]" aria-hidden="true" />
                      ) : below ? (
                        <Check className="h-4 w-4 shrink-0 text-[var(--vxp-success)]" aria-hidden="true" />
                      ) : (
                        <span className="h-4 w-4 shrink-0" />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Achievements (p.03: three round badges) */}
          <Card>
            <CardTitle
              eyebrow={T('معالم', 'Milestones')}
              title={T('الإنجازات', 'Achievements')}
            />
            <div className="flex items-start justify-around gap-3 py-1">
              {badges.map((b) => (
                <div key={b.label} className="flex w-24 flex-col items-center gap-2 text-center">
                  <span
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full ${
                      b.unlocked ? b.tint : 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]'
                    }`}
                  >
                    <b.icon className="h-6 w-6" aria-hidden="true" />
                    {!b.unlocked && (
                      <span className="absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vxp-surface)] text-[var(--vxp-dim)] shadow-sm ring-1 ring-[var(--vxp-border)]">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[11px] font-bold leading-tight ${
                      b.unlocked ? 'text-[var(--vxp-text)]' : 'text-[var(--vxp-dim)]'
                    }`}
                  >
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Review card (p.03: SRS due count → vocab tab) */}
          <Card>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold leading-snug text-[var(--vxp-text)]">
                  {vocabDueCount > 0
                    ? T(
                        `${vocabDueCount} كلمة مستحقة للمراجعة`,
                        `${vocabDueCount} words due for review`,
                      )
                    : T('لا مراجعات مستحقة الآن', 'Nothing due for review')}
                </div>
                <div className="text-[12px] font-semibold text-[var(--vxp-dim)]">
                  {T('تكرار متباعد · جلسة سريعة', 'Spaced repetition · a quick session')}
                </div>
              </div>
              {vocabDueCount > 0 && (
                <Btn variant="ghost" size="sm" onClick={() => onNavigate('vocab')}>
                  {T('مراجعة', 'Review')}
                </Btn>
              )}
            </div>
          </Card>

          {/* Calm helper — the only other navigation escape hatch */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Eyebrow className="!text-[11px]">
              {T('مسار التعلم', 'Learning path')}
            </Eyebrow>
            <button
              type="button"
              onClick={() => onNavigate('path-home')}
              className={`inline-flex items-center gap-1 rounded text-[12px] font-bold text-[var(--vxp-primary)] transition-colors hover:brightness-110 ${FOCUS_RING}`}
            >
              {T('استعرض الخريطة', 'View the map')}
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
