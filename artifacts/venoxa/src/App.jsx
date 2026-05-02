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
                newDate.setHours(0,0,0,0);
                minDate.setHours(0,0,0,0);
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
            const fetchFromGemini = async (prompt, _apiKey) => {
              const url = `${import.meta.env.BASE_URL}api/chat`;
              let retries = 3;
              let delays = [1000, 2000, 4000];
              for (let i = 0; i <= retries; i++) {
                try {
                  const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      prompt
                    })
                  });
                  if (!response.ok) {
                    if (response.status === 400 || response.status === 401 || response.status === 403) {
                      return '{"error": "Backend rejected the request. Please check the server configuration."}';
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  const data = await response.json();
                  return data.text || '{"error": "No response generated."}';
                } catch (error) {
                  if (i === retries) {
                    return '{"error": "Connection failed. Please check your network."}';
                  }
                  await new Promise(res => setTimeout(res, delays[i]));
                }
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
              useEffect(() => localStorage.setItem('venoxa_langeek_vocab', JSON.stringify(langeekVocab)), [langeekVocab]);
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
                    return <Writing {...props} />;
                  case 'speaking':
                    return <Speaking {...props} />;
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
                totalInvestPlaceholder: _resolveTranslation(lang, 'مثلاً: 60 دقيقة', 'e.g. 60 min'),
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
                  cellBg