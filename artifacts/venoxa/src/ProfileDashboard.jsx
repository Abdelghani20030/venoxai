import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  User, Mail, Calendar as CalendarIcon, Edit, Award, Trash2, LogOut,
  ChevronLeft, ChevronRight, Zap, Globe, Upload, Camera, X
} from 'lucide-react';
import { _resolveTranslation } from './translations.js';
import { deleteAccount as fbDeleteAccount } from './insforge.js';

// ─────────────────────────────────────────────────────────────────────────────
//  localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────
const USAGE_KEY    = 'venoxa_daily_usage_secs';   // { "2025-05-25": 3672, ... }
const CALENDAR_KEY = 'venoxa_calendar_progress';  // { "2025-05-25": { goalPct, usageSecs, streak } }
const AVATAR_KEY   = 'venoxa_local_avatar';        // base64 data-url (never sent to server)

const readLS  = (k, fb = {}) => { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch { return fb; } };
const writeLS = (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function todayStr() { return new Date().toISOString().slice(0, 10); }

// ─────────────────────────────────────────────────────────────────────────────
//  SVG line-chart helper
// ─────────────────────────────────────────────────────────────────────────────
function buildChartPaths(values, W = 360, H = 90) {
  if (!values.length) return { linePath: '', fillPath: '', points: [] };
  const maxVal = Math.max(...values, 1);
  const padX   = 20;
  const stepX  = (W - padX * 2) / Math.max(values.length - 1, 1);

  const pts = values.map((v, i) => ({
    x: padX + i * stepX,
    y: H - 10 - ((v / maxVal) * (H - 20)),
  }));

  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1];
    const cx1 = p0.x + stepX / 2, cx2 = p1.x - stepX / 2;
    line += ` C ${cx1} ${p0.y}, ${cx2} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const fill = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  return { linePath: line, fillPath: fill, points: pts };
}

function fmtSecs(s) {
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2,'0')}s`;
  if (m > 0) return `${m}m ${String(sec).padStart(2,'0')}s`;
  return `${sec}s`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileDashboard({
  user,
  token,
  logout,
  updateProfile,
  completedCells,
  streakData,
  planMeta,
  currentWeek,
  lang,
  theme,
  onOpenAuth,
  dailyGoalPct,
  onAvatarChange,
}) {
  const isDark = theme === 'dark';

  // ── i18n ──────────────────────────────────────────────────────────────────
  const t = {
    notLoggedIn:    _resolveTranslation(lang, 'يرجى تسجيل الدخول لعرض وتخصيص ملفك الشخصي.', 'Please log in to view and customize your profile.'),
    loginBtn:       _resolveTranslation(lang, 'تسجيل الدخول / إنشاء حساب', 'Log In / Create Account'),
    deleteConfirm:  _resolveTranslation(lang, 'هل أنت متأكد من حذف حسابك نهائياً؟', 'Are you sure you want to permanently delete your account?'),
    deleteBtn:      _resolveTranslation(lang, 'حذف الحساب', 'Delete Account'),
    basicPlan:      _resolveTranslation(lang, 'الخطة الأساسية', 'Basic Plan'),
    achievements:   _resolveTranslation(lang, 'الإنجازات', 'Achievements'),
    badgesCount:    (n) => _resolveTranslation(lang, `${n} أوسمة`, `${n} Badges`),
    usageTime:      _resolveTranslation(lang, 'وقت الاستخدام', 'Usage Time'),
    dailyGoal:      _resolveTranslation(lang, 'الهدف اليومي', 'Daily Goal'),
    overallProgress:_resolveTranslation(lang, 'التقدم الكلي', 'Overall Progress'),
    myLevel:        (l) => _resolveTranslation(lang, `مستواي: ${l}`, `My Level: ${l}`),
    streakTitle:    _resolveTranslation(lang, 'السلسلة', 'Streak'),
    daysUnit:       (d) => _resolveTranslation(lang, `${d} يوم`, `${d} day(s)`),
    editProfile:    _resolveTranslation(lang, 'تعديل الملف الشخصي', 'Edit Profile'),
    save:           _resolveTranslation(lang, 'حفظ', 'Save'),
    cancel:         _resolveTranslation(lang, 'إلغاء', 'Cancel'),
    usernameLabel:  _resolveTranslation(lang, 'اسم المستخدم', 'Username'),
    emailLabel:     _resolveTranslation(lang, 'البريد الإلكتروني', 'Email'),
    dobLabel:       _resolveTranslation(lang, 'تاريخ الميلاد', 'Birth Date'),
    genderLabel:    _resolveTranslation(lang, 'الجنس', 'Gender'),
    languagesLabel: _resolveTranslation(lang, 'اللغات التي تدرسها', 'Languages you study'),
    male:           _resolveTranslation(lang, 'ذكر', 'Male'),
    female:         _resolveTranslation(lang, 'أنثى', 'Female'),
    other:          _resolveTranslation(lang, 'آخر', 'Other'),
    uploadPhoto:    _resolveTranslation(lang, 'رفع صورة', 'Upload Photo'),
    noData:         _resolveTranslation(lang, 'لا توجد بيانات', 'No data'),
    week:           _resolveTranslation(lang, 'أسبوع', 'Week'),
    month:          _resolveTranslation(lang, 'شهر', 'Month'),
    today:          _resolveTranslation(lang, 'اليوم', 'Today'),
    goalAchieved:   _resolveTranslation(lang, '🎉 تم تحقيق الهدف!', '🎉 Goal Achieved!'),
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  AVATAR: stored in localStorage + synced to server for cross-device access
  // ─────────────────────────────────────────────────────────────────────────
  const [localAvatar, setLocalAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || '');

  // The displayed avatar: local override first, then server avatar, then initials
  const displayAvatar = localAvatar || user?.avatar || '';

  // ─────────────────────────────────────────────────────────────────────────
  //  USAGE TIME TRACKING
  //  • Tracks seconds per calendar-date in localStorage (venoxa_daily_usage_secs)
  //  • Uses visibilitychange + beforeunload to pause/resume and persist
  //  • At midnight the date key rolls over automatically (new key = new 0)
  // ─────────────────────────────────────────────────────────────────────────
  const tickRef       = useRef(null);   // setInterval id
  const activeFromRef = useRef(null);   // Date.now() when page became visible
  const [liveSecs, setLiveSecs] = useState(0); // re-render trigger

  // Persist accumulated seconds for today
  const flushUsage = useCallback(() => {
    if (activeFromRef.current == null) return;
    const elapsed = Math.floor((Date.now() - activeFromRef.current) / 1000);
    if (elapsed <= 0) return;
    const today = todayStr();
    const store = readLS(USAGE_KEY);
    store[today] = (store[today] || 0) + elapsed;
    writeLS(USAGE_KEY, store);
    activeFromRef.current = Date.now(); // reset so we don't double-count
  }, []);

  useEffect(() => {
    // Start tracking immediately (page is visible)
    activeFromRef.current = Date.now();

    // Tick every second to update displayed time
    tickRef.current = setInterval(() => {
      // Flush accumulated seconds once per second
      const today = todayStr();
      if (activeFromRef.current != null) {
        const partial = Math.floor((Date.now() - activeFromRef.current) / 1000);
        const store   = readLS(USAGE_KEY);
        setLiveSecs((store[today] || 0) + partial);
      }
    }, 1000);

    // Pause when tab is hidden, resume when visible
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushUsage();
        activeFromRef.current = null;
      } else {
        activeFromRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Persist on page unload
    window.addEventListener('beforeunload', flushUsage);

    return () => {
      flushUsage();
      clearInterval(tickRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', flushUsage);
    };
  }, [flushUsage]);

  // Seconds accumulated today (for display)
  const todaySecsTotal = liveSecs;

  // ─────────────────────────────────────────────────────────────────────────
  //  USAGE CHART: week / month view
  // ─────────────────────────────────────────────────────────────────────────
  const [chartView,   setChartView]   = useState('week'); // 'week' | 'month'
  const [chartOffset, setChartOffset] = useState(0);      // 0 = current, -1 = prev, etc.

  const chartData = useMemo(() => {
    const store = readLS(USAGE_KEY);
    const now   = new Date();

    if (chartView === 'week') {
      // Build 7 days starting from Monday of the target week
      const base = new Date(now);
      base.setDate(base.getDate() + chartOffset * 7);
      // Find Monday
      const dow = base.getDay(); // 0=Sun
      const monday = new Date(base);
      monday.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1));

      const labels = [], values = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        const dayName = d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' });
        labels.push(dayName.slice(0, 3));
        values.push((store[key] || 0) / 60); // in minutes
      }
      const rangeLabel = monday.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US',
        { month: 'short', day: 'numeric' }) + ' – ' +
        new Date(monday.getTime() + 6 * 86400000).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US',
        { month: 'short', day: 'numeric' });
      return { labels, values, rangeLabel };
    } else {
      // Month view: each day of the target month
      const base = new Date(now.getFullYear(), now.getMonth() + chartOffset, 1);
      const totalDays = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      const labels = [], values = [];
      for (let d = 1; d <= totalDays; d++) {
        const key = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        // Show day number every 5 days to avoid clutter
        labels.push(d % 5 === 1 || d === totalDays ? String(d) : '');
        values.push((store[key] || 0) / 60);
      }
      const rangeLabel = base.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US',
        { month: 'long', year: 'numeric' });
      return { labels, values, rangeLabel };
    }
  }, [chartView, chartOffset, lang, liveSecs]); // liveSecs forces refresh

  const { linePath, fillPath, points } = buildChartPaths(chartData.values);

  // ─────────────────────────────────────────────────────────────────────────
  //  DAILY GOAL (mirrors home screen)
  // ─────────────────────────────────────────────────────────────────────────
  const goalPct       = typeof dailyGoalPct === 'number' ? dailyGoalPct : 0;
  const radius        = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset  = circumference - (goalPct / 100) * circumference;

  // ─────────────────────────────────────────────────────────────────────────
  //  CALENDAR
  // ─────────────────────────────────────────────────────────────────────────
  const [calendarStore, setCalendarStore] = useState(() => readLS(CALENDAR_KEY));
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(null);

  // Snapshot today every time goalPct changes
  useEffect(() => {
    const today = todayStr();
    const store = readLS(CALENDAR_KEY);
    store[today] = {
      goalPct,
      usageSecs: todaySecsTotal,
      streak: streakData?.current || 0,
    };
    writeLS(CALENDAR_KEY, store);
    setCalendarStore({ ...store });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalPct, todaySecsTotal]);

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const total    = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const offset   = firstDow === 0 ? 6 : firstDow - 1;
    const label    = new Date(year, month, 1).toLocaleDateString(
      lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= total; d++) {
      const key  = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const snap = calendarStore[key];
      const color = snap ? (snap.goalPct >= 60 ? 'gold' : 'blue') : 'none';
      days.push({ dayNum: d, dateStr: key, color, snap });
    }
    return { days, label };
  }, [calendarMonth, calendarStore, lang]);

  // ─────────────────────────────────────────────────────────────────────────
  //  OVERALL PROGRESS (CEFR level from plan table)
  // ─────────────────────────────────────────────────────────────────────────
  const CEFR = ['A1','A2','B1','B2','C1','C2'];
  const derivedLevel = useMemo(() => {
    if (planMeta?.totalWeeks && planMeta?.userLevel && currentWeek) {
      const idx0   = CEFR.indexOf((planMeta.userLevel + '').toUpperCase().slice(0,2));
      const pct    = Math.min(1, (currentWeek - 1) / planMeta.totalWeeks);
      const tiers  = Math.floor(pct * 2);
      return CEFR[Math.min(CEFR.length - 1, Math.max(0, idx0 + tiers))];
    }
    return (user?.level || 'B2').toUpperCase().slice(0,2);
  }, [planMeta, currentWeek, user?.level]);

  const levelColor = (lvl, active) => {
    if (!active) return isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400';
    return { A1:'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
             A2:'bg-emerald-600/35 text-emerald-300 border-emerald-600/40',
             B1:'bg-amber-400/20 text-amber-400 border-amber-400/30',
             B2:'bg-amber-500/30 text-amber-300 border-amber-500/40',
             C1:'bg-orange-500/20 text-orange-400 border-orange-500/30',
             C2:'bg-rose-500/20 text-rose-400 border-rose-500/30' }[lvl]
           || 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  ACHIEVEMENTS (streak badges)
  // ─────────────────────────────────────────────────────────────────────────
  const streak = streakData?.current || user?.streak || 0;
  const BADGES = [
    { id:'silver',       label:'Silver',        req:2,  desc:'2 Days Streak',   grad:'from-slate-300/30 to-slate-400/40',   border:'border-slate-400/50', txt:'text-slate-300',  rib:'bg-slate-400 text-gray-900' },
    { id:'bronze',       label:'Bronze',        req:7,  desc:'1 Week Streak',   grad:'from-amber-600/30 to-yellow-700/40',  border:'border-amber-600/50', txt:'text-amber-500',  rib:'bg-amber-600 text-white'   },
    { id:'platinum',     label:'Platinum',      req:14, desc:'2 Week Streak',   grad:'from-cyan-400/30 to-teal-400/40',     border:'border-cyan-400/50',  txt:'text-cyan-300',   rib:'bg-cyan-500 text-white'    },
    { id:'diamond',      label:'Diamond',       req:30, desc:'30 Days Streak',  grad:'from-blue-400/30 to-indigo-500/40',   border:'border-blue-400/50',  txt:'text-blue-300',   rib:'bg-blue-500 text-white'    },
    { id:'beyond',       label:'Beyond Limits', req:60, desc:'2 Months Streak', grad:'from-purple-400/30 to-pink-500/40',   border:'border-purple-400/50',txt:'text-purple-300', rib:'bg-purple-500 text-white'  },
  ];
  const earned = BADGES.filter(b => streak >= b.req);
  const locked = BADGES.filter(b => streak < b.req);

  // ─────────────────────────────────────────────────────────────────────────
  //  EDIT STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [isEditing,   setIsEditing]   = useState(false);
  const [editName,    setEditName]    = useState('');
  const [editEmail,   setEditEmail]   = useState('');
  const [editDob,     setEditDob]     = useState('');
  const [editGender,  setEditGender]  = useState('');
  const [editLangs,   setEditLangs]   = useState('');
  const [avatarDraft, setAvatarDraft] = useState(''); // base64 preview inside modal
  const fileRef = useRef(null);

  const startEdit = () => {
    if (!user) return;
    setEditName(user?.username || '');
    setEditEmail(user?.email || '');
    setEditDob(user?.dob || '');
    setEditGender(user?.gender || 'Male');
    setEditLangs(user?.languages ? user.languages.join(', ') : '');
    setAvatarDraft(localAvatar || user?.avatar || '');
    setIsEditing(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarDraft(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Avatar is stored in localStorage AND synced to the server for cross-device access
  const handleSave = async (e) => {
    e.preventDefault();
    // 1. Save avatar locally for instant display
    if (avatarDraft) {
      localStorage.setItem(AVATAR_KEY, avatarDraft);
      setLocalAvatar(avatarDraft);
      // Notify parent (App.jsx) so the nav icon updates in the same tab
      if (onAvatarChange) onAvatarChange(avatarDraft);
    }
    // 2. Send all fields to the server (including avatar for cross-device sync)
    const langsArr = editLangs.split(',').map(l => l.trim()).filter(Boolean);
    await updateProfile({
      username:  editName,
      email:     editEmail,
      dob:       editDob,
      gender:    editGender,
      languages: langsArr,
      avatar:    avatarDraft || undefined,
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await fbDeleteAccount(user?.uid);
      localStorage.removeItem(AVATAR_KEY);
      logout();
    } catch (err) {
      console.error('Delete account error:', err);
      alert('An error occurred while deleting your account.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  GUEST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fadeIn">
        <div className="max-w-md p-8 home-glass-card border-white/10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center text-purple-400 animate-pulse">
            <User size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-black dark:text-white">
            {_resolveTranslation(lang, 'الملف الشخصي', 'Personalized Profile')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#A0A0B0] leading-relaxed">{t.notLoggedIn}</p>
          <button onClick={onOpenAuth}
            className="w-full py-3.5 rounded-2xl font-bold text-white bg-[var(--app-accent1)] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg">
            {t.loginBtn}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fadeIn relative z-10 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ═══════════ LEFT: User Card + Achievements ═══════════ */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* User Card */}
          <div className="home-glass-card p-6 flex flex-col items-center relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <button onClick={startEdit}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title={t.editProfile}>
              <Edit size={16} />
            </button>

            {/* Avatar */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-xl mb-4 group-hover:scale-105 transition-transform duration-300">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover"
                  onError={e => { e.target.style.display='none'; }} />
              ) : (
                <div className="w-full h-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-3xl">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <span className="px-3 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white/10 text-gray-300 rounded-md border border-white/15 mb-3">
              {t.basicPlan}
            </span>
            <h3 className="text-xl font-extrabold text-black dark:text-white mb-0.5">{user?.username || ''}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-1.5 font-medium">
              <Mail size={12} /> {user?.email || ''}
            </p>

            <div className="w-full space-y-3.5 border-t border-black/5 dark:border-white/8 pt-5 text-sm font-semibold text-gray-600 dark:text-[#B0B0C5]">
              {user?.dob && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><CalendarIcon size={14} className="opacity-60" />{t.dobLabel}</span>
                  <span className="text-black dark:text-white font-bold">{user.dob}</span>
                </div>
              )}
              {user?.gender && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><User size={14} className="opacity-60" />{t.genderLabel}</span>
                  <span className="text-black dark:text-white font-bold">
                    {user?.gender === 'Male' ? t.male : user?.gender === 'Female' ? t.female : t.other}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <span className="flex items-center gap-2 shrink-0"><Globe size={14} className="opacity-60" />{t.languagesLabel}</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {(user?.languages || []).map(l => (
                    <span key={l} className="px-2 py-0.5 text-[11px] rounded bg-purple-500/15 text-purple-400 font-bold">{l}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full mt-8 flex flex-col gap-2">
              <button onClick={logout}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-1.5">
                <LogOut size={14} /> {_resolveTranslation(lang, 'تسجيل الخروج', 'Log Out')}
              </button>
              <button onClick={handleDeleteAccount}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-red-500 hover:text-red-400 border border-red-500/20 hover:bg-red-500/5 transition-all flex items-center justify-center gap-1.5">
                <Trash2 size={14} /> {t.deleteBtn}
              </button>
            </div>
          </div>

          {/* Achievements */}
          <div className="home-glass-card p-6 flex flex-col">
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t.achievements}</h4>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500"><Award size={18} /></div>
              <span className="text-xl font-black text-black dark:text-white">{t.badgesCount(earned.length)}</span>
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
              {earned.map(b => (
                <div key={b.id} title={b.desc}
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${b.grad} border ${b.border} flex items-center justify-center ${b.txt} relative group cursor-pointer shadow-lg`}>
                  <Award size={20} className="group-hover:scale-110 transition-transform" />
                  <span className={`absolute -bottom-1 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider rounded whitespace-nowrap ${b.rib}`}>{b.label}</span>
                </div>
              ))}
              {locked.map(b => (
                <div key={b.id} title={`${b.desc} (need ${b.req - streak} more days)`}
                  className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-gray-700 relative group cursor-pointer">
                  <Award size={16} className="opacity-20 group-hover:opacity-40 transition-opacity" />
                  <span className="absolute -bottom-1 px-1.5 py-0.5 text-[7px] font-black bg-gray-700 text-gray-400 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{b.req}d</span>
                </div>
              ))}
            </div>
            {locked.length > 0 && (
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                {_resolveTranslation(lang,
                  `${locked[0].req - streak} أيام للوصول إلى ${locked[0].label}`,
                  `${locked[0].req - streak} more days to earn ${locked[0].label}`)}
              </p>
            )}
          </div>
        </div>

        {/* ═══════════ CENTER: Usage Chart + Daily Goal + Overall Progress ═══════════ */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* ── Usage Time Chart ── */}
          <div className="home-glass-card p-6 flex flex-col">
            {/* Header row */}
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.usageTime}</h4>
              {/* Week / Month toggle */}
              <div className="flex gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                {['week','month'].map(v => (
                  <button key={v} onClick={() => { setChartView(v); setChartOffset(0); }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      chartView === v
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                        : 'text-gray-500 hover:text-white'
                    }`}>
                    {v === 'week' ? t.week : t.month}
                  </button>
                ))}
              </div>
            </div>

            {/* Range label + nav */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-500">{chartData.rangeLabel}</span>
              <div className="flex gap-1">
                <button onClick={() => setChartOffset(o => o - 1)}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
                  <ChevronLeft size={13} />
                </button>
                <button onClick={() => setChartOffset(o => Math.min(0, o + 1))}
                  disabled={chartOffset >= 0}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-all disabled:opacity-30">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Today's time badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                <Zap size={14} fill="currentColor" />
              </div>
              <span className="text-base font-black text-black dark:text-white tabular-nums">{fmtSecs(todaySecsTotal)}</span>
              <span className="text-[10px] text-gray-500 font-semibold">{t.today}</span>
            </div>

            {/* SVG line chart */}
            <div className="relative w-full h-[120px]" style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              <div className="absolute inset-x-0 top-3 border-t border-dashed border-white/5" />
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/5" />
              <div className="absolute inset-x-0 bottom-3 border-t border-dashed border-white/5" />

              <svg viewBox="0 -24 360 114" className="w-full h-full" style={{ overflow: 'visible' }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="usageLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                {fillPath && <path d={fillPath} fill="url(#usageFill)" />}
                {linePath && (
                  <path d={linePath} fill="none" stroke="url(#usageLine)"
                    strokeWidth="2.5" strokeLinecap="round" />
                )}
                {points.map((pt, i) => {
                  const tipY = Math.max(-20, pt.y - 24);
                  return (
                    <g key={i} className="cursor-pointer group">
                      <circle cx={pt.x} cy={pt.y} r="3.5"
                        fill={isDark ? '#0f172a' : '#fff'}
                        stroke="#8b5cf6" strokeWidth="2"
                        className="group-hover:r-5 transition-all" />
                      {/* Tooltip */}
                      <rect x={pt.x - 18} y={tipY} width="36" height="14" rx="4"
                        fill="#8b5cf6" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <text x={pt.x} y={tipY + 10} fill="white" fontSize="8" fontWeight="bold"
                        textAnchor="middle"
                        className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {Math.round(chartData.values[i])}m
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className={`flex justify-between mt-2 text-[9px] font-bold text-gray-500 ${
              chartData.labels.length > 14 ? 'overflow-hidden' : ''
            }`}>
              {chartData.labels.map((l, i) => (
                <span key={i} className="text-center" style={{ minWidth: 0, flex: '1' }}>{l}</span>
              ))}
            </div>
          </div>

          {/* ── Daily Goal ── */}
          <div className="home-glass-card p-6 flex flex-col">
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5">{t.dailyGoal}</h4>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="goalG" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r={radius} className="stroke-black/5 dark:stroke-white/5" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r={radius} stroke="url(#goalG)" strokeWidth="8"
                    fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeOffset}
                    strokeLinecap="round" className="transition-all duration-700 ease-out" />
                </svg>
                <div className="absolute w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Zap size={22} fill="currentColor" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.today}</div>
                <div className="text-4xl font-black text-black dark:text-white leading-none">{goalPct}%</div>
                {goalPct >= 100
                  ? <div className="text-xs font-semibold text-emerald-500">{t.goalAchieved}</div>
                  : <div className="text-xs font-semibold text-rose-400">
                      {_resolveTranslation(lang, `${100 - goalPct}% متبقي`, `${100 - goalPct}% remaining`)}
                    </div>}
              </div>
            </div>
          </div>

          {/* ── Overall Progress ── */}
          <div className="home-glass-card p-6 flex flex-col">
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-6">{t.overallProgress}</h4>
            <div className="grid grid-cols-6 gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-2xl border border-white/5 mb-4">
              {CEFR.map(lvl => (
                <div key={lvl}
                  className={`py-3 text-sm font-extrabold rounded-xl text-center border transition-all ${levelColor(lvl, lvl === derivedLevel)} ${
                    lvl === derivedLevel ? 'scale-105 shadow-lg ring-2 ring-purple-500/20' : 'border-transparent'
                  }`}>
                  {lvl}
                </div>
              ))}
            </div>
            <div className="text-center py-2 text-xs font-bold text-gray-400 dark:text-gray-500 bg-purple-500/5 border border-purple-500/10 rounded-xl">
              {t.myLevel(derivedLevel)}
              {planMeta?.totalWeeks && currentWeek && (
                <span className="ml-2 opacity-60">
                  · {_resolveTranslation(lang, `الأسبوع ${currentWeek} من ${planMeta.totalWeeks}`, `Week ${currentWeek} of ${planMeta.totalWeeks}`)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT: Calendar + Streak ═══════════ */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Smart Calendar */}
          <div className="home-glass-card p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {calendarDays.label}
              </h5>
              <div className="flex gap-1">
                <button onClick={() => setCalendarMonth(({ year, month }) =>
                  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 })}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setCalendarMonth(({ year, month }) =>
                  month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 })}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-[10px] font-black text-gray-500 text-center mb-2">
              {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                <span key={d}>{_resolveTranslation(lang,
                  {Mo:'إث',Tu:'ثل',We:'أر',Th:'خم',Fr:'جم',Sa:'سب',Su:'أح'}[d], d)}</span>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {calendarDays.days.map((d, idx) => {
                if (!d) return <div key={`e-${idx}`} className="w-8 h-8" />;
                const sel = selectedDay?.dateStr === d.dateStr;
                const cls = d.color === 'gold'
                  ? 'bg-yellow-400 text-gray-900 shadow-md shadow-yellow-400/30 scale-105'
                  : d.color === 'blue'
                    ? 'bg-blue-500/60 text-white'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-white/5';
                return (
                  <button key={d.dateStr}
                    onClick={() => setSelectedDay(sel ? null : d)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all ${cls} ${sel ? 'ring-2 ring-white/50' : ''}`}>
                    {d.dayNum}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block shrink-0" />
              <span className="text-[9px] text-gray-500 font-semibold mr-2">
                {_resolveTranslation(lang, 'تقدم ممتاز (≥60%)', 'Great (≥60%)')}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500/60 inline-block shrink-0" />
              <span className="text-[9px] text-gray-500 font-semibold">
                {_resolveTranslation(lang, 'متوسط / منخفض', 'Medium/low')}
              </span>
            </div>

            {/* Selected day popup */}
            {selectedDay && (
              <div className="mt-3 p-3 bg-black/20 rounded-xl border border-white/10 text-xs space-y-1.5 animate-fadeIn">
                <div className="font-bold text-white text-[11px] mb-1">{selectedDay.dateStr}</div>
                {selectedDay.snap ? (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>{t.dailyGoal}</span>
                      <span className="text-white font-bold">{selectedDay.snap.goalPct}%</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>{t.usageTime}</span>
                      <span className="text-white font-bold">{fmtSecs(selectedDay.snap.usageSecs || 0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>{t.streakTitle}</span>
                      <span className="text-white font-bold">{selectedDay.snap.streak}d</span>
                    </div>
                  </>
                ) : <div className="text-gray-500">{t.noData}</div>}
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="home-glass-card p-4 flex items-center gap-4 border-l-4 border-l-orange-500/50 hover:translate-x-1 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
              <Zap size={20} fill="currentColor" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-black text-black dark:text-white">{t.daysUnit(streak)}</div>
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.streakTitle}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EDIT MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg home-glass-card border-white/10 p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="text-lg font-extrabold text-black dark:text-white flex items-center gap-2">
                <Edit size={20} className="text-purple-400" /> {t.editProfile}
              </h3>
              <button onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">

              {/* Photo upload — purely client-side, no server payload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.uploadPhoto}</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/40 shrink-0 bg-purple-500/5 flex items-center justify-center">
                    {avatarDraft
                      ? <img src={avatarDraft} alt="Preview" className="w-full h-full object-cover" />
                      : <Camera size={22} className="text-purple-400 opacity-50" />}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                    <Upload size={14} />
                    {_resolveTranslation(lang, 'اختر من جهازك', 'Choose from device')}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                {avatarDraft && (
                  <button type="button" onClick={() => setAvatarDraft('')}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors">
                    {_resolveTranslation(lang, 'إزالة الصورة', 'Remove photo')}
                  </button>
                )}
                <p className="text-[9px] text-gray-600 dark:text-gray-500 font-medium">
                  {_resolveTranslation(lang, 'الصورة تُحفظ و تُزامن على جميع الأجهزة.', 'Photo syncs across all your devices.')}
                </p>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.usernameLabel}</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold" />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.emailLabel}</label>
                <input type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold" />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.genderLabel}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male','Female','Other'].map(g => (
                    <button key={g} type="button" onClick={() => setEditGender(g)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        editGender === g
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                      }`}>
                      {g === 'Male' ? t.male : g === 'Female' ? t.female : t.other}
                    </button>
                  ))}
                </div>
              </div>

              {/* DOB */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.dobLabel}</label>
                <input type="text" placeholder="e.g. January 2003" value={editDob} onChange={e => setEditDob(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold" />
              </div>

              {/* Languages */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.languagesLabel}</label>
                <input type="text" placeholder="e.g. English, Arabic" value={editLangs} onChange={e => setEditLangs(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm font-semibold" />
                <span className="text-[10px] font-semibold text-gray-500 block">Comma-separated.</span>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                <button type="button" onClick={() => setIsEditing(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5">
                  {t.cancel}
                </button>
                <button type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-[var(--app-accent1)] text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
