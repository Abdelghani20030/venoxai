// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — "My Library" hub (design page 08: nothing is removed).
//
//  Four tabs (Vocabulary, Grammar, Skills, Tools) plus a search field that
//  looks across every tool. Level Test lives in My Progress / Learning Path
//  now, so it is not listed here. The guided course (Learning Path) is
//  promoted as the first card.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import {
  Route, BookOpen, BookText, Quote, Archive, Headphones, Brain,
  MessageSquare, PenTool, Volume2, ClipboardList, FileText, Languages, Sliders,
  GitBranch, Ear, GitFork, Link2, ScrollText, BookMarked, Lightbulb, Clock,
  ChevronRight, Search, Sparkles,
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { readCachedPathMap } from './pathApi.js';
import { Notice } from './ui/vx/index.jsx';

const SECTIONS = [
  {
    key: 'vocab',
    titleAr: 'المفردات',
    titleEn: 'Vocabulary',
    tone: 'mint',
    items: [
      { id: 'vocab', ar: 'الكلمات والمراجعة', en: 'Vocabulary (SRS)', icon: BookOpen, badgeKey: 'vocabDue' },
      { id: 'phrasal', ar: 'الأفعال المركبة', en: 'Phrasal Verbs', icon: BookText },
      { id: 'idioms', ar: 'العامية', en: 'Slang', icon: Quote },
      { id: 'idioms-proper', ar: 'التعابير الاصطلاحية', en: 'Idioms', icon: BookText },
      { id: 'langeek', ar: 'لانجيك (PDF)', en: 'Langeek (PDF)', icon: Archive, badgeKey: 'langeekDue' },
    ],
  },
  {
    key: 'grammar',
    titleAr: 'القواعد',
    titleEn: 'Grammar',
    tone: 'blue',
    items: [
      { id: 'grammar', ar: 'القواعد (AI)', en: 'Grammar (AI)', icon: FileText },
    ],
  },
  {
    key: 'skills',
    titleAr: 'المهارات',
    titleEn: 'Skills',
    tone: 'blue',
    items: [
      { id: 'listening', ar: 'الاستماع', en: 'Listening', icon: Headphones },
      { id: 'reading', ar: 'القراءة', en: 'Reading (AI)', icon: Brain },
      { id: 'speaking', ar: 'المحادثة', en: 'Speaking (Call)', icon: MessageSquare },
      { id: 'writing', ar: 'الكتابة', en: 'Writing (AI)', icon: PenTool },
      { id: 'pronunciation', ar: 'النطق', en: 'Pronunciation', icon: Volume2 },
      { id: 'test-gen', ar: 'منشئ الاختبارات', en: 'Test Generator', icon: ClipboardList },
    ],
  },
  {
    key: 'tools',
    titleAr: 'الأدوات',
    titleEn: 'Tools',
    tone: 'amber',
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

const t = (lang, ar, en) => _resolveTranslation(lang, ar, en);

export default function LibraryPage({ lang, setTab, vocabDueCount = 0, langeekDueCount = 0 }) {
  const [activeKey, setActiveKey] = useState('vocab');
  const [query, setQuery] = useState('');

  const badges = { vocabDue: vocabDueCount, langeekDue: langeekDueCount };
  const searching = query.trim().length > 0;

  const cached = readCachedPathMap();
  const pathPercent = cached?.progress?.publishedLessons
    ? Math.round((cached.progress.completedLessons / cached.progress.publishedLessons) * 100)
    : 0;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SECTIONS.flatMap((section) => section.items.map((item) => ({ ...item, tone: section.tone })))
      .filter((item) => item.en.toLowerCase().includes(q) || item.ar.includes(q));
  }, [query]);

  const activeSection = SECTIONS.find((s) => s.key === activeKey) || SECTIONS[0];
  const shown = searching ? results : activeSection.items.map((item) => ({ ...item, tone: activeSection.tone }));
  const vocabBadge = vocabDueCount + langeekDueCount;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vx-text)' }}>
          {t(lang, 'مكتبتي', 'My Library')}
        </h1>
      </header>

      <Notice tone="warn" icon={Sparkles}>
        {t(
          lang,
          'استكشاف حرّ. تصفّح أي شيء بحرية، ولن يغيّر ذلك تقدّمك في مسار التعلم.',
          'Independent exploration. Browse anything freely. It won’t change your Learning Path progress.',
        )}
      </Notice>

      {/* Guided course promo */}
      <button
        type="button"
        onClick={() => setTab('path')}
        className="vx-link-card"
        aria-label={t(lang, 'افتح مسار التعلم', 'Open the Learning Path')}
      >
        <span className="vx-link-icon"><Route size={20} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="vx-h3" style={{ display: 'block' }}>{t(lang, 'دورة الإنجليزية', 'English course')}</span>
          <span className="vx-sm" style={{ display: 'block' }}>
            {cached?.progress
              ? `${cached.progress.completedLessons}/${cached.progress.publishedLessons} ${t(lang, 'درساً', 'lessons')} · ${pathPercent}%`
              : t(lang, 'المسار الموجّه من A1 إلى C1', 'The guided path from A1 to C1')}
          </span>
        </span>
        <ChevronRight size={18} className="rtl:rotate-180" />
      </button>

      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          aria-hidden="true"
          style={{ position: 'absolute', insetInlineStart: 14, top: 14, color: 'var(--vx-muted)' }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(lang, 'ابحث عن أداة…', 'Search tools…')}
          aria-label={t(lang, 'ابحث في المكتبة', 'Search the library')}
          className="vx-search-input"
          style={{ paddingInlineStart: 38 }}
        />
      </div>

      <div role="tablist" aria-label={t(lang, 'أقسام المكتبة', 'Library sections')} className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => {
          const selected = !searching && section.key === activeKey;
          return (
            <button
              key={section.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => { setQuery(''); setActiveKey(section.key); }}
              className={`vx-chip vx-chip-btn ${selected ? '' : 'is-gray'}`}
              style={{ padding: '7px 14px', fontSize: 13 }}
            >
              {t(lang, section.titleAr, section.titleEn)}
              {section.key === 'vocab' && vocabBadge > 0 && (
                <span className="vx-chip-count">{vocabBadge > 99 ? '99+' : vocabBadge}</span>
              )}
            </button>
          );
        })}
      </div>

      <section role="tabpanel" aria-live="polite">
        {searching && (
          <p className="vx-sm" style={{ marginBottom: 12 }}>
            {results.length > 0
              ? t(lang, `${results.length} نتيجة`, `${results.length} ${results.length === 1 ? 'result' : 'results'}`)
              : t(lang, 'لا توجد نتائج. جرّب كلمة أخرى.', 'No matches. Try another word.')}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {shown.map((item) => {
            const Icon = item.icon;
            const badge = item.badgeKey ? badges[item.badgeKey] || 0 : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`vx-tool-tile is-${item.tone}`}
              >
                <span className="vx-tool-icon"><Icon size={20} /></span>
                <span className="vx-h3">{t(lang, item.ar, item.en)}</span>
                {badge > 0 && (
                  <span className="vx-chip-count">{badge > 99 ? '99+' : badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
