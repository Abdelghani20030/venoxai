// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — "My Library" hub (Phase 4, PDF page 02: nothing is removed).
//
//  Grammar, vocabulary, skills and all tools keep their originals — they are
//  reachable from this single grid instead of three separate nav menus. The
//  guided English course (Learning Path) is promoted as the first card.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
  Route, BookOpen, BookText, Quote, Archive, Award, Headphones, Brain,
  MessageSquare, PenTool, Volume2, ClipboardList, FileText, Languages, Sliders,
  GitBranch, Ear, GitFork, Link2, ScrollText, BookMarked, Lightbulb, Clock,
  ChevronRight, Sparkles,
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { readCachedPathMap } from './pathApi.js';

const SECTIONS = [
  {
    key: 'vocab',
    titleAr: 'المفردات',
    titleEn: 'Vocabulary',
    accent: 'emerald',
    items: [
      { id: 'vocab', ar: 'الكلمات والمراجعة', en: 'Vocabulary (SRS)', icon: BookOpen, badgeKey: 'vocabDue' },
      { id: 'phrasal', ar: 'الأفعال المركبة', en: 'Phrasal Verbs', icon: BookText },
      { id: 'idioms', ar: 'العامية', en: 'Slang', icon: Quote },
      { id: 'idioms-proper', ar: 'التعابير الاصطلاحية', en: 'Idioms', icon: BookText },
      { id: 'langeek', ar: 'لانجيك (PDF)', en: 'Langeek (PDF)', icon: Archive, badgeKey: 'langeekDue' },
    ],
  },
  {
    key: 'skills',
    titleAr: 'المهارات',
    titleEn: 'Skills',
    accent: 'sky',
    items: [
      { id: 'level-test', ar: 'اختبار المستوى', en: 'Level Test', icon: Award },
      { id: 'listening', ar: 'الاستماع', en: 'Listening', icon: Headphones },
      { id: 'reading', ar: 'القراءة', en: 'Reading (AI)', icon: Brain },
      { id: 'speaking', ar: 'المحادثة', en: 'Speaking (Call)', icon: MessageSquare },
      { id: 'writing', ar: 'الكتابة', en: 'Writing (AI)', icon: PenTool },
      { id: 'pronunciation', ar: 'النطق', en: 'Pronunciation', icon: Volume2 },
      { id: 'test-gen', ar: 'منشئ الاختبارات', en: 'Test Generator', icon: ClipboardList },
    ],
  },
  {
    key: 'grammar',
    titleAr: 'القواعد',
    titleEn: 'Grammar',
    accent: 'violet',
    items: [
      { id: 'grammar', ar: 'القواعد (AI)', en: 'Grammar (AI)', icon: FileText },
    ],
  },
  {
    key: 'tools',
    titleAr: 'أدوات الذكاء الاصطناعي',
    titleEn: 'AI Tools',
    accent: 'amber',
    items: [
      { id: 'smart-translation', ar: 'الترجمة الذكية', en: 'Smart Translation', icon: Languages },
      { id: 'tone-rewriter', ar: 'إعادة صياغة النبرة', en: 'Tone Rewriter', icon: Sliders },
      { id: 'sentence-diagrammer', ar: 'محلّل الجمل', en: 'Sentence Diagrammer', icon: GitBranch },
      { id: 'minimal-pairs', ar: 'الأزواج الدنيا', en: 'Minimal Pairs', icon: Ear },
      { id: 'word-family', ar: 'عائلة الكلمة', en: 'Word Family', icon: GitFork },
      { id: 'collocations', ar: 'متلازمات الكلمات', en: 'Collocations', icon: Link2 },
      { id: 'etymology', ar: 'أصول الكلمات', en: 'Etymology', icon: ScrollText },
      { id: 'word-of-day', ar: 'كلمة اليوم', en: 'Word of the Day', icon: BookMarked },
      { id: 'idiom-of-day', ar: 'تعبير اليوم', en: 'Idiom of the Day', icon: Lightbulb },
      { id: 'timer', ar: 'المؤقت', en: 'Focus Timer', icon: Clock },
    ],
  },
];

const ACCENTS = {
  emerald: { icon: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400', chip: 'bg-white/70 dark:bg-emerald-500/10 border-emerald-500/20' },
  sky: { icon: 'bg-sky-500/15 text-sky-500 dark:text-sky-400', chip: 'bg-white/70 dark:bg-sky-500/10 border-sky-500/20' },
  violet: { icon: 'bg-violet-500/15 text-violet-500 dark:text-violet-400', chip: 'bg-white/70 dark:bg-violet-500/10 border-violet-500/20' },
  amber: { icon: 'bg-amber-500/15 text-amber-500 dark:text-amber-400', chip: 'bg-white/70 dark:bg-amber-500/10 border-amber-500/20' },
};

export default function LibraryPage({ lang, theme, setTab, vocabDueCount = 0, langeekDueCount = 0 }) {
  const title = _resolveTranslation(lang, 'مكتبتي', 'My Library');
  const subtitle = _resolveTranslation(
    lang,
    'كل أدواتك في مكان واحد — والمسار الإنجليزي الموجّه في المقدمة.',
    'Your tools, one place — with the guided English course up front.',
  );
  const course = _resolveTranslation(lang, 'دورة الإنجليزية', 'English Course');
  const courseSub = _resolveTranslation(lang, 'المشوار الموجّه من A1 إلى C1', 'The guided path from A1 to C1');
  const badges = { vocabDue: vocabDueCount, langeekDue: langeekDueCount };

  const cached = readCachedPathMap();
  const pathPercent = cached?.progress?.publishedLessons
    ? Math.round((cached.progress.completedLessons / cached.progress.publishedLessons) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Guided course promo */}
      <button
        type="button"
        onClick={() => setTab('path')}
        className="group w-full text-start rounded-3xl p-6 sm:p-8 premium-card border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-transparent to-violet-500/10 hover:ring-2 hover:ring-sky-400/40 transition-all"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-500 dark:text-sky-400">
              <Route size={28} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 dark:text-sky-400">
                {_resolveTranslation(lang, 'المسار الموجّه', 'Guided path')}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{course}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{courseSub}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {cached?.progress && (
              <div className="text-end">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pathPercent}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {cached.progress.completedLessons}/{cached.progress.publishedLessons}
                </p>
              </div>
            )}
            <span className="grid place-items-center w-10 h-10 rounded-full border border-sky-500/30 text-sky-500 dark:text-sky-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <ChevronRight size={18} className="rtl:rotate-180" />
            </span>
          </div>
        </div>
      </button>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </header>

      {SECTIONS.map((section) => {
        const accent = ACCENTS[section.accent];
        return (
          <section key={section.key}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
              <Sparkles size={12} />
              {_resolveTranslation(lang, section.titleAr, section.titleEn)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = item.badgeKey ? badges[item.badgeKey] || 0 : 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`group text-start rounded-2xl p-4 premium-card border ${accent.chip} hover:ring-2 hover:ring-sky-400/30 hover:-translate-y-0.5 transition-all`}
                  >
                    <span className={`grid place-items-center w-10 h-10 rounded-xl ${accent.icon}`}>
                      <Icon size={20} />
                    </span>
                    <span className="mt-3 block text-sm font-bold text-gray-900 dark:text-white leading-snug">
                      {_resolveTranslation(lang, item.ar, item.en)}
                    </span>
                    {badge > 0 && (
                      <span className="mt-1 inline-block px-1.5 py-0.5 rounded-md bg-rose-500/15 text-[10px] font-bold text-rose-500 dark:text-rose-400">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
