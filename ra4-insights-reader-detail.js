/* Round 4 (#1417) Insights: renders the reader's right column, everything known about one question.
   Verdict, the reader's note, the best section on the site, the competitor's answer, the local check, the next step. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { esc, COLORS, STEP } = K; const C = COLORS.light;
  const LOCAL = [['phone_on_page', 'Phone'], ['street_address_on_page', 'Street address'], ['is_location_or_contact_page', 'Location page']];
  const snip = (heading, text) => `<div class="i4-snip">${heading ? `<b>${esc(I.clean(heading))}</b>` : ''}${esc(I.clean(text, 520))}</div>`;
  I.readerDetail = function (q) {
    const g = I.itemOf(q.id); const c = q.comp; const st = STEP[q.step];
    return `<div class="i4-rk">${esc(q.topic)} · ${I.INTENT[q.intent]}${q.local ? ' · local' : ''}</div>
      <h3>${esc(q.text)}</h3>
      <div class="i4-vl"><i class="i4-sq" style="background:${C[q.verdict]}"></i>${I.WORD[q.verdict]} on the site${c ? `<span class="sep"></span><i class="i4-sq" style="background:${I.COMP[c.verdict]}"></i>${I.SHORT[c.verdict][0].toUpperCase() + I.SHORT[c.verdict].slice(1)} on ${esc(c.site)}` : ''}</div>
      <div class="i4-nb"><div class="i4-gl">Note on the answer</div><p>${esc(q.note)}</p></div>
      <div class="i4-nb"><div class="i4-gl">Best section on the site</div><div class="i4-pt"><b>${esc(R.pageTitle(q.sectionPage || q.page))}</b><span class="path">${esc(q.sectionPage || q.page)}</span></div>${snip(q.section.heading, q.section.text)}
        ${q.ownPages.length > 1 ? `<p class="i4-sm">${R.n(q.ownPages.length - 1, 'other page', 'other pages')} of the site also ${q.ownPages.length > 2 ? 'touch' : 'touches'} on it.</p>` : ''}</div>
      ${q.local && q.localEvidence ? `<div class="i4-nb"><div class="i4-gl">Local check on that page</div><div class="i4-checks">${(() => { const ok = K.cityOk(q.localEvidence, q.page); return `<span><i style="background:${ok ? '#0F766E' : '#E11D48'}">${ok ? '✓' : '×'}</i>${K.cityWord(q.page)}</span>`; })()}${LOCAL.map(([k, w]) => `<span><i style="background:${q.localEvidence[k] ? '#0F766E' : '#E11D48'}">${q.localEvidence[k] ? '✓' : '×'}</i>${w}</span>`).join('')}</div>
        <p class="i4-sm">${q.localPass ? 'Passes: a nearby patient finds the city and a way to reach the practice.' : 'Falls short: a nearby patient does not find the city and a way to reach the practice.'}</p></div>` : ''}
      ${c ? `<div class="i4-nb"><div class="i4-gl c">Best competitor answer</div><div class="i4-pt"><b>${esc(c.site)}</b><span class="path">${esc(R.host(c.url))}</span></div>${c.text ? snip(c.heading, c.text) : ''}<p class="i4-sm">${esc(c.note)}</p></div>` : ''}
      <div class="i4-next"><div class="i4-gl">Next step</div><b>${esc(st[0])}</b><span>${esc(g && g.kind === 'strengthen' ? `${st[1]} The page: ${g.title}.` : st[1])}</span>${g ? `<div class="i4-cf">${I.act(g)}</div>` : ''}</div>`;
  };
})();
