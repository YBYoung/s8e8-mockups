/* Round 4 (#1417) Competitors: assembles the tab inside the shared frame and routes clicks to their handlers.
   Picking a competitor redraws the three lists for it and, if the orbit is open, switches the orbit too. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const C = window.RA4C; const { QBY, esc } = K;

  function drawSite(site) {
    C.cur = site; C.markPicked(site); C.hideTip();
    const s = C.bySite[site];
    document.querySelector('[data-detail]').innerHTML = `<div class="c4-pick"><span>Showing</span><b>${esc(site)}</b></div>${[C.sQuestions(s), C.sSubjects(s), C.sPages(s)].map(C.section).join('')}`;
    C.orbitFollow(site);
  }

  C.mount = function (main) {
    main.innerHTML = `<div class="c4">${C.opener()}<div data-detail></div>${C.section(C.sOrbit())}
      <div class="c4-end"><b>That is every question where a nearby competitor is ahead.</b><span>The Insights tab turns each one into its next step alongside the rest of the run.</span><a class="c4-btn line" href="ra-4-insights.html">Open Insights</a></div></div>`;
    drawSite(C.sites[0].site);
  };

  const redraw = (id) => document.querySelectorAll(`[data-actw="${id}"]`).forEach(el => { el.innerHTML = C.actHTML(QBY[id]); });
  document.addEventListener('click', (e) => {
    const r = e.target.closest('.c4-row');
    if (r) { if (r.dataset.site !== C.cur) drawSite(r.dataset.site); document.querySelector('[data-detail]').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const u = e.target.closest('[data-undo]');
    if (u) { delete C.done[u.dataset.undo]; redraw(u.dataset.undo); R.toast('Undone. Nothing was sent from this mockup.'); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const q = QBY[a.dataset.act];
    if (q.step === 'write') { C.done[q.id] = true; redraw(q.id); R.toast('Mockup: nothing was sent. In the app this adds the question to the content calendar as a new page.'); }
    else if (q.step === 'strengthen') R.toast(`Mockup: in the app this opens On-Page on ${esc(q.page)}, with this question loaded.`);
    else R.toast('Mockup: in the app this opens the task dialog for this page.');
  });
})();
