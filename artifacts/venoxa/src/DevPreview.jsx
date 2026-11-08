// ─────────────────────────────────────────────────────────────────────────────
//  Dev-only preview — #/dev/preview
//  Renders redesigned screens against labeled fixtures so visuals can be
//  verified before the Supabase migration/seed is applied. Booted from main.tsx
//  only when import.meta.env.DEV is true; production never imports this file.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import DashboardPage from './DashboardPage.jsx';
import LearningPath from './LearningPath.jsx';
import { PREVIEW_MAP, PREVIEW_STATS, PREVIEW_USER } from './devFixtures.js';
import './reference.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'path', label: 'Learning Path' },
  { id: 'lesson', label: 'Lesson player' },
  { id: 'placement', label: 'Placement result' },
];

export default function DevPreview() {
  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [theme, lang]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--vx-bg)', color: 'var(--vx-text)' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '8px 16px', borderBottom: '1px solid var(--vx-border)',
          background: 'var(--vx-surface)', position: 'sticky', top: 0, zIndex: 50,
        }}
      >
        <span className="vx-chip is-amber" style={{ letterSpacing: '.4px' }}>
          <Monitor size={13} /> DEV PREVIEW · FIXTURES
        </span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`vx-chip ${tab === item.id ? '' : 'is-gray'}`}
              style={{ cursor: 'pointer' }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <button type="button" className="vx-chip is-gray" style={{ cursor: 'pointer' }} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />} {theme}
        </button>
        <button type="button" className="vx-chip is-gray" style={{ cursor: 'pointer' }} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          {lang === 'ar' ? 'EN' : 'عربي'}
        </button>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 22px 64px' }}>
        {tab === 'dashboard' && (
          <DashboardPage
            lang={lang}
            user={PREVIEW_USER}
            setTab={() => {}}
            onOpenLesson={() => {}}
            completedCells={{}}
            levelTest={null}
            streakData={{ current: PREVIEW_STATS.streak }}
            wordsLearned={PREVIEW_STATS.wordsLearned}
            dueWords={PREVIEW_STATS.dueWords}
            fixture={PREVIEW_MAP}
          />
        )}
        {tab === 'path' && (
          <LearningPath
            lang={lang}
            setTab={() => {}}
            onOpenLesson={() => {}}
            onOpenAuth={() => {}}
            fixture={PREVIEW_MAP}
          />
        )}
        {tab !== 'dashboard' && tab !== 'path' && (
          <div className="vx-card" style={{ padding: '56px 28px', textAlign: 'center' }}>
            <div className="vx-tag">{tab === 'lesson' ? 'Lesson player' : 'Placement result'}</div>
            <h1 className="vx-h3" style={{ fontSize: 22, marginTop: 8 }}>
              {tab === 'lesson' ? 'Introducing yourself' : 'Placement · A1'}
            </h1>
            <p className="vx-sm" style={{ marginTop: 6 }}>
              Fixture screen is wired into this preview; the visual rebuild follows after Dashboard + Learning Path approval.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
