/* Round 4 (#1417) Tracking: switches the tab between its two states, as AIV's TrackingTab. Not tracking: the setup.
   Tracking: a contents rail beside Overview, By subject and What we track. A mockup switch at the bottom flips the
   state so both can be seen; it is a mockup control, not part of the product. */
(function () {
  const T = window.RA4T; const D = T.D; const S = T.S;
  let main = null, editing = false, seq = 0;
  const CAD_WORD = { weekly: 'every Monday', monthly: 'on the first of each month' };

  function what(sel) {
    if (sel.cadence === 'off') return `Light mode started: the practice's own site, once a month`;
    return `${sel.cadence === 'weekly' ? 'Weekly' : 'Monthly'} tracking started: the site and ${T.competitors.length} competitor sites, ${CAD_WORD[sel.cadence]}`;
  }
  function addChange(title, why, price) { S.changes.push({ id: 'c' + (++seq), seq, kind: 'change', iso: T.RUN1, f: T.MEAS_F, title, why: why || '', price, op: 1 }); }

  function start(sel, why) {
    Object.assign(S, { tracking: true, cadence: sel.cadence, light: sel.light, stopped: false });
    addChange(what(sel), why || (S.changes.length ? '' : 'To start the history the same week the questions were built.'), `About ${T.Price.usd(T.quote(S).monthly)} a month`);
    editing = false; draw(); window.scrollTo({ top: 0, behavior: 'smooth' });
    window.RA4.toast(`Tracking on. ${T.What.summary()}`);
  }
  function change(sel, why) {
    const was = T.quote(S).monthly; Object.assign(S, { cadence: sel.cadence, light: sel.light });
    if (sel.cadence === 'off' && !sel.light) { stop(); return; }
    const now = T.quote(S).monthly;
    addChange(sel.cadence === 'off' ? 'Changed to light mode: the practice\'s own site, once a month' : `Changed to ${sel.cadence} runs, ${CAD_WORD[sel.cadence]}`, why, `${T.Price.usd(was)} a month before, about ${T.Price.usd(now)} a month from the next run`);
    editing = false; draw(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function stop() {
    addChange('Tracking stopped. Every run so far is kept', '', '');
    Object.assign(S, { tracking: false, stopped: true, cadence: 'off', light: false });
    editing = false; draw(); window.scrollTo({ top: 0, behavior: 'smooth' });
    window.RA4.toast('Tracking stopped. Run 1 and the history are kept.');
  }

  function rail() {
    const q = T.quote(S);
    const items = [['overview', 'Overview', `Main services ${window.RA4.MAIN.full} of ${window.RA4.MAIN.n} in full`], ['by-subject', 'By subject', `${T.topGain.name} gained most`],
      ['what-we-track', 'What we track', q.light ? `Light · ${T.Price.usd(q.monthly)} a month` : `${S.cadence === 'weekly' ? 'Weekly' : 'Monthly'} · ${T.Price.usd(q.monthly)} a month`]];
    return `<nav class="t4-rail" aria-label="Tracking sections"><div class="t4-eb q">On this page</div>${items.map(([id, w, v], i) => `<a href="#${id}" data-to="${id}" class="${i ? '' : 'on'}"><span class="no">${i + 1}</span><span><b>${w}</b><small>${T.K.esc(v)}</small></span></a>`).join('')}
      <div class="bar"><i></i></div><a class="top" href="#" data-top>Back to the top ↑</a></nav>`;
  }
  function wireRail() {
    const links = [...main.querySelectorAll('[data-to]')];
    links.forEach((a) => { a.onclick = (e) => { e.preventDefault(); document.getElementById(a.dataset.to).scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
    main.querySelector('[data-top]').onclick = (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const bar = main.querySelector('.t4-rail .bar i');
    const spy = () => {
      let cur = links[0]; links.forEach((a) => { const s = document.getElementById(a.dataset.to); if (s && s.getBoundingClientRect().top < 200) cur = a; });
      links.forEach((a) => a.classList.toggle('on', a === cur));
      const h = document.documentElement; bar.style.width = `${Math.min(100, (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100)}%`;
    };
    window.onscroll = spy; spy();
  }

  function draw() {
    main.innerHTML = ''; window.onscroll = null;
    if (!S.tracking || editing) {
      T.Setup.render(main, { changing: editing, onSave: editing ? change : start, onCancel: () => { editing = false; draw(); } });
    } else {
      main.innerHTML = `<div class="t4-on">${rail()}<div class="t4-body" data-body></div></div>`;
      const body = main.querySelector('[data-body]');
      T.Overview.render(body); T.Subjects.render(body);
      T.What.render(body, { onChange: () => { editing = true; draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, onStop: stop });
      wireRail();
    }
    paintSwitch();
  }

  function paintSwitch() {
    let sw = document.querySelector('.t4-switch');
    if (!sw) { sw = document.createElement('div'); sw.className = 't4-switch'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'Mockup state'); document.body.appendChild(sw); }
    sw.innerHTML = `<span class="k">Mockup state</span><button data-s="off" class="${S.tracking ? '' : 'on'}">Not tracking yet</button><button data-s="on" class="${S.tracking ? 'on' : ''}">Tracking on</button>`;
    sw.querySelector('[data-s=off]').onclick = () => { Object.assign(S, { tracking: false, cadence: 'off', light: false, stopped: false, changes: [] }); editing = false; draw(); window.scrollTo({ top: 0 }); };
    sw.querySelector('[data-s=on]').onclick = () => { if (S.tracking && !editing) return; if (!S.tracking) { S.changes = []; start({ cadence: 'weekly', light: false }); } else { editing = false; draw(); } };
  }

  T.mountApp = (host) => { main = host; main.classList.add('t4'); draw(); };
})();
