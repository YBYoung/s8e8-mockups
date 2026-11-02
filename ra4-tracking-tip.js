/* Round 4 (#1417) Tracking: the one branded hover, as AIV's BrandedTooltip. Any element with data-tip (and an optional
   data-tip-h heading) gets it: 120ms delay, 280px white card, fixed and portalled, under the label or above it near the
   bottom, never a native title, closes on scroll. Keyboard focus shows it too. */
(function () {
  const T = window.RA4T;
  let card = null, timer = 0, cur = null;
  function ensure() {
    if (card) return card;
    card = document.createElement('div'); card.className = 't4-tip'; card.setAttribute('role', 'tooltip'); document.body.appendChild(card);
    return card;
  }
  function show(target) {
    const c = ensure(); cur = target;
    const head = target.dataset.tipH;
    c.innerHTML = `${head ? `<b>${head}</b>` : ''}<span>${target.dataset.tip}</span>`;
    const r = target.getBoundingClientRect(); c.style.left = '0px'; c.style.top = '0px'; c.classList.add('on');
    const w = c.offsetWidth, h = c.offsetHeight;
    const below = window.innerHeight - r.bottom > Math.max(120, h + 14);
    c.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left))}px`;
    c.style.top = `${below ? r.bottom + 6 : r.top - h - 6}px`;
  }
  function hide() { clearTimeout(timer); cur = null; if (card) card.classList.remove('on'); }
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t === cur) return; clearTimeout(timer);
    if (!t) { hide(); return; }
    timer = setTimeout(() => show(t), 120);
  });
  document.addEventListener('focusin', (e) => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) show(t); });
  document.addEventListener('focusout', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true }); window.addEventListener('resize', hide);
  T.tip = (text, head, cls) => ` tabindex="0" class="t4-hint ${cls || ''}" data-tip="${text.replace(/"/g, '&quot;')}"${head ? ` data-tip-h="${head.replace(/"/g, '&quot;')}"` : ''}`;
})();
