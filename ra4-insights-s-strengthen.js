/* Round 4 (#1417) Insights section 02: renders the pages to strengthen, each with the questions it misses.
   One row of squares per page: every question that page answers best, coloured by verdict. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { D, PBY, QBY, esc, fmtN } = K;
  const S = R.byKind.strengthen;
  const total = S.reduce((a, g) => a + g.questions.length, 0);
  const gaps = S.reduce((a, g) => a + g.gaps, 0), thin = S.reduce((a, g) => a + g.thin, 0);

  const line = (q) => I.qline(q, I.SHORT[q.verdict] + (q.comp && q.comp.verdict === 'covered' ? ` · ${q.comp.site} answers it in full` : ''));
  function row(g, i) {
    const p = PBY[g.page]; const all = I.byVerdict(p.questions.map(id => QBY[id]));
    const miss = I.byVerdict(g.questions);
    const m = g.questions.length, n = all.length;
    const how = n === 1 ? (g.gaps ? 'It gives no answer.' : 'It gives only part of an answer.')
      : g.gaps && g.thin ? `It misses ${m === n ? `all ${n}` : `${m} of them`}: ${g.gaps} ${g.gaps === 1 ? 'gets' : 'get'} no answer and ${g.thin} ${g.thin === 1 ? 'gets' : 'get'} only part of one.`
      : g.gaps ? (m === n ? 'It answers none of them.' : `It gives no answer to ${g.gaps} of them.`)
      : (m === n ? 'It answers all of them only in part.' : `It answers ${g.thin} of them only in part.`);
    const cap = `This is the site's closest page for ${R.n(n, 'question', 'questions')}. ${how}`;
    return `<div class="i4-page${i === 0 ? ' first' : ''}">
      <div class="i4-ph"><span class="rk">${i + 1}</span><div class="ti"><b>${esc(g.title)}</b><span class="path">${esc(g.page)}</span></div>
        <span class="seen" data-tip-h="${esc(g.title)}" data-tip="${esc(`Seen ${fmtN(p.totImp)} times in Google and clicked ${fmtN(p.totClk)} times over the ${D.weeks.length} weeks to ${K.fmtWeek(D.weeks[D.weeks.length - 1])}.`)}">${fmtN(p.totImp)}<small>times seen</small></span></div>
      <div class="i4-sqs">${all.map(q => I.sq(q, { ring: g.questions.includes(q) })).join('')}</div>
      <div class="i4-cap">${cap}</div>
      <div class="i4-qs">${miss.slice(0, 3).map(line).join('')}</div>
      ${miss.length > 3 ? `<button type="button" class="i4-fold" data-fold aria-expanded="false"><span>and ${miss.length - 3} more</span><span class="ar">↓</span></button>
      <div class="i4-fbox"><div>${miss.slice(3).map(line).join('')}</div></div>` : ''}
      <div class="i4-cf">${I.act(g)}</div></div>`;
  }

  I.sStrengthen = function () {
    const top = S[0];
    return {
      id: 'strengthen', no: '02', eyebrow: 'Pages to strengthen', rail: 'Pages to strengthen',
      verdict: S.length ? `${R.n(S.length, 'page', 'pages')}, ${R.n(total, 'question', 'questions')}` : 'Nothing to strengthen',
      headline: S.length ? `${R.n(S.length, 'page is', 'pages are')} on the right subject and still miss ${R.n(total, 'question', 'questions')}.` : 'No page misses a question on its own subject.',
      lede: S.length ? `${gaps} of those questions get no answer and ${thin} get only part of one. ${esc(top.title)} has the most to add: ${R.n(top.questions.length, 'missed question', 'missed questions')}.` : '',
      note: 'Each page becomes one task in On-Page, with all the questions it misses. Each square is one question. A ringed square is one the page misses; a plain square is one it already answers in full.',
      left: `<div class="i4-keys">${I.key('Answered in full', K.COLORS.light.covered)}${I.key('In part', K.COLORS.light.thin)}${I.key('Not answered', K.COLORS.light.gap)}</div>`,
      fig: S.length ? I.more(S.map(row), R.MIX.strengthen, `Show all ${S.length} pages`) : '<p class="i4-calm">Nothing to strengthen this month.</p>',
    };
  };
})();
