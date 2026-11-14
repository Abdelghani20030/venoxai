// src/landing/illustrations/HeroArt.jsx — decorative hero illustration:
// a phone mock-up running the real Learning Path look (mini unit header +
// path nodes), surrounded by floating chips: level badge, streak flame,
// "Hello!" speech bubble and a check badge. Original artwork, aria-hidden.

import { Check, Flame } from 'lucide-react';
import { MiniConnector, MiniNode } from './MiniPath.jsx';

// Zig-zag offsets scaled down from PathMap's [0, 32, 44, 24].
const OFFSETS = [0, 26, 38, 18];

export default function HeroArt({ tag, hello, streak, level = 'A1' }) {
  const nodes = ['done', 'done', 'current', 'locked'];
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit max-w-full py-8">
      {/* soft colour blob behind the phone */}
      <div className="absolute -inset-8 -z-10 rounded-[56px] bg-[var(--vxp-primary-tint)] opacity-70 blur-2xl" />

      {/* phone */}
      <div className="vx-float-slow relative w-[240px] rounded-[36px] border-[10px] border-[var(--vxp-border-strong)] bg-[var(--vxp-surface)] shadow-[0_30px_60px_-20px_rgba(2,8,23,0.35)] sm:w-[264px]">
        <span className="absolute left-1/2 top-2.5 h-1.5 w-14 -translate-x-1/2 rounded-full bg-[var(--vxp-border-strong)]" />
        <div className="px-4 pb-6 pt-7 sm:px-5">
          <div className="rounded-2xl border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] px-3.5 py-2.5">
            <p className="vx-eyebrow !mb-0.5 !text-[9px]">Unit 1</p>
            <p className="text-[12px] font-extrabold text-[var(--vxp-text)]">Getting started</p>
          </div>
          <div className="mt-4">
            {nodes.map((kind, i) => (
              <div key={`${kind}-${i}`}>
                {i > 0 && (
                  <MiniConnector fromOffset={OFFSETS[i - 1]} toOffset={OFFSETS[i]} active={i < 3} />
                )}
                <div className="relative" style={{ marginInlineStart: OFFSETS[i] }}>
                  <MiniNode kind={kind} tag={kind === 'current' ? tag : undefined} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating level chip */}
      <div className="vx-float absolute -top-2 start-[-28px] flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--vxp-primary)] text-[14px] font-extrabold text-white shadow-lg">
        {level}
      </div>

      {/* floating streak chip */}
      <div className="vx-float-slow absolute end-[-34px] top-16 flex items-center gap-1.5 rounded-2xl bg-[var(--vxp-amber)] px-3 py-2 text-[13px] font-extrabold text-[var(--vxp-amber-text)] shadow-lg">
        <Flame className="h-4 w-4" />
        {streak} 12
      </div>

      {/* speech bubble */}
      <div className="vx-float absolute bottom-24 start-[-40px] rounded-2xl border border-[var(--vxp-border)] bg-[var(--vxp-surface)] px-3.5 py-2 text-[14px] font-extrabold text-[var(--vxp-text)] shadow-lg">
        {hello}
      </div>

      {/* check badge */}
      <div className="vx-float-slow absolute -bottom-1 end-[-16px] flex h-11 w-11 items-center justify-center rounded-full bg-[var(--vxp-success)] text-white shadow-lg">
        <Check className="h-5 w-5" aria-hidden="true" />
      </div>
    </div>
  );
}
