// src/layout/MobileTabBar.jsx — bottom navigation under 768px (spec §3.5)
//
// "Home · Path · Library · Progress" — icon above a small label; the active
// tab is blue. Hidden on md+ and on the fullscreen speaking call screen
// (the caller decides whether to render it).

import React from 'react';
import { _resolveTranslation } from '../translations.js';
import { FOCUS_RING } from '../ui/index.jsx';
import { navRootFor } from '../router.jsx';
import { NAV_ITEMS } from './AppHeader.jsx';

export default function MobileTabBar({ activeTab, setActiveTab, lang }) {
  const activeRoot = navRootFor(activeTab);
  const items = NAV_ITEMS(lang);
  return (
    <nav
      aria-label={_resolveTranslation(lang, 'التنقل السريع', 'Quick navigation')}
      className="vx-font fixed inset-x-0 bottom-0 z-40 border-t border-[var(--vxp-border)] bg-[var(--vxp-header-bg)]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = activeRoot === item.root;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              aria-current={active ? 'page' : undefined}
              className={`flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${FOCUS_RING} ${
                active ? 'text-[var(--vxp-primary)]' : 'text-[var(--vxp-dim)]'
              }`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
