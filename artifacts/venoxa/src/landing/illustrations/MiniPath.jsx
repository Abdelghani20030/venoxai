// src/landing/illustrations/MiniPath.jsx — static, decorative mini path nodes.
//
// Reproduces the visual language of src/path/PathMap.jsx at a smaller scale:
// done (green check + halo), current (blue play + halo + black tag pill with
// arrow), locked (grey lock), green/dotted connectors and zig-zag offsets.
// Purely decorative — every usage is aria-hidden.

import { Check, Lock, Play } from 'lucide-react';

const R = 24; // small node radius → 48px circle
const CUR = 27; // current node radius → 54px circle

export function MiniNode({ kind, tag }) {
  const size = kind === 'current' ? CUR * 2 : R * 2;
  const halo =
    kind === 'done'
      ? 'shadow-[0_0_0_8px_var(--vxp-success-tint)]'
      : kind === 'current'
        ? 'shadow-[0_0_0_10px_var(--vxp-primary-tint)]'
        : '';
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      {kind === 'current' && tag && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2">
          <span className="block whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white shadow-md">
            {tag}
          </span>
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-neutral-900"
          />
        </span>
      )}
      <span
        className={`flex h-full w-full items-center justify-center rounded-full ${halo} ${
          kind === 'current'
            ? 'bg-[var(--vxp-primary)] text-white'
            : kind === 'done'
              ? 'bg-[var(--vxp-success)] text-white'
              : 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]'
        }`}
      >
        {kind === 'current' ? (
          <Play className="h-5 w-5 fill-current" aria-hidden="true" />
        ) : kind === 'done' ? (
          <Check className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Lock className="h-4 w-4" aria-hidden="true" />
        )}
      </span>
    </span>
  );
}

// Elbow connector between two mini nodes (ports PathMap's Connector).
export function MiniConnector({ fromOffset, toOffset, active }) {
  const x1 = fromOffset + R;
  const x2 = toOffset + R;
  const minX = Math.min(x1, x2) - 1.5;
  const width = Math.abs(x2 - x1) + 3;
  const activeBg = { background: 'var(--vxp-success)' };
  const dottedV = { borderInlineStart: '3px dotted var(--vxp-track)', width: 0 };
  const dottedH = { borderTop: '3px dotted var(--vxp-track)', height: 0 };
  return (
    <div aria-hidden="true" className="relative h-7">
      <div
        className="absolute top-0 h-full"
        style={{
          insetInlineStart: fromOffset + R - 1.5,
          width: 3,
          borderRadius: 2,
          ...(active ? activeBg : dottedV),
        }}
      />
      {width > 6 && (
        <div
          className="absolute bottom-0"
          style={{
            insetInlineStart: minX,
            width,
            height: 3,
            borderRadius: 2,
            ...(active ? activeBg : dottedH),
          }}
        />
      )}
    </div>
  );
}
