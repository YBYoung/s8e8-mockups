/* Round 4 (#1417) Tracking: renders What we track, as AIV's WhatWeTrack. The bank, competitors and cadence now; every
   change with its reason and price; the next run, this month's spend, Change what we track, and Stop tracking with a
   confirm step. */
(function () {
  const T = window.RA4T; const { esc } = T.K; const D = T.D; const usd = (v) => T.Price.usd(v);
  const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);

  function summary() {
    const q = T.quote(T.S), S = T.S;
    if (q.light) return `A light run once a month on the practice's own site, about ${usd(q.monthly)} a month.`;
    return `${S.cadence === 'weekly' ? 'Weekly' : 'Monthly'} runs on ${D.counts.questions} questions and ${T.competitors.length} competitor sites, about ${usd(q.monthly)} a month.`;
  }

  function render(host, opts) {
    const S = T.S, q = T.quote(S);
    const sec = document.createElement('section'); sec.id = 'what-we-track'; sec.className = 't4-sec'; host.appendChild(sec);
    const changes = T.moments.filter((m) => m.kind === 'change').concat(S.changes).sort((a, b) => b.f - a.f || (b.seq || 0) - (a.seq || 0));
    const reads = q.light ? "the practice's own site only" : `the site and ${T.competitors.length} competitor sites`;
    let confirming = false;
    function draw() {
      sec.innerHTML = `<div class="t4-eb">What we track</div><h2 class="t4-h2">${esc(summary())}</h2>
        <div class="t4-chips"><span class="t4-chip"><b>Questions</b> ${D.counts.questions} in ${D.topics.length} subjects, built automatically</span>
          ${q.light ? '<span class="t4-chip">No competitors in light mode</span>' : T.competitors.map((c) => `<span class="t4-chip"><i class="t4-sw" style="background:#7C3AED"></i>${esc(c)}</span>`).join('')}
          <span class="t4-chip"><b>${q.light ? 'Light mode' : S.cadence === 'weekly' ? 'Weekly' : 'Monthly'}</b> ${S.cadence === 'weekly' ? 'every Monday' : 'the first of each month'}</span>
          <button class="t4-soft" data-change>Change what we track</button></div>
        <p class="t4-bs">A change starts with the next run and shows on the chart as a dark diamond. Earlier runs stay as they are. The questions stay the same between changes, so every run is checked against the same questions.</p>
        <h3 class="t4-h3">Changes</h3>
        <div class="t4-list">${changes.map((c) => `<div class="it"><span class="d">${T.day(c.iso)}</span><div><p>${esc(c.title)}.</p>${c.why ? `<p class="m">Why: ${esc(c.why)}</p>` : ''}${c.price ? `<p class="m">${esc(c.price)}</p>` : ''}</div></div>`).join('')}</div>
        <div class="t4-foot">
          <span>Next run ${T.weekday(q.next)}, ${T.day(q.next)} at 6 AM Eastern · ${D.counts.questions} questions on ${reads} ·</span>
          <span>$0.30 spent this month, on run 1.${q.monthly ? ` About ${usd(q.monthly)} a month from here.` : ''}</span>
          ${confirming ? `<span class="ask"><span>Stop tracking? Every run so far is kept, and the chart keeps its history.</span><button class="t4-line" data-stop>Stop tracking</button><button class="t4-line" data-keep>Keep tracking</button></span>`
            : '<button class="t4-ghost" data-ask>· Stop tracking</button>'}
        </div>`;
      sec.querySelector('[data-change]').onclick = opts.onChange;
      sec.querySelector('[data-ask]')?.addEventListener('click', () => { confirming = true; draw(); });
      sec.querySelector('[data-keep]')?.addEventListener('click', () => { confirming = false; draw(); });
      sec.querySelector('[data-stop]')?.addEventListener('click', opts.onStop);
    }
    draw();
  }

  T.What = { render, summary, list };
})();
