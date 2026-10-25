const base = 'https://api.streamelements.com/kappa/v2/speech';
const tests = [
  ['Matthew', 'Good morning, this is the American male Polly voice.'],
  ['Amy', 'Hello, this is the British female Polly voice.'],
  ['Brian', 'Good afternoon, this is the British male Polly voice.'],
  ['Joanna', 'Hi there, this is the American female Polly voice.'],
  ['Zeina', 'مرحبا بكم في درس اللغة العربية اليوم'],
];
for (const [voice, text] of tests) {
  const t0 = Date.now();
  try {
    const r = await fetch(`${base}?voice=${voice}&text=${encodeURIComponent(text)}`);
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    const b = Buffer.from(await r.arrayBuffer());
    console.log(voice.padEnd(8), '|', r.status, '|', ct, '|', (Date.now() - t0) + 'ms |', b.length + 'b |', JSON.stringify(b.subarray(0, 4).toString('ascii')));
  } catch (e) {
    console.log(voice.padEnd(8), '| FAILED |', (Date.now() - t0) + 'ms |', e.message);
  }
}
