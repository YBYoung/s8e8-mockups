/* Round 4 (#1417) Insights: opens the every-question reader over the page (AIV answer reader pattern).
   Subjects on the left, the subject's questions in the middle, the picked question on the right; arrows step, Esc closes. */
(function () {
  const K = window.RA3D2; const I = window.RA4I;
  const { D, Q, QBY, esc, COLORS } = K; const C = COLORS.light;
  const NEED = { gap: 0, thin: 1, covered: 2 };
  const GROUP = { priority: 'Main services', other: 'Other services', practice: 'Choosing the practice' };
  const flat = []; D.topics.forEach(t => Q.filter(q => q.topic === t.name).sort((a, b) => NEED[a.verdict] - NEED[b.verdict] || b.h.weight - a.h.weight).forEach(q => flat.push(q)));
  let box = null, at = 0;

  function topics() {
    let grp = '';
    return D.topics.map(t => {
      const head = GROUP[t.tier] !== grp ? `<div class="i4-gl rg">${GROUP[t.tier]}</div>` : ''; grp = GROUP[t.tier];
      const seg = (n, col) => n ? `<i style="flex:${n};background:${col}"></i>` : '';
      return `${head}<button type="button" class="rt" data-rt="${esc(t.name)}"><span class="nm">${esc(t.name)}</span><span class="mb" data-tip-h="${esc(t.name)}" data-tip="${t.covered} in full, ${t.thin} in part, ${t.gap} not answered.">${seg(t.covered, C.covered)}${seg(t.thin, C.thin)}${seg(t.gap, C.gap)}</span><span class="ct">${t.n}</span></button>`;
    }).join('');
  }
  function draw() {
    const q = flat[at]; const mates = flat.filter(x => x.topic === q.topic); const i = mates.indexOf(q);
    box.querySelectorAll('.rt').forEach(b => b.classList.toggle('on', b.dataset.rt === q.topic));
    box.querySelector('.rl').innerHTML = `<div class="rlh">${esc(q.topic)}: ${mates.filter(x => x.verdict !== 'covered').length} of ${mates.length} not answered in full</div>` +
      mates.map(x => `<button type="button" class="rc${x === q ? ' on' : ''}" data-rq="${x.id}"><i class="i4-sq" style="background:${C[x.verdict]}"></i><span><span class="t">${esc(x.text)}</span><span class="m">${I.WORD[x.verdict]}${x.comp && x.comp.verdict === 'covered' && x.verdict !== 'covered' ? ` · ${esc(x.comp.site)} in full` : ''}</span></span></button>`).join('');
    const rd = box.querySelector('.rr'); rd.querySelector('.rb').innerHTML = I.readerDetail(q); rd.scrollTop = 0;
    box.querySelector('[data-pos]').textContent = `${i + 1} of ${mates.length} in ${q.topic}`;
    box.querySelector('[data-prev]').disabled = at === 0; box.querySelector('[data-next]').disabled = at === flat.length - 1;
    box.querySelector('.rc.on')?.scrollIntoView({ block: 'nearest' }); box.querySelector('.rt.on')?.scrollIntoView({ block: 'nearest' });
  }
  const step = (d) => { at = Math.max(0, Math.min(flat.length - 1, at + d)); draw(); };
  function close() { if (!box) return; box.classList.remove('in'); const b = box; box = null; document.documentElement.style.overflow = ''; setTimeout(() => b.remove(), 180); }
  function onKey(e) {
    if (!box || document.querySelector('.i4-scrim')) return;
    if (e.key === 'Escape') { close(); e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { step(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { step(-1); e.preventDefault(); }
  }
  document.addEventListener('keydown', onKey);

  I.openReader = function (qid) {
    I.hideTip && I.hideTip();
    at = Math.max(0, flat.indexOf(QBY[qid] || flat.find(q => q.verdict !== 'covered')));
    if (!box) {
      box = K.h(`<div class="i4-rm" role="dialog" aria-modal="true" aria-label="Every question"><div class="rbox">
        <div class="rhead"><div><div class="i4-gl">Every question checked</div><div class="rtitle">${D.counts.questions} questions, ${esc(D.practice)}</div></div><button type="button" class="rx" aria-label="Close">×</button></div>
        <div class="rcols"><nav class="rs">${topics()}</nav><div class="rl"></div>
          <div class="rr"><div class="rb"></div><div class="rf"><button type="button" data-prev>‹ Previous</button><span data-pos></span><button type="button" data-next>Next ›</button><span class="hint">← → to move · Esc to close</span></div></div></div></div></div>`);
      document.body.appendChild(box); document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => box.classList.add('in'));
      box.addEventListener('click', (e) => {
        if (e.target === box || e.target.closest('.rx')) return close();
        const t = e.target.closest('[data-rt]'); if (t) { at = flat.findIndex(q => q.topic === t.dataset.rt); return draw(); }
        const c = e.target.closest('[data-rq]'); if (c) { at = flat.indexOf(QBY[c.dataset.rq]); return draw(); }
        if (e.target.closest('[data-prev]')) step(-1); if (e.target.closest('[data-next]')) step(1);
      });
    }
    draw();
  };
})();
