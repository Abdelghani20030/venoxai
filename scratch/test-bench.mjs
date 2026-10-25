const base = 'http://127.0.0.1:3000/api/edge-tts';
const short = [
  ['en-US-AndrewMultilingualNeural', 'Welcome to your speaking lesson.', 'US male'],
  ['en-US-AvaMultilingualNeural', 'Click play when you are ready.', 'US female'],
  ['en-GB-RyanNeural', 'Good afternoon, welcome back.', 'UK male'],
  ['en-GB-SoniaNeural', 'Hello, shall we begin?', 'UK female'],
  ['ar-SA-ZariyahNeural', 'مرحبا بكم في درس اليوم', 'AR female'],
  ['ar-SA-HamedNeural', 'اهلا بكم، نبدأ الآن', 'AR male'],
];
const LONG =
  'Reading practice. Language learning works best when you speak out loud for a few minutes ' +
  'every single day, because your mouth learns muscle memory just like an athlete trains, ' +
  'and your brain builds long term connections when sounds repeat in context rather than in isolation.';

for (const [voice, text, label] of short) {
  const t0 = Date.now();
  const r = await fetch(`${base}?text=${encodeURIComponent(text)}&voice=${voice}&r=${t0}`);
  const b = Buffer.from(await r.arrayBuffer());
  console.log(label.padEnd(10), '|', r.status, '|', (Date.now() - t0) + 'ms |', b.length + 'b |', r.headers.get('x-tts-engine'));
}

const t0 = Date.now();
const r = await fetch(`${base}?text=${encodeURIComponent(LONG)}&voice=en-US-AvaMultilingualNeural&r=1`);
const b = Buffer.from(await r.arrayBuffer());
console.log('LONG US fem |', r.status, '|', (Date.now() - t0) + 'ms |', b.length + 'b |', r.headers.get('x-tts-engine'));

const t1 = Date.now();
const r2 = await fetch(`${base}?text=${encodeURIComponent(LONG)}&voice=en-US-AvaMultilingualNeural&r=1`);
const b2 = Buffer.from(await r2.arrayBuffer());
console.log('LONG repeat |', r2.status, '|', (Date.now() - t1) + 'ms |', b2.length + 'b |', r2.headers.get('x-tts-engine'));
