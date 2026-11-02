/* Round 4 (#1417): the plan, worked out once from the run's findings so the Story, Insights and Tracking agree.
   Findings are per question; work is per page. Owner rulings 11/1: write new (one page per question), strengthen only
   within the page's own subject (one task per page, carrying its missed questions), merge competing own pages (one task
   per set of pages), local and trust signals (one task per page). Ranked by weight = demand x business priority.
   The plan is a month's mix (up to 4 new pages, 5 to strengthen, 2 merges, 1 signal fix), each ranked inside its kind;
   every other finding stays one click away. */
(function () {
  const K = window.RA3D2; const { D, Q, QBY, PBY, TBY } = K;
  const host = (u) => u.replace(/^https?:\/\/(www\.)?/, '');
  const pageTitle = (path) => { const p = PBY[path]; return p ? p.title.split('|')[0].trim() : path; };
  const compLeads = (q) => !!q.comp && q.comp.verdict === 'covered' && q.verdict !== 'covered';
  const KIND = {
    write: { verb: 'Write a new page', dest: 'calendar', destWord: 'Send to the content calendar', order: 0 },
    strengthen: { verb: 'Strengthen this page', dest: 'onpage', destWord: 'Open in On-Page', order: 1 },
    merge: { verb: 'Merge the competing pages', dest: 'task', destWord: 'Make the task', order: 2 },
    local: { verb: 'Strengthen local signals', dest: 'task', destWord: 'Make the task', order: 3 },
    trust: { verb: 'Add trust signals', dest: 'audit', destWord: 'Send to Site Audit', order: 4 },
  };

  const groups = {};
  const add = (key, base, q) => { const g = groups[key] || (groups[key] = Object.assign({ key, questions: [] }, base)); g.questions.push(q); };
  Q.forEach(q => {
    if (q.step === 'write') add('w:' + q.id, { kind: 'write', title: q.text, topic: q.topic, near: q.page }, q);
    else if (q.step === 'strengthen') add('s:' + q.page, { kind: 'strengthen', page: q.page, title: pageTitle(q.page) }, q);
    else if (q.step === 'merge') { const pages = (q.mergePages && q.mergePages.length ? q.mergePages : q.ownPages).slice().sort(); add('m:' + pages.join('|'), { kind: 'merge', pages, page: pages[0], title: pages.map(pageTitle).join(' + ') }, q); }
    else if (q.step === 'local' || q.step === 'trust') add(q.step[0] + ':' + q.page, { kind: q.step, page: q.page, title: pageTitle(q.page) }, q);
  });
  const items = Object.values(groups).map(g => {
    g.weight = g.questions.reduce((a, q) => a + q.h.weight, 0);
    g.topic = g.topic || mainTopic(g.questions);
    g.compLeads = g.questions.filter(compLeads).length;
    g.gaps = g.questions.filter(q => q.verdict === 'gap').length; g.thin = g.questions.filter(q => q.verdict === 'thin').length;
    g.seen = g.page && PBY[g.page] ? PBY[g.page].totImp : 0;
    g.verb = KIND[g.kind].verb; g.dest = KIND[g.kind].dest; g.destWord = KIND[g.kind].destWord;
    return g;
  }).sort((a, b) => b.weight - a.weight || KIND[a.kind].order - KIND[b.kind].order);
  items.forEach((g, i) => { g.rank = i + 1; });
  function mainTopic(qs) { const c = {}; qs.forEach(q => { c[q.topic] = (c[q.topic] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; }

  // a month's plan: ranked inside each kind, filled to a fixed mix so new pages are never crowded out by big pages
  const MIX = { write: 4, strengthen: 5, merge: 2, signals: 1 };
  const byKind = {}; Object.keys(KIND).forEach(k => { byKind[k] = items.filter(g => g.kind === k); });
  const signals = byKind.local.concat(byKind.trust).sort((a, b) => b.weight - a.weight);
  const top = [].concat(byKind.write.slice(0, MIX.write), byKind.strengthen.slice(0, MIX.strengthen), byKind.merge.slice(0, MIX.merge), signals.slice(0, MIX.signals));
  const TOP = top.length; top.forEach((g, i) => { g.planNo = i + 1; });
  const topKinds = {}; top.forEach(g => { topKinds[g.kind] = (topKinds[g.kind] || 0) + 1; });

  // the subjects, in the order the Story talks about them
  const topics = D.topics.slice();
  const strongest = topics.filter(t => t.tier !== 'practice').sort((a, b) => b.covered / b.n - a.covered / a.n || b.covered - a.covered)[0];
  const weakest = topics.filter(t => t.tier === 'priority').sort((a, b) => (b.gap * b.demand) - (a.gap * a.demand))[0];
  const compTopic = topics.slice().sort((a, b) => b.compWins - a.compWins || b.demand - a.demand)[0];

  // plain counted phrases: "5 new pages", "1 page"
  const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;

  window.RA4 = { KIND, MIX, items, top, TOP, byKind, topKinds, strongest, weakest, compTopic, pageTitle, host, compLeads, n,
    merges: Q.filter(q => q.step === 'merge'), splits: Q.filter(q => q.splitNote), localFails: Q.filter(q => q.local && !q.localPass), compQs: Q.filter(compLeads) };
})();
