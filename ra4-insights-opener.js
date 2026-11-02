/* Round 4 (#1417) Insights: renders the opener, one headline and three things worth doing that jump to their sections. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { D, esc, COLORS } = K; const C = COLORS.light;
  I.opener = function () {
    const c = D.counts; const w = R.byKind.write[0], s = R.byKind.strengthen[0];
    const site = D.competitors.map(x => ({ site: x.site, n: R.compQs.filter(q => q.comp.site === x.site).length })).sort((a, b) => b.n - a.n)[0];
    const cards = [
      w && { jump: 'write', k: 'Write first', v: esc(w.title), go: `See the ${R.n(R.byKind.write.length, 'new page', 'new pages')} ↓` },
      s && { jump: 'strengthen', k: 'Most to add', v: `${esc(s.title)}: ${R.n(s.questions.length, 'question', 'questions')} it misses`, go: `See the ${R.n(R.byKind.strengthen.length, 'page', 'pages')} ↓` },
      site && site.n && { jump: 'comp', k: 'A competitor leads', v: `${esc(site.site)} answers ${R.n(site.n, 'question', 'questions')} in full that the site does not`, go: `See all ${R.n(R.compQs.length, 'question', 'questions')} ↓` },
    ].filter(Boolean);
    return `<div class="i4-open"><div class="i4-eye">Insights</div>
      <h2>${['One thing', 'Two things', 'Three things'][cards.length - 1] || 'Things'} worth doing first for ${esc(D.practice)}.</h2>
      <div class="i4-cards">${cards.map(x => `<button type="button" class="i4-oc" data-jump="${x.jump}"><span class="k">${x.k}</span><span class="v">${x.v}</span><span class="go">${x.go}</span></button>`).join('')}</div>
      ${R.tierBlock({ compact: true })}
      <div class="i4-sum"><span>All ${c.questions} questions together:</span>${I.key(`${c.covered} in full`, C.covered)}${I.key(`${c.thin} in part`, C.thin)}${I.key(`${c.gap} not at all`, C.gap)}
        <button type="button" class="i4-btn line" data-read-all>Read every question</button></div></div>`;
  };
})();
