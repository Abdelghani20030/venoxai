/**
 * src/Header.jsx
 * Two-tier site header — PDF §01.
 * Utility bar (30px, deeper navy: Dictionary / Mobile App / Contact Us /
 * Premium + dark-light toggle at the far end) over a main navy bar (58px:
 * logo left, nav centered, search / EN-AR switch / Sign in pill right).
 *
 * Behavior: one sliding blue pill behind the active link (shared layout
 * spring), dropdowns scale from 0.96 with 30ms stagger, and after 40px of
 * scroll the utility bar folds away while the main bar gains blur and a
 * hairline border. Below 768px the main nav hides and the hamburger morphs
 * to an X to drive the existing App.jsx mobile drawer. RTL mirrors via the
 * document dir — no manual swaps needed.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { easing, springs } from './motion.js';
import { _resolveTranslation } from './translations.js';
import {
  BookOpen, Smartphone, Mail, Crown, Search, Sun, Moon, User, ChevronDown,
} from 'lucide-react';

/* Hamburger → X (own copy so App.jsx internals stay untouched) */
function MorphHamburger({ open }) {
  return (
    <div className="w-5 h-5 flex flex-col items-center justify-center">
      <motion.span
        className="block h-[2px] w-4 rounded-full bg-current mb-[5px]"
        animate={open ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.18 }}
      />
      <motion.span
        className="block h-[2px] w-4 rounded-full bg-current"
        animate={open ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        className="block h-[2px] w-4 rounded-full bg-current mt-[5px]"
        animate={open ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.18 }}
      />
    </div>
  );
}

function Header({
  activeTab,
  setActiveTab,
  navItems,
  lang,
  setLang,
  theme,
  setTheme,
  user,
  token,
  syncStatus,
  syncErrorMsg,
  localAvatar,
  onOpenAuth,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeDropdown,
  setActiveDropdown,
  navDropdownRef,
  scrollRef,
  showGlassLip = true,
}) {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  /* Utility bar folds away (and the main bar blurs) after 40px of scroll.
     The App scroll container is <main> (mainRef) — window is the fallback. */
  useEffect(() => {
    const handleRoll = () => {
      const el = scrollRef && scrollRef.current;
      const top = el ? el.scrollTop : (typeof window !== 'undefined' ? window.scrollY : 0);
      setScrolled(top > 40);
    };
    handleRoll();
    const el = scrollRef && scrollRef.current;
    if (el) el.addEventListener('scroll', handleRoll, { passive: true });
    window.addEventListener('scroll', handleRoll, { passive: true });
    return () => {
      if (el) el.removeEventListener('scroll', handleRoll);
      window.removeEventListener('scroll', handleRoll);
    };
  }, [scrollRef]);

  const isAr = lang === 'ar';
  const label = (ar, en) => _resolveTranslation(lang, ar, en);

  const utilityLinks = [
    {
      key: 'dictionary',
      icon: BookOpen,
      label: label('القاموس', 'Dictionary'),
      onClick: () => setActiveTab('vocab'),
    },
    {
      key: 'mobile',
      icon: Smartphone,
      label: label('تطبيق الجوال', 'Mobile App'),
      onClick: () => setActiveTab('mobile'),
    },
    {
      key: 'contact',
      icon: Mail,
      label: label('اتصل بنا', 'Contact Us'),
      onClick: () => setActiveTab('contact'),
    },
    {
      key: 'premium',
      icon: Crown,
      label: 'Premium',
      isPremium: true,
      onClick: () => setActiveTab('premium'),
    },
  ];

  return (
    <motion.header
      initial={reduced ? false : { y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: easing.out }}
      className={`vx-header ${scrolled ? 'vx-collapsed' : ''}`}
    >
      {/* ── Utility bar ───────────────────────────────────────────── */}
      <div className="vx-utility-bar" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1">
            {utilityLinks.map(u => (
              <button
                key={u.key}
                onClick={u.onClick}
                className={`vx-utility-link ${u.isPremium ? 'is-premium' : ''}`}
              >
                <u.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{u.label}</span>
              </button>
            ))}
          </div>
          <span className="flex-1" />
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="vx-icon-btn"
            title={theme === 'dark' ? label('الوضع الفاتح', 'Light Mode') : label('الوضع الداكن', 'Dark Mode')}
            aria-label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Main bar ──────────────────────────────────────────────── */}
      <div className="vx-main-bar" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center gap-2">

          {/* Logo */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 shrink-0"
            aria-label="Venoxa AI"
            dir="ltr"
          >
            <span className="vx-logo-tile">V</span>
            <span className="hidden sm:block text-[17px] font-extrabold tracking-tight text-white whitespace-nowrap">
              Venoxa AI
            </span>
          </button>

          {/* Centered nav — kept from App.jsx: navItems + activeDropdown */}
          <motion.nav
            variants={{
              initial: {},
              animate: {
                transition: {
                  staggerChildren: reduced ? 0 : 0.06,
                  delayChildren: reduced ? 0 : 0.1,
                }
              }
            }}
            initial={reduced ? false : 'initial'}
            animate="animate"
            className="hidden md:flex flex-1 items-center justify-center gap-0.5 px-2 min-w-0"
          >
            {navItems.map(item => {
              const isGroup = !!item.items;
              const isActive = isGroup
                ? item.items.some(s => activeTab === s.id)
                : activeTab === item.id;
              const isOpen = activeDropdown === item.id;

              return (
                <motion.div
                  key={item.id}
                  variants={{
                    initial: { opacity: 0, y: -10 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easing.out } }
                  }}
                  className="relative"
                  ref={isOpen ? navDropdownRef : null}
                >
                  <button
                    onClick={() => isGroup
                      ? setActiveDropdown(isOpen ? null : item.id)
                      : setActiveTab(item.id)}
                    title={item.label}
                    className="relative flex items-center gap-1.5 px-2.5 py-2 rounded-full text-sm font-bold transition-colors duration-200 shrink-0"
                  >
                    {/* Sliding blue pill behind the active link */}
                    {isActive && (
                      <motion.span
                        layoutId="vx-nav-pill"
                        className="vx-nav-pill"
                        transition={springs.pill}
                      />
                    )}
                    <item.icon className={`relative z-10 w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/60'}`} />
                    <span
                      className={`relative z-10 hidden lg:inline-block text-xs font-extrabold truncate transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-white/60'
                      }`}
                    >
                      {item.label}
                    </span>
                    {isGroup && (
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: easing.out }}
                        className={`relative z-10 flex items-center justify-center shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </motion.span>
                    )}
                    {item.badge > 0 && (
                      <motion.span
                        key={item.badge}
                        initial={reduced ? false : { scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={springs.snappy}
                        className="relative z-10 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold bg-[var(--vx-orange)] text-white shrink-0 px-1"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                  </button>

                  {/* Navy dropdown — scales from the trigger, items at 30ms */}
                  <AnimatePresence>
                    {isGroup && isOpen && (
                      <motion.div
                        initial={reduced ? false : { opacity: 0, scale: 0.96, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.12 } }}
                        transition={{ duration: 0.2, ease: easing.out }}
                        className="vx-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-7 z-[70] w-max min-w-[230px] max-h-[min(480px,80vh)] overflow-y-auto no-scrollbar p-1.5"
                        style={{ transformOrigin: 'top center' }}
                      >
                        <motion.div
                          initial={reduced ? false : 'initial'}
                          animate="animate"
                          variants={{ animate: { transition: { staggerChildren: reduced ? 0 : 0.03 } } }}
                        >
                          {item.items.map(sub => (
                            <motion.button
                              key={sub.id}
                              variants={{
                                initial: { opacity: 0, y: 6 },
                                animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: easing.out } }
                              }}
                              onClick={() => { setActiveTab(sub.id); setActiveDropdown(null); }}
                              className={`vx-dropdown-item ${activeTab === sub.id ? 'is-active' : ''}`}
                            >
                              <sub.icon className="w-4 h-4 shrink-0" />
                              <span className="text-center">{sub.label}</span>
                              {sub.badge > 0 && (
                                <span className="min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[8px] font-bold bg-[var(--vx-orange)] text-white px-1 shrink-0">
                                  {sub.badge}
                                </span>
                              )}
                            </motion.button>
                          ))}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.nav>

          {/* Right cluster — fixed LTR order; the dir on <html> mirrors the bar */}
          <div className="flex items-center gap-1 shrink-0" dir="ltr">
            {/* Search — feature ships later */}
            <button
              className="vx-icon-btn hidden sm:flex"
              title={label('البحث', 'Search')}
              aria-label={label('البحث', 'Search')}
              onClick={() => { /* TODO: site search lands with the landing sections */ }}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Language switch */}
            <button
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className="vx-lang-btn"
              title={isAr ? 'English' : 'عربي'}
            >
              {isAr ? 'EN' : 'عربي'}
            </button>

            {/* Auth — avatar when signed in, blue pill when not */}
            {user ? (
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-8 h-8 flex items-center justify-center rounded-xl overflow-hidden shrink-0 border transition-all ${
                  activeTab === 'profile'
                    ? 'border-[var(--vx-blue-hover)]'
                    : 'border-white/20 hover:border-white/40'
                }`}
                title={user.username || 'Profile'}
              >
                {(localAvatar || user.avatar) ? (
                  <img src={localAvatar || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-black text-white">
                    {(user.username || 'U')[0].toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="vx-signin-pill"
              >
                <User className="w-3.5 h-3.5" />
                <span>{label('دخول', 'Sign in')}</span>
              </button>
            )}

            {/* Mobile hamburger — morphs to X, drives the App.jsx drawer */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="vx-icon-btn md:hidden"
              title={label('القائمة', 'Menu')}
              aria-label={label('القائمة', 'Menu')}
            >
              <MorphHamburger open={isMobileMenuOpen} />
            </button>
          </div>
        </div>

        {/* Cloud sync status dot for signed-in users sits here when active */}
        {user && token && syncStatus !== 'idle' && (
          <AnimatePresence>
            <motion.span
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1.5 end-3 flex items-center gap-1 text-[9px] font-bold pointer-events-none"
              style={{ color: '#6C7A96' }}
              title={
                syncStatus === 'syncing' ? label('جاري المزامنة', 'Syncing…')
                : syncStatus === 'synced' ? label('تمت المزامنة', 'Synced ✓')
                : (syncErrorMsg || label('فشلت المزامنة', 'Sync error'))
              }
            >
              {syncStatus === 'synced' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              {syncStatus === 'syncing' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--vx-blue-hover)] animate-pulse" />}
              {syncStatus === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
            </motion.span>
          </AnimatePresence>
        )}
      </div>

      {/* Frosted glass lip — content blurs as it passes under the bars.
          Follows the utility-bar collapse automatically (anchored to the
          header's bottom edge). Hidden on the speaking call screen. */}
      {showGlassLip && <span className="vx-header-lip" aria-hidden="true" />}
    </motion.header>
  );
}

export default Header;
