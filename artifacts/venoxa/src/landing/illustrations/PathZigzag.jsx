// src/landing/illustrations/PathZigzag.jsx — feature 1 "One clear path":
// a vertical zig-zag of mini path nodes on a soft stage card (blue theme).

import { MiniConnector, MiniNode } from './MiniPath.jsx';

const OFFSETS = [0, 30, 44, 22];

export default function PathZigzag({ tag }) {
  const nodes = ['done', 'done', 'current', 'locked'];
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[var(--vxp-primary-tint)] opacity-60 blur-xl" />
      <div className="relative rounded-[28px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] px-8 py-7 shadow-sm">
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
      {/* floating accents */}
      <span className="vx-float absolute -top-4 end-[-18px] h-9 w-9 rounded-full bg-[var(--vxp-mint)]" />
      <span className="vx-float-slow absolute -bottom-5 start-[-20px] h-6 w-6 rounded-[10px] bg-[var(--vxp-amber)]" />
    </div>
  );
}
