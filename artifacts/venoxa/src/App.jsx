import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Home, BookOpen, PenTool, MessageSquare, Headphones, Brain, FileText, CheckCircle, Target, Calendar, Play, RotateCcw, Volume2, Mic, Send, Clock, ChevronRight, ChevronLeft, ChevronDown, Menu, X, Sparkles, Activity, Award, BookText, Lightbulb, Phone, PhoneOff, MicOff, CheckCircle2, HelpCircle, UploadCloud, Globe, Search, Filter, List, Star, Image as ImageIcon, Layers, Archive, Quote, Zap, Sun, Moon, Printer } from 'lucide-react';
import { _resolveTranslation } from './translations.js';

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
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="bg-transparent font-bold outline-none cursor-pointer flex items-center gap-1 w-full justify-between">
        {langs.find(l => l.code === lang)?.label || 'Language'}
        <ChevronDown className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className={`absolute bottom-full left-0 mb-2 w-36 rounded-2xl shadow-xl overflow-hidden z-[100] ${theme === 'dark' ? 'bg-[#1a1a1e] border border-gray-700' : 'bg-white border border-gray-200'}`}>
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setIsOpen(false); }}
              className={`w-full text-center px-4 py-2.5 font-bold transition-colors ${lang === l.code ? 'bg-blue-600 text-white' : theme === 'dark' ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SolidDatePicker({ value, onChange, min, label }) {
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
        className="w-full bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold text-left flex justify-between items-center focus:outline-none focus:border-blue-500 transition-colors"
      >
        <span>{value || label}</span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-[280px] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 animate-fadeIn pointer-events-auto" dir="ltr">
          <div className="relative rounded-2xl p-4 bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-gray-900 dark:text-white overflow-hidden">
            <div className="text-center font-extrabold text-base mb-3 pb-3 border-b border-gray-100/20 dark:border-white/10 tracking-wide">
              {monthNames[month]} {year}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
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
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-xs transition-all duration-200 font-bold ${!item.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-100'} ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 cursor-pointer'} ${isSelected && !disabled ? 'bg-blue-500 text-white shadow-md scale-110' : ''}`}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center items-center gap-3">
              <button onClick={handlePrevMonth} className="p-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all">
                <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all">
                <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- API CONFIGURATION ---
const GEMINI_API_KEY = "proxied"; // Real key lives in backend; this just enables AI features in the UI.

// --- HELPER FUNCTION FOR BACKTICKS ---
const getBackticks = () => String.fromCharCode(96, 96, 96);

// --- AI API HELPER (proxied through our backend) ---
// Non-streaming version used for Langeek story/context generation.
const fetchFromGemini = async (prompt, _apiKey) => {
  const url = `${import.meta.env.BASE_URL}api/chat`;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
    if (!response.ok) {
      return '{"error": "AI is busy. Please try again."}';
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
const streamFromAPI = async (prompt, onDelta) => {
  const url = `${import.meta.env.BASE_URL}api/chat/stream`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
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
const safeRender = val => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// --- ELEVENLABS TTS HELPER ---
// Default voice: "Rachel" (ElevenLabs premade, natural American English).
// The user can override this by passing a different voice ID.
const DEFAULT_ELEVENLABS_VOICE_ID = '';
const ELEVENLABS_VOICE_OPTIONS = [
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', label: 'Liam' },
  { id: 'XB0fDUnXU5powFXDhCwa', label: 'Charlotte' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice' },
  { id: 'nPczCjzI2devNBz1zQrb', label: 'Brian' },
  { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', label: 'Callum' },
];

// Keeps a reference to the current Audio element so we can cancel it before
// starting a new utterance (mirrors the old speechSynthesis.cancel() pattern).
let _currentTTSAudio = null;

/**
 * elevenLabsSpeak(text, voiceId?)
 *
 * Calls our backend /api/tts/stream endpoint, receives an audio/mpeg blob,
 * and plays it via a plain <Audio> object.  Falls back to the browser's
 * built-in speechSynthesis if the backend returns an error (e.g. API key
 * not configured yet).
 *
 * @param {string} text     - The English text to read aloud.
 * @param {string} [voiceId] - Optional ElevenLabs voice ID.
 */
const elevenLabsSpeak = async (text, voiceId = DEFAULT_ELEVENLABS_VOICE_ID) => {
  if (!text || !text.trim()) return;

  // Stop any currently-playing TTS audio
  if (_currentTTSAudio) {
    _currentTTSAudio.pause();
    _currentTTSAudio = null;
  }

  try {
    // POST to our Express backend which proxies to ElevenLabs
    const response = await fetch(`${import.meta.env.BASE_URL}api/tts/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textToSpeak: text, selectedVoiceId: voiceId }),
    });

    if (!response.ok) {
      // If the backend isn't configured yet, silently fall back to the browser TTS
      throw new Error(`TTS backend returned ${response.status}`);
    }

    // Convert the streamed audio bytes into a Blob and play them
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    _currentTTSAudio = audio;
    audio.onended = () => URL.revokeObjectURL(audioUrl); // free memory
    await audio.play();
  } catch (err) {
    // Graceful fallback: use the browser's built-in TTS while the ElevenLabs
    // key is not yet set up (or network is offline).
    console.warn('[Venoxa] ElevenLabs TTS unavailable, falling back to browser TTS:', err.message);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }
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
  level: "A1 - Beginner",
  topics: ["Subject Pronouns", "Verb to be", "Articles (a, an, the)", "Plural nouns", "Possessive adjectives", "Demonstratives", "Present Simple", "There is / There are", "Have / Has", "Can (ability & permission)", "Adjectives", "Prepositions of place & time", "Imperatives"]
}, {
  level: "A2 - Elementary",
  topics: ["Past Simple", "Past Simple questions & negatives", "Future with will and going to", "Present Continuous", "Countable & Uncountable nouns", "Comparatives & Superlatives", "Adverbs of frequency", "Object pronouns", "Possessive pronouns", "Quantifiers", "Prepositions of movement"]
}, {
  level: "B1 - Pre-Intermediate",
  topics: ["Present Perfect Simple", "Present Perfect vs. Past Simple", "Present Perfect Continuous", "Past Continuous", "Future Continuous", "Be going to", "Modals", "Comparisons with as...as", "First Conditional", "Second Conditional", "Relative Clauses", "Question tags"]
}, {
  level: "B2 - Upper-Intermediate",
  topics: ["Passive Voice", "Reported Speech", "Used to / Would", "Wish / If only", "Third Conditional", "Mixed Conditionals", "Modals of deduction", "Gerunds & Infinitives", "Complex sentences", "Future Perfect & Future Perfect Continuous"]
}, {
  level: "C1 - Advanced",
  topics: ["Inversion", "Emphasis (cleft sentences)", "Advanced Conditionals", "Subjunctive", "Nominalization", "Advanced Passive", "Phrasal verbs", "Collocations & idiomatic structures", "Reduced relative clauses", "Complex verb patterns"]
}];
const SPEAKING_TOPICS = ["محادثة حرة (Free Talk)", "السفر والمطارات (Travel & Airports)", "العمل والمقابلات (Work & Interviews)", "الهوايات والاهتمامات (Hobbies)", "الطعام والمطاعم (Food)", "التسوق (Shopping)", "الصحة واللياقة (Health & Fitness)", "التكنولوجيا الذكية (Technology)", "الرياضة (Sports)", "العائلة والأصدقاء (Family & Friends)", "التعليم والجامعة (Education)", "الترفيه والأفلام (Movies)", "الروتين اليومي (Daily Routine)", "خطط المستقبل (Future Plans)", "ذكريات الطفولة (Childhood)", "الثقافات والتقاليد (Cultures)", "البيئة والطبيعة (Environment)", "وسائل التواصل (Social Media)", "الكتب والأدب (Books)", "الأخبار والأحداث (News)", "الموضة والأزياء (Fashion)", "الفنون والموسيقى (Art & Music)", "العلوم والفضاء (Science)", "الأهداف والطموحات (Goals)", "وسائل النقل (Transportation)", "الحيوانات الأليفة (Pets)", "العطلات والمناسبات (Holidays)", "العلاقات الاجتماعية (Relationships)", "ريادة الأعمال (Entrepreneurship)", "التحديات والمصاعب (Challenges)"];

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userLevel, setUserLevel] = useState(localStorage.getItem('userLevel') || 'B2');
  const [globalVocab, setGlobalVocab] = useState(DEFAULT_VOCABULARY_LIST);
  const [langeekVocab, setLangeekVocab] = useState(() => JSON.parse(localStorage.getItem('venoxa_langeek_vocab')) || []);
  const [speakingHistory, setSpeakingHistory] = useState(() => JSON.parse(localStorage.getItem('venoxa_speaking_history')) || []);
  const [writingHistory, setWritingHistory] = useState(() => JSON.parse(localStorage.getItem('venoxa_writing_history')) || []);
  useEffect(() => localStorage.setItem('venoxa_langeek_vocab', JSON.stringify(langeekVocab)), [langeekVocab]);
  useEffect(() => localStorage.setItem('venoxa_speaking_history', JSON.stringify(speakingHistory)), [speakingHistory]);
  useEffect(() => localStorage.setItem('venoxa_writing_history', JSON.stringify(writingHistory)), [writingHistory]);
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('ar');
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('userLevel', userLevel);
  }, [userLevel]);
  const renderContent = () => {
    const props = {
      userLevel,
      setUserLevel,
      AI_KEY: GEMINI_API_KEY,
      lang
    };
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setTab={setActiveTab} {...props} />;
      case 'plan':
        return <StudyPlan {...props} globalVocab={globalVocab} />;
      case 'vocab':
        return <Vocabulary {...props} globalVocab={globalVocab} setGlobalVocab={setGlobalVocab} />;
      case 'grammar':
        return <Grammar {...props} />;
      case 'writing':
        return <Writing {...props} writingHistory={writingHistory} setWritingHistory={setWritingHistory} />;
      case 'speaking':
        return <Speaking {...props} speakingHistory={speakingHistory} setSpeakingHistory={setSpeakingHistory} />;
      case 'listening':
        return <ListeningReading type="listening" {...props} />;
      case 'reading':
        return <ListeningReading type="reading" {...props} />;
      case 'langeek':
        return <Langeek {...props} langeekVocab={langeekVocab} setLangeekVocab={setLangeekVocab} />;
      default:
        return <Dashboard setTab={setActiveTab} {...props} />;
    }
  };
  const navItems = [{
    id: 'dashboard',
    label: _resolveTranslation(lang, 'الرئيسية', 'Dashboard'),
    icon: Home
  }, {
    id: 'plan',
    label: _resolveTranslation(lang, 'خطة المذاكرة', 'Study Plan'),
    icon: Calendar
  }, {
    id: 'vocab',
    label: _resolveTranslation(lang, 'الكلمات والمراجعة', 'Vocabulary (SRS)'),
    icon: BookOpen
  }, {
    id: 'writing',
    label: _resolveTranslation(lang, 'الكتابة (AI)', 'Writing (AI)'),
    icon: PenTool
  }, {
    id: 'speaking',
    label: _resolveTranslation(lang, 'المحادثة والاتصال', 'Speaking (Call)'),
    icon: MessageSquare
  }, {
    id: 'grammar',
    label: _resolveTranslation(lang, 'القواعد (AI)', 'Grammar (AI)'),
    icon: FileText
  }, {
    id: 'listening',
    label: _resolveTranslation(lang, 'الاستماع', 'Listening'),
    icon: Headphones
  }, {
    id: 'reading',
    label: _resolveTranslation(lang, 'القراءة (AI)', 'Reading (AI)'),
    icon: Brain
  }, {
    id: 'langeek',
    label: _resolveTranslation(lang, 'لانجيك (PDF)', 'Langeek (PDF)'),
    icon: Archive
  }];
  return <div className={`flex h-screen print:h-auto print:block transition-colors duration-300 ${theme === 'dark' ? 'bg-[#09090b] text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans selection:bg-blue-500/30 print:bg-white print:text-black`} dir={_resolveTranslation(lang, 'rtl', 'ltr')}>
    <div className={`hidden md:flex w-64 flex-col ${theme === 'dark' ? 'bg-[#121214] border-gray-800/60' : 'bg-white border-gray-200'} border-l shadow-2xl z-10 transition-colors duration-300 print:hidden`}>
      <div className={`flex items-center justify-center h-24 border-b ${theme === 'dark' ? 'border-gray-800/60' : 'border-gray-200'}`}>
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
          Venoxa<span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>.ai</span>
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <ul className="space-y-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return <li key={item.id}>
              <button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : `text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent`}`}>
                <item.icon className={`w-5 h-5 ${_resolveTranslation(lang, 'ml-3', 'mr-3')} ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                {item.label}
              </button>
            </li>;
          })}
        </ul>
      </nav>

      <div className={`p-4 border-t flex items-center justify-between ${theme === 'dark' ? 'border-gray-800/60' : 'border-gray-200'}`}>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title={_resolveTranslation(lang, 'تغيير المظهر', 'Toggle Theme')}>
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          <Globe className="w-4 h-4" />
          <LanguageDropdown lang={lang} setLang={setLang} theme={theme} />
        </div>
      </div>
    </div>

    <div className={`md:hidden fixed top-0 left-0 right-0 h-16 ${theme === 'dark' ? 'bg-[#121214]/90 border-gray-800' : 'bg-white/90 border-gray-200'} backdrop-blur-md border-b z-50 flex items-center justify-between px-4 transition-colors print:hidden`}>
      <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Venoxa<span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>.ai</span>
      </h1>
      <div className="flex items-center gap-2">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-gray-500">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </div>

    {isMobileMenuOpen && <div className={`md:hidden fixed inset-0 top-16 ${theme === 'dark' ? 'bg-[#09090b] border-gray-800' : 'bg-gray-50 border-gray-200'} z-40 overflow-y-auto border-t print:hidden`}>
      <nav className="py-4 px-4">
        <ul className="space-y-2">
          {navItems.map(item => <li key={item.id}>
            <button onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }} className={`w-full flex items-center px-6 py-4 rounded-xl text-lg font-bold ${activeTab === item.id ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'text-gray-600 dark:text-gray-400'}`}>
              <item.icon className={`w-6 h-6 ${_resolveTranslation(lang, 'ml-4', 'mr-4')}`} />
              {item.label}
            </button>
          </li>)}
          <li className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="w-full flex items-center px-6 py-4 rounded-xl text-lg font-bold text-gray-600 dark:text-gray-400">
              <Globe className={`w-6 h-6 ${_resolveTranslation(lang, 'ml-4', 'mr-4')}`} />
              <LanguageDropdown lang={lang} setLang={(l) => { setLang(l); setIsMobileMenuOpen(false); }} theme={theme} />
            </div>
          </li>
        </ul>
      </nav>
    </div>}

    <div className={`flex-1 overflow-y-auto md:p-10 p-4 mt-16 md:mt-0 ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-gray-50'} scroll-smooth transition-colors duration-300 print:p-0 print:m-0 print:mt-0 print:bg-white print:overflow-visible print:h-auto print:flex-none print:block`}>
      <div className="max-w-6xl mx-auto print:max-w-none print:mx-0">
        {renderContent()}
      </div>
    </div>
  </div>;
}
function Dashboard({
  setTab,
  userLevel,
  AI_KEY,
  lang
}) {
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  useEffect(() => {
    if (AI_KEY) {
      generateDailyInsight();
    } else {
      setInsight({
        quote: "Consistency is the key to mastery.",
        translated_quote: "الاستمرار هو مفتاح الإتقان.",
        pro_tip: "Try thinking in English for 5 minutes every morning.",
        translated_tip: "حاول التفكير بالإنجليزية لمدة 5 دقائق كل صباح."
      });
    }
  }, [userLevel, lang]);
  const generateDailyInsight = async () => {
    if (loadingInsight || !AI_KEY) return;
    setLoadingInsight(true);
    try {
      const prompt = `You are a helpful AI English coach.
      The user is at level ${userLevel}.
      Generate a unique JSON object with:
      1. "quote": An inspiring short English quote suitable for their level.
      2. "pro_tip": A short, actionable tip to improve their English today.
      3. "translated_quote": Translation of the quote into ${_resolveTranslation(lang, 'Arabic', 'English')}.
      4. "translated_tip": Translation of the tip into ${_resolveTranslation(lang, 'Arabic', 'English')}.
      Only return the JSON.`;
      const response = await fetchFromGemini(prompt, AI_KEY);
      const data = parseGeminiJSON(response);
      if (data && data.error) {
        setInsight({
          quote: data.error,
          translated_quote: "",
          pro_tip: "Please verify your API key configuration.",
          translated_tip: ""
        });
      } else if (data) {
        setInsight(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsight(false);
    }
  };
  const t = {
    welcome: _resolveTranslation(lang, 'أهلاً بك في Venoxa!', 'Welcome to Venoxa!'),
    currentLvl: _resolveTranslation(lang, 'مستواك الحالي', 'Your Current Level:'),
    desc: _resolveTranslation(lang, 'جاهز لتطوير مستواك في اللغة الإنجليزية؟ يمكنك الآن إعداد خطتك الشخصية للوصول لهدفك في وقت قياسي.', 'Ready to improve your English? You can now set up your personalized plan to reach your goal in record time.'),
    createPlan: _resolveTranslation(lang, 'إنشاء الخطة والمستوى', 'Set Plan & Level'),
    quoteTitle: _resolveTranslation(lang, 'إلهام اليوم', 'Daily Inspiration'),
    tipTitle: _resolveTranslation(lang, `نصيحة ذكية للمستوى ${userLevel}`, `Smart Tip for Level ${userLevel}`),
    learningPaths: _resolveTranslation(lang, 'مسارات التعلم الأساسية', 'Core Learning Paths'),
    paths: [{
      id: 'writing',
      icon: PenTool,
      color: "from-purple-500/20 to-purple-500/5",
      iconColor: "text-purple-600 dark:text-purple-400",
      borderHover: "hover:border-purple-500/50",
      title: _resolveTranslation(lang, "تحسين الكتابة", "Improve Writing"),
      desc: _resolveTranslation(lang, "اكتب نصوصاً وسيقوم الذكاء الاصطناعي بتصحيحها وتوضيح الفرق بينها وبين كلام الأجانب.", "Write texts and the AI will correct them and show how a native would say it.")
    }, {
      id: 'listening',
      icon: Headphones,
      color: "from-blue-500/20 to-blue-500/5",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderHover: "hover:border-blue-500/50",
      title: _resolveTranslation(lang, "تقوية الاستماع", "Boost Listening"),
      desc: _resolveTranslation(lang, "مصادر بودكاست ممتازة حسب مستواك لتدريب الأذن.", "Excellent podcast sources based on your level to train your ear.")
    }, {
      id: 'speaking',
      icon: MessageSquare,
      color: "from-emerald-500/20 to-emerald-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderHover: "hover:border-emerald-500/50",
      title: _resolveTranslation(lang, "تحدي التحدث", "Speaking Challenge"),
      desc: _resolveTranslation(lang, "حافظ على طلاقتك وتدرب على محادثات ومواقف مع AI.", "Maintain your fluency and practice conversations and scenarios with AI.")
    }]
  };
  return <div className="space-y-10 animate-fadeIn">
    <div className="relative overflow-hidden bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none"></div>
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 text-center md:text-start">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white leading-tight">
            {t.welcome} <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{t.currentLvl} {userLevel}</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
            {t.desc}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <button onClick={() => setTab('plan')} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2">
              <Calendar className="w-5 h-5" /> {t.createPlan}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-indigo-100 dark:from-indigo-900/40 to-blue-50 dark:to-blue-900/20 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-500/30 flex flex-col justify-center items-center text-center relative overflow-hidden group transition-colors">
        <Quote className="absolute top-4 left-4 w-12 h-12 text-indigo-500/10 -rotate-12" />
        <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {t.quoteTitle}
        </h3>
        {loadingInsight ? <Activity className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin" /> : <>
          <p className="text-xl font-serif italic text-gray-800 dark:text-white mb-2" dir="ltr">"{safeRender(insight?.quote)}"</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-300/80">{safeRender(insight?.translated_quote)}</p>
        </>}
      </div>

      <div className="bg-gradient-to-br from-amber-100 dark:from-amber-900/40 to-orange-50 dark:to-orange-900/20 p-6 rounded-3xl border border-amber-200 dark:border-amber-500/30 flex flex-col justify-center items-center text-center group transition-colors">
        <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" /> {t.tipTitle}
        </h3>
        {loadingInsight ? <Activity className="w-8 h-8 text-amber-500 dark:text-amber-400 animate-spin" /> : <>
          <p className="text-lg text-gray-800 dark:text-white font-medium" dir="ltr">{safeRender(insight?.pro_tip)}</p>
          <p className="text-sm text-amber-600 dark:text-amber-300/80 mt-2">{safeRender(insight?.translated_tip)}</p>
        </>}
      </div>
    </div>

    <div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Activity className="w-6 h-6 text-purple-500 dark:text-purple-400" /> {t.learningPaths}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.paths.map(path => <DashboardCard key={path.id} {...path} onClick={() => setTab(path.id)} />)}
      </div>
    </div>
  </div>;
}
function DashboardCard({
  icon: Icon,
  title,
  desc,
  onClick,
  color,
  iconColor,
  borderHover
}) {
  return <div onClick={onClick} className={`group relative p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${borderHover} overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-[#1f1f23] border border-gray-100 dark:border-gray-800 mb-5 ${iconColor} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100 relative z-10">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 relative z-10 leading-relaxed">{desc}</p>
  </div>;
}
function PlanWeekTable({
  weekNum,
  planData,
  userLevel,
  wordsPerDay,
  relevantGrammarTopics,
  t,
  formatTime,
  getVocabRange,
  getSpacedRepetition,
  dailyTotalMins,
  weeklyTotalMins,
  openVocabModal,
  openGrammarModal,
  interactive
}) {
  const cellBase = "border border-gray-400 dark:border-gray-700 print:border-gray-500 px-2 py-2 align-middle text-center";
  const headBase = "border border-gray-400 dark:border-gray-700 print:border-gray-600 bg-gray-100 dark:bg-[#1a1a1e] text-gray-900 dark:text-white px-2 py-2 font-bold text-sm";
  return <div className="overflow-x-auto print:overflow-visible">
    <table className="w-full border-collapse text-sm bg-white dark:bg-[#0e0e11] text-gray-800 dark:text-gray-100 min-w-[760px] print:min-w-full">
      <thead>
        <tr>
          <th className={headBase}>{t.activity}</th>
          {[1, 2, 3, 4, 5, 6, 7].map(d => <th key={d} className={headBase}>
            <div>{t.day} {d}</div>
            <div className="text-[10px] font-bold opacity-70 mt-0.5">{userLevel}</div>
          </th>)}
          <th className={headBase}>{t.summary}</th>
        </tr>
      </thead>
      <tbody>
        {planData.categories.map(cat => <tr key={cat.id}>
          <td className={`${cellBase} text-start font-bold ${cat.textColor} ${cat.headerBg}`}>
            <div className="flex items-center gap-2 px-1">
              <cat.icon className="w-4 h-4 shrink-0" />
              <span>{cat.name}</span>
            </div>
          </td>
          {[0, 1, 2, 3, 4, 5, 6].map(d => {
            const isInteractive = interactive && (cat.id === 'vocab' || cat.id === 'grammar');
            const cellClass = `${cellBase} ${cat.textColor} ${cat.cellBg} font-semibold ${isInteractive ? cat.id === 'vocab' ? 'cursor-pointer hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/30 active:bg-fuchsia-300 dark:active:bg-fuchsia-800/40 transition-colors' : 'cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/30 active:bg-orange-300 dark:active:bg-orange-800/40 transition-colors' : ''}`;
            const onClick = isInteractive ? () => {
              if (cat.id === 'vocab') openVocabModal(d);
              if (cat.id === 'grammar') openGrammarModal(d);
            } : undefined;
            return <td key={d} className={cellClass} onClick={onClick}>
              {cat.id === 'vocab' ? <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-extrabold tracking-tight" dir="ltr">{getVocabRange(weekNum, d)}</span>
                <span className="text-[10px] opacity-70">{cat.mins}m</span>
              </div> : cat.id === 'grammar' ? <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-bold leading-tight px-0.5 line-clamp-2 overflow-hidden" dir="ltr" title={relevantGrammarTopics[((weekNum - 1) * 7 + d) % relevantGrammarTopics.length]}>
                  {relevantGrammarTopics[((weekNum - 1) * 7 + d) % relevantGrammarTopics.length]}
                </span>
                <span className="text-[10px] opacity-70">{cat.mins}m</span>
              </div> : <span className="text-sm">{cat.mins}m</span>}
            </td>;
          })}
          <td className={`${cellBase} font-bold ${cat.textColor} ${cat.headerBg}`}>
            {formatTime(cat.mins * 7)}
          </td>
        </tr>)}

        <tr>
          <td className={`${cellBase} text-start font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/15`}>
            <div className="flex items-center gap-2 px-1">
              <Layers className="w-4 h-4 shrink-0" />
              <span>{t.spacedRep}</span>
            </div>
          </td>
          {[0, 1, 2, 3, 4, 5, 6].map(d => {
            const phases = getSpacedRepetition(weekNum, d);
            return <td key={d} className={`${cellBase} text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/10 text-[11px] font-semibold leading-tight`} dir="ltr">
              {phases.length === 0 ? <span className="opacity-40">—</span> : phases.map(p => <div key={p}>{p}</div>)}
            </td>;
          })}
          <td className={`${cellBase} text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/15 font-bold`}>
            <span className="opacity-40">—</span>
          </td>
        </tr>

        <tr>
          <td className={`${cellBase} text-start font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800`}>
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{t.categories.total}</span>
            </div>
          </td>
          {[0, 1, 2, 3, 4, 5, 6].map(d => <td key={d} className={`${cellBase} font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800/60`}>
            {formatTime(dailyTotalMins)}
          </td>)}
          <td className={`${cellBase} font-extrabold text-gray-900 dark:text-white bg-gray-300 dark:bg-gray-700`}>
            {formatTime(weeklyTotalMins)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>;
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
  globalVocab
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
  const [totalInvestMinutes, setTotalInvestMinutes] = useState('');
  const [wordsManual, setWordsManual] = useState(stored?.wordsManual || 10);
  const [planMeta, setPlanMeta] = useState(stored?.planMeta || null); // serialisable plan
  const [currentWeek, setCurrentWeek] = useState(stored?.currentWeek || 1);
  const [vocabModal, setVocabModal] = useState(null);
  const [grammarModal, setGrammarModal] = useState(null);
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
    totalInvestTitle: _resolveTranslation(lang, 'إجمالي وقت المذاكرة اليومي', 'Total Daily Study Time'),
    totalInvestPlaceholder: _resolveTranslation(lang, '60', '60'),
    divideBtn: _resolveTranslation(lang, 'تقسيم الوقت تلقائياً', 'Auto-Divide Time'),
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

  // Total NEW words to learn = sum of CEFR_LEVEL_WORDS for every level strictly above the user's current.
  const wordsDelta = useMemo(() => {
    const curIdx = LEVEL_ORDER.indexOf(userLevel);
    const tgtIdx = LEVEL_ORDER.indexOf(targetLevel);
    if (curIdx < 0 || tgtIdx < 0 || tgtIdx <= curIdx) return 0;
    let total = 0;
    for (let i = curIdx + 1; i <= tgtIdx; i++) total += CEFR_LEVEL_WORDS[LEVEL_ORDER[i]];
    return total;
  }, [userLevel, targetLevel]);

  // Total grammar rules across every level from current+1 up to target (inclusive).
  const rulesDelta = useMemo(() => {
    const curIdx = LEVEL_ORDER.indexOf(userLevel);
    const tgtIdx = LEVEL_ORDER.indexOf(targetLevel);
    if (curIdx < 0 || tgtIdx < 0 || tgtIdx <= curIdx) return 0;
    let total = 0;
    for (let i = curIdx + 1; i <= tgtIdx; i++) {
      const lvlKey = LEVEL_ORDER[i];
      const entry = GRAMMAR_LEVELS.find(g => g.level.startsWith(lvlKey));
      if (entry) total += entry.topics.length;
    }
    return total;
  }, [userLevel, targetLevel]);

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
      headerBg: 'bg-blue-100 dark:bg-blue-900/30',
      cellBg: 'bg-blue-50 dark:bg-blue-900/10',
      textColor: 'text-blue-700 dark:text-blue-400'
    }, {
      id: 'read',
      name: t.categories.read,
      icon: BookText,
      mins: m.read,
      headerBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      cellBg: 'bg-emerald-50 dark:bg-emerald-900/10',
      textColor: 'text-emerald-700 dark:text-emerald-400'
    }, {
      id: 'speak',
      name: t.categories.speak,
      icon: MessageSquare,
      mins: m.speak,
      headerBg: 'bg-pink-100 dark:bg-pink-900/30',
      cellBg: 'bg-pink-50 dark:bg-pink-900/10',
      textColor: 'text-pink-700 dark:text-pink-400'
    }, {
      id: 'write',
      name: t.categories.write,
      icon: PenTool,
      mins: m.write,
      headerBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      cellBg: 'bg-indigo-50 dark:bg-indigo-900/10',
      textColor: 'text-indigo-700 dark:text-indigo-400'
    }, {
      id: 'vocab',
      name: t.categories.vocab,
      icon: BookOpen,
      mins: m.vocab,
      headerBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
      cellBg: 'bg-fuchsia-50 dark:bg-fuchsia-900/10',
      textColor: 'text-fuchsia-700 dark:text-fuchsia-400'
    }, {
      id: 'grammar',
      name: t.categories.grammar,
      icon: FileText,
      mins: m.grammar,
      headerBg: 'bg-orange-100 dark:bg-orange-900/30',
      cellBg: 'bg-orange-50 dark:bg-orange-900/10',
      textColor: 'text-orange-700 dark:text-orange-400'
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
        wordsManual,
        planMeta,
        currentWeek
      }));
    } catch {/* quota or private mode — silently ignore */ }
  }, [targetLevel, startDate, targetDate, skillSettings, wordsMode, wordsManual, planMeta, currentWeek]);

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
    return filtered.length >= wordsPerDay ? filtered : globalVocab;
  }, [globalVocab, userLevel, wordsPerDay]);
  const relevantGrammarTopics = useMemo(() => {
    const levelsToInclude = GRAMMAR_LEVELS.filter(g => {
      return g.level.includes(userLevel) || g.level.includes(targetLevel);
    });
    if (levelsToInclude.length === 0) return GRAMMAR_LEVELS[2].topics;
    return levelsToInclude.flatMap(g => g.topics);
  }, [userLevel, targetLevel]);
  const generatePlan = () => {
    const mins = {
      listen: effectiveSkillMins('listen'),
      read: effectiveSkillMins('read'),
      speak: effectiveSkillMins('speak'),
      write: effectiveSkillMins('write'),
      vocab: VOCAB_MINS,
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
    setPlanMeta({
      totalWeeks: calculatedWeeks,
      mins,
      wordsPerDay: wpd
    });
    setCurrentWeek(1);
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
  const handleAutoDivide = () => {
    const total = parseInt(totalInvestMinutes, 10);
    if (isNaN(total) || total <= 0) {
      alert(_resolveTranslation(lang, 'يرجى إدخال وقت صحيح!', 'Please enter a valid time!'));
      return;
    }
    // Simple logic to divide time based on a reasonable ratio
    // Listening: 30%, Reading: 25%, Speaking: 25%, Writing: 20%
    const listen = Math.round(total * 0.30);
    const read = Math.round(total * 0.25);
    const speak = Math.round(total * 0.25);
    const write = total - listen - read - speak;

    setSkillSettings({
      listen: { useDefault: false, mins: listen },
      read: { useDefault: false, mins: read },
      speak: { useDefault: false, mins: speak },
      write: { useDefault: false, mins: write }
    });
  };
  const handleNextWeek = () => {
    if (currentWeek < planData.totalWeeks) setCurrentWeek(prev => prev + 1);
  };
  const handlePrevWeek = () => {
    if (currentWeek > 1) setCurrentWeek(prev => prev - 1);
  };
  const openVocabModal = dayIndex => {
    const startIdx = ((currentWeek - 1) * 7 + dayIndex) * wordsPerDay;
    const dayWords = [];
    for (let i = 0; i < wordsPerDay; i++) {
      if (suitableVocab.length === 0) break;
      const globalIdx = (startIdx + i) % suitableVocab.length;
      dayWords.push(suitableVocab[globalIdx]);
    }
    setVocabModal({
      day: dayIndex + 1,
      words: dayWords
    });
  };
  const openGrammarModal = dayIndex => {
    const globalIdx = (currentWeek - 1) * 7 + dayIndex;
    const topic = relevantGrammarTopics[globalIdx % relevantGrammarTopics.length];
    setGrammarModal({
      day: dayIndex + 1,
      topic
    });
  };
  const handlePrint = () => {
    // Force light theme for printing — the dark theme is unreadable on paper.
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    if (wasDark) html.classList.remove('dark');
    const restore = () => {
      if (wasDark) html.classList.add('dark');
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    // Allow the browser one frame to recompute styles before opening the dialog.
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 50);
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
  const getSpacedRepetition = (weekIdx, dayIdx) => {
    const globalDay = (weekIdx - 1) * 7 + dayIdx + 1;
    const phases = [];
    for (let p = 1; p <= 3; p++) {
      const pDay = globalDay - p;
      if (pDay >= 1) {
        const start = (pDay - 1) * wordsPerDay + 1;
        const end = pDay * wordsPerDay;
        phases.push(`P${p}: ${start}-${end}`);
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
            const idx = (w - 1) * 7 + d;
            const topic = relevantGrammarTopics[idx % relevantGrammarTopics.length] || '';
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
  const dailyTotalMins = planData?.categories.reduce((acc, cat) => acc + cat.mins, 0) || 0;
  const weeklyTotalMins = dailyTotalMins * 7;
  const todayStr = new Date().toISOString().split('T')[0];
  return <div className="space-y-8 animate-fadeIn print:m-0 print:p-0">
    {!planData && <div className="bg-white dark:bg-[#121214] p-8 md:p-12 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl relative overflow-hidden transition-colors">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <h2 className="text-3xl font-extrabold mb-8 text-gray-900 dark:text-white flex items-center gap-3 relative z-10">
        <Sparkles className="text-blue-600 dark:text-blue-400 w-8 h-8" /> {t.title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-50">
        <div className="bg-gray-50 dark:bg-[#1a1a1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col justify-center">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold">{t.currentLvl}</label>
          <select value={userLevel} onChange={e => setUserLevel(e.target.value)} className="w-full bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer">
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="bg-gray-50 dark:bg-[#1a1a1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col justify-center">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold">{t.targetLvl}</label>
          <select value={targetLevel} onChange={e => setTargetLevel(e.target.value)} className="w-full bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer">
            {['A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="bg-gray-50 dark:bg-[#1a1a1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col justify-center relative z-50">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold">{t.startDateLbl}</label>
          <SolidDatePicker value={startDate} onChange={setStartDate} label="Start Date" />
        </div>

        <div className="bg-gray-50 dark:bg-[#1a1a1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col justify-center relative z-50">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold">{t.dateLabel}</label>
          <SolidDatePicker min={startDate || todayStr} value={targetDate} onChange={setTargetDate} label="Target Date" />
        </div>
      </div>

      {/* Per-skill durations with a Default toggle */}
      <div className="bg-gray-50 dark:bg-[#1a1a1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 mb-6 relative z-10">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> {t.skillsTitle}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">{t.skillsHint}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
          {/* Smart Auto-Divide Tool */}
          <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl p-3 transition-all hover:border-gray-300 dark:hover:border-gray-600 flex flex-col justify-between h-full shadow-sm relative overflow-hidden group">
            <div className="mb-2">
              <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
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
                className="w-full max-w-[100px] h-11 bg-gray-50 dark:bg-[#0e0e11] border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-gray-900 dark:text-white font-bold text-center text-lg focus:outline-none focus:border-blue-500 shadow-sm min-w-0"
              />
              <button
                onClick={handleAutoDivide}
                className="bg-gray-100 dark:bg-[#0e0e11] hover:bg-gray-200 dark:hover:bg-black text-blue-600 dark:text-blue-400 w-11 h-11 rounded-lg transition-all border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 flex items-center justify-center shrink-0"
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
            color: 'text-blue-600 dark:text-blue-400',
            ring: 'focus:border-blue-500'
          }, {
            id: 'read',
            label: t.categories.read,
            Icon: BookText,
            color: 'text-emerald-600 dark:text-emerald-400',
            ring: 'focus:border-emerald-500'
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
            color: 'text-indigo-600 dark:text-indigo-400',
            ring: 'focus:border-indigo-500'
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
            return <div key={id} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl p-3 transition-all hover:border-gray-300 dark:hover:border-gray-600 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className={`flex items-center gap-2 font-bold ${color} min-w-0`}>
                  <Icon className="w-4 h-4 shrink-0" /> 
                  <span className="text-xs sm:text-sm leading-tight truncate">{label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] font-bold uppercase tracking-tight ${s.useDefault ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{t.useDefault}</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input type="checkbox" className="sr-only peer" checked={s.useDefault} onChange={e => setSkillDefault(id, e.target.checked)} />
                    <span className="block w-8 h-4 bg-gray-300 dark:bg-gray-700 rounded-full peer-checked:bg-blue-500 transition-colors"></span>
                    <span className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-auto">
                <input type="number" min="0" max="240" value={s.useDefault ? DEFAULT_SKILL_MINS[id] : s.mins} disabled={s.useDefault} onChange={e => setSkillMins(id, e.target.value)} className={`w-full max-w-[100px] h-11 bg-gray-50 dark:bg-[#0e0e11] border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-gray-900 dark:text-white font-bold text-center text-lg focus:outline-none ${ring} disabled:opacity-60 disabled:cursor-not-allowed min-w-0`} />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">{t.minsUnit}</span>
              </div>
            </div>;
          })}
        </div>
      </div>

      {/* Words per day — auto vs manual */}
      <div className="bg-gray-50 dark:bg-[#1a1a1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 mb-8 relative z-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-fuchsia-500" /> {t.wordsTitle}
          </h3>
          <div className="inline-flex bg-white dark:bg-[#0e0e11] border border-gray-200 dark:border-gray-700 rounded-xl p-1 text-sm font-bold">
            <button onClick={() => setWordsMode('auto')} className={`px-3 py-1.5 rounded-lg transition-colors ${wordsMode === 'auto' ? 'bg-fuchsia-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {t.wordsAuto}
            </button>
            <button onClick={() => setWordsMode('manual')} className={`px-3 py-1.5 rounded-lg transition-colors ${wordsMode === 'manual' ? 'bg-fuchsia-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {t.wordsManualLbl}
            </button>
          </div>
        </div>

        {wordsMode === 'auto' ? <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-300" dir="ltr">
            <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400">{userLevel} → {targetLevel}</span>
            {' '}·{' '}
            <span className="font-bold">{wordsDelta}</span> {t.wordsToLearn}
            {daysToTarget > 0 && <> · <span className="font-bold">{daysToTarget}</span> {t.days}</>}
          </div>
          <div className="text-2xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400" dir="ltr">
            {autoWordsPerDay} <span className="text-sm font-bold opacity-70">{t.perDay}</span>
          </div>
        </div> : <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3 flex-wrap">
          <input type="number" min="1" max="100" value={wordsManual} onChange={e => setWordsManual(e.target.value)} className="w-32 bg-gray-50 dark:bg-[#0e0e11] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-extrabold text-center text-2xl focus:outline-none focus:border-fuchsia-500" />
          <span className="font-bold text-gray-700 dark:text-gray-200">{t.wordsToLearn} {t.perDay}</span>
        </div>}
      </div>

      {/* Live estimate of what the user will need to learn */}
      {planEstimate && <div className="bg-gradient-to-br from-blue-50 to-fuchsia-50 dark:from-[#0f1730] dark:to-[#22112e] border border-gray-200 dark:border-gray-700/50 p-6 rounded-2xl mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" /> {t.estimateTitle}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 max-w-md text-end">{t.estimateHint}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[{
            label: t.days,
            value: planEstimate.totalDays,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-100/70 dark:bg-purple-900/20',
            Icon: Calendar
          }, {
            label: t.words,
            value: planEstimate.totalWords.toLocaleString(),
            color: 'text-fuchsia-600 dark:text-fuchsia-400',
            bg: 'bg-fuchsia-100/70 dark:bg-fuchsia-900/20',
            Icon: BookOpen
          }, {
            label: t.rules,
            value: planEstimate.totalRules,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-100/70 dark:bg-orange-900/20',
            Icon: FileText
          }, {
            label: `${t.categories.listen} (${t.hours})`,
            value: planEstimate.hours.listen.toFixed(1),
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100/70 dark:bg-blue-900/20',
            Icon: Headphones
          }, {
            label: `${t.categories.read} (${t.hours})`,
            value: planEstimate.hours.read.toFixed(1),
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100/70 dark:bg-emerald-900/20',
            Icon: BookText
          }, {
            label: `${t.categories.speak} (${t.hours})`,
            value: planEstimate.hours.speak.toFixed(1),
            color: 'text-pink-600 dark:text-pink-400',
            bg: 'bg-pink-100/70 dark:bg-pink-900/20',
            Icon: MessageSquare
          }, {
            label: `${t.categories.write} (${t.hours})`,
            value: planEstimate.hours.write.toFixed(1),
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-100/70 dark:bg-indigo-900/20',
            Icon: PenTool
          }, {
            label: t.wordsTitle,
            value: `${planEstimate.wordsPerDay} ${t.perDay}`,
            color: 'text-fuchsia-600 dark:text-fuchsia-400',
            bg: 'bg-fuchsia-100/70 dark:bg-fuchsia-900/20',
            Icon: Sparkles
          }].map(({
            label,
            value,
            color,
            bg,
            Icon
          }, i) => <div key={i} className={`${bg} rounded-xl p-3 border border-white/40 dark:border-white/5`}>
              <div className={`flex items-center gap-1.5 text-[11px] font-bold ${color} opacity-90 uppercase tracking-wide`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </div>
              <div className={`text-2xl font-extrabold ${color} mt-1`} dir="ltr">{value}</div>
            </div>)}
        </div>
      </div>}

      <button onClick={generatePlan} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-extrabold text-lg py-5 rounded-2xl transition-all hover:shadow-lg">{t.gen}</button>
    </div>}

    {planData && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 animate-fadeIn transition-colors relative print:shadow-none print:border-none print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1e] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <button onClick={_resolveTranslation(lang, handleNextWeek, handlePrevWeek)} disabled={_resolveTranslation(lang, currentWeek === planData.totalWeeks, currentWeek === 1)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors">
              {_resolveTranslation(lang, <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />, <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />)}
            </button>
            <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[110px] text-center text-base">
              {t.week} {currentWeek} <span className="text-sm opacity-60">/ {planData.totalWeeks}</span>
            </span>
            <button onClick={_resolveTranslation(lang, handlePrevWeek, handleNextWeek)} disabled={_resolveTranslation(lang, currentWeek === 1, currentWeek === planData.totalWeeks)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors">
              {_resolveTranslation(lang, <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />, <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />)}
            </button>
          </div>
          <select value={currentWeek} onChange={e => setCurrentWeek(Number(e.target.value))} className="bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm" aria-label={t.jumpWeek}>
            {Array.from({
              length: planData.totalWeeks
            }, (_, i) => i + 1).map(w => <option key={w} value={w}>{t.jumpWeek}: {w}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm font-bold transition-colors px-4 py-2 rounded-lg shadow-sm">
            <Archive className="w-4 h-4" /> {t.exportCsv}
          </button>
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 text-sm font-bold transition-colors px-4 py-2 rounded-lg shadow-sm">
            <Printer className="w-4 h-4" /> {t.exportPdf}
          </button>
          <button onClick={() => setPlanMeta(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 text-sm font-bold transition-colors bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
            <RotateCcw className="w-4 h-4" /> {t.reset}
          </button>
        </div>
      </div>

      {/* Per-skill progress sliders — auto-advance with the current week */}
      <div className="bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 mb-6 print:hidden">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" /> {t.progressTitle}
          </h3>
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
            {t.weekOf} {currentWeek} {t.of} {planData.totalWeeks}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            id: 'listen',
            label: t.categories.listen,
            Icon: Headphones,
            bar: 'from-blue-500 to-blue-400',
            text: 'text-blue-600 dark:text-blue-400'
          }, {
            id: 'read',
            label: t.categories.read,
            Icon: BookText,
            bar: 'from-emerald-500 to-emerald-400',
            text: 'text-emerald-600 dark:text-emerald-400'
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
            bar: 'from-indigo-500 to-indigo-400',
            text: 'text-indigo-600 dark:text-indigo-400'
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
            return <div key={id} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-1.5 font-bold ${text}`}>
                  <Icon className="w-4 h-4" /> {label}
                </div>
                <span className={`text-xs font-extrabold ${text}`} dir="ltr">{pct}%</span>
              </div>
              {/* Slider-style progress bar */}
              <div className="relative h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${bar} transition-all duration-500 ease-out rounded-full`} style={{
                  width: `${pct}%`
                }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border border-gray-300 transition-all duration-500 ease-out" style={{
                  left: `calc(${pct}% - 7px)`
                }} />
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-semibold" dir="ltr">
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
            const totalRules = rulesDelta || planData.totalWeeks;
            const masteredRules = Math.min(currentWeek - 1, totalRules);
            const rulesPct = totalRules ? Math.round(masteredRules / totalRules * 100) : 0;
            return [{
              label: t.vocabProgress,
              done: learnedWords.toLocaleString(),
              total: totalWords.toLocaleString(),
              pct: wordsPct,
              suffix: t.learned,
              bar: 'from-fuchsia-500 to-purple-500',
              text: 'text-fuchsia-600 dark:text-fuchsia-400'
            }, {
              label: t.grammarProgress,
              done: masteredRules,
              total: totalRules,
              pct: rulesPct,
              suffix: t.mastered,
              bar: 'from-orange-500 to-amber-500',
              text: 'text-orange-600 dark:text-orange-400'
            }].map((row, i) => <div key={i} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 text-sm font-bold">
                <span className={row.text}>{row.label}</span>
                <span className={`${row.text}`} dir="ltr">{row.pct}%</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${row.bar} transition-all duration-500 ease-out rounded-full`} style={{
                  width: `${row.pct}%`
                }} />
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-semibold" dir="ltr">
                {row.done} / {row.total} {row.suffix}
              </div>
            </div>);
          })()}
        </div>
      </div>

      {/* Screen view: current week only */}
      <div className="print:hidden">
        <PlanWeekTable weekNum={currentWeek} planData={planData} userLevel={userLevel} wordsPerDay={wordsPerDay} relevantGrammarTopics={relevantGrammarTopics} t={t} formatTime={formatTime} getVocabRange={getVocabRange} getSpacedRepetition={getSpacedRepetition} dailyTotalMins={dailyTotalMins} weeklyTotalMins={weeklyTotalMins} openVocabModal={openVocabModal} openGrammarModal={openGrammarModal} interactive />
      </div>

      {/* Print view: every week, page break between */}
      <div className="hidden print:block">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-black">{_resolveTranslation(lang, 'الجدول الأسبوعي للمذاكرة - Venoxa AI', 'Weekly Study Plan - Venoxa AI')}</h1>
          <p className="text-gray-700 mt-1 text-sm">{t.currentLvl}: {userLevel} | {t.targetLvl}: {targetLevel} | {planData.totalWeeks} {_resolveTranslation(lang, 'أسابيع', 'weeks')}</p>
        </div>
        {Array.from({
          length: planData.totalWeeks
        }, (_, i) => i + 1).map(w => <div key={w} className={w < planData.totalWeeks ? 'mb-6 break-after-page' : 'mb-6'}>
          <h2 className="text-lg font-bold text-black mb-2 text-center">{t.week} {w}</h2>
          <PlanWeekTable weekNum={w} planData={planData} userLevel={userLevel} wordsPerDay={wordsPerDay} relevantGrammarTopics={relevantGrammarTopics} t={t} formatTime={formatTime} getVocabRange={getVocabRange} getSpacedRepetition={getSpacedRepetition} dailyTotalMins={dailyTotalMins} weeklyTotalMins={weeklyTotalMins} openVocabModal={openVocabModal} openGrammarModal={openGrammarModal} interactive={false} />
        </div>)}
      </div>

      {vocabModal && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn print:hidden" onClick={() => setVocabModal(null)}>
        <div className="bg-white dark:bg-[#1a1a1e] rounded-3xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 p-5 text-white flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-bold text-xl flex items-center gap-2"><BookOpen className="w-5 h-5" /> {t.vocabHeader} ({t.day} {vocabModal.day})</h3>
              <p className="text-sm opacity-90 mt-1">{wordsPerDay} {t.wordsToLearn}</p>
            </div>
            <button onClick={() => setVocabModal(null)} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar bg-gray-50 dark:bg-[#121214]">
            {vocabModal.words.length === 0 ? <p className="text-center text-gray-500 py-10">لا توجد كلمات متاحة، يرجى رفع ملف الكلمات.</p> : vocabModal.words.map((w, i) => <div key={i} className="flex flex-col p-4 bg-white dark:bg-[#1a1a1e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-7 h-7 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                <span className="font-extrabold text-lg text-gray-900 dark:text-gray-100" dir="ltr">{safeRender(w?.word)}</span>
              </div>
              {w?.meaning && <span className="text-sm text-gray-500 dark:text-gray-400 mr-10">{safeRender(w.meaning)}</span>}
            </div>)}
          </div>
        </div>
      </div>}

      {grammarModal && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn print:hidden" onClick={() => setGrammarModal(null)}>
        <div className="bg-white dark:bg-[#1a1a1e] rounded-3xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-bold text-xl flex items-center gap-2"><FileText className="w-5 h-5" /> {t.grammarHeader} ({t.day} {grammarModal.day})</h3>
              <p className="text-sm opacity-90 mt-1">{t.grammarTarget}</p>
            </div>
            <button onClick={() => setGrammarModal(null)} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
          </div>
          <div className="p-8 text-center bg-gray-50 dark:bg-[#121214]">
            <div className="inline-flex p-4 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 mb-6 shadow-sm">
              <Target className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4" dir="ltr">{safeRender(grammarModal.topic)}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {_resolveTranslation(lang, 'يمكنك التوجه لقسم "القواعد الشاملة" لطلب شرح مفصل لهذه القاعدة مع الأمثلة من معلم الذكاء الاصطناعي.', 'Head over to the "Comprehensive Grammar" section to get a detailed AI explanation of this rule.')}
            </p>
          </div>
        </div>
      </div>}

    </div>}
  </div>;
}
function Vocabulary({
  AI_KEY,
  userLevel,
  lang,
  globalVocab,
  setGlobalVocab
}) {
  const [srsData, setSrsData] = useState(() => JSON.parse(localStorage.getItem('venoxa_srs_data')) || {});
  const [vocabMode, setVocabMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 60000);
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
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days')
  };
  const dueCards = useMemo(() => {
    const now = Date.now();
    return globalVocab.filter(card => {
      const data = srsData[card.word];
      if (!data) return false;
      return data.nextReview <= now;
    });
  }, [globalVocab, srsData, tick]);
  const hardWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [globalVocab, srsData]);
  const learningWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'good'), [globalVocab, srsData]);
  const masteredWords = useMemo(() => globalVocab.filter(w => srsData[w.word]?.rating === 'easy'), [globalVocab, srsData]);
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
  useEffect(() => {
    if (vocabMode === 'browse' && filteredVocabList.length > 0 && activeWordIndex >= filteredVocabList.length) {
      setActiveWordIndex(0);
    }
  }, [filteredVocabList.length, activeWordIndex, vocabMode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = now;
    if (rating === 'again') nextReview = now + 1 * 60 * 1000; else if (rating === 'hard') nextReview = now + 10 * 60 * 1000; else if (rating === 'good') nextReview = now + 24 * 60 * 60 * 1000; else if (rating === 'easy') nextReview = now + 4 * 24 * 60 * 60 * 1000;
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
  // Play a word's pronunciation using ElevenLabs (falls back to browser TTS)
  const playAudio = async (_accentCode, wordToPlay = card?.word) => {
    if (!wordToPlay) return;
    await elevenLabsSpeak(wordToPlay);
  };

  const generateStory = async () => {
    if (loadingAi || aiStory || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `أنت معلم لغة إنجليزية مرح. قم بتأليف قصة قصيرة جداً ومضحكة (سطرين أو ثلاثة فقط) باللغة الإنجليزية تتضمن الكلمة "${card.word}" (والتي تعني: ${card.meaning}) لمساعدة طالب مستواه ${userLevel} على تذكرها بسهولة.
      بعد القصة الإنجليزية، أضف سطرين باللغة ${_resolveTranslation(lang, 'العربية', 'الإنجليزية')} تشرح فيهما كيف تم استخدام الكلمة في القصة.`;
      const responseText = await fetchFromGemini(prompt, AI_KEY);
      const errJson = parseGeminiJSON(responseText);
      if (errJson && errJson.error) {
        setAiStory(errJson.error);
      } else {
        setAiStory(responseText);
      }
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
      const briefPrompt = `In ONE short English sentence (max 18 words), describe a vivid, photorealistic single-scene image that clearly conveys the meaning of the English word "${card.word}" (which means: ${card.meaning || 'see context'}). Rules: describe one concrete visual scene with a clear subject and action, no text or letters in the image, no abstract concepts. Output ONLY the description sentence, nothing else.`;
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
        visual = `A photorealistic everyday scene that visually represents the English word "${card.word}" meaning "${card.meaning || ''}".`;
      }
      const finalPrompt = `${visual} Photorealistic, natural lighting, clean composition, ultra detailed, no text, no letters, no captions, no watermark.`;
      const seed = Math.floor(Math.random() * 1_000_000);
      // Use a free, no-key image service (no quota) so this works without a paid Imagen key.
      setCardImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=640&height=420&nologo=true&model=flux&seed=${seed}`);
    } catch (err) {
      console.error("Image generation error", err);
      const fallback = `Photorealistic image showing the meaning of the English word ${card.word} (${card.meaning || ''}), no text, no letters.`;
      setCardImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(fallback)}?width=640&height=420&nologo=true&model=flux`);
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
      const response = await fetchFromGemini(prompt, AI_KEY);
      const errJson = parseGeminiJSON(response);
      if (errJson && errJson.error) {
        setContextStory(errJson.error);
      } else {
        setContextStory(response);
      }
    } catch (e) {
      setContextStory(t.storyError);
    } finally {
      setLoadingContextStory(false);
    }
  };
  return <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">

    <div className="flex flex-col sm:flex-row bg-white dark:bg-[#1a1a1e] p-1.5 rounded-xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-gray-800 shadow-lg transition-colors">
      <button onClick={() => {
        setVocabMode('browse');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'browse' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => {
        setVocabMode('review');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${vocabMode === 'review' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
        <Layers className="w-4 h-4" /> {t.review}
        {dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg">{dueCards.length}</span>}
      </button>
      <button onClick={() => {
        setVocabMode('lists');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'lists' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>

    {vocabMode === 'lists' && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>

      {listTab === 'hard' && hardWords.length > 0 && <div className="mb-6">
        <button onClick={generateContextStory} disabled={loadingContextStory} className="w-full py-4 bg-orange-50 dark:bg-orange-600/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all shadow-sm">
          {loadingContextStory ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> ✨ {t.contextBtn}</>}
        </button>
        {contextStory && <div className={`mt-4 p-5 bg-gray-50 dark:bg-[#1a1a1e] rounded-2xl border border-gray-200 dark:border-gray-700 ${_resolveTranslation(lang, 'text-right', 'text-left')} prose prose-orange dark:prose-invert max-w-none`}><div style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(contextStory)}</div></div>}
      </div>}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateWordsMsg}</p></div> : currentListView.map(item => <div key={item.word} className="flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1e] p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-500 transition-colors group">
          <div className="text-left" dir="ltr">
            <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {safeRender(item.word)}
              <button onClick={() => playAudio('en-US', item.word)} className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"><Volume2 className="w-4 h-4" /></button>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{safeRender(item.meaning)}</p>
          </div>
          <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><RotateCcw className="w-5 h-5" /></button>
        </div>)}
      </div>
    </div>}

    {vocabMode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t.smartCards}</h2><p className="text-sm text-gray-600 dark:text-gray-400">{t.totalWords} {globalVocab.length}</p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm text-green-600 dark:text-green-400 font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-500 dark:hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            <UploadCloud className="w-4 h-4" /> {t.uploadCSV}
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg transition-colors">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2"><Search className="w-4 h-4 text-blue-500 dark:text-blue-400" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-purple-500 dark:text-purple-400" /> {t.filterLevel}</label>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer">
            <option value="All">All Levels</option><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option><option value="C1">C1</option><option value="C2">C2</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2"><List className="w-4 h-4 text-green-500 dark:text-green-400" /> {t.manualSelect} ({filteredVocabList.length})</label>
          <select value={safeIndex} onChange={e => {
            setActiveWordIndex(Number(e.target.value));
            setShowMeaning(false);
            setAiStory('');
            setCardImage(null);
          }} className="w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer" dir="ltr">
            {filteredVocabList.length === 0 ? <option value={0}>{t.noWords}</option> : filteredVocabList.map((item, idx) => <option key={idx} value={idx}>{safeRender(item.word)}</option>)}
          </select>
        </div>
      </div>
    </>}

    {vocabMode === 'review' && !card && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center p-8 shadow-2xl text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-white font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setVocabMode('browse')} className="mt-8 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/50 px-8 py-3 rounded-xl font-bold">{t.browseLearn}</button>
    </div>}

    {vocabMode === 'browse' && (filteredVocabList.length === 0 || !card) && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center p-8 shadow-lg text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
      <h3 className="text-xl text-gray-600 dark:text-gray-400 font-bold">{t.noMatch}</h3>
    </div>}

    {card && vocabMode !== 'lists' && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative shadow-2xl hover:border-blue-300 transition-all duration-300 group animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-blue-50 dark:from-blue-900/5 to-transparent rounded-[2rem] pointer-events-none transition-colors"></div>
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
        <button onClick={e => {
          e.stopPropagation();
          playAudio('en-US');
        }} className="p-3 bg-gray-50 dark:bg-[#1a1a1e] rounded-xl text-blue-600 dark:text-blue-400 shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline">🇺🇸 US</span></button>
        <button onClick={e => {
          e.stopPropagation();
          playAudio('en-GB');
        }} className="p-3 bg-gray-50 dark:bg-[#1a1a1e] rounded-xl text-red-600 dark:text-red-400 shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline">🇬🇧 UK</span></button>
      </div>
      <span className="absolute top-6 right-6 bg-gray-50 dark:bg-[#1a1a1e] text-blue-600 dark:text-blue-400 border border-blue-200 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm flex flex-col items-center"><span>{safeRender(card.level)}</span></span>

      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-gray-500 text-sm mt-8 animate-pulse bg-gray-100 dark:bg-gray-800/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-24 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-[#1a1a1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-800/50 mt-4 w-full relative"><p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        {card.synonyms && <div className="w-full bg-gray-100 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 dark:text-gray-400" dir="ltr"><span className="font-bold text-gray-500 mr-2">{t.synonyms}</span> <span className="text-blue-600 dark:text-blue-300">{safeRender(card.synonyms)}</span></div>}

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiStory && <button onClick={e => {
            e.stopPropagation();
            generateStory();
          }} disabled={loadingAi} className="flex-1 bg-orange-50 text-orange-600 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Lightbulb className="w-5 h-5" /> {t.storyBtn}</>}</button>}
          {!cardImage && <button onClick={e => {
            e.stopPropagation();
            generateImage();
          }} disabled={loadingImage} className="flex-1 bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /> {t.imgBtn}</>}</button>}
        </div>

        {aiStory && <div className={`bg-gray-50 dark:bg-[#1a1a1e] border-${_resolveTranslation(lang, 'r', 'l')}-4 border-orange-500 p-5 rounded-2xl w-full ${_resolveTranslation(lang, 'text-right', 'text-left')} mt-4`} onClick={e => e.stopPropagation()}><div className="prose prose-orange dark:prose-invert max-w-none text-gray-800 dark:text-gray-300 text-sm" style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(aiStory)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[#1a1a1e] rounded-2xl flex flex-col items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-blue-400 mb-2 animate-bounce" /><span className="text-sm text-blue-600 font-bold">{t.loading}</span></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg relative bg-gray-50 dark:bg-[#1a1a1e]" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => {
          e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found';
        }} /></div>}
      </div>}
    </div>}

    {showMeaning && card && vocabMode !== 'lists' && <div className="grid grid-cols-4 gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-[#2a1717] text-red-600 border border-red-200 py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center">{t.rateAgain} <span className="text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[#2a1f15] text-orange-600 border border-orange-200 py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center">{t.rateHard} <span className="text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[#152a1d] text-green-600 border border-green-200 py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center">{t.rateGood} <span className="text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-blue-50 dark:bg-[#15202a] text-blue-600 border border-blue-200 py-3 rounded-2xl font-bold hover:bg-blue-100 flex flex-col items-center">{t.rateEasy} <span className="text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
    </div>}
  </div>;
}
function Grammar({
  AI_KEY,
  userLevel,
  lang
}) {
  const [openLevel, setOpenLevel] = useState(0);
  const [activeTopic, setActiveTopic] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const t = {
    title: _resolveTranslation(lang, 'القواعد الشاملة', 'Comprehensive Grammar'),
    subtitle: _resolveTranslation(lang, '(مع معلم الذكاء الاصطناعي)', '(AI Teacher)'),
    desc: _resolveTranslation(lang, 'مرتبة منهجياً من مستوى A1 إلى C1. اضغط على أي قاعدة ليقوم الذكاء الاصطناعي بشرحها لك.', 'Structured from A1 to C1. Click any rule for an AI-generated explanation.'),
    explainBtn: _resolveTranslation(lang, 'اشرح لي بالذكاء الاصطناعي', 'Explain with AI'),
    loading: _resolveTranslation(lang, 'جاري توليد الشرح والأمثلة...', 'Generating explanation and examples...'),
    error: _resolveTranslation(lang, 'عذراً، حدث خطأ.', 'Error generating response.')
  };
  const handleExplain = async (topic, levelStr) => {
    if (activeTopic === topic) return;
    setActiveTopic(topic);
    setExplanation("");
    setLoading(true);
    try {
      const prompt = `You are an expert English grammar teacher. Explain the grammar rule: "${topic}" for a ${levelStr} level student.
      The explanation MUST be in ${_resolveTranslation(lang, 'Arabic', 'English')}. Keep it clear, simple, and provide 3 distinct examples in English with their translation in ${_resolveTranslation(lang, 'Arabic', 'English')}.`;
      const responseText = await fetchFromGemini(prompt, AI_KEY);
      const errJson = parseGeminiJSON(responseText);
      if (errJson && errJson.error) {
        setExplanation(errJson.error);
      } else {
        setExplanation(responseText);
      }
    } catch (err) {
      setExplanation(t.error);
    } finally {
      setLoading(false);
    }
  };
  return <div className="max-w-4xl mx-auto animate-fadeIn">
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">{t.title}</h2>
      <p className="text-gray-600 dark:text-gray-400">{t.desc}</p>
    </div>
    <div className="space-y-4">
      {GRAMMAR_LEVELS.map((level, idx) => <div key={idx} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
        <button onClick={() => {
          setOpenLevel(openLevel === idx ? -1 : idx);
          setActiveTopic(null);
        }} className={`w-full px-8 py-6 flex justify-between items-center text-xl font-bold transition-colors ${openLevel === idx ? 'bg-gray-50 dark:bg-[#1a1a1e] text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1a1a1e] hover:text-blue-600 dark:hover:text-blue-400'}`} dir="ltr">
          <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${openLevel === idx ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}`}></div>{level.level}</div>
          <ChevronRight className={`w-6 h-6 transition-transform ${openLevel === idx ? 'rotate-90 text-blue-500' : 'text-gray-400'}`} />
        </button>
        <div className={`transition-all duration-500 overflow-hidden ${openLevel === idx ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-8 bg-white dark:bg-[#121214] border-t border-gray-200 dark:border-gray-800 space-y-4">
            {level.topics.map((topic, tidx) => {
              const isActive = activeTopic === topic;
              return <div key={tidx} className={`rounded-xl border overflow-hidden transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500/40' : 'bg-gray-50 dark:bg-[#1a1a1e] border-gray-200 dark:border-gray-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-500/30'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-3 text-lg" dir="ltr">
                    <span className={`font-semibold transition-colors ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{topic}</span>
                  </div>
                  <button onClick={() => handleExplain(topic, level.level)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800' : 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:bg-blue-700 active:text-white'}`}>
                    <Sparkles className="w-4 h-4" /> {t.explainBtn}
                  </button>
                </div>
                {isActive && <div className="bg-white dark:bg-[#0e0e11] border-t border-blue-200 dark:border-blue-500/30 p-6 text-gray-800 dark:text-gray-100">
                  {loading ? <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400"><Activity className="w-5 h-5 animate-spin" /> {t.loading}</div> : <div style={{
                    whiteSpace: 'pre-wrap'
                  }}>{safeRender(explanation)}</div>}
                </div>}
              </div>;
            })}
          </div>
        </div>
      </div>)}
    </div>
  </div>;
}
function ListeningReading({
  type,
  AI_KEY,
  userLevel,
  lang
}) {
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const getDynamicTitle = () => {
    const isBeginner = userLevel === 'A1' || userLevel === 'A2';
    const isInter = userLevel === 'B1' || userLevel === 'B2';

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
    const isBeginner = userLevel === 'A1' || userLevel === 'A2';
    const isInter = userLevel === 'B1' || userLevel === 'B2';

    if (lang === 'ar') {
      const focus = isBeginner ? 'النصوص البسيطة والأساسية' : isInter ? 'النصوص المتوسطة' : 'النصوص المعقدة';
      return `بما أن مستواك ${userLevel}، سنركز على ${focus}.`;
    }

    if (lang === 'es') return `Dado que tu nivel es ${userLevel}, nos enfocaremos en textos ${isBeginner ? 'sencillos' : isInter ? 'intermedios' : 'complejos'}.`;
    if (lang === 'fr') return `Étant donné que votre niveau est ${userLevel}, nous nous concentrons sur des textes ${isBeginner ? 'simples' : isInter ? 'intermédiaires' : 'complexes'}.`;
    if (lang === 'de') return `Da dein Level ${userLevel} ist, konzentrieren wir uns auf ${isBeginner ? 'einfache' : isInter ? 'mittelschwere' : 'komplexe'} Texte.`;
    if (lang === 'zh') return `由于您的水平是 ${userLevel}，我们将专注于${isBeginner ? '简单' : isInter ? '中级' : '复杂'}文本。`;
    if (lang === 'ja') return `あなたのレベルは ${userLevel} なので、${isBeginner ? '簡単' : isInter ? '中級' : '複雑'}なテキストに焦点を当てます。`;

    const focusEn = isBeginner ? 'simple texts' : isInter ? 'intermediate texts' : 'complex texts';
    return `Since your level is ${userLevel}, we focus on ${focusEn}.`;
  };

  const t = {
    title: getDynamicTitle(),
    desc: getDynamicDesc(),
    btn: _resolveTranslation(lang, 'ولّد نصاً جديداً', 'Generate New Text')
  };
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const prompt = `Write a 150-word interesting story/text for a ${userLevel} level student. Topic: Global challenges. Language: English. Include a short vocabulary list with ${_resolveTranslation(lang, 'Arabic', 'simple English')} meanings.`;
      const response = await fetchFromGemini(prompt, AI_KEY);
      const errJson = parseGeminiJSON(response);
      if (errJson && errJson.error) {
        setStory(errJson.error);
      } else {
        setStory(response);
      }
    } catch (e) {
      setStory("Error generating content.");
    }
    setLoading(false);
  };
  const listeningLinks = [{
    level: _resolveTranslation(lang, "مبتدئ (A1-A2)", "Beginner (A1-A2)"),
    name: "Spotlight English podcast",
    url: "https://spotlightenglish.com/"
  }, {
    level: _resolveTranslation(lang, "تحت المتوسط (B1)", "Pre-Intermediate (B1)"),
    name: "The LevelUp English Podcast",
    url: "https://www.levelupenglish.school/podcast/"
  }, {
    level: _resolveTranslation(lang, "تحت المتوسط (B1)", "Pre-Intermediate (B1)"),
    name: "British Council",
    url: "https://learnenglish.britishcouncil.org/general-english/audio-series/podcasts"
  }, {
    level: _resolveTranslation(lang, "متوسط (B1-B2)", "Intermediate (B1-B2)"),
    name: "Luke’s English Podcast",
    url: "https://teacherluke.co.uk/archive-of-episodes-1-149/"
  }, {
    level: _resolveTranslation(lang, "متوسط (B1-B2)", "Intermediate (B1-B2)"),
    name: "All ears English Podcast",
    url: "https://www.allearsenglish.com/"
  }, {
    level: _resolveTranslation(lang, "فوق المتوسط (B2)", "Upper-Intermediate (B2)"),
    name: "Ted talks",
    url: "https://youtube.com/@TED?si=8y1RTw0ImlDO7By9"
  }, {
    level: _resolveTranslation(lang, "فوق المتوسط (B2)", "Upper-Intermediate (B2)"),
    name: "BBC sounds",
    url: "https://www.bbc.co.uk/sounds/podcasts"
  }, {
    level: _resolveTranslation(lang, "متقدم (C1-C2)", "Advanced (C1-C2)"),
    name: "This American life",
    url: "https://www.thisamericanlife.org/archive"
  }];
  const readingLinks = [{
    level: "Level 1",
    name: "The Adventures of Tom Sawyer",
    url: "#"
  }, {
    level: "Level 2",
    name: "Sherlock Holmes Short Stories",
    url: "#"
  }, {
    level: "Level 3",
    name: "The Call of the Wild",
    url: "#"
  }];
  const currentLinks = type === 'listening' ? listeningLinks : readingLinks;
  const contentSteps = type === 'listening' ? [_resolveTranslation(lang, "اسمع بودكاست بدلاً من الأفلام أو الأغاني (لأن التركيز يكون على الصوت فقط).", "Listen to podcasts instead of movies or songs."), _resolveTranslation(lang, "لا تترجم ولا تقرأ النص أثناء الاستماع لتعويد الأذن.", "Do not translate or read transcripts while listening."), _resolveTranslation(lang, "اسمع المقطع مرة واحدة فقط لتجنب الملل.", "Listen to the track only once to avoid boredom."), _resolveTranslation(lang, "اختار مصدر تكون نسبة فهمك له 30%-50% للتطور السريع.", "Choose a source where you understand 30%-50%.")] : [_resolveTranslation(lang, "اقرأ قصص وروايات مبسطة (Graded Readers).", "Read simplified graded readers."), _resolveTranslation(lang, "اقرأ بدون ترجمة فورية لتعويد العقل على سرعة ربط المعنى.", "Read without immediate translation."), _resolveTranslation(lang, "يجب أن تكون نسبة فهمك للقصة 30%-50%.", "You should understand 30%-50% of the story.")];
  return <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
    <div className="bg-white dark:bg-[#121214] p-10 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl transition-colors">
      <div className="text-center md:text-start flex-1">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{t.title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t.desc}</p>
      </div>
      {type === 'reading' && <button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition whitespace-nowrap">
        {loading ? <Activity className="animate-spin w-5 h-5" /> : <><Sparkles className="w-5 h-5" /> {t.btn}</>}
      </button>}
    </div>

    {story && type === 'reading' && <div className="bg-gray-50 dark:bg-[#1a1a1e] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 text-lg leading-loose font-medium text-gray-800 dark:text-gray-200 shadow-inner" dir="ltr" style={{
      whiteSpace: 'pre-wrap'
    }}>
      {safeRender(story)}
    </div>}

    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      <div className="md:col-span-3 bg-white dark:bg-[#121214] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl transition-colors">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">{_resolveTranslation(lang, 'القواعد الذهبية', 'Golden Rules')}</h3>
        <ul className="space-y-6">
          {contentSteps.map((step, idx) => <li key={idx} className="flex items-start gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold`}>
              {idx + 1}
            </div>
            <span className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{step}</span>
          </li>)}
        </ul>
      </div>

      <div className="md:col-span-2 bg-white dark:bg-[#121214] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl transition-colors">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">{_resolveTranslation(lang, 'المصادر', 'Sources')}</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {currentLinks.map((link, idx) => <div key={idx} className="bg-gray-50 dark:bg-[#1a1a1e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 transition-colors shadow-sm">
            <div className="text-left mb-3" dir="ltr">
              <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{link.name}</p>
              <span className="inline-block mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 py-1 rounded">{link.level}</span>
            </div>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl text-sm font-bold transition-colors">
              {_resolveTranslation(lang, 'تصفح المصدر', 'Visit Source')}
            </a>
          </div>)}
        </div>
      </div>
    </div>

  </div>;
}
function Writing({
  AI_KEY,
  lang,
  writingHistory,
  setWritingHistory
}) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const t = {
    title: _resolveTranslation(lang, 'مصحح الكتابة المتقدم', 'Advanced AI Corrector'),
    placeholder: _resolveTranslation(lang, "اكتب مقالاً قصيراً هنا (مثلاً عن طموحاتك)...", "Write a short essay here..."),
    btn: _resolveTranslation(lang, "تحليل وتصحيح النص ✨", "Analyze & Correct Text ✨"),
    corrected: _resolveTranslation(lang, "النص المصحح", "Corrected Text"),
    explanation: _resolveTranslation(lang, "الشرح:", "Explanation:"),
    history: _resolveTranslation(lang, "السجل", "History"),
    emptyHistory: _resolveTranslation(lang, "لا يوجد سجل بعد.", "No history yet.")
  };
  const handleCorrect = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const prompt = `Correct this English text and provide a review. Respond strictly in JSON format: { "corrected_text": "...", "explanation": "Explanation in ${_resolveTranslation(lang, 'Arabic', 'English')}", "score": "X/10" }. Text: "${text}"`;
      const raw = await fetchFromGemini(prompt, AI_KEY);
      const json = parseGeminiJSON(raw);
      if (json && json.error) {
        setFeedback({
          error: json.error
        });
      } else {
        const safeRaw = raw || "";
        const nextFeedback = json || {
          corrected_text: cleanFallbackText(safeRaw),
          explanation: _resolveTranslation(lang, "مشكلة في التنسيق.", "Formatting issue."),
          score: ""
        };
        setFeedback(nextFeedback);
        setWritingHistory(prev => [{
          id: Date.now(),
          input: text,
          output: nextFeedback.corrected_text || '',
          explanation: nextFeedback.explanation || '',
          score: nextFeedback.score || '',
          createdAt: new Date().toISOString()
        }, ...prev].slice(0, 25));
      }
    } catch (e) {
      setFeedback({
        error: _resolveTranslation(lang, "خطأ في الاتصال بالذكاء الاصطناعي.", "Error connecting to AI.")
      });
    }
    setLoading(false);
  };
  const startNewWriting = () => {
    if (text.trim() || feedback) {
      setWritingHistory(prev => [{
        id: Date.now(),
        input: text,
        output: feedback?.corrected_text || '',
        explanation: feedback?.explanation || '',
        score: feedback?.score || '',
        createdAt: new Date().toISOString()
      }, ...prev].slice(0, 25));
    }
    setText('');
    setFeedback(null);
  };
  return <div className="max-w-4xl mx-auto animate-fadeIn">
    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-10 text-center flex items-center justify-center gap-3"><PenTool className="text-purple-500 dark:text-purple-400" /> {t.title}</h2>
    <div className="flex justify-end mb-4">
      <button onClick={() => setShowHistory(v => !v)} className="text-sm font-bold px-4 py-2 rounded-xl bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
        {t.history}
      </button>
    </div>
    {showHistory && <div className="mb-6 bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-lg">
      {writingHistory.length === 0 ? <p className="text-gray-500 dark:text-gray-400">{t.emptyHistory}</p> : writingHistory.map(item => <div key={item.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500 mb-2">{new Date(item.createdAt).toLocaleString()}</p>
        <p className="text-sm text-gray-900 dark:text-white mb-2" dir="ltr">{safeRender(item.input)}</p>
        <p className="text-sm text-purple-600 dark:text-purple-400 font-bold" dir="ltr">{safeRender(item.output)}</p>
      </div>)}
    </div>}
    <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t.placeholder} className="w-full h-64 bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-purple-500 transition-all mb-6 shadow-xl" dir="ltr"></textarea>
    <div className="flex gap-3">
      <button onClick={startNewWriting} className="flex-1 bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-extrabold py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all">
        New Writing
      </button>
      <button onClick={handleCorrect} disabled={loading || !text.trim()} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-extrabold py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
        {loading ? <Activity className="animate-spin w-6 h-6 mx-auto" /> : t.btn}
      </button>
    </div>

    {feedback && !feedback.error && <div className="mt-10 space-y-6 animate-fadeIn">
      <div className="bg-green-50 dark:bg-[#121214] p-8 rounded-3xl border border-green-200 dark:border-green-500/20 shadow-sm">
        <h3 className="text-green-700 dark:text-green-400 font-bold mb-4 flex justify-between items-center text-xl">{t.corrected} <span className="text-yellow-600 dark:text-yellow-400">{safeRender(feedback.score)}</span></h3>
        <p className="text-gray-900 dark:text-white text-xl leading-relaxed" dir="ltr">{safeRender(feedback.corrected_text)}</p>
      </div>
      {feedback.explanation && <div className="bg-white dark:bg-[#121214] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-blue-600 dark:text-blue-400 font-bold mb-2">{t.explanation}</h3>
        <p className="text-gray-700 dark:text-gray-400 leading-relaxed" style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(feedback.explanation)}</p>
      </div>}
    </div>}
    {feedback && feedback.error && <div className="mt-6 bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-center font-bold">
      {safeRender(feedback.error)}
    </div>}
  </div>;
}
function Speaking({
  AI_KEY,
  userLevel,
  lang,
  speakingHistory,
  setSpeakingHistory
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
    stopCall: _resolveTranslation(lang, 'إنهاء المكالمة', 'End Call')
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
  const [isRecording, setIsRecording] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const saveConversationToHistory = (conversation) => {
    const lastAiMessage = [...conversation].reverse().find(msg => msg.role === 'ai' && msg.text && msg.text !== t.welcome);
    const lastUserMessage = [...conversation].reverse().find(msg => msg.role === 'user');
    if (!lastAiMessage && !lastUserMessage) return;
    setSpeakingHistory(prev => [{
      id: Date.now(),
      mode: isCallMode ? 'call' : 'chat',
      topic,
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
  // Use ElevenLabs for natural AI voice — falls back to browser TTS if key not set.
  const speakText = async text => {
    await elevenLabsSpeak(text);
  };
  const handleSend = async (forcedText = null) => {
    const userMsg = forcedText || input;
    if (!userMsg.trim()) return;
    if (!forcedText) setInput('');
    const newMsgId = Date.now();
    const aiMsgId = newMsgId + 1;
    setMessages(prev => [...prev, { id: newMsgId, role: 'user', text: userMsg }]);
    setLoading(true);
    // Add a placeholder AI message immediately so the user sees it right away
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', streaming: true }]);
    try {
      const history = messages.slice(-2).map(m => `${m.role === 'ai' ? 'AI' : 'User'}: ${m.text}`).join('\n');
      const prompt = `Reply naturally and briefly as an English tutor. Level: ${chatLevel}. Topic: ${topic}. Style: ${formality}. Recent context: ${history}. User said: "${userMsg}". Respond strictly as JSON only: {"reply":"...","review":{"clarity":"...","grammar":"...","fluency":"...","native_way":"..."}}`;
      let accumulated = '';
      await streamFromAPI(prompt, (delta) => {
        accumulated += delta;
        setMessages(prev => prev.map(msg =>
          msg.id === aiMsgId ? { ...msg, text: accumulated } : msg
        ));
      });
      const parsed = parseGeminiJSON(accumulated);
      const replyText = parsed?.reply || cleanFallbackText(accumulated);
      const review = parsed?.review || null;
      setMessages(prev => {
        const updated = prev.map(msg => msg.id === aiMsgId ? {
          ...msg,
          text: replyText,
          streaming: false,
          review
        } : msg);
        if (forcedText) {
          return updated;
        }
        return updated.map(msg => msg.id === newMsgId ? {
          ...msg,
          review
        } : msg);
      });
      if ((isCallMode || autoRead) && replyText) speakText(replyText);
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
  const startNewConversation = async () => {
    setLoading(true);
    const currentConversation = [...messages];
    saveConversationToHistory(currentConversation);
    const aiMsgId = Date.now();
    setMessages([{ id: aiMsgId, role: 'ai', text: '', streaming: true }]);
    try {
      const prompt = `Start a short ${formality === 'formal' ? 'formal' : 'casual'} English conversation for a ${chatLevel} learner about "${topic}". Ask one natural, engaging question only. No intro text, just the question.`;
      let accumulated = '';
      await streamFromAPI(prompt, (delta) => {
        accumulated += delta;
        setMessages([{ id: aiMsgId, role: 'ai', text: accumulated, streaming: true }]);
      });
      setMessages([{ id: aiMsgId, role: 'ai', text: accumulated, streaming: false }]);
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
      const opener = `Let's talk about ${topic}. What interests you most about it?`;
      setMessages([{ id: Date.now(), role: 'ai', text: opener }]);
      if (autoRead) speakText(opener);
    }
  }, [topic]);
  const handleVoiceRecord = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(_resolveTranslation(lang, "متصفحك لا يدعم تسجيل الصوت. استخدم Chrome.", "Browser doesn't support voice. Use Chrome."));
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      if (isCallMode) {
        handleSend(transcript);
      } else {
        setInput(prev => prev + ' ' + transcript);
      }
    };
    recognition.onerror = () => {
      setIsRecording(false);
      if (!isCallMode) alert(_resolveTranslation(lang, "لم يتم التعرف على الصوت.", "Voice not recognized."));
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };
  const toggleCallMode = () => {
    setIsCallMode(!isCallMode);
    if (!isCallMode) {
      speakText("Call started. What would you like to talk about?");
    } else {
      // Stop any ElevenLabs audio and browser TTS
      cancelTTS();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
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
    return <div className="max-w-md mx-auto h-[80vh] flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-[2.25rem] p-6 shadow-2xl relative overflow-hidden animate-fadeIn transition-colors">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.10),transparent_35%)] pointer-events-none"></div>

      <div className="text-center mt-6 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-2">Venoxa AI</h2>
        <p className="text-blue-300 flex items-center justify-center gap-2 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> {t.callActive}
        </p>
        <p className="text-xs text-slate-400 mt-2">Level: {chatLevel} | {topic.split('(')[0]}</p>
      </div>

      <div className="relative flex items-center justify-center w-full my-10 z-10">
        <div className={`absolute w-52 h-52 rounded-full ${loading ? 'bg-blue-500/20 animate-ping' : isRecording ? 'bg-red-500/20 animate-ping' : 'bg-blue-500/10'}`}></div>
        <div className={`absolute w-36 h-36 rounded-full ${loading ? 'bg-blue-400/20 animate-pulse' : isRecording ? 'bg-red-400/20 animate-pulse' : 'bg-slate-700/60'}`}></div>
        <div className="w-24 h-24 rounded-full z-10 flex items-center justify-center bg-slate-900/90 border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
          {loading ? <Activity className="w-10 h-10 text-blue-400 animate-spin" /> : isRecording ? <Mic className="w-10 h-10 text-red-400 animate-pulse" /> : <Volume2 className="w-10 h-10 text-slate-300" />}
        </div>
      </div>

      <div className="w-full relative z-10 flex flex-col gap-6 items-center mb-8">
        <p className="text-slate-300 text-center text-sm min-h-8 font-medium">
          {loading ? t.thinking : isRecording ? t.micOn : t.tapMic}
        </p>
        <div className="flex items-center gap-6">
          <button onClick={handleVoiceRecord} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${isRecording ? 'bg-red-500 text-white ring-4 ring-red-500/20' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 ring-1 ring-white/10'}`}>
            <Mic className="w-6 h-6" />
          </button>
          <button onClick={toggleCallMode} title={t.stopCall} className="w-20 h-20 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.35)] transition-all">
            <PhoneOff className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>;
  }
  return <div className="max-w-5xl mx-auto h-[85vh] flex flex-col animate-fadeIn border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#09090b] transition-colors">
    <div className="bg-gray-50 dark:bg-[#121214] p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col lg:flex-row justify-between items-center gap-4 relative z-10 transition-colors">
      <div className="flex items-center gap-4 w-full lg:w-auto">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shrink-0">
          <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">{t.title}</h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <select value={chatLevel} onChange={e => setChatLevel(e.target.value)} className="bg-white dark:bg-[#1a1a1e] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-emerald-500 appearance-none shadow-sm">
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => <option key={lvl} value={lvl}>Level {lvl}</option>)}
        </select>
        <select value={topic} onChange={e => setTopic(e.target.value)} className="bg-white dark:bg-[#1a1a1e] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-emerald-500 appearance-none max-w-[150px] truncate shadow-sm">
          {SPEAKING_TOPICS.map(topicName => <option key={topicName} value={topicName}>{topicName}</option>)}
        </select>

        <button onClick={startNewConversation} disabled={loading} className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm">
          {loading ? <Activity className="w-4 h-4 animate-spin" /> : <><RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">{t.newChat}</span></>}
        </button>

        <button onClick={generateScenario} disabled={loadingScenario} className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm">
          {loadingScenario ? <Activity className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">{t.roleplay}</span></>}
        </button>

        <button onClick={toggleCallMode} className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm">
          <Phone className="w-4 h-4" /> <span className="hidden sm:inline">{t.callMode}</span>
        </button>
        <button onClick={() => setAutoRead(v => !v)} className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${autoRead ? 'bg-blue-600 text-white border-blue-500' : 'bg-white dark:bg-[#1a1a1e] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>
          {autoRead ? 'Auto-read On' : 'Auto-read Off'}
        </button>
        <button onClick={() => setShowHistory(v => !v)} className="px-3 py-2 rounded-lg text-sm font-bold transition-all border bg-white dark:bg-[#1a1a1e] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
          History
        </button>

        <div className="flex bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 shadow-sm overflow-hidden">
          <button
            onClick={() => setFormality('informal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${formality === 'informal' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-emerald-500'}`}
          >
            {_resolveTranslation(lang, 'غير رسمي', 'Informal')}
          </button>
          <button
            onClick={() => setFormality('formal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${formality === 'formal' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-blue-500'}`}
          >
            {_resolveTranslation(lang, 'رسمي', 'Formal')}
          </button>
        </div>
      </div>
    </div>

    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] scroll-smooth">
      {showHistory && <div className="mb-4 bg-white/90 dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-3xl p-4 shadow-lg">
        {speakingHistory.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No history yet.</p> : speakingHistory.map(item => <button key={item.id} onClick={() => setMessages(item.messages || [])} className="w-full text-left p-3 rounded-2xl border border-gray-200 dark:border-gray-800 mb-3 last:mb-0 bg-gray-50 dark:bg-[#1a1a1e]">
          <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
          <p className="font-bold text-gray-900 dark:text-white">{item.topic}</p>
        </button>)}
      </div>}
      {messages.map((msg, idx) => <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

        <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-2xl shadow-md relative text-center ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-br-none' : msg.role === 'system' ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 w-full text-center' : 'bg-gray-100 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`} dir="ltr">
          <p className="text-lg leading-relaxed">
            {safeRender(msg.text)}
            {msg.streaming && <span className="inline-block w-[2px] h-5 bg-emerald-500 ml-0.5 align-middle animate-pulse rounded-full" />}
          </p>

          {msg.role === 'ai' && !msg.streaming && <button onClick={() => speakText(msg.text)} className="mt-3 bg-white/50 dark:bg-gray-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/30">
            <Volume2 className="w-5 h-5" />
          </button>}
        </div>

        {msg.role === 'user' && msg.review && <div className="mt-2 max-w-[85%] md:max-w-[70%] bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg animate-fadeIn transition-colors text-center">
          <button onClick={() => setExpandedReviewId(expandedReviewId === msg.id ? null : msg.id)} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1a1e] hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors gap-2 text-center">
            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4" /> {t.corrected}</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${expandedReviewId === msg.id ? 'rotate-90' : ''}`} />
          </button>

          {expandedReviewId === msg.id && <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-[#1a1a1e] p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1 font-bold">{t.clarity}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{safeRender(msg.review.clarity)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a1a1e] p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1 font-bold">{t.grammar}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{safeRender(msg.review.grammar)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a1a1e] p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1 font-bold">{t.fluency}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{safeRender(msg.review.fluency)}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 dark:from-emerald-500/10 to-blue-50 dark:to-blue-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 relative shadow-sm text-center">
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center justify-center gap-2">
                <Target className="w-4 h-4" /> {t.native}
              </h4>
              <p className="text-lg text-gray-900 dark:text-white font-medium text-center" dir="ltr">"{safeRender(msg.review.native_way)}"</p>

              <div className="mt-4 flex gap-3 justify-center">
                <button onClick={() => speakText(safeRender(msg.review.native_way))} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 justify-center transition shadow-md">
                  <Play className="w-4 h-4" /> {t.listen}
                </button>
              </div>
            </div>
          </div>}
        </div>}
      </div>)}
      {loading && <div className="flex justify-start">
        <div className="bg-gray-100 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl rounded-bl-none flex items-center gap-3 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{
            animationDelay: '0.2s'
          }}></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{
            animationDelay: '0.4s'
          }}></div>
        </div>
      </div>}
      <div ref={chatEndRef} />
    </div>

    <div className="bg-gray-50 dark:bg-[#121214] p-5 border-t border-gray-200 dark:border-gray-800 relative z-10 transition-colors">
      <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1e] border border-gray-300 dark:border-gray-700 rounded-full p-2 focus-within:border-emerald-500/50 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all relative shadow-sm">

        <button onClick={handleVoiceRecord} className={`p-3.5 rounded-full transition-colors flex items-center justify-center ${isRecording ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 animate-pulse' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-emerald-600 dark:text-emerald-400'}`} title={isRecording ? "Stop Recording" : "Record Voice"}>
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {isRecording && <span className="absolute right-16 text-xs text-red-500 dark:text-red-400 font-bold animate-pulse">Listening...</span>}

        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={isRecording ? "" : t.placeholder} className="flex-1 bg-transparent border-none text-center text-gray-900 dark:text-white text-lg px-2 focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50" dir="ltr" disabled={isRecording} />
        <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="p-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white transition-colors disabled:opacity-50 shadow-md">
          <Send className="w-5 h-5 ml-[-2px]" />
        </button>
      </div>
    </div>
  </div>;
}

function Langeek({
  AI_KEY,
  userLevel,
  lang,
  langeekVocab,
  setLangeekVocab
}) {
  const [srsData, setSrsData] = useState(() => JSON.parse(localStorage.getItem('venoxa_langeek_srs_data')) || {});
  const [vocabMode, setVocabMode] = useState('browse');
  const [listTab, setListTab] = useState('hard');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 60000);
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
    time1m: _resolveTranslation(lang, '1 دقيقة', '1 min'),
    time10m: _resolveTranslation(lang, '10 دقائق', '10 mins'),
    time1d: _resolveTranslation(lang, '1 يوم', '1 day'),
    time4d: _resolveTranslation(lang, '4 أيام', '4 days')
  };
  const dueCards = useMemo(() => {
    const now = Date.now();
    return langeekVocab.filter(card => {
      const data = srsData[card.word];
      if (!data) return false;
      return data.nextReview <= now;
    });
  }, [langeekVocab, srsData, tick]);
  const hardWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'again' || srsData[w.word]?.rating === 'hard'), [langeekVocab, srsData]);
  const learningWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'good'), [langeekVocab, srsData]);
  const masteredWords = useMemo(() => langeekVocab.filter(w => srsData[w.word]?.rating === 'easy'), [langeekVocab, srsData]);
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
  useEffect(() => {
    if (vocabMode === 'browse' && filteredVocabList.length > 0 && activeWordIndex >= filteredVocabList.length) {
      setActiveWordIndex(0);
    }
  }, [filteredVocabList.length, activeWordIndex, vocabMode]);
  const handleRate = rating => {
    if (!card) return;
    const now = Date.now();
    let nextReview = now;
    if (rating === 'again') nextReview = now + 1 * 60 * 1000; else if (rating === 'hard') nextReview = now + 10 * 60 * 1000; else if (rating === 'good') nextReview = now + 24 * 60 * 60 * 1000; else if (rating === 'easy') nextReview = now + 4 * 24 * 60 * 60 * 1000;
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
  // Play a word's pronunciation using ElevenLabs (falls back to browser TTS)
  const playAudio = async (_accentCode, wordToPlay = card?.word) => {
    if (!wordToPlay) return;
    await elevenLabsSpeak(wordToPlay);
  };

  const generateStory = async () => {
    if (loadingAi || aiStory || !card) return;
    setLoadingAi(true);
    try {
      const prompt = `أنت معلم لغة إنجليزية مرح. قم بتأليف قصة قصيرة جداً ومضحكة (سطرين أو ثلاثة فقط) باللغة الإنجليزية تتضمن الكلمة "${card.word}" (والتي تعني: ${card.meaning}) لمساعدة طالب مستواه ${userLevel} على تذكرها بسهولة.
      بعد القصة الإنجليزية، أضف سطرين باللغة ${_resolveTranslation(lang, 'العربية', 'الإنجليزية')} تشرح فيهما كيف تم استخدام الكلمة في القصة.`;
      const responseText = await fetchFromGemini(prompt, AI_KEY);
      const errJson = parseGeminiJSON(responseText);
      if (errJson && errJson.error) {
        setAiStory(errJson.error);
      } else {
        setAiStory(responseText);
      }
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
      const briefPrompt = `In ONE short English sentence (max 18 words), describe a vivid, photorealistic single-scene image that clearly conveys the meaning of the English word "${card.word}" (which means: ${card.meaning || 'see context'}). Rules: describe one concrete visual scene with a clear subject and action, no text or letters in the image, no abstract concepts. Output ONLY the description sentence, nothing else.`;
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
        visual = `A photorealistic everyday scene that visually represents the English word "${card.word}" meaning "${card.meaning || ''}".`;
      }
      const finalPrompt = `${visual} Photorealistic, natural lighting, clean composition, ultra detailed, no text, no letters, no captions, no watermark.`;
      const seed = Math.floor(Math.random() * 1_000_000);
      // Use a free, no-key image service (no quota) so this works without a paid Imagen key.
      setCardImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=640&height=420&nologo=true&model=flux&seed=${seed}`);
    } catch (err) {
      console.error("Image generation error", err);
      const fallback = `Photorealistic image showing the meaning of the English word ${card.word} (${card.meaning || ''}), no text, no letters.`;
      setCardImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(fallback)}?width=640&height=420&nologo=true&model=flux`);
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
      const response = await fetchFromGemini(prompt, AI_KEY);
      const errJson = parseGeminiJSON(response);
      if (errJson && errJson.error) {
        setContextStory(errJson.error);
      } else {
        setContextStory(response);
      }
    } catch (e) {
      setContextStory(t.storyError);
    } finally {
      setLoadingContextStory(false);
    }
  };
  return <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
    <div className="flex flex-col sm:flex-row bg-white dark:bg-[#1a1a1e] p-1.5 rounded-xl w-full max-w-2xl mx-auto mb-8 border border-gray-200 dark:border-gray-800 shadow-lg transition-colors">
      <button onClick={() => {
        setVocabMode('browse');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'browse' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}><Search className="w-4 h-4" /> {t.browse}</button>
      <button onClick={() => {
        setVocabMode('review');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 relative ${vocabMode === 'review' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
        <Layers className="w-4 h-4" /> {t.review}
        {dueCards.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg">{dueCards.length}</span>}
      </button>
      <button onClick={() => {
        setVocabMode('lists');
        setShowMeaning(false);
        setCardImage(null);
        setAiStory('');
      }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${vocabMode === 'lists' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}><Archive className="w-4 h-4" /> {t.lists}</button>
    </div>

    {vocabMode === 'lists' && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl animate-fadeIn min-h-[500px] transition-colors">
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setListTab('hard')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'hard' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>{t.hard} ({hardWords.length})</button>
        <button onClick={() => setListTab('learning')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'learning' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>{t.learning} ({learningWords.length})</button>
        <button onClick={() => setListTab('mastered')} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${listTab === 'mastered' ? 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}>{t.mastered} ({masteredWords.length})</button>
      </div>

      {listTab === 'hard' && hardWords.length > 0 && <div className="mb-6">
        <button onClick={generateContextStory} disabled={loadingContextStory} className="w-full py-4 bg-orange-50 dark:bg-orange-600/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all shadow-sm">
          {loadingContextStory ? <Activity className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> ✨ {t.contextBtn}</>}
        </button>
        {contextStory && <div className={`mt-4 p-5 bg-gray-50 dark:bg-[#1a1a1e] rounded-2xl border border-gray-200 dark:border-gray-700 ${_resolveTranslation(lang, 'text-right', 'text-left')} prose prose-orange dark:prose-invert max-w-none`}><div style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(contextStory)}</div></div>}
      </div>}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {currentListView.length === 0 ? <div className="text-center text-gray-500 py-16 flex flex-col items-center"><Archive className="w-12 h-12 mb-4 opacity-20" /><p>{t.emptyLists}</p><p className="text-sm mt-2">{t.rateWordsMsg}</p></div> : currentListView.map(item => <div key={item.word} className="flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1e] p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-500 transition-colors group">
          <div className="text-left" dir="ltr">
            <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {safeRender(item.word)}
              <button onClick={() => playAudio('en-US', item.word)} className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"><Volume2 className="w-4 h-4" /></button>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{safeRender(item.meaning)}</p>
          </div>
          <button onClick={() => resetWordProgress(item.word)} className="p-2 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><RotateCcw className="w-5 h-5" /></button>
        </div>)}
      </div>
    </div>}

    {vocabMode === 'browse' && <>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t.smartCards}</h2><p className="text-sm text-gray-600 dark:text-gray-400">{t.totalWords} {langeekVocab.length}</p></div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          {uploadMessage && <span className="text-sm text-green-600 dark:text-green-400 font-bold animate-pulse">{safeRender(uploadMessage)}</span>}
          <label className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-500 dark:hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            <UploadCloud className="w-4 h-4" /> {t.uploadCSV}
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-[#121214] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg transition-colors">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2"><Search className="w-4 h-4 text-blue-500 dark:text-blue-400" /> {t.searchWord}</label>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-purple-500 dark:text-purple-400" /> {t.filterLevel}</label>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer">
            <option value="All">All Levels</option><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option><option value="C1">C1</option><option value="C2">C2</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-purple-500 dark:text-purple-400" /> {t.filterCategory}</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer">
            <option value="All">All Topics</option>
            {[...new Set(langeekVocab.map(v => v.category).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2"><List className="w-4 h-4 text-green-500 dark:text-green-400" /> {t.manualSelect} ({filteredVocabList.length})</label>
          <select value={safeIndex} onChange={e => {
            setActiveWordIndex(Number(e.target.value));
            setShowMeaning(false);
            setAiStory('');
            setCardImage(null);
          }} className="w-full bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors appearance-none cursor-pointer" dir="ltr">
            {filteredVocabList.length === 0 ? <option value={0}>{t.noWords}</option> : filteredVocabList.map((item, idx) => <option key={idx} value={idx}>{safeRender(item.word)}</option>)}
          </select>
        </div>
      </div>
    </>}

    {vocabMode === 'review' && !card && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center p-8 shadow-2xl text-center animate-fadeIn transition-colors">
      <div className="w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-200 dark:border-green-500/20"><CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400" /></div>
      <h3 className="text-3xl text-gray-900 dark:text-white font-bold mb-4">{t.reviewDone}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-lg">{t.reviewDoneMsg}</p>
      <button onClick={() => setVocabMode('browse')} className="mt-8 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/50 px-8 py-3 rounded-xl font-bold">{t.browseLearn}</button>
    </div>}

    {vocabMode === 'browse' && (filteredVocabList.length === 0 || !card) && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center p-8 shadow-lg text-center animate-fadeIn transition-colors">
      <Search className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
      <h3 className="text-xl text-gray-600 dark:text-gray-400 font-bold">{t.noMatch}</h3>
    </div>}

    {card && vocabMode !== 'lists' && <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer relative shadow-2xl hover:border-blue-300 transition-all duration-300 group animate-fadeIn" onClick={() => setShowMeaning(!showMeaning)}>
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-blue-50 dark:from-blue-900/5 to-transparent rounded-[2rem] pointer-events-none transition-colors"></div>
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
        <button onClick={e => {
          e.stopPropagation();
          playAudio('en-US');
        }} className="p-3 bg-gray-50 dark:bg-[#1a1a1e] rounded-xl text-blue-600 dark:text-blue-400 shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline">🇺🇸 US</span></button>
        <button onClick={e => {
          e.stopPropagation();
          playAudio('en-GB');
        }} className="p-3 bg-gray-50 dark:bg-[#1a1a1e] rounded-xl text-red-600 dark:text-red-400 shadow-sm flex items-center gap-2"><Volume2 className="w-5 h-5" /> <span className="text-xs font-bold uppercase hidden sm:inline">🇬🇧 UK</span></button>
      </div>
      <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
        <span className="bg-gray-50 dark:bg-[#1a1a1e] text-blue-600 dark:text-blue-400 border border-blue-200 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">{safeRender(card.level)}</span>
        {card.category && card.category !== 'All' && card.category !== 'General' && <span className="bg-purple-50 dark:bg-[#1a1a1e] text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{safeRender(card.category)}</span>}
        {card.type && <span className="bg-emerald-50 dark:bg-[#1a1a1e] text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">{safeRender(card.type)}</span>}
      </div>

      {!showMeaning ? <div className="text-center w-full">
        <h3 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6" dir="ltr">{safeRender(card.word)}</h3>
        <p className="text-gray-600 dark:text-gray-500 text-sm mt-8 animate-pulse bg-gray-100 dark:bg-gray-800/30 py-2 px-6 rounded-full inline-block border border-gray-200">{t.clickToShow}</p>
      </div> : <div className="text-center space-y-6 animate-fadeIn w-full flex flex-col items-center pt-24 px-4">
        <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-normal max-w-2xl">{safeRender(card.meaning)}</h3>
        {card.example && <div className="bg-gray-50 dark:bg-[#1a1a1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-800/50 mt-4 w-full relative"><p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 font-medium" dir="ltr">"{safeRender(card.example)}"</p></div>}
        {card.synonyms && <div className="w-full bg-gray-100 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 dark:text-gray-400" dir="ltr"><span className="font-bold text-gray-500 mr-2">{t.synonyms}</span> <span className="text-blue-600 dark:text-blue-300">{safeRender(card.synonyms)}</span></div>}

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
          {!aiStory && <button onClick={e => {
            e.stopPropagation();
            generateStory();
          }} disabled={loadingAi} className="flex-1 bg-orange-50 text-orange-600 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingAi ? <Activity className="w-5 h-5 animate-spin" /> : <><Lightbulb className="w-5 h-5" /> {t.storyBtn}</>}</button>}
          {!cardImage && <button onClick={e => {
            e.stopPropagation();
            generateImage();
          }} disabled={loadingImage} className="flex-1 bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2">{loadingImage ? <Activity className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /> {t.imgBtn}</>}</button>}
        </div>

        {aiStory && <div className={`bg-gray-50 dark:bg-[#1a1a1e] border-${_resolveTranslation(lang, 'r', 'l')}-4 border-orange-500 p-5 rounded-2xl w-full ${_resolveTranslation(lang, 'text-right', 'text-left')} mt-4`} onClick={e => e.stopPropagation()}><div className="prose prose-orange dark:prose-invert max-w-none text-gray-800 dark:text-gray-300 text-sm" style={{
          whiteSpace: 'pre-wrap'
        }}>{safeRender(aiStory)}</div></div>}
        {loadingImage && <div className="w-full h-48 bg-gray-50 dark:bg-[#1a1a1e] rounded-2xl flex flex-col items-center justify-center mt-4 animate-pulse"><ImageIcon className="w-8 h-8 text-blue-400 mb-2 animate-bounce" /><span className="text-sm text-blue-600 font-bold">{t.loading}</span></div>}
        {cardImage && !loadingImage && <div className="w-full mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg relative bg-gray-50 dark:bg-[#1a1a1e]" onClick={e => e.stopPropagation()}><img src={cardImage} alt={card?.word} className="w-full h-auto max-h-[350px] object-cover" onError={e => {
          e.target.src = 'https://placehold.co/600x400/1a1a1e/4b5563/png?text=Image+Not+Found';
        }} /></div>}
      </div>}
    </div>}

    {showMeaning && card && vocabMode !== 'lists' && <div className="grid grid-cols-4 gap-3 animate-fadeIn pt-4" onClick={e => e.stopPropagation()}>
      <button onClick={() => handleRate('again')} className="bg-red-50 dark:bg-[#2a1717] text-red-600 border border-red-200 py-3 rounded-2xl font-bold hover:bg-red-100 flex flex-col items-center">{t.rateAgain} <span className="text-xs font-normal opacity-70 mt-1">{t.time1m}</span></button>
      <button onClick={() => handleRate('hard')} className="bg-orange-50 dark:bg-[#2a1f15] text-orange-600 border border-orange-200 py-3 rounded-2xl font-bold hover:bg-orange-100 flex flex-col items-center">{t.rateHard} <span className="text-xs font-normal opacity-70 mt-1">{t.time10m}</span></button>
      <button onClick={() => handleRate('good')} className="bg-green-50 dark:bg-[#152a1d] text-green-600 border border-green-200 py-3 rounded-2xl font-bold hover:bg-green-100 flex flex-col items-center">{t.rateGood} <span className="text-xs font-normal opacity-70 mt-1">{t.time1d}</span></button>
      <button onClick={() => handleRate('easy')} className="bg-blue-50 dark:bg-[#15202a] text-blue-600 border border-blue-200 py-3 rounded-2xl font-bold hover:bg-blue-100 flex flex-col items-center">{t.rateEasy} <span className="text-xs font-normal opacity-70 mt-1">{t.time4d}</span></button>
    </div>}
  </div>;
}

