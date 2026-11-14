// src/landing/sections/FinalCta.jsx — big coloured block with a soft wavy
// top edge: blue in light mode, deep navy with a glow in dark mode
// (--vx-cta-bg in landing.css). White Get started button + small account
// link, a few floating shapes. The existing Footer follows in Landing.jsx.

import { FOCUS_RING } from '../../ui/index.jsx';
import { Reveal } from '../reveal.jsx';

export default function FinalCta({ c, authed, onPrimary, onSecondary }) {
  return (
    <section aria-labelledby="vx-cta-t">
      {/* wavy top edge — fill matches the block below */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="block h-[46px] w-full sm:h-[64px]"
      >
        <path
          d="M0,64 L0,38 C160,12 320,2 520,16 C720,30 860,58 1080,50 C1240,44 1350,26 1440,34 L1440,64 Z"
          fill="var(--vx-cta-bg)"
        />
      </svg>

      <div className="vx-cta-block relative overflow-hidden">
        {/* floating shapes */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="vx-float absolute start-[8%] top-10 h-16 w-16 rounded-full bg-white/10" />
          <span className="vx-float-slow absolute end-[12%] top-16 h-10 w-10 rounded-[16px] bg-white/10" />
          <span className="vx-float absolute bottom-14 start-[16%] h-7 w-7 rounded-full bg-white/10" />
          <span className="vx-float-slow absolute bottom-20 end-[22%] h-12 w-12 rounded-full border-[3px] border-white/15" />
        </div>

        <div className="relative mx-auto max-w-[760px] px-4 pb-20 pt-8 text-center sm:px-6 sm:pb-24 sm:pt-10">
          <Reveal>
            <h2
              id="vx-cta-t"
              className={`text-[clamp(30px,4.5vw,46px)] font-extrabold leading-[1.08] text-white ${
                c.isAr ? 'tracking-normal' : 'tracking-[-0.5px]'
              }`}
            >
              {c.ctaTitle}
            </h2>
            <button
              type="button"
              onClick={onPrimary}
              className={`vx-btn vx-btn-edge-white mx-auto mt-8 w-full bg-white text-[var(--vxp-primary)] transition-[filter] hover:brightness-[0.96] sm:w-auto sm:min-w-[220px] ${FOCUS_RING}`}
            >
              {authed ? c.openApp : c.getStarted}
            </button>
            {!authed && (
              <button
                type="button"
                onClick={onSecondary}
                className={`mx-auto mt-4 block w-fit text-[14px] font-bold text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline ${FOCUS_RING}`}
              >
                {c.haveAccount}
              </button>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
