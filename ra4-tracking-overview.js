/* Round 4 (#1417) Tracking: renders the Overview section, as AIV's OverviewSection. One headline sentence written from
   the numbers, the other counts in plain words with branded hovers, what is rebuilt and what is measured, then the chart. */
(function () {
  const T = window.RA4T; const { esc } = T.K; const D = T.D;

  /* the measure is per priority group (#1554); the headline leads with main services */
  function headline() {
    const g = T.group(window.RA4.MAIN.key), now = g.knots[g.knots.length - 1], start = g.knots[0], up = now.full - start.full;
    return `${g.label}: the site answers ${now.full} of ${g.n} questions in full, ${up > 1 ? `${up} more than in ${T.monY(start.iso)}` : `about the same as in ${T.monY(start.iso)}`}.`;
  }
  const others = () => T.groups.filter((g) => g.key !== 'all' && g.key !== window.RA4.MAIN.key);

  function render(host) {
    const q = T.quote(T.S);
    const next = q.next ? `${T.weekday(q.next)}, ${T.day(q.next)}` : null;
    const sec = document.createElement('section'); sec.id = 'overview'; sec.className = 't4-sec'; host.appendChild(sec);
    sec.innerHTML = `<div class="t4-eb">Overview · run 1, ${T.dayY(T.RUN1)}</div>
      <h2 class="t4-h1">${esc(headline())}</h2>
      <div class="t4-stats">
        ${others().map((g) => { const now = g.knots[g.knots.length - 1], t = window.RA4.TIERS.find((x) => x.key === g.key); return `<span${T.tip(`${t.about} ${now.part} more are answered in part and ${now.none} not at all.`, g.label)}>${esc(g.label)} <b>${now.full} of ${g.n}</b> in full</span>`; }).join('')}
        <span${T.tip(next ? `Each run reads the whole site again, checks the same ${D.counts.questions} questions and keeps its own results.` : 'Tracking is off, so nothing is planned. Run again still works by hand.', 'Next run')}>${next ? `Next run <b>${next}</b>` : 'No run planned'}</span>
      </div>
      ${window.RA4.tierNote ? `<p class="t4-honest">${esc(window.RA4.tierNote)}</p>` : ''}
      <p class="t4-honest"><b>One run so far.</b> Run 1 on ${T.day(T.RUN1)} is the only real measurement. The weeks before it are an estimate: each page counts from the week Google first saw it, as if it always said what it says now.</p>
      <div data-chart></div>`;
    return T.mountChart(sec.querySelector('[data-chart]'));
  }

  T.Overview = { render, headline };
})();
