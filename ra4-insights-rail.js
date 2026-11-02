/* Round 4 (#1417) Insights: renders the sticky contents rail, whose one-line verdicts read as a summary of the tab.
   The section in view lights up, a thin bar shows how far down the page is, a click jumps to a section. */
(function () {
  const I = window.RA4I; const K = window.RA3D2;
  I.jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  I.rail = (secs) => `<nav class="i4-rail" aria-label="Insights contents"><div class="i4-eye">On this page</div>
    ${secs.map(s => `<a href="#${s.id}" class="ri" data-ri="${s.id}"><span class="n">${+s.no}</span><span class="w"><b>${s.rail}</b><small>${s.verdict}</small></span></a>`).join('')}
    <button type="button" class="ri rd" data-read-all><span class="n"><svg viewBox="0 0 16 16"><path d="M2 3h5v10H2zM9 3h5v10H9z"/></svg></span><span class="w"><b>Every question</b><small>${K.D.counts.questions} in ${K.D.topics.length} subjects</small></span></button>
    <div class="bar"><i></i></div><button type="button" class="top" data-top>Back to the top ↑</button></nav>`;
  I.spy = function (ids) {
    const bar = document.querySelector('.i4-rail .bar i');
    const tick = () => {
      let on = null; ids.forEach(id => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= 200) on = id; });
      const se0 = document.scrollingElement; if (on && se0.scrollTop + se0.clientHeight >= se0.scrollHeight - 4) on = ids[ids.length - 1];
      document.querySelectorAll('[data-ri]').forEach(a => a.classList.toggle('on', a.dataset.ri === on));
      const se = document.scrollingElement; bar.style.width = Math.round(100 * se.scrollTop / Math.max(1, se.scrollHeight - se.clientHeight)) + '%';
    };
    window.addEventListener('scroll', tick, { passive: true }); tick();
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-ri]'); if (a) { e.preventDefault(); I.jump(a.dataset.ri); }
      if (e.target.closest('[data-top]')) window.scrollTo({ top: 0, behavior: 'smooth' });
      const j = e.target.closest('[data-jump]'); if (j) I.jump(j.dataset.jump);
    });
  };
})();
