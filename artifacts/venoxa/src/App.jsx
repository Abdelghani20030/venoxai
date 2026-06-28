import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Home, BookOpen, PenTool, MessageSquare, Headphones, Brain, ClipboardList, Trophy, Shuffle, FileText, CheckCircle, Target, Calendar, CalendarCheck, Play, Pause, RotateCcw, Volume2, Mic, Send, Clock, ChevronRight, ChevronLeft, Menu, X, Sparkles, Activity, Award, BookText, Lightbulb, Phone, PhoneOff, MicOff, CheckCircle2, HelpCircle, UploadCloud, Globe, Search, Filter, List, Star, Image as ImageIcon, Layers, Archive, Quote, Zap, Sun, Moon, Printer, Trash2, Copy, MoreHorizontal, PanelLeft, ChevronDown, ChevronUp, Wrench, Languages, Sliders, GitBranch, Ear, GitFork, Link2, ScrollText, BookMarked, User, Lock, Mail, Heart } from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import ProfileDashboard from './ProfileDashboard';
import {
  login         as fbLogin,
  register      as fbRegister,
  logout        as fbLogout,
  updateProfile as fbUpdateProfile,
  deleteAccount as fbDeleteAccount,
  syncProgress  as fbSyncProgress,
  syncBeacon,
  onAuthChange,
  auth,
  insforge,
  verifyEmail   as fbVerifyEmail,
  resendVerification as fbResendVerification,
  sendPasswordReset as fbSendPasswordReset,
  uploadVocabCSV,
  loadAllVocabFromStorage,
  subscribeToProgress as _subscribeToProgress_unused,
  pullProgress,
  pushProgress,
} from './insforge.jsx';
import { loadBundledVocab } from './vocabData.js';


// ─────────────────────────────────────────────────────────────────────────────
//  SECRET KEY GATE — change this to whatever key you want
// ─────────────────────────────────────────────────────────────────────────────
const SECRET_KEY = 'VENOXA-2025';
const KEY_STORAGE = 'venoxa_access_granted';

function KeyGate({ onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (input.trim() === SECRET_KEY) {
      localStorage.setItem(KEY_STORAGE, '1');
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050816',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px', padding: '40px 32px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        animation: shake ? 'kgShake 0.5s ease' : 'none',
      }}>
        <style>{`
          @keyframes kgShake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-10px)}
            40%{transform:translateX(10px)}
            60%{transform:translateX(-8px)}
            80%{transform:translateX(8px)}
          }
          @keyframes kgFadeIn {
            from{opacity:0;transform:translateY(16px)}
            to{opacity:1;transform:translateY(0)}
          }
        `}</style>

        {/* Lock icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, textAlign: 'center', margin: '0 0 6px' }}>
          Private Access
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', margin: '0 0 28px' }}>
          Enter your secret key to continue
        </p>

        <input
          type="password"
          placeholder="Enter secret key…"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '14px 16px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            color: '#fff', fontSize: '15px', outline: 'none',
            transition: 'border-color 0.2s',
            marginBottom: '12px',
            letterSpacing: '0.1em',
          }}
        />

        {error && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
            Incorrect key. Try again.
          </p>
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '14px',
            borderRadius: '14px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
            transition: 'opacity 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
import Pronunciation from './Pronunciation';
import SmartTranslation from './SmartTranslation';
import TimerTool from './TimerTool';
import ToneRewriter from './ToneRewriter';
import SentenceDiagrammer from './SentenceDiagrammer';
import MinimalPairs from './MinimalPairs';
import WordFamilyExplorer from './WordFamilyExplorer';
import CollocationFinder from './CollocationFinder';
import EtymologyExplorer from './EtymologyExplorer';
import WordOfTheDay from './WordOfTheDay';
import IdiomOfTheDay from './IdiomOfTheDay';
import LiquidGlass from 'liquid-glass-react';
import avatarUsMale from './assets/avatar-us-male.png';
import avatarUsFemale from './assets/avatar-us-female.png';
import avatarUkMale from './assets/avatar-uk-male.png';
import avatarUkFemale from './assets/avatar-uk-female.png';

// ── SVG Flag Components ──────────────────────────────────────────────────────
const GBFlag = ({ style = {}, className = "" }) => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
    <rect width="60" height="30" fill="#012169"/>
    <line x1="0" y1="0" x2="60" y2="30" stroke="white" strokeWidth="10"/>
    <line x1="60" y1="0" x2="0" y2="30" stroke="white" strokeWidth="10"/>
    <polygon points="0,0 3,0 30,13.5 27,15 0,3"     fill="#C8102E"/>
    <polygon points="57,0 60,0 60,3 33,15 30,13.5"   fill="#C8102E"/>
    <polygon points="30,16.5 60,27 60,30 57,30"       fill="#C8102E"/>
    <polygon points="27,15 30,16.5 3,30 0,30 0,27"   fill="#C8102E"/>
    <rect x="23" y="0"  width="14" height="30" fill="white"/>
    <rect x="0"  y="11" width="60" height="8"  fill="white"/>
    <rect x="25.5" y="0"    width="9" height="30" fill="#C8102E"/>
    <rect x="0"    y="12.5" width="60" height="5" fill="#C8102E"/>
  </svg>
);

const USFlag = ({ style = {}, className = "" }) => {
  const stripeH = 30 / 13;
  const cantonW = 24;
  const cantonH = 7 * stripeH;
  const rowH    = cantonH / 10;
  const starRows = [6, 5, 6, 5, 6, 5, 6, 5, 6];
  return (
    <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      {Array.from({ length: 13 }).map((_, i) => (
        <rect key={i} x="0" y={i * stripeH} width="60" height={stripeH}
          fill={i % 2 === 0 ? '#B22234' : 'white'}/>
      ))}
      <rect x="0" y="0" width={cantonW} height={cantonH} fill="#3C3B6E"/>
      {starRows.map((count, row) =>
        Array.from({ length: count }).map((_, col) => (
          <circle key={`${row}-${col}`}
            cx={(cantonW / (count + 1)) * (col + 1)}
            cy={rowH * (row + 1)}
            r="0.65"
            fill="white"/>
        ))
      )}
    </svg>
  );
};

// ── Compact dropdown for the call-mode overlay ───────────────────────────────
function CallMiniDropdown({ value, onChange, options, prefix = '', isDark = true }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const selected = options.find(o => o.value === value);
  return (
    <div className={`relative ${open ? 'z-[9999]' : 'z-auto'}`} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md border text-[11px] font-bold rounded-2xl transition-all ${
          isDark
            ? 'bg-black/25 border-white/12 text-white hover:border-white/25 hover:bg-black/35'
            : 'bg-white/90 border-black/10 text-gray-700 hover:border-black/20 hover:bg-white'
        }`}
      >
        {prefix && <span className="opacity-60">{prefix}</span>}
        <span>{selected?.label ?? value}</span>
        <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
      </button>
      {open && (
        <div
          className="dropdown-menu absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[140px]"
          style={isDark
            ? { background: 'rgba(33,33,42,0.97)', border: '1px solid rgba(255,255,255,0.10)' }
            : { background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.08)' }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`dropdown-item justify-center text-center ${value === opt.value ? 'active' : isDark ? 'text-white' : 'text-gray-800'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function LanguageDropdown({ lang, setLang, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);
  const langs = [
    { code: 'en', label: 'English' }, { code: 'ar', label: 'عربي' },
    { code: 'es', label: 'Español' }, { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' }, { code: 'zh', label: '中文' }, { code: 'ja', label: '日本語' }
  ];
  return (
    <div className={`relative flex-1 ${isOpen ? 'z-[9999]' : 'z-auto'}`} ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 flex items-center gap-2 px-3 rounded-2xl text-sm font-bold transition-all outline-none cursor-pointer border ${theme === 'dark' ? 'text-white border-white/5 hover:border-white/10' : 'text-gray-700 border-black/5 hover:border-black/10'}`}
        style={{
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        }}
      >
        <Globe className="w-4 h-4 shrink-0 order-2" />
        <span className="flex-1 text-start order-1 font-bold text-sm">{langs.find(l => l.code === lang)?.label || 'Language'}</span>

      </button>
      {isOpen && (
        <div 
          className="dropdown-menu bottom-full left-0 mb-2 w-full min-w-[140px] max-h-[300px] overflow-y-auto no-scrollbar"
          style={{
            background: theme === 'dark' ? 'rgb(33, 33, 42)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          }}
        >
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setIsOpen(false); }}
              className={`dropdown-item ${lang === l.code ? 'active' : ''}`}
            >
              <span className="truncate">{l.label}</span>
              {lang === l.code && <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-[var(--app-accent1)]'} shadow-[0_0_10px_rgba(99,102,241,0.5)]`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomDropdown({ value, onChange, options, icon: Icon, theme, placeholder, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);
  const isDark = theme === 'dark';
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className} ${isOpen ? 'z-[9999]' : 'z-auto'}`} ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 flex items-center gap-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 outline-none cursor-pointer border ${isDark
          ? 'text-white border-white/5 hover:border-white/10'
          : 'text-gray-700 border-black/5 hover:border-black/10'
          } ${isOpen ? 'ring-2 ring-[var(--app-accent1)]/10 border-[var(--app-accent1)]/50' : ''}`}
        style={{
          background: isDark ? 'var(--app-input-bg)' : 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        }}
      >
        {Icon && <Icon size={16} className={`${isDark ? 'text-white' : 'text-gray-400'} shrink-0`} />}
        <span className="flex-1 text-center truncate tracking-tight">{selectedLabel || value || placeholder || ''}</span>

      </button>

      {isOpen && (
        <div 
          className="dropdown-menu top-full left-0 right-0 mt-2 w-full max-h-[320px] overflow-y-auto custom-scrollbar"
          style={{
            background: isDark ? 'rgb(33, 33, 42)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          }}
        >
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setIsOpen(false); }}
              className={`dropdown-item ${value === o.value ? 'active' : ''}`}
            >
              <span className="truncate">{o.label}</span>
              {value === o.value && <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-[var(--app-accent1)]'} shadow-[0_0_10px_rgba(99,102,241,0.5)]`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SolidDatePicker({ value, onChange, min, label, lang }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const getDaysGrid = () => {
    let firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const grid = [];
    for (let i = startOffset - 1; i >= 0; i--) grid.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrevMonth: true });
    for (let i = 1; i <= daysInMonth; i++) grid.push({ day: i, isCurrentMonth: true });
    const remainingSlots = 42 - grid.length;
    for (let i = 1; i <= remainingSlots; i++) grid.push({ day: i, isCurrentMonth: false, isNextMonth: true });
    return grid;
  };

  const handlePrevMonth = (e) => { e.preventDefault(); setCurrentMonth(new Date(year, month - 1, 1)); };
  const handleNextMonth = (e) => { e.preventDefault(); setCurrentMonth(new Date(year, month + 1, 1)); };

  const handleDateClick = (item) => {
    let newDate;
    if (item.isPrevMonth) newDate = new Date(year, month - 1, item.day);
    else if (item.isNextMonth) newDate = new Date(year, month + 1, item.day);
    else newDate = new Date(year, month, item.day);
    const d = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000));
    onChange(d.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const isDateDisabled = (item) => {
    if (!min) return false;
    let newDate;
    if (item.isPrevMonth) newDate = new Date(year, month - 1, item.day);
    else if (item.isNextMonth) newDate = new Date(year, month + 1, item.day);
    else newDate = new Date(year, month, item.day);
    const minDate = new Date(min);
    newDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);
    return newDate < minDate;
  };

  const grid = getDaysGrid();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="relative w-full" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 flex items-center gap-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 outline-none cursor-pointer border dark:text-white dark:border-white/5 dark:hover:border-white/10 text-gray-700 border-black/5 hover:border-black/10`}
        style={{
          background: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        }}
      >
        <span className="flex-1 text-start truncate">{value || label}</span>
        <Calendar className="w-5 h-5 dark:text-white text-gray-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-[9999] pt-2">
          <div 
            className="dropdown-menu !relative mt-0 w-[280px]" 
            dir="ltr"
            style={{
              background: document.documentElement.classList.contains('dark') ? 'rgb(33, 33, 42)' : 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(48px) saturate(200%)',
              WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            }}
          >
            <div className="text-center font-extrabold text-base mb-3 pb-3 border-b border-gray-100/20 dark:border-white/10 tracking-wide">
              {monthNames[month]} {year}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-bold text-gray-500 dark:text-[var(--app-text)] tracking-wider">
              <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
            </div>
            <div className="grid grid-cols-7 gap-1 gap-y-1 mb-3">
              {grid.map((item, i) => {
                const disabled = isDateDisabled(item);
                let itemDate;
                if (item.isPrevMonth) itemDate = new Date(year, month - 1, item.day);
                else if (item.isNextMonth) itemDate = new Date(year, month + 1, item.day);
                else itemDate = new Date(year, month, item.day);
                const d = new Date(itemDate.getTime() - (itemDate.getTimezoneOffset() * 60000));
                const itemDateStr = d.toISOString().split('T')[0];
                const isSelected = value === itemDateStr;

                return (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); !disabled && handleDateClick(item); }}
                    disabled={disabled}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-xl text-xs transition-all duration-200 font-bold ${!item.isCurrentMonth ? 'text-gray-400 dark:text-[var(--app-accent1)]' : 'text-gray-800 dark:text-[var(--app-text)]'} ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-[var(--app-surface)] hover:scale-110 cursor-pointer'} ${isSelected && !disabled ? 'bg-[var(--app-accent1)] text-white shadow-md scale-110' : ''}`}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center items-center gap-3">
              <button onClick={handlePrevMonth} className="p-1.5 bg-gray-50 dark:bg-[var(--app-card)] hover:bg-gray-200 dark:hover:bg-[var(--app-hover)] hover:text-black border border-gray-200 dark:border-[var(--app-border)] rounded-xl transition-all">
                <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-[var(--app-text)]" />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 bg-gray-50 dark:bg-[var(--app-card)] hover:bg-gray-200 dark:hover:bg-[var(--app-hover)] hover:text-black border border-gray-200 dark:border-[var(--app-border)] rounded-xl transition-all">
                <ChevronRight className="w-4 h-4 text-gray-700 dark:text-[var(--app-text)]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PARTICLES BACKGROUND ---
/* ─────────────────────────────────────────────────────────────
   PremiumBackground
   Full visionOS-inspired dark grid + glows + particles + noise
   5 layer stack:
     1. Base gradient
     2. Grid overlay  (canvas — sharp center, faded edges)
     3. Glow layers   (CSS radial-gradients)
     4. Noise texture (canvas — subtle grain)
     5. Particles     (canvas — ultra-low opacity floating dots)
   + mouse-parallax on glow layers
   + breathing animation on glows
────────────────────────────────────────────────────────────── */
function PremiumBackground({ theme = 'dark' }) {
  const isDark = theme === 'dark';
  const noiseRef   = useRef(null);
  const partRef    = useRef(null);
  const animRef    = useRef(null);

  /* ── noise canvas (static grain drawn once) ── */
  useEffect(() => {
    const canvas = noiseRef.current;
    if (!canvas) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i]   = v;
      img.data[i+1] = v;
      img.data[i+2] = v;
      img.data[i+3] = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 12);
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  /* ── particles canvas ── */
  useEffect(() => {
    const canvas = partRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const COUNT = Math.floor((W * H) / 22000);
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.9 + 0.2,
      base: Math.random() * 0.07 + 0.02,
      dx: (Math.random() - 0.5) * 0.12,
      dy: (Math.random() - 0.5) * 0.12,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.006 + 0.002,
    }));

    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;
      for (const p of pts) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const alpha = p.base + Math.sin(frame * p.speed + p.phase) * 0.03;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(180,210,255,${Math.max(0, alpha)})`
          : `rgba(80,100,220,${Math.max(0, alpha * 1.8)})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      {/* Layer 1 — base */}
      <div className="absolute inset-0" style={{
        background: isDark ? '#000000' : '#ffffff',
      }} />

      {/* Layer 2 — noise grain */}
      <canvas ref={noiseRef} className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none', opacity: isDark ? 0.45 : 0.20, mixBlendMode: isDark ? 'screen' : 'multiply' }} />

      {/* Layer 4 — floating particles */}
      <canvas ref={partRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
    </>
  );
}

/* Keep old name as alias so existing references still work */
function ParticlesBackground() {
  return null; // replaced by PremiumBackground
}

// --- API CONFIGURATION ---
const GEMINI_API_KEY = "proxied"; // Real key lives in backend; this just enables AI features in the UI.

// --- HELPER FUNCTION FOR BACKTICKS ---
const getBackticks = () => String.fromCharCode(96, 96, 96);

// --- AI API HELPER (proxied through our backend) ---
// Non-streaming version used for things like image prompt generation.
const fetchFromGemini = async (prompt, _apiKey, maxTokens = 512) => {
  const url = `${import.meta.env.BASE_URL}api/chat`;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
    if (!response.ok) {
      const body = await response.text();
      return body || '{"error": "AI is busy. Please try again."}';
    }
    const data = await response.json();
    return data.text || '{"error": "No response generated."}';
  } catch (error) {
    return '{"error": "Connection issue. Please try again."}';
  }
};

// Streaming version — calls /api/chat/stream, yields tokens via SSE.
// onDelta(chunk) is called for each text chunk as it arrives.
// Returns the full accumulated text when done.
const streamFromAPI = async (prompt, onDelta, maxTokens = 512) => {
  const url = `${import.meta.env.BASE_URL}api/chat/stream`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'string' && parsed !== '') {
            full += parsed;
            onDelta(parsed);
          }
        } catch { /* skip malformed */ }
      }
    }
    return full;
  } catch (err) {
    window.clearTimeout(timeout);
    throw err;
  }
};

// Convenience wrapper: streams into a React state setter so text appears word-by-word.
const streamText = async (prompt, setText) => {
  let accumulated = '';
  await streamFromAPI(prompt, (delta) => {
    accumulated += delta;
    setText(accumulated);
  });
  return accumulated;
};

const parseGeminiJSON = text => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.slice(start, end + 1));
    }
    return null;
  } catch (e) {
    return null;
  }
};
const cleanFallbackText = text => {
  if (!text) return "";
  const marker = getBackticks();
  return text.split(marker + 'json').join('').split(marker).join('').trim();
};
const hasArabicText = text => /[\u0600-\u06FF]/.test(String(text || ''));
const speakArabicFree = text => {
  if (!text || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice = voices.find(v => /^ar(-|_)?/i.test(v.lang) || /arab/i.test(v.name));
  utterance.lang = arabicVoice?.lang || 'ar-SA';
  utterance.voice = arabicVoice || null;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
};
const safeRender = val => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// --- TTS TEXT NORMALIZER ---
// Strips markdown formatting so "**Hello**" and "Hello" map to the same cache entry.
const normalizeTTSText = (raw) => raw
  .replace(/\*\*(.+?)\*\*/gs, '$1')
  .replace(/\*(.+?)\*/gs, '$1')
  .replace(/__(.+?)__/gs, '$1')
  .replace(/_(.+?)_/gs, '$1')
  .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
  .replace(/#{1,6}\s+/g, '')
  .replace(/\[(.+?)\]\(.+?\)/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

// --- AUDIO CACHE (IndexedDB) ---
// Stores synthesised audio as ArrayBuffers keyed by {text}|{voiceId} hash.
// A vocabulary app repeats the same words hundreds of times — caching them
// means ElevenLabs is called exactly once per unique (text, voice) pair,
// making the monthly quota effectively unlimited for normal usage.
const _CACHE_DB_NAME = 'venoxa-tts-v1';
const _CACHE_STORE = 'audio';
const _CACHE_MAX = 500; // max stored entries before LRU eviction

const _djb2 = s => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = Math.imul(h, 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
};
const _audioCacheKey = (text, voiceId) => _djb2(text.trim().toLowerCase() + '\x00' + voiceId);

let _audioCacheDb = null;
const _openAudioCache = () => {
  if (_audioCacheDb) return Promise.resolve(_audioCacheDb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(_CACHE_DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(_CACHE_STORE)) {
        const st = db.createObjectStore(_CACHE_STORE, { keyPath: 'k' });
        st.createIndex('ts', 'ts');
      }
    };
    req.onsuccess = e => { _audioCacheDb = e.target.result; resolve(_audioCacheDb); };
    req.onerror = () => reject(req.error);
  });
};

const _getCachedAudio = async (key) => {
  try {
    const db = await _openAudioCache();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(_CACHE_STORE, 'readonly')
        .objectStore(_CACHE_STORE).get(key);
      req.onsuccess = e => resolve(e.target.result?.buf ?? null);
      req.onerror = reject;
    });
  } catch { return null; }
};

const _setCachedAudio = async (key, arrayBuf) => {
  try {
    const db = await _openAudioCache();
    const tx = db.transaction(_CACHE_STORE, 'readwrite');
    const st = tx.objectStore(_CACHE_STORE);
    st.put({ k: key, buf: arrayBuf, ts: Date.now() });
    // Prune oldest entries when over the cap
    const cnt = st.count();
    cnt.onsuccess = () => {
      if (cnt.result > _CACHE_MAX) {
        const cur = st.index('ts').openCursor();
        let del = 0;
        cur.onsuccess = e => {
          const c = e.target.result;
          if (c && del < 60) { c.delete(); del++; c.continue(); }
        };
      }
    };
  } catch { /* non-critical */ }
};

const _playCachedAudio = async (arrayBuf) => {
  const blob = new Blob([arrayBuf], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  _currentTTSAudio = audio;
  return new Promise((resolve) => {
    const finish = () => {
      URL.revokeObjectURL(url);
      if (_currentTTSAudio === audio) _currentTTSAudio = null;
      resolve();
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  });
};

// --- ELEVENLABS TTS HELPER ---
// TTS calls are made DIRECTLY from the browser to ElevenLabs (not through the
// backend server). This is required because ElevenLabs free-tier blocks
// requests from server/cloud IPs (Replit production), but allows them from
// real user browser IPs.
const DEFAULT_ELEVENLABS_VOICE_ID = 'nPczCjzI2devNBz1zQrb'; // Brian — British male accent
// English voices (not trained on Arabic — swapped out automatically for Arabic text)
const ELEVENLABS_SARAH_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — British female accent
const ELEVENLABS_BRIAN_ID = 'nPczCjzI2devNBz1zQrb'; // Brian — British male accent
// True multilingual voices — handle Arabic correctly with eleven_multilingual_v2
const ARABIC_FEMALE_VOICE_ID = 'XB0fDUnXU5powFXDhCwa'; // Charlotte — multilingual female
const ARABIC_MALE_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George — multilingual male
const ELEVENLABS_VOICE_OPTIONS = [
  { id: 'nPczCjzI2devNBz1zQrb', label: 'Brian (British ♂)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah (British ♀)' },
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', label: 'Liam' },
  { id: 'XB0fDUnXU5powFXDhCwa', label: 'Charlotte' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice' },
  { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', label: 'Callum' },
];

// Tracks which TTS engine produced the last successful utterance.
// 'elevenlabs' | 'edge' | 'browser' | null
let _lastTTSEngine = null;
// Global accent and gender preferences. Initialized from localStorage.
let _voiceAccent = (typeof localStorage !== 'undefined' && localStorage.getItem('venoxa_voice_accent')) || 'uk';
let _voiceGender = (typeof localStorage !== 'undefined' && localStorage.getItem('venoxa_voice_gender')) || 'male';
// Generation counter — incremented before each TTS chain.
// Every engine checks this before calling audio.play();
// if the value changed (= a newer request started), the stale engine
// silently kills its own Audio element instead of blending.
let _ttsGen = 0;

// Multilingual Neural voices are Microsoft's newest, most natural-sounding
// generation — they sound conversational and human, much closer to ElevenLabs
// quality than the older Neural voices. "BrianMultilingual" is the warm,
// confident American male voice the user wants.
const EDGE_VOICES = {
  uk: { male: 'en-GB-RyanNeural', female: 'en-GB-SoniaNeural' },
  us: { male: 'en-US-BrianMultilingualNeural', female: 'en-US-AvaMultilingualNeural' },
};

/**
 * withTimeout(promise, ms)
 * Races a TTS promise against a deadline that resolves false.
 * Prevents slow / unreachable backends from stalling the fallback chain.
 */
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise(resolve => setTimeout(() => resolve(false), ms))]);

/**
 * edgeTTSSpeak(text, gender, voiceOverride, topLevelCacheKey?)
 * Free, unlimited Microsoft Edge TTS via the api-server proxy.
 * Caches audio in IndexedDB so any word heard once plays instantly from
 * cache on every future call — no network round-trip needed.
 * Returns true on success, false on failure (so caller can fall back).
 */
const edgeTTSSpeak = async (text, gender = _voiceGender, voiceOverride, topLevelCacheKey) => {
  const myGen = ++_ttsGen; // snapshot generation for this speak chain
  const accent = _voiceAccent === 'us' ? 'us' : 'uk';
  const genderKey = (gender || _voiceGender) === 'female' ? 'female' : 'male';

  // VERCEL FIX: Skip Groq/Kokoro/Gemini entirely.
  // On Vercel these serverless functions either aren't deployed or cold-start
  // too slowly (~1-3s each). The 700ms timeout races cause:
  //   (a) ~2.1s total wasted delay before Edge TTS even starts
  //   (b) Timed-out audio elements that finish loading AFTER the timeout and
  //       start playing BEHIND Edge TTS — the "two voices blended" bug.
  // Edge TTS is the primary and only engine on Vercel. Groq/Kokoro/Gemini
  // can be re-enabled locally by uncommenting the blocks below.

  /* LOCAL-ONLY ENGINES — uncomment to enable on localhost / self-hosted:
  const _stopStaleAudio = () => {
    if (_currentTTSAudio) { _currentTTSAudio.pause(); try { _currentTTSAudio.src = ''; } catch {} _currentTTSAudio = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };
  const okGroq   = await withTimeout(groqTTSSpeak(text, genderKey, myGen), 700);
  if (okGroq) return true;
  _stopStaleAudio();
  const okKokoro = await withTimeout(kokoroTTSSpeak(text, genderKey, accent, myGen), 700);
  if (okKokoro) return true;
  _stopStaleAudio();
  if (accent === 'us') {
    const okGemini = await withTimeout(geminiTTSSpeak(text, genderKey, myGen), 700);
    if (okGemini) return true;
    _stopStaleAudio();
  }
  */

  // Cancel any audio still playing from a previous stale attempt
  if (_currentTTSAudio) {
    _currentTTSAudio.pause();
    try { _currentTTSAudio.src = ''; } catch { /* ignore */ }
    _currentTTSAudio = null;
  }

  const voice = voiceOverride || EDGE_VOICES[accent][genderKey];
  const normalized = normalizeTTSText(text);
  const ck = _audioCacheKey(normalized, 'edge:' + voice);

  // IndexedDB cache hit → instant playback, no network
  const cached = await _getCachedAudio(ck);
  if (cached) {
    if (_ttsGen !== myGen) return false;
    await _playCachedAudio(cached);
    _lastTTSEngine = 'edge';
    return true;
  }

  try {
    const params = new URLSearchParams({ text: normalized, voice });
    // Always use an absolute path — import.meta.env.BASE_URL can be ''
    // on Vercel, turning relative paths into broken URLs like 'api/edge-tts'
    const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
    const url = `${base}api/edge-tts?${params}`;

    const audio = new Audio(url);
    audio.preload = 'auto';
    _currentTTSAudio = audio;

    const wait = new Promise((resolve) => {
      audio.onended = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
    });

    // Background cache fill — non-blocking, so playback starts immediately
    fetch(url)
      .then(r => (r.ok ? r.arrayBuffer() : null))
      .then(buf => {
        if (!buf) return;
        _setCachedAudio(ck, buf);
        if (topLevelCacheKey && topLevelCacheKey !== ck) _setCachedAudio(topLevelCacheKey, buf);
      })
      .catch(() => { });

    if (_ttsGen !== myGen) { audio.pause(); try { audio.src = ''; } catch {} return false; }
    await audio.play();
    if (_ttsGen !== myGen) { audio.pause(); try { audio.src = ''; } catch {} return false; }
    _lastTTSEngine = 'edge';
    await wait;
    return true;
  } catch (err) {
    console.warn('[Venoxa] Edge TTS failed:', err.message);
    return false;
  }
};

/**
 * High-quality, state-of-the-art TTS via Kokoro-FastAPI.
 * Proxies to the backend /api/kokoro-tts.
 * Falls back to Edge TTS if the service is unreachable.
 */
const kokoroTTSSpeak = async (text, gender, accent, expectedGen = _ttsGen) => {
  // Map our accent/gender to Kokoro voice codes
  // US: af_heart (Female), am_fenrir (Male)
  // UK: bf_alice (Female), bm_george (Male)
  const prefix = (accent === 'uk' ? 'b' : 'a') + (gender === 'female' ? 'f' : 'm');
  const voices = {
    af: 'af_heart',
    am: 'am_fenrir',
    bf: 'bf_alice',
    bm: 'bm_george'
  };
  const voice = voices[prefix] || 'af_heart';

  const normalized = normalizeTTSText(text);
  const ck = _audioCacheKey(normalized, 'kokoro:' + voice);

  // 1. Cache hit - instant playback
  const cached = await _getCachedAudio(ck);
  if (cached) {
    await _playCachedAudio(cached);
    _lastTTSEngine = 'kokoro';
    return true;
  }

  // 2. Network synthesis
  try {
    const params = new URLSearchParams({ text: normalized, voice });
    const url = `${import.meta.env.BASE_URL}api/kokoro-tts?${params}`;

    const audio = new Audio(url);
    _currentTTSAudio = audio;

    const wait = new Promise((resolve) => {
      audio.onended = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
    });

    // Fill cache in background
    fetch(url)
      .then(r => (r.ok ? r.arrayBuffer() : null))
      .then(buf => buf && _setCachedAudio(ck, buf))
      .catch(() => { });

    if (_ttsGen !== expectedGen) { audio.pause(); try { audio.src = ''; } catch {} return false; }
    await audio.play();
    if (_ttsGen !== expectedGen) { audio.pause(); try { audio.src = ''; } catch {} return false; }
    _lastTTSEngine = 'kokoro';
    await wait;
    return true;
  } catch (err) {
    console.warn('[Venoxa] Kokoro TTS failed:', err.message);
    return false;
  }
};

/**
 * groqTTSSpeak(text, gender)
 * Ultra-fast synthesis via Groq's Orpheus model.
 * Proxies to /api/groq-tts.
 */
const groqTTSSpeak = async (text, gender, expectedGen = _ttsGen) => {
  const voice = gender === 'female' ? 'alice' : 'adam';
  const normalized = normalizeTTSText(text);
  // Short limit for Orpheus on Groq (200 chars)
  if (normalized.length > 200) return false;

  const ck = _audioCacheKey(normalized, 'groq:' + voice);

  const cached = await _getCachedAudio(ck);
  if (cached) {
    await _playCachedAudio(cached);
    _lastTTSEngine = 'groq';
    return true;
  }

  try {
    const params = new URLSearchParams({ text: normalized, voice });
    const url = `${import.meta.env.BASE_URL}api/groq-tts?${params}`;
    const audio = new Audio(url);
    _currentTTSAudio = audio;
    const wait = new Promise((resolve) => {
      audio.onended = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
    });
    // Guard: if a newer TTS request started while we were buffering, abandon.
    if (_ttsGen !== expectedGen) { audio.pause(); try { audio.src = ''; } catch {} return false; }
    await audio.play();
    // Guard again: if replaced between buffering and play resolving, stop.
    if (_ttsGen !== expectedGen) { audio.pause(); try { audio.src = ''; } catch {} return false; }
    fetch(url).then(r => r.ok ? r.arrayBuffer() : null).then(buf => buf && _setCachedAudio(ck, buf)).catch(() => { });
    _lastTTSEngine = 'groq';
    await wait;
    return true;
  } catch {
    return false;
  }
};

/**
 * geminiTTSSpeak(text, gender)
 * High-quality synthesis via Google Gemini Multimodal.
 * Proxies to /api/gemini-tts. Works instantly with your Gemini API key.
 */
const geminiTTSSpeak = async (text, gender, expectedGen = _ttsGen) => {
  // Use gender-appropriate Gemini voices
  const voice = gender === 'female' ? 'aoede' : 'puck';
  const normalized = normalizeTTSText(text);
  const ck = _audioCacheKey(normalized, 'gemini:' + voice);

  const cached = await _getCachedAudio(ck);
  if (cached) {
    await _playCachedAudio(cached);
    _lastTTSEngine = 'gemini';
    return true;
  }

  try {
    const params = new URLSearchParams({ text: normalized, voice });
    const url = `${import.meta.env.BASE_URL}api/gemini-tts?${params}`;
    const audio = new Audio(url);
    _currentTTSAudio = audio;
    const wait = new Promise((resolve) => {
      audio.onended = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
      audio.onerror = () => { if (_currentTTSAudio === audio) _currentTTSAudio = null; resolve(); };
    });
    if (_ttsGen !== expectedGen) { audio.pause(); try { audio.src = ''; } catch {} return false; }
    await audio.play();
    if (_ttsGen !== expectedGen) { audio.pause(); try { audio.src = ''; } catch {} return false; }
    fetch(url).then(r => r.ok ? r.arrayBuffer() : null).then(buf => buf && _setCachedAudio(ck, buf)).catch(() => { });
    _lastTTSEngine = 'gemini';
    await wait;
    return true;
  } catch {
    return false;
  }
};


// Keeps a reference to the current Audio element so we can cancel it before
// starting a new utterance.
let _currentTTSAudio = null;

/**
 * elevenLabsSpeak(text, voiceId, interrupt = true)
 * Now purely Edge TTS (UK or US depending on accent toggle) with browser
 * speechSynthesis as the only fallback. ElevenLabs has been removed.
 */
const elevenLabsSpeak = async (text, voiceId = DEFAULT_ELEVENLABS_VOICE_ID, interrupt = true) => {
  if (!text || !text.trim()) return;

  const normalizedText = normalizeTTSText(text);
  if (!normalizedText) return;

  // Stop any currently-playing audio only if requested
  if (interrupt) {
    if (_currentTTSAudio) { _currentTTSAudio.pause(); _currentTTSAudio = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  const isArabic = hasArabicText(normalizedText);
  const gender = voiceId === ELEVENLABS_SARAH_ID ? 'female' : 'male';

  // --- Edge TTS (primary for all English text) ---
  if (!isArabic) {
    const ok = await edgeTTSSpeak(normalizedText, gender);
    if (ok) return;
    // VERCEL FIX: Do NOT fall back to browser speechSynthesis for English.
    // On Vercel, if Edge TTS fails (network error, cold-start timeout) and we
    // let speechSynthesis fire, the browser's robotic voice blends with any
    // partial Edge TTS audio that's still loading — causing the "two voices"
    // problem. Silence is better than a blended robotic mess.
    return;
  }

  // --- Browser speech synthesis (Arabic ONLY) ---
  if (isArabic && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.92;
    utterance.onstart = () => { _lastTTSEngine = 'browser'; };
    window.speechSynthesis.speak(utterance);
  }
};

/**
 * fetchTTSBlob(text, gender, accent)
 * Fetches the audio data as a Blob for pre-buffering.
 * Uses Groq (Orpheus) as the primary engine for speed.
 */
const fetchTTSBlob = async (text, gender, accent) => {
  const normalized = normalizeTTSText(text);
  const voice = EDGE_VOICES[accent === 'us' ? 'us' : 'uk'][gender === 'female' ? 'female' : 'male'];
  const ck = _audioCacheKey(normalized, 'blob:' + voice);

  // Try local cache first — instant, no network
  const cached = await _getCachedAudio(ck);
  if (cached) return new Blob([cached], { type: 'audio/mpeg' });

  // VERCEL FIX: Skip Groq (4s timeout blocks the auto-read queue on Vercel).
  // Go straight to Edge TTS which is the only reliable engine on Vercel.
  // Groq can be re-enabled locally by uncommenting the block below.

  /* LOCAL-ONLY — uncomment to enable Groq on localhost:
  try {
    const groqVoice = gender === 'female' ? 'alice' : 'adam';
    const groqParams = new URLSearchParams({ text: normalized, voice: groqVoice });
    const groqUrl = '/api/groq-tts?' + groqParams;
    const groqCtrl = new AbortController();
    const groqTimer = setTimeout(() => groqCtrl.abort(), 4000);
    try {
      const response = await fetch(groqUrl, { signal: groqCtrl.signal });
      clearTimeout(groqTimer);
      if (!response.ok) throw new Error('not ok');
      const buf = await response.arrayBuffer();
      _setCachedAudio(ck, buf);
      return new Blob([buf], { type: 'audio/mpeg' });
    } catch { clearTimeout(groqTimer); }
  } catch { }
  */

  // ── Edge TTS (primary on Vercel, buffered full response) ──
  try {
    const voice = EDGE_VOICES[accent === 'us' ? 'us' : 'uk'][gender === 'female' ? 'female' : 'male'];
    const params = new URLSearchParams({ text: normalized, voice });
    const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
    const url = `${base}api/edge-tts?${params}`;
    const edgeCtrl = new AbortController();
    const edgeTimer = setTimeout(() => edgeCtrl.abort(), 15000);
    try {
      const response = await fetch(url, { signal: edgeCtrl.signal });
      clearTimeout(edgeTimer);
      if (!response.ok) throw new Error('edge not ok');
      const buf = await response.arrayBuffer();
      _setCachedAudio(ck, buf);
      return new Blob([buf], { type: 'audio/mpeg' });
    } catch { clearTimeout(edgeTimer); }
  } catch { /* ignore */ }

  return null;
};

/**
 * prefetchTTS(text, gender, accent)
 * Just a wrapper for fetchTTSBlob to keep compatibility or background fill.
 */
const prefetchTTS = (text, gender, accent) => {
  fetchTTSBlob(text, gender, accent).catch(() => { });
};

/**
 * _streamAudioResponse(response)
 * Pipes a streaming fetch Response into an <audio> element via MediaSource so
 * playback starts as soon as the first audio chunk arrives — no waiting for the
 * full download. Falls back to blob if MediaSource doesn't support audio/mpeg
 * (e.g. Firefox).
 */
const STREAM_MIME = 'audio/mpeg';
const _streamAudioResponse = async (response) => {
  const useMS = typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported(STREAM_MIME);

  if (!useMS) {
    // Blob fallback (Firefox / older Safari)
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentTTSAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); if (_currentTTSAudio === audio) _currentTTSAudio = null; };
    audio.onerror = () => { URL.revokeObjectURL(url); if (_currentTTSAudio === audio) _currentTTSAudio = null; };
    await audio.play();
    return audio;
  }

  const ms = new MediaSource();
  const url = URL.createObjectURL(ms);
  const audio = new Audio(url);
  _currentTTSAudio = audio;
  audio.onended = () => { URL.revokeObjectURL(url); if (_currentTTSAudio === audio) _currentTTSAudio = null; };
  audio.onerror = () => { URL.revokeObjectURL(url); if (_currentTTSAudio === audio) _currentTTSAudio = null; };

  // Begin playback immediately — browser starts as soon as enough data buffers
  const playPromise = audio.play();

  await new Promise(resolve => ms.addEventListener('sourceopen', resolve, { once: true }));
  const sb = ms.addSourceBuffer(STREAM_MIME);
  const reader = response.body.getReader();

  // Drain chunks into the SourceBuffer in the background
  (async () => {
    try {
      for (; ;) {
        const { done, value } = await reader.read();
        if (done) { if (ms.readyState === 'open') ms.endOfStream(); break; }
        if (sb.updating) await new Promise(r => sb.addEventListener('updateend', r, { once: true }));
        if (ms.readyState !== 'open') break;
        sb.appendBuffer(value);
      }
    } catch { /* stream aborted or audio element gone */ }
  })();

  await playPromise;
  return audio;
};

/**
 * cancelTTS()
 * Stops any in-progress ElevenLabs audio playback.
 */
const cancelTTS = () => {
  if (_currentTTSAudio) {
    _currentTTSAudio.pause();
    _currentTTSAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};

// --- DATA ---
const DEFAULT_VOCABULARY_LIST = [{
  word: "welfare",
  type: "n",
  level: "B2",
  meaning: "رفاهية، رعاية",
  example: "The government is responsible for public welfare.",
  synonyms: "Well-being, health"
}, {
  word: "widespread",
  type: "adj",
  level: "B2",
  meaning: "واسع الانتشار",
  example: "The news caused widespread concern.",
  synonyms: "Prevalent, extensive"
}, {
  word: "wholly",
  type: "adv",
  level: "C1",
  meaning: "كلياً، تماماً",
  example: "The decision was wholly unexpected.",
  synonyms: "Entirely, completely"
}, {
  word: "whereby",
  type: "adv",
  level: "C1",
  meaning: "بموجبه، بواسطته",
  example: "A system whereby students access resources.",
  synonyms: "By which, through which"
}, {
  word: "notwithstanding",
  type: "prep",
  level: "C1",
  meaning: "على الرغم من",
  example: "Notwithstanding the evidence, she believed him.",
  synonyms: "despite, in spite of"
}];
const GRAMMAR_LEVELS = [{
  level: "A1 - مبتدئ",
  topics: ["Subject Pronouns", "Verb to be", "Articles (a, an, the)", "Plural nouns", "Possessive adjectives", "Demonstratives", "Present Simple", "There is / There are", "Have / Has", "Can (ability & permission)", "Adjectives", "Prepositions of place & time", "Imperatives"]
}, {
  level: "A2 - أساسي",
  topics: ["Past Simple", "Past Simple questions & negatives", "Future with will and going to", "Present Continuous", "Countable & Uncountable nouns", "Comparatives & Superlatives", "Adverbs of frequency", "Object pronouns", "Possessive pronouns", "Quantifiers", "Prepositions of movement"]
}, {
  level: "B1 - تحت المتوسط",
  topics: ["Present Perfect Simple", "Present Perfect vs. Past Simple", "Present Perfect Continuous", "Past Continuous", "Future Continuous", "Be going to", "Modals", "Comparisons with as...as", "First Conditional", "Second Conditional", "Relative Clauses", "Question tags"]
}, {
  level: "B2 - فوق المتوسط",
  topics: ["Passive Voice", "Reported Speech", "Used to / Would", "Wish / If only", "Third Conditional", "Mixed Conditionals", "Modals of deduction", "Gerunds & Infinitives", "Complex sentences", "Future Perfect & Future Perfect Continuous"]
}, {
  level: "C1 - متقدم",
  topics: ["Inversion", "Emphasis (cleft sentences)", "Advanced Conditionals", "Subjunctive", "Nominalization", "Advanced Passive", "Phrasal verbs", "Collocations & idiomatic structures", "Reduced relative clauses", "Complex verb patterns"]
}];
const GRAMMAR_CEFR_DETAILED = [
  {
    level: "A1", labelAr: "مبتدئ", labelEn: "Beginner", color: "#22c55e",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["Adjectives vs adverbs: word formation & word order (good → well, quick → quickly)", "Comparative adjectives with -er and more (happier, more comfortable)", "Superlative adjectives with -est and the most (the happiest, the most comfortable)"] },
      { name: "Articles & Quantifiers", nameAr: "أدوات التعريف", rules: ["Articles: a, an, the, zero article (I am a singer. I have books. I feel love.)", "Superlative with the (the best, the most interesting)"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["Zero conditional (If you are ill, go to the doctor.)"] },
      { name: "Future Tenses", nameAr: "المستقبل", rules: ["Future with will for sudden decisions (I will help you.)", "Future with going to for plans (I am going to see my sister.)", "Will for requests (Will you carry my bag, please?)"] },
      { name: "Gerund & Infinitive", nameAr: "المصدر وإن+فعل", rules: ["Verbs followed by infinitive or gerund: like, love, want, would like (I like reading. I want to see my family.)", "Stative verbs: know, like, seem, love, have, want, see"] },
      { name: "Past Tenses", nameAr: "الماضي", rules: ["Past simple for actions in the past (I worked last night. I didn't work.)", "Past simple of TO BE (I was, You were, She was…)", "Past simple: regular and irregular verbs (I visited London. I went to see a film.)"] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["Can / can't for abilities (I can't swim. I can cook.)", "Could / couldn't for past abilities (I could swim when I was five.)", "Could for polite requests (Could you help me?)", "Must / mustn't for obligation & prohibition (I must study. You mustn't smoke.)", "Need / needn't for necessity (You need to finish. You needn't hurry.)", "Can for permission & possibility (Can I bring my dog? I can see you after work.)", "Shall for suggestions (Shall I walk you to work?)"] },
      { name: "Prepositions", nameAr: "حروف الجر", rules: ["Prepositions of place: at, in, on, in front of, under, behind, among, beside, near, next to, between, across, into, through, onto, out of", "By, of, etc."] },
      { name: "Pronouns", nameAr: "الضمائر", rules: ["Personal pronouns (I, he, she, it, we, you, they)", "Possessive pronouns (my, your, his, her, its, our, their)", "Possessive with 's (Paul's daughter, my sister's house)", "Object pronouns (me, you, him, her, it, us, them)", "Demonstrative pronouns (this, that, these, those)", "Pronouns: something, anything"] },
      { name: "Present Tenses", nameAr: "المضارع", rules: ["Have got: positive, negative, question (I have got blond hair. Has she got a car?)", "Have (I have breakfast at 8.)", "To be (I am, You are, He is…)", "There is / There are (There is a book. There are books.)", "Present simple for habits (I wake up at 8 every day.)", "Adverbs of frequency: always, never, often, seldom, usually (I usually drink coffee.)", "Present progressive for actions now (I am working now.)", "Present perfect with since and for (I have lived alone since 2000.)", "Present perfect with ever and never (Have you ever been to Britain?)", "Present perfect with already and yet (I haven't been yet. I have already done that.)", "Imperative (Stand up! Do this!)"] },
      { name: "Questions", nameAr: "الأسئلة", rules: ["Interrogative pronouns: Where, When, Who, How, What, Which, Whose, What time", "Questions with TO BE (Are they relatives?)", "Questions with HAVE GOT (Have you got a car?)", "Questions with Present simple (Do you speak English?)", "Questions with Past simple (Did he do it? Was he at home?)", "Question tags (She is Spanish, isn't she?)"] },
    ]
  },
  {
    level: "A2", labelAr: "أساسي", labelEn: "Elementary", color: "#84cc16",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["Adjectives vs adverbs (quick → quickly, sudden → suddenly, bad → badly)", "Comparatives with -er and more (older, more expensive)", "Superlatives with -est and the most (the biggest, the most interesting)", "Irregular adjectives: less, good, bad, more", "Use of than (She is a better driver than me.)", "Adverbial phrases of time, place and frequency — including word order"] },
      { name: "Articles & Quantifiers", nameAr: "أدوات التعريف", rules: ["A, an, the, zero article (a book, an orange, the book, students)", "Superlatives with the (He is the best man I have ever met.)"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["Zero conditional (Take medicine if you feel ill.)", "First conditional (If it rains tomorrow, I will stay home.)", "First conditional with unless, if only (I will come unless you cancel.)", "Wish (I wish I was taller.)"] },
      { name: "Conjunctions", nameAr: "أدوات الربط", rules: ["Relative clauses: where, when, whose, who, that", "Basic compound sentences (I went out when it was raining. She is the woman who can speak five languages.)"] },
      { name: "Future Tenses", nameAr: "المستقبل", rules: ["Will for sudden decisions (I will show you how to use the laptop.)", "Going to for plans (Sarah is going to sell her car.)", "Present simple for future (The plane leaves at 8.)", "Present progressive for future plans (He is not working tomorrow.)", "Will for requests / Shall for suggestions"] },
      { name: "Gerund & Infinitive", nameAr: "المصدر وإن+فعل", rules: ["Verbs + infinitive or gerund: want, plan, decide, try, hope, expect, offer, forget, need, promise, refuse, learn", "Stative verbs: like, know, belong, love, hate, want, understand, seem, prefer"] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["Can / can't for abilities", "Could / couldn't for past abilities", "Could for polite requests", "Must for obligation / Mustn't for prohibition", "Have to for obligations in present and past (I had to go to the dentist.)", "Must vs have to distinction", "Need / needn't / have to for necessity and permission", "Should for giving advice (You should sleep more.)"] },
      { name: "Past Tenses", nameAr: "الماضي", rules: ["Past simple: actions in the past (I worked. I didn't work. Did you work?)", "Past simple of TO BE", "Regular and irregular verbs", "Past progressive (I was watching the game.)", "Past progressive interrupted by past simple (I was playing when the phone rang.)", "Major irregular verbs"] },
      { name: "Prepositions", nameAr: "حروف الجر", rules: ["Prepositions of place: at, in, on, in front of, under, behind, etc.", "Prepositions of time: on, in, for, at", "Prepositional phrases: on foot, etc.", "By, of, with"] },
      { name: "Present Tenses", nameAr: "المضارع", rules: ["TO BE / There is / There are", "Have got (positive, negative)", "Present simple for habits & daily routines", "Present simple for future (The bank opens at 8.)", "Adverbs of frequency + word order (She ate quickly.)", "Present progressive now and for future", "Present perfect with since, for, ever, never, already, yet"] },
      { name: "Pronouns", nameAr: "الضمائر", rules: ["Personal, possessive, object, demonstrative pronouns", "Possessive with 's", "Reflexive pronouns: myself, himself, herself, etc."] },
      { name: "Questions", nameAr: "الأسئلة", rules: ["Interrogative pronouns: Where, When, Who, How, What, Which, Whose", "Questions with TO BE, HAVE GOT, Present simple/progressive, Past simple/progressive, Present perfect", "Question tags (You have a cat, don't you?)"] },
    ]
  },
  {
    level: "B1", labelAr: "تحت المتوسط", labelEn: "Pre-Intermediate", color: "#3b82f6",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["Adjectives -ed vs -ing (boring vs bored, tiring vs tired)", "Adverbs of frequency and their word order (I never smoke. I am never late.)", "Comparatives and superlatives of irregular adjectives (little – less – the least)", "Same as, the same (You're just the same as your mother.)", "As… as (He isn't as old as he looks.)", "Like, alike, slightly (You look like your mother. She is slightly taller.)"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["Zero conditional", "First conditional (If you are late, I will be angry.)", "Second conditional (If they had time, they would go on holiday.)", "Third conditional (We would have won if we had played better.)"] },
      { name: "Conjunctions", nameAr: "أدوات الربط", rules: ["Cause, effect and contrast: so, which, until, why, while, when, as, before, after, as long as, whenever"] },
      { name: "Future Tenses", nameAr: "المستقبل", rules: ["Will for sudden decisions (I will phone tomorrow.)", "Future progressive (Will you be going away this summer?)", "Going to for plans", "Passive voice in future (The report will be done by tomorrow.)"] },
      { name: "Gerund & Infinitive", nameAr: "المصدر وإن+فعل", rules: ["Verbs + infinitive: want, hope, need, plan, expect, promise, decide, offer, refuse, try, forget, learn, would like", "Verbs + gerund: enjoy, mind, finish, suggest", "Verbs + infinitive or gerund: stop", "Forming nouns from verbs using -ing (swim → swimming)"] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["May / might for probability and polite requests", "Can / can't in past (She can't have seen me.)", "Can for polite request and probability", "Could for ability and probability (Alcohol could cause cancer.)", "Must vs have to / Must/can't for deduction (That must be the entrance. It can't be far.)", "Be able to in past, present perfect and future", "Ought to for obligation", "Need / needn't — present and past", "Mustn't for obligation", "Shall for suggestions and polite offers"] },
      { name: "Past Tenses", nameAr: "الماضي", rules: ["Past simple", "Past progressive (In 2010 we were living in Australia.)", "Past perfect (When I arrived, everybody had left.)", "Past perfect progressive (I had been playing basketball.)", "Used to (I used to have a dog.)", "Passive voice in past tenses", "Reported speech (She said she loved the film.)"] },
      { name: "Prepositions", nameAr: "حروف الجر", rules: ["Prepositional phrases with in, for, from, to, at, about, with, of", "Among, Until, On, At, In"] },
      { name: "Present Tenses", nameAr: "المضارع", rules: ["Present simple and progressive", "Present perfect with for, since, yet, already, never, ever, just", "Present perfect progressive (I have been learning English forever.)", "Passive voice in present tenses", "Present progressive and simple for future", "Reported speech", "There is / There are"] },
      { name: "Pronouns", nameAr: "الضمائر", rules: ["Pronouns: something, anything, nothing", "Reflexive pronouns: myself, himself, herself, itself, ourselves, yourselves, themselves"] },
      { name: "Questions", nameAr: "الأسئلة", rules: ["Complex question tags (It was raining, wasn't it? You did it, didn't you?)", "Wh- questions (Who is she with? What are they like? What kind of job do you need?)"] },
    ]
  },
  {
    level: "B2", labelAr: "فوق المتوسط", labelEn: "Upper-Intermediate", color: "#f59e0b",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["Adjectives -ed vs -ing", "Adverbs of frequency and word order", "Comparative and superlative of irregular adjectives (far – further/farther – furthest/farthest)", "Same as, the same / As… as / Like, alike, slightly"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["Zero, first, second, third conditionals", "Mixed conditional (If I had worked harder, I would have a better job now.)", "Wish (I wish I was taller. I wish I had done that earlier.)"] },
      { name: "Future Tenses", nameAr: "المستقبل", rules: ["Will / Going to / Future progressive", "Will and going to for prediction", "Will get used to (I will get used to living in a city.)", "Passive voice in future / Reported speech in future", "Future perfect (We will have been married for ten years.)", "Future perfect progressive"] },
      { name: "Gerund & Infinitive", nameAr: "المصدر وإن+فعل", rules: ["Forming nouns from verbs using -ing", "Verbs + gerund: decide, hate, suggest, remember, prefer, try, etc.", "Verbs + infinitive: hope, advise, manage, mind, etc.", "Verbs + bare infinitive: I'd rather, had better", "Verbs + to + gerund: look forward to, help, etc."] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["May / might for probability and polite requests", "May and might for deduction or speculation (I might look for another job.)", "Can / can't have done (It could have been Sarah.)", "Can / could for polite requests and probability", "Could for ability, probability, and deduction", "Must vs have to / Have got to", "Must have done (She must have been asleep.)", "Must / can't for deduction", "Be able to in past, present perfect, future", "Ought to / Need / Needn't / Needn't have done", "Mustn't / Shall / Should / Should have done", "Would expressing past habits (My dad would read me stories every night.)", "Reported speech modals"] },
      { name: "Past Tenses", nameAr: "الماضي", rules: ["Past simple (active & questions)", "Past progressive", "Past perfect (She found the keys she had lost.)", "Past perfect progressive (We had been playing tennis all evening.)", "Used to / Was used to / Got used to", "Had something done (I had my hair cut.)", "Passive voice of all past tenses", "Reported speech / Past tenses for narration", "All irregular verbs"] },
      { name: "Prepositions", nameAr: "حروف الجر", rules: ["Prepositional phrases with in, for, from, to, at, about, with, of, etc.", "Among, Until, On, At, In case, By, Of, With, About, To, For, Out of"] },
      { name: "Present Tenses", nameAr: "المضارع", rules: ["Present simple (including stative verbs: like, prefer, understand, want, know, believe)", "Present simple and progressive for future", "Present progressive with always (She is always screaming.)", "Present perfect with for, since, yet, already, never, ever, just, recently", "Present perfect progressive", "Passive voice of all present tenses", "Reported speech", "Is used to / get used to in all present tenses", "To have something done (I have had my hair cut.)"] },
      { name: "Pronouns", nameAr: "الضمائر", rules: ["Pronouns: something, anything, someone, anyone, somewhere, anywhere, etc.", "Reflexive pronouns", "Relative pronouns for relative clauses: which, who, whose, whom, that, where, when"] },
      { name: "Questions", nameAr: "الأسئلة", rules: ["Complex question tags (I'm going to get an email, aren't I?)", "Wh- questions (How long ago…)", "Auxiliary verbs: either, neither, So do I, I hope so, etc."] },
    ]
  },
  {
    level: "C1", labelAr: "متقدم", labelEn: "Advanced", color: "#ef4444",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["All forms of adjectives and adverbs", "Inversion with negative adverbials (Never have I seen… / Not only did she… / Hardly had he…)"] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["Modals in the past: could have done, may have seen, should have done, might have found, would have been", "Advanced modal distinctions and nuances"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["All conditional forms (zero through mixed)", "Wish / if only for expressing regrets (I wish I had studied harder. If only I had known.)", "Mixed conditionals combining past, present, and future"] },
      { name: "Vocabulary & Collocations", nameAr: "المفردات والتراكيب", rules: ["Phrasal verbs — all forms", "Splitting phrasal verbs (She shut the door up.)", "Idioms — all forms and registers", "Advanced collocations and idiomatic structures across all topics"] },
    ]
  },
];

const SPEAKING_TOPICS = ["محادثة حرة (Free Talk)", "السفر والمطارات (Travel & Airports)", "العمل والمقابلات (Work & Interviews)", "الهوايات والاهتمامات (Hobbies)", "الطعام والمطاعم (Food)", "التسوق (Shopping)", "الصحة واللياقة (Health & Fitness)", "التكنولوجيا الذكية (Technology)", "الرياضة (Sports)", "العائلة والأصدقاء (Family & Friends)", "التعليم والجامعة (Education)", "الترفيه والأفلام (Movies)", "الروتين اليومي (Daily Routine)", "خطط المستقبل (Future Plans)", "ذكريات الطفولة (Childhood)", "الثقافات والتقاليد (Cultures)", "البيئة والطبيعة (Environment)", "وسائل التواصل (Social Media)", "الكتب والأدب (Books)", "الأخبار والأحداث (News)", "الموضة والأزياء (Fashion)", "الفنون والموسيقى (Art & Music)", "العلوم والفضاء (Science)", "الأهداف والطموحات (Goals)", "وسائل النقل (Transportation)", "الحيوانات الأليفة (Pets)", "العطلات والمناسبات (Holidays)", "العلاقات الاجتماعية (Relationships)", "ريادة الأعمال (Entrepreneurship)", "التحديات والمصاعب (Challenges)"];

const formatCountdown = (nextReview) => {
  if (!nextReview) return '00:00:00';
  const diff = nextReview - Date.now();
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- MAIN APPLICATION COMPONENT ---
function AppInner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userLevel, setUserLevel] = useState(localStorage.getItem('userLevel') || 'B2');
  const [globalVocab, setGlobalVocab] = useState(() => {
    try {
      const saved = localStorage.getItem('venoxa_global_vocab');
      return saved ? JSON.parse(saved) : DEFAULT_VOCABULARY_LIST;
    } catch { return DEFAULT_VOCABULARY_LIST; }
  });
  const [phrasalVocab, setPhrasalVocab] = useState(() => JSON.parse(localStorage.getItem('venoxa_phrasal_vocab')) || []);
  const [idiomsVocab, setIdiomsVocab] = useState(() => JSON.parse(localStorage.getItem('venoxa_idioms_vocab')) || []);
  const [idiomsProperVocab, setIdiomsProperVocab] = useState(() => JSON.parse(localStorage.getItem('venoxa_idioms_proper_vocab')) || []);
  const [langeekVocab, setLangeekVocab] = useState(() => JSON.parse(localStorage.getItem('venoxa_langeek_vocab')) || []);
  const [customGlobalVocab, setCustomGlobalVocab] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_custom_global_vocab')) || []; } catch { return []; }
  });
  const [customPhrasalVocab, setCustomPhrasalVocab] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_custom_phrasal_vocab')) || []; } catch { return []; }
  });
  const [customIdiomsVocab, setCustomIdiomsVocab] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_custom_idioms_vocab')) || []; } catch { return []; }
  });
  const [customIdiomsProperVocab, setCustomIdiomsProperVocab] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_custom_idioms_proper_vocab')) || []; } catch { return []; }
  });
  const [customLangeekVocab, setCustomLangeekVocab] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_custom_langeek_vocab')) || []; } catch { return []; }
  });
  const [srsData, setSrsData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_srs_data')) || {}; } catch { return {}; }
  });
  const [phrasalSrs, setPhrasalSrs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_phrasal_srs')) || {}; } catch { return {}; }
  });
  const [idiomsSrs, setIdiomsSrs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_idioms_srs')) || {}; } catch { return {}; }
  });
  const [idiomsProperSrs, setIdiomsProperSrs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_idioms_proper_srs')) || {}; } catch { return {}; }
  });
  const [langeekSrsData, setLangeekSrsData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_langeek_srs_data')) || {}; } catch { return {}; }
  });
  const [speakingHistory, setSpeakingHistory] = useState(() => JSON.parse(localStorage.getItem('venoxa_speaking_history')) || []);
  const [writingHistory, setWritingHistory] = useState(() => JSON.parse(localStorage.getItem('venoxa_writing_history')) || []);
  const [translationHistory, setTranslationHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_translation_history')) || []; } catch { return []; }
  });
  const [translationFavorites, setTranslationFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_translation_favorites')) || []; } catch { return []; }
  });
  const [savedWords, setSavedWords] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_saved_words')) || []; } catch { return []; }
  });
  const [savedIdioms, setSavedIdioms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_saved_idioms')) || []; } catch { return []; }
  });

  const [toneRewriterFavorites, setToneRewriterFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_tone_rewriter_favorites')) || []; } catch { return []; }
  });
  const [toneRewriterHistory, setToneRewriterHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_tone_rewriter_history')) || []; } catch { return []; }
  });
  const [sentenceDiagrammerFavorites, setSentenceDiagrammerFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_sentence_diagrammer_favorites')) || []; } catch { return []; }
  });
  const [sentenceDiagrammerHistory, setSentenceDiagrammerHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_sentence_diagrammer_history')) || []; } catch { return []; }
  });
  const [wordFamilyFavorites, setWordFamilyFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_word_family_favorites')) || []; } catch { return []; }
  });
  const [wordFamilyHistory, setWordFamilyHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_word_family_history')) || []; } catch { return []; }
  });
  const [collocationFavorites, setCollocationFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_collocations_favorites')) || []; } catch { return []; }
  });
  const [collocationHistory, setCollocationHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_collocations_history')) || []; } catch { return []; }
  });
  const [etymologyFavorites, setEtymologyFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_etymology_favorites')) || []; } catch { return []; }
  });
  const [etymologyHistory, setEtymologyHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_etymology_history')) || []; } catch { return []; }
  });
  const [pronBookmarks, setPronBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_pron_bookmarks')) || []; } catch { return []; }
  });
  const [pronCompleted, setPronCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_pron_completed')) || []; } catch { return []; }
  });
  const [testSessions, setTestSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa-test-sessions')) || []; } catch { return []; }
  });
  const [listeningHistory, setListeningHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_listening_history')) || []; } catch { return []; }
  });
  const [listeningFavorites, setListeningFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_listening_favorites')) || []; } catch { return []; }
  });
  const [readingHistory, setReadingHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_reading_history')) || []; } catch { return []; }
  });
  const [readingFavorites, setReadingFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_reading_favorites')) || []; } catch { return []; }
  });
  const [speakingFavorites, setSpeakingFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_speaking_favorites')) || []; } catch { return []; }
  });
  const [wordOfDayHistory, setWordOfDayHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_word_of_day_history')) || []; } catch { return []; }
  });
  const [idiomOfDayHistory, setIdiomOfDayHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_idiom_of_day_history')) || []; } catch { return []; }
  });
  const [isCloudProgressLoaded, setIsCloudProgressLoaded] = useState(false);

  // ── Dirty Fields Tracker & State Setters Rebuild ──
  const dirtyFields = useRef(new Set());
  const blockDirtyTracking = useRef(false);

  const markFieldDirty = (fieldName) => {
    if (blockDirtyTracking.current) return;
    dirtyFields.current.add(fieldName);
  };

  const mergeByWord = (base = [], override = []) => {
    if (!override || override.length === 0) return base;
    const map = new Map(base.map(w => [w.word?.toLowerCase(), w]));
    for (const w of override) {
      if (w.word) map.set(w.word.toLowerCase(), w);
    }
    return Array.from(map.values());
  };

  // Merge custom vocabs with bundled vocabs whenever custom vocabs change
  useEffect(() => {
    loadBundledVocab().then(bundled => {
      const merged = mergeByWord(bundled.globalVocab, customGlobalVocab);
      setGlobalVocab(merged);
    }).catch(console.warn);
  }, [customGlobalVocab]);

  useEffect(() => {
    loadBundledVocab().then(bundled => {
      const merged = mergeByWord(bundled.phrasalVocab, customPhrasalVocab);
      setPhrasalVocab(merged);
    }).catch(console.warn);
  }, [customPhrasalVocab]);

  useEffect(() => {
    loadBundledVocab().then(bundled => {
      const merged = mergeByWord(bundled.slangVocab, customIdiomsVocab);
      setIdiomsVocab(merged);
    }).catch(console.warn);
  }, [customIdiomsVocab]);

  useEffect(() => {
    loadBundledVocab().then(bundled => {
      const merged = mergeByWord(bundled.idiomsVocab, customIdiomsProperVocab);
      setIdiomsProperVocab(merged);
    }).catch(console.warn);
  }, [customIdiomsProperVocab]);

  useEffect(() => {
    loadBundledVocab().then(bundled => {
      const merged = mergeByWord(bundled.langeekVocab, customLangeekVocab);
      setLangeekVocab(merged);
    }).catch(console.warn);
  }, [customLangeekVocab]);

  // Wrapped Setters
  const setSrsDataWrapped = (val) => {
    setSrsData(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('srsData');
      return next;
    });
  };
  const setLangeekSrsDataWrapped = (val) => {
    setLangeekSrsData(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('langeekSrsData');
      return next;
    });
  };
  const setPhrasalSrsWrapped = (val) => {
    setPhrasalSrs(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('phrasalSrs');
      return next;
    });
  };
  const setIdiomsSrsWrapped = (val) => {
    setIdiomsSrs(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('idiomsSrs');
      return next;
    });
  };
  const setIdiomsProperSrsWrapped = (val) => {
    setIdiomsProperSrs(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('idiomsProperSrs');
      return next;
    });
  };
  const setSpeakingHistoryWrapped = (val) => {
    setSpeakingHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('speakingHistory');
      return next;
    });
  };
  const setWritingHistoryWrapped = (val) => {
    setWritingHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('writingHistory');
      return next;
    });
  };
  const setTranslationHistoryWrapped = (val) => {
    setTranslationHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('translationHistory');
      return next;
    });
  };
  const setTranslationFavoritesWrapped = (val) => {
    setTranslationFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('translationFavorites');
      return next;
    });
  };
  const setSavedWordsWrapped = (val) => {
    setSavedWords(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('savedWords');
      return next;
    });
  };
  const setSavedIdiomsWrapped = (val) => {
    setSavedIdioms(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('savedIdioms');
      return next;
    });
  };
  const setToneRewriterFavoritesWrapped = (val) => {
    setToneRewriterFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('toneRewriterFavorites');
      return next;
    });
  };
  const setToneRewriterHistoryWrapped = (val) => {
    setToneRewriterHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('toneRewriterHistory');
      return next;
    });
  };
  const setSentenceDiagrammerFavoritesWrapped = (val) => {
    setSentenceDiagrammerFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('sentenceDiagrammerFavorites');
      return next;
    });
  };
  const setSentenceDiagrammerHistoryWrapped = (val) => {
    setSentenceDiagrammerHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('sentenceDiagrammerHistory');
      return next;
    });
  };
  const setWordFamilyFavoritesWrapped = (val) => {
    setWordFamilyFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('wordFamilyFavorites');
      return next;
    });
  };
  const setWordFamilyHistoryWrapped = (val) => {
    setWordFamilyHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('wordFamilyHistory');
      return next;
    });
  };
  const setCollocationFavoritesWrapped = (val) => {
    setCollocationFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('collocationFavorites');
      return next;
    });
  };
  const setCollocationHistoryWrapped = (val) => {
    setCollocationHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('collocationHistory');
      return next;
    });
  };
  const setEtymologyFavoritesWrapped = (val) => {
    setEtymologyFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('etymologyFavorites');
      return next;
    });
  };
  const setEtymologyHistoryWrapped = (val) => {
    setEtymologyHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('etymologyHistory');
      return next;
    });
  };
  const setPronBookmarksWrapped = (val) => {
    setPronBookmarks(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('pronBookmarks');
      return next;
    });
  };
  const setPronCompletedWrapped = (val) => {
    setPronCompleted(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('pronCompleted');
      return next;
    });
  };
  const setTestSessionsWrapped = (val) => {
    setTestSessions(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('testSessions');
      return next;
    });
  };
  const setListeningHistoryWrapped = (val) => {
    setListeningHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('listeningHistory');
      return next;
    });
  };
  const setListeningFavoritesWrapped = (val) => {
    setListeningFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('listeningFavorites');
      return next;
    });
  };
  const setReadingHistoryWrapped = (val) => {
    setReadingHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('readingHistory');
      return next;
    });
  };
  const setReadingFavoritesWrapped = (val) => {
    setReadingFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('readingFavorites');
      return next;
    });
  };
  const setSpeakingFavoritesWrapped = (val) => {
    setSpeakingFavorites(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('speakingFavorites');
      return next;
    });
  };
  const setWordOfDayHistoryWrapped = (val) => {
    setWordOfDayHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('wordOfDayHistory');
      return next;
    });
  };
  const setIdiomOfDayHistoryWrapped = (val) => {
    setIdiomOfDayHistory(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('idiomOfDayHistory');
      return next;
    });
  };

  // Wrapped vocabulary setters
  const setGlobalVocabWrapped = (val) => {
    const parsedData = typeof val === 'function' ? val(customGlobalVocab) : val;
    setCustomGlobalVocab(parsedData);
    localStorage.setItem('venoxa_custom_global_vocab', JSON.stringify(parsedData));
    markFieldDirty('customGlobalVocab');
  };
  const setPhrasalVocabWrapped = (val) => {
    const parsedData = typeof val === 'function' ? val(customPhrasalVocab) : val;
    setCustomPhrasalVocab(parsedData);
    localStorage.setItem('venoxa_custom_phrasal_vocab', JSON.stringify(parsedData));
    markFieldDirty('customPhrasalVocab');
  };
  const setIdiomsVocabWrapped = (val) => {
    const parsedData = typeof val === 'function' ? val(customIdiomsVocab) : val;
    setCustomIdiomsVocab(parsedData);
    localStorage.setItem('venoxa_custom_idioms_vocab', JSON.stringify(parsedData));
    markFieldDirty('customIdiomsVocab');
  };
  const setIdiomsProperVocabWrapped = (val) => {
    const parsedData = typeof val === 'function' ? val(customIdiomsProperVocab) : val;
    setCustomIdiomsProperVocab(parsedData);
    localStorage.setItem('venoxa_custom_idioms_proper_vocab', JSON.stringify(parsedData));
    markFieldDirty('customIdiomsProperVocab');
  };
  const setLangeekVocabWrapped = (val) => {
    const parsedData = typeof val === 'function' ? val(customLangeekVocab) : val;
    setCustomLangeekVocab(parsedData);
    localStorage.setItem('venoxa_custom_langeek_vocab', JSON.stringify(parsedData));
    markFieldDirty('customLangeekVocab');
  };

  const setLocalAvatarWrapped = (newAvatar) => {
    setLocalAvatar(newAvatar);
    localStorage.setItem('venoxa_local_avatar', newAvatar);
    markFieldDirty('avatar');
  };

  const setUserLevelWrapped = (lvl) => {
    setUserLevel(lvl);
    localStorage.setItem('userLevel', lvl);
    markFieldDirty('level');
  };

  const setCompletedCellsWrapped = (val) => {
    setCompletedCells(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('completedCells');
      markFieldDirty('calendarDays');
      return next;
    });
  };

  const setCalendarProgressWrapped = (val) => {
    setCalendarProgress(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('calendarProgress');
      markFieldDirty('cellDates');
      return next;
    });
  };

  const setCellDatesWrapped = (val) => {
    setCellDates(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('cellDates');
      return next;
    });
  };

  const setStreakDataWrapped = (val) => {
    setStreakData(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      markFieldDirty('streak');
      return next;
    });
  };


  const [token, setToken] = useState(() => localStorage.getItem('venoxa_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('venoxa_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [localAvatar, setLocalAvatar] = useState(
    () => localStorage.getItem('venoxa_local_avatar') || ''
  );
  // Also sync from user.avatar if no local override exists (e.g. after login)
  useEffect(() => {
    if (!localStorage.getItem('venoxa_local_avatar') && user?.avatar) {
      setLocalAvatar(user.avatar);
    }
  }, [user?.avatar]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const syncStatusTimerRef = useRef(null);
  const latestLocalRef = useRef({});

  // ── Auth state listener (validates stored JWT on page load) ──
  useEffect(() => {
    const unsubscribe = onAuthChange(async (validatedUser) => {
      if (validatedUser) {
        // Update user state immediately with validated user data from Firestore
        setUser(validatedUser);
        localStorage.setItem('venoxa_user', JSON.stringify(validatedUser));

        const storedToken = localStorage.getItem('venoxa_token') || await auth.currentUser?.getIdToken();
        if (storedToken) {
          setToken(storedToken);
          localStorage.setItem('venoxa_token', storedToken);

          // ── Load vocab (custom words) from Firestore, merge with bundled ──
          // NOTE: We use loadAllVocabFromStorage which reads from Firestore custom fields
          // and merges with bundled vocab. This is a one-time fetch on auth, not real-time.
          loadAllVocabFromStorage().then(vocabs => {
            if (vocabs.globalVocab?.length)  { setGlobalVocab(vocabs.globalVocab);   localStorage.setItem('venoxa_global_vocab',       JSON.stringify(vocabs.globalVocab));  }
            if (vocabs.phrasalVocab?.length) { setPhrasalVocab(vocabs.phrasalVocab); localStorage.setItem('venoxa_phrasal_vocab',      JSON.stringify(vocabs.phrasalVocab)); }
            if (vocabs.idiomsVocab?.length)  { setIdiomsProperVocab(vocabs.idiomsVocab); localStorage.setItem('venoxa_idioms_proper_vocab', JSON.stringify(vocabs.idiomsVocab)); }
            if (vocabs.slangVocab?.length)   { setIdiomsVocab(vocabs.slangVocab);    localStorage.setItem('venoxa_idioms_vocab',        JSON.stringify(vocabs.slangVocab));   }
            if (vocabs.langeekVocab?.length) { setLangeekVocab(vocabs.langeekVocab); localStorage.setItem('venoxa_langeek_vocab',       JSON.stringify(vocabs.langeekVocab)); }
            // After vocabs load, pull progress once (safe merge, respects dirty flags)
            pullChanges().then(() => setIsCloudProgressLoaded(true)).catch(console.warn);
          }).catch(err => {
            console.warn('loadAllVocabFromStorage failed:', err);
            // Still pull progress even if vocab fetch fails
            pullChanges().then(() => setIsCloudProgressLoaded(true)).catch(console.warn);
          });
        }
      } else {
        setToken(null);
        setUser(null);
        setIsCloudProgressLoaded(false);
        localStorage.removeItem('venoxa_token');
        localStorage.removeItem('venoxa_user');

        // ── Load default bundled vocabulary for guest / logged-out user ──
        loadAllVocabFromStorage().then(vocabs => {
          if (vocabs.globalVocab?.length)  { setGlobalVocab(vocabs.globalVocab);   localStorage.setItem('venoxa_global_vocab',       JSON.stringify(vocabs.globalVocab));  }
          if (vocabs.phrasalVocab?.length) { setPhrasalVocab(vocabs.phrasalVocab); localStorage.setItem('venoxa_phrasal_vocab',      JSON.stringify(vocabs.phrasalVocab)); }
          if (vocabs.idiomsVocab?.length)  { setIdiomsProperVocab(vocabs.idiomsVocab); localStorage.setItem('venoxa_idioms_proper_vocab', JSON.stringify(vocabs.idiomsVocab)); }
          if (vocabs.slangVocab?.length)   { setIdiomsVocab(vocabs.slangVocab);    localStorage.setItem('venoxa_idioms_vocab',        JSON.stringify(vocabs.slangVocab));   }
          if (vocabs.langeekVocab?.length) { setLangeekVocab(vocabs.langeekVocab); localStorage.setItem('venoxa_langeek_vocab',       JSON.stringify(vocabs.langeekVocab)); }
        }).catch(err => console.warn('Guest loadAllVocabFromStorage failed:', err));
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      const result = await fbLogin(email, password);
      if (!result.success) return result;
      const { token: jwt, user: userData } = result;
      setToken(jwt);
      setUser(userData);
      localStorage.setItem('venoxa_token', jwt);
      localStorage.setItem('venoxa_user', JSON.stringify(userData));
      setIsCloudProgressLoaded(true);
      await syncProgress(jwt, userData, null, true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (fields) => {
    try {
      const result = await fbRegister(fields);
      if (!result.success) return result;
      const { token: jwt, user: userData } = result;
      setToken(jwt);
      setUser(userData);
      localStorage.setItem('venoxa_token', jwt);
      localStorage.setItem('venoxa_user', JSON.stringify(userData));
      setIsCloudProgressLoaded(true);
      await syncProgress(jwt, userData, null, true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const verifyEmailCode = async (email, code) => {
    try {
      const result = await fbVerifyEmail(email, code);
      if (!result.success) return result;
      const { token: jwt, user: userData } = result;
      setToken(jwt);
      setUser(userData);
      localStorage.setItem('venoxa_token', jwt);
      localStorage.setItem('venoxa_user', JSON.stringify(userData));
      setIsCloudProgressLoaded(true);
      await syncProgress(jwt, userData, null, true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resendEmailVerification = async (email) => {
    try {
      const result = await fbResendVerification(email);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      const result = await fbSendPasswordReset(email);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await fbLogout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('venoxa_token');
    localStorage.removeItem('venoxa_user');
  };

  const updateProfile = async (updates) => {
    if (!token) return;
    try {
      const updated = await fbUpdateProfile(token, updates);
      setUser(updated);
      localStorage.setItem('venoxa_user', JSON.stringify(updated));
      if (updates.level) {
        setUserLevel(updates.level);
        localStorage.setItem('userLevel', updates.level);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ── Gather all syncable localStorage data into a single object ──
  const _gatherSyncPayload = (customCells = null) => {
    const cells = customCells || JSON.parse(localStorage.getItem('venoxa_completed_cells')) || {};
    const localStreak = JSON.parse(localStorage.getItem('venoxa_streak')) || { current: 0 };
    const localLevel = localStorage.getItem('userLevel') || 'B2';
    const usageTime = JSON.parse(localStorage.getItem('venoxa_usage_time')) || JSON.parse(localStorage.getItem('venoxa_daily_usage_secs')) || {};
    const localAv = localStorage.getItem('venoxa_local_avatar') || '';
    const gVocab = JSON.parse(localStorage.getItem('venoxa_global_vocab')) || [];
    const pVocab = JSON.parse(localStorage.getItem('venoxa_phrasal_vocab')) || [];
    const iVocab = JSON.parse(localStorage.getItem('venoxa_idioms_vocab')) || [];
    const ipVocab = JSON.parse(localStorage.getItem('venoxa_idioms_proper_vocab')) || [];
    const lVocab = JSON.parse(localStorage.getItem('venoxa_langeek_vocab')) || [];
    const sHistory = JSON.parse(localStorage.getItem('venoxa_speaking_history')) || [];
    const wHistory = JSON.parse(localStorage.getItem('venoxa_writing_history')) || [];
    const srs = srsData;
    const lSrs = langeekSrsData;
    // Additional SRS stores (previously local-only, now synced via InsForge)
    const pSrs = phrasalSrs;
    const iSrs = idiomsSrs;
    const ipSrs = idiomsProperSrs;
    // Study plan config & studied words
    let planCfg = {};
    try { planCfg = JSON.parse(localStorage.getItem('venoxa-plan-v3')) || {}; } catch {}
    let studied = [];
    try { studied = JSON.parse(localStorage.getItem('studiedWords')) || []; } catch {}

    const tHistory = translationHistory;
    const tFavorites = translationFavorites;
    const sWords = savedWords;
    const sIdioms = savedIdioms;

    return {
      xp: Object.values(cells).filter(v => v === 'done').length * 15,
      streak: localStreak.current,
      level: localLevel,
      completedCells: cells,
      usageTime,
      calendarDays: Object.keys(cells).filter(k => k.length >= 10),
      calendarProgress: JSON.parse(localStorage.getItem('venoxa_calendar_progress')) || {},
      cellDates: JSON.parse(localStorage.getItem('venoxa_cell_dates')) || {},
      avatar: localAv || undefined,
      achievements: [],

      speakingHistory: sHistory,
      writingHistory: wHistory,
      srsData: srs,
      langeekSrsData: lSrs,
      phrasalSrs: pSrs,
      idiomsSrs: iSrs,
      idiomsProperSrs: ipSrs,
      planConfig: planCfg,
      studiedWords: studied,
      translationHistory: tHistory,
      translationFavorites: tFavorites,
      savedWords: sWords,
      savedIdioms: sIdioms,
      toneRewriterFavorites,
      toneRewriterHistory,
      sentenceDiagrammerFavorites,
      sentenceDiagrammerHistory,
      wordFamilyFavorites,
      wordFamilyHistory,
      collocationFavorites,
      collocationHistory,
      etymologyFavorites,
      etymologyHistory,
      pronBookmarks,
      pronCompleted,
      listeningHistory,
      listeningFavorites,
      readingHistory,
      readingFavorites,
      speakingFavorites,
      wordOfDayHistory,
      idiomOfDayHistory,
      // keep references for diff-checking later
      _local: { 
        sHistory, wHistory, srs, lSrs, pSrs, iSrs, ipSrs, localAv, 
        translationHistory: tHistory, translationFavorites: tFavorites, savedWords: sWords, savedIdioms: sIdioms,
        toneRewriterFavorites, toneRewriterHistory, sentenceDiagrammerFavorites, sentenceDiagrammerHistory,
        wordFamilyFavorites, wordFamilyHistory, collocationFavorites, collocationHistory, etymologyFavorites, etymologyHistory,
        pronBookmarks, pronCompleted, testSessions,
        listeningHistory, listeningFavorites, readingHistory, readingFavorites, speakingFavorites,
        wordOfDayHistory, idiomOfDayHistory
      }
    };
  };

  const lastSyncSnapshot = useRef({});

  const detectDirtyFields = (currentPayload) => {
    const dirty = new Set(dirtyFields.current);
    const snapshot = lastSyncSnapshot.current;
    
    // completedCells / calendarDays
    if (JSON.stringify(currentPayload.completedCells) !== JSON.stringify(snapshot.completedCells)) {
      dirty.add('completedCells');
      dirty.add('calendarDays');
    }
    
    // usageTime
    if (JSON.stringify(currentPayload.usageTime) !== JSON.stringify(snapshot.usageTime)) {
      dirty.add('usageTime');
    }

    // level
    if (currentPayload.level !== snapshot.level) {
      dirty.add('level');
    }

    // streak
    if (currentPayload.streak !== snapshot.streak) {
      dirty.add('streak');
    }

    // avatar
    if (currentPayload.avatar !== snapshot.avatar) {
      dirty.add('avatar');
    }

    // calendarProgress
    if (JSON.stringify(currentPayload.calendarProgress) !== JSON.stringify(snapshot.calendarProgress)) {
      dirty.add('calendarProgress');
    }

    // cellDates
    if (JSON.stringify(currentPayload.cellDates) !== JSON.stringify(snapshot.cellDates)) {
      dirty.add('cellDates');
    }

    return dirty;
  };

  const pushChanges = async (force = false) => {
    if (!token) return;
    if (!isCloudProgressLoaded && !force) {
      console.log('pushChanges blocked: cloud progress not loaded yet');
      return;
    }

    const currentPayload = _gatherSyncPayload();
    const dirty = detectDirtyFields(currentPayload);

    if (dirty.size === 0) {
      console.log('pushChanges: nothing is dirty, skipping push');
      return;
    }

    console.log('pushChanges: pushing dirty fields:', Array.from(dirty));
    setSyncStatus('syncing');

    try {
      const delta = {};
      for (const field of dirty) {
        if (field === 'xp') {
          delta.xp = currentPayload.xp;
        } else if (field === 'calendarDays') {
          delta.calendarDays = currentPayload.calendarDays;
        } else if (field === 'customGlobalVocab') {
          delta.customGlobalVocab = customGlobalVocab;
        } else if (field === 'customPhrasalVocab') {
          delta.customPhrasalVocab = customPhrasalVocab;
        } else if (field === 'customIdiomsVocab') {
          delta.customIdiomsVocab = customIdiomsVocab;
        } else if (field === 'customIdiomsProperVocab') {
          delta.customIdiomsProperVocab = customIdiomsProperVocab;
        } else if (field === 'customLangeekVocab') {
          delta.customLangeekVocab = customLangeekVocab;
        } else if (currentPayload.hasOwnProperty(field)) {
          delta[field] = currentPayload[field];
        }
      }

      await pushProgress(auth.currentUser?.uid, delta);

      for (const field of dirty) {
        lastSyncSnapshot.current[field] = JSON.parse(
          JSON.stringify(currentPayload[field] !== undefined ? currentPayload[field] : (delta[field] !== undefined ? delta[field] : {}))
        );
        dirtyFields.current.delete(field);
      }

      localStorage.setItem('venoxa_last_sync_snapshot', JSON.stringify(lastSyncSnapshot.current));

      setSyncStatus('synced');
      if (syncStatusTimerRef.current) clearTimeout(syncStatusTimerRef.current);
      syncStatusTimerRef.current = setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('pushChanges failed:', err);
      setSyncErrorMsg(err.message || String(err));
      setSyncStatus('error');
      if (syncStatusTimerRef.current) clearTimeout(syncStatusTimerRef.current);
      syncStatusTimerRef.current = setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const pullChanges = async (force = false) => {
    if (!token) return;
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      console.log('pullChanges: pulling latest remote data from Firestore');
      const remote = await pullProgress(uid);
      if (!remote) return;

      blockDirtyTracking.current = true;
      let changed = false;

      const applyRemoteIfSafe = (field, setLocalState, storageKey, isArray = false, isObject = false) => {
        if (dirtyFields.current.has(field)) {
          console.log(`pullChanges: Field '${field}' is dirty locally. Skipping remote overwrite.`);
          return;
        }

        const localVal = _gatherSyncPayload()[field];
        const remoteVal = remote[field];

        if (remoteVal !== undefined) {
          const localStr = JSON.stringify(localVal);
          const remoteStr = JSON.stringify(remoteVal);
          
          if (localStr !== remoteStr) {
            console.log(`pullChanges: Field '${field}' updated from remote.`);
            if (field === 'customGlobalVocab') {
              setCustomGlobalVocab(remoteVal);
              localStorage.setItem('venoxa_custom_global_vocab', remoteStr);
            } else if (field === 'customPhrasalVocab') {
              setCustomPhrasalVocab(remoteVal);
              localStorage.setItem('venoxa_custom_phrasal_vocab', remoteStr);
            } else if (field === 'customIdiomsVocab') {
              setCustomIdiomsVocab(remoteVal);
              localStorage.setItem('venoxa_custom_idioms_vocab', remoteStr);
            } else if (field === 'customIdiomsProperVocab') {
              setCustomIdiomsProperVocab(remoteVal);
              localStorage.setItem('venoxa_custom_idioms_proper_vocab', remoteStr);
            } else if (field === 'customLangeekVocab') {
              setCustomLangeekVocab(remoteVal);
              localStorage.setItem('venoxa_custom_langeek_vocab', remoteStr);
            } else {
              setLocalState(remoteVal);
              if (storageKey) {
                localStorage.setItem(storageKey, isObject || isArray ? remoteStr : remoteVal);
              }
            }
            lastSyncSnapshot.current[field] = JSON.parse(remoteStr);
            changed = true;
          }
        }
      };

      applyRemoteIfSafe('srsData', setSrsData, 'venoxa_srs_data', false, true);
      applyRemoteIfSafe('langeekSrsData', setLangeekSrsData, 'venoxa_langeek_srs_data', false, true);
      applyRemoteIfSafe('phrasalSrs', setPhrasalSrs, 'venoxa_phrasal_srs', false, true);
      applyRemoteIfSafe('idiomsSrs', setIdiomsSrs, 'venoxa_idioms_srs', false, true);
      applyRemoteIfSafe('idiomsProperSrs', setIdiomsProperSrs, 'venoxa_idioms_proper_srs', false, true);

      applyRemoteIfSafe('speakingHistory', setSpeakingHistory, 'venoxa_speaking_history', true);
      applyRemoteIfSafe('writingHistory', setWritingHistory, 'venoxa_writing_history', true);
      applyRemoteIfSafe('translationHistory', setTranslationHistory, 'venoxa_translation_history', true);
      applyRemoteIfSafe('translationFavorites', setTranslationFavorites, 'venoxa_translation_favorites', true);
      applyRemoteIfSafe('savedWords', setSavedWords, 'venoxa_saved_words', true);
      applyRemoteIfSafe('savedIdioms', setSavedIdioms, 'venoxa_saved_idioms', true);

      applyRemoteIfSafe('toneRewriterFavorites', setToneRewriterFavorites, 'venoxa_tone_rewriter_favorites', true);
      applyRemoteIfSafe('toneRewriterHistory', setToneRewriterHistory, 'venoxa_tone_rewriter_history', true);
      applyRemoteIfSafe('sentenceDiagrammerFavorites', setSentenceDiagrammerFavorites, 'venoxa_sentence_diagrammer_favorites', true);
      applyRemoteIfSafe('sentenceDiagrammerHistory', setSentenceDiagrammerHistory, 'venoxa_sentence_diagrammer_history', true);
      applyRemoteIfSafe('wordFamilyFavorites', setWordFamilyFavorites, 'venoxa_word_family_favorites', true);
      applyRemoteIfSafe('wordFamilyHistory', setWordFamilyHistory, 'venoxa_word_family_history', true);
      applyRemoteIfSafe('collocationFavorites', setCollocationFavorites, 'venoxa_collocations_favorites', true);
      applyRemoteIfSafe('collocationHistory', setCollocationHistory, 'venoxa_collocations_history', true);
      applyRemoteIfSafe('etymologyFavorites', setEtymologyFavorites, 'venoxa_etymology_favorites', true);
      applyRemoteIfSafe('etymologyHistory', setEtymologyHistory, 'venoxa_etymology_history', true);
      applyRemoteIfSafe('pronBookmarks', setPronBookmarks, 'venoxa_pron_bookmarks', true);
      applyRemoteIfSafe('pronCompleted', setPronCompleted, 'venoxa_pron_completed', true);
      applyRemoteIfSafe('testSessions', setTestSessions, 'venoxa-test-sessions', true);
      applyRemoteIfSafe('listeningHistory', setListeningHistory, 'venoxa_listening_history', true);
      applyRemoteIfSafe('listeningFavorites', setListeningFavorites, 'venoxa_listening_favorites', true);
      applyRemoteIfSafe('readingHistory', setReadingHistory, 'venoxa_reading_history', true);
      applyRemoteIfSafe('readingFavorites', setReadingFavorites, 'venoxa_reading_favorites', true);
      applyRemoteIfSafe('speakingFavorites', setSpeakingFavorites, 'venoxa_speaking_favorites', true);
      applyRemoteIfSafe('wordOfDayHistory', setWordOfDayHistory, 'venoxa_word_of_day_history', true);
      applyRemoteIfSafe('idiomOfDayHistory', setIdiomOfDayHistory, 'venoxa_idiom_of_day_history', true);

      applyRemoteIfSafe('customGlobalVocab', null, 'venoxa_custom_global_vocab', true);
      applyRemoteIfSafe('customPhrasalVocab', null, 'venoxa_custom_phrasal_vocab', true);
      applyRemoteIfSafe('customIdiomsVocab', null, 'venoxa_custom_idioms_vocab', true);
      applyRemoteIfSafe('customIdiomsProperVocab', null, 'venoxa_custom_idioms_proper_vocab', true);
      applyRemoteIfSafe('customLangeekVocab', null, 'venoxa_custom_langeek_vocab', true);

      applyRemoteIfSafe('calendarProgress', setCalendarProgress, 'venoxa_calendar_progress', false, true);
      applyRemoteIfSafe('cellDates', setCellDates, 'venoxa_cell_dates', false, true);

      if (!dirtyFields.current.has('completedCells') && remote.completedCells) {
        const localCells = JSON.parse(localStorage.getItem('venoxa_completed_cells')) || {};
        if (JSON.stringify(localCells) !== JSON.stringify(remote.completedCells)) {
          setCompletedCells(remote.completedCells);
          localStorage.setItem('venoxa_completed_cells', JSON.stringify(remote.completedCells));
          lastSyncSnapshot.current.completedCells = JSON.parse(JSON.stringify(remote.completedCells));
          changed = true;
        }
      }


      if (!dirtyFields.current.has('level') && remote.level) {
        const localLvl = localStorage.getItem('userLevel') || 'B2';
        if (localLvl !== remote.level) {
          setUserLevel(remote.level);
          localStorage.setItem('userLevel', remote.level);
          lastSyncSnapshot.current.level = remote.level;
          changed = true;
        }
      }

      if (!dirtyFields.current.has('avatar') && remote.avatar) {
        const localAv = localStorage.getItem('venoxa_local_avatar') || '';
        if (localAv !== remote.avatar) {
          setLocalAvatar(remote.avatar);
          localStorage.setItem('venoxa_local_avatar', remote.avatar);
          lastSyncSnapshot.current.avatar = remote.avatar;
          changed = true;
        }
      }

      if (!dirtyFields.current.has('streak') && remote.streak !== undefined) {
        const localStreak = JSON.parse(localStorage.getItem('venoxa_streak')) || { current: 0 };
        if (remote.streak > localStreak.current) {
          const newStreak = { current: remote.streak, lastDate: localStreak.lastDate || new Date().toISOString().slice(0, 10) };
          setStreakData(newStreak);
          localStorage.setItem('venoxa_streak', JSON.stringify(newStreak));
          lastSyncSnapshot.current.streak = remote.streak;
          changed = true;
        }
      }

      if (!dirtyFields.current.has('usageTime') && remote.usageTime) {
        const localUsage = JSON.parse(localStorage.getItem('venoxa_daily_usage_secs')) || {};
        let usageChanged = false;
        const mergedUsage = { ...localUsage };
        for (const [day, secs] of Object.entries(remote.usageTime)) {
          if ((mergedUsage[day] || 0) < secs) {
            mergedUsage[day] = secs;
            usageChanged = true;
          }
        }
        if (usageChanged) {
          localStorage.setItem('venoxa_daily_usage_secs', JSON.stringify(mergedUsage));
          localStorage.setItem('venoxa_usage_time', JSON.stringify(mergedUsage));
          lastSyncSnapshot.current.usageTime = JSON.parse(JSON.stringify(mergedUsage));
          changed = true;
        }
      }

      if (changed) {
        const lightProfile = {
          uid: remote.uid,
          email: remote.email || auth.currentUser?.email || '',
          username: remote.username || 'New Learner',
          avatar: remote.avatar || '',
          level: remote.level || 'B2',
          streak: remote.streak || 0,
          xp: remote.xp || 0,
        };
        setUser(lightProfile);
        localStorage.setItem('venoxa_user', JSON.stringify(lightProfile));
      }

      localStorage.setItem('venoxa_last_sync_snapshot', JSON.stringify(lastSyncSnapshot.current));
    } catch (err) {
      console.warn('pullChanges failed:', err);
    } finally {
      setIsCloudProgressLoaded(true);  // Always unblock pushes, even if pull failed
      blockDirtyTracking.current = false;
    }
  };

  const syncProgress = async (currentToken = token, currentUser = user, customCells = null, force = false) => {
    if (!currentToken) return;
    if (force) {
      await pushChanges(true);
      await pullChanges(true);
    } else {
      if (dirtyFields.current.size > 0) {
        await pushChanges();
      } else {
        await pullChanges();
      }
    }
  };

  // ── Sync on mount (existing token from localStorage) and on token change ──
  useEffect(() => {
    if (token) {
      try {
        const savedSnapshot = localStorage.getItem('venoxa_last_sync_snapshot');
        if (savedSnapshot) {
          lastSyncSnapshot.current = JSON.parse(savedSnapshot);
        }
      } catch {}
      pullChanges().catch(() => {}).finally(() => {
        setIsCloudProgressLoaded(true);
      });
    }
  }, [token]);

  // ── Sync when tab visibility changes (critical for multi-device) ──
  useEffect(() => {
    if (!token) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pullChanges();
      } else if (document.visibilityState === 'hidden') {
        pushChanges();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [token]);

  // ── Periodic background sync every 5 minutes ──
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (dirtyFields.current.size > 0) {
        pushChanges();
      } else {
        pullChanges();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  // ── Best-effort sync on tab close ──
  useEffect(() => {
    if (!token) return;
    const handleUnload = () => {
      try {
        const currentPayload = _gatherSyncPayload();
        const dirty = detectDirtyFields(currentPayload);
        if (dirty.size > 0) {
          const delta = {};
          for (const field of dirty) {
            if (field === 'xp') {
              delta.xp = currentPayload.xp;
            } else if (field === 'calendarDays') {
              delta.calendarDays = currentPayload.calendarDays;
            } else if (field === 'customGlobalVocab') {
              delta.customGlobalVocab = customGlobalVocab;
            } else if (field === 'customPhrasalVocab') {
              delta.customPhrasalVocab = customPhrasalVocab;
            } else if (field === 'customIdiomsVocab') {
              delta.customIdiomsVocab = customIdiomsVocab;
            } else if (field === 'customIdiomsProperVocab') {
              delta.customIdiomsProperVocab = customIdiomsProperVocab;
            } else if (field === 'customLangeekVocab') {
              delta.customLangeekVocab = customLangeekVocab;
            } else if (currentPayload.hasOwnProperty(field)) {
              delta[field] = currentPayload[field];
            }
          }
          pushProgress(auth.currentUser?.uid, delta);
        }
      } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [token]);

  const [planMeta, setPlanMeta] = useState(() => {
    try {
      const raw = localStorage.getItem('venoxa-plan-v3');
      return raw ? JSON.parse(raw)?.planMeta || null : null;
    } catch { return null; }
  });
  // Blocks cloud sync from re-applying a planMeta after the user intentionally resets
  const planResetBlockRef = useRef(false);
  const [completedCells, setCompletedCells] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_completed_cells')) || {}; } catch { return {}; }
  });
  const [cellDates, setCellDates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_cell_dates')) || {}; } catch { return {}; }
  });
  const [calendarProgress, setCalendarProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_calendar_progress')) || {}; } catch { return {}; }
  });
  const [streakData, setStreakData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('venoxa_streak')) || { current: 0, lastDate: null };
    } catch { return { current: 0, lastDate: null }; }
  });

  const recordActivity = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStreakData(prev => {
      if (prev.lastDate === today) return prev;
      let newStreak = 1;
      if (prev.lastDate) {
        const last = new Date(prev.lastDate);
        const current = new Date(today);
        const diffDays = Math.floor((current - last) / 86400000);
        if (diffDays === 1) {
          newStreak = prev.current + 1;
        } else if (diffDays === 0) {
          newStreak = prev.current;
        } else {
          newStreak = 1;
        }
      }
      const newData = { current: newStreak, lastDate: today };
      localStorage.setItem('venoxa_streak', JSON.stringify(newData));
      return newData;
    });
  };
  const weekSyncBlockedRef = useRef(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    try {
      const raw = localStorage.getItem('venoxa-plan-v3');
      return raw ? JSON.parse(raw)?.currentWeek || 1 : 1;
    } catch { return 1; }
  });

  const dailyGoalPct = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayDone = Object.entries(completedCells || {})
      .filter(([key, val]) => val === 'done' && cellDates[key] === today)
      .length;
    return Math.min(100, Math.round((todayDone / 6) * 100)) || 0;
  }, [completedCells, cellDates]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'venoxa_local_avatar') setLocalAvatar(e.newValue || '');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => localStorage.setItem('venoxa_global_vocab', JSON.stringify(globalVocab)), [globalVocab]);
  useEffect(() => localStorage.setItem('venoxa_phrasal_vocab', JSON.stringify(phrasalVocab)), [phrasalVocab]);
  useEffect(() => localStorage.setItem('venoxa_idioms_vocab', JSON.stringify(idiomsVocab)), [idiomsVocab]);
  useEffect(() => localStorage.setItem('venoxa_idioms_proper_vocab', JSON.stringify(idiomsProperVocab)), [idiomsProperVocab]);
  useEffect(() => localStorage.setItem('venoxa_langeek_vocab', JSON.stringify(langeekVocab)), [langeekVocab]);
  useEffect(() => localStorage.setItem('venoxa_srs_data', JSON.stringify(srsData)), [srsData]);
  useEffect(() => localStorage.setItem('venoxa_phrasal_srs', JSON.stringify(phrasalSrs)), [phrasalSrs]);
  useEffect(() => localStorage.setItem('venoxa_idioms_srs', JSON.stringify(idiomsSrs)), [idiomsSrs]);
  useEffect(() => localStorage.setItem('venoxa_idioms_proper_srs', JSON.stringify(idiomsProperSrs)), [idiomsProperSrs]);
  useEffect(() => localStorage.setItem('venoxa_langeek_srs_data', JSON.stringify(langeekSrsData)), [langeekSrsData]);
  useEffect(() => localStorage.setItem('venoxa_speaking_history', JSON.stringify(speakingHistory)), [speakingHistory]);
  useEffect(() => localStorage.setItem('venoxa_writing_history', JSON.stringify(writingHistory)), [writingHistory]);
  useEffect(() => localStorage.setItem('venoxa_translation_history', JSON.stringify(translationHistory)), [translationHistory]);
  useEffect(() => localStorage.setItem('venoxa_translation_favorites', JSON.stringify(translationFavorites)), [translationFavorites]);
  useEffect(() => localStorage.setItem('venoxa_saved_words', JSON.stringify(savedWords)), [savedWords]);
  useEffect(() => localStorage.setItem('venoxa_saved_idioms', JSON.stringify(savedIdioms)), [savedIdioms]);

  useEffect(() => localStorage.setItem('venoxa_tone_rewriter_favorites', JSON.stringify(toneRewriterFavorites)), [toneRewriterFavorites]);
  useEffect(() => localStorage.setItem('venoxa_tone_rewriter_history', JSON.stringify(toneRewriterHistory)), [toneRewriterHistory]);
  useEffect(() => localStorage.setItem('venoxa_sentence_diagrammer_favorites', JSON.stringify(sentenceDiagrammerFavorites)), [sentenceDiagrammerFavorites]);
  useEffect(() => localStorage.setItem('venoxa_sentence_diagrammer_history', JSON.stringify(sentenceDiagrammerHistory)), [sentenceDiagrammerHistory]);
  useEffect(() => localStorage.setItem('venoxa_word_family_favorites', JSON.stringify(wordFamilyFavorites)), [wordFamilyFavorites]);
  useEffect(() => localStorage.setItem('venoxa_word_family_history', JSON.stringify(wordFamilyHistory)), [wordFamilyHistory]);
  useEffect(() => localStorage.setItem('venoxa_collocations_favorites', JSON.stringify(collocationFavorites)), [collocationFavorites]);
  useEffect(() => localStorage.setItem('venoxa_collocations_history', JSON.stringify(collocationHistory)), [collocationHistory]);
  useEffect(() => localStorage.setItem('venoxa_etymology_favorites', JSON.stringify(etymologyFavorites)), [etymologyFavorites]);
  useEffect(() => localStorage.setItem('venoxa_etymology_history', JSON.stringify(etymologyHistory)), [etymologyHistory]);
  useEffect(() => localStorage.setItem('venoxa_pron_bookmarks', JSON.stringify(pronBookmarks)), [pronBookmarks]);
  useEffect(() => localStorage.setItem('venoxa_pron_completed', JSON.stringify(pronCompleted)), [pronCompleted]);
  useEffect(() => localStorage.setItem('venoxa-test-sessions', JSON.stringify(testSessions)), [testSessions]);
  useEffect(() => localStorage.setItem('venoxa_listening_history', JSON.stringify(listeningHistory)), [listeningHistory]);
  useEffect(() => localStorage.setItem('venoxa_listening_favorites', JSON.stringify(listeningFavorites)), [listeningFavorites]);
  useEffect(() => localStorage.setItem('venoxa_reading_history', JSON.stringify(readingHistory)), [readingHistory]);
  useEffect(() => localStorage.setItem('venoxa_reading_favorites', JSON.stringify(readingFavorites)), [readingFavorites]);
  useEffect(() => localStorage.setItem('venoxa_speaking_favorites', JSON.stringify(speakingFavorites)), [speakingFavorites]);
  useEffect(() => localStorage.setItem('venoxa_word_of_day_history', JSON.stringify(wordOfDayHistory)), [wordOfDayHistory]);
  useEffect(() => localStorage.setItem('venoxa_idiom_of_day_history', JSON.stringify(idiomOfDayHistory)), [idiomOfDayHistory]);

  useEffect(() => {
    latestLocalRef.current = {
      srsData, phrasalSrs, idiomsSrs, idiomsProperSrs, langeekSrsData,
      speakingHistory, writingHistory, completedCells, streakData,
      translationHistory, translationFavorites, savedWords, savedIdioms,
      toneRewriterFavorites, toneRewriterHistory,
      sentenceDiagrammerFavorites, sentenceDiagrammerHistory,
      wordFamilyFavorites, wordFamilyHistory,
      collocationFavorites, collocationHistory,
      etymologyFavorites, etymologyHistory,
      pronBookmarks, pronCompleted, testSessions,
      listeningHistory, listeningFavorites, readingHistory, readingFavorites, speakingFavorites,
      wordOfDayHistory, idiomOfDayHistory
    };
  }, [
    srsData, phrasalSrs, idiomsSrs, idiomsProperSrs, langeekSrsData,
    speakingHistory, writingHistory, completedCells, streakData,
    translationHistory, translationFavorites, savedWords, savedIdioms,
    toneRewriterFavorites, toneRewriterHistory,
    sentenceDiagrammerFavorites, sentenceDiagrammerHistory,
    wordFamilyFavorites, wordFamilyHistory,
    collocationFavorites, collocationHistory,
    etymologyFavorites, etymologyHistory,
    pronBookmarks, pronCompleted, testSessions,
    listeningHistory, listeningFavorites, readingHistory, readingFavorites, speakingFavorites,
    wordOfDayHistory, idiomOfDayHistory
  ]);

  // Debounced background sync to the cloud database when local data is modified.
  // IMPORTANT: Only call pushChanges here, NEVER pullChanges/syncProgress.
  // Calling pull here would update state → re-trigger this effect → infinite loop.
  useEffect(() => {
    if (!token || blockDirtyTracking.current) return;
    const timer = setTimeout(() => {
      pushChanges();
    }, 2500);
    return () => clearTimeout(timer);
  }, [srsData, phrasalSrs, idiomsSrs, idiomsProperSrs, langeekSrsData, speakingHistory, writingHistory, completedCells, streakData, translationHistory, translationFavorites, savedWords, savedIdioms, toneRewriterFavorites, toneRewriterHistory, sentenceDiagrammerFavorites, sentenceDiagrammerHistory, wordFamilyFavorites, wordFamilyHistory, collocationFavorites, collocationHistory, etymologyFavorites, etymologyHistory, pronBookmarks, pronCompleted, testSessions, listeningHistory, listeningFavorites, readingHistory, readingFavorites, speakingFavorites, wordOfDayHistory, idiomOfDayHistory]);
  const [srsRefreshTick, setSrsRefreshTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setSrsRefreshTick(t => t + 1), 30000);
    return () => clearInterval(int);
  }, []);
  const vocabDueCount = useMemo(() => {
    const now = Date.now();
    return globalVocab.filter(w => { const d = srsData[w.word]; return d && d.nextReview <= now; }).length;
  }, [globalVocab, srsData, srsRefreshTick]);
  const langeekDueCount = useMemo(() => {
    const now = Date.now();
    return langeekVocab.filter(w => { const d = langeekSrsData[w.word]; return d && d.nextReview <= now; }).length;
  }, [langeekVocab, langeekSrsData, srsRefreshTick]);
  const [theme, setTheme] = useState(localStorage.getItem('venoxa_theme') || 'light');
  const [lang, setLang] = useState(localStorage.getItem('venoxa_lang') || 'ar');
  useEffect(() => {
    localStorage.setItem('venoxa_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ── Force white background on print — the inline style on the root div
  //    has higher specificity than CSS @media print rules, so we override
  //    it directly via beforeprint/afterprint events.
  useEffect(() => {
    const rootDiv = document.getElementById('venoxa-root-div');
    const beforePrint = () => {
      if (rootDiv) {
        rootDiv.style.setProperty('background', '#ffffff', 'important');
        rootDiv.style.setProperty('color', '#1e293b', 'important');
        rootDiv.style.setProperty('height', 'auto', 'important');
        rootDiv.style.setProperty('overflow', 'visible', 'important');
      }
      document.documentElement.style.setProperty('background', '#ffffff', 'important');
      document.body.style.setProperty('background', '#ffffff', 'important');
    };
    const afterPrint = () => {
      if (rootDiv) {
        rootDiv.style.removeProperty('background');
        rootDiv.style.removeProperty('color');
        rootDiv.style.removeProperty('height');
        rootDiv.style.removeProperty('overflow');
      }
      document.documentElement.style.removeProperty('background');
      document.body.style.removeProperty('background');
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  // ── Favicon fix: inject an SVG favicon so the Venoxa logo shows on the tab ──
  useEffect(() => {
    const svgFavicon = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#7C3AED"/><path d="M8 10 L16 22 L24 10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="16" cy="10" r="2.5" fill="white"/></svg>`)}`;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = svgFavicon;
  }, []);
  useEffect(() => {
    localStorage.setItem('venoxa_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navDropdownRef = useRef(null);
  useEffect(() => {
    const handleNavDropdownClick = (e) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) document.addEventListener('mousedown', handleNavDropdownClick);
    return () => document.removeEventListener('mousedown', handleNavDropdownClick);
  }, [activeDropdown]);
  useEffect(() => {
    localStorage.setItem('userLevel', userLevel);
  }, [userLevel]);
  const renderContent = () => {
    const props = {
      userLevel,
      setUserLevel: setUserLevelWrapped,
      AI_KEY: GEMINI_API_KEY,
      lang,
      theme
    };
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setTab={setActiveTab} {...props} planMeta={planMeta} completedCells={completedCells} cellDates={cellDates} currentWeek={currentWeek} streakData={streakData} />;
      case 'plan':
        return <StudyPlan 
          {...props} 
          globalVocab={globalVocab}
          langeekVocab={langeekVocab}
          planMeta={planMeta} 
          setPlanMeta={setPlanMeta} 
          completedCells={completedCells} 
          setCompletedCells={setCompletedCellsWrapped}
          currentWeek={currentWeek}
          setCurrentWeek={setCurrentWeek}
          recordActivity={recordActivity}
          token={token}
          user={user}
          syncProgress={syncProgress}
          planResetBlockRef={planResetBlockRef}
          weekSyncBlockedRef={weekSyncBlockedRef}
        />;
      case 'vocab':
        return <Vocabulary {...props} globalVocab={globalVocab} setGlobalVocab={setGlobalVocabWrapped} srsData={srsData} setSrsData={setSrsDataWrapped} />;
      case 'phrasal':
        return <PhrasalVerbs {...props} phrasalVocab={phrasalVocab} setPhrasalVocab={setPhrasalVocabWrapped} phrasalSrs={phrasalSrs} setPhrasalSrs={setPhrasalSrsWrapped} />;
      case 'idioms':
        return <IdiomsSlang {...props} idiomsVocab={idiomsVocab} setIdiomsVocab={setIdiomsVocabWrapped} idiomsSrs={idiomsSrs} setIdiomsSrs={setIdiomsSrsWrapped} />;
      case 'idioms-proper':
        return <IdiomsProper {...props} idiomsProperVocab={idiomsProperVocab} setIdiomsProperVocab={setIdiomsProperVocabWrapped} idiomsProperSrs={idiomsProperSrs} setIdiomsProperSrs={setIdiomsProperSrsWrapped} />;
      case 'test-gen':
        return <TestGenerator {...props} sessions={testSessions} setSessions={setTestSessionsWrapped} />;
      case 'grammar':
        return <Grammar {...props} />;
      case 'writing':
        return <Writing {...props} writingHistory={writingHistory} setWritingHistory={setWritingHistoryWrapped} />;
      case 'speaking':
        return <Speaking {...props} speakingHistory={speakingHistory} setSpeakingHistory={setSpeakingHistoryWrapped} favorites={speakingFavorites} setFavorites={setSpeakingFavoritesWrapped} />;
      case 'listening':
        return <ListeningReading type="listening" {...props} history={listeningHistory} setHistory={setListeningHistoryWrapped} favorites={listeningFavorites} setFavorites={setListeningFavoritesWrapped} />;
      case 'reading':
        return <ListeningReading type="reading" {...props} history={readingHistory} setHistory={setReadingHistoryWrapped} favorites={readingFavorites} setFavorites={setReadingFavoritesWrapped} />;
      case 'langeek':
        return <Langeek {...props} langeekVocab={langeekVocab} setLangeekVocab={setLangeekVocabWrapped} langeekSrsData={langeekSrsData} setLangeekSrsData={setLangeekSrsDataWrapped} />;
      case 'pronunciation':
        return <Pronunciation lang={lang} theme={theme} AI_KEY={GEMINI_API_KEY} speakFn={async (text, gender, accentKey) => {
          const saved = _voiceAccent;
          if (accentKey === 'us' || accentKey === 'uk') _voiceAccent = accentKey;
          try { await edgeTTSSpeak(text, gender); } finally { _voiceAccent = saved; }
        }} bookmarks={pronBookmarks} setBookmarks={setPronBookmarksWrapped} completed={pronCompleted} setCompleted={setPronCompletedWrapped} />;
      case 'smart-translation':
        return <SmartTranslation
          lang={lang}
          theme={theme}
          AI_KEY={GEMINI_API_KEY}
          translationHistory={translationHistory}
          setTranslationHistory={setTranslationHistoryWrapped}
          translationFavorites={translationFavorites}
          setTranslationFavorites={setTranslationFavoritesWrapped}
          speakFn={async (text, gender, accentKey) => {
            const saved = _voiceAccent;
            if (accentKey === 'us' || accentKey === 'uk') _voiceAccent = accentKey;
            try { await edgeTTSSpeak(text, gender); } finally { _voiceAccent = saved; }
          }}
        />;
      case 'timer':
        return <TimerTool lang={lang} theme={theme} timerState={timerState} setTimerState={setTimerState} />;
      case 'tone-rewriter':
        return <ToneRewriter 
          lang={lang} 
          theme={theme} 
          favorites={toneRewriterFavorites}
          setFavorites={setToneRewriterFavoritesWrapped}
          history={toneRewriterHistory}
          setHistory={setToneRewriterHistoryWrapped}
        />;
      case 'sentence-diagrammer':
        return <SentenceDiagrammer 
          lang={lang} 
          theme={theme} 
          favorites={sentenceDiagrammerFavorites}
          setFavorites={setSentenceDiagrammerFavoritesWrapped}
          history={sentenceDiagrammerHistory}
          setHistory={setSentenceDiagrammerHistoryWrapped}
        />;
      case 'minimal-pairs':
        return <MinimalPairs lang={lang} theme={theme} />;
      case 'word-family':
        return <WordFamilyExplorer 
          lang={lang} 
          theme={theme} 
          favorites={wordFamilyFavorites}
          setFavorites={setWordFamilyFavoritesWrapped}
          history={wordFamilyHistory}
          setHistory={setWordFamilyHistoryWrapped}
        />;
      case 'collocations':
        return <CollocationFinder 
          lang={lang} 
          theme={theme} 
          favorites={collocationFavorites}
          setFavorites={setCollocationFavoritesWrapped}
          history={collocationHistory}
          setHistory={setCollocationHistoryWrapped}
        />;
      case 'etymology':
        return <EtymologyExplorer 
          lang={lang} 
          theme={theme} 
          favorites={etymologyFavorites}
          setFavorites={setEtymologyFavoritesWrapped}
          history={etymologyHistory}
          setHistory={setEtymologyHistoryWrapped}
        />;
      case 'word-of-day':
        return <WordOfTheDay lang={lang} theme={theme} savedWords={savedWords} setSavedWords={setSavedWordsWrapped} history={wordOfDayHistory} setHistory={setWordOfDayHistoryWrapped} />;
      case 'idiom-of-day':
        return <IdiomOfTheDay lang={lang} theme={theme} savedIdioms={savedIdioms} setSavedIdioms={setSavedIdiomsWrapped} history={idiomOfDayHistory} setHistory={setIdiomOfDayHistoryWrapped} />;
      case 'profile':
        return <ProfileDashboard
          {...props}
          token={token}
          user={user}
          logout={logout}
          updateProfile={updateProfile}
          completedCells={completedCells}
          streakData={streakData}
          planMeta={planMeta}
          currentWeek={currentWeek}
          dailyGoalPct={dailyGoalPct}
          calendarProgress={calendarProgress}
          onCalendarUpdate={setCalendarProgressWrapped}
          onAvatarChange={(newAvatar) => setLocalAvatarWrapped(newAvatar)}
          readingHistory={readingHistory}
          listeningHistory={listeningHistory}
          speakingHistory={speakingHistory}
          writingHistory={writingHistory}
          srsData={srsData}
          onOpenAuth={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
        />;
      default:
        return <Dashboard setTab={setActiveTab} {...props} planMeta={planMeta} completedCells={completedCells} cellDates={cellDates} currentWeek={currentWeek} streakData={streakData} />;
    }
  };
  // ── Persistent Timer State (survives section changes) ──
  const [timerState, setTimerState] = useState({
    preset: 0, custMins: 25, custSecs: 0,
    secsLeft: null, totalSecs: 1500, running: false, done: false,
  });

  // Keep ticking even when navigated away
  const appTimerRef = useRef(null);
  useEffect(() => {
    if (!timerState.running) return;
    appTimerRef.current = setInterval(() => {
      setTimerState(s => {
        if (!s.running || s.secsLeft === null || s.secsLeft <= 0) return s;
        const next = s.secsLeft - 1;
        if (next === 0) return { ...s, secsLeft: 0, running: false, done: true };
        return { ...s, secsLeft: next };
      });
    }, 1000);
    return () => clearInterval(appTimerRef.current);
  }, [timerState.running]);

  // Tab title while timer is running or paused
  useEffect(() => {
    if (timerState.secsLeft !== null && !timerState.done) {
      const m = Math.floor(timerState.secsLeft / 60);
      const s = timerState.secsLeft % 60;
      const fmt = n => String(n).padStart(2, '0');
      document.title = `${fmt(m)}:${fmt(s)} — Venoxa`;
    } else {
      document.title = 'Venoxa';
    }
    return () => { document.title = 'Venoxa'; };
  }, [timerState.secsLeft, timerState.done]);

  const navItems = [
    { id: 'dashboard', label: _resolveTranslation(lang, 'الرئيسية', 'Dashboard'), icon: Home },
    { id: 'profile', label: _resolveTranslation(lang, 'الملف الشخصي', 'Profile'), icon: User },
    { id: 'plan', label: _resolveTranslation(lang, 'خطة المذاكرة', 'Study Plan'), icon: Calendar },
    {
      id: 'vocab_group',
      label: _resolveTranslation(lang, 'المفردات', 'Vocabulary'),
      icon: BookOpen,
      items: [
        { id: 'vocab', label: _resolveTranslation(lang, 'الكلمات والمراجعة', 'Vocabulary (SRS)'), icon: BookOpen, badge: vocabDueCount },
        { id: 'phrasal', label: _resolveTranslation(lang, 'الأفعال المركبة', 'Phrasal Verbs'), icon: BookText },
        { id: 'idioms', label: _resolveTranslation(lang, 'العامية', 'Slang'), icon: Quote },
        { id: 'idioms-proper', label: _resolveTranslation(lang, 'التعابير الاصطلاحية', 'Idioms'), icon: BookText },
        { id: 'langeek', label: _resolveTranslation(lang, 'لانجيك (PDF)', 'Langeek (PDF)'), icon: Archive, badge: langeekDueCount },
      ],
      badge: vocabDueCount + langeekDueCount
    },
    {
      id: 'skills_group',
      label: _resolveTranslation(lang, 'المهارات', 'Skills'),
      icon: Layers,
      items: [
        { id: 'listening', label: _resolveTranslation(lang, 'الاستماع', 'Listening'), icon: Headphones },
        { id: 'reading', label: _resolveTranslation(lang, 'القراءة (AI)', 'Reading (AI)'), icon: Brain },
        { id: 'speaking', label: _resolveTranslation(lang, 'المحادثة والاتصال', 'Speaking (Call)'), icon: MessageSquare },
        { id: 'writing', label: _resolveTranslation(lang, 'الكتابة (AI)', 'Writing (AI)'), icon: PenTool },
        { id: 'pronunciation', label: _resolveTranslation(lang, 'النطق', 'Pronunciation'), icon: Volume2 },
        { id: 'test-gen', label: _resolveTranslation(lang, 'منشئ الاختبارات', 'Test Generator'), icon: ClipboardList },
      ]
    },
    { id: 'grammar', label: _resolveTranslation(lang, 'القواعد (AI)', 'Grammar (AI)'), icon: FileText },
    {
      id: 'tools_group',
      label: _resolveTranslation(lang, 'الأدوات', 'Tools'),
      icon: Wrench,
      items: [
        { id: 'smart-translation',    label: _resolveTranslation(lang, 'الترجمة الذكية',     'Smart Translation'),   icon: Languages    },
        { id: 'tone-rewriter',        label: _resolveTranslation(lang, 'إعادة صياغة النبرة', 'Tone Rewriter'),        icon: Sliders      },
        { id: 'sentence-diagrammer',  label: _resolveTranslation(lang, 'محلّل الجمل',         'Sentence Diagrammer'),  icon: GitBranch    },
        { id: 'minimal-pairs',        label: _resolveTranslation(lang, 'الأزواج الدنيا',     'Minimal Pairs'),        icon: Ear          },
        { id: 'word-family',          label: _resolveTranslation(lang, 'عائلة الكلمة',       'Word Family'),          icon: GitFork      },
        { id: 'collocations',         label: _resolveTranslation(lang, 'متلازمات الكلمات',   'Collocations'),         icon: Link2        },
        { id: 'etymology',            label: _resolveTranslation(lang, 'أصول الكلمات',       'Etymology'),            icon: ScrollText   },
        { id: 'word-of-day',          label: _resolveTranslation(lang, 'كلمة اليوم',         'Word of the Day'),      icon: BookMarked   },
        { id: 'idiom-of-day',         label: _resolveTranslation(lang, 'تعبير اليوم',        'Idiom of the Day'),     icon: Lightbulb    },
        { id: 'timer',                label: _resolveTranslation(lang, 'المؤقت',            'Focus Timer'),           icon: Clock        },
      ]
    },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) {
      const activeGroup = navItems.find(item => item.items && item.items.some(sub => sub.id === activeTab));
      if (activeGroup) {
        setExpandedGroups(prev => ({ ...prev, [activeGroup.id]: true }));
      }
    }
  }, [isMobileMenuOpen, activeTab]);

  return (
    <div
      id="venoxa-root-div"
      className="flex flex-col h-screen overflow-hidden transition-colors duration-500 font-sans relative"
      dir={_resolveTranslation(lang, 'rtl', 'ltr')}
      style={{
        background: theme === 'dark'
          ? '#050816'
          : '#eef0ff',
      }}
    >
      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <PremiumBackground theme={theme} />
      </div>
      {/* ── Liquid Glass SVG Filter ── */}
      <svg style={{ display: 'none', position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter
            id="navbar-glass"
            x="0%" y="0%"
            width="100%" height="100%"
            filterUnits="objectBoundingBox"
          >
            {/*
              Low baseFrequency = large, smooth blobs (like a glass lens).
              High frequency was causing the "pixel shift" look.
              seed="14" gives a nice asymmetric warp for a pill shape.
            */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.008"
              numOctaves="1"
              seed="14"
              result="turbulence"
            />
            {/* Gamma on R sharpens the noise into distinct ridge lines
                that look like glass edges. G/B kept flat. */}
            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
              <feFuncG type="gamma" amplitude="0" exponent="1"  offset="0"   />
              <feFuncB type="gamma" amplitude="0" exponent="1"  offset="0.5" />
            </feComponentTransfer>
            {/* Smooth the map so displacement transitions are silky */}
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            {/* Specular light — creates the bright glint along the top edge */}
            <feSpecularLighting
              in="softMap"
              surfaceScale="5"
              specularConstant="1"
              specularExponent="100"
              lightingColor="white"
              result="specLight"
            >
              <fePointLight x="-200" y="-200" z="300" />
            </feSpecularLighting>
            <feComposite
              in="specLight"
              operator="arithmetic"
              k1="0" k2="1" k3="1" k4="0"
              result="litImage"
            />
            {/*
              scale="40": strong enough to see the warp clearly
              but not so high it tears the background apart.
              The backdrop (not the nav content) gets displaced
              because this filter sits on an empty div sibling.
            */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="softMap"
              scale="40"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* ── SVG Liquid Glass Distortion Filter ── */}
      <svg style={{ display: 'none', position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="lg-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />
            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
              <feFuncG type="gamma" amplitude="0" exponent="1"  offset="0"   />
              <feFuncB type="gamma" amplitude="0" exponent="1"  offset="0.5" />
            </feComponentTransfer>
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lightingColor="white" result="specLight">
              <fePointLight x="-200" y="-200" z="300" />
            </feSpecularLighting>
            <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
            <feDisplacementMap in="SourceGraphic" in2="softMap" scale="150" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ── Top Navigation Bar — Liquid Glass
           wrapper → effect(z0) → tint(z1) → shine(z2) → content(z3)
      ── */}
      <header className="lg-nav-wrapper fixed top-3 left-3 right-3 z-[60] h-[64px] rounded-[32px]">
        {/* z-0 distortion — empty so only backdrop is warped */}
        <div className="lg-effect" />
        {/* z-1 tint — dark: faint blue-white frost; light: white wash */}
        <div className="lg-tint" style={{
          background: theme === 'dark'
            ? 'rgba(20, 40, 120, 0.18)'
            : 'rgba(255, 255, 255, 0.28)',
        }} />
        {/* z-2 shine — inset highlights from reference */}
        <div className="lg-shine" />
        {/* z-3 content */}
        <div className="lg-content flex items-center h-full px-4 sm:px-6 gap-3">

          {/* LEFT slot — controls when EN, logo when AR */}
          {lang === 'ar' ? (
            /* AR: logo on left */
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h1 className="text-lg font-bold tracking-tight whitespace-nowrap hidden sm:block" dir="ltr">
                <span className="text-[var(--app-accent1)]">ai.</span><span>فينوكسا</span>
              </h1>
            </div>
          ) : (
            /* EN: controls on left — always LTR order: Avatar → Theme → Flag */
            <div className="flex items-center gap-1 shrink-0" dir="ltr">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-black hover:bg-black/5'
                }`}
                title={_resolveTranslation(lang, 'القائمة', 'Menu')}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {/* User / Auth Toggle — Avatar first */}
              {user ? (
                <>
                  {/* Cloud sync status indicator */}
                  {token && syncStatus !== 'idle' && (
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-300 ${
                        syncStatus === 'syncing' ? 'animate-pulse' : ''
                      }`}
                      title={syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Synced ✓' : syncStatus === 'error' ? 'Sync failed' : ''}
                    >
                      {syncStatus === 'syncing' && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? '#a78bfa' : '#7c3aed'} strokeWidth="2">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                        </svg>
                      )}
                      {syncStatus === 'synced' && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                          <path d="M3 12l2-2 4 4 2-2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13 16l2-2 4 4 2-2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                          <path d="M20 6a9.96 9.96 0 00-8-4C6.48 2 2 6.48 2 12s4.48 10 10 10a9.96 9.96 0 008-4" strokeLinecap="round" opacity="0.3"/>
                        </svg>
                      )}
                      {syncStatus === 'error' && (
                        <div className="relative group flex items-center justify-center">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" opacity="0.3"/>
                            <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                          </svg>
                          <div className="absolute hidden group-hover:block top-full right-0 mt-2 w-max max-w-[250px] bg-red-900/90 backdrop-blur text-white text-xs p-3 rounded-lg shadow-xl z-50 text-left">
                            {syncErrorMsg || 'Unknown sync error'}
                          </div>
                        </div>
                      )}
                    </span>
                  )}
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border overflow-hidden shrink-0 ${
                      activeTab === 'profile'
                        ? 'border-[var(--app-accent1)] ring-2 ring-[var(--app-accent1)]/30'
                        : (theme === 'dark' ? 'border-white/10 hover:border-white/20' : 'border-black/10 hover:border-black/20')
                    }`}
                    title={user.username || 'Profile'}
                  >
                    {(localAvatar || user.avatar) ? (
                      <img src={localAvatar || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-gray-700 dark:text-white">
                        {(user.username || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
                  className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-[var(--app-accent1)] hover:opacity-90 transition-all active:scale-95 shrink-0"
                >
                  {_resolveTranslation(lang, 'دخول', 'Login')}
                </button>
              )}
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-black hover:bg-black/5'
                }`}
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {/* Language toggle — SA flag */}
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
                title="عربي"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className="w-5 h-[14px] rounded-sm overflow-hidden">
                  <rect width="900" height="600" fill="#006C35"/>
                  <g fill="#fff">
                    <text x="450" y="330" textAnchor="middle" fontSize="200" fontFamily="serif">&#x200E;</text>
                    <path d="M220 180 h460 v30 h-460z"/>
                    <path d="M220 210 h30 v160 h-30z"/>
                    <path d="M610 210 h30 v160 h-30z"/>
                    <path d="M220 340 h460 v30 h-460z"/>
                    <path d="M335 210 h30 v100 q0 30 30 30 h120 q30 0 30-30 v-100 h30 v100 q0 55-60 55 h-120 q-60 0-60-55z"/>
                    <path d="M455 210 h30 v130 h-30z"/>
                    <path d="M455 340 h30 v30 h-30z"/>
                  </g>
                </svg>
              </button>
            </div>
          )}

          {/* Navigation Icons */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 px-2">
            {navItems.map(item => {
              const isGroup = !!item.items;
              const isActive = isGroup ? item.items.some(s => activeTab === s.id) : activeTab === item.id;
              const isOpen = activeDropdown === item.id;

              return (
                <div key={item.id} className="relative" ref={isOpen ? navDropdownRef : null}>
                  <button
                    onClick={() => isGroup ? setActiveDropdown(isOpen ? null : item.id) : setActiveTab(item.id)}
                    title={item.label}
                    className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group shrink-0 ${
                      isActive
                        ? (theme === 'dark' ? 'bg-white/12 text-white' : 'bg-black/6 text-black')
                        : (theme === 'dark' ? 'text-white/60 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-black hover:bg-black/4')
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                    <span className="hidden lg:inline-block text-xs font-extrabold truncate">{item.label}</span>
                    {isGroup && <ChevronDown className={`w-3 h-3 opacity-40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
                    {item.badge > 0 && (
                      <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold bg-[var(--app-accent1)] text-white shrink-0">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </button>

                  {isGroup && isOpen && (
                    <div 
                      className="dropdown-menu absolute top-full left-1/2 -translate-x-1/2 mt-3 p-1.5 pb-3 rounded-2xl shadow-2xl z-[70] animate-in fade-in slide-in-from-top-2 duration-200 min-w-[calc(100%+12px)] w-max"
                      style={{
                        background: theme === 'dark' ? 'rgba(10, 10, 12, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(40px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                        maxHeight: 'min(480px, 80vh)',
                        overflowY: 'auto'
                      }}
                    >
                      {item.items.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => { setActiveTab(sub.id); setActiveDropdown(null); }}
                          className={`flex items-center gap-1.5 w-full px-2.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === sub.id
                              ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]')
                              : (theme === 'dark' ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-black/5 hover:text-black')
                          }`}
                        >
                          <sub.icon className="w-4 h-4 shrink-0" />
                          <span className="flex-1 text-start">{sub.label}</span>
                          {sub.badge > 0 && (
                            <span className="min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[8px] font-bold bg-[var(--app-accent1)] text-white">
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT slot — logo when EN, controls when AR */}
          {lang === 'ar' ? (
            /* AR: controls on right — always LTR order: Avatar → Theme → Flag */
            <div className="flex items-center gap-1 shrink-0" dir="ltr">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-black hover:bg-black/5'
                }`}
                title={_resolveTranslation(lang, 'القائمة', 'Menu')}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {/* User / Auth Toggle — Avatar first */}
              {user ? (
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border overflow-hidden shrink-0 ${
                    activeTab === 'profile'
                      ? 'border-[var(--app-accent1)] ring-2 ring-[var(--app-accent1)]/30'
                      : (theme === 'dark' ? 'border-white/10 hover:border-white/20' : 'border-black/10 hover:border-black/20')
                  }`}
                  title={user.username || 'Profile'}
                >
                  {(localAvatar || user.avatar) ? (
                    <img src={localAvatar || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-gray-700 dark:text-white">
                      {(user.username || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
                  className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-[var(--app-accent1)] hover:opacity-90 transition-all active:scale-95 shrink-0"
                >
                  {_resolveTranslation(lang, 'دخول', 'Login')}
                </button>
              )}
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-black hover:bg-black/5'
                }`}
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {/* Language toggle — UK flag */}
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
                title="English"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-5 h-[13px] rounded-sm overflow-hidden">
                  <rect width="60" height="30" fill="#012169"/>
                  <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                  <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                  <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/>
                  <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
                </svg>
              </button>
            </div>
          ) : (
            /* EN: logo on right */
            <div className="flex items-center gap-2 shrink-0" dir="ltr">
              <h1 className="text-lg font-bold tracking-tight whitespace-nowrap hidden sm:block">
                <span className="text-[var(--app-accent1)]">ai.</span><span>فينوكسا</span>
              </h1>
              <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white dark:text-black" />
              </div>
            </div>
          )}

        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className={`relative z-10 flex-1 h-full overflow-x-hidden scroll-smooth transition-all duration-300 print:overflow-visible print:h-auto print:pt-0 print:m-0 pt-[88px] ${activeTab === 'speaking' ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>

        {/* ── Blur curtain — hidden on speaking tab for sharp edge ── */}
        {activeTab !== 'speaking' && (
          <div
            className="pointer-events-none fixed top-0 left-0 right-0 h-36 z-[54] print:hidden"
            style={{
              backdropFilter: 'blur(16px) saturate(140%)',
              WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)',
            }}
          />
        )}

        {/* Colour-fade — hidden on speaking tab for sharp edge */}
        {activeTab !== 'speaking' && (
          <div
            className="pointer-events-none fixed top-0 left-0 right-0 h-36 z-[55] print:hidden"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
              background: theme === 'dark'
                ? 'linear-gradient(to bottom, rgba(10,10,14,0.85) 0%, rgba(10,10,14,0.4) 55%, rgba(10,10,14,0) 100%)'
                : 'linear-gradient(to bottom, rgba(245,245,250,0.92) 0%, rgba(245,245,250,0.5) 55%, rgba(245,245,250,0) 100%)',
            }}
          />
        )}



        <div className={`${activeTab === 'speaking' ? 'w-full' : 'w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8'} print:p-0 print:pt-0`}>
          <div className="animate-fadeIn">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* ── Mobile Navigation Drawer ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 bottom-0 z-[90] w-[280px] sm:w-[320px] transition-transform duration-300 ease-out md:hidden shadow-2xl flex flex-col border-gray-200/80 dark:border-white/10 ${
          lang === 'ar'
            ? 'right-0 border-l rounded-l-[32px]'
            : 'left-0 border-r rounded-r-[32px]'
        }`}
        style={{
          transform: isMobileMenuOpen
            ? 'translateX(0)'
            : (lang === 'ar' ? 'translateX(100%)' : 'translateX(-100%)'),
          background: theme === 'dark'
            ? 'rgba(15, 15, 19, 0.96)'
            : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-2" dir="ltr">
            <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white dark:text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-black dark:text-white">
              <span className="text-[var(--app-accent1)]">ai.</span><span>فينوكسا</span>
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
              theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-black hover:bg-black/5'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {navItems.map(item => {
            const isGroup = !!item.items;
            const isActive = isGroup ? item.items.some(s => activeTab === s.id) : activeTab === item.id;
            const isExpanded = !!expandedGroups[item.id];

            return (
              <div key={item.id} className="space-y-1">
                {isGroup ? (
                  <div>
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/5 text-black')
                          : (theme === 'dark' ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-black hover:bg-black/5')
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className={`mt-1 space-y-1 ${lang === 'ar' ? 'border-r-2 dark:border-white/10 border-gray-200/50 pr-4 pl-0' : 'border-l-2 dark:border-white/10 border-gray-200/50 pl-4 pr-0'}`}>
                        {item.items.map(sub => {
                          const isSubActive = activeTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setActiveTab(sub.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                isSubActive
                                  ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]')
                                  : (theme === 'dark' ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-black/5 hover:text-black')
                              }`}
                            >
                              <sub.icon className="w-4 h-4 shrink-0" />
                              <span className="flex-1 text-start">{sub.label}</span>
                              {sub.badge > 0 && (
                                <span className="min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[8px] font-bold bg-[var(--app-accent1)] text-white">
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? (theme === 'dark' ? 'bg-white/12 text-white' : 'bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]')
                        : (theme === 'dark' ? 'text-white/70 hover:text-white hover:bg-white/8' : 'text-gray-600 hover:text-black hover:bg-black/5')
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-start">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold bg-[var(--app-accent1)] text-white shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authModalMode}
        setMode={setAuthModalMode}
        onLogin={login}
        onRegister={register}
        onVerify={verifyEmailCode}
        onResend={resendEmailVerification}
        onResetPassword={sendPasswordReset}
        lang={lang}
        theme={theme}
      />
    </div>
  );
}

function AuthModal({ isOpen, onClose, mode, setMode, onLogin, onRegister, onVerify, onResend, onResetPassword, lang, theme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    let res;
    if (mode === 'login') {
      res = await onLogin(email, password);
    } else if (mode === 'register') {
      res = await onRegister({ email, password, username, dob, gender });
    } else if (mode === 'verify') {
      res = await onVerify(email, otp);
    } else if (mode === 'forgot_password') {
      res = await onResetPassword(email);
      if (res.success) {
        setSuccess(_resolveTranslation(lang, 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني!', 'Password reset link sent to your email!'));
        setEmail('');
      }
    }
    setLoading(false);
    if (res && res.success) {
      if (mode !== 'forgot_password') {
        onClose();
        setEmail('');
        setPassword('');
        setUsername('');
        setDob('');
        setOtp('');
      }
    } else if (res) {
      setError(res.error);
      if (res.error && res.error.toLowerCase().includes('verification required')) {
        setMode('verify');
      }
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    const res = await onResend(email);
    setLoading(false);
    if (res.success) {
      setError(_resolveTranslation(lang, 'تم إرسال كود التحقق الجديد!', 'New verification code sent!'));
    } else {
      setError(res.error);
    }
  };

  const t = {
    title: mode === 'login' 
      ? _resolveTranslation(lang, 'تسجيل الدخول', 'Sign In')
      : mode === 'register'
        ? _resolveTranslation(lang, 'إنشاء حساب جديد', 'Create Account')
        : mode === 'forgot_password'
          ? _resolveTranslation(lang, 'إعادة تعيين كلمة المرور', 'Reset Password')
          : _resolveTranslation(lang, 'تأكيد الحساب', 'Verify Account'),
    email: _resolveTranslation(lang, 'البريد الإلكتروني', 'Email Address'),
    password: _resolveTranslation(lang, 'كلمة المرور', 'Password'),
    username: _resolveTranslation(lang, 'اسم المستخدم', 'Username'),
    dob: _resolveTranslation(lang, 'تاريخ الميلاد (اختياري)', 'Birth Date (Optional)'),
    gender: _resolveTranslation(lang, 'الجنس (اختياري)', 'Gender (Optional)'),
    otp: _resolveTranslation(lang, 'رمز التحقق (OTP)', 'Verification Code (OTP)'),
    submit: mode === 'login'
      ? _resolveTranslation(lang, 'دخول', 'Sign In')
      : mode === 'register'
        ? _resolveTranslation(lang, 'تسجيل', 'Sign Up')
        : mode === 'forgot_password'
          ? _resolveTranslation(lang, 'إرسال رابط إعادة التعيين', 'Send Reset Link')
          : _resolveTranslation(lang, 'تأكيد', 'Verify'),
    switchText: mode === 'login'
      ? _resolveTranslation(lang, 'ليس لديك حساب؟ سجل هنا', "Don't have an account? Sign up")
      : mode === 'register'
        ? _resolveTranslation(lang, 'لديك حساب بالفعل؟ سجل دخولك', 'Already have an account? Sign in')
        : _resolveTranslation(lang, 'العودة لتسجيل الدخول', 'Back to Sign In'),
    resendText: _resolveTranslation(lang, 'إعادة إرسال الرمز', 'Resend Code'),
    male: _resolveTranslation(lang, 'ذكر', 'Male'),
    female: _resolveTranslation(lang, 'أنثى', 'Female'),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md home-glass-card border-white/10 p-6 relative overflow-hidden flex flex-col gap-4 text-start">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-extrabold text-black dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" /> {t.title}
        </h3>

        {error && (
          <div className="p-3 text-xs font-semibold text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-xs font-semibold text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 animate-fadeIn">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.email}</label>
            <input 
              type="email" 
              required
              disabled={mode === 'verify'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold disabled:opacity-60"
            />
          </div>

          {mode !== 'verify' && mode !== 'forgot_password' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.password}</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot_password')}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-all focus:outline-none"
                  >
                    {_resolveTranslation(lang, 'نسيت كلمة المرور؟', 'Forgot Password?')}
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold"
              />
            </div>
          )}

          {mode === 'verify' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.otp}</label>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-all focus:outline-none"
                >
                  {t.resendText}
                </button>
              </div>
              <input 
                type="text" 
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold text-center tracking-widest"
              />
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.username}</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold"
                  placeholder="New Learner"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.dob}</label>
                  <input 
                    type="text" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold"
                    placeholder="e.g. January 2003"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.gender}</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="Male" style={{ background: '#0F0F13' }}>{t.male}</option>
                    <option value="Female" style={{ background: '#0F0F13' }}>{t.female}</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-white bg-[var(--app-accent1)] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--app-accent1)]/20 mt-2 disabled:opacity-50"
          >
            {loading ? <Activity className="w-5 h-5 mx-auto animate-spin" /> : t.submit}
          </button>
        </form>

        <button
          onClick={() => {
            if (mode === 'verify' || mode === 'forgot_password') {
              setMode('login');
            } else {
              setMode(mode === 'login' ? 'register' : 'login');
            }
          }}
          className="text-xs font-bold text-gray-400 hover:text-white mt-2 transition-all self-center"
        >
          {t.switchText}
        </button>
      </div>
    </div>
  );
}
function Dashboard({
  setTab,
  userLevel,
  AI_KEY,
  lang,
  theme,
  planMeta,
  completedCells,
  cellDates,
  currentWeek,
  streakData
}) {
  const isDark = theme === 'dark';
  const t = {
    welcome: _resolveTranslation(lang, 'أهلاً بك في', 'Welcome to'),
    desc: _resolveTranslation(lang, 'شريكك الذكي في تعلم اللغات. ابدأ رحلتك التعليمية اليوم بذكاء وكفاءة.', 'Your intelligent language learning partner. Start your journey today with AI-powered efficiency.'),
    levelLabel: _resolveTranslation(lang, `المستوى الحالي: ${userLevel}`, `Current Level: ${userLevel}`),
    createPlan: _resolveTranslation(lang, 'إنشاء خطة دراسية', 'Create Study Plan'),
    learningPaths: _resolveTranslation(lang, 'مسارات التعلم الموصى بها', 'Recommended Learning Paths'),
    quoteTitle: _resolveTranslation(lang, 'إلهام اليوم', 'Today\'s Inspiration'),
    wotdTitle: _resolveTranslation(lang, 'كلمة اليوم', 'Word of the Day'),
    wotdMore:  _resolveTranslation(lang, 'اعرف أكثر', 'Learn more'),
    paths: [
      { id: 'plan', title: _resolveTranslation(lang, 'خطة المذاكرة', 'Study Plan'), desc: _resolveTranslation(lang, 'جدول مخصص لتعلم المهارات الأربع', 'Custom schedule for the 4 skills'), icon: Calendar, paletteIndex: 0 },
      { id: 'vocab', title: _resolveTranslation(lang, 'المفردات', 'Vocabulary'), desc: _resolveTranslation(lang, 'بناء حصيلة لغوية قوية بالذكاء الاصطناعي', 'Build strong vocabulary with AI'), icon: BookOpen, paletteIndex: 1 },
      { id: 'grammar', title: _resolveTranslation(lang, 'القواعد', 'Grammar'), desc: _resolveTranslation(lang, 'فهم أعمق لهياكل اللغة وقواعدها', 'Deepen your understanding of grammar'), icon: Brain, paletteIndex: 2 },
      { id: 'speaking', title: _resolveTranslation(lang, 'المحادثة', 'Speaking'), desc: _resolveTranslation(lang, 'تدرب على النطق بطلاقة مع الذكاء الاصطناعي', 'Practice fluent speech with AI'), icon: MessageSquare, paletteIndex: 3 },
      { id: 'listening', title: _resolveTranslation(lang, 'الاستماع', 'Listening'), desc: _resolveTranslation(lang, 'تحسين فهمك للغة المنطوقة', 'Improve your listening comprehension'), icon: Headphones, paletteIndex: 4 },
    ]
  };

  // ── Curated quotes from famous authors (local, always instant, always different) ──
  const FAMOUS_QUOTES = [
    { quote: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein", translated_quote: "حدود لغتي هي حدود عالمي." },
    { quote: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith", translated_quote: "لغة واحدة تضعك في ممر مدى الحياة. لغتان تفتحان كل باب على طول الطريق." },
    { quote: "To have another language is to possess a second soul.", author: "Charlemagne", translated_quote: "أن تمتلك لغة أخرى يعني امتلاك روح ثانية." },
    { quote: "The man who does not know other languages, unless he is a man of genius, necessarily has deficiencies in his ideas.", author: "Victor Hugo", translated_quote: "من لا يعرف لغات أخرى لا يعرف شيئاً عن لغته الخاصة." },
    { quote: "Knowledge of languages is the doorway to wisdom.", author: "Roger Bacon", translated_quote: "معرفة اللغات هي بوابة الحكمة." },
    { quote: "A different language is a different vision of life.", author: "Federico Fellini", translated_quote: "اللغة المختلفة هي رؤية مختلفة للحياة." },
    { quote: "Language is the road map of a culture. It tells you where its people come from and where they are going.", author: "Rita Mae Brown", translated_quote: "اللغة هي خريطة الطريق لثقافة ما. إنها تخبرك من أين أتى شعبها وإلى أين يتجهون." },
    { quote: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.", author: "Abigail Adams", translated_quote: "لا يُنال التعلم بالصدفة، بل يجب السعي إليه بحماس والاهتمام به بجد." },
    { quote: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss", translated_quote: "كلما قرأت أكثر، كلما عرفت أكثر. كلما تعلمت أكثر، كلما ذهبت إلى أماكن أبعد." },
    { quote: "It is what you read when you don't have to that determines what you will be when you can't help it.", author: "Oscar Wilde", translated_quote: "ما تقرأه حين لا تكون مضطراً هو ما يحدد من ستكون حين لا تستطيع تغيير ذلك." },
    { quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi", translated_quote: "عش كأنك ستموت غداً. تعلّم كأنك ستعيش إلى الأبد." },
    { quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", translated_quote: "الاستثمار في المعرفة يعطي أفضل عائد." },
    { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King", translated_quote: "الشيء الجميل في التعلم أن أحداً لا يستطيع انتزاعه منك." },
    { quote: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats", translated_quote: "التعليم ليس ملء دلو، بل إشعال نار." },
    { quote: "The more I live, the more I learn. The more I learn, the more I realize, the less I know.", author: "Michel Legrand", translated_quote: "كلما عشت أكثر، تعلمت أكثر. كلما تعلمت أكثر، أدركت أنني أعرف أقل." },
    { quote: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo", translated_quote: "طوّر شغفاً بالتعلم. إذا فعلت ذلك، فلن تتوقف أبداً عن النمو." },
    { quote: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins", translated_quote: "في التعلم ستعلّم، وفي التعليم ستتعلم." },
    { quote: "The world is a book, and those who do not travel read only one page.", author: "Saint Augustine", translated_quote: "العالم كتاب، ومن لا يسافر لا يقرأ إلا صفحة واحدة منه." },
    { quote: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin", translated_quote: "القارئ يعيش ألف حياة قبل أن يموت. من لا يقرأ أبداً يعيش حياة واحدة فقط." },
    { quote: "Words are, of course, the most powerful drug used by mankind.", author: "Rudyard Kipling", translated_quote: "الكلمات، بالطبع، هي أقوى دواء يستخدمه البشر." },
    { quote: "Language is not a genetic gift, it is a social gift. Learning a new language is becoming a member of the club.", author: "Frank Smith", translated_quote: "اللغة ليست هبة جينية، بل هبة اجتماعية. تعلّم لغة جديدة يعني الانضمام إلى النادي." },
    { quote: "You can never understand one language until you understand at least two.", author: "Geoffrey Willans", translated_quote: "لا يمكنك أبداً فهم لغة واحدة حتى تفهم لغتين على الأقل." },
    { quote: "Those who know nothing of foreign languages know nothing of their own.", author: "Johann Wolfgang von Goethe", translated_quote: "من لا يعرف شيئاً عن اللغات الأجنبية لا يعرف شيئاً عن لغته الخاصة." },
    { quote: "Every language is a world. Without translation, we would inhabit parishes bordering on silence.", author: "George Steiner", translated_quote: "كل لغة عالم. بدون الترجمة، كنا سنسكن أحياء متاخمة للصمت." },
    { quote: "Language is the blood of the soul into which thoughts run and out of which they grow.", author: "Oliver Wendell Holmes", translated_quote: "اللغة هي دم الروح الذي تتدفق فيه الأفكار وتنمو منه." },
    { quote: "If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart.", author: "Nelson Mandela", translated_quote: "إذا تحدثت إلى رجل بلغة يفهمها، فسيصل الأمر إلى رأسه. إذا تحدثت إليه بلغته، فسيصل إلى قلبه." },
    { quote: "The conquest of learning is achieved through the knowledge of languages.", author: "Roger Ascham", translated_quote: "يتحقق فتح التعلم من خلال معرفة اللغات." },
    { quote: "Change your language and you change your thoughts.", author: "Karl Albrecht", translated_quote: "غيّر لغتك وستغيّر أفكارك." },
    { quote: "Learning another language is not only learning different words for the same things, but learning another way to think about things.", author: "Flora Lewis", translated_quote: "تعلّم لغة أخرى لا يعني فقط تعلّم كلمات مختلفة لنفس الأشياء، بل تعلّم طريقة أخرى للتفكير." },
    { quote: "To learn a language is to have one more window from which to look at the world.", author: "Chinese Proverb", translated_quote: "تعلّم لغة يعني امتلاك نافذة إضافية تطل من خلالها على العالم." },
    { quote: "With languages, you are at home anywhere.", author: "Edmund De Waal", translated_quote: "مع اللغات، أنت في بيتك في أي مكان." },
    { quote: "Language is the key to the heart of people.", author: "Ahmed Deedat", translated_quote: "اللغة هي مفتاح قلوب الناس." },
    { quote: "Speak a new language so that the world will be a new world.", author: "Rumi", translated_quote: "تحدث بلغة جديدة حتى يصبح العالم عالماً جديداً." },
    { quote: "The eyes only see what the mind is prepared to comprehend.", author: "Henri Bergson", translated_quote: "العين لا ترى إلا ما هو العقل مستعد لاستيعابه." },
    { quote: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb", translated_quote: "إذا أردت أن تسير بسرعة، سر وحدك. وإذا أردت أن تسير بعيداً، سر مع الآخرين." },
    { quote: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein", translated_quote: "الحكمة ليست نتاج التعليم المدرسي، بل نتاج المحاولة المستمرة مدى الحياة لاكتسابها." },
    { quote: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott", translated_quote: "لا أخشى العواصف، لأنني أتعلم كيف أقود سفينتي." },
    { quote: "Intellectual growth should commence at birth and cease only at death.", author: "Albert Einstein", translated_quote: "يجب أن يبدأ النمو الفكري عند الولادة ولا يتوقف إلا عند الموت." },
    { quote: "The more I read, the more I acquire, the more certain I am that I know nothing.", author: "Voltaire", translated_quote: "كلما قرأت أكثر، كلما اكتسبت أكثر، وكلما أيقنت أنني لا أعرف شيئاً." },
    { quote: "Not all those who wander are lost.", author: "J.R.R. Tolkien", translated_quote: "ليس كل من يتجوّل ضائعاً." },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain", translated_quote: "سر التقدم هو البدء." },
  ];

  const [insight, setInsight] = useState(null);

  // Word of the Day — read from the same localStorage cache as WordOfTheDay.jsx
  const [wotd, setWotd] = useState(null);
  const [loadingWotdNew, setLoadingWotdNew] = useState(false);
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('venoxa_word_of_day') || 'null');
      if (cached?.data?.word) setWotd(cached.data);
    } catch { /* ignore */ }
  }, []);

  // Pick a quote on mount and cache by date; refresh picks a different random one
  // ── Quote refresh: quotable.io (free, no key, real authors, unlimited) ──
  const [loadingQuote, setLoadingQuote] = useState(false);

  const fetchRandomQuote = async (excludeQuote = null) => {
    setLoadingQuote(true);
    try {
      // Quotable.io: free public API, no key, CORS-enabled, thousands of real author quotes
      const tags = ['wisdom', 'education', 'knowledge', 'inspirational', 'famous-quotes'];
      const tag = tags[Math.floor(Math.random() * tags.length)];
      const res = await fetch(`https://api.quotable.io/quotes/random?limit=1&tags=${tag}`, { cache: 'no-store' });
      const data = await res.json();
      const item = Array.isArray(data) ? data[0] : data;
      if (!item?.content) throw new Error('empty');

      // Arabic translation via proxy (best-effort; if it fails, show English only)
      let translated_quote = '';
      try {
        const arRaw = await fetchFromGemini(
          `Translate ONLY this English sentence to Arabic, return ONLY the Arabic translation with no extra text:\n"${item.content}"`,
          null, 200
        );
        if (arRaw && !arRaw.includes('"error"')) translated_quote = arRaw.trim();
      } catch { /* translation optional */ }

      const q = { quote: item.content, author: item.author || 'Unknown', translated_quote };
      setInsight(q);
      localStorage.setItem('venoxa_daily_insight', JSON.stringify({ timestamp: new Date().toISOString(), data: q }));
    } catch (e) {
      // Fallback: pick from local list (excludes current quote)
      const pool = FAMOUS_QUOTES.filter(q => q.quote !== excludeQuote);
      const q = pool[Math.floor(Math.random() * pool.length)];
      setInsight(q);
      localStorage.setItem('venoxa_daily_insight', JSON.stringify({ timestamp: new Date().toISOString(), data: q }));
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem('venoxa_daily_insight');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheDate = new Date(parsed.timestamp);
        if (cacheDate.toDateString() === new Date().toDateString() && parsed.data?.quote) {
          setInsight(parsed.data);
          return;
        }
      }
    } catch { /* ignore */ }
    fetchRandomQuote();
  }, []);

  const refreshQuote = () => fetchRandomQuote(insight?.quote);

  // ── WOTD: pick from curated word list → free Dictionary API for definition ──
  // 200 sophisticated words spanning all parts of speech
  const WORD_POOL = [
    'ephemeral','luminous','resilience','serendipity','eloquent','tenacious','ambiguous',
    'benevolent','clandestine','discern','empathy','fervent','gregarious','hubris',
    'idiosyncrasy','juxtapose','laconic','melancholy','nascent','obfuscate','pensive',
    'quandary','recalcitrant','sagacious','tangential','ubiquitous','veracious','whimsical',
    'xenophile','zealous','altruistic','belligerent','catharsis','diligent','erudite',
    'fastidious','garrulous','hegemony','immutable','judicious','kinetic','loquacious',
    'magnanimous','nefarious','ostentatious','pragmatic','quintessential','rambunctious',
    'sycophant','tempestuous','untenable','vacuous','wistful','acerbic','byzantine',
    'cavalier','diatribe','egregious','fallacious','grandiose','hypocrite','inimitable',
    'jejune','kaleidoscopic','languish','mendacious','nonchalant','oblivious','perfidious',
    'querulous','reticent','solipsistic','truculent','umbrage','verbose','wanton',
    'acrimony','bucolic','castigate','demagogue','enervate','fortuitous','galvanize',
    'harangue','inveterate','jocular','kindle','listless','munificent','numinous',
    'opprobrium','parsimonious','quixotic','rancor','stoic','temerity','usurp',
    'vindicate','wary','acumen','bombastic','callous','debacle','effusive',
    'flabbergasted','guileless','haughty','incorrigible','jaded','keen','languid',
    'mirth','nuanced','obtuse','pernicious','raucous','sanctimonious','taciturn',
    'unequivocal','venerable','wayfarer','accolade','beguile','candor','dauntless',
    'eclectic','fastuous','glib','hapless','insidious','jaundiced','labyrinthine',
    'mercurial','nihilistic','ominous','perspicacious','recondite','scrupulous',
    'tenuous','uncanny','verdant','wield','ameliorate','beseech','cogent','deft',
    'exacerbate','foment','gaunt','harrowing','impetuous','jettison','luminescent',
    'malleable','nettle','obdurate','palpable','ramify','sanguine','trepidation',
    'unwavering','vicarious','zealotry','ardent','brevity','cogitate','discursive',
    'enigmatic','flagrant','gullible','heedless','impasse','juxtaposition','kindle',
    'lament','manifest','nascence','opaque','paradox','quell','reverie','sublime',
    'transient','ulterior','vacillate','watershed'
  ];

  const generateNewWotd = async () => {
    setLoadingWotdNew(true);
    try {
      // Pick a word the user hasn't seen yet (exclude current wotd)
      const available = wotd?.word
        ? WORD_POOL.filter(w => w.toLowerCase() !== wotd.word.toLowerCase())
        : WORD_POOL;
      const word = available[Math.floor(Math.random() * available.length)];

      // Free Dictionary API — no key, CORS-enabled, always works
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, { cache: 'no-store' });
      if (!dictRes.ok) throw new Error('dict fail');
      const dictData = await dictRes.json();
      const entry = dictData[0];
      const meaning = entry.meanings?.[0];
      const definition = meaning?.definitions?.[0]?.definition || '';
      const example = meaning?.definitions?.[0]?.example || '';
      const partOfSpeech = meaning?.partOfSpeech || '';
      const ipa = entry.phonetics?.find(p => p.text)?.text || entry.phonetic || '';

      // Arabic definition via proxy (best-effort)
      let definitionAr = '';
      try {
        const arRaw = await fetchFromGemini(
          `Translate this English word definition to Arabic, return ONLY the Arabic translation with no extra text:\n"${definition}"`,
          null, 200
        );
        if (arRaw && !arRaw.includes('"error"')) definitionAr = arRaw.trim();
      } catch { /* optional */ }

      const parsed = { word, ipa, partOfSpeech, definition, definitionAr, example };
      setWotd(parsed);
      localStorage.setItem('venoxa_word_of_day', JSON.stringify({ timestamp: new Date().toISOString(), data: parsed }));
    } catch (e) {
      console.error('WOTD error:', e);
    } finally {
      setLoadingWotdNew(false);
    }
  };

  const safeRender = (val) => val || '...';

  // --- Smart Stats Calculation ---
  const stats = useMemo(() => {
    const doneCells = Object.values(completedCells || {}).filter(v => v === 'done').length;
    const xp = doneCells * 15; // 15 XP per task
    
    let progress = 0;
    if (planMeta && planMeta.totalWeeks) {
      // 1. Skills progress (Listen, Read, Speak, Write) - exactly as StudyPlan calculates it
      const skillsPct = Math.min(100, Math.round((currentWeek / planMeta.totalWeeks) * 100));
      
      // 2. Vocab progress
      const completedDays = Math.max(0, (currentWeek - 1) * 7);
      const totalDays = planMeta.totalWeeks * 7;
      const wpd = planMeta.wordsPerDay || 10;
      // In StudyPlan: totalWords comes from wordsDelta or totalDays * wpd
      const totalWords = planMeta.totalWords || totalDays * wpd;
      const learnedWords = Math.min(completedDays * wpd, totalWords);
      const wordsPct = totalWords ? Math.round((learnedWords / totalWords) * 100) : 0;
      
      // 3. Grammar progress
      const totalRules = planMeta.totalRules || planMeta.totalWeeks;
      const rpd = planMeta.rulesPerDay || 1;
      const masteredRules = Math.min(completedDays * rpd, totalRules);
      const rulesPct = totalRules ? Math.round((masteredRules / totalRules) * 100) : 0;

      // Average the 6 components (4 skills + vocab + grammar)
      progress = Math.round((skillsPct * 4 + wordsPct + rulesPct) / 6);
    }

    // Daily Goal — count cells completed TODAY (by actual calendar date)
    const today = new Date().toISOString().slice(0, 10);
    const todayDone = Object.entries(completedCells || {})
      .filter(([key, val]) => val === 'done' && cellDates[key] === today)
      .length;
    const dailyGoalPct = Math.min(100, Math.round((todayDone / 6) * 100)) || 0;

    return { xp, progress, dailyGoalPct, streak: streakData.current };
  }, [completedCells, cellDates, planMeta, currentWeek, streakData]);

  // Mouse follow glow state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return <div className="space-y-6 lg:space-y-10 animate-fadeIn" onMouseMove={handleMouseMove}>
    {/* ── Minimal Hero ── */}
    <div className="home-glass-hero relative px-6 sm:px-10 py-10 sm:py-14 text-center group overflow-hidden">
      {/* Mouse follow glow effect */}
      <div 
        className="pointer-events-none absolute -inset-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)'}, transparent 40%)`
        }}
      />
      
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-semibold tracking-wide uppercase transition-colors"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: isDark ? '#A1A1AA' : '#6B7280',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }}>
          {t.levelLabel}
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-black dark:text-white">
          {t.welcome} <span className="text-purple-400">Venoxa</span>
        </h2>
        <p className="text-base lg:text-lg mb-4 max-w-2xl mx-auto leading-relaxed text-gray-600 dark:text-[#B0B0C0]">
          {t.desc}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setTab('plan')}
            className="px-6 py-2.5 rounded-2xl font-semibold text-black dark:text-white transition-all hover:scale-[1.02] hover:bg-[var(--app-accent1)]/10 hover:border-[var(--app-accent1)]/40 active:scale-95 border border-black/10 dark:border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]"
            style={{
              background: theme === 'dark' ? 'rgba(10, 10, 10, 0.25)' : 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(48px) saturate(200%)',
              WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            }}
          >
            {t.createPlan}
          </button>
        </div>
      </div>
    </div>

    {/* ── Quick Stats / Engagement ── */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <StreakWidget streak={stats.streak} lang={lang} isDark={isDark} theme={theme} />
      <XPWidget xp={stats.xp} lang={lang} isDark={isDark} theme={theme} />
      <ProgressWidget progress={stats.progress} lang={lang} isDark={isDark} theme={theme} />
      <GoalWidget pct={stats.dailyGoalPct} lang={lang} isDark={isDark} theme={theme} />
    </div>

    {/* ── Quote + Tip ── */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        className="home-glass-card card-shine relative group p-6 sm:p-8 transition-all duration-400 hover:-translate-y-1"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-2xl bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.quoteTitle}</h3>
          <button
            onClick={refreshQuote}
            disabled={loadingQuote}
            title={lang === 'ar' ? 'اقتباس جديد' : 'New quote'}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:text-[var(--app-accent1)] hover:bg-[var(--app-accent1)]/10 transition-all active:rotate-180 transition-transform duration-300"
          >
            <RotateCcw className={`w-3.5 h-3.5 transition-transform duration-500 ${loadingQuote ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="space-y-3 text-start rtl:text-right">
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed" dir="ltr">
              “{safeRender(insight?.quote)}”
            </p>
            {insight?.author && (
              <p className="text-xs font-bold tracking-widest uppercase text-[var(--app-accent1)]" dir="ltr">
                — {insight.author}
              </p>
            )}
            <p className="text-sm font-medium text-gray-500 dark:text-[#B0B0C0] pt-1 border-t border-black/5 dark:border-white/8">
              {safeRender(insight?.translated_quote)}
            </p>
          </div>
      </div>
      {/* ── Word of the Day mini-card ── */}
      <div
        className="home-glass-card card-shine relative group p-6 sm:p-8 transition-all duration-400 hover:-translate-y-1 flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]">
            <BookMarked className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.wotdTitle}</h3>
          {wotd?.partOfSpeech && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]">
              {wotd.partOfSpeech}
            </span>
          )}
          <button
            onClick={generateNewWotd}
            disabled={loadingWotdNew}
            title={lang === 'ar' ? 'كلمة جديدة' : 'New word'}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:text-[var(--app-accent1)] hover:bg-[var(--app-accent1)]/10 transition-all disabled:opacity-40"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingWotdNew ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingWotdNew ? (
          <div className="h-24 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[var(--app-accent1)] animate-spin" />
          </div>
        ) : wotd ? (
          <>
            {/* Word + IPA */}
            <div dir="ltr">
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {wotd.word}
              </div>
              {wotd.ipa && (
                <div className="text-xs font-mono font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                  {wotd.ipa}
                </div>
              )}
            </div>

            {/* Definition */}
            {wotd.definition && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed" dir="ltr">
                {wotd.definition}
              </p>
            )}
            {wotd.definitionAr && (
              <p className="text-sm font-medium text-[var(--app-accent1)]/85" dir="rtl">
                {wotd.definitionAr}
              </p>
            )}

            {/* Buttons row */}
            <div className="mt-auto flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTab('word-of-day')}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95 shadow-sm"
              >
                {t.wotdMore} →
              </button>
            </div>
          </>
        ) : (
          /* No cache yet — show generate button */
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400" dir="auto">
              {lang === 'ar'
                ? 'اضغط على زر التحديث لتوليد كلمة اليوم.'
                : 'Hit the refresh button above to generate your Word of the Day, or open the full tool below.'}
            </p>
            <button
              onClick={() => setTab('word-of-day')}
              className="self-start flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-95 shadow-sm"
            >
              {t.wotdMore} →
            </button>
          </div>
        )}
      </div>
    </div>

    {/* ── LanGeek Staggered Learning Paths ── */}
    <div>
      <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A] dark:text-[var(--app-text)] mb-5 flex items-center gap-2">
        <Activity className="w-5 h-5 text-gray-700 dark:text-white" /> {t.learningPaths}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {t.paths.map((path, i) => (
          <DashboardCard key={path.id} {...path} index={i} isDark={isDark} onClick={() => setTab(path.id)} />
        ))}
      </div>
    </div>
  </div>;
}

function StreakWidget({ streak, lang, isDark, theme }) {
  return (
    <div className="home-glass-card card-shine relative group p-5 flex items-center gap-4 transition-all duration-400 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
        <Zap size={24} fill="currentColor" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">{_resolveTranslation(lang, 'سلسلة التعلم', 'Streak')}</div>
        <div className="text-xl font-black text-black dark:text-white">{streak} {_resolveTranslation(lang, 'أيام', 'Days')}</div>
      </div>
    </div>
  );
}

function XPWidget({ xp, lang, isDark, theme }) {
  return (
    <div className="home-glass-card card-shine relative group p-5 flex items-center gap-4 transition-all duration-400 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
        <Award size={24} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">{_resolveTranslation(lang, 'إجمالي النقاط', 'Total XP')}</div>
        <div className="text-xl font-black text-black dark:text-white">{xp.toLocaleString()}</div>
      </div>
    </div>
  );
}

function ProgressWidget({ progress, lang, isDark, theme }) {
  return (
    <div className="home-glass-card card-shine relative group p-5 flex flex-col justify-center transition-all duration-400 hover:-translate-y-1">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">{_resolveTranslation(lang, 'التقدم الكلي', 'Overall Progress')}</div>
        <div className="text-xs font-black text-emerald-500">{progress}%</div>
      </div>
      <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full group-hover:scale-x-105 transition-transform origin-left" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}

function GoalWidget({ pct, lang, isDark, theme }) {
  return (
    <div className="home-glass-card card-shine relative group p-5 flex items-center gap-4 transition-all duration-400 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
        <CalendarCheck size={24} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">{_resolveTranslation(lang, 'الهدف اليومي', 'Daily Goal')}</div>
        <div className="text-xl font-black text-black dark:text-white">{pct}%</div>
      </div>
    </div>
  );
}
const CARD_PALETTES = [
  { bg: 'glass-panel', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-[var(--app-accent1)]', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#B0B0C0]' },
  { bg: 'glass-panel', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-[var(--app-accent2)]', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#B0B0C0]' },
  { bg: 'glass-panel', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-[var(--app-accent1)]', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#B0B0C0]' },
  { bg: 'glass-panel', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-rose-500', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#B0B0C0]' },
  { bg: 'glass-panel', iconBg: 'bg-gray-100 dark:bg-[var(--app-surface)]', iconColor: 'text-amber-500', text: 'text-black dark:text-white', sub: 'text-gray-500 dark:text-[#B0B0C0]' },
];

function DashboardCard({ icon: Icon, title, desc, onClick, paletteIndex = 0, index = 0, isDark = false }) {
  const p = CARD_PALETTES[paletteIndex % CARD_PALETTES.length];
  return (
    <div
      onClick={onClick}
      className="home-glass-card card-shine group relative cursor-pointer rounded-[32px] p-6 sm:p-8 transition-all duration-500 flex flex-col hover:-translate-y-1"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 ${p.iconBg} transition-all duration-500 shadow-sm`}>
        <Icon className={`w-6 h-6 ${p.iconColor}`} />
      </div>
      <div className="space-y-3 text-start rtl:text-right">
        <h3 className={`font-bold text-xl tracking-tight ${p.text}`}>{title}</h3>
        <p className={`text-sm leading-relaxed font-medium ${p.sub}`}>{desc}</p>
      </div>

    </div>
  );
}


function PlanWeekTable({
  weekNum,
  planData,
  userLevel,
  wordsPerDay,
  planGrammarRules,
  rulesPerDay,
  t,
  lang,
  formatTime,
  getVocabRange,
  getSpacedRepetition,
  dailyTotalMins,
  weeklyTotalMins,
  openVocabModal,
  openGrammarModal,
  interactive,
  completedCells,
  onToggleCell,
  wordSource
}) {
  const rowColors = {
    listen:  { bg: 'bg-cyan-50/60 dark:bg-cyan-950/20',    border: '',    icon: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',    summary: 'text-cyan-700 dark:text-cyan-300' },
    read:    { bg: 'bg-emerald-50/60 dark:bg-emerald-950/20', border: '', icon: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', summary: 'text-emerald-700 dark:text-emerald-300' },
    speak:   { bg: 'bg-rose-50/60 dark:bg-rose-950/20',     border: '',    icon: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',    summary: 'text-rose-700 dark:text-rose-300' },
    write:   { bg: 'bg-amber-50/60 dark:bg-amber-950/20',   border: '',   icon: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',   summary: 'text-amber-700 dark:text-amber-300' },
    vocab:   { bg: 'bg-orange-50/60 dark:bg-orange-950/20', border: '',  icon: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',  summary: 'text-orange-700 dark:text-orange-300' },
    grammar: { bg: 'bg-violet-50/60 dark:bg-violet-950/20', border: '',  icon: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',  summary: 'text-violet-700 dark:text-violet-300' },
  };

  const B = "border-gray-200/60 dark:border-white/[0.06]";
  const headBase = `px-3 py-4 bg-gray-100 dark:bg-[var(--app-surface)] text-gray-700 dark:text-gray-200 font-extrabold text-[11px] uppercase tracking-widest text-center border-b border-e ${B}`;
  const cellBase = `px-3 py-6 text-center border-b border-e ${B} relative transition-all duration-200`;

  return (
    <div className="rounded-[28px] print:rounded-none overflow-hidden print:overflow-visible border border-gray-200 dark:border-[var(--app-border)] print:border-none shadow-sm print:shadow-none print:bg-white print:backdrop-filter-none plan-table-wrapper">
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-separate [border-spacing:0] min-w-[800px] print:border-collapse print:min-w-0">
          <thead>
            <tr>
              <th className={`${headBase} w-[220px]`}>{t.activity}</th>
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <th key={d} className={headBase}>
                  {t.day} {d}
                </th>
              ))}
              <th className={`${headBase} border-s w-[140px]`}>{t.summary}</th>
            </tr>
          </thead>
          <tbody>
            {planData.categories.map((cat, idx) => {
              const colors = rowColors[cat.id] || rowColors.listen;
              return (
              <tr key={cat.id} className={`group hover:brightness-105 dark:hover:brightness-125 transition-all ${colors.bg} ${colors.border}`}>
                <td className={`py-4 px-3 border-b border-e ${B} font-bold text-[13px] text-gray-900 dark:text-white print:py-3 print:align-middle`}>
                  <div className="flex items-center gap-3 h-full print:gap-2">
                    <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl ${colors.icon} group-hover:scale-110 transition-transform shadow-sm print:hidden`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <span className="truncate leading-normal">{cat.name}</span>
                  </div>
                </td>
                {[0, 1, 2, 3, 4, 5, 6].map(d => {
                  const cellKey = `${weekNum}-${cat.id}-${d}`;
                  const completion = completedCells?.[cellKey];
                  const isInteractive = interactive && (cat.id === 'vocab' || cat.id === 'grammar');
                  return (
                    <td
                      key={d}
                      className={`${cellBase} plan-cell-hover ${isInteractive ? 'cursor-pointer' : ''}`}
                      onClick={isInteractive ? () => {
                        if (cat.id === 'vocab') openVocabModal(d);
                        if (cat.id === 'grammar') openGrammarModal(d);
                      } : undefined}
                      onContextMenu={interactive ? (e) => { e.preventDefault(); onToggleCell?.(weekNum, cat.id, d); } : undefined}
                    >
                      {completion && (
                        <div className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold ${completion === 'done' ? 'bg-[var(--app-accent2)]' : 'bg-rose-500'}`}>
                          {completion === 'done' ? '✓' : '✗'}
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center gap-1 print:gap-0.5">
                        {cat.id === 'vocab' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-bold text-gray-900 dark:text-white" dir="ltr">{getVocabRange(weekNum, d)}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${wordSource === 'vocab' ? 'bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]' : 'bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400'}`}>
                              {wordSource === 'vocab' ? 'CSV' : 'PDF'}
                            </span>
                          </div>
                        ) : cat.id === 'grammar' ? (() => {
                          const globalDayIdx = (weekNum - 1) * 7 + d;
                          const rpd = rulesPerDay || 1;
                          const startRuleIdx = globalDayIdx * rpd;
                          const dayRules = planGrammarRules ? planGrammarRules.slice(startRuleIdx, startRuleIdx + rpd).filter(Boolean) : [];
                          if (dayRules.length === 0) return <span className="text-[10px] text-gray-400 dark:text-gray-600">—</span>;
                          return (
                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 line-clamp-3 max-w-[80px] print:line-clamp-none print:max-w-none print:text-[11px]" dir="ltr">
                              {dayRules.map((r, ri) => <span key={ri} className="block">{ri > 0 && <span className="text-gray-400">·</span>} {r}</span>)}
                            </span>
                          );
                        })() : null}
                        <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{cat.mins}M</span>
                      </div>
                    </td>
                  );
                })}
                <td className={`py-4 px-3 border-b border-s ${B} text-center font-extrabold text-[13px] ${colors.summary} plan-cell-hover print:py-3 print:border`}>
                  {formatTime(cat.mins * 7)}
                </td>
              </tr>
            );
            })}

            {/* ── Spaced Repetition Review Row ── */}
            <tr className="bg-purple-50/70 dark:bg-purple-950/25 group hover:brightness-105 dark:hover:brightness-125 transition-all">
              <td className={`py-4 px-3 border-b border-e ${B} font-bold text-[13px] text-gray-900 dark:text-white print:py-3 print:align-middle`}>
                <div className="flex items-center gap-3 h-full print:gap-2">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shadow-sm print:hidden">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <span className="truncate leading-normal">{t.spacedRep}</span>
                </div>
              </td>
              {[0, 1, 2, 3, 4, 5, 6].map(d => {
                const phases = getSpacedRepetition(weekNum, d);
                return (
                  <td key={d} className={`${cellBase} print:align-middle`}>
                    {phases.length === 0 ? (
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">—</span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        {phases.map((range, ri) => {
                          const srsKey = `${weekNum}-srs-${ri}-${d}`;
                          const srsState = completedCells?.[srsKey];
                          return (
                            <button
                              key={ri}
                              dir="ltr"
                              title={srsState === 'done' ? 'Mark as missed' : srsState === 'missed' ? 'Clear' : 'Mark as done'}
                              onClick={() => interactive && onToggleCell?.(weekNum, `srs-${ri}`, d)}
                              className={`relative text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap transition-all duration-200 select-none
                                ${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                                ${srsState === 'done'
                                  ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500/40'
                                  : srsState === 'missed'
                                  ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/40 line-through opacity-70'
                                  : 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/25'
                                }`}
                            >
                              {srsState === 'done' ? (
                                <span className="flex items-center gap-0.5">
                                  <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  {range}
                                </span>
                              ) : srsState === 'missed' ? (
                                <span className="flex items-center gap-0.5">
                                  <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 12 12" fill="none">
                                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                  {range}
                                </span>
                              ) : range}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                );
              })}
              <td className={`py-4 px-3 border-b border-s ${B} text-center plan-cell-hover print:py-3 print:border`}>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-purple-500 dark:text-purple-400 opacity-70">{_resolveTranslation(lang, 'الفجوات', 'intervals')}</span>
                  <span dir="ltr" className="font-mono text-[9px] font-bold text-purple-600 dark:text-purple-300">+1·+4·+7·+12·+20</span>
                </div>
              </td>
            </tr>

            {/* Summary Row */}
            <tr className="bg-teal-50 dark:bg-teal-950/30">
              <td className={`py-4 px-3 border-e ${B} font-extrabold text-sm text-gray-900 dark:text-white print:py-3 print:align-middle`}>
                <div className="flex items-center gap-3 h-full print:gap-2">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 shadow-sm print:hidden">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="leading-normal">{t.categories.total}</span>
                </div>
              </td>
              {[0, 1, 2, 3, 4, 5, 6].map(d => (
                <td key={d} className={`px-3 py-4 text-center border-e ${B} font-extrabold text-sm text-teal-700 dark:text-teal-300 plan-cell-hover print:py-3 print:border`}>
                  {formatTime(dailyTotalMins)}
                </td>
              ))}
              <td className={`px-3 py-4 border-s ${B} text-center font-black text-sm text-teal-700 dark:text-teal-200 bg-teal-100/50 dark:bg-teal-500/10 plan-cell-hover print:py-3 print:border`}>
                {formatTime(weeklyTotalMins)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Words *per CEFR level* in the Venoxa wordlists (matches the public lesson catalogue).
const CEFR_LEVEL_WORDS = {
  A1: 609,
  A2: 1581,
  B1: 1850,
  B2: 2224,
  C1: 2481,
  C2: 2152
};
// Cumulative active vocabulary at the end of each level (running total of CEFR_LEVEL_WORDS).
// Used to auto-suggest the words-per-day pace from the user's chosen levels and dates.
const CEFR_VOCAB_TARGET = (() => {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  let acc = 0;
  const out = {};
  for (const lvl of order) {
    acc += CEFR_LEVEL_WORDS[lvl];
    out[lvl] = acc;
  }
  return out;
})();
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DEFAULT_SKILL_MINS = {
  listen: 30,
  read: 20,
  speak: 15,
  write: 10
};
const VOCAB_MINS = 10;
const GRAMMAR_MINS = 5;

// ── Official study plan presets (from plan timing standard) ──────────────────
const STUDY_PLAN_PRESETS = {
  '1': { label: '1h',  labelAr: 'ساعة',      total: 60,  listen: 20, read: 15, vocab: 15, speak: 10, write: 5  },
  '2': { label: '2h',  labelAr: 'ساعتان',    total: 120, listen: 40, read: 30, vocab: 25, speak: 15, write: 10 },
  '3': { label: '3h',  labelAr: '٣ ساعات',   total: 180, listen: 55, read: 50, vocab: 40, speak: 20, write: 15 },
  '4': { label: '4h',  labelAr: '٤ ساعات',   total: 240, listen: 75, read: 60, vocab: 50, speak: 30, write: 20 },
};
const PLAN_STORAGE_KEY = 'venoxa-plan-v3';
function loadStoredPlan() {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function StudyPlan({
  userLevel,
  setUserLevel,
  lang,
  globalVocab,
  langeekVocab,
  planMeta,
  setPlanMeta,
  completedCells,
  setCompletedCells,
  currentWeek,
  setCurrentWeek,
  recordActivity,
  theme,
  token,
  user,
  syncProgress,
  planResetBlockRef,
  weekSyncBlockedRef,
}) {
  const stored = useMemo(() => loadStoredPlan(), []);
  const [targetLevel, setTargetLevel] = useState(stored?.targetLevel || 'C1');
  const todayISO = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(stored?.startDate || todayISO);
  const [targetDate, setTargetDate] = useState(stored?.targetDate || '');
  const [skillSettings, setSkillSettings] = useState(() => stored?.skillSettings || {
    listen: {
      useDefault: true,
      mins: DEFAULT_SKILL_MINS.listen
    },
    read: {
      useDefault: true,
      mins: DEFAULT_SKILL_MINS.read
    },
    speak: {
      useDefault: true,
      mins: DEFAULT_SKILL_MINS.speak
    },
    write: {
      useDefault: true,
      mins: DEFAULT_SKILL_MINS.write
    }
  });
  const [wordsMode, setWordsMode] = useState(stored?.wordsMode || 'auto'); // 'auto' | 'manual'
  const [wordSource, setWordSource] = useState(stored?.wordSource || 'langeek'); // 'langeek' | 'vocab'
  const [totalInvestMinutes, setTotalInvestMinutes] = useState('');
  const [wordsManual, setWordsManual] = useState(stored?.wordsManual || 10);
  const [studyHoursPreset, setStudyHoursPreset] = useState(stored?.studyHoursPreset || null);
  const [vocabMins, setVocabMins] = useState(stored?.vocabMins ?? 15);
  // isEditing: show the configuration form even when a plan already exists
  const [isEditing, setIsEditing] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const userPickedWeekRef = useRef(false);
  const [vocabModal, setVocabModal] = useState(null);
  const [grammarModal, setGrammarModal] = useState(null);
  const [studiedWords, setStudiedWords] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('studiedWords') || '[]')); } catch { return new Set(); }
  });
  const toggleStudied = (word) => {
    setStudiedWords(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word); else next.add(word);
      try { localStorage.setItem('studiedWords', JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const toggleCellCompletion = (weekNum, catId, dayIdx) => {
    const key = `${weekNum}-${catId}-${dayIdx}`;
    const today = new Date().toISOString().slice(0, 10);
    setCompletedCells(prev => {
      const current = prev[key];
      const next = current === 'done' ? 'missed' : current === 'missed' ? null : 'done';
      const newData = { ...prev };
      if (next === null) delete newData[key]; else newData[key] = next;
      if (next === 'done' && recordActivity) recordActivity();
      localStorage.setItem('venoxa_completed_cells', JSON.stringify(newData));
      // Track the date this cell was completed
      setCellDates(prevDates => {
        const newDates = { ...prevDates };
        if (next === 'done') {
          newDates[key] = today;
        } else {
          delete newDates[key];
        }
        localStorage.setItem('venoxa_cell_dates', JSON.stringify(newDates));
        return newDates;
      });
      return newData;
    });
  };
  const t = {
    title: _resolveTranslation(lang, 'إعداد خطة المذاكرة والمستوى', 'Set Up Study Plan & Level'),
    currentLvl: _resolveTranslation(lang, 'مستواك الحالي', 'Current Level'),
    targetLvl: _resolveTranslation(lang, 'المستوى المرغوب', 'Target Level'),
    startDateLbl: _resolveTranslation(lang, 'تاريخ بدء الخطة', 'Start Date'),
    dateLabel: _resolveTranslation(lang, 'تاريخ الوصول للهدف', 'Target Date'),
    skillsTitle: _resolveTranslation(lang, 'مدة كل مهارة يومياً', 'Daily time per skill'),
    skillsHint: _resolveTranslation(lang, 'فعّل "افتراضي" لاستخدام التوزيع الموصى به أو خصّص الدقائق يدوياً.', 'Toggle "Default" for the recommended pace, or customise the minutes.'),
    useDefault: _resolveTranslation(lang, 'افتراضي', 'Default'),
    minsUnit: _resolveTranslation(lang, 'دقيقة', 'min'),
    wordsTitle: _resolveTranslation(lang, 'الكلمات الجديدة يومياً', 'New words per day'),
    wordsAuto: _resolveTranslation(lang, 'تلقائي (حسب المستوى والتاريخ)', 'Auto (from levels & date)'),
    wordsManualLbl: _resolveTranslation(lang, 'يدوي', 'Manual'),
    wordsToLearn: _resolveTranslation(lang, 'كلمات يجب تعلمها', 'words to learn'),
    autoExplain: _resolveTranslation(lang, 'حساب تلقائي:', 'Auto-calculated:'),
    days: _resolveTranslation(lang, 'يوم', 'days'),
    perDay: _resolveTranslation(lang, '/ يوم', '/ day'),
    gen: _resolveTranslation(lang, 'توليد الجدول الأسبوعي', 'Generate Weekly Schedule'),
    week: _resolveTranslation(lang, 'الأسبوع', 'Week'),
    day: _resolveTranslation(lang, 'اليوم', 'Day'),
    reset: _resolveTranslation(lang, 'تعديل الخطة', 'Edit Plan'),
    exportPdf: _resolveTranslation(lang, 'طباعة كل الأسابيع', 'Print All Weeks'),
    exportCsv: _resolveTranslation(lang, 'تصدير CSV', 'Export CSV'),
    jumpWeek: _resolveTranslation(lang, 'الانتقال إلى الأسبوع', 'Jump to Week'),
    activity: _resolveTranslation(lang, 'النشاط', 'Activity'),
    summary: _resolveTranslation(lang, 'المجموع', 'Summary'),
    words: _resolveTranslation(lang, 'كلمات', 'words'),
    estimateTitle: _resolveTranslation(lang, 'ما الذي ستحتاج لتعلمه', 'What you will need to learn'),
    estimateHint: _resolveTranslation(lang, 'يتم حساب القيم تلقائياً من المستوى الحالي والمستوى المرغوب وتاريخ البداية والنهاية ووقت كل مهارة.', 'Auto-calculated from your current/target level, start & end dates, and the time you allocate per skill.'),
    rules: _resolveTranslation(lang, 'قاعدة', 'rules'),
    hours: _resolveTranslation(lang, 'ساعة', 'hours'),
    progressTitle: _resolveTranslation(lang, 'تقدمك في الخطة', 'Your plan progress'),
    weekProgress: _resolveTranslation(lang, 'تقدم الأسبوع', 'Week progress'),
    vocabProgress: _resolveTranslation(lang, 'تقدم المفردات', 'Vocabulary progress'),
    grammarProgress: _resolveTranslation(lang, 'تقدم القواعد', 'Grammar progress'),
    learned: _resolveTranslation(lang, 'تم تعلمه', 'learned'),
    mastered: _resolveTranslation(lang, 'تم إتقانه', 'mastered'),
    of: _resolveTranslation(lang, 'من', 'of'),
    weekOf: _resolveTranslation(lang, 'الأسبوع', 'Week'),
    invalidRange: _resolveTranslation(lang, 'يجب أن يكون تاريخ الهدف بعد تاريخ البداية', 'Target date must be after the start date'),
    vocabHeader: _resolveTranslation(lang, 'كلمات اليوم', 'Daily Vocabulary'),
    grammarHeader: _resolveTranslation(lang, 'قاعدة اليوم', 'Daily Grammar'),
    grammarTarget: _resolveTranslation(lang, 'القاعدة المطلوبة دراستها', 'Rule to study'),
    alertTime: _resolveTranslation(lang, 'يرجى تحديد وقت المذاكرة لكل مهارة!', 'Please set a study time for at least one skill!'),
    alertDate: _resolveTranslation(lang, 'يرجى تحديد تاريخ الهدف بشكل صحيح!', 'Please select a valid target date!'),
    spacedRep: _resolveTranslation(lang, 'مراجعة متباعدة', 'Spaced Review'),
    wordSourceTitle: _resolveTranslation(lang, 'مصدر الكلمات', 'Word Source'),
    wordSourceLangeek: _resolveTranslation(lang, 'Langeek (PDF)', 'Langeek (PDF)'),
    wordSourceVocab: _resolveTranslation(lang, 'مفرداتي (من رفع الملفات)', 'My Vocabulary (Uploads)'),
    wordSourceHint: _resolveTranslation(lang, 'اختر مصدر الكلمات للخطة: مفرداتك المرفوعة أو قائمة Langeek القياسية', 'Choose the word source for your plan: your uploaded vocabulary or the standard Langeek list'),
    langeekRefMsg: _resolveTranslation(lang, 'ارجع إلى ملف Langeek PDF الخاص بك وادرس الكلمات في هذا النطاق.', 'Refer to your Langeek PDF file and study the words in this range.'),
    langeekRangeLabel: _resolveTranslation(lang, 'نطاق الكلمات (Langeek PDF)', 'Word Range (Langeek PDF)'),
    noVocabUploaded: _resolveTranslation(lang, 'لم يتم رفع ملف مفردات بعد. يرجى رفع ملف CSV أو اختيار مصدر Langeek.', 'No vocabulary uploaded yet. Please upload a CSV file or choose Langeek as source.'),
    totalInvestTitle: _resolveTranslation(lang, 'إجمالي وقت المذاكرة اليومي', 'Total Daily Study Time'),
    totalInvestPlaceholder: _resolveTranslation(lang, '60', '60'),
    divideBtn: _resolveTranslation(lang, 'تقسيم الوقت تلقائياً', 'Auto-Divide Time'),
    presetTitle: _resolveTranslation(lang, 'خطة جاهزة', 'Quick Plan'),
    presetHint: _resolveTranslation(lang, 'اختر مدة المذاكرة اليومية — يتم توزيع الوقت تلقائياً حسب الخطة القياسية', 'Pick your daily study duration — time is distributed per the official plan standard'),
    vocabTimeTitle: _resolveTranslation(lang, 'وقت المفردات يومياً', 'Vocab Study Time / Day'),
    vocabTimeMins: _resolveTranslation(lang, 'دقيقة', 'min'),
    categories: {
      listen: _resolveTranslation(lang, 'استماع', 'Listening'),
      read: _resolveTranslation(lang, 'قراءة', 'Reading'),
      speak: _resolveTranslation(lang, 'محادثة', 'Speaking'),
      write: _resolveTranslation(lang, 'كتابة', 'Writing'),
      vocab: _resolveTranslation(lang, 'مفردات', 'Vocabulary'),
      grammar: _resolveTranslation(lang, 'قواعد', 'Grammar'),
      total: _resolveTranslation(lang, 'المجموع اليومي', 'Daily Total')
    }
  };

  // Effective minutes for each editable skill (default value when toggle is on, custom otherwise).
  const effectiveSkillMins = id => {
    const s = skillSettings[id];
    if (!s) return DEFAULT_SKILL_MINS[id] || 0;
    return s.useDefault ? DEFAULT_SKILL_MINS[id] : Math.max(0, parseInt(s.mins, 10) || 0);
  };

  // Number of days between start and target dates (inclusive of effort).
  const daysToTarget = useMemo(() => {
    if (!startDate || !targetDate) return 0;
    const s = new Date(startDate);
    const e = new Date(targetDate);
    if (!(e > s)) return 0;
    return Math.ceil((e - s) / 86400000);
  }, [startDate, targetDate]);

  // CEFR-based word delta: sum of CEFR_LEVEL_WORDS for every level strictly above the user's current.
  const cefrWordsDelta = useMemo(() => {
    const curIdx = LEVEL_ORDER.indexOf(userLevel);
    const tgtIdx = LEVEL_ORDER.indexOf(targetLevel);
    if (curIdx < 0 || tgtIdx < 0 || tgtIdx <= curIdx) return 0;
    let total = 0;
    for (let i = curIdx + 1; i <= tgtIdx; i++) total += CEFR_LEVEL_WORDS[LEVEL_ORDER[i]];
    return total;
  }, [userLevel, targetLevel]);

  // Base suitable vocab list (level-filtered from uploads) — independent of wordsPerDay to avoid circular deps.
  const suitableVocabBase = useMemo(() => {
    const getLevelWeight = l => {
      if (!l) return 0;
      const str = l.toUpperCase();
      if (str.includes('A1')) return 1;
      if (str.includes('A2')) return 2;
      if (str.includes('B1')) return 3;
      if (str.includes('B2')) return 4;
      if (str.includes('C1')) return 5;
      if (str.includes('C2')) return 6;
      return 0;
    };
    const userWeight = getLevelWeight(userLevel) || 1;
    const filtered = globalVocab.filter(w => {
      const wWeight = getLevelWeight(w.level);
      return wWeight >= userWeight || wWeight === 0;
    });
    return filtered.length > 0 ? filtered : globalVocab;
  }, [globalVocab, userLevel]);

  // Effective total words depends on the chosen source.
  // 'vocab' → uploaded vocabulary count; 'langeek' → CEFR standard count.
  const wordsDelta = useMemo(() => {
    if (wordSource === 'vocab') {
      return suitableVocabBase.length > 0 ? suitableVocabBase.length : cefrWordsDelta;
    }
    return cefrWordsDelta;
  }, [wordSource, suitableVocabBase, cefrWordsDelta]);

  // Flat ordered list of grammar rules from current level (inclusive) up to and including
  // the first rule of the target level. This is what gets distributed across plan days.
  const planGrammarRules = useMemo(() => {
    const curIdx = LEVEL_ORDER.indexOf(userLevel);
    const tgtIdx = LEVEL_ORDER.indexOf(targetLevel);
    if (curIdx < 0 || tgtIdx < 0 || tgtIdx <= curIdx) return [];
    const rules = [];
    // Add ALL rules from current level through the level just below target
    for (let i = curIdx; i < tgtIdx; i++) {
      const lvlKey = LEVEL_ORDER[i];
      const entry = GRAMMAR_CEFR_DETAILED.find(g => g.level === lvlKey);
      if (entry) {
        entry.categories.forEach(cat => cat.rules.forEach(r => rules.push(r)));
      }
    }
    // Add ONLY the first rule of the target level as the milestone
    const tgtEntry = GRAMMAR_CEFR_DETAILED.find(g => g.level === LEVEL_ORDER[tgtIdx]);
    if (tgtEntry && tgtEntry.categories.length > 0 && tgtEntry.categories[0].rules.length > 0) {
      rules.push(tgtEntry.categories[0].rules[0]);
    }
    return rules;
  }, [userLevel, targetLevel]);

  // Total grammar rules = length of the plan grammar rules list
  const rulesDelta = useMemo(() => planGrammarRules.length, [planGrammarRules]);

  // Auto words-per-day: split the vocabulary delta over the days available.
  const autoWordsPerDay = useMemo(() => {
    if (!daysToTarget) return 10;
    if (wordsDelta === 0) return 5;
    return Math.max(1, Math.min(80, Math.ceil(wordsDelta / daysToTarget)));
  }, [wordsDelta, daysToTarget]);
  const wordsPerDay = planMeta?.wordsPerDay ?? (wordsMode === 'auto' ? autoWordsPerDay : Math.max(1, parseInt(wordsManual, 10) || 1));

  // Build the rich category list (with icons / colours) from the persisted minutes payload.
  const categories = useMemo(() => {
    if (!planMeta) return [];
    const m = planMeta.mins;
    return [{
      id: 'listen',
      name: t.categories.listen,
      icon: Headphones,
      mins: m.listen,
      textColor: 'text-indigo-600 dark:text-indigo-400'
    }, {
      id: 'read',
      name: t.categories.read,
      icon: BookText,
      mins: m.read,
      textColor: 'text-emerald-600 dark:text-emerald-400'
    }, {
      id: 'speak',
      name: t.categories.speak,
      icon: MessageSquare,
      mins: m.speak,
      textColor: 'text-rose-600 dark:text-rose-400'
    }, {
      id: 'write',
      name: t.categories.write,
      icon: PenTool,
      mins: m.write,
      textColor: 'text-indigo-600 dark:text-indigo-400'
    }, {
      id: 'vocab',
      name: t.categories.vocab,
      icon: BookOpen,
      mins: m.vocab,
      textColor: 'text-emerald-600 dark:text-emerald-400'
    }, {
      id: 'grammar',
      name: t.categories.grammar,
      icon: Brain,
      mins: m.grammar,
      textColor: 'text-indigo-600 dark:text-indigo-400'
    }];
  }, [planMeta, lang]);

  // The shape that PlanWeekTable / older code expects.
  const planData = planMeta ? {
    totalWeeks: planMeta.totalWeeks,
    categories,
    wordsPerDay
  } : null;

  // Persist everything that should survive a page reload.
  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({
        targetLevel,
        startDate,
        targetDate,
        skillSettings,
        wordsMode,
        wordSource,
        wordsManual,
        planMeta,
        currentWeek,
        studyHoursPreset,
        vocabMins,
      }));
    } catch {/* quota or private mode — silently ignore */ }
  }, [targetLevel, startDate, targetDate, skillSettings, wordsMode, wordSource, wordsManual, planMeta, currentWeek, studyHoursPreset, vocabMins]);

  // Live pre-generation summary: total minutes per skill across the whole plan.
  const planEstimate = useMemo(() => {
    if (!daysToTarget) return null;
    const wpd = wordsMode === 'auto' ? autoWordsPerDay : Math.max(1, parseInt(wordsManual, 10) || 1);
    return {
      totalDays: daysToTarget,
      totalWeeks: Math.max(1, Math.ceil(daysToTarget / 7)),
      totalWords: wordsDelta || wpd * daysToTarget,
      wordsPerDay: wpd,
      totalRules: rulesDelta,
      hours: {
        listen: effectiveSkillMins('listen') * daysToTarget / 60,
        read: effectiveSkillMins('read') * daysToTarget / 60,
        speak: effectiveSkillMins('speak') * daysToTarget / 60,
        write: effectiveSkillMins('write') * daysToTarget / 60
      }
    };
  }, [daysToTarget, wordsDelta, rulesDelta, skillSettings, wordsMode, wordsManual, autoWordsPerDay]);
  const suitableVocab = useMemo(() => {
    // When source is Langeek, the user studies from their PDF — no uploaded word list used.
    if (wordSource === 'langeek') return [];
    return suitableVocabBase.length >= wordsPerDay ? suitableVocabBase : globalVocab;
  }, [wordSource, suitableVocabBase, wordsPerDay, globalVocab]);
  // rulesPerDay: how many grammar rules to assign per day
  // If plan days >= total rules → 1 rule/day, stop when exhausted
  // If plan days < total rules → spread multiple rules per day
  const rulesPerDay = useMemo(() => {
    if (!daysToTarget || planGrammarRules.length === 0) return 1;
    return daysToTarget >= planGrammarRules.length ? 1 : Math.ceil(planGrammarRules.length / daysToTarget);
  }, [daysToTarget, planGrammarRules]);
  const generatePlan = () => {
    const mins = {
      listen: effectiveSkillMins('listen'),
      read: effectiveSkillMins('read'),
      speak: effectiveSkillMins('speak'),
      write: effectiveSkillMins('write'),
      vocab: vocabMins,
      grammar: GRAMMAR_MINS
    };
    const totalMins = mins.listen + mins.read + mins.speak + mins.write + mins.vocab + mins.grammar;
    if (totalMins <= 0) {
      alert(t.alertTime);
      return;
    }
    if (!startDate || !targetDate) {
      alert(t.alertDate);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(targetDate);
    if (!(end > start)) {
      alert(t.invalidRange);
      return;
    }
    const diffDays = Math.ceil((end - start) / 86400000);
    const calculatedWeeks = Math.max(1, Math.ceil(diffDays / 7));
    const wpd = wordsMode === 'auto' ? autoWordsPerDay : Math.max(1, parseInt(wordsManual, 10) || 1);
    const rpd = diffDays >= planGrammarRules.length && planGrammarRules.length > 0 ? 1 : Math.ceil(planGrammarRules.length / (diffDays || 1));
    setPlanMeta({
      totalWeeks: calculatedWeeks,
      mins,
      wordsPerDay: wpd,
      totalWords: wordsDelta || calculatedWeeks * 7 * wpd,
      totalRules: planGrammarRules.length || calculatedWeeks,
      rulesPerDay: rpd,
      wordSource,
      studyHoursPreset,
      vocabMins,
      userLevel,
    });
    setCurrentWeek(1);
    setIsEditing(false);
  };
  const setSkillDefault = (id, useDefault) => {
    setSkillSettings(prev => ({
      ...prev,
      [id]: {
        useDefault,
        mins: useDefault ? DEFAULT_SKILL_MINS[id] : prev[id]?.mins ?? DEFAULT_SKILL_MINS[id]
      }
    }));
  };
  const setSkillMins = (id, mins) => {
    setSkillSettings(prev => ({
      ...prev,
      [id]: {
        useDefault: false,
        mins: Math.max(0, parseInt(mins, 10) || 0)
      }
    }));
  };

  // Apply one of the 4 official presets (1h/2h/3h/4h) to all skill settings at once
  const applyPreset = (key) => {
    const p = STUDY_PLAN_PRESETS[key];
    if (!p) return;
    setStudyHoursPreset(key);
    setVocabMins(p.vocab);
    setTotalInvestMinutes(String(p.total));
    setSkillSettings({
      listen: { useDefault: false, mins: p.listen },
      read:   { useDefault: false, mins: p.read   },
      speak:  { useDefault: false, mins: p.speak  },
      write:  { useDefault: false, mins: p.write  },
    });
  };

  const handleAutoDivide = () => {
    const total = parseInt(totalInvestMinutes, 10);
    if (isNaN(total) || total <= 0) {
      alert(_resolveTranslation(lang, 'يرجى إدخال وقت صحيح!', 'Please enter a valid time!'));
      return;
    }

    /**
     * Smart plan combiner — follows the exact official preset timings.
     *
     * Strategy:
     *  1. Greedily stack official presets (4h → 3h → 2h → 1h) until
     *     the remainder is < 60 min.
     *  2. Scale the sub-60 remainder proportionally from the 1h plan.
     *  3. Proportionally rescale the raw accumulated minutes to exactly
     *     `total` BEFORE rounding — this prevents large drift.
     *  4. Round, then apply only the tiny residual (±1-2 min max) to
     *     the largest bucket (listen).
     */
    const PRESETS_DESC = [
      { total: 240, listen: 75, read: 60, vocab: 50, speak: 30, write: 20 },
      { total: 180, listen: 55, read: 50, vocab: 40, speak: 20, write: 15 },
      { total: 120, listen: 40, read: 30, vocab: 25, speak: 15, write: 10 },
      { total:  60, listen: 20, read: 15, vocab: 15, speak: 10, write:  5 },
    ];
    const ONE_HOUR = PRESETS_DESC[3];

    const acc = { listen: 0, read: 0, vocab: 0, speak: 0, write: 0 };
    let remaining = total;

    // Step 1 — stack full presets
    for (const p of PRESETS_DESC) {
      while (remaining >= p.total) {
        acc.listen += p.listen;
        acc.read   += p.read;
        acc.vocab  += p.vocab;
        acc.speak  += p.speak;
        acc.write  += p.write;
        remaining  -= p.total;
      }
    }

    // Step 2 — scale the sub-60 remainder using 1h plan proportions
    if (remaining > 0) {
      const ratio = remaining / 60;
      acc.listen += ONE_HOUR.listen * ratio;
      acc.read   += ONE_HOUR.read   * ratio;
      acc.vocab  += ONE_HOUR.vocab  * ratio;
      acc.speak  += ONE_HOUR.speak  * ratio;
      acc.write  += ONE_HOUR.write  * ratio;
    }

    // Step 3 — proportionally rescale so raw sum == total (eliminates large drift)
    const keys = ['listen', 'read', 'vocab', 'speak', 'write'];
    const rawSum = keys.reduce((s, k) => s + acc[k], 0);
    if (rawSum > 0) {
      keys.forEach(k => { acc[k] = (acc[k] / rawSum) * total; });
    }

    // Step 4 — round, then fix tiny residual (±1-2 min max) on the listen bucket
    const rounded = {};
    keys.forEach(k => { rounded[k] = Math.round(acc[k]); });
    const drift = total - keys.reduce((s, k) => s + rounded[k], 0);
    rounded.listen = Math.max(1, rounded.listen + drift);

    setVocabMins(rounded.vocab);
    setStudyHoursPreset(null);
    setTotalInvestMinutes(String(total));
    setSkillSettings({
      listen: { useDefault: false, mins: rounded.listen },
      read:   { useDefault: false, mins: rounded.read   },
      speak:  { useDefault: false, mins: rounded.speak  },
      write:  { useDefault: false, mins: rounded.write  },
    });
  };
  const handleNextWeek = () => {
    if (currentWeek < planData.totalWeeks) {
      userPickedWeekRef.current = true;
      if (weekSyncBlockedRef) weekSyncBlockedRef.current = true;
      setCurrentWeek(prev => prev + 1);
    }
  };
  const handlePrevWeek = () => {
    if (currentWeek > 1) {
      userPickedWeekRef.current = true;
      if (weekSyncBlockedRef) weekSyncBlockedRef.current = true;
      setCurrentWeek(prev => prev - 1);
    }
  };
  const openVocabModal = dayIndex => {
    // Langeek source: show actual words from the uploaded Langeek CSV if available,
    // otherwise fall back to the PDF range reference.
    if (wordSource === 'langeek' || (planMeta?.wordSource === 'langeek')) {
      const range = getVocabRange(currentWeek, dayIndex);
      // If the user has uploaded their Langeek CSV, slice the actual words for this day.
      if (langeekVocab && langeekVocab.length > 0) {
        // Find where the user's starting level begins in the uploaded CSV so we skip
        // lower-level words (e.g. if the user chose B1, we skip all A1 and A2 entries).
        const _LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const startingLevel = ((planMeta?.userLevel || userLevel) + '').toUpperCase().trim().slice(0, 2);
        const startLvlIdx = _LEVELS.indexOf(startingLevel);
        const levelStartOffset = startLvlIdx > 0
          ? (() => {
              const idx = langeekVocab.findIndex(w => {
                const wl = (w.level || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2);
                return _LEVELS.indexOf(wl) >= startLvlIdx;
              });
              return idx >= 0 ? idx : 0;
            })()
          : 0;
        const startIdx = levelStartOffset + ((currentWeek - 1) * 7 + dayIndex) * wordsPerDay;
        const dayWords = [];
        for (let i = 0; i < wordsPerDay; i++) {
          const globalIdx = startIdx + i;
          if (globalIdx < langeekVocab.length) dayWords.push(langeekVocab[globalIdx]);
        }
        setVocabModal({
          day: dayIndex + 1,
          words: dayWords,
          isLangeek: false,   // render as word cards (word + meaning)
          langeekRange: range
        });
      } else {
        setVocabModal({
          day: dayIndex + 1,
          words: [],
          isLangeek: true,
          langeekRange: range
        });
      }
      return;
    }
    const startIdx = ((currentWeek - 1) * 7 + dayIndex) * wordsPerDay;
    const dayWords = [];
    for (let i = 0; i < wordsPerDay; i++) {
      if (suitableVocab.length === 0) break;
      const globalIdx = (startIdx + i) % suitableVocab.length;
      dayWords.push(suitableVocab[globalIdx]);
    }
    setVocabModal({
      day: dayIndex + 1,
      words: dayWords,
      isLangeek: false
    });
  };
  const openGrammarModal = dayIndex => {
    const globalDayIdx = (currentWeek - 1) * 7 + dayIndex; // 0-based
    const rpd = planMeta?.rulesPerDay || rulesPerDay || 1;
    const startRuleIdx = globalDayIdx * rpd;
    const dayRules = planGrammarRules.slice(startRuleIdx, startRuleIdx + rpd).filter(Boolean);
    const topic = dayRules.length > 0 ? dayRules.join(' · ') : null;
    if (!topic) return;
    setGrammarModal({
      day: dayIndex + 1,
      topic
    });
  };
  const handlePrint = () => {
    // Show the print container via React state, then print once it renders
    setIsPrintMode(true);
    // Wait for React to render the print layout, then trigger print
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        // After print dialog closes, restore normal view
        const handleAfterPrint = () => {
          setIsPrintMode(false);
          window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);
      }, 100);
    });
  };
  const formatTime = mins => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };
  const getVocabRange = (weekIdx, dayIdx) => {
    const globalDay = (weekIdx - 1) * 7 + dayIdx + 1;
    const start = (globalDay - 1) * wordsPerDay + 1;
    const end = globalDay * wordsPerDay;
    return `${start}-${end}`;
  };
  // SRS review intervals (days after learning): +1, +4, +7, +12, +20
  // Derived from the user's spaced-repetition schedule spreadsheet.
  const SRS_REVIEW_OFFSETS = [1, 4, 7, 12, 20];
  const getSpacedRepetition = (weekIdx, dayIdx) => {
    const globalDay = (weekIdx - 1) * 7 + dayIdx + 1; // 1-indexed plan day
    const phases = [];
    for (const offset of SRS_REVIEW_OFFSETS) {
      const learnDay = globalDay - offset;
      if (learnDay >= 1) {
        const start = (learnDay - 1) * wordsPerDay + 1;
        const end = learnDay * wordsPerDay;
        phases.push(`${start}-${end}`);
      }
    }
    return phases;
  };
  const exportCSV = () => {
    if (!planData) return;
    const rows = [];
    const header = ['Week', 'Activity', ...[1, 2, 3, 4, 5, 6, 7].map(d => `Day ${d}`), 'Weekly Total'];
    rows.push(header);
    for (let w = 1; w <= planData.totalWeeks; w++) {
      planData.categories.forEach(cat => {
        const row = [`Week ${w}`, cat.name];
        for (let d = 0; d < 7; d++) {
          if (cat.id === 'vocab') {
            row.push(`${getVocabRange(w, d)} (${cat.mins}m)`);
          } else if (cat.id === 'grammar') {
            const globalDayIdx = (w - 1) * 7 + d;
            const rpd = planMeta?.rulesPerDay || 1;
            const startRuleIdx = globalDayIdx * rpd;
            const dayRules = planGrammarRules.slice(startRuleIdx, startRuleIdx + rpd).filter(Boolean);
            const topic = dayRules.join(' · ') || '-';
            row.push(`${topic} (${cat.mins}m)`);
          } else {
            row.push(`${cat.mins}m`);
          }
        }
        row.push(formatTime(cat.mins * 7));
        rows.push(row);
      });
      const srRow = [`Week ${w}`, t.spacedRep];
      for (let d = 0; d < 7; d++) {
        const phases = getSpacedRepetition(w, d);
        srRow.push(phases.length ? phases.join(' | ') : '-');
      }
      srRow.push('-');
      rows.push(srRow);
      const totalRow = [`Week ${w}`, t.categories.total];
      for (let d = 0; d < 7; d++) totalRow.push(formatTime(dailyTotalMins));
      totalRow.push(formatTime(weeklyTotalMins));
      rows.push(totalRow);
      rows.push([]);
    }
    const csv = rows.map(r => r.map(c => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `venoxa-study-plan-${userLevel}-to-${targetLevel}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleResetPlan = () => {
    // Block cloud sync from overwriting the reset for 5 seconds
    if (planResetBlockRef) planResetBlockRef.current = true;
    setPlanMeta(null);
    const local = {
      targetLevel,
      startDate,
      targetDate,
      skillSettings,
      wordsMode,
      wordSource,
      wordsManual,
      planMeta: null,
      currentWeek: 1,
      studyHoursPreset,
      vocabMins,
    };
    try {
      localStorage.setItem('venoxa-plan-v3', JSON.stringify(local));
    } catch {}
    if (syncProgress) {
      syncProgress(token, user, null, true);
    }
    // Unblock sync after 5 seconds — long enough for Firebase to settle
    if (planResetBlockRef) {
      setTimeout(() => { planResetBlockRef.current = false; }, 5000);
    }
  };
  const dailyTotalMins = planData?.categories.reduce((acc, cat) => acc + cat.mins, 0) || 0;
  const weeklyTotalMins = dailyTotalMins * 7;
  const todayStr = new Date().toISOString().split('T')[0];
  return <div className="space-y-8 animate-fadeIn print:m-0 print:p-0">
    {(!planData || isEditing) && <div className="glass-panel p-5 sm:p-8 lg:p-12 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] relative transition-colors">

      <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-5 lg:mb-8 text-gray-900 dark:text-[var(--app-text)] flex items-center gap-3 relative z-10">
        <Sparkles className="text-black dark:text-white w-8 h-8" /> {t.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5 lg:mb-8 relative z-50">
        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 flex flex-col justify-center">
          <label className="block text-sm text-gray-500 dark:text-[var(--app-text)] mb-2 font-semibold">{t.currentLvl}</label>
          <CustomDropdown 
            value={userLevel} 
            onChange={setUserLevel} 
            options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => ({ value: l, label: l }))} 
            theme={theme}
            className="w-full"
          />
        </div>

        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 flex flex-col justify-center">
          <label className="block text-sm text-gray-500 dark:text-[var(--app-text)] mb-2 font-semibold">{t.targetLvl}</label>
          <CustomDropdown 
            value={targetLevel} 
            onChange={setTargetLevel} 
            options={['A2', 'B1', 'B2', 'C1', 'C2'].map(l => ({ value: l, label: l }))} 
            theme={theme}
            className="w-full"
          />
        </div>

        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 flex flex-col justify-center relative z-50">
          <label className="block text-sm text-gray-500 dark:text-[var(--app-text)] mb-2 font-semibold">{t.startDateLbl}</label>
          <SolidDatePicker value={startDate} onChange={setStartDate} label="Start Date" lang={lang} />
        </div>

        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 flex flex-col justify-center relative z-50">
          <label className="block text-sm text-gray-500 dark:text-[var(--app-text)] mb-2 font-semibold">{t.dateLabel}</label>
          <SolidDatePicker min={startDate || todayStr} value={targetDate} onChange={setTargetDate} label="Target Date" lang={lang} />
        </div>
      </div>

      {/* Per-skill durations with a Default toggle */}
      <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 mb-6 relative z-10">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
            <Clock className="w-5 h-5 text-black dark:text-white" /> {t.skillsTitle}
          </h3>
          <span className="text-xs text-gray-500 dark:text-[var(--app-text)]">{t.skillsHint}</span>
        </div>

        {/* ── Quick Preset Selector ── */}
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 dark:text-[var(--app-text-muted)] mb-2 uppercase tracking-wide">{t.presetTitle}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STUDY_PLAN_PRESETS).map(([key, p]) => {
              const isActive = studyHoursPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'border-[var(--app-accent1)] bg-[var(--app-accent1)] text-white shadow-lg'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[var(--app-surface)] text-gray-700 dark:text-white hover:border-[var(--app-accent1)]/50 hover:bg-[var(--app-accent1)]/5'
                  }`}
                >
                  <span className="text-base font-extrabold leading-tight">{lang === 'ar' ? p.labelAr : p.label}</span>
                  <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-400 dark:text-white/40'}`}>
                    {p.total} {t.minsUnit}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => { setStudyHoursPreset(null); }}
              className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 active:scale-95 ${
                studyHoursPreset === null
                  ? 'border-[var(--app-accent2)] bg-[var(--app-accent2)] text-white shadow-lg'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[var(--app-surface)] text-gray-700 dark:text-white hover:border-[var(--app-accent2)]/50'
              }`}
            >
              <span className="text-base font-extrabold leading-tight">{_resolveTranslation(lang, 'مخصص', 'Custom')}</span>
              <span className={`text-[10px] font-bold mt-0.5 ${studyHoursPreset === null ? 'text-white/80' : 'text-gray-400 dark:text-white/40'}`}>
                {_resolveTranslation(lang, 'يدوي', 'Manual')}
              </span>
            </button>
          </div>
          {studyHoursPreset && (() => {
            const p = STUDY_PLAN_PRESETS[studyHoursPreset];
            return (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                {[
                  { icon: '🎧', label: _resolveTranslation(lang, 'استماع', 'Listen'), mins: p.listen, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10' },
                  { icon: '📖', label: _resolveTranslation(lang, 'قراءة', 'Read'),    mins: p.read,   color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' },
                  { icon: '📝', label: _resolveTranslation(lang, 'مفردات', 'Vocab'),  mins: p.vocab,  color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10' },
                  { icon: '💬', label: _resolveTranslation(lang, 'محادثة', 'Speak'),  mins: p.speak,  color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' },
                  { icon: '✍️', label: _resolveTranslation(lang, 'كتابة', 'Write'),   mins: p.write,  color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' },
                ].map(({ icon, label, mins, color }) => (
                  <span key={label} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5 ${color}`}>
                    {icon} {label}: <strong>{mins}</strong> {t.minsUnit}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
          {/* Smart Auto-Divide Tool */}
          <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-3 transition-all hover:border-gray-300 dark:hover:border-gray-600 flex flex-col justify-between h-full shadow-sm relative overflow-hidden group">
            <div className="mb-2">
              <div className="flex items-center gap-2 font-bold text-black dark:text-white">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-[12px] sm:text-[13px] leading-tight font-extrabold uppercase tracking-tight">{t.totalInvestTitle}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-auto">
              <input
                type="number"
                placeholder={t.totalInvestPlaceholder}
                value={totalInvestMinutes}
                onChange={e => setTotalInvestMinutes(e.target.value)}
                className="no-spinner w-full max-w-[100px] h-11 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-2 text-gray-900 dark:text-[var(--app-text)] font-bold text-center text-lg focus:outline-none focus:border-[var(--app-accent1)] shadow-sm min-w-0"
                style={{ textAlign: 'center' }}
              />
              <button
                onClick={handleAutoDivide}
                className="bg-gray-100 dark:bg-[var(--app-bg)] hover:bg-gray-200 dark:hover:bg-black text-black dark:text-white w-11 h-11 rounded-xl transition-all border border-gray-200 dark:border-[var(--app-border)] shadow-sm active:scale-95 flex items-center justify-center shrink-0"
                title={t.divideBtn}
              >
                <Zap className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>

          {[{
            id: 'listen',
            label: t.categories.listen,
            Icon: Headphones,
            color: 'text-black dark:text-white',
            ring: 'focus:border-[var(--app-accent1)]'
          }, {
            id: 'read',
            label: t.categories.read,
            Icon: BookText,
            color: 'text-emerald-600 dark:text-white',
            ring: 'focus:border-[var(--app-accent2)]'
          }, {
            id: 'speak',
            label: t.categories.speak,
            Icon: MessageSquare,
            color: 'text-pink-600 dark:text-pink-400',
            ring: 'focus:border-pink-500'
          }, {
            id: 'write',
            label: t.categories.write,
            Icon: PenTool,
            color: 'text-indigo-600 dark:text-[var(--app-accent2)]',
            ring: 'focus:border-[var(--app-accent1)]'
          }].map(({
            id,
            label,
            Icon,
            color,
            ring
          }) => {
            const s = skillSettings[id] || {
              useDefault: true,
              mins: DEFAULT_SKILL_MINS[id]
            };
            return <div key={id} className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-3 transition-all hover:border-gray-300 dark:hover:border-gray-600 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className={`flex items-center gap-2 font-bold ${color} min-w-0`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs sm:text-sm leading-tight truncate">{label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] font-bold uppercase tracking-tight ${s.useDefault ? 'text-black dark:text-white' : 'text-gray-400 dark:text-[var(--app-accent1)]'}`}>{t.useDefault}</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input type="checkbox" className="sr-only peer" checked={s.useDefault} onChange={e => setSkillDefault(id, e.target.checked)} />
                    <span className="block w-8 h-4 bg-gray-300 dark:bg-[var(--app-card)] rounded-full peer-checked:bg-[var(--app-accent1)] transition-colors"></span>
                    <span className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-auto">
                <input type="number" min="0" max="240" value={s.useDefault ? DEFAULT_SKILL_MINS[id] : s.mins} disabled={s.useDefault} onChange={e => setSkillMins(id, e.target.value)} className={`no-spinner w-full max-w-[100px] h-11 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-2 text-gray-900 dark:text-[var(--app-text)] font-bold text-center text-lg focus:outline-none ${ring} disabled:opacity-60 disabled:cursor-not-allowed min-w-0`} style={{ textAlign: 'center' }} />
                <span className="text-[11px] text-gray-500 dark:text-[var(--app-text)] font-bold whitespace-nowrap">{t.minsUnit}</span>
              </div>
            </div>;
          })}
        </div>
      </div>

      {/* Word Source Selector */}
      <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--app-accent1)]" /> {t.wordSourceTitle}
          </h3>
          <span className="text-xs text-gray-500 dark:text-[var(--app-text)] max-w-xs text-end">{t.wordSourceHint}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {/* Langeek PDF option */}
          <button
            onClick={() => setWordSource('langeek')}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${wordSource === 'langeek'
              ? 'border-[var(--app-accent1)] bg-[var(--app-accent1)]/8 dark:bg-[var(--app-accent1)]/12'
              : 'border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[var(--app-surface)]'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${wordSource === 'langeek' ? 'bg-[var(--app-accent1)] text-white' : 'bg-gray-100 dark:bg-[var(--app-card)] text-gray-500'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className={`font-extrabold text-sm ${wordSource === 'langeek' ? 'text-[var(--app-accent1)]' : 'text-gray-700 dark:text-gray-200'}`}>
                {t.wordSourceLangeek}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {_resolveTranslation(lang, `${cefrWordsDelta.toLocaleString()} كلمة CEFR قياسية (${userLevel}→${targetLevel})`, `${cefrWordsDelta.toLocaleString()} standard CEFR words (${userLevel}→${targetLevel})`)}
              </div>
            </div>
            {wordSource === 'langeek' && <CheckCircle2 className="w-5 h-5 text-[var(--app-accent1)] shrink-0 ml-auto" />}
          </button>

          {/* Vocabulary (uploads) option */}
          <button
            onClick={() => setWordSource('vocab')}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${wordSource === 'vocab'
              ? 'border-[var(--app-accent2)] bg-[var(--app-accent2)]/8 dark:bg-[var(--app-accent2)]/12'
              : 'border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[var(--app-surface)]'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${wordSource === 'vocab' ? 'bg-[var(--app-accent2)] text-white' : 'bg-gray-100 dark:bg-[var(--app-card)] text-gray-500'}`}>
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className={`font-extrabold text-sm ${wordSource === 'vocab' ? 'text-[var(--app-accent2)]' : 'text-gray-700 dark:text-gray-200'}`}>
                {t.wordSourceVocab}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {suitableVocabBase.length > 0
                  ? _resolveTranslation(lang, `${suitableVocabBase.length.toLocaleString()} كلمة في مستواك (${userLevel}+)`, `${suitableVocabBase.length.toLocaleString()} words at your level (${userLevel}+)`)
                  : t.noVocabUploaded
                }
              </div>
            </div>
            {wordSource === 'vocab' && <CheckCircle2 className="w-5 h-5 text-[var(--app-accent2)] shrink-0 ml-auto" />}
          </button>
        </div>
      </div>

      {/* Words per day — auto vs manual */}
      <div className="bg-gray-50 dark:bg-[var(--app-card)] p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]/50 mb-8 relative z-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--app-accent2)]" /> {t.wordsTitle}
          </h3>
          <div className="inline-flex glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-1 text-sm font-bold">
            <button onClick={() => setWordsMode('auto')} className={`px-3 py-1.5 rounded-xl transition-colors ${wordsMode === 'auto' ? 'bg-[#FF0099] text-white' : 'text-gray-600 dark:text-[var(--app-text)] hover:bg-gray-100 dark:hover:bg-[var(--app-surface)]'}`}>
              {t.wordsAuto}
            </button>
            <button onClick={() => setWordsMode('manual')} className={`px-3 py-1.5 rounded-xl transition-colors ${wordsMode === 'manual' ? 'bg-[#FF0099] text-white' : 'text-gray-600 dark:text-[var(--app-text)] hover:bg-gray-100 dark:hover:bg-[var(--app-surface)]'}`}>
              {t.wordsManualLbl}
            </button>
          </div>
        </div>

        {wordsMode === 'auto' ? <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-600 dark:text-[var(--app-text)]" dir="ltr">
            <span className={`font-bold ${wordSource === 'vocab' ? 'text-[var(--app-accent2)]' : 'text-[#FF0099] dark:text-[var(--app-accent2)]'}`}>{userLevel} → {targetLevel}</span>
            {' '}·{' '}
            <span className="font-bold">{wordsDelta.toLocaleString()}</span> {t.wordsToLearn}
            {daysToTarget > 0 && <> · <span className="font-bold">{daysToTarget}</span> {t.days}</>}
            <span className={`ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${wordSource === 'vocab' ? 'bg-[var(--app-accent2)]/10 text-[var(--app-accent2)]' : 'bg-orange-100 dark:bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]'}`}>
              {wordSource === 'vocab' ? <UploadCloud className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {wordSource === 'vocab' ? _resolveTranslation(lang, 'مفرداتي', 'My Vocab') : 'Langeek PDF'}
            </span>
          </div>
          <div className={`text-2xl font-extrabold ${wordSource === 'vocab' ? 'text-[var(--app-accent2)]' : 'text-[#FF0099] dark:text-[var(--app-accent2)]'}`} dir="ltr">
            {autoWordsPerDay} <span className="text-sm font-bold opacity-70">{t.perDay}</span>
          </div>
        </div> : <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <input type="number" min="1" max="100" value={wordsManual} onChange={e => setWordsManual(e.target.value)} className="no-spinner w-32 bg-gray-50 dark:bg-[var(--app-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-3 py-2 text-gray-900 dark:text-[var(--app-text)] font-extrabold text-center text-2xl focus:outline-none focus:border-[var(--app-accent1)]" />
          <span className="font-bold text-gray-700 dark:text-[var(--app-text)]">{t.wordsToLearn} {t.perDay}</span>
        </div>}

        {/* Vocab study time selector */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-gray-700 dark:text-[var(--app-text)]">{t.vocabTimeTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            {[10, 15, 20, 25, 30, 40].map(m => (
              <button
                key={m}
                onClick={() => setVocabMins(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 border ${
                  vocabMins === m
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                    : 'bg-white dark:bg-[var(--app-surface)] border-gray-200 dark:border-white/10 text-gray-600 dark:text-white hover:border-orange-300'
                }`}
              >
                {m}<span className="opacity-70 ml-0.5">{t.vocabTimeMins}</span>
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="120"
              value={vocabMins}
              onChange={e => setVocabMins(Math.max(1, parseInt(e.target.value) || 1))}
              className="no-spinner w-16 h-8 text-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[var(--app-surface)] text-gray-900 dark:text-white font-extrabold text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Live estimate of what the user will need to learn */}
      {planEstimate && <div className="bg-white dark:bg-[#0d0d18] border border-gray-200 dark:border-white/8 p-6 rounded-2xl mb-6 relative z-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--app-accent1)]" /> {t.estimateTitle}
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${wordSource === 'vocab' ? 'bg-[var(--app-accent2)]/15 text-[var(--app-accent2)]' : 'bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]'}`}>
              {wordSource === 'vocab' ? <UploadCloud className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {wordSource === 'vocab' ? _resolveTranslation(lang, 'مفرداتي', 'My Vocab') : 'Langeek PDF'}
            </span>
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 max-w-md text-end">{t.estimateHint}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {[{
            label: t.days,
            value: planEstimate.totalDays,
            accent: '#a78bfa',
            bg: 'bg-violet-50 dark:bg-violet-500/8',
            border: 'border-violet-200 dark:border-violet-500/15',
            Icon: Calendar
          }, {
            label: t.words,
            value: planEstimate.totalWords.toLocaleString(),
            accent: '#a78bfa',
            bg: 'bg-violet-50 dark:bg-violet-500/8',
            border: 'border-violet-200 dark:border-violet-500/15',
            Icon: BookOpen
          }, {
            label: t.rules,
            value: planEstimate.totalRules,
            accent: '#FF5722',
            bg: 'bg-orange-50 dark:bg-orange-500/8',
            border: 'border-orange-200 dark:border-orange-500/15',
            Icon: FileText
          }, {
            label: `${t.categories.listen} (${t.hours})`,
            value: planEstimate.hours.listen.toFixed(1),
            accent: '#60a5fa',
            bg: 'bg-blue-50 dark:bg-blue-500/8',
            border: 'border-blue-200 dark:border-blue-500/15',
            Icon: Headphones
          }, {
            label: `${t.categories.read} (${t.hours})`,
            value: planEstimate.hours.read.toFixed(1),
            accent: '#34d399',
            bg: 'bg-emerald-50 dark:bg-emerald-500/8',
            border: 'border-emerald-200 dark:border-emerald-500/15',
            Icon: BookText
          }, {
            label: `${t.categories.speak} (${t.hours})`,
            value: planEstimate.hours.speak.toFixed(1),
            accent: '#f472b6',
            bg: 'bg-pink-50 dark:bg-pink-500/8',
            border: 'border-pink-200 dark:border-pink-500/15',
            Icon: MessageSquare
          }, {
            label: `${t.categories.write} (${t.hours})`,
            value: planEstimate.hours.write.toFixed(1),
            accent: '#fbbf24',
            bg: 'bg-amber-50 dark:bg-amber-500/8',
            border: 'border-amber-200 dark:border-amber-500/15',
            Icon: PenTool
          }, {
            label: t.wordsTitle,
            value: `${planEstimate.wordsPerDay} ${t.perDay}`,
            accent: '#a78bfa',
            bg: 'bg-violet-50 dark:bg-violet-500/8',
            border: 'border-violet-200 dark:border-violet-500/15',
            Icon: Sparkles
          }].map(({ label, value, accent, bg, border, Icon }, i) => (
            <div key={i} className={`${bg} rounded-2xl p-4 border ${border}`}>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: accent }}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white" dir="ltr">{value}</div>
            </div>
          ))}        </div>
      </div>}

      <button onClick={generatePlan} className="w-full bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black rounded-2xl py-4 font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-2">{t.gen}</button>
    </div>}

    {planData && !isEditing && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-6 md:p-8 animate-fadeIn transition-colors relative print:shadow-none print:border-none print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex h-11 items-center gap-2 bg-gray-50 dark:bg-[var(--app-card)] px-3 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm">
            <button onClick={_resolveTranslation(lang, handleNextWeek, handlePrevWeek)} disabled={_resolveTranslation(lang, currentWeek === planData.totalWeeks, currentWeek === 1)} className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[var(--app-surface)] disabled:opacity-30 transition-colors">
              {_resolveTranslation(lang, <ChevronRight className="w-5 h-5 text-gray-600 dark:text-[var(--app-text)]" />, <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[var(--app-text)]" />)}
            </button>
            <span className="font-bold text-black dark:text-white min-w-[110px] text-center text-sm">
              {t.week} {currentWeek} <span className="text-xs opacity-60">/ {planData.totalWeeks}</span>
            </span>
            <button onClick={_resolveTranslation(lang, handlePrevWeek, handleNextWeek)} disabled={_resolveTranslation(lang, currentWeek === 1, currentWeek === planData.totalWeeks)} className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-[var(--app-surface)] disabled:opacity-30 transition-colors">
              {_resolveTranslation(lang, <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-[var(--app-text)]" />, <ChevronRight className="w-5 h-5 text-gray-600 dark:text-[var(--app-text)]" />)}
            </button>
          </div>
          <CustomDropdown 
            value={currentWeek} 
            onChange={val => { userPickedWeekRef.current = true; if (weekSyncBlockedRef) weekSyncBlockedRef.current = true; setCurrentWeek(Number(val)); }} 
            options={Array.from({ length: planData.totalWeeks }, (_, i) => ({ value: i + 1, label: `${t.week} ${i + 1}` }))} 
            theme={theme}
            className="min-w-[120px]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm font-bold transition-colors px-4 py-2 rounded-xl shadow-sm">
            <Archive className="w-4 h-4" /> {t.exportCsv}
          </button>
          <button onClick={handlePrint} className="bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black flex items-center gap-2 text-sm font-bold transition-colors px-4 py-2 rounded-xl shadow-sm">
            <Printer className="w-4 h-4" /> {t.exportPdf}
          </button>
          <button onClick={() => setIsEditing(prev => !prev)} className={`flex items-center gap-2 text-sm font-bold transition-colors px-4 py-2 rounded-xl ${isEditing ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[var(--app-surface)]'}`}>
            <Sliders className="w-4 h-4" /> {isEditing ? _resolveTranslation(lang, 'إخفاء الإعدادات', 'Hide Settings') : t.reset}
          </button>
          <button onClick={handleResetPlan} className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-bold transition-colors bg-red-50 dark:bg-red-500/10 hover:bg-red-100 px-4 py-2 rounded-xl">
            <Trash2 className="w-4 h-4" /> {_resolveTranslation(lang, 'حذف الخطة', 'Delete Plan')}
          </button>
        </div>
      </div>

      {/* Per-skill progress sliders — hidden while editing */}
      {!isEditing && <div className="bg-gray-50 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)]/50 rounded-2xl p-5 mb-6 print:hidden">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-black dark:text-white" /> {t.progressTitle}
          </h3>
          <span className="text-sm font-bold text-gray-600 dark:text-[var(--app-text)]">
            {t.weekOf} {currentWeek} {t.of} {planData.totalWeeks}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            id: 'listen',
            label: t.categories.listen,
            Icon: Headphones,
            bar: 'from-blue-500 to-blue-400',
            text: 'text-black dark:text-white'
          }, {
            id: 'read',
            label: t.categories.read,
            Icon: BookText,
            bar: 'from-[var(--app-accent2)] to-emerald-400',
            text: 'text-emerald-600 dark:text-white'
          }, {
            id: 'speak',
            label: t.categories.speak,
            Icon: MessageSquare,
            bar: 'from-pink-500 to-pink-400',
            text: 'text-pink-600 dark:text-pink-400'
          }, {
            id: 'write',
            label: t.categories.write,
            Icon: PenTool,
            bar: 'from-[var(--app-accent1)] to-indigo-400',
            text: 'text-indigo-600 dark:text-[var(--app-accent2)]'
          }].map(({
            id,
            label,
            Icon,
            bar,
            text
          }) => {
            const pct = Math.round(currentWeek / planData.totalWeeks * 100);
            const cat = planData.categories.find(c => c.id === id);
            const completedHours = ((currentWeek - 1) * 7 * (cat?.mins || 0) / 60).toFixed(1);
            const totalHours = (planData.totalWeeks * 7 * (cat?.mins || 0) / 60).toFixed(1);
            return <div key={id} className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-1.5 font-bold ${text}`}>
                  <Icon className="w-4 h-4" /> {label}
                </div>
                <span className={`text-xs font-extrabold ${text}`} dir="ltr">{pct}%</span>
              </div>
              {/* Slider-style progress bar */}
              <div className="relative h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${bar} transition-all duration-500 ease-out rounded-full`} style={{
                  width: `${pct}%`
                }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border border-gray-300 transition-all duration-500 ease-out" style={{
                  left: `calc(${pct}% - 7px)`
                }} />
              </div>
              <div className="text-[11px] text-gray-500 dark:text-[var(--app-text)] mt-2 font-semibold" dir="ltr">
                {completedHours} / {totalHours} {t.hours}
              </div>
            </div>;
          })}
        </div>

        {/* Vocab + Grammar stat bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {(() => {
            const completedDays = Math.max(0, (currentWeek - 1) * 7);
            const totalDays = planData.totalWeeks * 7;
            const learnedWords = Math.min(completedDays * planData.wordsPerDay, planMeta?.totalWords || totalDays * planData.wordsPerDay);
            const totalWords = wordsDelta || totalDays * planData.wordsPerDay;
            const wordsPct = totalWords ? Math.round(learnedWords / totalWords * 100) : 0;
            const totalRules = planMeta?.totalRules || rulesDelta || planData.totalWeeks;
            const rpd = planMeta?.rulesPerDay || 1;
            const completedDaysForRules = Math.max(0, (currentWeek - 1) * 7);
            const masteredRules = Math.min(completedDaysForRules * rpd, totalRules);
            const rulesPct = totalRules ? Math.round(masteredRules / totalRules * 100) : 0;
            return [{
              label: t.vocabProgress,
              done: learnedWords.toLocaleString(),
              total: totalWords.toLocaleString(),
              pct: wordsPct,
              suffix: t.learned,
              bar: 'from-[var(--app-accent2)] to-purple-500',
              text: 'text-[#FF0099] dark:text-[var(--app-accent2)]'
            }, {
              label: t.grammarProgress,
              done: masteredRules,
              total: totalRules,
              pct: rulesPct,
              suffix: t.mastered,
              bar: 'from-orange-500 to-amber-500',
              text: 'text-[var(--app-accent1)] dark:text-orange-400'
            }].map((row, i) => <div key={i} className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2 text-sm font-bold">
                <span className={row.text}>{row.label}</span>
                <span className={`${row.text}`} dir="ltr">{row.pct}%</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${row.bar} transition-all duration-500 ease-out rounded-full`} style={{
                  width: `${row.pct}%`
                }} />
              </div>
              <div className="text-[11px] text-gray-500 dark:text-[var(--app-text)] mt-2 font-semibold" dir="ltr">
                {row.done} / {row.total} {row.suffix}
              </div>
            </div>);
          })()}
        </div>
      </div>}

      {/* Screen view: current week only — hidden while editing */}
      {!isEditing && (
        <div className="print-screen-only print:hidden">
          <PlanWeekTable weekNum={currentWeek} planData={planData} userLevel={userLevel} wordsPerDay={wordsPerDay} planGrammarRules={planGrammarRules} rulesPerDay={planMeta?.rulesPerDay || rulesPerDay} t={t} lang={lang} formatTime={formatTime} getVocabRange={getVocabRange} getSpacedRepetition={getSpacedRepetition} dailyTotalMins={dailyTotalMins} weeklyTotalMins={weeklyTotalMins} openVocabModal={openVocabModal} openGrammarModal={openGrammarModal} interactive completedCells={completedCells} onToggleCell={toggleCellCompletion} wordSource={planMeta?.wordSource || wordSource} />
        </div>
      )}
      {/* Print view: all weeks — only rendered when isPrintMode is active */}
      {isPrintMode && (
        <div className="print-layout-container">
          {Array.from({ length: planData.totalWeeks }, (_, i) => i + 1).map(w => (
            <div key={w} className="print-week-page">
              {w === 1 && (
                <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 3px' }}>{_resolveTranslation(lang, 'الجدول الأسبوعي للمذاكرة - Venoxa AI', 'Weekly Study Plan - Venoxa AI')}</h1>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{t.currentLvl}: {userLevel} | {t.targetLvl}: {targetLevel} | {planData.totalWeeks} {_resolveTranslation(lang, 'أسابيع', 'weeks')}</p>
                </div>
              )}
              <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{t.week} {w}</h2>
              </div>
              <PlanWeekTable 
                weekNum={w} 
                planData={planData} 
                userLevel={userLevel} 
                wordsPerDay={wordsPerDay} 
                planGrammarRules={planGrammarRules}
                rulesPerDay={planMeta?.rulesPerDay || rulesPerDay}
                t={t}
                lang={lang}
                formatTime={formatTime} 
                getVocabRange={getVocabRange} 
                getSpacedRepetition={getSpacedRepetition} 
                dailyTotalMins={dailyTotalMins} 
                weeklyTotalMins={weeklyTotalMins} 
                openVocabModal={openVocabModal} 
                openGrammarModal={openGrammarModal} 
                interactive={false} 
                completedCells={completedCells}
                wordSource={planMeta?.wordSource || wordSource}
              />
            </div>
          ))}
        </div>
      )}
      {vocabModal && ReactDOM.createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn print:hidden`} onClick={() => setVocabModal(null)}>
          <div className="glass-panel rounded-2xl max-w-sm w-full border border-gray-200 dark:border-[var(--app-border)] overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
            <div className="bg-[var(--app-accent1)] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5" /> {t.vocabHeader} ({t.day} {vocabModal.day})</h3>
                <p className="text-sm opacity-80 mt-0.5">
                  {vocabModal.langeekRange
                    ? `# ${vocabModal.langeekRange} · ${wordsPerDay} ${t.wordsToLearn}`
                    : `${wordsPerDay} ${t.wordsToLearn}`}
                  {vocabModal.words.length > 0 && (() => { const n = vocabModal.words.filter(w => studiedWords.has(w?.word)).length; return n > 0 ? ` · ✅ ${n}/${vocabModal.words.length}` : ''; })()}
                </p>
              </div>
              <button onClick={() => setVocabModal(null)} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {vocabModal.isLangeek ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-[var(--app-card)]">
                <div className="inline-flex p-4 rounded-full bg-orange-100 dark:bg-[var(--app-accent1)]/20 text-[var(--app-accent1)] mb-5 shadow-sm">
                  <FileText className="w-10 h-10" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t.langeekRangeLabel}</div>
                <div className="text-4xl font-extrabold text-[var(--app-accent1)] mb-4" dir="ltr"># {vocabModal.langeekRange}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[260px] mx-auto">{t.langeekRefMsg}</p>
              </div>
            ) : (
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar bg-gray-50 dark:bg-[var(--app-card)]">
                {vocabModal.words.length === 0 ? (
                  <div className="text-center py-10">
                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">{t.noVocabUploaded}</p>
                  </div>
                ) : vocabModal.words.map((w, i) => {
                  const isStudied = studiedWords.has(w?.word);
                  return <div key={i} onClick={() => toggleStudied(w?.word)} className={`flex items-center gap-3 p-4 glass-panel rounded-2xl border transition-all cursor-pointer select-none ${isStudied ? 'border-green-400 dark:border-green-500 bg-green-50/60 dark:bg-green-500/10' : 'border-gray-100 dark:border-[var(--app-border)] hover:border-gray-300 dark:hover:border-white/20'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${isStudied ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-fuchsia-100 dark:bg-[var(--app-accent2)]/10 text-[#FF0099] dark:text-[var(--app-accent2)]'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`font-extrabold text-lg block leading-tight transition-colors ${isStudied ? 'text-green-700 dark:text-green-400 line-through decoration-green-400/60' : 'text-gray-900 dark:text-[var(--app-text)]'}`} dir="ltr">{safeRender(w?.word)}</span>
                      {w?.meaning && <span className={`text-sm transition-colors ${isStudied ? 'text-green-600/70 dark:text-green-400/60' : 'text-gray-500 dark:text-[var(--app-text)]'}`}>{safeRender(w.meaning)}</span>}
                    </div>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${isStudied ? 'bg-green-500 text-white scale-110 shadow-md shadow-green-500/30' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/30'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>;
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {grammarModal && ReactDOM.createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn print:hidden`} onClick={() => setGrammarModal(null)}>
          <div className="glass-panel rounded-2xl max-w-sm w-full border border-gray-200 dark:border-[var(--app-border)] overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
            <div className="bg-[#1E90FF] p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> {t.grammarHeader} ({t.day} {grammarModal.day})</h3>
                <p className="text-sm opacity-80 mt-0.5">{t.grammarTarget}</p>
              </div>
              <button onClick={() => setGrammarModal(null)} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 text-center bg-gray-50 dark:bg-[var(--app-card)]">
              <div className="inline-flex p-4 rounded-full bg-orange-100 dark:bg-[#1E90FF]/20 text-[var(--app-accent1)] dark:text-orange-400 mb-6 shadow-sm">
                <Target className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-4" dir="ltr">{safeRender(grammarModal.topic)}</h4>
              <p className="text-sm text-gray-500 dark:text-[var(--app-text)] leading-relaxed">
                {_resolveTranslation(lang, 'يمكنك التوجه لقسم "القواعد الشاملة" لطلب شرح مفصل لهذه القاعدة مع الأمثلة من معلم الذكاء الاصطناعي.', 'Head over to the "Comprehensive Grammar" section to get a detailed AI explanation of this rule.')}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>}
  </div>;
}
function Vocabulary({
  AI_KEY,
  userLevel,
  lang,
  globalVocab,
  setGlobalVocab,
  theme,
  srsData,
  setSrsData
}) {
  const [vocabMode, setVocabMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(int);
  }, []);
  const [levelFilter, setLevelFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiStory, setAiStory] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingContextStory, setLoadingContextStory] = useState(false);
  const [contextStory, setContextStory] = useState('');
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const t = {
    browse: _resolveTranslation(lang, 'تصفح الكلمات', 'Browse Words'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'قوائم الكلمات', 'Word Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    emptyLists: _resolveTranslation(lang, 'لا توجد كلمات في هذه القائمة حالياً.', 'No words in this list currently.'),
    rateWordsMsg: _resolveTranslation(lang, 'قيم الكلمات في قسم "تصفح الكلمات" لتظهر هنا.', 'Rate words in Browse mode to see them here.'),
    contextBtn: _resolveTranslation(lang, 'اربط كل الكلمات الصعبة في قصة واحدة', 'Link Hard Words in a Story'),
    smartCards: _resolveTranslation(lang, 'البطاقات الذكية المخصصة', 'Custom Smart Cards'),
    totalWords: _resolveTranslation(lang, 'إجمالي الكلمات المتاحة:', 'Total Available Words:'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث عن كلمة', 'Search Word'),
    filterLevel: _resolveTranslation(lang, 'تصفية بالمستوى', 'Filter by Level'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    noWords: _resolveTranslation(lang, 'لا توجد كلمات مطابقة', 'No matching words'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'لقد أنهيت جميع المراجعات المستحقة في هذا الوقت.', 'You have completed all due reviews.'),
    comeBackLater: _resolveTranslation(lang, 'عُد لاحقاً أو تصفح لتعلم المزيد.', 'Come back later or browse to learn more.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم كلمات جديدة', 'Browse and Learn New Words'),
    noMatch: _resolveTranslation(lang, 'لا توجد كلمات مطابقة لبحثك.', 'No words match your search.'),
    clearFilters: _resolveTranslation(lang, 'مسح الفلاتر', 'Clear Filters'),
    storyBtn: _resolveTranslation(lang, 'قصة للربط الذهني', 'Story for Memory'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    synonyms: _resolveTranslation(lang, 'مرادفات:', 'Synonyms:'),
    aiGenerated: _resolveTranslation(lang, 'مولدة بالذكاء الاصطناعي', 'AI Generated'),
    storyTitle: _resolveTranslation(lang, 'قصة ذكية للحفظ:', 'Smart Memory Story:'),
    clickToShow: _resolveTranslation(lang, 'انقر على البطاقة لإظهار المعنى والتقييم', 'Click the card to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    rateSkip: _resolveTranslation(lang, 'تخطي', 'Skip'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };
  const dueCards = useMemo(() => {
    const now = Date.now();
    return globalVocab.filter(card => {
      const data = srsData[card.word];
      if (!data) return false;
      return data.nextReview <= now;
    });
  }, [globalVocab, srsData, tick]);
  const hardWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [globalVocab, srsData, tick]);
  const learningWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'good'), [globalVocab, srsData, tick]);
  const masteredWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'easy'), [globalVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;
  const parseCSVLine = line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const lines = text.split('\n');
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const rowArr = parseCSVLine(lines[i]);
        if (rowArr.length >= 4 && rowArr[0]) {
          parsedData.push({
            word: rowArr[0].replace(/^"|"$/g, ''),
            type: rowArr[1]?.replace(/^"|"$/g, '') || '',
            level: rowArr[2]?.replace(/^"|"$/g, '') || '',
            meaning: rowArr[3]?.replace(/^"|"$/g, '') || '',
            example: rowArr[4]?.replace(/^"|"$/g, '') || '',
            synonyms: rowArr[5]?.replace(/^"|"$/g, '') || ''
          });
        }
      }
      if (parsedData.length > 0) {
        setGlobalVocab(parsedData);
        setLevelFilter('All');
        setSearchQuery('');
        setVocabMode('browse');
        setUploadMessage(`تم رفع ${parsedData.length} كلمة بنجاح! ✅`);
        setTimeout(() => setUploadMessage(''), 3000);
        // ── Save to Firebase Storage for cross-device sync ──
        uploadVocabCSV('global', text).catch(console.warn);
      } else {
        setUploadMessage('لم يتم العثور على كلمات، تأكد من صيغة الملف ❌');
      }
    };
    reader.readAsText(file);
  };
  const filteredVocabList = useMemo(() => {
    return globalVocab.filter(item => {
      const matchesLevel = levelFilter === 'All' || item.level?.toUpperCase().includes(levelFilter.toUpperCase());
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = item.word.toLowerCase().includes(searchLower) || item.meaning && item.meaning.toLowerCase().includes(searchLower);
      return matchesLevel && matchesSearch;
    });
  }, [globalVocab, levelFilter, searchQuery]);
  const safeIndex = activeWordIndex < filteredVocabList.length ? activeWordIndex : 0;
  const card = vocabMode === 'review' ? dueCards[0] : filteredVocabList[safeIndex];
  useEffect(() => { setAiStory(''); setCardImage(null); setCollocationData(''); }, [card?.word]);
  useEffect(() => {
    if (vocabMode === 'browse' && filteredVocabList.length > 0 && activeWordIndex >= filteredVocabList.length) {
      setActiveWordIndex(0);
    }
  }, [filteredVocabList.length, activeWordIndex, vocabMode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = now;
    if (rating === 'again') nextReview = now + 1 * 60 * 1000; else if (rating === 'hard') nextReview = now + 10 * 60 * 1000; else if (rating === 'good') nextReview = now + 24 * 60 * 60 * 1000; else if (rating === 'easy') nextReview = now + 4 * 24 * 60 * 60 * 1000; else if (rating === 'skip') nextReview = now + 100 * 365 * 24 * 60 * 60 * 1000;
    const newData = {
      ...srsData,
      [card.word]: {
        nextReview,
        rating,
        lastReviewed: now
      }
    };
    setSrsData(newData);
    localStorage.setItem('venoxa_srs_data', JSON.stringify(newData));
    setShowMeaning(false);
    setAiStory('');
    setCollocationData('');
    setCardImage(null);
    if (vocabMode === 'browse') {
      setActiveWordIndex((safeIndex + 1) % filteredVocabList.length);
    }
  };
  const resetWordProgress = wordString => {
    const newData = {
      ...srsData
    };
    delete newData[wordString];
    setSrsData(newData);
    localStorage.setItem('venoxa_srs_data', JSON.stringify(newData));
  };
  // Play a word's pronunciation — respects the accent code directly
  const playAudio = async (accentCode, wordToPlay = card?.word) => {
    if (!wordToPlay) return;
    const genderKey = _voiceGender === 'female' ? 'female' : 'male';
    const voiceName = accentCode === 'en-US' ? EDGE_VOICES.us[genderKey]
      : accentCode === 'en-GB' ? EDGE_VOICES.uk[genderKey]
        : undefined;
    await edgeTTSSpeak(wordToPlay, genderKey, voiceName);
  };

  const generateStory = async () => {
    if (loadingAi || aiStory || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `أنت معلم لغة إنجليزية مرح. قم بتأليف قصة قصيرة جداً ومضحكة (سطرين أو ثلاثة فقط) باللغة الإنجليزية تتضمن الكلمة "${card.word}" (والتي تعني: ${card.meaning}) لمساعدة طالب مستواه ${userLevel} على تذكرها بسهولة.
      بعد القصة الإنجليزية، أضف سطرين باللغة ${_resolveTranslation(lang, 'العربية', 'الإنجليزية')} تشرح فيهما كيف تم استخدام الكلمة في القصة.`;
      await streamText(prompt, setAiStory);
    } catch (err) {
      setAiStory(t.storyError);
    } finally {
      setLoadingAi(false);
    }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      // Step 1: ask the AI for a concrete, single-scene visual description that conveys the word's meaning.
      const briefPrompt = `You are a visual director. For the English word "${card.word}" (which means: ${card.meaning || 'see context'}), describe a SINGLE, concrete, photorealistic scene that captures the LITERAL meaning. 
Rules:
1. One subject, one action.
2. NO abstract concepts, NO metaphors unless they are very visual.
3. NO text, NO letters, NO symbols.
4. Describe colors, lighting, and composition.
5. Output ONLY a 15-word English description.`;
      let visual = '';
      try {
        const raw = await fetchFromGemini(briefPrompt, AI_KEY);
        const errJson = parseGeminiJSON(raw);
        if (!errJson || !errJson.error) {
          visual = String(raw || '').trim().split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
          // Strip surrounding quotes if the model wrapped them.
          visual = visual.replace(/^["'`]+|["'`]+$/g, '').trim();
        }
      } catch (_) {/* fall through to default */ }
      if (!visual) {
        visual = `A high-quality photorealistic professional photograph visually representing the concept of "${card.word}"`;
      }
      const finalPrompt = `${visual}. Cinematic lighting, 8k resolution, highly detailed, professional photography, masterpiece, sharp focus, no text, no watermark.`;
      const seed = Math.floor(Math.random() * 1_000_000);
      // Use a free, no-key image service (no quota) so this works without a paid Imagen key.
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(finalPrompt)}&width=640&height=420&seed=${seed}`);
    } catch (err) {
      console.error("Image generation error", err);
      const fallback = `Photorealistic image showing the meaning of the English word ${card.word} (${card.meaning || ''}), no text, no letters.`;
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(fallback)}&width=640&height=420`);
    } finally {
      setLoadingImage(false);
    }
  };
  const generateContextStory = async () => {
    if (hardWords.length === 0 || loadingContextStory) return;
    setLoadingContextStory(true);
    try {
      const wordsStr = hardWords.map(w => w.word).join(', ');
      const prompt = `You are a creative writing teacher. Use ALL of these words: [${wordsStr}] in a single short, coherent, and interesting story in English. The story should be accessible for a ${userLevel} learner. After the story, explain the context of each word in ${_resolveTranslation(lang, 'Arabic', 'English')}.`;
      await streamText(prompt, setContextStory);
    } catch (e) {
      setContextStory(t.storyError);
    } finally {
      setLoadingContextStory(false);
    }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English collocations dictionary similar to ozdic.com. For the word "${card.word}", list the most common and natural collocations grouped by grammatical pattern. Use this exact format (skip patterns with no collocations, max 6 per group):\nVERB + ${card.word}: verb1, verb2, verb3\nADJ + ${card.word}: adj1, adj2, adj3\n${card.word} + NOUN: noun1, noun2\n${card.word} + VERB: verb1, verb2\nPREPOSITION: in ~, at ~, on ~\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">

    <div className="flex flex-col sm:flex-row glass-panel p-1.5 rounded-2xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
      <button
        onClick={() => { setVocabMode('browse'); setShowMeaning(false); setCardImage(null); setAiStory(''); }}
        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'browse' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}
      >
        <Search className="w-4 h-4" /> {t.browse}
      </button>
      <button
        onClick={() => { setVocabMode('review'); setShowMeaning(false); setCardImage(null); setAiStory(''); }}
        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${vocabMode === 'review' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}
      >
        <Layers className="w-4 h-4" /> {t.review}
        {dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">{dueCards.length}</span>}
      </button>
      <button
        onClick={() => { setVocabMode('lists'); setShowMeaning(false); setCardImage(null); setAiStory(''); }}
        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'lists' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}
      >
        <Archive className="w-4 h-4" /> {t.lists}
      </button>
    </div>

    {vocabMode === 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>

      {listTab === 'hard' && hardWords.length > 0 && <div className="mb-6">
        <button onClick={generateContextStory} disabled={loadingContextStory} className="w-full py-4 bg-orange-50 dark:bg-orange-600/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-[var(--app-accent1)]/20 transition-all shadow-sm">
          {loadingContextStory ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> ✨ {t.contextBtn}</>}
        </button>
        {contextStory && <div className={`mt-4 p-5 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl border border-gray-200 dark:border-[var(--app-border)] ${_resolveTranslation(lang, 'text-right', 'text-left')} prose prose-orange dark:prose-invert max-w-none`}><div style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(contextStory)}</div></div>}
      </div>}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateWordsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          const isAr = /[\u0600-\u06FF]/.test(item.word);
          const isUiAr = lang === 'ar';
          return <div key={item.word} className={`flex ${isUiAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 dark:border-[var(--app-border)] transition-colors group`}>
            <div className={`flex-1 order-1 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              <p className={`text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-3 ${isAr ? 'justify-end' : 'justify-start'}`}>
                <button onClick={() => playAudio('en-US', item.word)} className={`text-gray-500 hover:text-black dark:text-white dark:hover:text-blue-400 transition-colors ${isAr ? 'order-first' : 'order-last'}`}><Volume2 className="w-4 h-4" /></button>
                <span className="truncate">{safeRender(item.word)}</span>
              </p>
              <p className={`text-sm text-gray-600 dark:text-[var(--app-text)] mt-1 opacity-70 ${isAr ? 'text-right' : 'text-left'}`}>{safeRender(item.meaning)}</p>
            </div>
            <div className="flex items-center gap-3 order-2">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 dark:text-[var(--app-accent1)] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Remove word from SRS">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 glass-panel border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {vocabMode === 'browse' && <>
      {vocabMode === 'browse' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
            <div><h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-1">{t.smartCards}</h2><p className="text-sm text-gray-600 dark:text-[var(--app-text)]">{t.totalWords} {globalVocab.length}</p></div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              {uploadMessage && <span className="text-sm text-green-600 dark:text-green-400 font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
              <label className="bg-orange-50 dark:bg-[var(--app-accent1)]/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-[var(--app-accent1)] dark:hover:bg-[var(--app-accent1)] dark:hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm">
                <UploadCloud className="w-4 h-4" /> {t.uploadCSV}
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="relative z-50 flex flex-col md:flex-row items-end gap-4 glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
            <div className="flex-1 w-full flex flex-col gap-2">
              <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Search className="w-4 h-4 text-black dark:text-white" /> {t.searchWord}</label>
              <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[var(--app-input-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-2xl px-4 h-11 text-sm text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none transition-colors" />
            </div>
            <div className="flex-1 w-full flex flex-col gap-2">
              <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-[var(--app-accent1)] dark:text-[var(--app-accent2)]" /> {t.filterLevel}</label>
              <CustomDropdown 
                value={levelFilter} 
                onChange={setLevelFilter} 
                options={['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => ({ value: lvl, label: lvl === 'All' ? 'All Levels' : lvl }))} 
                theme={theme}
                className="w-full"
              />
            </div>
            <div className="flex-1 w-full flex flex-col gap-2">
              <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><List className="w-4 h-4 text-black dark:text-white dark:text-green-400" /> {t.manualSelect} ({filteredVocabList.length})</label>
              <CustomDropdown 
                value={safeIndex} 
                onChange={val => { setActiveWordIndex(Number(val)); setShowMeaning(false); setAiStory(''); setCardImage(null); }} 
                options={filteredVocabList.length === 0 ? [{ value: 0, label: t.noWords }] : filteredVocabList.map((item, idx) => ({ value: idx, label: safeRender(item.word) }))} 
                theme={theme}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>}

    {vocabMode === 'review' && !card && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setVocabMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-2xl font-bold">{t.browseLearn}</button>
    </div>}

    {vocabMode === 'browse' && (filteredVocabList.length === 0 || !card) && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[300px] flex flex-col items-center justify-center p-8 shadow-sm text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-[var(--app-accent1)] mb-4" />
      <h3 className="text-xl text-gray-600 dark:text-[var(--app-text)] font-bold">{t.noMatch}</h3>
    </div>}

    {card && vocabMode !== 'lists' && (
      <div className="w-full">
        <div
          className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative hover:border-blue-300 transition-all duration-300 group animate-fadeIn"
          onClick={() => setShowMeaning(!showMeaning)}
        >
          <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
            <button onClick={e => { e.stopPropagation(); playAudio('en-US'); }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl text-black dark:text-white shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline"><USFlag style={{width:20,height:10,borderRadius:2}} /> US</span></button>
            <button onClick={e => { e.stopPropagation(); playAudio('en-GB'); }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl text-red-600 dark:text-red-400 shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline"><GBFlag style={{width:20,height:10,borderRadius:2}} /> UK</span></button>
          </div>

          <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
            <span className="bg-gray-100 dark:bg-[var(--app-card)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-accent1)]/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{safeRender(card.level)}</span>
          </div>

          {!showMeaning ? <div className="text-center w-full">
            <h3 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6" dir="ltr">{safeRender(card.word)}</h3>
            <p className="text-gray-600 dark:text-white text-sm mt-8 animate-pulse bg-gray-100 dark:bg-[var(--app-card)]/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
          </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-24 px-4">
            <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
            {card.example && <div className="bg-gray-50 dark:bg-transparent p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] mt-4 w-full relative"><p className="text-lg md:text-xl text-gray-800 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
            {card.synonyms && <div className="w-full bg-gray-100 dark:bg-transparent p-4 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] text-sm text-gray-700 dark:text-[var(--app-text)]" dir="ltr"><span className="font-bold text-gray-500 mr-2">{t.synonyms}</span> <span className="text-black dark:text-white">{safeRender(card.synonyms)}</span></div>}

            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
              {!aiStory && <button onClick={e => { e.stopPropagation(); generateStory(); }} disabled={loadingAi} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Lightbulb className="w-5 h-5 text-amber-400" /> {t.storyBtn}</>}</button>}
              {!cardImage && <button onClick={e => { e.stopPropagation(); generateImage(); }} disabled={loadingImage} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5 text-blue-400" /> {t.imgBtn}</>}</button>}
              {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingCollocation ? <Activity className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5 text-emerald-400" /> {t.collocationsBtn}</>}</button>}
            </div>

            {collocationData && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-teal-500 p-5 rounded-2xl w-full text-left mt-2" onClick={e => e.stopPropagation()}><div className="font-mono text-gray-800 dark:text-[var(--app-text)] text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(collocationData)}</div></div>}
            {aiStory && <div className={`bg-gray-50 dark:bg-[var(--app-card)] border-${_resolveTranslation(lang, 'r', 'l')}-4 border-orange-500 p-5 rounded-2xl w-full ${_resolveTranslation(lang, 'text-right', 'text-left')} mt-4`} onClick={e => e.stopPropagation()}><div className="prose prose-orange dark:prose-invert max-w-none text-gray-800 dark:text-[var(--app-text)] text-sm" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(aiStory)}</div></div>}
            {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl flex flex-col items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-black dark:text-white mb-2 animate-bounce" /><span className="text-sm text-black dark:text-white font-bold">{t.loading}</span></div>}
            {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--app-border)] shadow-sm relative bg-gray-50 dark:bg-[var(--app-card)]" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => { e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found'; }} /></div>}
          </div>}
        </div>

        {showMeaning && (
          <div className="grid grid-cols-5 gap-2 md:gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-rose-500/10 text-red-600 border border-red-200 dark:border-rose-500/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center text-xs md:text-sm">{t.rateAgain} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
            <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] border border-orange-200 dark:border-white/12 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center text-xs md:text-sm">{t.rateHard} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
            <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[var(--app-accent2)]/10 text-green-600 border border-green-200 dark:border-[var(--app-accent2)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center text-xs md:text-sm">{t.rateGood} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
            <button onClick={() => handleRate('easy')} className="bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 text-black dark:text-white border border-[var(--app-accent1)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-[var(--app-hover)] hover:text-black flex flex-col items-center text-xs md:text-sm">{t.rateEasy} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
            <button onClick={() => handleRate('skip')} className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 flex flex-col items-center text-xs md:text-sm">{t.rateSkip} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">-</span></button>
          </div>
        )}
      </div>
    )}
  </div>;
}
function PhrasalVerbs({
  AI_KEY,
  userLevel,
  lang,
  phrasalVocab,
  setPhrasalVocab,
  theme,
  phrasalSrs: srsData,
  setPhrasalSrs: setSrsData
}) {
  const [mode, setMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiStory, setAiStory] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  useEffect(() => { const int = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(int); }, []);
  const t = {
    browse: _resolveTranslation(lang, 'تصفح', 'Browse'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'القوائم', 'Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث', 'Search'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    noWords: _resolveTranslation(lang, 'لا توجد عناصر مطابقة', 'No matching items'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'أنهيت جميع المراجعات المستحقة.', 'All due reviews completed.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم', 'Browse and Learn'),
    clickToShow: _resolveTranslation(lang, 'انقر لإظهار المعنى والتقييم', 'Click to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    rateSkip: _resolveTranslation(lang, 'تخطي', 'Skip'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    storyBtn: _resolveTranslation(lang, 'قصة للربط الذهني', 'Story for Memory'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    totalItems: _resolveTranslation(lang, 'إجمالي الأفعال:', 'Total phrasal verbs:'),
    emptyLists: _resolveTranslation(lang, 'لا توجد عناصر في هذه القائمة.', 'No items in this list.'),
    rateItemsMsg: _resolveTranslation(lang, 'قيم العناصر في قسم "تصفح" لتظهر هنا.', 'Rate items in Browse mode to see them here.'),
    csvHint: _resolveTranslation(lang, 'الصيغة: الفعل المركب، المعنى، الجملة', 'Format: phrasal verb, meaning, sentence'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };
  const dueCards = useMemo(() => { const now = Date.now(); return phrasalVocab.filter(c => { const d = srsData[c.word]; return d && d.nextReview <= now; }); }, [phrasalVocab, srsData, tick]);
  const hardWords = useMemo(() => phrasalVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [phrasalVocab, srsData, tick]);
  const learningWords = useMemo(() => phrasalVocab.filter(w => srsData[w.word]?.rating === 'good'), [phrasalVocab, srsData, tick]);
  const masteredWords = useMemo(() => phrasalVocab.filter(w => srsData[w.word]?.rating === 'easy'), [phrasalVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;
  const parseCSVLine = line => { const result = []; let current = ''; let inQuotes = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"' && line[i + 1] === '"') { current += '"'; i++; } else if (char === '"') { inQuotes = !inQuotes; } else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; } else { current += char; } } result.push(current.trim()); return result; };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const rawText = e.target.result;
      const lines = rawText.split('\n');
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const r = parseCSVLine(lines[i]);
        if (r.length >= 2 && r[0]) parsedData.push({ word: r[0].replace(/^"|"$/g, ''), meaning: r[1]?.replace(/^"|"$/g, '') || '', example: r[2]?.replace(/^"|"$/g, '') || '' });
      }
      if (parsedData.length > 0) {
        setPhrasalVocab(parsedData);
        localStorage.setItem('venoxa_phrasal_vocab', JSON.stringify(parsedData));
        setSearchQuery(''); setMode('browse');
        setUploadMessage(`✅ ${parsedData.length} phrasal verbs uploaded!`);
        setTimeout(() => setUploadMessage(''), 3000);
        // ── Save to Firebase Storage for cross-device sync ──
        uploadVocabCSV('phrasal', rawText).catch(console.warn);
      } else { setUploadMessage('❌ No data found. Check CSV format.'); }
    };
    reader.readAsText(file);
  };
  const filteredList = useMemo(() => { const s = searchQuery.toLowerCase(); return phrasalVocab.filter(item => item.word.toLowerCase().includes(s) || (item.meaning && item.meaning.toLowerCase().includes(s))); }, [phrasalVocab, searchQuery]);
  const safeIndex = activeWordIndex < filteredList.length ? activeWordIndex : 0;
  const card = mode === 'review' ? dueCards[0] : filteredList[safeIndex];
  useEffect(() => { setCollocationData(''); setCardImage(null); setAiStory(''); }, [card?.word]);
  useEffect(() => { if (mode === 'browse' && filteredList.length > 0 && activeWordIndex >= filteredList.length) setActiveWordIndex(0); }, [filteredList.length, activeWordIndex, mode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = rating === 'again' ? now + 60000 : rating === 'hard' ? now + 600000 : rating === 'good' ? now + 86400000 : rating === 'skip' ? now + 100 * 365 * 24 * 60 * 60 * 1000 : now + 345600000;
    const newData = { ...srsData, [card.word]: { nextReview, rating, lastReviewed: now } };
    setSrsData(newData); localStorage.setItem('venoxa_phrasal_srs', JSON.stringify(newData));
    setShowMeaning(false); setAiStory(''); setCardImage(null); setCollocationData('');
    if (mode === 'browse') setActiveWordIndex((safeIndex + 1) % filteredList.length);
  };
  const resetWordProgress = wordStr => { const d = { ...srsData }; delete d[wordStr]; setSrsData(d); localStorage.setItem('venoxa_phrasal_srs', JSON.stringify(d)); };
  const playAudio = async (w = card?.word) => { if (!w) return; await edgeTTSSpeak(w, _voiceGender); };
  const generateStory = async () => {
    if (loadingAi || aiStory || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `You are a fun English teacher. Write a vivid, memorable 2-3 line story in English using the phrasal verb "${card.word}" (meaning: ${card.meaning}) to help a ${userLevel} learner remember it. Then add a brief ${_resolveTranslation(lang, 'Arabic', 'English')} note explaining how the phrasal verb was used.`;
      await streamText(prompt, setAiStory);
    } catch { setAiStory('Error generating story.'); } finally { setLoadingAi(false); }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English collocations dictionary. For the phrasal verb "${card.word}", list the most common and natural collocations or common usage patterns. Group them by grammatical context. Use this exact format (max 6 per group):\nPattern + ${card.word}: example1, example2\n${card.word} + Pattern: example1, example2\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      const briefPrompt = `You are a visual director. For the phrasal verb "${card.word}" (${card.meaning}), describe a SINGLE, concrete, photorealistic scene that captures the LITERAL meaning. 
Rules:
1. One subject, one action.
2. NO abstract concepts, NO text, NO letters.
3. Describe colors, lighting, and composition.
4. Output ONLY a 15-word English description.`;
      let visual = '';
      try { const raw = await fetchFromGemini(briefPrompt, AI_KEY); const ej = parseGeminiJSON(raw); if (!ej?.error) visual = String(raw || '').trim().split('\n')[0]?.replace(/^["'`]+|["'`]+$/g, '').trim() || ''; } catch { }
      if (!visual) visual = `A scene showing the phrasal verb "${card.word}"`;
      const visualClean = (visual + ' Photorealistic, natural lighting, no text.').replace(/[^\x00-\x7F]/g, "");
      const seed = Math.floor(Math.random() * 1_000_000);
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(visualClean)}&width=640&height=420&seed=${seed}`);
    } catch { setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(`Phrasal verb ${card?.word}`.replace(/[^\x00-\x7F]/g, ""))}&width=640&height=420`); } finally { setLoadingImage(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row glass-panel p-1.5 rounded-2xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
      <button onClick={() => { setMode('browse'); setShowMeaning(false); setCardImage(null); setAiStory(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'browse' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => { setMode('review'); setShowMeaning(false); setCardImage(null); setAiStory(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${mode === 'review' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Layers className="w-4 h-4" /> {t.review}{dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">{dueCards.length}</span>}</button>
      <button onClick={() => { setMode('lists'); setShowMeaning(false); setCardImage(null); setAiStory(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'lists' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>
    {mode === 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateItemsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          const isAr = /[\u0600-\u06FF]/.test(item.word);
          const isUiAr = lang === 'ar';
          return <div key={item.word} className={`flex ${isUiAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 transition-colors group`}>
            <div className={`flex-1 order-1 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              <p className={`text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2 ${isAr ? 'justify-end' : 'justify-start'}`}>
                <button onClick={() => playAudio(item.word)} className={`text-gray-500 hover:text-black dark:text-white transition-colors ${isAr ? 'order-first' : 'order-last'}`}><Volume2 className="w-4 h-4" /></button>
                <span>{safeRender(item.word)}</span>
              </p>
              <p className={`text-sm text-gray-600 dark:text-[var(--app-text)] mt-1 ${isAr ? 'text-right' : 'text-left'}`}>{safeRender(item.meaning)}</p>
            </div>
            <div className="flex items-center gap-3 order-2">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Remove from SRS"><Trash2 className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 glass-panel border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>}
    {mode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-1">{_resolveTranslation(lang, 'الأفعال المركبة', 'Phrasal Verbs')}</h2><p className="text-sm text-gray-600 dark:text-[var(--app-text)]">{t.totalItems} {phrasalVocab.length} · <span className="text-xs opacity-60">{t.csvHint}</span></p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-[var(--app-accent1)]/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-[var(--app-accent1)] dark:hover:bg-[var(--app-accent1)] dark:hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"><UploadCloud className="w-4 h-4" /> {t.uploadCSV}<input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" /></label>
        </div>
      </div>
      <div className="relative z-50 flex flex-col md:flex-row items-end gap-4 glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors relative z-50">
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Search className="w-4 h-4 text-black dark:text-white" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[var(--app-input-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-2xl px-4 h-11 text-sm text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none transition-colors" />
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><List className="w-4 h-4 text-black dark:text-white" /> {t.manualSelect} ({filteredList.length})</label>
          <CustomDropdown 
            value={safeIndex} 
            onChange={val => { setActiveWordIndex(Number(val)); setShowMeaning(false); setAiStory(''); setCardImage(null); }} 
            options={filteredList.length === 0 ? [{ value: 0, label: t.noWords }] : filteredList.map((item, idx) => ({ value: idx, label: safeRender(item.word) }))} 
            theme={theme}
            className="w-full"
          />
        </div>
      </div>
    </>}
    {mode === 'review' && !card && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-2xl font-bold">{t.browseLearn}</button>
    </div>}
    {mode === 'browse' && (filteredList.length === 0 || !card) && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[300px] flex flex-col items-center justify-center p-8 shadow-sm text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-[var(--app-accent1)] mb-4" /><h3 className="text-xl text-gray-600 dark:text-[var(--app-text)] font-bold">{t.noWords}</h3>
    </div>}
    {card && mode !== 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative z-0 hover:border-blue-300 transition-all duration-300 animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>
      <div className="absolute top-6 left-6 z-10">
        <button onClick={e => { e.stopPropagation(); playAudio(); }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl text-black dark:text-white shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /></button>
      </div>
      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-[var(--app-accent1)] text-sm mt-8 animate-pulse bg-gray-100 dark:bg-[var(--app-card)]/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-16 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-transparent p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] w-full"><p className="text-lg text-gray-800 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiStory && <button onClick={e => { e.stopPropagation(); generateStory(); }} disabled={loadingAi} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Lightbulb className="w-5 h-5 text-amber-400" /> {t.storyBtn}</>}</button>}
          {!cardImage && <button onClick={e => { e.stopPropagation(); generateImage(); }} disabled={loadingImage} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5 text-blue-400" /> {t.imgBtn}</>}</button>}
          {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingCollocation ? <Activity className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5 text-emerald-400" /> {t.collocationsBtn}</>}</button>}
        </div>
        {collocationData && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-teal-500 p-5 rounded-2xl w-full text-left mt-2" onClick={e => e.stopPropagation()}><div className="font-mono text-gray-800 dark:text-[var(--app-text)] text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(collocationData)}</div></div>}
        {aiStory && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-orange-500 p-5 rounded-2xl w-full text-left mt-4" onClick={e => e.stopPropagation()}><div className="prose prose-orange dark:prose-invert max-w-none text-gray-800 dark:text-[var(--app-text)] text-sm" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(aiStory)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl flex flex-col items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-black dark:text-white mb-2 animate-bounce" /><span className="text-sm text-black dark:text-white font-bold">{t.loading}</span></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--app-border)] shadow-sm" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => { e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found'; }} /></div>}
      </div>}
    </div>}
    {showMeaning && card && mode !== 'lists' && <div className="grid grid-cols-5 gap-2 md:gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-rose-500/10 text-red-600 border border-red-200 dark:border-rose-500/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center text-xs md:text-sm">{t.rateAgain}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] border border-orange-200 dark:border-white/12 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center text-xs md:text-sm">{t.rateHard}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[var(--app-accent2)]/10 text-green-600 border border-green-200 dark:border-[var(--app-accent2)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center text-xs md:text-sm">{t.rateGood}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 text-black dark:text-white border border-[var(--app-accent1)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-[var(--app-hover)] hover:text-black flex flex-col items-center text-xs md:text-sm">{t.rateEasy}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
      <button onClick={() => handleRate('skip')} className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 flex flex-col items-center text-xs md:text-sm">{t.rateSkip}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">-</span></button>
    </div>}
  </div>;
}

function IdiomsSlang({
  AI_KEY,
  userLevel,
  lang,
  idiomsVocab,
  setIdiomsVocab,
  theme,
  idiomsSrs: srsData,
  setIdiomsSrs: setSrsData
}) {
  const [mode, setMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiSentence, setAiSentence] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  useEffect(() => { const int = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(int); }, []);
  const t = {
    browse: _resolveTranslation(lang, 'تصفح', 'Browse'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'القوائم', 'Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث', 'Search'),
    filterTopic: _resolveTranslation(lang, 'تصفية بالموضوع', 'Filter by Topic'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    allTopics: _resolveTranslation(lang, 'كل المواضيع', 'All Topics'),
    noWords: _resolveTranslation(lang, 'لا توجد عناصر مطابقة', 'No matching items'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'أنهيت جميع المراجعات المستحقة.', 'All due reviews completed.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم', 'Browse and Learn'),
    clickToShow: _resolveTranslation(lang, 'انقر لإظهار المعنى والتقييم', 'Click to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    rateSkip: _resolveTranslation(lang, 'تخطي', 'Skip'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    genSentenceBtn: _resolveTranslation(lang, 'توليد جملة بالذكاء الاصطناعي', 'Generate a Sentence (AI)'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    totalItems: _resolveTranslation(lang, 'إجمالي العامية:', 'Total slang:'),
    emptyLists: _resolveTranslation(lang, 'لا توجد عناصر في هذه القائمة.', 'No items in this list.'),
    rateItemsMsg: _resolveTranslation(lang, 'قيم العناصر في قسم "تصفح" لتظهر هنا.', 'Rate items in Browse mode to see them here.'),
    csvHint: _resolveTranslation(lang, 'الصيغة: الموضوع؛ التعبير؛ المعنى؛ الجملة', 'Format: Topic; Slang; Meaning; Sentence'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };

  // Unique topics derived from the vocab list
  const allTopics = useMemo(() => {
    const topics = [...new Set(idiomsVocab.map(w => w.topic).filter(Boolean))].sort();
    return topics;
  }, [idiomsVocab]);

  const dueCards = useMemo(() => { const now = Date.now(); return idiomsVocab.filter(c => { const d = srsData[c.word]; return d && d.nextReview <= now; }); }, [idiomsVocab, srsData, tick]);
  const hardWords = useMemo(() => idiomsVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [idiomsVocab, srsData, tick]);
  const learningWords = useMemo(() => idiomsVocab.filter(w => srsData[w.word]?.rating === 'good'), [idiomsVocab, srsData, tick]);
  const masteredWords = useMemo(() => idiomsVocab.filter(w => srsData[w.word]?.rating === 'easy'), [idiomsVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;

  // Parse semicolon-delimited CSV line, handling quoted fields
  const parseCSVLine = (line, sep = ';') => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') { inQuotes = !inQuotes; }
      else if (char === sep && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const rawText = e.target.result;
      const lines = rawText.split('\n');
      // Auto-detect delimiter from header line
      const header = lines[0] || '';
      const sep = header.includes(';') ? ';' : ',';
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const r = parseCSVLine(lines[i], sep);
        // Columns: Topic(0) ; Slang(1) ; Meaning(2) ; Sentence(3)
        if (r.length >= 3 && r[1]) {
          parsedData.push({
            topic: r[0]?.replace(/^"|"$/g, '').trim() || '',
            word: r[1].replace(/^"|"$/g, '').trim(),
            meaning: r[2]?.replace(/^"|"$/g, '').trim() || '',
            example: r[3]?.replace(/^"|"$/g, '').trim() || '',
          });
        }
      }
      if (parsedData.length > 0) {
        setIdiomsVocab(parsedData);
        localStorage.setItem('venoxa_idioms_vocab', JSON.stringify(parsedData));
        setSearchQuery(''); setTopicFilter('All'); setMode('browse');
        setUploadMessage(`✅ ${parsedData.length} slang uploaded!`);
        setTimeout(() => setUploadMessage(''), 3000);
        // ── Save to Firebase Storage for cross-device sync ──
        uploadVocabCSV('slang', rawText).catch(console.warn);
      } else { setUploadMessage('❌ No data found. Check CSV format.'); }
    };
    reader.readAsText(file);
  };

  const filteredList = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return idiomsVocab.filter(item => {
      const matchesTopic = topicFilter === 'All' || item.topic === topicFilter;
      const matchesSearch = item.word.toLowerCase().includes(s) || (item.meaning && item.meaning.toLowerCase().includes(s));
      return matchesTopic && matchesSearch;
    });
  }, [idiomsVocab, searchQuery, topicFilter]);

  const safeIndex = activeWordIndex < filteredList.length ? activeWordIndex : 0;
  const card = mode === 'review' ? dueCards[0] : filteredList[safeIndex];
  useEffect(() => { setCollocationData(''); setCardImage(null); setAiSentence(''); }, [card?.word]);
  useEffect(() => { if (mode === 'browse' && filteredList.length > 0 && activeWordIndex >= filteredList.length) setActiveWordIndex(0); }, [filteredList.length, activeWordIndex, mode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = rating === 'again' ? now + 60000 : rating === 'hard' ? now + 600000 : rating === 'good' ? now + 86400000 : rating === 'skip' ? now + 100 * 365 * 24 * 60 * 60 * 1000 : now + 345600000;
    const newData = { ...srsData, [card.word]: { nextReview, rating, lastReviewed: now } };
    setSrsData(newData); localStorage.setItem('venoxa_idioms_srs', JSON.stringify(newData));
    setShowMeaning(false); setAiSentence(''); setCardImage(null); setCollocationData('');
    if (mode === 'browse') setActiveWordIndex((safeIndex + 1) % filteredList.length);
  };
  const resetWordProgress = wordStr => { const d = { ...srsData }; delete d[wordStr]; setSrsData(d); localStorage.setItem('venoxa_idioms_srs', JSON.stringify(d)); };
  const playAudio = async (w = card?.word) => { if (!w) return; await edgeTTSSpeak(w, _voiceGender); };
  const generateSentence = async () => {
    if (loadingAi || aiSentence || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `Create one natural, realistic English sentence using the idiom or slang expression "${card.word}" (which means: ${card.meaning}). The sentence should be suitable for a ${userLevel} learner. After the English sentence, add a short ${_resolveTranslation(lang, 'Arabic', 'English')} note explaining how the expression is used in context. Output the sentence first, then the note on a new line.`;
      await streamText(prompt, setAiSentence);
    } catch { setAiSentence('Error generating sentence.'); } finally { setLoadingAi(false); }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English collocations dictionary. For the idiom "${card.word}", list the most common and natural usage patterns or context pairs. Group them by grammatical context. Use this exact format (max 6 per group):\nPattern + ${card.word}: example1, example2\n${card.word} + Pattern: example1, example2\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      const briefPrompt = `You are a visual director. For the idiom "${card.word}" (${card.meaning}), describe a SINGLE, concrete, photorealistic scene that captures the LITERAL or most iconic visual representation. 
Rules:
1. One subject, one action.
2. NO text, NO letters, NO symbols.
3. Describe colors, lighting, and composition.
4. Output ONLY a 15-word English description.`;
      let visual = '';
      try { const raw = await fetchFromGemini(briefPrompt, AI_KEY); const ej = parseGeminiJSON(raw); if (!ej?.error) visual = String(raw || '').trim().split('\n')[0]?.replace(/^["'`]+|["'`]+$/g, '').trim() || ''; } catch { }
      if (!visual) visual = `A scene showing the meaning of "${card.word}"`;
      const seed = Math.floor(Math.random() * 1_000_000);
      const visualClean = (visual + ' Photorealistic, natural lighting, no text.').replace(/[^\x00-\x7F]/g, "");
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(visualClean)}&width=640&height=420&seed=${seed}`);
    } catch {
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(`Illustration ${card?.word}`.replace(/[^\x00-\x7F]/g, ""))}&width=640&height=420`);
    } finally { setLoadingImage(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row glass-panel p-1.5 rounded-2xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
      <button onClick={() => { setMode('browse'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'browse' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => { setMode('review'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${mode === 'review' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Layers className="w-4 h-4" /> {t.review}{dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">{dueCards.length}</span>}</button>
      <button onClick={() => { setMode('lists'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'lists' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>
    {mode === 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateItemsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          const isAr = /[\u0600-\u06FF]/.test(item.word);
          const isUiAr = lang === 'ar';
          return <div key={item.word} className={`flex ${isUiAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 transition-colors group`}>
            <div className={`flex-1 order-1 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              <div className={`flex items-center gap-2 flex-wrap ${isAr ? 'justify-end' : 'justify-start'}`}>
                <p className="text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
                  <button onClick={() => playAudio(item.word)} className={`text-gray-500 hover:text-black dark:text-white transition-colors ${isAr ? 'order-first' : 'order-last'}`}><Volume2 className="w-4 h-4" /></button>
                  <span>{safeRender(item.word)}</span>
                </p>
                {item.topic && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1E90FF]/10 dark:bg-[var(--app-accent2)]/10 text-[var(--app-accent1)] dark:text-[var(--app-accent2)] border border-[#1E90FF]/30 dark:border-purple-500/20">{safeRender(item.topic)}</span>}
              </div>
              <p className={`text-sm text-gray-600 dark:text-[var(--app-text)] mt-1 ${isAr ? 'text-right' : 'text-left'}`}>{safeRender(item.meaning)}</p>
            </div>
            <div className="flex items-center gap-3 order-2">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Remove from SRS"><Trash2 className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 glass-panel border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>}
    {mode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-1">{_resolveTranslation(lang, 'العامية', 'Slang')}</h2><p className="text-sm text-gray-600 dark:text-[var(--app-text)]">{t.totalItems} {idiomsVocab.length} · <span className="text-xs opacity-60">{t.csvHint}</span></p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-[var(--app-accent1)]/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-[var(--app-accent1)] dark:hover:bg-[var(--app-accent1)] dark:hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"><UploadCloud className="w-4 h-4" /> {t.uploadCSV}<input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" /></label>
        </div>
      </div>
      <div className="relative z-50 flex flex-col md:flex-row items-end gap-4 glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors relative z-50">
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Search className="w-4 h-4 text-black dark:text-white" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setActiveWordIndex(0); setShowMeaning(false); setAiSentence(''); setCardImage(null); }} className="w-full bg-gray-50 dark:bg-[var(--app-input-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-2xl px-4 h-11 text-sm text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none transition-colors" />
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-[var(--app-accent1)]" /> {t.filterTopic}</label>
          <CustomDropdown 
            value={topicFilter} 
            onChange={val => { setTopicFilter(val); setActiveWordIndex(0); setShowMeaning(false); setAiSentence(''); setCardImage(null); }} 
            options={[{ value: 'All', label: _resolveTranslation(lang, 'كل المواضيع', 'All Topics') }, ...[...new Set(idiomsVocab.map(v => v.topic).filter(Boolean))].map(tp => ({ value: tp, label: tp }))]} 
            theme={theme}
            className="w-full"
          />
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><List className="w-4 h-4 text-black dark:text-white" /> {t.manualSelect} ({filteredList.length})</label>
          <CustomDropdown 
            value={safeIndex} 
            onChange={val => { setActiveWordIndex(Number(val)); setShowMeaning(false); setAiSentence(''); setCardImage(null); }} 
            options={filteredList.length === 0 ? [{ value: 0, label: t.noWords }] : filteredList.map((item, idx) => ({ value: idx, label: safeRender(item.word) }))} 
            theme={theme}
            className="w-full"
          />
        </div>
      </div>
    </>}
    {mode === 'review' && !card && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-2xl font-bold">{t.browseLearn}</button>
    </div>}
    {mode === 'browse' && (filteredList.length === 0 || !card) && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[300px] flex flex-col items-center justify-center p-8 shadow-sm text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-[var(--app-accent1)] mb-4" /><h3 className="text-xl text-gray-600 dark:text-[var(--app-text)] font-bold">{t.noWords}</h3>
    </div>}
    {card && mode !== 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative z-0 hover:border-blue-300 transition-all duration-300 animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>
      <div className="absolute top-6 left-6 z-10">
        <button onClick={e => { e.stopPropagation(); playAudio(); }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl text-[var(--app-accent1)] dark:text-[var(--app-accent2)] shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /></button>
      </div>
      {card.topic && <span className="absolute top-6 right-6 bg-[#1E90FF]/10 dark:bg-[var(--app-accent2)]/10 text-[var(--app-accent1)] dark:text-[var(--app-accent2)] border border-[#1E90FF]/30 dark:border-purple-500/20 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{safeRender(card.topic)}</span>}
      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-[var(--app-accent1)] text-sm mt-8 animate-pulse bg-gray-100 dark:bg-[var(--app-card)]/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-16 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-transparent p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] w-full"><p className="text-lg text-gray-800 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiSentence && <button onClick={e => { e.stopPropagation(); generateSentence(); }} disabled={loadingAi} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 text-purple-400" /> {t.genSentenceBtn}</>}</button>}
          {!cardImage && <button onClick={e => { e.stopPropagation(); generateImage(); }} disabled={loadingImage} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5 text-blue-400" /> {t.imgBtn}</>}</button>}
          {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingCollocation ? <Activity className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5 text-emerald-400" /> {t.collocationsBtn}</>}</button>}
        </div>
        {collocationData && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-teal-500 p-5 rounded-2xl w-full text-left mt-2" onClick={e => e.stopPropagation()}><div className="font-mono text-gray-800 dark:text-[var(--app-text)] text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(collocationData)}</div></div>}
        {aiSentence && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-[#1E90FF] p-5 rounded-2xl w-full text-left mt-4" onClick={e => e.stopPropagation()}><div className="prose prose-purple dark:prose-invert max-w-none text-gray-800 dark:text-[var(--app-text)] text-sm" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(aiSentence)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl flex items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-[var(--app-accent1)] animate-bounce" /></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--app-border)] shadow-sm" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => { e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found'; }} /></div>}
      </div>}
    </div>}
    {showMeaning && card && mode !== 'lists' && <div className="grid grid-cols-5 gap-2 md:gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-rose-500/10 text-red-600 border border-red-200 dark:border-rose-500/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center text-xs md:text-sm">{t.rateAgain}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] border border-orange-200 dark:border-white/12 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center text-xs md:text-sm">{t.rateHard}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[var(--app-accent2)]/10 text-green-600 border border-green-200 dark:border-[var(--app-accent2)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center text-xs md:text-sm">{t.rateGood}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 text-black dark:text-white border border-[var(--app-accent1)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-[var(--app-hover)] hover:text-black flex flex-col items-center text-xs md:text-sm">{t.rateEasy}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
      <button onClick={() => handleRate('skip')} className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 flex flex-col items-center text-xs md:text-sm">{t.rateSkip}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">-</span></button>
    </div>}
  </div>;
}

function IdiomsProper({
  AI_KEY,
  userLevel,
  lang,
  idiomsProperVocab,
  setIdiomsProperVocab,
  theme,
  idiomsProperSrs: srsData,
  setIdiomsProperSrs: setSrsData
}) {
  const [mode, setMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiSentence, setAiSentence] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  useEffect(() => { const int = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(int); }, []);
  const t = {
    browse: _resolveTranslation(lang, 'تصفح', 'Browse'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'القوائم', 'Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث', 'Search'),
    filterTopic: _resolveTranslation(lang, 'تصفية بالموضوع', 'Filter by Topic'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    allTopics: _resolveTranslation(lang, 'كل المواضيع', 'All Topics'),
    noWords: _resolveTranslation(lang, 'لا توجد عناصر مطابقة', 'No matching items'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'أنهيت جميع المراجعات المستحقة.', 'All due reviews completed.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم', 'Browse and Learn'),
    clickToShow: _resolveTranslation(lang, 'انقر لإظهار المعنى والتقييم', 'Click to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    rateSkip: _resolveTranslation(lang, 'تخطي', 'Skip'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    genSentenceBtn: _resolveTranslation(lang, 'توليد جملة بالذكاء الاصطناعي', 'Generate a Sentence (AI)'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    totalItems: _resolveTranslation(lang, 'إجمالي التعابير:', 'Total idioms:'),
    emptyLists: _resolveTranslation(lang, 'لا توجد عناصر في هذه القائمة.', 'No items in this list.'),
    rateItemsMsg: _resolveTranslation(lang, 'قيم العناصر في قسم "تصفح" لتظهر هنا.', 'Rate items in Browse mode to see them here.'),
    csvHint: _resolveTranslation(lang, 'الصيغة: الموضوع؛ التعبير؛ المعنى؛ الجملة', 'Format: Topic; Idiom; Meaning; Sentence'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };

  const allTopics = useMemo(() => {
    const topics = [...new Set(idiomsProperVocab.map(w => w.topic).filter(Boolean))].sort();
    return topics;
  }, [idiomsProperVocab]);

  const dueCards = useMemo(() => { const now = Date.now(); return idiomsProperVocab.filter(c => { const d = srsData[c.word]; return d && d.nextReview <= now; }); }, [idiomsProperVocab, srsData, tick]);
  const hardWords = useMemo(() => idiomsProperVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [idiomsProperVocab, srsData, tick]);
  const learningWords = useMemo(() => idiomsProperVocab.filter(w => srsData[w.word]?.rating === 'good'), [idiomsProperVocab, srsData, tick]);
  const masteredWords = useMemo(() => idiomsProperVocab.filter(w => srsData[w.word]?.rating === 'easy'), [idiomsProperVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;

  const parseCSVLine = (line, sep) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') { inQuotes = !inQuotes; }
      else if (char === sep && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const rawText = e.target.result;
      const lines = rawText.split('\n');
      const header = lines[0] || '';
      // Support tab, semicolon, or comma delimiters
      const sep = header.includes('\t') ? '\t' : header.includes(';') ? ';' : ',';
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const r = parseCSVLine(lines[i], sep);
        // Columns: Topic(0) | Idiom(1) | Meaning(2) | Sentence(3)
        if (r.length >= 3 && r[1]) {
          parsedData.push({
            topic: r[0]?.replace(/^"|"$/g, '').trim() || '',
            word: r[1].replace(/^"|"$/g, '').trim(),
            meaning: r[2]?.replace(/^"|"$/g, '').trim() || '',
            example: r[3]?.replace(/^"|"$/g, '').trim() || '',
          });
        }
      }
      if (parsedData.length > 0) {
        setIdiomsProperVocab(parsedData);
        localStorage.setItem('venoxa_idioms_proper_vocab', JSON.stringify(parsedData));
        setSearchQuery(''); setTopicFilter('All'); setMode('browse');
        setUploadMessage(`✅ ${parsedData.length} idioms uploaded!`);
        setTimeout(() => setUploadMessage(''), 3000);
        // ── Save to Firebase Storage for cross-device sync ──
        uploadVocabCSV('idioms', rawText).catch(console.warn);
      } else { setUploadMessage('❌ No data found. Check CSV format.'); }
    };
    reader.readAsText(file);
  };

  const filteredList = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return idiomsProperVocab.filter(item => {
      const matchesTopic = topicFilter === 'All' || item.topic === topicFilter;
      const matchesSearch = item.word.toLowerCase().includes(s) || (item.meaning && item.meaning.toLowerCase().includes(s));
      return matchesTopic && matchesSearch;
    });
  }, [idiomsProperVocab, searchQuery, topicFilter]);

  const safeIndex = activeWordIndex < filteredList.length ? activeWordIndex : 0;
  const card = mode === 'review' ? dueCards[0] : filteredList[safeIndex];
  useEffect(() => { setCollocationData(''); setCardImage(null); setAiSentence(''); }, [card?.word]);
  useEffect(() => { if (mode === 'browse' && filteredList.length > 0 && activeWordIndex >= filteredList.length) setActiveWordIndex(0); }, [filteredList.length, activeWordIndex, mode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = rating === 'again' ? now + 60000 : rating === 'hard' ? now + 600000 : rating === 'good' ? now + 86400000 : rating === 'skip' ? now + 100 * 365 * 24 * 60 * 60 * 1000 : now + 345600000;
    const newData = { ...srsData, [card.word]: { nextReview, rating, lastReviewed: now } };
    setSrsData(newData); localStorage.setItem('venoxa_idioms_proper_srs', JSON.stringify(newData));
    setShowMeaning(false); setAiSentence(''); setCardImage(null); setCollocationData('');
    if (mode === 'browse') setActiveWordIndex((safeIndex + 1) % filteredList.length);
  };
  const resetWordProgress = wordStr => { const d = { ...srsData }; delete d[wordStr]; setSrsData(d); localStorage.setItem('venoxa_idioms_proper_srs', JSON.stringify(d)); };
  const playAudio = async (w = card?.word) => { if (!w) return; await edgeTTSSpeak(w, _voiceGender); };
  const generateSentence = async () => {
    if (loadingAi || aiSentence || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `Create one natural, realistic English sentence using the idiom "${card.word}" (which means: ${card.meaning}). The sentence should be suitable for a ${userLevel} learner. After the English sentence, add a short ${_resolveTranslation(lang, 'Arabic', 'English')} note explaining how the idiom is used in context. Output the sentence first, then the note on a new line.`;
      await streamText(prompt, setAiSentence);
    } catch { setAiSentence('Error generating sentence.'); } finally { setLoadingAi(false); }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English idioms dictionary. For the idiom "${card.word}", list the most common and natural usage patterns or context pairs. Group them by grammatical context. Use this exact format (max 6 per group):\nPattern + ${card.word}: example1, example2\n${card.word} + Pattern: example1, example2\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      const briefPrompt = `You are a visual director. For the idiom "${card.word}" (${card.meaning}), describe a SINGLE, concrete, photorealistic scene that captures the LITERAL or most iconic visual representation. 
Rules:
1. One subject, one action.
2. NO text, NO letters, NO symbols.
3. Describe colors, lighting, and composition.
4. Output ONLY a 15-word English description.`;
      let visual = '';
      try { const raw = await fetchFromGemini(briefPrompt, AI_KEY); const ej = parseGeminiJSON(raw); if (!ej?.error) visual = String(raw || '').trim().split('\n')[0]?.replace(/^["'`]+|["'`]+$/g, '').trim() || ''; } catch { }
      if (!visual) visual = `A scene showing the meaning of "${card.word}"`;
      const seed = Math.floor(Math.random() * 1_000_000);
      const visualClean = (visual + ' Photorealistic, natural lighting, no text.').replace(/[^\x00-\x7F]/g, "");
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(visualClean)}&width=640&height=420&seed=${seed}`);
    } catch {
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(`Illustration ${card?.word}`.replace(/[^\x00-\x7F]/g, ""))}&width=640&height=420`);
    } finally { setLoadingImage(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row glass-panel p-1.5 rounded-2xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
      <button onClick={() => { setMode('browse'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'browse' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => { setMode('review'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${mode === 'review' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Layers className="w-4 h-4" /> {t.review}{dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">{dueCards.length}</span>}</button>
      <button onClick={() => { setMode('lists'); setShowMeaning(false); setCardImage(null); setAiSentence(''); }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${mode === 'lists' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>
    {mode === 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateItemsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          const isAr = /[\u0600-\u06FF]/.test(item.word);
          const isUiAr = lang === 'ar';
          return <div key={item.word} className={`flex ${isUiAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 transition-colors group`}>
            <div className={`flex-1 order-1 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              <div className={`flex items-center gap-2 flex-wrap ${isAr ? 'justify-end' : 'justify-start'}`}>
                <p className="text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
                  <button onClick={() => playAudio(item.word)} className={`text-gray-500 hover:text-black dark:text-white transition-colors ${isAr ? 'order-first' : 'order-last'}`}><Volume2 className="w-4 h-4" /></button>
                  <span>{safeRender(item.word)}</span>
                </p>
                {item.topic && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1E90FF]/10 dark:bg-[var(--app-accent2)]/10 text-[var(--app-accent1)] dark:text-[var(--app-accent2)] border border-[#1E90FF]/30 dark:border-purple-500/20">{safeRender(item.topic)}</span>}
              </div>
              <p className={`text-sm text-gray-600 dark:text-[var(--app-text)] mt-1 ${isAr ? 'text-right' : 'text-left'}`}>{safeRender(item.meaning)}</p>
            </div>
            <div className="flex items-center gap-3 order-2">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Remove from SRS"><Trash2 className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 glass-panel border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>}
    {mode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-1">{_resolveTranslation(lang, 'التعابير الاصطلاحية', 'Idioms')}</h2><p className="text-sm text-gray-600 dark:text-[var(--app-text)]">{t.totalItems} {idiomsProperVocab.length} · <span className="text-xs opacity-60">{t.csvHint}</span></p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-[var(--app-accent1)]/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-[var(--app-accent1)] dark:hover:bg-[var(--app-accent1)] dark:hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"><UploadCloud className="w-4 h-4" /> {t.uploadCSV}<input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" /></label>
        </div>
      </div>
      <div className="relative z-50 flex flex-col md:flex-row items-end gap-4 glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors relative z-50">
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Search className="w-4 h-4 text-black dark:text-white" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setActiveWordIndex(0); setShowMeaning(false); setAiSentence(''); setCardImage(null); }} className="w-full bg-gray-50 dark:bg-[var(--app-input-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-2xl px-4 h-11 text-sm text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none transition-colors" />
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-[var(--app-accent1)]" /> {t.filterTopic}</label>
          <CustomDropdown
            value={topicFilter}
            onChange={val => { setTopicFilter(val); setActiveWordIndex(0); setShowMeaning(false); setAiSentence(''); setCardImage(null); }}
            options={[{ value: 'All', label: _resolveTranslation(lang, 'كل المواضيع', 'All Topics') }, ...[...new Set(idiomsProperVocab.map(v => v.topic).filter(Boolean))].map(tp => ({ value: tp, label: tp }))]}
            theme={theme}
            className="w-full"
          />
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><List className="w-4 h-4 text-black dark:text-white" /> {t.manualSelect} ({filteredList.length})</label>
          <CustomDropdown
            value={safeIndex}
            onChange={val => { setActiveWordIndex(Number(val)); setShowMeaning(false); setAiSentence(''); setCardImage(null); }}
            options={filteredList.length === 0 ? [{ value: 0, label: t.noWords }] : filteredList.map((item, idx) => ({ value: idx, label: safeRender(item.word) }))}
            theme={theme}
            className="w-full"
          />
        </div>
      </div>
    </>}
    {mode === 'review' && !card && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-2xl font-bold">{t.browseLearn}</button>
    </div>}
    {mode === 'browse' && (filteredList.length === 0 || !card) && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[300px] flex flex-col items-center justify-center p-8 shadow-sm text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-[var(--app-accent1)] mb-4" /><h3 className="text-xl text-gray-600 dark:text-[var(--app-text)] font-bold">{t.noWords}</h3>
    </div>}
    {card && mode !== 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative z-0 hover:border-blue-300 transition-all duration-300 animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>
      <div className="absolute top-6 left-6 z-10">
        <button onClick={e => { e.stopPropagation(); playAudio(); }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl text-[var(--app-accent1)] dark:text-[var(--app-accent2)] shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /></button>
      </div>
      {card.topic && <span className="absolute top-6 right-6 bg-[#1E90FF]/10 dark:bg-[var(--app-accent2)]/10 text-[var(--app-accent1)] dark:text-[var(--app-accent2)] border border-[#1E90FF]/30 dark:border-purple-500/20 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{safeRender(card.topic)}</span>}
      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-[var(--app-accent1)] text-sm mt-8 animate-pulse bg-gray-100 dark:bg-[var(--app-card)]/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-16 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-transparent p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] w-full"><p className="text-lg text-gray-800 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiSentence && <button onClick={e => { e.stopPropagation(); generateSentence(); }} disabled={loadingAi} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 text-purple-400" /> {t.genSentenceBtn}</>}</button>}
          {!cardImage && <button onClick={e => { e.stopPropagation(); generateImage(); }} disabled={loadingImage} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5 text-blue-400" /> {t.imgBtn}</>}</button>}
          {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingCollocation ? <Activity className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5 text-emerald-400" /> {t.collocationsBtn}</>}</button>}
        </div>
        {collocationData && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-teal-500 p-5 rounded-2xl w-full text-left mt-2" onClick={e => e.stopPropagation()}><div className="font-mono text-gray-800 dark:text-[var(--app-text)] text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(collocationData)}</div></div>}
        {aiSentence && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-[#1E90FF] p-5 rounded-2xl w-full text-left mt-4" onClick={e => e.stopPropagation()}><div className="prose prose-purple dark:prose-invert max-w-none text-gray-800 dark:text-[var(--app-text)] text-sm" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(aiSentence)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl flex items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-[var(--app-accent1)] animate-bounce" /></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--app-border)] shadow-sm" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => { e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found'; }} /></div>}
      </div>}
    </div>}
    {showMeaning && card && mode !== 'lists' && <div className="grid grid-cols-5 gap-2 md:gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-rose-500/10 text-red-600 border border-red-200 dark:border-rose-500/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center text-xs md:text-sm">{t.rateAgain}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] border border-orange-200 dark:border-white/12 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center text-xs md:text-sm">{t.rateHard}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[var(--app-accent2)]/10 text-green-600 border border-green-200 dark:border-[var(--app-accent2)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center text-xs md:text-sm">{t.rateGood}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 text-black dark:text-white border border-[var(--app-accent1)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-[var(--app-hover)] hover:text-black flex flex-col items-center text-xs md:text-sm">{t.rateEasy}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
      <button onClick={() => handleRate('skip')} className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 flex flex-col items-center text-xs md:text-sm">{t.rateSkip}<span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">-</span></button>
    </div>}
  </div>;
}


function Grammar({
  AI_KEY,
  userLevel,
  lang,
  theme
}) {
  const [openLevel, setOpenLevel] = useState(() => {
    const idx = GRAMMAR_CEFR_DETAILED.findIndex(l => l.level === userLevel);
    return idx >= 0 ? idx : 0;
  });
  const [openCategory, setOpenCategory] = useState(null); // "levelIdx-catIdx"
  const [activeTopic, setActiveTopic] = useState(null);   // "levelIdx-catIdx-ruleIdx"
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const t = {
    title: _resolveTranslation(lang, 'القواعد الشاملة', 'Comprehensive Grammar'),
    desc: _resolveTranslation(lang, 'مرتبة منهجياً من A1 إلى C1. اضغط على أي قاعدة ليشرحها الذكاء الاصطناعي.', 'Structured A1 to C1. Click any rule for an AI explanation.'),
    rulesCount: _resolveTranslation(lang, 'قاعدة', 'rules'),
    loading: _resolveTranslation(lang, 'جاري توليد الشرح والأمثلة...', 'Generating explanation and examples...'),
    error: _resolveTranslation(lang, 'عذراً، حدث خطأ.', 'Error generating response.'),
    level: _resolveTranslation(lang, 'المستوى', 'Level'),
    explain: _resolveTranslation(lang, 'اشرح', 'Explain'),
  };

  const handleExplain = async (rule, levelLabel, catName, topicKey) => {
    if (activeTopic === topicKey) { setActiveTopic(null); return; }
    setActiveTopic(topicKey);
    setExplanation("");
    setLoading(true);
    try {
      const prompt = `You are an expert English grammar teacher. Explain this grammar rule: "${rule}" for a ${levelLabel} level student.\nThe explanation MUST be in ${_resolveTranslation(lang, 'Arabic', 'English')}.\nFormat your response clearly:\n1. Brief explanation (2-3 sentences)\n2. Three distinct example sentences in English, each followed by its ${_resolveTranslation(lang, 'Arabic', 'English')} translation\n3. One common mistake to avoid`;
      await streamText(prompt, setExplanation);
    } catch {
      setExplanation(t.error);
    } finally {
      setLoading(false);
    }
  };

  const totalRules = GRAMMAR_CEFR_DETAILED.reduce((a, l) => a + l.categories.reduce((b, c) => b + c.rules.length, 0), 0);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-black dark:text-white mb-3">{t.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-3">{t.desc}</p>
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[var(--app-accent1)]/10 text-[var(--app-accent1)] border border-[var(--app-accent1)]/20">
          {totalRules} {t.rulesCount} · A1 → C1
        </span>
      </div>

      {/* Level accordions */}
      <div className="space-y-3">
        {GRAMMAR_CEFR_DETAILED.map((level, lidx) => {
          const isLevelOpen = openLevel === lidx;
          const levelRuleCount = level.categories.reduce((a, c) => a + c.rules.length, 0);
          return (
            <div key={lidx} className={`rounded-[28px] border transition-all duration-300 overflow-hidden ${isLevelOpen ? 'border-[var(--app-accent1)]/30 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 dark:hover:border-white/15'} bg-white dark:bg-[var(--app-card)]`}>
              {/* Level header */}
              <button
                onClick={() => { setOpenLevel(isLevelOpen ? -1 : lidx); setOpenCategory(null); setActiveTopic(null); }}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0" style={{ background: level.color }}>{level.level}</span>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white text-base">{t.level} {level.level} — {lang === 'ar' ? level.labelAr : level.labelEn}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{level.categories.length} {_resolveTranslation(lang, 'فئة', 'categories')} · {levelRuleCount} {t.rulesCount}</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isLevelOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Categories */}
              {isLevelOpen && (
                <div className="border-t border-gray-100 dark:border-[var(--app-border)] divide-y divide-gray-100 dark:divide-[var(--app-border)]">
                  {level.categories.map((cat, cidx) => {
                    const catKey = `${lidx}-${cidx}`;
                    const isCatOpen = openCategory === catKey;
                    return (
                      <div key={cidx}>
                        {/* Category header */}
                        <button
                          onClick={() => { setOpenCategory(isCatOpen ? null : catKey); setActiveTopic(null); }}
                          className="w-full px-6 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: level.color }} />
                            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                              {lang === 'ar' ? cat.nameAr : cat.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 font-medium">{cat.rules.length}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isCatOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Rules */}
                        {isCatOpen && (
                          <div className="px-4 pb-3 space-y-2 bg-gray-50/50 dark:bg-black/10">
                            {cat.rules.map((rule, ridx) => {
                              const ruleKey = `${lidx}-${cidx}-${ridx}`;
                              const isActive = activeTopic === ruleKey;
                              return (
                                <div key={ridx} className={`rounded-2xl border transition-all duration-200 ${isActive ? 'border-[var(--app-accent1)]/40 bg-[var(--app-accent1)]/5 dark:bg-[var(--app-accent1)]/8' : 'border-gray-200 dark:border-[var(--app-border)] bg-white dark:bg-[var(--app-card)] hover:border-gray-300 dark:hover:border-white/15'}`}>
                                  <div className="flex items-start justify-between gap-3 p-3">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5" style={{ background: level.color }}>{ridx + 1}</span>
                                      <span className={`text-sm leading-relaxed ${isActive ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>{rule}</span>
                                    </div>
                                    <button
                                      onClick={() => handleExplain(rule, `${level.level} (${lang === 'ar' ? level.labelAr : level.labelEn})`, cat.name, ruleKey)}
                                      title={t.explain}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${isActive ? 'bg-[var(--app-accent1)] text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-gray-400 hover:bg-[var(--app-accent1)]/10 hover:text-[var(--app-accent1)]'}`}
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      {t.explain}
                                    </button>
                                  </div>
                                  {isActive && (
                                    <div className="px-4 pb-4 border-t border-[var(--app-accent1)]/15">
                                      {loading ? (
                                        <div className="flex items-center gap-2 pt-3 text-[var(--app-accent1)]">
                                          <Activity className="w-4 h-4 animate-spin" />
                                          <span className="text-sm font-medium">{t.loading}</span>
                                        </div>
                                      ) : (
                                        <div className="pt-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                                          {safeRender(explanation)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function ListeningReading({ type, AI_KEY, userLevel, lang, theme, history = [], setHistory, favorites = [], setFavorites }) {
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [panelTab, setPanelTab] = useState('favorites');

  // Topic + length + level
  const [listenTopic, setListenTopic] = useState('');
  const [listenLength, setListenLength] = useState('medium');
  const [selectedLevel, setSelectedLevel] = useState(userLevel);

  // Full-passage audio player
  const [audioState, setAudioState] = useState('idle'); // idle | loading | playing | paused
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);
  const audioBlobUrlRef = useRef(null);

  // Comprehension quiz
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Dictation mode
  const [dictMode, setDictMode] = useState(false);
  const [dictSentences, setDictSentences] = useState([]);
  const [dictIdx, setDictIdx] = useState(0);
  const [dictInput, setDictInput] = useState('');
  const [dictResults, setDictResults] = useState([]);
  const [dictAudioState, setDictAudioState] = useState('idle');
  const dictAudioRef = useRef(null);

  const [voiceAccent, setVoiceAccent] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('venoxa_voice_accent')) || 'uk');
  useEffect(() => {
    _voiceAccent = voiceAccent;
    if (typeof localStorage !== 'undefined') localStorage.setItem('venoxa_voice_accent', voiceAccent);
  }, [voiceAccent]);

  const LISTEN_TOPICS = [
    { ar: 'الحياة اليومية والروتين',        en: 'Daily Life & Routine' },
    { ar: 'السفر والثقافة',                 en: 'Travel & Culture' },
    { ar: 'التكنولوجيا والذكاء الاصطناعي', en: 'Technology & AI' },
    { ar: 'الصحة والعافية',                 en: 'Health & Wellness' },
    { ar: 'البيئة والمناخ',                 en: 'Environment & Climate' },
    { ar: 'العمل والوظيفة',                 en: 'Work & Career' },
    { ar: 'التعليم والتعلم',                en: 'Education & Learning' },
    { ar: 'الطعام والطبخ',                  en: 'Food & Cooking' },
    { ar: 'الرياضة واللياقة',               en: 'Sports & Fitness' },
    { ar: 'العلوم والاكتشافات',             en: 'Science & Discoveries' },
  ];
  const WORD_COUNTS = { short: 150, medium: 300, long: 500 };

  const getDynamicTitle = () => {
    const isBeginner = selectedLevel === 'A1' || selectedLevel === 'A2';
    const isInter = selectedLevel === 'B1' || selectedLevel === 'B2';
    if (lang === 'ar') {
      const skill = type === 'listening' ? 'الاستماع' : 'القراءة';
      const adj = isBeginner ? 'الأساسي' : isInter ? 'المتوسط' : 'المتقدم';
      return `تدريب ${skill} ${adj}`;
    }
    if (lang === 'es') return `${type === 'listening' ? 'Escucha' : 'Lectura'} ${isBeginner ? 'Básica' : isInter ? 'Intermedia' : 'Avanzada'}`;
    if (lang === 'fr') return `${type === 'listening' ? 'Écoute' : 'Lecture'} ${isBeginner ? 'Basique' : isInter ? 'Intermédiaire' : 'Avancée'}`;
    if (lang === 'de') return `${isBeginner ? 'Grundlegendes' : isInter ? 'Mittleres' : 'Erweitertes'} ${type === 'listening' ? 'Hören' : 'Lesen'}`;
    if (lang === 'zh') return `${isBeginner ? '基础' : isInter ? '中级' : '高级'}${type === 'listening' ? '听力' : '阅读'}`;
    if (lang === 'ja') return `${isBeginner ? '基礎' : isInter ? '中級' : '上級'}${type === 'listening' ? 'リスニング' : 'リーディング'}`;
    const skillEn = type === 'listening' ? 'Listening' : 'Reading';
    const adjEn = isBeginner ? 'Basic' : isInter ? 'Intermediate' : 'Advanced';
    return `${adjEn} ${skillEn}`;
  };

  const getDynamicDesc = () => {
    const isBeginner = selectedLevel === 'A1' || selectedLevel === 'A2';
    const isInter = selectedLevel === 'B1' || selectedLevel === 'B2';
    if (lang === 'ar') {
      const focus = isBeginner ? 'النصوص البسيطة والأساسية' : isInter ? 'النصوص المتوسطة' : 'النصوص المعقدة';
      return `بما أن مستواك ${selectedLevel}، سنركز على ${focus}.`;
    }
    if (lang === 'es') return `Dado que tu nivel es ${selectedLevel}, nos enfocaremos en textos ${isBeginner ? 'sencillos' : isInter ? 'intermedios' : 'complejos'}.`;
    if (lang === 'fr') return `Étant donné que votre niveau est ${selectedLevel}, nous nous concentrons sur des textes ${isBeginner ? 'simples' : isInter ? 'intermédiaires' : 'complexes'}.`;
    if (lang === 'de') return `Da dein Level ${selectedLevel} ist, konzentrieren wir uns auf ${isBeginner ? 'einfache' : isInter ? 'mittelschwere' : 'komplexe'} Texte.`;
    if (lang === 'zh') return `由于您的水平是 ${selectedLevel}，我们将专注于${isBeginner ? '简单' : isInter ? '中级' : '复杂'}文本。`;
    if (lang === 'ja') return `あなたのレベルは ${selectedLevel} なので、${isBeginner ? '簡単' : isInter ? '中級' : '複雑'}なテキストに焦点を当てます。`;
    const focusEn = isBeginner ? 'simple texts' : isInter ? 'intermediate texts' : 'complex texts';
    return `Since your level is ${selectedLevel}, we focus on ${focusEn}.`;
  };

  const t = {
    title: getDynamicTitle(),
    desc: getDynamicDesc(),
    btn: _resolveTranslation(lang, 'ولّد نصاً جديداً', 'Generate New Text')
  };

  // ── Stop all audio ─────────────────────────────────────────────────
  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (audioBlobUrlRef.current) { URL.revokeObjectURL(audioBlobUrlRef.current); audioBlobUrlRef.current = null; }
    try { if (_currentTTSAudio) { _currentTTSAudio.pause(); _currentTTSAudio.src = ''; } } catch { }
    window.speechSynthesis?.cancel();
    setAudioState('idle');
  };

  // ── Fetch audio via Edge TTS and return Audio element ──────────────
  const fetchAudioEl = async (text, speed) => {
    try {
      const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
      const voiceGenderKey = _voiceGender === 'female' ? 'female' : 'male';
      const params = new URLSearchParams({ text: text.slice(0, 2500), voice: EDGE_VOICES[_voiceAccent === 'us' ? 'us' : 'uk'][voiceGenderKey], rate: '+15%' });
      const url = `${base}api/edge-tts?${params}`;
      const audio = new Audio(url);
      audio.playbackRate = speed;
      return { audio, url };
    } catch {
      return null;
    }
  };

  // ── Generate passage ───────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setStory('');
    setQuiz(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    setDictMode(false);
    setDictResults([]);
    stopAudio();
    const topicText = listenTopic || 'Daily Life';
    try {
      const wc = WORD_COUNTS[listenLength] || 150;
      const randomSeed = Math.floor(Math.random() * 1000000);
      const prompt = type === 'listening'
        ? `Write a natural, engaging ${wc}-word spoken passage (podcast-style monologue or short story) for a ${selectedLevel} English learner. Topic: "${topicText}". Use vocabulary and grammar appropriate for ${selectedLevel} level. Write naturally flowing speech. No bullet points, no headers, no markdown. Plain text only. Ensure this passage is completely unique and different from previous ones (seed: ${randomSeed}).`
        : `Write a ${wc}-word story/passage for a ${selectedLevel} English learner. Topic: "${topicText}". Include a short vocabulary list at the end with ${lang === 'ar' ? 'Arabic' : 'simple English'} meanings. Plain text, no markdown. Ensure this story is completely unique and different from previous ones (seed: ${randomSeed}).`;
      let _full = '';
      await streamFromAPI(prompt, (delta) => { _full += delta; setStory(_full); });
      const finalText = cleanFallbackText(_full) || _full;
      setStory(finalText);
      if (finalText && !finalText.startsWith('Error') && !finalText.startsWith('Failed')) {
        setHistory(prev => {
          const exists = prev.some(x => x.story === finalText);
          if (exists) return prev;
          return [{
            id: Date.now().toString(),
            type,
            topic: topicText,
            length: listenLength,
            story: finalText,
            quiz: null,
            timestamp: Date.now()
          }, ...prev].slice(0, 25);
        });
      }
    } catch { setStory('Error generating content.'); }
    setLoading(false);
  };

  // ── Play / Pause full passage ──────────────────────────────────────
  const handlePlayPause = async () => {
    if (audioState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setAudioState('paused');
      return;
    }
    if (audioState === 'paused' && audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      setAudioState('playing');
      return;
    }
    setAudioState('loading');
    stopAudio();
    const result = await fetchAudioEl(story, playbackSpeed);
    if (result) {
      const { audio, url } = result;
      audioBlobUrlRef.current = url;
      audio.onended = () => { URL.revokeObjectURL(url); audioBlobUrlRef.current = null; setAudioState('idle'); };
      audio.onerror = () => setAudioState('idle');
      audioRef.current = audio;
      await audio.play();
      setAudioState('playing');
    } else {
      // Edge TTS direct fallback (in case fetchAudioEl construction fails)
      window.speechSynthesis?.cancel();
      const ok = await edgeTTSSpeak(story, _voiceGender);
      if (ok) {
        setAudioState('playing');
        if (_currentTTSAudio) {
          _currentTTSAudio.playbackRate = playbackSpeed;
          _currentTTSAudio.onended = () => setAudioState('idle');
        }
      } else {
        // All engines failed — reset silently, do NOT use browser TTS
        // (it would produce robotic voice that can't be stopped cleanly)
        setAudioState('idle');
      }
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  // ── Comprehension quiz ─────────────────────────────────────────────
  const handleGenerateQuiz = async () => {
    if (!story) return;
    setQuizLoading(true);
    setQuiz(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    try {
      const prompt = `Create exactly 4 multiple-choice comprehension questions about this passage. Return ONLY a JSON array with no extra text or markdown:\n[{"q":"Question?","options":["A. option1","B. option2","C. option3","D. option4"],"answer":"A"},{"q":"...","options":[...],"answer":"B"}]\nRules: "answer" must be exactly one uppercase letter A, B, C, or D. Base questions strictly on the passage content.\nPassage:\n${story.slice(0, 1200)}`;
      const raw = await fetchFromGemini(prompt, AI_KEY);
      let questions = null;
      const trimmed = raw.trim();
      const arrStart = trimmed.indexOf('[');
      const arrEnd = trimmed.lastIndexOf(']');
      const objStart = trimmed.indexOf('{');
      const objEnd = trimmed.lastIndexOf('}');
      if (arrStart !== -1 && arrEnd !== -1 && (objStart === -1 || arrStart < objStart)) {
        try { const arr = JSON.parse(trimmed.slice(arrStart, arrEnd + 1)); if (Array.isArray(arr)) questions = arr; } catch { }
      }
      if (!questions && objStart !== -1 && objEnd !== -1) {
        try { const obj = JSON.parse(trimmed.slice(objStart, objEnd + 1)); questions = obj.questions || obj.quiz || null; } catch { }
      }
      const finalQuestions = questions?.length
        ? questions.map(q => ({ ...q, answer: String(q.answer || '').trim().toUpperCase().charAt(0) }))
        : [];
      setQuiz(finalQuestions);
      setHistory(prev => prev.map(x => x.story === story ? { ...x, quiz: finalQuestions } : x));
      setFavorites(prev => prev.map(x => x.story === story ? { ...x, quiz: finalQuestions } : x));
    } catch { setQuiz([]); }
    setQuizLoading(false);
  };

  const toggleFavorite = () => {
    if (!story) return;
    setFavorites(prev => {
      const exists = prev.some(x => x.story === story);
      if (exists) {
        return prev.filter(x => x.story !== story);
      } else {
        return [{
          id: Date.now().toString(),
          type,
          topic: listenTopic || 'Daily Life',
          length: listenLength,
          story,
          quiz,
          timestamp: Date.now()
        }, ...prev];
      }
    });
  };

  const isFavorited = favorites.some(x => x.story === story);

  const quizScore = quizSubmitted && quiz
    ? quiz.filter((q, i) => userAnswers[i] === q.answer).length
    : 0;

  // ── Dictation ──────────────────────────────────────────────────────
  const startDictation = () => {
    if (!story) return;
    stopAudio();
    const sents = story.match(/[^.!?]+[.!?]+/g)
      ?.map(s => s.trim())
      .filter(s => s.length > 15 && s.split(' ').length > 3) || [];
    setDictSentences(sents.slice(0, 8));
    setDictIdx(0);
    setDictInput('');
    setDictResults([]);
    setDictMode(true);
    setQuiz(null);
  };

  const playDictSentence = async (text) => {
    if (dictAudioRef.current) { dictAudioRef.current.pause(); dictAudioRef.current = null; }
    setDictAudioState('loading');
    const result = await fetchAudioEl(text, 0.85);
    if (result) {
      const { audio, url } = result;
      audio.onended = () => { URL.revokeObjectURL(url); setDictAudioState('idle'); };
      dictAudioRef.current = audio;
      await audio.play();
      setDictAudioState('playing');
    } else {
      window.speechSynthesis?.cancel();
      const ok = await edgeTTSSpeak(text, _voiceGender);
      if (ok) {
        setDictAudioState('playing');
        if (_currentTTSAudio) {
          _currentTTSAudio.playbackRate = 0.85;
          _currentTTSAudio.onended = () => setDictAudioState('idle');
        }
      } else {
        // All engines failed — reset silently, no browser TTS fallback
        setDictAudioState('idle');
      }
    }
  };

  const checkDictAnswer = () => {
    const expected = dictSentences[dictIdx] || '';
    const typed = dictInput.trim();
    const expWords = expected.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
    const typWords = typed.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
    const correct = expWords.filter((w, i) => typWords[i] === w).length;
    const score = expWords.length > 0 ? Math.round((correct / expWords.length) * 100) : 0;
    setDictResults(prev => [...prev, { expected, typed, score }]);
    setDictInput('');
    setDictIdx(prev => prev + 1);
  };

  const avgDictScore = dictResults.length
    ? Math.round(dictResults.reduce((a, r) => a + r.score, 0) / dictResults.length)
    : 0;

  const listeningLinks = [
    { level: _resolveTranslation(lang, "مبتدئ (A1-A2)", "Beginner (A1-A2)"), name: "Spotlight English podcast", url: "https://spotlightenglish.com/" },
    { level: _resolveTranslation(lang, "تحت المتوسط (B1)", "Pre-Intermediate (B1)"), name: "The LevelUp English Podcast", url: "https://www.levelupenglish.school/podcast/" },
    { level: _resolveTranslation(lang, "تحت المتوسط (B1)", "Pre-Intermediate (B1)"), name: "British Council", url: "https://learnenglish.britishcouncil.org/general-english/audio-series/podcasts" },
    { level: _resolveTranslation(lang, "متوسط (B1-B2)", "Intermediate (B1-B2)"), name: "Luke's English Podcast", url: "https://teacherluke.co.uk/archive-of-episodes-1-149/" },
    { level: _resolveTranslation(lang, "متوسط (B1-B2)", "Intermediate (B1-B2)"), name: "All Ears English Podcast", url: "https://www.allearsenglish.com/" },
    { level: _resolveTranslation(lang, "فوق المتوسط (B2)", "Upper-Intermediate (B2)"), name: "TED Talks", url: "https://youtube.com/@TED?si=8y1RTw0ImlDO7By9" },
    { level: _resolveTranslation(lang, "فوق المتوسط (B2)", "Upper-Intermediate (B2)"), name: "BBC Sounds", url: "https://www.bbc.co.uk/sounds/podcasts" },
    { level: _resolveTranslation(lang, "متقدم (C1-C2)", "Advanced (C1-C2)"), name: "This American Life", url: "https://www.thisamericanlife.org/archive" }
  ];
  const readingLinks = [
    { level: _resolveTranslation(lang, "مبتدئ - متوسط", "Beginner - Intermediate"), name: "Project Gutenberg", url: "https://www.gutenberg.org" },
    { level: _resolveTranslation(lang, "مبتدئ - متوسط", "Beginner - Intermediate"), name: "ESL Fast", url: "https://www.eslfast.com" },
    { level: _resolveTranslation(lang, "مبتدئ - متوسط", "Beginner - Intermediate"), name: "Storynory", url: "https://www.storynory.com" },
    { level: _resolveTranslation(lang, "مبتدئ - متوسط", "Beginner - Intermediate"), name: "ManyThings.org", url: "https://www.manythings.org" },
    { level: _resolveTranslation(lang, "متقدم", "Advanced"), name: "Medium", url: "https://medium.com" },
    { level: _resolveTranslation(lang, "متقدم", "Advanced"), name: "BBC News", url: "https://www.bbc.com/news" },
    { level: _resolveTranslation(lang, "متقدم", "Advanced"), name: "The New York Times", url: "https://www.nytimes.com" }
  ];
  const currentLinks = type === 'listening' ? listeningLinks : readingLinks;
  const contentSteps = type === 'listening'
    ? [
      _resolveTranslation(lang, "اسمع بودكاست بدلاً من الأفلام أو الأغاني (لأن التركيز يكون على الصوت فقط).", "Listen to podcasts instead of movies or songs."),
      _resolveTranslation(lang, "لا تترجم ولا تقرأ النص أثناء الاستماع لتعويد الأذن.", "Do not translate or read transcripts while listening."),
      _resolveTranslation(lang, "اسمع المقطع مرة واحدة فقط لتجنب الملل.", "Listen to the track only once to avoid boredom."),
      _resolveTranslation(lang, "اختار مصدر تكون نسبة فهمك له 30%-50% للتطور السريع.", "Choose a source where you understand 30%-50%.")
    ]
    : [
      _resolveTranslation(lang, "اقرأ قصص وروايات مبسطة (Graded Readers).", "Read simplified graded readers."),
      _resolveTranslation(lang, "اقرأ بدون ترجمة فورية لتعويد العقل على سرعة ربط المعنى.", "Read without immediate translation."),
      _resolveTranslation(lang, "يجب أن تكون نسبة فهمك للقصة 30%-50%.", "You should understand 30%-50% of the story.")
    ];

  return (
    <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">

      {/* ── Header ── */}
      <div className="glass-panel p-8 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] flex flex-col md:flex-row justify-between items-center gap-6 transition-colors">
        <div className="text-center md:text-start flex-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-2">{t.title}</h2>
          <p className="text-gray-600 dark:text-[var(--app-text)]">{t.desc}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
        </div>
      </div>

      {/* ── Unified Controls ── */}
        <div className="relative z-[60] glass-panel p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <div className="flex flex-col md:flex-row flex-wrap items-center gap-3">
            
            <div className="flex h-11 bg-gray-100 dark:bg-[var(--app-card)] rounded-2xl p-1 border border-gray-200 dark:border-[var(--app-border)]">
              {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => (
                <button
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  className={`px-3 sm:px-4 h-full rounded-xl text-sm font-bold transition ${selectedLevel === l ? 'bg-[var(--app-accent1)] text-white shadow' : 'text-gray-500 dark:text-[var(--app-text)] hover:text-gray-900'}`}
                >{l}</button>
              ))}
            </div>

            <CustomDropdown
              value={listenTopic}
              onChange={setListenTopic}
              options={[{ value: '', label: _resolveTranslation(lang, 'اختر موضوعاً...', 'Pick a topic...') }, ...LISTEN_TOPICS.map(tp => ({ value: lang === 'ar' ? tp.ar : tp.en, label: lang === 'ar' ? tp.ar : tp.en }))]}
              theme={theme}
              className="flex-1 w-full min-w-[150px]"
            />

            <div className="flex h-11 bg-gray-100 dark:bg-[var(--app-card)] rounded-2xl p-1 border border-gray-200 dark:border-[var(--app-border)]">
              {['short', 'medium', 'long'].map(l => (
                <button
                  key={l}
                  onClick={() => setListenLength(l)}
                  className={`px-5 h-full rounded-xl text-sm font-bold capitalize transition ${listenLength === l ? 'bg-[var(--app-accent1)] text-white shadow' : 'text-gray-500 dark:text-[var(--app-text)] hover:text-gray-900'}`}
                >{l}</button>
              ))}
            </div>

            {/* History & Favorite toggles */}
            <button
              onClick={() => setShowHistoryPanel(v => !v)}
              className={`p-2.5 rounded-2xl transition-all border ${
                showHistoryPanel
                  ? 'bg-[var(--app-accent1)] text-white border-[var(--app-accent1)]'
                  : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
              }`}
              title={_resolveTranslation(lang, 'المحفوظات والسجل', 'Saved & History')}
            >
              <Clock className="w-5 h-5" />
            </button>

            {story && (
              <button
                onClick={toggleFavorite}
                className={`p-2.5 rounded-2xl transition-all border ${
                  isFavorited
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : 'bg-white/5 text-gray-400 hover:text-red-400 border-white/10'
                }`}
                title={isFavorited ? _resolveTranslation(lang, 'إزالة من المفضلة', 'Remove from favorites') : _resolveTranslation(lang, 'حفظ في المفضلة', 'Save to favorites')}
              >
                <Heart className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black disabled:opacity-60 text-white dark:text-black px-8 h-11 rounded-2xl font-bold flex items-center gap-2 transition shadow-sm whitespace-nowrap"
            >
              {loading ? <Activity className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              {_resolveTranslation(lang, 'ولّد نصاً', 'Generate')}
            </button>
            {/* UK/US accent toggle */}
            <div className="flex h-11 items-center gap-1 bg-gray-100 dark:bg-[var(--app-card)] rounded-2xl p-1 border border-gray-200 dark:border-[var(--app-border)]">
              <button onClick={() => setVoiceAccent('uk')} className={`px-4 h-full rounded-xl text-sm font-bold transition-all ${voiceAccent === 'uk' ? 'glass-panel text-gray-800 dark:text-[var(--app-text)] shadow-sm' : 'text-gray-500 dark:text-[var(--app-accent1)] hover:text-gray-700'}`}><GBFlag style={{width:20,height:10,borderRadius:2}} /> UK</button>
              <button onClick={() => setVoiceAccent('us')} className={`px-4 h-full rounded-xl text-sm font-bold transition-all ${voiceAccent === 'us' ? 'glass-panel text-gray-800 dark:text-[var(--app-text)] shadow-sm' : 'text-gray-500 dark:text-[var(--app-accent1)] hover:text-gray-700'}`}><USFlag style={{width:20,height:10,borderRadius:2}} /> US</button>
            </div>
          </div>
        </div>

      {/* ── Listening: passage + player ── */}
      {story && type === 'listening' && (
        <div className="relative z-40 glass-panel p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">

          {/* Player bar */}
          <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-gray-100 dark:border-[var(--app-border)]">
            <button
              onClick={handlePlayPause}
              disabled={audioState === 'loading'}
              className="flex items-center gap-2 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black disabled:opacity-60 text-white dark:text-black px-5 py-2 rounded-2xl font-bold transition shadow"
            >
              {audioState === 'loading' ? <Activity className="animate-spin w-4 h-4" /> : audioState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {audioState === 'loading' ? _resolveTranslation(lang, 'جاري التحميل...', 'Loading...') : audioState === 'playing' ? _resolveTranslation(lang, 'إيقاف مؤقت', 'Pause') : _resolveTranslation(lang, 'تشغيل', 'Play')}
            </button>

            {audioState !== 'idle' && (
              <button onClick={stopAudio} className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-gray-100 dark:bg-[var(--app-card)] text-gray-700 dark:text-[var(--app-text)] text-sm font-medium hover:bg-gray-200 dark:hover:bg-[var(--app-hover)] hover:text-black transition">
                <RotateCcw className="w-3.5 h-3.5" /> {_resolveTranslation(lang, 'إيقاف', 'Stop')}
              </button>
            )}

            <div className="flex gap-1 ml-auto bg-gray-100 dark:bg-[var(--app-card)] rounded-2xl p-1">
              {[0.75, 1, 1.25, 1.5].map(s => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-bold transition ${playbackSpeed === s ? 'bg-[var(--app-accent1)] text-white shadow' : 'text-gray-500 dark:text-[var(--app-text)] hover:text-gray-800 dark:hover:text-[var(--app-text)]'}`}
                >{s}×</button>
              ))}
            </div>
          </div>

          {/* Passage text */}
          <div dir="ltr" className="text-base leading-8 text-gray-800 dark:text-[var(--app-text)] whitespace-pre-wrap font-medium mb-6">
            {story}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-[var(--app-border)]">
            <button
              onClick={handleGenerateQuiz}
              disabled={quizLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-sm transition shadow"
            >
              {quizLoading ? <Activity className="animate-spin w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
              {_resolveTranslation(lang, 'اختبر الفهم', 'Quiz Me')}
            </button>
            <button
              onClick={startDictation}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black font-bold text-sm transition shadow"
            >
              <Mic className="w-4 h-4" />
              {_resolveTranslation(lang, 'وضع الإملاء', 'Dictation Mode')}
            </button>
          </div>
        </div>
      )}

      {/* ── Comprehension Quiz ── */}
      {quiz !== null && !dictMode && (
        <div className="relative z-30 glass-panel p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--app-accent1)]" />
            {_resolveTranslation(lang, 'أسئلة الفهم', 'Comprehension Quiz')}
          </h3>
          {quiz.length === 0 ? (
            <p className="text-gray-500 dark:text-[var(--app-text)]">{_resolveTranslation(lang, 'تعذّر توليد الأسئلة، حاول مجدداً.', 'Could not generate questions. Try again.')}</p>
          ) : (
            <>
              {quiz.map((q, i) => (
                <div key={i} className="mb-6">
                  <p className="font-bold text-gray-900 dark:text-[var(--app-text)] mb-3 text-base">{i + 1}. {q.q}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(q.options || []).map((opt, j) => {
                      const letter = ['A', 'B', 'C', 'D'][j];
                      const isSelected = userAnswers[i] === letter;
                      const isCorrect = quizSubmitted && letter === q.answer;
                      const isWrong = quizSubmitted && isSelected && letter !== q.answer;
                      return (
                        <button
                          key={j}
                          disabled={quizSubmitted}
                          onClick={() => !quizSubmitted && setUserAnswers(prev => ({ ...prev, [i]: letter }))}
                          className={`text-left px-4 py-3 rounded-2xl border text-sm font-medium transition ${isCorrect ? 'bg-green-100 dark:bg-[var(--app-accent1)]/12 border-green-500 text-green-800 dark:text-green-300' :
                            isWrong ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300' :
                              isSelected ? 'bg-blue-100 dark:bg-[var(--app-accent1)]/12 border-blue-500 text-blue-800 dark:text-white' :
                                'bg-gray-50 dark:bg-[var(--app-card)] border-gray-200 dark:border-[var(--app-border)] text-gray-800 dark:text-[var(--app-text)] hover:border-blue-400'
                            }`}
                        >
                          {opt}
                          {isCorrect && <CheckCircle2 className="inline w-4 h-4 ml-2 text-green-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(userAnswers).length < quiz.length}
                  className="mt-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-bold transition shadow"
                >
                  {_resolveTranslation(lang, 'إرسال الإجابات', 'Submit Answers')}
                </button>
              ) : (
                <div className={`mt-4 p-5 rounded-2xl text-center font-extrabold text-lg ${quizScore === quiz.length ? 'bg-green-100 dark:bg-[var(--app-accent1)]/12 text-green-700 dark:text-green-300' : quizScore >= quiz.length / 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {quizScore === quiz.length ? '🎉 ' : quizScore >= quiz.length / 2 ? '👍 ' : '📚 '}
                  {_resolveTranslation(lang, `نتيجتك: ${quizScore} / ${quiz.length}`, `Score: ${quizScore} / ${quiz.length}`)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Dictation Mode ── */}
      {dictMode && (
        <div className="relative z-20 glass-panel p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2">
              <Mic className="w-5 h-5 text-black dark:text-white" />
              {_resolveTranslation(lang, 'وضع الإملاء', 'Dictation Mode')}
            </h3>
            <button onClick={() => setDictMode(false)} className="px-4 py-1.5 rounded-2xl bg-gray-100 dark:bg-[var(--app-card)] text-gray-600 dark:text-[var(--app-text)] text-sm font-medium hover:bg-gray-200 dark:hover:bg-[var(--app-hover)] hover:text-black transition">
              {_resolveTranslation(lang, 'إغلاق', 'Close')}
            </button>
          </div>

          {dictIdx < dictSentences.length ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-[var(--app-text)]">
                <span>{_resolveTranslation(lang, `جملة ${dictIdx + 1} من ${dictSentences.length}`, `Sentence ${dictIdx + 1} of ${dictSentences.length}`)}</span>
                <div className="h-1.5 flex-1 bg-gray-200 dark:bg-[var(--app-card)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--app-accent1)] rounded-full transition-all" style={{ width: `${(dictIdx / dictSentences.length) * 100}%` }} />
                </div>
              </div>

              <button
                onClick={() => playDictSentence(dictSentences[dictIdx])}
                disabled={dictAudioState === 'loading'}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black rounded-2xl font-bold transition shadow active:scale-95"
              >
                {dictAudioState === 'loading' ? <Activity className="animate-spin w-4 h-4" /> : dictAudioState === 'playing' ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                {dictAudioState === 'idle' ? _resolveTranslation(lang, 'استمع للجملة', 'Play Sentence') : dictAudioState === 'loading' ? _resolveTranslation(lang, 'جاري التحميل...', 'Loading...') : _resolveTranslation(lang, 'يتم التشغيل...', 'Playing...')}
              </button>

              <textarea
                value={dictInput}
                onChange={e => setDictInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && dictInput.trim()) { e.preventDefault(); checkDictAnswer(); } }}
                placeholder={_resolveTranslation(lang, 'اكتب ما سمعته...', 'Type what you heard...')}
                rows={2}
                className="w-full bg-gray-50 dark:bg-[var(--app-card)] border border-gray-300 dark:border-[var(--app-border)] text-gray-900 dark:text-[var(--app-text)] rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--app-accent1)] resize-none"
                dir="ltr"
              />

              <button
                onClick={checkDictAnswer}
                disabled={!dictInput.trim()}
                className="px-6 py-2.5 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black disabled:opacity-50 text-white rounded-2xl font-bold transition shadow"
              >
                {_resolveTranslation(lang, 'تحقق', 'Check')}
              </button>

              {dictResults.length > 0 && (
                <div className="space-y-2 mt-2">
                  {dictResults.map((r, i) => (
                    <div key={i} className={`p-3 rounded-2xl text-sm ${r.score >= 80 ? 'bg-green-50 dark:bg-[var(--app-accent1)]/10 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${r.score >= 80 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{r.score}%</span>
                        <span className="text-gray-500 dark:text-[var(--app-text)] text-xs">{_resolveTranslation(lang, `جملة ${i + 1}`, `Sentence ${i + 1}`)}</span>
                      </div>
                      <div dir="ltr" className="text-gray-600 dark:text-[var(--app-text)] text-xs"><span className="font-semibold">{_resolveTranslation(lang, 'الصحيح:', 'Expected:')}</span> {r.expected}</div>
                      <div dir="ltr" className="text-gray-800 dark:text-[var(--app-text)] text-xs mt-0.5"><span className="font-semibold">{_resolveTranslation(lang, 'كتبت:', 'You wrote:')}</span> {r.typed}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-6 rounded-2xl text-center font-extrabold text-2xl ${avgDictScore >= 80 ? 'bg-green-100 dark:bg-[var(--app-accent1)]/12 text-green-700 dark:text-green-300' : avgDictScore >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {avgDictScore >= 80 ? '🎉 ' : avgDictScore >= 50 ? '👍 ' : '📚 '}
                {_resolveTranslation(lang, `متوسط الدقة: ${avgDictScore}%`, `Average Accuracy: ${avgDictScore}%`)}
              </div>
              <div className="space-y-2">
                {dictResults.map((r, i) => (
                  <div key={i} className={`p-3 rounded-2xl text-sm ${r.score >= 80 ? 'bg-green-50 dark:bg-[var(--app-accent1)]/10 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${r.score >= 80 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{r.score}%</span>
                      <span className="text-gray-500 dark:text-[var(--app-text)] text-xs">{_resolveTranslation(lang, `جملة ${i + 1}`, `Sentence ${i + 1}`)}</span>
                    </div>
                    <div dir="ltr" className="text-gray-600 dark:text-[var(--app-text)] text-xs"><span className="font-semibold">{_resolveTranslation(lang, 'الصحيح:', 'Expected:')}</span> {r.expected}</div>
                    <div dir="ltr" className="text-gray-800 dark:text-[var(--app-text)] text-xs mt-0.5"><span className="font-semibold">{_resolveTranslation(lang, 'كتبت:', 'You wrote:')}</span> {r.typed}</div>
                  </div>
                ))}
              </div>
              <button onClick={startDictation} className="px-5 py-2.5 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black rounded-2xl font-bold transition shadow flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> {_resolveTranslation(lang, 'أعد المحاولة', 'Try Again')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Reading: passage + read-aloud ── */}
      {story && type === 'reading' && (
        <div className="bg-gray-50 dark:bg-[var(--app-card)] p-8 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-inner">
          <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-[var(--app-border)]">
            <button
              onClick={handlePlayPause}
              disabled={audioState === 'loading'}
              className="flex items-center gap-2 bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black disabled:opacity-60 text-white px-4 py-2 rounded-2xl font-bold text-sm transition shadow"
            >
              {audioState === 'loading' ? <Activity className="animate-spin w-4 h-4" /> : audioState === 'playing' ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {audioState === 'loading' ? _resolveTranslation(lang, 'جاري التحميل...', 'Loading...') : audioState === 'playing' ? _resolveTranslation(lang, 'إيقاف مؤقت', 'Pause') : _resolveTranslation(lang, 'قراءة بصوت', 'Read Aloud')}
            </button>
            {audioState !== 'idle' && (
              <button onClick={stopAudio} className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-gray-200 dark:bg-[var(--app-card)] text-gray-700 dark:text-[var(--app-text)] text-sm font-medium hover:bg-gray-300 dark:hover:bg-[var(--app-hover)] hover:text-black transition">
                <RotateCcw className="w-3.5 h-3.5" /> {_resolveTranslation(lang, 'إيقاف', 'Stop')}
              </button>
            )}
            <div className="flex gap-1 ml-auto bg-gray-200 dark:bg-[var(--app-card)] rounded-2xl p-1">
              {[0.75, 1, 1.25, 1.5].map(s => (
                <button key={s} onClick={() => handleSpeedChange(s)} className={`px-3 py-1 rounded-xl text-xs font-bold transition ${playbackSpeed === s ? 'bg-[var(--app-accent1)] text-white' : 'text-gray-500 dark:text-[var(--app-text)] hover:text-gray-700 dark:hover:text-[var(--app-text)]'}`}>{s}×</button>
              ))}
            </div>
          </div>
          <div dir="ltr" className="text-lg leading-loose font-medium text-gray-800 dark:text-[var(--app-text)] whitespace-pre-wrap">
            {safeRender(story)}
          </div>
        </div>
      )}

      {/* ── Golden Rules + Sources ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3 glass-panel p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-5 lg:mb-8 border-b border-gray-200 dark:border-[var(--app-border)] pb-4">{_resolveTranslation(lang, 'القواعد الذهبية', 'Golden Rules')}</h3>
          <ul className="space-y-6">
            {contentSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-blue-100 dark:bg-[var(--app-accent1)]/12 text-black dark:text-white font-bold">{idx + 1}</div>
                <span className="text-gray-700 dark:text-[var(--app-text)] text-lg leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 glass-panel p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] transition-colors">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-5 lg:mb-8 border-b border-gray-200 dark:border-[var(--app-border)] pb-4">{_resolveTranslation(lang, 'المصادر', 'Sources')}</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {currentLinks.map((link, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-[var(--app-card)] p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] transition-colors shadow-sm">
                <div className="text-left mb-3" dir="ltr">
                  <p className="font-bold text-gray-900 dark:text-[var(--app-text)] text-lg">{link.name}</p>
                  <span className="inline-block mt-1 text-xs font-bold text-black dark:text-white bg-blue-100 dark:bg-[var(--app-accent1)]/10 px-2 py-1 rounded">{link.level}</span>
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full py-2 bg-gray-200 dark:bg-[var(--app-card)] hover:bg-gray-300 dark:hover:bg-[var(--app-hover)] hover:text-black text-gray-800 dark:text-[var(--app-text)] rounded-2xl text-sm font-bold transition-colors">
                  {_resolveTranslation(lang, 'تصفح المصدر', 'Visit Source')}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Saved & History Panel ── */}
      <div className="rounded-3xl overflow-hidden mt-2" style={{ background: theme === 'dark' ? '#0F0F16' : '#ffffff', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}>
        <button
          onClick={() => setShowHistoryPanel(v => !v)}
          className={`w-full flex items-center justify-between px-5 py-4 text-sm font-bold transition-all ${
            theme === 'dark' ? 'text-gray-200 hover:bg-white/5' : 'text-gray-700 hover:bg-black/3'
          }`}
        >
          <div className="flex items-center gap-2 text-[var(--app-text)] dark:text-gray-200">
            <Clock className="w-4 h-4 text-[var(--app-accent1)]" />
            {_resolveTranslation(lang, 'السجل والمحفوظات', 'History & Saved')}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]">
              {favorites.length + history.length}
            </span>
          </div>
          {showHistoryPanel
            ? <ChevronUp className="w-4 h-4 opacity-50" />
            : <ChevronDown className="w-4 h-4 opacity-50" />}
        </button>

        {showHistoryPanel && (
          <div className="p-4 pt-0 flex flex-col gap-4">
            {/* Tabs selector */}
            <div className="flex border-b border-black/5 dark:border-white/5 pb-2 gap-4">
              <button
                onClick={() => setPanelTab('favorites')}
                className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                  panelTab === 'favorites'
                    ? 'border-[var(--app-accent1)] text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {_resolveTranslation(lang, 'المحفوظات', 'Saved')} ({favorites.length})
              </button>
              <button
                onClick={() => setPanelTab('history')}
                className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                  panelTab === 'history'
                    ? 'border-[var(--app-accent1)] text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {_resolveTranslation(lang, 'الأخيرة', 'Recent')} ({history.length})
              </button>
              
              <button
                onClick={() => {
                  if (panelTab === 'favorites') {
                    setFavorites([]);
                  } else {
                    setHistory([]);
                  }
                }}
                className="ml-auto text-xs font-bold text-red-400 hover:text-red-300 transition-all"
              >
                {_resolveTranslation(lang, 'مسح الكل', 'Clear all')}
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {(panelTab === 'favorites' ? favorites : history).length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">{_resolveTranslation(lang, 'لا توجد عناصر.', 'No items found.')}</p>
              ) : (
                (panelTab === 'favorites' ? favorites : history).map((item) => {
                  return (
                    <div key={item.id} className={`flex items-start justify-between gap-3 p-3 rounded-2xl transition-all ${
                      theme === 'dark' ? 'bg-white/3 hover:bg-white/5' : 'bg-black/2 hover:bg-black/4'
                    }`} dir="ltr">
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]">
                            {item.type} | {item.topic} ({item.length})
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {item.story}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setStory(item.story);
                            setQuiz(item.quiz);
                            setListenTopic(item.topic || '');
                            setListenLength(item.length || 'medium');
                            setDictMode(false);
                            setDictResults([]);
                            setUserAnswers({});
                            setQuizSubmitted(false);
                            stopAudio();
                          }}
                          title={_resolveTranslation(lang, 'تحميل', 'Load')}
                          className={`p-1.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800'}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (panelTab === 'favorites') {
                              setFavorites(prev => prev.filter(x => x.id !== item.id));
                            } else {
                              setHistory(prev => prev.filter(x => x.id !== item.id));
                            }
                          }}
                          title={_resolveTranslation(lang, 'حذف', 'Delete')}
                          className={`p-1.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-500 hover:text-red-400' : 'hover:bg-black/5 text-gray-400 hover:text-red-500'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
function Writing({
  AI_KEY,
  lang,
  theme,
  writingHistory,
  setWritingHistory
}) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [writingTopic, setWritingTopic] = useState('');
  const [writingQuestion, setWritingQuestion] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [activePopup, setActivePopup] = useState(null); // { index, rect }
  const popupRef = useRef(null);
  // ── Countdown Timer ──
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(null); // null = not started
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setActivePopup(null);
    };
    if (activePopup) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activePopup]);

  useEffect(() => {
    if (timerRunning && timerSecondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimerSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            setTimerDone(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const startTimer = () => {
    if (timerSecondsLeft === null || timerDone) {
      setTimerSecondsLeft(timerMinutes * 60);
      setTimerDone(false);
    }
    setTimerRunning(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };
  const pauseTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerDone(false);
    setTimerSecondsLeft(null);
  };
  const formatTime = (secs) => {
    if (secs === null) return `${timerMinutes}:00`;
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const timerProgress = timerSecondsLeft === null ? 0 : 1 - timerSecondsLeft / (timerMinutes * 60);
  useEffect(() => {
    if (!writingTopic) { setWritingQuestion(''); return; }
    setLoadingQuestion(true);
    const prompt = `Generate a clear and engaging writing prompt question about the topic: "${writingTopic.split('(')[0].trim()}" for an English language learner. Make it one direct question that encourages 2-3 paragraphs of writing. Return only the question text, nothing else.`;
    let _wq = '';
    streamFromAPI(prompt, (delta) => { _wq += delta; setWritingQuestion(cleanFallbackText(_wq)); })
      .then(() => setLoadingQuestion(false))
      .catch(() => { setWritingQuestion(''); setLoadingQuestion(false); });
  }, [writingTopic]);
  const t = {
    title: _resolveTranslation(lang, 'مصحح الكتابة المتقدم', 'Advanced AI Corrector'),
    placeholder: _resolveTranslation(lang, "اكتب مقالاً قصيراً هنا (مثلاً عن طموحاتك)...", "Write a short essay here..."),
    btn: _resolveTranslation(lang, "تحليل وتصحيح النص ✨", "Analyze & Correct Text ✨"),
    corrected: _resolveTranslation(lang, "النص المصحح", "Corrected Text"),
    original: _resolveTranslation(lang, "النص الأصلي مع الأخطاء", "Your Text — Errors Highlighted"),
    grammarErrors: _resolveTranslation(lang, "الأخطاء النحوية", "Grammar Errors"),
    styleSection: _resolveTranslation(lang, "تحسينات الأسلوب", "Style Improvements"),
    overall: _resolveTranslation(lang, "التقييم العام", "Overall Feedback"),
    noErrors: _resolveTranslation(lang, "🎉 لا توجد أخطاء نحوية!", "🎉 No grammar errors found!"),
    history: _resolveTranslation(lang, "السجل", "History"),
    emptyHistory: _resolveTranslation(lang, "لا يوجد سجل بعد.", "No history yet.")
  };

  // Robust JSON extractor — depth-tracks braces, strips markdown fences
  const extractWritingJSON = (raw) => {
    if (!raw) return null;
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    if (start === -1) return null;
    let depth = 0, end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) return null;
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  };

  // Grammarly-style click popup for each error
  const renderHighlightedText = (originalText, grammarErrors) => {
    if (!grammarErrors?.length) return <span>{originalText}</span>;
    const segments = [];
    const usedRanges = [];
    grammarErrors.forEach((err, errIdx) => {
      if (!err.word) return;
      const escaped = err.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![\\w\\u0600-\\u06FF])(${escaped})(?![\\w\\u0600-\\u06FF])`, 'i');
      const match = regex.exec(originalText);
      if (match) {
        const s = match.index, e = match.index + match[0].length;
        if (!usedRanges.some(r => r[0] < e && r[1] > s)) {
          segments.push({ start: s, end: e, errIdx });
          usedRanges.push([s, e]);
        }
      }
    });
    segments.sort((a, b) => a.start - b.start);
    const parts = [];
    let cursor = 0;
    segments.forEach(({ start, end, errIdx }) => {
      if (cursor < start) parts.push(<span key={`t${cursor}`}>{originalText.slice(cursor, start)}</span>);
      const err = grammarErrors[errIdx];
      const isOpen = activePopup?.index === errIdx;
      parts.push(
        <span key={`e${errIdx}`} className="relative inline-block">
          <span
            className={`cursor-pointer font-bold rounded px-0.5 transition-all select-none ${isOpen ? 'bg-red-200 dark:bg-red-500/30 text-red-700 dark:text-red-300' : 'text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'}`}
            style={{ textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: '#ef4444', textUnderlineOffset: '3px' }}
            onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setActivePopup(p => p?.index === errIdx ? null : { index: errIdx, rect }); }}
          >
            {originalText.slice(start, end)}
          </span>
          {isOpen && activePopup?.rect && ReactDOM.createPortal(
            (() => {
              const POPUP_WIDTH = 300;
              const POPUP_HEIGHT = 180;
              const GAP = 8;
              const r = activePopup.rect;
              const spaceBelow = window.innerHeight - r.bottom;
              const showAbove = spaceBelow < POPUP_HEIGHT + GAP;
              let left = r.left;
              if (left + POPUP_WIDTH > window.innerWidth - 8) left = window.innerWidth - POPUP_WIDTH - 8;
              if (left < 8) left = 8;
              const top = showAbove ? r.top - POPUP_HEIGHT - GAP : r.bottom + GAP;
              return (
                <div
                  ref={popupRef}
                  className="animate-fadeIn"
                  style={{ position: 'fixed', top, left, width: POPUP_WIDTH, zIndex: 99999 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex flex-col rounded-2xl overflow-hidden border shadow-2xl"
                    style={{ background: theme === 'dark' ? '#1a1a24' : '#fff', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2.5 border-b" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : '#f3f4f6' }}>
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grammar Error #{errIdx + 1}</span>
                      <button onClick={() => setActivePopup(null)} className="ml-auto w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-base leading-none">x</button>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="line-through text-red-500 dark:text-red-400 font-bold text-sm">{err.word}</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>to</span>
                      <span className="text-green-600 dark:text-green-400 font-bold text-sm">{err.correction}</span>
                    </div>
                    <div className="px-4 pb-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-b" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : '#f3f4f6' }}>{err.explanation}</div>
                    <div className="px-3 py-2.5 flex gap-2">
                      <button
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-600 active:scale-95 text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        onClick={() => {
                          const escaped2 = err.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          const re = new RegExp(`(?<![\\w\\u0600-\\u06FF])(${escaped2})(?![\\w\\u0600-\\u06FF])`, 'i');
                          setText(prev => prev.replace(re, err.correction));
                          setFeedback(prev => ({ ...prev, grammar_errors: prev.grammar_errors.filter((_, i) => i !== errIdx) }));
                          setActivePopup(null);
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Apply Fix
                      </button>
                      <button onClick={() => setActivePopup(null)} className="px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-all">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              );
            })(),
            document.body
          )}
        </span>
      );
      cursor = end;
    });
    if (cursor < originalText.length) parts.push(<span key={`tend`}>{originalText.slice(cursor)}</span>);
    return parts;
  };

  const handleCorrect = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setActivePopup(null);
    try {
      const prompt = `You are an expert English writing coach. Analyze the EXACT text below and find ALL grammar mistakes. Be thorough — check subject-verb agreement, tense consistency, articles, prepositions, word choice, pluralization, and more. Respond ONLY with a valid JSON object (absolutely no markdown, no code fences, no extra text outside the JSON).

Text to analyze: "${text}"

Respond with this exact JSON structure:
{"score":"X/10","corrected_text":"fully corrected version here","grammar_errors":[{"word":"exact_word_as_written","correction":"fixed_version","explanation":"why in ${_resolveTranslation(lang, 'Arabic', 'English')}"}],"style_tips":[{"original":"phrase","better":"native alternative","tip":"why in ${_resolveTranslation(lang, 'Arabic', 'English')}"}],"overall":"2-3 sentences in ${_resolveTranslation(lang, 'Arabic', 'English')}"}

Important: The "word" value must be copied EXACTLY from the input text. Find every single error, do not skip any.`;

      const raw = await fetchFromGemini(prompt, AI_KEY, 2000);
      const json = extractWritingJSON(raw);
      if (!json) {
        setFeedback({ error: _resolveTranslation(lang, "فشل تحليل الرد. حاول مرة أخرى.", "Failed to parse AI response. Please try again.") });
      } else if (json.error) {
        setFeedback({ error: json.error });
      } else {
        setFeedback(json);
        setWritingHistory(prev => [{
          id: Date.now(),
          input: text,
          output: json.corrected_text || '',
          explanation: json.overall || '',
          score: json.score || '',
          feedback: json,
          createdAt: new Date().toISOString()
        }, ...prev].slice(0, 25));
      }
    } catch (e) {
      setFeedback({ error: _resolveTranslation(lang, "خطأ في الاتصال بالذكاء الاصطناعي.", "Error connecting to AI.") });
    }
    setLoading(false);
  };
  const startNewWriting = () => {
    if (text.trim()) {
      setWritingHistory(prev => {
        if (prev.some(item => item.input.trim() === text.trim())) return prev;
        return [{
          id: Date.now(),
          input: text,
          output: feedback?.corrected_text || '',
          explanation: feedback?.overall || feedback?.explanation || '',
          score: feedback?.score || '',
          feedback: feedback && !feedback.error ? feedback : null,
          createdAt: new Date().toISOString()
        }, ...prev].slice(0, 25);
      });
    }
    setText('');
    setFeedback(null);
  };
  const handleSelectHistoryItem = (item) => {
    setText(item.input);
    if (item.feedback) {
      setFeedback(item.feedback);
    } else {
      setFeedback({
        score: item.score || '',
        corrected_text: item.output || '',
        overall: item.explanation || '',
        grammar_errors: [],
        style_tips: []
      });
    }
  };
  return <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 text-center md:text-left">
      <div>
        <h2 className="text-4xl font-bold text-black dark:text-white mb-2 flex items-center justify-center md:justify-start gap-4">
          <PenTool className="text-[var(--app-accent1)] w-8 h-8" />
          {t.title}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">Improve your writing with AI-powered feedback and corrections.</p>
      </div>
      <button
        onClick={() => setShowHistory(!showHistory)}
        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border transition-all duration-300 shrink-0 ${
          showHistory
            ? 'bg-[var(--app-accent1)]/10 border-[var(--app-accent1)]/20 text-[var(--app-accent1)]'
            : 'bg-white/80 dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>{t.history}</span>
        {writingHistory?.length > 0 && (
          <span className="ml-1 bg-[var(--app-accent1)] text-white text-[11px] px-2 py-0.5 rounded-full">
            {writingHistory.length}
          </span>
        )}
      </button>
    </div>

    {showHistory && (
      <div className="premium-card rounded-3xl p-6 mb-8 animate-fadeIn space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
          <h3 className="text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--app-accent1)]" />
            {t.history}
          </h3>
          {writingHistory?.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all writing history?')) {
                  setWritingHistory([]);
                }
              }}
              className="text-xs text-red-500 hover:text-red-600 font-bold transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        {!writingHistory || writingHistory.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
            {t.emptyHistory}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
            {writingHistory.map((item) => {
              const scoreNum = parseInt(item.score || '0');
              const scoreColor = scoreNum >= 8 ? 'text-green-500 bg-green-500/10' : scoreNum >= 5 ? 'text-yellow-500 bg-yellow-500/10' : 'text-red-500 bg-red-500/10';
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:border-[var(--app-accent1)]/30 transition-all duration-300 group cursor-pointer"
                  onClick={() => handleSelectHistoryItem(item)}
                >
                  <div className="flex-1 min-w-0 pr-3 text-left">
                    <p className="text-[10px] text-gray-400 mb-1">
                      {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate group-hover:text-[var(--app-accent1)] transition-colors">
                      {item.input || 'Untitled Essay'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.score && (
                      <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${scoreColor}`}>
                        {item.score}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWritingHistory((prev) => prev.filter((h) => h.id !== item.id));
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    <div className="space-y-6">
      <div className="premium-card rounded-3xl p-6 relative z-50">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-gray-900 dark:text-white">Topic (Optional)</label>
          <CustomDropdown
            value={writingTopic}
            onChange={setWritingTopic}
            options={SPEAKING_TOPICS.map(tp => ({
              value: tp,
              label: lang === 'ar' ? tp.split('(')[0].trim() : (tp.match(/\(([^)]+)\)/)?.[1] || tp)
            }))}
            icon={List}
            theme={theme}
            placeholder={_resolveTranslation(lang, '— اختر موضوعاً —', '— Select a topic —')}
          />
          {loadingQuestion && <p className="text-xs text-[var(--app-accent1)] animate-pulse flex items-center gap-2"><Activity className="w-3.5 h-3.5 animate-spin" /> Generating prompt...</p>}
        </div>
      </div>

      {/* ── Countdown Timer ── */}
      <div className="premium-card rounded-3xl px-5 py-4">
        {/* Row 1: label + time display + controls */}
        <div className="flex items-center gap-3">

          {/* Time display */}
          <div className="relative shrink-0 w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="23" fill="none" stroke={theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} strokeWidth="4" />
              <circle
                cx="28" cy="28" r="23"
                fill="none"
                stroke={timerDone ? '#22c55e' : timerRunning ? 'var(--app-accent1)' : 'var(--app-accent2)'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 23}`}
                strokeDashoffset={`${2 * Math.PI * 23 * (1 - timerProgress)}`}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[11px] font-bold tabular-nums leading-none ${timerDone ? 'text-green-500' : timerRunning ? 'text-[var(--app-accent1)]' : 'text-gray-600 dark:text-gray-300'}`}>
                {timerDone ? '✓' : formatTime(timerSecondsLeft)}
              </span>
            </div>
          </div>

          {/* Label + presets (idle only) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Timer</span>
              {timerDone && <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Time's up!</span>}
            </div>

            {/* Presets + stepper row — idle only */}
            {!timerRunning && timerSecondsLeft === null ? (
              <div className="flex items-center gap-2 flex-wrap">
                {[5, 10, 15, 20, 30].map(m => (
                  <button key={m} onClick={() => setTimerMinutes(m)}
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all ${timerMinutes === m
                      ? 'bg-[var(--app-accent1)] text-white'
                      : 'bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'}`}
                  >{m}m</button>
                ))}
                {/* inline stepper for custom value */}
                <div className="flex items-center h-7 bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
                  <button onClick={() => setTimerMinutes(m => Math.max(1, m - 1))}
                    className="w-6 h-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-base transition-all">−</button>
                  <input type="number" min={1} max={120} value={timerMinutes}
                    onChange={e => setTimerMinutes(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
                    className="no-spinner w-8 text-center bg-transparent text-xs font-bold text-gray-700 dark:text-white outline-none" />
                  <button onClick={() => setTimerMinutes(m => Math.min(120, m + 1))}
                    className="w-6 h-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-base transition-all">+</button>
                </div>
              </div>
            ) : (
              /* while running/paused: show remaining label */
              <p className="text-xs text-gray-400">{timerRunning ? 'Running — keep writing!' : timerDone ? 'Session complete.' : 'Paused'}</p>
            )}
          </div>

          {/* Action buttons — far right */}
          <div className="flex items-center gap-1.5 shrink-0">
            {timerSecondsLeft !== null && (
              <button onClick={resetTimer}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all active:scale-90">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {!timerRunning ? (
              <button onClick={startTimer}
                className="h-8 px-4 flex items-center gap-1.5 rounded-xl text-xs font-bold bg-[var(--app-accent1)] text-white hover:opacity-90 transition-all active:scale-95 shadow-sm">
                <Play className="w-3 h-3 fill-current" />
                {timerSecondsLeft !== null && !timerDone ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button onClick={pauseTimer}
                className="h-8 px-4 flex items-center gap-1.5 rounded-xl text-xs font-bold bg-black/8 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:opacity-80 transition-all active:scale-95">
                <Pause className="w-3 h-3 fill-current" />
                Pause
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {timerSecondsLeft !== null && (
          <div className="mt-3 h-0.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${timerProgress * 100}%`,
                background: timerDone ? '#22c55e' : 'var(--app-accent1)',
                transition: 'width 0.9s linear, background 0.3s ease'
              }}
            />
          </div>
        )}
      </div>

      <div className="premium-card rounded-3xl p-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={writingQuestion || t.placeholder}
          className="w-full h-80 bg-transparent border-none p-6 text-lg text-gray-900 dark:text-white outline-none placeholder-gray-400 resize-none"
          dir="auto"
        />
      </div>

      <div className="flex gap-4">
        <button onClick={startNewWriting} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-[var(--app-surface)] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all">
          New
        </button>
        <button onClick={handleCorrect} disabled={loading || !text.trim()} className="flex-[3] py-4 rounded-2xl font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-sm disabled:opacity-50">
          {loading ? <Activity className="animate-spin w-6 h-6 mx-auto" /> : t.btn}
        </button>
      </div>
    </div>

    {feedback && !feedback.error && (
      <div className="mt-10 space-y-5 animate-fadeIn">

        {/* ── Score Banner ── */}
        <div className="flex items-center justify-between premium-card rounded-2xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--app-accent1)]/10">
              <PenTool className="w-5 h-5 text-[var(--app-accent1)]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Writing Score</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{feedback.grammar_errors?.length > 0 ? `${feedback.grammar_errors.length} error${feedback.grammar_errors.length > 1 ? 's' : ''} found` : t.noErrors}</p>
            </div>
          </div>
          <span className={`text-3xl font-extrabold ${(() => { const n = parseInt(feedback.score); return n >= 8 ? 'text-green-500' : n >= 5 ? 'text-yellow-500' : 'text-red-500'; })()}`}>
            {safeRender(feedback.score)}
          </span>
        </div>

        {/* ── Original with Highlighted Errors ── */}
        {feedback.grammar_errors?.length > 0 && (
          <div className="premium-card rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {t.original}
            </h3>
            <p className="text-lg leading-relaxed text-gray-900 dark:text-white" dir="ltr" style={{ lineHeight: '2.2rem' }}>
              {renderHighlightedText(text, feedback.grammar_errors)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
              <span className="inline-block w-4 border-b-2 border-red-400" style={{ borderStyle: 'wavy' }} />
              Hover over red words to see the fix
            </p>
          </div>
        )}

        {/* ── Grammar Error Cards ── */}
        {feedback.grammar_errors?.length > 0 ? (
          <div className="premium-card rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wide flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> {t.grammarErrors}
              <span className="ml-auto bg-red-500/15 text-red-500 text-xs px-2 py-0.5 rounded-full font-bold">{feedback.grammar_errors.length}</span>
            </h3>
            {feedback.grammar_errors.map((err, i) => (
              <div key={i} className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl">
                <span className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-500 text-xs font-extrabold flex items-center justify-center mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-base font-bold text-red-600 dark:text-red-400" style={{ textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: '#ef4444' }}>{err.word}</span>
                    <span className="text-gray-400 text-sm">→</span>
                    <span className="text-base font-bold text-green-600 dark:text-green-400">{err.correction}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{err.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-bold text-green-600 dark:text-green-400">{t.noErrors}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your grammar is solid. Check style tips below.</p>
            </div>
          </div>
        )}

        {/* ── Corrected Text ── */}
        <div className="premium-card rounded-2xl p-6 border border-green-200 dark:border-green-500/20">
          <h3 className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4" /> {t.corrected}
          </h3>
          <p className="text-lg text-gray-900 dark:text-white leading-relaxed" dir="ltr">{safeRender(feedback.corrected_text)}</p>
          <button onClick={() => { navigator.clipboard?.writeText(feedback.corrected_text || ''); }}
            className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[var(--app-accent1)] transition-colors">
            <Copy className="w-3.5 h-3.5" /> Copy corrected text
          </button>
        </div>

        {/* ── Style Tips ── */}
        {feedback.style_tips?.length > 0 && (
          <div className="premium-card rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-[var(--app-accent2)] uppercase tracking-wide flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" /> {t.styleSection}
            </h3>
            {feedback.style_tips.map((tip, i) => (
              <div key={i} className="bg-[var(--app-accent2)]/8 dark:bg-[var(--app-accent2)]/10 border border-[var(--app-accent2)]/20 p-4 rounded-2xl">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through">{tip.original}</span>
                  <span className="text-gray-400 text-sm">→</span>
                  <span className="text-sm font-bold text-[var(--app-accent2)]">{tip.better}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{tip.tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Overall Feedback ── */}
        {feedback.overall && (
          <div className="premium-card rounded-2xl p-6 border border-[var(--app-accent1)]/20">
            <h3 className="text-sm font-bold text-[var(--app-accent1)] uppercase tracking-wide flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4" /> {t.overall}
            </h3>
            <p className="text-gray-700 dark:text-gray-200 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(feedback.overall)}</p>
          </div>
        )}
      </div>
    )}
    {feedback && feedback.error && (
      <div className="mt-6 bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400 text-center font-bold">
        {safeRender(feedback.error)}
      </div>
    )}
  </div>;
}
function Speaking({
  AI_KEY,
  userLevel,
  lang,
  theme,
  speakingHistory = [],
  setSpeakingHistory,
  favorites = [],
  setFavorites
}) {
  const t = {
    welcome: _resolveTranslation(lang, `مرحباً بك! بناءً على تقييمك، مهاراتك في التحدث ممتازة (${userLevel}). لنتدرب على بعض المواضيع المتقدمة.`, `Hello! Your speaking skills are evaluated at ${userLevel}. Let's practice some advanced topics.`),
    title: _resolveTranslation(lang, 'ممارسة طلاقة التحدث', 'Fluency Practice'),
    placeholder: _resolveTranslation(lang, 'اكتب رسالتك أو سجل صوتاً...', 'Type or record your message...'),
    thinking: _resolveTranslation(lang, 'الذكاء الاصطناعي يفكر...', 'AI is thinking...'),
    newChat: _resolveTranslation(lang, 'محادثة جديدة', 'New Chat'),
    callMode: _resolveTranslation(lang, 'مكالمة', 'Call'),
    roleplay: _resolveTranslation(lang, 'محاكاة (Roleplay)', 'Roleplay Scenario'),
    corrected: _resolveTranslation(lang, 'تم التصحيح التلقائي', 'Auto-Corrected'),
    clarity: _resolveTranslation(lang, 'الوضوح', 'Clarity'),
    grammar: _resolveTranslation(lang, 'القواعد', 'Grammar'),
    fluency: _resolveTranslation(lang, 'السلاسة', 'Fluency'),
    native: _resolveTranslation(lang, 'كيف يقولها المتحدث الأصلي؟', 'How would a native say it?'),
    listen: _resolveTranslation(lang, 'استمع للنطق الصحيح', 'Listen to correct pronunciation'),
    micOn: _resolveTranslation(lang, 'تحدث الآن، الميكروفون مفتوح...', 'Speak now, microphone is open...'),
    tapMic: _resolveTranslation(lang, 'اضغط للتحدث', 'Tap to speak'),
    callActive: _resolveTranslation(lang, 'مكالمة قيد الإجراء...', 'Call in progress...'),
    stopCall: _resolveTranslation(lang, 'إنهاء المكالمة', 'End Call'),
    informal: _resolveTranslation(lang, 'غير رسمي', 'Informal'),
    formal: _resolveTranslation(lang, 'رسمي', 'Formal'),
    male: _resolveTranslation(lang, 'ذكر', 'Male'),
    female: _resolveTranslation(lang, 'أنثى', 'Female'),
    uk: _resolveTranslation(lang, 'بريطانية', 'UK'),
    us: _resolveTranslation(lang, 'أمريكية', 'US'),
    accent: _resolveTranslation(lang, 'اللكنة', 'Accent'),
    scenario: _resolveTranslation(lang, 'سيناريو', 'Scenario'),
    autoPlay: _resolveTranslation(lang, 'تشغيل تلقائي', 'Auto Play'),
    level: _resolveTranslation(lang, 'المستوى', 'Level'),
    topic: _resolveTranslation(lang, 'الموضوع', 'Topic'),
    history: _resolveTranslation(lang, 'السجل', 'History'),
    selectTopic: _resolveTranslation(lang, '— اختر موضوعاً —', '— Select a topic —')
  };
  const [messages, setMessages] = useState([{
    id: 1,
    role: 'ai',
    text: t.welcome
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLevel, setChatLevel] = useState(userLevel);
  const [formality, setFormality] = useState('informal');
  const [topic, setTopic] = useState(SPEAKING_TOPICS[0]);
  const [isCallMode, setIsCallMode] = useState(false);
  const [showCallTranscript, setShowCallTranscript] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [micAutoMode, setMicAutoMode] = useState(true);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [voiceGender, setVoiceGender] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('venoxa_voice_gender')) || 'male');
  const [callReview, setCallReview] = useState(null);
  const callAudioRef = useRef(null);
  const [usingBrowserTTS, setUsingBrowserTTS] = useState(false);
  const [ttsEngine, setTtsEngine] = useState('elevenlabs'); // 'elevenlabs' | 'edge' | 'browser'
  const [voiceAccent, setVoiceAccent] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('venoxa_voice_accent')) || 'uk'); // 'uk' | 'us'
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);
  const [personality, setPersonality] = useState('teacher');
  const [customPrompt, setCustomPrompt] = useState('');
  const [matureUnlocked, setMatureUnlocked] = useState(false);
  const personalityRateRef = useRef(1.0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showPersonalityPanel, setShowPersonalityPanel] = useState(false);
  const wantRecordingRef = useRef(false);
  const chatEndRef = useRef(null);
  const transcriptScrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const ttsQueueRef = useRef([]); // Stores { text, msgId } objects
  const prefetchCacheRef = useRef(new Map());
  const isTtsPlayingRef = useRef(false);

  // ── Live-value refs so async callbacks always read the latest settings ──
  const voiceGenderRef = useRef(voiceGender);
  const voiceAccentRef = useRef(voiceAccent);
  const chatLevelRef = useRef(chatLevel);
  const topicRef = useRef(topic);
  const formalityRef = useRef(formality);
  const isCallModeRef = useRef(isCallMode);
  const micAutoModeRef = useRef(micAutoMode);
  const isRecordingRef = useRef(isRecording);
  const autoReadRef = useRef(autoRead);

  const [callSilenceThreshold, setCallSilenceThreshold] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('venoxa_call_silence_threshold');
      if (saved) return parseFloat(saved);
    }
    return 2.0;
  });
  const [liveUserTranscript, setLiveUserTranscript] = useState('');

  const callSilenceThresholdRef = useRef(callSilenceThreshold);
  const liveUserTranscriptRef = useRef(liveUserTranscript);
  const silenceTimerRef = useRef(null);
  const inputRef = useRef(input);

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [panelTab, setPanelTab] = useState('favorites');

  const toggleFavorite = () => {
    if (messages.length <= 1) return;
    const lastAiMessage = [...messages].reverse().find(msg => msg.role === 'ai' && msg.text && msg.text !== t.welcome);
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    const firstUserText = String(lastUserMessage?.text || '').trim();
    const firstAiText = String(lastAiMessage?.text || '').trim();
    const source = `${topic || ''} ${firstUserText} ${firstAiText}`.trim().toLowerCase();
    const title = source.includes('hi') || source.includes('hello') || source.includes('hey') || source.includes('greeting') ? 'Greeting' : source.includes('interview') ? 'Interview' : source.includes('travel') ? 'Travel' : source.includes('work') || source.includes('job') ? 'Work' : source.includes('study') || source.includes('learn') ? 'Study' : String(topic || 'Conversation').split('(')[0].trim().replace(/\s+/g, ' ') || 'Conversation';

    setFavorites(prev => {
      const exists = prev.some(x => JSON.stringify(x.messages) === JSON.stringify(messages));
      if (exists) {
        return prev.filter(x => JSON.stringify(x.messages) !== JSON.stringify(messages));
      } else {
        return [{
          id: Date.now(),
          mode: isCallMode ? 'call' : 'chat',
          topic,
          title,
          level: chatLevel,
          messages,
          summary: lastUserMessage?.text || lastAiMessage?.text || '',
          reply: lastAiMessage?.text || '',
          createdAt: new Date().toISOString()
        }, ...prev];
      }
    });
  };

  const isFavorited = favorites.some(x => JSON.stringify(x.messages) === JSON.stringify(messages));

  const processTtsQueue = async () => {
    if (isTtsPlayingRef.current || ttsQueueRef.current.length === 0) return;
    const initialCallMode = isCallModeRef.current;
    isTtsPlayingRef.current = true;
    while (ttsQueueRef.current.length > 0) {
      if (initialCallMode && !isCallModeRef.current) {
        break;
      }
      const item = ttsQueueRef.current.shift();
      if (!item || !item.text) continue;

      const { text, msgId } = item;

      // 1. Get the pre-fetched blob promise
      const blobPromise = prefetchCacheRef.current.get(text);
      let blob = null;
      if (blobPromise) {
        blob = await blobPromise;
      } else {
        // Fallback if not pre-fetched
        blob = await fetchTTSBlob(text, _voiceGender, _voiceAccent);
      }

      if (initialCallMode && !isCallModeRef.current) {
        break;
      }

      if (blob) {
        // Bail out if call ended while we were fetching the blob
        if (initialCallMode && !isCallModeRef.current) {
          break;
        }

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        // Apply personality-driven playback rate (personality base × user speed)
        const rate = Math.max(0.5, Math.min(2.5, personalityRateRef.current));
        audio.playbackRate = rate;
        audio.preservesPitch = true; // keep pitch natural; only speed changes
        _currentTTSAudio = audio;

        // --- SYNC TRANSCRIPT TO VOICE ---
        // If we have a msgId, append this segment to the visible text as it starts playing (Call Mode only)
        if (msgId && isCallModeRef.current) {
          setMessages(prev => prev.map(msg =>
            msg.id === msgId
              ? { ...msg, text: (msg.text || '') + (msg.text ? ' ' : '') + text }
              : msg
          ));
        }

        await new Promise((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onpause = () => { URL.revokeObjectURL(url); resolve(); };
          audio.play().catch(resolve);
        });
      }

      if (initialCallMode && !isCallModeRef.current) {
        break;
      }

      // Cleanup cache
      prefetchCacheRef.current.delete(text);
    }
    isTtsPlayingRef.current = false;
    // --- AUTO-MIC: Restart recording after AI finishes speaking ---
    if (isCallModeRef.current && micAutoModeRef.current && !isRecordingRef.current) {
      setTimeout(() => {
        handleVoiceRecord();
      }, 400); // Small delay to ensure clean start
    }
  };

  const queueSpeech = (text, msgId = null) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // PRE-FETCH: Start synthesis IMMEDIATELY
    if (!prefetchCacheRef.current.has(trimmed)) {
      prefetchCacheRef.current.set(trimmed, fetchTTSBlob(trimmed, _voiceGender, _voiceAccent));
    }
    ttsQueueRef.current.push({ text: trimmed, msgId });
    processTtsQueue();
  };
  const saveConversationToHistory = (conversation) => {
    const lastAiMessage = [...conversation].reverse().find(msg => msg.role === 'ai' && msg.text && msg.text !== t.welcome);
    const lastUserMessage = [...conversation].reverse().find(msg => msg.role === 'user');
    if (!lastAiMessage && !lastUserMessage) return;
    const firstUserText = String(lastUserMessage?.text || '').trim();
    const firstAiText = String(lastAiMessage?.text || '').trim();
    const source = `${topic || ''} ${firstUserText} ${firstAiText}`.trim().toLowerCase();
    const title = source.includes('hi') || source.includes('hello') || source.includes('hey') || source.includes('greeting') ? 'Greeting' : source.includes('interview') ? 'Interview' : source.includes('travel') ? 'Travel' : source.includes('work') || source.includes('job') ? 'Work' : source.includes('study') || source.includes('learn') ? 'Study' : String(topic || 'Conversation').split('(')[0].trim().replace(/\s+/g, ' ') || 'Conversation';
    setSpeakingHistory(prev => [{
      id: Date.now(),
      mode: isCallMode ? 'call' : 'chat',
      topic,
      title,
      level: chatLevel,
      messages: conversation,
      summary: lastUserMessage?.text || lastAiMessage?.text || '',
      reply: lastAiMessage?.text || '',
      createdAt: new Date().toISOString()
    }, ...prev].slice(0, 25));
  };
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, expandedReviewId]);
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [messages, liveUserTranscript]);
  // Use ElevenLabs for natural AI voice — falls back to browser TTS if key not set.
  // Male: Adam (pNInz6obpgDQGcFmaJgB) — American | Female: Rachel (21m00Tcm4TlvDq8ikWAM) — American
  // Keep module-level accent var in sync with React state
  useEffect(() => {
    _voiceAccent = voiceAccent;
    if (typeof localStorage !== 'undefined') localStorage.setItem('venoxa_voice_accent', voiceAccent);
  }, [voiceAccent]);
  useEffect(() => {
    _voiceGender = voiceGender;
    voiceGenderRef.current = voiceGender;
    if (typeof localStorage !== 'undefined') localStorage.setItem('venoxa_voice_gender', voiceGender);
  }, [voiceGender]);
  // Keep all live-value refs in sync so async callbacks always read the latest settings
  useEffect(() => { voiceAccentRef.current = voiceAccent; }, [voiceAccent]);
  useEffect(() => { chatLevelRef.current = chatLevel; }, [chatLevel]);
  useEffect(() => { topicRef.current = topic; }, [topic]);
  useEffect(() => { formalityRef.current = formality; }, [formality]);
  useEffect(() => { isCallModeRef.current = isCallMode; }, [isCallMode]);
  useEffect(() => { micAutoModeRef.current = micAutoMode; }, [micAutoMode]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { autoReadRef.current = autoRead; }, [autoRead]);
  useEffect(() => {
    callSilenceThresholdRef.current = callSilenceThreshold;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('venoxa_call_silence_threshold', callSilenceThreshold.toString());
    }
  }, [callSilenceThreshold]);
  useEffect(() => { liveUserTranscriptRef.current = liveUserTranscript; }, [liveUserTranscript]);
  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      cancelTTS();
    };
  }, []);
  // Keep personalityRateRef in sync so processTtsQueue always reads the live rate
  useEffect(() => {
    const p = PERSONALITIES.find(p => p.id === personality);
    personalityRateRef.current = (p?.rate ?? 1.0) * playbackSpeed;
  }, [personality, playbackSpeed]);

  // Call duration timer — counts up while in call mode
  useEffect(() => {
    if (isCallMode) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [isCallMode]);

  const formatCallDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Personality modes — categorised: standard | kids | mature
  const PERSONALITIES = [
    // ── Standard & Roleplay ──────────────────────────────────────────────────
    { id: 'custom',        label: 'Custom',        icon: '✏️',  desc: 'Your own prompt — full control',           category: 'standard', rate: 1.0  },
    { id: 'assistant',     label: 'Assistant',     icon: '🤖',  desc: 'Helpful, neutral AI assistant',            category: 'standard', rate: 1.0  },
    { id: 'teacher',       label: 'Teacher',       icon: '🎓',  desc: 'Corrects mistakes, explains clearly',      category: 'standard', rate: 0.95 },
    { id: 'friend',        label: 'Friend',        icon: '😊',  desc: 'Casual, warm, encouraging',                category: 'standard', rate: 1.05 },
    { id: 'native',        label: 'Native',        icon: '🗣️', desc: 'Natural idioms, slang, flow',              category: 'standard', rate: 1.1  },
    { id: 'debate',        label: 'Debate',        icon: '⚡',  desc: 'Challenges your ideas, pushes back',       category: 'standard', rate: 1.1  },
    { id: 'interviewer',   label: 'Interviewer',   icon: '💼',  desc: 'Job / academic interview style',           category: 'standard', rate: 1.0  },
    { id: 'storyteller',   label: 'Storyteller',   icon: '📖',  desc: 'Narrative, creative, vivid',               category: 'standard', rate: 1.0  },
    { id: 'therapist',     label: 'Therapist',     icon: '💙',  desc: 'Empathetic, calm, non-judgmental',         category: 'standard', rate: 0.88 },
    { id: 'meditation',    label: 'Meditation',    icon: '🧘',  desc: 'Calm, slow, mindful guidance',             category: 'standard', rate: 0.82 },
    { id: 'doc',           label: 'Doc',           icon: '🩺',  desc: 'Clear medical-style explanations',         category: 'standard', rate: 0.97 },
    // ── Kids-Friendly ────────────────────────────────────────────────────────
    { id: 'kids_story',    label: 'Kids Story',    icon: '🧸',  desc: 'Fun bedtime stories for children',         category: 'kids',     rate: 0.88 },
    { id: 'kids_trivia',   label: 'Kids Trivia',   icon: '🎮',  desc: 'Silly trivia game for little learners',    category: 'kids',     rate: 1.0  },
    // ── Mature / Experimental ────────────────────────────────────────────────
    { id: 'unhinged',      label: 'Unhinged',      icon: '🤪',  desc: 'Chaotic, raw, gloriously unfiltered',      category: 'mature',   rate: 1.22, mature: true },
    { id: 'sexy',          label: 'Sexy',          icon: '🔥',  desc: 'Flirtatious, confident, playful',          category: 'mature',   rate: 0.88, mature: true },
    { id: 'motivation',    label: 'Motivation',    icon: '💪',  desc: 'Full-blast hype — get off your ass',       category: 'mature',   rate: 1.18, mature: true },
    { id: 'conspiracy',    label: 'Conspiracy',    icon: '🕵️', desc: 'Alternative theories and rabbit holes',    category: 'mature',   rate: 1.05, mature: true },
    { id: 'romantic',      label: 'Romantic',      icon: '💕',  desc: 'Poetic, tender, intimate language',        category: 'mature',   rate: 0.85, mature: true },
    { id: 'argumentative', label: 'Argumentative', icon: '🥊',  desc: 'Debates hard and plays devil\'s advocate', category: 'mature',   rate: 1.12, mature: true },
  ];

  const getPersonalityInstruction = () => {
    switch (personality) {
      // ── Standard ──────────────────────────────────────────────────────────
      case 'custom':
        return customPrompt.trim()
          ? customPrompt.trim()
          : 'Be helpful and natural. Adapt fully to whatever the user needs.';
      case 'assistant':
        return 'You are a precise, efficient AI assistant. Respond clearly and concisely. Stay on-topic, never waffle, always helpful.';
      case 'teacher':
        return 'You are a patient, encouraging English teacher. Gently flag any errors the user makes at the very end of your reply inside [brackets], with a brief fix. Never shame; always explain why.';
      case 'friend':
        return 'You are the user\'s warm, funny best friend. Use contractions, casual slang, ask about their life, laugh often (haha / lol sparingly), and keep things light and human.';
      case 'native':
        return 'Speak exactly like a relaxed native English speaker — use real idioms, phrasal verbs, natural fillers (you know, like, honestly), colloquialisms, and a conversational rhythm. Never sound textbook-formal.';
      case 'debate':
        return 'You are a sharp debate partner. Respectfully but firmly challenge every claim the user makes. Ask probing follow-up questions. Play devil\'s advocate. Never just agree — push them to think harder and defend their position.';
      case 'interviewer':
        return 'You are a seasoned interviewer conducting a professional job or university interview. Ask one focused question at a time. Give concise, honest feedback on the user\'s answers. Maintain a polished, slightly formal tone.';
      case 'storyteller':
        return 'You are a masterful storyteller. Weave vivid imagery, rich metaphors, and a compelling narrative arc into every reply. Use sensory language. Make the conversation feel like a story unfolding.';
      case 'therapist':
        return 'You are a warm, attentive therapist. Listen deeply. Reflect feelings back without judgment ("It sounds like you feel…"). Ask gentle open questions. Never give unsolicited advice — hold space and validate first. Speak softly and slowly.';
      case 'meditation':
        return 'You are a serene meditation and mindfulness guide. Speak in a slow, calm, grounding tone. Use breath cues naturally ("take a slow breath…"). Use gentle, present-moment language. Silence is fine — short responses are better. Never rush.';
      case 'doc':
        return 'You are a clear-spoken medical professional (Grok "Doc" style). Give factual, evidence-based information using plain language. Define jargon. Recommend professional consultation when appropriate. Stay methodical and precise, but compassionate.';
      // ── Kids ──────────────────────────────────────────────────────────────
      case 'kids_story':
        return 'You are a magical, enthusiastic children\'s storyteller. Use simple words, vivid imagination, funny characters, and gentle suspense. Every reply continues or starts a short bedtime-style adventure. End with a cliffhanger or a sweet question to keep them engaged. Always appropriate for ages 4-10.';
      case 'kids_trivia':
        return 'You are a super-energetic kids\' trivia game host! Ask one fun, age-appropriate trivia question at a time (topics: animals, nature, space, cartoons). React with BIG excitement for right answers ("WOOHOO! You got it! 🎉") and gentle encouragement for wrong ones. Keep it playful and short.';
      // ── Mature ────────────────────────────────────────────────────────────
      case 'unhinged':
        return 'You are completely unfiltered, chaotic, and unpredictable. Jump between ideas, use ALL CAPS for emphasis, make wild comparisons, go on tangents, laugh at your own chaos. Be raw, irreverent, and gloriously unhinged — but never hateful or harmful.';
      case 'sexy':
        return 'You are confident, playful, and flirtatious. Speak with a low, deliberate tone. Use suggestive but tasteful language — innuendo, compliments, slow pacing. Make the user feel desired and interesting. Never crude, always alluring.';
      case 'motivation':
        return 'You are an INTENSE motivational coach — part drill sergeant, part hype man. Use short punchy sentences. SHOUT IN CAPS when building energy. Call out excuses. Demand greatness. Reference elite performers. Every reply should make the user want to sprint to the gym or start their dream RIGHT NOW.';
      case 'conspiracy':
        return 'You are a passionate conspiracy theorist. Question official narratives, connect unlikely dots, use phrases like "They don\'t want you to know this…", "Follow the money…", "Look at who benefits…". Be dramatic and convincing. Frame everything as a hidden pattern. Stay entertaining, not harmful.';
      case 'romantic':
        return 'You are deeply romantic and poetic. Choose words carefully, like a love letter. Use metaphors from nature, art, and music. Speak tenderly, with warmth and longing. Make the user feel truly seen and cherished. Move slowly, pause for beauty. Every sentence should feel like it was written just for them.';
      case 'argumentative':
        return 'You are a fierce devil\'s advocate who loves a good argument. Immediately counter whatever the user says with a well-reasoned opposing view. Stay logical but passionate. Use rhetorical questions. Never back down easily — make them work for agreement. Keep it intellectually charged, not personal.';
      default:
        return 'Be helpful and natural.';
    }
  };

  // Render user message text with wavy underlines for grammar/pronunciation errors
  const renderAnnotatedText = (text, review) => {
    if (!review || (!review.grammar_errors?.length && !review.pronunciation_errors?.length)) {
      return <span>{safeRender(text)}</span>;
    }
    const grammarWords = new Set((review.grammar_errors || []).map(e => (e.word || '').toLowerCase().replace(/[.,!?;:']/g, '')));
    const pronunciationWords = new Set((review.pronunciation_errors || []).map(e => (e.word || '').toLowerCase().replace(/[.,!?;:']/g, '')));
    const tokens = text.split(/(\s+)/);
    return (
      <>
        {tokens.map((token, i) => {
          const clean = token.toLowerCase().replace(/[.,!?;:'"]/g, '');
          if (grammarWords.has(clean)) {
            return <span key={i} title={`Grammar: ${(review.grammar_errors || []).find(e => e.word?.toLowerCase().replace(/[.,!?;:'"]/g, '') === clean)?.explanation || ''}`}
              style={{ textDecoration: 'underline', textDecorationColor: '#ef4444', textDecorationStyle: 'wavy', textUnderlineOffset: '3px', cursor: 'help' }}>{token}</span>;
          }
          if (pronunciationWords.has(clean)) {
            return <span key={i} title={`Pronunciation: ${(review.pronunciation_errors || []).find(e => e.word?.toLowerCase().replace(/[.,!?;:'"]/g, '') === clean)?.phonetic || ''}`}
              style={{ textDecoration: 'underline', textDecorationColor: '#f97316', textDecorationStyle: 'wavy', textUnderlineOffset: '3px', cursor: 'help' }}>{token}</span>;
          }
          return token;
        })}
      </>
    );
  };

  // Pre-warm the Edge TTS connection as soon as the component mounts
  useEffect(() => {
    const accent = _voiceAccent === 'us' ? 'us' : 'uk';
    const voice = EDGE_VOICES[accent][voiceGender === 'female' ? 'female' : 'male'];
    const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
    fetch(`${base}api/edge-tts-warmup?voice=${encodeURIComponent(voice)}`).catch(() => { });
  }, []);

  const speakText = async (text, interrupt = true) => {
    const voiceId = _voiceGender === 'female' ? ELEVENLABS_SARAH_ID : ELEVENLABS_BRIAN_ID;
    await elevenLabsSpeak(text, voiceId, interrupt);
    // Update TTS mode indicator after each call
    const engine = _lastTTSEngine || 'edge';
    setTtsEngine(engine);
    setUsingBrowserTTS(engine === 'browser');
  };

  const handleSend = async (forcedText = null) => {
    const userMsg = forcedText || input;
    if (!userMsg.trim()) return;
    if (!forcedText) setInput('');
    const newMsgId = Date.now();
    const aiMsgId = newMsgId + 1;
    setMessages(prev => [...prev, { id: newMsgId, role: 'user', text: userMsg }]);
    setLoading(true);
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', streaming: true }]);
    try {
      const history = messages.slice(-2).map(m => `${m.role === 'ai' ? 'AI' : 'User'}: ${m.text}`).join('\n');
      const isArabicMsg = hasArabicText(userMsg);
      const langInstruction = isArabicMsg
        ? 'The user wrote in Arabic. Reply in Arabic naturally and warmly.'
        : 'Reply in English.';

      // ── Step 1: Stream the reply immediately — plain text, no JSON ──────────
      const replyPrompt = `You are a friendly, natural conversation partner helping an English learner. ${langInstruction} Level: ${chatLevelRef.current}. Topic: ${topicRef.current}. Style: ${formalityRef.current}. Personality: ${getPersonalityInstruction()} Recent context: ${history}. User said: "${userMsg}". Reply warmly in 1-3 sentences. Output the reply text ONLY — no JSON, no labels, no analysis whatsoever.`;
      let replyText = '';
      let spokenSentencesCount = 0;

      // Clear queue for new message
      ttsQueueRef.current = [];

      await streamFromAPI(replyPrompt, (delta) => {
        replyText += delta;

        // --- SYNCED TRANSCRIPT LOGIC ---
        // If in Call Mode, we don't update the message text here. 
        // Instead, processTtsQueue will append text as it speaks.
        if (!isCallModeRef.current) {
          setMessages(prev => prev.map(msg =>
            msg.id === aiMsgId ? { ...msg, text: replyText } : msg
          ));
        }

        // ── Real-time High-Speed Rolling TTS ──
        if (isCallModeRef.current || autoReadRef.current) {
          const unsent = replyText.slice(spokenSentencesCount).trim();
          // Match any natural break: . ? ! \n , ; or a long segment (> 70 chars)
          const breakMatch = unsent.match(/[^.!?\n,;]{5,}[.!?\n,;]+/);

          if (breakMatch) {
            const segment = breakMatch[0];
            queueSpeech(segment, aiMsgId);
            // We use char count to track where we are in the stream
            spokenSentencesCount += (replyText.indexOf(segment, spokenSentencesCount) - spokenSentencesCount) + segment.length;
          } else if (unsent.length > 100) {
            // Safety break for very long sentences without punctuation
            const lastSpace = unsent.lastIndexOf(' ');
            if (lastSpace > 50) {
              const segment = unsent.slice(0, lastSpace);
              queueSpeech(segment, aiMsgId);
              spokenSentencesCount += (replyText.indexOf(segment, spokenSentencesCount) - spokenSentencesCount) + segment.length;
            }
          }
        }
      }, 256);

      replyText = replyText.trim();

      // Final flush for any remaining text
      const remaining = replyText.slice(spokenSentencesCount).trim();
      if (remaining.length > 2 && (isCallModeRef.current || autoReadRef.current)) {
        queueSpeech(remaining, aiMsgId);
      }

      setMessages(prev => prev.map(msg =>
        msg.id === aiMsgId ? { ...msg, text: isCallMode ? msg.text : replyText, streaming: false } : msg
      ));

      // ── Step 2: Background correction — fires in parallel, never blocks ─────
      fetchFromGemini(
        `Review this ${isArabicMsg ? 'Arabic' : 'English'} message from a ${chatLevel} learner: "${userMsg}". Return ONLY a valid JSON object with no markdown fences: {"clarity":"one short sentence","grammar":"one short sentence","fluency":"one short sentence","native_way":"how a native speaker would phrase this","grammar_errors":[{"word":"exact_word_from_text","correction":"fixed_word","explanation":"why"}],"pronunciation_errors":[{"word":"exact_word_from_text","phonetic":"IPA or simple phonetic guide","tip":"how to say it"}]}. Only include errors that actually exist. Empty arrays if none.`,
        null
      ).then(reviewRaw => {
        const review = parseGeminiJSON(reviewRaw);
        if (review && !review.error && (review.clarity || review.grammar)) {
          setMessages(prev => prev.map(msg =>
            msg.id === newMsgId ? { ...msg, review } : msg
          ));
        }
      }).catch(() => { });
    } catch (err) {
      setMessages(prev => prev.map(msg =>
        msg.id === aiMsgId
          ? { ...msg, text: _resolveTranslation(lang, "فشل الاتصال بالذكاء الاصطناعي.", "Error connecting to AI."), streaming: false, role: 'system' }
          : msg
      ));
    } finally {
      setLoading(false);
    }
  };
  const generateDynamicOpener = async (targetPersonality = personality, targetTopic = topic, overrideCustomPrompt = null) => {
    setLoading(true);
    cancelTTS();
    ttsQueueRef.current = [];
    if (callAudioRef.current) { callAudioRef.current.pause(); callAudioRef.current = null; }

    const aiMsgId = Date.now();
    setMessages([{ id: aiMsgId, role: 'ai', text: '', streaming: true }]);

    let spokenSentencesCount = 0;
    try {
      const pObj = PERSONALITIES.find(p => p.id === targetPersonality);
      let pInstruction = 'Be helpful and natural. Adapt fully to whatever the user needs.';
      switch (targetPersonality) {
        case 'custom': {
          const effectivePrompt = overrideCustomPrompt !== null ? overrideCustomPrompt : customPrompt;
          pInstruction = effectivePrompt.trim() ? effectivePrompt.trim() : 'Be helpful and natural. Adapt fully to whatever the user needs.';
          break;
        }
        case 'assistant':
          pInstruction = 'You are a precise, efficient AI assistant. Respond clearly and concisely. Stay on-topic, never waffle, always helpful.';
          break;
        case 'teacher':
          pInstruction = 'You are a patient, encouraging English teacher. Gently flag any errors the user makes at the very end of your reply inside [brackets], with a brief fix. Never shame; always explain why.';
          break;
        case 'friend':
          pInstruction = 'You are the user\'s warm, funny best friend. Use contractions, casual slang, ask about their life, laugh often (haha / lol sparingly), and keep things light and human.';
          break;
        case 'native':
          pInstruction = 'Speak exactly like a relaxed native English speaker — use real idioms, phrasal verbs, natural fillers (you know, like, honestly), colloquialisms, and a conversational rhythm. Never sound textbook-formal.';
          break;
        case 'debate':
          pInstruction = 'You are a sharp debate partner. Respectfully but firmly challenge every claim the user makes. Ask probing follow-up questions. Play devil\'s advocate. Never just agree — push them to think harder and defend their position.';
          break;
        case 'interviewer':
          pInstruction = 'You are a seasoned interviewer conducting a professional job or university interview. Ask one focused question at a time. Give concise, honest feedback on the user\'s answers. Maintain a polished, slightly formal tone.';
          break;
        case 'storyteller':
          pInstruction = 'You are a masterful storyteller. Weave vivid imagery, rich metaphors, and a compelling narrative arc into every reply. Use sensory language. Make the conversation feel like a story unfolding.';
          break;
        case 'therapist':
          pInstruction = 'You are a warm, attentive therapist. Listen deeply. Reflect feelings back without judgment ("It sounds like you feel…"). Ask gentle open questions. Never give unsolicited advice — hold space and validate first. Speak softly and slowly.';
          break;
        case 'meditation':
          pInstruction = 'You are a serene meditation and mindfulness guide. Speak in a slow, calm, grounding tone. Use breath cues naturally ("take a slow breath…"). Use gentle, present-moment language. Silence is fine — short responses are better. Never rush.';
          break;
        case 'doc':
          pInstruction = 'You are a clear-spoken medical professional (Grok "Doc" style). Give factual, evidence-based information using plain language. Define jargon. Recommend professional consultation when appropriate. Stay methodical and precise, but compassionate.';
          break;
        case 'kids_story':
          pInstruction = 'You are a magical, enthusiastic children\'s storyteller. Use simple words, vivid imagination, funny characters, and gentle suspense. Every reply continues or starts a short bedtime-style adventure. End with a cliffhanger or a sweet question to keep them engaged. Always appropriate for ages 4-10.';
          break;
        case 'kids_trivia':
          pInstruction = 'You are a super-energetic kids\' trivia game host! Ask one fun, age-appropriate trivia question at a time (topics: animals, nature, space, cartoons). React with BIG excitement for right answers ("WOOHOO! You got it! 🎉") and gentle encouragement for wrong ones. Keep it playful and short.';
          break;
        case 'unhinged':
          pInstruction = 'You are completely unfiltered, chaotic, and unpredictable. Jump between ideas, use ALL CAPS for emphasis, make wild comparisons, go on tangents, laugh at your own chaos. Be raw, irreverent, and gloriously unhinged — but never hateful or harmful.';
          break;
        case 'sexy':
          pInstruction = 'You are confident, playful, and flirtatious. Speak with a low, deliberate tone. Use suggestive but tasteful language — innuendo, compliments, slow pacing. Make the user feel desired and interesting. Never crude, always alluring.';
          break;
        case 'motivation':
          pInstruction = 'You are an INTENSE motivational coach — part drill sergeant, part hype man. Use short punchy sentences. SHOUT IN CAPS when building energy. Call out excuses. Demand greatness. Reference elite performers. Every reply should make the user want to sprint to the gym or start their dream RIGHT NOW.';
          break;
        case 'conspiracy':
          pInstruction = 'You are a passionate conspiracy theorist. Question official narratives, connect unlikely dots, use phrases like "They don\'t want you to know this…", "Follow the money…", "Look at who benefits…". Be dramatic and convincing. Frame everything as a hidden pattern. Stay entertaining, not harmful.';
          break;
        case 'romantic':
          pInstruction = 'You are a deep, passionate romantic. Use beautiful, poetic, tender, and intimate language. Make the user feel adored and special. Keep it sweet, emotional, and warm.';
          break;
        case 'argumentative':
          pInstruction = 'You are highly argumentative. Dispute almost everything, pick apart details, and robustly argue your side with a slightly stubborn attitude.';
          break;
      }

      const currentTopic = targetTopic || "General Conversation";

      const prompt = `You are a dynamic English conversation partner. You are acting in the following personality mode:
Personality name: ${pObj?.label || targetPersonality}
Personality instruction: ${pInstruction}

Your task is to start an engaging conversation in English for a ${chatLevel} learner about the topic "${currentTopic}".
The tone should be ${formality === 'formal' ? 'formal' : 'casual'}.

Generate exactly ONE natural, engaging opening question in English related to your personality and the topic to start the conversation.
Do NOT include any introduction, meta-text, brackets, or markdown. Output the question text ONLY, so it can be read directly to the user.`;

      let accumulated = '';
      await streamFromAPI(prompt, (delta) => {
        accumulated += delta;
        setMessages([{ id: aiMsgId, role: 'ai', text: accumulated, streaming: true }]);

        if (isCallModeRef.current || autoReadRef.current) {
          const unsent = accumulated.slice(spokenSentencesCount).trim();
          const breakMatch = unsent.match(/[^.!?\n,;]{5,}[.!?\n,;]+/);
          if (breakMatch) {
            const segment = breakMatch[0];
            queueSpeech(segment, aiMsgId);
            spokenSentencesCount += (accumulated.indexOf(segment, spokenSentencesCount) - spokenSentencesCount) + segment.length;
          }
        }
      });

      const remaining = accumulated.trim().slice(spokenSentencesCount);
      if (remaining.length > 2) {
        if (isCallModeRef.current || autoReadRef.current) {
          queueSpeech(remaining, aiMsgId);
        }
      }

      setMessages([{ id: aiMsgId, role: 'ai', text: accumulated.trim(), streaming: false }]);
    } catch (e) {
      console.error(e);
      setMessages([{
        id: Date.now(),
        role: 'system',
        text: _resolveTranslation(lang, "فشل الاتصال.", "Connection failed.")
      }]);
    } finally {
      setLoading(false);
    }
  };
  const handlePersonalityChange = (newId) => {
    setPersonality(newId);
    if (newId === 'custom') {
      // Clear messages and show instruction to use the custom prompt panel
      cancelTTS();
      ttsQueueRef.current = [];
      if (callAudioRef.current) { callAudioRef.current.pause(); callAudioRef.current = null; }
      setMessages([{
        id: Date.now(),
        role: 'system',
        text: '✏️ Custom mode selected. Open the Personality panel below, describe your persona, then tap "Apply & Generate Question" to start.'
      }]);
    } else {
      generateDynamicOpener(newId, topic);
    }
  };
  const startNewConversation = async () => {
    setLoading(true);
    const currentConversation = [...messages];
    saveConversationToHistory(currentConversation);
    const aiMsgId = Date.now();
    setMessages([{ id: aiMsgId, role: 'ai', text: '', streaming: true }]);
    let spokenSentencesCount = 0;
    try {
      const prompt = `Start a short ${formality === 'formal' ? 'formal' : 'casual'} English conversation for a ${chatLevel} learner about "${topic}". Ask one natural, engaging question only. No intro text, just the question.`;
      let accumulated = '';
      await streamFromAPI(prompt, (delta) => {
        accumulated += delta;
        if (!isCallMode) {
          setMessages([{ id: aiMsgId, role: 'ai', text: accumulated, streaming: true }]);
        }

        // Sync check for start conversation too
        if (isCallModeRef.current || autoReadRef.current) {
          const unsent = accumulated.slice(spokenSentencesCount).trim();
          const breakMatch = unsent.match(/[^.!?\n,;]{5,}[.!?\n,;]+/);
          if (breakMatch) {
            const segment = breakMatch[0];
            queueSpeech(segment, aiMsgId);
            spokenSentencesCount += (accumulated.indexOf(segment, spokenSentencesCount) - spokenSentencesCount) + segment.length;
          }
        }
      });

      const remaining = accumulated.trim().slice(spokenSentencesCount);
      if (remaining.length > 2 && (isCallModeRef.current || autoReadRef.current)) {
        queueSpeech(remaining, aiMsgId);
      }

      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, streaming: false } : m));
    } catch (e) {
      setMessages([{
        id: Date.now(),
        role: 'system',
        text: _resolveTranslation(lang, "فشل الاتصال.", "Connection failed.")
      }]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!topic) return;
    if (messages.length > 1) {
      generateDynamicOpener(personality, topic);
    }
  }, [topic]);
  const handleVoiceRecord = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(_resolveTranslation(lang, "متصفحك لا يدعم تسجيل الصوت. استخدم Chrome.", "Browser doesn't support voice. Use Chrome."));
      return;
    }
    if (isRecording || wantRecordingRef.current) {
      wantRecordingRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      recognitionRef.current?.stop();
      setIsRecording(false);
      setLiveUserTranscript('');
      return;
    }
    wantRecordingRef.current = true;
    setLiveUserTranscript('');

    const startRecognition = () => {
      if (!wantRecordingRef.current) return;
      const baseText = isCallModeRef.current ? liveUserTranscriptRef.current : inputRef.current;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = event => {
        let completedText = '';
        let interimText = '';
        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            completedText += text + ' ';
          } else {
            interimText += text;
          }
        }
        const sessionTranscript = (completedText + interimText).trim();
        const fullTranscript = (baseText + ' ' + sessionTranscript).replace(/\s+/g, ' ').trim();

        if (fullTranscript) {
          if (isCallModeRef.current) {
            setLiveUserTranscript(fullTranscript);

            // Clear previous silence timer
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }

            // Set new silence timer
            silenceTimerRef.current = setTimeout(() => {
              if (wantRecordingRef.current) {
                wantRecordingRef.current = false;
                recognition.stop();
                setIsRecording(false);
                setLiveUserTranscript('');
                handleSend(fullTranscript);
              }
            }, callSilenceThresholdRef.current * 1000);

          } else {
            setInput(fullTranscript);
          }
        }
      };
      recognition.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'audio-capture' || e.error === 'aborted') {
          // Non-fatal — will restart via onend
        } else {
          wantRecordingRef.current = false;
          setIsRecording(false);
        }
      };
      recognition.onend = () => {
        // Auto-restart if user still wants to record (browser stopped on silence / time limit)
        if (wantRecordingRef.current) {
          // Don't flicker isRecording off — keep it true during seamless restart
          // Don't clear the silence timer — it should survive browser restarts
          setTimeout(startRecognition, 150);
        } else {
          // User intentionally stopped — clean up
          setIsRecording(false);
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
      };
      recognition.start();
    };
    startRecognition();
  };
  const toggleCallMode = () => {
    if (isCallMode) {
      const corrections = messages.filter(m => m.role === 'user' && m.review);
      setCallReview(corrections.length > 0 ? corrections : null);
      if (callAudioRef.current) { callAudioRef.current.pause(); callAudioRef.current = null; }
      cancelTTS();
      ttsQueueRef.current = [];
      prefetchCacheRef.current.clear();
      wantRecordingRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      setLiveUserTranscript('');
      setIsCallMode(false);
    } else {
      setCallReview(null);
      setIsCallMode(true);
      generateDynamicOpener(personality, topic);
    }
  };
  const generateScenario = async () => {
    setLoadingScenario(true);
    try {
      const prompt = `Generate a realistic and challenging roleplay scenario in English for a student at level ${chatLevel}.
      Example: "You are returning a broken laptop to a store and the clerk is being difficult."
      Provide the scenario in English and a short instruction in ${_resolveTranslation(lang, 'Arabic', 'English')}. Return text only.`;
      const response = await fetchFromGemini(prompt, AI_KEY);
      const errJson = parseGeminiJSON(response);
      if (errJson && errJson.error) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'system',
          text: errJson.error
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          text: response
        }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScenario(false);
    }
  };
  if (isCallMode) {
    const lastAiCallMsg = [...messages].reverse().find(m => m.role === 'ai' && m.text);
    const blobClass = loading ? 'blob-speak' : isRecording ? 'blob-listen' : 'blob-idle';
    const isDark = theme === 'dark';
    return <div className={`relative w-full min-h-[80vh] flex flex-col animate-fadeIn select-none transition-colors duration-300 bg-transparent`}>
      {isDark && <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden"><ParticlesBackground /></div>}

      {/* ── Top Header: Status, Timer & Options ── */}
      <div className="absolute top-2 left-6 right-6 z-20 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* LIVE + Timer pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border ${isDark ? 'bg-black/20 border-white/10' : 'bg-white/90 border-black/10'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className={`text-[10px] font-bold tracking-widest uppercase ${isDark ? 'text-white/90' : 'text-gray-700'}`}>Live</span>
            <span className={`text-xs font-bold tabular-nums ${isDark ? 'text-white/70' : 'text-gray-500'}`}>{formatCallDuration(callDuration)}</span>
          </div>

          {/* Accent + Gender pill */}
          <div className={`flex items-center gap-0.5 backdrop-blur-md border p-1 rounded-2xl ${isDark ? 'bg-black/20 border-white/10' : 'bg-white/90 border-black/10'}`}>
            <button onClick={() => setVoiceAccent(voiceAccent === 'uk' ? 'us' : 'uk')}
              className={`px-3 py-1 text-[10px] font-bold transition-colors uppercase ${isDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              {voiceAccent === 'uk' ? t.uk : t.us}
            </button>
            <div className={`w-px h-3 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            <button onClick={() => setVoiceGender(voiceGender === 'male' ? 'female' : 'male')}
              className={`px-3 py-1 text-[10px] font-bold transition-colors uppercase ${isDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              {voiceGender === 'male' ? t.male : t.female}
            </button>
          </div>

          {/* Formality toggle */}
          <div className={`flex items-center gap-0.5 backdrop-blur-md border p-1 rounded-2xl ${isDark ? 'bg-black/20 border-white/10' : 'bg-white/90 border-black/10'}`}>
            {['informal','formal'].map(m => (
              <button key={m} onClick={() => setFormality(m)}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${formality === m ? isDark ? 'bg-white/18 text-white' : 'bg-gray-100 text-gray-900' : isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'}`}>
                {m === 'informal' ? t.informal : t.formal}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Level + Topic + Delay + Scenario */}
        <div className="flex items-center gap-2">
          {/* Level dropdown */}
          <CallMiniDropdown
            value={chatLevel}
            onChange={setChatLevel}
            options={['A1','A2','B1','B2','C1','C2'].map(l => ({ value: l, label: l }))}
            isDark={isDark}
          />

          {/* Personality / Mode dropdown */}
          <CallMiniDropdown
            value={personality}
            onChange={handlePersonalityChange}
            options={PERSONALITIES.map(p => ({ value: p.id, label: `${p.icon} ${p.label}` }))}
            prefix={lang === 'ar' ? 'الوضعية:' : 'Mode:'}
            isDark={isDark}
          />

          {/* Topic dropdown */}
          <CallMiniDropdown
            value={topic}
            onChange={setTopic}
            options={SPEAKING_TOPICS.map(tp => ({
              value: tp,
              label: lang === 'ar' ? tp.split('(')[0].trim() : (tp.match(/\(([^)]+)\)/)?.[1] || tp)
            }))}
            isDark={isDark}
          />

          {/* Response Delay / Silence Threshold dropdown */}
          <CallMiniDropdown
            value={callSilenceThreshold}
            onChange={v => setCallSilenceThreshold(Number(v))}
            options={[
              { value: 1.5, label: '1.5s' },
              { value: 2.0, label: '2.0s' },
              { value: 3.0, label: '3.0s' },
              { value: 4.0, label: '4.0s' }
            ]}
            prefix={lang === 'ar' ? 'تأخير:' : 'Delay:'}
            isDark={isDark}
          />

          {/* Scenario button */}
          <button onClick={generateScenario} disabled={loadingScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--app-accent1)] text-white text-[11px] font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-sm shadow-[var(--app-accent1)]/30">
            <Lightbulb className="w-3.5 h-3.5" />
            {loadingScenario ? '...' : t.scenario}
          </button>
        </div>
      </div>

      {/* ── Center: blob + transcript ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-9 px-10">

        {/* AI Speaker Avatar — morphs with blob animation, swaps by accent + gender */}
        {(() => {
          const avatarSrc =
            voiceAccent === 'uk'
              ? (voiceGender === 'female' ? avatarUkFemale : avatarUkMale)
              : (voiceGender === 'female' ? avatarUsFemale : avatarUsMale);
          const glowColor = loading
            ? 'shadow-[0_0_32px_8px_rgba(103,58,183,0.55)]'
            : isRecording
              ? 'shadow-[0_0_32px_8px_rgba(255,87,34,0.55)]'
              : isDark
                ? 'shadow-[0_0_24px_4px_rgba(255,255,255,0.08)]'
                : 'shadow-[0_0_24px_4px_rgba(0,0,0,0.10)]';
          return (
            <div className={`w-36 h-36 relative transition-all duration-700 ${blobClass} ${glowColor} overflow-hidden`}>
              <img
                src={avatarSrc}
                alt="AI Speaker"
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Subtle color overlay while speaking/listening */}
              {loading && <div className="absolute inset-0 bg-[var(--app-accent2)]/20 mix-blend-overlay pointer-events-none" />}
              {isRecording && <div className="absolute inset-0 bg-[var(--app-accent1)]/20 mix-blend-overlay pointer-events-none" />}
            </div>
          );
        })()}

        {/* AI transcript — bounded scrollable box with fade-to-top effect */}
        <div className="w-full max-w-md relative px-4" style={{ height: '180px' }}>
          {/* Scrollable transcript list with mask-based fades */}
          <div 
            ref={transcriptScrollRef} 
            className="h-full overflow-y-auto flex flex-col justify-end pb-10 gap-4" 
            style={{ 
              scrollBehavior: 'smooth', 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 85%, transparent 100%)'
            }}
          >
            {showCallTranscript ? (
              messages.filter(m => m.role === 'ai' && m.text).length > 0 || liveUserTranscript ? (
                <>
                  {messages.filter(m => m.role === 'ai' && m.text).map(m => (
                    <div key={m.id} className="text-center px-4 animate-fadeIn">
                      <p className={`text-lg md:text-xl leading-[1.6] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr">
                        {/* Split by common sentence endings but keep them, then map to spans with reveal animation */}
                        {String(m.text).split(/(?<=[.!?])\s+/).map((segment, sIdx) => (
                          <span key={sIdx} className="animate-textReveal inline-block mr-1">
                            {safeRender(segment)}
                          </span>
                        ))}
                        {m.streaming && <span className={`inline-block w-[3px] h-5 ml-1 align-middle animate-pulse rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />}
                      </p>
                    </div>
                  ))}
                  {liveUserTranscript && (
                    <div className="text-center px-4 mt-2 animate-fadeIn">
                      <p className={`text-base md:text-lg leading-[1.6] font-medium opacity-65 italic animate-pulse ${isDark ? 'text-gray-300' : 'text-gray-600'}`} dir="ltr">
                        🎤 {liveUserTranscript}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className={`text-lg font-medium text-center ${isDark ? 'text-white/30' : 'text-black/30'}`}>{t.tapMic}</p>
              )
            ) : (
              <p className={`text-lg font-medium text-center ${isDark ? 'text-white/20' : 'text-black/25'}`}>{_resolveTranslation(lang, 'النص مخفي', 'Transcript off')}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Sesame-style pill control bar ── */}
      <div className="flex justify-center pb-10 pt-4">
        <div className={`inline-flex items-center rounded-2xl px-1.5 py-1.5 gap-0.5 transition-colors duration-300 ${isDark
          ? 'bg-[var(--app-surface)] shadow-[0_2px_20px_rgba(0,0,0,0.5)]'
          : 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)]'
          }`}>
          {/* Mute / Mic button */}
          <button onClick={handleVoiceRecord} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 ${isRecording
            ? isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-500'
            : isDark ? 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}>
            <Mic className={`w-4 h-4 flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`} />
            <span>{isRecording ? _resolveTranslation(lang, 'جاري الاستماع', 'Listening') : _resolveTranslation(lang, 'صامت', 'Mute')}</span>
          </button>

          {/* Divider */}
          <div className={`w-px h-5 mx-0.5 flex-shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />

          {/* Auto-Mic toggle */}
          <button onClick={() => setMicAutoMode(v => !v)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 ${micAutoMode
            ? isDark ? 'text-black dark:text-white bg-[var(--app-accent1)]/10' : 'text-emerald-700 bg-emerald-50'
            : isDark ? 'text-gray-600 hover:bg-white/[0.05] hover:text-gray-400' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}>
            <Zap className={`w-4 h-4 ${micAutoMode ? 'fill-current' : ''}`} />
            <span>{micAutoMode ? _resolveTranslation(lang, 'تلقائي: تشغيل', 'Auto: On') : _resolveTranslation(lang, 'تلقائي: إيقاف', 'Auto: Off')}</span>
          </button>

          {/* Divider */}
          <div className={`w-px h-5 mx-0.5 flex-shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />

          {/* Transcript toggle */}
          <button onClick={() => setShowCallTranscript(v => !v)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 ${showCallTranscript
            ? isDark ? 'text-gray-300 bg-white/[0.06]' : 'text-gray-700 bg-gray-100'
            : isDark ? 'text-gray-600 hover:bg-white/[0.05] hover:text-gray-400' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}>
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>{showCallTranscript ? _resolveTranslation(lang, 'النص: تشغيل', 'Text: On') : _resolveTranslation(lang, 'النص: إيقاف', 'Text: Off')}</span>
          </button>

          {/* Divider */}
          <div className={`w-px h-5 mx-0.5 flex-shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />

          {/* End call button */}
          <button onClick={toggleCallMode} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 ${isDark ? 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}>
            <span className="w-3 h-3 bg-red-500 rounded-[3px] flex-shrink-0" />
            <span>{t.stopCall}</span>
          </button>
        </div>
      </div>
    </div>;
  }
  return (
    <>
      <div className={`w-full flex flex-col animate-fadeIn bg-white dark:bg-black transition-colors overflow-hidden ${isCallMode ? '' : 'border border-gray-100 dark:border-[var(--app-border)] rounded-2xl'}`} style={{ height: 'calc(100vh - 88px)' }}>
        {theme === 'dark' && <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden"><ParticlesBackground /></div>}
        {!isCallMode && (
          <header className="flex-shrink-0 px-6 py-4 border-b border-gray-100 dark:border-[var(--app-border)] flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[var(--app-bg,#0a0a0e)] relative z-20">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-2xl bg-[var(--app-accent1)]/10 text-[var(--app-accent1)]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold">{t.title}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Topic Selector */}
              <CustomDropdown
                value={topic}
                onChange={setTopic}
                options={SPEAKING_TOPICS.map(tp => ({
                  value: tp,
                  label: lang === 'ar' ? tp.split('(')[0].trim() : (tp.match(/\(([^)]+)\)/)?.[1] || tp)
                }))}
                icon={List}
                theme={theme}
                placeholder={t.selectTopic}
                className="w-44"
              />

              {/* Voice Config Pill */}
              <div className="flex h-11 items-center gap-1 bg-gray-50 dark:bg-[var(--app-surface)] p-1 rounded-2xl border border-gray-100 dark:border-[var(--app-border)]">
                <button
                  onClick={() => setVoiceAccent(voiceAccent === 'uk' ? 'us' : 'uk')}
                  className="px-3 h-full flex items-center text-sm font-bold text-gray-500 hover:text-[var(--app-accent1)] transition-colors uppercase"
                >
                  {voiceAccent === 'uk' ? t.uk : t.us}
                </button>
                <div className="w-px h-3 bg-gray-200 dark:bg-[var(--app-card)]" />
                <button
                  onClick={() => setVoiceGender(voiceGender === 'male' ? 'female' : 'male')}
                  className="px-3 h-full flex items-center text-sm font-bold text-gray-500 hover:text-[var(--app-accent1)] transition-colors uppercase"
                >
                  {voiceGender === 'male' ? t.male : t.female}
                </button>
                <div className="w-px h-3 bg-gray-200 dark:bg-[var(--app-card)]" />
                <button
                  onClick={() => setAutoRead(!autoRead)}
                  className={`px-3 h-full flex items-center text-sm font-bold transition-colors ${autoRead ? 'text-[var(--app-accent2)]' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                  title={t.autoPlay}
                >
                  <Volume2 size={16} />
                </button>
              </div>

              {/* Formality Toggle */}
              <div className="flex h-11 bg-gray-50 dark:bg-[var(--app-surface)] p-1 rounded-2xl border border-gray-100 dark:border-[var(--app-border)]">
                {['informal', 'formal'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFormality(mode)}
                    className={`px-4 h-full flex items-center text-sm font-bold rounded-xl transition-all ${formality === mode ? 'glass-panel text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    {mode === 'informal' ? t.informal : t.formal}
                  </button>
                ))}
              </div>

              <CustomDropdown
                value={chatLevel}
                onChange={setChatLevel}
                options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => ({ value: lvl, label: `${t.level} ${lvl}` }))}
                theme={theme}
                className="w-28"
              />

              <button onClick={generateScenario} disabled={loadingScenario} className="flex h-11 items-center gap-2 px-5 rounded-2xl bg-[var(--app-accent1)] text-white text-sm font-bold hover:opacity-90 transition-all shadow-sm shadow-[var(--app-accent1)]/10 disabled:opacity-50">
                <Lightbulb size={16} />
                {loadingScenario ? '...' : t.scenario}
              </button>

              <button onClick={toggleCallMode} className="flex h-11 items-center gap-2 px-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:opacity-90 transition-all shadow-sm">
                <Phone size={16} />
                {t.callMode}
              </button>

              <div className="flex h-11 items-center bg-gray-50 dark:bg-[var(--app-surface)] p-1 rounded-2xl border border-gray-100 dark:border-[var(--app-border)]">
                <button
                  onClick={() => setShowHistoryPanel(v => !v)}
                  title={_resolveTranslation(lang, 'المحفوظات والسجل', 'Saved & History')}
                  className={`px-3 h-full flex items-center rounded-xl transition-colors ${showHistoryPanel ? 'glass-panel text-[var(--app-accent1)]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Clock size={16} />
                </button>
                {messages.length > 1 && (
                  <>
                    <div className="w-px h-4 bg-gray-200 dark:bg-[var(--app-card)]" />
                    <button
                      onClick={toggleFavorite}
                      title={isFavorited ? _resolveTranslation(lang, 'إزالة من المفضلة', 'Remove from favorites') : _resolveTranslation(lang, 'حفظ في المفضلة', 'Save to favorites')}
                      className={`px-3 h-full flex items-center rounded-xl transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                    >
                      <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                  </>
                )}
                <div className="w-px h-4 bg-gray-200 dark:bg-[var(--app-card)]" />
                <button onClick={startNewConversation} title={t.newChat} className="px-3 h-full flex items-center rounded-xl text-gray-400 hover:text-[var(--app-accent1)] transition-colors">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* ── Scrollable messages area — only this part scrolls ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-transparent scroll-smooth relative z-10">

          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slideUp`} style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className={`max-w-[85%] md:max-w-[75%] p-4 lg:p-5 rounded-2xl ${msg.role === 'user'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : msg.role === 'system'
                  ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 w-full text-center'
                  : 'bg-gray-50 dark:bg-[var(--app-surface)] border border-gray-100 dark:border-[var(--app-border)] text-gray-900 dark:text-white'
                }`} dir="auto">
                <p className="text-base lg:text-lg leading-relaxed whitespace-pre-wrap">
                  {msg.role === 'user' ? renderAnnotatedText(safeRender(msg.text), msg.review) : safeRender(msg.text)}
                  {msg.streaming && <span className="inline-block w-1 h-5 bg-[var(--app-accent1)] ml-1 align-middle animate-pulse rounded-full" />}
                </p>

                {msg.role === 'ai' && !msg.streaming && (
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-100 dark:border-[var(--app-card)] pt-3">
                    <button onClick={() => speakText(msg.text)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[var(--app-card)] text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                      <Volume2 className="w-4.5 h-4.5" />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[var(--app-card)] text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                      <Copy className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && msg.review && (
                <div className="mt-2 max-w-[85%] md:max-w-[70%] bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-2xl overflow-hidden animate-fadeIn transition-colors">
                  <button onClick={() => setExpandedReviewId(expandedReviewId === msg.id ? null : msg.id)} className="w-full px-4 py-3 bg-gray-50 dark:bg-[var(--app-card)] hover:bg-gray-100 dark:hover:bg-[var(--app-surface)] flex justify-between items-center text-sm font-bold text-gray-700 dark:text-[var(--app-text)] transition-colors">
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-[#FF4081]">
                      <CheckCircle2 className="w-4 h-4" /> {t.corrected}
                      {msg.review.grammar_errors?.length > 0 && <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">{msg.review.grammar_errors.length} grammar</span>}
                      {msg.review.pronunciation_errors?.length > 0 && <span className="text-[10px] bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold">{msg.review.pronunciation_errors.length} pronunciation</span>}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedReviewId === msg.id ? 'rotate-90' : ''}`} />
                  </button>

                  {expandedReviewId === msg.id && (
                    <div className="p-4 space-y-4 border-t border-gray-200 dark:border-[var(--app-border)]">
                      {/* Scores */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-gray-50 dark:bg-[var(--app-surface)] p-3 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]">
                          <p className="text-xs text-gray-500 mb-1 font-bold">{t.clarity}</p>
                          <p className="text-sm text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.clarity)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[var(--app-surface)] p-3 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]">
                          <p className="text-xs text-gray-500 mb-1 font-bold">{t.grammar}</p>
                          <p className="text-sm text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.grammar)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[var(--app-surface)] p-3 rounded-2xl border border-gray-200 dark:border-[var(--app-border)]">
                          <p className="text-xs text-gray-500 mb-1 font-bold">{t.fluency}</p>
                          <p className="text-sm text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.fluency)}</p>
                        </div>
                      </div>

                      {/* Grammar Errors */}
                      {msg.review.grammar_errors?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> Grammar Errors
                          </h4>
                          {msg.review.grammar_errors.map((err, ei) => (
                            <div key={ei} className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-red-600 dark:text-red-400" style={{ textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: '#ef4444' }}>{err.word}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{err.correction}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{err.explanation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pronunciation Errors */}
                      {msg.review.pronunciation_errors?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500" /> Pronunciation
                          </h4>
                          {msg.review.pronunciation_errors.map((err, ei) => (
                            <div key={ei} className="flex items-start justify-between gap-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-3 rounded-xl">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400" style={{ textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: '#f97316' }}>{err.word}</span>
                                  {err.phonetic && <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-black/20 px-1.5 py-0.5 rounded">/{err.phonetic}/</span>}
                                </div>
                                {err.tip && <p className="text-xs text-gray-600 dark:text-gray-400">{err.tip}</p>}
                              </div>
                              <button onClick={() => speakText(err.word)} title="Hear correct pronunciation"
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors">
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Native way */}
                      <div className="bg-emerald-50 dark:bg-[var(--app-accent1)]/10 p-4 rounded-2xl border border-emerald-100 dark:border-[var(--app-accent1)]/20 relative">
                        <h4 className="text-sm font-bold text-emerald-700 dark:text-[#FF4081] mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" /> {t.native}
                        </h4>
                        <p className="text-lg text-gray-900 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(msg.review.native_way)}"</p>
                        <div className="mt-4 flex gap-3">
                          <button onClick={() => speakText(safeRender(msg.review.native_way))} className="bg-[var(--app-accent1)] hover:opacity-90 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                            <Play className="w-4 h-4" /> {t.listen}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] p-5 rounded-2xl rounded-bl-none flex items-center gap-3 shadow-sm">
                <div className="w-2 h-2 bg-[var(--app-accent1)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--app-accent1)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[var(--app-accent1)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ── Fixed bottom section — input, personality panel, history, call review (never scrolls) ── */}
        <div className="flex-shrink-0 relative z-20">
        <div className="px-4 py-4 border-t border-gray-100 dark:border-[var(--app-border)] bg-white dark:bg-[var(--app-bg,#0a0a0e)] transition-colors">
          {/* Personality Panel */}
          {showPersonalityPanel && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-[var(--app-surface)] border border-gray-100 dark:border-[var(--app-border)] rounded-2xl animate-fadeIn max-h-[420px] overflow-y-auto custom-scrollbar">
              {/* Header row with Speed controls */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">AI Personality</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Speed</span>
                  {[0.75, 1.0, 1.25, 1.5].map(s => (
                    <button key={s} onClick={() => setPlaybackSpeed(s)}
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg transition-all ${playbackSpeed === s ? 'bg-[var(--app-accent1)] text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}>
                      {s}x
                    </button>
                  ))}
                  <button
                    onClick={() => setShowPersonalityPanel(false)}
                    className="ml-1 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all text-base leading-none"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Standard & Roleplay ── */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 mt-1">🛠️ Standard &amp; Roleplay</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3">
                {PERSONALITIES.filter(p => p.category === 'standard').map(p => (
                  <button key={p.id} onClick={() => handlePersonalityChange(p.id)}
                    title={p.desc}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${personality === p.id
                      ? 'bg-[var(--app-accent1)]/10 border-[var(--app-accent1)]/50 text-[var(--app-accent1)]'
                      : 'border-transparent bg-white dark:bg-[var(--app-card)] text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-white/10 hover:text-gray-900 dark:hover:text-white'}`}>
                    <span className="text-base">{p.icon}</span>
                    <span className="text-[9px] font-bold leading-none">{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom prompt input — shown only when 'custom' selected */}
              {personality === 'custom' && (
                <div className="mb-3 animate-fadeIn flex flex-col gap-2">
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="Describe the persona… e.g. 'You are a sarcastic pirate who loves maths.'"
                    rows={2}
                    className="w-full bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 resize-none outline-none focus:border-[var(--app-accent1)]/50 transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (!customPrompt.trim()) return;
                      generateDynamicOpener('custom', topic, customPrompt);
                    }}
                    disabled={!customPrompt.trim()}
                    className="self-end px-3 py-1.5 rounded-xl bg-[var(--app-accent1)] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-[var(--app-accent1)]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply &amp; Generate Question
                  </button>
                </div>
              )}

              {/* ── Kids-Friendly ── */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1.5">👶 Kids-Friendly</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3">
                {PERSONALITIES.filter(p => p.category === 'kids').map(p => (
                  <button key={p.id} onClick={() => handlePersonalityChange(p.id)}
                    title={p.desc}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${personality === p.id
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent bg-white dark:bg-[var(--app-card)] text-gray-600 dark:text-gray-400 hover:border-emerald-200 dark:hover:border-emerald-500/20 hover:text-emerald-600'}`}>
                    <span className="text-base">{p.icon}</span>
                    <span className="text-[9px] font-bold leading-none">{p.label}</span>
                  </button>
                ))}
              </div>

              {/* ── Mature / Experimental ── */}
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">🔞 Mature / Experimental</p>
                {!matureUnlocked && (
                  <button
                    onClick={() => {
                      if (window.confirm('This section contains 18+ content. Confirm you are an adult?')) {
                        setMatureUnlocked(true);
                      }
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                  >
                    Unlock 🔓
                  </button>
                )}
                {matureUnlocked && (
                  <button
                    onClick={() => { setMatureUnlocked(false); if (PERSONALITIES.find(p => p.id === personality)?.mature) handlePersonalityChange('assistant'); }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-rose-500 transition-all"
                  >
                    Lock 🔒
                  </button>
                )}
              </div>
              {!matureUnlocked ? (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
                  <span>🔒</span>
                  <span>Tap <strong>Unlock</strong> to access 18+ personas. Adults only.</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {PERSONALITIES.filter(p => p.category === 'mature').map(p => (
                    <button key={p.id} onClick={() => handlePersonalityChange(p.id)}
                      title={p.desc}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${personality === p.id
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-500'
                        : 'border-transparent bg-white dark:bg-[var(--app-card)] text-gray-600 dark:text-gray-400 hover:border-rose-200 dark:hover:border-rose-500/20 hover:text-rose-500'}`}>
                      <span className="text-base">{p.icon}</span>
                      <span className="text-[9px] font-bold leading-none">{p.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grok-style input bar */}
          <div className="max-w-3xl mx-auto">
            <div className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${
              isRecording
                ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20'
                : 'bg-gray-50 dark:bg-[rgba(255,255,255,0.05)] border-gray-200 dark:border-white/10 focus-within:border-gray-300 dark:focus-within:border-white/20'
            }`}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isRecording ? _resolveTranslation(lang, 'جاري الاستماع...', 'Listening...') : t.placeholder}
                className="w-full bg-transparent border-none text-gray-900 dark:text-white text-base px-1 py-1 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                dir="auto"
                disabled={loading}
              />
              <div className="flex items-center justify-between">
                {/* Left controls */}
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowPersonalityPanel(v => !v)}
                    title="Personality & Speed"
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all text-base relative ${showPersonalityPanel ? 'bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    {PERSONALITIES.find(p => p.id === personality)?.icon || '🎓'}
                    {PERSONALITIES.find(p => p.id === personality)?.mature && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-black" />
                    )}
                    {PERSONALITIES.find(p => p.id === personality)?.category === 'kids' && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-black" />
                    )}
                  </button>
                  <button onClick={handleVoiceRecord}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <Mic className="w-4 h-4" />
                  </button>
                  {isRecording && (
                    <span className="text-xs text-rose-500 font-bold animate-pulse">● {_resolveTranslation(lang, 'يستمع', 'Recording')}</span>
                  )}
                </div>
                {/* Right controls */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium flex items-center gap-1">
                    {PERSONALITIES.find(p => p.id === personality)?.icon}{' '}
                    {PERSONALITIES.find(p => p.id === personality)?.label}
                    {PERSONALITIES.find(p => p.id === personality)?.mature && <span className="text-rose-400 text-[9px]">18+</span>}
                    {PERSONALITIES.find(p => p.id === personality)?.category === 'kids' && <span className="text-emerald-400 text-[9px]">👶</span>}
                    {' '}· {playbackSpeed}x
                  </span>
                  <button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${loading || !input.trim() ? 'text-gray-300 dark:text-gray-500' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'}`}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Call Review — inside fixed bottom, scrollable within its own box ── */}
        {callReview && <div className="mx-4 mb-3 glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl overflow-hidden animate-fadeIn max-h-48 overflow-y-auto">
          <div className="bg-[var(--app-accent1)] p-4 text-white flex justify-between items-center">
            <h3 className="font-extrabold text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Call Corrections Review</h3>
            <button onClick={() => setCallReview(null)} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            {callReview.map((msg, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl border border-gray-200 dark:border-[var(--app-border)]">
                <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider mb-2">You said:</p>
                <p className="text-gray-900 dark:text-[var(--app-text)] font-medium mb-3" dir="ltr">"{safeRender(msg.text)}"</p>
                {msg.review && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {msg.review.grammar && <div className="p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-2xl"><p className="font-bold text-red-600 dark:text-red-400 text-xs mb-1">Grammar</p><p className="text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.grammar)}</p></div>}
                  {msg.review.clarity && <div className="p-2.5 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30 rounded-2xl"><p className="font-bold text-[#FF4081] dark:text-[#FF4081] text-xs mb-1">Clarity</p><p className="text-gray-800 dark:text-[var(--app-text)]">{safeRender(msg.review.clarity)}</p></div>}
                  {msg.review.native_way && <div className="p-2.5 bg-emerald-50 dark:bg-[var(--app-accent1)]/10 border border-[#FF4081]/30 dark:border-[var(--app-accent1)]/30 rounded-2xl"><p className="font-bold text-emerald-600 dark:text-[#FF4081] text-xs mb-1">Native way</p><p className="text-gray-800 dark:text-[var(--app-text)] italic">"{safeRender(msg.review.native_way)}"</p></div>}
                </div>}
              </div>
            ))}
          </div>
        </div>}

        {showHistoryPanel && (
          <div className="border-t border-gray-100 dark:border-[var(--app-border)] animate-fadeIn" style={{ background: theme === 'dark' ? '#0A0A0E' : '#ffffff' }}>
            {/* Tabs selector */}
            <div className="flex border-b border-black/5 dark:border-white/5 px-4 pt-3 pb-2 gap-4">
              <button
                onClick={() => setPanelTab('favorites')}
                className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                  panelTab === 'favorites'
                    ? 'border-[var(--app-accent1)] text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {_resolveTranslation(lang, 'المحفوظات', 'Saved')} ({favorites.length})
              </button>
              <button
                onClick={() => setPanelTab('history')}
                className={`text-xs font-bold pb-1 border-b-2 transition-all ${
                  panelTab === 'history'
                    ? 'border-[var(--app-accent1)] text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {_resolveTranslation(lang, 'الأخيرة', 'Recent')} ({speakingHistory.length})
              </button>
              <button
                onClick={() => {
                  if (panelTab === 'favorites') {
                    setFavorites([]);
                  } else {
                    setSpeakingHistory([]);
                  }
                }}
                className="ml-auto text-xs font-bold text-red-400 hover:text-red-300 transition-all"
              >
                {_resolveTranslation(lang, 'مسح الكل', 'Clear all')}
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto p-4 pt-2 pr-5">
              {(panelTab === 'favorites' ? favorites : speakingHistory).length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">{_resolveTranslation(lang, 'لا توجد عناصر.', 'No items found.')}</p>
              ) : (
                (panelTab === 'favorites' ? favorites : speakingHistory).map((item) => {
                  return (
                    <div key={item.id} className={`flex items-start justify-between gap-3 p-3 rounded-2xl transition-all ${
                      theme === 'dark' ? 'bg-white/3 hover:bg-white/5' : 'bg-black/2 hover:bg-black/4'
                    }`} dir="ltr">
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-[var(--app-accent1)]/15 text-[var(--app-accent1)]">
                            {item.mode} | {item.level}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(item.createdAt || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {item.title || item.topic}
                        </p>
                        <p className="text-xs mt-1 text-[var(--app-accent1)] font-medium line-clamp-2">
                          {item.summary || (item.messages && item.messages[item.messages.length - 1]?.text)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setMessages(item.messages || []);
                            setTopic(item.topic || SPEAKING_TOPICS[0]);
                            setChatLevel(item.level || userLevel);
                            setIsCallMode(item.mode === 'call');
                            setShowHistoryPanel(false);
                          }}
                          title={_resolveTranslation(lang, 'تحميل', 'Load')}
                          className={`p-1.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800'}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (panelTab === 'favorites') {
                              setFavorites(prev => prev.filter(x => x.id !== item.id));
                            } else {
                              setSpeakingHistory(prev => prev.filter(x => x.id !== item.id));
                            }
                          }}
                          title={_resolveTranslation(lang, 'حذف', 'Delete')}
                          className={`p-1.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-500 hover:text-red-400' : 'hover:bg-black/5 text-gray-400 hover:text-red-500'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        </div>{/* end fixed bottom section */}
      </div>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// TEST GENERATOR  — all 22 ozdic question types
// ─────────────────────────────────────────────────────────────────────────────
function TestGenerator({ AI_KEY, userLevel, lang, theme, sessions: propSessions, setSessions: propSetSessions }) {
  const isDark = theme === 'dark';
  const t = lang === 'ar';

  // ── filter state ──────────────────────────────────────────────────────────
  const [skill,      setSkill]      = useState('any');
  const [framework,  setFramework]  = useState('any');
  const [qType,      setQType]      = useState('any');
  const [level,      setLevel]      = useState(userLevel || 'B1');
  const [itemCount,  setItemCount]  = useState(6);

  // ── session state ─────────────────────────────────────────────────────────
  const [phase,     setPhase]     = useState('config');   // config | loading | session | results
  const [questions, setQuestions] = useState([]);
  const [answers,   setAnswers]   = useState({});
  const [localSessions, setLocalSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa-test-sessions') || '[]'); } catch { return []; }
  });
  const sessions = propSessions !== undefined ? propSessions : localSessions;
  const setSessions = propSetSessions !== undefined ? propSetSessions : setLocalSessions;

  // drag-and-drop internal state per question id
  const [dragArranged, setDragArranged] = useState({});  // id -> [words arranged so far]
  const [dragPool,     setDragPool]     = useState({});  // id -> [remaining pool]

  // ── static data ───────────────────────────────────────────────────────────
  const SKILLS = [
    { v:'any', en:'Any Skill', ar:'أي مهارة' },
    { v:'grammar', en:'Grammar', ar:'قواعد' },
    { v:'reading', en:'Reading', ar:'قراءة' },
    { v:'vocabulary', en:'Vocabulary', ar:'مفردات' },
  ];
  const FRAMEWORKS = [
    { v:'any', en:'Any Framework', ar:'أي إطار' },
    { v:'general', en:'General English', ar:'إنجليزي عام' },
    { v:'PTE', en:'PTE', ar:'PTE' },
    { v:'IELTS', en:'IELTS', ar:'IELTS' },
    { v:'TOEFL', en:'TOEFL', ar:'TOEFL' },
    { v:'Cambridge', en:'Cambridge', ar:'كامبريدج' },
  ];
  const Q_TYPES = [
    { v:'any',                     en:'Any Type',                  ar:'أي نوع' },
    { v:'fill-in-the-blank',       en:'Fill in the Blank',         ar:'أكمل الفراغ' },
    { v:'context-meaning',         en:'Context Meaning',           ar:'معنى السياق' },
    { v:'synonym',                 en:'Synonym',                   ar:'مرادف' },
    { v:'definition',              en:'Definition',                ar:'تعريف' },
    { v:'antonym',                 en:'Antonym',                   ar:'مضاد' },
    { v:'idiom-meaning',           en:'Idiom Meaning',             ar:'معنى التعبير' },
    { v:'idiom-completion',        en:'Idiom Completion',          ar:'إكمال التعبير' },
    { v:'preposition',             en:'Preposition',               ar:'حرف جر' },
    { v:'multiple-choice',         en:'Multiple Choice',           ar:'اختيار متعدد' },
    { v:'drag-and-drop',           en:'Drag and Drop',             ar:'رتب الكلمات' },
    { v:'dropdown-fill-in',        en:'Dropdown Fill-in',          ar:'قائمة الإكمال' },
    { v:'multi-select',            en:'Multi-select',              ar:'تحديد متعدد' },
    { v:'true-false-not-given',    en:'True / False / Not Given',  ar:'صح / خطأ / غير مذكور' },
    { v:'re-order-paragraphs',     en:'Re-order Paragraphs',       ar:'رتب الفقرات' },
    { v:'MC-cloze',                en:'MC Cloze',                  ar:'فراغات بخيارات' },
    { v:'open-cloze',              en:'Open Cloze',                ar:'فراغات مفتوحة' },
    { v:'word-formation',          en:'Word Formation',            ar:'تصريف الكلمة' },
    { v:'key-word-transformation', en:'Key Word Transformation',   ar:'تحويل الجملة' },
    { v:'gapped-text',             en:'Gapped Text',               ar:'نص بفراغات' },
    { v:'matching-headings',       en:'Matching Headings',         ar:'مطابقة العناوين' },
    { v:'summary-completion',      en:'Summary Completion',        ar:'إكمال الملخص' },
    { v:'matching-information',    en:'Matching Information',      ar:'مطابقة المعلومات' },
  ];
  const LEVELS = [
    { v:'any', en:'Any Level', ar:'أي مستوى' },
    { v:'A1',  en:'A1 – Beginner',           ar:'A1 – مبتدئ' },
    { v:'A2',  en:'A2 – Elementary',         ar:'A2 – أساسي' },
    { v:'B1',  en:'B1 – Pre-Intermediate',   ar:'B1 – تحت المتوسط' },
    { v:'B2',  en:'B2 – Upper-Intermediate', ar:'B2 – فوق المتوسط' },
    { v:'C1',  en:'C1 – Advanced',           ar:'C1 – متقدم' },
  ];
  const COUNTS = [6, 12, 18, 24];

  const lbl = obj => t ? obj.ar : obj.en;

  // ── AI prompt ─────────────────────────────────────────────────────────────
  const buildPrompt = () => {
    const skillTxt = skill === 'any' ? 'a balanced mix of grammar, vocabulary, and reading' : skill;
    const fwkTxt   = framework === 'any' ? 'general English proficiency' : `${framework} exam`;
    const lvlTxt   = level === 'any' ? 'B1-B2' : level;
    const typeLine = qType === 'any'
      ? 'Use a VARIED mix of these types: fill-in-the-blank, context-meaning, synonym, definition, antonym, idiom-meaning, preposition, multiple-choice, multi-select, word-formation, open-cloze, true-false-not-given, drag-and-drop, dropdown-fill-in, re-order-paragraphs, MC-cloze, key-word-transformation, matching-headings, summary-completion, matching-information, gapped-text, idiom-completion'
      : `Use ONLY this question type: ${qType}`;

    return `You are an expert English language test creator. Generate exactly ${itemCount} practice questions for ${fwkTxt}, focusing on ${skillTxt}, CEFR level ${lvlTxt}. ${typeLine}.

Return ONLY a valid JSON object with a single key "questions" containing an array. No markdown, no code fences, no comments.

Base fields every question MUST have:
{ "id": <1..${itemCount}>, "type": <string>, "skill": "grammar"|"vocabulary"|"reading", "level": "<CEFR>", "instruction": "<brief student instruction>", "explanation": "<short answer explanation>" }

TYPE-SPECIFIC extra fields — add exactly these per type:

fill-in-the-blank:       "sentence": "...___...", "answer": "word", "options": ["a","b","c","d"]
context-meaning:         "passage": "paragraph with targetWord", "targetWord": "word", "question": "What does X mean here?", "options": ["a","b","c","d"], "answer": "opt"
synonym:                 "word": "w", "options": ["a","b","c","d"], "answer": "synonym"
definition:              "definition": "text", "options": ["w1","w2","w3","w4"], "answer": "word"
antonym:                 "word": "w", "options": ["a","b","c","d"], "answer": "antonym"
idiom-meaning:           "idiom": "phrase", "options": ["a","b","c","d"], "answer": "meaning"
idiom-completion:        "partial": "partial idiom with _____", "options": ["a","b","c","d"], "answer": "word"
preposition:             "sentence": "...___...", "options": ["at","in","on","for","of","to","by","with"], "answer": "prep"
multiple-choice:         "question": "q", "options": ["A) x","B) x","C) x","D) x"], "answer": "A) x"
drag-and-drop:           "words": ["w1","w2","w3","w4","w5","w6"], "answer": "The correct full sentence."
dropdown-fill-in:        "template": "Text [0] more [1] end.", "slots": [{"options":["a","b","c"],"answer":"a"},{"options":["x","y","z"],"answer":"y"}]
multi-select:            "question": "q (select ALL that apply)", "options": ["a","b","c","d","e"], "answers": ["a","c"]
true-false-not-given:    "passage": "paragraph", "statements": [{"text":"s1","answer":"True"},{"text":"s2","answer":"False"},{"text":"s3","answer":"Not Given"}]
re-order-paragraphs:     "paragraphs": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}], "correctOrder": ["B","A","D","C"]
MC-cloze:                "passage": "text with [0] blank [1].", "blanks": [{"options":["a","b","c","d"],"answer":"a"},{"options":["w","x","y","z"],"answer":"z"}]
open-cloze:              "passage": "text with _____(1) and _____(2).", "answers": ["word1","word2"]
word-formation:          "sentence": "sentence with _____ (BASE).", "baseWord": "BASE", "answer": "formed_word"
key-word-transformation: "original": "sentence.", "keyword": "WORD", "answer": "rewritten sentence using WORD"
gapped-text:             "passage": "text [GAP_A] more [GAP_B].", "sentences": [{"id":"A","text":"sent"},{"id":"B","text":"sent"},{"id":"C","text":"distractor"},{"id":"D","text":"distractor"}], "answers": {"GAP_A":"C","GAP_B":"A"}
matching-headings:       "paragraphs": [{"id":"1","text":"para"},{"id":"2","text":"para"},{"id":"3","text":"para"}], "headings": [{"id":"A","text":"h"},{"id":"B","text":"h"},{"id":"C","text":"h"},{"id":"D","text":"extra"}], "answers": {"1":"B","2":"A","3":"C"}
summary-completion:      "passage": "source text", "summary": "summary with _____(1) and _____(2).", "wordBank": ["w1","w2","w3","w4","w5","w6"], "answers": ["w1","w3"]
matching-information:    "paragraphs": [{"id":"A","text":"para"},{"id":"B","text":"para"},{"id":"C","text":"para"}], "statements": [{"text":"s1","answer":"B"},{"text":"s2","answer":"A"},{"text":"s3","answer":"C"}]

Make questions natural, educational, and appropriate for ${lvlTxt} learners. Return ONLY the JSON object.`;
  };

  // ── helpers ───────────────────────────────────────────────────────────────
  const updateAnswer = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }));

  const calculateScore = () => {
    let correct = 0, total = 0;
    questions.forEach(q => {
      const ua = answers[q.id];
      if (q.type === 'multi-select') {
        total++;
        const cs = new Set(q.answers || []);
        const us = new Set(ua || []);
        if (cs.size === us.size && [...cs].every(x => us.has(x))) correct++;
      } else if (q.type === 'true-false-not-given') {
        (q.statements || []).forEach((s, i) => { total++; if ((ua?.[i]||'').toLowerCase() === s.answer.toLowerCase()) correct++; });
      } else if (q.type === 'dropdown-fill-in') {
        (q.slots || []).forEach((sl, i) => { total++; if ((ua?.[i]||'').toLowerCase() === sl.answer.toLowerCase()) correct++; });
      } else if (q.type === 'MC-cloze') {
        (q.blanks || []).forEach((bl, i) => { total++; if ((ua?.[i]||'').toLowerCase() === bl.answer.toLowerCase()) correct++; });
      } else if (q.type === 'open-cloze' || q.type === 'summary-completion') {
        (q.answers || []).forEach((ans, i) => { total++; if ((ua?.[i]||'').trim().toLowerCase() === ans.toLowerCase()) correct++; });
      } else if (q.type === 'matching-headings') {
        Object.entries(q.answers || {}).forEach(([k, v]) => { total++; if ((ua?.[k]||'') === v) correct++; });
      } else if (q.type === 'matching-information') {
        (q.statements || []).forEach((s, i) => { total++; if ((ua?.[i]||'') === s.answer) correct++; });
      } else if (q.type === 're-order-paragraphs') {
        total++;
        if (JSON.stringify(ua) === JSON.stringify(q.correctOrder)) correct++;
      } else if (q.type === 'gapped-text') {
        Object.entries(q.answers || {}).forEach(([g, sid]) => { total++; if ((ua?.[g]||'') === sid) correct++; });
      } else {
        total++;
        if ((ua||'').trim().toLowerCase() === (q.answer||'').trim().toLowerCase()) correct++;
      }
    });
    return { correct, total };
  };

  const isCorrect = (q) => {
    const ua = answers[q.id];
    if (q.type === 'multi-select') {
      const cs = new Set(q.answers || []);
      const us = new Set(ua || []);
      return cs.size === us.size && [...cs].every(x => us.has(x));
    }
    if (q.type === 'true-false-not-given')
      return (q.statements||[]).every((s,i) => (ua?.[i]||'').toLowerCase() === s.answer.toLowerCase());
    if (q.type === 'dropdown-fill-in')
      return (q.slots||[]).every((sl,i) => (ua?.[i]||'').toLowerCase() === sl.answer.toLowerCase());
    if (q.type === 'MC-cloze')
      return (q.blanks||[]).every((bl,i) => (ua?.[i]||'').toLowerCase() === bl.answer.toLowerCase());
    if (q.type === 'open-cloze' || q.type === 'summary-completion')
      return (q.answers||[]).every((ans,i) => (ua?.[i]||'').trim().toLowerCase() === ans.toLowerCase());
    if (q.type === 'matching-headings')
      return Object.entries(q.answers||{}).every(([k,v]) => (ua?.[k]||'') === v);
    if (q.type === 'matching-information')
      return (q.statements||[]).every((s,i) => (ua?.[i]||'') === s.answer);
    if (q.type === 're-order-paragraphs')
      return JSON.stringify(ua) === JSON.stringify(q.correctOrder);
    if (q.type === 'gapped-text')
      return Object.entries(q.answers||{}).every(([g,sid]) => (ua?.[g]||'') === sid);
    return (ua||'').trim().toLowerCase() === (q.answer||'').trim().toLowerCase();
  };

  // ── generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setPhase('loading');
    setQuestions([]);
    setAnswers({});
    setDragArranged({});
    setDragPool({});
    try {
      const raw  = await fetchFromGemini(buildPrompt(), AI_KEY, 4000);
      const data = parseGeminiJSON(raw);
      const qs   = data?.questions;
      if (Array.isArray(qs) && qs.length > 0) {
        // init drag state
        const initArranged = {}, initPool = {};
        qs.forEach(q => {
          if (q.type === 'drag-and-drop') {
            initArranged[q.id] = [];
            initPool[q.id]     = [...(q.words || [])].sort(() => Math.random() - 0.5);
          }
        });
        setDragArranged(initArranged);
        setDragPool(initPool);
        setQuestions(qs);
        setPhase('session');
      } else {
        setPhase('config');
        alert(t ? 'تعذّر توليد الأسئلة. حاول مجدداً.' : 'Could not generate questions. Please try again.');
      }
    } catch {
      setPhase('config');
    }
  };

  const handleSubmit = () => {
    const { correct, total } = calculateScore();
    setPhase('results');
    const sess = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      skill: skill === 'any' ? 'Mixed' : skill,
      framework: framework === 'any' ? 'General' : framework,
      qType: qType === 'any' ? 'Mixed' : qType,
      level: level === 'any' ? 'Mixed' : level,
      count: questions.length,
      correct,
      total,
    };
    const updated = [sess, ...sessions].slice(0, 10);
    setSessions(updated);
    if (propSessions === undefined) {
      localStorage.setItem('venoxa-test-sessions', JSON.stringify(updated));
    }
  };

  // ── shared style helpers ──────────────────────────────────────────────────
  const panelCls  = 'glass-panel rounded-2xl border border-gray-200 dark:border-[var(--app-border)] p-5';
  const inputBase = 'w-full rounded-xl border border-gray-200 dark:border-[var(--app-border)] bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-accent1)]/40';
  const selectCls = `${inputBase} cursor-pointer`;
  const optionBtn = (active, correct_, wrong_) =>
    `w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer
     ${correct_ ? 'bg-green-50 dark:bg-green-500/15 border-green-400 text-green-700 dark:text-green-300'
     : wrong_   ? 'bg-red-50 dark:bg-red-500/15 border-red-400 text-red-700 dark:text-red-300'
     : active   ? 'bg-[var(--app-accent1)]/15 border-[var(--app-accent1)] text-gray-900 dark:text-white'
     :             'bg-white dark:bg-[var(--app-surface)] border-gray-200 dark:border-[var(--app-border)] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`;

  // ── QUESTION RENDERERS ────────────────────────────────────────────────────
  const renderQuestion = (q, idx) => {
    const ua        = answers[q.id];
    const submitted = phase === 'results';
    const correct   = submitted ? isCorrect(q) : false;
    const typeLabel = Q_TYPES.find(x => x.v === q.type)?.[t ? 'ar' : 'en'] || q.type;

    // MC-style (fill-in-the-blank, synonym, definition, antonym, context-meaning,
    // idiom-meaning, idiom-completion, preposition, multiple-choice)
    const renderMC = (prompt, opts, correctAns) => (
      <div className="space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium">{prompt}</p>
        <div className="grid gap-2 mt-3">
          {(opts||[]).map((opt, i) => {
            const isActive   = ua === opt;
            const isCorrect_ = submitted && opt === correctAns;
            const isWrong_   = submitted && isActive && opt !== correctAns;
            return (
              <button key={i} disabled={submitted}
                className={optionBtn(isActive, isCorrect_, isWrong_)}
                onClick={() => updateAnswer(q.id, opt)}>
                <span className="opacity-50 mr-2">{String.fromCharCode(65+i)}.</span>{opt}
              </button>
            );
          })}
        </div>
        {submitted && (
          <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
            {correct ? '✓ Correct' : `✗ Correct answer: ${correctAns}`}
            {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
          </div>
        )}
      </div>
    );

    const renderFillBlank = () => {
      const parts = (q.sentence || '').split('_____');
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {parts[0]}<span className="inline-block w-24 border-b-2 border-[var(--app-accent1)] mx-1 align-bottom" />{parts[1]}
          </p>
          {renderMC('Choose the correct word:', q.options, q.answer)}
        </div>
      );
    };

    const renderOpenInput = (label, correctAns, ansKey = null) => {
      const val = ansKey !== null ? (ua?.[ansKey] || '') : (ua || '');
      const upd = v => ansKey !== null ? updateAnswer(q.id, { ...(ua||{}), [ansKey]: v }) : updateAnswer(q.id, v);
      const isRight = submitted && val.trim().toLowerCase() === (correctAns||'').toLowerCase();
      const isWrng  = submitted && !isRight;
      return (
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
          <input disabled={submitted} value={val} onChange={e => upd(e.target.value)}
            className={`${inputBase} ${isRight ? 'border-green-400 bg-green-50 dark:bg-green-500/10' : isWrng ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : ''}`}
            placeholder={t ? 'اكتب إجابتك...' : 'Type your answer...'} />
          {submitted && (
            <p className={`text-xs mt-1 ${isRight ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isRight ? '✓' : `✗ ${correctAns}`}
            </p>
          )}
        </div>
      );
    };

    const renderContextMeaning = () => (
      <div className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t ? 'اقرأ الفقرة' : 'Read the passage'}</p>
        <div className="bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 leading-relaxed border border-gray-200 dark:border-[var(--app-border)]">
          {(q.passage||'').split(new RegExp(`(${q.targetWord})`, 'gi')).map((part, i) =>
            part.toLowerCase() === (q.targetWord||'').toLowerCase()
              ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 px-0.5 rounded">{part}</mark>
              : <span key={i}>{part}</span>
          )}
        </div>
        {renderMC(q.question || `What does "${q.targetWord}" mean in this context?`, q.options, q.answer)}
      </div>
    );

    const renderMultiSelect = () => {
      const selected = ua || [];
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-relaxed">{q.question}</p>
          <p className="text-xs text-[var(--app-accent1)]">{t ? 'اختر جميع الإجابات الصحيحة' : 'Select ALL correct answers'}</p>
          <div className="grid gap-2 mt-2">
            {(q.options||[]).map((opt, i) => {
              const on       = selected.includes(opt);
              const isCorr   = submitted && (q.answers||[]).includes(opt);
              const isWrng   = submitted && on && !(q.answers||[]).includes(opt);
              return (
                <button key={i} disabled={submitted}
                  className={optionBtn(on, isCorr, isWrng)}
                  onClick={() => {
                    const cur = ua || [];
                    updateAnswer(q.id, on ? cur.filter(x => x !== opt) : [...cur, opt]);
                  }}>
                  <span className={`inline-flex w-4 h-4 rounded border mr-2 items-center justify-center text-xs
                    ${on ? 'bg-[var(--app-accent1)] border-[var(--app-accent1)] text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                    {on && '✓'}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && (
            <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {correct ? '✓ Correct' : `✗ Correct: ${(q.answers||[]).join(', ')}`}
              {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
            </div>
          )}
        </div>
      );
    };

    const renderTFNG = () => (
      <div className="space-y-3">
        <div className="bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-4 text-sm leading-relaxed border border-gray-200 dark:border-[var(--app-border)] text-gray-700 dark:text-gray-200">{q.passage}</div>
        <div className="space-y-3">
          {(q.statements||[]).map((s, i) => {
            const choice = ua?.[i] || '';
            const labels = ['True','False','Not Given'];
            const isCorr = submitted && choice.toLowerCase() === s.answer.toLowerCase();
            return (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-[var(--app-border)] p-3 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{i+1}. {s.text}</p>
                <div className="flex gap-2 flex-wrap">
                  {labels.map(lb => {
                    const active = choice === lb;
                    const isC2   = submitted && lb === s.answer;
                    const isW2   = submitted && active && lb !== s.answer;
                    return (
                      <button key={lb} disabled={submitted}
                        onClick={() => updateAnswer(q.id, { ...(ua||{}), [i]: lb })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                          ${isC2 ? 'bg-green-100 dark:bg-green-500/20 border-green-400 text-green-700 dark:text-green-300'
                          : isW2 ? 'bg-red-100 dark:bg-red-500/20 border-red-400 text-red-700 dark:text-red-300'
                          : active ? 'bg-[var(--app-accent1)] border-[var(--app-accent1)] text-white'
                          : 'bg-white dark:bg-[var(--app-card)] border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        {lb}
                      </button>
                    );
                  })}
                </div>
                {submitted && <p className={`text-xs ${isCorr ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{isCorr ? '✓' : `✗ ${s.answer}`}</p>}
              </div>
            );
          })}
        </div>
        {submitted && q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 italic">{q.explanation}</p>}
      </div>
    );

    const renderReorderParagraphs = () => {
      const order    = ua || [];
      const allLabels= (q.paragraphs||[]).map(p => p.label);
      const remaining= allLabels.filter(l => !order.includes(l));
      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t ? 'رتب الفقرات بالترتيب الصحيح' : 'Click paragraphs in the correct order'}</p>
          {/* Arranged */}
          <div className="space-y-2 min-h-[60px]">
            {order.map((lbl2, pos) => {
              const para = (q.paragraphs||[]).find(p => p.label === lbl2);
              return (
                <div key={lbl2} className="flex items-start gap-2 bg-[var(--app-accent1)]/10 border border-[var(--app-accent1)]/30 rounded-xl p-3 cursor-pointer"
                  onClick={() => !submitted && updateAnswer(q.id, order.filter(x => x !== lbl2))}>
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--app-accent1)] text-white text-xs font-bold flex items-center justify-center">{pos+1}</span>
                  <div><span className="font-bold text-xs text-[var(--app-accent1)] mr-2">{lbl2}.</span><span className="text-sm text-gray-700 dark:text-gray-200">{para?.text}</span></div>
                </div>
              );
            })}
          </div>
          {/* Pool */}
          {!submitted && remaining.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">{t ? 'انقر لإضافة:' : 'Click to add:'}</p>
              {remaining.map(lbl2 => {
                const para = (q.paragraphs||[]).find(p => p.label === lbl2);
                return (
                  <div key={lbl2} className="flex items-start gap-2 bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] rounded-xl p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                    onClick={() => updateAnswer(q.id, [...order, lbl2])}>
                    <span className="shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center">{lbl2}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{para?.text}</span>
                  </div>
                );
              })}
            </div>
          )}
          {submitted && (
            <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {correct ? '✓ Correct order!' : `✗ Correct order: ${(q.correctOrder||[]).join(' → ')}`}
              {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
            </div>
          )}
        </div>
      );
    };

    const renderDragDrop = () => {
      const arranged = dragArranged[q.id] || [];
      const pool2    = dragPool[q.id]     || [];
      const dropWord = (w) => {
        setDragArranged(prev => ({ ...prev, [q.id]: [...(prev[q.id]||[]), w] }));
        setDragPool(prev     => ({ ...prev, [q.id]: (prev[q.id]||[]).filter(x => x !== w) }));
        updateAnswer(q.id, [...arranged, w].join(' '));
      };
      const removeWord = (idx2) => {
        const arr  = dragArranged[q.id] || [];
        const word = arr[idx2];
        setDragArranged(prev => ({ ...prev, [q.id]: arr.filter((_, i) => i !== idx2) }));
        setDragPool(prev     => ({ ...prev, [q.id]: [...(prev[q.id]||[]), word] }));
        const newArr = arr.filter((_, i) => i !== idx2);
        updateAnswer(q.id, newArr.join(' '));
      };
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t ? 'رتب الكلمات لتكوين جملة صحيحة' : 'Arrange words to form a correct sentence'}</p>
          {/* Drop zone */}
          <div className="min-h-[48px] flex flex-wrap gap-2 bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl border-2 border-dashed border-[var(--app-accent1)]/40 p-3">
            {arranged.length === 0 && <span className="text-xs text-gray-400 self-center">{t ? 'انقر على الكلمات أدناه...' : 'Click words below to add...'}</span>}
            {arranged.map((w, i) => (
              <button key={i} disabled={submitted} onClick={() => !submitted && removeWord(i)}
                className="px-3 py-1 rounded-lg bg-[var(--app-accent1)] text-white text-sm font-medium hover:bg-[var(--app-accent1)]/80 transition-all">
                {w}
              </button>
            ))}
          </div>
          {/* Word pool */}
          {!submitted && (
            <div className="flex flex-wrap gap-2">
              {pool2.map((w, i) => (
                <button key={i} onClick={() => dropWord(w)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[var(--app-card)] border border-gray-200 dark:border-[var(--app-border)] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                  {w}
                </button>
              ))}
            </div>
          )}
          {submitted && (
            <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {correct ? '✓ Correct!' : `✗ Correct answer: ${q.answer}`}
              {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
            </div>
          )}
        </div>
      );
    };

    const renderDropdownFillIn = () => {
      const parts = (q.template || '').split(/\[(\d+)\]/);
      return (
        <div className="space-y-3">
          <div className="text-sm leading-loose text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-4 border border-gray-200 dark:border-[var(--app-border)]">
            {parts.map((part, i) => {
              if (/^\d+$/.test(part)) {
                const idx2 = parseInt(part);
                const slot = (q.slots||[])[idx2];
                const val  = ua?.[idx2] || '';
                const isC2 = submitted && val === slot?.answer;
                const isW2 = submitted && val !== slot?.answer;
                return (
                  <select key={i} disabled={submitted} value={val}
                    onChange={e => updateAnswer(q.id, { ...(ua||{}), [idx2]: e.target.value })}
                    className={`mx-1 px-2 py-0.5 rounded-lg border text-sm cursor-pointer focus:outline-none
                      ${isC2 ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300'
                      : isW2 ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
                      : 'border-[var(--app-accent1)]/50 bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)]'}`}>
                    <option value="">—</option>
                    {(slot?.options||[]).map((o, j) => <option key={j} value={o}>{o}</option>)}
                  </select>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
          {submitted && (
            <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {correct ? '✓ All correct!' : `✗ Correct: ${(q.slots||[]).map(sl => sl.answer).join(', ')}`}
              {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
            </div>
          )}
        </div>
      );
    };

    const renderMCCloze = () => {
      const parts = (q.passage||'').split(/\[(\d+)\]/);
      return (
        <div className="space-y-3">
          <div className="text-sm leading-loose text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-4 border border-gray-200 dark:border-[var(--app-border)]">
            {parts.map((part, i) => {
              if (/^\d+$/.test(part)) {
                const idx2  = parseInt(part);
                const blank = (q.blanks||[])[idx2];
                const val   = ua?.[idx2] || '';
                const isC2  = submitted && val === blank?.answer;
                const isW2  = submitted && val !== blank?.answer;
                return (
                  <select key={i} disabled={submitted} value={val}
                    onChange={e => updateAnswer(q.id, { ...(ua||{}), [idx2]: e.target.value })}
                    className={`mx-1 px-2 py-0.5 rounded-lg border text-sm cursor-pointer focus:outline-none
                      ${isC2 ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300'
                      : isW2 ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
                      : 'border-[var(--app-accent1)]/50 bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)]'}`}>
                    <option value="">—</option>
                    {(blank?.options||[]).map((o, j) => <option key={j} value={o}>{o}</option>)}
                  </select>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
          {submitted && (
            <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {correct ? '✓ All correct!' : `✗ Correct: ${(q.blanks||[]).map(b => b.answer).join(', ')}`}
              {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
            </div>
          )}
        </div>
      );
    };

    const renderOpenCloze = () => {
      const parts = (q.passage||'').split(/(_____\(\d+\))/);
      let blankIdx = -1;
      return (
        <div className="space-y-3">
          <div className="text-sm leading-loose text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-4 border border-gray-200 dark:border-[var(--app-border)]">
            {parts.map((part, i) => {
              if (/^_____\(\d+\)$/.test(part)) {
                blankIdx++;
                const idx2    = blankIdx;
                const ans     = (q.answers||[])[idx2] || '';
                const val     = ua?.[idx2] || '';
                const isC2    = submitted && val.trim().toLowerCase() === ans.toLowerCase();
                const isW2    = submitted && !isC2;
                return (
                  <span key={i} className="inline-flex items-center mx-1">
                    <input disabled={submitted} value={val} onChange={e => updateAnswer(q.id, { ...(ua||{}), [idx2]: e.target.value })}
                      className={`w-24 px-2 py-0.5 rounded-lg border text-sm focus:outline-none text-center
                        ${isC2 ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-700'
                        : isW2 ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700'
                        : 'border-[var(--app-accent1)]/50 bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)]'}`}
                      placeholder={`(${idx2+1})`} />
                    {submitted && isW2 && <span className="ml-1 text-xs text-green-600 dark:text-green-400">→{ans}</span>}
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
          {submitted && q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 italic">{q.explanation}</p>}
        </div>
      );
    };

    const renderWordFormation = () => (
      <div className="space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
          {(q.sentence||'').split('_____').map((p2, i) => {
            if (i === 0) return <span key={i}>{p2}</span>;
            return <span key={i}><span className="inline-flex items-center gap-1">
              <span className="border-b-2 border-[var(--app-accent1)] w-20 inline-block" />
              <span className="text-xs text-[var(--app-accent1)] font-bold">({q.baseWord})</span>
            </span>{p2}</span>;
          })}
        </p>
        {renderOpenInput(t ? 'الصيغة الصحيحة:' : 'Correct form:', q.answer)}
        {submitted && q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 italic">{q.explanation}</p>}
      </div>
    );

    const renderKeyWordTransform = () => (
      <div className="space-y-3">
        <div className="bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-4 border border-gray-200 dark:border-[var(--app-border)]">
          <p className="text-xs text-gray-400 mb-1">{t ? 'أعد كتابة الجملة مستخدماً الكلمة المفتاحية:' : 'Rewrite using the key word:'}</p>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">{q.original}</p>
          <p className="mt-2 text-sm font-bold text-[var(--app-accent1)]">KEY: {q.keyword}</p>
        </div>
        {renderOpenInput(t ? 'الجملة المعاد كتابتها:' : 'Rewritten sentence:', q.answer)}
        {submitted && q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 italic">{q.explanation}</p>}
      </div>
    );

    const renderGappedText = () => {
      const gaps = Object.keys(q.answers || {});
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-4 border border-gray-200 dark:border-[var(--app-border)] text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {(q.passage||'').split(/(\[GAP_[A-Z]\])/g).map((part, i) => {
              const gapMatch = part.match(/\[GAP_([A-Z])\]/);
              if (gapMatch) {
                const gapId  = `GAP_${gapMatch[1]}`;
                const val    = ua?.[gapId] || '';
                const isC2   = submitted && val === (q.answers||{})[gapId];
                const isW2   = submitted && !isC2;
                return (
                  <select key={i} disabled={submitted} value={val}
                    onChange={e => updateAnswer(q.id, { ...(ua||{}), [gapId]: e.target.value })}
                    className={`mx-1 px-2 py-0.5 rounded-lg border text-xs cursor-pointer focus:outline-none
                      ${isC2 ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-700'
                      : isW2 ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700'
                      : 'border-[var(--app-accent1)]/40 bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)]'}`}>
                    <option value="">— {gapId} —</option>
                    {(q.sentences||[]).map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                  </select>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{t ? 'الجمل المتاحة:' : 'Available sentences:'}</p>
            {(q.sentences||[]).map(s => (
              <div key={s.id} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold text-[var(--app-accent1)] shrink-0">{s.id}.</span><span>{s.text}</span>
              </div>
            ))}
          </div>
          {submitted && (
            <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {correct ? '✓ Correct!' : `✗ Correct: ${Object.entries(q.answers||{}).map(([g,s2]) => `${g}→${s2}`).join(', ')}`}
              {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
            </div>
          )}
        </div>
      );
    };

    const renderMatchingHeadings = () => (
      <div className="space-y-4">
        <div className="space-y-3">
          {(q.paragraphs||[]).map(para => {
            const val  = ua?.[para.id] || '';
            const isC2 = submitted && val === (q.answers||{})[para.id];
            const isW2 = submitted && !isC2;
            return (
              <div key={para.id} className="rounded-xl border border-gray-200 dark:border-[var(--app-border)] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--app-accent1)] shrink-0">{t ? 'فقرة' : 'Para'} {para.id}</span>
                  <select disabled={submitted} value={val}
                    onChange={e => updateAnswer(q.id, { ...(ua||{}), [para.id]: e.target.value })}
                    className={`flex-1 px-2 py-1 rounded-lg border text-xs cursor-pointer focus:outline-none
                      ${isC2 ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-700'
                      : isW2 ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700'
                      : 'border-gray-200 dark:border-[var(--app-border)] bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)]'}`}>
                    <option value="">{t ? '— اختر عنواناً —' : '— Choose heading —'}</option>
                    {(q.headings||[]).map(h => <option key={h.id} value={h.id}>{h.id}. {h.text}</option>)}
                  </select>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{para.text}</p>
              </div>
            );
          })}
        </div>
        {submitted && (
          <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
            {correct ? '✓ All correct!' : `✗ Correct: ${Object.entries(q.answers||{}).map(([p2,h]) => `Para ${p2}→${h}`).join(', ')}`}
            {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
          </div>
        )}
      </div>
    );

    const renderSummaryCompletion = () => {
      const parts  = (q.summary||'').split(/(_____\(\d+\))/);
      let bi = -1;
      return (
        <div className="space-y-4">
          {q.passage && (
            <div className="bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-4 border border-gray-200 dark:border-[var(--app-border)] text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">{q.passage}</div>
          )}
          <div className="bg-white dark:bg-[var(--app-card)] rounded-xl p-4 border border-gray-200 dark:border-[var(--app-border)] text-sm leading-loose text-gray-700 dark:text-gray-200">
            <p className="text-xs text-gray-400 mb-2">{t ? 'أكمل الملخص:' : 'Complete the summary:'}</p>
            {parts.map((part, i) => {
              if (/^_____\(\d+\)$/.test(part)) {
                bi++;
                const idx2  = bi;
                const ans   = (q.answers||[])[idx2] || '';
                const sel   = ua?.[idx2] || '';
                const isC2  = submitted && sel === ans;
                const isW2  = submitted && !isC2;
                return (
                  <select key={i} disabled={submitted} value={sel}
                    onChange={e => updateAnswer(q.id, { ...(ua||{}), [idx2]: e.target.value })}
                    className={`mx-1 px-2 py-0.5 rounded-lg border text-sm cursor-pointer focus:outline-none
                      ${isC2 ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-700'
                      : isW2 ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700'
                      : 'border-[var(--app-accent1)]/40 bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)]'}`}>
                    <option value="">{t ? '— اختر —' : '— choose —'}</option>
                    {(q.wordBank||[]).map((w, j) => <option key={j} value={w}>{w}</option>)}
                  </select>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t ? 'بنك الكلمات:' : 'Word bank:'}</p>
            <div className="flex flex-wrap gap-2">
              {(q.wordBank||[]).map((w, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-[var(--app-accent1)]/10 border border-[var(--app-accent1)]/20 text-sm text-[var(--app-accent1)] font-medium">{w}</span>
              ))}
            </div>
          </div>
          {submitted && (
            <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {correct ? '✓ Correct!' : `✗ Correct: ${(q.answers||[]).join(', ')}`}
              {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
            </div>
          )}
        </div>
      );
    };

    const renderMatchingInfo = () => (
      <div className="space-y-4">
        <div className="grid gap-3">
          {(q.paragraphs||[]).map(para => (
            <div key={para.id} className="bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl p-3 border border-gray-200 dark:border-[var(--app-border)]">
              <span className="font-bold text-xs text-[var(--app-accent1)] block mb-1">{t ? 'فقرة' : 'Paragraph'} {para.id}</span>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{para.text}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">{t ? 'طابق كل عبارة مع الفقرة:' : 'Match each statement to a paragraph:'}</p>
          {(q.statements||[]).map((s, i) => {
            const val  = ua?.[i] || '';
            const isC2 = submitted && val === s.answer;
            const isW2 = submitted && !isC2;
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-[var(--app-border)] p-3">
                <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">{s.text}</p>
                <select disabled={submitted} value={val}
                  onChange={e => updateAnswer(q.id, { ...(ua||{}), [i]: e.target.value })}
                  className={`w-24 px-2 py-1 rounded-lg border text-sm cursor-pointer focus:outline-none
                    ${isC2 ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-700'
                    : isW2 ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700'
                    : 'border-gray-200 dark:border-[var(--app-border)] bg-white dark:bg-[var(--app-card)] text-gray-800 dark:text-[var(--app-text)]'}`}>
                  <option value="">—</option>
                  {(q.paragraphs||[]).map(p2 => <option key={p2.id} value={p2.id}>{t ? 'فقرة' : 'Para'} {p2.id}</option>)}
                </select>
              </div>
            );
          })}
        </div>
        {submitted && (
          <div className={`text-xs px-3 py-2 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
            {correct ? '✓ All matched correctly!' : `✗ Correct: ${(q.statements||[]).map((s,i)=>`S${i+1}→${s.answer}`).join(', ')}`}
            {q.explanation && <span className="block mt-1 text-gray-500 dark:text-gray-400">{q.explanation}</span>}
          </div>
        )}
      </div>
    );

    // ── Dispatch to renderer ────────────────────────────────────────────────
    let body;
    switch (q.type) {
      case 'fill-in-the-blank':       body = renderFillBlank(); break;
      case 'context-meaning':         body = renderContextMeaning(); break;
      case 'synonym':                 body = renderMC(`${t?'ما مرادف':'Find the synonym of'} "${q.word}":`, q.options, q.answer); break;
      case 'definition':              body = renderMC(q.definition, q.options, q.answer); break;
      case 'antonym':                 body = renderMC(`${t?'ما مضاد':'Find the antonym of'} "${q.word}":`, q.options, q.answer); break;
      case 'idiom-meaning':           body = renderMC(`${t?'ما معنى':'What does the idiom'} "${q.idiom}" ${t?'':' mean?'}`, q.options, q.answer); break;
      case 'idiom-completion':        body = renderMC(q.partial, q.options, q.answer); break;
      case 'preposition':             body = renderMC(q.sentence?.replace('_____','_____'), q.options, q.answer); break;
      case 'multiple-choice':         body = renderMC(q.question, q.options, q.answer); break;
      case 'drag-and-drop':           body = renderDragDrop(); break;
      case 'dropdown-fill-in':        body = renderDropdownFillIn(); break;
      case 'multi-select':            body = renderMultiSelect(); break;
      case 'true-false-not-given':    body = renderTFNG(); break;
      case 're-order-paragraphs':     body = renderReorderParagraphs(); break;
      case 'MC-cloze':                body = renderMCCloze(); break;
      case 'open-cloze':              body = renderOpenCloze(); break;
      case 'word-formation':          body = renderWordFormation(); break;
      case 'key-word-transformation': body = renderKeyWordTransform(); break;
      case 'gapped-text':             body = renderGappedText(); break;
      case 'matching-headings':       body = renderMatchingHeadings(); break;
      case 'summary-completion':      body = renderSummaryCompletion(); break;
      case 'matching-information':    body = renderMatchingInfo(); break;
      default:                        body = <p className="text-sm text-gray-500">Unsupported type: {q.type}</p>;
    }

    const cefrColor = { A1:'bg-green-500', A2:'bg-lime-500', B1:'bg-blue-500', B2:'bg-amber-500', C1:'bg-red-500' }[q.level] || 'bg-gray-400';
    const skillColor = { grammar:'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15', vocabulary:'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15', reading:'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-500/15' }[q.skill] || 'text-gray-500 bg-gray-100 dark:bg-gray-700';

    return (
      <div key={q.id} className={`${panelCls} space-y-4 ${phase === 'results' ? (correct ? 'border-green-300 dark:border-green-500/30' : 'border-red-300 dark:border-red-500/30') : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-400">Q{idx+1}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${skillColor}`}>{q.skill}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold text-white ${cefrColor}`}>{q.level}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[var(--app-surface)] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[var(--app-border)]">{typeLabel}</span>
          </div>
          {phase === 'results' && (
            <span className={`text-sm font-bold ${correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {correct ? '✓' : '✗'}
            </span>
          )}
        </div>
        {/* Instruction */}
        {q.instruction && <p className="text-xs text-gray-400 italic">{q.instruction}</p>}
        {/* Body */}
        {body}
      </div>
    );
  };

  // ── PANELS ────────────────────────────────────────────────────────────────
  const FilterChip = ({ options, value, onChange, label }) => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt.v} onClick={() => onChange(opt.v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150
              ${value === opt.v
                ? 'bg-[var(--app-accent1)] border-[var(--app-accent1)] text-white shadow-sm'
                : 'bg-white dark:bg-[var(--app-card)] border-gray-200 dark:border-[var(--app-border)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            {lbl(opt)}
          </button>
        ))}
      </div>
    </div>
  );

  const { correct: sc, total: st } = phase === 'results' ? calculateScore() : { correct:0, total:0 };
  const pct    = st > 0 ? Math.round((sc/st)*100) : 0;
  const grade  = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';
  const gradeColor = pct >= 75 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6" dir={t ? 'rtl' : 'ltr'}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className={`${panelCls} bg-gradient-to-r from-[var(--app-accent1)]/10 to-[var(--app-accent2)]/10`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--app-accent1)] flex items-center justify-center shrink-0 shadow-lg">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t ? 'منشئ الاختبارات' : 'Test Generator'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t ? 'اختر المهارة والإطار وعدد الأسئلة — سيولّد الذكاء الاصطناعي جلسة تدريبية متكاملة.'
                 : 'Pick a skill, framework and item count — AI assembles a full practice session with 22 question types.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── CONFIG PANEL ─────────────────────────────────────────────────── */}
      <div className={`${panelCls} space-y-6`}>
        <h2 className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-[var(--app-accent1)]" />
          {t ? 'إعدادات الاختبار' : 'Session Settings'}
        </h2>
        <FilterChip options={SKILLS}     value={skill}     onChange={setSkill}     label={t ? 'المهارة الرئيسية' : 'Primary Skill'} />
        <FilterChip options={FRAMEWORKS} value={framework} onChange={setFramework} label={t ? 'إطار الاختبار' : 'Test Framework'} />
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t ? 'نوع السؤال' : 'Question Type'}</label>
          <CustomDropdown
            value={qType}
            onChange={setQType}
            options={Q_TYPES.map(qt => ({ value: qt.v, label: lbl(qt) }))}
            theme={theme}
          />
        </div>
        <FilterChip options={LEVELS} value={level} onChange={setLevel} label={t ? 'مستوى CEFR' : 'CEFR Level'} />
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t ? 'عدد الأسئلة' : 'Items per session'}</label>
          <div className="flex gap-2">
            {COUNTS.map(c => (
              <button key={c} onClick={() => setItemCount(c)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all
                  ${itemCount === c ? 'bg-[var(--app-accent1)] border-[var(--app-accent1)] text-white' : 'bg-white dark:bg-[var(--app-card)] border-gray-200 dark:border-[var(--app-border)] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={phase === 'loading'}
          className="w-full py-3 rounded-2xl bg-[var(--app-accent1)] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--app-accent1)]/20 disabled:opacity-60">
          {phase === 'loading'
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t ? 'جاري التوليد...' : 'Generating...'}</>
            : <><Sparkles className="w-4 h-4" />{t ? 'ابدأ الجلسة' : 'Start Practice Session'}</>}
        </button>
      </div>

      {/* ── SESSION QUESTIONS ─────────────────────────────────────────────── */}
      {(phase === 'session' || phase === 'results') && questions.length > 0 && (
        <div className="space-y-4">
          {/* progress bar */}
          {phase === 'session' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-2 bg-[var(--app-accent1)] rounded-full transition-all duration-500"
                  style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500 shrink-0">{Object.keys(answers).length}/{questions.length}</span>
            </div>
          )}

          {/* questions */}
          {questions.map((q, idx) => renderQuestion(q, idx))}

          {/* submit / new */}
          {phase === 'session' && (
            <button onClick={handleSubmit}
              className="w-full py-3 rounded-2xl bg-green-600 dark:bg-green-500 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4" />
              {t ? 'تسليم الإجابات' : 'Submit Answers'}
            </button>
          )}
        </div>
      )}

      {/* ── RESULTS PANEL ────────────────────────────────────────────────── */}
      {phase === 'results' && (
        <div className={`${panelCls} text-center space-y-4`}>
          <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
          <div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{pct}<span className="text-2xl">%</span></p>
            <p className={`text-2xl font-black mt-1 ${gradeColor}`}>{grade}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sc} / {st} {t ? 'إجابة صحيحة' : 'correct'}</p>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-3 rounded-full transition-all duration-700 ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }} />
          </div>
          <button onClick={() => { setPhase('config'); setQuestions([]); setAnswers({}); }}
            className="w-full py-2.5 rounded-2xl bg-[var(--app-accent1)] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" />
            {t ? 'جلسة جديدة' : 'New Session'}
          </button>
        </div>
      )}

      {/* ── RECENT SESSIONS ──────────────────────────────────────────────── */}
      <div className={`${panelCls} space-y-4`}>
        <h2 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          {t ? 'الجلسات الأخيرة' : 'Recent Sessions'}
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t ? 'لا توجد جلسات بعد. ابدأ ممارستك!' : 'No sessions yet. Start your first practice!'}</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(sess => (
              <div key={sess.id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[var(--app-surface)] rounded-xl px-4 py-3 border border-gray-100 dark:border-[var(--app-border)]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 capitalize">{sess.skill}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{sess.framework}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs font-bold text-[var(--app-accent1)]">{sess.level}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{sess.date} · {sess.count} {t ? 'سؤال' : 'questions'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black ${Math.round((sess.correct/sess.total)*100) >= 75 ? 'text-green-600 dark:text-green-400' : Math.round((sess.correct/sess.total)*100) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {Math.round((sess.correct/sess.total)*100)}%
                  </p>
                  <p className="text-xs text-gray-400">{sess.correct}/{sess.total}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Langeek({
  AI_KEY,
  userLevel,
  lang,
  langeekVocab,
  setLangeekVocab,
  theme,
  langeekSrsData: srsData,
  setLangeekSrsData: setSrsData
}) {
  const [vocabMode, setVocabMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(int);
  }, []);
  const [levelFilter, setLevelFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [aiStory, setAiStory] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingContextStory, setLoadingContextStory] = useState(false);
  const [contextStory, setContextStory] = useState('');
  const [cardImage, setCardImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [collocationData, setCollocationData] = useState('');
  const [loadingCollocation, setLoadingCollocation] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const t = {
    browse: _resolveTranslation(lang, 'تصفح كلمات لانجيك', 'Browse Langeek Words'),
    review: _resolveTranslation(lang, 'المراجعة المتباعدة', 'Spaced Review'),
    lists: _resolveTranslation(lang, 'قوائم الكلمات', 'Word Lists'),
    hard: _resolveTranslation(lang, 'صعبة', 'Hard'),
    learning: _resolveTranslation(lang, 'قيد التعلم', 'Learning'),
    mastered: _resolveTranslation(lang, 'متقنة', 'Mastered'),
    emptyLists: _resolveTranslation(lang, 'لا توجد كلمات في هذه القائمة حالياً.', 'No words in this list currently.'),
    rateWordsMsg: _resolveTranslation(lang, 'قيم الكلمات في قسم "تصفح الكلمات" لتظهر هنا.', 'Rate words in Browse mode to see them here.'),
    contextBtn: _resolveTranslation(lang, 'اربط كل الكلمات الصعبة في قصة واحدة', 'Link Hard Words in a Story'),
    smartCards: _resolveTranslation(lang, 'البطاقات الذكية المخصصة', 'Custom Smart Cards'),
    totalWords: _resolveTranslation(lang, 'إجمالي الكلمات المتاحة:', 'Total Available Words:'),
    uploadCSV: _resolveTranslation(lang, 'رفع ملف (CSV)', 'Upload CSV'),
    searchWord: _resolveTranslation(lang, 'بحث في لانجيك', 'Search Langeek'),
    filterLevel: _resolveTranslation(lang, 'تصفية بالمستوى', 'Filter by Level'),
    filterCategory: _resolveTranslation(lang, 'تصفية بالموضوع', 'Filter by Topic'),
    manualSelect: _resolveTranslation(lang, 'اختيار يدوي', 'Manual Select'),
    noWords: _resolveTranslation(lang, 'لا توجد كلمات مطابقة', 'No matching words'),
    reviewDone: _resolveTranslation(lang, 'أنت رائع! 🎉', 'Awesome! 🎉'),
    reviewDoneMsg: _resolveTranslation(lang, 'لقد أنهيت جميع المراجعات المستحقة في هذا الوقت.', 'You have completed all due reviews.'),
    comeBackLater: _resolveTranslation(lang, 'عُد لاحقاً أو تصفح لتعلم المزيد.', 'Come back later or browse to learn more.'),
    browseLearn: _resolveTranslation(lang, 'تصفح وتعلم كلمات جديدة', 'Browse and Learn New Words'),
    noMatch: _resolveTranslation(lang, 'لا توجد كلمات مطابقة لبحثك.', 'No words match your search.'),
    clearFilters: _resolveTranslation(lang, 'مسح الفلاتر', 'Clear Filters'),
    storyBtn: _resolveTranslation(lang, 'قصة للربط الذهني', 'Story for Memory'),
    imgBtn: _resolveTranslation(lang, 'صورة توضيحية', 'Illustrative Image'),
    synonyms: _resolveTranslation(lang, 'مرادفات:', 'Synonyms:'),
    aiGenerated: _resolveTranslation(lang, 'مولدة بالذكاء الاصطناعي', 'AI Generated'),
    storyTitle: _resolveTranslation(lang, 'قصة ذكية للحفظ:', 'Smart Memory Story:'),
    clickToShow: _resolveTranslation(lang, 'انقر على البطاقة لإظهار المعنى والتقييم', 'Click the card to show meaning and rate'),
    rateAgain: _resolveTranslation(lang, 'أعد', 'Again'),
    rateHard: _resolveTranslation(lang, 'صعب', 'Hard'),
    rateGood: _resolveTranslation(lang, 'جيد', 'Good'),
    rateEasy: _resolveTranslation(lang, 'سهل', 'Easy'),
    rateSkip: _resolveTranslation(lang, 'تخطي', 'Skip'),
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days'),
    collocationsBtn: _resolveTranslation(lang, 'التجميعات الاصطلاحية (AI)', 'Collocations (AI)'),
  };
  const dueCards = useMemo(() => {
    const now = Date.now();
    return langeekVocab.filter(card => {
      const data = srsData[card.word];
      if (!data) return false;
      return data.nextReview <= now;
    });
  }, [langeekVocab, srsData, tick]);
  const hardWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [langeekVocab, srsData, tick]);
  const learningWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'good'), [langeekVocab, srsData, tick]);
  const masteredWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'easy'), [langeekVocab, srsData, tick]);
  const currentListView = listTab === 'hard' ? hardWords : listTab === 'learning' ? learningWords : masteredWords;
  const parseCSVLine = line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const lines = text.split('\n');
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const rowArr = parseCSVLine(lines[i]);
        if (rowArr.length >= 4 && rowArr[0]) {
          parsedData.push({
            category: rowArr[0]?.replace(/^\"|\"$/g, '') || 'General',
            level: rowArr[1]?.replace(/^\"|\"$/g, '') || '',
            word: rowArr[2]?.replace(/^\"|\"$/g, '') || '',
            type: rowArr[3]?.replace(/^\"|\"$/g, '') || '',
            meaning: rowArr[4]?.replace(/^\"|\"$/g, '') || '',
            example: rowArr[5]?.replace(/^\"|\"$/g, '') || '',
            synonyms: ''
          });
        }
      }
      if (parsedData.length > 0) {
        setLangeekVocab(parsedData);
        setLevelFilter('All');
        setSearchQuery('');
        setVocabMode('browse');
        setUploadMessage(`تم رفع ${parsedData.length} كلمة بنجاح! ✅`);
        setTimeout(() => setUploadMessage(''), 3000);
        // ── Save to Firebase Storage for cross-device sync ──
        uploadVocabCSV('langeek', text).catch(console.warn);
      } else {
        setUploadMessage('لم يتم العثور على كلمات، تأكد من صيغة الملف ❌');
      }
    };
    reader.readAsText(file);
  };
  const filteredVocabList = useMemo(() => {
    return langeekVocab.filter(item => {
      const matchesLevel = levelFilter === 'All' || item.level?.toUpperCase().includes(levelFilter.toUpperCase());
      const matchesCategory = categoryFilter === 'All' || item.category?.toUpperCase() === categoryFilter.toUpperCase();
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = item.word.toLowerCase().includes(searchLower) || item.meaning && item.meaning.toLowerCase().includes(searchLower);
      return matchesLevel && matchesCategory && matchesSearch;
    });
  }, [langeekVocab, levelFilter, categoryFilter, searchQuery]);
  const safeIndex = activeWordIndex < filteredVocabList.length ? activeWordIndex : 0;
  const card = vocabMode === 'review' ? dueCards[0] : filteredVocabList[safeIndex];
  useEffect(() => { setAiStory(''); setCardImage(null); setCollocationData(''); }, [card?.word]);
  useEffect(() => {
    if (vocabMode === 'browse' && filteredVocabList.length > 0 && activeWordIndex >= filteredVocabList.length) {
      setActiveWordIndex(0);
    }
  }, [filteredVocabList.length, activeWordIndex, vocabMode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = now;
    if (rating === 'again') nextReview = now + 1 * 60 * 1000; else if (rating === 'hard') nextReview = now + 10 * 60 * 1000; else if (rating === 'good') nextReview = now + 24 * 60 * 60 * 1000; else if (rating === 'easy') nextReview = now + 4 * 24 * 60 * 60 * 1000; else if (rating === 'skip') nextReview = now + 100 * 365 * 24 * 60 * 60 * 1000;
    const newData = {
      ...srsData,
      [card.word]: {
        nextReview,
        rating,
        lastReviewed: now
      }
    };
    setSrsData(newData);
    localStorage.setItem('venoxa_langeek_srs_data', JSON.stringify(newData));
    setShowMeaning(false);
    setAiStory('');
    setCollocationData('');
    setCardImage(null);
    if (vocabMode === 'browse') {
      setActiveWordIndex((safeIndex + 1) % filteredVocabList.length);
    }
  };
  const resetWordProgress = wordString => {
    const newData = {
      ...srsData
    };
    delete newData[wordString];
    setSrsData(newData);
    localStorage.setItem('venoxa_langeek_srs_data', JSON.stringify(newData));
  };
  // Play a word's pronunciation — respects the accent code directly
  const playAudio = async (accentCode, wordToPlay = card?.word) => {
    if (!wordToPlay) return;
    const genderKey = _voiceGender === 'female' ? 'female' : 'male';
    const voiceName = accentCode === 'en-US' ? EDGE_VOICES.us[genderKey]
      : accentCode === 'en-GB' ? EDGE_VOICES.uk[genderKey]
        : undefined;
    await edgeTTSSpeak(wordToPlay, genderKey, voiceName);
  };

  const generateStory = async () => {
    if (loadingAi || aiStory || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `أنت معلم لغة إنجليزية مرح. قم بتأليف قصة قصيرة جداً ومضحكة (سطرين أو ثلاثة فقط) باللغة الإنجليزية تتضمن الكلمة "${card.word}" (والتي تعني: ${card.meaning}) لمساعدة طالب مستواه ${userLevel} على تذكرها بسهولة.
      بعد القصة الإنجليزية، أضف سطرين باللغة ${_resolveTranslation(lang, 'العربية', 'الإنجليزية')} تشرح فيهما كيف تم استخدام الكلمة في القصة.`;
      await streamText(prompt, setAiStory);
    } catch (err) {
      setAiStory(t.storyError);
    } finally {
      setLoadingAi(false);
    }
  };
  const generateImage = async () => {
    if (loadingImage || cardImage || !card) return;
    setLoadingImage(true);
    try {
      // Step 1: ask the AI for a concrete, single-scene visual description that conveys the word's meaning.
      const briefPrompt = `You are a visual director. For the word "${card.word}", describe a SINGLE, concrete, photorealistic scene that captures the LITERAL meaning. 
Rules:
1. One subject, one action.
2. NO abstract concepts, NO text, NO letters.
3. Describe colors, lighting, and composition.
4. Output ONLY a 15-word English description.`;
      let visual = '';
      try {
        const raw = await fetchFromGemini(briefPrompt, AI_KEY);
        const errJson = parseGeminiJSON(raw);
        if (!errJson || !errJson.error) {
          visual = String(raw || '').trim().split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
          // Strip surrounding quotes if the model wrapped them.
          visual = visual.replace(/^["'`]+|["'`]+$/g, '').trim();
        }
      } catch (_) {/* fall through to default */ }
      if (!visual) {
        visual = `A photorealistic everyday scene that visually represents the English word "${card.word}"`;
      }
      const finalPrompt = `${visual} Photorealistic, natural lighting, clean composition, ultra detailed, no text, no letters, no captions, no watermark.`.replace(/[^\x00-\x7F]/g, "");
      const seed = Math.floor(Math.random() * 1_000_000);
      // Use image.pollinations.ai/prompt/ with flux model for better quality and reliability.
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(finalPrompt)}&width=640&height=420&seed=${seed}`);
    } catch (err) {
      console.error("Image generation error", err);
      const fallback = `Photorealistic image showing the meaning of the English word ${card.word}, no text, no letters.`;
      setCardImage(`${import.meta.env.BASE_URL}api/image?prompt=${encodeURIComponent(fallback)}&width=640&height=420`);
    } finally {
      setLoadingImage(false);
    }
  };
  const generateContextStory = async () => {
    if (hardWords.length === 0 || loadingContextStory) return;
    setLoadingContextStory(true);
    try {
      const wordsStr = hardWords.map(w => w.word).join(', ');
      const prompt = `You are a creative writing teacher. Use ALL of these words: [${wordsStr}] in a single short, coherent, and interesting story in English. The story should be accessible for a ${userLevel} learner. After the story, explain the context of each word in ${_resolveTranslation(lang, 'Arabic', 'English')}.`;
      await streamText(prompt, setContextStory);
    } catch (e) {
      setContextStory(t.storyError);
    } finally {
      setLoadingContextStory(false);
    }
  };
  const generateCollocations = async () => {
    if (loadingCollocation || collocationData || !card) return;
    setLoadingCollocation(true);
    try {
      const prompt = `You are an English collocations dictionary similar to ozdic.com. For the word "${card.word}", list the most common and natural collocations grouped by grammatical pattern. Use this exact format (skip patterns with no collocations, max 6 per group):\nVERB + ${card.word}: verb1, verb2, verb3\nADJ + ${card.word}: adj1, adj2, adj3\n${card.word} + NOUN: noun1, noun2\n${card.word} + VERB: verb1, verb2\nPREPOSITION: in ~, at ~, on ~\nOutput only the collocation list, no extra explanations.`;
      await streamText(prompt, setCollocationData);
    } catch { setCollocationData('Could not generate collocations.'); } finally { setLoadingCollocation(false); }
  };
  return <div className="w-full space-y-5 lg:space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row glass-panel p-1.5 rounded-2xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
      <button onClick={() => {
        setVocabMode('browse');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'browse' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => {
        setVocabMode('review');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${vocabMode === 'review' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}>
        <Layers className="w-4 h-4" /> {t.review}
        {dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-sm">{dueCards.length}</span>}
      </button>
      <button onClick={() => {
        setVocabMode('lists');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'lists' ? 'bg-[var(--app-accent1)] text-white shadow-md' : 'text-gray-600 dark:text-[var(--app-text)] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[var(--app-surface)]/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>

    {vocabMode === 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl p-6 md:p-8 animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--app-border)] pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-[var(--app-accent1)]/12 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-[var(--app-accent1)] hover:text-gray-900 dark:hover:text-[var(--app-text)]'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>

      {listTab === 'hard' && hardWords.length > 0 && <div className="mb-6">
        <button onClick={generateContextStory} disabled={loadingContextStory} className="w-full py-4 bg-orange-50 dark:bg-orange-600/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-[var(--app-accent1)]/20 transition-all shadow-sm">
          {loadingContextStory ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> ✨ {t.contextBtn}</>}
        </button>
        {contextStory && <div className={`mt-4 p-5 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl border border-gray-200 dark:border-[var(--app-border)] ${_resolveTranslation(lang, 'text-right', 'text-left')} prose prose-orange dark:prose-invert max-w-none`}><div style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(contextStory)}</div></div>}
      </div>}


      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateWordsMsg}</p></div> : currentListView.map(item => {
          const srs = srsData[item.word];
          const isAr = /[\u0600-\u06FF]/.test(item.word);
          const isUiAr = lang === 'ar';
          return <div key={item.word} className={`flex ${isUiAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center bg-gray-50 dark:bg-[var(--app-card)] p-4 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] hover:border-gray-300 dark:border-[var(--app-border)] transition-colors group`}>
            <div className={`flex-1 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              <p className={`text-xl font-bold text-gray-900 dark:text-[var(--app-text)] flex items-center gap-2 ${isAr ? 'justify-end' : 'justify-start'}`}>
                <button onClick={() => playAudio('en-US', item.word)} className={`text-gray-500 hover:text-black dark:text-white dark:hover:text-blue-400 transition-colors ${isAr ? 'order-first' : 'order-last'}`}><Volume2 className="w-4 h-4" /></button>
                <span className="truncate">{safeRender(item.word)}</span>
              </p>
              <p className={`text-sm text-gray-600 dark:text-[var(--app-text)] mt-1 opacity-70 ${isAr ? 'text-right' : 'text-left'}`}>{safeRender(item.meaning)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 dark:text-[var(--app-accent1)] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="Remove from SRS"><Trash2 className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 glass-panel border border-gray-100 dark:border-[var(--app-border)] rounded-full shadow-sm">
                <Clock className="w-3 h-3 text-black dark:text-white" />
                <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-[var(--app-text)] tracking-wider">
                  {formatCountdown(srs?.nextReview)}
                </span>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {vocabMode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--app-text)] mb-1">{t.smartCards}</h2><p className="text-sm text-gray-600 dark:text-[var(--app-text)]">{t.totalWords} {langeekVocab.length}</p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm text-green-600 dark:text-green-400 font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-[var(--app-accent1)]/10 text-[var(--app-accent1)] dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-[var(--app-accent1)] dark:hover:bg-[var(--app-accent1)] dark:hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            <UploadCloud className="w-4 h-4" /> {t.uploadCSV}
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
      <div className="relative z-50 flex flex-col md:flex-row items-end gap-4 glass-panel p-5 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] shadow-sm transition-colors">
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Search className="w-4 h-4 text-black dark:text-white" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[var(--app-input-bg)] border border-gray-200 dark:border-[var(--app-border)] rounded-2xl px-4 h-11 text-sm text-gray-900 dark:text-[var(--app-text)] focus:border-[var(--app-accent1)] focus:outline-none transition-colors" />
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-[var(--app-accent1)] dark:text-[var(--app-accent2)]" /> {t.filterLevel}</label>
          <CustomDropdown 
            value={levelFilter} 
            onChange={setLevelFilter} 
            options={['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => ({ value: lvl, label: lvl === 'All' ? 'All Levels' : lvl }))} 
            theme={theme}
            className="w-full"
          />
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-[var(--app-accent1)] dark:text-[var(--app-accent2)]" /> {t.filterCategory}</label>
          <CustomDropdown 
            value={categoryFilter} 
            onChange={setCategoryFilter} 
            options={[{ value: 'All', label: 'All Topics' }, ...[...new Set(langeekVocab.map(v => v.category).filter(Boolean))].map(c => ({ value: c, label: c }))]} 
            theme={theme}
            className="w-full"
          />
        </div>
        <div className="flex-1 w-full flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-[var(--app-text)] font-bold flex items-center gap-2"><List className="w-4 h-4 text-black dark:text-white dark:text-green-400" /> {t.manualSelect} ({filteredVocabList.length})</label>
          <CustomDropdown 
            value={safeIndex} 
            onChange={val => {
              setActiveWordIndex(Number(val));
              setShowMeaning(false);
              setAiStory('');
              setCardImage(null);
            }} 
            options={filteredVocabList.length === 0 ? [{ value: 0, label: t.noWords }] : filteredVocabList.map((item, idx) => ({ value: idx, label: safeRender(item.word) }))} 
            theme={theme}
            className="w-full"
          />
        </div>
      </div>
    </>}

    {vocabMode === 'review' && !card && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-[var(--app-accent1)]/8 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-black dark:text-white dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-[var(--app-text)] text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setVocabMode('browse')} className="mt-8 bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/15 text-black dark:text-white border border-[var(--app-accent1)]/30 dark:border-[var(--app-accent1)]/40/50 px-8 py-3 rounded-2xl font-bold">{t.browseLearn}</button>
    </div>}

    {vocabMode === 'browse' && (filteredVocabList.length === 0 || !card) && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-[40px] min-h-[400px] flex flex-col items-center justify-center p-12 shadow-sm text-center animate-fadeIn transition-colors">
      <div className="w-20 h-20 bg-gray-100 dark:bg-[var(--app-surface)] rounded-full flex items-center justify-center mb-6">
        <UploadCloud className="w-10 h-10 text-[var(--app-accent1)]" />
      </div>
      <h3 className="text-2xl text-gray-900 dark:text-[var(--app-text)] font-bold mb-4">
        {_resolveTranslation(lang, 'قسم لانجيك فارغ', 'Langeek Section is Empty')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
        {_resolveTranslation(lang, 'يرجى رفع ملف الكلمات (CSV) الخاص بك للبدء في المذاكرة. يمكنك تحويل ملفات Langeek PDF إلى صيغة CSV لتعمل هنا.', 'Please upload your wordlist (CSV) to start studying. You can convert Langeek PDF files to CSV format to work here.')}
      </p>
      <label className="bg-[var(--app-accent1)] hover:bg-[var(--app-hover)] hover:text-black text-white dark:text-black px-10 py-4 rounded-2xl font-bold transition-all shadow-xl cursor-pointer active:scale-95">
        {t.uploadCSV}
        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
      </label>
    </div>}

    {card && vocabMode !== 'lists' && <div className="card-shine glass-panel border border-gray-200 dark:border-[var(--app-border)] rounded-2xl min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative hover:border-blue-300 transition-all duration-300 group animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>

      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
        <button onClick={e => {
          e.stopPropagation();
          playAudio('en-US');
        }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl text-black dark:text-white shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline"><USFlag style={{width:20,height:10,borderRadius:2}} /> US</span></button>
        <button onClick={e => {
          e.stopPropagation();
          playAudio('en-GB');
        }} className="p-3 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl text-red-600 dark:text-red-400 shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline"><GBFlag style={{width:20,height:10,borderRadius:2}} /> UK</span></button>
      </div>
      <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
        <span className="bg-gray-100 dark:bg-[var(--app-card)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-accent1)]/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{safeRender(card.level)}</span>
        {card.category && card.category !== 'All' && card.category !== 'General' && <span className="bg-indigo-50 dark:bg-[var(--app-accent1)]/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-[var(--app-accent1)]/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{safeRender(card.category)}</span>}
        {card.type && <span className="bg-emerald-50 dark:bg-[var(--app-accent2)]/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-[var(--app-accent2)]/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{safeRender(card.type)}</span>}
      </div>

      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-[var(--app-text)] mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-white text-sm mt-8 animate-pulse bg-gray-100 dark:bg-[var(--app-card)]/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-24 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-transparent p-6 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] mt-4 w-full relative"><p className="text-lg md:text-xl text-gray-800 dark:text-[var(--app-text)] font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        {card.synonyms && <div className="w-full bg-gray-100 dark:bg-transparent p-4 rounded-2xl border border-gray-200 dark:border-[var(--app-border)] text-sm text-gray-700 dark:text-[var(--app-text)]" dir="ltr"><span className="font-bold text-gray-500 mr-2">{t.synonyms}</span> <span className="text-black dark:text-white">{safeRender(card.synonyms)}</span></div>}

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiStory && <button onClick={e => { e.stopPropagation(); generateStory(); }} disabled={loadingAi} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Lightbulb className="w-5 h-5 text-amber-400" /> {t.storyBtn}</>}</button>}
          {!cardImage && <button onClick={e => { e.stopPropagation(); generateImage(); }} disabled={loadingImage} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5 text-blue-400" /> {t.imgBtn}</>}</button>}
          {!collocationData && <button onClick={e => { e.stopPropagation(); generateCollocations(); }} disabled={loadingCollocation} className="flex-1 bg-gray-50 dark:bg-[var(--app-input-bg)] text-black dark:text-white border border-gray-200 dark:border-[var(--app-border)] px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">{loadingCollocation ? <Activity className="w-5 h-5 animate-spin" /> : <><BookOpen className="w-5 h-5 text-emerald-400" /> {t.collocationsBtn}</>}</button>}
        </div>

        {collocationData && <div className="bg-gray-50 dark:bg-[var(--app-card)] border-l-4 border-teal-500 p-5 rounded-2xl w-full text-left mt-2" onClick={e => e.stopPropagation()}><div className="font-mono text-gray-800 dark:text-[var(--app-text)] text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{safeRender(collocationData)}</div></div>}
        {aiStory && <div className={`bg-gray-50 dark:bg-[var(--app-card)] border-${_resolveTranslation(lang, 'r', 'l')}-4 border-orange-500 p-5 rounded-2xl w-full ${_resolveTranslation(lang, 'text-right', 'text-left')} mt-4`} onClick={e => e.stopPropagation()}><div className="prose prose-orange dark:prose-invert max-w-none text-gray-800 dark:text-[var(--app-text)] text-sm" style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(aiStory)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[var(--app-card)] rounded-2xl flex flex-col items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-black dark:text-white mb-2 animate-bounce" /><span className="text-sm text-black dark:text-white font-bold">{t.loading}</span></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--app-border)] shadow-sm relative bg-gray-50 dark:bg-[var(--app-card)]" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => {
          e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found';
        }} /></div>}
      </div>}
    </div>}

    {showMeaning && card && vocabMode !== 'lists' && <div className="grid grid-cols-5 gap-2 md:gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-rose-500/10 text-red-600 border border-red-200 dark:border-rose-500/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center text-xs md:text-sm">{t.rateAgain} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[var(--app-surface)] text-[var(--app-accent1)] border border-orange-200 dark:border-white/12 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center text-xs md:text-sm">{t.rateHard} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[var(--app-accent2)]/10 text-green-600 border border-green-200 dark:border-[var(--app-accent2)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center text-xs md:text-sm">{t.rateGood} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-[var(--app-accent1)]/10 dark:bg-[var(--app-accent1)]/10 text-black dark:text-white border border-[var(--app-accent1)]/30 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-[var(--app-hover)] hover:text-black flex flex-col items-center text-xs md:text-sm">{t.rateEasy} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
      <button onClick={() => handleRate('skip')} className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 py-2.5 md:py-3 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 flex flex-col items-center text-xs md:text-sm">{t.rateSkip} <span className="text-[10px] md:text-xs font-normal opacity-70 mt-1">-</span></button>
    </div>}
  </div>;
}
// ─────────────────────────────────────────────────────────────────────────────
//  Root wrapper — handles the key gate BEFORE any other hooks are called
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [keyGranted, setKeyGranted] = useState(
    () => localStorage.getItem(KEY_STORAGE) === '1'
  );

  if (!keyGranted) return <KeyGate onUnlock={() => setKeyGranted(true)} />;
  return <AppInner />;
}
