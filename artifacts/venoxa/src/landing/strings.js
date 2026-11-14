// src/landing/strings.js — every string on the landing page, both languages.
//
// Same pattern as the rest of the app (_resolveTranslation inline pairs), but
// centralised here because the landing has a lot of copy. Nothing on this page
// is rendered without going through landingCopy(lang).

export function landingCopy(lang) {
  const ar = lang === 'ar';
  const T = (a, e) => (ar ? a : e);

  return {
    isAr: ar,

    // ── chrome ────────────────────────────────────────────────────────────
    skip: T('تجاوز إلى المحتوى', 'Skip to content'),
    brand: 'Venoxa AI',
    login: T('تسجيل الدخول', 'Log in'),
    getStarted: T('ابدأ الآن', 'Get started'),
    haveAccount: T('لدي حساب بالفعل', 'I already have an account'),
    openApp: T('الدخول إلى التطبيق', 'Open the app'),
    langToggle: T('اختيار اللغة', 'Language'),
    themeToggle: T('تبديل المظهر', 'Toggle theme'),

    // ── hero ──────────────────────────────────────────────────────────────
    heroTitle: T('تعلّم الإنجليزية بطريقة بسيطة.', 'Learn English the simple way.'),
    heroSub: T(
      'مسار واضح من أول كلماتك حتى المحادثة بثقة. دروس قصيرة، وتدريب ذكي، ومعلّم بالذكاء الاصطناعي يساعدك على التحدث.',
      'A clear path from your first words to confident conversations. Short lessons, smart practice, and a friendly AI that helps you speak.'
    ),
    heroHello: T('مرحبًا!', 'Hello!'),
    heroStreak: T('سلسلة', 'Streak'),
    heroStartTag: T('ابدأ', 'Start'),

    // ── level strip ───────────────────────────────────────────────────────
    levels: [
      { code: 'A1', name: T('مبتدئ', 'Beginner') },
      { code: 'A2', name: T('أساسي', 'Elementary') },
      { code: 'B1', name: T('متوسط', 'Intermediate') },
      { code: 'B2', name: T('فوق المتوسط', 'Upper intermediate') },
      { code: 'C1', name: T('متقدم', 'Advanced') },
    ],
    levelsCaption: T(
      'ابدأ من مستواك. اختبر مستواك في دقائق أو ابدأ من A1.',
      'Start where you are. Take a quick level test or begin at A1.'
    ),

    // ── feature sections (order = page order) ─────────────────────────────
    features: [
      {
        id: 'path',
        eyebrow: T('مسارك', 'YOUR PATH'),
        title: T('مسار واحد واضح', 'One clear path'),
        body: T(
          'اعرف دائمًا ماذا تدرس بعد ذلك. دروس من A1 إلى C1 تُفتح واحدًا تلو الآخر، فلا تشعر بالضياع.',
          'Always know what to study next. Lessons from A1 to C1 unlock one after another, so you never feel lost.'
        ),
      },
      {
        id: 'words',
        eyebrow: T('المفردات', 'VOCABULARY'),
        title: T('كلمات تبقى معك', 'Words that stay with you'),
        body: T(
          'راجع الكلمات في الوقت المناسب بالتكرار المتباعد، وتعلّمها حسب الموضوع والمستوى.',
          'Review words at the right time with spaced repetition, and learn them by topic and level.'
        ),
      },
      {
        id: 'speaking',
        eyebrow: T('المحادثة', 'SPEAKING'),
        title: T('تحدث بثقة', 'Speak with confidence'),
        body: T(
          'تدرّب على المحادثة مع معلّم أو صديق أو متحدث أصلي بالذكاء الاصطناعي، واحصل على تصحيح لكتابتك، واستمع إلى النطق الأمريكي والبريطاني.',
          'Practise conversation with an AI teacher, friend or native speaker, get your writing corrected, and hear US and UK pronunciation.'
        ),
      },
      {
        id: 'skills',
        eyebrow: T('المهارات', 'SKILLS'),
        title: T('تدرّب على كل مهارة', 'Practise every skill'),
        body: T(
          'شرح للقواعد حسب مستواك، وتدريب على الاستماع والقراءة، واختبارات مصمّمة لك.',
          'Grammar explained for your level, listening and reading practice, and tests made just for you.'
        ),
      },
      {
        id: 'progress',
        eyebrow: T('التقدم', 'PROGRESS'),
        title: T('اعرف مستواك', 'Know your level'),
        body: T(
          'اختبار مستوى تكيّفي، وتابع تقدمك، واحصل على شهادة يمكنك تحميلها.',
          'Take an adaptive level test, track your progress, and earn a certificate you can download.'
        ),
      },
    ],

    // ── learn anywhere band ───────────────────────────────────────────────
    anywhereTitle: T('تعلّم في أي وقت ومن أي مكان', 'Learn anytime, anywhere'),
    anywhereBody: T(
      'يعمل مباشرة من المتصفح على هاتفك أو حاسوبك.',
      'Works right in your browser on your phone or computer.'
    ),

    // ── tools chips ───────────────────────────────────────────────────────
    toolsTitle: T('وأدوات مفيدة أخرى', 'And handy tools to help you'),
    tools: [
      { label: T('الترجمة الذكية', 'Smart Translation') },
      { label: T('إعادة صياغة النبرة', 'Tone Rewriter') },
      { label: T('محلّل الجمل', 'Sentence Diagrammer') },
      { label: T('عائلة الكلمة', 'Word Family') },
      { label: T('متلازمات الكلمات', 'Collocations') },
      { label: T('أصول الكلمات', 'Etymology') },
      { label: T('الأزواج الدنيا', 'Minimal Pairs') },
      { label: T('كلمة اليوم', 'Word of the Day') },
      { label: T('تعبير اليوم', 'Idiom of the Day') },
      { label: T('المؤقت', 'Focus Timer') },
    ],

    // ── final CTA ─────────────────────────────────────────────────────────
    ctaTitle: T('جاهز للبدء؟', 'Ready to start?'),

    // flashcard illustration words (decorative)
    flashWord: T('مرحبًا', 'Hello'),
  };
}
