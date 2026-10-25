// Test the existing /api/gemini-tts route: speed + voice quality mapping
const base = 'http://127.0.0.1:3001/api/gemini-tts';
const voices = ['puck', 'kore', 'charon', 'zephyr', 'fenrir'];
for (const v of voices) {
  const t0 = Date.now();
  try {
    const r = await fetch(`${base}?text=${encodeURIComponent('Good morning class. Today we practice speaking English.')}&voice=${v}&r=${t0}`);
    const ct = r.headers.get('content-type') || '';
    let info = '', bytes = 0;
    if (ct.includes('audio')) {
      const b = Buffer.from(await r.arrayBuffer());
      bytes = b.length;
      info = JSON.stringify(b.subarray(0, 4).toString('ascii'));
    } else {
      info = (await r.text()).slice(0, 120);
    }
    console.log(v, '|', r.status, '|', ct.split(';')[0], '|', (Date.now() - t0) + 'ms |', bytes ? bytes + 'b ' + info : info);
  } catch (e) {
    console.log(v, '| FAILED', (Date.now() - t0) + 'ms |', e.message);
  }
}
