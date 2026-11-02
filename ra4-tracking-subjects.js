/* Round 4 (#1417) Tracking: renders the By subject section. One row per subject: its answers over the weeks as a small
   line picture, run 1's counts, the change since the last run (none yet, said plainly, with the normal-swing rule), and
   the practice's own Google for the pages that carry it. A row opens to those pages, each with its own Google line. */
(function () {
  const T = window.RA4T; const { esc, fmtN } = T.K; const D = T.D; const C = () => T.Chart.C;
  const TIER = { priority: 'main service', other: 'other service', practice: 'about the practice' };
  const sw = (c) => `<i class="t4-sw" style="background:${c}"></i>`;

  function seenLine(p) {
    if (p.firstWeek == null) return 'Not yet seen in Google';
    if (p.firstWeek === 0) return `In Google before ${T.monY(D.weeks[0])}`;
    return `First seen in Google ${T.dayY(D.weeks[p.firstWeek])}`;
  }
  function pageRow(p) {
    const f = p.qs.filter((q) => q.verdict === 'covered').length, h = p.qs.filter((q) => q.verdict === 'thin').length, g = p.qs.length - f - h;
    const bits = [f && `${sw(C().full)}${f} in full`, h && `${sw(C().part)}${h} in part`, g && `${sw('#CBD3DC')}${g} not answered`].filter(Boolean).join('<span class="dot">·</span>');
    const recentNew = p.firstWeek != null && p.firstWeek > T.K.LAST - D.lagMedianWeeks;
    return `<div class="t4-pg"><div><div class="t">${esc(p.title)}</div><div class="u">${esc(p.path)} · ${seenLine(p)}</div></div>
      <div class="q">${bits}</div>
      <div class="g">${T.Spark.google(p.imp)}<span><b>${fmtN(p.lately)}</b> times seen a week lately<br>${fmtN(p.totClk)} clicks since ${T.monY(D.weeks[0]).slice(0, 3)} ${D.weeks[0].slice(0, 4)}${recentNew && !p.totClk ? '<br><span class="new">too new for a click yet</span>' : ''}</span></div></div>`;
  }

  /* a header row per priority group, carrying the group's count: the relevance measure (#1554) */
  function groupRow(tier) {
    const t = window.RA4.TIERS.find((x) => x.key === tier); if (!t) return '';
    return `<div class="grp" role="row"><b>${esc(t.label)}</b><span>answers ${t.full} of ${t.n} in full · ${t.part} in part · ${t.none} not answered</span></div>`;
  }

  function render(host) {
    const g = T.topGain;
    const sec = document.createElement('section'); sec.id = 'by-subject'; sec.className = 't4-sec'; host.appendChild(sec);
    const firstAns = g.first.full + g.first.part, nowAns = g.now.full + g.now.part;
    sec.innerHTML = `<div class="t4-eb">By subject</div>
      <h2 class="t4-h2">${esc(g.name)} gained the most: ${nowAns} of its ${g.n} questions now get at least part of an answer, up from ${firstAns} in ${T.monY(D.weeks[0])}.</h2>
      <p class="t4-lede sm">Each small chart shows how many of one subject's questions are answered in full and in part, out of that subject's own total. The shaded part is the estimate; the dots at the end are run 1. Click a subject to see the pages that answer it.</p>
      <div class="t4-subj" role="table">
        <div class="hd" role="row"><span>Subject</span><span>${T.monY(D.weeks[0]).slice(0, 3)} ${D.weeks[0].slice(0, 4)} to run 1</span><span>Run 1</span>
          <span${T.tip('From run 2 on, this shows each subject\'s change since the run before. A rise or fall of 2 or 3 questions between runs is normal and counts as no change.', 'Since the last run')}>Since the last run</span>
          <span${T.tip(`Times seen in Google and clicks on searches about the subject's questions, from the practice's own Search Console, saved by search since Sep 22, 2025; last 4 weeks' average. Half of the site's pages got their first click within ${D.lagMedianWeeks} weeks of first being seen.`, 'The practice\'s own Google')}>Google, last 4 weeks</span></div>
        ${T.subjects.map((s, i) => `${i === 0 || T.subjects[i - 1].tier !== s.tier ? groupRow(s.tier) : ''}<div class="row" role="row" tabindex="0" data-i="${i}" aria-expanded="false">
          <span class="nm"><b>${esc(s.name)}</b><small>${TIER[s.tier]} · ${s.n} questions</small></span>
          <span>${T.Spark.answers(s.weekly, s.n)}</span>
          <span class="ct">${sw(C().full)}<b>${s.now.full}</b> in full<br>${sw(C().part)}<b>${s.now.part}</b> in part<br>${sw('#CBD3DC')}<b>${s.none}</b> not answered</span>
          <span class="nx">No second run yet</span>
          <span class="gg">${s.seenTotal ? T.Spark.google(s.imp, 96, 26) : ''}<span>${s.seenTotal ? `seen <b>${fmtN(s.lately)}</b> times a week<br><b>${fmtN(s.latelyClk)}</b> ${s.latelyClk === 1 ? 'click' : 'clicks'} a week` : 'not seen in Google for these searches since Sep 2025'}</span></span>
          <span class="chev" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M3 4.5 6 7.5 9 4.5"/></svg></span></div>
          <div class="open" data-open="${i}"></div>`).join('')}
      </div>`;
    sec.querySelectorAll('.row').forEach((r) => {
      const toggle = () => {
        const i = +r.dataset.i, box = sec.querySelector(`[data-open="${i}"]`), open = r.getAttribute('aria-expanded') === 'true';
        r.setAttribute('aria-expanded', String(!open)); r.classList.toggle('on', !open);
        if (open) { box.innerHTML = ''; return; }
        const s = T.subjects[i];
        box.innerHTML = `<div class="t4-pages"><div class="ph">The ${s.pages.length === 1 ? 'page' : `${s.pages.length} pages`} that answer ${esc(s.name)}'s questions, most seen first<span style="font-weight:500;color:var(--muted)"> · each page's own Google, from page-level Search Console data</span></div>${s.pages.map(pageRow).join('')}
          <p class="t4-cap">Clicks lag behind: half of the site's pages got their first click within ${D.lagMedianWeeks} weeks of first being seen in Google, so a page first seen lately may show no clicks yet.</p></div>`;
      };
      r.addEventListener('click', toggle); r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }

  T.Subjects = { render };
})();
