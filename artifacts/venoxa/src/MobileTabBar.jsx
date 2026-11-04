// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Mobile bottom tab bar (Phase 4, PDF page 17)
//
//  Home · Learning Path · My Library · My Progress — the four primary
//  destinations, pinned as a glass bar on mobile only (md:hidden).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { motion } from 'framer-motion';
import { Home, Route, Library, LineChart } from 'lucide-react';
import { _resolveTranslation } from './translations.js';

const TABS = [
  { id: 'dashboard', icon: Home, ar: 'الرئيسية', en: 'Home' },
  { id: 'path', icon: Route, ar: 'المسار', en: 'Path' },
  { id: 'library', icon: Library, ar: 'مكتبتي', en: 'Library' },
  { id: 'progress', icon: LineChart, ar: 'تقدمي', en: 'Progress' },
];

export default function MobileTabBar({ activeTab, lang, onNavigate }) {
  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
      className="fixed bottom-0 inset-x-0 z-[70] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label={_resolveTranslation(lang, 'التنقل الرئيسي', 'Primary navigation')}
    >
      <div
        className="glass-panel flex items-stretch justify-around gap-1 border-t border-white/10 dark:border-white/5"
        style={{
          background: 'color-mix(in srgb, #0D1117 55%, transparent)',
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id
            || (tab.id === 'dashboard' && activeTab === 'dashboard');
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center gap-1 flex-1 py-2.5 outline-none transition-colors ${
                active ? 'text-white dark:text-white' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="ventabbar-active-pill"
                  className="absolute inset-x-3 top-1.5 bottom-1 rounded-2xl bg-sky-500/15 dark:bg-sky-400/15 ring-1 ring-sky-400/30"
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                />
              )}
              <Icon size={20} className={`relative z-10 ${active ? 'text-sky-500 dark:text-sky-400' : ''}`} />
              <span className={`relative z-10 text-[10px] font-medium leading-none ${
                active ? 'text-sky-600 dark:text-sky-400' : ''
              }`}>
                {_resolveTranslation(lang, tab.ar, tab.en)}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
