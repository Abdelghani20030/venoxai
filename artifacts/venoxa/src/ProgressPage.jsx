// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — "My Progress" (design page 08, right panel)
//
//  Overall progress ring, this week's study time, and links to the Study Plan,
//  Profile and Level test / certificate. The Study Plan itself keeps its own
//  route ('plan'); this page no longer stacks it underneath.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import { Award, CalendarDays, ChevronRight, User } from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { fetchPathMap } from './pathApi.js';

const t = (lang, ar, en) => _resolveTranslation(lang, ar, en);

const RING_R = 50.5;
const RING_C = 2 * Math.PI * RING_R;
const BAR_MAX_PX = 84;

/** Study seconds per day for the current Mon–Sun week (keys are YYYY-MM-DD). */
function readWeek(lang) {
  let usage = {};
  for (const key of ['venoxa_daily_usage_secs', 'venoxa_usage_time']) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '{}') || {};
      if (Object.keys(parsed).length) { usage = parsed; break; }
    } catch { /* ignore malformed local data */ }
  }
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  // Noon avoids the UTC date flipping for local midnight in toISOString().
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayIdx, 12);
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const secs = Number(usage[d.toISOString().slice(0, 10)]) || 0;
    return { label: fmt.format(d), mins: Math.round(secs / 60), future: i > todayIdx };
  });
}

function LinkCard({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button type="button" onClick={onClick} className="vx-link-card">
      <span className="vx-link-icon"><Icon size={20} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="vx-h3" style={{ display: 'block' }}>{title}</span>
        {subtitle && <span className="vx-sm" style={{ display: 'block' }}>{subtitle}</span>}
      </span>
      <ChevronRight size={18} className="rtl:rotate-180" />
    </button>
  );
}

export default function ProgressSummary({ lang, setTab, wordsLearned = 0 }) {
  const [map, setMap] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchPathMap().then((res) => {
      if (alive && res.ok && res.data) setMap(res.data);
    });
    return () => { alive = false; };
  }, []);

  const week = useMemo(() => readWeek(lang), [lang]);
  const maxMins = Math.max(...week.map((d) => d.mins), 1);

  const levelCode = map?.currentLesson?.level || map?.placement?.level || null;
  const level = (map?.levels || []).find((l) => l.level === levelCode);
  const percent = level
    ? (typeof level.percent === 'number'
      ? level.percent
      : (level.published ? Math.round((level.completed / level.published) * 100) : 0))
    : 0;
  const completed = map?.progress?.completedLessons ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="sr-only">{t(lang, 'تقدمي', 'My Progress')}</h1>

      <section className="vx-card" aria-label={t(lang, 'التقدم العام', 'Overall progress')}>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="vx-hero-ring" aria-hidden="true">
            <svg width="112" height="112" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r={RING_R} fill="none" stroke="var(--vx-lockbg)" strokeWidth="11" />
              <circle
                cx="56" cy="56" r={RING_R} fill="none" stroke="var(--vx-primary)" strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - percent / 100)}
              />
            </svg>
            <div className="vx-ringlab" style={{ color: 'var(--vx-text)' }}>
              <b dir="ltr">{levelCode || '—'}</b>
              <span dir="ltr">{percent}%</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 className="vx-h3" style={{ fontSize: 18 }}>{t(lang, 'التقدم العام', 'Overall progress')}</h2>
            <p className="vx-sm" style={{ marginTop: 4 }}>
              {t(
                lang,
                `${completed} دروس مكتملة · ${wordsLearned} كلمة متعلَّمة · المستوى الحالي ${levelCode || '—'}`,
                `${completed} ${completed === 1 ? 'lesson' : 'lessons'} completed · ${wordsLearned} words learned · current level ${levelCode || '—'}`,
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="vx-card" aria-label={t(lang, 'هذا الأسبوع', 'This week')}>
        <h2 className="vx-h3" style={{ marginBottom: 14 }}>{t(lang, 'هذا الأسبوع', 'This week')}</h2>
        <div className="vx-week">
          {week.map((day) => {
            const empty = day.mins === 0;
            const height = empty ? 6 : Math.max(10, Math.round((day.mins / maxMins) * BAR_MAX_PX));
            return (
              <div key={day.label} className="vx-week-col">
                <div
                  className={`vx-week-bar ${empty ? 'is-empty' : ''}`}
                  style={{ height }}
                  role="img"
                  aria-label={day.future
                    ? `${day.label}`
                    : t(lang, `${day.label}: ${day.mins} دقيقة`, `${day.label}: ${day.mins} min`)}
                />
                <span className="vx-week-day">{day.label}</span>
              </div>
            );
          })}
        </div>
        {week.every((d) => d.mins === 0) && (
          <p className="vx-sm" style={{ marginTop: 12 }}>
            {t(lang, 'لا يوجد وقت دراسة هذا الأسبوع بعد.', 'No study time yet this week.')}
          </p>
        )}
      </section>

      <LinkCard
        icon={CalendarDays}
        title={t(lang, 'خطة الدراسة', 'Study Plan')}
        subtitle={t(lang, 'خطتك الأسبوعية، كرفيق اختياري', 'Your weekly plan, kept as an optional companion')}
        onClick={() => setTab('plan')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <LinkCard
          icon={User}
          title={t(lang, 'ملفي الشخصي', 'Profile')}
          subtitle={t(lang, 'الأهداف والإنجازات والتعديل', 'Goals, achievements and editing')}
          onClick={() => setTab('profile')}
        />
        <LinkCard
          icon={Award}
          title={t(lang, 'اختبار المستوى والشهادة', 'Level test and certificate')}
          subtitle={t(lang, 'آخر نتيجة وإعادة الاختبار', 'Latest result and retake')}
          onClick={() => setTab('level-test')}
        />
      </div>
    </div>
  );
}
