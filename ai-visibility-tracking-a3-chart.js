/* A3 trend chart: two versions of the same data, morphing between All AIs / Each AI and periods.
   A = each day a thin bar, each week a flat step across its 7 days, likely range a ribbon around the step.
   B = each week a column with a likely-range whisker; a week's days appear only when hovered.
   The readout sits in a strip ABOVE the chart, never over it. */
(function () {
  const W = 760, H = 250, L = 6, R = 58, TP = 30, B = 26, D = 56, TOP = 60;
  const x = (d) => L + (d * (W - L - R)) / D, y = (v) => TP + (1 - v / TOP) * (H - TP - B), base = H - B;
  const DAY = new Date(2026, 10, 1);
  const date = (d, o) => new Date(DAY.getFullYear(), DAY.getMonth(), DAY.getDate() + d).toLocaleDateString('en-US', o);
  const md = (d) => date(d, { month: 'short', day: 'numeric' }), wd = (d) => date(d, { weekday: 'short', month: 'short', day: 'numeric' });
  const span = (a, b) => (a === b ? md(a) : date(a, { month: 'short' }) === date(b, { month: 'short' }) ? `${md(a)} to ${date(b, { day: 'numeric' })}` : `${md(a)} to ${md(b)}`);
  const avg = (a) => a.reduce((t, v) => t + v, 0) / a.length;

  /** Likely range (95%, Wilson) as whole numbers out of 100. */
  function range(per100, n) {
    const p = per100 / 100, z = 1.96, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [Math.max(0, Math.round(((c - m) / d) * 100)), Math.min(100, Math.round(((c + m) / d) * 100))];
  }
  /** 'up' | 'down' | 'none': real only when the two likely ranges don't overlap. */
  function verdict(now, nNow, prev, nPrev) {
    const [a0, a1] = range(now, nNow), [b0, b1] = range(prev, nPrev);
    return a0 > b1 ? 'up' : a1 < b0 ? 'down' : 'none';
  }

  /** Days around each weekly value (seeded so they stay put), and weeks re-averaged from those days. */
  function series(T) {
    let s = 11; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 - 0.5; };
    const mk = (w, wob) => { const days = w.flatMap((v) => Array.from({ length: 7 }, () => Math.max(1, Math.min(95, v + rnd() * wob)))); return { days, weeks: w.map((_, i) => avg(days.slice(7 * i, 7 * i + 7))) }; };
    const ai = {}; T.AIS.forEach((a) => { ai[a.key] = mk(a.w, 26); });
    const days = Array.from({ length: D }, (_, d) => avg(T.AIS.map((a) => ai[a.key].days[d])));
    return { all: { days, weeks: Array.from({ length: 8 }, (_, i) => avg(days.slice(7 * i, 7 * i + 7))) }, ai };
  }

  const stepD = (w) => { let p = `M${x(0)},${y(w[0])} H${x(7)}`; for (let i = 1; i < w.length; i += 1) p += ` V${y(w[i])} H${x(7 * (i + 1))}`; return p; };
  const ribbonD = (lo, hi) => {
    let p = `M${x(0)},${y(hi[0])} H${x(7)}`; for (let i = 1; i < 8; i += 1) p += ` V${y(hi[i])} H${x(7 * (i + 1))}`;
    p += ` V${y(lo[7])} H${x(49)}`; for (let i = 6; i >= 0; i -= 1) p += ` V${y(lo[i])} H${x(7 * i)}`; return `${p} Z`;
  };
  const setD = (el, p) => { el.style.d = `path("${p}")`; };
  const box = (el, X, Y, w, h) => { el.style.x = `${X}px`; el.style.y = `${Y}px`; el.style.width = `${Math.max(0, w)}px`; el.style.height = `${Math.max(0, h)}px`; };

  const css = `
.a3c { position:relative; }
.a3c .ro { min-height:52px; display:flex; align-items:center; gap:10px 22px; flex-wrap:wrap; padding:10px 14px; border-radius:10px; background:var(--soft); font-size:13.5px; color:var(--body); margin-bottom:10px; transition:background .2s; }
.a3c .ro.hov { background:var(--a-tint); } .a3c .ro b { color:var(--ink); } .a3c .ro .dt { font-weight:700; color:var(--ink); min-width:150px; }
.a3c .ro .mk { color:var(--muted); font-size:12.5px; }
.a3c svg { display:block; width:100%; overflow:visible; }
.a3c .tr { transition:d .7s cubic-bezier(.4,0,.2,1), opacity .5s, stroke .6s, fill .6s, x .7s cubic-bezier(.4,0,.2,1), y .7s cubic-bezier(.4,0,.2,1), width .7s cubic-bezier(.4,0,.2,1), height .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1); }
.a3c .ver { transition:opacity .45s; }
.a3c .hit { fill:transparent; cursor:crosshair; }
.a3c .lab { font:600 10.5px Inter; letter-spacing:.06em; text-transform:uppercase; }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /**
   * build(el, { T, S, n: {all, ai:{key}}, markers:[{day, kind, text}], summary(state) -> html })
   * returns { set({ mode, version, period:[from,to], compare:[from,to] }) }
   */
  function build(el, { T, S, n, markers, summary }) {
    const ais = T.AIS, colW = 7 * ((W - L - R) / D) * 0.6;
    el.classList.add('a3c');
    const grid = [0, 30, 60].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v ? '#F2F4F7' : '#E4E7EC'}"/><text x="${W - R + 10}" y="${y(v) + 4}" font-size="11" fill="#98A2B3">${v / 10} in 10</text>`).join('');
    const weeksX = Array.from({ length: 8 }, (_, i) => `<text x="${x(7 * i + 3.5)}" y="${H - 7}" font-size="11" fill="#98A2B3" text-anchor="middle">${md(7 * i)}</text>`).join('');
    const mColor = (k) => (k === 'work' ? '#4F46E5' : k === 'track' ? '#0B1020' : '#98A2B3');
    const mIcon = (m) => (m.kind === 'track' ? `<rect x="${x(m.day) - 4.5}" y="${TP - 23}" width="9" height="9" fill="#0B1020" transform="rotate(45 ${x(m.day)} ${TP - 18.5})"/>` : `<rect x="${x(m.day) - 5}" y="${TP - 23}" width="10" height="10" rx="2" fill="${mColor(m.kind)}"/>`);
    el.innerHTML = `<div class="ro"></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trend">
      <g>${grid}</g>
      <rect class="tr hlc" fill="#F2F4F7" rx="4"/><rect class="tr hln" fill="#EEF0FF" rx="4"/>
      <text class="tr lab tlc" y="${TP - 6}" fill="#98A2B3">compared with</text><text class="tr lab tln" y="${TP - 6}" fill="#4338CA">now</text>
      <g class="ver vA">
        ${Array.from({ length: D }, (_, d) => `<rect class="tr bar" data-d="${d}" fill="#CDD1F7" rx="1.5"/>`).join('')}
        <path class="tr rib" fill="#6366F1" opacity=".28"/>
        ${ais.map((a) => `<path class="tr ai" data-k="${a.key}" fill="none" stroke="${a.dot}" stroke-width="2.5" stroke-linejoin="round"/>`).join('')}
        <path class="tr ov" fill="none" stroke="#3730A3" stroke-width="2.5" stroke-linejoin="round"/>
      </g>
      <g class="ver vB">
        ${Array.from({ length: 8 }, (_, i) => ais.map((a) => `<rect class="tr col" data-w="${i}" data-k="${a.key}" rx="3"/>`).join('')).join('')}
        ${Array.from({ length: 8 }, (_, i) => `<rect class="tr wh" data-w="${i}" fill="#312E81"/><rect class="tr cap" data-w="${i}" data-e="hi" fill="#312E81"/><rect class="tr cap" data-w="${i}" data-e="lo" fill="#312E81"/>`).join('')}
        ${Array.from({ length: D }, (_, d) => `<circle class="tr dd" data-d="${d}" r="3" fill="#4338CA" opacity="0"/>`).join('')}
      </g>
      ${markers.map((m) => `<g><line x1="${x(m.day)}" x2="${x(m.day)}" y1="${TP - 12}" y2="${base}" stroke="${mColor(m.kind)}" stroke-opacity=".5" stroke-dasharray="3 3"/>${mIcon(m)}</g>`).join('')}
      <rect class="guide" width="1.5" fill="#0B1020" opacity="0" y="${TP - 12}" height="${base - TP + 12}"/>
      ${weeksX}
      ${Array.from({ length: D }, (_, d) => `<rect class="hit" data-d="${d}" x="${x(d)}" y="0" width="${x(1) - x(0)}" height="${H}"/>`).join('')}
    </svg>`;
    const q = (s) => el.querySelector(s), qa = (s) => [...el.querySelectorAll(s)];
    const ro = q('.ro'), guide = q('.guide');
    let st8 = null;
    const data = series(T);
    const wkN = (key, days) => (key === 'all' ? n.all : n.ai[key]) * days;

    function drawA(s) {
      const all = s.mode === 'all';
      qa('.bar').forEach((b) => { const d = +b.dataset.d, v = data.all.days[d], w = x(1) - x(0);
        box(b, x(d) + w * 0.28, all ? y(v) : base, w * 0.44, all ? base - y(v) : 0); b.style.opacity = all ? 1 : 0; });
      const lo = data.all.weeks.map((v) => range(v, wkN('all', 7))[0]), hi = data.all.weeks.map((v) => range(v, wkN('all', 7))[1]);
      const rib = q('.rib'); setD(rib, ribbonD(lo, hi)); rib.style.opacity = all ? 1 : 0;
      const ov = q('.ov'); setD(ov, stepD(data.all.weeks)); ov.style.opacity = all ? 1 : 0;
      qa('.ai').forEach((p) => { setD(p, stepD(all ? data.all.weeks : data.ai[p.dataset.k].weeks)); p.style.opacity = all ? 0 : 1; });
    }
    function drawB(s) {
      const all = s.mode === 'all';
      qa('.col').forEach((c) => { const i = +c.dataset.w, j = ais.findIndex((a) => a.key === c.dataset.k), cx = x(7 * i + 3.5);
        const v = all ? data.all.weeks[i] : data.ai[c.dataset.k].weeks[i], sub = colW / ais.length;
        box(c, all ? cx - colW / 2 : cx - colW / 2 + j * sub, y(v), all ? colW : sub - 2, base - y(v));
        c.style.fill = all ? '#C7CBF5' : ais[j].dot; });
      qa('.wh').forEach((r) => { const i = +r.dataset.w, [lo, hi] = range(data.all.weeks[i], wkN('all', 7)); box(r, x(7 * i + 3.5) - 1, y(hi), 2, y(lo) - y(hi)); r.style.opacity = all ? 1 : 0; });
      qa('.cap').forEach((r) => { const i = +r.dataset.w, [lo, hi] = range(data.all.weeks[i], wkN('all', 7)); box(r, x(7 * i + 3.5) - 7, y(r.dataset.e === 'hi' ? hi : lo) - 1, 14, 2); r.style.opacity = all ? 1 : 0; });
      qa('.dd').forEach((c) => { const d = +c.dataset.d, w = x(1) - x(0); c.setAttribute('cx', x(d) + w / 2); c.setAttribute('cy', y(data.all.days[d])); c.style.opacity = 0; });
    }
    function drawHl(s) {
      const [a, b] = s.period, [c, e] = s.compare || [null, null];
      box(q('.hln'), x(a), TP - 14, x(b + 1) - x(a), base - TP + 14);
      q('.tln').style.transform = `translate(${x(a) + 4}px,0)`;
      const hc = q('.hlc'), tc = q('.tlc');
      if (c == null) { hc.style.opacity = 0; tc.style.opacity = 0; return; }
      hc.style.opacity = 1; tc.style.opacity = 1;
      box(hc, x(c), TP - 14, x(e + 1) - x(c), base - TP + 14);
      tc.style.transform = `translate(${x(c) + 4}px,0)`;
      tc.textContent = x(e + 1) - x(c) < 130 ? 'before' : 'compared with';
    }
    function rest() { qa('.bar').forEach((b) => { b.style.fill = ''; }); ro.classList.remove('hov'); ro.innerHTML = summary(st8); guide.style.opacity = 0; qa('.dd').forEach((c) => { c.style.opacity = 0; }); }
    function hover(d) {
      const wk = Math.floor(d / 7), ws = 7 * wk, nDay = n.all, v = data.all.days[d], [lo, hi] = range(data.all.weeks[wk], wkN('all', 7));
      const mk = markers.filter((m) => Math.floor(m.day / 7) === wk).map((m) => `<span class="mk">${m.text}</span>`).join('');
      ro.classList.add('hov'); qa('.bar').forEach((b) => { b.style.fill = +b.dataset.d === d ? '#6366F1' : ''; });
      if (st8.mode === 'all') {
        ro.innerHTML = `<span class="dt">${wd(d)}${d === D - 1 ? ' (yesterday)' : ''}</span>
          <span>That day: <b>${Math.round((v / 100) * nDay)} of ${nDay}</b> answers named ${T.PRACTICE}</span>
          <span>Its week, ${span(ws, ws + 6)}: <b>about ${Math.round(data.all.weeks[wk] / 10)} in every 10</b>, likely ${lo} to ${hi} in every 100</span>${mk}`;
      } else {
        ro.innerHTML = `<span class="dt">Week of ${span(ws, ws + 6)}</span>${ais.map((a) => `<span><span class="aidot" style="background:${a.dot}"></span>${a.name} <b>${Math.round(data.ai[a.key].weeks[wk])}</b> in every 100</span>`).join('')}${mk}`;
      }
      box(guide, x(d) + (x(1) - x(0)) / 2 - 0.75, TP - 12, 1.5, base - TP + 12); guide.style.opacity = 0.35;
      if (st8.version === 'B' && st8.mode === 'all') qa('.dd').forEach((c) => { c.style.opacity = Math.floor(+c.dataset.d / 7) === wk ? 1 : 0; });
    }
    qa('.hit').forEach((h) => { h.addEventListener('mouseenter', () => hover(+h.dataset.d)); });
    q('svg').addEventListener('mouseleave', rest);

    return {
      data,
      set(s) {
        st8 = { ...st8, ...s };
        q('.vA').style.opacity = st8.version === 'A' ? 1 : 0; q('.vB').style.opacity = st8.version === 'B' ? 1 : 0;
        drawA(st8); drawB(st8); drawHl(st8); rest();
      },
    };
  }

  /** A small weekly step chart for a few lines (rivals), readout above. lines: [{name, w, color}] */
  function weekly(el, { lines, fmt, title }) {
    el.classList.add('a3c');
    const top = Math.ceil(Math.max(...lines.flatMap((l) => l.w)) / 5) * 5 + 5, yy = (v) => TP + (1 - v / top) * (H - TP - B);
    const st = (w) => { let p = `M${x(0)},${yy(w[0])} H${x(7)}`; for (let i = 1; i < w.length; i += 1) p += ` V${yy(w[i])} H${x(7 * (i + 1))}`; return p; };
    el.innerHTML = `<div class="ro"></div><svg viewBox="0 0 ${W} ${H}">
      ${[0, top / 2, top].map((v) => `<line x1="${L}" x2="${W - R}" y1="${yy(v)}" y2="${yy(v)}" stroke="#F2F4F7"/><text x="${W - R + 10}" y="${yy(v) + 4}" font-size="11" fill="#98A2B3">${Math.round(v)} of 100</text>`).join('')}
      <rect class="wkh" fill="#EEF0FF" rx="4" opacity="0" y="${TP - 8}" height="${base - TP + 8}" width="${x(7) - x(0)}"/>
      ${lines.map((l) => `<path d="${st(l.w)}" fill="none" stroke="${l.color}" stroke-width="${l.lead ? 3 : 2.5}" stroke-linejoin="round"/>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<text x="${x(7 * i + 3.5)}" y="${H - 7}" font-size="11" fill="#98A2B3" text-anchor="middle">${md(7 * i)}</text>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<rect class="hit" data-w="${i}" x="${x(7 * i)}" y="0" width="${x(7) - x(0)}" height="${H}"/>`).join('')}</svg>`;
    const ro = el.querySelector('.ro'), wkh = el.querySelector('.wkh');
    const rest = () => { ro.classList.remove('hov'); ro.innerHTML = title; wkh.style.opacity = 0; };
    el.querySelectorAll('.hit').forEach((h) => h.addEventListener('mouseenter', () => {
      const i = +h.dataset.w; ro.classList.add('hov'); wkh.setAttribute('x', x(7 * i)); wkh.style.opacity = 1;
      ro.innerHTML = `<span class="dt">Week of ${span(7 * i, 7 * i + 6)}</span>${lines.map((l) => `<span><span class="aidot" style="background:${l.color}"></span>${l.name} <b>${fmt(l.w[i])}</b></span>`).join('')}`;
    }));
    el.querySelector('svg').addEventListener('mouseleave', rest); rest();
  }

  window.A3C = { build, weekly, range, verdict, md, wd, span, D };
})();
