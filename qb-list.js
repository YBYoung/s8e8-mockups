/* Question bank mockups (#1842): the list. Grouped by subject, main services first, the fixed sort inside; one row per
   question with its situation, local flag, three demand numbers, status, source with evidence and the row actions
   (accept, dismiss, edit wording, merge into, flip local, retire, keep on purpose). Edits live in memory only. */
(function () {
  const QB = window.QB; const { esc, h, fmt, n } = QB; const D = QB.D;
  const ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  const ICON_CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';

  /* state: per-question overrides for the mockup session */
  const S = QB.listState = { ov: {}, open: {}, filter: { text: '', sit: null, local: false }, log: [] };
  const ov = (q) => S.ov[q.id] || {};
  QB.q = (q) => ({ ...q, ...ov(q) });
  QB.set = (id, patch, what) => { S.ov[id] = { ...(S.ov[id] || {}), ...patch }; if (what) S.log.unshift({ when: QB.today, who: QB.me, what }); QB.redraw(); };
  QB.undo = (id) => { delete S.ov[id]; QB.redraw(); };
  QB.redraw = () => { QB.onRedraw && QB.onRedraw(); };

  const SRC_TIP = { 'Search Console': 'a real search the practice was seen for', 'Fan-out': 'a sub-question an AI model asks itself about this service', 'Market Trends': 'a Market Trends search phrase for this subject', 'Forum': 'a patient forum post', 'AI Visibility': 'an AI Visibility tracked question', 'Audience research': 'an audience research head query', 'Find gaps': 'a gap the calendar\'s Find gaps run found', 'Profile': 'the practice profile' };
  function sourceChip(q) {
    const ev = q.evidence || [];
    const body = `<b>${esc(q.source)}</b>: wording came from ${esc(SRC_TIP[q.source] || 'this source')}.` + (ev.length ? `<ul>${ev.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : '') + (q.merged?.length ? `<div class="q">Absorbed as match phrases: ${q.merged.map(esc).join('; ')}</div>` : '') + '<div class="q">Admission came from measured demand, a checklist point or the SEO, never from the wording source.</div>';
    return `<span class="src" data-tip="${QB.tip('Source and evidence', body)}">${esc(q.source)}</span>`;
  }
  function statusCell(q) {
    const st = q.status || 'draft';
    if (st === 'suggested') return `<span class="st sugg" data-tip="${QB.tip('Suggested', `Proposed by ${esc(q.suggestedBy || 'a tool')} on ${esc(q.suggestedOn || QB.today)}. Not measured until accepted.`)}"><span class="dot a"></span>Waiting</span>`;
    if (st === 'retired') return `<span class="st">Retired</span>`;
    if (st === 'dismissed') return `<span class="st">Dismissed</span>`;
    if (st === 'merged') return `<span class="st">Merged</span>`;
    if (q.offStrategy) return `<span class="st off" data-tip="${QB.tip('Off strategy', 'The service this question is about is not offered, or is not on the profile. Dismiss it in one glance, or add it anyway as kept on purpose.')}">Off strategy</span>`;
    if (q.kept) return `<span class="st kept" data-tip="${QB.tip('Kept on purpose', 'The SEO kept this question although it has no measured demand yet. It sorts to the top of its tier and every tool sees it first.')}">Kept by SEO</span>`;
    if (st === 'active') return `<span class="st" data-tip="${QB.tip('Active', 'Part of the frozen bank; every tool measures it.')}">Active</span>`;
    return `<span class="st" data-tip="${QB.tip('Draft', 'In the draft bank. Becomes active when the bank is frozen.')}">Draft</span>`;
  }
  function metaLine(q) {
    const bits = [`<span class="sit" data-tip="${QB.tip('Situation: ' + QB.SIT_WORD[q.situation], esc(QB.SIT_TIP[q.situation]))}">${esc(QB.SIT_WORD[q.situation])}</span>`];
    if (q.local) bits.push(`<span class="loc" data-tip="${QB.tip('Local question', `The bank keeps this question city-free; the page fills in each office's city (${esc(D.offices[0].city)}). Set automatically because ${q.situation === 'choosing' ? 'every choosing question is local' : 'its real wordings carry place words often'}. Flip it from the row menu if that is wrong.`)}">${ICON_PIN}Local</span>`);
    if (q.checklist?.length) bits.push(`<span class="chk" data-tip="${QB.tip('Service checklist', `The basics a full answer must cover, folded into this question:<ul>${q.checklist.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`)}">${ICON_CHK}Checklist ${q.checklist.length}</span>`);
    if (q.matchPhrases?.length) bits.push(`<span class="help" data-tip="${QB.tip('Match phrases', `Real wordings that send a search to this question, within ${esc(q.subject)} only:<ul>${q.matchPhrases.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`)}">${n(q.matchPhrases.length, 'wording', 'wordings')}</span>`);
    return bits.join('<span class="sep">·</span>');
  }
  function questionText(q) {
    const city = D.offices[0].city;
    if (q.local && q.textCity && !q.edited && q.textCity.includes(city)) {
      const t = q.textCity.replace(/[?.]+$/, '').replace(new RegExp(`\\b${city}(, FL)?`), `\u0000${city}\u0001`);
      return esc(t).replace('\u0000', '<span class="city">').replace('\u0001', '</span>') + '?';
    }
    return esc(q.text);
  }

  /* ---- row actions ---- */
  function actions(q, row, opts) {
    const same = D.questions.filter((o) => o.subject === q.subject && o.id !== q.id && !['retired', 'merged', 'dismissed'].includes(QB.q(o).status));
    const items = [];
    if (q.status === 'suggested') items.push({ label: 'Accept into the bank', on: () => QB.set(q.id, { status: opts.frozen ? 'active' : 'draft', suggestedBy: q.suggestedBy }, `Accepted "${q.text}"`) }, { label: 'Dismiss', on: () => QB.set(q.id, { status: 'dismissed' }, `Dismissed "${q.text}"`) }, 'sep');
    items.push({ label: 'Edit wording', on: () => { S.open[q.id] = 'edit'; QB.redraw(); } });
    items.push({ label: 'Merge into another question', on: () => { S.open[q.id] = 'merge'; QB.redraw(); } });
    items.push({ label: q.local ? 'Make it not local' : 'Make it local', on: () => QB.set(q.id, { local: !q.local }, `${q.local ? 'Unflagged' : 'Flagged'} local: "${q.text}"`) });
    if (q.status !== 'suggested') items.push({ label: q.kept ? 'Stop keeping on purpose' : 'Keep on purpose', on: () => QB.set(q.id, { kept: !q.kept }, `${q.kept ? 'Unkept' : 'Kept'} "${q.text}"`) });
    if (q.status !== 'suggested') items.push('sep', { label: 'Retire', cls: 'danger', on: () => QB.set(q.id, { status: 'retired' }, `Retired "${q.text}"`) });
    return items;
  }
  function openPanel(q, opts) {
    const kind = S.open[q.id]; if (!kind) return '';
    if (kind === 'edit') return `<div class="edit"><input class="ed" value="${esc(q.text)}" data-edit><button class="btn btn-go sm" data-save>Save</button><button class="btn btn-text sm" data-cancel>Cancel</button><span class="note">The match phrases stay; the question is re-embedded from the new words. Saved as a relabelled marker.</span></div>`;
    const same = D.questions.filter((o) => o.subject === q.subject && o.id !== q.id && !['retired', 'merged', 'dismissed', 'suggested'].includes(QB.q(o).status)).slice(0, 6);
    return `<div class="merge"><div class="k">Merge into another ${esc(q.subject)} question. This wording stays on it as a match phrase, so every real search still counts.</div>${same.map((o) => `<div class="opt" data-into="${o.id}">${esc(QB.q(o).text)}<small>${o.demand.ownImp ? fmt(o.demand.ownImp) + " times seen by the practice" : "not seen by the practice"}</small></div>`).join('')}<button class="btn btn-text sm" data-cancel>Cancel</button></div>`;
  }
  function outcome(q, all) {
    if (q.status === 'retired') return `<div class="outcome">Retired by ${QB.me} · ${QB.today}. A marker on the history; runs before and after compare on the other questions. <button class="lnk" data-undo>Undo</button></div>`;
    if (q.status === 'dismissed') return `<div class="outcome">Dismissed. The wording is kept, nothing is measured. <button class="lnk" data-undo>Undo</button></div>`;
    if (q.status === 'merged') { const into = all.find((o) => o.id === q.mergedInto); return `<div class="outcome">Merged into <b>${esc(into ? QB.q(into).text : '')}</b>; this wording is now one of its match phrases. <button class="lnk" data-undo>Undo</button></div>`; }
    return '';
  }

  function rowHTML(q, opts) {
    const cls = ['row', q.status === 'retired' ? 'retired' : '', q.status === 'dismissed' ? 'dismissed' : '', q.status === 'merged' ? 'merged' : '', q.status === 'suggested' ? 'sugg' : '', S.open[q.id] ? 'on' : ''].join(' ');
    return `<div class="${cls}" data-id="${q.id}">
      <div class="q"><div class="t">${questionText(q)}</div><div class="m">${metaLine(q)}</div></div>
      ${QB.demandCell(q, 'cs')}${QB.demandCell(q, 'ag')}${QB.demandCell(q, 'own')}
      <div>${statusCell(q)}</div><div>${sourceChip(q)}</div>
      ${opts.readOnly ? '<span></span>' : `<button class="more" aria-label="Actions" data-more>···</button>`}
      ${opts.readOnly ? '' : openPanel(q, opts)}${outcome(q, opts.all)}</div>`;
  }
  function wireRow(row, q, opts) {
    row.querySelector('[data-more]')?.addEventListener('click', (e) => QB.menu(e.currentTarget, actions(q, row, opts)));
    row.querySelector('[data-save]')?.addEventListener('click', () => { const v = row.querySelector('[data-edit]').value.trim(); delete S.open[q.id]; if (v && v !== q.text) QB.set(q.id, { text: v, edited: true }, `Reworded "${q.text}"`); else QB.redraw(); });
    row.querySelector('[data-edit]')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') row.querySelector('[data-save]').click(); if (e.key === 'Escape') { delete S.open[q.id]; QB.redraw(); } });
    row.querySelectorAll('[data-cancel]').forEach((b) => b.onclick = () => { delete S.open[q.id]; QB.redraw(); });
    row.querySelectorAll('[data-into]').forEach((b) => b.onclick = () => { delete S.open[q.id]; QB.set(q.id, { status: 'merged', mergedInto: b.dataset.into }, `Merged "${q.text}"`); });
    row.querySelector('[data-undo]')?.addEventListener('click', () => QB.undo(q.id));
  }

  /* ---- the grouped list ---- */
  const matches = (q) => { const f = S.filter; if (f.sit && q.situation !== f.sit) return false; if (f.local && !q.local) return false; if (f.text && !(q.text + ' ' + q.subject).toLowerCase().includes(f.text.toLowerCase())) return false; return true; };
  const TIER_NOTE = { main: 'Main services first; inside each subject the fixed order every tool uses.', other: 'Offered services that are not main services.', practice: 'Questions about the practice as a whole, and needs with no treatment of their own.' };
  const SORT_TIP = QB.tip('The fixed order', 'The same order every tool uses to pick top questions: questions kept by the SEO first; then treatment, cost, insurance, comparison and choosing questions before aftercare, symptom and emergency; then how often the practice was seen, then our clients, then US searches.');
  QB.renderList = function (root, opts) {
    const subjById = QB.subjById(); const all = (opts.questions || D.questions).map(QB.q); opts.all = all;
    const extra = (opts.extraSubjects || []);
    const tiers = ['main', 'other', 'practice'];
    const subjects = QB.sortSubjects(D.subjects.concat(extra));
    let html = '';
    for (const tier of tiers) {
      const ss = subjects.filter((s) => s.tier === tier && (!opts.onlySubjects || opts.onlySubjects.includes(s.name))); const qs = all.filter((q) => subjById[q.subject]?.tier === tier || extra.find((e) => e.name === q.subject && e.tier === tier));
      if (!ss.length) continue;
      html += `<div class="tier"><div class="tier-h"><h3>${esc(QB.TIER_WORD[tier])}</h3><span class="c">${n(ss.length, 'subject', 'subjects')} · ${n(qs.length, 'question', 'questions')}</span><span class="note help" data-tip="${tier === 'main' ? SORT_TIP : QB.tip(QB.TIER_WORD[tier], esc(TIER_NOTE[tier]))}">${esc(TIER_NOTE[tier])}</span></div>`;
      for (const s of ss) {
        const rows = QB.sortQuestions(all.filter((q) => q.subject === s.name), { ...subjById, [s.name]: s }).filter(matches);
        if (!rows.length && (S.filter.text || S.filter.sit || S.filter.local)) continue;
        const own = rows.reduce((a, q) => a + (q.demand.ownImp || 0), 0);
        const tierTip = QB.tip(tier === 'main' ? 'Main service' : tier === 'other' ? 'Other service' : 'Practice-level', `${esc(s.tierSource || '')}<div class="q">The tier is read from the practice profile, never stored on a question. Change it on the Profile tab.</div>`);
        html += `<div class="subj" data-subj="${esc(s.name)}"><div class="subj-h"><b>${esc(s.name)}</b><span class="tierk ${tier === 'main' ? '' : 'other'}" data-tip="${tierTip}">${tier === 'main' ? 'Main service' : tier === 'other' ? 'Other service' : 'Practice-level'}</span><span class="c">${n(rows.length, 'question', 'questions')}</span>
          <span class="sum"><span>seen <b>${fmt(own)}</b> times by the practice</span><button class="fold" aria-label="Fold">▾</button></span></div>
          <div class="cols"><span>Question</span>${QB.DEMAND_COLS.map((c) => `<span class="r"><span class="help" data-tip="${QB.tip(c.label, c.tip)}">${esc(c.label)}</span></span>`).join('')}<span>Status</span><span>Source</span><span></span></div>
          <div class="rows">${rows.length ? rows.map((q) => rowHTML(q, opts)).join('') : '<div class="empty">No questions yet for this service.</div>'}</div></div>`;
      }
      html += '</div>';
    }
    root.innerHTML = html;
    root.querySelectorAll('.row').forEach((row) => wireRow(row, all.find((q) => q.id === row.dataset.id), opts));
    root.querySelectorAll('.fold').forEach((b) => b.onclick = () => b.closest('.subj').classList.toggle('closed'));
  };

  /* filter controls for the sticky bar */
  QB.filterHTML = () => `<div class="filt"><input class="ed srch" placeholder="Find a question or subject" value="${esc(S.filter.text)}" data-f-text>
    <button class="menu-btn" data-f-sit>${S.filter.sit ? esc(QB.SIT_WORD[S.filter.sit]) : 'Every situation'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg></button>
    <button class="menu-btn ${S.filter.local ? 'on' : ''}" data-f-local style="${S.filter.local ? 'color:var(--aInk);border-color:var(--aSoft);background:var(--aTint)' : ''}">Local only</button></div>`;
  QB.wireFilter = (el) => {
    const t = el.querySelector('[data-f-text]'); t?.addEventListener('input', () => { S.filter.text = t.value; QB.redraw(); setTimeout(() => { const x = document.querySelector('[data-f-text]'); x && x.focus(); x && x.setSelectionRange(x.value.length, x.value.length); }, 0); });
    el.querySelector('[data-f-sit]')?.addEventListener('click', (e) => QB.menu(e.currentTarget, [{ label: 'Every situation', cls: S.filter.sit ? '' : 'on', on: () => { S.filter.sit = null; QB.redraw(); } }, 'sep', ...QB.SITUATIONS.map((s) => ({ label: QB.SIT_WORD[s], cls: S.filter.sit === s ? 'on' : '', on: () => { S.filter.sit = s; QB.redraw(); } }))]));
    el.querySelector('[data-f-local]')?.addEventListener('click', () => { S.filter.local = !S.filter.local; QB.redraw(); });
  };
})();
