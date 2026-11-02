/* Round 4 (#1417) Insights section 04: renders the questions a nearby competitor answers in full and the practice does not.
   Each row sets the practice's mark beside the competitor's, grouped by competitor. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { D, Q, esc } = K;
  const CQ = R.compQs;
  const sites = D.competitors.map(c => ({ site: c.site, qs: CQ.filter(q => q.comp.site === c.site) })).filter(s => s.qs.length).sort((a, b) => b.qs.length - a.qs.length);
  const better = Q.filter(q => q.verdict === 'covered' && q.comp && q.comp.verdict !== 'covered').length;
  const subj = D.topics.slice().sort((a, b) => b.compWins - a.compWins)[0];
  const list = (arr) => arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;

  function row(q) {
    const g = I.itemOf(q.id);
    return `<div class="i4-vs" data-q="${q.id}"><span class="t">${esc(q.text)}<span class="m">${esc(q.topic)}${g ? ` · ${I.act(g, 'verb')}` : ''}</span></span>
      <span class="mk">${I.sq(q)}</span><span class="mk">${I.csq(q)}</span></div>`;
  }
  function chunks() {
    const out = [];
    sites.forEach(s => { s.qs.forEach((q, i) => out.push((i === 0 ? `<div class="i4-site"><b>${esc(s.site)}</b><span>leads on ${R.n(s.qs.length, 'question', 'questions')}</span></div>` : '') + row(q))); });
    return out;
  }

  I.sComp = function () {
    const head = `<div class="i4-vsh"><span></span><span>The site</span><span>Competitor</span></div>`;
    return {
      id: 'comp', no: '04', eyebrow: 'Where a competitor leads', rail: 'Where a competitor leads',
      verdict: CQ.length ? `Leads on ${R.n(CQ.length, 'question', 'questions')}` : 'Nowhere',
      headline: CQ.length ? `Nearby competitors answer ${R.n(CQ.length, 'question', 'questions')} in full that the practice does not.` : 'No nearby competitor answers a question in full that the practice does not.',
      lede: CQ.length ? `${list(sites.map((s, i) => i === 0 ? `${esc(s.site)} leads on ${s.qs.length} of them` : `${esc(s.site)} on ${s.qs.length}`))}. The practice answers ${better} questions in full that no nearby competitor does.` : `The practice answers ${better} questions in full that no nearby competitor does.`,
      note: CQ.length && subj.compWins > 1 ? `They lead most on ${esc(subj.name)}: ${subj.compWins} of the ${CQ.length} questions. Each question's next step is the same task it has in the sections above.` : '',
      left: `<div class="i4-keys">${I.key('The site, in part', K.COLORS.light.thin)}${I.key('Not answered', K.COLORS.light.gap)}${I.key('A competitor, in full', K.COLORS.light.comp)}</div>`,
      fig: CQ.length ? head + I.more(chunks(), 6, `Show all ${CQ.length}`) : '<p class="i4-calm">No competitor is ahead on any question.</p>',
    };
  };
})();
