/* Round 4 variations C1 to C3 (#1417): three ways to see the three competitors by name on the orbit, on each site's own
   answers (the reader judged every question on every competitor site, 11/1). C1 switches the whole orbit to one site;
   C2 shows four small orbits that move together; C3 stacks each site as its own layer above the practice. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const { D, Q, QBY, esc, sw, COLORS, VERDICT_WORD, h } = K;
  const C = COLORS.dark, CL = COLORS.light;
  const vOf = (q, site) => site ? (q.comps[site] ? q.comps[site].verdict : 'gap') : q.verdict;
  const own = () => R.siteCounts && { covered: D.counts.covered, thin: D.counts.thin, gap: D.counts.gap };
  const better = (site) => Q.filter(q => vOf(q, site) === 'covered' && q.verdict !== 'covered').length;
  const worse = (site) => Q.filter(q => q.verdict === 'covered' && vOf(q, site) !== 'covered').length;
  const nameTo = (L, title, small) => { L.el.innerHTML = `<span class="t">${esc(title)}</span>${small ? `<small>${esc(small)}</small>` : ''}`; L.w = 0; };

  /* ------- C1: one orbit, a switch between the practice and each competitor ------- */
  R.mountC1 = function () {
    const body = R.varFrame('c1', { pitch: 'competitors as named dimensions: one orbit, switched to one site at a time.',
      headline: 'Pick a site; every question moves to where that site answers it.',
      sub: `The faint ring marks where ${esc(D.practice)} sits on the same question, and the fine line shows the distance. Questions that move inward are ones the competitor answers better.` });
    body.innerHTML = `<div class="r4v-switch" data-lens>${[null].concat(R.SITES).map(site => { const k = site ? R.siteCounts(site) : own();
      return `<button data-site="${site || ''}" class="${site ? '' : 'on'}"><b>${esc(site || D.practice)}</b><span>${k.covered} in full · ${k.thin} in part</span></button>`; }).join('')}</div>
      <div class="r4v-stage" data-card></div><p class="r4v-read" data-read></p>`;
    const O = R.makeOrbit(body.querySelector('[data-card]'), { keyExtra: `<span class="ro r4v-ghostkey" style="display:none"><i class="r4v-ring"></i>where ${esc(D.practice)} sits</span>` });
    const read = body.querySelector('[data-read]');
    function setLens(site) {
      O.state.lens = site || null; O.W.closePanel(); O.W.sync();
      body.querySelectorAll('[data-site]').forEach(b => b.classList.toggle('on', (b.dataset.site || null) === (site || null)));
      body.querySelector('.r4v-ghostkey').style.display = site ? '' : 'none';
      nameTo(O.scene.own.nameLbl, site || D.practice, site ? `seen through this competitor's site` : `${D.city}, ${D.state}`);
      read.innerHTML = site ? `${esc(site)} answers <b>${better(site)} questions</b> in full that the practice does not. The practice answers <b>${worse(site)}</b> in full that ${esc(site)} does not.`
        : `The practice's own answers: ${D.counts.covered} in full, ${D.counts.thin} in part, ${D.counts.gap} not answered. Pick a competitor above to see the same questions through its site.`;
    }
    body.querySelectorAll('[data-site]').forEach(b => b.addEventListener('click', () => setLens(b.dataset.site)));
    setLens(null);
  };

  /* ------- C2: four small orbits, same angles, one camera ------- */
  R.mountC2 = function () {
    const body = R.varFrame('c2', { pitch: 'side by side: the practice and each competitor as its own small orbit, moving together.',
      headline: 'Four orbits, one per site, turning together.',
      sub: 'Every orbit holds the same 129 questions in the same places, so a subject sits in the same spot in all four. Drag any of them; click a question to compare all four answers below.' });
    const sites = [null].concat(R.SITES);
    body.innerHTML = `<div class="r4v-grid">${sites.map((s, i) => `<div class="r4v-cell"><div class="r4v-cname"><b>${esc(s || D.practice)}</b><span data-cnt="${i}"></span></div><div class="r4v-mini" data-mini="${i}"></div></div>`).join('')}</div><div class="r4v-cmp" data-cmp><p class="r4v-read">Click any question to compare the four answers.</p></div>`;
    const O = sites.map((site, i) => { const o = R.makeOrbit(body.querySelector(`[data-mini="${i}"]`), { key: false, drift: 0, home: { target: new THREE.Vector3(0, 0, 0), radius: 24, yaw: 0.35, pitch: 0.62 } }); o.state.lens = site; o.state.noGhost = true; o.state.locked = true; o.W.sync(); const k = site ? R.siteCounts(site) : own(); body.querySelector(`[data-cnt="${i}"]`).textContent = `${k.covered} in full · ${k.thin} in part`; return o; });
    O.forEach(o => { o.scene.own.labels.forEach(L => L.el.classList.add('mini')); o.scene.own.ringLbls.forEach(L => { L.el.style.display = 'none'; }); o.scene.own.nameLbl.hidden = true; });
    // one camera: whichever orbit was touched last leads, the others copy it every frame
    let lead = 0;
    O.forEach((o, i) => { o.stage.renderer.domElement.addEventListener('pointerdown', () => { lead = i; });
      o.stage.frameHooks.unshift(() => { if (i === lead) return; const a = O[lead].stage.orbit, b = o.stage.orbit; b.target.copy(a.target); b.radius = a.radius; b.yaw = a.yaw; b.pitch = a.pitch; }); });
    const tip = h('<div class="tipcard" style="display:none"></div>'); document.body.appendChild(tip);
    O.forEach((o) => { const cv = o.stage.renderer.domElement;
      cv.addEventListener('pointermove', (e) => { const p = o.stage.wasDrag() ? null : o.stage.pick(e.clientX, e.clientY); if (!p || p.type !== 'question') { tip.style.display = 'none'; return; } const q = QBY[p.id]; const v = vOf(q, o.state.lens);
        tip.innerHTML = `<b>${esc(q.text)}</b><div class="v">${sw(CL[v])}${VERDICT_WORD[v]} · ${esc(o.state.lens || D.practice)}</div>`; tip.style.display = ''; tip.style.left = Math.min(innerWidth - 320, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; });
      cv.addEventListener('pointerleave', () => { tip.style.display = 'none'; });
      cv.addEventListener('click', (e) => { tip.style.display = 'none'; if (o.stage.wasDrag()) return; const p = o.stage.pick(e.clientX, e.clientY); if (!p || p.type !== 'question') return; pickQ(p.id, o); }); });
    function pickQ(id, from) {
      O.forEach(o => { o.state.selected = { type: 'question', id }; o.W.sync(); });
      lead = O.indexOf(from); const f = from.scene.focus([id]); from.stage.flyTo(f.center, 14, f.yaw, f.pitch, 1400);
      const q = QBY[id]; body.querySelector('[data-cmp]').innerHTML = `<div class="r4v-cq"><div class="k">${esc(q.topic)}</div><b>${esc(q.text)}</b></div><div class="r4v-cols">${sites.map(s => { const v = vOf(q, s); const a = s ? q.comps[s] || {} : { title: R.pageTitle(q.page), heading: q.section.heading, text: q.section.text, note: q.note };
        return `<div><div class="nm">${esc(s || D.practice)}</div><div class="vv">${sw(CL[v])}${VERDICT_WORD[v]}</div><div class="pt">${esc(a.title || '')}</div><div class="nt">${esc(a.note || '')}</div></div>`; }).join('')}</div>`;
    }
  };

  /* ------- C3: each competitor as its own layer floating above the practice ------- */
  R.mountC3 = function () {
    const body = R.varFrame('c3', { pitch: 'stacked layers: each competitor as its own named layer above the practice, switchable.',
      headline: 'Each competitor floats as its own layer above the practice.',
      sub: 'The same question sits in the same spot on every layer, so looking straight down a column compares four answers. Switch layers on and off by name; click any point for that site\'s answer.' });
    const GAP = 6;
    const chips = R.SITES.map((s, i) => { const k = R.siteCounts(s); return `<label class="sw-row"><input type="checkbox" data-layer-site="${esc(s)}" checked>${esc(s)} <span class="hint">${k.covered} in full</span></label>`; }).join('');
    body.innerHTML = `<div class="r4v-stage tall" data-card></div><p class="r4v-read">The bottom layer is ${esc(D.practice)}. Above it, nearest first: ${R.SITES.map(esc).join(', ')}.</p>`;
    const O = R.makeOrbit(body.querySelector('[data-card]'), { controls: chips, drift: 0.0075, home: { target: new THREE.Vector3(0, GAP * 1.5, 0), radius: 38, yaw: 0.12, pitch: 0.3 } });
    O.state.layersOn = {}; R.SITES.forEach((s, i) => { const L = O.scene.addLayer(s, GAP * (i + 1)); O.state.layersOn[s] = true; L.nameLbl.anchor = () => L.g.localToWorld(new THREE.Vector3(-11, 0.3, 0)); });
    O.scene.own.nameLbl.anchor = () => new THREE.Vector3(-11, 0.3, 0);
    O.W.sync(); O.stage.flyHome(10);
    body.querySelectorAll('[data-layer-site]').forEach(cb => cb.addEventListener('change', () => { O.state.layersOn[cb.dataset.layerSite] = cb.checked; O.W.sync(); }));
  };
})();
