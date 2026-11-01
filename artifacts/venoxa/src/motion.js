/**
 * src/motion.js
 * Shared motion tokens for Venoxa — used by framer-motion and CSS.
 * All animation values live here; import from this file everywhere.
 */

// ── Easing ────────────────────────────────────────────────────────────────────
export const easing = {
  /** Smooth deceleration — most UI transitions */
  out: [0.16, 1, 0.3, 1],
  /** Overshooting spring — buttons, badges, active states */
  spring: [0.34, 1.56, 0.64, 1],
  /** Linear */
  linear: [0, 0, 1, 1],
};

// ── Durations (ms) ────────────────────────────────────────────────────────────
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  enter: 0.35,
  exit: 0.15,
};

// ── Spring physics presets ─────────────────────────────────────────────────────
export const springs = {
  /** Snappy spring for buttons / micro-interactions */
  snappy: { type: 'spring', stiffness: 400, damping: 28, mass: 0.8 },
  /** Soft spring for cards / panels */
  soft: { type: 'spring', stiffness: 200, damping: 22, mass: 1 },
  /** Bouncy spring for active nav pill */
  pill: { type: 'spring', stiffness: 320, damping: 24 },
};

// ── Reusable variants ──────────────────────────────────────────────────────────
/** Fade + rise — the bread-and-butter enter animation */
export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.enter, ease: easing.out } },
  exit:    { opacity: 0, y: 8,  transition: { duration: durations.exit,  ease: easing.linear } },
};

/** Fade only — for overlays and backdrops */
export const fadeOnly = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.normal, ease: easing.out } },
  exit:    { opacity: 0, transition: { duration: durations.exit,   ease: easing.linear } },
};

/** Scale + fade — for modals, dropdowns */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95, y: 12 },
  animate: { opacity: 1, scale: 1,    y: 0,  transition: springs.soft },
  exit:    { opacity: 0, scale: 0.96, y: 6,  transition: { duration: durations.exit, ease: easing.linear } },
};

/** Stagger container — wrap repeated lists */
export const staggerContainer = (staggerMs = 60) => ({
  initial:  {},
  animate:  { transition: { staggerChildren: staggerMs / 1000 } },
});

/** Single child for stagger containers */
export const staggerChild = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.enter, ease: easing.out } },
};

/** RTL-aware horizontal slide for drawers */
export const slideDrawer = (dir = 1) => ({
  initial: { opacity: 0, x: -100 * dir },
  animate: { opacity: 1, x: 0,          transition: springs.soft },
  exit:    { opacity: 0, x: -80 * dir,  transition: { duration: durations.exit, ease: easing.linear } },
});

/** Scroll reveal properties for long pages */
export const scrollRevealProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: durations.enter, ease: easing.out },
};

/** Chevron rotation */
export const chevronVariants = {
  closed: { rotate: 0 },
  open:   { rotate: 180, transition: { duration: durations.normal, ease: easing.out } },
};
