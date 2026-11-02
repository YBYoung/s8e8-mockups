/* Round 4 (#1417) Tracking: renders the setup, as AIV's TrackingSetup. Choices on the left (full tracking off, weekly or
   monthly; light mode with its cost warning; what each run reads), the price panel on the right following them.
   The same screen changes what is tracked, with a Why box that goes beside the change on the chart. */
(function () {
  const T = window.RA4T; const { esc } = T.K; const D = T.D;
  const CAD = [
    ['off', 'Off', 'Runs only when someone presses Run again.', '$0'],
    ['weekly', 'Weekly', `Every Monday, starting ${T.day(T.NEXT.weekly)}. Best while pages are being written or strengthened.`, 'about $1.20 a week'],
    ['monthly', 'Monthly', `The first of each month, starting ${T.day(T.NEXT.monthly)}. Enough to see three months of work show up.`, 'about $1.20 a month'],
  ];
  const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);

  function render(host, opts) {
    const S = T.S, changing = !!opts.changing;
    const sel = { cadence: S.cadence, light: S.light }; let warn = false, note = '';
    const was = changing ? T.quote(S).monthly : null;
    const dirty = () => sel.cadence !== S.cadence || sel.light !== S.light;
    function draw() {
      const full = sel.cadence !== 'off';
      host.innerHTML = `<div class="t4-setup"><div class="t4-choices">
        <div class="t4-eb">${changing ? 'Tracking · change what we track' : 'Tracking · set up'}</div>
        <h2 class="t4-h1">${changing ? `Change what we track for ${esc(D.practice)}.` : `Choose how often to check ${esc(D.practice)}'s answers.`}</h2>
        <p class="t4-lede">${changing ? 'Nothing already measured changes. The change starts with the next run and goes on the chart with its reason.' : `Each run reads the site again and checks it against the same ${D.counts.questions} patient questions. The price on the right changes with the choices.`}</p>
        ${S.stopped && !changing ? `<p class="t4-note">Tracking stopped on ${T.day(T.RUN1)}. Run 1 and its results are kept.</p>` : ''}
        <section class="t4-box"><h3>Full tracking</h3><p class="t4-bs">Reads the practice's site and the ${T.competitors.length} competitor sites: ${list(T.competitors)}.</p>
          ${CAD.map(([k, w, d, p]) => `<button type="button" class="t4-row ${sel.cadence === k ? 'on' : ''}" role="radio" aria-checked="${sel.cadence === k}" data-cad="${k}">
            <span class="t4-radio"></span><span class="w"><b>${w}</b>${changing && k !== S.cadence && sel.cadence === k ? '<span class="t4-tag">starts with the next run</span>' : ''}<span class="d">${d}</span></span><span class="p">${p}</span></button>`).join('')}
        </section>
        <section class="t4-box ${full ? 'dim' : ''}"><h3>Light mode</h3><p class="t4-bs">A small run once a month on the practice's own site, with the questions built automatically and no competitors. It keeps a history that cannot be rebuilt later.</p>
          <button type="button" class="t4-row ${sel.light && !full ? 'on' : ''}" role="checkbox" aria-checked="${sel.light && !full}" data-light ${full ? 'aria-disabled="true"' : ''}>
            <span class="t4-check">${sel.light && !full ? '<svg viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.5l4.5-5"/></svg>' : ''}</span>
            <span class="w"><b>Light mode ${sel.light && !full ? 'on' : 'off'}</b><span class="d">${full ? 'Full tracking already keeps the history, so light mode is not needed while it runs.' : sel.light ? `Once a month on the practice's site, starting ${T.day(T.NEXT.light)}.` : 'Off by default for every client. Nothing runs and nothing is charged.'}</span></span>
            <span class="p">${full ? '' : 'about $0.30 a month'}</span></button>
          ${warn ? `<div class="t4-warn" role="alert"><b>This adds a monthly cost.</b> Light mode costs about $0.30 per run, once a month, charged to ${esc(D.practice)}'s tool costs until someone switches it off. It reads only the practice's own site, so it shows no competitors.
            <div class="b"><button class="t4-dark" data-yes>Turn on light mode, about $0.30 a month</button><button class="t4-ghost q" data-no>Keep it off</button></div></div>` : ''}
        </section>
        <section class="t4-box"><h3>What each run reads</h3>
          <div class="t4-kv"><span>The question bank</span><div>${D.counts.questions} questions in ${D.topics.length} subjects, built automatically on ${T.day(T.RUN1)}. They stay the same from run to run. No one has reviewed them yet. <a class="r4-link" href="#" data-bank>Open the bank on the practice page</a></div>
          <span>When the bank changes</span><div>The chart gets a mark on that day. Runs before and after it are compared only on the questions they have in common.</div>
          <span>The site</span><div>Every page is read again at each run. ${D.counts.pages} pages today.</div>
          <span>Competitors</span><div>${full ? list(T.competitors) : 'None in light mode.'}</div></div>
        </section>
        ${changing ? `<section class="t4-box"><label for="t4-why"><h3>Why</h3></label><p class="t4-bs">Shown beside this change on the chart, so the chart explains itself.</p>
          <textarea id="t4-why" rows="2" maxlength="500" placeholder="Client starting a pediatric dentistry push">${esc(note)}</textarea></section>
          <button class="t4-line" data-keep>Keep what we track</button>` : ''}
      </div>${T.Price.html(sel, { changing, was, dirty: dirty() })}</div>`;
      host.querySelectorAll('[data-cad]').forEach((b) => { b.onclick = () => { sel.cadence = b.dataset.cad; warn = false; draw(); }; });
      const lb = host.querySelector('[data-light]');
      lb.onclick = () => { if (full) return; if (sel.light) { sel.light = false; warn = false; } else warn = true; draw(); };
      host.querySelector('[data-yes]')?.addEventListener('click', () => { sel.light = true; warn = false; draw(); });
      host.querySelector('[data-no]')?.addEventListener('click', () => { warn = false; draw(); });
      host.querySelector('[data-bank]').onclick = (e) => { e.preventDefault(); window.RA4.toast("Would open the bank on Kari Mann Dental Studio's practice page."); };
      const why = host.querySelector('#t4-why'); if (why) why.oninput = () => { note = why.value; };
      host.querySelector('[data-keep]')?.addEventListener('click', opts.onCancel);
      host.querySelector('[data-save]').onclick = () => opts.onSave({ cadence: sel.cadence, light: sel.cadence === 'off' && sel.light }, note.trim());
    }
    draw();
  }

  T.Setup = { render };
})();
