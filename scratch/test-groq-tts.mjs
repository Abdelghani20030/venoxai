import { readFileSync } from 'fs';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const key = (env.match(/^GROQ_API_KEY=(.*)$/m) || ['', ''])[1].trim().replace(/^["']|["']$/g, '');
console.log('key present:', !!key, 'len:', key.length);

const r1 = await fetch('https://api.groq.com/openai/v1/audio/speech', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
  body: JSON.stringify({ input: 'testing one two', voice: 'troy', model: 'canopylabs/orpheus-v1-english', response_format: 'wav' }),
});
console.log('speech status:', r1.status);
if (!r1.ok) {
  console.log((await r1.text()).slice(0, 400));
} else {
  const b = Buffer.from(await r1.arrayBuffer());
  console.log('bytes', b.length, JSON.stringify(b.subarray(0, 4).toString('ascii')));
}

const r2 = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: 'Bearer ' + key } });
const j = await r2.json();
const ids = (j.data || []).map((m) => m.id);
console.log('tts-ish models:', ids.filter((i) => /tts|orpheus|speech|audio/i.test(i)).join(', ') || '(none listed)');
