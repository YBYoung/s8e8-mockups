/* Round 4 (#1417) Insights section 03: renders the sets of the site's own pages that compete for the same questions.
   Each set shows its questions and the pages that each hold part of the answer. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { esc, COLORS } = K;
  const M = R.byKind.merge; const qs = R.merges;
  const sizes = M.map(g => g.pages.length); const lo = Math.min(...sizes), hi = Math.max(...sizes);
  const freq = {}; M.forEach(g => g.pages.forEach(p => { freq[p] = (freq[p] || 0) + 1; }));
  const most = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  function card(g, i) {
    const closest = new Set(g.questions.map(q => q.page));
    return `<div class="i4-card">
      <div class="i4-ck"><span class="rk">${i + 1}</span>${R.n(g.pages.length, 'page', 'pages')} · ${R.n(g.questions.length, 'question', 'questions')}${i < R.MIX.merge ? '<span class="plan">in this month\'s plan</span>' : ''}</div>
      <div class="i4-qs">${g.questions.map(q => I.qline(q)).join('')}</div>
      <div class="i4-split">${g.pages.map(p => `<div class="pg"><i class="half" style="background:${COLORS.light.thin}"></i><span class="ti">${esc(R.pageTitle(p))}<span class="path">${esc(p)}</span></span>${closest.has(p) ? '<span class="cl">closest answer</span>' : ''}</div>`).join('')}</div>
      <div class="i4-cf">${I.act(g)}</div></div>`;
  }
  const bars = () => {
    const max = most[0][1];
    return `<div class="i4-bars"><div class="i4-gl">Pages in the most groups</div>${most.map(([p, n]) => `<div class="b" data-tip-h="${esc(R.pageTitle(p))}" data-tip="${esc(`In ${n} of the ${M.length} groups of pages to merge.`)}"><span class="nm">${esc(R.pageTitle(p))}</span><span class="tr"><i style="width:${(n / max) * 100}%"></i></span><span class="v">${n}</span></div>`).join('')}</div>`;
  };

  I.sMerge = function () {
    const top3 = most.filter(m => m[1] === most[0][1]);
    return {
      id: 'merge', no: '03', eyebrow: 'Duplicate pages', rail: 'Duplicate pages',
      verdict: M.length ? R.n(M.length, 'group to merge', 'groups to merge') : 'No duplicates',
      headline: M.length ? `${R.n(qs.length, 'question is', 'questions are')} split between two pages that are duplicates of each other.` : 'No two pages of the site are duplicates.',
      lede: !M.length ? `${R.n(R.splits.length, 'question gets', 'questions get')} part of an answer on two or more pages, but those pages cover different services or different questions, so each keeps its own page. ${R.n(R.splits.filter(q => q.writeKind === 'comparison').length, 'comparison question becomes', 'comparison questions become')} a new article (section 01); the rest get a full answer on the page about that service (section 02).` : M.length ? `Each one is answered in part on ${lo === hi ? lo : `${lo} to ${hi}`} pages of the same kind. Merging those pages lets one page answer the question in full. There ${M.length === 1 ? 'is 1 group' : `are ${M.length} groups`} of pages to merge, one task for each. A service page and an article on the same question is fine: the service page sells and the article explains, so they only need to link to each other.` : '',
      note: M.length && top3.length > 1 ? `${top3.length} pages show up in the most groups: each is in ${top3[0][1]} of the ${M.length}.` : '',
      left: M.length ? bars() : '',
      fig: M.length ? I.more(M.map(card), R.MIX.merge, `Show all ${M.length} groups`) : '<p class="i4-calm">Nothing to merge.</p>',
    };
  };
})();
