// src/ui/index.jsx — Venoxa design-system kit (spec §3.6)
//
// The single source for the redesigned chrome: buttons, chips, cards,
// progress bar/ring, stat tiles, breadcrumbs, audio buttons, empty states
// and avatars. Everything reads the `--vxp-*` tokens appended to index.css,
// so light/dark themes flip without per-component conditionals, and logical
// Tailwind properties (ms-*/me-*) keep RTL mirroring automatic.
//
// Weight caveat: in Arabic mode the legacy `[dir="rtl"] *` rule pins body
// text to weight 700 with 'The Year of The Camel'; Latin glyphs/digits fall
// through `--vxp-font` to Inter. See the assumptions log in the redesign plan.

import React from 'react';
import { ChevronRight, ChevronLeft, Volume2 } from 'lucide-react';

/* ── shared class constants ──────────────────────────────────────────── */

// Icon that must mirror itself in RTL (trailing arrows, breadcrumb chevrons).
export const RTL_FLIP = 'rtl:-scale-x-100';

// Visible focus ring everywhere (spec §3.10).
export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vxp-primary)]';

/* ── Button ──────────────────────────────────────────────────────────── */

const BTN_VARIANTS = {
  primary: 'bg-[var(--vxp-primary)] text-[var(--vxp-on-primary)] hover:bg-[var(--vxp-primary-hover)]',
  onGradient: 'bg-white text-[var(--vxp-primary)] hover:bg-[#eef4ff]',
  success: 'bg-[var(--vxp-success)] text-white hover:brightness-[0.94]',
  ghost: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)] hover:brightness-[0.97]',
  outline:
    'bg-[var(--vxp-surface)] text-[var(--vxp-text)] border border-[var(--vxp-border-strong)] hover:bg-[var(--vxp-surface-2)]',
  destructive: 'bg-[var(--vxp-danger-tint)] text-[var(--vxp-danger)] hover:brightness-[0.97]',
};

const BTN_SIZES = {
  sm: 'h-9 px-3 text-[13px] rounded-[10px]',
  md: 'h-11 px-5 text-[14px] rounded-[12px]',
  lg: 'h-12 px-6 text-[15px] rounded-[12px]',
};

export function Btn({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconSide = 'end',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`inline-flex select-none items-center justify-center gap-2 font-bold transition-[background-color,filter] duration-150 disabled:pointer-events-none disabled:opacity-50 ${BTN_SIZES[size]} ${BTN_VARIANTS[variant]} ${FOCUS_RING} ${className}`}
      {...rest}
    >
      {Icon && iconSide === 'start' && (
        <Icon className={`h-4 w-4 shrink-0 ${RTL_FLIP}`} aria-hidden="true" />
      )}
      {children}
      {Icon && iconSide !== 'start' && (
        <Icon className={`h-4 w-4 shrink-0 ${RTL_FLIP}`} aria-hidden="true" />
      )}
    </button>
  );
}

/* ── Chip / pill ─────────────────────────────────────────────────────── */

const CHIP_VARIANTS = {
  blue: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  mint: 'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
  amber: 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]',
  grey: 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]',
  green: 'bg-[var(--vxp-success-tint)] text-[var(--vxp-success-text)]',
  danger: 'bg-[var(--vxp-danger-tint)] text-[var(--vxp-danger)]',
};

export function Chip({ variant = 'blue', icon: Icon, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold leading-none ${CHIP_VARIANTS[variant]} ${className}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* ── Card + card header pattern ──────────────────────────────────────── */

export function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`vx-card rounded-[20px] border border-[var(--vxp-border)] bg-[var(--vxp-surface)] p-5 sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

// "Small eyebrow + bold title" card header (§3.6), optional trailing action.
export function CardTitle({ eyebrow, title, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="vx-eyebrow mb-1">{eyebrow}</p>}
        <h3 className="text-[17px] font-extrabold tracking-[-0.01em] text-[var(--vxp-text)]">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

export function Eyebrow({ className = '', children }) {
  return <p className={`vx-eyebrow ${className}`}>{children}</p>;
}

/* ── Progress ────────────────────────────────────────────────────────── */

// 6–8px rounded bar; fill anchors to the inline start (right in RTL).
export function ProgressBar({ value = 0, color = 'primary', ariaLabel, className = '' }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const fill = color === 'success' ? 'var(--vxp-success)' : 'var(--vxp-primary)';
  return (
    <div
      className={`h-[7px] w-full overflow-hidden rounded-full bg-[var(--vxp-track)] ${className}`}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: fill }}
      />
    </div>
  );
}

// SVG ring with round caps, big centred number + tiny caption (§3.6).
export function ProgressRing({
  value = 0,
  size = 92,
  stroke = 9,
  color = 'var(--vxp-primary)',
  label,
  caption,
  className = '',
}) {
  const pct = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={caption ? `${label || `${Math.round(pct * 100)}%`} — ${caption}` : label || `${Math.round(pct * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--vxp-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-extrabold leading-none text-[var(--vxp-text)]">
          {label ?? `${Math.round(pct * 100)}%`}
        </span>
        {caption && (
          <span className="mt-1 text-[11px] font-semibold text-[var(--vxp-dim)]">{caption}</span>
        )}
      </div>
    </div>
  );
}

/* ── Stat tile ───────────────────────────────────────────────────────── */

const TILE_TINTS = {
  amber: 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]',
  mint: 'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
  blue: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  green: 'bg-[var(--vxp-success-tint)] text-[var(--vxp-success-text)]',
  grey: 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]',
};

export function StatTile({ icon: Icon, tint = 'blue', value, caption, className = '' }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      {Icon && (
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${TILE_TINTS[tint]}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-[22px] font-extrabold leading-tight text-[var(--vxp-text)]">{value}</div>
        <div className="truncate text-[12px] font-semibold text-[var(--vxp-dim)]">{caption}</div>
      </div>
    </div>
  );
}

/* ── Breadcrumb ──────────────────────────────────────────────────────── */

// "My Library › Vocabulary › Review" — muted, last item bold (§3.6).
// Chevron direction follows the document direction.
export function Breadcrumb({ items = [], className = '', lang = 'en' }) {
  const Sep = lang === 'ar' ? ChevronLeft : ChevronRight;
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1 text-[13px] ${className}`}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${it.label}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 && <Sep className="h-3.5 w-3.5 shrink-0 text-[var(--vxp-dim)]" aria-hidden="true" />}
            {last || !it.onClick ? (
              <span
                className={`truncate ${last ? 'font-bold text-[var(--vxp-body)]' : 'text-[var(--vxp-dim)]'}`}
                aria-current={last ? 'page' : undefined}
              >
                {it.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={it.onClick}
                className={`truncate rounded font-semibold text-[var(--vxp-dim)] transition-colors hover:text-[var(--vxp-primary)] ${FOCUS_RING}`}
              >
                {it.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/* ── Audio button ────────────────────────────────────────────────────── */

const AUDIO_TINTS = {
  blue: 'bg-[var(--vxp-primary-tint)] text-[var(--vxp-primary)]',
  mint: 'bg-[var(--vxp-mint)] text-[var(--vxp-mint-text)]',
  grey: 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]',
};

export function AudioButton({
  onClick,
  playing = false,
  label,
  tint = 'blue',
  size = 'md',
  disabled = false,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={playing}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full transition-[filter] hover:brightness-[0.96] disabled:opacity-50 ${
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
      } ${AUDIO_TINTS[tint]} ${FOCUS_RING} ${className}`}
    >
      <Volume2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────── */

export function EmptyState({ icon: Icon, title, hint, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`}>
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <div className="text-[15px] font-bold text-[var(--vxp-text)]">{title}</div>
      {hint && <p className="max-w-sm text-[13px] leading-relaxed text-[var(--vxp-dim)]">{hint}</p>}
      {action}
    </div>
  );
}

/* ── Avatar ──────────────────────────────────────────────────────────── */

// Circular teal→lavender gradient with a dark letter (§3.2), or an image.
export function Avatar({ name = '', src, size = 36, className = '' }) {
  const letter = (String(name).trim()[0] || 'V').toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full font-extrabold text-[var(--vxp-avatar-text)] ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, var(--vxp-avatar-a), var(--vxp-avatar-b))',
        fontSize: Math.round(size * 0.42),
      }}
    >
      {letter}
    </span>
  );
}
