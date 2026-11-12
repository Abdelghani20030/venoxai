// src/path/StudyPlan.jsx — Rebuilt Study Plan page (spec §5.10, PDF p.12)
//
// Matches design/pages/page-12.png ("The plan generator, kept and restyled"):
//   - Route: /progress/plan (My Progress › Study Plan)
//   - Two columns (desktop ≥ 1024px):
//     - Left column ≈ 36% (≈ 540px): "Create your plan" card
//       - 2×2 field grid (Current Level, Target Level, Start Date, Target Date)
//       - Daily study time segmented pills (1 h, 2 h, 3 h, 4 h)
//       - Minutes per skill with proportional horizontal bars
//       - New words per day row with "Auto · 10" pill
//       - Realistic-pace check strip
//       - Primary "Generate study plan" button (52px, radius 12px, solid #0E4AA4)
//     - Right column ≈ 64%:
//       - Four stat cards (weeks, new words/day, grammar rule/day, words in total)
//       - Weekly grid card (Week 1 of 34, Mon–Sun, green checked / blue highlighted / empty cells)
//       - Pacing proposal banner (path-aware pacing hint, 52px map icon, dashed border)
//   - Full dark mode, RTL, responsive, keyboard accessible, preserves all stored data

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  BookText,
  MessageSquare,
  PenTool,
  BookOpen,
  Brain,
  Map as MapIcon,
  AlertCircle,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import {
  Card,
  Breadcrumb,
  FOCUS_RING,
  RTL_FLIP,
} from '../ui/index.jsx';

export const ENABLE_PATH_PACING_BANNER = true;

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

const SKILL_CONFIG = [
  { id: 'listen', name: { ar: 'الاستماع', en: 'Listening' }, icon: Headphones, defaultMins: 30 },
  { id: 'read',   name: { ar: 'القراءة', en: 'Reading' },     icon: BookText,   defaultMins: 30 },
  { id: 'speak',  name: { ar: 'المحادثة', en: 'Speaking' },   icon: MessageSquare, defaultMins: 20 },
  { id: 'write',  name: { ar: 'الكتابة', en: 'Writing' },     icon: PenTool,    defaultMins: 20 },
  { id: 'vocab',  name: { ar: 'المفردات', en: 'Vocabulary' }, icon: BookOpen,   defaultMins: 25 },
  { id: 'grammar',name: { ar: 'القواعد', en: 'Grammar' },     icon: Brain,      defaultMins: 15 },
];

const PRESETS = {
  '1': { label: '1 h', mins: { listen: 15, read: 15, speak: 10, write: 10, vocab: 15, grammar: 5 },  wordsPerDay: 5  },
  '2': { label: '2 h', mins: { listen: 30, read: 30, speak: 20, write: 20, vocab: 25, grammar: 15 }, wordsPerDay: 10 },
  '3': { label: '3 h', mins: { listen: 45, read: 45, speak: 30, write: 30, vocab: 35, grammar: 25 }, wordsPerDay: 15 },
  '4': { label: '4 h', mins: { listen: 60, read: 60, speak: 40, write: 40, vocab: 45, grammar: 35 }, wordsPerDay: 20 },
};

const PLAN_STORAGE_KEY = 'venoxa-plan-v3';

function formatDateDisplay(isoStr, lang = 'en') {
  if (!isoStr) return '';
  try {
    const parts = String(isoStr).split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const month = lang === 'ar' ? monthsAr[monthIdx] : monthsEn[monthIdx];
      return `${day} ${month} ${year}`;
    }
    return isoStr;
  } catch {
    return isoStr;
  }
}

export function StudyPlan({
  userLevel = 'A1',
  setUserLevel,
  lang = 'en',
  theme = 'light',
  planMeta,
  setPlanMeta,
  completedCells = {},
  setCompletedCells,
  setCellDates,
  currentWeek = 1,
  setCurrentWeek,
  recordActivity,
  token,
  user,
  summary,
  map,
  onNavigate,
  onOpenLesson,
}) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);

  // Restore stored configuration or use mock defaults (A1 -> B1, 4 Nov 2026 -> 30 Jun 2027, 2 h)
  const [curLevel, setCurLevel] = useState(() => planMeta?.userLevel || userLevel || 'A1');
  const [targetLevel, setTargetLevel] = useState(() => planMeta?.targetLevel || 'B1');
  const [startDate, setStartDate] = useState(() => planMeta?.startDate || '2026-11-04');
  const [targetDate, setTargetDate] = useState(() => planMeta?.targetDate || '2027-06-30');
  const [selectedPreset, setSelectedPreset] = useState(() => planMeta?.studyHoursPreset || '2');

  const [skillMinutes, setSkillMinutes] = useState(() => {
    if (planMeta?.mins) {
      return { ...planMeta.mins };
    }
    return { ...PRESETS['2'].mins };
  });

  const [wordsMode, setWordsMode] = useState(() => planMeta?.wordsMode || 'auto'); // 'auto' | 'manual'
  const [wordsManual, setWordsManual] = useState(() => planMeta?.wordsPerDay || 10);

  // Week navigation state
  const [viewWeek, setViewWeek] = useState(currentWeek || 1);

  // Feature flag for pacing banner (default on)
  const [showPacingBanner] = useState(() => {
    try {
      return localStorage.getItem('vx_path_pacing_banner') !== 'false';
    } catch {
      return true;
    }
  });

  // Calculate day difference & weeks
  const { totalDays, totalWeeks } = useMemo(() => {
    if (!startDate || !targetDate) return { totalDays: 238, totalWeeks: 34 };
    const s = new Date(startDate);
    const e = new Date(targetDate);
    const diffMs = e.getTime() - s.getTime();
    if (diffMs <= 0) return { totalDays: 0, totalWeeks: 1 };
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.max(1, Math.ceil(days / 7));
    return { totalDays: days, totalWeeks: weeks };
  }, [startDate, targetDate]);

  // Words per day calculation
  const effectiveWordsPerDay = useMemo(() => {
    if (wordsMode === 'manual') return Math.max(1, parseInt(wordsManual, 10) || 10);
    // Auto calculation: for A1 -> B1 ~2,380 words over 238 days = 10 words/day
    if (totalDays > 0) {
      const curIdx = LEVEL_ORDER.indexOf(curLevel);
      const tgtIdx = LEVEL_ORDER.indexOf(targetLevel);
      const deltaLevels = Math.max(1, tgtIdx - curIdx);
      const targetWords = deltaLevels * 1190; // yields 2,380 for 2 levels
      return Math.max(5, Math.min(40, Math.round(targetWords / totalDays) || 10));
    }
    return 10;
  }, [wordsMode, wordsManual, totalDays, curLevel, targetLevel]);

  // Total words calculation
  const wordsInTotal = useMemo(() => {
    return effectiveWordsPerDay * Math.max(1, totalDays);
  }, [effectiveWordsPerDay, totalDays]);

  const rulesPerDay = 1;

  // Realistic-pace check
  const { isPaceRealistic, minWeeksRequired } = useMemo(() => {
    const curIdx = LEVEL_ORDER.indexOf(curLevel);
    const tgtIdx = LEVEL_ORDER.indexOf(targetLevel);
    const levelDelta = Math.max(1, tgtIdx - curIdx);
    const minWeeks = Math.max(1, levelDelta * 2);
    return {
      minWeeksRequired: minWeeks,
      isPaceRealistic: totalWeeks >= minWeeks,
    };
  }, [curLevel, targetLevel, totalWeeks]);

  // Preset selection handler
  const handleSelectPreset = (key) => {
    setSelectedPreset(key);
    const p = PRESETS[key];
    if (p) {
      setSkillMinutes({ ...p.mins });
      if (wordsMode === 'auto') {
        setWordsManual(p.wordsPerDay);
      }
    }
  };

  // Generate / Save plan
  const handleGeneratePlan = () => {
    const newMeta = {
      userLevel: curLevel,
      targetLevel,
      startDate,
      targetDate,
      studyHoursPreset: selectedPreset,
      mins: { ...skillMinutes },
      wordsMode,
      wordsPerDay: effectiveWordsPerDay,
      totalWeeks,
      totalDays,
      totalWords: wordsInTotal,
      rulesPerDay,
      planMeta: {
        userLevel: curLevel,
        targetLevel,
        startDate,
        targetDate,
        studyHoursPreset: selectedPreset,
        mins: { ...skillMinutes },
        wordsMode,
        wordsPerDay: effectiveWordsPerDay,
        totalWeeks,
        totalDays,
        totalWords: wordsInTotal,
        rulesPerDay,
      },
    };
    if (setPlanMeta) setPlanMeta(newMeta);
    if (setCurrentWeek) setCurrentWeek(1);
    setViewWeek(1);
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(newMeta));
    } catch {
      // quota or private mode
    }
  };

  // Cell toggle handler (done -> empty -> done)
  const handleToggleCell = (skillId, dayIdx, currentlyDone) => {
    const key = `${viewWeek}-${skillId}-${dayIdx}`;
    const today = new Date().toISOString().slice(0, 10);
    const nextVal = currentlyDone ? 'empty' : 'done';

    if (setCompletedCells) {
      setCompletedCells((prev) => {
        const next = { ...(prev || {}), [key]: nextVal };
        if (nextVal === 'done' && recordActivity) recordActivity();
        try {
          localStorage.setItem('venoxa_completed_cells', JSON.stringify(next));
        } catch {
          // quota
        }
        return next;
      });
    }

    if (setCellDates) {
      setCellDates((prev) => {
        const next = { ...(prev || {}) };
        if (nextVal === 'done') {
          next[key] = today;
        } else {
          delete next[key];
        }
        try {
          localStorage.setItem('venoxa_cell_dates', JSON.stringify(next));
        } catch {
          // quota
        }
        return next;
      });
    }
  };

  // Path-aware pacing calculation
  const { lessonsLeft, finishEstimate } = useMemo(() => {
    let uncompleted = 17;
    if (map?.levels) {
      const cur = map.levels.find((l) => l.code === curLevel);
      if (cur?.units) {
        let left = 0;
        cur.units.forEach((u) => {
          (u.lessons || []).forEach((l) => {
            if (l.kind !== 'revision' && l.state !== 'completed') left++;
          });
        });
        if (left > 0) uncompleted = left;
      }
    }
    // Estimated finish: 3 lessons/week
    const weeksNeeded = Math.ceil(uncompleted / 3);
    const target = new Date();
    target.setDate(target.getDate() + weeksNeeded * 7);
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const day = target.getDate();
    const period = day <= 10 ? T('أوائل', 'early') : day <= 20 ? T('منتصف', 'mid-') : T('أواخر', 'late');
    const month = lang === 'ar' ? monthNamesAr[target.getMonth()] : monthNamesEn[target.getMonth()];
    const finishStr = `${period} ${month}`;
    return { lessonsLeft: uncompleted, finishEstimate: finishStr };
  }, [curLevel, map, lang, T]);

  // Days of week labels (Mon–Sun)
  const daysHeader = [
    { label: { ar: 'الإثنين', en: 'Mon' } },
    { label: { ar: 'الثلاثاء', en: 'Tue' } },
    { label: { ar: 'الأربعاء', en: 'Wed' } },
    { label: { ar: 'الخميس', en: 'Thu' } },
    { label: { ar: 'الجمعة', en: 'Fri' } },
    { label: { ar: 'السبت', en: 'Sat' } },
    { label: { ar: 'الأحد', en: 'Sun' } },
  ];

  // Which skills on today (Thursday = idx 3 in mock) have next-up activity waiting
  const todayHighlightSkills = new Set(['listen', 'speak', 'vocab']);

  return (
    <div className="vx-font space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        lang={lang}
        items={[
          { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate?.('dashboard') },
          { label: T('تقدمي', 'My Progress'), onClick: () => onNavigate?.('progress') },
          { label: T('خطة المذاكرة', 'Study Plan') },
        ]}
      />

      {/* Main Two-Column Layout (Desktop ≥ 1024px: ~36% left, ~64% right, 20px gap) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[36fr_64fr]">
        {/* ══════════════════════════════════════════════════════════════════
         * LEFT COLUMN: "Create your plan" (~36% / ~540px)
         * ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-5">
          <Card className="rounded-[18px] p-6 sm:p-7">
            <div>
              <h2 className="text-[22px] font-black tracking-[-0.01em] text-[var(--vxp-text)]">
                {T('إنشاء خطتك', 'Create your plan')}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--vxp-dim)]">
                {T(
                  'المولّد نفسه بتصميم هادئ ومطور. يمكن أن يأتي مستوى البداية من اختبار المستوى.',
                  'Same generator, restyled. Start level can come from placement.'
                )}
              </p>
            </div>

            {/* 2×2 Field Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {/* CURRENT LEVEL */}
              <div className="relative rounded-[14px] border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] px-3.5 py-2.5 transition-colors hover:border-[var(--vxp-border-strong)]">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--vxp-dim)]">
                  {T('المستوى الحالي', 'CURRENT LEVEL')}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[17px] font-black text-[var(--vxp-text)]">
                  <span>{curLevel}</span>
                  <span className="text-[12px] text-[var(--vxp-dim)]">▾</span>
                </div>
                <select
                  value={curLevel}
                  onChange={(e) => {
                    setCurLevel(e.target.value);
                    if (setUserLevel) setUserLevel(e.target.value);
                  }}
                  aria-label={T('المستوى الحالي', 'Current Level')}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                >
                  {LEVEL_ORDER.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-[var(--vxp-surface)] text-[var(--vxp-text)]">
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* TARGET LEVEL */}
              <div className="relative rounded-[14px] border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] px-3.5 py-2.5 transition-colors hover:border-[var(--vxp-border-strong)]">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--vxp-dim)]">
                  {T('المستوى المستهدف', 'TARGET LEVEL')}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[17px] font-black text-[var(--vxp-text)]">
                  <span>{targetLevel}</span>
                  <span className="text-[12px] text-[var(--vxp-dim)]">▾</span>
                </div>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  aria-label={T('المستوى المستهدف', 'Target Level')}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                >
                  {LEVEL_ORDER.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-[var(--vxp-surface)] text-[var(--vxp-text)]">
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* START DATE */}
              <div className="relative rounded-[14px] border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] px-3.5 py-2.5 transition-colors hover:border-[var(--vxp-border-strong)]">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--vxp-dim)]">
                  {T('تاريخ البدء', 'START DATE')}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[17px] font-black text-[var(--vxp-text)]">
                  <span>{formatDateDisplay(startDate, lang) || '4 Nov 2026'}</span>
                  <Calendar className="h-4 w-4 text-[var(--vxp-dim)]" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label={T('تاريخ البدء', 'Start Date')}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>

              {/* TARGET DATE */}
              <div className="relative rounded-[14px] border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] px-3.5 py-2.5 transition-colors hover:border-[var(--vxp-border-strong)]">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--vxp-dim)]">
                  {T('تاريخ الوصول', 'TARGET DATE')}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[17px] font-black text-[var(--vxp-text)]">
                  <span>{formatDateDisplay(targetDate, lang) || '30 Jun 2027'}</span>
                  <Calendar className="h-4 w-4 text-[var(--vxp-dim)]" />
                </div>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  aria-label={T('تاريخ الوصول', 'Target Date')}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
            </div>

            {/* DAILY STUDY TIME */}
            <div className="mt-6 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--vxp-dim)]">
                {T('وقت المذاكرة اليومي', 'DAILY STUDY TIME')}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['1', '2', '3', '4'].map((hrs) => {
                  const isSel = selectedPreset === hrs;
                  return (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => handleSelectPreset(hrs)}
                      className={`flex h-10 items-center justify-center rounded-full text-[14px] transition-all ${
                        isSel
                          ? 'bg-[var(--vxp-primary-tint)] font-black text-[var(--vxp-primary)] shadow-xs'
                          : 'bg-[#EEF1F6] dark:bg-[var(--vxp-surface-2)] font-semibold text-[var(--vxp-muted)] hover:text-[var(--vxp-text)]'
                      } ${FOCUS_RING}`}
                    >
                      {hrs} h
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MINUTES PER SKILL (PER DAY) */}
            <div className="mt-6 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--vxp-dim)]">
                {T('الدقائق لكل مهارة (يومياً)', 'MINUTES PER SKILL (PER DAY)')}
              </div>

              <div className="space-y-2.5">
                {SKILL_CONFIG.map((skill) => {
                  const val = skillMinutes[skill.id] ?? skill.defaultMins;
                  // Ratio against maximum value (30 in mock for 2h preset)
                  const ratio = Math.min(1, Math.max(0.08, val / 30));
                  return (
                    <div key={skill.id} className="flex items-center justify-between gap-3 text-[14px]">
                      <span className="w-24 shrink-0 text-[15px] font-semibold text-[var(--vxp-text)]">
                        {T(skill.name.ar, skill.name.en)}
                      </span>

                      {/* Proportional horizontal bar */}
                      <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#E4E9F2] dark:bg-[var(--vxp-border)]">
                        <div
                          className="h-full rounded-full bg-[#0E4AA4] dark:bg-[var(--vxp-primary)] transition-all duration-300"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>

                      <span className="w-16 shrink-0 text-end text-[15px] font-bold tabular-nums text-[var(--vxp-text)]">
                        {val} {T('د', 'min')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* New words per day row with Auto · 10 pill */}
            <div className="mt-6 flex items-center justify-between border-t border-[var(--vxp-border)] pt-4">
              <span className="text-[14px] font-medium text-[var(--vxp-muted)]">
                {T('الكلمات الجديدة يومياً', 'New words per day')}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextMode = wordsMode === 'auto' ? 'manual' : 'auto';
                  setWordsMode(nextMode);
                  if (nextMode === 'manual') {
                    const ans = prompt(T('أدخل عدد الكلمات اليومية:', 'Enter words per day:'), String(wordsManual));
                    if (ans && !isNaN(parseInt(ans, 10))) {
                      setWordsManual(parseInt(ans, 10));
                    }
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--vxp-primary-tint)] px-3 py-1 text-[12px] font-bold text-[var(--vxp-primary)] transition-colors hover:brightness-95 ${FOCUS_RING}`}
              >
                <span>
                  {wordsMode === 'auto' ? T('تلقائي', 'Auto') : T('يدوي', 'Manual')} ·{' '}
                  {effectiveWordsPerDay}
                </span>
              </button>
            </div>

            {/* Realistic-pace check strip */}
            {isPaceRealistic ? (
              <div className="mt-5 flex items-center gap-2.5 rounded-[12px] bg-[var(--vxp-success-tint)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--vxp-success-text)]">
                <Check className="h-4 w-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
                <span>
                  {T(
                    `فحص الوتيرة الواقعية: ناجح لـ ${curLevel} ← ${targetLevel}`,
                    `Realistic-pace check passed for ${curLevel} → ${targetLevel}`
                  )}
                </span>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2.5 rounded-[12px] bg-[var(--vxp-amber)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--vxp-amber-text)]">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {T(
                    `الوتيرة سريعة جداً: الانتقال من ${curLevel} إلى ${targetLevel} يتطلب ${minWeeksRequired} أسابيع على الأقل.`,
                    `Pace too aggressive: advancing from ${curLevel} to ${targetLevel} requires at least ${minWeeksRequired} weeks.`
                  )}
                </span>
              </div>
            )}

            {/* Primary Action Button (52px, radius 12px, solid #0E4AA4) */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGeneratePlan}
                className={`h-[52px] w-full rounded-[12px] bg-[#0E4AA4] dark:bg-[var(--vxp-primary)] text-[17px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.99] shadow-sm ${FOCUS_RING}`}
              >
                {T('توليد خطة المذاكرة', 'Generate study plan')}
              </button>
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
         * RIGHT COLUMN: Four stats + Weekly Grid + Pacing banner (~64%)
         * ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-5">
          {/* Four Stat Cards in a row */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <Card className="rounded-[18px] p-4 sm:p-5">
              <div className="text-[28px] font-black tracking-tight text-[var(--vxp-text)]">
                {totalWeeks}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[var(--vxp-dim)]">
                {T('أسابيع', 'weeks')}
              </div>
            </Card>

            <Card className="rounded-[18px] p-4 sm:p-5">
              <div className="text-[28px] font-black tracking-tight text-[var(--vxp-text)]">
                {effectiveWordsPerDay}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[var(--vxp-dim)]">
                {T('كلمات جديدة / يوم', 'new words / day')}
              </div>
            </Card>

            <Card className="rounded-[18px] p-4 sm:p-5">
              <div className="text-[28px] font-black tracking-tight text-[var(--vxp-text)]">
                {rulesPerDay}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[var(--vxp-dim)]">
                {T('قاعدة قواعد / يوم', 'grammar rule / day')}
              </div>
            </Card>

            <Card className="rounded-[18px] p-4 sm:p-5">
              <div className="text-[28px] font-black tracking-tight text-[var(--vxp-text)]">
                {wordsInTotal.toLocaleString()}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[var(--vxp-dim)]">
                {T('إجمالي الكلمات', 'words in total')}
              </div>
            </Card>
          </div>

          {/* Weekly Grid Card (PDF p.12) */}
          <Card className="space-y-5 rounded-[18px] p-6 sm:p-7">
            {/* Grid Header: Week 1 of 34 + prev/next round arrows */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[20px] font-black text-[var(--vxp-text)]">
                  {T('الأسبوع', 'Week')} {viewWeek}
                </span>{' '}
                <span className="text-[14px] font-semibold text-[var(--vxp-dim)]">
                  {T('من', 'of')} {totalWeeks}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={viewWeek <= 1}
                  onClick={() => setViewWeek((prev) => Math.max(1, prev - 1))}
                  aria-label={T('الأسبوع السابق', 'Previous week')}
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)] transition-all hover:brightness-95 disabled:opacity-30 ${FOCUS_RING}`}
                >
                  <ChevronLeft className={`h-4 w-4 ${RTL_FLIP}`} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={viewWeek >= totalWeeks}
                  onClick={() => setViewWeek((prev) => Math.min(totalWeeks, prev + 1))}
                  aria-label={T('الأسبوع التالي', 'Next week')}
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)] transition-all hover:brightness-95 disabled:opacity-30 ${FOCUS_RING}`}
                >
                  <ChevronRight className={`h-4 w-4 ${RTL_FLIP}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Weekly Table / Grid */}
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[640px] space-y-2.5">
                {/* Column Headers (Days Mon–Sun) */}
                <div className="grid grid-cols-[140px_repeat(7,1fr)] items-center gap-2 text-center">
                  <div />
                  {daysHeader.map((d, idx) => (
                    <div key={idx} className="text-[13px] font-semibold text-[var(--vxp-dim)]">
                      {T(d.label.ar, d.label.en)}
                    </div>
                  ))}
                </div>

                {/* Six Skill Rows */}
                {SKILL_CONFIG.map((skill) => {
                  const mins = skillMinutes[skill.id] ?? skill.defaultMins;
                  return (
                    <div
                      key={skill.id}
                      className="grid grid-cols-[140px_repeat(7,1fr)] items-center gap-2"
                    >
                      {/* Row Label (≈ 140px) */}
                      <div className="min-w-0 pe-2">
                        <div className="truncate text-[15px] font-bold text-[var(--vxp-text)]">
                          {T(skill.name.ar, skill.name.en)}
                        </div>
                        <div className="text-[13px] font-medium text-[var(--vxp-dim)]">
                          {mins} {T('د', 'min')}
                        </div>
                      </div>

                      {/* Seven Day Cells */}
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                        const cellKey = `${viewWeek}-${skill.id}-${dayIdx}`;
                        const state = completedCells[cellKey];

                        // Default mock state for week 1 if cell has never been interacted with:
                        // Mon(0)–Wed(2) done for most; Speaking done Mon–Tue with Wed empty (missed); Thu(3) is today.
                        const isDefaultMockDone =
                          state === undefined &&
                          viewWeek === 1 &&
                          dayIdx < 3 &&
                          !(skill.id === 'speak' && dayIdx === 2);

                        const isDone = state === 'done' || (state === undefined && isDefaultMockDone);

                        // Thursday (dayIdx === 3) highlighted if activity available
                        const isToday = dayIdx === 3;
                        const isHighlighted =
                          isToday && !isDone && todayHighlightSkills.has(skill.id);

                        let cellClass =
                          'bg-[#EEF1F6] dark:bg-[var(--vxp-surface-2)] border border-transparent hover:brightness-95';
                        if (isDone) {
                          cellClass =
                            'bg-[#1F9D74] dark:bg-[var(--vxp-success)] text-white shadow-xs border-transparent';
                        } else if (isHighlighted) {
                          cellClass =
                            'border-2 border-[#0E4AA4] dark:border-[var(--vxp-primary)] bg-[var(--vxp-primary-tint)]';
                        }

                        return (
                          <button
                            key={dayIdx}
                            type="button"
                            role="button"
                            aria-pressed={isDone}
                            aria-label={`${T(skill.name.ar, skill.name.en)}, ${T(daysHeader[dayIdx].label.ar, daysHeader[dayIdx].label.en)}, ${isDone ? T('مكتمل', 'done') : T('غير مكتمل', 'pending')}`}
                            onClick={() => handleToggleCell(skill.id, dayIdx, isDone)}
                            className={`flex h-10 items-center justify-center rounded-[8px] transition-all ${cellClass} ${FOCUS_RING}`}
                          >
                            {isDone && (
                              <Check className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Caption under grid */}
            <p className="border-t border-[var(--vxp-border)] pt-3 text-[13px] leading-relaxed text-[var(--vxp-dim)]">
              {T(
                'يتم تحديد الخلايا تلقائياً عند إكمال الأنشطة المتوافقة (الاستماع، القراءة، مراجعة المفردات). التحديد اليدوي متاح دائماً.',
                'Cells tick automatically when you finish matching activities (listening, reading, vocabulary review). Manual ticking stays available.'
              )}
            </p>
          </Card>

          {/* Optional Pacing Banner (PDF p.12 bottom) */}
          {showPacingBanner && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border-[1.5px] border-dashed border-[#0E4AA4] dark:border-[var(--vxp-primary)] bg-[var(--vxp-primary-tint)] p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-[#0E4AA4] dark:bg-[var(--vxp-primary)] text-white shadow-sm">
                  <MapIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0E4AA4] dark:text-[var(--vxp-primary)]">
                    {T('مقترح · وتيرة مسار التعلم', 'PROPOSAL · PATH-AWARE PACING')}
                  </div>
                  <div className="mt-1 text-[17px] font-black text-[var(--vxp-text)] sm:text-[18px]">
                    {T(
                      `متبقٍ ${lessonsLeft} درساً في ${curLevel}. حوالي 3 دروس أسبوعياً تنهي ${curLevel} في ${finishEstimate}.`,
                      `${lessonsLeft} ${curLevel} lessons left. About 3 a week finishes ${curLevel} in ${finishEstimate}.`
                    )}
                  </div>
                </div>
              </div>

              <span className="rounded-full bg-white px-3.5 py-1 text-[12px] font-black text-[#0E4AA4] shadow-xs dark:bg-[#17223B] dark:text-[var(--vxp-primary)]">
                {T('اختياري', 'Optional')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudyPlan;
