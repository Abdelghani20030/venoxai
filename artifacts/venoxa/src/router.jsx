// src/router.jsx — URL ↔ tab bridge (spec §3.9, §9)
//
// The app is tab-state driven (App.jsx `renderContent`). This module maps
// every tab id to its canonical URL and back, so wouter drives the address
// bar while the tab system keeps working untouched:
//
//   - internal navigation: setActiveTab(...) → effect T pushes the mapped URL
//   - back/forward/pasted links: popstate → wouter updates → effect L maps
//     the URL back into the tab system
//
// Loops are impossible because each effect no-ops when both sides already
// agree (the mapping is bijective for routed tabs).
//
// Site pages (privacy, terms, …) KEEP their legacy `#/<id>` hash URLs —
// they are shareable links used in OAuth consent screens / app stores, and
// the old hash effects in App.jsx still own them. The `#/verify/<id>`
// certificate flow must never have its hash stripped either.

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

// Kept in sync with SITE_PAGE_TABS in App.jsx (kept separate so App.jsx
// surgery stays minimal; the list is fixed).
export const SITE_TABS = [
  'about', 'contact', 'community', 'cookies', 'faq',
  'help', 'premium', 'privacy', 'report', 'terms',
];

/* ── Base path (Vite BASE_PATH / vercel.json rewrites, spec §3.9) ────── */

const RAW_BASE = import.meta.env.BASE_URL || '/';
export const BASE = RAW_BASE === '/' ? '' : RAW_BASE.replace(/\/+$/, '');

export function withBase(path) {
  return `${BASE}${path}`;
}

export function stripBase(pathname) {
  if (BASE && pathname.startsWith(BASE)) {
    const rest = pathname.slice(BASE.length);
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return pathname;
}

/* ── tab id → canonical URL ──────────────────────────────────────────── */

export const TAB_PATH = {
  dashboard: '/dashboard',
  'path-home': '/path',
  placement: '/path/placement',
  // The level test lives at /path/placement from day one; Phase 6 swaps the
  // renderer for the new welcome → adaptive → result flow.
  'level-test': '/path/placement',
  library: '/library',
  progress: '/progress',
  // Vocabulary group
  vocab: '/library/vocabulary',
  phrasal: '/library/vocabulary/phrasal',
  idioms: '/library/vocabulary/slang',
  'idioms-proper': '/library/vocabulary/idioms',
  langeek: '/library/vocabulary/langeek',
  grammar: '/library/grammar',
  // Skills
  listening: '/library/skills/listening',
  reading: '/library/skills/reading',
  speaking: '/library/skills/speaking',
  writing: '/library/skills/writing',
  pronunciation: '/library/skills/pronunciation',
  'test-gen': '/library/skills/test-generator',
  // Tools
  'smart-translation': '/library/tools/smart-translation',
  'tone-rewriter': '/library/tools/tone-rewriter',
  'sentence-diagrammer': '/library/tools/sentence-diagrammer',
  'minimal-pairs': '/library/tools/minimal-pairs',
  'word-family': '/library/tools/word-family',
  collocations: '/library/tools/collocations',
  etymology: '/library/tools/etymology',
  'word-of-day': '/library/tools/word-of-the-day',
  'idiom-of-day': '/library/tools/idiom-of-the-day',
  timer: '/library/tools/timer',
  // Progress group
  plan: '/progress/plan',
  profile: '/progress/profile',
  // NOTE: 'lesson' is intentionally absent — its URL is composed from the
  // lessonRoute (level + slug). 'mobile' and the site tabs intentionally
  // have no pathname URL (hash/legacy behaviour preserved).
};

export function tabToPath(tab, lessonRoute) {
  if (tab === 'lesson') {
    if (lessonRoute?.level && lessonRoute?.slug) {
      return `/path/${lessonRoute.level}/${lessonRoute.slug}`;
    }
    return null;
  }
  return TAB_PATH[tab] || null;
}

/* ── URL → tab state ─────────────────────────────────────────────────── */

const LESSON_RE = /^\/path\/(a1|a2|b1|b2|c1)\/([a-z0-9-]+)\/?$/i;

export function pathToState(pathname) {
  let p = stripBase(pathname || '');
  if (p.length > 1) p = p.replace(/\/+$/, '') || '/';
  if (p === '/' || p === '') return null; // legacy root → dashboard (App init handles)
  if (p === '/dashboard') return { tab: 'dashboard' };
  if (p === '/path') return { tab: 'path-home' };
  if (p === '/path/placement') return { tab: 'placement' };
  const m = p.match(LESSON_RE);
  if (m) return { tab: 'lesson', lessonRoute: { level: m[1].toLowerCase(), slug: m[2] } };
  if (p === '/library') return { tab: 'library' };
  if (p === '/progress') return { tab: 'progress' };
  if (p === '/progress/plan') return { tab: 'plan' };
  if (p === '/progress/profile') return { tab: 'profile' };
  // /library/** deep links → the matching legacy tool tab
  for (const tab of Object.keys(TAB_PATH)) {
    if (TAB_PATH[tab] === p) return { tab };
  }
  return null;
}

/* ── initial tab from the current URL (hash first, then pathname) ────── */

export function initTabFromUrl() {
  try {
    const h = window.location.hash;
    if (h.startsWith('#/verify/')) return 'level-test';
    const site = SITE_TABS.find((id) => h === `#/${id}`);
    if (site) return site;
    const st = pathToState(window.location.pathname);
    return st?.tab || 'dashboard';
  } catch {
    return 'dashboard';
  }
}

/* ── header nav grouping ─────────────────────────────────────────────── */

const NAV_ROOTS = [
  ['dashboard', ['dashboard']],
  ['path', ['path-home', 'lesson', 'placement', 'level-test']],
  [
    'library',
    [
      'library', 'vocab', 'phrasal', 'idioms', 'idioms-proper', 'langeek', 'grammar',
      'listening', 'reading', 'speaking', 'writing', 'pronunciation', 'test-gen',
      'smart-translation', 'tone-rewriter', 'sentence-diagrammer', 'minimal-pairs',
      'word-family', 'collocations', 'etymology', 'word-of-day', 'idiom-of-day', 'timer',
    ],
  ],
  ['progress', ['progress', 'plan', 'profile']],
];

// Which of the four nav sections a tab belongs to (for active highlighting).
export function navRootFor(tab) {
  for (const [root, tabs] of NAV_ROOTS) {
    if (tabs.includes(tab)) return root;
  }
  return null;
}

/* ── the two-way bridge hook ─────────────────────────────────────────── */

export function useTabRouteBridge({ activeTab, setActiveTab }) {
  const [location, navigate] = useLocation();
  const [lessonRoute, setLessonRoute] = useState(null);
  const didInit = useRef(false);

  // URL → tab (initial load, browser back/forward, external navigation).
  useEffect(() => {
    const st = pathToState(window.location.pathname);
    setLessonRoute(st?.lessonRoute ?? null);
    if (st && st.tab !== activeTab) setActiveTab(st.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // tab (+lessonRoute) → URL (internal navigation).
  useEffect(() => {
    // Site pages keep their legacy #/<id> hash URLs — the hash effects in
    // App.jsx own them; nothing to do here.
    if (SITE_TABS.includes(activeTab)) {
      didInit.current = true;
      return;
    }
    // The #/verify/<id> certificate flow must keep its hash — leave the URL alone.
    if (activeTab === 'level-test' && window.location.hash.startsWith('#/verify/')) return;
    const desired = tabToPath(activeTab, lessonRoute);
    if (!desired) {
      didInit.current = true;
      return; // 'mobile' & unknown tabs keep their current URL
    }
    // Initial mount on a URL that already maps to a valid state: the URL is
    // canonical, let effect L win instead of replacing the history entry.
    if (!didInit.current && pathToState(window.location.pathname)) {
      didInit.current = true;
      return;
    }
    const current = stripBase(window.location.pathname);
    if (current === desired) {
      didInit.current = true;
      // A routed tab carrying a foreign hash (e.g. after leaving the
      // #/verify flow) normalizes back to the bare path.
      if (window.location.hash) {
        navigate(withBase(desired), { replace: true });
      }
      return;
    }
    navigate(withBase(desired), { replace: !didInit.current });
    didInit.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, lessonRoute]);

  // In-page #/verify/<id> links (certificate share links) switch to the
  // level-test flow without a full reload; the URL keeps its hash (guard in
  // the effect above) and LevelTest parses the id on mount.
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash.startsWith('#/verify/')) setActiveTab('level-test');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveTab]);

  return { location, lessonRoute };
}
