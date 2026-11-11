// src/path/LibraryHub.jsx — Phase 7: My Library Hub (spec §5.6, §5.11–5.16, PDF p.8, p.13, p.14)
//
// Features:
//   - Sub-tabs: Vocabulary, Grammar, Skills, Tools
//   - Amber notice banner: "Independent exploration. Browse anything freely. It won't change your Learning Path progress."
//   - Live search across words, topics, rules, tools
//   - 3-column card grid with tinted icon tiles, titles, captions
//   - "Lesson N / In your path" tags linked to path lessons
//   - Full keyboard focus & RTL support

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Headphones,
  Sparkles,
  Search,
  Brain,
  BookText,
  Quote,
  Archive,
  MessageSquare,
  PenTool,
  Volume2,
  ClipboardList,
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
  Layers,
  ChevronRight,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import {
  Btn,
  Card,
  Chip,
  Breadcrumb,
  Eyebrow,
  FOCUS_RING,
  RTL_FLIP,
} from '../ui/index.jsx';

export const PATH_LESSON_TAGS = {
  'turn on': { lessonNo: 12, slug: 'a1-phrasal-verbs-turn-on', level: 'a1' },
  'give up': { lessonNo: 18, slug: 'a1-phrasal-verbs-give-up', level: 'a1' },
  'The verb TO BE': { lessonNo: 3, slug: 'a1-the-verb-to-be', level: 'a1' },
  'Verb TO BE in the present': { lessonNo: 3, slug: 'a1-the-verb-to-be', level: 'a1' },
  'Subject pronouns': { lessonNo: 2, slug: 'a1-subject-pronouns', level: 'a1' },
  'Articles: a / an / the': { lessonNo: 5, slug: 'a1-articles-a-an-the', level: 'a1' },
  'Present Simple: affirmative & negative': { lessonNo: 13, slug: 'a1-present-simple-affirmative-negative', level: 'a1' },
  'Present Simple: questions with do / does': { lessonNo: 14, slug: 'a1-present-simple-questions-do-does', level: 'a1' },
  'Have / Has': { lessonNo: 16, slug: 'a1-have-has', level: 'a1' },
};

export function LibraryHub({ lang = 'en', onNavigate, onOpenLesson }) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'vocab' | 'grammar' | 'skills' | 'tools'
  const [searchQuery, setSearchQuery] = useState('');

  const libraryItems = useMemo(() => [
    // Vocabulary
    {
      group: 'vocab',
      tab: 'vocab',
      title: 'Vocabulary (SRS Review)',
      arTitle: 'مراجعة المفردات (تكرار متباعد)',
      desc: 'Spaced repetition flashcards with US/UK audio.',
      arDesc: 'بطاقات تعليمية ذكية بنظام التكرار المتباعد ونطق أمريكي وبريطاني.',
      level: 'A1–C1',
      icon: Brain,
      tint: 'mint',
      count: 'SRS System',
    },
    {
      group: 'vocab',
      tab: 'langeek',
      title: 'Hello & Goodbye',
      arTitle: 'التحيات والوداع',
      desc: 'Greetings and essential polite phrases.',
      arDesc: 'التحيات والعبارات اليومية الأساسية.',
      level: 'A1',
      icon: BookOpen,
      tint: 'mint',
      count: '24 words',
    },
    {
      group: 'vocab',
      tab: 'langeek',
      title: 'Family',
      arTitle: 'العائلة',
      desc: 'Members of the immediate and extended family.',
      arDesc: 'أفراد الأسرة والعائلة الممتدة.',
      level: 'A1',
      icon: BookOpen,
      tint: 'mint',
      count: '38 words',
    },
    {
      group: 'vocab',
      tab: 'langeek',
      title: 'Food & Drink',
      arTitle: 'الطعام والشراب',
      desc: 'Everyday meals, groceries and dining words.',
      arDesc: 'الوجبات اليومية ومفردات الطعام والمطاعم.',
      level: 'A1',
      icon: BookOpen,
      tint: 'mint',
      count: '52 words',
    },
    {
      group: 'vocab',
      tab: 'phrasal',
      title: 'Phrasal Verbs',
      arTitle: 'الأفعال المركبة',
      desc: 'Common verb + particle combinations in context.',
      arDesc: 'أشهر الأفعال المركبة المستخدمة مع أمثلة سياقية.',
      level: 'A1–B2',
      icon: BookText,
      tint: 'mint',
      pathTag: 'Lessons 12, 18',
    },
    {
      group: 'vocab',
      tab: 'idioms',
      title: 'Slang & Casual English',
      arTitle: 'العامية والإنجليزية الدارجة',
      desc: 'Modern conversational expressions.',
      arDesc: 'تعبيرات المحادثة العصرية واللغة الدارجة.',
      level: 'B1–C1',
      icon: Quote,
      tint: 'mint',
    },
    {
      group: 'vocab',
      tab: 'idioms-proper',
      title: 'Idioms',
      arTitle: 'التعابير الاصطلاحية',
      desc: 'Figurative phrases and their meanings.',
      arDesc: 'التعبيرات المجازية ومعانيها واستخدامها.',
      level: 'B1–C1',
      icon: BookText,
      tint: 'mint',
    },

    // Grammar
    {
      group: 'grammar',
      tab: 'grammar',
      title: 'Present Simple',
      arTitle: 'المضارع البسيط',
      desc: 'Habits, routines and factual statements.',
      arDesc: 'العادات، الروتين والحقائق العامة.',
      level: 'A1 grammar',
      icon: Layers,
      tint: 'blue',
      pathTag: 'Lessons 13, 14',
    },
    {
      group: 'grammar',
      tab: 'grammar',
      title: 'Articles: a / an / the',
      arTitle: 'أدوات التعريف والتنكير',
      desc: 'Definite and indefinite articles.',
      arDesc: 'قواعد استخدام a و an و the بشكل صحيح.',
      level: 'A1 grammar',
      icon: Layers,
      tint: 'blue',
      pathTag: 'Lesson 5',
    },
    {
      group: 'grammar',
      tab: 'grammar',
      title: 'Past Simple',
      arTitle: 'الماضي البسيط',
      desc: 'Completed past actions and regular/irregular verbs.',
      arDesc: 'الأفعال المكتملة في الماضي والأفعال الشاذة.',
      level: 'A2 grammar',
      icon: Layers,
      tint: 'blue',
    },
    {
      group: 'grammar',
      tab: 'grammar',
      title: 'Comprehensive Grammar (AI)',
      arTitle: 'القواعد الشاملة بالذكاء الاصطناعي',
      desc: 'All 60+ grammar topics with instant AI explanations.',
      arDesc: 'أكثر من 60 موضوع قواعد مع شروحات وأمثلة فورية.',
      level: 'A1–C1',
      icon: FileText,
      tint: 'blue',
    },

    // Skills
    {
      group: 'skills',
      tab: 'listening',
      title: 'Listening',
      arTitle: 'مهارة الاستماع',
      desc: 'AI-generated stories with synchronized audio.',
      arDesc: 'قصص ومحادثات صوتية تفاعلية بلهجات متعددة.',
      level: 'A1–C1',
      icon: Headphones,
      tint: 'amber',
    },
    {
      group: 'skills',
      tab: 'reading',
      title: 'Reading (AI)',
      arTitle: 'مهارة القراءة',
      desc: 'Leveled articles with vocabulary tap and comprehension check.',
      arDesc: 'مقالات متدرجة الصعوبة مع ترجمة الكلمات واختبار فهم.',
      level: 'A1–C1',
      icon: Brain,
      tint: 'blue',
    },
    {
      group: 'skills',
      tab: 'speaking',
      title: 'Speaking (Call)',
      arTitle: 'المحادثة والاتصال المباشر',
      desc: 'Voice conversations with AI personas in real time.',
      arDesc: 'محادثات صوتية حية مع معلم أو صديق ذكي.',
      level: 'A1–C1',
      icon: MessageSquare,
      tint: 'mint',
    },
    {
      group: 'skills',
      tab: 'writing',
      title: 'Writing (AI)',
      arTitle: 'مهارة الكتابة',
      desc: 'Sentence and essay feedback with error highlighting.',
      arDesc: 'تصحيح المقالات والنصوص مع بيان أسباب الأخطاء.',
      level: 'A1–C1',
      icon: PenTool,
      tint: 'blue',
    },
    {
      group: 'skills',
      tab: 'pronunciation',
      title: 'Pronunciation (IPA)',
      arTitle: 'النطق والأصوات (IPA)',
      desc: 'Interactive IPA phonetic vowel and consonant charts.',
      arDesc: 'جدول الرموز الصوتية الدولية مع نماذج نطق دقيقة.',
      level: 'All levels',
      icon: Volume2,
      tint: 'blue',
    },
    {
      group: 'skills',
      tab: 'test-gen',
      title: 'Test Generator',
      arTitle: 'منشئ الاختبارات المخصصة',
      desc: 'Generate custom quizzes across 16+ question formats.',
      arDesc: 'إنشاء اختبارات مخصصة بـ 16 نمطاً مختلفاً.',
      level: 'Custom',
      icon: ClipboardList,
      tint: 'amber',
    },

    // Tools
    {
      group: 'tools',
      tab: 'smart-translation',
      title: 'Smart Translation',
      arTitle: 'الترجمة الذكية',
      desc: 'Context-aware bidirectional Arabic ⇄ English.',
      arDesc: 'ترجمة سياقية ذكية بين العربية والإنجليزية.',
      icon: Languages,
      tint: 'blue',
    },
    {
      group: 'tools',
      tab: 'tone-rewriter',
      title: 'Tone Rewriter',
      arTitle: 'إعادة صياغة النبرة',
      desc: 'Transform text to formal, casual, business or friendly.',
      arDesc: 'تحويل الأسلوب إلى رسمي، دارج، مهني أو ودي.',
      icon: Sliders,
      tint: 'amber',
    },
    {
      group: 'tools',
      tab: 'sentence-diagrammer',
      title: 'Sentence Diagrammer',
      arTitle: 'محلل بنية الجملة',
      desc: 'Colour-coded grammatical breakdown by part of speech.',
      arDesc: 'تحليل أجزاء الكلام ووظائف الكلمات بالألوان.',
      icon: GitBranch,
      tint: 'mint',
    },
    {
      group: 'tools',
      tab: 'minimal-pairs',
      title: 'Minimal Pairs',
      arTitle: 'الأزواج الصوتية الدنيا',
      desc: 'Train your ear on tricky similar sounds (ship / sheep).',
      arDesc: 'تدريب الأذن على التمييز بين الأصوات المتقاربة.',
      icon: Ear,
      tint: 'amber',
    },
    {
      group: 'tools',
      tab: 'word-family',
      title: 'Word Family',
      arTitle: 'عائلة الكلمة',
      desc: 'Explore nouns, verbs, adjectives and adverbs for any root.',
      arDesc: 'استكشاف مشتقات الكلمة (اسم، فعل، صفة، ظرف).',
      icon: GitFork,
      tint: 'blue',
    },
    {
      group: 'tools',
      tab: 'collocations',
      title: 'Collocations',
      arTitle: 'متلازمات الكلمات',
      desc: 'Natural word pairings that native speakers use.',
      arDesc: 'الكلمات التي تقترن معاً بشكل طبيعي.',
      icon: Link2,
      tint: 'mint',
    },
    {
      group: 'tools',
      tab: 'etymology',
      title: 'Etymology',
      arTitle: 'أصول الكلمات وتاريخها',
      desc: 'Word origins, Latin/Greek roots and linguistic history.',
      arDesc: 'جذور الكلمات التاريخية واليونانية واللاتينية.',
      icon: ScrollText,
      tint: 'blue',
    },
    {
      group: 'tools',
      tab: 'word-of-day',
      title: 'Word of the Day',
      arTitle: 'كلمة اليوم',
      desc: 'A daily curated word with pronunciation, example & SRS add.',
      arDesc: 'كلمة مختارة يومياً مع أمثلة وإمكانية الإضافة للمراجعة.',
      icon: BookMarked,
      tint: 'mint',
    },
    {
      group: 'tools',
      tab: 'idiom-of-day',
      title: 'Idiom of the Day',
      arTitle: 'تعبير اليوم',
      desc: 'A daily idiom explained with cultural context.',
      arDesc: 'تعبير اصطلاحي يومي مشروح مع سياق الاستخدام.',
      icon: Lightbulb,
      tint: 'amber',
    },
    {
      group: 'tools',
      tab: 'timer',
      title: 'Focus Timer',
      arTitle: 'مؤقت التركيز',
      desc: 'Pomodoro timer that persists across the whole app.',
      arDesc: 'مؤقت بومودورو يستمر في العمل أثناء تنقلك في التطبيق.',
      icon: Clock,
      tint: 'amber',
    },
  ], []);

  // Filter items by sub-tab and search query
  const filteredItems = useMemo(() => {
    let list = libraryItems;
    if (activeTab !== 'all') {
      list = list.filter((item) => item.group === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.arTitle.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.arDesc.toLowerCase().includes(q) ||
          (item.level && item.level.toLowerCase().includes(q))
      );
    }
    return list;
  }, [libraryItems, activeTab, searchQuery]);

  return (
    <div className="vx-font space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        lang={lang}
        items={[
          { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
          { label: T('مكتبتي', 'My Library') },
        ]}
      />

      {/* Sub-Tabs Row (PDF p.8: Vocabulary, Grammar, Skills, Tools) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--vxp-border)] pb-3">
        {[
          { key: 'all', label: { ar: 'الكل', en: 'All Tools' } },
          { key: 'vocab', label: { ar: 'المفردات', en: 'Vocabulary' } },
          { key: 'grammar', label: { ar: 'القواعد', en: 'Grammar' } },
          { key: 'skills', label: { ar: 'المهارات', en: 'Skills' } },
          { key: 'tools', label: { ar: 'الأدوات', en: 'Tools' } },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-[13px] font-extrabold transition-all ${
                isSelected
                  ? 'bg-[var(--vxp-primary)] text-white shadow-sm'
                  : 'bg-[var(--vxp-surface)] text-[var(--vxp-dim)] hover:bg-[var(--vxp-surface-2)] hover:text-[var(--vxp-text)]'
              } ${FOCUS_RING}`}
            >
              {T(tab.label.ar, tab.label.en)}
            </button>
          );
        })}
      </div>

      {/* Amber Notice Banner (PDF p.8) */}
      <div className="flex items-start gap-3 rounded-[18px] border border-amber-300/40 bg-[#FFF7ED] p-4 text-[#9A3412] dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#D88C34]" aria-hidden="true" />
        <div className="text-[13px] leading-relaxed">
          <strong className="font-extrabold">
            {T('استكشاف حر ومستقل.', 'Independent exploration.')}
          </strong>{' '}
          {T(
            'تصفح أي أداة بحرية كاملة دون قيود — لن يؤثر هذا على ترتيب دروسك في مسار التعلم.',
            'Browse anything freely. It will not change your Learning Path progress.'
          )}
        </div>
      </div>

      {/* Search Bar (PDF p.8) */}
      <div className="relative">
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-[var(--vxp-dim)] h-4 w-4 ${
            lang === 'ar' ? 'right-4' : 'left-4'
          }`}
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={T(
            'ابحث عن الكلمات، القواعد، الأدوات...',
            'Search words, topics, rules...'
          )}
          className={`w-full rounded-[16px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] py-3.5 text-[14px] font-semibold text-[var(--vxp-text)] placeholder-[var(--vxp-dim)] shadow-[var(--vxp-shadow)] transition-colors hover:border-[var(--vxp-border-strong)] ${
            lang === 'ar' ? 'pe-4 ps-11' : 'pe-11 ps-11'
          } ${FOCUS_RING}`}
        />
      </div>

      {/* 3-Column Grid of Cards (PDF p.8) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, idx) => {
          const Icon = item.icon;
          const tintClasses =
            item.tint === 'mint'
              ? 'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]'
              : item.tint === 'amber'
                ? 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]'
                : 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]';

          return (
            <button
              key={`${item.tab}-${item.title}-${idx}`}
              type="button"
              onClick={() => onNavigate(item.tab)}
              className={`group flex flex-col justify-between rounded-[20px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-5 text-start shadow-[var(--vxp-shadow)] transition-all hover:border-[var(--vxp-border-strong)] hover:shadow-md ${FOCUS_RING}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${tintClasses}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {item.pathTag && (
                    <Chip variant="mint" icon={MapPin}>
                      {item.pathTag}
                    </Chip>
                  )}
                  {item.level && !item.pathTag && (
                    <span className="rounded-full bg-[var(--vxp-surface-3)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--vxp-dim)]">
                      {item.level}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-[16px] font-extrabold tracking-[-0.01em] text-[var(--vxp-text)] group-hover:text-[var(--vxp-primary)]">
                  {lang === 'ar' ? item.arTitle : item.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--vxp-dim)]">
                  {lang === 'ar' ? item.arDesc : item.desc}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--vxp-border)] pt-3 text-[12px] font-bold text-[var(--vxp-dim)]">
                <span>{item.count || T('استكشف الآن', 'Explore')}</span>
                <ChevronRight
                  className={`h-4 w-4 text-[var(--vxp-dim)] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 ${RTL_FLIP}`}
                  aria-hidden="true"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LibraryToolBreadcrumb({ lang, tab, onNavigate }) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  const TOOL_NAMES = {
    vocab: { group: { ar: 'المفردات', en: 'Vocabulary' }, name: { ar: 'مراجعة المفردات (SRS)', en: 'Vocabulary Review' } },
    phrasal: { group: { ar: 'المفردات', en: 'Vocabulary' }, name: { ar: 'الأفعال المركبة', en: 'Phrasal Verbs' } },
    idioms: { group: { ar: 'المفردات', en: 'Vocabulary' }, name: { ar: 'العامية', en: 'Slang' } },
    'idioms-proper': { group: { ar: 'المفردات', en: 'Vocabulary' }, name: { ar: 'التعابير الاصطلاحية', en: 'Idioms' } },
    langeek: { group: { ar: 'المفردات', en: 'Vocabulary' }, name: { ar: 'لانجيك (PDF)', en: 'Langeek' } },
    grammar: { group: { ar: 'القواعد', en: 'Grammar' }, name: { ar: 'القواعد الشاملة (AI)', en: 'Grammar (AI)' } },
    listening: { group: { ar: 'المهارات', en: 'Skills' }, name: { ar: 'الاستماع', en: 'Listening' } },
    reading: { group: { ar: 'المهارات', en: 'Skills' }, name: { ar: 'القراءة (AI)', en: 'Reading (AI)' } },
    speaking: { group: { ar: 'المهارات', en: 'Skills' }, name: { ar: 'المحادثة والاتصال', en: 'Speaking (Call)' } },
    writing: { group: { ar: 'المهارات', en: 'Skills' }, name: { ar: 'الكتابة (AI)', en: 'Writing (AI)' } },
    pronunciation: { group: { ar: 'المهارات', en: 'Skills' }, name: { ar: 'النطق والأصوات (IPA)', en: 'Pronunciation (IPA)' } },
    'test-gen': { group: { ar: 'المهارات', en: 'Skills' }, name: { ar: 'منشئ الاختبارات', en: 'Test Generator' } },
    'smart-translation': { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'الترجمة الذكية', en: 'Smart Translation' } },
    'tone-rewriter': { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'إعادة صياغة النبرة', en: 'Tone Rewriter' } },
    'sentence-diagrammer': { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'محلل الجمل', en: 'Sentence Diagrammer' } },
    'minimal-pairs': { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'الأزواج الصوتية الدنيا', en: 'Minimal Pairs' } },
    'word-family': { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'عائلة الكلمة', en: 'Word Family' } },
    collocations: { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'متلازمات الكلمات', en: 'Collocations' } },
    etymology: { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'أصول الكلمات', en: 'Etymology' } },
    'word-of-day': { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'كلمة اليوم', en: 'Word of the Day' } },
    'idiom-of-day': { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'تعبير اليوم', en: 'Idiom of the Day' } },
    timer: { group: { ar: 'الأدوات', en: 'Tools' }, name: { ar: 'مؤقت التركيز', en: 'Focus Timer' } },
  };

  const meta = TOOL_NAMES[tab];
  if (!meta) return null;

  return (
    <div className="vx-font mb-6">
      <Breadcrumb
        lang={lang}
        items={[
          { label: T('الرئيسية', 'Dashboard'), onClick: () => onNavigate('dashboard') },
          { label: T('مكتبتي', 'My Library'), onClick: () => onNavigate('library') },
          { label: T(meta.group.ar, meta.group.en), onClick: () => onNavigate('library') },
          { label: T(meta.name.ar, meta.name.en) },
        ]}
      />
    </div>
  );
}
