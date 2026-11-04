// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — "My Progress" summary band (Phase 4, PDF page 02)
//
//  Rendered ABOVE the existing Study Plan component (which stays untouched);
//  the old 'plan' tab id keeps working for direct links.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import {
  Award, Route, User, Trophy, Flame, Zap, GraduationCap,
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { fetchPathMap } from './pathApi.js';

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    amber: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    violet: 'bg-violet-500/15 text-violet-500 dark:text-violet-400',
    sky: 'bg-sky-500/15 text-sky-500 dark:text-sky-400',
    emerald: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3 premium-card border border-white/10 dark:border-white/5">
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${tones[tone]}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProgressSummary({ lang, theme, user, levelTest, setTab }) {
  const [pathStat, setPathStat] = React.useState(null);
  useEffect(() => {
    let alive = true;
    fetchPathMap().then((res) => {
      if (alive && res.ok && res.data?.progress) {
        const p = res.data.progress;
        if (p.publishedLessons > 0) {
          setPathStat(`${p.completedLessons}/${p.publishedLessons}`);
        }
      }
    });
    return () => { alive = false; };
  }, []);

  const title = _resolveTranslation(lang, 'تقدمي', 'My Progress');
  const subtitle = _resolveTranslation(
    lang,
    'مسارك، خطتك، شهادتك — كل تقدمك في مكان واحد.',
    'Your path, your plan, your certificate — all progress in one place.',
  );

  const quick = [
    { id: 'path', ar: 'مساري', en: 'My path', icon: Route },
    { id: 'profile', ar: 'ملفي', en: 'Profile', icon: User },
    { id: 'level-test', ar: 'الشهادة', en: 'Certificate', icon: Award },
  ];

  return (
    <div className="rounded-3xl p-5 sm:p-6 premium-card border border-white/10 dark:border-white/5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {quick.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setTab(q.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
              >
                <Icon size={14} />
                {_resolveTranslation(lang, q.ar, q.en)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Zap} tone="amber" label={_resolveTranslation(lang, 'نقاط الخبرة', 'Total XP')} value={user?.xp ?? 0} />
        <Stat icon={Flame} tone="violet" label={_resolveTranslation(lang, 'سلسلة الأيام', 'Streak')} value={`${user?.streak ?? 0} ${_resolveTranslation(lang, 'يوم', 'days')}`} />
        <Stat icon={GraduationCap} tone="sky" label={_resolveTranslation(lang, 'المستوى', 'Level')} value={user?.level ?? '—'} />
        {pathStat
          ? <Stat icon={Trophy} tone="emerald" label={_resolveTranslation(lang, 'الدروس المكتملة', 'Lessons done')} value={pathStat} />
          : <Stat icon={Award} tone="emerald" label={_resolveTranslation(lang, 'الشهادة', 'Certificate')} value={levelTest?.certId ? _resolveTranslation(lang, 'تم الإصدار', 'Issued') : _resolveTranslation(lang, 'اِختبار المستوى', 'Take the test')} />}
      </div>
    </div>
  );
}
