/* Round 4 (#1417) Insights: assembles the tab inside the shared frame, then routes every click to its handler. */
(function () {
  const R = window.RA4; const I = window.RA4I;
  I.mount = function (main) {
    const secs = [I.sWrite(), I.sStrengthen(), I.sMerge(), I.sComp(), I.sLocal()];
    main.innerHTML = `<div class="i4">${I.rail(secs)}<div class="i4-body">${I.opener()}${secs.map(I.section).join('')}
      <div class="i4-end"><b>That is everything this run found.</b><span>The Story tab has the month's plan; Tracking shows what changed since the last run.</span><a class="i4-btn line" href="ra-4-story.html">Back to the Story</a><a class="i4-btn line" href="ra-4-tracking.html">Open Tracking</a></div></div></div>`;
    I.spy(secs.map(s => s.id));
  };
  document.addEventListener('click', (e) => {
    const u = e.target.closest('[data-undo]');
    if (u) { I.state.clear(u.dataset.undo); R.toast('Undone. Nothing was sent from this mockup.'); return; }
    const go = e.target.closest('[data-go]');
    if (go) {
      const g = I.item(go.dataset.go);
      if (g.kind === 'write') { I.state.set(g.key, 'sent'); R.toast('Mockup: nothing was sent. In the app this adds the question to the content calendar as a new page.'); }
      else if (g.kind === 'strengthen') R.toast(`Mockup: in the app this opens On-Page on ${g.page}, with its ${R.n(g.questions.length, 'missed question', 'missed questions')} loaded.`);
      else I.openTask(g);
      return;
    }
    if (e.target.closest('[data-read-all]')) return I.openReader();
    const q = e.target.closest('[data-q]');
    if (q && !e.target.closest('.i4-rm')) I.openReader(q.dataset.q);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches && e.target.matches('i[data-q]')) I.openReader(e.target.dataset.q); });
})();
