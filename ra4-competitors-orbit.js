/* Round 4 (#1417) Competitors section 04: the optional orbit, closed until asked for. Reuses the approved C1 switch:
   R.makeOrbit with state.lens = site moves every question to where that site answers it; the scene draws the
   practice's own spot as a faint mark with a fine line. Built on first open so the 3D stage gets a real size. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const C = window.RA4C; const { D, Q, esc } = K;
  let O = null, wrap = null;
  const own = { covered: D.counts.covered, thin: D.counts.thin };
  const better = (site) => Q.filter(q => C.vOf(q, site) === 'covered' && q.verdict !== 'covered').length;

  function setLens(site) {
    if (!O) return;
    O.state.lens = site || null; O.W.closePanel(); O.W.sync();
    wrap.querySelectorAll('[data-lens-site]').forEach(b => b.classList.toggle('on', (b.dataset.lensSite || null) === (site || null)));
    wrap.querySelector('.r4v-ghostkey').style.display = site ? '' : 'none';
    const L = O.scene.own.nameLbl; L.el.innerHTML = `<span class="t">${esc(site || D.practice)}</span><small>${esc(site ? 'as this competitor answers' : `${D.city}, ${D.state}`)}</small>`; L.w = 0;
    wrap.querySelector('[data-read]').innerHTML = site
      ? `Every question now sits where ${esc(site)} answers it. ${better(site) ? `The ${R.n(better(site), 'question', 'questions')} it answers in full and the practice does not have moved inward.` : 'None of them moved inward past the practice.'}`
      : `Every question sits where the practice answers it: ${own.covered} in full, ${own.thin} in part. Pick a competitor to move them.`;
  }

  function build() {
    const sites = [null].concat(C.sites.map(s => s.site));
    wrap.querySelector('[data-orbit-body]').innerHTML = `<div class="r4v-switch c4-switch">${sites.map(site => { const k = site ? R.siteCounts(site) : own;
      return `<button type="button" data-lens-site="${esc(site || '')}"><b>${esc(site || D.practice)}</b><span>${k.covered} in full · ${k.thin} in part</span></button>`; }).join('')}</div>
      <div class="c4-stage" data-card></div><p class="c4-read" data-read></p>`;
    O = R.makeOrbit(wrap.querySelector('[data-card]'), { keyExtra: `<span class="ro r4v-ghostkey" style="display:none"><i class="r4v-ring"></i>where ${esc(D.practice)} sits</span>` });
    wrap.querySelectorAll('[data-lens-site]').forEach(b => b.addEventListener('click', () => setLens(b.dataset.lensSite)));
  }

  C.sOrbit = () => ({
    id: 'orbit', no: '04', eyebrow: 'On the orbit',
    headline: 'The same questions, seen through one site at a time.',
    lede: `Optional. The orbit places every question by subject; picking a site moves each one to where that site answers it, closer in the fuller the answer. The practice's own spot stays as a faint ring.`,
    left: `<button type="button" class="c4-btn line" data-orbit-toggle aria-expanded="false">Show on the orbit</button>`,
    fig: `<div class="c4-orbit" data-orbit><div data-orbit-body></div></div><p class="c4-calm" data-orbit-closed>Closed. The lists above carry everything the orbit shows.</p>`,
  });

  C.orbitFollow = (site) => { if (O) setLens(site); };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-orbit-toggle]'); if (!b) return;
    wrap = document.querySelector('[data-orbit]'); const open = !wrap.classList.contains('open');
    wrap.classList.toggle('open', open); document.querySelector('[data-orbit-closed]').hidden = open;
    b.setAttribute('aria-expanded', open); b.textContent = open ? 'Hide the orbit' : 'Show on the orbit';
    if (open && !O) { build(); setLens(C.cur); }
  });
})();
