/* Round 4 (#1417) Competitors section 03: renders the picked competitor's pages that answer the most questions in full.
   Each page opens in place to list those questions, marked where the practice has no full answer. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const C = window.RA4C; const { esc, COLORS } = K;
  const CL = COLORS.light;

  function row(p) {
    const lack = p.qs.filter(q => q.verdict !== 'covered').length;
    const list = p.qs.slice().sort((a, b) => b.h.weight - a.h.weight).map(q => `<li>${esc(q.text)}${q.verdict !== 'covered' ? '<span class="c4-flag">not answered in full on the practice\'s site</span>' : ''}</li>`).join('');
    return `<div class="c4-pg"><div class="c4-pgh" data-fold tabindex="0" role="button" aria-expanded="false">
        <span class="n">${p.qs.length}</span><span class="t">${esc(p.title)}<span class="m">${esc(R.host(p.url))}</span></span><span class="ar" aria-hidden="true"></span></div>
      <div class="c4-qd"><div><div class="c4-pgin">
        <p>Answers ${R.n(p.qs.length, 'question', 'questions')} in full. ${p.qs.length === 1 ? (lack ? 'The practice does not answer it in full.' : 'The practice answers it in full too.') : lack ? `The practice does not answer ${lack} of them in full.` : `The practice answers ${p.qs.length === 2 ? 'both' : 'all of them'} in full too.`}</p>
        <ul>${list}</ul><a class="r4-link" href="${esc(p.url)}" target="_blank" rel="noopener">Open the page ›</a></div></div></div></div>`;
  }

  C.sPages = function (s) {
    const top = s.pages[0];
    return {
      id: 'pages', no: '03', eyebrow: 'Its strongest pages',
      headline: top ? `Its best page answers ${R.n(top.qs.length, 'question', 'questions')} in full.` : `No page on ${esc(s.site)} answers a question in full.`,
      lede: top ? `That page is ${esc(top.title)}${/[.?!]$/.test(top.title) ? '' : '.'} ${R.n(s.pages.length, 'page', 'pages')} on ${esc(s.site)} answer at least one question in full; those answering the most come first.` : '',
      left: top ? `<div class="c4-keys"><span class="c4-key"><i class="c4-nk"></i>Questions answered in full on that page</span></div>` : '',
      fig: top ? C.more(s.pages.map(row), 5, `Show all ${s.pages.length} pages`) : '<p class="c4-calm">Nothing to show for this site.</p>',
    };
  };
})();
