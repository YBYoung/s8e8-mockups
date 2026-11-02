/* Round 4 (#1417) Insights section 05: renders the local and trust signals on the pages that answer local questions.
   A strip of every local question, then one checklist per page that falls short. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { Q, PBY, esc } = K;
  const LOC = Q.filter(q => q.local); const FAIL = R.localFails;
  const PASS = LOC.length - FAIL.length;
  const T = R.byKind.trust; const L = R.byKind.local;
  const CHECKS = [['city_in_title_h1_meta', 'City in the title'], ['city_in_copy', 'City in the copy'], ['phone_on_page', 'Phone'], ['street_address_on_page', 'Street address'], ['is_location_or_contact_page', 'Location page']];
  const pages = {}; FAIL.forEach(q => { (pages[q.page] = pages[q.page] || []).push(q); });
  T.forEach(g => { pages[g.page] = pages[g.page] || []; });
  const order = Object.keys(pages).sort((a, b) => pages[b].length - pages[a].length);
  const noCity = FAIL.every(q => !K.cityOk(q.localEvidence, q.page));
  const OK = '#0F766E', BAD = '#E11D48';

  function strip() {
    const sorted = LOC.slice().sort((a, b) => (b.localPass ? 1 : 0) - (a.localPass ? 1 : 0));
    return `<div class="i4-strip">${sorted.map(q => `<i class="i4-sq" style="background:${q.localPass ? OK : '#F4A3B4'}" data-q="${q.id}" data-tip-h="${esc(q.text)}" data-tip="${q.localPass ? 'Passes: the page shows the city and a way to reach the practice.' : 'Falls short: ' + esc(miss(q.localEvidence, q.page).join(', ').toLowerCase()) + ' missing.'}"></i>`).join('')}</div>
      <div class="i4-cap">${PASS} of the ${LOC.length} local questions lead to a page that shows the city and a way to reach the practice. ${FAIL.length} do not.</div>`;
  }
  const miss = (ev, path) => [!K.cityOk(ev, path) && K.cityWord(path)].concat(CHECKS.filter(([k]) => (k === 'phone_on_page' || k === 'street_address_on_page') && !ev[k]).map(c => c[1])).filter(Boolean);
  function card(path) {
    const ev = PBY[path].localEvidence; const qs = pages[path];
    const loc = L.find(g => g.page === path); const tr = T.find(g => g.page === path);
    const by = {}; qs.filter(q => q.step === 'strengthen' || q.step === 'merge' || q.step === 'write').forEach(q => { by[q.step] = (by[q.step] || 0) + 1; });
    const how = { strengthen: 'strengthening this page', merge: 'merging the competing pages', write: 'a new page' };
    const parts = Object.entries(by).map(([k, n]) => `${how[k].replace(/^./, c => c.toUpperCase())} answers ${qs.length > 1 ? `${n} of them` : 'it'}.`);
    const otherLine = parts.length ? `<div class="i4-near"><span class="k">${qs.length > 1 ? 'Their answers' : 'Its answer'}</span>${parts.join(' ')}<span class="m">The missing city, phone or address is added to this page itself.</span></div>` : '';
    return `<div class="i4-card">
      <div class="i4-ck">${qs.length ? R.n(qs.length, 'local question', 'local questions') : 'Trust signals'}</div>
      <div class="i4-pt"><b>${esc(R.pageTitle(path))}</b><span class="path">${esc(path)}</span></div>
      <div class="i4-checks">${CHECKS.map(([k, w]) => { const art = K.cityRule(path) === 'copy';
        if (art && k === 'city_in_title_h1_meta') return `<span class="y" data-tip-h="${w}" data-tip="Not needed on an article: its title should carry the patient's question. The city in the text is enough."><i style="background:#CBD3DC">–</i>${w}: not needed</span>`;
        return `<span class="${ev[k] ? 'y' : 'n'}" data-tip-h="${w}" data-tip="${ev[k] ? 'Found on the page.' : 'Not found on the page.'}"><i style="background:${ev[k] ? OK : BAD}">${ev[k] ? '✓' : '×'}</i>${w}</span>`; }).join('')}</div>
      ${qs.length ? `<div class="i4-qs">${qs.map(q => I.qline(q)).join('')}</div>` : ''}
      ${otherLine}
      ${tr ? `<div class="i4-gl">Trust signals</div><p class="i4-sm">This page also answers ${R.n(tr.questions.length, 'more question', 'more questions')} in full, but shows no phone number or street address.</p><div class="i4-qs">${tr.questions.map(q => I.qline(q)).join('')}</div>` : ''}
      ${loc || tr ? `<div class="i4-cf">${loc ? `<span class="i4-st">${esc(loc.verb)}</span>${I.act(loc)}` : ''}${tr ? `<span class="i4-st">${esc(tr.verb)}</span>${I.act(tr)}` : ''}</div>` : ''}</div>`;
  }

  I.sLocal = function () {
    const big = order[0]; const bigN = pages[big] ? pages[big].length : 0;
    const trSame = T.length && T[0].page === big;
    return {
      id: 'local', no: '05', eyebrow: 'Local and trust signals', rail: 'Local signals',
      verdict: FAIL.length ? `${FAIL.length} of ${LOC.length} questions fall short` : `All ${LOC.length} pass`,
      headline: !FAIL.length ? `All ${LOC.length} local questions lead to pages that show where the practice is.` : noCity ? `${FAIL.length} of the ${LOC.length} local questions lead to pages that do not name the city.` : `${FAIL.length} of the ${LOC.length} local questions lead to pages that do not show where the practice is.`,
      lede: `Local questions come from patients looking for a dentist nearby. They want to see the city and a phone number or street address on the page. A service page needs the city in its title; an article's title carries the patient's question, so the city in its text is enough. For ${PASS} of these ${LOC.length} questions, the page has both.${bigN > 1 ? ` ${bigN} of the other ${FAIL.length} lead to one page: ${esc(R.pageTitle(big))}.` : ''}`,
      note: T.length ? `${trSame ? 'That page' : esc(R.pageTitle(T[0].page))} also answers ${R.n(T[0].questions.length, 'other question', 'other questions')} in full but shows no phone number or street address. Adding them is a task for Site Audit.` : 'Every page that answers a question in full shows a phone number or street address.',
      fig: strip() + (order.length ? I.more(order.map(card), 2, `Show all ${order.length} pages`) : '<p class="i4-calm">No page falls short.</p>'),
    };
  };
})();
