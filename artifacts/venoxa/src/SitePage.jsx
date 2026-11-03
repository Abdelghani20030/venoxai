/**
 * src/SitePage.jsx
 * Real content pages for the footer links (privacy, terms, cookies, faq,
 * help, about, contact, community, premium, report) — replaces the old
 * PlaceholderPage screens for those ids (mobile keeps its placeholder).
 *
 * Page chrome (back button, title, meta line, CTAs) follows the UI
 * language via _resolveTranslation and stays dir-aware like the rest of
 * the app; the English markdown article itself is wrapped in dir="ltr".
 * Tables render inside a horizontally scrollable wrapper (vx-* styles in
 * index.css), Premium gets a sign-up CTA that opens the existing auth
 * modal when signed out, and Report a problem gets a mailto: CTA.
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { easing } from './motion.js';
import { _resolveTranslation } from './translations.js';
import { SITE_PAGES, LAST_UPDATED, SUPPORT_EMAIL } from './content/sitePages.js';
import { ArrowRight, Mail } from 'lucide-react';

function SitePage({ id, lang, setTab, user, onOpenRegister }) {
  const reduced = useReducedMotion();
  const isAr = lang === 'ar';
  const label = (ar, en) => _resolveTranslation(lang, ar, en);
  const page = SITE_PAGES[id];

  if (!page) return null;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easing.out }}
      className="vx-sitepage mx-auto w-full max-w-[760px] pt-2 pb-6 px-1"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Chrome row — back button + editable-web meta, follows the UI language */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <button onClick={() => setTab('dashboard')} className="vx-btn-ghost h-10 px-4 text-[13px]">
          <ArrowRight className="w-4 h-4 rtl:-scale-x-100 order-2" />
          {label('العودة للرئيسية', 'Back to Home')}
        </button>
        <span className="vx-page-muted text-[12.5px] font-semibold" dir="ltr">
          {label('آخر تحديث', 'Last updated')}: {LAST_UPDATED}
        </span>
      </div>

      <h1 className="vx-sitepage-title text-[26px] sm:text-[30px] font-extrabold tracking-tight mb-1">
        {label(page.ar, page.en)}
      </h1>
      <div className="h-[3px] w-12 rounded-full mb-6" style={{ background: 'var(--vx-blue)' }} aria-hidden="true" />

      {/* English article — always LTR; tables scroll horizontally */}
      {page.body ? (
        <div className="vx-sitepage-article" dir="ltr">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: props => (
                <div className="vx-sitepage-tablewrap">
                  <table {...props} />
                </div>
              ),
            }}
          >
            {page.body}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="vx-page-article-running text-[15px] vx-page-muted" dir="ltr">
          {isAr
            ? 'النص الكامل لهذه الصفحة يجري تجهيزه وسيُنشر هنا قريباً.'
            : 'The full text of this page is being finalized and will be published here shortly.'}
        </p>
      )}

      {/* Premium — sign-up CTA while signed out (reuses the auth modal) */}
      {id === 'premium' && page.body && !user && (
        <div className="mt-8">
          <button onClick={() => onOpenRegister && onOpenRegister()} className="vx-btn-blue">
            {isAr ? 'ترقية إلى Premium' : 'Upgrade to Premium'}
          </button>
          <p className="vx-page-muted text-[12.5px] mt-2">
            {isAr ? 'أنشئ حساباً مجانياً أو سجّل دخولك أولاً.' : 'Create a free account or sign in first.'}
          </p>
        </div>
      )}

      {/* Report a problem — mail CTA (no new API routes) */}
      {id === 'report' && page.body && (
        <div className="mt-8">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Problem report')}`}
            className="vx-btn-blue"
            dir="ltr"
          >
            <Mail className="w-4 h-4" />
            {isAr ? 'إرسال تقرير' : 'Send report'}
          </a>
        </div>
      )}
    </motion.div>
  );
}

export default SitePage;
