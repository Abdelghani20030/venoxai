// Fetches the official Saudi flag SVG and emits src/SaudiFlagIcon.jsx.
// Run once: node scripts/gen-saudi-flag.mjs
const SOURCE = 'https://flagcdn.com/sa.svg';

const res = await fetch(SOURCE, { headers: { 'User-Agent': 'venoxa-flag-gen' } });
if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
const svg = await res.text();

// Extract every <path d="..." fill="..."/>
const paths = [];
const re = /<path\s+d="([^"]+)"\s+fill="([^"]+)"\s*\/?>/g;
let m;
while ((m = re.exec(svg)) !== null) paths.push({ d: m[1].replace(/&quot;/g, '"'), fill: m[2] });

const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 900 600';
if (!paths.length) throw new Error('no paths parsed from source SVG');

const totalLen = paths.reduce((n, p) => n + p.d.length, 0);
console.log(`parsed ${paths.length} paths, viewBox="${viewBox}", ${totalLen} chars of geometry`);

const fmt = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const body = `/**
 * SaudiFlagIcon.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Accurate Saudi Arabia flag vector: green field, the Shahada calligraphy
 * (لا إله إلا الله محمد رسول الله) and the horizontal sword beneath it.
 * Geometry machine-traced from the official flag artwork (public-domain
 * source: ${SOURCE}) so every glyph is exact. Replaces the earlier
 * abstract rounded-glyph approximation that shipped in the header toggle
 * and the language flag menu.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SA_FIELD = ${fmt(paths.find(p => p.fill !== '#fff')?.d || '')};

// White artwork — shahada calligraphy + sword. Each string may contain
// several subpaths (initial M commands); rendered as-is.
const SA_WHITE = [
${paths.filter(p => p.fill === '#fff').map(p => `  ${fmt(p.d)},`).join('\n')}
];

export default function SaudiFlagIcon({ style = {}, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <path d={SA_FIELD} fill="#005430" />
      {SA_WHITE.map((d, i) => <path key={i} d={d} fill="#fff" />)}
    </svg>
  );
}
`;

const { writeFileSync, unlinkSync, existsSync } = await import('node:fs');
writeFileSync(new URL('../artifacts/venoxa/src/SaudiFlagIcon.jsx', import.meta.url), body);
console.log('wrote src/SaudiFlagIcon.jsx');
