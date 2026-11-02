/* Round 4 (#1417) Tracking: draws the overview chart every frame, after the approved AIV chart 8.
   Two 2px monotone lines (answered in full, answered in part) on the 129-question scale, a soft area under the lead,
   hairline grid, the rebuilt stretch washed and named, the measured run cased with a breathing dot, a moments lane,
   and the practice's own Google in a strip below on the same dates (never a second scale on the same plot). */
(function () {
  const T = window.RA4T; const { el, curve, tweener, RM } = T.motion; const K = T.K;
  const C = { ink: '#0B1020', muted: '#667085', faint: '#98A2B3', line: '#E7E9EE', grid: '#EEF0F3', wash: '#F7F8FA', slate: '#475569',
    full: K.COLORS.light.covered, part: K.COLORS.light.thin, imp: '#6D28D9', clk: '#DB5FA0', a: '#0F766E', aInk: '#115E59' };
  const W = 880, M = { l: 40, r: 104 }, PT = 52, PB = 262, LANE = 281, XL = 304, ST = 338, SB = 398, H = 410, PW = W - M.l - M.r, SAMPLES = 240;
  const niceTop = (v, n = T.group().n) => Math.min(n, [5, 10, 20, 30, 40, 60, 80, 100, 120, 150].find((x) => v <= x) || n);
  /** One priority group's two answer lines as curves over the weeks. */
  const fnsOf = (g) => { const xs = g.knots.map((k) => k.f); return { full: curve(xs, g.knots.map((k) => k.full)), part: curve(xs, g.knots.map((k) => k.part)) }; };

  function create(host) {
    const c = { C, W, H, M, PT, PB, LANE, ST, SB, PW, hooks: [] };
    const f0 = fnsOf(T.group());
    c.LINES = [
      { id: 'full', label: 'Answered in full', end: 'in full', color: C.full, width: 2.5, rev: 0, op: 1, on: true },
      { id: 'part', label: 'Answered in part', end: 'in part', color: C.part, width: 2, rev: 0, op: 1, on: true },
    ];
    /* each line blends from the group it was showing (a) to the one picked (b), so a group switch morphs */
    c.LINES.forEach((l) => { l.a = l.b = f0[l.id]; l.mix = 1; l.v = (f) => l.a(f) * (1 - l.mix) + l.b(f) * l.mix; });
    /* one group's Search Console as two curves on their own 0-1 scales, from the first saved week */
    const stripOf = (key) => { const s = T.gsc(key), xs = [], I = [], Cl = [];
      s.imp.forEach((v, i) => { if (v != null) { xs.push(i); I.push(v); Cl.push(s.clk[i]); } });
      const mI = Math.max(1, ...I), mC = Math.max(1, ...Cl);
      return { max: { imp: mI, clk: mC }, imp: curve(xs, I.map((v) => v / mI)), clk: curve(xs, Cl.map((v) => v / mC)) }; };
    const s0 = stripOf(T.G.cur);
    /* the practice's own Search Console, as Search Console shows it: times seen (scale on the left) and clicks (scale on
       the right) together, each switchable (owner 11/1: same source, same weeks, one strip) */
    c.STRIP = { id: 'strip', on: { imp: true, clk: true }, opI: 1, opC: 1, rev: 0, max: s0.max, f0: T.GSC_F0, a: s0, b: s0, mix: 1 };
    /* switching group blends the strip like the lines (owner 11/1: Search Console follows the group picked) */
    c.STRIP.imp = (f) => c.STRIP.a.imp(f) * (1 - c.STRIP.mix) + c.STRIP.b.imp(f) * c.STRIP.mix;
    c.STRIP.clk = (f) => c.STRIP.a.clk(f) * (1 - c.STRIP.mix) + c.STRIP.b.clk(f) * c.STRIP.mix;
    c.AX = { id: 'ax', d0: 0, d1: T.MEAS_F + 1.2, top: 60 };
    c.tw = tweener(() => c.render());
    c.endF = () => (T.S.tracking && T.quote(T.S).next ? T.fOf(T.quote(T.S).next) + 0.9 : T.MEAS_F + 1.2);
    c.visible = () => c.LINES.filter((l) => l.on);
    c.fitTop = (d0 = c.AX.d0, d1 = c.AX.d1, fns) => { let m = 0; c.visible().forEach((l) => { const v = fns ? fns[l.id] : l.v; for (let k = 0; k <= 60; k++) m = Math.max(m, v(d0 + (d1 - d0) * k / 60)); }); return niceTop(m + 2); };
    c.x = (f) => M.l + ((f - c.AX.d0) / (c.AX.d1 - c.AX.d0)) * PW;
    c.y = (v) => PT + (1 - v / c.AX.top) * (PB - PT);
    c.sy = (u) => ST + (1 - u) * (SB - ST);
    c.fAt = (mx) => c.AX.d0 + ((mx - M.l) / PW) * (c.AX.d1 - c.AX.d0);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', class: 't4-svg',
      'aria-label': `${T.group().label}: questions answered in full and in part, week by week, estimated before the measured run of Nov 1, 2026` }, host);
    c.svg = svg;
    const defs = el('defs', {}, svg);
    const glow = el('filter', { id: 't4glow', x: '-2', y: '-2', width: '5', height: '5' }, defs); el('feGaussianBlur', { stdDeviation: 3 }, glow);
    const clip = el('clipPath', { id: 't4clip' }, defs); el('rect', { x: M.l, y: 0, width: PW + 1, height: H }, clip);
    const grad = el('linearGradient', { id: 't4fade', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
    c.gradStop0 = el('stop', { offset: '0%', 'stop-color': C.full, 'stop-opacity': 0.16 }, grad); c.gradStop1 = el('stop', { offset: '100%', 'stop-color': C.full, 'stop-opacity': 0 }, grad);
    const sgrad = el('linearGradient', { id: 't4sfade', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
    c.sStop0 = el('stop', { offset: '0%', 'stop-color': C.imp, 'stop-opacity': 0.14 }, sgrad); c.sStop1 = el('stop', { offset: '100%', 'stop-color': C.imp, 'stop-opacity': 0 }, sgrad);
    c.gZone = el('g', { 'clip-path': 'url(#t4clip)' }, svg); c.gGrid = el('g', {}, svg); c.gAxis = el('g', {}, svg);
    c.gLines = el('g', { 'clip-path': 'url(#t4clip)' }, svg); c.gStrip = el('g', { 'clip-path': 'url(#t4clip)' }, svg);
    c.gMom = el('g', {}, svg); c.gTop = el('g', {}, svg); c.gHead = el('g', {}, svg);
    c.title = el('text', { x: M.l, y: 15, class: 't4-ct' }, svg);
    const titleOf = (g) => `${g.label.toUpperCase()}: QUESTIONS ANSWERED, OUT OF ${g.n}`;
    c.title.textContent = titleOf(T.group());
    /** Switch the priority group: the lines morph to the new counts and the scale slides to fit. */
    c.setGroup = (key, MORPH) => {
      T.G.cur = key; const g = T.group(), nf = fnsOf(g);
      c.LINES.forEach((l) => { const a = l.a, b = l.b, m = l.mix; l.a = (f) => a(f) * (1 - m) + b(f) * m; l.b = nf[l.id]; l.mix = 0; c.tw.tween(l, 'mix', 1, MORPH); });
      c.tw.tween(c.AX, 'top', c.fitTop(c.AX.to0 ?? c.AX.d0, c.AX.to1 ?? c.AX.d1, nf), MORPH);
      // freeze the blend shown right now (its own a, b and mix), so the new blend never points back at itself
      const S = c.STRIP, a0 = S.a, b0 = S.b, m0 = S.mix, nx = stripOf(key);
      S.a = { imp: (f) => a0.imp(f) * (1 - m0) + b0.imp(f) * m0, clk: (f) => a0.clk(f) * (1 - m0) + b0.clk(f) * m0 }; S.b = nx; S.max = nx.max; S.mix = 0; c.tw.tween(S, 'mix', 1, MORPH);
      c.title.textContent = titleOf(g); svg.setAttribute('aria-label', `${g.label}: questions answered in full and in part, week by week, estimated before the measured run of Nov 1, 2026`);
    };
    c.area = el('path', { fill: 'url(#t4fade)' }, c.gLines);
    c.LINES.forEach((l) => {
      const cp = el('clipPath', { id: `t4cp-${l.id}` }, defs); l.clip = el('rect', { x: M.l - 6, y: 0, height: H }, cp);
      l.g = el('g', { 'clip-path': `url(#t4cp-${l.id})` }, c.gLines);
      l.case = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': l.width + 3, 'stroke-linejoin': 'round' }, l.g);
      l.path = el('path', { fill: 'none', stroke: l.color, 'stroke-width': l.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, l.g);
      l.pulse = el('circle', { r: 4, class: 't4-pulse', fill: l.color }, c.gTop); l.pulse.style.display = 'none';
      l.endDot = el('circle', { r: 4.5, fill: l.color, stroke: '#fff', 'stroke-width': 2, opacity: 0 }, c.gTop);
      l.pen = el('circle', { r: 5, filter: 'url(#t4glow)', fill: l.color, opacity: 0 }, c.gTop);
      l.lab = el('text', { class: 't4-endlab', opacity: 0 }, c.gTop);
    });
    const scp = el('clipPath', { id: 't4cp-strip' }, defs); c.STRIP.clip = el('rect', { x: M.l - 6, y: 0, height: H }, scp);
    const sg = el('g', { 'clip-path': 'url(#t4cp-strip)' }, c.gStrip);
    c.STRIP.area = el('path', { fill: 'url(#t4sfade)' }, sg);
    c.STRIP.path = el('path', { fill: 'none', stroke: C.imp, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sg);
    c.STRIP.pathC = el('path', { fill: 'none', stroke: C.clk, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sg);
    c.STRIP.endDot = el('circle', { r: 4, fill: C.imp, stroke: '#fff', 'stroke-width': 2, opacity: 0 }, c.gTop);
    c.STRIP.endDotC = el('circle', { r: 4, fill: C.clk, stroke: '#fff', 'stroke-width': 2, opacity: 0 }, c.gTop);
    c.render = () => render(c);
    return c;
  }

  const pathOf = (c, f, a, b, Y) => { let d = ''; for (let k = 0; k <= SAMPLES; k++) { const ff = a + (b - a) * k / SAMPLES; d += `${k ? 'L' : 'M'}${c.x(ff).toFixed(1)},${Y(f(ff)).toFixed(1)}`; } return d; };

  function render(c) {
    const { AX, LINES, STRIP } = c; const D = T.D;
    c.gZone.innerHTML = ''; c.gGrid.innerHTML = ''; c.gAxis.innerHTML = ''; c.gHead.innerHTML = '';
    /* the rebuilt stretch, washed and named; the measured run on its own hairline */
    const xr0 = c.x(0), xr1 = c.x(K.LAST), xm = c.x(T.MEAS_F);
    el('rect', { x: xr0, y: PT - 6, width: Math.max(0, xr1 - xr0), height: PB - PT + 6, fill: C.wash }, c.gZone);
    const b0 = Math.max(M.l, xr0), b1 = Math.min(M.l + PW, xr1);
    if (b1 - b0 > 30) {
      el('path', { d: `M${b0},40V36H${b1}V40`, fill: 'none', stroke: '#C9CED8' }, c.gHead);
      if (b1 - b0 > 330) el('text', { x: b0 + 8, y: 31, class: 't4-zone' }, c.gHead).textContent = 'ESTIMATED FROM WHEN GOOGLE FIRST SAW EACH PAGE';
      else el('text', { x: b0 + 4, y: 31, class: 't4-zone' }, c.gHead).textContent = 'ESTIMATED';
    }
    if (xm >= M.l - 1 && xm <= M.l + PW + 1) {
      el('line', { x1: xm, x2: xm, y1: 36, y2: PB, stroke: '#C9CED8', 'stroke-dasharray': '2 3' }, c.gHead);
      el('text', { x: xm + 8, y: 31, class: 't4-zone t4-zone-m' }, c.gHead).textContent = 'MEASURED';
    }
    const nq = T.S.tracking ? T.quote(T.S).next : null, xn = nq ? c.x(T.fOf(nq)) : -1;
    if (nq && xn >= M.l && xn <= M.l + PW + 1) el('line', { x1: xn, x2: xn, y1: PT, y2: PB, stroke: C.a, 'stroke-dasharray': '1.5 3', opacity: 0.55 }, c.gHead);
    /* grid and scales */
    const step = AX.top <= 10 ? 5 : AX.top <= 40 ? 10 : AX.top <= 100 ? 20 : 40;
    const ticks = []; for (let v = 0; v <= AX.top + 0.01; v += step) ticks.push(v); if (AX.top > 101 && ticks[ticks.length - 1] < AX.top - 4) ticks.push(AX.top);
    ticks.forEach((v) => { el('line', { x1: M.l, x2: M.l + PW, y1: c.y(v), y2: c.y(v), stroke: C.grid }, c.gGrid); el('text', { x: M.l - 8, y: c.y(v) + 4, class: 't4-ax', 'text-anchor': 'end' }, c.gGrid).textContent = Math.round(v); });
    xTicks(c);
    /* the answer lines */
    const fEnd = Math.min(AX.d1, T.MEAS_F), fStart = Math.max(AX.d0, 0);
    const lead = LINES.find((l) => l.on && l.rev > 0.01) || LINES[0];
    const labs = [];
    LINES.forEach((l) => {
      const reach = M.l + (c.x(fEnd) - M.l) * l.rev + 6;
      l.clip.setAttribute('width', l.rev < 0.005 ? 0 : Math.max(0, reach - M.l + 6));
      const d = fEnd > fStart ? pathOf(c, l.v, fStart, fEnd, c.y) : '';
      l.case.setAttribute('d', d); l.path.setAttribute('d', d); l.g.setAttribute('opacity', l.op);
      if (l === lead && d) { c.area.setAttribute('d', `${d}L${c.x(fEnd).toFixed(1)},${PB}L${c.x(fStart).toFixed(1)},${PB}Z`); c.area.setAttribute('clip-path', `url(#t4cp-${l.id})`); c.area.setAttribute('opacity', l.op); c.gradStop0.setAttribute('stop-color', l.color); c.gradStop1.setAttribute('stop-color', l.color); }
      const inView = T.MEAS_F <= AX.d1 + 0.01 && T.MEAS_F >= AX.d0, done = l.rev > 0.995;
      const ex = c.x(T.MEAS_F), ey = c.y(l.v(T.MEAS_F));
      [l.endDot, l.pulse].forEach((d0) => { d0.setAttribute('cx', ex); d0.setAttribute('cy', ey); });
      l.endDot.setAttribute('opacity', done && inView ? l.op : 0);
      l.pulse.style.display = done && inView && l.op > 0.9 && !RM ? '' : 'none';
      const px = Math.min(c.x(fEnd), reach - 6);
      l.pen.setAttribute('cx', px); l.pen.setAttribute('cy', c.y(l.v(c.fAt(px)))); l.pen.setAttribute('opacity', l.rev > 0.01 && l.rev < 0.99 ? 0.9 * l.op : 0);
      if (done && inView && l.op > 0.05) labs.push({ l, y0: ey, x: ex });
    });
    labs.sort((a, b) => a.y0 - b.y0).forEach((r, i, all) => { r.y = i ? Math.max(r.y0, all[i - 1].y + 16) : r.y0; });
    LINES.forEach((l) => { const r = labs.find((q) => q.l === l); l.lab.setAttribute('opacity', r ? l.op : 0); if (r) { l.lab.setAttribute('x', r.x + 11); l.lab.setAttribute('y', r.y + 4); l.lab.innerHTML = `<tspan class="n">${Math.round(l.v(T.MEAS_F))}</tspan> ${l.end}`; } });
    renderStrip(c);
    c.hooks.forEach((h) => h());
  }

  function xTicks(c) {
    const { AX } = c; const span = AX.d1 - AX.d0, out = [];
    if (span <= 12) { const every = span <= 6 ? 1 : 2; for (let i = Math.ceil(AX.d0); i <= Math.min(K.LAST, AX.d1); i += every) out.push([i, T.day(T.D.weeks[i])]); }
    else {
      const starts = []; for (let i = 1; i <= K.LAST; i++) if (T.D.weeks[i].slice(5, 7) !== T.D.weeks[i - 1].slice(5, 7)) starts.push(i);
      const inV = starts.filter((i) => i >= AX.d0 && i <= AX.d1), every = Math.max(1, Math.ceil(inV.length / 7));
      inV.forEach((i, j) => { if (j % every) return; const iso = T.D.weeks[i], mon = T.monY(iso).slice(0, 3); out.push([i, j === 0 || iso.slice(5, 7) === '01' ? `${mon} ${iso.slice(0, 4)}` : mon]); });
    }
    out.forEach(([f, t]) => { const x = c.x(f); if (x < M.l + 10 || x > c.x(T.MEAS_F) - 34) return;
      el('line', { x1: x, x2: x, y1: XL - 16, y2: XL - 12, stroke: '#D1D5DB' }, c.gAxis);
      el('text', { x, y: XL, class: 't4-ax', 'text-anchor': 'middle' }, c.gAxis).textContent = t; });
    const xm = c.x(T.MEAS_F);
    if (xm >= M.l && xm <= M.l + PW + 2) el('text', { x: xm, y: XL, class: 't4-ax t4-ax-b', 'text-anchor': 'middle' }, c.gAxis).textContent = 'Nov 1';
  }

  function renderStrip(c) {
    const S = c.STRIP; const { AX } = c; const any = S.opI > 0.05 || S.opC > 0.05;
    const g = T.group(), about = g.key === 'all' ? 'SEARCHES ABOUT ANY BANK QUESTION' : `SEARCHES ABOUT ${g.label.toUpperCase()}`;
    const head = S.on.imp && S.on.clk ? 'TIMES SEEN AND CLICKS PER WEEK' : S.on.clk ? 'CLICKS PER WEEK' : 'TIMES SEEN PER WEEK';
    el('text', { x: M.l, y: ST - 14, class: 't4-ct' }, c.gAxis).textContent = any ? `${about}: ${head} · OWN SEARCH CONSOLE` : "THE PRACTICE'S OWN GOOGLE · SWITCHED OFF";
    el('line', { x1: M.l, x2: M.l + PW, y1: SB, y2: SB, stroke: C.grid }, c.gAxis);
    el('line', { x1: M.l, x2: M.l + PW, y1: ST, y2: ST, stroke: C.grid, opacity: any ? 1 : 0.4 }, c.gAxis);
    const k = (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v);
    /* each scale in its own line's colour: times seen on the left, clicks on the right, as in Search Console */
    if (S.opI > 0.05) { el('text', { x: M.l - 8, y: ST + 4, class: 't4-ax', 'text-anchor': 'end', style: `fill:${C.imp}`, opacity: S.opI }, c.gAxis).textContent = k(S.max.imp); el('text', { x: M.l - 8, y: SB + 4, class: 't4-ax', 'text-anchor': 'end' }, c.gAxis).textContent = '0'; }
    if (S.opC > 0.05) { el('text', { x: M.l + PW + 8, y: ST + 4, class: 't4-ax', style: `fill:${C.clk}`, opacity: S.opC }, c.gAxis).textContent = k(S.max.clk); el('text', { x: M.l + PW + 8, y: SB + 4, class: 't4-ax' }, c.gAxis).textContent = '0'; }
    const a = Math.max(S.f0, AX.d0), b = Math.min(K.LAST, AX.d1);
    /* before the first saved week: say so in the strip, never draw it as zero */
    const xf = c.x(S.f0);
    if (any && xf > M.l + 60) el('text', { x: M.l + 6, y: (ST + SB) / 2 + 4, class: 't4-ax' }, c.gAxis).textContent = `Search-level detail saved from ${T.day(T.D.weeks[S.f0])}, ${T.D.weeks[S.f0].slice(0, 4)}`;
    S.clip.setAttribute('width', S.rev < 0.005 ? 0 : Math.max(0, (c.x(b) - M.l + 8) * S.rev + 4));
    const dI = b > a ? pathOf(c, S.imp, a, b, c.sy) : '', dC = b > a ? pathOf(c, S.clk, a, b, c.sy) : '';
    S.path.setAttribute('d', dI); S.path.setAttribute('opacity', S.opI);
    S.pathC.setAttribute('d', dC); S.pathC.setAttribute('opacity', S.opC);
    S.area.setAttribute('d', dI ? `${dI}L${c.x(b).toFixed(1)},${SB}L${c.x(a).toFixed(1)},${SB}Z` : ''); S.area.setAttribute('opacity', S.opI);
    const showEnd = S.rev > 0.995 && K.LAST <= AX.d1 && K.LAST >= AX.d0;
    S.endDot.setAttribute('cx', c.x(K.LAST)); S.endDot.setAttribute('cy', c.sy(S.imp(K.LAST))); S.endDot.setAttribute('opacity', showEnd ? S.opI : 0);
    S.endDotC.setAttribute('cx', c.x(K.LAST)); S.endDotC.setAttribute('cy', c.sy(S.clk(K.LAST))); S.endDotC.setAttribute('opacity', showEnd ? S.opC : 0);
  }

  T.Chart = { create, C };
})();
