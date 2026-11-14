// src/landing/illustrations/SkillsArt.jsx — feature 4 "Practise every skill":
// a grammar card, a headphones/listening tile and a checked answer,
// blue/mint theme.

import { Check, FileText, Headphones } from 'lucide-react';

export default function SkillsArt() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[var(--vxp-primary-tint)] opacity-60 blur-xl" />
      <div className="relative grid w-[290px] grid-cols-2 gap-3">
        {/* grammar card */}
        <div className="rounded-[22px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-4 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]">
            <FileText className="h-4.5 w-4.5" />
          </span>
          <p className="vx-eyebrow mt-2.5 !text-[10px]">Grammar · A1</p>
          <p className="mt-1 text-[13px] font-extrabold text-[var(--vxp-text)]">am · is · are</p>
        </div>

        {/* listening tile */}
        <div className="rounded-[22px] bg-[var(--vxp-primary)] p-4 text-white shadow-sm">
          <Headphones className="h-5 w-5" />
          <p className="vx-eyebrow mt-2.5 !text-[10px] !text-white/70">Listening</p>
          <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <span className="block h-full w-2/3 rounded-full bg-white" />
          </span>
        </div>

        {/* checked answer */}
        <div className="col-span-2 flex items-center gap-3 rounded-[22px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] px-4 py-3 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--vxp-success)] text-white">
            <Check className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-extrabold text-[var(--vxp-text)]">She <span className="text-[var(--vxp-success-text)]">has</span> a car. ✓</span>
            <span className="block text-[11.5px] font-bold text-[var(--vxp-dim)]">Correct answer</span>
          </span>
        </div>
      </div>
      <span className="vx-float absolute -top-5 start-[-18px] h-8 w-8 rounded-full bg-[var(--vxp-mint)]" />
      <span className="vx-float-slow absolute -bottom-5 end-[-16px] h-6 w-6 rounded-[10px] bg-[var(--vxp-amber)]" />
    </div>
  );
}
