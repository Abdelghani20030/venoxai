// src/landing/LandingTopBar.jsx — minimal sticky landing header (spec 3.1).
// Left: logo. Right: language (EN/عربي, hidden on mobile — the footer has a
// switch), theme toggle, Log in (text), Get started (small primary).
// Mobile: logo, theme toggle, Get started only.

import { Moon, Sun } from 'lucide-react';
import { FOCUS_RING } from '../ui/index.jsx';

export default function LandingTopBar({ c, lang, setLang, theme, setTheme, authed, onLogin, onPrimary }) {
  const pillBtn = (active) =>
    `flex h-8 items-center rounded-full px-3 text-[13px] font-extrabold transition-colors ${FOCUS_RING} ${
      active
        ? 'bg-[var(--vxp-surface)] text-[var(--vxp-text)] shadow-sm'
        : 'text-[var(--vxp-dim)] hover:text-[var(--vxp-text)]'
    }`;

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--vxp-border)] backdrop-blur-md"
      style={{ background: 'color-mix(in srgb, var(--vxp-surface) 86%, transparent)' }}
    >
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-2 px-4 sm:px-6">
        {/* logo */}
        <a
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Venoxa AI"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--vxp-primary)] text-[15px] font-black leading-none text-white">
            V
          </span>
          <span className="text-[17px] font-extrabold tracking-tight text-[var(--vxp-text)]">Venoxa AI</span>
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* language toggle (desktop only; footer keeps one for mobile) */}
          <div
            className="hidden items-center rounded-full border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] p-1 sm:flex"
            role="group"
            aria-label={c.langToggle}
          >
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={pillBtn(lang === 'en')}>
              EN
            </button>
            <button type="button" onClick={() => setLang('ar')} aria-pressed={lang === 'ar'} className={pillBtn(lang === 'ar')}>
              عربي
            </button>
          </div>

          {/* theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={c.themeToggle}
            aria-pressed={theme === 'dark'}
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-[var(--vxp-border)] bg-[var(--vxp-surface)] text-[var(--vxp-text)] transition-colors hover:bg-[var(--vxp-surface-2)] ${FOCUS_RING}`}
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>

          {/* log in (text) */}
          {!authed && (
            <button
              type="button"
              onClick={onLogin}
              className={`hidden h-10 items-center rounded-xl px-3 text-[14px] font-extrabold text-[var(--vxp-primary)] transition-colors hover:bg-[var(--vxp-primary-tint)] sm:inline-flex ${FOCUS_RING}`}
            >
              {c.login}
            </button>
          )}

          {/* get started (small primary) */}
          <button
            type="button"
            onClick={onPrimary}
            className={`vx-btn-sm vx-btn-edge inline-flex items-center bg-[var(--vxp-primary)] text-[var(--vxp-on-primary)] transition-[filter] hover:brightness-110 ${FOCUS_RING}`}
          >
            {authed ? c.openApp : c.getStarted}
          </button>
        </div>
      </div>
    </header>
  );
}
