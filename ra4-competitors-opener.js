/* Round 4 (#1417) Competitors: renders the opening, one plain line per competitor, most threatening first.
   Each line is also the switch that picks which competitor the rest of the tab is about. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const C = window.RA4C; const { D, esc } = K;
  const pages = (site) => (D.competitors.find(c => c.site === site) || {}).pages;

  function line(s) {
    const lead = !s.full.length ? `answers none of the ${K.D.counts.questions} questions in full.`
      : s.wins.length
      ? `answers ${R.n(s.full.length, 'question', 'questions')} in full; ${s.wins.length} of them the practice does not.`
      : `answers ${R.n(s.full.length, 'question', 'questions')} in full; the practice answers every one of them too.`;
    return `<button type="button" class="c4-row" data-site="${esc(s.site)}" aria-pressed="false">
      <span class="ln"><b>${esc(s.site)}</b> ${lead}</span>
      <span class="sub">${R.n(pages(s.site) || 0, 'page', 'pages')} read on the site</span><span class="go">See what it answers ›</span></button>`;
  }

  C.opener = function () {
    const top = C.sites[0];
    const head = top.wins.length
      ? `${esc(top.site)} is the nearby competitor most ahead of the practice.`
      : 'No nearby competitor answers a question in full that the practice does not.';
    return `<div class="c4-open"><div class="c4-eye">Competitors · ${esc(D.city)}, ${esc(D.state)}</div><h1>${head}</h1>
      <p class="c4-lede">The same ${D.counts.questions} questions were checked on three nearby sites. Most ahead first; pick one to see the questions it answers that the practice does not.</p>
      <div class="c4-rows" role="group" aria-label="Pick a competitor">${C.sites.map(line).join('')}</div></div>`;
  };

  C.markPicked = (site) => document.querySelectorAll('.c4-row').forEach(b => { const on = b.dataset.site === site; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
})();
