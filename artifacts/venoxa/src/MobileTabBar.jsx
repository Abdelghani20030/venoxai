// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — Mobile bottom tab bar (design page 09)
//
//  Home · Learning Path · My Library · My Progress — the four primary
//  destinations, pinned as a 68px white bar on mobile only (md:hidden).
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
      <div className="vx-mobile-tabbar flex items-stretch justify-around">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
            || (tab.id === 'dashboard' && activeTab === 'dashboard');
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`vx-mtab ${active ? 'is-active' : ''}`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="leading-none">
                {_resolveTranslation(lang, tab.ar, tab.en)}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
