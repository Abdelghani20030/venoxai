// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — shared curriculum sources
//
//  The exact sources already listed in the app's Listening, Reading and Writing
//  screens, with their CEFR level lists added so the Learning Path can rotate
//  them per lesson. No new sources are invented here.
// ─────────────────────────────────────────────────────────────────────────────

export const SPEAKING_TOPICS = [
  'محادثة حرة (Free Talk)',
  'السفر والمطارات (Travel & Airports)',
  'العمل والمقابلات (Work & Interviews)',
  'الهوايات والاهتمامات (Hobbies)',
  'الطعام والمطاعم (Food)',
  'التسوق (Shopping)',
  'الصحة واللياقة (Health & Fitness)',
  'التكنولوجيا الذكية (Technology)',
  'الرياضة (Sports)',
  'العائلة والأصدقاء (Family & Friends)',
  'التعليم والجامعة (Education)',
  'الترفيه والأفلام (Movies)',
  'الروتين اليومي (Daily Routine)',
  'خطط المستقبل (Future Plans)',
  'ذكريات الطفولة (Childhood)',
  'الثقافات والتقاليد (Cultures)',
  'البيئة والطبيعة (Environment)',
  'وسائل التواصل (Social Media)',
  'الكتب والأدب (Books)',
  'الأخبار والأحداث (News)',
  'الموضة والأزياء (Fashion)',
  'الفنون والموسيقى (Art & Music)',
  'العلوم والفضاء (Science)',
  'الأهداف والطموحات (Goals)',
  'وسائل النقل (Transportation)',
  'الحيوانات الأليفة (Pets)',
  'العطلات والمناسبات (Holidays)',
  'العلاقات الاجتماعية (Relationships)',
  'ريادة الأعمال (Entrepreneurship)',
  'التحديات والمصاعب (Challenges)',
];

export const LISTENING_SOURCES = [
  {
    id: 'listen-spotlight',
    name: 'Spotlight English podcast',
    url: 'https://spotlightenglish.com/',
    band: 'Beginner (A1–A2)',
    levels: ['A1', 'A2'],
  },
  {
    id: 'listen-levelup',
    name: 'The LevelUp English Podcast',
    url: 'https://www.levelupenglish.school/podcast/',
    band: 'Pre-Intermediate (B1)',
    levels: ['B1'],
  },
  {
    id: 'listen-british-council',
    name: 'British Council',
    url: 'https://learnenglish.britishcouncil.org/general-english/audio-series/podcasts',
    band: 'Pre-Intermediate (B1)',
    levels: ['B1'],
  },
  {
    id: 'listen-lukes',
    name: "Luke's English Podcast",
    url: 'https://teacherluke.co.uk/archive-of-episodes-1-149/',
    band: 'Intermediate (B1–B2)',
    levels: ['B1', 'B2'],
  },
  {
    id: 'listen-all-ears',
    name: 'All Ears English Podcast',
    url: 'https://www.allearsenglish.com/',
    band: 'Intermediate (B1–B2)',
    levels: ['B1', 'B2'],
  },
  {
    id: 'listen-ted',
    name: 'TED Talks',
    url: 'https://youtube.com/@TED?si=8y1RTw0ImlDO7By9',
    band: 'Upper-Intermediate (B2)',
    levels: ['B2', 'C1'],
  },
  {
    id: 'listen-bbc-sounds',
    name: 'BBC Sounds',
    url: 'https://www.bbc.co.uk/sounds/podcasts',
    band: 'Upper-Intermediate (B2)',
    levels: ['B2', 'C1'],
  },
  {
    id: 'listen-this-american-life',
    name: 'This American Life',
    url: 'https://www.thisamericanlife.org/archive',
    band: 'Advanced (C1–C2)',
    levels: ['C1'],
  },
];

export const READING_SOURCES = [
  {
    id: 'read-gutenberg',
    name: 'Project Gutenberg',
    url: 'https://www.gutenberg.org',
    band: 'Beginner – Intermediate',
    levels: ['A1', 'A2', 'B1', 'B2'],
  },
  {
    id: 'read-eslfast',
    name: 'ESL Fast',
    url: 'https://www.eslfast.com',
    band: 'Beginner – Intermediate',
    levels: ['A1', 'A2', 'B1', 'B2'],
  },
  {
    id: 'read-storynory',
    name: 'Storynory',
    url: 'https://www.storynory.com',
    band: 'Beginner – Intermediate',
    levels: ['A1', 'A2', 'B1', 'B2'],
  },
  {
    id: 'read-manythings',
    name: 'ManyThings.org',
    url: 'https://www.manythings.org',
    band: 'Beginner – Intermediate',
    levels: ['A1', 'A2', 'B1', 'B2'],
  },
  {
    id: 'read-medium',
    name: 'Medium',
    url: 'https://medium.com',
    band: 'Advanced',
    levels: ['B2', 'C1'],
  },
  {
    id: 'read-bbc-news',
    name: 'BBC News',
    url: 'https://www.bbc.com/news',
    band: 'Advanced',
    levels: ['B2', 'C1'],
  },
  {
    id: 'read-nyt',
    name: 'The New York Times',
    url: 'https://www.nytimes.com',
    band: 'Advanced',
    levels: ['B2', 'C1'],
  },
];

/** Split "العربية (English)" entries into the two languages. */
export function splitTopic(topic) {
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(topic);
  if (!match) return { ar: topic, en: topic };
  return { ar: match[1].trim(), en: match[2].trim() };
}

export function sourcesForLevel(sources, level) {
  return sources.filter((source) => source.levels.includes(level));
}
