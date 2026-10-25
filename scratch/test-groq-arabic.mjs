import { readFileSync } from 'fs';
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const key = (env.match(/^GROQ_API_KEY=(.*)$/m) || ['', ''])[1].trim().replace(/^["']|["']$/g, '');

const tryCall = async (voice) => {
  const t0 = Date.now();
  const r = await fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ input: 'مرحبا كيف حالك اليوم', voice, model: 'canopylabs/orpheus-arabic-saudi', response_format: 'wav' }),
  });
  if (!r.ok) {
    console.log('voice', voice, '→', r.status, (await r.text()).slice(0, 160), (Date.now() - t0) + 'ms');
    return null;
  }
  const b = Buffer.from(await r.arrayBuffer());
  console.log('voice', voice, '→ 200 RIFF?', JSON.stringify(b.subarray(0, 4).toString('ascii')), b.length + 'b', (Date.now() - t0) + 'ms');
  return b;
};

// Groq 429s very fast — space the calls out
console.log('t1o:', await tryCall('troy') !== null ? 'ok' : 'fail');
await new Promise((r) => setTimeout(r, 1200));
console.log('t1o:', await tryCall('hannah') !== null ? 'ok' : 'fail');
