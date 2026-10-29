/* Round 2 of Tracking line charts (owner 10/29 picked "Day and week lines"; "we're going for a clean look").
   Built from the approved charts: Performance page (readout bar above, thin monotone lines, no dots, hover cursor,
   drag to read a stretch) and Topic Cards Demand chart (lead line with white casing + end dot, soft area, range
   zoom by transform, dashed hover guide with a dot per line), plus the dataviz mark specs (2px lines, hairline solid
   grid, text in ink, legend + selective end labels, small multiples past 4 converging series). */
(function () {
  const T = window.TRK;
  const W = 760, H = 230, PL = 44, PR = 96, PT = 16, PB = 28, D = 56, PW = W - PL - PR;
  const md = (d) => new Date(2026, 10, 1 + Math.round(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const wd = (d) => new Date(2026, 10, 1 + Math.round(d)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const mon = (d) => new Date(2026, 10, 1 + Math.round(d)).toLocaleDateString('en-US', { month: 'short' });
  const span = (a, b) => (a === b ? md(a) : mon(a) === mon(b) ? `${md(a)} to ${new Date(2026, 10, 1 + b).getDate()}` : `${md(a)} to ${md(b)}`);
  const avg = (a) => a.reduce((t, v) => t + v, 0) / a.length;
  const range = (per100, n) => { const p = per100 / 100, z = 1.96, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)); return [Math.round(((c - m) / d) * 100), Math.round(((c + m) / d) * 100)]; };
  const N = { all: 258, chatgpt: 42, gemini: 54, aio: 54, aimode: 54, perplexity: 54 };
  const AIS = T.AIS.map((a) => ({ ...a, dot: a.key === 'perplexity' ? '#0891B2' : a.dot }));

  let s = 11; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 - 0.5; };
  const SER = {}; AIS.forEach((a) => { SER[a.key] = a.w.flatMap((v) => Array.from({ length: 7 }, () => Math.max(1, Math.min(95, v + rnd() * 26)))); });
  SER.all = Array.from({ length: D }, (_, d) => avg(AIS.map((a) => SER[a.key][d])));
  const weeks = (k) => Array.from({ length: 8 }, (_, i) => avg(SER[k].slice(7 * i, 7 * i + 7)));
  /** Week line points: mid-week, held flat to the first and last day so it spans the chart like the day line. */
  const weekPts = (k) => { const w = weeks(k); return [[0, w[0]], ...w.map((v, i) => [7 * i + 3, v]), [D - 1, w[7]]]; };
  const weekAt = (k, d) => weeks(k)[Math.min(7, Math.floor(d / 7))];

  function smooth(pts) {
    let p = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const k = (a, b, c) => Math.max(Math.min(a, c), Math.min(Math.max(a, c), b)); // keep controls between the two y's (no overshoot)
      const c1y = k(p1[1], p1[1] + (p2[1] - p0[1]) / 6, p2[1]), c2y = k(p1[1], p2[1] - (p3[1] - p1[1]) / 6, p2[1]);
      p += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${c1y.toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return p;
  }

  const css = `
.l2 { border:1px solid var(--line); border-radius:14px; padding:18px 20px 16px; margin:0 0 26px; }
.l2 .num { font:700 11px Inter; letter-spacing:.12em; color:var(--a-ink); text-transform:uppercase; } .l2 h3 { margin:0; font:800 19px Inter; color:var(--ink); }
.l2 .how { margin:4px 0 12px; font-size:13.5px; color:var(--muted); max-width:820px; }
.l2 .ro { min-height:44px; display:flex; align-items:center; gap:6px 20px; flex-wrap:wrap; padding:9px 14px; border-radius:8px; background:var(--soft); font-size:13.5px; margin-bottom:6px; color:var(--body); }
.l2 .ro b { color:var(--ink); } .l2 .ro .dt { font-weight:700; color:var(--ink); min-width:150px; } .l2 .ro .mute { color:var(--faint); font-size:12.5px; }
.l2 .ro .k { display:inline-block; width:14px; height:2px; vertical-align:middle; margin-right:7px; border-radius:1px; }
.l2 svg { display:block; width:100%; overflow:visible; user-select:none; }
.l2 .t { transition:d .75s cubic-bezier(.4,0,.2,1), opacity .5s, transform .75s cubic-bezier(.4,0,.2,1); }
.l2 .z { transition:transform .75s cubic-bezier(.4,0,.2,1); }
.l2 .cl { transition:x .7s cubic-bezier(.4,0,.2,1), width .7s cubic-bezier(.4,0,.2,1); }
.l2 .lg { display:flex; flex-wrap:wrap; gap:6px 18px; font-size:12.5px; color:var(--muted); margin-top:8px; align-items:center; }
.l2 .lg i { display:inline-block; vertical-align:middle; margin-right:7px; }
.l2 .mult { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:14px; margin-top:4px; }
.l2 .mult > div { opacity:0; transform:translateY(8px); transition:opacity .45s, transform .45s; } .l2 .mult.on > div { opacity:1; transform:none; }
.l2 .mult h4 { margin:0 0 2px; font:600 13px Inter; color:var(--ink); } .l2 .mult .v { font-size:12.5px; color:var(--muted); } .l2 .mult .v b { color:var(--ink); }
.l2 .main { transition:opacity .4s; }
@media (max-width:900px) { .l2 .mult { grid-template-columns:repeat(2,minmax(0,1fr)); } }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /** opts: { area, zoom, focus, drag, multiples } */
  function chart(el, opts) {
    const id = Math.random().toString(36).slice(2, 7);
    let S = { mode: 'all', period: [49, 55], compare: [42, 48], label: 'Last 7 days' }, view = [0, D - 1], drag = null, lo = 20, hi = 52;
    const xs = (d) => PL + ((d - view[0]) / (view[1] - view[0])) * PW;   // screen x for the current view
    const xf = (d) => PL + (d / (D - 1)) * PW;                           // full-span x, inside the zoom group
    const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
    el.innerHTML = `<div class="ro"></div><div class="main"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trend">
      <defs><clipPath id="pc-${id}"><rect x="${PL}" y="0" width="${PW}" height="${H}"/></clipPath>
        <linearGradient id="ga-${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4F46E5" stop-opacity=".14"/><stop offset="1" stop-color="#4F46E5" stop-opacity="0"/></linearGradient>
        <clipPath id="fn-${id}"><rect class="cl fnr" y="0" height="${H}"/></clipPath><clipPath id="fc-${id}"><rect class="cl fcr" y="0" height="${H}"/></clipPath></defs>
      <g class="grid"></g>
      <g clip-path="url(#pc-${id})"><g class="z plot" style="transform-origin:0 0">
        <g class="mk"></g>
        <path class="t area" fill="url(#ga-${id})"/>
        <path class="t day" fill="none" stroke="#A5B4FC" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <path class="t wkc" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        <path class="t wk" fill="none" stroke="#4338CA" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        <path class="t wkb" fill="none" stroke="#667085" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke" clip-path="url(#fc-${id})"/><path class="t wkf" fill="none" stroke="#4338CA" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke" clip-path="url(#fn-${id})"/>
        ${AIS.map((a) => `<path class="t ai" data-k="${a.key}" fill="none" stroke="${a.dot}" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`).join('')}
      </g></g>
      <g class="marks"></g><g class="xl"></g><g class="per"></g><g class="ends"></g><g class="hov"></g><rect class="dragr" fill="#4F46E5" fill-opacity=".07" y="${PT}" height="${H - PT - PB}" width="0"/>
      <rect class="hit" x="${PL}" y="0" width="${PW}" height="${H - PB}" fill="transparent" style="cursor:${opts.drag ? 'col-resize' : 'crosshair'}"/>
    </svg></div>${opts.multiples ? '<div class="mult"></div>' : ''}<div class="lg"></div>`;
    const q = (k) => el.querySelector(k), qa = (k) => [...el.querySelectorAll(k)], ro = q('.ro');
    const pts = (arr) => arr.map(([d, v]) => [xf(d), y(v)]);
    const sd = (el2, p2) => { el2.style.d = `path("${p2}")`; };

    function draw() {
      const all = S.mode === 'all', mult = opts.multiples && !all;
      [lo, hi] = all || mult ? [20, 52] : [10, 64];
      if (opts.zoom) view = S.label === 'Yesterday' || S.label === 'Last 7 days' ? [D - 22, D - 1] : S.label === 'Last 28 days' ? [D - 42, D - 1] : [0, D - 1];
      q('.plot').style.transform = opts.zoom ? (() => { const k = (D - 1) / (view[1] - view[0]); return `translate(${PL - (PL + (view[0] / (D - 1)) * PW) * k}px,0) scale(${k},1)`; })() : 'none';
      q('.main').style.opacity = mult ? 0 : 1; q('.main').style.height = mult ? '0' : ''; q('.main').style.overflow = mult ? 'hidden' : '';
      const ticks = all || mult ? [20, 30, 40, 50] : [10, 30, 50];
      q('.grid').innerHTML = ticks.map((v) => `<line x1="${PL}" x2="${W - PR}" y1="${y(v)}" y2="${y(v)}" stroke="#EEF0F3"/><text x="${PL - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#98A2B3">${v / 10} in 10</text>`).join('');
      const wkp = pts(weekPts('all')), dyp = pts(SER.all.map((v, d) => [d, v]));
      sd(q('.day'), smooth(dyp)); q('.day').style.opacity = all ? 1 : 0;
      ['.wkc', '.wk', '.wkf', '.wkb'].forEach((c) => sd(q(c), smooth(wkp)));
      q('.wkc').style.opacity = all ? 1 : 0;
      q('.wk').style.opacity = all ? 1 : 0; q('.wk').style.stroke = opts.focus ? '#C7CBF5' : '#4338CA';
      q('.wkf').style.opacity = all && opts.focus ? 1 : 0; q('.wkb').style.opacity = all && opts.focus ? 1 : 0; q('.day').style.opacity = all ? (opts.focus ? 0.45 : 1) : 0;
      if (opts.focus) { const pad = 1.5 * (PW / (D - 1)); [['.fnr', S.period], ['.fcr', S.compare]].forEach(([c, [a, b]]) => { const r = q(c); r.style.x = `${xf(a) - pad}px`; r.style.width = `${xf(b) - xf(a) + 2 * pad}px`; }); }
      sd(q('.area'), `${smooth(wkp)} L${xf(D - 1)},${H - PB} L${xf(0)},${H - PB} Z`); q('.area').style.opacity = opts.area && all ? 1 : 0;
      qa('.ai').forEach((p) => { sd(p, smooth(pts(weekPts(all ? 'all' : p.dataset.k)))); p.style.opacity = all || mult ? 0 : 1; });
      // markers (drawn in screen space so their icons don't stretch with the zoom)
      q('.marks').innerHTML = [{ day: 26, k: 'work' }, { day: 36, k: 'method' }, { day: 43, k: 'track' }].filter((m) => m.day >= view[0] && m.day <= view[1]).map((m) => { const X = xs(m.day);
        return `<line x1="${X}" x2="${X}" y1="${PT + 6}" y2="${H - PB}" stroke="${m.k === 'work' ? '#C7CBF5' : '#E4E7EC'}"/>${m.k === 'track' ? `<rect x="${X - 3.5}" y="${PT - 4}" width="7" height="7" fill="#0B1020" transform="rotate(45 ${X} ${PT - 0.5})"/>` : `<rect x="${X - 4}" y="${PT - 5}" width="8" height="8" rx="2" fill="${m.k === 'work' ? '#4F46E5' : '#98A2B3'}"/>`}`; }).join('');
      const step = view[1] - view[0] > 30 ? 7 : 3;
      q('.xl').innerHTML = Array.from({ length: D }, (_, d) => d).filter((d) => d >= view[0] && d <= view[1] && (d % step === 0)).map((d) => `<text x="${xs(d)}" y="${H - 3}" font-size="11" fill="#98A2B3" text-anchor="middle">${md(d)}</text>`).join('');
      // now / compared: hairline rules under the axis (focus shows them on the line instead)
      const rule = ([a, b], c, t) => { const a2 = Math.max(a, view[0]), b2 = Math.min(b, view[1]); if (b2 < a2) return ''; return `<line x1="${xs(a2)}" x2="${xs(b2)}" y1="${H - PB + 4}" y2="${H - PB + 4}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`; };
      q('.per').innerHTML = opts.focus ? '' : rule(S.period, '#4F46E5') + rule(S.compare, '#98A2B3');
      // end labels in ink, with a line key; leader lines when they'd collide
      if (all) {
        const ew = y(weekAt('all', D - 1)), ed = y(SER.all[D - 1]);
        let lw = ew, ldy = ed; if (Math.abs(lw - ldy) < 16) { if (lw <= ldy) { lw -= 8; ldy = lw + 16; } else { ldy -= 8; lw = ldy + 16; } }
        const lab = (yl, ya, txt, c, w, ink) => `<line x1="${W - PR + 6}" x2="${W - PR + 14}" y1="${ya}" y2="${yl}" stroke="#D0D5DD"/><line x1="${W - PR + 16}" x2="${W - PR + 28}" y1="${yl}" y2="${yl}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><text x="${W - PR + 34}" y="${yl + 4}" font-size="12" font-weight="600" fill="${ink}">${txt}</text>`;
        q('.ends').innerHTML = `<circle cx="${W - PR}" cy="${ew}" r="4.5" fill="#4338CA" stroke="#fff" stroke-width="2"/>${lab(lw, ew, 'each week', '#4338CA', 2.5, '#0B1020')}${opts.focus ? '' : lab(ldy, ed, 'each day', '#A5B4FC', 1.5, '#667085')}`;
      } else if (!mult) {
        const ends = AIS.map((a) => ({ a, y: y(weekAt(a.key, D - 1)) })).sort((m, n) => m.y - n.y);
        for (let i = 1; i < ends.length; i += 1) if (ends[i].y - ends[i - 1].y < 15) ends[i].ly = (ends[i - 1].ly ?? ends[i - 1].y) + 15;
        q('.ends').innerHTML = ends.map((e) => { const ly = e.ly ?? e.y; return `<circle cx="${W - PR}" cy="${e.y}" r="4" fill="${e.a.dot}" stroke="#fff" stroke-width="2"/><line x1="${W - PR + 6}" x2="${W - PR + 14}" y1="${e.y}" y2="${ly}" stroke="#D0D5DD"/><text x="${W - PR + 18}" y="${ly + 4}" font-size="12" fill="#344054">${e.a.name}</text>`; }).join('');
      } else q('.ends').innerHTML = '';
      if (opts.multiples) drawMult(mult);
      q('.lg').innerHTML = (all ? `<span><i style="width:16px;height:2.5px;background:#4338CA"></i>each week, about ${(N.all * 7).toLocaleString()} answers</span><span><i style="width:16px;height:1.5px;background:#A5B4FC"></i>each day, about ${N.all}</span>${opts.focus ? '<span><i style="width:16px;height:2.5px;background:#4338CA"></i>now</span><span><i style="width:16px;height:2.5px;background:#667085"></i>compared with</span><span><i style="width:16px;height:2.5px;background:#C7CBF5"></i>the other weeks</span>' : '<span><i style="width:16px;height:2px;background:#4F46E5"></i>now</span><span><i style="width:16px;height:2px;background:#98A2B3"></i>compared with</span>'}` : AIS.map((a) => `<span><i style="width:16px;height:2px;background:${a.dot}"></i>${a.name}</span>`).join(''))
        + '<span><i style="width:8px;height:8px;border-radius:2px;background:#4F46E5"></i>Nov 27 veneers page</span><span><i style="width:8px;height:8px;border-radius:2px;background:#98A2B3"></i>Dec 7 Perplexity update</span><span><i style="width:7px;height:7px;background:#0B1020;transform:rotate(45deg)"></i>Dec 14 tracking changed</span>';
      rest();
    }
    function drawMult(on) {
      const box = q('.mult'), w = 200, h = 110, p = 8, yy = (v) => p + (1 - (v - 10) / 54) * (h - 2 * p), xx = (d) => (d / (D - 1)) * w;
      box.innerHTML = AIS.map((a) => { const wk = weekPts(a.key).map(([d, v]) => [xx(d), yy(v)]), dy = SER[a.key].map((v, d) => [xx(d), yy(v)]), now = avg(SER[a.key].slice(S.period[0], S.period[1] + 1));
        return `<div><h4><span class="aidot" style="background:${a.dot}"></span>${a.name}</h4><div class="v"><b>about ${Math.round(now / 10)} in 10</b> ${S.label.toLowerCase()}</div>
          <svg viewBox="0 0 ${w} ${h}" style="margin-top:6px">${[20, 40].map((v) => `<line x1="0" x2="${w}" y1="${yy(v)}" y2="${yy(v)}" stroke="#EEF0F3"/>`).join('')}<path d="${smooth(dy)}" fill="none" stroke="${a.dot}" stroke-opacity=".3" stroke-width="1.2"/><path d="${smooth(wk)}" fill="none" stroke="${a.dot}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${w}" cy="${wk[wk.length - 1][1]}" r="4" fill="${a.dot}" stroke="#fff" stroke-width="2"/></svg></div>`; }).join('');
      requestAnimationFrame(() => box.classList.toggle('on', on));
      box.style.display = on ? '' : 'none';
    }
    function rest() {
      q('.hov').innerHTML = '';
      const [a, b] = S.period, r = avg(SER.all.slice(a, b + 1)), n = N.all * (b - a + 1), [l1, h1] = range(r, n), [c, e] = S.compare, rc = avg(SER.all.slice(c, e + 1));
      ro.innerHTML = `<span class="dt">${S.label}, ${span(a, b)}</span><span><b>about ${Math.round(r / 10)} in every 10</b> answers named ${T.PRACTICE} (likely ${l1} to ${h1} in every 100)</span><span>Compared with ${span(c, e)}: <b>about ${Math.round(rc / 10)} in 10</b></span><span class="mute">${opts.drag ? 'Hover for any day, or drag across the chart to read a stretch.' : 'Hover for any day.'}</span>`;
    }
    const dayAt = (ev) => { const r = q('svg').getBoundingClientRect(), X = ((ev.clientX - r.left) / r.width) * W; return Math.max(view[0], Math.min(view[1], Math.round(view[0] + ((X - PL) / PW) * (view[1] - view[0])))); };
    function hover(d) {
      const all = S.mode === 'all', X = xs(d), wk = Math.min(7, Math.floor(d / 7));
      const dots = all ? `<circle cx="${X}" cy="${y(SER.all[d])}" r="3.5" fill="#A5B4FC" stroke="#fff" stroke-width="2"/><circle cx="${X}" cy="${y(weekAt('all', d))}" r="5" fill="#4338CA" stroke="#fff" stroke-width="2"/>`
        : AIS.map((a) => `<circle cx="${X}" cy="${y(weekAt(a.key, d))}" r="4" fill="${a.dot}" stroke="#fff" stroke-width="2"/>`).join('');
      q('.hov').innerHTML = `<line x1="${X}" x2="${X}" y1="${PT}" y2="${H - PB}" stroke="#475569" stroke-dasharray="2 2"/>${dots}`;
      const [l1, h1] = range(weekAt('all', d), N.all * 7);
      ro.innerHTML = all ? `<span class="dt">${wd(d)}${d === D - 1 ? ' (yesterday)' : ''}</span><span><span class="k" style="background:#4338CA;height:2.5px"></span>Its week, ${span(7 * wk, 7 * wk + 6)}: <b>about ${Math.round(weekAt('all', d) / 10)} in 10</b> (likely ${l1} to ${h1} in 100)</span><span><span class="k" style="background:#A5B4FC"></span>That day alone: <b>${Math.round((SER.all[d] / 100) * N.all)} of ${N.all}</b> answers</span>`
        : `<span class="dt">Week of ${span(7 * wk, 7 * wk + 6)}</span>${AIS.map((a) => `<span><span class="k" style="background:${a.dot}"></span>${a.name} <b>${Math.round(weekAt(a.key, d) / 10)} in 10</b></span>`).join('')}`;
    }
    function readStretch(a, b) {
      const r = avg(SER.all.slice(a, b + 1)), n = N.all * (b - a + 1), [l1, h1] = range(r, n);
      ro.innerHTML = `<span class="dt">${span(a, b)} (${b - a + 1} days)</span><span><b>about ${Math.round(r / 10)} in every 10</b> answers named ${T.PRACTICE}</span><span>likely ${l1} to ${h1} in every 100, from ${n.toLocaleString()} answers</span><span class="mute">Click the chart to clear.</span>`;
    }
    const hit = q('.hit'), dr = q('.dragr');
    hit.addEventListener('pointermove', (e) => { const d = dayAt(e); if (drag != null) { const a = Math.min(drag, d), b = Math.max(drag, d); dr.setAttribute('x', xs(a)); dr.setAttribute('width', Math.max(0, xs(b) - xs(a))); readStretch(a, b); } else if (!dr.dataset.kept) hover(d); });
    hit.addEventListener('pointerleave', () => { if (drag == null && !dr.dataset.kept) rest(); });
    if (opts.drag) {
      hit.addEventListener('pointerdown', (e) => { if (dr.dataset.kept) { delete dr.dataset.kept; dr.setAttribute('width', 0); rest(); return; } drag = dayAt(e); q('.hov').innerHTML = ''; });
      window.addEventListener('pointerup', () => { if (drag == null) return; if (+dr.getAttribute('width') > 4) dr.dataset.kept = '1'; else dr.setAttribute('width', 0); drag = null; });
    }
    return { set(s2) { S = { ...S, ...s2 }; delete dr.dataset.kept; dr.setAttribute('width', 0); draw(); } };
  }
  window.LINES2 = { chart, span };
})();
