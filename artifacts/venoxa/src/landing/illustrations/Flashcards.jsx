// src/landing/illustrations/Flashcards.jsx — feature 2 "Words that stay with
// you": a small stack of flashcards with the Again / Good / Easy rating
// buttons, mint theme.

export default function Flashcards({ word, hint }) {
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[var(--vxp-mint)] opacity-60 blur-xl" />
      <div className="relative w-[270px]">
        {/* two cards behind, slightly rotated */}
        <span className="absolute inset-x-5 top-4 h-full rounded-[22px] border border-[var(--vxp-border)] bg-[var(--vxp-surface-2)]" style={{ transform: 'rotate(-4deg)' }} />
        <span className="absolute inset-x-2.5 top-2 h-full rounded-[22px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)]" style={{ transform: 'rotate(2.5deg)' }} />

        {/* front card */}
        <div className="relative rounded-[22px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-5 shadow-lg">
          <p className="vx-eyebrow !text-[10px]">A1</p>
          <p className="mt-1.5 text-center text-[30px] font-extrabold leading-tight text-[var(--vxp-text)]">{word}</p>
          <p className="mt-1 text-center text-[14px] font-bold text-[var(--vxp-dim)]" dir="auto">{hint}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <span className="rounded-[10px] bg-[var(--vxp-surface-3)] py-2 text-center text-[12px] font-extrabold text-[var(--vxp-dim)]">Again</span>
            <span className="rounded-[10px] bg-[var(--vxp-primary-tint)] py-2 text-center text-[12px] font-extrabold text-[var(--vxp-primary)]">Good</span>
            <span className="rounded-[10px] bg-[var(--vxp-success-tint)] py-2 text-center text-[12px] font-extrabold text-[var(--vxp-success-text)]">Easy</span>
          </div>
        </div>
      </div>
      <span className="vx-float absolute -bottom-5 start-[-22px] h-8 w-8 rounded-full bg-[var(--vxp-amber)]" />
      <span className="vx-float-slow absolute -top-5 end-[-18px] h-6 w-6 rounded-[10px] bg-[var(--vxp-mint)]" />
    </div>
  );
}
