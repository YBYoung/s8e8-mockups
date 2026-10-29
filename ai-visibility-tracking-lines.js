/* Five line-chart variations for Tracking (owner 10/29: "I still wanted lines"). Same seeded data in all five.
   Every chart: readout strip ABOVE the plot (never over it), a guide line and a dot on hover, smooth morphs. */
(function () {
  const T = window.TRK;
  const W = 760, H = 250, L = 6, R = 70, TP = 18, B = 34, D = 56;
  const x = (d) => L + (d / (D - 1)) * (W - L - R), base = H - B;
  const DAY = new Date(2026, 10, 1);
  const date = (d, o) => new Date(2026, 10, 1 + Math.round(d)).toLocaleDateString('en-US', o);
  const md = (d) => date(d, { month: 'short', day: 'numeric' }), wd = (d) => date(d, { weekday: 'short', month: 'short', day: 'numeric' });
  const span = (a, b) => (a === b ? md(a) : date(a, { month: 'short' }) === date(b, { month: 'short' }) ? `${md(a)} to ${date(b, { day: 'numeric' })}` : `${md(a)} to ${md(b)}`);
  const avg = (a) => a.reduce((t, v) => t + v, 0) / a.length;
  function range(per100, n) {
    const p = per100 / 100, z = 1.96, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [Math.max(0, ((c - m) / d) * 100), Math.min(100, ((c + m) / d) * 100)];
  }
  const N = { all: 258, chatgpt: 42, gemini: 54, aio: 54, aimode: 54, perplexity: 54 };

  // Seeded days, weeks (avg of 7 days, plotted at mid-week), rolling 7 days (each day = the 7 ending that day).
  let s = 11; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 - 0.5; };
  const mk = (w, wob) => w.flatMap((v) => Array.from({ length: 7 }, () => Math.max(1, Math.min(95, v + rnd() * wob))));
  const SER = {}; T.AIS.forEach((a) => { SER[a.key] = mk(a.w, 26); });
  SER.all = Array.from({ length: D }, (_, d) => avg(T.AIS.map((a) => SER[a.key][d])));
  const weeks = (dd) => Array.from({ length: 8 }, (_, i) => avg(dd.slice(7 * i, 7 * i + 7)));
  const roll = (dd) => dd.map((_, d) => avg(dd.slice(Math.max(0, d - 6), d + 1)));
  const WK_X = Array.from({ length: 8 }, (_, i) => 7 * i + 3);

  /** Smooth path through points (Catmull-Rom as cubic Beziers): the command count depends only on the point count, so paths morph. */
  function smooth(pts) {
    let p = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      p += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return p;
  }
  const band = (top, bot) => `${smooth(top)} L${bot[bot.length - 1][0].toFixed(1)},${bot[bot.length - 1][1].toFixed(1)}${smooth([...bot].reverse()).replace(/^M[^C]+/, '')} Z`;
  const setD = (el, p) => { if (el) el.style.d = `path("${p}")`; };

  const css = `
.lv { border:1px solid var(--line); border-radius:14px; padding:18px 20px 14px; margin:0 0 26px; }
.lv h3 { margin:0; font:800 19px Inter; color:var(--ink); } .lv .num { font:700 11px Inter; letter-spacing:.12em; color:var(--a-ink); text-transform:uppercase; }
.lv .how { margin:4px 0 12px; font-size:13.5px; color:var(--muted); max-width:820px; }
.lv .ro { min-height:46px; display:flex; align-items:center; gap:8px 22px; flex-wrap:wrap; padding:9px 14px; border-radius:10px; background:var(--soft); font-size:13.5px; margin-bottom:8px; transition:background .2s; }
.lv .ro.hov { background:var(--a-tint); } .lv .ro b { color:var(--ink); } .lv .ro .dt { font-weight:700; color:var(--ink); min-width:140px; } .lv .ro .mk { color:var(--muted); font-size:12.5px; }
.lv svg { display:block; width:100%; overflow:visible; }
.lv .t { transition:d .75s cubic-bezier(.4,0,.2,1), opacity .5s, stroke .6s, fill-opacity .5s; }
.lv .g { transition:x .6s cubic-bezier(.4,0,.2,1), width .6s cubic-bezier(.4,0,.2,1), opacity .4s, transform .6s cubic-bezier(.4,0,.2,1); }
.lv .gt { transition:transform .75s cubic-bezier(.4,0,.2,1), opacity .5s; }
.lv .hit { fill:transparent; cursor:crosshair; }
.lv .lab { font:600 12px Inter; }
.lv .keys { display:flex; flex-wrap:wrap; gap:6px 20px; font-size:12.5px; color:var(--muted); margin-top:6px; } .lv .keys i { display:inline-block; vertical-align:middle; margin-right:7px; }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /**
   * One variation. kind: 'band' | 'daywk' | 'area' | 'focus' | 'roll'.
   * Returns set({ mode: 'all'|'each', period: [a,b], compare: [a,b] }).
   */
  function chart(el, kind) {
    const keys = ['all', ...T.AIS.map((a) => a.key)], colorOf = (k) => (k === 'all' ? '#4338CA' : T.AIS.find((a) => a.key === k).dot);
    const daily = kind === 'roll' || kind === 'daywk';
    el.innerHTML = `<div class="ro"></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trend">
      <g class="grid"></g>
      <defs><linearGradient id="ga-${kind}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6366F1" stop-opacity=".28"/><stop offset="1" stop-color="#6366F1" stop-opacity="0"/></linearGradient>
        <clipPath id="cn-${kind}"><rect class="g cnow" y="0" height="${H}"/></clipPath><clipPath id="cc-${kind}"><rect class="g ccmp" y="0" height="${H}"/></clipPath></defs>
      ${[{ day: 26, k: 'work' }, { day: 36, k: 'method' }, { day: 43, k: 'track' }].map((m) => `<line x1="${x(m.day)}" x2="${x(m.day)}" y1="${TP}" y2="${base}" stroke="${m.k === 'work' ? '#A5B4FC' : m.k === 'track' ? '#667085' : '#D0D5DD'}" stroke-dasharray="3 4"/>
        ${m.k === 'track' ? `<rect x="${x(m.day) - 4}" y="${TP - 12}" width="8" height="8" fill="#0B1020" transform="rotate(45 ${x(m.day)} ${TP - 8})"/>` : `<rect x="${x(m.day) - 4.5}" y="${TP - 13}" width="9" height="9" rx="2" fill="${m.k === 'work' ? '#4F46E5' : '#98A2B3'}"/>`}`).join('')}
      <path class="t bnd" fill="${kind === 'area' ? `url(#ga-${kind})` : '#6366F1'}" fill-opacity="${kind === 'area' ? 1 : 0.13}" stroke="none"/>
      <path class="t hi" fill="none" stroke="#818CF8" stroke-width="1.2" stroke-dasharray="4 4"/><path class="t lo" fill="none" stroke="#818CF8" stroke-width="1.2" stroke-dasharray="4 4"/>
      <path class="t day" fill="none" stroke="#A5B4FC" stroke-width="1.5" stroke-linejoin="round"/>
      ${keys.map((k) => `<path class="t ln" data-k="${k}" fill="none" stroke="${kind === 'focus' && k === 'all' ? '#D0D5DD' : colorOf(k)}" stroke-width="${k === 'all' ? 3 : 2.5}" stroke-linecap="round"/>`).join('')}
      <path class="t fc" clip-path="url(#cc-${kind})" fill="none" stroke="#667085" stroke-width="3.5" stroke-linecap="round"/>
      <path class="t fn" clip-path="url(#cn-${kind})" fill="none" stroke="#4338CA" stroke-width="4" stroke-linecap="round"/>
      <g class="gt fnl"><text class="lab" text-anchor="middle" fill="#4338CA"></text></g><g class="gt fcl"><text class="lab" text-anchor="middle" fill="#475467"></text></g>
      <rect class="g pnow" y="${base + 20}" height="4" rx="2" fill="#4F46E5"/><rect class="g pcmp" y="${base + 20}" height="4" rx="2" fill="#98A2B3"/>
      <text class="g lnow lab" y="${base + 33}" fill="#4338CA" font-size="11">now</text><text class="g lcmp lab" y="${base + 33}" fill="#667085" font-size="11">compared with</text>
      <g class="ends"></g>
      <line class="guide" y1="${TP}" y2="${base}" stroke="#0B1020" stroke-opacity="0" stroke-width="1"/>
      <g class="dots"></g>
      ${Array.from({ length: D }, (_, d) => `<rect class="hit" data-d="${d}" x="${x(d) - (x(1) - x(0)) / 2}" y="0" width="${x(1) - x(0)}" height="${base}"/>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<text x="${x(7 * i + 3)}" y="${base + 14}" font-size="11" fill="#98A2B3" text-anchor="middle">${md(7 * i)}</text>`).join('')}
    </svg><div class="keys"></div>`;
    const q = (k) => el.querySelector(k), qa = (k) => [...el.querySelectorAll(k)], ro = q('.ro');
    let S = null, lo0 = 20, hi0 = 56;
    const y = (v) => TP + (1 - (v - lo0) / (hi0 - lo0)) * (base - TP);
    const daily2 = kind === 'roll' || kind === 'focus';
    const line = (k) => (daily2 ? roll(SER[k]).map((v, d) => [x(d), y(v)]) : weeks(SER[k]).map((v, i) => [x(WK_X[i]), y(v)]));
    const vals = (k) => (daily2 ? roll(SER[k]) : weeks(SER[k]));
    const nOf = (k) => N[k] * 7;
    function draw() {
      const all = S.mode === 'all';
      [lo0, hi0] = all ? [20, 56] : [10, 64];
      q('.grid').innerHTML = (all ? [20, 30, 40, 50] : [10, 30, 50]).map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#F2F4F7"/><text x="${L}" y="${y(v) - 5}" font-size="11" fill="#98A2B3" stroke="#fff" stroke-width="4" paint-order="stroke">${v / 10} in 10</text>`).join('');
      const v = vals('all'), xs = daily2 ? v.map((_, d) => x(d)) : WK_X.map(x);
      const top = v.map((p, i) => [xs[i], y(range(p, nOf('all'))[1])]), bot = v.map((p, i) => [xs[i], y(range(p, nOf('all'))[0])]);
      const showBand = all && (kind === 'band' || kind === 'roll' || kind === 'area' || kind === 'focus');
      const bnd = q('.bnd');
      setD(bnd, kind === 'area' ? `${smooth(line('all'))} L${xs[xs.length - 1]},${base} L${xs[0]},${base} Z` : band(top, bot));
      bnd.style.opacity = kind === 'area' ? (all ? 1 : 0) : showBand ? (kind === 'focus' ? 0.6 : 1) : 0;
      setD(q('.hi'), smooth(top)); setD(q('.lo'), smooth(bot)); q('.hi').style.opacity = q('.lo').style.opacity = kind === 'area' && all ? 1 : 0;
      setD(q('.day'), smooth(SER.all.map((p, d) => [x(d), y(p)]).filter((_, d) => true)).replace(/C/g, 'C')); q('.day').style.opacity = kind === 'daywk' && all ? 1 : 0;
      qa('.ln').forEach((p) => { const k = p.dataset.k; setD(p, smooth(line(all || k === 'all' ? 'all' : k))); p.style.opacity = k === 'all' ? (all ? 1 : 0) : all ? 0 : 1; });
      // focus: the now and compared stretches drawn bold over the grey line, labelled with their numbers
      const isF = kind === 'focus' && all;
      setD(q('.fn'), smooth(line('all'))); setD(q('.fc'), smooth(line('all'))); q('.fn').style.opacity = isF ? 1 : 0; q('.fc').style.opacity = isF ? 1 : 0;
      const pad = 0.5 * (x(1) - x(0)), cl = (r, [a, b]) => { r.style.x = `${x(a) - pad}px`; r.style.width = `${x(b) - x(a) + 2 * pad}px`; };
      cl(q('.cnow'), S.period); cl(q('.ccmp'), S.compare);
      const rate = (k, [a, b]) => avg(SER[k].slice(a, b + 1));
      const seg = (a, b) => vals('all').slice(a, b + 1);
      const lab = (g, [a, b], k, above) => { const r = rate('all', [a, b]), yy = above ? y(Math.max(...seg(a, b))) - 26 : y(Math.min(...seg(a, b))) + 34;
        g.style.transform = `translate(${Math.min((x(a) + x(b)) / 2, W - R - 40)}px,${yy}px)`; g.style.opacity = isF ? 1 : 0; g.querySelector('text').textContent = `${k}: about ${Math.round(r / 10)} in 10`; };
      lab(q('.fnl'), S.period, 'Now', true); lab(q('.fcl'), S.compare, 'Before', false);
      // period strip under the axis (all but focus, which shows it on the line itself)
      const strip = (r, t, [a, b], show) => { r.style.x = `${x(a) - pad}px`; r.style.width = `${x(b) - x(a) + 2 * pad}px`; r.style.opacity = show ? 1 : 0; t.style.transform = `translate(${x(a) - pad}px,0)`; t.style.opacity = show ? 1 : 0; };
      strip(q('.pnow'), q('.lnow'), S.period, !isF); strip(q('.pcmp'), q('.lcmp'), S.compare, !isF);
      q('.lcmp').textContent = x(S.compare[1]) - x(S.compare[0]) < 120 ? 'before' : 'compared with';
      // labels at the right end, so no legend to decode
      const endY = (k) => y(vals(k)[vals(k).length - 1]);
      q('.ends').innerHTML = all
        ? (kind === 'daywk' ? (() => { let a = endY('all'), b = y(SER.all[D - 1]); if (Math.abs(a - b) < 16) { if (a <= b) b = a + 16; else a = b + 16; } return `<text class="lab" x="${W - R + 10}" y="${a + 4}" fill="#3730A3">each week</text><text class="lab" x="${W - R + 10}" y="${b + 4}" fill="#818CF8">each day</text>`; })() : '')
        : T.AIS.map((a) => ({ a, yv: endY(a.key) })).sort((m, n) => m.yv - n.yv).map((m, i, arr) => { const yy = i && m.yv - arr[i - 1].yv < 13 ? arr[i - 1].yv + 13 : m.yv; arr[i].yv = yy; return `<text class="lab" x="${W - R + 10}" y="${yy + 4}" fill="${m.a.dot}">${m.a.name}</text>`; }).join('');
            rest();
    }
    function rest() {
      ro.classList.remove('hov'); q('.guide').setAttribute('stroke-opacity', 0); q('.dots').innerHTML = '';
      const [a, b] = S.period, r = avg(SER.all.slice(a, b + 1)), n = N.all * (b - a + 1), [lo, hi] = range(r, n).map(Math.round);
      ro.innerHTML = `<span class="dt">${S.label}, ${span(a, b)}</span><span><b>about ${Math.round(r / 10)} in every 10</b> answers named ${T.PRACTICE}</span><span>likely ${lo} to ${hi} in every 100, from ${n.toLocaleString()} answers</span><span class="mk">Hover the chart for any day.</span>`;
    }
    function hover(d) {
      const all = S.mode === 'all', wk = Math.min(7, Math.floor(d / 7)), ks = all ? ['all'] : T.AIS.map((a) => a.key);
      const at = (k) => (daily2 ? roll(SER[k])[d] : weeks(SER[k])[wk]);
      const gx = daily2 || kind === 'daywk' ? x(d) : x(WK_X[wk]);
      const g = q('.guide'); g.setAttribute('x1', gx); g.setAttribute('x2', gx); g.setAttribute('stroke-opacity', 0.25);
      q('.dots').innerHTML = ks.map((k) => `<circle cx="${gx}" cy="${y(at(k))}" r="5" fill="#fff" stroke="${colorOf(k)}" stroke-width="2.5"/>`).join('')
        + (kind === 'daywk' && all ? `<circle cx="${x(d)}" cy="${y(SER.all[d])}" r="4" fill="#fff" stroke="#A5B4FC" stroke-width="2"/>` : '');
      ro.classList.add('hov');
      const what = daily2 ? `The 7 days to ${md(d)}` : `Week of ${span(7 * wk, 7 * wk + 6)}`;
      if (all) {
        const [lo, hi] = range(at('all'), nOf('all')).map(Math.round), k1 = Math.round((SER.all[d] / 100) * N.all);
        ro.innerHTML = `<span class="dt">${what}</span><span><b>about ${Math.round(at('all') / 10)} in every 10</b>, likely ${lo} to ${hi} in every 100</span>${kind === 'daywk' ? `<span>${wd(d)} alone: ${k1} of ${N.all} answers</span>` : ''}`;
      } else ro.innerHTML = `<span class="dt">${what}</span>${T.AIS.map((a) => `<span><span class="aidot" style="background:${a.dot}"></span>${a.name} <b>${Math.round(at(a.key))}</b> in 100</span>`).join('')}`;
    }
    qa('.hit').forEach((h) => h.addEventListener('mouseenter', () => hover(+h.dataset.d)));
    q('svg').addEventListener('mouseleave', rest);
    const KEYS = {
      band: '<span><i style="width:20px;height:3px;background:#4338CA"></i>each week</span><span><i style="width:20px;height:10px;background:rgba(99,102,241,.13)"></i>likely range</span>',
      daywk: '<span><i style="width:20px;height:3px;background:#4338CA"></i>each week</span><span><i style="width:20px;height:1.5px;background:#A5B4FC"></i>each day</span>',
      area: '<span><i style="width:20px;height:3px;background:#4338CA"></i>each week</span><span><i style="width:20px;border-top:1.5px dashed #818CF8"></i>likely high and low</span>',
      focus: '<span><i style="width:20px;height:4px;background:#4338CA"></i>now</span><span><i style="width:20px;height:4px;background:#667085"></i>compared with</span><span><i style="width:20px;height:3px;background:#D0D5DD"></i>the rest of the weeks</span>',
      roll: '<span><i style="width:20px;height:3px;background:#4338CA"></i>each point: the 7 days ending that day</span><span><i style="width:20px;height:10px;background:rgba(99,102,241,.13)"></i>likely range</span>',
    };
    const MK = '<span><i style="width:9px;height:9px;border-radius:2px;background:#4F46E5"></i>Nov 27: veneers page</span><span><i style="width:9px;height:9px;border-radius:2px;background:#98A2B3"></i>Dec 7: Perplexity update</span><span><i style="width:8px;height:8px;background:#0B1020;transform:rotate(45deg)"></i>Dec 14: tracking changed</span>';
    return { set(s2) { S = { ...S, ...s2 }; q('.keys').innerHTML = (S.mode === 'all' ? KEYS[kind] : '') + MK; draw(); } };
  }
  window.LINES = { chart, span, md };
})();
