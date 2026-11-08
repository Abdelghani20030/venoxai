// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Learning Path (approved design page 04, mobile page 09, dark 10)
//
//  The journey is the interface: a CEFR level switcher, the exact path map
//  geometry from design-reference/PathMap.reference.jsx, a current-lesson card,
//  level progress + legend, and completed lessons to revisit.
//
//  Every node state comes from GET /api/path. The client never derives locking,
//  and locked nodes never navigate (the server enforces that too).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowRight, Award, BookOpen, Check, ClipboardCheck, Compass,
  Headphones, Info, Loader2, Lock, PenTool, RefreshCcw, RotateCcw, Volume2,
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { fetchPathMap, setPlacement } from './pathApi.js';
import PathMap from './PathMap.jsx';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_META = {
  A1: { ar: 'مبتدئ', en: 'Beginner' },
  A2: { ar: 'ما قبل المتوسط', en: 'Elementary' },
  B1: { ar: 'متوسط', en: 'Intermediate' },
  B2: { ar: 'ما فوق المتوسط', en: 'Upper Intermediate' },
  C1: { ar: 'متقدم', en: 'Advanced' },
};

const t = (lang, ar, en) => _resolveTranslation(lang, ar, en);
const pick = (lang, row, enKey, arKey, fallback = '') => (lang === 'ar'
  ? (row?.[arKey] || row?.[enKey] || fallback)
  : (row?.[enKey] || row?.[arKey] || fallback));

function kindLabel(lang, kind) {
  const labels = {
    grammar: t(lang, 'قواعد', 'Grammar'),
    vocabulary: t(lang, 'مفردات', 'Vocabulary'),
    listening: t(lang, 'استماع', 'Listening'),
    reading: t(lang, 'قراءة', 'Reading'),
    writing: t(lang, 'كتابة', 'Writing'),
    speaking: t(lang, 'محادثة', 'Speaking'),
    assessment: t(lang, 'اختبار', 'Assessment'),
    revision: t(lang, 'مراجعة', 'Revision'),
    mixed: t(lang, 'تدريب', 'Practice'),
    vocab: t(lang, 'مفردات', 'Vocabulary'),
    pronunciation: t(lang, 'نطق', 'Pronunciation'),
    practice: t(lang, 'تدريب', 'Practice'),
    check: t(lang, 'اختبار', 'Check'),
  };
  return labels[kind] || t(lang, 'درس', 'Lesson');
}

const STEP_META = {
  grammar: { icon: BookOpen, chip: '' },
  vocab: { icon: PenTool, chip: 'is-mint' },
  vocabulary: { icon: PenTool, chip: 'is-mint' },
  listening: { icon: Headphones, chip: 'is-amber' },
  pronunciation: { icon: Volume2, chip: '' },
  practice: { icon: ClipboardCheck, chip: 'is-gray' },
  check: { icon: Check, chip: 'is-gray' },
};

const CONTENT_STEPS = ['grammar', 'pronunciation', 'listening', 'reading', 'writing', 'speaking'];

function lessonSubtitle(lang, lesson) {
  const steps = (lesson.steps || []).filter((step) => CONTENT_STEPS.includes(step));
  const source = (steps.length ? steps : [lesson.kind]).slice(0, 2);
  return source
    .map((step, index) => {
      const label = kindLabel(lang, step);
      return index > 0 && lang !== 'ar' ? label.toLowerCase() : label;
    })
    .join(' + ');
}

function useIsMobile(maxWidth = 1023) {
  const [mobile, setMobile] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${maxWidth}px)`).matches : false
  ));
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = (e) => setMobile(e.matches);
    setMobile(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [maxWidth]);
  return mobile;
}

/** Turn the server level into the exact PathMap item stream. */
/** First playable A1 lesson in a server map, preferring the current pointer. */
function firstA1Lesson(map) {
  const a1 = (map?.levels || []).find((level) => level.level === 'A1');
  if (!a1 || (a1.published || 0) === 0) return null;
  if (map?.currentLesson?.level === 'A1') return map.currentLesson;
  const lessons = (a1.units || []).flatMap((unit) => unit.lessons || []);
  return lessons.find((lesson) => lesson.status === 'current')
    || lessons.find((lesson) => lesson.status === 'unlocked')
    || lessons.find((lesson) => lesson.kind !== 'revision' && lesson.status !== 'locked')
    || lessons[0]
    || null;
}

function buildPathItems(level, lang) {
  const items = [];
  if (!level) return items;
  for (const unit of level.units || []) {
    const core = (unit.lessons || []).filter((l) => l.kind !== 'revision');
    const unitDone = core.length ? core.filter((l) => l.status === 'completed').length : unit.completed;
    const unitTotal = core.length || unit.published;
    items.push({
      unit: `${t(lang, 'الوحدة', 'Unit')} ${unit.unit} · ${pick(lang, unit, 'titleEn', 'titleAr')}`,
      meta: `${unitDone} ${t(lang, 'من', 'of')} ${unitTotal} ${t(lang, 'مكتمل', 'done')}`,
    });
    for (const lesson of unit.lessons || []) {
      const isRevision = lesson.kind === 'revision';
      let k;
      if (lesson.status === 'completed') k = lesson.kind === 'assessment' ? 'trophy' : 'done';
      else if (lesson.status === 'current') k = 'current';
      else if (lesson.status === 'unlocked') k = 'review';
      else k = lesson.kind === 'assessment' ? 'tlocked' : 'locked';

      const locked = k === 'locked' || k === 'tlocked';
      let s;
      if (isRevision) s = t(lang, 'مراجعة اختيارية', 'Optional revision');
      else if (locked) s = `${t(lang, 'الدرس', 'Lesson')} ${lesson.position}`;
      else s = `${t(lang, 'الدرس', 'Lesson')} ${lesson.position} · ${lessonSubtitle(lang, lesson)}`;

      items.push({
        k,
        t: pick(lang, lesson, 'titleEn', 'titleAr'),
        s,
        id: lesson.slug,
        status: lesson.status,
      });
    }
  }
  return items;
}

export default function LearningPath({ lang, setTab, onOpenLesson, onOpenAuth, fixture = null }) {
  const [phase, setPhase] = useState(fixture ? 'ready' : 'loading');
  const [map, setMap] = useState(fixture || null);
  // idle | placing | error | error-auth | not-seeded — never a silent no-op.
  const [startState, setStartState] = useState('idle');
  const [startMessage, setStartMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    setPhase('loading');
    setStartState('idle');
    setStartMessage('');
    const res = await fetchPathMap();
    if (res.ok && res.data) {
      const data = res.data;
      setMap(data);
      setPhase((data?.progress?.publishedLessons ?? 0) > 0 ? 'ready' : 'empty');
    } else if (res.status === 401) {
      setPhase('auth');
    } else if (res.data?.error === 'schema_missing' || res.status === 503) {
      setPhase('setup');
    } else {
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    if (fixture) { setMap(fixture); setPhase('ready'); return; }
    load();
  }, [fixture, load, reloadKey]);

  const current = map?.currentLesson || null;
  const currentLevelCode = current?.level || map?.placement?.level || 'A1';
  const levels = map?.levels?.length
    ? map.levels
    : LEVELS.map((level) => ({ level, published: 0, completed: 0, percent: 0, units: [] }));

  useEffect(() => {
    if (!selectedLevel) setSelectedLevel(currentLevelCode);
  }, [currentLevelCode, selectedLevel]);

  const selected = useMemo(() => {
    const found = levels.find((l) => l.level === selectedLevel);
    if (found) return found;
    return levels.find((l) => l.published > 0) || levels[0];
  }, [levels, selectedLevel]);

  const selectedLessons = useMemo(
    () => (selected?.units || []).flatMap((u) => u.lessons || []),
    [selected],
  );
  const selectedTotal = selected?.published || selectedLessons.length || 0;
  const selectedDone = selected?.completed || 0;
  const selectedPct = selectedTotal ? Math.round((selectedDone / selectedTotal) * 100) : 0;

  const completed = useMemo(
    () => levels.flatMap((level) => (level.units || []).flatMap((unit) => unit.lessons || []))
      .filter((lesson) => lesson.status === 'completed')
      .sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0))
      .slice(0, 3),
    [levels],
  );

  const placing = startState === 'placing';

  const startFromA1 = async () => {
    if (placing) return;
    setStartState('placing');
    setStartMessage('');
    const res = await setPlacement({ level: 'A1' });

    if (!res.ok) {
      const isDev = import.meta.env.DEV;
      let message;
      if (res.status === 401) {
        message = t(lang, 'انتهت جلستك. سجّل الدخول من جديد ثم أعد المحاولة.', 'Your session expired. Sign in again, then start from A1.');
      } else if (res.data?.error === 'schema_missing' || res.status === 503) {
        message = isDev
          ? t(lang, 'جداول المسار غير موجودة. شغّل migrations/learning-path.sql في Supabase ثم أعد المحاولة.', 'The path tables are not created yet. Run migrations/learning-path.sql in Supabase, then retry.')
          : t(lang, 'المسار غير متاح مؤقتاً. حاول بعد قليل.', 'The path is temporarily unavailable. Please try again shortly.');
      } else if (res.network || res.status === 0) {
        message = t(lang, 'تعذّر الوصول إلى الخادم. تحقّق من الاتصال ثم أعد المحاولة.', 'Could not reach the server. Check your connection and retry.');
      } else if (res.status === 429) {
        message = t(lang, 'محاولات كثيرة. انتظر لحظة ثم أعد المحاولة.', 'Too many attempts. Wait a moment and retry.');
      } else {
        message = t(lang, 'تعذّر حفظ نقطة البداية. أعد المحاولة.', 'Could not save your starting point. Please retry.');
      }
      setStartState(res.status === 401 ? 'error-auth' : 'error');
      setStartMessage(message);
      return;
    }

    const data = res.data;
    const next = firstA1Lesson(data);
    const published = data?.progress?.publishedLessons ?? 0;
    if (!data || published === 0 || !next) {
      setMap(data || map);
      setPhase('empty');
      setStartState('not-seeded');
      setStartMessage(import.meta.env.DEV
        ? t(lang, 'تم حفظ نقطة البداية، لكن دروس A1 لم تُنشر بعد. شغّل seed المحتوى في Supabase ثم أعد المحاولة.', 'Your starting level is saved, but A1 lessons are not published yet. Run the A1 content seed in Supabase, then retry.')
        : t(lang, 'تم حفظ نقطة البداية، لكن دروس A1 غير متاحة بعد. حاول بعد قليل.', 'Your starting level is saved, but A1 lessons are not available yet. Please try again shortly.'));
      return;
    }

    setMap(data);
    setPhase('ready');
    setSelectedLevel('A1');
    setStartState('idle');
    setStartMessage('');
    onOpenLesson(next.slug);
  };

  if (phase === 'loading') {
    return <PathSkeleton lang={lang} />;
  }

  if (phase === 'auth') {
    return (
      <div className="vx-card" style={{ textAlign: 'center', padding: '56px 24px', maxWidth: 640, margin: '48px auto' }}>
        <span className="vx-icon-tile" style={{ margin: '0 auto', background: 'var(--vx-psoft)', color: 'var(--vx-primary)', width: 52, height: 52 }}>
          <Lock size={24} />
        </span>
        <h1 className="vx-h3" style={{ fontSize: 22, marginTop: 16 }}>
          {t(lang, 'سجّل دخولك لبدء المسار', 'Sign in to open your path')}
        </h1>
        <p className="vx-sm" style={{ maxWidth: 380, margin: '8px auto 0' }}>
          {t(lang, 'تقدمك محفوظ على حسابك ولا يمكن كذبه من المتصفح.', 'Your progress lives on your account and cannot be faked from the browser.')}
        </p>
        <button type="button" className="vx-btn" style={{ marginTop: 20 }} onClick={onOpenAuth}>
          {t(lang, 'تسجيل الدخول', 'Sign in')}
        </button>
      </div>
    );
  }

  if (phase === 'setup') {
    const isDev = import.meta.env.DEV;
    return (
      <div className="vx-card" style={{ maxWidth: 680, margin: '48px auto', textAlign: 'center', padding: '44px 28px' }}>
        <span className="vx-icon-tile" style={{ margin: '0 auto', background: 'var(--vx-amberbg)', color: 'var(--vx-amberd)', width: 52, height: 52 }}>
          <Compass size={24} />
        </span>
        <h1 className="vx-h3" style={{ fontSize: 22, marginTop: 16 }}>
          {isDev
            ? t(lang, 'المسار قيد الإعداد', 'The learning path is one step away')
            : t(lang, 'المسار غير متاح مؤقتاً', 'The learning path is temporarily unavailable')}
        </h1>
        <p className="vx-sm" style={{ maxWidth: 520, margin: '8px auto 0', lineHeight: 1.6 }}>
          {isDev
            ? t(lang, 'جداول المسار غير موجودة بعد. شغّل migrations/learning-path.sql في محرر SQL داخل Supabase ثم أعد المحاولة.', 'The path tables are not created yet. Run migrations/learning-path.sql in the Supabase SQL Editor, then retry.')
            : t(lang, 'حاول مرة أخرى بعد قليل.', 'Please try again in a moment.')}
        </p>
        <button type="button" className="vx-btn is-ghost" style={{ marginTop: 20 }} onClick={() => setReloadKey((k) => k + 1)}>
          <RefreshCcw size={14} /> {t(lang, 'إعادة المحاولة', 'Retry')}
        </button>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="vx-card" style={{ maxWidth: 760, margin: '32px auto', textAlign: 'center', padding: '48px 28px' }}>
        <span className="vx-icon-tile" style={{ margin: '0 auto', background: 'var(--vx-psoft)', color: 'var(--vx-primary)', width: 56, height: 56, borderRadius: 18 }}>
          <Compass size={28} />
        </span>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.6px', marginTop: 18 }}>
          {t(lang, 'رحلتك الإنجليزية تبدأ هنا', 'Your guided English journey starts here')}
        </h1>
        <p className="vx-sm" style={{ maxWidth: 440, margin: '8px auto 0', fontSize: 13.5, lineHeight: 1.6 }}>
          {t(lang, 'درس واحد في كل مرة، من A1 إلى C1. ابدأ من المستوى الأول أو خُذ اختبار المستوى لنضعك في المكان الصحيح.', 'One lesson at a time, from A1 to C1. Start from the beginning, or take the level test and we will place you correctly.')}
        </p>
        <div className="vx-path-actions" style={{ justifyContent: 'center', marginTop: 22 }}>
          <button
            type="button"
            className="vx-btn"
            disabled={placing}
            aria-busy={placing}
            onClick={startFromA1}
          >
            {placing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {placing
              ? t(lang, 'جارٍ البدء…', 'Starting…')
              : t(lang, 'البدء من A1', 'Start from A1')}
          </button>
          <button type="button" className="vx-btn is-ghost" onClick={() => setTab('level-test')}>
            <Award size={16} /> {t(lang, 'اختبار تحديد المستوى', 'Take the placement test')}
          </button>
        </div>
        {startMessage ? (
          <div
            className={`vx-notice ${startState === 'not-seeded' ? 'is-warn' : 'is-error'}`}
            role="alert"
          >
            {startState === 'not-seeded' ? <Info size={16} /> : <AlertCircle size={16} />}
            <div className="vx-notice-body">
              <span>{startMessage}</span>
              <div className="vx-notice-actions">
                {startState === 'error-auth' ? (
                  <button type="button" className="vx-btn is-ghost is-sm" onClick={onOpenAuth}>
                    <Lock size={13} /> {t(lang, 'تسجيل الدخول', 'Sign in')}
                  </button>
                ) : null}
                {startState === 'error' ? (
                  <button type="button" className="vx-btn is-ghost is-sm" onClick={startFromA1}>
                    <RefreshCcw size={13} /> {t(lang, 'إعادة المحاولة', 'Retry')}
                  </button>
                ) : null}
                {startState === 'not-seeded' ? (
                  <button
                    type="button"
                    className="vx-btn is-ghost is-sm"
                    onClick={() => setReloadKey((k) => k + 1)}
                  >
                    <RefreshCcw size={13} /> {t(lang, 'تحقّق مرة أخرى', 'Check again')}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="vx-card" style={{ maxWidth: 640, margin: '48px auto', textAlign: 'center', padding: '40px 24px' }}>
        <p className="vx-sm" style={{ fontSize: 14 }}>
          {t(lang, 'تعذّر تحميل المسار. تحقق من الاتصال ثم أعد المحاولة.', 'Could not load the path. Check your connection and retry.')}
        </p>
        <button type="button" className="vx-btn" style={{ marginTop: 18 }} onClick={() => setReloadKey((k) => k + 1)}>
          {t(lang, 'إعادة المحاولة', 'Retry')}
        </button>
      </div>
    );
  }

  const items = buildPathItems(selected, lang);
  const selectedMeta = LEVEL_META[selected?.level] || LEVEL_META.A1;
  const currentLevelRow = levels.find((l) => l.level === currentLevelCode) || null;
  const currentLevelLessons = (currentLevelRow?.units || []).flatMap((u) => u.lessons || []);
  const currentLevelTotal = currentLevelRow?.published || currentLevelLessons.length || 0;
  const currentPositionInLevel = current
    ? Math.max(1, currentLevelLessons.findIndex((l) => l.slug === current.slug) + 1)
    : 0;
  const currentSteps = (current?.steps?.length ? current.steps : current ? [current.kind] : []).slice(0, 5);

  return (
    <div className="vx-path-grid">
      <div className="vx-path-left">
        <div className="vx-level-tabs" role="tablist" aria-label={t(lang, 'مستويات CEFR', 'CEFR levels')}>
          {levels.map((level) => {
            const active = level.level === selected?.level;
            const available = (level.published || 0) > 0;
            const pct = level.percent || 0;
            return (
              <button
                key={level.level}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={!available}
                className={`vx-level-tab ${active ? 'is-active' : ''}`}
                onClick={() => available && setSelectedLevel(level.level)}
                title={`${level.level} · ${LEVEL_META[level.level]?.[lang === 'ar' ? 'ar' : 'en'] || ''}`}
              >
                <b>{level.level}</b>
                <span>{available ? `${pct}%` : t(lang, 'مقفل', 'Locked')}</span>
              </button>
            );
          })}
        </div>

        {selectedTotal > 0 ? (
          <div className="vx-path-scrollwrap">
            <div className="vx-path-scroll">
              <PathMap
                items={items}
                width={isMobile ? 340 : 540}
                cx={isMobile ? 70 : 120}
                amp={isMobile ? 34 : 70}
                dy={isMobile ? 96 : 90}
                top={6}
                small={isMobile}
                rtl={lang === 'ar'}
                tag={t(lang, 'تابع', 'CONTINUE')}
                onSelect={(item) => {
                  if (item.id) onOpenLesson(item.id);
                }}
              />
            </div>
            <div className="vx-path-fade" aria-hidden="true" />
          </div>
        ) : (
          <div className="vx-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <span className="vx-icon-tile" style={{ margin: '0 auto', background: 'var(--vx-lockbg)', color: 'var(--vx-lockicon)', width: 52, height: 52 }}>
              <Lock size={22} />
            </span>
            <h2 className="vx-h3" style={{ fontSize: 19, marginTop: 14 }}>
              {selected?.level} · {selectedMeta[lang === 'ar' ? 'ar' : 'en']}
            </h2>
            <p className="vx-sm" style={{ marginTop: 6 }}>
              {t(lang, 'دروس هذا المستوى قيد الإعداد. أكمل المستوى الحالي أولاً.', 'This level is being prepared. Finish the current level first.')}
            </p>
          </div>
        )}
      </div>

      <aside className="vx-path-rail">
        {current ? (
          <div className="vx-card vx-current-card">
            <div className="vx-tag">
              {t(lang, 'الدرس الحالي', 'Current lesson')} · {currentPositionInLevel} {t(lang, 'من', 'of')} {currentLevelTotal}
            </div>
            <div className="vx-current-title">{pick(lang, current, 'titleEn', 'titleAr')}</div>
            <div className="vx-sm" style={{ lineHeight: 1.55, marginBottom: 14 }}>
              {pick(lang, current, 'objectiveEn', 'objectiveAr', t(lang, 'درس واحد واضح، ثم التالي.', 'One clear lesson, then the next.'))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {currentSteps.map((step) => {
                const meta = STEP_META[step] || { icon: BookOpen, chip: '' };
                const Icon = meta.icon;
                return (
                  <span key={step} className={`vx-chip ${meta.chip}`}>
                    <Icon size={13} /> {kindLabel(lang, step)}
                  </span>
                );
              })}
            </div>
            <button type="button" className="vx-btn is-block" onClick={() => onOpenLesson(current.slug)}>
              {t(lang, 'ابدأ الدرس', 'Start lesson')}
              <ArrowRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
        ) : (
          <div className="vx-card vx-current-card">
            <div className="vx-tag">{t(lang, 'اكتمل المسار', 'Path complete')}</div>
            <div className="vx-current-title">{t(lang, 'كل الدروس المتاحة مكتملة', 'Every available lesson is done')}</div>
            <p className="vx-sm" style={{ marginBottom: 14 }}>
              {t(lang, 'راجع درساً سابقاً أو استعد للمستوى القادم.', 'Revisit an earlier lesson or get ready for the next level.')}
            </p>
            <button type="button" className="vx-btn is-block" onClick={() => setTab('dashboard')}>
              {t(lang, 'إلى الرئيسية', 'Back to dashboard')}
            </button>
          </div>
        )}

        <div className="vx-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div className="vx-h3">{selected?.level} · {selectedMeta[lang === 'ar' ? 'ar' : 'en']}</div>
            <div className="vx-sm">
              <b style={{ color: 'var(--vx-text)' }}>{selectedDone}</b> / {selectedTotal} {t(lang, 'دروس', 'lessons')}
            </div>
          </div>
          <div className="vx-bar"><i style={{ width: `${selectedPct}%` }} /></div>
          <div className="vx-legend">
            <span><span className="vx-legend-dot is-done" /> {t(lang, 'مكتمل', 'Done')}</span>
            <span><span className="vx-legend-dot is-current" /> {t(lang, 'الحالي', 'Current')}</span>
            <span><span className="vx-legend-dot" /> {t(lang, 'مقفل', 'Locked')}</span>
            <span><span className="vx-legend-dot is-revision" /> {t(lang, 'مراجعة', 'Revision')}</span>
          </div>
        </div>

        <div className="vx-card" style={{ padding: '14px 18px' }}>
          <div className="vx-h3" style={{ marginBottom: 10 }}>{t(lang, 'راجع في أي وقت', 'Revisit anytime')}</div>
          {completed.length > 0 ? completed.map((lesson) => (
            <button
              key={lesson.slug}
              type="button"
              className="vx-revisit-row"
              onClick={() => onOpenLesson(lesson.slug)}
            >
              <span className="vx-revisit-check"><Check size={13} strokeWidth={3.2} /></span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pick(lang, lesson, 'titleEn', 'titleAr')}
              </span>
              <span className="vx-sm" style={{ whiteSpace: 'nowrap' }}>
                {t(lang, 'النتيجة', 'Score')} {lesson.bestScore ?? 0}%
              </span>
            </button>
          )) : (
            <p className="vx-sm">
              {t(lang, 'أكمل درساً ليظهر هنا للمراجعة.', 'Complete a lesson and it will appear here for revision.')}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function PathSkeleton({ lang }) {
  return (
    <div className="vx-path-grid" aria-label={t(lang, 'جارٍ تحميل المسار', 'Loading path')}>
      <div className="vx-path-left">
        <div className="vx-level-tabs">
          {LEVELS.map((level) => (
            <span key={level} className="vx-level-tab"><b>{level}</b><span>—</span></span>
          ))}
        </div>
        <div className="vx-path-scrollwrap" style={{ display: 'grid', placeItems: 'center' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--vx-primary)' }} />
        </div>
      </div>
      <div className="vx-path-rail">
        <div className="vx-card" style={{ minHeight: 220 }} />
        <div className="vx-card" style={{ minHeight: 130 }} />
      </div>
    </div>
  );
}
