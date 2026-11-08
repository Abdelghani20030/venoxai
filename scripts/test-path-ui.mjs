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
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(PREVIEW_MAP),
  });
});

await p.goto('http://127.0.0.1:3000/#/path', { waitUntil: 'networkidle' });
await p.waitForSelector('.vx-current-card', { timeout: 15000 });
await p.waitForTimeout(600);
await p.screenshot({ path: 'design-reference/actual/path-map-fixed.png', fullPage: false });
console.log('Captured path-map-fixed.png');
await b.close();
