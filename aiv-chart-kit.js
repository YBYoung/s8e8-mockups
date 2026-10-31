/* Tracking chart variations kit (#1335, owner 10/31: "doesn't look elegant enough").
   Same A2 page frame on every variation; only the chart differs. Approved chart
   language (Performance page + Topic Cards demand chart): 2px monotone lines, no
   point dots, end dot with white casing, soft area under the lead line, a fixed
   readout bar ABOVE the chart, dashed slate hover guide, hairline grid, text in ink.
   Every point is a rolling 7 days. Scale = times in every 100, like the words. */
(function () {
  const D = window.AIV_DATA;
  const C = { ink: '#0B1020', body: '#273043', muted: '#667085', faint: '#98A2B3', line: '#E7E9EE', soft: '#F6F7FA',
              a: '#4F46E5', aInk: '#4338CA', aTint: '#EEF0FF', slate: '#94A3B8', up: '#15803D', down: '#E11D48' };
  const AIS = ['chatgpt', 'gemini', 'aio', 'aimode', 'perplexity'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
  const per100 = (k, n) => Math.round((k / n) * 100);
  const range = (r) => `${Math.round(r.lo * 100)} to ${Math.round(r.hi * 100)}`;
  const P = D.points;
  const last = P[P.length - 1];
  const before = P[P.length - 8];
  const NS = 'http://www.w3.org/2000/svg';

  const VARIANTS = [
    ['1', 'One line', 'ai-visibility-tracking-chart-1-one-line.html'],
    ['2', 'Line and range, labelled moments', 'ai-visibility-tracking-chart-2-labelled.html'],
    ['3', 'Each AI side by side', 'ai-visibility-tracking-chart-3-each-ai.html'],
    ['4', 'Before and after each moment', 'ai-visibility-tracking-chart-4-stretches.html'],
    ['5', 'All AIs, one picked at a time', 'ai-visibility-tracking-chart-5-emphasis.html'],
    ['6', 'Combined: line and range, numbered moments, focus or every AI', 'ai-visibility-tracking-chart-6-combined.html'],
    ['7', 'Alive: the Market Trends chart standard on Tracking', 'ai-visibility-tracking-chart-7-alive.html'],
    ['8', 'Many moments: merging, zoom, notes that follow the view', 'ai-visibility-tracking-chart-8-many-moments.html'],
  ];

  const css = `
  *{box-sizing:border-box} body{margin:0;background:#fff;color:${C.ink};font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .note{max-width:1120px;margin:0 auto;padding:14px 28px 0;font-size:13px;line-height:1.5;color:${C.muted}} .note b{color:${C.ink}}
  header{max-width:1120px;margin:0 auto;padding:14px 28px 0;display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px} .orb{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#4F46E5,#9333EA)}
  .who{font-size:14px;color:${C.muted}} .who b{color:${C.ink};font-weight:600}
  .tabs{max-width:1120px;margin:0 auto;padding:14px 28px 0;display:flex;gap:26px;border-bottom:1px solid ${C.line}}
  .tabs span{padding-bottom:10px;font-size:15px;font-weight:600;color:${C.muted}} .tabs .on{color:${C.ink};box-shadow:inset 0 -2px 0 ${C.a}}
  main{max-width:1120px;margin:0 auto;padding:26px 28px 120px;display:grid;grid-template-columns:170px minmax(0,1fr);gap:40px}
  .rail a{display:block;padding:8px 10px;border-radius:8px;font-size:14.5px;color:${C.muted};text-decoration:none} .rail .on{background:${C.aTint};color:${C.aInk};font-weight:600}
  .eyebrow{font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.aInk};margin-bottom:10px}
  h1{font-size:34px;line-height:1.12;letter-spacing:-.02em;font-weight:900;margin:0;max-width:760px}
  .stats{display:flex;flex-wrap:wrap;gap:6px 28px;margin:14px 0 22px;font-size:15px;color:${C.body}} .stats b{color:${C.ink}}
  .card{border:1px solid ${C.line};border-radius:14px;padding:20px 22px 16px}
  .readout{height:22px;font-size:13.5px;color:${C.body};font-variant-numeric:tabular-nums;margin-bottom:6px} .readout b{color:${C.ink}}
  .ctitle{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.muted};margin-bottom:8px}
  svg text{font-family:Inter,ui-sans-serif,system-ui,sans-serif}
  .legend{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;font-size:12.5px;color:${C.muted}}
  .key{display:inline-block;width:16px;height:2px;vertical-align:middle;margin-right:6px}
  .tip{position:absolute;pointer-events:none;background:#fff;border:1px solid ${C.line};border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.45;color:${C.body};box-shadow:0 8px 24px rgba(11,16,32,.08);max-width:260px;opacity:0;transition:opacity .15s}
  .tip b{display:block;color:${C.aInk};margin-bottom:2px}
  .switch{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:${C.ink};border-radius:12px;padding:5px;display:flex;gap:4px;box-shadow:0 10px 30px rgba(11,16,32,.25)}
  .switch a{color:#C7CBD6;text-decoration:none;font-size:13px;font-weight:600;padding:7px 12px;border-radius:8px} .switch a.on{background:#fff;color:${C.ink}}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px} .chip{border:1px solid ${C.line};border-radius:8px;padding:5px 10px;font-size:13px;font-weight:600;color:${C.body};background:#fff;cursor:pointer}
  .chip.on{border-color:${C.ink};color:${C.ink}} .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px}
  .grid5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
  .panel .pt{font-size:13px;font-weight:600;color:${C.ink};margin-bottom:2px} .panel .pv{font-size:12.5px;color:${C.muted};margin-bottom:6px;font-variant-numeric:tabular-nums}`;

  function frame(id, oneLine) {
    document.title = `Tracking chart ${id}`;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    document.body.innerHTML = `
      <p class="note"><b>Tracking chart, variation ${id}: ${VARIANTS[+id - 1][1]}.</b> ${oneLine}
      Real starting point: Bothell Family Dentistry's rate and answers a week on each AI. The 8 weeks of movement and the three moments are sample. Every point is the 7 days up to that date.</p>
      <header><div class="brand"><span class="orb"></span>AI Visibility</div><div class="who"><b>${D.practice}</b> · Snapshot Oct 28</div></header>
      <nav class="tabs"><span>Story</span><span>Answers</span><span>Insights</span><span class="on">Tracking</span></nav>
      <main><nav class="rail"><a class="on">Overview</a><a>By AI</a><a>What we track</a></nav>
        <section><div class="eyebrow">Overview · last 7 days</div>
          <h1>AI named ${D.practice} in about ${Math.round((last.all.k / last.all.n) * 10)} in every 10 answers, steady.</h1>
          <div class="stats"><span>We saw <b>${last.all.k.toLocaleString()} of ${last.all.n.toLocaleString()}</b> answers</span>
            <span>In reality, <b>${range(last.all)} times in every 100</b></span><span>Week before: <b>${range(before.all)}</b> in every 100</span></div>
          <div id="chart"></div></section></main>
      <nav class="switch">${VARIANTS.map(([v, , f]) => `<a href="${f}" class="${v === id ? 'on' : ''}">${v}</a>`).join('')}</nav>
      <div class="tip" id="tip"></div>`;
    return document.getElementById('chart');
  }

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (parent) parent.appendChild(e);
    return e;
  }

  /** Monotone cubic path (Fritsch-Carlson): smooth, never overshoots a point. */
  function smooth(pts) {
    if (pts.length < 2) return '';
    const n = pts.length, dx = [], dy = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += `C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
    }
    return d;
  }

  /** A plot: x over the points' dates (and moments), y 0..top in every 100. */
  function plot(host, { w = 780, h = 260, top = 60, pad = { l: 8, r: 58, t: 16, b: 26 }, ticks, xLabels = true } = {}) {
    const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%', role: 'img' }, host);
    const ms = (iso) => Date.parse(`${iso}T12:00:00Z`);
    const lo = ms(P[0].date), hi = ms(P[P.length - 1].date);
    const x = (iso) => pad.l + ((Math.min(Math.max(ms(iso), lo), hi) - lo) / (hi - lo)) * (w - pad.l - pad.r);
    const y = (v) => pad.t + (1 - Math.min(v, top) / top) * (h - pad.t - pad.b);
    (ticks || [0, top / 2, top]).forEach((t) => {
      el('line', { x1: pad.l, x2: w - pad.r, y1: y(t), y2: y(t), stroke: C.line, 'stroke-width': 1 }, svg);
      el('text', { x: w - pad.r + 8, y: y(t) + 4, 'font-size': 11, fill: C.muted }, svg).textContent = `${t}`;
    });
    if (xLabels) P.filter((_, i) => (i % 7 === 0 && i < P.length - 4) || i === P.length - 1).forEach((p, i, all) => {
      const anchor = i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle';
      el('text', { x: x(p.date), y: h - 6, 'font-size': 11, fill: C.muted, 'text-anchor': anchor }, svg).textContent = day(p.date);
    });
    return { svg, x, y, w, h, pad, top };
  }

  function line(pl, pick, colour, { width = 2, area = false, opacity = 1, end = true } = {}) {
    const pts = P.map((p) => [pl.x(p.date), pl.y(per100(pick(p).k, pick(p).n))]);
    const g = el('g', { opacity }, pl.svg);
    if (area) {
      const id = `fade${Math.random().toString(36).slice(2, 7)}`;
      const grad = el('linearGradient', { id, x1: 0, x2: 0, y1: 0, y2: 1 }, el('defs', {}, g));
      el('stop', { offset: '0%', 'stop-color': colour, 'stop-opacity': 0.14 }, grad);
      el('stop', { offset: '100%', 'stop-color': colour, 'stop-opacity': 0 }, grad);
      el('path', { d: `${smooth(pts)}L${pts[pts.length - 1][0]},${pl.y(0)}L${pts[0][0]},${pl.y(0)}Z`, fill: `url(#${id})` }, g);
    }
    el('path', { d: smooth(pts), fill: 'none', stroke: '#fff', 'stroke-width': width + 3, 'stroke-linecap': 'round' }, g);
    el('path', { d: smooth(pts), fill: 'none', stroke: colour, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    if (end) el('circle', { cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: 4, fill: colour, stroke: '#fff', 'stroke-width': 2 }, g);
    return g;
  }

  function band(pl, pick, colour, opacity = 0.1) {
    const up = P.map((p) => [pl.x(p.date), pl.y(pick(p).hi * 100)]);
    const dn = P.map((p) => [pl.x(p.date), pl.y(pick(p).lo * 100)]).reverse();
    el('path', { d: `${smooth(up)}L${dn[0][0]},${dn[0][1]}${smooth(dn).replace(/^M[^C]*/, '')}Z`, fill: colour, opacity }, pl.svg);
  }

  /** Hover: dashed slate guide, a cased dot per line, the readout bar above changes, nothing moves. */
  function hover(pl, readout, lines, words) {
    const guide = el('line', { y1: pl.pad.t, y2: pl.h - pl.pad.b, stroke: C.slate, 'stroke-dasharray': '4 3', opacity: 0 }, pl.svg);
    const dots = lines.map(([pick, colour]) => el('circle', { r: 4, fill: colour, stroke: '#fff', 'stroke-width': 2, opacity: 0 }, pl.svg));
    const rest = () => { readout.innerHTML = words(last); guide.setAttribute('opacity', 0); dots.forEach((d) => d.setAttribute('opacity', 0)); };
    const hit = el('rect', { x: pl.pad.l, y: 0, width: pl.w - pl.pad.l - pl.pad.r, height: pl.h, fill: 'transparent' }, pl.svg);
    hit.addEventListener('mousemove', (e) => {
      const box = pl.svg.getBoundingClientRect();
      const mx = ((e.clientX - box.left) / box.width) * pl.w;
      const p = P.reduce((b, q) => (Math.abs(pl.x(q.date) - mx) < Math.abs(pl.x(b.date) - mx) ? q : b), P[0]);
      guide.setAttribute('x1', pl.x(p.date)); guide.setAttribute('x2', pl.x(p.date)); guide.setAttribute('opacity', 1);
      lines.forEach(([pick], i) => { const r = pick(p); dots[i].setAttribute('cx', pl.x(p.date)); dots[i].setAttribute('cy', pl.y(per100(r.k, r.n))); dots[i].setAttribute('opacity', 1); });
      readout.innerHTML = words(p);
    });
    hit.addEventListener('mouseleave', rest);
    rest();
  }

  const allWords = (p) => `7 days to ${day(p.date)}: we saw <b>${p.all.k.toLocaleString()} of ${p.all.n.toLocaleString()}</b> answers name the practice; in reality <b>${range(p.all)} times in every 100</b>`;

  function tip(target, title, text) {
    const t = document.getElementById('tip');
    target.style.cursor = 'help';
    target.addEventListener('mouseenter', () => {
      const r = target.getBoundingClientRect();
      t.innerHTML = `<b>${title}</b>${text}`;
      t.style.left = `${Math.min(window.innerWidth - 280, r.left + window.scrollX - 8)}px`;
      t.style.top = `${r.bottom + window.scrollY + 8}px`;
      t.style.opacity = 1;
    });
    target.addEventListener('mouseleave', () => { t.style.opacity = 0; });
  }

  window.KIT = { D, C, AIS, P, last, before, day, per100, range, frame, el, plot, line, band, hover, allWords, tip, smooth };
})();
