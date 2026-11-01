/**
 * src/confetti.js
 * Tiny (<1.5KB), self-cleaning canvas confetti burst.
 * Plus lightweight event bus for milestone toasts and floating XP chips.
 * Respects prefers-reduced-motion automatically.
 */

const feedbackListeners = new Set();

export function subscribeFeedback(listener) {
  feedbackListeners.add(listener);
  return () => feedbackListeners.delete(listener);
}

export function showToast(title, subtitle = '', icon = '🎉') {
  feedbackListeners.forEach(fn => fn('toast', { id: Math.random().toString(36).slice(2), title, subtitle, icon }));
}

export function showXpChip(amount = 10, x, y) {
  feedbackListeners.forEach(fn => fn('xp', { id: Math.random().toString(36).slice(2), amount, x, y }));
}

export function fireConfetti(opts = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const colors = opts.colors || ['#FF5722', '#673AB7', '#22C55E', '#3B82F6', '#EAB308', '#EC4899'];
  const count = opts.count || 70;
  const particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: w / 2 + (Math.random() - 0.5) * (w * 0.4),
      y: h * 0.4 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
    });
  }

  let startTime = null;
  const duration = 2200;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    if (elapsed > duration) {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      return;
    }

    ctx.clearRect(0, 0, w, h);
    const alpha = Math.max(0, 1 - Math.pow(elapsed / duration, 2));

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.42; // gravity
      p.vx *= 0.98;
      p.rotation += p.vRot;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
