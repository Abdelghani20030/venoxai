// src/landing/reveal.js — fade/rise-on-scroll without a library.
//
// Elements start translated 16px down + transparent (CSS in landing.css) and
// gain .is-visible the first time they intersect the viewport. No layout
// shift (transform/opacity only) and everything is force-disabled under
// prefers-reduced-motion via CSS.

import { useEffect, useRef, useState } from 'react';

export function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, shown };
}

export function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const { ref, shown } = useReveal();
  return (
    <Tag ref={ref} className={`vx-reveal ${shown ? 'is-visible' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
