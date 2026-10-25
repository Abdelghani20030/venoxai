import { readFileSync } from 'fs';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const get = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};
const kokoroBase = get('KOKORO_BASE_URL').replace(/\/$/, '');
const pollK = get('POLLINATIONS_API_KEY');

// 1. Kokoro reachability + speed
try {
  const t0 = Date.now();
  const v = await fetch(kokoroBase + '/voices');
  console.log('kokoro /voices:', v.status, (Date.now() - t0) + 'ms');
  if (v.ok) {
    const j = await v.json();
    const ids = Array.isArray(j) ? j : j.voices || Object.keys(j);
    console.log('kokoro voices sample:', ids.slice(0, 12).join(', '));
  }
  const t1 = Date.now();
  const s = await fetch(kokoroBase + '/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Good morning class. Today we learn English.', voice: 'af_heart', speed: 1.0, response_format: 'mp3' }),
  });
  const b = s.ok ? Buffer.from(await s.arrayBuffer()) : null;
  console.log('kokoro /tts:', s.status, (Date.now() - t1) + 'ms', b ? b.length + 'b ct:' + s.headers.get('content-type') : (await s.text()).slice(0, 120));
} catch (e) {
  console.log('KOKORO unreachable:', e.message);
}

// 2. Pollinations audio TTS reachability + speed
try {
  const t0 = Date.now();
  const r = await fetch('https://text.pollinations.ai/' + encodeURIComponent('Good morning class. Today we learn English.') + '?model=openai-audio&voice=nova', {
    headers: pollK ? { Authorization: 'Bearer ' + pollK } : {},
  });
  let audio = false;
  let info = '';
  const ct = r.headers.get('content-type') || '';
  if (ct.includes('audio') || ct.includes('mpeg')) {
    const b = Buffer.from(await r.arrayBuffer());
    audio = b.length > 1000;
    info = b.length + 'b ' + JSON.stringify(b.subarray(0, 6).toString('ascii'));
  } else {
    info = 'ct: ' + ct + ' body: ' + (await r.text()).slice(0, 150);
  }
  console.log('pollinations tts:', r.status, (Date.now() - t0) + 'ms', info);
} catch (e) {
  console.log('POLLINATIONS unreachable:', e.message);
}
