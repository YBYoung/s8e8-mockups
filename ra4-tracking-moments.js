/* Round 4 (#1417) Tracking: draws the moments lane under the plot, as AIV chart 8 does. Each moment is a small shape
   by kind (never colour alone); moments that would touch merge into one marker with a count. Hover lists them; a click
   pins the list, with a zoom when they spread over more than one week. The next run is a dotted hairline on the plot, drawn by the chart. */
(function () {
  const T = window.RA4T; const { el, NS } = T.motion; const esc = T.K.esc;
  const MERGE_PX = 22;
  const KINDS = [{ id: 'page', label: 'Pages first seen in Google' }, { id: 'change', label: 'What we track changed' }, { id: 'work', label: 'Work we did' }];

  function shape(kind, cx, cy, parent, big) {
    const r = big ? 8 : 5.5, ink = '#0B1020';
    if (kind === 'work') return el('circle', { cx, cy, r, fill: ink }, parent);
    if (kind === 'change') return el('rect', { x: cx - r * 0.8, y: cy - r * 0.8, width: r * 1.6, height: r * 1.6, fill: ink, transform: `rotate(45 ${cx} ${cy})` }, parent);
    if (kind === 'next') return el('circle', { cx, cy, r: r - 0.5, fill: '#fff', stroke: '#0F766E', 'stroke-width': 1.5, 'stroke-dasharray': '2 2' }, parent);
    return el('circle', { cx, cy, r: r - 0.75, fill: '#fff', stroke: '#64748B', 'stroke-width': 1.5 }, parent);
  }
  const shapeSvg = (kind) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('width', 14); s.setAttribute('height', 14); s.setAttribute('aria-hidden', 'true'); shape(kind, 7, 7, s); return s.outerHTML; };
  const line = (m) => m.kind === 'page' ? `First seen in Google: ${esc(m.title)}` : esc(m.title);

  function attach(c, card) {
    c.kindOn = { page: true, change: true, work: true };
    c.moments = () => T.moments.concat(T.S.changes, T.S.works);
    c.lit = null; c.clusters = [];
    const pop = card.querySelector('.t4-pop'), pin = card.querySelector('.t4-pin');

    function draw() {
      c.gMom.innerHTML = '';
      const { AX } = c, cy = c.LANE;
      el('line', { x1: c.M.l, x2: c.M.l + c.PW, y1: cy, y2: cy, stroke: '#F1F2F5' }, c.gMom);
      const shown = c.moments().filter((m) => c.kindOn[m.kind] && m.f >= AX.d0 - 0.01 && m.f <= AX.d1 + 0.01 && (m.op ?? 1) > 0.01).sort((a, b) => a.f - b.f);
      const clusters = [];
      shown.forEach((m) => { const x = c.x(m.f), last = clusters[clusters.length - 1];
        if (last && x - last.x1 < MERGE_PX) { last.items.push(m); last.x1 = x; } else clusters.push({ x0: x, x1: x, items: [m] }); });
      c.clusters = clusters;
      clusters.forEach((cl) => {
        const x = (cl.x0 + cl.x1) / 2, g = el('g', { opacity: Math.max(...cl.items.map((m) => m.op ?? 1)) }, c.gMom);
        const hot = cl.items.some((m) => c.lit && c.lit.includes(m.id));
        if (hot) el('line', { x1: x, x2: x, y1: c.PT, y2: cy - 11, stroke: '#0F766E', opacity: 0.55, 'stroke-dasharray': '3 3' }, g);
        if (cl.items.length === 1) shape(cl.items[0].kind, x, cy, g, hot);
        else {
          el('rect', { x: x - 11, y: cy - 9, width: 22, height: 18, rx: 6, fill: hot ? '#0F766E' : '#fff', stroke: hot ? '#0F766E' : '#0B1020', 'stroke-width': 1.3 }, g);
          el('text', { x, y: cy + 4, class: 't4-count', 'text-anchor': 'middle', fill: hot ? '#fff' : '#0B1020' }, g).textContent = cl.items.length;
        }
        const hit = el('rect', { x: x - 14, y: cy - 14, width: 28, height: 28, fill: 'transparent', class: 't4-hit', tabindex: 0, role: 'button',
          'aria-label': cl.items.length > 1 ? `${cl.items.length} moments, open the list` : line(cl.items[0]) }, g);
        hit.addEventListener('mouseenter', () => fan(cl, x)); hit.addEventListener('focus', () => fan(cl, x));
        hit.addEventListener('mouseleave', () => { pop.classList.remove('on'); c.light(null); });
        hit.addEventListener('pointerdown', (e) => { e.preventDefault(); openPin(cl, x); }); hit.addEventListener('keydown', (e) => { if (e.key === 'Enter') openPin(cl, x); });
      });
    }
    function place(html, x) {
      const r = c.svg.getBoundingClientRect(), cr = card.getBoundingClientRect();
      pop.innerHTML = html;
      pop.style.left = `${Math.max(0, Math.min(cr.width - 330, r.left - cr.left + (x / c.W) * r.width - 24))}px`;
      pop.style.top = `${r.top - cr.top + ((c.LANE - 16) / c.H) * r.height - pop.offsetHeight}px`;
      pop.classList.add('on');
    }
    function fan(cl, x) {
      const items = cl.items.slice().sort((a, b) => b.f - a.f), many = items.length > 6;
      place(items.slice(0, 6).map((m) => `<div class="row">${shapeSvg(m.kind)}<span><b>${T.day(m.iso)}</b> ${line(m)}</span></div>`).join('')
        + (many ? `<div class="more">and ${items.length - 6} more. Click for the full list.</div>` : cl.items.length > 1 ? '<div class="more">Click to list these.</div>' : ''), x);
      c.light(cl.items.map((m) => m.id));
    }
    function openPin(cl, x) {
      pop.classList.remove('on');
      const items = cl.items.slice().sort((a, b) => b.f - a.f || a.title.localeCompare(b.title));
      const weeks = new Set(items.map((m) => Math.round(m.f))).size;
      const first = items[items.length - 1], last = items[0];
      pin.innerHTML = `<div class="ph"><b>${items.length === 1 ? 'One moment' : `${items.length} moments`}, ${T.day(first.iso)}${first.iso !== last.iso ? ` to ${T.day(last.iso)}` : ''}</b><button class="x" aria-label="Close">×</button></div>
        <ul>${items.map((m) => `<li data-id="${m.id}">${shapeSvg(m.kind)}<span class="d">${T.day(m.iso)}</span><span>${line(m)}${m.why ? `<i>Why: ${esc(m.why)}</i>` : ''}</span></li>`).join('')}</ul>
        ${weeks > 1 ? `<button class="t4-ghost" data-zoom>Zoom in on these ${weeks} weeks</button>` : ''}`;
      const r = c.svg.getBoundingClientRect(), cr = card.getBoundingClientRect();
      pin.style.left = `${Math.max(0, Math.min(cr.width - 380, r.left - cr.left + (x / c.W) * r.width - 40))}px`;
      pin.style.top = `${Math.max(0, r.top - cr.top + ((c.LANE - 16) / c.H) * r.height - pin.offsetHeight)}px`;
      pin.classList.add('on');
      pin.querySelector('.x').onclick = () => pin.classList.remove('on');
      pin.querySelectorAll('li').forEach((li) => { li.onmouseenter = () => c.light([li.dataset.id]); li.onmouseleave = () => c.light(null); });
      const z = pin.querySelector('[data-zoom]'); if (z) z.onclick = () => { pin.classList.remove('on'); c.zoomTo(first.f - 1.5, last.f + 1.5); };
    }
    c.light = (ids) => { if ((ids || []).join() === (c.lit || []).join()) return; c.lit = ids; card.querySelectorAll('.t4-notes li').forEach((li) => li.classList.toggle('lit', !!ids && li.dataset.ids.split(',').some((id) => ids.includes(id)))); draw(); };
    document.addEventListener('pointerdown', (e) => { if (pin.classList.contains('on') && !pin.contains(e.target) && !e.target.closest('.t4-hit')) pin.classList.remove('on'); });
    c.hooks.push(draw);
  }

  T.Moments = { attach, KINDS, shapeSvg, line };
})();
