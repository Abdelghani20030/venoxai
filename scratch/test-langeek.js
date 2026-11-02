async function test() {
  try {
    const res = await fetch('https://langeek.co/en-US/word/unmarried');
    const html = await res.text();
    const matches = [...html.matchAll(/cdn\.langeek\.co\/photo\/[^\s"'>]+/g)].map(m => m[0]);
    console.log('Matches found:', matches);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
test();
