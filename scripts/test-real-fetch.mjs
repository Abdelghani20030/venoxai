import { chromium } from 'playwright';

const b = await chromium.launch({ channel: 'chrome', headless: true });
const c = await b.newContext({ viewport: { width: 1280, height: 820 } });
await c.addInitScript(() => {
  localStorage.setItem('venoxa_access_granted', 'VENOXA2003');
  localStorage.setItem('venoxa_theme', 'light');
  localStorage.setItem('venoxa_lang', 'en');
});

const p = await c.newPage();

p.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
p.on('pageerror', err => console.log('PAGE ERROR:', err.message));
p.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
p.on('response', res => {
  if (res.url().includes('path') || res.status() >= 400) {
    console.log('RESPONSE:', res.status(), res.url());
  }
});

await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2000);

const clicked = await p.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const btn = buttons.find(b => b.textContent?.includes('Learning Path') || b.textContent?.includes('المسار'));
  if (btn) {
    btn.click();
    return true;
  }
  return false;
});
console.log('Clicked button?', clicked);

await p.waitForTimeout(4000);
await p.screenshot({ path: 'design-reference/actual/real-user-test-with-access.png' });
console.log('Done');
await b.close();
