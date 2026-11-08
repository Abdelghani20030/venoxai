// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Dashboard (approved design page 03 / mobile page 09)
//
//  One primary action. Everything else is secondary: hero with the real next
//  lesson from GET /api/path, journey strip, three stat cards, and a 330px
//  rail with CEFR progress, achievements and words due.
//  All progress comes from the server; the client never derives locking.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Award, BookOpen, Check, Clock, Flame, Lightbulb, Lock, Play,
  RotateCcw, Star, TrendingUp, Trophy, Zap,
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { fetchPathMap, readCachedPathMap } from './pathApi.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_LABEL = {
  A1: { en: 'Beginner', ar: 'مبتدئ' },
  A2: { en: 'Elementary', ar: 'ما قبل المتوسط' },
  B1: { en: 'Intermediate', ar: 'متوسط' },
  B2: { en: 'Upper Intermediate', ar: 'ما فوق المتوسط' },
  C1: { en: 'Advanced', ar: 'متقدم' },
};

const QUOTES = [
  { quote: 'The limits of my language mean the limits of my world.', ar: 'حدود لغتي هي حدود عالمي.', author: 'Ludwig Wittgenstein' },
  { quote: 'One language sets you in a corridor for life. Two languages open every door along the way.', ar: 'لغة واحدة تضعك في ممر مدى الحياة. لغتان تفتحان كل باب على طول الطريق.', author: 'Frank Smith' },
  { quote: 'To have another language is to possess a second soul.', ar: 'أن تمتلك لغة أخرى يعني امتلاك روح ثانية.', author: 'Charlemagne' },
  { quote: 'Knowledge of languages is the doorway to wisdom.', ar: 'معرفة اللغات هي بوابة الحكمة.', author: 'Roger Bacon' },
  { quote: 'A different language is a different vision of life.', ar: 'اللغة المختلفة هي رؤية مختلفة للحياة.', author: 'Federico Fellini' },
];

const t = (lang, ar, en) => _resolveTranslation(lang, ar, en);
const pick = (lang, row, enKey, arKey) => (lang === 'ar'
  ? (row?.[arKey] || row?.[enKey] || '')
  : (row?.[enKey] || row?.[arKey] || ''));

function sumStudySeconds() {
  /* The app mirrors the same usage object into two keys, so read the first
     one that has data instead of summing both (which double-counted time). */
  for (const key of ['venoxa_daily_usage_secs', 'venoxa_usage_time']) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}') || {};
      let seconds = 0;
      for (const value of Object.values(parsed)) {
        const n = Number(value);
        if (Number.isFinite(n)) seconds += n;
      }
      if (seconds > 0) return seconds;
    } catch { /* ignore malformed local data */ }
  }
  return 0;
}

function formatStudy(seconds) {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function greeting(lang) {
  const hour = new Date().getHours();
  if (lang === 'ar') return hour < 12 ? 'صباح الخير' : 'مساء الخير';
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function levelLessons(level) {
  if (!level?.units) return [];
  return level.units.flatMap((unit) => unit.lessons || []);
}

export default function DashboardPage({
  lang,
  user,
  setTab,
  onOpenLesson,
  completedCells = {},
  levelTest = null,
  streakData = { current: 0 },
  wordsLearned = 0,
  dueWords = 0,
  fixture = null,
}) {
  const [map, setMap] = useState(() => fixture || readCachedPathMap());

  useEffect(() => {
    if (fixture) { setMap(fixture); return undefined; }
    let alive = true;
    fetchPathMap().then((res) => {
      if (alive && res.ok && res.data) setMap(res.data);
    });
    return () => { alive = false; };
  }, [fixture]);

  const studySeconds = useMemo(sumStudySeconds, []);
  const xp = useMemo(() => {
    const done = Object.values(completedCells || {}).filter((v) => v === 'done').length;
    return done * 15 + (levelTest?.xpAwarded || 0);
  }, [completedCells, levelTest]);

  const levels = map?.levels?.length
    ? map.levels
    : LEVELS.map((level) => ({ level, published: 0, completed: 0, percent: 0, units: [] }));

  const currentLevelCode = map?.currentLesson?.level || map?.placement?.level || 'A1';
  const currentLevel = levels.find((l) => l.level === currentLevelCode) || levels[0];
  const lessons = levelLessons(currentLevel);
  const currentLesson = map?.currentLesson || null;
  const currentIndex = currentLesson
    ? Math.max(0, lessons.findIndex((l) => l.slug === currentLesson.slug))
    : 0;
  const levelTotal = currentLevel?.published || lessons.length || 0;
  const levelDone = currentLevel?.completed || 0;
  const levelPct = levelTotal ? Math.round((levelDone / levelTotal) * 100) : 0;

  const displayName = (user?.username || user?.email?.split('@')[0] || '');
  const capName = displayName ? displayName.charAt(0).toUpperCase() + displayName.slice(1) : displayName;
  const greetingLine = `${greeting(lang)}${capName ? `, ${capName}` : ''}`;

  const nextLesson = map?.nextLesson || null;
  const nextTitle = currentLesson ? pick(lang, currentLesson, 'titleEn', 'titleAr') : (nextLesson ? pick(lang, nextLesson, 'titleEn', 'titleAr') : null);
  const nextObjective = currentLesson ? pick(lang, currentLesson, 'objectiveEn', 'objectiveAr') : '';
  const estMinutes = currentLesson?.steps?.length ? currentLesson.steps.length * 3 : null;
  const ctaSlug = currentLesson?.slug || null;

  /* Seven nodes: three done, the current lesson, then upcoming locked lessons. */
  const journey = useMemo(() => {
    if (!lessons.length) return [];
    const start = Math.max(0, Math.min(currentIndex - 3, lessons.length - 7));
    return lessons.slice(start, start + 7);
  }, [lessons, currentIndex]);

  const nextInLevel = journey.findIndex((lesson) => lesson.status === 'current');
  const nextUnlock = currentIndex + 2 <= levelTotal
    ? t(lang, `الدرس ${currentIndex + 2}`, `Lesson ${currentIndex + 2}`)
    : t(lang, 'كل الدروس مفتوحة', 'All lessons open');

  const circumference = 317.3;
  const ringOffset = circumference * (1 - Math.max(0, Math.min(100, levelPct)) / 100);

  const achievements = [
    {
      key: 'first', icon: Star, tone: 'is-amber',
      label: t(lang, 'أول درس', 'First lesson'),
      on: (map?.progress?.completedLessons || 0) >= 1,
    },
    {
      key: 'streak', icon: Flame, tone: 'is-mint',
      label: t(lang, '3 أيام متتالية', '3-day streak'),
      on: (streakData?.current || 0) >= 3,
    },
    {
      key: 'ten', icon: Award, tone: 'is-blue',
      label: t(lang, '10 دروس', '10 lessons'),
      on: (map?.progress?.completedLessons || 0) >= 10,
    },
  ];

  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  return (
    <div className="vx-dashboard">
      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className="vx-dashboard-main">
        <div className="vx-mobile-greeting">{greetingLine}</div>
        <div className="vx-mobile-chips">
          <span className="vx-pill is-flame"><Flame size={14} /> {streakData?.current || 0}</span>
          <span className="vx-pill"><Zap size={14} /> <span dir="ltr">{xp} XP</span></span>
        </div>
        <section className="vx-hero" aria-labelledby="vx-dashboard-next">
          <div style={{ minWidth: 0 }}>
            <div className="vx-hero-kicker vx-desktop-kicker">{greetingLine}</div>
            <div className="vx-hero-kicker vx-mobile-kicker">
              {currentLesson
                ? `${t(lang, 'الدرس', 'Lesson')} ${currentIndex + 1} ${t(lang, 'من', 'of')} ${levelTotal} · ${currentLevelCode}`
                : `${t(lang, 'المسار', 'Path')} · ${currentLevelCode}`}
            </div>
            <h1 id="vx-dashboard-next" className="vx-hero-title">
              {nextTitle || t(lang, 'ابدأ رحلتك من A1', 'Start your journey from A1')}
            </h1>
            <div className="vx-hero-copy">
              {currentLesson ? (
                <>
                  {t(lang, `الدرس ${currentIndex + 1} من ${levelTotal}`, `Lesson ${currentIndex + 1} of ${levelTotal}`)}
                  {' · '}{currentLevelCode} {LEVEL_LABEL[currentLevelCode]?.[lang === 'ar' ? 'ar' : 'en'] || ''}
                  <br />
                  {nextObjective || t(lang, 'درس واحد في كل مرة، من A1 إلى C1.', 'One lesson at a time, from A1 to C1.')}
                </>
              ) : (
                t(lang, 'مسار موجّه من A1 إلى C1 — درس واحد في كل مرة.', 'A guided path from A1 to C1 — one lesson at a time.')
              )}
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="vx-btn is-white"
                onClick={() => (ctaSlug ? onOpenLesson(ctaSlug) : setTab('path'))}
              >
                {ctaSlug ? t(lang, 'تابع التعلم', 'Continue learning') : t(lang, 'استعرض المسار', 'View the path')}
                <ArrowRight size={16} style={{ color: '#0E4AA4' }} className="rtl:rotate-180" />
              </button>
              {estMinutes && (
                <span className="vx-est-time" dir="ltr" style={{ fontSize: 12.5, color: '#BFD6F8', fontWeight: 600 }}>
                  ≈ {estMinutes} min
                </span>
              )}
            </div>
          </div>

          <div className="vx-hero-ring" aria-label={t(lang, `${levelPct}% من ${currentLevelCode}`, `${levelPct}% of ${currentLevelCode}`)}>
            <svg width="112" height="112" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="50.5" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="11" />
              <circle
                cx="56" cy="56" r="50.5" fill="none" stroke="#fff" strokeWidth="11"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset .6s ease' }}
              />
            </svg>
            <div className="vx-ringlab" style={{ color: '#fff' }}>
              <b>{levelPct}%</b>
              <span>{currentLevelCode} {t(lang, 'مكتمل', 'done')}</span>
            </div>
          </div>
        </section>

        <section className="vx-card vx-desktop-only" style={{ marginTop: 14 }} aria-label={t(lang, 'رحلتك', 'Your journey')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, gap: 12 }}>
            <div className="vx-h3">{t(lang, 'رحلتك', 'Your journey')} · {currentLevelCode}</div>
            <div className="vx-sm">
              {levelDone} {t(lang, `من ${levelTotal} دروس`, `of ${levelTotal} lessons`)}
              {' · '}{t(lang, 'الفتح القادم', 'next unlock')}: {nextUnlock}
            </div>
          </div>
          <div className="vx-journey-strip">
            {journey.map((lesson, i) => {
              const current = lesson.status === 'current';
              const done = lesson.status === 'completed';
              const locked = lesson.status === 'locked' || lesson.status === 'coming_soon';
              const clickable = !locked && lesson.slug;
              const title = pick(lang, lesson, 'titleEn', 'titleAr');
              return (
                <React.Fragment key={lesson.slug}>
                  {i > 0 && (
                    <span
                      className={`vx-journey-link ${journey[i - 1].status === 'completed' && (done || current) ? 'is-done' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    className={`vx-journey-node ${done ? 'is-done' : current ? 'is-current' : 'is-locked'}`}
                    aria-label={`${title}${locked ? ` — ${t(lang, 'مقفل', 'locked')}` : ''}`}
                    title={title}
                    disabled={!clickable}
                    onClick={() => clickable && onOpenLesson(lesson.slug)}
                  >
                    {done && <Check size={18} strokeWidth={3.2} />}
                    {current && <Play size={16} fill="currentColor" />}
                    {!done && !current && <Lock size={15} strokeWidth={2.2} />}
                  </button>
                </React.Fragment>
              );
            })}
            {nextInLevel === -1 && levelDone >= levelTotal && levelTotal > 0 && (
              <span className="vx-chip is-green" style={{ marginInlineStart: 12 }}>
                <Trophy size={13} /> {t(lang, 'اكتمل المستوى', 'Level complete')}
              </span>
            )}
          </div>
        </section>

        <section className="vx-stat-grid vx-desktop-only" aria-label={t(lang, 'إحصاءاتك', 'Your stats')}>
          <StatCard icon={Flame} tone="amber" value={`${streakData?.current || 0} ${t(lang, 'أيام', 'days')}`} label={t(lang, 'سلسلة التعلم', 'Current streak')} />
          <StatCard icon={BookOpen} tone="mint" value={String(wordsLearned)} label={t(lang, 'كلمات تعلمتها', 'Words learned')} />
          <StatCard icon={Clock} tone="blue" value={formatStudy(studySeconds)} label={t(lang, 'وقت الدراسة', 'Study time')} />
        </section>

        <section className="vx-card vx-tipstrip vx-desktop-only" aria-label={t(lang, 'نصيحة وإلهام', 'Tip and inspiration')}>
          <span className="vx-icon-tile" style={{ background: 'var(--vx-amberbg)', color: 'var(--vx-amberd)', width: 36, height: 36 }}>
            <Lightbulb size={18} />
          </span>
          <div style={{ minWidth: 0, flex: '1 1 240px' }}>
            <div className="vx-h3" style={{ fontSize: 13 }}>{t(lang, 'نصيحة ذكية', 'Smart tip')}</div>
            <div className="vx-sm">{t(lang, 'تدرّب على جملة جديدة كل يوم لتعزيز ثقتك.', 'Practice one new phrase every day to boost your confidence.')}</div>
          </div>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--vx-border)' }} aria-hidden="true" />
          <span className="vx-icon-tile" style={{ background: 'var(--vx-psoft)', color: 'var(--vx-primary)', width: 36, height: 36 }}>
            <TrendingUp size={18} />
          </span>
          <div style={{ minWidth: 0, flex: '1.4 1 300px' }}>
            <div className="vx-h3" style={{ fontSize: 13 }}>{t(lang, 'إلهام اليوم', "Today's inspiration")}</div>
            <div className="vx-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              “{lang === 'ar' ? quote.ar : quote.quote}” — {quote.author}
            </div>
          </div>
        </section>
      </div>

      {/* ── 330px rail ──────────────────────────────────────────────────── */}
      <aside className="vx-dashboard-rail" aria-label={t(lang, 'نظرة سريعة', 'At a glance')}>
        <section className="vx-card">
          <div className="vx-h3" style={{ marginBottom: 12 }}>{t(lang, 'مستويات CEFR', 'CEFR levels')}</div>
          <div>
            {LEVELS.map((code) => {
              const level = levels.find((l) => l.level === code) || { level: code, published: 0, completed: 0, percent: 0 };
              const active = code === currentLevelCode;
              const hasContent = (level.published || 0) > 0;
              const pct = level.percent || 0;
              return (
                <button
                  key={code}
                  type="button"
                  className={`vx-cefr-row ${active ? 'is-active' : ''}`}
                  onClick={() => setTab('path')}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className="vx-cefr-tile">{code}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="vx-cefr-name">{LEVEL_LABEL[code]?.[lang === 'ar' ? 'ar' : 'en']}</span>
                    <span className={`vx-bar vx-cefr-bar ${hasContent ? '' : 'is-empty'}`} style={{ marginTop: 6, height: 6, display: 'block' }}>
                      <i style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                  {hasContent
                    ? <span className="vx-cefr-pct" style={{ fontSize: 12, fontWeight: 800, color: active ? 'var(--vx-primary)' : 'var(--vx-muted2)' }}>{pct}%</span>
                    : <Lock size={14} style={{ color: 'var(--vx-lockicon)' }} />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="vx-card vx-achv-card">
          <div className="vx-h3" style={{ marginBottom: 14 }}>{t(lang, 'الإنجازات', 'Achievements')}</div>
          <div style={{ display: 'flex' }}>
            {achievements.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.key} className={`vx-achv ${a.on ? 'is-on' : ''}`} title={a.label}>
                  <div className={`vx-achv-icon ${a.on ? a.tone : ''}`}><Icon size={22} /></div>
                  <div className="vx-achv-label">{a.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="vx-card vx-rail-words" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
          <span className="vx-icon-tile" style={{ background: 'var(--vx-mint)', color: 'var(--vx-mintd)' }}>
            <RotateCcw size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {dueWords > 0
                ? t(lang, `${dueWords} كلمة مستحقة للمراجعة`, `${dueWords} words due for review`)
                : t(lang, 'لا كلمات مستحقة الآن', 'No words due right now')}
            </div>
            <div className="vx-sm">
              {dueWords > 0
                ? t(lang, 'التكرار المتباعد، 3 دقائق', 'Spaced repetition, 3 min')
                : t(lang, 'عد غداً أو أضف كلمات جديدة', 'Come back tomorrow or add new words')}
            </div>
          </div>
          <button type="button" className="vx-chip" onClick={() => setTab('vocab')} style={{ cursor: 'pointer' }}>
            {t(lang, 'مراجعة', 'Review')}
          </button>
        </section>
      </aside>
    </div>
  );
}

function StatCard({ icon: Icon, tone, value, label }) {
  const tones = {
    amber: { background: 'var(--vx-amberbg)', color: 'var(--vx-amberd)' },
    mint: { background: 'var(--vx-mint)', color: 'var(--vx-mintd)' },
    blue: { background: 'var(--vx-psoft)', color: 'var(--vx-primary)' },
  };
  return (
    <div className="vx-card vx-stat-card">
      <span className="vx-icon-tile" style={tones[tone] || tones.blue}>
        <Icon size={20} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="vx-stat-value">{value}</div>
        <div className="vx-sm">{label}</div>
      </div>
    </div>
  );
}
