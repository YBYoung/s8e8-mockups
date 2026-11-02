/* Round 4 (#1417): counts each priority group's questions by answer. This is the Analyzer's relevance measure (#1554,
   ruled 11/1): "Main services: answers 18 of 70 in full". Counts only, never weighted by demand (demand belongs to
   Market Trends and to ordering the plan). Loads after ra4-plan.js; Story, Insights and Tracking all read it. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const { D, Q, verdictAt, esc, COLORS } = K; const C = COLORS.light;
  const GROUPS = [
    ['priority', 'Main services', 'The services the practice wants more patients for.'],
    ['other', 'Other services', 'Everything else the practice offers.'],
    ['practice', 'Practice-level', 'Questions about choosing a dentist and about urgent and general care, with no treatment of their own.'],
  ];

  /** One group's counts, now (week omitted) or as estimated for a past week. */
  function count(qs, week) {
    const c = { n: qs.length, full: 0, part: 0, none: 0 };
    qs.forEach((q) => { const v = week == null ? q.verdict : verdictAt(q, week); if (v === 'covered') c.full++; else if (v === 'thin') c.part++; else c.none++; });
    return c;
  }
  const qsOf = (key) => (key === 'all' ? Q : Q.filter((q) => q.tier === key));
  const tiersAt = (week) => GROUPS.map(([key, label, about]) => ({ key, label, about, subjects: D.topics.filter((t) => t.tier === key).map((t) => t.name), ...count(qsOf(key), week) })).filter((t) => t.n);
  const TIERS = tiersAt();
  const MAIN = TIERS.find((t) => t.key === 'priority') || TIERS[0];
  const line = (t) => `${t.label}: answers ${t.full} of ${t.n} in full`;
  const estimated = !!D.builtWithoutPriorities;
  const note = estimated ? `${D.practice} has no intake form yet, so which services count as main services is our estimate. The SEO can change it on the practice page.`
    : D.prioritySource ? `Main services come from ${D.prioritySource}. The SEO can change them on the practice page.` : '';

  /** The group block: one row per group, its count in full, a bar of in full / in part / not answered, and the rest in words. */
  function block(opts = {}) {
    const bar = (t) => `<span class="r4t-bar" aria-hidden="true"><i style="width:${(t.full / t.n) * 100}%;background:${C.covered}"></i><i style="width:${(t.part / t.n) * 100}%;background:${C.thin}"></i></span>`;
    return `<div class="r4t${opts.compact ? ' sm' : ''}">${TIERS.map((t) => `<div class="r4t-row" title="${esc(t.about)}">
        <span class="r4t-k">${esc(t.label)}${t.key === 'priority' && note ? '<sup>*</sup>' : ''}<small>${t.subjects.length} ${t.subjects.length === 1 ? 'subject' : 'subjects'}</small></span>
        <span class="r4t-v"><b>${t.full} of ${t.n}</b> answered in full</span>${bar(t)}
        <span class="r4t-r">${t.part} in part · ${t.none} not answered</span></div>`).join('')}
      ${note && !opts.noNote ? `<p class="r4t-note"><sup>*</sup>${esc(note)}</p>` : ''}</div>`;
  }

  Object.assign(R, { TIERS, MAIN, tiersAt, tierCount: count, tierQs: qsOf, tierLine: line, tierBlock: block, tiersEstimated: estimated, tierNote: note });
})();
