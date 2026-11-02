/* Round 4 (#1417): the Story's chapters, built from the run's real findings. Each chapter is the words on the left
   and the orbit state on the right (what is lit, competitors on or off, which subject, which week). Sentences are
   built from the numbers so the words and the figure cannot disagree. Copy rules: answer first, one comparison per
   sentence, every number says what it counts, counts not percentages, third person, no em dashes. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const { D, Q, QBY, TBY, LAST, esc, sw, COLORS, countsAt, VERDICT_WORD } = K;
  const C = COLORS.light; const c = D.counts; const n = R.n;
  const ids = (qs) => qs.map(q => q.id);
  const byWeight = (a, b) => b.h.weight - a.h.weight;
  const qPoint = (q, extra) => `<li data-q="${q.id}">${sw(C[q.verdict])}<span><b>${esc(q.text)}</b>${extra ? `<br><span style="color:var(--muted);font-size:12.5px">${extra}</span>` : ''}</span></li>`;
  const tile = (num, word) => `<div><b>${num}</b><span>${word}</span></div>`;

  function build() {
    const ch = [];
    const tk = R.topKinds;
    const planWords = [tk.write && `write ${n(tk.write, 'new page', 'new pages')}`, tk.strengthen && `strengthen ${n(tk.strengthen, 'page', 'pages')}`, tk.merge && `merge ${n(tk.merge, 'group', 'groups')} of pages`, (tk.local || tk.trust) && `add contact details to ${n((tk.local || 0) + (tk.trust || 0), 'page', 'pages')}`].filter(Boolean);
    const planSentence = planWords.slice(0, -1).join(', ') + ' and ' + planWords[planWords.length - 1];

    const M = R.MAIN;
    ch.push({ id: 'short', k: 'Long story short',
      h2: `${esc(M.label)}: the site answers <span class="g">${M.full} of ${M.n}</span> questions in full.`,
      p: `This month's plan: ${planSentence}. Each dot on the right is one question. The closer a dot sits to the practice, the better the site answers it.`,
      block: R.tierBlock(),
      scene: {} });

    const s = R.strongest; const sq = Q.filter(q => q.topic === s.name).sort(byWeight);
    ch.push({ id: 'strong', k: 'Strongest ground',
      h2: `${esc(s.name)} is the site's strongest subject: <span class="g">${s.covered} of its ${s.n}</span> questions are answered in full.`,
      p: `The other ${s.n - s.covered} are answered in part${s.gap ? `, and ${n(s.gap, 'question is', 'questions are')} not answered at all` : ''}.`,
      pts: sq.slice(0, 4).map(q => qPoint(q, VERDICT_WORD[q.verdict])), scene: { topic: s.name } });

    const w = R.weakest; const wq = Q.filter(q => q.topic === w.name && q.verdict === 'gap').sort(byWeight);
    const wPlan = R.top.find(g => g.topic === w.name);
    ch.push({ id: 'gaps', k: 'The biggest gap',
      h2: `${esc(w.name)} is a main service, yet <span class="r">${w.gap} of its ${w.n}</span> questions get no answer on the site.`,
      p: (() => { const k = wPlan ? wPlan.questions.filter(q => q.topic === w.name && q.verdict === 'gap').length : 0;
        return k ? `This month's plan takes on ${k} of them by strengthening "${esc(wPlan.title)}".` : wPlan ? `This month's plan strengthens "${esc(wPlan.title)}" for the questions it answers in part. The ${w.gap} with no answer come next.` : `None of them is in this month's plan yet.`; })(),
      pts: wq.slice(0, 4).map(q => qPoint(q, esc(q.note))), scene: { topic: w.name, ids: ids(Q.filter(q => q.topic === w.name)) } });

    const cq = R.compQs; const bySite = {}; cq.forEach(q => { bySite[q.comp.site] = (bySite[q.comp.site] || 0) + 1; });
    const sites = Object.entries(bySite).sort((a, b) => b[1] - a[1]); const ct = R.compTopic;
    ch.push({ id: 'comp', k: 'Where a competitor leads',
      h2: `Nearby competitors answer <span class="v">${cq.length} questions</span> in full that the site does not.`,
      p: `${esc(sites[0][0])} answers ${sites[0][1]} of them. Each site's answers, side by side with the practice's, are on the Competitors tab.`,
      link: ['ra-4-competitors.html', 'See the competitors →'],
      scene: { ids: ids(cq), wide: true } });

    const mq = R.splits; const cmp = mq.filter(q => q.writeKind === 'comparison');
    ch.push({ id: 'merge', k: 'Questions split across pages',
      h2: `${mq.length} questions get part of an answer on two or more pages, and a full answer on none.`,
      p: `Those pages cover different services, so each keeps its own page; none of them is a duplicate. ${cmp.length ? `The ${n(cmp.length, 'question that compares', 'questions that compare')} services ${cmp.length === 1 ? 'gets' : 'get'} a new comparison article, linked from each service page. ` : ''}The rest get a full answer on the page about that service.`,
      pts: cmp.map(q => qPoint(q, `a new comparison article, linked from ${q.linkFrom.map(x => esc(R.pageTitle(x))).join(' and ')}`)),
      scene: { ids: ids(mq), wide: true, split: true } });

    const lq = Q.filter(q => q.local); const lf = R.localFails;
    const miss = (q) => { const e = q.localEvidence || {}; const m = []; if (!K.cityOk(e, q.page)) m.push(K.cityRule(q.page) === 'copy' ? 'the city in the text' : 'the city in the title'); if (!e.phone_on_page) m.push('a phone number'); if (!e.street_address_on_page && !e.is_location_or_contact_page) m.push('a street address'); return m; };
    const list = (m) => m.length > 1 ? m.slice(0, -1).join(', ') + ' and ' + m[m.length - 1] : m[0];
    ch.push({ id: 'local', k: 'Local signals',
      h2: `${lq.length - lf.length} of the ${lq.length} "near me" questions lead to a page that shows the city and a way to reach the practice.`,
      p: `The other ${lf.length} lead to pages missing some of this. A patient searching "near me" looks for the city and a phone number or address on the page.`,
      pts: lf.sort(byWeight).slice(0, 4).map(q => qPoint(q, miss(q).length ? `the page is missing ${list(miss(q))}` : esc(q.note))),
      scene: { ids: ids(lf), wide: true } });

    const t0 = R.tiersAt(0); const was = (t) => t0.find(x => x.key === t.key).full;
    const since = new Date(D.weeks[0] + 'T12:00:00').toLocaleString('en-US', { month: 'long', year: 'numeric' });
    ch.push({ id: 'time', k: 'What changed',
      h2: `${esc(M.label)}: the site now answers <span class="g">${M.full} of ${M.n}</span> questions in full, up from ${was(M)} in ${since}.`,
      p: `The rise came as new pages showed up in Google. The months before today are an estimate, based on when Google first saw each page. From the next run on, each point is measured.`,
      tiles: R.TIERS.map(t => tile(`${was(t)} to ${t.full}`, `${t.label.toLowerCase()} in full, of ${t.n}`)),
      scene: { replay: true } });

    ch.push({ id: 'plan', k: 'The plan', plan: true,
      h2: `This month's plan: ${[tk.write && n(tk.write, 'new page', 'new pages'), tk.strengthen && `${tk.strengthen} pages to strengthen`, tk.merge && n(tk.merge, 'merge', 'merges'), (tk.local || tk.trust) && `${n((tk.local || 0) + (tk.trust || 0), 'page', 'pages')} to add contact details to`].filter(Boolean).join(', ')}.`,
      p: `Ranked by how often patients search each question and how much the service matters to the practice. Click a row to light up its questions on the right. Each button sends the work where it gets done.`,
      scene: { ids: [].concat(...R.top.map(g => ids(g.questions))), wide: true } });
    return ch;
  }
  R.storyChapters = build;
})();
