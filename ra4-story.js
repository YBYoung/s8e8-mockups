/* Round 4 (#1417): the Story tab. Chapters scroll on the left; the orbit stays in view on the right and acts out each
   chapter (owner 11/1: the orbit becomes the Story's figure; free flight one click away, full screen). Reuses the
   approved orbit scene, stage and click panels (ra3d3-scene-orbit.js, ra3d2-kit.js, ra3d2-core.js) unchanged. */
(function () {
  const K = window.RA3D2; const kit = K.kit; const R = window.RA4; const { D, Q, QBY, LAST, h, esc, sw, COLORS } = K;
  const C = COLORS.dark;

  R.mountStory = function (main) {
    const chapters = R.storyChapters();
    main.innerHTML = `<div class="r4s"><div class="r4s-col" data-col>${chapters.map((c, i) => chapterHTML(c, i)).join('')}</div>
      <div class="r4s-fig" data-fig><div class="stage-card dark" data-stage>
        <div class="ov ov-tl"><div class="key"><span class="ro">${sw(C.covered)}Answered in full</span><span class="ro">${sw(C.thin)}In part</span><span class="ro">${sw(C.gap)}Not answered</span><span class="ro"><i class="r4v-line"></i>a page, joining its questions</span><span class="ro comp-key" style="display:none"><span style="display:inline-block;width:11px;height:11px;border:1.5px solid #A78BFA;border-radius:50%;margin-right:6px;vertical-align:-1px"></span>a competitor answers it in full, the site does not</span></div></div>
        <div class="ov ov-tr r4-free-only"><div class="ctl"><label class="sw-row"><input type="checkbox" data-layer="comp"><span class="sw" style="background:${C.comp}"></span>Competitors</label>
          <div class="ctl-h"><div class="seg seg-dark" data-h4><button class="on" data-h="flat">Flat</button><button data-h="demand">Height = demand</button></div></div></div></div>
        <div class="ov ov-bot r4-time"><div class="timebar"><button class="play" data-play aria-label="Play"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg></button><span class="wk" data-wk></span><input type="range" min="0" max="${LAST}" value="${LAST}" data-week><span class="cnt" data-cnt></span></div></div>
        <div class="r4s-free"><button class="btn" data-free>Explore freely</button></div>
      </div></div></div>`;

    const card = main.querySelector('[data-stage]'); const fig = main.querySelector('[data-fig]');
    const stage = kit.makeStage(card, { canvas: 'dark', fog: [28, 64], fov: 34, exposure: 1.1, drift: 0.01, home: { target: new THREE.Vector3(0, 0, 0), radius: 21, yaw: 0.35, pitch: 0.52 } }); window.RA3D_STAGE = stage;
    const state = { week: LAST, height: 'flat', heightMode: 'demand', layers: { comp: false, local: true }, highlight: null, highlightTopic: null, selected: null, hover: null, reader: 'seo', scope: { type: 'all' } };
    stage.state = state; stage.data = D; stage.K = K;
    const scene = K.scenes.orbit3(stage);
    // the Story has no side list, so the scene only steps aside for an open click panel
    const rawShift = stage.setShift; stage.setShift = (v) => rawShift(card.querySelector('.panel') ? v : 0);
    const ui = { setHeadline() {}, history: null, markTopic() {} };
    const W = kit.wire(stage, state, scene, { method: '' }, ui);
    // the practice's pages as constellations (owner 11/1: P2), faint until a chapter or a plan row lights one
    const PG = R.addPages({ stage, state, scene, W, card }, 'constellations', null, { restLabels: false });
    main.querySelectorAll('[data-h4] button').forEach(b => b.addEventListener('click', () => { main.querySelectorAll('[data-h4] button').forEach(x => x.classList.toggle('on', x === b)); state.height = b.dataset.h; W.sync(); }));
    W.setWeek(LAST, true);

    /* ------- a chapter acts itself out on the orbit ------- */
    let cur = -1, replay = null;
    function apply(i) {
      if (i === cur) return; cur = i; const s = chapters[i].scene;
      main.querySelectorAll('.r4c').forEach((el, j) => el.classList.toggle('on', j === i));
      if (replay) { clearInterval(replay); replay = null; }
      W.closePanel(); planPick(null, true);
      state.touring = true;
      state.layers.comp = !!s.comp; const cb = card.querySelector('[data-layer=comp]'); if (cb) cb.checked = !!s.comp;
      state.highlightTopic = s.topic || null;
      state.highlight = s.ids ? new Set(s.ids) : s.topic ? new Set(Q.filter(q => q.topic === s.topic).map(q => q.id)) : null;
      card.classList.toggle('r4-show-time', !!s.replay); PG.view.compete = !!s.split;
      if (s.replay) { W.setWeek(0, true); let w = 0; replay = setInterval(() => { w = Math.min(LAST, w + 1); W.setWeek(w, true); if (w >= LAST) { clearInterval(replay); replay = null; } }, 4200 / LAST); }
      else if (state.week !== LAST) W.setWeek(LAST, true);
      W.sync(); state.touring = false;
      fly(s);
    }
    function fly(s) {
      let f;
      if (s.topic) f = scene.frame(state);
      else if (s.ids && !s.wide) f = scene.focus(s.ids);
      else f = scene.homeFor(state);
      stage.idle = !s.topic; stage.flyTo(f.center, f.radius, f.yaw, f.pitch, 2200);
    }

    /* ------- scrolling picks the chapter: the last one whose top has passed 45% of the window ------- */
    const els = Array.from(main.querySelectorAll('.r4c'));
    function onScroll() { if (fig.classList.contains('full')) return; const mid = window.innerHeight * 0.45; let i = 0; els.forEach((el, j) => { if (el.getBoundingClientRect().top < mid) i = j; }); apply(i); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* ------- points name questions: a click opens the question on the orbit ------- */
    main.querySelectorAll('.r4c [data-q]').forEach(li => li.addEventListener('click', () => { const id = li.dataset.q; W.openPanel({ type: 'question', id }); const f = scene.focus([id]); stage.flyTo(f.center, f.radius, f.yaw, f.pitch, 1500); }));

    /* ------- the plan: a row lights its questions; the button sends it where the work happens ------- */
    const sent = {};
    function planPick(key, quiet) {
      main.querySelectorAll('.r4p-i').forEach(el => el.classList.toggle('on', el.dataset.key === key));
      if (!key || quiet) return; const g = R.top.find(x => x.key === key);
      W.closePanel(); state.highlightTopic = null; stage.idle = false;
      if (g.kind !== 'write' && g.page && PG.pageOf[g.page]) { PG.selectPage(g.page); return; }   // a page's work: trace its constellation, open the page
      state.highlight = new Set(g.questions.map(q => q.id)); W.sync();
      const f = scene.focus(g.questions.map(q => q.id)); stage.flyTo(f.center, f.radius, f.yaw, f.pitch, 1600);
    }
    main.querySelectorAll('.r4p-i').forEach(el => el.addEventListener('click', (e) => { if (e.target.closest('.go')) return; planPick(el.dataset.key); }));
    main.querySelectorAll('.r4c [data-plan]').forEach(li => li.addEventListener('click', () => planPick(li.dataset.plan)));
    main.querySelectorAll('.r4p-i .go').forEach(b => b.addEventListener('click', () => {
      const key = b.closest('.r4p-i').dataset.key; const g = R.top.find(x => x.key === key);
      if (sent[key]) { delete sent[key]; b.classList.remove('sent'); b.textContent = g.destWord; return; }
      sent[key] = true; b.classList.add('sent'); b.textContent = g.dest === 'calendar' ? 'Sent · undo' : g.dest === 'onpage' ? 'Opened · undo' : 'Task made · undo';
      R.toast(g.dest === 'calendar' ? `"${esc(g.title)}" would join the content calendar as a new piece (mockup: nothing sent).` : g.dest === 'onpage' ? `Would open On-Page on ${esc(g.page)} with its ${g.questions.length} missed questions (mockup).` : `Would open the task dialog for "${esc(g.verb)}" (mockup: nothing sent).`);
    }));

    /* ------- free flight: the orbit full screen, every control, Esc to come back ------- */
    function setFree(on) { fig.classList.toggle('full', on); card.classList.toggle('r4-free', on); main.querySelector('[data-free]').textContent = on ? 'Back to the Story' : 'Explore freely'; stage.resize(); if (!on) { cur = -1; onScroll(); } else { W.closePanel(); planPick(null, true); state.highlight = null; state.highlightTopic = null; state.touring = true; W.sync(); state.touring = false; stage.flyHome(1800); stage.idle = true; } }
    main.querySelector('[data-free]').addEventListener('click', () => setFree(!fig.classList.contains('full')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && fig.classList.contains('full') && !card.querySelector('.panel')) setFree(false); });
  };

  function chapterHTML(c, i) {
    return `<section class="r4c" data-ch="${c.id}"><div class="k"><span class="no">${String(i + 1).padStart(2, '0')}</span>${esc(c.k)}</div>
      <h2>${c.h2}</h2>${c.p ? `<p>${c.p}</p>` : ''}${c.tiles ? `<div class="tiles">${c.tiles.join('')}</div>` : ''}${c.block || ''}${c.pts && c.pts.length ? `<ul class="pts">${c.pts.join('')}</ul>` : ''}
      ${c.link ? `<a class="more" href="${c.link[0]}">${esc(c.link[1])}</a>` : ''}${c.plan ? planHTML() : ''}${c.plan ? `<a class="more" href="ra-4-insights.html">All ${R.items.length} pieces of work, in Insights →</a>` : ''}</section>`;
  }
  function planHTML() {
    const groups = [['write', 'New pages'], ['strengthen', 'Pages to strengthen'], ['merge', 'Pages to merge'], ['signals', 'Signals']];
    return `<div class="r4p">${groups.map(([k, word]) => { const list = R.top.filter(g => k === 'signals' ? (g.kind === 'local' || g.kind === 'trust') : g.kind === k); if (!list.length) return '';
      return `<div class="r4p-g">${word}</div>${list.map(g => `<div class="r4p-i" data-key="${esc(g.key)}"><span class="no">${g.planNo}</span><div><div class="t">${g.kind === 'merge' ? g.pages.map(x => esc(R.pageTitle(x))).join('<br>') : esc(g.title)}</div><div class="s">${subLine(g)}</div><button class="go">${esc(g.destWord)}</button></div></div>`).join('')}`; }).join('')}</div>`;
  }
  function subLine(g) {
    const k = g.questions.length; const comp = !g.compLeads ? '' : k === 1 ? ' · a competitor answers it in full' : ` · a competitor answers ${g.compLeads} of them in full`;
    if (g.kind === 'write') { const q0 = g.questions[0]; return q0.writeKind === 'comparison' ? `${esc(g.topic)} · a comparison article, linked from ${q0.linkFrom.map(x => esc(R.pageTitle(x))).join(' and ')}${comp}` : `${esc(g.topic)} · no page answers it yet · link the new page from ${esc(g.near)}${comp}`; }
    if (g.kind === 'strengthen') return `${esc(g.page)} · ${R.n(k, 'question', 'questions')} it answers in part or not at all${comp}`;
    if (g.kind === 'merge') return `${R.n(k, 'question', 'questions')} split between ${R.n(g.pages.length, 'page', 'pages')}`;
    return `${esc(g.page)} · ${g.kind === 'trust' ? 'no phone number or address on the page' : 'the city, phone or address missing'}`;
  }
})();
