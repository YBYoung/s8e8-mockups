/* Round 4 (#1417) Tracking: wires the overview chart's controls, as AIV chart 8 does. Keys toggle a line (one always
   stays on) and spotlight it on hover; the scale slides to fit; a readout bar above the plot changes on hover and
   keeps its height; drag across the plot to zoom, Show all to morph back; the lines draw in when first seen. */
(function () {
  const T = window.RA4T; const { el, DRAW, MORPH } = T.motion; const { fmtN } = T.K; const { shapeSvg, KINDS } = T.Moments;

  function mount(host) {
    const card = document.createElement('div'); card.className = 't4-card'; host.appendChild(card);
    card.innerHTML = `<div class="t4-grp" role="group" aria-label="Which questions the lines count"></div><div class="t4-bar"><div class="t4-keys"></div><span class="t4-tools"><span class="t4-hint2">Drag across the chart to zoom in</span>
        <button class="t4-ghost" data-all hidden>Show every week</button><button class="t4-ghost" data-replay>Draw again</button></span></div>
      <div class="t4-readout" aria-live="polite"></div><div class="t4-plot"></div>
      <p class="t4-cap">${T.K.esc(lagLine())}</p>
      <ul class="t4-notes"></ul><button class="t4-ghost t4-more"></button><div class="t4-add"></div><div class="t4-pop"></div><div class="t4-pin" role="dialog" aria-label="Moments"></div>`;
    const c = T.Chart.create(card.querySelector('.t4-plot'));
    T.Moments.attach(c, card); T.Notes.attach(c, card);
    const hint = card.querySelector('.t4-hint2'), readout = card.querySelector('.t4-readout'), keys = card.querySelector('.t4-keys'), showAll = card.querySelector('[data-all]');
    const { tween } = c.tw;

    /* the readout: two fixed lines, text in ink, numbers bold */
    function words(k) {
      const g = T.group(), q = { all: `${g.n} questions`, priority: `${g.n} questions on main services`, other: `${g.n} questions on other services`, practice: `${g.n} practice-level questions` }[g.key];
      const head = k.rebuilt ? `<b>Week of ${T.dayY(k.iso)}</b><span class="t4-tag">estimated</span>` : `<b>Run 1, ${T.dayY(k.iso)}</b><span class="t4-tag m">measured</span>`;
      const ans = `<b>${k.full}</b> answered in full · <b>${k.part}</b> in part · <b>${k.none}</b> not answered, of the ${q}`;
      let two;
      const gs = T.gsc(), gi = gs.imp[k.f], gname = g.key === 'all' ? 'any bank question' : g.label.toLowerCase();
      if (k.rebuilt) two = gi == null ? `Search-level detail from Search Console is saved from ${T.day(T.D.weeks[T.GSC_F0])}, ${T.D.weeks[T.GSC_F0].slice(0, 4)}.`
        : `Searches about ${gname} showed the practice's site <b>${fmtN(gi)}</b> times that week, with <b>${fmtN(gs.clk[k.f])}</b> clicks.`;
      else if (T.S.tracking) two = `Run 2 is due ${T.weekday(T.quote(T.S).next)}, ${T.day(T.quote(T.S).next)}. A rise or fall of 2 or 3 questions between runs is normal and does not mean anything changed.`;
      else two = 'The only measured run so far. With tracking off, no second run is planned.';
      return `<div>${head} · ${ans}</div><div class="two">${two}</div>`;
    }
    const lastKnot = () => { const ks = T.group().knots; return ks[ks.length - 1]; };
    const rest = () => { readout.innerHTML = words(lastKnot()); };

    /* the priority group switch (#1554): which questions the two lines count; the lines morph, the scale slides */
    const grp = card.querySelector('.t4-grp');
    function paintGroups() {
      grp.innerHTML = T.groups.map((g) => { const now = g.knots[g.knots.length - 1]; return `<button type="button" data-grp="${g.key}" aria-pressed="${g.key === T.G.cur}"><b>${T.K.esc(g.label)}</b><span>${now.full} of ${g.n} in full</span></button>`; }).join('');
      grp.querySelectorAll('[data-grp]').forEach((b) => { b.onclick = () => { if (b.dataset.grp === T.G.cur) return; c.setGroup(b.dataset.grp, MORPH); paintGroups(); rest(); }; });
    }
    paintGroups();

    /* keys: the two lines, the three kinds of moment, the practice's own Google */
    c.paintKeys = function () {
      const lone = c.visible().length === 1, lastKind = Object.values(c.kindOn).filter(Boolean).length === 1, S = c.STRIP;
      keys.innerHTML = c.LINES.map((l) => `<button type="button" data-l="${l.id}" aria-pressed="${l.on}" class="${l.on ? '' : 'off'}" ${lone && l.on ? 'aria-disabled="true" data-tip="One line always stays on."' : ''}><i style="border-color:${l.color}"></i>${l.label}</button>`).join('')
        + '<span class="sep"></span>' + KINDS.map((k) => `<button type="button" data-k="${k.id}" aria-pressed="${c.kindOn[k.id]}" class="${c.kindOn[k.id] ? '' : 'off'}" ${lastKind && c.kindOn[k.id] ? 'aria-disabled="true" data-tip="One kind of moment always stays on."' : ''}>${shapeSvg(k.id)}${k.label}</button>`).join('')
        + '<span class="sep"></span>' + [['imp', 'Times seen in Google', c.C.imp], ['clk', 'Clicks', c.C.clk]].map(([m, w, col]) => { const onM = !!S.on[m]; return `<button type="button" data-g="${m}" aria-pressed="${onM}" class="${onM ? '' : 'off'}" data-tip="${onM ? 'Click to hide this line in the strip under the chart.' : 'Shows this line in the strip under the chart, on the same weeks, with its own scale.'}"><i style="border-color:${col}"></i>${w}</button>`; }).join('');
      keys.querySelectorAll('[data-l]').forEach((b) => { b.onclick = () => toggle(b.dataset.l); b.onmouseenter = () => spot(b.dataset.l); b.onmouseleave = () => spot(null); });
      keys.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => toggleKind(b.dataset.k); });
      keys.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => setStrip(b.dataset.g); });
    };
    function toggle(id) {
      const l = c.LINES.find((x) => x.id === id); if (l.on && c.visible().length === 1) return;
      l.on = !l.on; if (l.on) { l.rev = 0; tween(l, 'rev', 1, DRAW * 0.8); } else tween(l, 'rev', 0, DRAW * 0.6);
      tween(c.AX, 'top', c.fitTop(c.AX.to0 ?? c.AX.d0, c.AX.to1 ?? c.AX.d1), MORPH); c.paintKeys();
    }
    const spot = (id) => c.LINES.forEach((l) => tween(l, 'op', !id || l.id === id ? 1 : 0.18, 280));
    function toggleKind(k) {
      if (c.kindOn[k] && Object.values(c.kindOn).filter(Boolean).length === 1) return;
      c.kindOn[k] = !c.kindOn[k]; c.moments().filter((m) => m.kind === k).forEach((m) => { if (m.op === undefined) m.op = c.kindOn[k] ? 0 : 1; tween(m, 'op', c.kindOn[k] ? 1 : 0, 320); });
      c.paintKeys(); c.paintNotes(true);
    }
    function setStrip(m) {
      const S = c.STRIP;
      S.on[m] = !S.on[m]; tween(S, m === 'imp' ? 'opI' : 'opC', S.on[m] ? 1 : 0, 400);
      c.paintKeys();
    }

    /* zoom: the window over the weeks, the scale and the moments morph together */
    c.zoomTo = function (a, b) {
      const end = c.endF(); a = Math.max(0, a); b = Math.min(end, b);
      if (b - a < 5) { const mid = (a + b) / 2; a = Math.max(0, mid - 2.5); b = Math.min(end, a + 5); a = Math.max(0, b - 5); }
      c.AX.to0 = a; c.AX.to1 = b; c.AX.zoomed = a > 0.01 || b < end - 0.01;
      tween(c.AX, 'd0', a, MORPH); tween(c.AX, 'd1', b, MORPH, { done: () => { c.AX.to0 = c.AX.to1 = undefined; } });
      tween(c.AX, 'top', c.fitTop(a, b), MORPH);
      showAll.hidden = !c.AX.zoomed; hint.hidden = c.AX.zoomed; c.paintNotes(true);
    };
    showAll.onclick = () => c.zoomTo(0, c.endF());

    /* hover and drag across both the plot and the strip */
    const guide = el('line', { y1: c.PT, y2: c.SB, stroke: '#475569', 'stroke-dasharray': '2 2', opacity: 0 }, c.gTop);
    const dots = c.LINES.map((l) => el('circle', { r: 4.2, fill: l.color, stroke: '#fff', 'stroke-width': 1.5, opacity: 0 }, c.gTop));
    const sdot = el('circle', { r: 3.6, fill: c.C.imp, stroke: '#fff', 'stroke-width': 1.5, opacity: 0 }, c.gTop);
    const sdotC = el('circle', { r: 3.6, fill: c.C.clk, stroke: '#fff', 'stroke-width': 1.5, opacity: 0 }, c.gTop);
    const brush = el('rect', { y: c.PT, height: c.SB - c.PT, fill: '#0F766E', opacity: 0, rx: 4 }, c.gTop);
    const hits = [[c.PT - 12, c.PB + 4], [c.ST - 6, c.SB + 4]].map(([y0, y1]) => el('rect', { x: c.M.l, y: y0, width: c.PW, height: y1 - y0, fill: 'transparent', class: 't4-cross' }, c.svg));
    const mxOf = (e) => { const r = c.svg.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * c.W; };
    const nearest = (f) => { const ks = T.group().knots; return ks.reduce((b, k) => (Math.abs(k.f - f) < Math.abs(b.f - f) ? k : b), ks[0]); };
    let drag = null;
    function move(e) {
      const mx = mxOf(e);
      if (drag) { brush.setAttribute('x', Math.min(drag, mx)); brush.setAttribute('width', Math.abs(mx - drag)); brush.setAttribute('opacity', 0.08); }
      const k = nearest(c.fAt(mx)), x = c.x(k.f);
      guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('opacity', 1);
      c.LINES.forEach((l, j) => { dots[j].setAttribute('cx', x); dots[j].setAttribute('cy', c.y(l.v(k.f))); dots[j].setAttribute('opacity', l.on && l.rev > 0.99 ? l.op : 0); });
      const S = c.STRIP;
      const has = k.rebuilt && k.f >= S.f0;
      sdot.setAttribute('cx', x); sdot.setAttribute('cy', has ? c.sy(S.imp(k.f)) : 0); sdot.setAttribute('opacity', has ? S.opI : 0);
      sdotC.setAttribute('cx', x); sdotC.setAttribute('cy', has ? c.sy(S.clk(k.f)) : 0); sdotC.setAttribute('opacity', has ? S.opC : 0);
      readout.innerHTML = words(k);
    }
    function leave() { if (drag) return; guide.setAttribute('opacity', 0); dots.forEach((d) => d.setAttribute('opacity', 0)); sdot.setAttribute('opacity', 0); sdotC.setAttribute('opacity', 0); rest(); }
    hits.forEach((h) => { h.addEventListener('mousemove', move); h.addEventListener('mouseleave', leave); h.addEventListener('mousedown', (e) => { drag = mxOf(e); e.preventDefault(); }); });
    window.addEventListener('mouseup', (e) => {
      if (drag == null) return; const a = drag, b = mxOf(e); drag = null; brush.setAttribute('opacity', 0);
      if (Math.abs(b - a) > 12) c.zoomTo(c.fAt(Math.min(a, b)), c.fAt(Math.max(a, b)));
    });

    /* first look: the lines draw in, the strip follows, moments land as the pen passes them */
    function firstLook() {
      c.tw.clear(); Object.assign(c.AX, { d0: 0, d1: c.endF(), to0: undefined, to1: undefined, zoomed: false }); showAll.hidden = true; hint.hidden = false;
      c.LINES.forEach((l) => Object.assign(l, { rev: 0, op: 1, on: true })); Object.assign(c.STRIP, { rev: 0, on: { imp: true, clk: true }, opI: 1, opC: 1 });
      c.AX.top = c.fitTop(); c.moments().forEach((m) => { m.op = 0; });
      c.paintKeys(); c.paintNotes(true); rest(); c.render();
      c.LINES.forEach((l, i) => tween(l, 'rev', 1, DRAW, { delay: 200 + i * 160 }));
      tween(c.STRIP, 'rev', 1, DRAW, { delay: 520 });
      c.moments().forEach((m) => tween(m, 'op', 1, 260, { delay: 200 + DRAW * Math.min(1, m.f / c.AX.d1) }));
    }
    card.querySelector('[data-replay]').onclick = firstLook;
    c.paintKeys(); rest(); c.AX.d1 = c.endF(); c.AX.top = c.fitTop(); c.moments().forEach((m) => { m.op = 0; }); c.render();
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { firstLook(); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(card);
    return c;
  }

  function lagLine() {
    return `The strip under the chart follows the group picked: the practice's own Search Console for searches about that group's questions, times seen (scale on the left) and clicks (scale on the right) each week. Half of the site's pages got their first click within ${T.D.lagMedianWeeks} weeks of Google first seeing them. So a new answer shows up in the strip a few weeks after it shows up in the lines.`;
  }

  T.mountChart = mount;
})();
