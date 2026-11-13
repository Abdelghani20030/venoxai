// src/path/LessonPlayer.jsx — Phase 5: Lesson player experience (spec §5.3–5.4, PDF p.5 & p.6)
//
// Features:
//   - URL: /path/:level/:slug with full DB slug resolution
//   - Two columns: main lesson content + right rail "IN THIS LESSON"
//   - Composable steps: Grammar, Vocabulary, Listening, Practice, Check
//   - Rich grammar tables, listen & repeat with Edge TTS audio playback
//   - Interactive Practice & Check mode (PDF p.6): single centered card,
//     server-graded questions via /check-one, immediate feedback, green continue
//   - Completion screen: blue gradient banner, confetti particles, amber trophy,
//     score %, +XP, new words, unlocked next lesson tile, "Next lesson →"
//   - Fail state (<70%): friendly feedback, "Review lesson" & "Try again"
//   - Server-enforced unlocking: 403 locked screen redirects to current lesson
//   - Full dark mode and RTL support

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BookOpen,
  Pencil,
  Headphones,
  Check,
  Trophy,
  Volume2,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  X,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import { speakEdge } from '../aiHelpers.js';
import {
  Btn,
  Card,
  Chip,
  Breadcrumb,
  EmptyState,
  Eyebrow,
  ProgressBar,
  FOCUS_RING,
  RTL_FLIP,
} from '../ui/index.jsx';

/* ── Step icons & colors ─────────────────────────────────────────────────── */

const STEP_META = {
  grammar: {
    icon: BookOpen,
    label: { ar: 'القواعد', en: 'Grammar' },
    pillClass: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  },
  vocab: {
    icon: Pencil,
    label: { ar: 'المفردات', en: 'Vocabulary' },
    pillClass: 'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
  },
  listening: {
    icon: Headphones,
    label: { ar: 'الاستماع', en: 'Listening' },
    pillClass: 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]',
  },
  reading: {
    icon: BookOpen,
    label: { ar: 'القراءة', en: 'Reading' },
    pillClass: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  },
  speaking: {
    icon: Headphones,
    label: { ar: 'المحادثة', en: 'Speaking' },
    pillClass: 'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
  },
  writing: {
    icon: Pencil,
    label: { ar: 'الكتابة', en: 'Writing' },
    pillClass: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  },
  pronunciation: {
    icon: Volume2,
    label: { ar: 'النطق', en: 'Pronunciation' },
    pillClass: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  },
  practice: {
    icon: Check,
    label: { ar: 'تمرين', en: 'Practice' },
    pillClass: 'bg-[var(--vxp-success-tint)] text-[var(--vxp-success-text)]',
  },
  check: {
    icon: Trophy,
    label: { ar: 'اختبار', en: 'Check' },
    pillClass: 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]',
  },
};

/* ── Confetti Banner Decoration (PDF p.6) ────────────────────────────────── */

function ConfettiParticles() {
  const pieces = useMemo(() => [
    { top: '15%', left: '12%', color: '#F59E0B', size: 8, shape: 'square', rot: '12deg' },
    { top: '22%', left: '24%', color: '#06B6D4', size: 6, shape: 'circle' },
    { top: '45%', left: '8%', color: '#10B981', size: 7, shape: 'square', rot: '-20deg' },
    { top: '65%', left: '18%', color: '#A855F7', size: 8, shape: 'circle' },
    { top: '18%', right: '14%', color: '#F59E0B', size: 8, shape: 'circle' },
    { top: '30%', right: '22%', color: '#3B82F6', size: 7, shape: 'square', rot: '25deg' },
    { top: '58%', right: '10%', color: '#10B981', size: 6, shape: 'circle' },
    { top: '70%', right: '20%', color: '#EC4899', size: 8, shape: 'square', rot: '-15deg' },
  ], []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute opacity-85 transition-transform duration-700"
          style={{
            top: p.top,
            left: p.left,
            right: p.right,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            transform: p.rot ? `rotate(${p.rot})` : undefined,
          }}
        />
      ))}
    </div>
  );
}

/* ── Text formatter: bold markdown (**text** → <strong>) ────────────────── */

function FormattedText({ text, className = '' }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-extrabold text-[var(--vxp-text)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LessonPlayer Component
 * ═══════════════════════════════════════════════════════════════════════════ */

export function LessonPlayer({
  lang = 'en',
  lessonRoute,
  user,
  token,
  onNavigate,
  onOpenLesson,
  onOpenAuth,
  onRefreshPath,
}) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);

  // Compute full slug (e.g. 'a1-introducing-yourself')
  const slug = useMemo(() => {
    if (!lessonRoute?.level || !lessonRoute?.slug) return '';
    const l = lessonRoute.level.toLowerCase();
    const s = lessonRoute.slug.toLowerCase();
    const prefix = `${l}-`;
    return s.startsWith(prefix) ? s : `${prefix}${s}`;
  }, [lessonRoute]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 'locked' | 'draft' | 'not_found' | 'auth_required' | 'network'
  const [lockedReason, setLockedReason] = useState(null);
  const [data, setData] = useState(null);

  // Step state
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Interactive exercise state (for Practice & Check steps)
  const [isExerciseMode, setIsExerciseMode] = useState(false);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [exerciseId]: answer }
  const [exerciseFeedback, setExerciseFeedback] = useState({}); // { [exerciseId]: { correct, explanation, correctAnswer } }
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);

  // Results
  const [attemptResult, setAttemptResult] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showFailScreen, setShowFailScreen] = useState(false);

  // Audio playing indicator
  const [playingKey, setPlayingKey] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);

  // Fetch lesson data
  const fetchLesson = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/path/lessons/${slug}`, { headers });
      if (res.status === 401) {
        setError('auth_required');
        return;
      }
      if (res.status === 403) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error === 'draft' ? 'draft' : 'locked');
        setLockedReason(json?.reason || null);
        return;
      }
      if (res.status === 404) {
        setError('not_found');
        return;
      }
      if (!res.ok) {
        setError('network');
        return;
      }
      const json = await res.json();
      setData(json);
      setActiveStepIndex(0);
      setIsExerciseMode(false);
      setShowCompletion(false);
      setShowFailScreen(false);
      setUserAnswers({});
      setExerciseFeedback({});
      setSelectedAnswer('');
    } catch {
      setError('network');
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  // Audio helper using Edge TTS
  const playAudio = useCallback(async (text, key) => {
    if (!text) return;
    setPlayingKey(key);
    setAudioProgress(0);
    const interval = setInterval(() => {
      setAudioProgress((prev) => (prev >= 100 ? 100 : prev + 10));
    }, 150);
    try {
      await speakEdge(text, 'en-US');
    } catch {
      // Audio failed
    } finally {
      clearInterval(interval);
      setPlayingKey(null);
      setAudioProgress(0);
    }
  }, []);

  const lesson = data?.lesson;
  const steps = useMemo(() => data?.steps || [], [data?.steps]);
  const exercises = useMemo(() => data?.exercises || [], [data?.exercises]);

  const activeStep = steps[activeStepIndex] || null;

  // Filter exercises belonging to the active step, or all exercises if step has none
  const stepExercises = useMemo(() => {
    if (!exercises || exercises.length === 0) return [];
    if (!activeStep) return exercises;
    // Match by step_index if present
    const byStep = exercises.filter((ex) => ex.step_index === activeStepIndex);
    return byStep.length > 0 ? byStep : exercises;
  }, [exercises, activeStep, activeStepIndex]);

  // Handle checking a single question with server
  const handleCheckQuestion = async (exercise, answer) => {
    if (!exercise || answer === undefined || answer === '' || checkingAnswer) return;
    setCheckingAnswer(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/path/lessons/${slug}/check-one`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ exerciseId: exercise.id, answer }),
      });
      if (res.ok) {
        const fb = await res.json();
        setExerciseFeedback((prev) => ({ ...prev, [exercise.id]: fb }));
        setUserAnswers((prev) => ({ ...prev, [exercise.id]: answer }));
      }
    } catch {
      // Offline fallback: store answer
      setUserAnswers((prev) => ({ ...prev, [exercise.id]: answer }));
    } finally {
      setCheckingAnswer(false);
    }
  };

  // Submit the completed attempt to /api/path/lessons/:slug/attempt
  const handleSubmitAttempt = async (finalAnswers) => {
    if (submittingAttempt) return;
    setSubmittingAttempt(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      // Format answers in exercises order
      const answersArr = exercises.map((ex) => finalAnswers[ex.id] ?? '');
      const res = await fetch(`/api/path/lessons/${slug}/attempt`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers: answersArr }),
      });
      if (res.ok) {
        const result = await res.json();
        setAttemptResult(result);
        if (result.passed || result.completed) {
          setShowCompletion(true);
          setShowFailScreen(false);
          if (onRefreshPath) onRefreshPath();
        } else {
          setShowFailScreen(true);
          setShowCompletion(false);
        }
      }
    } catch {
      // Network error
    } finally {
      setSubmittingAttempt(false);
    }
  };

  // Move to next exercise or finish practice
  const handleContinueExercise = () => {
    const isLast = currentExerciseIdx >= stepExercises.length - 1;
    if (!isLast) {
      setCurrentExerciseIdx((prev) => prev + 1);
      setSelectedAnswer('');
    } else {
      // Step exercises complete
      setCompletedSteps((prev) => new Set([...prev, activeStepIndex]));
      if (activeStep?.type === 'check' || activeStepIndex === steps.length - 1) {
        // Submit attempt!
        handleSubmitAttempt(userAnswers);
      } else {
        // Exit exercise mode and advance step
        setIsExerciseMode(false);
        if (activeStepIndex < steps.length - 1) {
          setActiveStepIndex((prev) => prev + 1);
        }
      }
    }
  };

  // Attached vocabulary items — these hooks MUST stay above the early returns
  // below (loading/error states), otherwise React sees a different hook count
  // per render and crashes with "Rendered more hooks than during the previous render".
  const vocabItems = useMemo(() => {
    // Check if any step has items
    const vocabStep = steps.find((s) => s.type === 'vocab');
    if (vocabStep?.items && Array.isArray(vocabStep.items)) return vocabStep.items;
    // Fallback default A1 vocab for Lesson 4 (lesson is undefined while loading)
    if (lesson?.slug === 'a1-introducing-yourself') {
      return [
        { term: 'name', ar: 'اسم' },
        { term: 'age', ar: 'عمر' },
        { term: 'nationality', ar: 'جنسية' },
        { term: 'country', ar: 'بلد' },
        { term: 'job', ar: 'وظيفة' },
      ];
    }
    return [];
  }, [steps, lesson?.slug]);

  // Audio / dialogue lines
  const listeningLines = useMemo(() => {
    const lStep = steps.find((s) => s.type === 'listening');
    return lStep?.lines || [
      'Hi! My name is Ali.',
      'I am from Riyadh.',
      'Nice to meet you!',
    ];
  }, [steps]);

  /* ── Loading & Error States ────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="vx-font mx-auto max-w-5xl space-y-6">
        <div className="h-6 w-64 animate-pulse rounded bg-[var(--vxp-surface-2)]" />
        <Card className="h-80 animate-pulse bg-[var(--vxp-surface)]" />
      </div>
    );
  }

  if (error === 'auth_required') {
    return (
      <div className="vx-font mx-auto max-w-3xl space-y-6">
        <Breadcrumb
          lang={lang}
          items={[
            { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
            { label: T('مسار التعلم', 'Learning Path'), onClick: () => onNavigate('path-home') },
            { label: T('تسجيل الدخول مطلوب', 'Sign in required') },
          ]}
        />
        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]">
            <Lock className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-[22px] font-black text-[var(--vxp-text)] sm:text-[26px]">
            {T('سجّل الدخول لبدء هذا الدرس', 'Sign in to start this lesson')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--vxp-dim)]">
            {T(
              'لحفظ تقدمك، فتح الدروس المتتالية وجمع نقاط XP، يُرجى تسجيل الدخول بحسابك.',
              'Sign in with your account to save your progress, unlock sequential lessons and earn XP.'
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Btn variant="primary" size="lg" onClick={onOpenAuth}>
              {T('تسجيل الدخول / إنشاء حساب', 'Sign in / Create account')}
            </Btn>
            <Btn variant="outline" size="lg" onClick={() => onNavigate('path-home')}>
              {T('العودة إلى خريطة المسار', 'Back to Learning Path')}
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  if (error === 'locked') {
    return (
      <div className="vx-font mx-auto max-w-3xl space-y-6">
        <Breadcrumb
          lang={lang}
          items={[
            { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
            { label: T('مسار التعلم', 'Learning Path'), onClick: () => onNavigate('path-home') },
            { label: T('درس مقفل', 'Locked lesson') },
          ]}
        />
        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]">
            <Lock className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-[22px] font-black text-[var(--vxp-text)] sm:text-[26px]">
            {T('هذا الدرس مقفل حالياً', 'This lesson is locked')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--vxp-dim)]">
            {lockedReason === 'level_locked'
              ? T(
                  'أكمل المستوى السابق واجتز اختباره لفتح هذا المستوى.',
                  'Complete the previous level and pass its assessment to unlock this level.'
                )
              : T(
                  'يجب عليك إكمال الدرس السابق واجتياز اختباره بنسبة ≥ 70% لفتح هذا الدرس.',
                  'Complete the previous lesson and score ≥ 70% to unlock this one. Skipping is blocked on the server.'
                )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Btn variant="primary" size="lg" onClick={() => onNavigate('path-home')}>
              {T('الذهاب إلى الدرس الحالي', 'Go to current lesson')}
            </Btn>
            <Btn variant="outline" size="lg" onClick={() => onNavigate('dashboard')}>
              {T('لوحة التحكم', 'Dashboard')}
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="vx-font mx-auto max-w-3xl space-y-6">
        <Card>
          <EmptyState
            icon={AlertCircle}
            title={T('تعذر تحميل الدرس', 'Could not load lesson')}
            hint={T('يرجى التحقق من الرابط أو المحاولة لاحقاً.', 'Please check the URL or try again later.')}
            action={
              <Btn variant="primary" onClick={() => onNavigate('path-home')}>
                {T('العودة إلى المسار', 'Back to Learning Path')}
              </Btn>
            }
          />
        </Card>
      </div>
    );
  }

  /* ── Completion Screen (PDF p.6) ───────────────────────────────────────── */

  if (showCompletion && attemptResult) {
    const nextLesson = attemptResult.next;
    return (
      <div className="vx-font mx-auto max-w-xl space-y-6">
        <Breadcrumb
          lang={lang}
          items={[
            { label: T('مسار التعلم', 'Learning Path'), onClick: () => onNavigate('path-home') },
            { label: `${lesson.level} · ${lesson.title}` },
            { label: T('اكتمل الدرس', 'Completed') },
          ]}
        />
        <div className="overflow-hidden rounded-[24px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] shadow-[var(--vxp-shadow)]">
          {/* Top blue gradient banner with trophy + confetti */}
          <div className="relative flex h-52 items-center justify-center bg-[linear-gradient(135deg,var(--vxp-hero-a),var(--vxp-hero-b))]">
            <ConfettiParticles />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl">
              <Trophy className="h-12 w-12 text-[#D88C34]" aria-hidden="true" />
            </div>
          </div>

          {/* Body */}
          <div className="p-6 text-center sm:p-8">
            <h2 className="text-[28px] font-black tracking-[-0.02em] text-[var(--vxp-text)]">
              {T('اكتمل الدرس!', 'Lesson complete!')}
            </h2>
            <p className="mt-1 text-[14px] font-semibold text-[var(--vxp-dim)]">
              {lesson.title} · {lesson.level}
            </p>

            {/* Three Stat Tiles */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-[16px] bg-[var(--vxp-primary-tint)] p-3 text-center sm:p-4">
                <div className="text-[22px] font-black text-[var(--vxp-primary)]">
                  {attemptResult.score}%
                </div>
                <div className="text-[12px] font-bold text-[var(--vxp-dim)]">
                  {T('النتيجة', 'Score')}
                </div>
              </div>
              <div className="rounded-[16px] bg-[var(--vxp-amber)] p-3 text-center sm:p-4">
                <div className="text-[22px] font-black text-[var(--vxp-amber-text)]">
                  +{attemptResult.xpAwarded}
                </div>
                <div className="text-[12px] font-bold text-[var(--vxp-amber-text)]">
                  {T('نقاط XP', 'XP')}
                </div>
              </div>
              <div className="rounded-[16px] bg-[var(--vxp-mint)] p-3 text-center sm:p-4">
                <div className="text-[22px] font-black text-[var(--vxp-mint-text)]">5</div>
                <div className="text-[12px] font-bold text-[var(--vxp-mint-text)]">
                  {T('كلمات جديدة', 'New words')}
                </div>
              </div>
            </div>

            {/* Unlocked Next Lesson Card */}
            {nextLesson && (
              <div className="mt-6 flex items-center gap-3.5 rounded-[16px] border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] p-4 text-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--vxp-primary)] text-white shadow-sm">
                  <Unlock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--vxp-success-text)]">
                    {T('تم الفتح', 'UNLOCKED')}
                  </div>
                  <div className="truncate text-[15px] font-extrabold text-[var(--vxp-text)]">
                    {nextLesson.title}
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="mt-6 space-y-3">
              {nextLesson ? (
                <Btn
                  variant="primary"
                  size="lg"
                  className="w-full text-[16px]"
                  icon={ArrowRight}
                  onClick={() => onOpenLesson(nextLesson.level, nextLesson.slug)}
                >
                  {T('الدرس التالي', 'Next lesson')}
                </Btn>
              ) : (
                <Btn
                  variant="primary"
                  size="lg"
                  className="w-full text-[16px]"
                  icon={ArrowRight}
                  onClick={() => onNavigate('path-home')}
                >
                  {T('العودة إلى خريطة المسار', 'Back to Learning Path')}
                </Btn>
              )}
              <Btn
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => onNavigate('path-home')}
              >
                {T('خريطة المسار', 'View all lessons')}
              </Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Fail / Try Again Screen (<70%) ────────────────────────────────────── */

  if (showFailScreen && attemptResult) {
    return (
      <div className="vx-font mx-auto max-w-md space-y-6">
        <Breadcrumb
          lang={lang}
          items={[
            { label: T('مسار التعلم', 'Learning Path'), onClick: () => onNavigate('path-home') },
            { label: `${lesson.level} · ${lesson.title}` },
            { label: T('النتيجة', 'Result') },
          ]}
        />
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--vxp-danger-tint)] text-[var(--vxp-danger)]">
            <XCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-[24px] font-black text-[var(--vxp-text)]">
            {T('تحتاج 70% على الأقل للاجتياز', 'Pass the check (≥ 70%) to unlock')}
          </h2>
          <p className="mt-2 text-[14px] text-[var(--vxp-dim)]">
            {T('حصلت على', 'You scored')}{' '}
            <strong className="text-[var(--vxp-danger)]">{attemptResult.score}%</strong>.{' '}
            {T(
              'راجع الدرس مرة أخرى ثم حاول مجدداً لفتح الدرس التالي.',
              'Review the materials and try again to unlock the next lesson.'
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Btn
              variant="primary"
              size="lg"
              icon={RotateCcw}
              iconSide="start"
              onClick={() => {
                setShowFailScreen(false);
                setIsExerciseMode(true);
                setCurrentExerciseIdx(0);
                setUserAnswers({});
                setExerciseFeedback({});
                setSelectedAnswer('');
              }}
            >
              {T('إعادة المحاولة الآن', 'Try again')}
            </Btn>
            <Btn
              variant="outline"
              size="md"
              onClick={() => {
                setShowFailScreen(false);
                setIsExerciseMode(false);
                setActiveStepIndex(0);
              }}
            >
              {T('مراجعة مواد الدرس', 'Review lesson steps')}
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Interactive Practice / Check Mode (PDF p.6 Left) ───────────────────── */

  if (isExerciseMode) {
    const curEx = stepExercises[currentExerciseIdx];
    const totalEx = stepExercises.length;
    const currentFb = curEx ? exerciseFeedback[curEx.id] : null;
    const isAnswerChecked = Boolean(currentFb);
    const isCorrect = currentFb?.correct;
    const options = Array.isArray(curEx?.options)
      ? curEx.options
      : typeof curEx?.options === 'string'
        ? JSON.parse(curEx.options)
        : [];

    return (
      <div className="vx-font mx-auto max-w-xl space-y-6">
        {/* Top bar: Close X, Green Progress Bar, Counter */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsExerciseMode(false)}
            aria-label={T('إغلاق', 'Close')}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-[var(--vxp-dim)] hover:bg-[var(--vxp-surface-2)] ${FOCUS_RING}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex-1">
            <ProgressBar
              value={(currentExerciseIdx + 1) / totalEx}
              color="success"
              ariaLabel={T('تقدم التمرين', 'Exercise progress')}
            />
          </div>
          <span className="text-[13px] font-bold text-[var(--vxp-dim)]">
            {currentExerciseIdx + 1} / {totalEx}
          </span>
        </div>

        {/* Question Card */}
        {curEx ? (
          <Card className="space-y-6 p-6 sm:p-8">
            <div>
              <Eyebrow className="!text-[var(--vxp-primary)]">
                {activeStep?.type === 'check'
                  ? T('اختبار الوحدة', 'CHECK')
                  : T('تمرين', 'PRACTICE')}{' '}
                · {activeStep?.title?.toUpperCase() || lesson.title.toUpperCase()}
              </Eyebrow>
              <h2 className="mt-2 text-[24px] font-extrabold leading-snug tracking-[-0.01em] text-[var(--vxp-text)]">
                {curEx.prompt}
              </h2>
            </div>

            {/* Audio Prompt if listen_mcq */}
            {curEx.type === 'listen_mcq' && (
              <div className="flex items-center gap-3 rounded-[14px] bg-[var(--vxp-amber)] p-3.5">
                <button
                  type="button"
                  onClick={() => playAudio(curEx.audio_script || curEx.prompt, curEx.id)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D88C34] text-white shadow-sm ${FOCUS_RING}`}
                >
                  <Volume2 className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="text-[13px] font-bold text-[var(--vxp-amber-text)]">
                  {T('اضغط للاستماع إلى الجملة', 'Listen to the audio')}
                </div>
              </div>
            )}

            {/* Options list */}
            {options.length > 0 && (
              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const optStr = String(opt);
                  const isSelected = selectedAnswer === String(idx) || selectedAnswer === optStr;
                  const isThisCorrect =
                    isAnswerChecked &&
                    (String(idx) === String(currentFb.correctAnswer) ||
                      optStr.toLowerCase() === String(currentFb.correctAnswer).toLowerCase());
                  const isThisWrong = isAnswerChecked && isSelected && !isCorrect;

                  let btnStyle =
                    'border-[var(--vxp-border-strong)] bg-[var(--vxp-surface)] text-[var(--vxp-text)] hover:bg-[var(--vxp-surface-2)]';
                  if (isSelected && !isAnswerChecked) {
                    btnStyle = 'border-[var(--vxp-primary)] bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]';
                  } else if (isThisCorrect) {
                    btnStyle =
                      '!border-2 !border-[var(--vxp-success)] !bg-[var(--vxp-success-tint)] !text-[var(--vxp-success-text)]';
                  } else if (isThisWrong) {
                    btnStyle =
                      '!border-2 !border-[var(--vxp-danger)] !bg-[var(--vxp-danger-tint)] !text-[var(--vxp-danger)]';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => setSelectedAnswer(String(idx))}
                      className={`flex w-full items-center justify-between rounded-[14px] border p-4 text-start text-[16px] font-bold transition-all ${btnStyle} ${FOCUS_RING}`}
                    >
                      <span>{optStr}</span>
                      {isThisCorrect && (
                        <Check className="h-5 w-5 text-[var(--vxp-success)]" aria-hidden="true" />
                      )}
                      {isThisWrong && (
                        <X className="h-5 w-5 text-[var(--vxp-danger)]" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Type-in Input */}
            {curEx.type === 'type_in' && (
              <div>
                <input
                  type="text"
                  dir="ltr"
                  value={selectedAnswer}
                  disabled={isAnswerChecked}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAnswerChecked && selectedAnswer.trim()) {
                      handleCheckQuestion(curEx, selectedAnswer);
                    }
                  }}
                  placeholder={T('اكتب إجابتك هنا...', 'Type your answer...')}
                  className={`w-full rounded-[14px] border border-[var(--vxp-border-strong)] bg-[var(--vxp-surface)] px-4 py-3.5 text-[16px] font-semibold text-[var(--vxp-text)] placeholder-[var(--vxp-dim)] ${FOCUS_RING}`}
                />
              </div>
            )}

            {/* Feedback Panel (Instant feedback per PDF p.6) */}
            {isAnswerChecked && (
              <div
                className={`rounded-[14px] p-4 ${
                  isCorrect
                    ? 'bg-[var(--vxp-success-tint)] text-[var(--vxp-success-text)]'
                    : 'bg-[var(--vxp-danger-tint)] text-[var(--vxp-danger)]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  )}
                  <div className="min-w-0 text-[14px] leading-relaxed">
                    <strong className="font-extrabold">
                      {isCorrect ? T('صحيح!', 'Correct!') : T('غير صحيح.', 'Not quite.')}
                    </strong>{' '}
                    <FormattedText
                      text={
                        currentFb.explanation ||
                        (isCorrect
                          ? T('إجابة ممتازة!', 'Well done!')
                          : `${T('الإجابة الصحيحة:', 'The correct answer is:')} ${
                              Array.isArray(currentFb.correctAnswer)
                                ? currentFb.correctAnswer.join(' / ')
                                : currentFb.correctAnswer
                            }`)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Button: Check OR Continue */}
            <div className="flex justify-end pt-2">
              {!isAnswerChecked ? (
                <Btn
                  variant="primary"
                  size="lg"
                  disabled={selectedAnswer === '' || checkingAnswer}
                  onClick={() => handleCheckQuestion(curEx, selectedAnswer)}
                >
                  {checkingAnswer ? T('جارٍ التحقق...', 'Checking...') : T('تحقق من الإجابة', 'Check answer')}
                </Btn>
              ) : isCorrect ? (
                <Btn
                  variant="success"
                  size="lg"
                  icon={ArrowRight}
                  onClick={handleContinueExercise}
                >
                  {currentExerciseIdx >= totalEx - 1
                    ? T('إنهاء وحفظ النتيجة →', 'Finish & save →')
                    : T('متابعة →', 'Continue →')}
                </Btn>
              ) : (
                <div className="flex gap-2">
                  <Btn
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setExerciseFeedback((prev) => {
                        const copy = { ...prev };
                        delete copy[curEx.id];
                        return copy;
                      });
                      setSelectedAnswer('');
                    }}
                  >
                    {T('إعادة المحاولة', 'Try again')}
                  </Btn>
                  <Btn
                    variant="primary"
                    size="lg"
                    icon={ArrowRight}
                    onClick={handleContinueExercise}
                  >
                    {T('تخطي والمتابعة →', 'Skip & continue →')}
                  </Btn>
                </div>
              )}
            </div>
          </Card>
        ) : null}
      </div>
    );
  }

  /* ── Standard Lesson Two-Column Experience (PDF p.5) ────────────────────── */

  // Pronoun table mock/seed for A1 TO BE lessons if applicable
  const showGrammarTable =
    lesson.slug === 'a1-introducing-yourself' ||
    lesson.slug === 'a1-the-verb-to-be' ||
    lesson.slug === 'a1-subject-pronouns';

  const activeMeta = activeStep ? STEP_META[activeStep.type] || STEP_META.grammar : STEP_META.grammar;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="vx-font mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        lang={lang}
        items={[
          { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
          { label: T('مسار التعلم', 'Learning Path'), onClick: () => onNavigate('path-home') },
          { label: `${lesson.level} · ${lesson.unitTitle || 'Unit 1'}` },
          { label: lesson.title },
        ]}
      />

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left (Main Content, ~8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Main Step Card */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <Eyebrow className="!text-[var(--vxp-primary)]">
                {T('الدرس', 'LESSON')} {lesson.lessonNo || '1'} · {T('الخطوة', 'STEP')}{' '}
                {activeStepIndex + 1} {T('من', 'OF')} {steps.length}
              </Eyebrow>
              <Chip variant="blue" icon={ActiveIcon}>
                {T(activeMeta.label.ar, activeMeta.label.en)}
              </Chip>
            </div>

            <h1 className="mt-2 text-[26px] font-black tracking-[-0.02em] text-[var(--vxp-text)] sm:text-[30px]">
              {activeStep?.title || lesson.title}
            </h1>

            {activeStep?.body && (
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--vxp-muted)]">
                <FormattedText text={activeStep.body} />
              </p>
            )}

            {/* Grammar Sub-Panels (PDF p.5: Table Left + Listen & Repeat Right) */}
            {activeStep?.type === 'grammar' && showGrammarTable && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Left Panel: PRONOUN -> TO BE Table */}
                <div className="overflow-hidden rounded-[16px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)]">
                  <div className="border-b border-[var(--vxp-border)] bg-[var(--vxp-primary-tint)] px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wider text-[var(--vxp-primary)]">
                    {T('الضمير ← الفعل', 'PRONOUN → TO BE')}
                  </div>
                  <div className="divide-y divide-[var(--vxp-border)] text-[14px]">
                    {[
                      { pronoun: 'I', verb: 'am' },
                      { pronoun: 'You', verb: 'are' },
                      { pronoun: 'He / She / It', verb: 'is' },
                      { pronoun: 'We', verb: 'are' },
                      { pronoun: 'They', verb: 'are' },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        dir="ltr"
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span className="font-semibold text-[var(--vxp-text)]">{row.pronoun}</span>
                        <span className="font-black text-[var(--vxp-primary)]">{row.verb}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Panel: LISTEN & REPEAT */}
                <div className="space-y-2.5">
                  <Eyebrow>{T('استمع وردّد', 'LISTEN & REPEAT')}</Eyebrow>
                  {[
                    { text: 'I am Amina. I am from Morocco.', key: 'ex1' },
                    { text: 'She is a student.', key: 'ex2' },
                    { text: 'We are friends.', key: 'ex3' },
                  ].map((row) => (
                    <div
                      key={row.key}
                      dir="ltr"
                      className="flex items-center gap-3 rounded-[14px] border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] p-3 transition-colors hover:bg-[var(--vxp-primary-tint)]"
                    >
                      <button
                        type="button"
                        onClick={() => playAudio(row.text, row.key)}
                        aria-label={`Listen: ${row.text}`}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)] hover:bg-[var(--vxp-primary)] hover:text-white ${FOCUS_RING}`}
                      >
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <div className="text-[14px] leading-snug">
                        <FormattedText text={row.text.replace(/am|is|are/g, '**$&**')} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other step content: generic examples */}
            {activeStep?.examples && !showGrammarTable && (
              <div className="mt-6 space-y-2">
                <Eyebrow>{T('أمثلة توضيحية', 'EXAMPLES')}</Eyebrow>
                <div className="space-y-2">
                  {activeStep.examples.map((ex, i) => (
                    <div
                      key={i}
                      dir="ltr"
                      className="flex items-center justify-between rounded-[12px] bg-[var(--vxp-surface-2)] px-4 py-3"
                    >
                      <span className="text-[14px] font-semibold text-[var(--vxp-text)]">{ex}</span>
                      <button
                        type="button"
                        onClick={() => playAudio(ex, `ex-${i}`)}
                        className={`text-[var(--vxp-primary)] hover:brightness-110 ${FOCUS_RING}`}
                      >
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step Action Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-[var(--vxp-border)] pt-5">
              <Btn
                variant="outline"
                size="md"
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
              >
                {T('← الخطوة السابقة', '← Previous step')}
              </Btn>

              {activeStep?.type === 'practice' || activeStep?.type === 'check' ? (
                <Btn
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  onClick={() => {
                    setIsExerciseMode(true);
                    setCurrentExerciseIdx(0);
                    setSelectedAnswer('');
                  }}
                >
                  {T('بدء التمارين →', 'Start exercises →')}
                </Btn>
              ) : activeStepIndex < steps.length - 1 ? (
                <Btn
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  onClick={() => {
                    setCompletedSteps((prev) => new Set([...prev, activeStepIndex]));
                    setActiveStepIndex((prev) => prev + 1);
                  }}
                >
                  {T('الخطوة التالية →', 'Next step →')}
                </Btn>
              ) : (
                <Btn
                  variant="success"
                  size="md"
                  icon={Trophy}
                  onClick={() => {
                    setIsExerciseMode(true);
                    setCurrentExerciseIdx(0);
                  }}
                >
                  {T('اجتياز الاختبار النهائي →', 'Take the final check →')}
                </Btn>
              )}
            </div>
          </Card>

          {/* Vocabulary Card (PDF p.5 middle) */}
          {vocabItems.length > 0 && (
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[16px] font-black text-[var(--vxp-text)]">
                  {T('مفردات هذا الدرس', 'Vocabulary for this lesson')}
                </h3>
                <span className="text-[12px] font-semibold text-[var(--vxp-dim)]">
                  {T('من قائمة لانجيك', 'from the existing Langeek set')} · {vocabItems.length}{' '}
                  {T('كلمات', 'words')}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {vocabItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => playAudio(item.term, `vocab-${idx}`)}
                    className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--vxp-mint)] px-3.5 py-1.5 text-[13px] font-extrabold text-[var(--vxp-mint-text)] transition-transform hover:scale-105 active:scale-95 ${FOCUS_RING}`}
                    title={item.ar ? `${item.term} — ${item.ar}` : item.term}
                  >
                    <span>{item.term}</span>
                    <Volume2 className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Audio Card (PDF p.5 bottom) */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  playAudio(
                    listeningLines.join(' '),
                    'dialogue'
                  )
                }
                aria-label={T('تشغيل المحادثة', 'Play audio conversation')}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--vxp-amber)] text-[#D88C34] shadow-sm transition-transform hover:scale-105 active:scale-95 ${FOCUS_RING}`}
              >
                {playingKey === 'dialogue' ? (
                  <Pause className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Play className="ms-0.5 h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-extrabold text-[var(--vxp-text)]">
                  {T('محادثة قصيرة: “سعدت بلقائك”', 'Short conversation: “Nice to meet you”')}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--vxp-track)]">
                    <div
                      className="h-full rounded-full bg-[var(--vxp-amber-text)] transition-all duration-200"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-bold text-[var(--vxp-dim)]">0:42</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar ("IN THIS LESSON", ~4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="p-5 sm:p-6">
            <Eyebrow>{T('في هذا الدرس', 'IN THIS LESSON')}</Eyebrow>

            {/* Steps list */}
            <div className="mt-4 space-y-2">
              {steps.map((st, idx) => {
                const sMeta = STEP_META[st.type] || STEP_META.grammar;
                const Icon = sMeta.icon;
                const isActive = idx === activeStepIndex;
                const isDone = completedSteps.has(idx);

                let itemClass =
                  'border border-transparent bg-transparent text-[var(--vxp-dim)] hover:bg-[var(--vxp-surface-2)]';
                if (isActive) {
                  itemClass =
                    'border-[var(--vxp-primary)]/20 bg-[var(--vxp-primary-tint)] font-extrabold text-[var(--vxp-primary)]';
                } else if (isDone) {
                  itemClass = 'text-[var(--vxp-text)] font-semibold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveStepIndex(idx);
                      setIsExerciseMode(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[12px] p-2.5 text-start transition-all ${itemClass} ${FOCUS_RING}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] ${
                        isActive
                          ? 'bg-[var(--vxp-primary)] text-white shadow-sm'
                          : isDone
                            ? 'bg-[var(--vxp-success-tint)] text-[var(--vxp-success-text)]'
                            : 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]'
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="truncate text-[14px]">
                      {T(sMeta.label.ar, sMeta.label.en)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom progress + requirement notice */}
            <div className="mt-6 border-t border-[var(--vxp-border)] pt-5">
              <ProgressBar
                value={(completedSteps.size + 1) / Math.max(1, steps.length)}
                ariaLabel={T('نسبة إنجاز خطوات الدرس', 'Lesson step progress')}
              />
              <p className="mt-3 text-[12px] font-semibold leading-relaxed text-[var(--vxp-dim)]">
                {T(
                  'اجتز الاختبار بنسبة (≥ 70%) لفتح الدرس التالي.',
                  'Pass the check (≥ 70%) to unlock the next lesson.'
                )}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
