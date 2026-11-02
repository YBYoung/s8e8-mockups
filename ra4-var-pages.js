/* Round 4 variations P1 and P2 (#1417): the practice's own pages in the space, without cluttering it.
   P1 anchors: each page is a small mark on the plane at the centre of the questions it answers best, with fine threads
   to them; two pages pulling on the same question are the "own pages competing" of chapter 05.
   P2 constellations: no new objects; each page is drawn as a faint line joining the questions it answers, like a
   constellation, named when it matters; shared stars are questions two pages compete for. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const { D, Q, QBY, PBY, esc, COLORS } = K;
  const C = COLORS.dark;
  const short = (p) => R.pageTitle(p.path).replace(/ in Cape Coral,? ?(FL)?/i, '').replace(/ \| .*/, '');
  // each page's questions: the ones it answers best, plus the ones it competes for (merge findings)
  function pageLinks() {
    const best = {}, compete = {};
    Q.forEach(q => { (best[q.page] = best[q.page] || []).push(q.id); if (q.splitNote) q.ownPages.forEach(p => { if (p !== q.page) (compete[p] = compete[p] || []).push(q.id); }); });
    return { best, compete };
  }
  const glowDot = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.translate(32, 32); g.rotate(Math.PI / 4); g.strokeStyle = '#fff'; g.lineWidth = 3; g.shadowColor = '#fff'; g.shadowBlur = 8; g.strokeRect(-11, -11, 22, 22); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-11, -11, 22, 22); return new THREE.CanvasTexture(cv); })();

  // the page layer on any orbit: P1 anchors or P2 constellations, the lit rule, and picking a page (Story and variations)
  R.addPages = function (O, mode, list, opts) {
    opts = opts || {}; const restLabels = opts.restLabels !== false;   // the Story names only lit pages
    list = list || D.pages.filter(p => p.questions.length).sort((a, b) => b.questions.length - a.questions.length);
    const { stage, state, scene, W } = O; const g3 = scene.own.g; const BY = {}; scene.own.beads.forEach(b => { BY[b.q.id] = b; });
    const { best, compete } = pageLinks();
    const view = { on: true, compete: false };
    const P1 = mode === 'anchors';

    // one object per page: the mark (P1) or the line (P2), its threads, its label
    const items = list.map(p => {
      const ids = best[p.path] || []; const cids = compete[p.path] || [];
      const it = { p, ids, cids, label: stage.addLabel(() => it.c.clone(), short(p), '', 'q pg'), c: new THREE.Vector3() };
      it.label.prio = 0; it.label.el.addEventListener('click', () => selectPage(p.path));
      if (P1) {
        it.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowDot, color: new THREE.Color(C.own), transparent: true, opacity: 0.85, depthWrite: false })); g3.add(it.mark);
        it.hit = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); it.hit.userData = { type: 'page', id: p.path }; g3.add(it.hit); stage.pickables.push(it.hit);
        it.threads = ids.concat(cids).map(qid => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false })); l.userData = { qid, compete: cids.includes(qid) }; g3.add(l); return l; });
      } else {
        const order = ids.concat(cids.filter(x => !ids.includes(x))).sort((a, b) => BY[a].a - BY[b].a);
        it.order = order; it.line = order.length > 1 ? new THREE.Line(new THREE.BufferGeometry().setFromPoints(order.map(() => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: new THREE.Color(C.own), transparent: true, opacity: 0.12, depthWrite: false })) : null; if (it.line) g3.add(it.line);
      }
      return it;
    });
    const pageOf = {}; items.forEach(it => { pageOf[it.p.path] = it; });

    function lit() {   // which pages are lit now: the selected page, the hovered question's pages, or every competing pair
      const sel = state.selected; const hov = state.hoverObj; const s = new Set();
      if (sel && sel.type === 'page') s.add(sel.id);
      if (hov && hov.type === 'page') s.add(hov.id);
      if (hov && hov.type === 'question') { const q = QBY[hov.id]; s.add(q.page); if (q.splitNote) q.ownPages.forEach(p => s.add(p)); }
      if (sel && sel.type === 'question') { const q = QBY[sel.id]; s.add(q.page); if (q.splitNote) q.ownPages.forEach(p => s.add(p)); }
      if (view.compete) items.forEach(it => { if (it.cids.length) { s.add(it.p.path); } });
      return s;
    }
    stage.frameHooks.push(() => {
      const L = lit(); const any = L.size > 0;
      items.forEach((it, i) => {
        const pts = it.ids.concat(it.cids).map(qid => BY[qid].m.position); if (!pts.length) return;
        it.c.set(0, 0, 0); pts.forEach(v => it.c.add(v)); it.c.multiplyScalar(1 / pts.length); it.c.y = 0.05;
        const on = L.has(it.p.path); const show = view.on;
        it.label.hidden = !show || !(on || (restLabels && !any && it.ids.length >= (P1 ? 5 : 4)));
        if (P1) {
          it.mark.visible = show; it.hit.position.copy(it.c); it.mark.position.copy(it.c); it.mark.scale.setScalar((0.32 + Math.min(it.ids.length, 10) * 0.035) * (on ? 1.35 : 1)); it.mark.material.opacity = !any || on ? 0.9 : 0.25;
          it.threads.forEach(l => { l.visible = show && (!view.compete || !!QBY[l.userData.qid].splitNote); const pa = l.geometry.attributes.position; const b = BY[l.userData.qid].m.position; pa.setXYZ(0, it.c.x, it.c.y, it.c.z); pa.setXYZ(1, b.x, b.y, b.z); pa.needsUpdate = true;
            l.material.color.copy(l.userData.compete ? new THREE.Color('#F0ABFC') : BY[l.userData.qid].m.material.color); l.material.opacity = on ? (l.userData.compete ? 0.75 : 0.6) : any ? 0.03 : (l.userData.compete ? 0.16 : 0.09); });
        } else if (it.line) {
          it.line.visible = show; const pa = it.line.geometry.attributes.position; it.order.forEach((qid, j) => { const b = BY[qid].m.position; pa.setXYZ(j, b.x, b.y, b.z); }); pa.needsUpdate = true;
          it.line.material.opacity = on ? 0.85 : any ? 0.04 : 0.13; it.line.material.color.set(on && it.cids.length && view.compete ? '#F0ABFC' : C.own);
        }
      });
    });
    function selectPage(path) { W.openPanel({ type: 'page', id: path }); const it = pageOf[path]; const ids = it.ids.concat(it.cids); state.highlight = new Set(ids); W.sync(); const f = scene.focus(ids); stage.flyTo(f.center, Math.max(20, f.radius), f.yaw, f.pitch, 1500); }
    return { view, items, selectPage, pageOf };
  };

  function mountPages(id, mode) {
    const P1 = mode === 'anchors';
    const body = R.varFrame(id, P1
      ? { pitch: 'pages as anchors: a mark per page at the centre of its questions, with fine threads.', headline: 'Each page sits among the questions it answers.', sub: 'A page\'s mark sits at the centre of the questions it answers best, with a fine thread to each. Two marks pulling on one question means it is answered in part on two different pages. Click a mark for the page.' }
      : { pitch: 'pages as constellations: no new objects; each page joins the questions it answers with a faint line.', headline: 'Each page is a constellation of the questions it answers.', sub: 'Hover a question to light the page that answers it; pick a page on the right to trace it. Where two constellations share a star, that question is answered in part on two different pages.' });
    const list = D.pages.filter(p => p.questions.length).sort((a, b) => b.questions.length - a.questions.length);
    body.innerHTML = `<div class="r4v-stage" data-card></div><p class="r4v-read" data-read></p>`;
    const controls = `<label class="sw-row"><input type="checkbox" data-pg checked>Pages</label><button class="btn btn-line sm r4v-dark" data-compete>Show questions split across pages</button>`;
    const overlay = P1 ? '' : `<div class="ov r4v-plist"><div class="h">Pages, by questions answered</div>${list.slice(0, 14).map(p => `<button data-path="${esc(p.path)}"><span>${esc(short(p))}</span><b>${p.questions.length}</b></button>`).join('')}<div class="more">${list.length - 14} more pages answer fewer questions</div></div>`;
    const O = R.makeOrbit(body.querySelector('[data-card]'), { controls, overlay, keyExtra: `<span class="ro"><i class="r4v-${P1 ? 'diamond' : 'line'}"></i>${P1 ? 'a page of the site' : 'a page, joining its questions'}</span>` });
    const L = R.addPages(O, mode, list); const { stage, state, W } = O; const { view, items, selectPage } = L;
    O.card.querySelectorAll('[data-path]').forEach(b => b.addEventListener('click', () => selectPage(b.dataset.path)));
    O.card.querySelector('[data-pg]').addEventListener('change', (e) => { view.on = e.target.checked; });
    const read = body.querySelector('[data-read]'); const nComp = items.filter(it => it.cids.length).length;
    O.card.querySelector('[data-compete]').addEventListener('click', (e) => { view.compete = !view.compete; e.target.textContent = view.compete ? 'Show every page' : 'Show questions split across pages';
      state.highlight = view.compete ? new Set(R.splits.map(q => q.id)) : null; W.closePanel(); W.sync();
      read.innerHTML = view.compete ? `${R.splits.length} questions get part of an answer on two or more different pages. Those are different services or articles, not duplicates: the pink ${P1 ? 'threads' : 'lines'} show where a fuller answer belongs on one page.` : readAll; });
    const readAll = `${list.length} of the site's ${D.counts.pages} pages answer at least one question best. The biggest: ${esc(short(list[0]))}, with ${list[0].questions.length}.`;
    read.innerHTML = readAll;
  }
  R.mountP1 = () => mountPages('p1', 'anchors');
  R.mountP2 = () => mountPages('p2', 'constellations');
})();
