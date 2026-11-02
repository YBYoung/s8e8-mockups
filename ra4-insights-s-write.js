/* Round 4 (#1417) Insights section 01: renders the questions worth a new page.
   Each card sets the question inside its own subject's row of squares, so the size of the hole is visible. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { Q, TBY, esc } = K;
  const W = R.byKind.write;

  function card(g, i) {
    const q = g.questions[0]; const t = TBY[q.topic];
    const mates = I.byVerdict(Q.filter(x => x.topic === q.topic));
    const lead = q.comp && q.comp.verdict === 'covered';
    return `<div class="i4-card">
      <div class="i4-ck"><span class="rk">${i + 1}</span>${esc(q.topic)}${i < R.MIX.write ? '<span class="plan">in this month\'s plan</span>' : ''}</div>
      <button type="button" class="i4-qt" data-q="${q.id}">${esc(q.text)}</button>
      <div class="i4-sqs">${mates.map(x => I.sq(x, { ring: x.id === q.id })).join('')}</div>
      <div class="i4-cap">Of the ${t.n} ${esc(q.topic)} questions, the site answers ${t.covered || 'none'} in full. This question is one of the ${t.gap} it does not answer at all.</div>
      <div class="i4-near"><span class="k">Closest page today</span>${esc(R.pageTitle(q.page))}<span class="m">${esc(q.note)}</span></div>
      ${lead ? `<div class="i4-cl">${I.csq(q)}<span><b>${esc(q.comp.site)}</b> answers it in full.</span></div>` : ''}
      <div class="i4-cf">${I.act(g)}</div></div>`;
  }

  I.sWrite = function () {
    const leads = W.filter(g => g.compLeads).length;
    const fig = W.length ? I.more(W.map(card), R.MIX.write, `Show all ${W.length}`) : '<p class="i4-calm">Every question has a page on its own subject.</p>';
    return {
      id: 'write', no: '01', eyebrow: 'Questions worth a new page', rail: 'Questions worth a new page',
      verdict: W.length ? R.n(W.length, 'new page', 'new pages') : 'None needed',
      headline: W.length ? `${R.n(W.length, 'question has', 'questions have')} no page on the site that could answer ${W.length === 1 ? 'it' : 'them'}.` : 'Every question has a page on its own subject.',
      lede: W.length ? `Each one needs a new page, so each goes to the content calendar. The first ${Math.min(R.MIX.write, W.length)} are in this month's plan, ranked by how often patients search the subject and how much it matters to the practice.` : '',
      note: `These questions are here because the site's closest page is about something else. When the site has a page on the right subject, the answer goes on that page instead: see Pages to strengthen.${leads ? ` A nearby competitor already answers ${leads === 1 ? 'one of these' : leads + ' of these'} in full.` : ''}`,
      fig,
    };
  };
})();
