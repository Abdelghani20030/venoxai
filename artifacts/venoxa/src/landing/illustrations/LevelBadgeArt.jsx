// src/landing/illustrations/LevelBadgeArt.jsx — feature 5 "Know your level":
// a big level badge and a certificate card, amber theme.

import { Award, Download } from 'lucide-react';

export default function LevelBadgeArt() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[var(--vxp-amber)] opacity-60 blur-xl" />
      <div className="relative w-[290px] rounded-[28px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {/* badge */}
          <span className="flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-full border-4 border-[var(--vxp-amber-text)] bg-[var(--vxp-amber)]">
            <span className="text-[24px] font-extrabold leading-none text-[var(--vxp-amber-text)]">B1</span>
          </span>
          <span className="min-w-0">
            <span className="vx-eyebrow block !text-[10px]">Level reached</span>
            <span className="mt-1 block text-[15px] font-extrabold text-[var(--vxp-text)]">Upper intermediate</span>
          </span>
        </div>

        {/* certificate card */}
        <div className="mt-4 rounded-2xl border-2 border-[var(--vxp-border)] bg-[var(--vxp-surface-2)] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[var(--vxp-amber-text)]">
              <Award className="h-5 w-5" />
              <span className="text-[13px] font-extrabold text-[var(--vxp-text)]">Certificate</span>
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-[var(--vxp-primary)] px-2.5 py-1.5 text-[11px] font-extrabold text-white">
              <Download className="h-3.5 w-3.5" />
              PDF
            </span>
          </div>
          <span className="mt-3 block h-1.5 w-full rounded-full bg-[var(--vxp-track)]" />
          <span className="mt-1.5 block h-1.5 w-3/5 rounded-full bg-[var(--vxp-track)]" />
        </div>
      </div>
      <span className="vx-float absolute -top-5 end-[-18px] h-8 w-8 rounded-full bg-[var(--vxp-mint)]" />
      <span className="vx-float-slow absolute -bottom-5 start-[-18px] h-6 w-6 rounded-[10px] bg-[var(--vxp-primary-tint)]" />
    </div>
  );
}
