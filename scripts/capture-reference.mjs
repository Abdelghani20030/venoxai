// ─────────────────────────────────────────────────────────────────────────────
//  Visual acceptance capture — Dashboard + Learning Path.
//  Usage: node scripts/capture-reference.mjs
//  Requires the Vite frontend on :3000 (pnpm --filter @workspace/venoxa dev).
//  GET /api/path is answered with the dev fixture so screenshots never depend
//  on Supabase being migrated.
// ─────────────────────────────────────────────────────────────────────────────
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PREVIEW_MAP } from '../artifacts/venoxa/src/devFixtures.js';

const BASE = process.env.VX_BASE || 'http://127.0.0.1:3000';
const OUT = path.resolve('design-reference/actual');

const screens = [
  { id: 'dashboard', hash: '', ready: '.vx-hero' },
  { id: 'path', hash: '#/path', ready: '.vx-current-card' },
];

const viewports = [
  { name: '1280', width: 1280, height: 820 },
  { name: '390', width: 390, height: 844 },
];

const modes = [
  { theme: 'light', lang: 'en', suffix: 'light-ltr' },
  { theme: 'dark', lang: 'en', suffix: 'dark-ltr' },
  { theme: 'light', lang: 'ar', suffix: 'light-rtl' },
  { theme: 'dark', lang: 'ar', suffix: 'dark-rtl' },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });

for (const screen of screens) {
  for (const viewport of viewports) {
    for (const mode of modes) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme: mode.theme,
        locale: mode.lang === 'ar' ? 'ar-SA' : 'en-US',
      });

      await context.addInitScript(({ theme, lang, fixture }) => {
        localStorage.setItem('venoxa_theme', theme);
        localStorage.setItem('venoxa_lang', lang);
        localStorage.setItem('venoxa_path_cache_v1', JSON.stringify(fixture));
        localStorage.setItem('venoxa_access_granted', 'VENOXA2003');
        localStorage.setItem('venoxa_streak', JSON.stringify({ current: 4, lastDate: new Date().toISOString().slice(0, 10) }));
        localStorage.setItem('venoxa_usage_time', JSON.stringify({ today: 4800 }));
        localStorage.setItem('venoxa_daily_usage_secs', JSON.stringify({ today: 4800 }));
        const cells = {};
        for (let i = 0; i < 12; i += 1) cells[`preview-cell-${i}`] = 'done';
        localStorage.setItem('venoxa_completed_cells', JSON.stringify(cells));
        const due = ['about', 'above', 'across', 'action', 'add', 'afraid', 'again', 'agree', 'air', 'always', 'animal', 'answer'];
        const future = Array.from({ length: 24 }, (_, i) => `preview-word-${i}`);
        const srs = {};
        const past = Date.now() - 86400000;
        const futureDate = Date.now() + 86400000;
        due.forEach((word) => { srs[word] = { nextReview: past, interval: 1, ease: 2.5 }; });
        future.forEach((word) => { srs[word] = { nextReview: futureDate, interval: 4, ease: 2.5 }; });
        localStorage.setItem('venoxa_srs_data', JSON.stringify(srs));
        localStorage.setItem('venoxa_global_vocab', JSON.stringify([...due, ...future].map((word) => ({
          word, type: 'n.', level: 'A1', meaning: word, example: '', synonyms: '',
        }))));
      }, { theme: mode.theme, lang: mode.lang, fixture: PREVIEW_MAP });

      const page = await context.newPage();
      await page.route('**/api/path**', async (route) => {
        const req = route.request();
        if (req.method() === 'GET' && /\/api\/path\/?$/.test(new URL(req.url()).pathname)) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(PREVIEW_MAP),
          });
          return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      });

      await page.goto(`${BASE}/${screen.hash}`, { waitUntil: 'networkidle' });
      await page.waitForSelector(screen.ready, { timeout: 20000 });
      await page.evaluate(() => document.fonts?.ready);
      await page.waitForTimeout(450);

      const file = path.join(OUT, `${screen.id}-${viewport.name}-${mode.suffix}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`captured ${path.relative(process.cwd(), file)}`);
      await context.close();
    }
  }
}

await browser.close();
console.log('done');
