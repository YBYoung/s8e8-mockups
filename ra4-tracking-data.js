/* Round 4 (#1417) Tracking: works out every number the Tracking tab shows from the one real run.
   One measured run (Nov 1, 2026). The weeks before it are rebuilt from the week each page was first seen in Google
   (RA3D2.countsAt), on the frozen bank. Prices are round 3's settings (owner kept them). */
(function () {
  const K = window.RA3D2; const { D, Q, PBY, LAST, countsAt, verdictAt } = K;
  const DAY = 864e5, W0 = Date.parse(D.weeks[0] + 'T00:00:00Z');
  const fOf = (iso) => (Date.parse(iso + 'T00:00:00Z') - W0) / (7 * DAY);
  const isoOf = (f) => new Date(W0 + f * 7 * DAY).toISOString().slice(0, 10);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parts = (iso) => iso.split('-').map(Number);
  const day = (iso) => { const [, m, d] = parts(iso); return `${MON[m - 1]} ${d}`; };
  const dayY = (iso) => { const [y, m, d] = parts(iso); return `${MON[m - 1]} ${d}, ${y}`; };
  const monY = (iso) => { const [y, m] = parts(iso); return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}`; };
  const weekday = (iso) => DOW[new Date(iso + 'T12:00:00Z').getUTCDay()];

  const RUN1 = '2026-11-01';
  const MEAS_F = fOf(RUN1);
  const NEXT = { weekly: '2026-11-09', monthly: '2026-12-01', light: '2026-12-01' };

  /* the two answer lines: one knot per rebuilt week, then the measured run */
  const knots = [];
  for (let w = 0; w <= LAST; w++) { const c = countsAt(w); knots.push({ f: w, iso: D.weeks[w], full: c.covered, part: c.thin, none: c.gap, rebuilt: true }); }
  knots.push({ f: MEAS_F, iso: RUN1, full: D.counts.covered, part: D.counts.thin, none: D.counts.gap, rebuilt: false, run: 1 });
  const START = knots[0], NOW = knots[knots.length - 1];

  /* the relevance measure by priority group (#1554): the same knots, counted per group; 'all' is the plain total */
  const R = window.RA4;
  const groups = R.TIERS.map((t) => ({ key: t.key, label: t.label, n: t.n,
    knots: knots.map((k) => { const c = R.tierCount(R.tierQs(t.key), k.rebuilt ? k.f : null); return { ...k, full: c.full, part: c.part, none: c.none }; }) }))
    .concat([{ key: 'all', label: 'All questions', n: D.counts.questions, knots }]);
  const G = { cur: R.MAIN.key };
  /* the practice's own Search Console for the picked group: searches about the group's questions (ra4-gsc-groups.js).
     Search-level rows are saved from GSC.from on; earlier weeks are null, shown as not saved */
  const GSC = window.RA4_GSC; const GSC_F0 = D.weeks.findIndex((w) => w >= GSC.from);
  const gsc = (key = G.cur) => GSC.groups[key];
  const group = (key = G.cur) => groups.find((g) => g.key === key);

  /* the practice's own Google, week by week (no value after the last full week) */
  const google = { imp: D.totals.imp.slice(), clk: D.totals.clk.slice() };
  const recent = (arr) => Math.round(arr.slice(-4).reduce((a, b) => a + b, 0) / 4);

  /* subjects: each one's answers per week, now, and the pages that carry them */
  const subjects = D.topics.map((t) => {
    const qs = Q.filter((q) => q.topic === t.name);
    const weekly = knots.map((k) => { let full = 0, part = 0; qs.forEach((q) => { const v = k.rebuilt ? verdictAt(q, k.f) : q.verdict; if (v === 'covered') full++; else if (v === 'thin') part++; }); return { full, part }; });
    const paths = [...new Set(qs.map((q) => q.page))];
    const pages = paths.map((p) => PBY[p]).filter(Boolean).map((p) => ({
      path: p.path, title: p.title.split('|')[0].trim(), firstWeek: p.firstWeek, imp: p.imp, clk: p.clk, totImp: p.totImp, totClk: p.totClk,
      lately: recent(p.imp), qs: qs.filter((q) => q.page === p.path),
    })).sort((a, b) => b.lately - a.lately);
    const imp = new Array(D.weeks.length).fill(0); pages.forEach((p) => p.imp.forEach((v, i) => { imp[i] += v; }));
    const first = weekly[0], now = weekly[weekly.length - 1];
    /* the subject's Google = the practice's own searches about its questions, search-level (owner 11/1: the page-level
       sum undercounted), from the first saved week; the pages inside still use page-level data, the only per-page source */
    const sg = GSC.groups['s:' + t.name] || { imp: [], clk: [] };
    const sImp = sg.imp.slice(GSC_F0).map((v) => v || 0), sClk = sg.clk.slice(GSC_F0).map((v) => v || 0);
    return { name: t.name, n: t.n, tier: t.tier, weekly, first, now, none: t.n - now.full - now.part, pages, imp: sImp, clk: sClk,
      lately: recent(sImp), latelyClk: recent(sClk), seenTotal: sImp.reduce((a, b) => a + b, 0),
      gain: (now.full + now.part) - (first.full + first.part), gainFull: now.full - first.full };
  });
  const TIER_ORDER = { priority: 0, other: 1, practice: 2 };
  subjects.sort((a, b) => (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3));
  const topGain = subjects.slice().sort((a, b) => b.gain - a.gain || b.gainFull - a.gainFull)[0];

  /* moments: every page's first week in Google, plus what we track changing (the bank built on Nov 1) */
  const moments = [];
  D.pages.filter((p) => p.firstWeek > 0).forEach((p, i) => moments.push({ id: 'p' + i, kind: 'page', f: p.firstWeek, iso: D.weeks[p.firstWeek], title: p.title.split('|')[0].trim(), path: p.path }));
  moments.push({ id: 'bank', kind: 'change', f: MEAS_F, iso: RUN1, title: `Question bank built automatically: ${D.counts.questions} questions in ${D.topics.length} subjects`, why: 'The first run of the rebuilt Relevance Analyzer.' });
  const alreadyIn = D.pages.filter((p) => p.firstWeek === 0).length, neverSeen = D.pages.filter((p) => p.firstWeek == null).length;

  /* prices: about $0.30 to read the practice's site per run, about $0.90 for the 3 competitor sites */
  const SITE = 0.30, COMPS = 0.90, PER_MONTH = { weekly: 52 / 12, monthly: 1 };
  function quote(sel) {
    const money = (v) => `$${v.toFixed(2)}`;
    if (sel.cadence === 'weekly' || sel.cadence === 'monthly') {
      const runs = PER_MONTH[sel.cadence];
      return { monthly: (SITE + COMPS) * runs, runs, per: sel.cadence === 'weekly' ? 'about $1.20 a week' : 'about $1.20 a month', next: NEXT[sel.cadence], money,
        lines: [[`The practice's site, ${D.counts.questions} questions`, money(SITE), 'a run'], [`${D.competitors.length} competitor sites, the same questions`, money(COMPS), 'a run'], ['Runs a month', sel.cadence === 'weekly' ? 'about 4' : '1', '']] };
    }
    if (sel.light) return { monthly: SITE, runs: 1, per: 'about $0.30 a month', next: NEXT.light, money, light: true,
      lines: [[`The practice's own site, ${D.counts.questions} questions`, money(SITE), 'a run'], ['Competitor sites', 'none', ''], ['Runs a month', '1', '']] };
    return { monthly: 0, runs: 0, per: '', next: null, money, lines: [] };
  }

  /* the session (mockup only): what is tracked, the work added, the changes made */
  const S = { tracking: false, cadence: 'off', light: false, startedAt: null, works: [], changes: [], stopped: false };

  window.RA4T = { K, D, fOf, isoOf, day, dayY, monY, weekday, RUN1, MEAS_F, NEXT, knots, START, NOW, groups, group, G, gsc, GSC, GSC_F0, google, recent, subjects, topGain,
    moments, alreadyIn, neverSeen, quote, S, competitors: D.competitors.map((c) => c.site) };
})();
