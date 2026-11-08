// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Placement welcome (design page 07, left panel)
//
//  "Where would you like to start?" Two choices, one primary action. The
//  selected card decides what the button does:
//    · Start from A1        → saves A1 as the starting level, opens lesson 1
//    · Take placement test  → goes to the adaptive level test
//  Nothing is marked complete here; earlier levels only unlock for revision
//  after an assessment.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Info, Loader2, Lock, RefreshCcw } from 'lucide-react';
import { _resolveTranslation } from './translations.js';

const t = (lang, ar, en) => _resolveTranslation(lang, ar, en);

export default function PlacementWelcome({
  lang,
  placing = false,
  startState = 'idle',
  startMessage = '',
  onStartA1,
  onTakeTest,
  onSignIn,
  onRecheck,
}) {
  const [choice, setChoice] = useState('a1');

  const options = [
    {
      id: 'a1',
      title: t(lang, 'ابدأ من A1', 'Start from A1'),
      badge: t(lang, 'مُوصى به للمبتدئين', 'Recommended for beginners'),
      body: t(lang, 'ابدأ بالأبجدية والأصوات واتبع المسار كاملاً.', 'Begin with the alphabet and sounds and follow the full path.'),
    },
    {
      id: 'test',
      title: t(lang, 'خذ اختبار تحديد المستوى', 'Take the placement test'),
      badge: null,
      body: t(lang, 'حوالي 10 دقائق. أسئلة تكيّفية تحدد مستوى البداية.', 'About 10 minutes. Adaptive questions find your starting level.'),
    },
  ];

  const primaryLabel = choice === 'a1'
    ? t(lang, 'ابدأ من A1', 'Start from A1')
    : t(lang, 'ابدأ اختبار المستوى', 'Take placement test');

  const onPrimary = () => (choice === 'a1' ? onStartA1() : onTakeTest());

  return (
    <section className="vx-card vx-welcome" aria-labelledby="vx-welcome-title">
      <div>
        <span className="vx-tag">{t(lang, 'مرحباً', 'Welcome')}</span>
        <h1 id="vx-welcome-title" className="vx-welcome-title">
          {t(lang, 'من أين تريد أن تبدأ؟', 'Where would you like to start?')}
        </h1>
        <p className="vx-sm" style={{ marginTop: 8, fontSize: 13 }}>
          {t(
            lang,
            'يمكنك التغيير لاحقاً. لا يتم تخطي أي درس دون إثبات.',
            'You can change this later. No lessons are skipped without proof.',
          )}
        </p>
      </div>

      <div role="radiogroup" aria-label={t(lang, 'نقطة البداية', 'Starting point')} className="vx-welcome-choices">
        {options.map((option) => {
          const selected = choice === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`vx-choice ${selected ? 'is-selected' : ''}`}
              onClick={() => setChoice(option.id)}
            >
              <span className="vx-choice-head">
                <span className="vx-h3">{option.title}</span>
                {option.badge && (
                  <span className="vx-chip" style={{ background: 'var(--vx-card)', fontSize: 11, fontWeight: 700 }}>
                    {option.badge}
                  </span>
                )}
              </span>
              <span className="vx-sm" style={{ display: 'block', marginTop: 6 }}>{option.body}</span>
            </button>
          );
        })}
      </div>

      {startMessage ? (
        <div className={`vx-notice ${startState === 'not-seeded' ? 'is-warn' : 'is-error'}`} role="alert">
          {startState === 'not-seeded' ? <Info size={16} /> : <AlertCircle size={16} />}
          <div className="vx-notice-body">
            <span>{startMessage}</span>
            <div className="vx-notice-actions">
              {startState === 'error-auth' && (
                <button type="button" className="vx-btn is-ghost is-sm" onClick={onSignIn}>
                  <Lock size={13} /> {t(lang, 'تسجيل الدخول', 'Sign in')}
                </button>
              )}
              {startState === 'error' && (
                <button type="button" className="vx-btn is-ghost is-sm" onClick={onStartA1}>
                  <RefreshCcw size={13} /> {t(lang, 'إعادة المحاولة', 'Retry')}
                </button>
              )}
              {startState === 'not-seeded' && (
                <button type="button" className="vx-btn is-ghost is-sm" onClick={onRecheck}>
                  <RefreshCcw size={13} /> {t(lang, 'تحقّق مرة أخرى', 'Check again')}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="vx-btn is-block"
        style={{ marginTop: 'auto' }}
        disabled={placing}
        aria-busy={placing}
        onClick={onPrimary}
      >
        {placing ? t(lang, 'جارٍ البدء…', 'Starting…') : primaryLabel}
        {placing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} className="rtl:rotate-180" />}
      </button>
    </section>
  );
}
