/* Relevance Analyzer 3D, round 2 (#1417): the stage (renderer, cinematic camera, picking, editorial labels), the page shell,
   the tour, the time slider and the readers. A scene file supplies build(stage) -> { update(state), focus(ids), home() }. */
(function () {
  const K = window.RA3D2; const { D, Q, QBY, PBY, TBY, LAST, h, esc, fmtWeek, fmtN, VERDICT_WORD, COLORS, verdictAt, dimmed, pagePresent, countsAt, tourStops, sw } = K;
  const easeIO = (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

  /* ------- the stage ------- */
  function makeStage(card, opts) {
    const THREE = window.THREE; const C = COLORS[opts.canvas || 'light']; const W = 10;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(new THREE.Color(opts.clear || C.bg), 1);
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opts.exposure || 1.0;
    if (opts.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap; }
    card.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    if (opts.fog) scene.fog = new THREE.Fog(new THREE.Color(opts.clear || C.bg), opts.fog[0], opts.fog[1]);
    const camera = new THREE.PerspectiveCamera(opts.fov || 36, 1, 0.1, 300);
    const home = Object.assign({ target: new THREE.Vector3(0, 0.4, 0), radius: 22, yaw: -0.6, pitch: 0.42 }, opts.home || {});
    const orbit = { target: home.target.clone(), radius: home.radius, yaw: home.yaw, pitch: home.pitch };
    const goal = { t: 1, ms: 2200, from: null, to: null };
    const labelLayer = h('<div class="ov lbl-layer" style="inset:0;overflow:hidden"></div>'); renderer.domElement.after(labelLayer);
    const stage = {
      THREE, C, W, scene, camera, renderer, card, labelLayer, orbit, home, pickables: [], labels: [], frameHooks: [], drift: opts.drift == null ? 0.018 : opts.drift, idle: true,
      world(x, y, z = 0) { return new THREE.Vector3(x * W, z, -y * W); },
      flyTo(center, radius, yaw, pitch, ms) {
        goal.from = { target: orbit.target.clone(), radius: orbit.radius, yaw: orbit.yaw, pitch: orbit.pitch };
        let y = yaw == null ? orbit.yaw : yaw; while (y - orbit.yaw > Math.PI) y -= 2 * Math.PI; while (y - orbit.yaw < -Math.PI) y += 2 * Math.PI;
        goal.to = { target: center.clone(), radius, yaw: y, pitch: pitch == null ? orbit.pitch : pitch }; goal.t = 0; goal.ms = ms || 2200;
      },
      flyHome(ms) { stage.flyTo(home.target, home.radius, home.yaw, home.pitch, ms || 2400); },
      addLabel(anchor, title, small, cls) {
        const el = h(`<div class="lbl ${cls || ''}"><span class="t">${esc(title)}</span>${small ? `<small>${esc(small)}</small>` : ''}</div>`);
        labelLayer.appendChild(el); const L = { anchor, el, hidden: false, prio: 0 }; stage.labels.push(L); return L;
      },
      project(v) { const p = v.clone().project(camera); const r = renderer.domElement.getBoundingClientRect(); return { x: (p.x + 1) / 2 * r.width, y: (1 - p.y) / 2 * r.height, behind: p.z > 1 }; },
    };
    /* light: a soft sky, a warm key from the front-left, a cool rim from behind. Plausible, never harsh. */
    const hemi = new THREE.HemisphereLight(0xffffff, opts.canvas === 'dark' ? 0x0a0e1a : 0xdbe3ea, opts.canvas === 'dark' ? 0.9 : 1.0); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff6ea, opts.canvas === 'dark' ? 0.8 : 0.9); key.position.set(-10, 16, 12); scene.add(key);
    if (opts.shadows) { key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = key.shadow.camera.bottom = -14; key.shadow.camera.right = key.shadow.camera.top = 14; key.shadow.camera.near = 1; key.shadow.camera.far = 60; key.shadow.bias = -0.0005; key.shadow.radius = 5; }
    const rim = new THREE.DirectionalLight(0xcfe8ff, opts.canvas === 'dark' ? 0.5 : 0.35); rim.position.set(12, 8, -14); scene.add(rim);
    stage.lights = { hemi, key, rim };

    function size() { const r = card.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); if (stage.viewShift) camera.setViewOffset(r.width, r.height, -r.width * stage.viewShift, 0, r.width, r.height); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
    stage.setShift = (v) => { stage.viewShift = v; size(); };
    size(); window.addEventListener('resize', size); stage.resize = size;
    function applyCamera() {
      orbit.pitch = Math.max(0.1, Math.min(1.4, orbit.pitch)); orbit.radius = Math.max(3, Math.min(60, orbit.radius));
      const cp = Math.cos(orbit.pitch), sp = Math.sin(orbit.pitch);
      camera.position.set(orbit.target.x + orbit.radius * cp * Math.sin(orbit.yaw), orbit.target.y + orbit.radius * sp, orbit.target.z + orbit.radius * cp * Math.cos(orbit.yaw));
      camera.lookAt(orbit.target);
    }
    const cv = renderer.domElement; let drag = null, lastMoved = 0;
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, b: e.button, moved: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (_) {} stage.idle = false; });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) { lastMoved = 0; return; } const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      goal.t = 1;
      if (drag.b === 2 || e.shiftKey) { const right = new THREE.Vector3(Math.cos(orbit.yaw), 0, -Math.sin(orbit.yaw)), fwd = new THREE.Vector3(-Math.sin(orbit.yaw), 0, -Math.cos(orbit.yaw)); orbit.target.addScaledVector(right, -dx * orbit.radius * 0.0012).addScaledVector(fwd, dy * orbit.radius * 0.0012); }
      else { orbit.yaw -= dx * 0.005; orbit.pitch += dy * 0.004; }
    });
    cv.addEventListener('pointerup', () => { lastMoved = drag ? drag.moved : 0; drag = null; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => { e.preventDefault(); goal.t = 1; stage.idle = false; orbit.radius *= Math.exp(e.deltaY * 0.001); }, { passive: false });
    // a click only counts when the pointer barely moved between press and release (the click event fires after pointerup)
    stage.wasDrag = () => (drag ? drag.moved : lastMoved) > 6;
    const ray = new THREE.Raycaster(); ray.params.Points = { threshold: 0.3 };
    // only what is actually on screen can be picked: a hidden parent (the rival twin when Competitors is off) hides its beads too
    const shown = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
    stage.pick = (clientX, clientY) => {
      const r = cv.getBoundingClientRect(); const m = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(m, camera); const hits = ray.intersectObjects(stage.pickables.filter(shown), false); if (!hits.length) return null;
      const o = hits[0].object, u = o.userData; if (o.isInstancedMesh && hits[0].instanceId != null) return { type: u.type, id: u.ids[hits[0].instanceId] }; return { type: u.type, id: u.id, site: u.site || null };
    };
    let last = performance.now();
    function frame(now) { try { body(now); } catch (err) { window.RA3D_ERR = String(err && err.stack || err); console.error('RA3D frame error', err); return; } requestAnimationFrame(frame); }
    function body(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (goal.t < 1) { goal.t = Math.min(1, goal.t + dt * 1000 / goal.ms); const k = easeIO(goal.t), f = goal.from, g = goal.to; orbit.target.lerpVectors(f.target, g.target, k); orbit.radius = f.radius + (g.radius - f.radius) * k; orbit.yaw = f.yaw + (g.yaw - f.yaw) * k; orbit.pitch = f.pitch + (g.pitch - f.pitch) * k; }
      else if (stage.idle && !drag && stage.drift) orbit.yaw += stage.drift * dt;
      applyCamera();
      stage.frameHooks.forEach(fn => fn(dt, now)); renderer.render(scene, camera);
      const r = cv.getBoundingClientRect(); const placed = [];
      stage.labels.map(L => { const a = typeof L.anchor === 'function' ? L.anchor() : L.anchor; return { L, p: stage.project(a), d: camera.position.distanceTo(a) }; }).sort((a, b) => (b.L.prio - a.L.prio) || (a.d - b.d)).forEach(({ L, p, d }) => {
        if (!L.w) { L.w = L.el.offsetWidth || 120; L.h = L.el.offsetHeight || 30; }
        let on = !p.behind && p.x > 8 + r.width * (stage.labelMinX || 0) && p.x < r.width - 8 && p.y > 30 && p.y < r.height - 8 && d < 46 && !L.hidden;
        if (on) { const box = { x0: p.x - L.w / 2 - 6, x1: p.x + L.w / 2 + 6, y0: p.y - L.h - 6, y1: p.y + 6 }; if (placed.some(b => b.x0 < box.x1 && b.x1 > box.x0 && b.y0 < box.y1 && b.y1 > box.y0)) on = false; else placed.push(box); }
        L.el.style.opacity = on ? Math.min(1, (46 - d) / 10) : 0; L.el.style.transform = `translate(-50%,-100%) translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
      });
    }
    requestAnimationFrame(frame);
    return stage;
  }

  /* ------- the OpenedQueries light icon rail ------- */
  const I = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const RAIL = `<aside class="oq-rail"><a class="oq-rail-item" title="Expand sidebar">${I('<path d="m9 18 6-6-6-6"/>')}</a><div class="oq-rail-sep"></div>
    <a class="oq-rail-item" title="Home">${I('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>')}</a>
    <a class="oq-rail-item" title="Clients">${I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')}</a>
    <a class="oq-rail-item" title="Content Strategy">${I('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>')}</a>
    <a class="oq-rail-item" title="Production">${I('<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>')}</a>
    <a class="oq-rail-item" title="Audit Hub">${I('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>')}</a><div class="oq-rail-sep"></div>
    <a class="oq-rail-item" title="AI Visibility">${I('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>')}</a>
    <a class="oq-rail-item" title="Market Trends">${I('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>')}</a>
    <a class="oq-rail-item" title="Grid Scan">${I('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>')}</a>
    <a class="oq-rail-item is-active" title="Relevance Analyzer">${I('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>')}</a>
    <a class="oq-rail-item" title="Site Audit">${I('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}</a><div class="oq-rail-sep"></div>
    <a class="oq-rail-item" title="Reports">${I('<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>')}</a>
    <div class="oq-rail-foot"><span class="oq-rail-av">DU<i></i></span></div></aside>`;
  const VBAR = (letter) => `<div class="vbar"><span class="vlbl">#1417 round 2</span><a href="ra-3d-b2-columns.html" ${letter === 'B2' ? 'class="on"' : ''}>B2 Columns</a><a href="ra-3d-d-orbit.html" ${letter === 'D' ? 'class="on"' : ''}>D Orbit</a><a href="ra-3d-e-film.html" ${letter === 'E' ? 'class="on"' : ''}>E Film</a><a href="ra-3d-f-relief.html" ${letter === 'F' ? 'class="on"' : ''}>F Relief map</a><a href="index-relevance-3d.html">Index</a></div>`;
  const TOPBAR = (opts) => `<div class="fl-top"><div class="fl-brand"><span class="fl-mark"><svg viewBox="0 0 24 24"><path d="M3 20 9 9l4 7 3-4 5 8Z"/><circle cx="17" cy="5" r="2"/></svg></span>Relevance Analyzer</div>
    <div class="fl-right"><button class="method-btn" data-method><span class="dot"></span>How it works</button>
      <div class="seg" data-reader-seg><button class="on" data-r="seo">SEO</button><button data-r="present">Presentation</button><button data-r="client">Client report</button></div>
      <button class="btn btn-line only-seo" data-tour>Replay the tour</button><button class="btn btn-go only-seo">Share report</button></div></div>`;
  const MOCKBAR = (opts) => `<div class="mockbar"><b>Mockup, round 2 · Relevance Analyzer 3D, variation ${opts.letter}: ${esc(opts.name)}</b> · ${esc(opts.pitch)} <span class="src">· Data: ${esc(D.practice)}, real crawl of ${fmtWeek(D.crawlDate)} (${D.counts.pages} pages), ${D.counts.questions} questions, verdicts by Haiku 4.5, weekly Search Console and GA4 to ${fmtWeek(D.weeks[LAST])}. The past is rebuilt from when each page first appeared in Google. Nothing here is made up.</span></div>`;

  function headlineHTML(week, reader) {
    const k = countsAt(week); const c = D.counts; const client = reader === 'client'; const now = week === LAST;
    const who = client ? 'Your site' : 'The site', whose = client ? 'your' : 'its';
    return `${who} answers <span class="g">${k.covered} of the ${c.questions}</span> questions ${whose} ideal patients ask in full, ${k.thin} in part, and <span class="r">${k.gap}</span> not at all${now ? '' : ` <span class="asof">(as of the week of ${fmtWeek(D.weeks[week])}, rebuilt)</span>`}.`;
  }

  /* ------- shared wiring: hover, click panel, slider, readers, tour ------- */
  function wire(stage, state, scene, opts, ui) {
    const C = stage.C; const card = stage.card; const cv = stage.renderer.domElement;
    const sync = () => scene.update(state);
    const tip = h('<div class="tipcard" style="display:none"></div>'); document.body.appendChild(tip);
    cv.addEventListener('pointermove', (e) => {
      if (stage.wasDrag() || state.locked) { tip.style.display = 'none'; return; }
      const p = stage.pick(e.clientX, e.clientY); cv.classList.toggle('pick', !!p);
      const key = p ? p.type + p.id : null; if (key !== state.hover) { state.hover = key; state.hoverObj = p; sync(); }
      if (!p) { tip.style.display = 'none'; return; }
      let html = '';
      if (p.type === 'question') { const q = QBY[p.id]; const v = verdictAt(q, state.week); if (state.lens && q.comps && q.comps[state.lens]) { const cv = q.comps[state.lens].verdict; html = `<b>${esc(q.text)}</b><div class="v">${sw(C[cv])}${esc(state.lens)}: ${VERDICT_WORD[cv].toLowerCase()}</div><div class="v">${sw(C[v])}${esc(D.practice)}: ${VERDICT_WORD[v].toLowerCase()}</div>`; } else html = `<b>${esc(q.text)}</b><div class="v">${sw(C[v])}${VERDICT_WORD[v]} · ${esc(q.topic)}${q.comp && q.comp.verdict === 'covered' && q.verdict !== 'covered' && state.reader !== 'client' ? ` · ${esc(q.comp.site)} answers it` : ''}</div><div class="v">click for the detail and the next step</div>`; }
      else if (p.type === 'rival') { const q = QBY[p.id]; const c = p.site && q.comps && q.comps[p.site] ? Object.assign({ site: p.site }, q.comps[p.site]) : q.comp; html = `<b>${esc(q.text)}</b><div class="v">${sw(C.comp)}${esc(c.site)} · ${VERDICT_WORD[c.verdict].toLowerCase()}</div><div class="v">click for their section and how the practice compares</div>`; }
      else if (p.type === 'page') { const pg = PBY[p.id]; html = `<b>${esc(pg.title.split('|')[0].trim())}</b><div class="v">a page of the site · answers ${pg.questions.length} question${pg.questions.length === 1 ? '' : 's'} best · seen ${fmtN(pg.totImp)} times in Google</div>`; }
      else if (p.type === 'comp') { const cp = D.competitorPages[p.id]; html = `<b>${esc(cp.title)}</b><div class="v">${sw(C.comp)}competitor page · ${esc(cp.site)}</div>`; }
      else if (p.type === 'topic') {
        // small, quiet label above the cursor; hidden while a subject is focused (its panel already says it)
        if (state.focusTopic || state.highlightTopic) { tip.style.display = 'none'; return; }
        const t = TBY[p.id]; tip.className = 'tipcard mini'; tip.innerHTML = `${esc(t.name)} <span class="v">· ${t.covered} of ${t.n} in full</span>`;
        tip.style.display = ''; const w = tip.offsetWidth;
        tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX - w / 2)) + 'px'; tip.style.top = (e.clientY - 34) + 'px'; return;
      }
      if (state.selected && p.type === state.selected.type && p.id === state.selected.id) { tip.style.display = 'none'; return; }
      tip.className = 'tipcard';
      tip.innerHTML = html; tip.style.display = '';
      let lx = Math.min(window.innerWidth - 320, e.clientX + 16);
      if (panel) { const pr = panel.getBoundingClientRect(); if (lx + 300 > pr.left) lx = Math.max(8, e.clientX - 316); }
      tip.style.left = lx + 'px'; tip.style.top = (e.clientY + 16) + 'px';
    });
    cv.addEventListener('pointerleave', () => { tip.style.display = 'none'; if (state.hover) { state.hover = null; state.hoverObj = null; sync(); } });

    let panel = null;
    function panelShift() { const cr = card.getBoundingClientRect(); return panel ? -Math.min(0.24, (panel.offsetWidth / 2 + 24) / Math.max(1, cr.width)) : (state.highlightTopic ? -0.16 : 0); }  // negative = scene moves left, clear of a right-hand panel
    function closePanel() { if (panel) { panel.remove(); panel = null; } stage.setShift(panelShift()); state.selected = null; state.scope = state.highlightTopic ? { type: 'topic', id: state.highlightTopic } : { type: 'all' }; ui.history && ui.history.render(); sync(); }
    function openPanel(p) {
      if (!['question', 'page', 'comp', 'rival'].includes(p.type) || (p.type === 'rival' && !(QBY[p.id] && QBY[p.id].comp))) return;
      if (panel) panel.remove(); state.selected = p; panel = h('<div class="panel"></div>');
      if (p.type === 'question') { const q = QBY[p.id]; panel.innerHTML = K.questionPanel(q, state, C); state.scope = { type: 'page', id: q.page }; }
      else if (p.type === 'page') { const pg = PBY[p.id]; panel.innerHTML = K.pagePanel(pg, state, C); state.scope = { type: 'page', id: pg.path }; }
      else if (p.type === 'comp') { panel.innerHTML = K.compPanel(D.competitorPages[p.id], C); }
      else if (p.type === 'rival') { panel.innerHTML = K.rivalPanel(QBY[p.id], state, C, p.site && QBY[p.id].comps ? Object.assign({ site: p.site }, QBY[p.id].comps[p.site]) : null); state.scope = { type: 'page', id: QBY[p.id].page }; }
      panel.querySelector('.x').addEventListener('click', closePanel);
      panel.querySelectorAll('[data-q]').forEach(r => r.addEventListener('click', () => { const q = QBY[r.dataset.q]; openPanel({ type: 'question', id: q.id }); const f = scene.focus([q.id]); stage.flyTo(f.center, f.radius, f.yaw, f.pitch, 1600); }));
      card.appendChild(panel); stage.setShift(panelShift()); ui.history && ui.history.render(); sync();
    }
    cv.addEventListener('click', (e) => {
      if (stage.wasDrag() || state.locked) return; const p = stage.pick(e.clientX, e.clientY); tip.style.display = 'none';
      if (!p) { if (!tour.active) closePanel(); return; }
      if (p.type === 'topic') { ui.selectTopic && ui.selectTopic(p.id); return; }
      endTour(); openPanel(p); stage.idle = false;
      if (p.type === 'question') { const f = scene.focus([p.id]); stage.flyTo(f.center, Math.min(stage.orbit.radius, f.radius), f.yaw, f.pitch, 1500); }
    });
    const tipw = h('<div class="tipcard" style="display:none;width:280px"></div>'); document.body.appendChild(tipw);
    document.addEventListener('pointerover', (e) => { const t = e.target.closest && e.target.closest('[data-tip]'); if (!t) return; tipw.textContent = t.dataset.tip; tipw.style.display = ''; const r = t.getBoundingClientRect(); tipw.style.left = Math.min(window.innerWidth - 300, r.left) + 'px'; tipw.style.top = (r.bottom + 8) + 'px'; });
    document.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest('[data-tip]')) tipw.style.display = 'none'; });

    document.querySelectorAll('[data-layer]').forEach(cb => cb.addEventListener('change', () => { state.layers[cb.dataset.layer] = cb.checked; sync(); }));
    const HEIGHT_NOTE = { demand: 'How often patients search the subject (Search Console, all our practices, 26 weeks).', unmet: 'Demand on the gaps and half answers only: tall is a searched-for question the site does not answer well.', edge: 'Demand where a competitor answers in full and the practice does not: tall is ground a competitor already owns.' };
    const hn = document.querySelector('[data-height-note]'); if (hn) hn.textContent = HEIGHT_NOTE.demand;
    document.querySelectorAll('[data-height] button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('[data-height] button').forEach(x => x.classList.toggle('on', x === b)); state.heightMode = b.dataset.h; if (hn) hn.textContent = HEIGHT_NOTE[b.dataset.h];
      if (b.dataset.h === 'edge' && !state.layers.comp) { state.layers.comp = true; const cb = document.querySelector('[data-layer=comp]'); if (cb) cb.checked = true; }
      sync();
    }));

    const range = document.querySelector('[data-week]'); let playing = null;
    function setWeek(w, quiet) {
      state.week = w; if (range) range.value = w; ui.setHeadline && ui.setHeadline(); ui.history && ui.history.setWeek(w);
      const cnt = document.querySelector('[data-cnt]'), wk = document.querySelector('[data-wk]'); const k = countsAt(w);
      if (cnt) cnt.textContent = `answers ${k.covered} of ${D.counts.questions} in full`; if (wk) wk.textContent = `Week of ${fmtWeek(D.weeks[w])}`;
      if (panel && state.selected && !quiet) openPanel(state.selected); else sync();
    }
    if (range) range.addEventListener('input', () => setWeek(+range.value));
    const playBtn = document.querySelector('[data-play]');
    if (playBtn) playBtn.addEventListener('click', () => { if (playing) { clearInterval(playing); playing = null; return; } if (state.week >= LAST) setWeek(0); playing = setInterval(() => { if (state.week >= LAST) { clearInterval(playing); playing = null; return; } setWeek(state.week + 1); }, 150); });

    const stops = tourStops(); const box = document.querySelector('[data-tourbox]'); const tour = { active: false, i: -1 };
    function showStop(i) {
      tour.active = true; tour.i = i; const s = stops[i]; stage.idle = false;
      state.highlight = new Set(s.ids); state.highlightTopic = s.topic || null;
      const cb = document.querySelector('[data-layer=comp]');
      if (s.comp && state.reader !== 'client') { state.layers.comp = true; if (cb) cb.checked = true; } else if (state.layers.comp) { state.layers.comp = false; if (cb) cb.checked = false; }
      const f = scene.focus(s.ids, s); stage.flyTo(f.center, f.radius, f.yaw, f.pitch, 2400);
      if (box) {
        box.innerHTML = `<div class="tour"><div class="tk">${i + 1} of ${stops.length} · ${esc(s.k)}</div><div class="ts">${esc(state.reader === 'client' ? s.cs : s.s)}</div>
        <div class="tb"><button class="btn btn-line" data-prev ${i === 0 ? 'disabled' : ''}>Back</button><button class="btn btn-go" data-next>${i === stops.length - 1 ? 'Explore freely' : 'Next'}</button><span class="sp">${s.ids.length === 1 ? 'click the lit point for the detail' : 'drag to look around, wheel to come closer'}</span><button class="btn btn-text" data-skip>Skip</button></div></div>`;
        box.querySelector('[data-next]').addEventListener('click', () => i === stops.length - 1 ? endTour(true) : showStop(i + 1));
        box.querySelector('[data-prev]').addEventListener('click', () => showStop(i - 1));
        box.querySelector('[data-skip]').addEventListener('click', () => endTour(true));
      }
      if (s.ids.length === 1 && state.reader !== 'present') setTimeout(() => { if (tour.active && tour.i === i) openPanel({ type: 'question', id: s.ids[0] }); }, 1200);
      else if (panel) { panel.remove(); panel = null; state.selected = null; }
      state.scope = s.topic ? { type: 'topic', id: s.topic } : { type: 'all' }; ui.history && ui.history.render(); ui.markTopic && ui.markTopic(state.highlightTopic);
      sync();
    }
    function endTour(fly) {
      if (!tour.active) return; tour.active = false; state.highlight = null; state.highlightTopic = null; if (box) box.innerHTML = '';
      if (fly) { stage.flyHome(2400); stage.idle = true; if (panel) closePanel(); }
      if (box) { box.innerHTML = state.reader === 'present' ? `<div class="tour"><div class="tk">Free flight</div><div class="ts" style="font-size:18px">Drag to look around, wheel to come closer, click any point.</div><div class="tb"><button class="btn btn-go" data-tour2>Replay the tour</button></div></div>` : ''; box.querySelector('[data-tour2]')?.addEventListener('click', () => showStop(0)); }
      state.scope = { type: 'all' }; ui.history && ui.history.render(); ui.markTopic && ui.markTopic(null); sync();
    }
    document.querySelector('[data-tour]')?.addEventListener('click', () => { closePanel(); showStop(0); });
    document.querySelectorAll('[data-reader-seg] button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('[data-reader-seg] button').forEach(x => x.classList.toggle('on', x === b));
      state.reader = b.dataset.r; document.body.dataset.reader = state.reader; if (state.week !== LAST) setWeek(LAST, true);
      if (state.reader === 'client' && state.layers.comp) { state.layers.comp = false; const cb = document.querySelector('[data-layer=comp]'); if (cb) cb.checked = false; }
      ui.setHeadline && ui.setHeadline(); stage.resize(); if (panel) closePanel();
      if (ui.onReader) ui.onReader(state.reader); else if (state.reader === 'present') showStop(0); else if (tour.active) showStop(tour.i); else sync();
    }));
    document.querySelector('[data-method]')?.addEventListener('click', () => K.methodWindow(opts.method));
    return { sync, openPanel, closePanel, setWeek, showStop, endTour, tour, stops };
  }

  /* ------- the page layout (B2, D, F) ------- */
  function mount(opts) {
    const C = COLORS[opts.canvas || 'light']; const c = D.counts;
    document.body.dataset.reader = 'seo'; document.body.className = opts.bodyClass || '';
    document.body.innerHTML = `${RAIL}${MOCKBAR(opts)}
      <div class="fl-app"><div class="fl-main"><div class="fl-wrap">${TOPBAR(opts)}
        <div class="hdr"><div><div class="kick">${esc(D.practice)} <span class="m">· ${esc(D.city)}, ${esc(D.state)} · ${c.questions} questions patients ask · ${c.pages} pages · crawl ${fmtWeek(D.crawlDate)}${D.builtWithoutPriorities ? '<span class="only-internal"> · built without the client\'s priorities</span>' : ''}</span></div>
          <h1 class="h1" data-headline></h1><p class="sub" data-sub></p>
          <div class="client-note">${esc(opts.clientNote || 'This is how we measure your website against the questions your ideal patients ask. Teal is a question your site answers in full, pale teal a partial answer, grey a gap. Click any point for the detail.')}</div></div>
          <div class="facts only-seo"><div><b>${sw(C.covered)}${c.covered}</b><span>answered in full</span></div><div><b>${sw(C.thin)}${c.thin}</b><span>half answered</span></div><div><b>${sw(C.gap)}${c.gap}</b><span>gaps</span></div><div><b>${c.compWins}</b><span>a competitor answers, the site does not</span></div><div><b>${c.localPass} of ${c.local}</b><span>local questions fully lit</span></div></div></div>
        <div class="stage-card ${opts.canvas === 'dark' ? 'dark' : ''}" data-stage>
          <div class="ov ov-tl"><div class="key"><span class="ro">${sw(C.covered)}Answered in full</span><span class="ro">${sw(C.thin)}Half answered</span><span class="ro">${sw(C.gap)}Gap</span>${opts.keyExtra || ''}</div></div>
          <div class="ov ov-tr"><div class="ctl">
            <label class="only-seo sw-row"><input type="checkbox" data-layer="comp"><span class="sw" style="background:${C.comp}"></span>Competitors <span class="hint tipword" data-tip="${esc(opts.compTip || `The pages of ${D.competitors.map(x => x.site).join(', ')}. A violet mark on a question means a competitor answers it in full where the practice does not.`)}">3 sites</span></label>
            <label class="sw-row"><input type="checkbox" data-layer="local" checked><span class="sw ring" style="color:${C.covered}"></span>Local evidence <span class="hint tipword" data-tip="Questions about choosing or visiting a dentist nearby light fully only when the answering page shows the city in its title and a phone number or street address. Off: light by the answer alone.">dims</span></label>
            ${opts.heightToggle ? `<div class="ctl-h"><span class="lh">${esc(opts.heightWord || 'Height')}</span><div class="seg" data-height><button class="on" data-h="demand">Demand</button><button data-h="unmet">Unmet</button><button data-h="edge">Competitor edge</button></div><div class="hint" data-height-note></div></div>` : ''}
          </div></div>
          <div class="ov ov-bl" data-tourbox></div>
          <div class="ov ov-bot"><div class="timebar"><button class="play" data-play aria-label="Play"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg></button><span class="wk" data-wk></span><input type="range" min="0" max="${LAST}" value="${LAST}" data-week><span class="cnt" data-cnt></span><span class="honest tipword" data-tip="There is one crawl. A page appears the first week Search Console saw it, and the questions it answers light up then. Once runs are weekly or monthly, each run keeps its own verdicts and this slider shows real history.">rebuilt from when each page first appeared in Google</span></div></div>
        </div>
        <div class="below"><div class="grid2"><div class="card" data-history></div>
          <div class="card"><div class="ch"><div><h2>By subject</h2><div class="cs">Click a subject to go there. Counts, never percentages: 13 questions per main service, 6 per other service.</div></div></div><div data-subjects style="margin-top:8px"></div></div></div></div>
      </div></div></div>${VBAR(opts.letter)}`;
    const card = document.querySelector('[data-stage]');
    const stage = makeStage(card, opts); window.RA3D_STAGE = stage;
    const state = { week: LAST, heightMode: 'demand', layers: { comp: false, local: true }, highlight: null, highlightTopic: null, selected: null, hover: null, reader: 'seo', scope: { type: 'all' } };
    stage.state = state; stage.data = D; stage.K = K;
    const scene = opts.build(stage);
    const headline = document.querySelector('[data-headline]'), sub = document.querySelector('[data-sub]');
    const ui = {};
    ui.setHeadline = () => { headline.innerHTML = headlineHTML(state.week, state.reader); sub.textContent = state.reader === 'client' ? (opts.clientSub || `Measured on the questions patients in ${D.city} ask about the services you offer, against every page of your website.`) : opts.sub; };
    ui.history = K.historyPanel(document.querySelector('[data-history]'), state, (w) => W.setWeek(w));
    const subj = document.querySelector('[data-subjects]');
    ui.markTopic = (name) => subj.querySelectorAll('.subj').forEach(x => x.classList.toggle('on', x.dataset.t === name));
    ui.selectTopic = (name) => {
      W.endTour(); W.closePanel(); const on = state.highlightTopic === name;
      state.highlightTopic = on ? null : name; state.highlight = on ? null : new Set(Q.filter(q => q.topic === name).map(q => q.id)); ui.markTopic(state.highlightTopic);
      state.scope = on ? { type: 'all' } : { type: 'topic', id: name }; ui.history.render();
      if (on) stage.flyHome(2000); else { const f = scene.focus(Array.from(state.highlight), { topic: name }); stage.flyTo(f.center, f.radius, f.yaw, f.pitch, 2000); }
      stage.idle = false; W.sync(); window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    D.topics.slice().sort((a, b) => (a.tier === b.tier ? b.demand - a.demand : a.tier === 'priority' ? -1 : b.tier === 'priority' ? 1 : a.tier === 'other' ? -1 : 1)).forEach(t => {
      const b = h(`<button class="subj" data-t="${esc(t.name)}"><span class="nm">${esc(t.name)}<small>${t.tier === 'priority' ? 'main service' : t.tier === 'other' ? 'other service' : 'practice level'}${t.compWins ? `<span class="only-internal"> · a competitor answers ${t.compWins}</span>` : ''}</small></span><span style="display:flex;align-items:center;gap:10px"><span class="sq">${Array.from({ length: t.covered }, () => `<i style="background:${C.covered}"></i>`).join('')}${Array.from({ length: t.thin }, () => `<i style="background:${C.thin}"></i>`).join('')}${Array.from({ length: t.gap }, () => `<i style="background:${C.gap}"></i>`).join('')}</span><span class="cnt">answers ${t.covered} of ${t.n}</span></span></button>`);
      b.addEventListener('click', () => ui.selectTopic(t.name)); subj.appendChild(b);
    });
    const W = wire(stage, state, scene, opts, ui);
    ui.setHeadline(); ui.history.render(); W.setWeek(LAST, true);
    setTimeout(() => W.showStop(0), 900);
    return { stage, state, wire: W };
  }

  window.RA3D2.kit = { makeStage, mount, wire, RAIL, VBAR, TOPBAR, MOCKBAR, headlineHTML, easeIO };
})();
