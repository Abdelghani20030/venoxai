// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa redesign — shared UI kit (`vx` primitives)
//
//  Thin React wrappers over the approved design-reference classes in
//  reference.css. New redesign screens should compose these instead of
//  hand-writing one-off utility markup.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag className={cx('vx-card', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  icon: Icon = null,
  children,
  className,
  type = 'button',
  disabled,
  ...rest
}) {
  const variantClass = variant === 'ghost' ? 'is-ghost' : variant === 'white' ? 'is-white' : '';
  return (
    <button
      type={type}
      className={cx('vx-btn', variantClass, size === 'sm' && 'is-sm', block && 'is-block', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon size={size === 'sm' ? 13 : 16} /> : null}
      {children}
    </button>
  );
}

export function Chip({ tone = 'primary', className, children, ...rest }) {
  const toneClass = tone === 'mint' ? 'is-mint' : tone === 'amber' ? 'is-amber' : tone === 'gray' ? 'is-gray' : tone === 'green' ? 'is-green' : '';
  return (
    <span className={cx('vx-chip', toneClass, className)} {...rest}>
      {children}
    </span>
  );
}

export function Notice({ tone = 'info', icon: Icon = null, action = null, children }) {
  return (
    <div className={cx('vx-notice', tone === 'error' ? 'is-error' : tone === 'warn' ? 'is-warn' : 'is-info')} role={tone === 'error' ? 'alert' : 'status'}>
      {Icon ? <Icon size={16} /> : null}
      <div className="vx-notice-body">
        <span>{children}</span>
        {action ? <div className="vx-notice-actions">{action}</div> : null}
      </div>
    </div>
  );
}

export function Spinner({ size = 16 }) {
  return (
    <span className="vx-spinner" style={{ width: size, height: size }} aria-hidden="true" />
  );
}

export function ProgressBar({ value = 0, label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="vx-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export { cx };
