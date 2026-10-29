/* A3 trend chart (owner 10/29): round 2's "Refined" day and week lines (version 1) merged with "Zoom and drag"
   (version 3). Built from the approved charts: the Performance page's readout above the chart and drag to read a
   stretch; the Topic Cards Demand chart's white-cased lead line with an end dot, dashed hover guide, labelled bands
   ("last 12" / "12 before" there, "now" / "compared with" here) and its range zoom by one transform. Lines only:
   weeks are never bars, columns or steps.
   The readout has two lines so hover never stops: the top line holds the period, or a dragged stretch once it is
   let go; the bottom line follows the pointer, inside the stretch or out of it. */
(function () {
  const W = 760, H = 250, PL = 46, PR = 104, PT = 24, PB = 28, D = 56, PW = W - PL - PR, MIN_VIEW = 20;
  const DAY0 = new Date(2026, 10, 1);
  const date = (d, o) => new Date(DAY0.getFullYear(), DAY0.getMonth(), DAY0.getDate() + Math.round(d)).toLocaleDateString('en-US', o);
  const md = (d) => date(d, { month: 'short', day: 'numeric' }), wd = (d) => date(d, { weekday: 'short', month: 'short', day: 'numeric' });
  const span = (a, b) => (a === b ? md(a) : date(a, { month: 'short' }) === date(b, { month: 'short' }) ? `${md(a)} to ${date(b, { day: 'numeric' })}` : `${md(a)} to ${md(b)}`);
  const avg = (a) => a.reduce((t, v) => t + v, 0) / a.length;
  const inTen = (v) => Math.round(v / 10);
  const WEEK = '#4338CA', DAYC = '#A5B4FC', GRID = '#EEF0F3', AXIS = '#98A2B3';
  const PERPLEXITY = '#0891B2';   // cyan: the old slate grey failed the colour check (validator: all 5 pass with cyan)

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

  /** A smooth path through points whose control points never overshoot the two y's they join (no false peaks). */
  function smooth(pts) {
    let p = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const k = (a, b, c) => Math.max(Math.min(a, c), Math.min(Math.max(a, c), b));
      const c1y = k(p1[1], p1[1] + (p2[1] - p0[1]) / 6, p2[1]), c2y = k(p1[1], p2[1] - (p3[1] - p1[1]) / 6, p2[1]);
      p += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${c1y.toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return p;
  }
  /** A week line's points: mid-week, held flat to the first and last day so it spans the chart like the day line. */
  const weekPts = (weeks, last) => [[0, weeks[0]], ...weeks.map((v, i) => [7 * i + 3, v]), [last, weeks[weeks.length - 1]]];

  const css = `
.a3c { position:relative; }
.a3c .ro { display:flex; flex-direction:column; border-radius:10px; background:var(--soft); font-size:13.5px; color:var(--body); margin-bottom:8px; }
.a3c .ro > div { min-height:42px; display:flex; align-items:center; gap:4px 16px; flex-wrap:wrap; padding:8px 14px; }
.a3c .ro.two { min-height:106px; } .a3c .ro .hv { flex:1; border-top:1px solid #E9ECF1; color:var(--muted); }
.a3c .ro .hv.on { color:var(--body); }
.a3c .ro b { color:var(--ink); } .a3c .ro .dt { font-weight:700; color:var(--ink); min-width:112px; }
.a3c .ro .mute { color:var(--faint); font-size:12.5px; } .a3c .ro .mk { color:var(--muted); font-size:12.5px; }
.a3c .ro .k { display:inline-block; width:14px; vertical-align:middle; margin-right:7px; border-radius:1px; }
.a3c .ro .sh { display:inline-block; width:12px; height:12px; vertical-align:-2px; margin-right:7px; border-radius:2px; background:rgba(79,70,229,.14); box-shadow:inset 1px 0 #818CF8, inset -1px 0 #818CF8; }
.a3c .ro .clr { margin-left:auto; border:1px solid var(--line); background:#fff; border-radius:6px; padding:4px 10px; font:600 12.5px Inter; color:var(--ink); cursor:pointer; }
.a3c .ro .clr:hover { background:var(--soft); }
.a3c svg { display:block; width:100%; overflow:visible; user-select:none; -webkit-user-select:none; }
.a3c .t { transition:d .75s cubic-bezier(.2,.8,.2,1), opacity .45s; }
.a3c .z { transition:transform .75s cubic-bezier(.2,.8,.2,1); transform-origin:0 0; }
.a3c .bd { transition:x .75s cubic-bezier(.2,.8,.2,1), width .75s cubic-bezier(.2,.8,.2,1), opacity .4s; }
.a3c .bl { transition:transform .75s cubic-bezier(.2,.8,.2,1), opacity .4s; font:600 10px Inter; letter-spacing:.06em; text-transform:uppercase; }
.a3c .fade > * { animation:a3cIn .45s ease both; }
@keyframes a3cIn { from { opacity:0; } to { opacity:1; } }
.a3c .hit { fill:transparent; cursor:crosshair; touch-action:pan-y; } .a3c.dragging .hit { cursor:col-resize; }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /**
   * build(el, { T, n: {all, ai:{key}}, markers:[{day, kind, text}], summary() -> html })
   * returns { data, set({ mode, period:[from,to], compare:[from,to] }) }
   */
  function build(el, { T, n, markers, summary }) {
    const ais = T.AIS.map((a) => ({ ...a, dot: a.key === 'perplexity' ? PERPLEXITY : a.dot }));
    const data = series(T), id = Math.random().toString(36).slice(2, 7);
    let S = { mode: 'all', period: [49, 55], compare: [42, 48] }, view = [D - 1 - MIN_VIEW, D - 1], lo = 20, hi = 52;
    let kept = null, down = null, dragging = false, hoverD = null;
    const xs = (d) => PL + ((d - view[0]) / (view[1] - view[0])) * PW;   // screen x in the current window
    const xf = (d) => PL + (d / (D - 1)) * PW;                           // full-span x, inside the zoomed group
    const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
    const NS = 'vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" fill="none"';
    el.classList.add('a3c');
    el.innerHTML = `<div class="ro two"><div class="pin"></div><div class="hv"></div></div>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="How often AI named ${T.PRACTICE}, each day and each week">
        <defs><clipPath id="pc-${id}"><rect x="${PL}" y="0" width="${PW}" height="${H}"/></clipPath></defs>
        <g class="grid"></g>
        <g clip-path="url(#pc-${id})">
          <rect class="bd bn" y="${PT}" height="${H - PT - PB}" fill="#EEF0FF"/><rect class="bd bc" y="${PT}" height="${H - PT - PB}" fill="#F3F4F6"/>
          <text class="bl blc" x="0" y="${H - PB - 7}" text-anchor="middle" fill="#6B7280">compared with</text><text class="bl bln" x="0" y="${H - PB - 7}" text-anchor="middle" fill="${WEEK}">now</text>
        </g>
        <g class="marks"></g>
        <g clip-path="url(#pc-${id})"><g class="z plot">
          <path class="t day" stroke="${DAYC}" stroke-width="1.5" ${NS}/>
          <path class="t wkc" stroke="#fff" stroke-width="6" ${NS}/>
          <path class="t wk" stroke="${WEEK}" stroke-width="2.5" ${NS}/>
          ${ais.map((a) => `<path class="t ai" data-k="${a.key}" stroke="${a.dot}" stroke-width="2" ${NS}/>`).join('')}
        </g></g>
        <g class="xl"></g>
        <g class="str" opacity="0"><rect class="sr" y="${PT}" height="${H - PT - PB}" fill="#4F46E5" fill-opacity=".08"/><line class="se1" y1="${PT}" y2="${H - PB}" stroke="#818CF8"/><line class="se2" y1="${PT}" y2="${H - PB}" stroke="#818CF8"/></g>
        <g class="ends"></g><g class="hov"></g>
        <rect class="hit" x="${PL}" y="0" width="${PW}" height="${H - PB}"/>
      </svg>`;
    const q = (s) => el.querySelector(s), qa = (s) => [...el.querySelectorAll(s)];
    const pin = q('.pin'), hv = q('.hv'), svg = q('svg');
    const sd = (p, d) => { p.style.d = `path("${d}")`; };
    const pts = (arr) => arr.map(([d, v]) => [xf(d), y(v)]);
    const weekOf = (key, d) => (key === 'all' ? data.all : data.ai[key]).weeks[Math.min(7, Math.floor(d / 7))];
    const lineKey = (c, w) => `<span class="k" style="background:${c};height:${w}px"></span>`;

    /** The window covers both compared stretches, at least 3 weeks, always ending yesterday. */
    function fitView() {
      const from = Math.min(S.period[0], S.compare ? S.compare[0] : S.period[0]);
      view = [Math.max(0, Math.min(from - 2, D - 1 - MIN_VIEW)), D - 1];
      const k = (D - 1) / (view[1] - view[0]);
      q('.plot').style.transform = `translate(${(PL - k * xf(view[0])).toFixed(2)}px,0) scale(${k.toFixed(4)},1)`;
    }
    function draw() {
      const all = S.mode === 'all';
      [lo, hi] = all ? [20, 52] : [10, 64];
      fitView();
      q('.grid').innerHTML = (all ? [20, 30, 40, 50] : [10, 30, 50]).map((v) => `<line x1="${PL}" x2="${W - PR}" y1="${y(v)}" y2="${y(v)}" stroke="${GRID}"/><text x="${PL - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="${AXIS}">${v / 10} in 10</text>`).join('');
      const wk = smooth(pts(weekPts(data.all.weeks, D - 1)));
      sd(q('.day'), smooth(pts(data.all.days.map((v, d) => [d, v])))); q('.day').style.opacity = all ? 1 : 0;
      sd(q('.wkc'), wk); sd(q('.wk'), wk); q('.wkc').style.opacity = all ? 1 : 0; q('.wk').style.opacity = all ? 1 : 0;
      // Each AI grows out of the overall week line, so switching reads as one line splitting into five.
      qa('.ai').forEach((p) => { sd(p, all ? wk : smooth(pts(weekPts(data.ai[p.dataset.k].weeks, D - 1)))); p.style.opacity = all ? 0 : 1; });
      bands(); axisAndMarks(); ends(); stretch(); readPin(); readHover(hoverD);
    }
    function bands() {
      const put = (r, t, [a, b], long, short) => {
        const x0 = xs(a) - 0.5 * (PW / (view[1] - view[0])), x1 = xs(b) + 0.5 * (PW / (view[1] - view[0]));
        r.style.x = `${x0}px`; r.style.width = `${Math.max(0, x1 - x0)}px`; r.style.opacity = 1;
        t.style.transform = `translate(${(x0 + x1) / 2}px,0)`; t.style.opacity = 1; t.textContent = x1 - x0 < 92 ? short : long;
      };
      put(q('.bn'), q('.bln'), S.period, 'now', 'now');
      if (S.compare) put(q('.bc'), q('.blc'), S.compare, 'compared with', 'before');
      else { q('.bc').style.opacity = 0; q('.blc').style.opacity = 0; }
    }
    function axisAndMarks() {
      q('.xl').innerHTML = Array.from({ length: D }, (_, d) => d).filter((d) => d >= view[0] && d % 7 === 0)
        .map((d) => `<line x1="${xs(d)}" x2="${xs(d)}" y1="${H - PB}" y2="${H - PB + 4}" stroke="#D1D5DB"/><text x="${xs(d)}" y="${H - 6}" font-size="11" fill="${AXIS}" text-anchor="middle">${md(d)}</text>`).join('');
      const g = q('.marks'); g.classList.remove('fade'); void g.getBoundingClientRect(); g.classList.add('fade');
      g.innerHTML = markers.filter((m) => m.day >= view[0]).map((m) => { const X = xs(m.day), c = m.kind === 'work' ? '#4F46E5' : m.kind === 'track' ? '#0B1020' : AXIS;
        const icon = m.kind === 'track' ? `<rect x="${X - 3.5}" y="${PT - 15}" width="7" height="7" fill="${c}" transform="rotate(45 ${X} ${PT - 11.5})"/>` : `<rect x="${X - 4}" y="${PT - 16}" width="8" height="8" rx="2" fill="${c}"/>`;
        return `<g><line x1="${X}" x2="${X}" y1="${PT - 4}" y2="${H - PB}" stroke="${m.kind === 'work' ? '#C7CBF5' : '#E4E7EC'}"/>${icon}</g>`; }).join('');
    }
    /** End labels in grey ink beside a short line key, with leader lines when they would collide. */
    function ends() {
      const g = q('.ends'), X = W - PR, lab = (ya, yl, txt, c, w, ink, weight) => `<line x1="${X + 6}" x2="${X + 14}" y1="${ya}" y2="${yl}" stroke="#D0D5DD"/><line x1="${X + 16}" x2="${X + 28}" y1="${yl}" y2="${yl}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><text x="${X + 34}" y="${yl + 4}" font-size="12" font-weight="${weight}" fill="${ink}">${txt}</text>`;
      g.classList.remove('fade'); void g.getBoundingClientRect(); g.classList.add('fade');
      if (S.mode === 'all') {
        const ew = y(weekOf('all', D - 1)), ed = y(data.all.days[D - 1]);
        let lw = ew, ld = ed; if (Math.abs(lw - ld) < 16) { if (lw <= ld) { lw -= 8; ld = lw + 16; } else { ld -= 8; lw = ld + 16; } }
        g.innerHTML = `<circle cx="${X}" cy="${ew}" r="4.5" fill="${WEEK}" stroke="#fff" stroke-width="2"/>${lab(ew, lw, 'each week', WEEK, 2.5, '#0B1020', 600)}${lab(ed, ld, 'each day', DAYC, 1.5, '#667085', 500)}`;
        return;
      }
      const e = ais.map((a) => ({ a, y: y(weekOf(a.key, D - 1)) })).sort((m, k) => m.y - k.y);
      e.forEach((it, i) => { it.ly = i && it.y - e[i - 1].ly < 15 ? e[i - 1].ly + 15 : it.y; });
      g.innerHTML = e.map((it) => `<circle cx="${X}" cy="${it.y}" r="4" fill="${it.a.dot}" stroke="#fff" stroke-width="2"/><line x1="${X + 6}" x2="${X + 14}" y1="${it.y}" y2="${it.ly}" stroke="#D0D5DD"/><text x="${X + 18}" y="${it.ly + 4}" font-size="12" fill="#344054">${it.a.name}</text>`).join('');
    }

    // ---- readout: line 1 = the period or the stretch; line 2 = whatever the pointer is on ----
    const active = () => (dragging && down ? [Math.min(down.d, hoverD), Math.max(down.d, hoverD)] : kept);
    function readPin() {
      const s = active();
      if (!s) { pin.innerHTML = summary(S); return; }
      const [a, b] = s, k = b - a + 1;
      const head = `<span class="dt"><span class="sh"></span>${span(a, b)} (${k} days)</span>`, clr = kept && !dragging ? '<button class="clr" type="button">Clear</button>' : '';
      if (S.mode === 'all') {
        const r = avg(data.all.days.slice(a, b + 1)), nn = n.all * k, [l1, h1] = range(r, nn);
        pin.innerHTML = `${head}<span><b>about ${inTen(r)} in every 10</b> answers named ${T.PRACTICE} (likely ${l1} to ${h1} in 100)</span><span class="mute">from ${nn.toLocaleString()} answers</span>${clr}`;
      } else {
        pin.innerHTML = `${head}<span class="mute">about, in every 10 answers:</span>${ais.map((ai) => `<span>${lineKey(ai.dot, 2)}${ai.name} <b>${inTen(avg(data.ai[ai.key].days.slice(a, b + 1)))}</b></span>`).join('')}${clr}`;
      }
    }
    function readHover(d) {
      q('.hov').innerHTML = '';
      hv.classList.toggle('on', d != null);
      if (d == null) {
        hv.innerHTML = `<span class="mute">${kept ? 'Hover still reads any day. Drag again for another stretch, or Clear.' : 'Hover for any day. Drag across the chart to read a stretch.'}</span>`;
        return;
      }
      const X = xs(d), w = Math.min(7, Math.floor(d / 7)), mk = markers.filter((m) => Math.floor(m.day / 7) === w).map((m) => `<span class="mk">${m.text}</span>`).join('');
      const dots = S.mode === 'all'
        ? `<circle cx="${X}" cy="${y(data.all.days[d])}" r="3.5" fill="${DAYC}" stroke="#fff" stroke-width="2"/><circle cx="${X}" cy="${y(weekOf('all', d))}" r="5" fill="${WEEK}" stroke="#fff" stroke-width="2"/>`
        : ais.map((a) => `<circle cx="${X}" cy="${y(weekOf(a.key, d))}" r="4" fill="${a.dot}" stroke="#fff" stroke-width="2"/>`).join('');
      q('.hov').innerHTML = `<line x1="${X}" x2="${X}" y1="${PT}" y2="${H - PB}" stroke="#475569" stroke-dasharray="2 2"/>${dots}`;
      if (S.mode === 'all') {
        const [l1, h1] = range(weekOf('all', d), n.all * 7);
        hv.innerHTML = `<span class="dt">${wd(d)}${d === D - 1 ? ' (yesterday)' : ''}</span><span>${lineKey(WEEK, 2.5)}Its week (${span(7 * w, 7 * w + 6)}): <b>about ${inTen(weekOf('all', d))} in 10</b>, likely ${l1} to ${h1} in 100</span><span>${lineKey(DAYC, 1.5)}That day: <b>${Math.round((data.all.days[d] / 100) * n.all)} of ${n.all}</b></span>${mk}`;
      } else {
        hv.innerHTML = `<span class="dt">Week of ${span(7 * w, 7 * w + 6)}</span><span class="mute">in every 10 answers:</span>${ais.map((a) => `<span>${lineKey(a.dot, 2)}${a.name} <b>${inTen(weekOf(a.key, d))}</b></span>`).join('')}${mk}`;
      }
    }
    function stretch() {
      const s = active(), g = q('.str');
      if (!s) { g.setAttribute('opacity', 0); return; }
      const half = 0.5 * (PW / (view[1] - view[0])), x0 = xs(s[0]) - half, x1 = xs(s[1]) + half;
      q('.sr').setAttribute('x', x0); q('.sr').setAttribute('width', Math.max(0, x1 - x0));
      q('.se1').setAttribute('x1', x0); q('.se1').setAttribute('x2', x0); q('.se2').setAttribute('x1', x1); q('.se2').setAttribute('x2', x1);
      g.setAttribute('opacity', 1);
    }
    function clearStretch() { kept = null; stretch(); readPin(); readHover(hoverD); }

    // ---- pointer: hover always reads; a press that moves more than a few pixels becomes a drag ----
    const dayAt = (e) => { const r = svg.getBoundingClientRect(), X = ((e.clientX - r.left) / r.width) * W; return Math.max(view[0], Math.min(view[1], Math.round(view[0] + ((X - PL) / PW) * (view[1] - view[0])))); };
    const hit = q('.hit');
    hit.addEventListener('pointerdown', (e) => { if (e.button) return; down = { d: dayAt(e), x: e.clientX }; dragging = false; hoverD = down.d; try { hit.setPointerCapture(e.pointerId); } catch (_) { /* old browsers */ } });
    hit.addEventListener('pointermove', (e) => {
      hoverD = dayAt(e);
      if (down && !dragging && Math.abs(e.clientX - down.x) > 5) { dragging = true; el.classList.add('dragging'); }
      if (dragging) { stretch(); readPin(); }
      readHover(hoverD);
    });
    hit.addEventListener('pointerup', () => {
      if (dragging) { const [a, b] = active(); kept = b > a ? [a, b] : null; } else if (down && kept) kept = null;   // a plain click clears a kept stretch
      down = null; dragging = false; el.classList.remove('dragging'); stretch(); readPin(); readHover(hoverD);
    });
    hit.addEventListener('pointerleave', () => { if (dragging) return; hoverD = null; readHover(null); });
    pin.addEventListener('click', (e) => { if (e.target.closest('.clr')) clearStretch(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape' && kept) clearStretch(); });

    return {
      data,
      set(s2) {
        if (s2.period && String(s2.period) !== String(S.period)) kept = null;   // a new period lets go of a dragged stretch
        S = { ...S, ...s2 };
        draw();
      },
    };
  }

  /** Weekly lines for a few series (Share of Voice: the practice and its rivals), readout above, hover per week. */
  function weekly(el, { lines, fmt, title }) {
    const WR = 176, PWW = W - PL - WR, last = D - 1;
    el.classList.add('a3c');
    const top = Math.ceil(Math.max(...lines.flatMap((l) => l.w)) / 5) * 5 + 5;
    const xx = (d) => PL + (d / last) * PWW, yy = (v) => PT + (1 - v / top) * (H - PT - PB);
    const path = (w) => smooth(weekPts(w, last).map(([d, v]) => [xx(d), yy(v)]));
    const order = [...lines].sort((a, b) => Number(!!a.lead) - Number(!!b.lead));
    const ends = lines.map((l) => ({ l, y: yy(l.w[7]) })).sort((a, b) => a.y - b.y);
    ends.forEach((it, i) => { it.ly = i && it.y - ends[i - 1].ly < 15 ? ends[i - 1].ly + 15 : it.y; });
    const X = W - WR;
    el.innerHTML = `<div class="ro"><div class="pin"></div></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of Voice each week">
      ${[0, top / 2, top].map((v) => `<line x1="${PL}" x2="${X}" y1="${yy(v)}" y2="${yy(v)}" stroke="${GRID}"/><text x="${PL - 8}" y="${yy(v) + 4}" text-anchor="end" font-size="11" fill="${AXIS}">${Math.round(v)} of 100</text>`).join('')}
      ${order.map((l) => `${l.lead ? `<path d="${path(l.w)}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>` : ''}<path d="${path(l.w)}" fill="none" stroke="${l.color}" stroke-width="${l.lead ? 2.5 : 2}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
      ${ends.map((it) => `<circle cx="${X}" cy="${it.y}" r="${it.l.lead ? 4.5 : 4}" fill="${it.l.color}" stroke="#fff" stroke-width="2"/><line x1="${X + 6}" x2="${X + 14}" y1="${it.y}" y2="${it.ly}" stroke="#D0D5DD"/><text x="${X + 18}" y="${it.ly + 4}" font-size="12" font-weight="${it.l.lead ? 600 : 400}" fill="${it.l.lead ? '#0B1020' : '#344054'}">${it.l.name}</text>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<line x1="${xx(7 * i)}" x2="${xx(7 * i)}" y1="${H - PB}" y2="${H - PB + 4}" stroke="#D1D5DB"/><text x="${xx(7 * i)}" y="${H - 6}" font-size="11" fill="${AXIS}" text-anchor="middle">${md(7 * i)}</text>`).join('')}
      <g class="hov"></g><rect class="hit" x="${PL}" y="0" width="${PWW}" height="${H - PB}"/></svg>`;
    const pin = el.querySelector('.pin'), hov = el.querySelector('.hov'), svg = el.querySelector('svg');
    const rest = () => { pin.innerHTML = title; hov.innerHTML = ''; };
    el.querySelector('.hit').addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect(), d = Math.max(0, Math.min(last, Math.round((((e.clientX - r.left) / r.width) * W - PL) / PWW * last))), i = Math.min(7, Math.floor(d / 7)), Xh = xx(7 * i + 3);
      hov.innerHTML = `<line x1="${Xh}" x2="${Xh}" y1="${PT}" y2="${H - PB}" stroke="#475569" stroke-dasharray="2 2"/>${lines.map((l) => `<circle cx="${Xh}" cy="${yy(l.w[i])}" r="${l.lead ? 5 : 4}" fill="${l.color}" stroke="#fff" stroke-width="2"/>`).join('')}`;
      pin.innerHTML = `<span class="dt">Week of ${span(7 * i, 7 * i + 6)}</span>${lines.map((l) => `<span><span class="k" style="background:${l.color};height:${l.lead ? 2.5 : 2}px"></span>${l.name} <b>${fmt(l.w[i])}</b></span>`).join('')}`;
    });
    el.querySelector('.hit').addEventListener('pointerleave', rest); rest();
  }

  window.A3C = { build, weekly, range, verdict, md, wd, span, D, PERPLEXITY };
})();
