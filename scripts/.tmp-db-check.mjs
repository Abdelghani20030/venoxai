import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+\s*=/.test(line))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const url = new URL(env.DATABASE_URL);
console.log('host:', url.host);
console.log('port:', url.port);
console.log('searchParams keys:', [...url.searchParams.keys()]);
for (const [k, v] of url.searchParams) {
  if (k.toLowerCase().includes('password') || k.toLowerCase() === 'ssl' || k === 'sslmode') continue;
  console.log('  ', k, '=', v);
}
console.log('sslmode:', url.searchParams.get('sslmode'));
console.log('user:', url.username);
console.log('protocol:', url.protocol);

const variants = [];
for (const family of [4, 6, 0]) {
  for (const ssl of [{ rejectUnauthorized: false }, { rejectUnauthorized: true }, false]) {
    variants.push([`family=${family} ssl=${JSON.stringify(ssl)}`, { family, ssl, connectionTimeoutMillis: 12_000 }]);
  }
}

const { Client } = await import('pg');
for (const [label, opts] of variants) {
  const client = new Client({ connectionString: env.DATABASE_URL, ...opts });
  let done = false;
  client.on('error', (e) => console.log(`   [${label}] pool error event:`, e.message));
  try {
    await client.connect();
    const result = await client.query('select version()');
    console.log(label, '=> OK:', String(result.rows[0].version).slice(0, 40));
    await client.end();
    done = true;
    break;
  } catch (error) {
    console.log(label, '=> FAILED:', error.message);
    await client.end().catch(() => {});
  }
  if (done) break;
}
