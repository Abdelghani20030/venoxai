// src/path/Screens.jsx — Phase-1 shells for the new path screens.
//
// The real screens land phase by phase (Dashboard §5.1 → Phase 3, Path map
// §5.2 → Phase 4, Lesson player §5.3–5.4 → Phase 5, Placement §5.5 →
// Phase 6, Library hub §5.6/§5.11–5.16 → Phase 7, Progress hub → Phase 8).
// These shells keep every new route working today, already use the final
// design kit, and the Library/Progress hubs are already fully navigable so
// all 26 legacy tools stay reachable (including on mobile, which has no
// drawer any more).

import React from 'react';
import {
  GraduationCap,
  Map as MapIcon,
  BookOpen,
  BarChart3,
  Brain,
  BookText,
  Quote,
  Archive,
  FileText,
  Headphones,
  MessageSquare,
  PenTool,
  Volume2,
  ClipboardList,
  Award,
  Languages,
  Sliders,
  GitBranch,
  Ear,
  GitFork,
  Link2,
  ScrollText,
  BookMarked,
  Lightbulb,
  Clock,
  Calendar,
  User,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import {
  Btn,
  Card,
  Chip,
  Breadcrumb,
  EmptyState,
  Eyebrow,
  FOCUS_RING,
  RTL_FLIP,
} from '../ui/index.jsx';

/* ── /path — Learning Path home (real map arrives in Phase 4) ────────── */

export function PathHomeShell({ lang, onNavigate }) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  return (
    <div className="vx-font space-y-6">
      <Breadcrumb
        lang={lang}
        items={[{ label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') }, { label: T('مسار التعلم', 'Learning Path') }]}
      />
      <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,var(--vxp-hero-a),var(--vxp-hero-b))] p-8 text-white sm:p-10">
        <Eyebrow className="!text-[#9db9e8]">{T('مسار التعلم', 'Learning Path')}</Eyebrow>
        <h1 className="mt-2 max-w-xl text-[28px] font-black leading-tight tracking-[-0.02em] sm:text-[34px]">
          {T('رحلة إنجليزية موجّهة، وليست صندوق أدوات.', 'A guided English journey, not a toolbox.')}
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-white/85">
          {T(
            'من A1 إلى C1، درساً بعد درس. أكمل الدرس الحالي لتفتح الذي بعده — الترتيب يُفرض على الخادم.',
            'A1 → C1, one lesson at a time. Finish the current lesson to unlock the next — the order is enforced by the server.'
          )}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Btn variant="onGradient" size="lg" icon={Sparkles} onClick={() => onNavigate('placement')}>
            {T('ابدأ من مستواك', 'Start where you belong')}
          </Btn>
          <Btn variant="ghost" size="lg" icon={GraduationCap} className="!bg-white/15 !text-white hover:!brightness-110" onClick={() => onNavigate('dashboard')}>
            {T('العودة للوحة التحكم', 'Back to dashboard')}
          </Btn>
        </div>
      </Card>
      <Card>
        <EmptyState
          icon={MapIcon}
          title={T('خريطة المسار قادمة في المرحلة القادمة', 'The path map arrives in the next phase')}
          hint={T(
            'هذه الصفحة ستعرض وحدات A1 → C1 على شكل مسار متعرج بحالات الدروس الخمس (مكتمل، الحالي، مقفل، مراجعة، اختبار).',
            'This page will show the A1 → C1 units as a zig-zag path with the five lesson states (completed, current, locked, revision, assessment).'
          )}
        />
      </Card>
    </div>
  );
}

/* ── /path/:level/:slug — lesson player shell (real player in Phase 5) ─ */

export function LessonShell({ lang, lessonRoute, onNavigate }) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  const level = lessonRoute?.level?.toUpperCase() || 'A1';
  const slug = lessonRoute?.slug || '…';
  return (
    <div className="vx-font space-y-4">
      <Breadcrumb
        lang={lang}
        items={[
          { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
          { label: T('مسار التعلم', 'Learning Path'), onClick: () => onNavigate('path-home') },
          { label: `${level} · ${slug}` },
        ]}
      />
      <Card>
        <EmptyState
          icon={GraduationCap}
          title={T('مشغّل الدروس قادم في مرحلة لاحقة', 'The lesson player arrives in a later phase')}
          hint={`${T('الدرس المطلوب:', 'Requested lesson:')} ${level} / ${slug}`}
          action={
            <Btn variant="ghost" icon={ChevronRight} iconSide="start" onClick={() => onNavigate('path-home')}>
              {T('العودة إلى المسار', 'Back to the path')}
            </Btn>
          }
        />
      </Card>
    </div>
  );
}

/* ── /library — hub (search/tags land in Phase 7; navigation works now) ─ */

const LIBRARY_SECTIONS = [
  {
    key: 'vocab',
    icon: BookOpen,
    title: { ar: 'المفردات', en: 'Vocabulary' },
    items: [
      { tab: 'vocab', icon: Brain, label: { ar: 'الكلمات والمراجعة', en: 'Vocabulary (SRS Review)' } },
      { tab: 'phrasal', icon: BookText, label: { ar: 'الأفعال المركبة', en: 'Phrasal Verbs' } },
      { tab: 'idioms', icon: Quote, label: { ar: 'العامية', en: 'Slang' } },
      { tab: 'idioms-proper', icon: BookText, label: { ar: 'التعابير الاصطلاحية', en: 'Idioms' } },
      { tab: 'langeek', icon: Archive, label: { ar: 'لانجيك (PDF)', en: 'Langeek (PDF)' } },
    ],
  },
  {
    key: 'grammar',
    icon: FileText,
    title: { ar: 'القواعد', en: 'Grammar' },
    items: [{ tab: 'grammar', icon: FileText, label: { ar: 'القواعد (AI)', en: 'Grammar (AI)' } }],
  },
  {
    key: 'skills',
    icon: Headphones,
    title: { ar: 'المهارات', en: 'Skills' },
    items: [
      { tab: 'listening', icon: Headphones, label: { ar: 'الاستماع', en: 'Listening' } },
      { tab: 'reading', icon: Brain, label: { ar: 'القراءة (AI)', en: 'Reading (AI)' } },
      { tab: 'speaking', icon: MessageSquare, label: { ar: 'المحادثة والاتصال', en: 'Speaking (Call)' } },
      { tab: 'writing', icon: PenTool, label: { ar: 'الكتابة (AI)', en: 'Writing (AI)' } },
      { tab: 'pronunciation', icon: Volume2, label: { ar: 'النطق', en: 'Pronunciation' } },
      { tab: 'test-gen', icon: ClipboardList, label: { ar: 'منشئ الاختبارات', en: 'Test Generator' } },
      { tab: 'level-test', icon: Award, label: { ar: 'اختبار المستوى', en: 'Level Test' } },
    ],
  },
  {
    key: 'tools',
    icon: Sparkles,
    title: { ar: 'الأدوات', en: 'Tools' },
    items: [
      { tab: 'smart-translation', icon: Languages, label: { ar: 'الترجمة الذكية', en: 'Smart Translation' } },
      { tab: 'tone-rewriter', icon: Sliders, label: { ar: 'إعادة صياغة النبرة', en: 'Tone Rewriter' } },
      { tab: 'sentence-diagrammer', icon: GitBranch, label: { ar: 'محلّل الجمل', en: 'Sentence Diagrammer' } },
      { tab: 'minimal-pairs', icon: Ear, label: { ar: 'الأزواج الدنيا', en: 'Minimal Pairs' } },
      { tab: 'word-family', icon: GitFork, label: { ar: 'عائلة الكلمة', en: 'Word Family' } },
      { tab: 'collocations', icon: Link2, label: { ar: 'متلازمات الكلمات', en: 'Collocations' } },
      { tab: 'etymology', icon: ScrollText, label: { ar: 'أصول الكلمات', en: 'Etymology' } },
      { tab: 'word-of-day', icon: BookMarked, label: { ar: 'كلمة اليوم', en: 'Word of the Day' } },
      { tab: 'idiom-of-day', icon: Lightbulb, label: { ar: 'تعبير اليوم', en: 'Idiom of the Day' } },
      { tab: 'timer', icon: Clock, label: { ar: 'المؤقت', en: 'Focus Timer' } },
    ],
  },
];

export function LibraryHubShell({ lang, onNavigate }) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  return (
    <div className="vx-font space-y-6">
      <Breadcrumb
        lang={lang}
        items={[{ label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') }, { label: T('مكتبتي', 'My Library') }]}
      />
      <div>
        <Eyebrow>{T('مكتبتي', 'My Library')}</Eyebrow>
        <h1 className="mt-1 text-[26px] font-black tracking-[-0.02em] text-[var(--vxp-text)] sm:text-[30px]">
          {T('كل أدواتك في مكان واحد', 'Every tool, still here')}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--vxp-dim)]">
          {T(
            'كل أداة كانت تعرفها ما زالت تعمل — الآن مرتبطة بمسارك التعليمي.',
            'Every tool you knew still works — now linked to your learning path.'
          )}
        </p>
      </div>
      {LIBRARY_SECTIONS.map((section) => (
        <section key={section.key}>
          <div className="mb-3 flex items-center gap-2">
            <section.icon className="h-4 w-4 text-[var(--vxp-primary)]" aria-hidden="true" />
            <h2 className="text-[15px] font-extrabold text-[var(--vxp-text)]">
              {T(section.title.ar, section.title.en)}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => onNavigate(item.tab)}
                className={`group flex items-center gap-3 rounded-[14px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] px-4 py-3.5 text-start shadow-[var(--vxp-shadow)] transition-colors hover:border-[var(--vxp-border-strong)] hover:bg-[var(--vxp-surface-2)] ${FOCUS_RING}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[var(--vxp-text)]">
                  {T(item.label.ar, item.label.en)}
                </span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 text-[var(--vxp-dim)] transition-transform group-hover:-translate-x-0.5 rtl:-scale-x-100 ${RTL_FLIP}`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ── /progress — hub (overview/results/certificate land in Phase 8) ──── */

export function ProgressHubShell({ lang, onNavigate }) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  const cards = [
    { tab: 'plan', icon: Calendar, tint: 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]', title: T('خطة المذاكرة', 'Study Plan'), desc: T('المولّد الذي تعرفه، أعيد تنظيمه تحت تقدمي.', 'The generator you know, re-homed under My Progress.') },
    { tab: 'profile', icon: User, tint: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]', title: T('الملف الشخصي', 'Profile'), desc: T('أهدافك، إشعاراتك، وتقدمك المحفوظ.', 'Your goals, notifications and saved progress.') },
  ];
  return (
    <div className="vx-font space-y-6">
      <Breadcrumb
        lang={lang}
        items={[{ label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') }, { label: T('تقدمي', 'My Progress') }]}
      />
      <div>
        <Eyebrow>{T('تقدمي', 'My Progress')}</Eyebrow>
        <h1 className="mt-1 text-[26px] font-black tracking-[-0.02em] text-[var(--vxp-text)] sm:text-[30px]">
          {T('تقدمك في لمحة', 'Your progress at a glance')}
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <button
            key={c.tab}
            type="button"
            onClick={() => onNavigate(c.tab)}
            className={`rounded-[20px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-5 text-start shadow-[var(--vxp-shadow)] transition-colors hover:bg-[var(--vxp-surface-2)] ${FOCUS_RING}`}
          >
            <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-[12px] ${c.tint}`}>
              <c.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="text-[16px] font-extrabold text-[var(--vxp-text)]">{c.title}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--vxp-dim)]">{c.desc}</p>
          </button>
        ))}
      </div>
      <Card>
        <EmptyState
          icon={BarChart3}
          title={T('النتائج والشهادات قادمة في مرحلة لاحقة', 'Results & certificates arrive in a later phase')}
          hint={T(
            'ستجمع هذه الصفحة نسبة إنجاز المسار، النتائج، الشهادة، وسجل النشاط.',
            'This hub will host the path-completion ring, results, your certificate and the activity log.'
          )}
        />
      </Card>
      <Chip variant="grey" icon={Sparkles}>
        {T('قيد البناء — المرحلة 8', 'Under construction — Phase 8')}
      </Chip>
    </div>
  );
}
