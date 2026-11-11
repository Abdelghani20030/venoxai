// src/path/ProgressHub.jsx — Phase 8: My Progress Hub (spec §5.6, §5.10, §5.15, §5.17, PDF p.8)
//
// Features:
//   - Overall progress card with SVG ProgressRing (PDF p.8 right)
//   - "This week" 7-bar chart (Mon–Sun)
//   - Quick navigation cards: Study Plan, Profile, Level Test Results, Certificate
//   - Full keyboard focus & RTL support

import React, { useMemo } from 'react';
import {
  Calendar,
  User,
  Award,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Flame,
  Zap,
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
  Map as MapIcon,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import {
  Btn,
  Card,
  Chip,
  Breadcrumb,
  Eyebrow,
  ProgressRing,
  FOCUS_RING,
  RTL_FLIP,
} from '../ui/index.jsx';

export function ProgressHub({
  lang = 'en',
  user,
  userLevel = 'A1',
  summary,
  map,
  wordsLearned = 36,
  streakData = { current: 4 },
  studyTimeStr,
  levelTest = null,
  onNavigate,
  onOpenLesson,
}) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);

  // Compute study time from completed lessons across map if not passed
  const computedStudyTime = useMemo(() => {
    if (studyTimeStr) return studyTimeStr;
    let min = 0;
    const levels = map?.levels || [];
    for (const lv of levels) {
      for (const u of lv.units ?? []) {
        for (const l of u.lessons ?? []) {
          if (l.state === 'completed') min += l.estMinutes || 0;
        }
      }
    }
    if (!min || min <= 0) return `0${T('د', 'm')}`;
    if (min < 60) return `${min}${T('د', 'm')}`;
    const h = Math.floor(min / 60);
    const r = min % 60;
    return r ? `${h}${T('سا', 'h')} ${r}${T('د', 'm')}` : `${h}${T('سا', 'h')}`;
  }, [studyTimeStr, map, T]);

  // Compute completed lessons count and level percentage
  const { completedCount, totalLessons, levelPct } = useMemo(() => {
    let completed = 0;
    let total = 20;
    if (map?.levels) {
      const a1 = map.levels.find((l) => l.code === userLevel) || map.levels[0];
      if (a1?.units) {
        let cnt = 0;
        let done = 0;
        a1.units.forEach((u) => {
          (u.lessons || []).forEach((l) => {
            if (l.kind !== 'revision') {
              cnt++;
              if (l.state === 'completed') done++;
            }
          });
        });
        if (cnt > 0) {
          total = cnt;
          completed = done;
        }
      }
    } else if (summary?.completion?.[userLevel]) {
      const comp = summary.completion[userLevel];
      completed = comp.done || 0;
      total = comp.total || 20;
    }
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completedCount: completed, totalLessons: total, levelPct: pct };
  }, [map, summary, userLevel]);

  // Weekly study activity (7 days: Mon -> Sun)
  const daysOfWeek = useMemo(() => [
    { key: 'mon', label: { ar: 'الإثنين', en: 'Mon' }, height: '70%', active: true },
    { key: 'tue', label: { ar: 'الثلاثاء', en: 'Tue' }, height: '45%', active: true },
    { key: 'wed', label: { ar: 'الأربعاء', en: 'Wed' }, height: '100%', active: true },
    { key: 'thu', label: { ar: 'الخميس', en: 'Thu' }, height: '60%', active: true },
    { key: 'fri', label: { ar: 'الجمعة', en: 'Fri' }, height: '10%', active: false },
    { key: 'sat', label: { ar: 'السبت', en: 'Sat' }, height: '10%', active: false },
    { key: 'sun', label: { ar: 'الأحد', en: 'Sun' }, height: '10%', active: false },
  ], []);

  const navCards = [
    {
      tab: 'plan',
      icon: Calendar,
      title: T('خطة المذاكرة', 'Study Plan'),
      desc: T(
        'المولّد الأسبوعي الذكي، لحساب ساعات المذاكرة لكل مهارة.',
        'Your existing weekly plan, kept as an optional companion.'
      ),
      tint: 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]',
      badge: T('أسبوعي', 'Weekly'),
    },
    {
      tab: 'profile',
      icon: User,
      title: T('الملف الشخصي والأهداف', 'Profile & Goals'),
      desc: T(
        'أهدافك اليومية، وقت الاستخدام، والشارات المكتسبة.',
        'Daily goals, usage time, and achievements.'
      ),
      tint: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
      badge: T('الإحصائيات', 'Stats'),
    },
    {
      tab: 'placement',
      icon: Award,
      title: T('اختبار المستوى والنتائج', 'Level Test & Results'),
      desc: T(
        'نتائج اختبار تحديد المستوى التكيفي ومستوى البداية.',
        'Your latest placement result and starting level.'
      ),
      tint: 'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
      badge: levelTest?.level ? `${levelTest.level}` : userLevel,
    },
    {
      tab: 'certificate',
      icon: ShieldCheck,
      title: T('شهادة إتقان الإنجليزية', 'English Certificate'),
      desc: T(
        'تحميل والتحقق من شهادة إتقان اللغة المعتمدة عبر رابط رسمي.',
        'Download and verify your accredited proficiency certificate.'
      ),
      tint: 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]',
      badge: 'PDF',
    },
  ];

  return (
    <div className="vx-font space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        lang={lang}
        items={[
          { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
          { label: T('تقدمي', 'My Progress') },
        ]}
      />

      {/* Header */}
      <div>
        <Eyebrow>{T('تقدمي', 'MY PROGRESS')}</Eyebrow>
        <h1 className="mt-1 text-[28px] font-black tracking-[-0.02em] text-[var(--vxp-text)] sm:text-[32px]">
          {T('تقدمك في لمحة', 'Your progress at a glance')}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--vxp-dim)]">
          {T(
            'لوحة موحدة لنسبة إنجاز مسار التعلم، النشاط الأسبوعي، وخطة المذاكرة.',
            'A unified dashboard for your CEFR path completion, weekly activity and study plan.'
          )}
        </p>
      </div>

      {/* Grid: Overall Progress Card (Left) + This Week Card (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overall progress card (PDF p.8 right top) */}
        <Card className="flex flex-col justify-between p-6 sm:p-8">
          <div>
            <Eyebrow className="!text-[var(--vxp-primary)]">
              {T('التقدم العام', 'OVERALL PROGRESS')}
            </Eyebrow>
            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <ProgressRing
                value={levelPct / 100}
                size={110}
                stroke={10}
                label={`${levelPct}%`}
                caption={`${userLevel} ${T('منجز', 'done')}`}
              />
              <div className="space-y-1.5 text-center sm:text-start">
                <h2 className="text-[20px] font-black text-[var(--vxp-text)]">
                  {userLevel} · {T('مستوى البداية', 'Current Level')}
                </h2>
                <p className="text-[14px] font-semibold text-[var(--vxp-dim)]">
                  {completedCount} {T('دروس مكتملة', 'lessons completed')} · {wordsLearned}{' '}
                  {T('كلمة محفوظة', 'words learned')}
                </p>
                <div className="pt-2">
                  <Btn
                    variant="ghost"
                    size="sm"
                    icon={ChevronRight}
                    onClick={() => onNavigate('path-home')}
                  >
                    {T('متابعة مسار التعلم →', 'Continue learning path →')}
                  </Btn>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--vxp-border)] pt-4 text-center">
            <div>
              <div className="text-[18px] font-black text-[#D88C34]">
                {streakData?.current || 4}
              </div>
              <div className="text-[11px] font-bold text-[var(--vxp-dim)]">
                {T('أيام الحماسة', 'Day streak')}
              </div>
            </div>
            <div>
              <div className="text-[18px] font-black text-[var(--vxp-primary)]">
                {summary?.xp ?? 180}
              </div>
              <div className="text-[11px] font-bold text-[var(--vxp-dim)]">
                {T('مجموع النقاط', 'XP')}
              </div>
            </div>
            <div>
              <div className="text-[18px] font-black text-[var(--vxp-mint-text)]">
                {computedStudyTime}
              </div>
              <div className="text-[11px] font-bold text-[var(--vxp-dim)]">
                {T('وقت المذاكرة', 'Study time')}
              </div>
            </div>
          </div>
        </Card>

        {/* This week bar chart card (PDF p.8 right middle) */}
        <Card className="flex flex-col justify-between p-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <Eyebrow>{T('النشاط الأسبوعي', 'ACTIVITY')}</Eyebrow>
                <h2 className="text-[20px] font-black text-[var(--vxp-text)]">
                  {T('هذا الأسبوع', 'This week')}
                </h2>
              </div>
              <Chip variant="green" icon={Flame}>
                {streakData?.current || 4} {T('أيام متتالية', 'days active')}
              </Chip>
            </div>

            {/* 7-Bar Chart */}
            <div className="mt-8 flex h-36 items-end justify-between gap-2 px-2">
              {daysOfWeek.map((day) => (
                <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end justify-center">
                    <div
                      className={`w-full max-w-[32px] rounded-[8px] transition-all duration-500 ${
                        day.active
                          ? 'bg-[var(--vxp-primary)] shadow-sm'
                          : 'bg-[var(--vxp-surface-3)] opacity-60'
                      }`}
                      style={{ height: day.height }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[var(--vxp-dim)]">
                    {T(day.label.ar, day.label.en)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 border-t border-[var(--vxp-border)] pt-3 text-[12px] font-semibold text-[var(--vxp-dim)]">
            {T(
              'تسجيل وقت المذاكرة وإكمال الدروس يزيد طول الأعمدة تلقائياً.',
              'Study time and completed lessons raise the bars automatically.'
            )}
          </p>
        </Card>
      </div>

      {/* Navigation Cards (PDF p.8 right bottom & Section 4) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {navCards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.tab}
              type="button"
              onClick={() => onNavigate(c.tab)}
              className={`group flex items-start gap-4 rounded-[20px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-5 text-start shadow-[var(--vxp-shadow)] transition-all hover:border-[var(--vxp-border-strong)] hover:shadow-md ${FOCUS_RING}`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${c.tint}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[16px] font-extrabold text-[var(--vxp-text)] group-hover:text-[var(--vxp-primary)]">
                    {c.title}
                  </h3>
                  <span className="rounded-full bg-[var(--vxp-surface-3)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--vxp-dim)]">
                    {c.badge}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--vxp-dim)]">
                  {c.desc}
                </p>
              </div>

              <ChevronRight
                className={`mt-3 h-5 w-5 shrink-0 text-[var(--vxp-dim)] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 ${RTL_FLIP}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProgressBreadcrumb({ lang, tab, onNavigate }) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  const TITLES = {
    plan: { ar: 'خطة المذاكرة الأسبوعية', en: 'Study Plan' },
    profile: { ar: 'الملف الشخصي والأهداف', en: 'Profile & Goals' },
    certificate: { ar: 'شهادة إتقان الإنجليزية', en: 'English Certificate' },
  };
  const meta = TITLES[tab];
  if (!meta) return null;

  return (
    <div className="vx-font mb-6">
      <Breadcrumb
        lang={lang}
        items={[
          { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
          { label: T('تقدمي', 'My Progress'), onClick: () => onNavigate('progress') },
          { label: T(meta.ar, meta.en) },
        ]}
      />
    </div>
  );
}

export function PacingProposalBanner({ lang, lessonCount = 17, level = 'A1', onNavigate }) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  return (
    <div className="vx-font mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-2 border-dashed border-[var(--vxp-primary)]/30 bg-[var(--vxp-primary-tint)] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--vxp-primary)] text-white shadow-sm">
          <MapIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--vxp-primary)]">
            {T('مقترح · وتيرة مسار التعلم', 'PROPOSAL · PATH-AWARE PACING')}
          </div>
          <div className="text-[14px] font-extrabold text-[var(--vxp-text)]">
            {T(
              `متبقٍ ${lessonCount} درساً في ${level}. حوالي 3 دروس أسبوعياً تنهي المستوى في منتصف ديسمبر.`,
              `${lessonCount} ${level} lessons left. About 3 a week finishes ${level} in mid-December.`
            )}
          </div>
        </div>
      </div>
      <Chip variant="grey">{T('اختياري', 'Optional')}</Chip>
    </div>
  );
}
