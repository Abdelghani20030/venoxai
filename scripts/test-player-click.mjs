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
p.on('response', res => {
  if (res.url().includes('path') || res.status() >= 400) {
    console.log('RESPONSE:', res.status(), res.url());
  }
});

await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2000);

await p.getByRole('button', { name: 'Learning Path' }).click();
await p.waitForTimeout(2000);

console.log('Clicking Start lesson...');
await p.getByRole('button', { name: 'Start lesson' }).click();
await p.waitForTimeout(3000);

const text = await p.evaluate(() => document.body.innerText.slice(0, 600));
console.log('PAGE BODY AFTER CLICK:\n' + text);

await p.screenshot({ path: 'design-reference/actual/real-player-rendered.png' });
console.log('Screenshot saved to real-player-rendered.png');
await b.close();
