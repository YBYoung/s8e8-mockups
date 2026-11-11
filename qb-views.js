/* Question bank mockups (#1842): the named views, one per page. Each composes the section head, the sticky bar and
   the list, review list or build block from qb-kit, qb-list, qb-review and qb-build. */
(function () {
  const QB = window.QB; const { esc, fmt, n } = QB; const D = QB.D;
  const BUILT = 'Nov 4';

  /* sticky bar: filters left, review count and Freeze right (draft); frozen line (frozen) */
  function bar(opts) {
    const open = QB.reviewOpen();
    if (opts.frozen) return `<div class="qb-bar">${QB.filterHTML()}<span class="hint"></span><span class="frozen"><span class="dot a"></span>Frozen ${esc(opts.frozenLine)}</span>${opts.readOnly ? `<span class="ro" data-tip="${QB.tip('Read-only', 'The MS role can read the bank but not change it. Every write needs the SEO role.')}">Read-only</span>` : `<button class="btn btn-line sm" data-rebuild>Rebuild</button>`}</div>`;
    return `<div class="qb-bar">${QB.filterHTML()}<span class="hint"></span>
      <span class="cnt"><span class="n">${open}</span> to review</span>${opts.onReview ? `<a class="lnk" href="qb-2-review.html">Open the review list</a>` : `<a class="lnk" href="qb-1-bank.html">Back to the list</a>`}
      <span data-freeze-slot><button class="btn btn-go" data-freeze>Freeze the bank</button></span></div>`;
  }
  function wireBar(root, opts) {
    QB.wireFilter(root);
    root.querySelector('[data-freeze]')?.addEventListener('click', () => {
      const open = QB.reviewOpen(); const slot = root.querySelector('[data-freeze-slot]');
      if (open && !slot.dataset.armed) { slot.dataset.armed = '1'; slot.innerHTML = `<span class="small" style="color:var(--warn);font-weight:600;margin-right:8px">${n(open, 'item is', 'items are')} still open.</span><button class="btn btn-go" data-freeze>Freeze anyway</button><button class="btn btn-text" data-unarm>Cancel</button>`; wireBar(root, opts); return; }
      QB.frozenNow = true; QB.toast('Frozen. The draft is now the measured bank; every tool reads it from here, and history starts today.'); opts.onFreeze && opts.onFreeze();
    });
    root.querySelector('[data-unarm]')?.addEventListener('click', () => { const slot = root.querySelector('[data-freeze-slot]'); delete slot.dataset.armed; slot.innerHTML = `<button class="btn btn-go" data-freeze>Freeze the bank</button>`; wireBar(root, opts); });
    root.querySelector('[data-rebuild]')?.addEventListener('click', (e) => QB.menu(e.currentTarget, [{ k: 'Rebuild (about $0.15)' }, { label: 'Keeps every question whose new output still matches; adds and retires the rest. History before and after compares only on the kept questions.', on: () => QB.toast('Would run the build again and show its progress here.') }]));
  }
  const presence = () => `<span class="save" data-tip="${QB.tip('Someone else is here', 'Josh opened this section 3 minutes ago. Edits from both of you save as they are made; the page says so to avoid two people fixing the same row.')}"><span class="dot o"></span>Josh is also on this page</span>`;

  /* 1. the draft bank after a full-mode build */
  QB.viewBank = function (root) {
    const draw = () => {
      const all = D.questions.map(QB.q); const live = all.filter((q) => !['retired', 'merged', 'dismissed'].includes(q.status));
      root.innerHTML = QB.sectionHead({
        lead: `<b>${live.length} questions</b> in ${D.subjects.length} subjects, built ${BUILT} from the profile and the practice's real searches. <b>Draft</b>: nothing is measured until the bank is frozen. The bank covers ${fmt(D.coverage.matched)} of the ${fmt(D.coverage.total)} times the practice was seen in Google over the year.`,
        flags: ['before_profile', 'no_intake'], status: QB.saved() + presence(), sources: QB.sourcesLine(),
        right: `<button class="lnk" data-how>How the bank is built</button>`,
      }) + bar({ onReview: true, onFreeze: () => location.assign('qb-6-frozen.html') }) + '<div data-list></div>';
      QB.renderList(root.querySelector('[data-list]'), { all });
      wireBar(root.querySelector('.qb-bar'), { onFreeze: () => location.assign('qb-6-frozen.html') });
      root.querySelector('[data-how]').onclick = () => QB.toast('Would open the method panel: subjects from the profile, needs from real searches grouped at 0.93, the topic library labels first, three demand numbers, the 150 ceiling, the coverage check.');
    };
    QB.onRedraw = draw; draw();
  };

  /* 2. the review list */
  QB.viewReview = function (root) {
    const draw = () => {
      root.innerHTML = QB.sectionHead({
        lead: `<b>${QB.reviewOpen()} items to review</b> before the bank freezes. The build labelled ${fmt(D.labelling.labelled)} search groups on its own; these are the few places the automatic labelling can be wrong, in the order they matter.`,
        flags: ['before_profile', 'no_intake'], status: QB.saved(),
      }) + bar({ onReview: false, onFreeze: () => location.assign('qb-6-frozen.html') }) + '<div data-rv></div>';
      QB.renderReview(root.querySelector('[data-rv]'), { onChange: () => { const c = root.querySelector('.cnt .n'); if (c) c.textContent = QB.reviewOpen(); const l = root.querySelector('.lead b'); if (l) l.textContent = `${QB.reviewOpen()} items to review`; } });
      wireBar(root.querySelector('.qb-bar'), { onFreeze: () => location.assign('qb-6-frozen.html') });
    };
    QB.onRedraw = draw; draw();
  };

  /* 3. row actions, every state open at once on two subjects */
  QB.viewActions = function (root) {
    const pick = D.questions.filter((q) => ['Same Day Crowns', 'Choosing the practice'].includes(q.subject));
    const sb = QB.subjById(); const sdc = QB.sortQuestions(pick.filter((q) => q.subject === 'Same Day Crowns'), sb); const ch = QB.sortQuestions(pick.filter((q) => q.subject === 'Choosing the practice'), sb);
    const S = QB.listState;
    S.open[sdc[1].id] = 'edit'; S.open[sdc[2].id] = 'merge';
    S.ov[sdc[3].id] = { status: 'retired' }; S.ov[sdc[4].id] = { local: true }; S.ov[ch[1].id] = { local: false };
    const sugg = { id: 'sg1', subject: 'Same Day Crowns', situation: 'comparison', local: false, text: 'Is a same day crown as strong as a lab-made crown?', mainPhrase: 'cerec crown vs lab crown', matchPhrases: ['cerec vs lab crown', 'same day crown strength'], checklist: [], source: 'Find gaps', evidence: ['cerec crown vs lab made crown', 'are same day crowns as strong'], status: 'suggested', suggestedBy: 'Find gaps', suggestedOn: 'Nov 9', demand: { cs: 210, csPhrase: 'cerec crown vs lab crown', agImp: 1874, agClients: 14, agSample: ['cerec vs lab crown', 'same day crown vs lab crown'], ownImp: 61, ownSearches: 5 } };
    const draw = () => {
      root.innerHTML = QB.sectionHead({
        lead: `Every row action, open at once on two subjects. The menu behind <b>···</b> carries accept and dismiss (for a suggestion), edit wording, merge into another question, make local or not local, keep on purpose, and retire. Each one saves as it is made and writes a marker.`,
        status: QB.saved('Saved just now'),
      }) + `<div class="qb-bar">${QB.filterHTML()}<span class="hint">The first row below has its menu open. The second is being reworded, the third is being merged, the fourth was retired, the fifth was flipped to local.</span></div><div data-list></div>`;
      QB.renderList(root.querySelector('[data-list]'), { questions: pick.concat([sugg]), onlySubjects: ['Same Day Crowns', 'Choosing the practice'] });
      QB.wireFilter(root.querySelector('.qb-bar'));
      const first = root.querySelector(`.row[data-id="${sdc[0].id}"] [data-more]`); if (first && !QB.menuShown) { QB.menuShown = true; setTimeout(() => first.click(), 700); }
    };
    QB.onRedraw = draw; draw();
  };

  /* 4. the build */
  QB.viewBuild = function (root, state) { QB.buildGo = (s) => QB.renderBuild(root, s); QB.renderBuild(root, state); };

  /* 5. light mode: self-frozen, flagged, review list as pending suggestions */
  QB.viewLight = function (root) {
    const draw = () => {
      const all = D.questions.map((q) => QB.q({ ...q, status: 'active' }));
      root.innerHTML = QB.sectionHead({
        lead: `<b>${all.filter((q) => q.status === 'active').length} questions</b> in ${D.subjects.length} subjects, built and <b>frozen on its own ${BUILT}</b> (light mode). Every tool measures this list. The build's review list is kept below as pending suggestions; take them any time.`,
        flags: ['unreviewed', 'before_profile', 'no_intake'], status: QB.saved(), sources: QB.sourcesLine(),
        right: `<button class="lnk" data-how>How the bank is built</button>`,
      }) + bar({ frozen: true, frozenLine: `${BUILT} automatically` }) + `<div class="card" style="margin-top:14px;background:var(--soft)"><div class="qb-head"><div><h2>Pending suggestions</h2><div class="lead" style="font-size:14px"><b>${QB.reviewOpen()} suggestions</b> from the build. Each answer is a marker on the history; nothing has to be answered for the bank to count.</div></div><button class="btn btn-line sm" data-fold>Show</button></div><div data-rv style="display:none;margin-top:12px"></div></div><div data-list></div>`;
      QB.renderList(root.querySelector('[data-list]'), { questions: all.map((q) => ({ ...q, status: QB.q(q).status === 'draft' ? 'active' : QB.q(q).status })) });
      wireBar(root.querySelector('.qb-bar'), {});
      const rv = root.querySelector('[data-rv]'); QB.renderReview(rv, { light: true, onChange: () => { const b = root.querySelector('.card .lead b'); if (b) b.textContent = `${QB.reviewOpen()} suggestions`; } });
      root.querySelector('[data-fold]').onclick = (e) => { const on = rv.style.display === 'none'; rv.style.display = on ? '' : 'none'; e.currentTarget.textContent = on ? 'Hide' : 'Show'; };
      root.querySelector('[data-how]').onclick = () => QB.toast('Would open the method panel.');
    };
    QB.onRedraw = draw; draw();
  };

  /* 6. frozen after review: markers, a suggestion waiting, MS read-only switch */
  QB.viewFrozen = function (root, readOnly) {
    const S = QB.listState;
    const sugg = [
      { id: 'sg2', subject: 'Dental Implants', situation: 'comparison', local: false, text: 'Is a bridge or an implant better for one missing tooth?', mainPhrase: 'tooth bridge vs implant', matchPhrases: ['tooth bridge vs implant', 'bridge or implant'], checklist: [], source: 'Market Trends', evidence: ['tooth bridge vs implant', 'tooth bridge vs implant cost'], status: 'suggested', suggestedBy: 'Market Trends', suggestedOn: 'Nov 10', demand: { cs: 1900, csPhrase: 'tooth bridge vs implant', agImp: 10946, agClients: 9, agSample: ['tooth bridge vs implant', 'tooth bridge vs implant cost', '3 tooth implant bridge cost'], ownImp: 0, ownSearches: 0 } },
      { id: 'sg3', subject: 'Not offered', situation: 'choosing', local: true, text: 'Do I need an orthodontist to fix my bite?', textCity: 'Do I need an orthodontist to fix my bite in Cape Coral, FL', mainPhrase: 'orthodontist bite correction', matchPhrases: ['bite correction', 'orthodontist near me'], checklist: [], source: 'Find gaps', evidence: ['bite correction', 'orthodontist cape coral'], status: 'suggested', suggestedBy: 'Find gaps', suggestedOn: 'Nov 11', offStrategy: true, demand: { cs: 0, csPhrase: 'orthodontist bite correction', agImp: 3153, agClients: 6, agSample: ['bite correction', 'orthodontist near me'], ownImp: 3153, ownSearches: 82 } },
    ];
    const extraSubjects = [{ name: 'Not offered', key: 'not_offered', tier: 'practice', own: 0, ag: 0, n: 1, tierSource: 'Suggestions about a service the practice does not offer land here, flagged off strategy, until dismissed or added on purpose.' }];
    const markers = [['Nov 4', `<b>Built</b>: ${D.questions.length} questions in ${D.subjects.length} subjects, about $0.15.`], ['Nov 6', `<b>Frozen</b> by DU after review: 41 items confirmed, 2 relabelled, 1 marked junk.`], ['Nov 9', `<b>1 question added</b> from Find gaps: "What can I eat after a tooth extraction?" (Tooth Extractions · Aftercare).`], ['Nov 10', `<b>1 question retired</b> by DU: "Does the practice offer Botox for migraines?" (searches were medical, not dental).`], ['Nov 10', `<b>Main service changed</b> on the profile: Full Mouth Reconstruction added as a main service. Weights change from here; the chart shows the mark.`]];
    const draw = () => {
      const all = D.questions.map((q) => QB.q({ ...q, status: 'active' })).concat(sugg.map(QB.q));
      const waiting = all.filter((q) => q.status === 'suggested').length;
      root.innerHTML = QB.sectionHead({
        lead: `<b>${all.filter((q) => q.status === 'active').length} questions</b> in ${D.subjects.length} subjects, <b>frozen Nov 6</b> after review. Every tool measures this list.${waiting ? ` <b>${n(waiting, 'suggestion', 'suggestions')} waiting</b>, shown in place in the list.` : ''}`,
        flags: ['before_profile', 'no_intake'], status: readOnly ? '' : QB.saved(), sources: QB.sourcesLine(),
        right: `<button class="lnk" data-how>How the bank is built</button>`,
      }) + bar({ frozen: true, frozenLine: 'Nov 6 by DU', readOnly }) + `<div class="card" style="margin-top:14px;background:var(--soft)"><h2>Changes</h2><div class="small muted">Every change is a marker; charts draw them, and two runs compare only on the questions both measured. No version numbers.</div><div class="mk">${markers.map(([w, x]) => `<span class="w">${w}</span><span class="x">${x}</span>`).join('')}${S.log.slice(0, 5).map((l) => `<span class="w">${esc(l.when)}</span><span class="x"><b>${esc(l.who)}</b> ${esc(l.what)}</span>`).join('')}</div></div><div data-list></div>`;
      QB.renderList(root.querySelector('[data-list]'), { questions: all, extraSubjects, readOnly, frozen: true });
      wireBar(root.querySelector('.qb-bar'), {});
      root.querySelector('[data-how]').onclick = () => QB.toast('Would open the method panel.');
    };
    QB.onRedraw = draw; draw();
  };
})();
