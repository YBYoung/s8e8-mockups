/* Question bank mockups (#1842): the build. Before a bank exists: what the build reads and the Build button with its
   estimate. The gate refusal with a one-click crawl. The progress line (steps strip, counts, heartbeat). Interrupted
   with Run again. States are switched from the mockup bar. */
(function () {
  const QB = window.QB; const { esc, fmt, n } = QB; const D = QB.D;
  const STEPS = ['Gate', 'Subjects', 'Needs', 'Labels', 'Demand', 'Wording', 'Size', 'Coverage', 'Freeze'];
  const LOG = [
    ['0:00', `Crawl of ${esc(D.site)} from ${esc(D.crawl.date)} is complete: ${D.crawl.pages} pages, ${D.crawl.pages} in English.`],
    ['0:01', `${D.subjects.filter((s) => s.tier !== 'practice').length} subjects from the profile (${D.subjects.filter((s) => s.tier === 'main').length} main services, guessed: the profile is not confirmed), plus Choosing the practice, General care and Emergency dental care.`],
    ['0:04', `${fmt(D.labelling.searches)} non-branded searches, ${fmt(D.labelling.impressions)} times seen. Grouped into ${fmt(D.labelling.groups)} needs; ${fmt(D.labelling.labelled)} of them big enough to label.`],
    ['0:22', `Labelling: the topic library placed 312 groups; the model is reading the rest, 50 at a time. 88 of 121 done.`],
  ];
  const whatHTML = () => `<div class="what">
    <h4>What the build reads</h4><ul>
      <li><b>The practice profile</b>: ${D.subjects.filter((s) => s.tier !== 'practice').length} offered services, ${D.subjects.filter((s) => s.tier === 'main').length} named main. <span class="muted">Not confirmed yet: the bank would carry a flag until someone confirms it.</span></li>
      <li><b>Search Console</b>: the practice's own searches, ${esc(D.gscWindow)}, with its name and the doctors' names removed as brand words.</li>
      <li><b>Our clients' searches</b> for each subject, so a need the practice is not seen for yet still lands.</li>
      <li><b>The latest complete crawl</b> (${esc(D.crawl.date)}, ${D.crawl.pages} pages): which services have a page, and the page titles that name them.</li>
      <li><b>Patient wording</b> from forum posts, AI Visibility questions and fan-out. Wording only; nothing enters without measured demand, a checklist point, or the SEO.</li></ul>
    <h4>What comes out</h4><ul><li>About 80 to 120 questions, 150 at most, grouped by subject with the fixed order inside, three demand numbers each.</li>
      <li>A short review list: the biggest search groups, unplaced searches, junk with a dental word, emergency groups, suspected duplicates.</li>
      <li>The bank stays a draft until the SEO freezes it. In light mode it freezes itself and is flagged.</li></ul></div>`;
  const sideHTML = (state) => `<div class="side"><div class="price">about $0.15<small>per build</small></div>
    <div class="brk">$0.13 for the model that labels and words the questions, a few cents for embeddings and the clickstream lookups not already cached. Ledgered under Question bank for ${esc(D.practice)}.</div>
    <button class="btn btn-go" ${state === 'gate' ? 'disabled' : ''} data-build>Build the question bank</button>
    <div class="pitch">Runs in the background, about two minutes. Progress shows here step by step; leaving the page is fine.</div></div>`;

  QB.renderBuild = function (root, state) {
    const head = QB.sectionHead({
      lead: state === 'done' ? `<b>${D.questions.length} questions</b> in ${D.subjects.length} subjects, built just now. Draft: ${QB.reviewOpen()} items to review before it freezes.` : `No question bank yet. ${esc(D.practice)} has a confirmed crawl${state === 'gate' ? '' : ' and Search Console'}, so the build can start.`,
      flags: [], status: state === 'done' ? QB.saved() : '', right: '',
    });
    let body = '';
    if (state === 'none') body = `<div class="bld">${whatHTML()}${sideHTML(state)}</div>`;
    if (state === 'gate') body = `<div class="bld"><div>${whatHTML()}<div class="gate"><span class="dot"></span><div><b>Refused: no complete crawl of ${esc(D.site)}</b><div class="s">The build needs a finished crawl of the primary site with English pages to know which services have a page. The last crawl stopped at 31 of 57 pages on Oct 28.</div><div style="margin-top:8px"><button class="btn btn-go sm" onclick="QB.toast('Would start a crawl of karimanndentalstudio.com and come back here when it finishes.')">Crawl the site</button></div></div></div></div>${sideHTML(state)}</div>`;
    if (state === 'running' || state === 'interrupted') {
      const at = 3; const int = state === 'interrupted';
      body = `<div class="prog ${int ? 'int' : ''}">
        <div class="now">${int ? `Interrupted while labelling: the server restarted at 2:14 pm. Nothing was saved to the bank.` : `Labelling the practice's search groups: 88 of 121 left for the model`}</div>
        <div class="hb">${int ? `<span class="dot" style="background:var(--red)"></span>No heartbeat for 40 minutes, so the run was marked interrupted` : `<span class="dot g"></span>Last heartbeat 4 seconds ago`} <span>Step ${at + 1} of ${STEPS.length}</span><span>Started 0:22 ago</span>${int ? `<button class="btn btn-go sm" data-build style="margin-left:auto">Run again</button>` : `<span style="margin-left:auto">about $0.15</span>`}</div>
        <div class="steps">${STEPS.map((s, i) => `<span class="step ${i < at ? 'done' : i === at && !int ? 'now' : ''}"></span>`).join('')}</div>
        <div class="step-names">${STEPS.map((s, i) => `<span class="${i < at ? 'done' : i === at && !int ? 'now' : ''}">${s}</span>`).join('')}</div>
        <div class="log">${LOG.map(([w, t]) => `<div><span class="w">${w}</span><span>${t}</span></div>`).join('')}${int ? `<div><span class="w">0:41</span><span style="color:var(--red)">Interrupted. Run again starts from the beginning; the clickstream lookups already made are cached and not paid for twice.</span></div>` : ''}</div></div>`;
    }
    if (state === 'done') body = `<div class="pitch">The draft is below in the list; the review list is one click away. Nothing is measured until the bank is frozen.</div><div style="margin-top:12px;display:flex;gap:8px"><a class="btn btn-go" href="qb-1-bank.html" style="text-decoration:none">Open the draft bank</a><a class="btn btn-line" href="qb-2-review.html" style="text-decoration:none">Review ${QB.reviewOpen()} items</a></div>`;
    root.innerHTML = head + body;
    root.querySelectorAll('[data-build]').forEach((b) => b.onclick = () => { QB.toast('Would start the build (about $0.15) and show its progress here.'); QB.buildGo && QB.buildGo('running'); });
  };
})();
