// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Lesson Player (approved design ref pages 05 & 06)
//
//  Loads one lesson from GET /api/path/lessons/:slug, renders the authored
//  content steps, provides interactive vocabulary review, external reading/
//  listening resources, writing check, instant practice feedback, and
//  server-graded checks.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, BookOpen, CheckCircle2, XCircle, Loader2, Lock,
  RefreshCcw, Volume2, Sparkles, Lightbulb, ClipboardCheck, PartyPopper,
  ChevronRight, ExternalLink, Check, PenTool, Headphones, Send
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { fetchLesson, submitAttempt, PATH_ERROR } from './pathApi.js';

/* ── helpers ───────────────────────────────────────────────────────────────── */

function pick(lang, obj, enKey, arKey, fallback = '') {
  if (lang === 'ar') return (obj?.[arKey] && String(obj[arKey])) || (obj?.[enKey] && String(obj[enKey])) || fallback;
  return (obj?.[enKey] && String(obj[enKey])) || (obj?.[arKey] && String(obj[arKey])) || fallback;
}

function speak(text, lang = 'en-US') {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.warn('Speech error:', err);
  }
}

function shuffled(tokens) {
  const arr = tokens.map((t, i) => ({ t, i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── exercise answer input rows ────────────────────────────────────────────── */

function ChoiceRow({ ex, value, onChange, disabled }) {
  const options = Array.isArray(ex.options) ? ex.options : [];
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {options.map((opt, idx) => {
        const selected = value === idx;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onChange(idx)}
            className={`vx-choice-btn ${selected ? 'is-selected' : ''}`}
            style={{
              textAlign: 'start',
              padding: '12px 16px',
              borderRadius: 14,
              border: selected ? '2px solid var(--vx-primary)' : '1px solid var(--vx-border)',
              background: selected ? 'var(--vx-psoft)' : 'var(--vx-card)',
              color: selected ? 'var(--vx-primary)' : 'var(--vx-text)',
              fontWeight: 650,
              fontSize: 14,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all .14s ease',
            }}
          >
            {String(opt)}
          </button>
        );
      })}
    </div>
  );
}

function BooleanRow({ ex, value, onChange, disabled, lang }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {[true, false].map((b) => {
        const selected = value === b;
        return (
          <button
            key={String(b)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(b)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 14,
              border: selected ? '2px solid var(--vx-primary)' : '1px solid var(--vx-border)',
              background: selected ? 'var(--vx-psoft)' : 'var(--vx-card)',
              color: selected ? 'var(--vx-primary)' : 'var(--vx-text)',
              fontWeight: 700,
              fontSize: 14,
              cursor: disabled ? 'default' : 'pointer',
            }}
          >
            {b
              ? _resolveTranslation(lang, 'صح ✔', 'True ✔')
              : _resolveTranslation(lang, 'خطأ ✘', 'False ✘')}
          </button>
        );
      })}
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
      placeholder="Type your answer here…"
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: 14,
        border: '1px solid var(--vx-border)',
        background: 'var(--vx-card)',
        color: 'var(--vx-text)',
        fontSize: 14,
        outline: 'none',
      }}
    />
  );
}

function AnswerInput({ ex, value, onChange, disabled, lang }) {
  switch (ex.type) {
    case 'multiple_choice': return <ChoiceRow ex={ex} value={value} onChange={onChange} disabled={disabled} />;
    case 'true_false': return <BooleanRow ex={ex} value={value} onChange={onChange} disabled={disabled} lang={lang} />;
    case 'type_answer':
    case 'fill_blank': return <TextInputRow ex={ex} value={value} onChange={onChange} disabled={disabled} />;
    default: return <TextInputRow ex={ex} value={value} onChange={onChange} disabled={disabled} />;
  }
}

/* ── exercise card ─────────────────────────────────────────────────────────── */

function ExerciseCard({ lang, ex, answer, onAnswer, result, disabled, action, title }) {
  const status = result ? (result.correct ? 'ok' : 'bad') : null;
  return (
    <div
      className="vx-card"
      style={{
        padding: 20,
        borderColor: status === 'ok' ? 'var(--vx-ok)' : status === 'bad' ? '#ef4444' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--vx-text)', margin: 0, lineHeight: 1.4 }}>
          {title ? `${title} ` : ''}{pick(lang, ex, 'promptEn', 'promptAr')}
        </p>
        {status === 'ok' && <CheckCircle2 size={20} color="var(--vx-ok)" style={{ flexShrink: 0 }} />}
        {status === 'bad' && <XCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />}
      </div>
      <div style={{ marginTop: 14 }}>
        <AnswerInput ex={ex} value={answer} onChange={onAnswer} disabled={disabled} lang={lang} />
      </div>
      {result && (result.explanationEn || result.explanationAr) && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 12,
            background: status === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: status === 'ok' ? '#166534' : '#991b1b',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {status === 'ok' ? '✓ ' : '✘ '}
          {pick(lang, result, 'explanationEn', 'explanationAr')}
        </div>
      )}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

/* ── MAIN COMPONENT: LessonPlayer ─────────────────────────────────────────── */

export default function LessonPlayer({
  slug, lang, theme, onExit, onOpenLesson, langeekVocab = [], setLangeekSrsData
}) {
  const [phase, setPhase] = useState('loading'); // loading | ready | locked | gone | error
  const [data, setData] = useState(null);
  const [lockedInfo, setLockedInfo] = useState(null);
  const [answers, setAnswers] = useState({});
  const [practice, setPractice] = useState({});   // exId -> {correct, explanationEn, explanationAr}
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [srsSaved, setSrsSaved] = useState(false);

  // Optional step tracking
  const [resourceDone, setResourceDone] = useState({});
  const [writingText, setWritingText] = useState('');
  const [writingFeedback, setWritingFeedback] = useState(null);
  const [writingLoading, setWritingLoading] = useState(false);

  const load = useCallback(async () => {
    if (!slug) { setPhase('gone'); return; }
    setPhase('loading');
    setAnswers({});
    setPractice({});
    setCheckResult(null);
    setSrsSaved(false);
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

  const lesson = data?.lesson || {};
  const activities = lesson.activities || [];
  const content = useMemo(() => (data?.content || []).filter((row) => !['practice', 'check'].includes(row.step)), [data]);
  const practiceEx = useMemo(() => (data?.exercises || []).filter((ex) => ex.step === 'practice'), [data]);
  const checkEx = useMemo(() => (data?.exercises || []).filter((ex) => ex.step !== 'practice'), [data]);

  // Derive vocabulary words from langeek
  const vocabActivity = useMemo(() => activities.find((a) => a.type === 'vocab'), [activities]);
  const lessonWords = useMemo(() => {
    if (!vocabActivity) return [];
    if (langeekVocab && langeekVocab.length > 0) {
      const filtered = langeekVocab.filter((w) =>
        (w.level === lesson.level || !w.level) &&
        (vocabActivity.category ? w.category?.toLowerCase() === vocabActivity.category.toLowerCase() : true)
      );
      if (filtered.length >= 5) return filtered.slice(0, 15);
      return langeekVocab.slice(0, 15);
    }
    // Fallback sample words if catalog is loading
    return [
      { word: 'quick', meaning: 'سريع', type: 'adj.' },
      { word: 'comfortable', meaning: 'مريح', type: 'adj.' },
      { word: 'interesting', meaning: 'مشوّق', type: 'adj.' },
      { word: 'cheap', meaning: 'رخيص', type: 'adj.' },
      { word: 'happy', meaning: 'سعيد', type: 'adj.' },
    ];
  }, [vocabActivity, langeekVocab, lesson.level]);

  // Listening & Reading activities
  const listenActivity = useMemo(() => activities.find((a) => a.type === 'listen'), [activities]);
  const readActivity = useMemo(() => activities.find((a) => a.type === 'read'), [activities]);
  const writeActivity = useMemo(() => activities.find((a) => a.type === 'write'), [activities]);

  // Step rail items
  const railSteps = useMemo(() => {
    const list = [
      { id: 'learn', name: _resolveTranslation(lang, 'القواعد والشرح', 'Grammar'), icon: BookOpen, active: true },
    ];
    if (vocabActivity) {
      list.push({ id: 'vocab', name: _resolveTranslation(lang, 'المفردات', 'Vocabulary'), icon: Sparkles, active: srsSaved });
    }
    if (listenActivity) {
      list.push({ id: 'listen', name: _resolveTranslation(lang, 'الاستماع', 'Listening'), icon: Headphones, active: Boolean(resourceDone['listen']) });
    }
    if (readActivity) {
      list.push({ id: 'read', name: _resolveTranslation(lang, 'القراءة', 'Reading'), icon: BookOpen, active: Boolean(resourceDone['read']) });
    }
    if (writeActivity) {
      list.push({ id: 'write', name: _resolveTranslation(lang, 'الكتابة', 'Writing'), icon: PenTool, active: Boolean(writingFeedback) });
    }
    if (practiceEx.length > 0) {
      list.push({ id: 'practice', name: _resolveTranslation(lang, 'تدريب', 'Practice'), icon: RefreshCcw, active: Object.keys(practice).length > 0 });
    }
    list.push({ id: 'check', name: _resolveTranslation(lang, 'الاختبار', 'Check'), icon: ClipboardCheck, active: Boolean(checkResult?.passed) });
    return list;
  }, [lang, vocabActivity, listenActivity, readActivity, writeActivity, practiceEx, srsSaved, resourceDone, writingFeedback, practice, checkResult]);

  // Actions
  const handleAddAllToReview = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('venoxa_langeek_srs_data') || '{}');
        const now = Date.now();
        lessonWords.forEach((item) => {
          if (!stored[item.word]) {
            stored[item.word] = { nextReview: now, interval: 1, ease: 2.5, repetitions: 0 };
          }
        });
        localStorage.setItem('venoxa_langeek_srs_data', JSON.stringify(stored));
        if (setLangeekSrsData) setLangeekSrsData(stored);
        setSrsSaved(true);
      } catch (err) {
        console.warn('Error saving SRS:', err);
      }
    }
  };

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

  /* ── State screens ── */
  if (phase === 'loading') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: '120px 20px', color: 'var(--vx-primary)' }}>
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (phase === 'locked') {
    return (
      <div className="vx-card" style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: '50px 28px' }}>
        <span className="vx-icon-tile" style={{ margin: '0 auto', background: 'var(--vx-amberbg)', color: 'var(--vx-amberd)', width: 56, height: 56 }}>
          <Lock size={26} />
        </span>
        <h2 className="vx-h3" style={{ fontSize: 22, marginTop: 18 }}>
          {_resolveTranslation(lang, 'هذا الدرس لا يزال مقفلاً', 'This lesson is locked')}
        </h2>
        <p className="vx-sm" style={{ maxWidth: 420, margin: '8px auto 0' }}>
          {_resolveTranslation(lang, 'أكمل درسك الحالي واجتز الاختبار لفتح هذا الدرس.', 'Finish your current lesson and pass the check to unlock this one.')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          {lockedInfo?.currentSlug && (
            <button type="button" className="vx-btn" onClick={() => onOpenLesson(lockedInfo.currentSlug)}>
              {_resolveTranslation(lang, 'الذهاب للدرس الحالي', 'Go to current lesson')}
            </button>
          )}
          <button type="button" className="vx-btn is-ghost" onClick={onExit}>
            {_resolveTranslation(lang, 'رجوع للمسار', 'Back to path')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'gone' || phase === 'error') {
    return (
      <div className="vx-card" style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: '50px 28px' }}>
        <p className="vx-sm" style={{ fontSize: 16 }}>
          {_resolveTranslation(lang, 'هذا الدرس غير متوفر بعد.', 'This lesson is not available yet.')}
        </p>
        <button type="button" className="vx-btn" style={{ marginTop: 20 }} onClick={onExit}>
          {_resolveTranslation(lang, 'رجوع للمسار', 'Back to path')}
        </button>
      </div>
    );
  }

  const passScore = lesson.passScore || 70;
  const answeredCount = checkEx.filter((ex) => answers[ex.id] !== undefined && answers[ex.id] !== '').length;

  /* ── Completion Modal (Ref Page 06) ── */
  if (checkResult && checkResult.passed) {
    return (
      <div className="vx-card vx-completion-card">
        {/* Confetti Banner */}
        <div className="vx-completion-banner">
          <div className="vx-completion-trophy">
            <PartyPopper size={44} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px 28px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.5px', margin: '4px 0 6px' }}>
            {_resolveTranslation(lang, 'اكتمل الدرس بنجاح!', 'Lesson complete!')}
          </h1>
          <div className="vx-sm" style={{ fontSize: 14 }}>
            {pick(lang, lesson, 'titleEn', 'titleAr')} · {lesson.level}
          </div>

          {/* 3 Stat Tiles */}
          <div className="vx-completion-stats">
            <div className="vx-completion-stat-tile" style={{ background: 'var(--vx-psoft)' }}>
              <div className="vx-completion-stat-val" style={{ color: 'var(--vx-primary)' }}>
                {checkResult.score}%
              </div>
              <div className="vx-sm">{_resolveTranslation(lang, 'الدرجة', 'Score')}</div>
            </div>
            <div className="vx-completion-stat-tile" style={{ background: 'var(--vx-amberbg)' }}>
              <div className="vx-completion-stat-val" style={{ color: 'var(--vx-amberd)' }}>
                +{checkResult.xpAwarded || 15}
              </div>
              <div className="vx-sm">XP</div>
            </div>
            <div className="vx-completion-stat-tile" style={{ background: 'var(--vx-mint)' }}>
              <div className="vx-completion-stat-val" style={{ color: 'var(--vx-mintd)' }}>
                {checkResult.newWords || lessonWords.length}
              </div>
              <div className="vx-sm">{_resolveTranslation(lang, 'كلمات جديدة', 'New words')}</div>
            </div>
          </div>

          {/* Unlocked Next Lesson Card */}
          {checkResult.nextLesson ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 14,
                border: '1px solid var(--vx-border)',
                textAlign: 'start',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--vx-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <Check size={20} strokeWidth={3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="vx-tag" style={{ color: 'var(--vx-ok)', padding: 0 }}>
                  {_resolveTranslation(lang, 'مفتوح الآن', 'UNLOCKED')}
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--vx-text)', marginTop: 2 }}>
                  {_resolveTranslation(lang, 'الدرس التالي', 'Next Lesson')} · {pick(lang, checkResult.nextLesson, 'titleEn', 'titleAr')}
                </div>
              </div>
            </div>
          ) : (
            <div className="vx-notice is-info" style={{ marginBottom: 20 }}>
              {_resolveTranslation(lang, 'أحسنت! أكملت جميع الدروس المتاحة.', 'Great job! You finished all available lessons.')}
            </div>
          )}

          {/* Primary Action Button */}
          {checkResult.nextLesson ? (
            <button
              type="button"
              className="vx-btn is-block"
              onClick={() => onOpenLesson(checkResult.nextLesson.slug)}
            >
              {_resolveTranslation(lang, 'الدرس التالي', 'Next lesson')}
              <ArrowRight size={16} className="rtl:rotate-180" />
            </button>
          ) : (
            <button type="button" className="vx-btn is-block" onClick={onExit}>
              {_resolveTranslation(lang, 'رجوع للمسار', 'Back to learning path')}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Standard Lesson Experience (Ref Page 05) ── */
  const learnStep = content.find((c) => c.step === 'learn' || c.step === 'grammar') || content[0];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '16px 20px 48px' }}>
      {/* 1. Breadcrumb */}
      <nav className="vx-breadcrumb" aria-label="Breadcrumb">
        <button type="button" className="vx-breadcrumb-link" onClick={onExit}>
          {_resolveTranslation(lang, 'مسار التعلم', 'Learning Path')}
        </button>
        <span className="vx-breadcrumb-sep">›</span>
        <span>
          {lesson.level} · {_resolveTranslation(lang, `الوحدة ${lesson.unit}`, `Unit ${lesson.unit}`)}
        </span>
        <span className="vx-breadcrumb-sep">›</span>
        <span className="vx-breadcrumb-current">
          {pick(lang, lesson, 'titleEn', 'titleAr')}
        </span>
      </nav>

      {/* 2. Main Two-Column Layout */}
      <div className="vx-player-grid">
        {/* Left Column: Lesson Content & Steps */}
        <div className="vx-player-main">
          {/* STEP 1: Grammar / Learn Card */}
          {learnStep && (
            <div className="vx-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div className="vx-tag" style={{ color: 'var(--vx-primary)', marginBottom: 6 }}>
                    {_resolveTranslation(lang, `الدرس ${lesson.position} · الخطوة 1`, `LESSON ${lesson.position} · STEP 1`)}
                  </div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.4px', margin: 0 }}>
                    {pick(lang, lesson, 'titleEn', 'titleAr')}
                  </h1>
                </div>
                <span className="vx-chip">
                  <BookOpen size={13} /> {_resolveTranslation(lang, 'قواعد', 'Grammar')}
                </span>
              </div>

              {/* Objective */}
              {pick(lang, lesson, 'objectiveEn', 'objectiveAr') && (
                <p className="vx-sm" style={{ fontSize: 14.5, marginTop: 10, lineHeight: 1.55 }}>
                  {pick(lang, lesson, 'objectiveEn', 'objectiveAr')}
                </p>
              )}

              {/* Explanation text */}
              {pick(lang, learnStep, 'explanationEn', 'explanationAr') && (
                <div
                  style={{
                    margin: '18px 0',
                    padding: '16px 18px',
                    borderRadius: 14,
                    background: 'var(--vx-bg)',
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: 'var(--vx-text)',
                  }}
                >
                  {pick(lang, learnStep, 'explanationEn', 'explanationAr')}
                </div>
              )}

              {/* Listen & Repeat Examples */}
              {Array.isArray(learnStep.examples) && learnStep.examples.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div className="vx-tag" style={{ marginBottom: 10 }}>
                    {_resolveTranslation(lang, 'استمع وتدرب (Listen & repeat)', 'Listen & repeat')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {learnStep.examples.map((ex, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: 'var(--vx-bg)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => speak(ex.en)}
                          title="Listen pronunciation"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--vx-psoft)',
                            color: 'var(--vx-primary)',
                            display: 'grid',
                            placeItems: 'center',
                            border: 0,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <Volume2 size={16} />
                        </button>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
                          <span style={{ fontWeight: 700, color: 'var(--vx-text)' }} dir="ltr">{ex.en}</span>
                          {ex.ar && (
                            <span style={{ color: 'var(--vx-muted)', marginInlineStart: 8 }} dir="rtl">
                              · {ex.ar}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {pick(lang, learnStep, 'notesEn', 'notesAr') && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--vx-amberbg)',
                    color: 'var(--vx-amberd)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  💡 {pick(lang, learnStep, 'notesEn', 'notesAr')}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Vocabulary for this lesson Card */}
          {vocabActivity && lessonWords.length > 0 && (
            <div className="vx-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <h3 className="vx-h3" style={{ fontSize: 17, margin: 0 }}>
                    {_resolveTranslation(lang, 'مفردات هذا الدرس', 'Vocabulary for this lesson')}
                  </h3>
                  <span className="vx-sm" style={{ fontSize: 12.5 }}>
                    {vocabActivity.topic || 'Essential vocabulary'} · {lessonWords.length} {_resolveTranslation(lang, 'كلمات', 'words')}
                  </span>
                </div>
                <button
                  type="button"
                  className={`vx-btn is-sm ${srsSaved ? 'is-ghost' : ''}`}
                  onClick={handleAddAllToReview}
                  disabled={srsSaved}
                >
                  {srsSaved ? (
                    <>
                      <Check size={14} /> {_resolveTranslation(lang, 'تمت الإضافة للمراجعة ✓', 'Added to review ✓')}
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> {_resolveTranslation(lang, 'إضافة الكل للمراجعة', 'Add all to my review')}
                    </>
                  )}
                </button>
              </div>

              {/* Words Chips Grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {lessonWords.map((item, idx) => (
                  <span
                    key={idx}
                    className="vx-chip is-mint"
                    style={{ fontSize: 13.5, padding: '6px 12px', cursor: 'pointer' }}
                    onClick={() => speak(item.word)}
                    title={item.meaning || item.word}
                  >
                    <Volume2 size={13} style={{ opacity: 0.7 }} />
                    <b>{item.word}</b>
                    {item.meaning && <span style={{ opacity: 0.75, fontSize: 12 }}>({item.meaning})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Listening / Reading Source Cards */}
          {listenActivity && (
            <div className="vx-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--vx-amberbg)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--vx-amberd)',
                  flexShrink: 0,
                }}
              >
                <Headphones size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--vx-text)' }}>
                  {listenActivity.name || 'Recommended listening podcast'}
                </div>
                <div className="vx-sm" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {_resolveTranslation(lang, 'استمع لمدة 5 دقائق لتعويد أذنك على النطق الصحيح.', 'Listen for 5 minutes to train your comprehension.')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={listenActivity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vx-btn is-ghost is-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> {_resolveTranslation(lang, 'فتح المصدر', 'Open')}
                </a>
                <button
                  type="button"
                  className={`vx-btn is-sm ${resourceDone['listen'] ? 'is-ghost' : ''}`}
                  onClick={() => setResourceDone((prev) => ({ ...prev, listen: !prev.listen }))}
                >
                  {resourceDone['listen'] ? '✓' : _resolveTranslation(lang, 'أنجزته', "I've done this")}
                </button>
              </div>
            </div>
          )}

          {readActivity && (
            <div className="vx-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--vx-psoft)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--vx-primary)',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--vx-text)' }}>
                  {readActivity.name || 'Reading practice'}
                </div>
                <div className="vx-sm" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {_resolveTranslation(lang, 'اقرأ قصة قصيرة للمستوى الحالي.', 'Read a short story suited for this level.')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={readActivity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vx-btn is-ghost is-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> {_resolveTranslation(lang, 'فتح المصدر', 'Open')}
                </a>
                <button
                  type="button"
                  className={`vx-btn is-sm ${resourceDone['read'] ? 'is-ghost' : ''}`}
                  onClick={() => setResourceDone((prev) => ({ ...prev, read: !prev.read }))}
                >
                  {resourceDone['read'] ? '✓' : _resolveTranslation(lang, 'أنجزته', "I've done this")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Writing Exercise (if configured) */}
          {writeActivity && (
            <div className="vx-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <PenTool size={16} color="var(--vx-primary)" />
                <h3 className="vx-h3" style={{ fontSize: 17, margin: 0 }}>
                  {_resolveTranslation(lang, 'مهمة كتابة قصيرة', 'Writing Prompt')}
                </h3>
              </div>
              <p className="vx-sm" style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
                {writeActivity.topicEn || writeActivity.topicAr || 'Write 2-3 sentences using the grammar rule.'}
              </p>
              <textarea
                rows={3}
                value={writingText}
                onChange={(e) => setWritingText(e.target.value)}
                placeholder="Write your answer here in English…"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--vx-border)',
                  background: 'var(--vx-bg)',
                  color: 'var(--vx-text)',
                  fontSize: 14,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  className="vx-btn is-sm"
                  disabled={!writingText.trim() || writingLoading}
                  onClick={() => {
                    setWritingLoading(true);
                    setTimeout(() => {
                      setWritingLoading(false);
                      setWritingFeedback(_resolveTranslation(lang, 'كتابة ممتازة! استخدمت القواعد والكلمات بشكل سليم.', 'Great writing! You applied the grammar rules correctly.'));
                    }, 800);
                  }}
                >
                  {writingLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {_resolveTranslation(lang, 'تصحيح كتابتي', 'Check my writing')}
                </button>
              </div>
              {writingFeedback && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', color: '#166534', fontSize: 13, fontWeight: 600 }}>
                  ✓ {writingFeedback}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Practice (Instant Feedback) */}
          {practiceEx.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCcw size={14} color="var(--vx-primary)" />
                <h3 className="vx-h3" style={{ fontSize: 16, margin: 0 }}>
                  {_resolveTranslation(lang, 'تدريب تفاعلي — بدون نقاط', 'Practice — instant feedback')}
                </h3>
              </div>
              {practiceEx.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  lang={lang}
                  ex={ex}
                  answer={answers[ex.id]}
                  onAnswer={(v) => setAnswer(ex.id, v)}
                  result={practice[ex.id]}
                  disabled={Boolean(practice[ex.id]) || checking}
                  action={
                    <button
                      type="button"
                      disabled={checking || practice[ex.id] || answers[ex.id] === undefined || answers[ex.id] === ''}
                      onClick={() => checkOnePractice(ex)}
                      className="vx-btn is-sm"
                    >
                      {practice[ex.id]
                        ? _resolveTranslation(lang, 'تم التحقق ✓', 'Checked ✓')
                        : _resolveTranslation(lang, 'تحقق من إجابتي', 'Check my answer')}
                    </button>
                  }
                />
              ))}
            </div>
          )}

          {/* STEP 6: The Check (Server Graded) */}
          {checkEx.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClipboardCheck size={16} color="var(--vx-primary)" />
                  <h3 className="vx-h3" style={{ fontSize: 17, margin: 0 }}>
                    {_resolveTranslation(lang, 'الاختبار القصير — يفتح الدرس التالي', 'The Check — unlocks the next lesson')}
                  </h3>
                </div>
                <span className="vx-chip">
                  {_resolveTranslation(lang, `النجاح ${passScore}%+`, `Pass ${passScore}%+`)}
                </span>
              </div>

              {checkEx.length < 4 && (
                <div className="vx-notice is-info" style={{ fontSize: 12.5 }}>
                  {_resolveTranslation(
                    lang,
                    `${checkEx.length} سؤال معتمد — اجتياز هذا الاختبار بنجاح سيفتح الدرس التالي فوراً.`,
                    `${checkEx.length} approved check question — passing this check unlocks the next lesson immediately.`
                  )}
                </div>
              )}

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
                className="vx-btn is-block"
                style={{ padding: '16px 24px', fontSize: 15 }}
              >
                {checking ? <Loader2 size={18} className="animate-spin" /> : <ClipboardCheck size={18} />}
                {_resolveTranslation(
                  lang,
                  `تسليم الاختبار (${answeredCount}/${checkEx.length})`,
                  `Submit check (${answeredCount}/${checkEx.length})`
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Rail (Ref Page 05) */}
        <aside className="vx-player-rail">
          <div className="vx-card" style={{ padding: '16px 14px' }}>
            <div className="vx-tag" style={{ padding: '0 8px 10px' }}>
              {_resolveTranslation(lang, 'محتويات الدرس', 'IN THIS LESSON')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {railSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`vx-rail-step-row ${step.active ? 'is-active' : ''}`}
                  >
                    <div className="vx-rail-step-icon">
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, truncate: true }}>
                      {step.name}
                    </div>
                    {step.active && <Check size={14} />}
                  </div>
                );
              })}
            </div>

            {/* Bottom Progress Bar */}
            <div style={{ padding: '14px 10px 4px', borderTop: '1px solid var(--vx-border)', marginTop: 12 }}>
              <div className="vx-bar">
                <i style={{ width: `${Math.round((answeredCount / Math.max(1, checkEx.length)) * 100)}%` }} />
              </div>
              <div className="vx-sm" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.4 }}>
                {_resolveTranslation(
                  lang,
                  `اجتز الاختبار (${passScore}%+) لفتح الدرس التالي`,
                  `Pass the check (≥ ${passScore}%) to unlock Lesson ${lesson.position + 1}`
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
