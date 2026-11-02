/* Round 4 (#1417) Competitors section 02: renders the subjects where the picked competitor is strongest.
   One row per subject: how many of its questions the competitor answers in full, one square per question. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const C = window.RA4C; const { Q, esc, COLORS } = K;
  const CL = COLORS.light; const MARK = { covered: CL.comp, thin: '#C4B5FD', gap: CL.gap };
  const WORD = { covered: 'Answered in full', thin: 'Answered in part', gap: 'Not answered' };

  function row(t, site) {
    const qs = Q.filter(q => q.topic === t.name).sort((a, b) => ({ covered: 0, thin: 1, gap: 2 })[C.vOf(a, site)] - ({ covered: 0, thin: 1, gap: 2 })[C.vOf(b, site)]);
    const sq = qs.map(q => `<i class="c4-sq sm" style="background:${MARK[C.vOf(q, site)]}" data-tip-h="${esc(q.text)}" data-tip="${esc(`${WORD[C.vOf(q, site)]} on ${site}. ${WORD[q.verdict]} on the practice's site.`)}"></i>`).join('');
    return `<div class="c4-subj"><div class="top"><b>${esc(t.name)}</b><span>answers ${t.full} of ${t.n} in full</span></div>
      <div class="c4-sqs">${sq}</div>
      <div class="sub">${t.wins ? (t.full === 1 ? 'The practice does not answer that one in full.' : `Of those ${t.full}, the practice does not answer ${t.wins} in full.`) : (t.full === 1 ? 'The practice answers that one in full too.' : `The practice answers ${t.full === 2 ? 'both' : `all ${t.full}`} in full too.`)}</div></div>`;
  }

  C.sSubjects = function (s) {
    const top = s.subjects[0];
    return {
      id: 'subjects', no: '02', eyebrow: 'Its strongest subjects',
      headline: top ? `${esc(s.site)} is strongest on ${esc(top.name)}.` : `${esc(s.site)} answers no subject's questions in full.`,
      lede: top ? `It answers ${top.full} of the ${top.n} ${esc(top.name)} questions in full. Subjects with the most questions answered in full come first.` : '',
      left: top ? `<div class="c4-keys"><span class="c4-key"><i style="background:${CL.comp}"></i>${esc(s.site)}, in full</span><span class="c4-key"><i style="background:#C4B5FD"></i>In part</span><span class="c4-key"><i style="background:${CL.gap}"></i>Not answered</span></div>` : '',
      fig: top ? C.more(s.subjects.map(t => row(t, s.site)), 5, `Show all ${s.subjects.length} subjects`) : '<p class="c4-calm">No subject stands out for this site.</p>',
    };
  };
})();
