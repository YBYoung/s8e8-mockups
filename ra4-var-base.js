/* Round 4 variations (#1417, owner 11/1): one orbit per page, full width, so competitor and page treatments can be
   compared side by side. This file mounts the frame, the switcher between variations, the intro line and the orbit
   (stage + approved scene + shared click wiring); the variation files add their layer on top. */
(function () {
  const K = window.RA3D2; const kit = K.kit; const R = window.RA4; const { D, LAST, esc, sw, COLORS } = K;
  const C = COLORS.dark;
  const VARS = [
    ['c1', 'C1 · Competitors as named dimensions', 'ra-4-v-c1.html'], ['c2', 'C2 · Side by side', 'ra-4-v-c2.html'], ['c3', 'C3 · Stacked layers', 'ra-4-v-c3.html'],
    ['p1', 'P1 · Pages as anchors', 'ra-4-v-p1.html'], ['p2', 'P2 · Pages as constellations', 'ra-4-v-p2.html'],
  ];
  R.VARS = VARS;

  R.varFrame = function (id, opts) {
    const main = R.mountShell('story', { pitch: opts.pitch, wide: true });
    main.innerHTML = `<div class="r4v-head"><div class="r4v-nav">${VARS.map(([k, w, href]) => `<a href="${href}" class="${k === id ? 'on' : ''}">${esc(w)}</a>`).join('')}</div>
      <h1 class="r4v-h">${opts.headline}</h1><p class="r4v-s">${opts.sub}</p></div><div class="r4v-body" data-body></div>`;
    return main.querySelector('[data-body]');
  };

  // one orbit in a card: returns the pieces a variation needs. opts.key adds the default key; opts.controls is extra HTML
  R.makeOrbit = function (card, opts) {
    opts = opts || {};
    card.classList.add('stage-card', 'dark');
    card.innerHTML = `${opts.key === false ? '' : `<div class="ov ov-tl"><div class="key"><span class="ro">${sw(C.covered)}Answered in full</span><span class="ro">${sw(C.thin)}In part</span><span class="ro">${sw(C.gap)}Not answered</span>${opts.keyExtra || ''}</div></div>`}
      ${opts.controls ? `<div class="ov ov-tr"><div class="ctl">${opts.controls}</div></div>` : ''}${opts.overlay || ''}`;
    const home = opts.home || { target: new THREE.Vector3(0, 0, 0), radius: 21, yaw: 0.35, pitch: 0.52 };
    const stage = kit.makeStage(card, { canvas: 'dark', fog: [28, 64], fov: 34, exposure: 1.1, drift: opts.drift == null ? 0.01 : opts.drift, home });
    const state = { week: LAST, height: 'flat', heightMode: 'demand', layers: { comp: false, local: true }, highlight: null, highlightTopic: null, selected: null, hover: null, reader: 'seo', scope: { type: 'all' } };
    stage.state = state; stage.data = D; stage.K = K;
    const scene = K.scenes.orbit3(stage);
    const ui = { setHeadline() {}, history: null, markTopic() {} };
    const W = kit.wire(stage, state, scene, { method: '' }, ui);
    W.setWeek(LAST, true);
    // the orbit's own rule: with no side list, the scene only steps aside for an open click panel
    const rawShift = stage.setShift; stage.setShift = (v) => rawShift(card.querySelector('.panel') ? v : 0);
    const O = { stage, state, scene, W, card }; (window.RA4_ORBITS = window.RA4_ORBITS || []).push(O); window.RA3D_STAGE = window.RA3D_STAGE || stage;
    return O;
  };

  // counts in full / in part for one competitor site, from the per-site answers
  R.siteCounts = (site) => { const k = { covered: 0, thin: 0, gap: 0 }; K.Q.forEach(q => { const v = q.comps && q.comps[site] ? q.comps[site].verdict : 'gap'; k[v] = (k[v] || 0) + 1; }); return k; };
  R.SITES = D.competitors.map(c => c.site);
})();
