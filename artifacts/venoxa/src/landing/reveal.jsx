// src/landing/reveal.jsx — scroll animations without a library.
//
//  • useReveal / Reveal   one element animates in (effects: up · start · end · zoom · pop · tilt)
//  • RevealGroup + .vx-item   children pop in one after another (stagger via style={{'--i': n}})
//  • useParallax          elements with data-par="0.1" drift at their own speed while scrolling
//  • ScrollProgress       thin bar at the top that fills as you scroll
//
// Everything is transform/opacity only (no layout shift) and is switched off
// under prefers-reduced-motion. "start"/"end" flip automatically in RTL.

import { useEffect, useRef, useState } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useReveal({ once = true, threshold = 0.12 } = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined' || prefersReduced()) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false); // replay when scrolled back into view
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold]);

  return { ref, shown };
}

// effect: 'up' | 'start' | 'end' | 'zoom' | 'pop' | 'tilt'
export function Reveal({
  as: Tag = 'div',
  effect = 'up',
  delay = 0,
  once = true,
  className = '',
  style,
  children,
  ...rest
}) {
  const { ref, shown } = useReveal({ once });
  return (
    <Tag
      ref={ref}
      className={`vx-reveal vx-fx-${effect} ${shown ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Wrap a list; give each child className="vx-item" style={{ '--i': index }}
export function RevealGroup({ as: Tag = 'div', once = true, className = '', children, ...rest }) {
  const { ref, shown } = useReveal({ once, threshold: 0.2 });
  return (
    <Tag ref={ref} className={`vx-group ${shown ? 'is-visible' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

// Call once in Landing.jsx with a ref to the root element. Any descendant with
// data-par="0.1" moves relative to its section as you scroll (positive = drifts
// up slower than the page, negative = the other way). Uses the CSS `translate`
// property, so it never fights the float / reveal `transform` animations.
export function useParallax(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReduced()) return undefined;

    const items = Array.from(root.querySelectorAll('[data-par]')).map((el) => ({
      el,
      k: parseFloat(el.dataset.par) || 0.1,
      box: el.closest('section') || el.parentElement,
    }));

    let raf = 0;
    const run = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const { el, k, box } of items) {
        const r = box.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue; // off-screen
        const off = r.top + r.height / 2 - vh / 2;
        el.style.translate = `0 ${(-off * k).toFixed(1)}px`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };

    run();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);
}

export function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div ref={ref} aria-hidden="true" className="vx-progress" />;
}
