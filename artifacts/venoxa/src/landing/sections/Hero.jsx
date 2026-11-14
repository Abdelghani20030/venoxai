// src/landing/sections/Hero.jsx — H1 + sub + the two buttons on one side,
// the phone/path illustration (floating chips) on the other. Columns mirror
// automatically in RTL; on mobile the illustration comes first, smaller.

import { FOCUS_RING } from '../../ui/index.jsx';
import { Reveal } from '../reveal.jsx';
import HeroArt from '../illustrations/HeroArt.jsx';

export default function Hero({ c, authed, onPrimary, onSecondary }) {
  return (
    <section aria-labelledby="vx-hero-h" className="bg-[var(--vxp-surface)]">
      <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <Reveal>
          <h1
            id="vx-hero-h"
            className={`text-[clamp(34px,5.5vw,58px)] font-extrabold leading-[1.05] text-[var(--vxp-text)] ${
              c.isAr ? 'tracking-normal' : 'tracking-[-1px]'
            }`}
          >
            {c.heroTitle}
          </h1>
          <p className="mt-5 max-w-[480px] text-[17px] leading-[1.6] text-[var(--vxp-dim)] sm:text-[18px]">
            {c.heroSub}
          </p>
          <div className="mt-8 flex w-full max-w-[440px] flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onPrimary}
              className={`vx-btn vx-btn-edge w-full bg-[var(--vxp-primary)] text-[var(--vxp-on-primary)] transition-[filter] hover:brightness-110 sm:w-auto ${FOCUS_RING}`}
            >
              {authed ? c.openApp : c.getStarted}
            </button>
            {!authed && (
              <button
                type="button"
                onClick={onSecondary}
                className={`vx-btn w-full border-2 border-[var(--vxp-border-strong)] bg-[var(--vxp-surface)] text-[var(--vxp-text)] transition-colors hover:bg-[var(--vxp-surface-2)] sm:w-auto ${FOCUS_RING}`}
              >
                {c.haveAccount}
              </button>
            )}
          </div>
        </Reveal>

        <Reveal className="order-first lg:order-none" aria-hidden="true">
          <HeroArt tag={c.heroStartTag} hello={c.heroHello} streak={c.heroStreak} level="A1" />
        </Reveal>
      </div>
    </section>
  );
}
