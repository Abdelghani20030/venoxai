// src/path/PlacementFlow.jsx — Phase 6: Placement Flow (spec §5.5, PDF p.7)
//
// Three screens:
//   1. Welcome: "Where would you like to start?"
//      - Option "Start from A1" (Recommended for beginners)
//      - Option "Take the placement test" (Adaptive assessment)
//   2. Adaptive question (PDF p.7 middle):
//      - Progress bar + "Q N"
//      - Eyebrow: "READING · ADAPTIVE" / "GRAMMAR · ADAPTIVE"
//      - Key phrase underlined
//      - 4 options as full-width bordered buttons
//      - Footnote: "Correct answers are never sent to your browser."
//   3. Result (PDF p.7 right):
//      - Eyebrow: "YOUR RESULT"
//      - Big blue square: "B1"
//      - "Intermediate"
//      - "You'll start at B1 · Lesson 1. Earlier levels stay open for revision."
//      - Level list rows: Open for revision, Starting level, Locked
//      - Primary button: "Start B1 path →" (calls POST /api/path/placement)

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  Play,
  Lock,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import {
  Btn,
  Card,
  Chip,
  Breadcrumb,
  Eyebrow,
  ProgressBar,
  FOCUS_RING,
  RTL_FLIP,
} from '../ui/index.jsx';
import LevelTest from '../LevelTest.jsx';

const CEFR_LEVELS = [
  { code: 'A1', title: { ar: 'مبتدئ', en: 'Beginner' } },
  { code: 'A2', title: { ar: 'ابتدائي', en: 'Elementary' } },
  { code: 'B1', title: { ar: 'متوسط', en: 'Intermediate' } },
  { code: 'B2', title: { ar: 'فوق المتوسط', en: 'Upper Intermediate' } },
  { code: 'C1', title: { ar: 'متقدم', en: 'Advanced' } },
];

export function PlacementFlow({
  lang = 'en',
  theme = 'light',
  user,
  token,
  levelTest,
  onComplete,
  onNavigate,
  onOpenLesson,
  onOpenAuth,
  onRefreshPath,
}) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);

  // Flow step: 'welcome' | 'test' | 'result'
  const [step, setStep] = useState('welcome');
  const [selectedStartOption, setSelectedStartOption] = useState('placement'); // 'a1' | 'placement'
  const [placementResult, setPlacementResult] = useState(null);
  const [savingPlacement, setSavingPlacement] = useState(false);

  // If a certificate verification hash is in the URL (#/verify/...), delegate to LevelTest immediately
  const isVerifyHash = typeof window !== 'undefined' && window.location.hash.startsWith('#/verify/');
  if (isVerifyHash) {
    return (
      <LevelTest
        lang={lang}
        theme={theme}
        levelTest={levelTest}
        onComplete={onComplete}
        onOpenAuth={onOpenAuth}
        onGoHome={() => onNavigate('dashboard')}
      />
    );
  }

  // Submit placement to server: POST /api/path/placement
  const handleSetPlacement = async (targetLevel, source = 'manual') => {
    setSavingPlacement(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch('/api/path/placement', {
        method: 'POST',
        headers,
        body: JSON.stringify({ level: targetLevel, source }),
      });
      if (res.ok) {
        const json = await res.json();
        if (onRefreshPath) onRefreshPath();
        if (json?.current?.slug) {
          onOpenLesson(json.current.level || targetLevel, json.current.slug);
        } else {
          onNavigate('path-home');
        }
      } else {
        onNavigate('path-home');
      }
    } catch {
      onNavigate('path-home');
    } finally {
      setSavingPlacement(false);
    }
  };

  // Called when adaptive test completes
  const handleTestFinished = async (record) => {
    if (onComplete) onComplete(record);
    const assignedLevel = String(record?.level || 'A1').toUpperCase().slice(0, 2);
    setPlacementResult(assignedLevel);
    setStep('result');
    // Save to /api/path/placement on the server
    await handleSetPlacement(assignedLevel, 'level_test');
  };

  /* ── 1. WELCOME SCREEN (PDF p.7 Left) ──────────────────────────────────── */

  if (step === 'welcome') {
    return (
      <div className="vx-font mx-auto max-w-xl space-y-6">
        <Breadcrumb
          lang={lang}
          items={[
            { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
            { label: T('مسار التعلم', 'Learning Path'), onClick: () => onNavigate('path-home') },
            { label: T('تحديد نقطة البداية', 'Placement') },
          ]}
        />

        <Card className="p-6 sm:p-8">
          <Eyebrow className="!text-[var(--vxp-primary)]">{T('مرحباً بك', 'WELCOME')}</Eyebrow>
          <h1 className="mt-2 text-[28px] font-black tracking-[-0.02em] text-[var(--vxp-text)]">
            {T('أين تود أن تبدأ؟', 'Where would you like to start?')}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--vxp-dim)]">
            {T(
              'يمكنك تغيير هذا لاحقاً. لا يتم تخطي أي درس دون إثبات المستوى.',
              'You can change this later. No lessons are skipped without proof.'
            )}
          </p>

          <div className="mt-6 space-y-3.5">
            {/* Option A: Start from A1 */}
            <button
              type="button"
              onClick={() => setSelectedStartOption('a1')}
              className={`w-full rounded-[16px] border p-5 text-start transition-all ${
                selectedStartOption === 'a1'
                  ? 'border-[var(--vxp-primary)] bg-[var(--vxp-primary-tint)] shadow-sm'
                  : 'border-[var(--vxp-border)] bg-[var(--vxp-surface)] hover:bg-[var(--vxp-surface-2)]'
              } ${FOCUS_RING}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[17px] font-extrabold text-[var(--vxp-text)]">
                  {T('البدء من A1', 'Start from A1')}
                </span>
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-[var(--vxp-primary)] dark:bg-black/40">
                  {T('موصى به للمبتدئين', 'Recommended for beginners')}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--vxp-dim)]">
                {T(
                  'ابدأ مع الحروف والأصوات وتابع المسار الكامل خطوة بخطوة.',
                  'Begin with the alphabet and sounds and follow the full path.'
                )}
              </p>
            </button>

            {/* Option B: Take the placement test */}
            <button
              type="button"
              onClick={() => setSelectedStartOption('placement')}
              className={`w-full rounded-[16px] border p-5 text-start transition-all ${
                selectedStartOption === 'placement'
                  ? 'border-[var(--vxp-primary)] bg-[var(--vxp-primary-tint)] shadow-sm'
                  : 'border-[var(--vxp-border)] bg-[var(--vxp-surface)] hover:bg-[var(--vxp-surface-2)]'
              } ${FOCUS_RING}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[17px] font-extrabold text-[var(--vxp-text)]">
                  {T('إجراء اختبار تحديد المستوى', 'Take the placement test')}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--vxp-dim)]">
                {T(
                  'حوالي 10 دقائق. أسئلة تكيّفية لتحديد مستواك الحقيقي بدقة.',
                  'About 10 minutes. Adaptive questions find your starting level.'
                )}
              </p>
            </button>
          </div>

          <div className="mt-8">
            {selectedStartOption === 'a1' ? (
              <Btn
                variant="primary"
                size="lg"
                className="w-full text-[15px]"
                icon={ArrowRight}
                disabled={savingPlacement}
                onClick={() => handleSetPlacement('A1', 'manual')}
              >
                {savingPlacement ? T('جارٍ البدء...', 'Starting...') : T('ابدأ مسار A1 →', 'Start A1 path →')}
              </Btn>
            ) : (
              <Btn
                variant="primary"
                size="lg"
                className="w-full text-[15px]"
                icon={ArrowRight}
                onClick={() => setStep('test')}
              >
                {T('بدء اختبار المستوى →', 'Take placement test →')}
              </Btn>
            )}
          </div>
        </Card>
      </div>
    );
  }

  /* ── 2. ADAPTIVE TEST SCREEN (PDF p.7 Middle) ───────────────────────────── */

  if (step === 'test') {
    return (
      <div className="vx-font">
        <LevelTest
          lang={lang}
          theme={theme}
          levelTest={levelTest}
          onComplete={handleTestFinished}
          onOpenAuth={onOpenAuth}
          onGoHome={() => setStep('welcome')}
        />
      </div>
    );
  }

  /* ── 3. RESULT SCREEN (PDF p.7 Right) ──────────────────────────────────── */

  const assignedLevel = placementResult || 'B1';
  const levelInfo = CEFR_LEVELS.find((l) => l.code === assignedLevel) || CEFR_LEVELS[2];
  const assignedIdx = CEFR_LEVELS.findIndex((l) => l.code === assignedLevel);

  return (
    <div className="vx-font mx-auto max-w-xl space-y-6">
      <Breadcrumb
        lang={lang}
        items={[
          { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
          { label: T('مسار التعلم', 'Learning Path'), onClick: () => onNavigate('path-home') },
          { label: T('نتيجتك', 'Your Result') },
        ]}
      />

      <Card className="p-6 sm:p-8 text-center">
        <Eyebrow className="!text-[var(--vxp-primary)]">{T('نتيجتك', 'YOUR RESULT')}</Eyebrow>

        {/* Big blue rounded square badge */}
        <div className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-[24px] bg-[var(--vxp-primary)] text-[38px] font-black text-white shadow-md">
          {assignedLevel}
        </div>

        <h2 className="mt-3 text-[26px] font-black tracking-[-0.01em] text-[var(--vxp-text)]">
          {T(levelInfo.title.ar, levelInfo.title.en)}
        </h2>

        <p className="mt-2 text-[14px] font-semibold text-[var(--vxp-dim)]">
          {T(
            `ستبدأ من ${assignedLevel} · الدرس 1. المستويات السابقة تبقى متاحة للمراجعة.`,
            `You'll start at ${assignedLevel} · Lesson 1. Earlier levels stay open for revision.`
          )}
        </p>

        {/* Level List Rows */}
        <div className="mt-6 space-y-2 text-start">
          {CEFR_LEVELS.map((lvl, idx) => {
            const isBelow = idx < assignedIdx;
            const isCurrent = idx === assignedIdx;
            const isAbove = idx > assignedIdx;

            let rowStyle = 'bg-[var(--vxp-surface)] border-[var(--vxp-border)] text-[var(--vxp-dim)]';
            if (isCurrent) {
              rowStyle =
                'bg-[var(--vxp-primary-tint)] border-[var(--vxp-primary)]/30 text-[var(--vxp-primary)] font-extrabold';
            } else if (isBelow) {
              rowStyle = 'bg-[var(--vxp-surface-2)] border-[var(--vxp-border)] text-[var(--vxp-text)]';
            }

            return (
              <div
                key={lvl.code}
                className={`flex items-center justify-between rounded-[14px] border p-3.5 transition-colors ${rowStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-black">{lvl.code}</span>
                  <span className="text-[13px] font-semibold">
                    {isCurrent
                      ? T('مستوى البداية', 'Starting level')
                      : isBelow
                        ? T('مفتوح للمراجعة', 'Open for revision')
                        : T('مقفل', 'Locked')}
                  </span>
                </div>

                <div className="flex items-center">
                  {isCurrent && <Play className="h-4 w-4 fill-current text-[var(--vxp-primary)]" />}
                  {isBelow && <RotateCcw className="h-4 w-4 text-[var(--vxp-dim)]" />}
                  {isAbove && <Lock className="h-4 w-4 text-[var(--vxp-dim)]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Primary Action Button */}
        <div className="mt-8">
          <Btn
            variant="primary"
            size="lg"
            className="w-full text-[15px]"
            icon={ArrowRight}
            disabled={savingPlacement}
            onClick={() => handleSetPlacement(assignedLevel, 'level_test')}
          >
            {savingPlacement
              ? T('جارٍ فتح المسار...', 'Unlocking path...')
              : T(`بدء مسار ${assignedLevel} →`, `Start ${assignedLevel} path →`)}
          </Btn>
        </div>
      </Card>
    </div>
  );
}
