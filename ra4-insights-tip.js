/* Round 4 (#1417) Insights: the one branded hover card. Any element with data-tip (and an optional data-tip-h heading)
   gets it after 120ms; it is fixed to the viewport, never takes space, and closes on scroll. Never a native title. */
(function () {
  const I = window.RA4I; let el = null, timer = null, cur = null;
  function show(t) {
    if (!el) { el = document.createElement('div'); el.className = 'i4-tip'; document.body.appendChild(el); }
    const hd = t.dataset.tipH;
    el.innerHTML = `${hd ? `<b>${hd}</b>` : ''}<span>${t.dataset.tip}</span>`;
    el.style.display = 'block';
    const r = t.getBoundingClientRect(), w = el.offsetWidth, hgt = el.offsetHeight;
    let left = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
    let top = r.bottom + 6; if (window.innerHeight - r.bottom < hgt + 14) top = r.top - hgt - 6;
    el.style.left = left + 'px'; el.style.top = Math.max(8, top) + 'px';
  }
  function hide() { clearTimeout(timer); cur = null; if (el) el.style.display = 'none'; }
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-tip]'); if (t === cur) return;
    hide(); if (!t) return; cur = t; timer = setTimeout(() => show(t), 120);
  });
  document.addEventListener('focusin', (e) => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) { cur = t; show(t); } });
  document.addEventListener('focusout', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, true); window.addEventListener('resize', hide);
  I.hideTip = hide;
})();
