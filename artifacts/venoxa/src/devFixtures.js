// ─────────────────────────────────────────────────────────────────────────────
//  Dev-only fixtures for #/dev/preview. Never imported by production screens.
//  Shapes mirror GET /api/path exactly so the real components render unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const lesson = (position, unit, en, ar, kind, status, extra = {}) => ({
  slug: `a1-lesson-${position}`,
  position,
  titleEn: en,
  titleAr: ar,
  objectiveEn: extra.objectiveEn || '',
  objectiveAr: extra.objectiveAr || '',
  kind,
  steps: extra.steps || [],
  passScore: 80,
  status,
  bestScore: extra.bestScore ?? null,
  attempts: extra.bestScore ? 1 : 0,
  current: status === 'current',
});

const unit = (n, titleEn, titleAr, lessons) => ({
  unit: n,
  titleEn,
  titleAr,
  published: lessons.length,
  completed: lessons.filter((l) => l.status === 'completed').length,
  lessons,
});

const unit1 = unit(1, 'Getting started', 'البداية', [
  lesson(1, 1, 'Alphabet & sounds', 'الحروف والأصوات', 'vocabulary', 'completed', { bestScore: 88, steps: ['pronunciation', 'vocab'] }),
  lesson(2, 1, 'Subject pronouns', 'ضمائر الفاعل', 'grammar', 'completed', { bestScore: 100, steps: ['grammar', 'practice'] }),
  lesson(3, 1, 'The verb TO BE', 'فعل TO BE', 'grammar', 'completed', { bestScore: 92, steps: ['grammar', 'practice'] }),
  lesson(4, 1, 'Introducing yourself', 'التعريف بنفسك', 'grammar', 'current', {
    objectiveEn: 'Say who you are and where you are from, using subject pronouns and TO BE.',
    objectiveAr: 'قل من أنت ومن أين أنت، باستخدام ضمائر الفاعل وفعل TO BE.',
    steps: ['grammar', 'vocab', 'listening', 'check'],
  }),
  lesson(5, 1, 'Unit 1 recap', 'مراجعة الوحدة 1', 'revision', 'unlocked', { steps: ['practice', 'check'] }),
]);

const unit2 = unit(2, 'Things around you', 'أشياء من حولك', [
  lesson(6, 2, 'Articles: a / an / the', 'أدوات التعريف a / an / the', 'grammar', 'locked'),
  lesson(7, 2, 'Singular & plural nouns', 'المفرد والجمع', 'grammar', 'locked'),
  lesson(8, 2, 'This / that / these / those', 'هذا / ذلك / هؤلاء / أولئك', 'grammar', 'locked'),
  lesson(9, 2, 'Numbers & counting', 'الأرقام والعد', 'vocabulary', 'locked'),
  lesson(10, 2, 'At the café', 'في المقهى', 'listening', 'locked'),
]);

const unit3 = unit(3, 'Everyday life', 'الحياة اليومية', [
  lesson(11, 3, 'Family & friends', 'العائلة والأصدقاء', 'vocabulary', 'locked'),
  lesson(12, 3, 'Possessives', 'أدوات الملكية', 'grammar', 'locked'),
  lesson(13, 3, 'Daily routine', 'الروتين اليومي', 'grammar', 'locked'),
  lesson(14, 3, 'Telling the time', 'قراءة الوقت', 'vocabulary', 'locked'),
  lesson(15, 3, 'Unit 2 recap', 'مراجعة الوحدة 2', 'revision', 'locked'),
]);

const unit4 = unit(4, 'Out and about', 'في الخارج', [
  lesson(16, 4, 'Countries & nationalities', 'البلدان والجنسيات', 'vocabulary', 'locked'),
  lesson(17, 4, 'Prepositions of place', 'حروف المكان', 'grammar', 'locked'),
  lesson(18, 4, 'Directions', 'الاتجاهات', 'listening', 'locked'),
  lesson(19, 4, 'Shopping', 'التسوق', 'vocabulary', 'locked'),
  lesson(20, 4, 'Unit 3 recap', 'مراجعة الوحدة 3', 'revision', 'locked'),
]);

const a1Units = [unit1, unit2, unit3, unit4];

export const PREVIEW_USER = { username: 'Amina', email: 'amina@example.com' };

export const PREVIEW_MAP = {
  user: { id: 'preview-user' },
  placement: { level: 'A1', source: 'start' },
  progress: { completedLessons: 3, publishedLessons: 20 },
  currentLesson: {
    slug: 'a1-lesson-4',
    titleEn: 'Introducing yourself',
    titleAr: 'التعريف بنفسك',
    objectiveEn: 'Say who you are and where you are from, using subject pronouns and TO BE.',
    objectiveAr: 'قل من أنت ومن أين أنت، باستخدام ضمائر الفاعل وفعل TO BE.',
    level: 'A1',
    kind: 'grammar',
    steps: ['grammar', 'vocab', 'listening', 'check'],
    unit: 1,
    unitTitleEn: 'Getting started',
    unitTitleAr: 'البداية',
    position: 4,
    passScore: 80,
  },
  nextLesson: { slug: 'a1-lesson-5', titleEn: 'Unit 1 recap', titleAr: 'مراجعة الوحدة 1' },
  lastTest: null,
  levels: [
    { level: 'A1', published: 20, completed: 3, comingSoon: 0, percent: 15, units: a1Units },
    { level: 'A2', published: 0, completed: 0, comingSoon: 20, percent: 0, units: [] },
    { level: 'B1', published: 0, completed: 0, comingSoon: 20, percent: 0, units: [] },
    { level: 'B2', published: 0, completed: 0, comingSoon: 20, percent: 0, units: [] },
    { level: 'C1', published: 0, completed: 0, comingSoon: 20, percent: 0, units: [] },
  ],
};

export const PREVIEW_STATS = {
  streak: 4,
  wordsLearned: 36,
  dueWords: 12,
  xp: 180,
};
