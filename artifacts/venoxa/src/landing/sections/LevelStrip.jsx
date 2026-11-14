// src/landing/sections/LevelStrip.jsx — one horizontal row of five level
// chips (each a different soft colour), scrollable on mobile, with a
// one-line caption. The caption is the section's accessible name.

import { Reveal } from '../reveal.jsx';

const TINTS = [
  'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
  'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]',
  'bg-[var(--vx-purple-tint)] text-[var(--vx-purple)]',
  'bg-[var(--vxp-success-tint)] text-[var(--vxp-success-text)]',
];

export default function LevelStrip({ c }) {
  return (
    <section aria-labelledby="vx-levels-cap" className="bg-[var(--vxp-surface-2)]">
      <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 sm:py-14">
        <Reveal>
          <ul
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {c.levels.map((l, i) => (
              <li
                key={l.code}
                className={`flex w-[132px] shrink-0 flex-col items-center gap-0.5 rounded-2xl px-4 py-3.5 text-center ${TINTS[i % TINTS.length]}`}
              >
                <span className="text-[18px] font-extrabold leading-tight">{l.code}</span>
                <span className="text-[12px] font-bold leading-snug">{l.name}</span>
              </li>
            ))}
          </ul>
          <p id="vx-levels-cap" className="mt-4 text-center text-[14px] font-semibold text-[var(--vxp-dim)]">
            {c.levelsCaption}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
