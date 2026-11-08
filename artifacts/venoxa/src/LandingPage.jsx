// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Welcome / home screen for visitors who are not signed in.
//
//  Shown in place of the Dashboard until someone signs in. It borrows the
//  approved design language (navy hero card, journey strip, vx tokens) and
//  its copy from the design deck: a guided CEFR path, sequential unlocking,
//  and every existing tool kept in My Library.
//
//  The journey strip is an illustration, not the visitor's progress.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { ArrowRight, Check, Library, Lock, Play, Route } from 'lucide-react';
import { _resolveTranslation } from './translations.js';

const t = (lang, ar, en) => _resolveTranslation(lang, ar, en);

const EXAMPLE_JOURNEY = ['done', 'done', 'done', 'current', 'locked', 'locked', 'locked'];

export default function LandingPage({ lang, setTab, onOpenRegister, onOpenLogin }) {
  const steps = [
    {
      title: t(lang, 'ابدأ من مكانك الصحيح', 'Start where you belong'),
      body: t(
        lang,
        'ابدأ من A1، أو خُذ اختبار تحديد المستوى (حوالي 10 دقائق) ليضعك في نقطة البداية المناسبة.',
        'Begin at A1, or take the placement test (about 10 minutes) and we will find your starting level.',
      ),
    },
    {
      title: t(lang, 'درس واحد في كل مرة', 'One lesson at a time'),
      body: t(
        lang,
        'كل درس يجمع القواعد والمفردات والاستماع والتدريب. اجتز الاختبار ليُفتح الدرس التالي.',
        'Each lesson bundles grammar, vocabulary, listening and practice. Pass its check to unlock the next one.',
      ),
    },
    {
      title: t(lang, 'استكشف بحرية', 'Explore freely'),
      body: t(
        lang,
        'كل الأدوات التي تعرفها، من المراجعة المتباعدة إلى المحادثة الصوتية، تبقى في مكتبتي.',
        'Every tool you already know, from spaced repetition to voice calls, stays in My Library.',
      ),
    },
  ];

  return (
    <div className="vx-landing">
      <section className="vx-hero vx-landing-hero" aria-labelledby="vx-landing-title">
        <span className="vx-hero-kicker">Venoxa AI</span>
        <h1 id="vx-landing-title" className="vx-landing-title">
          {t(lang, 'رحلة إنجليزية موجّهة، وليست صندوق أدوات.', 'A guided English journey, not a toolbox.')}
        </h1>
        <p className="vx-hero-copy">
          {t(
            lang,
            'مسار CEFR من A1 إلى C1، وخطوة واضحة تالية دائماً، ودروس تُفتح تباعاً.',
            'A CEFR path from A1 to C1, one clear next step, and lessons that unlock as you go.',
          )}
        </p>
        <div className="vx-landing-actions">
          <button type="button" className="vx-btn is-white" onClick={onOpenRegister}>
            {t(lang, 'إنشاء حساب', 'Create an account')}
            <ArrowRight size={16} style={{ color: '#0E4AA4' }} className="rtl:rotate-180" />
          </button>
          <button type="button" className="vx-btn vx-landing-ghost" onClick={onOpenLogin}>
            {t(lang, 'تسجيل الدخول', 'Sign in')}
          </button>
          <button type="button" className="vx-landing-link" onClick={() => setTab('library')}>
            <Library size={15} />
            {t(lang, 'تصفّح الأدوات', 'Browse the tools')}
          </button>
        </div>
      </section>

      <section className="vx-card" aria-label={t(lang, 'مثال على المسار', 'Example path')}>
        <div className="vx-landing-example-head">
          <span className="vx-h3">{t(lang, 'هكذا يبدو مسارك', 'What your path looks like')}</span>
          <span className="vx-sm">{t(lang, 'مثال توضيحي · A1', 'Illustration · A1')}</span>
        </div>
        <div className="vx-journey-strip" aria-hidden="true">
          {EXAMPLE_JOURNEY.map((state, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span className={`vx-journey-link ${EXAMPLE_JOURNEY[i - 1] === 'done' && state !== 'locked' ? 'is-done' : ''}`} />
              )}
              <span className={`vx-journey-node ${state === 'done' ? 'is-done' : state === 'current' ? 'is-current' : 'is-locked'}`}>
                {state === 'done' && <Check size={18} strokeWidth={3.2} />}
                {state === 'current' && <Play size={16} fill="currentColor" />}
                {state === 'locked' && <Lock size={15} />}
              </span>
            </React.Fragment>
          ))}
        </div>
        <p className="vx-sm" style={{ marginTop: 14 }}>
          {t(
            lang,
            'الدروس المقفلة تُفتح عندما تجتاز الدرس الحالي. يتحقق الخادم من ذلك، لا المتصفح.',
            'Locked lessons open when you pass the current one. The server checks this, not the browser.',
          )}
        </p>
      </section>

      <section className="vx-landing-steps" aria-label={t(lang, 'كيف يعمل', 'How it works')}>
        {steps.map((step, i) => (
          <article key={step.title} className="vx-card">
            <span className="vx-landing-step-num" aria-hidden="true">{i + 1}</span>
            <h2 className="vx-h3" style={{ marginTop: 14 }}>{step.title}</h2>
            <p className="vx-sm" style={{ marginTop: 6 }}>{step.body}</p>
          </article>
        ))}
      </section>

      <section className="vx-card vx-landing-cta">
        <div>
          <h2 className="vx-h3" style={{ fontSize: 18 }}>
            {t(lang, 'جاهز لدرسك الأول؟', 'Ready for your first lesson?')}
          </h2>
          <p className="vx-sm" style={{ marginTop: 4 }}>
            {t(lang, 'تقدّمك محفوظ على حسابك.', 'Your progress is saved to your account.')}
          </p>
        </div>
        <button type="button" className="vx-btn" onClick={onOpenRegister}>
          <Route size={16} />
          {t(lang, 'ابدأ المسار', 'Start the path')}
        </button>
      </section>
    </div>
  );
}
