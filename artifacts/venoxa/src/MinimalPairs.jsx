/**
 * MinimalPairs.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Listening drill for confusable English sounds.
 *
 * Curated pairs targeted at Arabic L1 transfer issues:
 *   /iː/ vs /ɪ/      ship · sheep
 *   /æ/ vs /e/       bad · bed
 *   /θ/ vs /f/       three · free
 *   /ð/ vs /z/       this · zis
 *   /p/ vs /b/       pat · bat
 *   /v/ vs /f/       van · fan
 *   /l/ vs /r/       light · right        (less prominent for AR but useful)
 *   /uː/ vs /ʊ/      fool · full
 *   /ɒ/ vs /ɔː/      cot · caught
 *
 * Flow:
 *   1. User picks a sound category (or "All").
 *   2. App speaks ONE word from a random pair.
 *   3. User taps which word they heard.
 *   4. App reveals correct/incorrect + tracks score.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Ear, Volume2, RotateCcw, Check, X, Loader2, Trophy, Zap
} from 'lucide-react';

// ─── Curated minimal pairs ────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',     label: 'All',         labelAr: 'الكل' },
  { id: 'iː_ɪ',    label: '/iː/ vs /ɪ/', labelAr: 'iː ضد ɪ' },
  { id: 'æ_e',     label: '/æ/ vs /e/',  labelAr: 'æ ضد e' },
  { id: 'θ_f',     label: '/θ/ vs /f/',  labelAr: 'θ ضد f' },
  { id: 'ð_z',     label: '/ð/ vs /z/',  labelAr: 'ð ضد z' },
  { id: 'p_b',     label: '/p/ vs /b/',  labelAr: 'p ضد b' },
  { id: 'v_f',     label: '/v/ vs /f/',  labelAr: 'v ضد f' },
  { id: 'l_r',     label: '/l/ vs /r/',  labelAr: 'l ضد r' },
  { id: 'uː_ʊ',    label: '/uː/ vs /ʊ/', labelAr: 'uː ضد ʊ' },
  { id: 'ɒ_ɔː',   label: '/ɒ/ vs /ɔː/', labelAr: 'ɒ ضد ɔː' },
];

const PAIRS = [
  { cat: 'iː_ɪ',  a: 'sheep',  b: 'ship'  },
  { cat: 'iː_ɪ',  a: 'beat',   b: 'bit'   },
  { cat: 'iː_ɪ',  a: 'leave',  b: 'live'  },
  { cat: 'iː_ɪ',  a: 'feel',   b: 'fill'  },
  { cat: 'iː_ɪ',  a: 'seat',   b: 'sit'   },
  { cat: 'æ_e',   a: 'bad',    b: 'bed'   },
  { cat: 'æ_e',   a: 'man',    b: 'men'   },
  { cat: 'æ_e',   a: 'sat',    b: 'set'   },
  { cat: 'æ_e',   a: 'pan',    b: 'pen'   },
  { cat: 'æ_e',   a: 'had',    b: 'head'  },
  { cat: 'θ_f',   a: 'three',  b: 'free'  },
  { cat: 'θ_f',   a: 'thin',   b: 'fin'   },
  { cat: 'θ_f',   a: 'thought',b: 'fought'},
  { cat: 'θ_f',   a: 'thread', b: 'fred'  },
  { cat: 'ð_z',   a: 'breathe',b: 'breeze'},
  { cat: 'ð_z',   a: 'they',   b: 'zay'   },
  { cat: 'p_b',   a: 'pat',    b: 'bat'   },
  { cat: 'p_b',   a: 'pull',   b: 'bull'  },
  { cat: 'p_b',   a: 'pin',    b: 'bin'   },
  { cat: 'p_b',   a: 'cap',    b: 'cab'   },
  { cat: 'v_f',   a: 'van',    b: 'fan'   },
  { cat: 'v_f',   a: 'vine',   b: 'fine'  },
  { cat: 'v_f',   a: 'leaves', b: 'leafs' },
  { cat: 'l_r',   a: 'light',  b: 'right' },
  { cat: 'l_r',   a: 'long',   b: 'wrong' },
  { cat: 'l_r',   a: 'lice',   b: 'rice'  },
  { cat: 'l_r',   a: 'glass',  b: 'grass' },
  { cat: 'uː_ʊ',  a: 'fool',   b: 'full'  },
  { cat: 'uː_ʊ',  a: 'pool',   b: 'pull'  },
  { cat: 'uː_ʊ',  a: 'Luke',   b: 'look'  },
  { cat: 'ɒ_ɔː', a: 'cot',    b: 'caught'},
  { cat: 'ɒ_ɔː', a: 'pot',    b: 'port'  },
];

// ─── Web Speech API helpers ───────────────────────────────────────────────────
const speak = (text, accent = 'en-US') => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = accent;
  utt.rate = 0.85;
  utt.pitch = 1;
  // Try to pick a matching voice
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(x => x.lang === accent) || voices.find(x => x.lang.startsWith('en'));
  if (v) utt.voice = v;
  window.speechSynthesis.speak(utt);
};

const ACCENTS = [
  { id: 'en-US', label: 'US' },
  { id: 'en-GB', label: 'UK' },
];

export default function MinimalPairs({ lang: uiLang = 'ar', theme = 'dark' }) {
  const isDark = theme === 'dark';
  const t = (en, ar) => uiLang === 'ar' ? ar : en;

  const [category, setCategory] = useState('all');
  const [accent, setAccent]     = useState('en-US');
  const [current, setCurrent]   = useState(null);   // { pair, target: 'a'|'b' }
  const [verdict, setVerdict]   = useState(null);   // null | 'correct' | 'wrong'
  const [busy, setBusy]         = useState(false);
  const [score, setScore]       = useState({ right: 0, total: 0 });

  // Pre-load voices (some browsers populate voices async).
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const pickRound = useCallback(() => {
    const filtered = category === 'all' ? PAIRS : PAIRS.filter(p => p.cat === category);
    if (!filtered.length) return;
    const pair = filtered[Math.floor(Math.random() * filtered.length)];
    const target = Math.random() < 0.5 ? 'a' : 'b';
    setCurrent({ pair, target });
    setVerdict(null);
    // Speak after a tick so React has flushed
    setBusy(true);
    setTimeout(() => {
      speak(pair[target], accent);
      setBusy(false);
    }, 200);
  }, [category, accent]);

  const replay = () => {
    if (!current) return;
    setBusy(true);
    setTimeout(() => {
      speak(current.pair[current.target], accent);
      setBusy(false);
    }, 50);
  };

  const choose = (which) => {
    if (!current || verdict) return;
    const right = which === current.target;
    setVerdict(right ? 'correct' : 'wrong');
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }));
  };

  const reset = () => {
    setScore({ right: 0, total: 0 });
    setCurrent(null);
    setVerdict(null);
  };

  const accuracy = score.total ? Math.round((score.right / score.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full pb-8 animate-fadeIn"
         dir={uiLang === 'ar' ? 'rtl' : 'ltr'}>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--app-accent1)] flex items-center justify-center shadow-lg">
          <Ear className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('Minimal Pairs', 'الأزواج الدنيا')}
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('Train your ear on tricky English sound contrasts',
               'درّب أذنك على التباين الصوتي الصعب في الإنجليزية')}
          </p>
        </div>
      </div>

      {/* Score / accent / reset bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl liquid-glass ${
          isDark ? 'bg-white/5' : 'bg-white/60'
        }`}>
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {score.right} / {score.total}
          </span>
          {score.total > 0 && (
            <span className="text-xs font-bold opacity-50">· {accuracy}%</span>
          )}
        </div>

        <div className={`flex rounded-2xl p-1 gap-1 liquid-glass ${isDark ? 'bg-white/5' : 'bg-black/4'}`}>
          {ACCENTS.map(a => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wide transition-all ${
                accent === a.id
                  ? 'bg-[var(--app-accent1)] text-white shadow-sm'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <button
          onClick={reset}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all liquid-glass ${
            isDark ? 'text-gray-300 hover:bg-white/8' : 'text-gray-600 hover:bg-black/5'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('Reset score', 'إعادة العدّاد')}
        </button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => { setCategory(c.id); setCurrent(null); setVerdict(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all liquid-glass ${
              category === c.id
                ? 'bg-[var(--app-accent2)] text-white shadow-sm'
                : isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-white/60 text-gray-700 hover:bg-white/80'
            }`}
            dir="ltr"
          >
            {uiLang === 'ar' ? c.labelAr : c.label}
          </button>
        ))}
      </div>

      {/* Round panel */}
      <div className="card-shine glass-panel rounded-3xl p-8 flex flex-col items-center gap-6 min-h-[260px]">
        {!current ? (
          <button
            onClick={pickRound}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-[var(--app-accent1)] text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4" />
            {t('Start drill', 'ابدأ التدريب')}
          </button>
        ) : (
          <>
            <button
              onClick={replay}
              disabled={busy}
              className={`flex flex-col items-center gap-2 p-6 rounded-3xl transition-all liquid-glass disabled:opacity-50 ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white/60 hover:bg-white/80'
              }`}
            >
              {busy
                ? <Loader2 className="w-10 h-10 text-[var(--app-accent1)] animate-spin" />
                : <Volume2 className="w-10 h-10 text-[var(--app-accent1)]" />}
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">
                {t('Tap to replay', 'اضغط للتكرار')}
              </span>
            </button>

            <div className="text-center text-sm font-bold opacity-60">
              {t('Which word did you hear?', 'أي كلمة سمعتها؟')}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-md" dir="ltr">
              {['a', 'b'].map(side => {
                const word = current.pair[side];
                const isAnswer = side === current.target;
                const isPicked = verdict && (side === (verdict === 'correct' ? current.target : (current.target === 'a' ? 'b' : 'a')));
                const showRight = verdict && isAnswer;
                const showWrong = verdict === 'wrong' && isPicked && !isAnswer;
                return (
                  <button
                    key={side}
                    onClick={() => choose(side)}
                    disabled={!!verdict}
                    className={`px-4 py-5 rounded-2xl text-lg font-extrabold transition-all border-2 ${
                      showRight
                        ? 'bg-green-500/15 text-green-500 border-green-500/40'
                        : showWrong
                          ? 'bg-red-500/15 text-red-500 border-red-500/40'
                          : isDark
                            ? 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                            : 'bg-white/60 text-gray-800 border-black/5 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {showRight && <Check className="w-5 h-5" />}
                      {showWrong && <X className="w-5 h-5" />}
                      {word}
                    </div>
                  </button>
                );
              })}
            </div>

            {verdict && (
              <button
                onClick={pickRound}
                className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-[var(--app-accent1)] text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                {t('Next', 'التالي')} →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}