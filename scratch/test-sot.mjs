// SoundOfText test: POST /sounds → GET id.wav
const t0 = Date.now();
try {
  const submit = await fetch('https://api.soundoftext.com/sounds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { text: 'Good morning, this is the American voice test.', voice: 'US English Male' } }),
  });
  const sj = await submit.json();
  console.log('submit:', submit.status, JSON.stringify(sj).slice(0, 140), (Date.now() - t0) + 'ms');
  if (sj.id) {
    const t1 = Date.now();
    const r = await fetch(`https://api.soundoftext.com/sounds/${sj.id}`);
    const ct = (r.headers.get('content-type') || '').split(';')[0];
    const b = r.ok ? Buffer.from(await r.arrayBuffer()) : Buffer.from(await r.text());
    console.log('audio:', r.status, ct, (Date.now() - t1) + 'ms', r.ok ? b.length + 'b ' + JSON.stringify(b.subarray(0, 4).toString('ascii')) : b.toString().slice(0, 120));
  }
} catch (e) {
  console.log('FAILED', e.message, (Date.now() - t0) + 'ms');
}
