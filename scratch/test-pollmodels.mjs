import { readFileSync } from 'fs';
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const get = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};
const pollK = get('POLLINATIONS_API_KEY');

const r = await fetch('https://text.pollinations.ai/models', {
  headers: pollK ? { Authorization: 'Bearer ' + pollK } : {},
});
const j = await r.json();
const arr = Array.isArray(j) ? j : j.models || j.data || [];
const audioish = arr.filter((m) => {
  const s = JSON.stringify(m).toLowerCase();
  return s.includes('audio') || s.includes('tts') || s.includes('voice');
});
console.log('total models:', arr.length);
for (const m of audioish.slice(0, 20)) console.log('AUDIO:', m.name || m.id, JSON.stringify(m).slice(0, 140));
