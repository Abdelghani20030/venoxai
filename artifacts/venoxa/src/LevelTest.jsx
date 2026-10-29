// artifacts/venoxa/src/LevelTest.jsx
//
// Venoxa Level Test — adaptive CEFR placement test UI.
//
// The browser only ever receives stem/options/passage/audio metadata. Correct
// answers, difficulties and the ability estimate live on the server.
//
// Screens: start → question (grammar/vocab/reading/listening) → result →
// certificate preview, plus the public #/verify/VX-... page.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Headphones,
  Info,
  Languages,
  Loader2,
  Lock,
  PenLine,
  Play,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Volume2,
  X,
} from 'lucide-react';
import { supabase } from './supabase-config.js';
import { _resolveTranslation } from './translations.js';

const API = '/api/level-test';
const RESULT_KEY = 'venoxa_level_test_result';
const ACTIVE_KEY = 'venoxa_level_test_active';
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SKILLS = ['reading', 'grammar', 'vocab', 'listening'];

const LEVEL_LABELS = {
  A1: ['مبتدئ', 'Beginner'],
  A2: ['أساسي', 'Elementary'],
  B1: ['متوسط', 'Intermediate'],
  B2: ['متوسط أعلى', 'Upper Intermediate'],
  C1: ['متقدم', 'Advanced'],
  C2: ['إتقان', 'Proficient'],
};

const TYPE_STYLES = {
  grammar:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  vocab:
    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
  reading:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  listening:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
};

const WAVE = [
  10, 22, 15, 30, 18, 34, 24, 14, 28, 38, 20, 12, 26, 33, 17, 25, 36, 21, 13,
  29, 19, 31, 23, 16, 27, 35, 20, 11, 24, 32, 18, 26, 37, 22, 14, 28, 34, 19,
  12, 25, 30, 16, 27, 21, 33, 15, 23, 29,
];

function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(value, lang) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function parseTime(value) {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? ms : null;
}

async function authToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function apiFetch(path, options = {}) {
  const token = await authToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* empty body */
  }
  return { response, data };
}

function readStoredResult() {
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function LevelTest({
  lang = 'en',
  theme = 'light',
  userLevel = 'B2',
  levelTest = null,
  onComplete,
  onApplyPlan,
  onOpenAuth,
  onGoHome,
}) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [view, setView] = useState('start');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [latest, setLatest] = useState(() => levelTest || readStoredResult());
  const [certName, setCertName] = useState('');
  const [cooldown, setCooldown] = useState(null);
  const [hasActive, setHasActive] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [sessionId, setSessionId] = useState('');
  const [mode, setMode] = useState('standard');
  const [item, setItem] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deadlineIso, setDeadlineIso] = useState('');
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [exitOpen, setExitOpen] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [playsLeft, setPlaysLeft] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioFailed, setAudioFailed] = useState(false);
  const [result, setResult] = useState(null);
  const [showCert, setShowCert] = useState(false);
  const [certBusy, setCertBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const [verifyId, setVerifyId] = useState('');
  const [verifyState, setVerifyState] = useState({ loading: false, data: null, error: '' });
  const [verifyInput, setVerifyInput] = useState('');

  const audioRef = useRef(null);
  const questionStartRef = useRef(Date.now());
  const timeoutHandledRef = useRef(false);
  const hashHandledRef = useRef(false);

  /* ── auth ─────────────────────────────────────────────────────────────── */

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSignedIn(Boolean(data?.session));
        setAuthReady(true);
      })
      .catch(() => mounted && setAuthReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSignedIn(Boolean(session));
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (levelTest) setLatest(levelTest);
  }, [levelTest]);

  /* ── public verify hash ───────────────────────────────────────────────── */

  useEffect(() => {
    const parseHash = () => {
      const match = window.location.hash.match(/^#\/verify\/([A-Za-z0-9-]+)/);
      if (match) {
        setVerifyId(match[1].toUpperCase());
        setVerifyInput(match[1].toUpperCase());
        setView('verify');
        hashHandledRef.current = true;
      }
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  useEffect(() => {
    if (view !== 'verify' || !verifyId) return;
    let cancelled = false;
    setVerifyState({ loading: true, data: null, error: '' });
    fetch(`${API}/verify/${encodeURIComponent(verifyId)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (response.ok && data?.valid) {
          setVerifyState({ loading: false, data, error: '' });
        } else {
          setVerifyState({
            loading: false,
            data: null,
            error: T('لم يتم العثور على شهادة بهذا الرقم.', 'No certificate was found with that ID.'),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVerifyState({
            loading: false,
            data: null,
            error: T('تعذر التحقق الآن. حاول مرة أخرى.', 'Verification is unavailable right now. Try again.'),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [view, verifyId, lang]);

  /* ── timer ────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (view !== 'test') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [view]);

  const remainingSec = useMemo(() => {
    const deadline = parseTime(deadlineIso);
    if (!deadline) return null;
    return Math.max(0, Math.ceil((deadline - (now + serverOffset)) / 1000));
  }, [deadlineIso, now, serverOffset]);

  const expireSession = async () => {
    if (!sessionId || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    setTimeUp(true);
    setBusy(true);
    try {
      const { response, data } = await apiFetch('/expire', {
        method: 'POST',
        body: { sessionId },
      });
      if (response.status === 409 && data?.deadline) {
        setDeadlineIso(data.deadline);
        setServerOffset((parseTime(data.serverNow) || Date.now()) - Date.now());
        timeoutHandledRef.current = false;
        setTimeUp(false);
        return;
      }
      if (response.ok && data?.done) {
        if (data.result) finishTest(data.result, true);
        else setView('expired');
        return;
      }
      if (response.status === 401) {
        setSignedIn(false);
        setError(T('انتهت الجلسة. سجّل الدخول للمتابعة.', 'Your session expired. Please sign in again.'));
        return;
      }
      setError(T('تعذر إنهاء الاختبار. حاول مرة أخرى.', 'Could not finish the test. Please try again.'));
    } catch {
      setError(T('تعذر الاتصال بالخادم.', 'Could not reach the server.'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (view !== 'test' || remainingSec === null) return;
    if (remainingSec > 0) {
      timeoutHandledRef.current = false;
      return;
    }
    if (!timeoutHandledRef.current) expireSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec, view]);

  /* ── browser back / refresh guard ─────────────────────────────────────── */

  useEffect(() => {
    if (view !== 'test') return undefined;
    try {
      window.history.pushState(null, '', window.location.href);
    } catch {
      /* ignore */
    }
    const onPop = () => {
      try {
        window.history.pushState(null, '', window.location.href);
      } catch {
        /* ignore */
      }
      setExitOpen(true);
    };
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [view]);

  /* ── test actions ─────────────────────────────────────────────────────── */

  const applyItem = (nextItem, nextDeadline) => {
    setItem(nextItem);
    setSelected(null);
    setPlaysLeft(nextItem?.type === 'listening' ? Math.max(0, nextItem.audioPlays ?? 1) : 0);
    setPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
    setAudioFailed(false);
    setDeadlineIso(nextDeadline || nextItem?.deadline || '');
    const serverNow = parseTime(nextItem?.serverNow);
    setServerOffset(serverNow ? serverNow - Date.now() : 0);
    questionStartRef.current = Date.now();
    timeoutHandledRef.current = false;
    setTimeUp(false);
    setError('');
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      /* ignore */
    }
  };

  const finishTest = (nextResult, live) => {
    if (!nextResult) {
      setView('expired');
      return;
    }
    setResult(nextResult);
    setView('result');
    try {
      localStorage.removeItem(ACTIVE_KEY);
    } catch {
      /* ignore */
    }
    setHasActive(false);
    setShowCert(false);
    if (live) {
      const record = {
        sessionId: nextResult.sessionId,
        certId: nextResult.certId,
        name: nextResult.name,
        level: nextResult.level,
        score: nextResult.score,
        range: nextResult.range,
        sections: nextResult.sections,
        answered: nextResult.answered,
        provisional: nextResult.provisional,
        date: nextResult.date,
        xpAwarded: 150,
        achievement: 'level-explorer',
      };
      try {
        localStorage.setItem(RESULT_KEY, JSON.stringify(record));
      } catch {
        /* ignore */
      }
      setLatest(record);
      onComplete?.(record);
    }
  };

  const startTest = async (nextMode = 'standard') => {
    if (!signedIn) {
      onOpenAuth?.();
      return;
    }
    const cleanName = certName.trim().replace(/\s+/g, ' ');
    if (cleanName && !/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(cleanName)) {
      setError(
        T(
          'استخدم الحروف اللاتينية فقط في اسم الشهادة (بدون نص عربي).',
          'Use Latin letters only for the certificate name (no Arabic text).',
        ),
      );
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    setCooldown(null);
    try {
      const { response, data } = await apiFetch('/start', {
        method: 'POST',
        body: { mode: nextMode, name: cleanName || undefined },
      });
      if (response.status === 401) {
        setSignedIn(false);
        setError(T('سجّل الدخول لبدء الاختبار.', 'Please sign in to start the test.'));
        return;
      }
      if (response.status === 429 && data?.error === 'cooldown') {
        setCooldown(data);
        return;
      }
      if (!response.ok) {
        setError(data?.message || data?.error || T('تعذر بدء الاختبار.', 'Could not start the test.'));
        return;
      }
      if (data?.done) {
        if (data.result) finishTest(data.result, true);
        else setView('expired');
        return;
      }
      if (!data?.item) {
        setError(T('لا توجد أسئلة متاحة حالياً.', 'No questions are available right now.'));
        return;
      }
      setMode(nextMode);
      setSessionId(data.sessionId);
      applyItem(data.item, data.deadline);
      setView('test');
      setHasActive(true);
      try {
        localStorage.setItem(ACTIVE_KEY, '1');
      } catch {
        /* ignore */
      }
      if (data.resumed) setNotice(T('تمت استئناف جلستك.', 'Your session was resumed.'));
    } catch {
      setError(T('تعذر الاتصال بالخادم.', 'Could not reach the server.'));
    } finally {
      setBusy(false);
    }
  };

  const resync = async () => {
    try {
      const { response, data } = await apiFetch('/start', {
        method: 'POST',
        body: { mode },
      });
      if (response.ok && data?.item) {
        setSessionId(data.sessionId);
        applyItem(data.item, data.deadline);
        setNotice(T('تمت مزامنة الجلسة.', 'Session resynced.'));
        return;
      }
      if (response.ok && data?.done) {
        if (data.result) finishTest(data.result, true);
        else setView('expired');
        return;
      }
      setError(T('تعذرت مزامنة الجلسة. أعد تحميل الصفحة.', 'Could not resync the session. Reload the page.'));
    } catch {
      setError(T('تعذر الاتصال بالخادم.', 'Could not reach the server.'));
    }
  };

  const submitAnswer = async () => {
    if (selected === null || busy || !item || !sessionId) return;
    setBusy(true);
    setError('');
    const timeMs = Math.max(0, Date.now() - questionStartRef.current);
    try {
      const { response, data } = await apiFetch('/answer', {
        method: 'POST',
        body: { sessionId, itemId: item.id, choiceIndex: selected, timeMs },
      });
      if (response.status === 401) {
        setSignedIn(false);
        setError(T('انتهت الجلسة. سجّل الدخول للمتابعة.', 'Your session expired. Please sign in again.'));
        return;
      }
      if (response.status === 409) {
        await resync();
        return;
      }
      if (!response.ok) {
        setError(data?.error || T('تعذر إرسال الإجابة.', 'Could not submit the answer.'));
        return;
      }
      if (data?.done) {
        if (data.result) finishTest(data.result, true);
        else setView('expired');
        return;
      }
      if (data?.item) applyItem(data.item, data.deadline);
    } catch {
      setError(T('تعذر الاتصال بالخادم.', 'Could not reach the server.'));
    } finally {
      setBusy(false);
    }
  };

  /* ── keyboard ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (view !== 'test' || exitOpen) return undefined;
    const onKey = (event) => {
      if (event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        setSelected(Number(event.key) - 1);
      } else if (event.key === 'Enter' && selected !== null && !busy) {
        event.preventDefault();
        submitAnswer();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, exitOpen, selected, busy, item, sessionId]);

  /* ── audio ────────────────────────────────────────────────────────────── */

  const playAudio = async () => {
    if (!item?.audioUrl || playsLeft <= 0 || playing) return;
    const audio = audioRef.current;
    if (!audio) return;
    setPlaysLeft(0);
    setAudioFailed(false);
    setPlaying(true);
    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      setPlaying(false);
      setAudioFailed(true);
    }
  };

  const onAudioTime = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioProgress(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    if (Number.isFinite(audio.duration) && audio.duration > 0) setAudioDuration(audio.duration);
  };

  /* ── render helpers ───────────────────────────────────────────────────── */

  const typeLabel = (type) => {
    const map = {
      grammar: T('قواعد', 'Grammar'),
      vocab: T('مفردات', 'Vocabulary'),
      reading: T('قراءة', 'Reading'),
      listening: T('استماع', 'Listening'),
    };
    return map[type] || type;
  };

  const typeInstruction = (type) => {
    const map = {
      grammar: T('اختر أفضل إجابة', 'Choose the best answer'),
      vocab: T('اختر المعنى الأقرب', 'Choose the closest meaning'),
      reading: T('اقرأ النص ثم أجب', 'Read the passage, then answer'),
      listening: T('الصوت يعمل مرة واحدة', 'The audio plays once'),
    };
    return map[type] || '';
  };

  const levelLabel = (level) => {
    const entry = LEVEL_LABELS[level] || LEVEL_LABELS.B2;
    return T(entry[0], entry[1]);
  };

  const sectionLabel = (section) => {
    const map = {
      reading: T('قراءة', 'Reading'),
      grammar: T('قواعد', 'Grammar'),
      vocab: T('مفردات', 'Vocabulary'),
      listening: T('استماع', 'Listening'),
    };
    return map[section] || section;
  };

  const renderStem = (stem) => {
    const text = String(stem || '');
    const parts = text.split(/_{3,}/);
    if (parts.length === 1) return text;
    return parts.map((part, index) => (
      <React.Fragment key={`${index}-${part.slice(0, 8)}`}>
        {part}
        {index < parts.length - 1 && (
          <span className="mx-1 inline-block min-w-[58px] border-b-2 border-[#0E4AA4] align-baseline dark:border-blue-400">
            &nbsp;
          </span>
        )}
      </React.Fragment>
    ));
  };

  const downloadCertificate = async (certId) => {
    if (!certId || certBusy) return;
    setCertBusy(true);
    setError('');
    try {
      const token = await authToken();
      const response = await fetch(`${API}/certificate/${encodeURIComponent(certId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        setError(T('تعذر تنزيل الشهادة. حاول مرة أخرى.', 'Could not download the certificate. Please try again.'));
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `venoxa-level-test-${certId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError(T('تعذر تنزيل الشهادة. حاول مرة أخرى.', 'Could not download the certificate. Please try again.'));
    } finally {
      setCertBusy(false);
    }
  };

  const copyVerifyLink = async () => {    const link = result?.certId
      ? `${window.location.origin}/#/verify/${result.certId}`
      : '';
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setNotice(link);
    }
  };

  const openVerify = (event) => {
    event.preventDefault();
    const id = verifyInput.trim().toUpperCase();
    if (!id) return;
    window.location.hash = `#/verify/${id}`;
    setVerifyId(id);
    setView('verify');
  };

  const clearHash = () => {
    if (window.location.hash.startsWith('#/verify/')) {
      try {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      } catch {
        /* ignore */
      }
    }
  };

  /* ── verify screen ────────────────────────────────────────────────────── */

  if (view === 'verify') {
    const data = verifyState.data;
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-14"
      >
        <button
          type="button"
          onClick={() => {
            clearHash();
            if (onGoHome) onGoHome();
            else setView('start');
          }}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#0E4AA4] dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
          {T('العودة إلى التطبيق', 'Back to the app')}
        </button>

        <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F0F16] sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E4AA4] text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#0E4AA4] dark:text-blue-400">
                Venoxa
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {T('التحقق من شهادة', 'Certificate verification')}
              </h1>
            </div>
          </div>

          {verifyState.loading && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              {T('جارٍ التحقق…', 'Verifying…')}
            </div>
          )}

          {!verifyState.loading && data && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={22} />
                <div>
                  <div className="font-black text-emerald-800 dark:text-emerald-300">
                    {T('تم التحقق من الشهادة', 'Certificate verified')}
                  </div>
                  <div className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
                    {T('هذه الشهادة صادرة عن Venoxa Level Test.', 'This certificate was issued by the Venoxa Level Test.')}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {T('الاسم', 'Name')}
                  </div>
                  <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">{data.name}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {T('المستوى', 'Level')}
                  </div>
                  <div className="mt-1 text-lg font-black text-[#0E4AA4] dark:text-blue-400">
                    {data.level} · {levelLabel(data.level)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {T('الدرجة', 'Score')}
                  </div>
                  <div className="mt-1 text-lg font-black text-slate-900 dark:text-white" dir="ltr">{data.score} / 100</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {T('تاريخ الإصدار', 'Date issued')}
                  </div>
                  <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                    {formatDate(data.date, lang)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/[0.06] p-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                {T('رقم الشهادة', 'Certificate ID')}: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{verifyId}</span>
              </div>
            </div>
          )}

          {!verifyState.loading && !data && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/20 dark:bg-rose-500/10">
              <AlertCircle className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" size={22} />
              <div>
                <div className="font-black text-rose-800 dark:text-rose-300">
                  {T('شهادة غير صالحة', 'Certificate not valid')}
                </div>
                <div className="mt-1 text-sm text-rose-700/80 dark:text-rose-300/80">
                  {verifyState.error || T('تحقق من رقم الشهادة وحاول مرة أخرى.', 'Check the certificate ID and try again.')}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={openVerify} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              value={verifyInput}
              onChange={(event) => setVerifyInput(event.target.value)}
              placeholder="VX-2026-XXXX-XXXX"
              className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-slate-900 outline-none transition focus:border-[#0E4AA4] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E4AA4] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B3C88] dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <ShieldCheck size={16} />
              {T('تحقق', 'Verify')}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs leading-6 text-slate-400 dark:text-slate-500">
          {T(
            'الشهادات الصادرة عن Venoxa Level Test متوافقة مع الإطار الأوروبي المرجعي (CEFR) وليست مؤهلاً رسمياً.',
            'Venoxa Level Test certificates are aligned to the CEFR scale and are not an official qualification.',
          )}
        </p>
      </div>
    );
  }

  /* ── results screen ───────────────────────────────────────────────────── */

  if (view === 'result') {
    const shown = result || latest;
    if (!shown) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
          <AlertCircle className="mx-auto mb-4 text-slate-400" size={36} />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {T('لا توجد نتيجة بعد', 'No result yet')}
          </h2>
          <button
            type="button"
            onClick={() => setView('start')}
            className="mt-6 rounded-2xl bg-[#0E4AA4] px-5 py-3 text-sm font-black text-white"
          >
            {T('العودة للبداية', 'Back to start')}
          </button>
        </div>
      );
    }

    const sections = shown.sections || {};
    const answeredSkills = SKILLS.filter((skill) => sections[skill]);
    const lowest = answeredSkills.length
      ? answeredSkills.reduce((worst, skill) =>
          (sections[skill]?.score ?? 100) < (sections[worst]?.score ?? 100) ? skill : worst,
        )
      : null;
    const dateText = formatDate(shown.date, lang);

    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#0E4AA4] dark:text-blue-400">
              Venoxa Level Test
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {T('نتيجتك', 'Your result')}
            </h1>
          </div>
          <span className="rounded-full border border-black/5 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {T('متوافق مع CEFR', 'Aligned to CEFR')}
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F0F16] sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full bg-[#0E4AA4] text-white shadow-lg shadow-blue-900/20">
                <span className="text-5xl font-black leading-none">{shown.level}</span>
                <span className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">CEFR</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {T('مستواك في الإنجليزية', 'Your English level')}
                </div>
                <div className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                  {levelLabel(shown.level)}
                </div>
                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {T('الدرجة', 'Score')} {shown.score}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                  {shown.range && (
                    <span className="text-xs font-semibold text-slate-400">
                      ({T('النطاق التقديري', 'estimated range')}{' '}
                      <span dir="ltr">{shown.range.low}–{shown.range.high}</span>)
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {shown.answered} {T('سؤالاً', 'questions')} · {dateText}
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-6 gap-1.5 rounded-2xl bg-slate-50 p-1.5 dark:bg-white/5">
              {CEFR.map((level) => (
                <div
                  key={level}
                  className={`rounded-xl py-2.5 text-center text-xs font-black transition ${
                    level === shown.level
                      ? 'bg-[#0E4AA4] text-white shadow-md dark:bg-blue-600'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {level}
                </div>
              ))}
            </div>

            {shown.provisional && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <Info size={15} className="mt-0.5 shrink-0" />
                {T(
                  'نتيجة مبدئية: تمت الإجابة على أقل من 20 سؤالاً.',
                  'Provisional result: fewer than 20 questions were answered.',
                )}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {shown.certId && (
                <button
                  type="button"
                  onClick={() => downloadCertificate(shown.certId)}
                  disabled={certBusy}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0E4AA4] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B3C88] disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {certBusy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {T('تحميل الشهادة', 'Download certificate')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCert(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black text-[#0E4AA4] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-blue-400 dark:hover:bg-white/10"
              >
                <FileText size={16} />
                {T('معاينة الشهادة', 'Preview certificate')}
              </button>
              <button
                type="button"
                onClick={copyVerifyLink}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? T('تم نسخ الرابط', 'Link copied') : T('نسخ رابط التحقق', 'Share verified link')}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F0F16] sm:p-7">
              <h2 className="mb-5 text-base font-black text-slate-900 dark:text-white">
                {T('تفصيل المهارات', 'Skill breakdown')}
              </h2>
              <div className="space-y-4">
                {SKILLS.map((skill) => {
                  const section = sections[skill];
                  const value = section?.score ?? 0;
                  return (
                    <div key={skill}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {sectionLabel(skill)}
                          {section?.lowConfidence && (
                            <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                              {T('ثقة منخفضة', 'low confidence')}
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {section ? value : '—'}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#0E4AA4] transition-all dark:bg-blue-500"
                          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {lowest && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-800 dark:text-emerald-300">
                  <Sparkles size={16} />
                  {T('الخطوة التالية المقترحة', 'Recommended next step')}
                </div>
                <p className="mt-2 text-sm leading-7 text-emerald-800/80 dark:text-emerald-200/80">
                  {T(
                    `${sectionLabel(lowest)} هي أدنى مهارة لديك. يمكنك تحديث خطة الدراسة للبدء من ${shown.level} والتركيز على هذه المهارة.`,
                    `${sectionLabel(lowest)} is your lowest skill. You can update your Study Plan to start at ${shown.level} and focus on it.`,
                  )}
                </p>
                {onApplyPlan && (
                  <button
                    type="button"
                    onClick={() => onApplyPlan(shown.level)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <TrendingUp size={14} />
                    {T('تحديث خطة الدراسة', 'Update Study Plan')}
                  </button>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-black/[0.06] px-5 py-4 text-[11px] leading-6 text-slate-400 dark:border-white/10 dark:text-slate-500">
              <Info size={13} className="mb-1 inline-block" />{' '}
              {T(
                'نسخة تجريبية: تتحسن دقة التقدير مع زيادة عدد المتعلمين. النتيجة تقديرية وليست مؤهلاً رسمياً.',
                'Beta: accuracy improves as more learners take the test. This is an estimated level, not an official qualification.',
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setView('start');
            }}
            className="inline-flex items-center gap-1.5 transition hover:text-[#0E4AA4] dark:hover:text-blue-400"
          >
            <RefreshCw size={14} />
            {T('العودة إلى البداية', 'Back to start')}
          </button>
          <span>{T('خطة الدراسة الحالية', 'Current Study Plan level')}: {userLevel}</span>
        </div>

        {showCert && (
          <CertificatePreview
            result={shown}
            lang={lang}
            onClose={() => setShowCert(false)}
            onDownload={() => {
              if (shown.certId) downloadCertificate(shown.certId);
            }}
          />
        )}
      </div>
    );
  }

  /* ── expired screen ───────────────────────────────────────────────────── */

  if (view === 'expired') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
          <Clock size={30} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {T('انتهى الوقت', "Time's up")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
          {T(
            'انتهت الجلسة قبل حفظ أي إجابات. يمكنك المحاولة مرة أخرى عندما يسمح موعد إعادة الاختبار.',
            'The session ended before any answers were saved. You can try again when the retake window opens.',
          )}
        </p>
        <button
          type="button"
          onClick={() => setView('start')}
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#0E4AA4] px-5 py-3 text-sm font-black text-white dark:bg-blue-600"
        >
          <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
          {T('العودة للبداية', 'Back to start')}
        </button>
      </div>
    );
  }

  /* ── test screen ──────────────────────────────────────────────────────── */

  if (view === 'test' && item) {
    const index = item.index || 1;
    const approxMax = item.maxItems || 32;
    const progress = Math.min(100, Math.max(3, Math.round((index / approxMax) * 100)));
    const isReading = item.type === 'reading' && item.passage;
    const softMinutes = Math.max(1, Math.round((item.softLimitSec || 120) / 60));
    const timeLow = remainingSec !== null && remainingSec <= 300;

    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-2 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-black/[0.06] pb-4 dark:border-white/10">
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10"
            aria-label={T('مغادرة الاختبار', 'Leave test')}
          >
            <X size={17} />
          </button>
          <span className="text-sm font-black text-slate-900 dark:text-white">Venoxa Level Test</span>
          <div className="mx-1 h-2 min-w-[80px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[#0E4AA4] transition-all dark:bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="hidden text-xs font-semibold text-slate-400 sm:inline">
            {T(`السؤال ${index} من ~${approxMax}`, `Question ${index} of ~${approxMax}`)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-black tabular-nums ${
              timeLow
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                : 'bg-blue-50 text-[#0E4AA4] dark:bg-blue-500/10 dark:text-blue-300'
            }`}
          >
            <Clock size={14} />
            {remainingSec === null ? '—' : formatClock(remainingSec)}
          </span>
        </div>

        {notice && (
          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        <div className={isReading ? 'grid gap-6 md:grid-cols-2' : 'mx-auto max-w-3xl'}>
          {isReading && (
            <article className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F0F16] sm:p-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  {T('قراءة', 'Reading')} · {T('نص', 'Passage')} <span dir="ltr">{item.passage.questionOrder} / {item.passage.questionCount}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <Clock size={12} /> ≈ {softMinutes} {T('دقائق', 'min')}
                </span>
              </div>
              {item.passage.title && (
                <h2 dir="ltr" className="mb-3 text-left text-xl font-black leading-snug text-slate-900 dark:text-white">
                  {item.passage.title}
                </h2>
              )}
              <p dir="ltr" className="whitespace-pre-line text-left text-[15px] leading-8 text-slate-600 dark:text-slate-300">
                {item.passage.body}
              </p>
            </article>
          )}

          <div className={isReading ? 'min-w-0' : ''}>
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${TYPE_STYLES[item.type] || TYPE_STYLES.grammar}`}
              >
                {typeLabel(item.type)}
              </span>
              <span className="text-xs font-semibold text-slate-400">{typeInstruction(item.type)}</span>
            </div>

            {item.type === 'listening' && (
              <div className="mb-5 rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0F0F16] sm:p-6">
                <audio
                  ref={audioRef}
                  src={item.audioUrl || undefined}
                  onTimeUpdate={onAudioTime}
                  onLoadedMetadata={onAudioTime}
                  onEnded={() => setPlaying(false)}
                  onError={() => {
                    setPlaying(false);
                    setAudioFailed(true);
                  }}
                  preload="auto"
                />
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={playAudio}
                    disabled={playsLeft <= 0 || playing || audioFailed}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white transition ${
                      playsLeft <= 0 || playing || audioFailed
                        ? 'cursor-not-allowed bg-slate-300 dark:bg-white/10'
                        : 'bg-[#0E4AA4] hover:bg-[#0B3C88] dark:bg-blue-600 dark:hover:bg-blue-500'
                    }`}
                    aria-label={T('تشغيل الصوت', 'Play audio')}
                  >
                    {playing ? <Volume2 size={22} className="animate-pulse" /> : <Play size={22} className="ms-0.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex h-12 items-center gap-[3px] overflow-hidden">
                      {WAVE.map((height, barIndex) => {
                        const reached =
                          audioDuration > 0
                            ? barIndex / WAVE.length <= audioProgress / audioDuration
                            : playing && barIndex / WAVE.length <= (audioProgress + 1) / Math.max(1, audioDuration);
                        return (
                          <span
                            key={barIndex}
                            className={`w-[3px] shrink-0 rounded-full transition-colors ${
                              reached ? 'bg-[#0E4AA4] dark:bg-blue-500' : 'bg-slate-200 dark:bg-white/15'
                            }`}
                            style={{ height: `${height}px` }}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-bold tabular-nums text-slate-400">
                      <span>{formatClock(audioProgress)}</span>
                      <span>{formatClock(audioDuration)}</span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-[#0E4AA4] dark:bg-blue-500/10 dark:text-blue-300">
                    {T('مرات التشغيل', 'Plays left')}: {playsLeft}
                  </span>
                </div>
                {audioFailed && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle size={14} />
                    {T('تعذر تشغيل الصوت. يمكنك متابعة السؤال.', 'Audio could not play. You can still answer the question.')}
                  </div>
                )}
              </div>
            )}

            <h1 dir="ltr" className="mb-6 text-left text-[22px] font-black leading-relaxed text-slate-900 dark:text-white sm:text-[26px]">
              {renderStem(item.stem)}
            </h1>

            <div className="space-y-2.5">
              {(item.options || []).map((option, optionIndex) => {
                const active = selected === optionIndex;
                return (
                  <button
                    key={`${optionIndex}-${option.slice(0, 12)}`}
                    type="button"
                    onClick={() => setSelected(optionIndex)}
                    dir="ltr"
                    className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition ${
                      active
                        ? 'border-[#0E4AA4] bg-[#EAF1FF] shadow-sm dark:border-blue-400 dark:bg-blue-500/10'
                        : 'border-black/[0.06] bg-white hover:border-black/15 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0F0F16] dark:hover:border-white/20 dark:hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition ${
                        active
                          ? 'bg-[#0E4AA4] text-white dark:bg-blue-500'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-semibold leading-6 text-slate-700 dark:text-slate-200">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-slate-400">
                {T('استخدم 1–4 للاختيار وEnter للإرسال', 'Use 1–4 to choose, Enter to submit')}
              </span>
              <button
                type="button"
                onClick={submitAnswer}
                disabled={selected === null || busy}
                className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black transition ${
                  selected === null || busy
                    ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500'
                    : 'bg-[#0E4AA4] text-white hover:bg-[#0B3C88] dark:bg-blue-600 dark:hover:bg-blue-500'
                }`}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                {index >= approxMax ? T('إنهاء الاختبار', 'Finish test') : T('السؤال التالي', 'Next question')}
                {!busy && <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4 text-[11px] font-semibold text-slate-400 dark:border-white/10">
          <span>{T('اختبار تكيفي · تتغير الأسئلة حسب مستواك', 'Adaptive test · questions adjust to your level')}</span>
          <a
            href="mailto:support@venoxa.ai?subject=Venoxa%20Level%20Test%20problem"
            className="inline-flex items-center gap-1 transition hover:text-[#0E4AA4] dark:hover:text-blue-400"
          >
            <Info size={12} />
            {T('الإبلاغ عن مشكلة', 'Report a problem')}
          </a>
        </div>

        {exitOpen && createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className="w-full max-w-md rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0F0F16]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <Clock size={22} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {T('هل تريد مغادرة الاختبار؟', 'Leave the test?')}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                {T(
                  'سيستمر المؤقت. يمكنك المتابعة من حيث توقفت قبل انتهاء الوقت.',
                  'The timer keeps running. You can resume where you stopped until the deadline.',
                )}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExitOpen(false)}
                  className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  {T('ابقَ في الاختبار', 'Stay in test')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExitOpen(false);
                    setView('start');
                  }}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-amber-700"
                >
                  {T('مغادرة', 'Leave')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  /* ── start screen ─────────────────────────────────────────────────────── */

  const latestLevel = latest?.level || userLevel;
  const latestDate = latest?.date ? formatDate(latest.date, lang) : '';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E4AA4] text-lg font-black text-white dark:bg-blue-600">
          V
        </div>
        <div>
          <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Venoxa AI</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {T('اختبار المستوى', 'Level Test')}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <Sparkles size={12} />
            {T('نسخة تجريبية', 'Beta')}
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {T('اختبار المستوى', 'Venoxa Level Test')}
          </h1>
          <p className="mt-3 max-w-xl text-base font-semibold leading-8 text-slate-500 dark:text-slate-400">
            {T(
              'اختبار تحديد المستوى في الإنجليزية، متوافق مع الإطار الأوروبي المرجعي (CEFR).',
              'Venoxa Level Test, aligned to CEFR — an adaptive English placement test with a verifiable certificate.',
            )}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: <BookOpen size={18} />,
                title: T('20–32 سؤالاً', '20–32 questions'),
                body: T('حوالي 25 دقيقة، سؤال واحد في كل شاشة.', 'About 25 minutes, one question per screen.'),
              },
              {
                icon: <TrendingUp size={18} />,
                title: T('يتكيف مع مستواك', 'Adapts to your level'),
                body: T('كل إجابة تحدد السؤال التالي.', 'Each answer chooses the next question.'),
              },
              {
                icon: <Headphones size={18} />,
                title: T('استماع مرة واحدة', 'Listening plays once'),
                body: T('مقاطع قصيرة بصوت واضح.', 'Short clips with clear audio.'),
              },
              {
                icon: <ShieldCheck size={18} />,
                title: T('شهادة قابلة للتحقق', 'Verifiable certificate'),
                body: T('ملف PDF مع رمز QR للتحقق.', 'PDF with a QR verification link.'),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/10 dark:bg-[#0F0F16]"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0E4AA4] dark:bg-blue-500/10 dark:text-blue-300">
                  {feature.icon}
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white">{feature.title}</div>
                <div className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                  {feature.body}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F0F16] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {hasActive ? T('لديك اختبار قيد التقدم', 'You have a test in progress') : T('ابدأ اختبار المستوى', 'Start your level test')}
                </h2>
                <p className="mt-1 text-xs font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  {hasActive
                    ? T('اضغط للمتابعة من حيث توقفت. المؤقت يعمل بالفعل.', 'Resume where you stopped. The timer is already running.')
                    : T('سؤال واحد في كل شاشة، بدون رجوع. النتيجة تظهر فوراً.', 'One question per screen, no going back. Your result appears instantly.')}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center dark:bg-white/5">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {T('مستواك الحالي', 'Current level')}
                </div>
                <div className="text-2xl font-black text-[#0E4AA4] dark:text-blue-400">{latestLevel}</div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                {T('الاسم على الشهادة (بالإنجليزية)', 'Name on certificate (English)')}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={certName}
                  onChange={(event) => setCertName(event.target.value)}
                  maxLength={60}
                  placeholder={T('مثال: Sample Learner', 'e.g. Sample Learner')}
                  className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0E4AA4] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => startTest('standard')}
                  disabled={busy || !authReady}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black transition ${
                    busy || !authReady
                      ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500'
                      : 'bg-[#0E4AA4] text-white hover:bg-[#0B3C88] dark:bg-blue-600 dark:hover:bg-blue-500'
                  }`}
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  {hasActive ? T('متابعة الاختبار', 'Resume test') : T('ابدأ الاختبار', 'Start test')}
                </button>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-slate-400">
                {T(
                  'استخدم الحروف اللاتينية فقط. الشهادات تصدر باللغة الإنجليزية.',
                  'Use Latin letters only. Certificates are issued in English.',
                )}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => startTest('quick')}
                disabled={busy || !authReady}
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#0E4AA4] transition hover:underline disabled:opacity-50 dark:text-blue-400"
              >
                <Clock size={13} />
                {T('اختبار سريع (15 دقيقة)', 'Quick check (15 minutes)')}
              </button>
              <span className="text-[10px] font-semibold text-slate-400">
                {T('أقل دقة، مناسب للتقدير السريع.', 'Less precise, useful for a quick estimate.')}
              </span>
            </div>

            {!authReady && (
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                {T('جارٍ التحقق من الجلسة…', 'Checking your session…')}
              </div>
            )}
            {authReady && !signedIn && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                <Lock size={15} className="text-amber-600 dark:text-amber-300" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                  {T('سجّل الدخول لبدء الاختبار وحفظ نتيجتك.', 'Sign in to start the test and save your result.')}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.()}
                  className="ms-auto rounded-xl bg-amber-600 px-3 py-2 text-[11px] font-black text-white transition hover:bg-amber-700"
                >
                  {T('تسجيل الدخول', 'Sign in')}
                </button>
              </div>
            )}

            {cooldown && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <Clock size={15} className="mt-0.5 shrink-0" />
                <span>
                  {T('يمكنك إعادة الاختبار بعد', 'You can retake the test after')}{' '}
                  <strong>{new Date(cooldown.retryAfter).toLocaleString(lang === 'ar' ? 'ar' : 'en-GB')}</strong>.
                </span>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-black/[0.06] px-5 py-4 text-[11px] leading-6 text-slate-400 dark:border-white/10 dark:text-slate-500">
            <Info size={13} className="mb-1 inline-block" />{' '}
            {T(
              'نسخة تجريبية: تتحسن دقة التقدير مع زيادة عدد المتعلمين. النتيجة تقديرية وليست مؤهلاً رسمياً.',
              'Beta: accuracy improves as more learners take the test. This is an estimated level, not an official qualification.',
            )}
          </div>
        </div>

        <div className="space-y-5">
          {latest && (
            <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F0F16]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {T('آخر نتيجة', 'Latest result')}
                </h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {latestDate}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0E4AA4] text-2xl font-black text-white dark:bg-blue-600">
                  {latest.level}
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {levelLabel(latest.level)}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span dir="ltr">
                      {latest.score} / 100
                      {latest.range ? ` · ${latest.range.low}–${latest.range.high}` : ''}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResult(latest);
                  setView('result');
                }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-2.5 text-xs font-black text-[#0E4AA4] transition hover:bg-slate-50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-white/5"
              >
                {T('عرض النتيجة والشهادة', 'View result & certificate')}
                <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>
          )}

          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F0F16]">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {T('كيف يعمل الاختبار التكيفي؟', 'How the adaptive test works')}
            </h2>
            <div className="mt-4 space-y-4">
              {[
                {
                  n: '1',
                  title: T('ابدأ من مستوى تقديري', 'Start at an estimated level'),
                  body: T('نبدأ من منتصف النطاق ثم نعدّل.', 'We start mid-range and adjust.'),
                },
                {
                  n: '2',
                  title: T('أجب على سؤال', 'Answer a question'),
                  body: T('سؤال واحد في كل شاشة.', 'One question per screen.'),
                },
                {
                  n: '3',
                  title: T('نحدّث تقدير القدرة', 'Update the ability estimate'),
                  body: T('كل إجابة تغيّر التقدير.', 'Every answer changes the estimate.'),
                },
                {
                  n: '4',
                  title: T('نختار السؤال الأقرب', 'Pick the closest-difficulty question'),
                  body: T('لقياس مستواك بدقة أكبر.', 'To measure your level more precisely.'),
                },
                {
                  n: '5',
                  title: T('نتوقف عند الثقة الكافية', 'Stop when confident'),
                  body: T('حوالي 20–32 سؤالاً.', 'Usually 20–32 questions.'),
                },
                {
                  n: '6',
                  title: T('النتيجة والشهادة', 'Score, CEFR level and certificate'),
                  body: T('درجة من 100 وشهادة PDF.', 'A 0–100 score and a PDF certificate.'),
                },
              ].map((step) => (
                <div key={step.n} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-black text-[#0E4AA4] dark:bg-blue-500/10 dark:text-blue-300">
                    {step.n}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-200">{step.title}</div>
                    <div className="mt-0.5 text-[11px] font-semibold leading-5 text-slate-400">{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/[0.06] bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-2 text-[11px] font-semibold leading-6 text-slate-500 dark:text-slate-400">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                {T(
                  'الأسئلة ومفاتيح الإجابات تبقى على الخادم. لا يمكن قراءة الإجابات من صفحة المتصفح.',
                  'Questions and answer keys stay on the server, so answers cannot be read from the page.',
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Certificate preview (HTML mirror of the PDF; English only by design)
 * ──────────────────────────────────────────────────────────────────────────── */

function CertificatePreview({ result, lang, onClose, onDownload }) {
  const dateText = formatDate(result.date, 'en-GB');
  const sections = result.sections || {};
  const sectionOrder = ['reading', 'grammar', 'vocab', 'listening'];
  const sectionLabels = { reading: 'Reading', grammar: 'Grammar', vocab: 'Vocabulary', listening: 'Listening' };
  const verifyUrl = result.certId ? `${window.location.origin}/#/verify/${result.certId}` : '';

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-3 flex items-center justify-between gap-3 text-white">
          <span className="text-xs font-black uppercase tracking-[0.18em]">Certificate preview</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Close certificate preview"
          >
            <X size={17} />
          </button>
        </div>

        <div
          dir="ltr"
          className="relative overflow-hidden rounded-sm border-[3px] border-[#0E4AA4] bg-white px-6 py-8 text-slate-900 shadow-2xl sm:px-12 sm:py-12"
        >
          <div className="pointer-events-none absolute inset-3 border border-blue-300/70" />
          <div className="relative text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0E4AA4] text-sm font-black text-white">V</span>
              <span className="text-sm font-black tracking-[0.18em] text-[#0E4AA4]">VENOXA</span>
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-4xl">Certificate of English Level</h2>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Venoxa Level Test · aligned to the CEFR scale</p>

            <p className="mt-8 text-xs font-semibold text-slate-500">This certifies that</p>
            <p className="mx-auto mt-1 max-w-2xl border-b border-blue-200 pb-2 text-2xl font-black text-[#0E4AA4] sm:text-4xl">
              {result.name || 'Venoxa Learner'}
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              has completed the Venoxa Level Test with the following result
            </p>

            <div className="mt-6 flex flex-wrap items-end justify-center gap-3">
              <span className="text-5xl font-black leading-none text-[#0E4AA4] sm:text-6xl">{result.level}</span>
              <div className="text-start">
                <div className="text-lg font-black sm:text-xl">{LEVEL_LABELS[result.level]?.[1] || ''}</div>
                <div className="text-xs font-semibold text-slate-500">Overall score {result.score} / 100</div>
              </div>
            </div>

            <div className="mx-auto mt-7 grid max-w-xl grid-cols-4 gap-2">
              {sectionOrder.map((section) => (
                <div key={section}>
                  <div className="text-lg font-black text-[#0E4AA4]">
                    {sections[section] ? sections[section].score : '—'}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    {sectionLabels[section]}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-start justify-between gap-5 text-start sm:flex-row sm:items-end">
              <div className="text-[10px] font-semibold leading-6 text-slate-500">
                <div>Date: {dateText}</div>
                <div>
                  Certificate ID: <span className="font-mono font-bold text-[#0E4AA4]">{result.certId}</span>
                </div>
                <div className="max-w-[260px] truncate">Verify: {verifyUrl}</div>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-[#0E4AA4] text-center">
                  <span className="text-[8px] font-black text-[#0E4AA4]">VENOXA</span>
                  <span className="text-[8px] font-black text-[#0E4AA4]">VERIFIED</span>
                </div>
                <div className="grid h-20 w-20 grid-cols-7 gap-[2px] border border-slate-200 bg-white p-1">
                  {Array.from({ length: 49 }).map((_, index) => (
                    <span
                      key={index}
                      className={
                        [0, 1, 2, 7, 9, 14, 16, 18, 21, 24, 28, 30, 32, 35, 38, 41, 42, 43, 44, 47, 48].includes(index) ||
                        index % 5 === 0
                          ? 'bg-slate-900'
                          : 'bg-white'
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-8 border-t border-slate-100 pt-3 text-[9px] font-semibold text-slate-400">
              Aligned to the CEFR scale. Not an official qualification and not equivalent to IELTS, TOEFL or EF SET.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0E4AA4] shadow-lg transition hover:bg-blue-50"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
