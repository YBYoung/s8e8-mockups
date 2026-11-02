/* Round 4 (#1417) Insights: opens the app's standard task dialog for one piece of work (merge, local or trust).
   About 960px wide, two columns, no scrolling, with No week / This week / Next week; nothing is really made. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { D, esc, fmtWeek } = K;
  const WEEKS = [['no_week', 'No week'], ['this_week', 'This week'], ['next_week', 'Next week']];
  function finding(g) {
    const qn = R.n(g.questions.length, 'question', 'questions');
    if (g.kind === 'merge') return `${g.pages.length} of the site's pages each give part of the answer to ${qn}. No one page answers ${g.questions.length === 1 ? 'it' : 'them'} in full.`;
    if (g.kind === 'local') return `${g.title} is the closest page for ${qn} from patients looking nearby, but its title does not name the city.`;
    return `${g.title} answers ${qn} in full, but the page shows no phone number or street address.`;
  }
  function notes(g) {
    const qs = g.questions.map(q => `- ${q.text}`).join('\n');
    if (g.kind === 'merge') return `Questions:\n${qs}\n\nPages:\n${g.pages.map(p => `- ${p}`).join('\n')}\n\nKeep one page as the home for these answers and fold the others into it.`;
    if (g.kind === 'local') { const ev = K.PBY[g.page].localEvidence; const add = [!K.cityOk(ev, g.page) && (K.cityRule(g.page) === 'copy' ? 'the city to the article text' : 'the city to the page title'), !ev.phone_on_page && 'the phone number', !ev.street_address_on_page && 'the street address'].filter(Boolean);
      return `Page: ${g.page}\nQuestions:\n${qs}\n\nAdd ${add.join(', ')} to the page.`; }
    return `Page: ${g.page}\nQuestions:\n${qs}\n\nAdd the practice's phone number and street address to the page.`;
  }
  const summary = (wk, g) => `One task, in ${D.practice}'s Asana project${g.kind === 'trust' ? ' with the Site Audit tasks' : ''}, and on Weekly Workload ${wk === 'no_week' ? 'with no week yet' : 'for ' + WEEKS.find(w => w[0] === wk)[1].toLowerCase()}.`;

  I.openTask = function (g) {
    let wk = 'no_week';
    const el = K.h(`<div class="i4-scrim"><div class="i4-dlg" role="dialog" aria-modal="true" aria-labelledby="i4-dt">
      <div class="hd"><div><h2 id="i4-dt">${esc(g.verb)}</h2><div class="from"><b>From the Relevance Analyzer:</b> ${esc(finding(g))}</div></div><button type="button" class="x" aria-label="Close">×</button></div>
      <div class="bd"><div class="cols"><div class="col">
        <div class="row"><label class="k" for="i4-tn">Task name</label><input id="i4-tn" class="in" value="${esc(`${g.verb}: ${g.title}`.slice(0, 140))}"></div>
        <div class="row"><span class="k">Assignee</span><div class="with"><button type="button" class="pick none" data-pick>Nobody yet<svg viewBox="0 0 12 12"><path d="m3 4.5 3 3 3-3"/></svg></button><span class="hint">the SEO list loads in the app</span></div></div>
        <div class="row"><label class="k" for="i4-dd">Due date</label><input id="i4-dd" class="in sm" type="date"></div>
        <div class="row"><span class="k">Week</span><div class="seg" role="group" aria-label="Week">${WEEKS.map(([k, w]) => `<button type="button" data-wk="${k}" aria-pressed="${k === wk}">${w}</button>`).join('')}</div></div>
        <div class="row"><label class="k" for="i4-et">Estimated time</label><div class="with"><input id="i4-et" class="in est" type="number" min="0" step="5" placeholder="minutes"></div></div>
        <div class="lands"><div class="lh">Lands in</div>
          <div class="lr"><div class="pn">${esc(D.practice)}<small>the client's Asana project${g.kind === 'trust' ? ', as a Site Audit task under Trust signals' : ', in General'}</small></div></div>
          <div class="lr"><div class="pn">Weekly Workload<small data-plate>the board with no week yet</small></div></div></div>
      </div><div class="col side">
        <div class="row"><label class="k" for="i4-nt">Notes</label><textarea id="i4-nt" class="in">${esc(notes(g))}</textarea></div>
        <div class="row"><label class="k" for="i4-cm">Comment</label><textarea id="i4-cm" class="in cm">${esc(`Made from the Relevance Analyzer run of ${fmtWeek(D.crawlDate)} for ${D.practice}.`)}</textarea></div>
      </div></div></div>
      <div class="ft"><span class="sum" data-sum>${esc(summary(wk, g))}</span><button type="button" class="b" data-cancel>Cancel</button><button type="button" class="b pri" data-make>${esc(R.KIND[g.kind].destWord)}</button></div></div></div>`);
    const opener = document.activeElement;
    const close = () => { el.remove(); document.removeEventListener('keydown', key, true); opener && opener.focus && opener.focus(); };
    const key = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); close(); } };
    document.addEventListener('keydown', key, true);
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('.x') || e.target.closest('[data-cancel]')) return close();
      const w = e.target.closest('[data-wk]');
      if (w) { wk = w.dataset.wk; el.querySelectorAll('[data-wk]').forEach(b => b.setAttribute('aria-pressed', b === w)); el.querySelector('[data-sum]').textContent = summary(wk, g); el.querySelector('[data-plate]').textContent = wk === 'no_week' ? 'the board with no week yet' : `${w.textContent}, on the assignee's plate`; }
      if (e.target.closest('[data-pick]')) R.toast('Mockup: in the app this lists the SEO team.');
      if (e.target.closest('[data-make]')) { I.state.set(g.key, 'task'); close(); R.toast('Mockup: nothing was made. In the app this creates the task in Asana, with the notes above.'); }
    });
    document.body.appendChild(el); el.querySelector('#i4-tn').focus();
  };
})();
