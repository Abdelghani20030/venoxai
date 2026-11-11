// src/layout/AppHeader.jsx — single-row header (spec §3.4)
//
// Replaces the old two-tier glass header. Left: logo tile + wordmark.
// Centre: the four nav items (Dashboard / Learning Path / My Library /
// My Progress) with an active `--primary-tint` pill. Right: streak chip,
// XP chip and the avatar, whose dropdown now owns everything the old
// utility bar did (theme, language, Premium, Contact, Mobile App,
// profile settings, sign in/out) — the assumption from spec §3.4.
// Dictionary lives in My Library → Vocabulary.

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Home,
  Map as MapIcon,
  BookOpen,
  BarChart3,
  Flame,
  Zap,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  LogIn,
  Smartphone,
  MessageCircle,
  Crown,
  Settings,
  Languages,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import { Avatar, FOCUS_RING, RTL_FLIP } from '../ui/index.jsx';
import { navRootFor } from '../router.jsx';

// Shared by the desktop nav and the mobile bottom tab bar.
export function NAV_ITEMS(lang) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  return [
    { root: 'dashboard', tab: 'dashboard', icon: Home, label: T('الرئيسية', 'Dashboard') },
    { root: 'path', tab: 'path-home', icon: MapIcon, label: T('مسار التعلم', 'Learning Path') },
    { root: 'library', tab: 'library', icon: BookOpen, label: T('مكتبتي', 'My Library') },
    { root: 'progress', tab: 'progress', icon: BarChart3, label: T('تقدمي', 'My Progress') },
  ];
}

const SYNC_LABELS = {
  idle: null,
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Sync error',
};

export default function AppHeader({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  theme,
  setTheme,
  user,
  token,
  syncStatus = 'idle',
  streak = 0,
  xp = 0,
  localAvatar,
  onOpenAuth,
  onLogout,
  scrolled = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const reduce = useReducedMotion();
  const activeRoot = navRootFor(activeTab);
  const displayName =
    user?.displayName || user?.name || user?.username || user?.email || '';
  const email = user?.email || '';
  const signedIn = Boolean(token && user);

  // Close the avatar menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const go = (tab) => {
    setMenuOpen(false);
    setActiveTab(tab);
  };

  const navItems = NAV_ITEMS(lang);

  return (
    <motion.header
      initial={reduce ? false : { y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`vx-font fixed inset-x-0 top-0 z-50 h-[58px] border-b bg-[var(--vxp-header-bg)]/85 backdrop-blur-xl transition-[border-color,box-shadow] duration-200 ${
        scrolled
          ? 'border-[var(--vxp-border)] shadow-[0_2px_12px_rgba(15,30,70,0.06)]'
          : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-2 px-4 sm:px-6">
        {/* Logo */}
        <button
          type="button"
          onClick={() => go('dashboard')}
          className={`flex shrink-0 items-center gap-2.5 rounded-[10px] p-1 ${FOCUS_RING}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--vxp-primary)] text-[15px] font-black leading-none text-white">
            V
          </span>
          <span className="hidden text-[17px] font-extrabold tracking-[-0.02em] text-[var(--vxp-text)] sm:inline">
            Venoxa AI
          </span>
        </button>

        {/* Desktop nav */}
        <nav aria-label="Main" className="ms-2 hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = activeRoot === item.root;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => go(item.tab)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13.5px] font-bold transition-colors ${FOCUS_RING} ${
                  active
                    ? 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]'
                    : 'text-[var(--vxp-muted)] hover:bg-[var(--vxp-surface-3)] hover:text-[var(--vxp-text)]'
                }`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right side: streak, XP, avatar */}
        <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => go('progress')}
            title={_resolveTranslation(lang, 'سلسلة الأيام', 'Day streak')}
            className={`hidden h-8 items-center gap-1.5 rounded-full bg-[var(--vxp-amber)] px-2.5 text-[12px] font-bold text-[var(--vxp-amber-text)] transition-[filter] hover:brightness-[0.97] sm:flex ${FOCUS_RING}`}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            {streak}
          </button>
          <button
            type="button"
            onClick={() => go('progress')}
            title={_resolveTranslation(lang, 'نقاط الخبرة', 'Experience points')}
            className={`flex h-8 items-center gap-1.5 rounded-full bg-[var(--vxp-surface-3)] px-2.5 text-[12px] font-bold text-[var(--vxp-muted)] transition-[filter] hover:brightness-[0.97] ${FOCUS_RING}`}
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden xs:inline sm:inline">{xp} XP</span>
          </button>

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center gap-1 rounded-full p-0.5 ${FOCUS_RING}`}
            >
              <Avatar name={displayName || 'V'} src={localAvatar} size={34} />
              <ChevronDown
                className={`h-3.5 w-3.5 text-[var(--vxp-dim)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  role="menu"
                  aria-label={_resolveTranslation(lang, 'حساب المستخدم', 'Account menu')}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="vx-card absolute end-0 top-[calc(100%+10px)] w-64 rounded-[16px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-2"
                >
                  {/* identity */}
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar name={displayName || 'V'} src={localAvatar} size={38} />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-[var(--vxp-text)]">
                        {signedIn ? displayName || _resolveTranslation(lang, 'متعلم', 'Learner') : _resolveTranslation(lang, 'زائر', 'Guest')}
                      </div>
                      <div className="truncate text-[11px] text-[var(--vxp-dim)]">
                        {signedIn ? email : _resolveTranslation(lang, 'سجّل الدخول لحفظ تقدمك', 'Sign in to save progress')}
                      </div>
                      {signedIn && SYNC_LABELS[syncStatus] && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--vxp-dim)]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              syncStatus === 'error'
                                ? 'bg-[var(--vxp-danger)]'
                                : syncStatus === 'synced'
                                  ? 'bg-[var(--vxp-success)]'
                                  : 'bg-[var(--vxp-amber-text)]'
                            }`}
                          />
                          {SYNC_LABELS[syncStatus]}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="my-1 h-px bg-[var(--vxp-border)]" />

                  {/* preferences */}
                  <MenuRow
                    icon={theme === 'dark' ? Moon : Sun}
                    label={theme === 'dark'
                      ? _resolveTranslation(lang, 'الوضع الفاتح', 'Light mode')
                      : _resolveTranslation(lang, 'الوضع الداكن', 'Dark mode')}
                    onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                  />
                  <MenuRow
                    icon={Languages}
                    label={lang === 'ar' ? 'English' : 'العربية'}
                    onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); }}
                  />
                  <MenuRow
                    icon={Settings}
                    label={_resolveTranslation(lang, 'إعدادات الملف', 'Profile settings')}
                    onClick={() => go('profile')}
                  />

                  <div className="my-1 h-px bg-[var(--vxp-border)]" />

                  {/* old utility bar items */}
                  <MenuRow icon={Crown} label={_resolveTranslation(lang, 'بريميوم', 'Premium')} onClick={() => go('premium')} />
                  <MenuRow icon={MessageCircle} label={_resolveTranslation(lang, 'اتصل بنا', 'Contact us')} onClick={() => go('contact')} />
                  <MenuRow icon={Smartphone} label={_resolveTranslation(lang, 'تطبيق الجوال', 'Mobile app')} onClick={() => go('mobile')} />

                  <div className="my-1 h-px bg-[var(--vxp-border)]" />

                  {signedIn ? (
                    <MenuRow
                      icon={LogOut}
                      label={_resolveTranslation(lang, 'تسجيل الخروج', 'Sign out')}
                      onClick={() => { setMenuOpen(false); onLogout?.(); }}
                    />
                  ) : (
                    <MenuRow
                      icon={LogIn}
                      label={_resolveTranslation(lang, 'تسجيل الدخول', 'Sign in')}
                      onClick={() => { setMenuOpen(false); onOpenAuth?.(); }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function MenuRow({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-[var(--vxp-muted)] transition-colors hover:bg-[var(--vxp-surface-3)] hover:text-[var(--vxp-text)] ${FOCUS_RING}`}
    >
      {Icon && <Icon className={`h-4 w-4 shrink-0 ${RTL_FLIP}`} aria-hidden="true" />}
      {label}
    </button>
  );
}
