import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+\s*=/.test(line))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

async function list(label, url, headers) {
  try {
    const response = await fetch(url, { headers });
    const text = await response.text();
    console.log(label, response.status, text.slice(0, 500));
  } catch (error) {
    console.log(label, 'error', error.message);
  }
}

await list(
  'gemini',
  `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`,
  {},
);
await list('deepseek', 'https://api.deepseek.com/models', {
  Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
});
await list('groq', 'https://api.groq.com/openai/v1/models', {
  Authorization: `Bearer ${env.GROQ_API_KEY}`,
});
