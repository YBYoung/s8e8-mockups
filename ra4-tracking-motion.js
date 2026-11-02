/* Round 4 (#1417) Tracking: the chart's motion engine, copied from the approved AIV chart 8 (aiv-chart-kit + chart 8):
   a monotone curve through uneven knots, one tween loop on the house ease, and SVG helpers. Reduced motion = instant. */
(function () {
  const T = window.RA4T;
  const NS = 'http://www.w3.org/2000/svg';
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };

  /** Monotone cubic (Fritsch-Carlson) through knots at uneven x: smooth, never overshoots a value. */
  function curve(xs, vs) {
    const n = xs.length, d = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) { d[i] = xs[i + 1] - xs[i]; m[i] = (vs[i + 1] - vs[i]) / d[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    return (f) => {
      if (f <= xs[0]) return vs[0]; if (f >= xs[n - 1]) return vs[n - 1];
      let i = 0; while (i < n - 2 && xs[i + 1] < f) i++;
      const h = d[i], u = (f - xs[i]) / h, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * h * t[i] + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * h * t[i + 1];
    };
  }

  /** One tween loop per chart: tween(obj, prop, to, ms) eases a number; onFrame redraws while anything moves. */
  function tweener(onFrame) {
    const TW = new Map(); let raf = 0;
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    function loop(now) {
      raf = 0; const fin = [];
      TW.forEach((t, key) => { const k = Math.max(0, Math.min(1, (now - t.t0) / t.ms)); t.obj[t.prop] = t.from + (t.to - t.from) * ease(k); if (k >= 1) { TW.delete(key); fin.push(t); } });
      onFrame(); fin.forEach((t) => t.done && t.done()); if (TW.size) kick();
    }
    function tween(obj, prop, to, ms, { delay = 0, done } = {}) {
      const key = obj.id + ':' + prop;
      if (RM || ms === 0) { obj[prop] = to; TW.delete(key); done && done(); kick(); return; }
      TW.set(key, { obj, prop, from: obj[prop], to, t0: performance.now() + delay, ms, done }); kick();
    }
    return { tween, clear: () => TW.clear(), kick };
  }

  T.motion = { NS, RM, ease, el, curve, tweener, DRAW: 1100, MORPH: 700 };
})();
