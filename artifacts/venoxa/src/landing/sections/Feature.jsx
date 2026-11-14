// src/landing/sections/Feature.jsx — one "text on one side, illustration on
// the other" section. Alternation is driven by `index` (odd = illustration
// first on desktop). Background/eyebrow colour follows the section family.
// Mobile: text first, then illustration.

import { FOCUS_RING } from '../../ui/index.jsx';
import { Reveal } from '../reveal.jsx';

const FAMILIES = {
  blue: {
    bg: 'bg-[var(--vxp-primary-tint)]',
    eyebrow: 'text-[var(--vxp-primary)]',
  },
  mint: {
    bg: 'bg-[var(--vxp-mint)]',
    eyebrow: 'text-[var(--vxp-mint-text)]',
  },
  amber: {
    bg: 'bg-[var(--vxp-amber)]',
    eyebrow: 'text-[var(--vxp-amber-text)]',
  },
  plain: {
    bg: 'bg-[var(--vxp-surface)]',
    eyebrow: 'text-[var(--vxp-primary)]',
  },
};

// Colour rhythm across the five features: blue, mint, amber, white, blue.
const RHYTHM = ['blue', 'mint', 'amber', 'plain', 'blue'];

export default function Feature({ c, data, index, Art }) {
  const fam = FAMILIES[RHYTHM[index % RHYTHM.length]];
  const flip = index % 2 === 1; // illustration on the inline-start side
  return (
    <section id={`vx-feat-${data.id}`} aria-labelledby={`vx-feat-${data.id}-t`} className={fam.bg}>
      <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 py-14 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <Reveal className={flip ? 'lg:order-2' : ''}>
          <p className={`vx-eyebrow ${fam.eyebrow}`}>{data.eyebrow}</p>
          <h2
            id={`vx-feat-${data.id}-t`}
            className="mt-2 text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.08] text-[var(--vxp-text)]"
          >
            {data.title}
          </h2>
          <p className="mt-4 max-w-[480px] text-[17px] leading-[1.6] text-[var(--vxp-dim)] sm:text-[18px]">
            {data.body}
          </p>
        </Reveal>
        <Reveal className={flip ? 'lg:order-1' : ''} aria-hidden="true">
          <Art />
        </Reveal>
      </div>
    </section>
  );
}
