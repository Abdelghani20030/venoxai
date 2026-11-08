// PathMap.reference.jsx
// Exact port of the Learning Path geometry used in the approved mockups (PDF pages 4, 9, 10).
// Drop into the app, wire `onSelect`, feed it items from GET /api/path. Colors come from the
// --vx-* tokens in reference-tokens.css, so light/dark work automatically.
//
// items: array of
//   { unit: 'Unit 1 · Getting started', meta: '3 of 4 done' }                 (unit banner, split on "·")
//   { k: 'done'|'current'|'locked'|'review'|'trophy'|'tlocked', t: 'Title', s: 'Subtitle', id: 'slug' }
//
// Desktop use:  <PathMap items={items} width={540} cx={120} amp={70} dy={90} top={6} />
// Mobile use:   <PathMap items={items} width={300} cx={70}  amp={34} dy={96} top={60} small />
// RTL: pass rtl={document.dir === 'rtl'}; the whole map mirrors and labels sit on the left.
import React from 'react';

const PATTERN = [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7];

const ICON = {
  check: <path d="M20 6 9 17l-5-5" />,
  lock: (<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  play: <polygon points="7 3 20 12 7 21" />,
  redo: (<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>),
  trophy: (<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-1.21 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98 1.21 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>),
};

function Glyph({ name, x, y, size, color, sw = 2.2, fill = 'none' }) {
  const s = size / 24;
  return (
    <g transform={`translate(${x - size / 2},${y - size / 2}) scale(${s})`} fill={fill} stroke={color}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{ICON[name]}</g>
  );
}

export function layoutPath(items, { width = 540, cx = 120, amp = 70, dy = 90, top = 6, small = false, rtl = false } = {}) {
  const mx = (x) => (rtl ? width - x : x);
  let y = top, n = 0;
  const out = [];
  for (const it of items) {
    if (it.unit) {
      out.push({ type: 'unit', it, y });
      y += 62 + (small ? 40 : 46);
    } else {
      const x = mx(cx + amp * PATTERN[n % PATTERN.length]);
      out.push({ type: 'node', it, x, y });
      y += it.k === 'review' ? dy - 22 : dy;
      n += 1;
    }
  }
  return { rows: out, height: y + 10 };
}

export default function PathMap({
  items, width = 540, cx = 120, amp = 70, dy = 90, top = 6, small = false, rtl = false,
  tag = 'CONTINUE', onSelect,
}) {
  const { rows, height } = layoutPath(items, { width, cx, amp, dy, top, small, rtl });
  const nodes = rows.filter((r) => r.type === 'node');
  const R = small ? 30 : 34;
  const dir = rtl ? -1 : 1;
  const anchor = rtl ? 'end' : 'start';

  const links = nodes.slice(0, -1).map((a, i) => {
    const b = nodes[i + 1];
    const done = a.it.k === 'done' && (b.it.k === 'done' || b.it.k === 'current');
    const mid = (a.y + b.y) / 2;
    return (
      <path key={`l${i}`} d={`M${a.x} ${a.y} C${a.x} ${mid},${b.x} ${mid},${b.x} ${b.y}`} fill="none"
            stroke={done ? 'var(--vx-ok)' : 'var(--vx-lockline)'} strokeWidth={done ? 9 : 7}
            strokeLinecap="round" strokeDasharray={done ? undefined : '2 12'} />
    );
  });

  const parts = rows.map((r, i) => {
    if (r.type === 'unit') {
      const [name, title] = r.it.unit.split('·').map((s) => s.trim());
      return (
        <g key={`u${i}`}>
          <rect x="12" y={r.y} width={width - 24} height="58" rx="16" fill="var(--vx-unitbg)" stroke="var(--vx-unitborder)" />
          <text x={rtl ? width - 30 : 30} y={r.y + 25} fontSize="11.5" fontWeight="700" letterSpacing=".8" textAnchor={anchor} fill="var(--vx-muted)">{name.toUpperCase()}</text>
          <text x={rtl ? width - 30 : 30} y={r.y + 46} fontSize="16" fontWeight="700" textAnchor={anchor} fill="var(--vx-text)">{title}</text>
          {r.it.meta && (
            <text x={rtl ? 30 : width - 30} y={r.y + 36} fontSize="12.5" fontWeight="600" textAnchor={rtl ? 'start' : 'end'} fill="var(--vx-muted)">{r.it.meta}</text>
          )}
        </g>
      );
    }
    const { x, y, it } = r;
    const k = it.k;
    const locked = k === 'locked' || k === 'tlocked';
    const off = (k === 'current' ? R + 30 : R + 22) * dir;
    const strong = k === 'done' || k === 'current' || k === 'review' || k === 'trophy';
    const subColor = k === 'current' ? 'var(--vx-primary)' : k === 'review' ? 'var(--vx-amberd)' : 'var(--vx-muted2)';
    const label = `${it.t}${it.s ? ', ' + it.s : ''}${locked ? ', locked' : ''}`;
    return (
      <g key={`n${i}`} role="button" tabIndex={locked ? -1 : 0} aria-label={label} aria-disabled={locked || undefined}
         style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
         onClick={() => onSelect && onSelect(it)}
         onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onSelect) { e.preventDefault(); onSelect(it); } }}>
        {k === 'done' && (<>
          <circle cx={x} cy={y} r={R + 6} fill="var(--vx-ok)" opacity=".14" />
          <circle cx={x} cy={y} r={R} fill="var(--vx-ok)" />
          <Glyph name="check" x={x} y={y} size={30} color="#fff" sw={3.2} />
        </>)}
        {k === 'current' && (<>
          <circle cx={x} cy={y} r={R + 17} fill="var(--vx-primary)" opacity=".12" />
          <circle cx={x} cy={y} r={R + 9} fill="var(--vx-primary)" opacity=".2" />
          <circle cx={x} cy={y} r={R + 2} fill="var(--vx-primary)" />
          <Glyph name="play" x={x + 2 * dir} y={y} size={26} color="#fff" sw={2} fill="#fff" />
          <rect x={x - 46} y={y - R - 42} width="92" height="26" rx="13" fill="var(--vx-text)" />
          <polygon points={`${x - 6},${y - R - 16} ${x + 6},${y - R - 16} ${x},${y - R - 9}`} fill="var(--vx-text)" />
          <text x={x} y={y - R - 25} fontSize="11" fontWeight="800" letterSpacing=".8" textAnchor="middle" fill="var(--vx-bg)">{tag}</text>
        </>)}
        {k === 'locked' && (<>
          <circle cx={x} cy={y} r={R} fill="var(--vx-lockbg)" stroke="var(--vx-lockline)" strokeWidth="2" />
          <Glyph name="lock" x={x} y={y} size={24} color="var(--vx-lockicon)" />
        </>)}
        {k === 'review' && (<>
          <circle cx={x} cy={y} r="25" fill="var(--vx-amberbg)" stroke="var(--vx-amberd)" strokeWidth="2.4" strokeDasharray="5 4" />
          <Glyph name="redo" x={x} y={y} size={22} color="var(--vx-amberd)" sw={2.4} />
        </>)}
        {k === 'trophy' && (<>
          <circle cx={x} cy={y} r={R + 4} fill="var(--vx-amberbg)" stroke="var(--vx-amberd)" strokeWidth="2" />
          <Glyph name="trophy" x={x} y={y} size={28} color="var(--vx-amberd)" />
        </>)}
        {k === 'tlocked' && (<>
          <circle cx={x} cy={y} r={R + 4} fill="var(--vx-lockbg)" stroke="var(--vx-lockline)" strokeWidth="2" />
          <Glyph name="trophy" x={x} y={y} size={28} color="var(--vx-lockicon)" />
        </>)}
        <text x={x + off} y={y - 2} fontSize={small ? 13.5 : 14.5} fontWeight={k === 'current' ? 700 : 650} textAnchor={anchor}
              fill={strong ? 'var(--vx-text)' : 'var(--vx-muted2)'}>{it.t}</text>
        {it.s && <text x={x + off} y={y + 17} fontSize="12" fontWeight="550" textAnchor={anchor} fill={subColor}>{it.s}</text>}
      </g>
    );
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible', maxWidth: '100%' }} role="list">
      {links}
      {parts}
    </svg>
  );
}
