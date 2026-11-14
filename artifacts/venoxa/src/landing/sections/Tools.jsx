// src/landing/sections/Tools.jsx — "And handy tools to help you": a wrap of
// coloured chips. Labels and icons reuse the app's own tool nav entries.

import {
  BookMarked, Clock, Ear, GitBranch, GitFork, Languages, Lightbulb,
  Link2, ScrollText, Sliders,
} from 'lucide-react';
import { Reveal } from '../reveal.jsx';

const TOOL_ICONS = [Languages, Sliders, GitBranch, GitFork, Link2, ScrollText, Ear, BookMarked, Lightbulb, Clock];

const CHIP_TINTS = [
  'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
  'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]',
  'bg-[var(--vx-purple-tint)] text-[var(--vx-purple)]',
  'bg-[var(--vxp-success-tint)] text-[var(--vxp-success-text)]',
];

export default function Tools({ c }) {
  return (
    <section aria-labelledby="vx-tools-t" className="bg-[var(--vxp-surface)]">
      <div className="mx-auto max-w-[1120px] px-4 py-14 text-center sm:px-6 sm:py-20">
        <Reveal>
          <h2 id="vx-tools-t" className="text-[clamp(24px,3.2vw,34px)] font-extrabold leading-[1.15] text-[var(--vxp-text)]">
            {c.toolsTitle}
          </h2>
          <ul className="mx-auto mt-7 flex max-w-[760px] flex-wrap justify-center gap-2.5">
            {c.tools.map((t, i) => {
              const Icon = TOOL_ICONS[i % TOOL_ICONS.length];
              return (
                <li
                  key={t.label}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-bold ${CHIP_TINTS[i % CHIP_TINTS.length]}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t.label}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
