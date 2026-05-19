import { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const PRESETS = [
  { label: 'Focus', labelAr: 'تركيز', minutes: 25 },
  { label: 'Short', labelAr: 'قصير',  minutes: 5  },
  { label: 'Long',  labelAr: 'طويل',  minutes: 15 },
  { label: 'Read',  labelAr: 'قراءة', minutes: 45 },
];

const playDone = (ctx) => {
  if (!ctx) return;
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle'; osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.18;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t); osc.stop(t + 0.5);
  });
};

function Ring({ progress, color, size = 260, stroke = 14, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  const fid = 'ring-glow';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}
        style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke + 4} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} opacity="0.35"
          filter={`url(#${fid})`}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}/>
      </svg>
      <div className="flex flex-col items-center justify-center z-10">{children}</div>
    </div>
  );
}

export default function TimerTool({ lang = 'en', theme = 'dark', timerState, setTimerState }) {
  const isDark = theme === 'dark';
  const isRtl  = lang === 'ar';
  const t = (en, ar) => isRtl ? ar : en;
  const COLOR = '#FF5722';

  const audioCtxRef = useRef(null);
  const prevDoneRef = useRef(false);
  const [editingMin, setEditingMin] = useState(false);
  const [editingSec, setEditingSec] = useState(false);
  const [tmpMin, setTmpMin] = useState('');
  const [tmpSec, setTmpSec] = useState('');

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtxRef.current;
  }, []);

  // Play chime when done becomes true
  if (timerState.done && !prevDoneRef.current) {
    prevDoneRef.current = true;
    setTimeout(() => playDone(getCtx()), 80);
  } else if (!timerState.done) {
    prevDoneRef.current = false;
  }

  const { preset, custMins, custSecs, secsLeft, totalSecs, running, done } = timerState;
  const upd = (patch) => setTimerState(s => ({ ...s, ...patch }));

  const idle     = secsLeft === null;
  const progress = idle ? 0 : done ? 1 : 1 - secsLeft / totalSecs;
  const displayMins = idle ? custMins : Math.floor((secsLeft ?? 0) / 60);
  const displaySecs = idle ? custSecs : (secsLeft ?? 0) % 60;
  const fmt = n => String(n).padStart(2, '0');
  const canEdit = idle && !done;

  const commitMin = (val) => {
    const v = parseInt(val, 10);
    if (!isNaN(v)) upd({ custMins: Math.max(0, Math.min(99, v)) });
    setEditingMin(false);
  };
  const commitSec = (val) => {
    const v = parseInt(val, 10);
    if (!isNaN(v)) upd({ custSecs: Math.max(0, Math.min(59, v)) });
    setEditingSec(false);
  };

  const handleStart = () => {
    if (idle || done) {
      const total = custMins * 60 + custSecs;
      if (total === 0) return;
      upd({ done: false, secsLeft: total, totalSecs: total, running: true });
    } else {
      upd({ running: true });
    }
  };
  const handlePause = () => upd({ running: false });
  const handleReset = () => upd({ running: false, done: false, secsLeft: null });
  const applyPreset = (i) => upd({ preset: i, custMins: PRESETS[i].minutes, custSecs: 0, running: false, done: false, secsLeft: null });

  const ringColor = done ? '#22c55e' : COLOR;
  const timeColor = done ? '#22c55e' : isDark ? '#fff' : '#111';
  const inputStyle = {
    width: '3.2rem', fontSize: '3rem', lineHeight: 1, letterSpacing: '-1px',
    fontWeight: 800, textAlign: 'center', background: 'transparent',
    border: 'none', borderBottom: `2px solid ${COLOR}`, outline: 'none',
    color: timeColor, fontFamily: 'inherit',
  };

  return (
    <div className="flex flex-col items-center w-full h-full min-h-0 overflow-y-auto"
      dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '1.5rem 1rem' }}>
      <div className="w-full max-w-xs flex flex-col items-center gap-8">

        {/* Preset pills */}
        <div className="flex gap-2 w-full">
          {PRESETS.map((p, i) => (
            <button key={p.label} onClick={() => applyPreset(i)}
              className="flex-1 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all duration-200"
              style={preset === i
                ? { background: COLOR, color: '#fff' }
                : { background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
              {t(p.label, p.labelAr)}
            </button>
          ))}
        </div>

        {/* Ring */}
        <Ring progress={progress} color={ringColor}>
          <div className="flex items-center" style={{ gap: '2px' }}>

            {canEdit && editingMin ? (
              <input autoFocus style={inputStyle} value={tmpMin}
                onChange={e => setTmpMin(e.target.value)}
                onBlur={() => commitMin(tmpMin)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') commitMin(tmpMin); }}/>
            ) : (
              <span onClick={() => { if (canEdit) { setTmpMin(String(displayMins)); setEditingMin(true); } }}
                style={{ fontSize: '3rem', lineHeight: 1, letterSpacing: '-1px', fontWeight: 800,
                  color: timeColor, cursor: canEdit ? 'text' : 'default' }}>
                {fmt(displayMins)}
              </span>
            )}

            <span style={{ fontSize: '3rem', lineHeight: 1, fontWeight: 800, color: timeColor, margin: '0 1px' }}>:</span>

            {canEdit && editingSec ? (
              <input autoFocus style={inputStyle} value={tmpSec}
                onChange={e => setTmpSec(e.target.value)}
                onBlur={() => commitSec(tmpSec)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') commitSec(tmpSec); }}/>
            ) : (
              <span onClick={() => { if (canEdit) { setTmpSec(String(displaySecs)); setEditingSec(true); } }}
                style={{ fontSize: '3rem', lineHeight: 1, letterSpacing: '-1px', fontWeight: 800,
                  color: timeColor, cursor: canEdit ? 'text' : 'default' }}>
                {fmt(displaySecs)}
              </span>
            )}
          </div>

          <span className="mt-2 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: done ? '#22c55e' : running ? COLOR : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
            {done ? t('Done!', 'انتهى!') : t(PRESETS[preset].label, PRESETS[preset].labelAr)}
          </span>
        </Ring>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button onClick={handleReset} disabled={idle && !done}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
            <RotateCcw className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#555' }}/>
          </button>

          <button onClick={running ? handlePause : handleStart}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all active:scale-95"
            style={{ background: done ? '#22c55e' : COLOR, boxShadow: `0 8px 28px ${done ? '#22c55e55' : COLOR + '66'}` }}>
            {running
              ? <Pause className="w-6 h-6 fill-white text-white"/>
              : <Play  className="w-6 h-6 fill-white text-white" style={{ marginLeft: 2 }}/>}
          </button>

          <button onClick={handleReset} disabled={idle && !done}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
            <div className="w-4 h-4 rounded-sm" style={{ background: isDark ? 'rgba(255,255,255,0.55)' : '#666' }}/>
          </button>
        </div>

      </div>
    </div>
  );
}
