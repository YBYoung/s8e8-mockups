/* Round 4 (#1417) Competitors section 01: renders the questions the picked competitor answers in full and the practice
   does not. Each row opens in place: the competitor's page and section, then the practice's one next step. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const C = window.RA4C; const { esc, STEP, COLORS } = K;
  const CL = COLORS.light;
  C.done = C.done || {};

  // the next step's button, or its finished state with Undo
  C.actHTML = function (q) {
    if (C.done[q.id]) return `<span class="c4-done"><svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5"/></svg>Sent to the content calendar</span><button type="button" class="r4-link" data-undo="${q.id}">Undo</button>`;
    const kind = R.KIND[q.step]; if (!kind) return '';
    return `<button type="button" class="c4-btn" data-act="${q.id}">${esc(kind.destWord)}</button>`;
  };

  function row(q, site) {
    const c = q.comps[site]; const step = STEP[q.step] || STEP.keep; const head = C.lastHeading(c.heading);
    // the practice's side, named as the practice's: the next step is always on the PRACTICE's site, never the competitor's
    const P = esc(K.D.practice), pg = esc(R.pageTitle(q.page));
    // when the page to strengthen differs from where the partial answer sits, say both, never mix them
    const moved = q.sectionPage && q.sectionPage !== q.page, at = esc(R.pageTitle(q.sectionPage || q.page));
    const own = q.verdict === 'thin' ? `${P} answers it in part today, on its page ${at}.`
      : q.step === 'strengthen' ? `${P} does not answer it yet. Its page to strengthen is ${pg}.` : `${P} does not answer it yet.`;
    const target = q.step === 'strengthen' ? `<div class="c4-gl">${P}'s page to strengthen</div>
          <div class="c4-pt">${pg}</div><div class="c4-url">${esc(q.page)}</div>
          ${moved ? `<p class="c4-snip">This is the page whose own subject the question is about. Add a full answer here; ${at} can link to it.</p>`
            : q.note ? `<p class="c4-snip"><b>What it misses:</b> ${esc(q.note)}</p>` : ''}`
      : q.step === 'write' ? `<div class="c4-gl">${P} has no page for this</div><p class="c4-snip">A new page on ${P}'s site answers it.</p>` : '';
    const doWhat = q.step === 'strengthen' ? `Strengthen ${P}'s page` : q.step === 'write' ? `Write a new page for ${P}` : step[0];
    return `<div class="c4-q"><div class="c4-qh" data-fold tabindex="0" role="button" aria-expanded="false">
        <i class="c4-sq" style="background:${CL[q.verdict]}" data-tip-h="${esc(q.text)}" data-tip="${esc(own)}"></i>
        <span class="t">${esc(q.text)}<span class="m">${esc(q.topic)} · ${esc(doWhat)}</span></span><span class="ar" aria-hidden="true"></span></div>
      <div class="c4-qd"><div><div class="c4-qin">
        <div class="c4-ans"><div class="c4-gl c">How ${esc(site)} answers it</div>
          <a class="c4-pt" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(C.cleanTitle(c.title))}</a><div class="c4-url">${esc(R.host(c.url))}</div>
          ${head ? `<div class="c4-hd">${esc(head)}</div>` : ''}<p class="c4-snip">${esc(C.snippet(String(c.text || '').replace(/^\s*#*\s*/, '').startsWith(head) ? String(c.text).replace(/^\s*#*\s*/, '').slice(head.length) : c.text, 280))}</p></div>
        <div class="c4-own">${target ? `<div class="c4-mine">${target}</div>` : ''}<div class="c4-gl">Next step, on ${P}'s site</div><b>${esc(doWhat)}</b>
          <p class="c4-was">${own}</p>
          <span class="c4-actw" data-actw="${q.id}">${C.actHTML(q)}</span></div>
      </div></div></div></div>`;
  }

  C.sQuestions = function (s) {
    const n = s.wins.length; const steps = {};
    s.wins.forEach(q => { steps[q.step] = (steps[q.step] || 0) + 1; });
    const parts = Object.entries(steps).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k === 'write' ? (v === 1 ? 'needs a new page' : 'need a new page') : k === 'strengthen' ? (v === 1 ? 'needs an existing page strengthened' : 'need an existing page strengthened') : (v === 1 ? 'needs its page signals fixed' : 'need their page signals fixed')}`);
    return {
      id: 'questions', no: '01', eyebrow: 'Where it is ahead',
      headline: n ? `${esc(s.site)} answers ${R.n(n, 'question', 'questions')} in full that the practice does not.` : `${esc(s.site)} answers no question in full that the practice does not.`,
      lede: n ? `The ones that matter most to the practice come first. ${parts.length > 1 ? `Of these, ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : n === 1 ? `It ${parts[0].replace(/^1 /, '')}` : `All ${parts[0]}`}.` : '',
      note: s.ahead ? `The other way round, the practice answers ${R.n(s.ahead, 'question', 'questions')} in full that ${esc(s.site)} does not.` : '',
      left: n ? `<div class="c4-keys"><span class="c4-key"><i style="background:${CL.thin}"></i>The site, in part</span><span class="c4-key"><i style="background:${CL.gap}"></i>Not answered on the site</span></div>` : '',
      fig: n ? C.more(s.wins.map(q => row(q, s.site)), 6, `Show all ${n}`) : `<p class="c4-calm">Nothing to catch up on here. Every question ${esc(s.site)} answers in full, the practice answers in full too.</p>`,
    };
  };
})();
