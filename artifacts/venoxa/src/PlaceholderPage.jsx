/**
 * src/PlaceholderPage.jsx
 * Temporary screens for routes the footer and utility bar link to
 * (privacy, terms, cookies, faq, contact, about, premium, mobile).
 * Real pages will replace these in a later step (PDF §12 — new pages).
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing } from './motion.js';
import { _resolveTranslation } from './translations.js';
import { Sparkles, ArrowRight, Mail } from 'lucide-react';

const PLACEHOLDER_PAGES = {
  privacy:  { ar: 'سياسة الخصوصية',   en: 'Privacy Policy',   icon: '📄' },
  terms:    { ar: 'شروط الخدمة',      en: 'Terms of Service', icon: '📋' },
  cookies:  { ar: 'سياسة الكوكيز',    en: 'Cookie Policy',    icon: '🍪' },
  faq:      { ar: 'الأسئلة الشائعة',  en: 'FAQ',              icon: '❓' },
  contact:  { ar: 'اتصل بنا',         en: 'Contact us',       icon: '✉️' },
  about:    { ar: 'من نحن',           en: 'About us',         icon: 'ℹ️' },
  premium:  { ar: 'Premium',          en: 'Premium',          icon: '👑' },
  mobile:   { ar: 'تطبيق الجوال',     en: 'Mobile App',       icon: '📱' },
};

function PlaceholderPage({ id, lang, theme, setTab }) {
  const reduced = useReducedMotion();
  const isAr = lang === 'ar';
  const page = PLACEHOLDER_PAGES[id] || { ar: id, en: id, icon: '🚧' };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easing.out }}
      className="min-h-[60vh] flex items-center justify-center py-10"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="vx-placeholder-card w-full max-w-xl p-10 text-center flex flex-col items-center gap-5 relative overflow-hidden">
        {/* soft blue radial glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(10,120,214,0.35), transparent 65%)' }}
        />
        <span className="text-5xl relative z-10" aria-hidden="true">{page.icon}</span>
        <h1 className="relative z-10 text-2xl font-extrabold">
          {isAr ? page.ar : page.en}
        </h1>
        <p className="relative z-10 text-sm vx-page-muted max-w-xs leading-relaxed">
          {isAr
            ? 'هذه الصفحة قيد الإعداد وستتوفر قريباً. في الوقت الحالي، ابدأ باختبار المستوى أو عد إلى الرئيسية.'
            : 'This page is on the way — it ships in an upcoming step. For now, take the level test or head back home.'}
        </p>
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 mt-1">
          <button
            onClick={() => setTab('level-test')}
            className="vx-btn-blue"
          >
            {isAr ? 'ابدأ اختبار المستوى' : 'Take the level test'}
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
          <button
            onClick={() => setTab('dashboard')}
            className="vx-btn-ghost"
          >
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
          <a
            href="mailto:support@venoxa.ai"
            className="vx-footer-link text-[13px] font-bold vx-page-muted"
            dir="ltr"
          >
            <Mail className="w-3.5 h-3.5" />
            support@venoxa.ai
          </a>
        </div>
        <span className="absolute bottom-3 flex items-center gap-1 text-[11px] vx-page-muted opacity-70">
          <Sparkles className="w-3 h-3" />
          {isAr ? 'قريباً جداً' : 'Coming soon'}
        </span>
      </div>
    </motion.div>
  );
}

export default PlaceholderPage;
