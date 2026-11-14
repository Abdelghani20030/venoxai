// src/landing/sections/LearnAnywhere.jsx — soft full-width band: devices
// illustration, centred H2 and one line. No store badges (the app has none —
// verified: no App Store / Google Play links in src/).

import { Reveal } from '../reveal.jsx';
import DevicesArt from '../illustrations/DevicesArt.jsx';

export default function LearnAnywhere({ c }) {
  return (
    <section aria-labelledby="vx-anywhere-t" className="bg-[var(--vxp-surface-2)]">
      <div className="mx-auto max-w-[1120px] px-4 py-14 text-center sm:px-6 sm:py-24">
        <Reveal aria-hidden="true" className="pb-10">
          <DevicesArt />
        </Reveal>
        <Reveal>
          <h2 id="vx-anywhere-t" className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.08] text-[var(--vxp-text)]">
            {c.anywhereTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-[480px] text-[17px] leading-[1.6] text-[var(--vxp-dim)] sm:text-[18px]">
            {c.anywhereBody}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
