// src/landing/illustrations/DevicesArt.jsx — "learn anywhere" band:
// a phone and a laptop outline with floating coloured shapes. No store
// badges (none exist in the app).

export default function DevicesArt() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit pt-4">
      {/* laptop */}
      <div className="relative w-[300px] sm:w-[360px]">
        <div className="rounded-t-[18px] border-[8px] border-b-0 border-[var(--vxp-border-strong)] bg-[var(--vxp-surface)] p-3.5 shadow-lg">
          <div className="rounded-[10px] bg-[var(--vxp-surface-2)] p-3">
            <div className="rounded-xl border border-[var(--vxp-border)] bg-[var(--vxp-surface)] px-3.5 py-3">
              <p className="vx-eyebrow !mb-0.5 !text-[9px]">Lesson 3</p>
              <p className="text-[12px] font-extrabold text-[var(--vxp-text)]">The verb TO BE</p>
              <span className="mt-2.5 block h-1.5 w-full overflow-hidden rounded-full bg-[var(--vxp-track)]">
                <span className="block h-full w-1/2 rounded-full bg-[var(--vxp-primary)]" />
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-[var(--vxp-success)]" />
              <span className="h-7 w-7 rounded-full bg-[var(--vxp-success)] opacity-70" />
              <span className="flex h-7 items-center rounded-full bg-[var(--vxp-primary)] px-2.5 text-[10px] font-extrabold text-white">A1</span>
            </div>
          </div>
        </div>
        <div className="rounded-b-[14px] bg-[var(--vxp-border-strong)]" style={{ width: '112%', height: 12, marginInlineStart: '-6%', borderRadius: '0 0 14px 14px' }} />
      </div>

      {/* phone overlapping the laptop */}
      <div className="vx-float absolute -bottom-8 end-[-14px] w-[92px] rounded-[22px] border-[6px] border-[var(--vxp-border-strong)] bg-[var(--vxp-surface)] p-2 shadow-xl sm:end-[-28px]">
        <div className="rounded-[12px] bg-[var(--vxp-primary-tint)] p-2">
          <span className="block text-[9px] font-extrabold text-[var(--vxp-primary)]">A1</span>
          <span className="mt-1 block h-1 w-full rounded-full bg-[var(--vxp-primary)] opacity-60" />
          <span className="mt-1 block h-1 w-2/3 rounded-full bg-[var(--vxp-primary)] opacity-35" />
        </div>
        <div className="mt-2 flex justify-center gap-1">
          <span className="h-4 w-4 rounded-full bg-[var(--vxp-success)]" />
          <span className="h-4 w-4 rounded-full bg-[var(--vxp-surface-3)]" />
        </div>
      </div>

      {/* floating shapes */}
      <span className="vx-float absolute -top-2 start-[-26px] h-9 w-9 rounded-full bg-[var(--vxp-mint)]" />
      <span className="vx-float-slow absolute top-16 start-[-14px] h-5 w-5 rounded-[8px] bg-[var(--vxp-amber)]" />
      <span className="vx-float absolute -bottom-10 start-16 h-4 w-4 rounded-full bg-[var(--vxp-primary-tint)]" />
    </div>
  );
}
