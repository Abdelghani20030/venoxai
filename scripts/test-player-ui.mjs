import { chromium } from 'playwright';
import { PREVIEW_MAP } from '../artifacts/venoxa/src/devFixtures.js';

const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 1280, height: 820 } });
await c.addInitScript(({ fixture }) => {
  localStorage.setItem('venoxa_theme', 'light');
  localStorage.setItem('venoxa_lang', 'en');
  localStorage.setItem('venoxa_access_granted', 'VENOXA2003');
  localStorage.setItem('venoxa_path_cache_v1', JSON.stringify(fixture));
}, { fixture: PREVIEW_MAP });

const p = await c.newPage();
await p.route('**/api/path**', async (route) => {
  const url = route.request().url();
  if (url.includes('/lessons/')) {
    // Return sample lesson matching backend schema
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lesson: {
          id: '61335677-169b-47de-a95e-cdfeaeacd21a',
          level: 'A1',
          unit: 1,
          unitTitleEn: 'Getting started',
          unitTitleAr: 'البداية',
          position: 1,
          titleEn: 'Adjectives & Adverbs',
          titleAr: 'الصفات والأحوال',
          objectiveEn: 'Describe people and things with adjectives and adverbs, then compare them.',
          objectiveAr: 'صِف الأشخاص والأشياء بالصفات والأحوال، ثم قارن بينها.',
          kind: 'lesson',
          passScore: 70,
          activities: [
            {
              type: 'grammar',
              grammarRules: [
                'Adjectives vs adverbs: word formation & word order',
                'Comparative adjectives with -er and more',
                'Superlative adjectives with -est and the most'
              ]
            },
            {
              type: 'vocab',
              topic: 'Describing People & Things',
              category: 'adjectives',
              wordRange: [1, 20]
            },
            {
              type: 'listen',
              name: 'Spotlight English podcast',
              url: 'https://spotlightenglish.com/',
              sourceId: 'listen-spotlight'
            },
            {
              type: 'read',
              name: 'Project Gutenberg',
              url: 'https://www.gutenberg.org',
              sourceId: 'read-gutenberg'
            }
          ]
        },
        content: [
          {
            id: 'c1',
            step: 'learn',
            position: 0,
            explanationEn: 'Adjectives describe nouns: a quick learner. Adverbs describe verbs and usually end in -ly: She learns quickly. For short adjectives add -er and -est (quick → quicker → the quickest). For longer adjectives use more and the most.',
            explanationAr: 'الصفة تصف الاسم: متعلم سريع. والحال يصف الفعل وغالباً ينتهي بـ -ly: هي تتعلم بسرعة.',
            examples: [
              { en: 'She is a quick learner.', ar: 'هي متعلمة سريعة.' },
              { en: 'She learns quickly.', ar: 'هي تتعلم بسرعة.' },
              { en: 'This book is cheaper than that one.', ar: 'هذا الكتاب أرخص من ذاك.' },
              { en: 'This is the most interesting lesson.', ar: 'هذا هو الدرس الأكثر تشويقاً.' }
            ],
            notesEn: 'Good and well are irregular: good → better → the best.',
            notesAr: 'good وwell شاذتان: good ← better ← the best.'
          }
        ],
        exercises: [
          {
            id: 'e1',
            step: 'practice',
            type: 'multiple_choice',
            promptEn: 'She sings very ___.',
            promptAr: 'هي تغني بشكل ___ جداً.',
            options: ['good', 'well', 'goodly', 'better'],
            position: 0
          },
          {
            id: 'e2',
            step: 'check',
            type: 'fill_blank',
            promptEn: 'This is the ___ (comfortable) chair in the room.',
            promptAr: 'هذا هو الكرسي ___ (مريح) في الغرفة.',
            options: [],
            position: 1
          }
        ],
        completedSteps: [],
        optionalXp: 0,
        hasApprovedCheck: true,
        requiredStep: 'check',
        userProgress: { completed: false, bestScore: null }
      })
    });
    return;
  }

  // /api/path root
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(PREVIEW_MAP),
  });
});

await p.goto('http://127.0.0.1:3000/#/path', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.vx-current-card button', { timeout: 15000 });
// Click "Start lesson"
await p.click('.vx-current-card button');
await p.waitForSelector('.vx-player-grid', { timeout: 15000 });
await p.waitForTimeout(600);
await p.screenshot({ path: 'design-reference/actual/lesson-player-debug.png', fullPage: true });
console.log('Captured lesson-player-debug.png');
await b.close();
