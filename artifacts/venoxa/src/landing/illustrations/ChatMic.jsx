// src/landing/illustrations/ChatMic.jsx — feature 3 "Speak with confidence":
// two chat bubbles and a glowing microphone tile, amber/purple theme.

import { Mic } from 'lucide-react';

export default function ChatMic() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[var(--vxp-amber)] opacity-60 blur-xl" />
      <div className="relative w-[280px] rounded-[28px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-5 shadow-sm">
        {/* AI bubble */}
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--vxp-primary)] text-[13px] font-extrabold text-white">V</span>
          <span className="rounded-2xl rounded-ss-sm bg-[var(--vxp-surface-3)] px-3.5 py-2.5 text-[13.5px] font-bold text-[var(--vxp-text)]">
            Let&apos;s practise! Tell me about your day.
          </span>
        </div>
        {/* learner bubble (purple accent) */}
        <div className="mt-3 flex items-start justify-end gap-2.5" dir="ltr">
          <span className="rounded-2xl rounded-se-sm px-3.5 py-2.5 text-[13.5px] font-bold text-white" style={{ background: 'var(--vx-purple)' }}>
            Today I went to the market…
          </span>
          <span className="h-9 w-9 shrink-0 rounded-full bg-[var(--vxp-mint)]" />
        </div>
        {/* mic tile */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--vxp-amber)] px-4 py-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[var(--vxp-amber-text)] text-white">
            <span className="absolute inset-0 -z-10 rounded-full bg-[var(--vxp-amber-text)] opacity-40 blur-md" />
            <Mic className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-[12.5px] font-extrabold text-[var(--vxp-amber-text)]">Listening…</span>
            <span className="mt-1.5 flex h-1.5 gap-1 overflow-hidden rounded-full">
              <span className="w-1/4 rounded-full bg-[var(--vxp-amber-text)] opacity-70" />
              <span className="w-1/6 rounded-full bg-[var(--vxp-amber-text)] opacity-35" />
              <span className="w-1/3 rounded-full bg-[var(--vxp-amber-text)] opacity-25" />
            </span>
          </span>
        </div>
      </div>
      <span className="vx-float absolute -top-5 end-[-16px] h-8 w-8 rounded-full bg-[var(--vx-purple-tint)]" />
      <span className="vx-float-slow absolute -bottom-4 start-[-20px] h-6 w-6 rounded-[10px] bg-[var(--vxp-mint)]" />
    </div>
  );
}
