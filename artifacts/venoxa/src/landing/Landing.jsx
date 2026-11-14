// src/landing/Landing.jsx — the public landing page (spec §3).
//
// Rendered standalone by App.jsx when activeTab === 'landing' (logged-out
// visitors at / and /welcome, or a signed-in user who opens /welcome on
// purpose). It owns its own minimal chrome: skip link, sticky top bar,
// <main> with all sections, then the shared Footer. The AuthModal is
// rendered by App.jsx next to this component (shared with the app shell).
//
// Section order (top → bottom): Hero · LevelStrip · 5×Feature (alternating)
// · LearnAnywhere · Tools · FinalCta · Footer.

import { useEffect, useRef } from 'react';
import './landing.css';
import { landingCopy } from './strings.js';
import LandingTopBar from './LandingTopBar.jsx';
import Hero from './sections/Hero.jsx';
import LevelStrip from './sections/LevelStrip.jsx';
import Feature from './sections/Feature.jsx';
import LearnAnywhere from './sections/LearnAnywhere.jsx';
import Tools from './sections/Tools.jsx';
import FinalCta from './sections/FinalCta.jsx';
import Footer from '../Footer.jsx';
import { ScrollProgress, useParallax } from './reveal.jsx';
import PathZigzag from './illustrations/PathZigzag.jsx';
import Flashcards from './illustrations/Flashcards.jsx';
import ChatMic from './illustrations/ChatMic.jsx';
import SkillsArt from './illustrations/SkillsArt.jsx';
import LevelBadgeArt from './illustrations/LevelBadgeArt.jsx';

const FEATURE_ART = [PathZigzag, Flashcards, ChatMic, SkillsArt, LevelBadgeArt];

export default function Landing({ lang, setLang, theme, setTheme, user, onGetStarted, onLogin, onEnterApp, setTab }) {
  const c = landingCopy(lang);
  const rootRef = useRef(null);
  useParallax(rootRef);
  const authed = !!user;

  // When sign-in completes while the landing is open (the auth modal just
  // succeeded), enter the app. A visitor who opened /welcome already signed
  // in is NOT bounced — only transitions after mount navigate.
  const authedAtMount = useRef(authed);
  useEffect(() => {
    if (authed && !authedAtMount.current) onEnterApp();
  }, [authed, onEnterApp]);

  const primary = authed ? onEnterApp : onGetStarted;

  // Footer 'Home' returns to the landing for guests instead of the dashboard.
  const footerSetTab = (tab) => setTab(!authed && tab === 'dashboard' ? 'landing' : tab);

  return (
    <div ref={rootRef} className="vx-landing min-h-screen bg-[var(--vxp-surface-2)] text-[var(--vxp-text)]" dir={c.isAr ? 'rtl' : 'ltr'}>
      <ScrollProgress />

      <a href="#vx-landing-main" className="vx-skip">
        {c.skip}
      </a>

      <LandingTopBar
        c={c}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        authed={authed}
        onLogin={onLogin}
        onPrimary={primary}
      />

      <main id="vx-landing-main">
        <Hero c={c} authed={authed} onPrimary={primary} onSecondary={onLogin} />
        <LevelStrip c={c} />
        {c.features.map((f, i) => (
          <Feature key={f.id} c={c} data={f} index={i} Art={FEATURE_ART[i]} />
        ))}
        <LearnAnywhere c={c} />
        <Tools c={c} />
        <FinalCta c={c} authed={authed} onPrimary={primary} onSecondary={onLogin} />
      </main>

      <Footer
        lang={lang}
        setLang={setLang}
        setTab={footerSetTab}
        user={user}
        onOpenRegister={onGetStarted}
        headingTag="h3"
      />
    </div>
  );
}
