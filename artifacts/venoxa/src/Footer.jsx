/**
 * src/Footer.jsx
 * Site footer — PDF §13.
 * Brand column (logo, tagline, contact email, five social icons) +
 * Quick links / Learn / Legal and support columns, and a bottom bar with
 * copyright, repeated legal links and an EN/AR language switch.
 * Footer fades up once at the end of the scroll; links get a blue
 * underline that grows from the centre (.vx-footer-link in index.css).
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing } from './motion.js';
import { _resolveTranslation } from './translations.js';
import {
  Instagram, Twitter, Linkedin, Facebook, Send, Globe,
} from 'lucide-react';

function Footer({ lang, setLang, setTab, user, onOpenRegister, headingTag = 'h4' }) {
  const reduced = useReducedMotion();
  const isAr = lang === 'ar';
  const label = (ar, en) => _resolveTranslation(lang, ar, en);
  // Column heading element: the landing (which already has h2 sections)
  // passes 'h3' so the document outline doesn't skip a level; the app
  // shell keeps the historical 'h4'.
  const HeadingTag = headingTag;

  const quickLinks = [
    { ar: 'الرئيسية', en: 'Home', tab: 'dashboard' },
    { ar: 'من نحن', en: 'About us', tab: 'about' },
    { ar: 'اتصل بنا', en: 'Contact us', tab: 'contact' },
    { ar: 'المجتمع', en: 'Community', tab: 'community' },
    { ar: 'مركز المساعدة', en: 'Help center', tab: 'help' },
    { ar: 'Premium', en: 'Premium', tab: 'premium' },
  ];

  const learnLinks = [
    { ar: 'المفردات', en: 'Vocabulary', tab: 'vocab' },
    { ar: 'الأفعال المركبة', en: 'Phrasal verbs', tab: 'phrasal' },
    { ar: 'التعابير والعامية', en: 'Idioms and slang', tab: 'idioms' },
    { ar: 'القواعد', en: 'Grammar', tab: 'grammar' },
    { ar: 'النطق', en: 'Pronunciation', tab: 'pronunciation' },
    { ar: 'القراءة والاستماع', en: 'Reading and listening', tab: 'reading' },
  ];

  const legalLinks = [
    { ar: 'سياسة الخصوصية', en: 'Privacy Policy', tab: 'privacy' },
    { ar: 'شروط الخدمة', en: 'Terms of Service', tab: 'terms' },
    { ar: 'سياسة الكوكيز', en: 'Cookie Policy', tab: 'cookies' },
    { ar: 'الأسئلة الشائعة', en: 'FAQ', tab: 'faq' },
    { ar: 'الإبلاغ عن مشكلة', en: 'Report a problem', tab: 'report' },
  ];

  const go = (link) => setTab(link.tab);

  const socials = [
    { key: 'instagram', icon: Instagram, title: 'Instagram' },
    { key: 'x', icon: Twitter, title: 'X' },
    { key: 'linkedin', icon: Linkedin, title: 'LinkedIn' },
    { key: 'facebook', icon: Facebook, title: 'Facebook' },
    { key: 'telegram', icon: Send, title: 'Telegram' },
  ];

  return (
    <motion.footer
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: easing.out }}
      className="vx-footer relative z-10 mt-10 px-4 sm:px-6 pt-10 pb-5 print:hidden"
    >
      <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-x-8 gap-y-10">

        {/* Brand column */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
          <button
            onClick={() => setTab('dashboard')}
            className="flex items-center gap-2.5 self-start"
            aria-label="Venoxa AI"
            dir="ltr"
          >
            <span aria-hidden="true" className="w-8 h-8 rounded-[10px] bg-[var(--vx-blue)] flex items-center justify-center text-white font-black text-[15px] leading-none">
              V
            </span>
            <span className="text-[17px] font-extrabold tracking-tight text-inherit">Venoxa AI</span>
          </button>
          <p className="vx-footer-muted text-[13.5px] leading-relaxed max-w-[240px]">
            {label(
              'تعلّم الإنجليزية بالذكاء الاصطناعي، يبدأ من مستواك.',
              'AI-powered English learning that starts with your level.'
            )}
          </p>
          <a
            href="mailto:support@venoxa.ai"
            className="text-[13px] font-bold text-[var(--vx-blue-hover)] hover:underline"
            dir="ltr"
          >
            support@venoxa.ai
          </a>
          <div className="flex items-center gap-2 mt-1" dir="ltr">
            {socials.map(s => (
              <button
                key={s.key}
                className="vx-social-btn"
                title={s.title}
                aria-label={s.title}
                onClick={e => e.preventDefault()}
              >
                <s.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <HeadingTag className="vx-footer-heading">{label('روابط سريعة', 'Quick links')}</HeadingTag>
          <ul className="flex flex-col gap-1.5 items-start">
            {quickLinks.map(link => (
              <li key={link.en}>
                <button onClick={() => go(link)} className="vx-footer-link">
                  {label(link.ar, link.en)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Learn */}
        <div>
          <HeadingTag className="vx-footer-heading">{label('تعرّف على المزيد', 'Learn')}</HeadingTag>
          <ul className="flex flex-col gap-1.5 items-start">
            {learnLinks.map(link => (
              <li key={link.en}>
                <button onClick={() => setTab(link.tab)} className="vx-footer-link">
                  {label(link.ar, link.en)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal and support */}
        <div>
          <HeadingTag className="vx-footer-heading">{label('القانونية والدعم', 'Legal and support')}</HeadingTag>
          <ul className="flex flex-col gap-1.5 items-start">
            {legalLinks.map(link => (
              <li key={link.en}>
                <button onClick={() => go(link)} className="vx-footer-link">
                  {label(link.ar, link.en)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="vx-footer-divider max-w-[1240px] mx-auto mt-10 pt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12.5px] vx-footer-muted">
          <span>© 2026 Venoxa AI</span>
          <span aria-hidden="true">·</span>
          <button onClick={() => setTab('privacy')} className="vx-footer-link text-[12.5px]">
            {label('سياسة الخصوصية', 'Privacy Policy')}
          </button>
          <span aria-hidden="true">·</span>
          <button onClick={() => setTab('terms')} className="vx-footer-link text-[12.5px]">
            {label('شروط الخدمة', 'Terms of Service')}
          </button>
        </div>
        <div className="flex items-center gap-1" dir="ltr">
          <Globe className="w-3.5 h-3.5 vx-footer-muted" />
          <button
            onClick={() => setLang('en')}
            className={`vx-footer-lang ${lang === 'en' ? 'is-active' : ''}`}
          >
            English
          </button>
          <span className="vx-footer-muted" aria-hidden="true">·</span>
          <button
            onClick={() => setLang('ar')}
            className={`vx-footer-lang ${lang === 'ar' ? 'is-active' : ''}`}
          >
            العربية
          </button>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
