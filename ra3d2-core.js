/* Relevance Analyzer 3D, round 2 (#1417): shared facts, words, panels, history and method window.
   Scenes and the stage live in ra3d2-kit.js and ra3d2-scene-*.js. Data is ra3d-data.js (real, built by build_ra3d_data.py). */
(function () {
  window.addEventListener('error', (e) => { window.RA3D_ERR = (window.RA3D_ERR || '') + ' | ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno; });
  const D = window.RA3D_DATA;
  const Q = D.questions, QBY = Object.fromEntries(Q.map(q => [q.id, q]));
  const PBY = Object.fromEntries(D.pages.map(p => [p.path, p]));
  const TBY = Object.fromEntries(D.topics.map(t => [t.name, t]));
  const LAST = D.weeks.length - 1;
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtWeek = (w) => { const d = new Date(w + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  const fmtN = (n) => n.toLocaleString('en-US');
  const VERDICT_WORD = { covered: 'Answered in full', thin: 'Answered in part', gap: 'Not answered', absent: 'Page not yet in Google' };

  /* Verdict ramp is a sequential scale (answered, half, gap); validated with the dataviz validator for adjacent separation. */
  const COLORS = {
    light: { covered: '#0F766E', thin: '#5CB8A8', gap: '#CBD3DC', absent: '#E3E8EE', comp: '#7C3AED', own: '#6D28D9', page: '#0B1020', ink: '#0B1020', bg: '#F6F7F9', paper: '#FBFAF7' },
    dark: { covered: '#5EEAD4', thin: '#1C8F83', gap: '#3A4559', absent: '#232B3B', comp: '#C4B5FD', own: '#A78BFA', page: '#FFFFFF', ink: '#F3F4F6', bg: '#0A0E1A', paper: '#0E1322' },
  };
  const STEP = {
    write: ['Write a new page', 'No page on the site answers this question.'],
    strengthen: ['Strengthen this page', 'The page is on the right subject; add the missing answer to it.'],
    merge: ['Merge the competing pages', 'Several pages of the site compete for this question; give it one clear home.'],
    local: ['Strengthen local signals', 'The answer is there, but the page does not show the city, phone or address.'],
    trust: ['Add trust signals', 'The answer is there, but the page shows no phone or address.'],
    keep: ['Nothing to do', 'Answered in full, with the signals a patient looks for.'],
  };

  function pagePresent(path, week) { const p = PBY[path]; return p.firstWeek == null ? true : p.firstWeek <= week; }
  function verdictAt(q, week) { return pagePresent(q.page, week) ? q.verdict : 'absent'; }
  function dimmed(q) { return (q.local && q.localPass === false) || (!q.local && q.verdict !== 'gap' && !q.trust); }
  /* where the city must show (owner 11/1): a service or practice page needs it in the title (or is the location page);
     an article's title carries the patient's question, so the city in its text is enough */
  const cityRule = (path) => (/^\/blog\//.test(path || '') ? 'copy' : 'title');
  const cityOk = (e, path) => !!e && (cityRule(path) === 'copy' ? !!(e.city_in_copy || e.city_in_title_h1_meta) : !!(e.city_in_title_h1_meta || e.is_location_or_contact_page));
  const cityWord = (path) => (cityRule(path) === 'copy' ? 'City in the text (article)' : 'City in the title');
  function countsAt(week) { const c = { covered: 0, thin: 0, gap: 0 }; Q.forEach(q => { const v = verdictAt(q, week); c[v === 'absent' ? 'gap' : v]++; }); return c; }

  /* Five stops. Round 1's first stop repeated the headline, so it is gone. */
  function tourStops() {
    const sed = TBY['Oral Conscious Sedation'], ped = TBY['Pediatric Dentistry'], isd = TBY['Implant-Supported Dentures'];
    const isdThinCompCovered = Q.filter(q => q.topic === isd.name && q.verdict === 'thin' && q.comp && q.comp.verdict === 'covered').length;
    const byTopic = (n) => Q.filter(q => q.topic === n).map(q => q.id);
    return [
      { k: 'Strongest ground', ids: byTopic(sed.name), topic: sed.name,
        s: `Sedation is the practice's strongest ground: all ${sed.n} questions get an answer, ${sed.covered} in full.`,
        cs: `Sedation is your strongest ground: all ${sed.n} questions get an answer, ${sed.covered} in full.` },
      { k: 'A high-demand gap', ids: byTopic(ped.name), topic: ped.name,
        s: `Pediatric dentistry is one of the most searched subjects, and ${ped.gap} of its ${ped.n} questions have no answer on the site.`,
        cs: `Pediatric dentistry is one of the most searched subjects, and ${ped.gap} of its ${ped.n} questions have no answer on your site.` },
      { k: 'Where a competitor wins', ids: byTopic(isd.name), topic: isd.name, comp: true,
        s: `Implant dentures: ${isd.thin} of ${isd.n} questions are only answered in part, and a competitor answers ${isdThinCompCovered} of those in full.`,
        cs: `Implant dentures: ${isd.thin} of ${isd.n} questions are only answered in part, and another practice nearby answers ${isdThinCompCovered} of those in full.` },
      { k: 'Right subject, no answer', ids: ['ka125'], close: true,
        s: `The same-day crowns page is on the right subject for "How much does a same day crown cost?" but gives no price.`,
        cs: `Your same-day crowns page is on the right subject for "How much does a same day crown cost?" but gives no price.` },
      { k: 'A local question, half lit', ids: ['ka209'], close: true, local: true,
        s: `"I need a root canal and I'm nervous, where can I find a gentle dentist" lands on a blog guide with no phone or address on the page, so it stays half lit.`,
        cs: `"I need a root canal and I'm nervous, where can I find a gentle dentist" lands on a blog guide with no phone or address on the page, so it stays half lit.` },
    ];
  }

  /* ------- history: week by week from Search Console and GA4 ------- */
  function historyPanel(el, state, onWeek) {
    const CW = 860, CH = 78, PL = 44, PR = 14, PT = 10, PB = 18;
    const n = D.weeks.length;
    const X = (i) => PL + (i / (n - 1)) * (CW - PL - PR);
    const series = [['imp', 'Times seen in Google'], ['clk', 'Clicks from Google'], ['ses', 'Visits (GA4)']];
    const tip = h('<div class="hist-tip" style="display:none"></div>');
    function scopePages() {
      if (state.scope.type === 'page') return [PBY[state.scope.id]];
      if (state.scope.type === 'topic') { const paths = new Set(Q.filter(q => q.topic === state.scope.id).map(q => q.page)); return D.pages.filter(p => paths.has(p.path)); }
      return D.pages;
    }
    function render() {
      const pages = scopePages();
      const sums = {}; series.forEach(([k]) => { sums[k] = new Array(n).fill(0); pages.forEach(p => p[k].forEach((v, i) => sums[k][i] += v)); });
      const appear = {}; pages.forEach(p => { if (p.firstWeek != null && p.firstWeek > 0) appear[p.firstWeek] = (appear[p.firstWeek] || 0) + 1; });
      const title = state.scope.type === 'page' ? PBY[state.scope.id].title.split('|')[0].trim() : state.scope.type === 'topic' ? `${state.scope.id}: the ${pages.length} pages that answer its questions` : `All ${pages.length} pages of the site`;
      el.innerHTML = '';
      el.appendChild(h(`<div class="ch"><div><h2>What happened in Google, week by week</h2><div class="cs">${esc(title)}. From ${esc(D.practice)}'s own Search Console and GA4, weeks of ${fmtWeek(D.weeks[0])} to ${fmtWeek(D.weeks[LAST])}.</div></div>${state.scope.type !== 'all' ? '<button class="btn btn-line" data-all>All pages</button>' : ''}</div>`));
      series.forEach(([k, label], si) => {
        const vals = sums[k]; const max = Math.max(1, ...vals);
        const Y = (v) => PT + (1 - v / max) * (CH - PT - PB);
        const path = vals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
        const area = `${path}L${X(n - 1).toFixed(1)},${Y(0)}L${X(0)},${Y(0)}Z`;
        const ticks = [];
        for (let i = 0; i < n; i += 13) ticks.push(`<text x="${X(i)}" y="${CH - 4}" text-anchor="middle">${fmtWeek(D.weeks[i]).replace(/, \d{4}/, '').replace(/ \d+$/, '')} ${D.weeks[i].slice(2, 4)}</text>`);
        const marks = si === 0 ? Object.entries(appear).map(([w, c]) => `<g class="mk" data-w="${w}"><path d="M${X(+w) - 4},${PT - 8}L${X(+w) + 4},${PT - 8}L${X(+w)},${PT - 2}Z" fill="#0B1020"/>${c >= 10 ? `<text x="${X(+w)}" y="${PT - 11}" text-anchor="middle" style="fill:#0B1020;font-weight:700">${c} pages</text>` : ''}</g>`).join('') : '';
        const strip = h(`<div class="strip"><div class="sl"><span><b>${label}</b> <span class="own">${esc(D.practice)}</span></span><span>peak ${fmtN(max)}</span></div>
          <svg viewBox="0 0 ${CW} ${CH + (si === 0 ? 10 : 0)}" style="margin-top:${si === 0 ? 10 : 0}px"><g transform="translate(0,${si === 0 ? 10 : 0})">
          <line x1="${PL}" x2="${CW - PR}" y1="${Y(0)}" y2="${Y(0)}" stroke="#E7E9EE"/><line x1="${PL}" x2="${CW - PR}" y1="${Y(max)}" y2="${Y(max)}" stroke="#E7E9EE" stroke-dasharray="2 3"/>
          <text x="${PL - 6}" y="${Y(max) + 4}" text-anchor="end">${max >= 1000 ? Math.round(max / 1000) + 'k' : max}</text><text x="${PL - 6}" y="${Y(0) + 3}" text-anchor="end">0</text>
          ${ticks.join('')}
          <path d="${area}" fill="#6D28D9" fill-opacity=".08"/><path d="${path}" fill="none" stroke="#6D28D9" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          ${marks}
          <line class="cur" x1="${X(state.week)}" x2="${X(state.week)}" y1="${PT}" y2="${Y(0)}" stroke="#0F766E" stroke-width="2"/>
          <line class="hov" x1="0" x2="0" y1="${PT}" y2="${Y(0)}" stroke="#475569" stroke-dasharray="2 2" style="display:none"/><circle class="hd" r="3.5" fill="#6D28D9" stroke="#fff" stroke-width="1.5" style="display:none"/>
          <rect class="hit" x="${PL}" y="0" width="${CW - PL - PR}" height="${CH}" fill="transparent"/></g></svg></div>`);
        const svg = strip.querySelector('svg'), hit = strip.querySelector('.hit');
        const idx = (e) => { const r = svg.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width * CW - PL) / (CW - PL - PR) * (n - 1)))); };
        hit.addEventListener('pointermove', (e) => {
          const i = idx(e);
          el.querySelectorAll('.hov').forEach(l => { l.style.display = ''; l.setAttribute('x1', X(i)); l.setAttribute('x2', X(i)); });
          el.querySelectorAll('.strip').forEach((s, j) => { const c = s.querySelector('.hd'); const vv = sums[series[j][0]]; const mx = Math.max(1, ...vv); c.style.display = ''; c.setAttribute('cx', X(i)); c.setAttribute('cy', PT + (1 - vv[i] / mx) * (CH - PT - PB)); });
          tip.style.display = ''; const er = el.getBoundingClientRect(); tip.style.left = Math.min(er.width - 200, Math.max(0, e.clientX - er.left + 14)) + 'px'; tip.style.top = (e.clientY - er.top - 10) + 'px';
          tip.innerHTML = `<b>Week of ${fmtWeek(D.weeks[i])}</b>${series.map(([k, l]) => `<div class="r"><span>${l}</span><b>${fmtN(sums[k][i])}</b></div>`).join('')}${appear[i] ? `<div class="r"><span>${appear[i]} page${appear[i] > 1 ? 's' : ''} first seen</span></div>` : ''}`;
        });
        hit.addEventListener('pointerleave', () => { tip.style.display = 'none'; el.querySelectorAll('.hov,.hd').forEach(x => x.style.display = 'none'); });
        hit.addEventListener('click', (e) => onWeek(idx(e)));
        el.appendChild(strip);
      });
      el.appendChild(tip);
      const first0 = pages.filter(p => p.firstWeek === 0).length, never = pages.filter(p => p.firstWeek == null).length;
      el.appendChild(h(`<div class="marks"><span><i></i>a page first seen in Google that week (${Object.values(appear).reduce((a, b) => a + b, 0)} of these pages appeared during the ${n} weeks${first0 ? `; ${first0} were already in Google when tracking began` : ''}${never ? `; ${never} has never been seen` : ''})</span></div>`));
      el.appendChild(h(`<div class="lag">Lag: pages of this site took a median ${D.lagMedianWeeks} weeks from first being seen in Google to their first click (${D.lagN} pages with both). Expect a new page to show up here before it shows up in the landscape's answers.<span class="only-seo"> The teal line is the week the time slider is on.</span></div>`));
      el.querySelector('[data-all]')?.addEventListener('click', () => { state.scope = { type: 'all' }; render(); });
    }
    return { render, setWeek(w) { el.querySelectorAll('.cur').forEach(l => { l.setAttribute('x1', X(w)); l.setAttribute('x2', X(w)); }); } };
  }

  /* ------- the click panel: plain words, one next step ------- */
  function sw(c) { return `<span class="sw" style="background:${c}"></span>`; }
  function questionPanel(q, state, C) {
    const v = verdictAt(q, state.week); const client = state.reader === 'client';
    const step = STEP[q.step]; const le = q.localEvidence;
    const ownOthers = q.ownPages.filter(p => p !== q.page);
    return `<button class="x" aria-label="Close">×</button>
      <div class="pk">${esc(q.topic)} · ${q.intent === 'do' ? 'ready to act' : q.intent === 'visit' ? 'looking nearby' : 'wants to understand'}${q.local ? ' · local' : ''}</div>
      <h3>${esc(q.text)}</h3>
      <div class="vline">${sw(C[v])}${VERDICT_WORD[v]}${v !== 'absent' && dimmed(q) ? ' <span style="color:var(--muted);font-weight:500">(dimmed)</span>' : ''}</div>
      ${v === 'absent' ? `<p class="note">In the week of ${fmtWeek(D.weeks[state.week])} the page that answers this today had not yet been seen in Google. Move the slider forward to see it light up.</p>` : `<p class="note">${esc(q.note)}</p>`}
      <div class="next"><div class="nh">Next step</div><b>${step[0]}</b><span>${step[1]}</span></div>
      <details class="more" ${client ? '' : 'open'}><summary>${client ? 'Where the answer lives' : 'The evidence'}</summary>
      <div class="sec"><div class="sh">${client ? 'Where the answer lives' : 'Best section on the site'}</div>
        <div class="url">${esc(q.sectionPage || q.page)}</div>
        <div class="snip">${q.section.heading ? `<i>${esc(q.section.heading)}</i>` : ''}${esc(q.section.text)}</div>
        ${ownOthers.length && !client ? `<p class="note" style="color:var(--muted);font-size:12.5px">${ownOthers.length} other page${ownOthers.length > 1 ? 's' : ''} of the site compete${ownOthers.length > 1 ? '' : 's'} for this question: ${ownOthers.map(esc).join(', ')}</p>` : ''}
      </div>
      ${q.comp && !client ? `<div class="sec"><div class="sh c">Best competitor answer</div><div><b style="color:var(--ink)">${esc(q.comp.site)}</b> · ${VERDICT_WORD[q.comp.verdict].toLowerCase()}</div><div class="url">${esc(q.comp.url.replace(/^https?:\/\/(www\.)?/, ''))}</div><p class="note">${esc(q.comp.note)}</p></div>` : ''}
      ${q.local && le ? `<div class="sec"><div class="sh">Local evidence on that page</div><div class="ev">
        <span><i class="${cityOk(le, q.page) ? 'ok' : ''}"></i>${cityWord(q.page)}</span><span><i class="${le.phone_on_page ? 'ok' : ''}"></i>Phone number</span>
        <span><i class="${le.street_address_on_page ? 'ok' : ''}"></i>Street address</span><span><i class="${le.is_location_or_contact_page ? 'ok' : ''}"></i>Location or contact page</span></div>
        <p class="note" style="font-size:12.5px;color:var(--muted)">${q.localPass ? 'Passes: a nearby patient finds the city and a way to reach the practice.' : 'Does not pass yet, so this question stays half lit even when the answer is good.'}</p></div>` : ''}
      </details>`;
  }
  // a page of the site: what it answers, what it misses, and the one next step for the page (owner 11/1: say what to do)
  function pagePanel(p, state, C) {
    const qs = p.questions.map(id => QBY[id]);
    const present = pagePresent(p.path, state.week);
    const v = (q) => verdictAt(q, state.week);
    const full = qs.filter(q => v(q) === 'covered'), part = qs.filter(q => v(q) === 'thin'), none = qs.filter(q => v(q) !== 'covered' && v(q) !== 'thin');
    const misses = part.concat(none);
    const here = misses.filter(q => q.step === 'strengthen'), elsewhere = misses.filter(q => q.step === 'write'), signals = misses.filter(q => q.step === 'local' || q.step === 'trust');
    const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
    const row = (q) => `<div class="qrow" data-q="${q.id}">${sw(C[v(q)])}<span>${esc(q.text)}</span></div>`;
    const group = (title, list) => list.length ? `<div class="pg-g">${title} <span>${list.length}</span></div>${list.map(row).join('')}` : '';
    const verdictLine = !qs.length ? 'No question in the bank lands here first.'
      : `Answers ${full.length} of its ${n(qs.length, 'question', 'questions')} in full${part.length ? `, ${part.length} in part` : ''}${none.length ? `, and ${none.length} not at all` : ''}.`;
    const next = here.length ? `<div class="next"><div class="nh">Next step for this page</div><b>Strengthen this page: answer ${n(here.length, 'question', 'questions')} it misses</b><span>The page is about the right service; add a clear answer to each question below, then check it again.</span>
        <button class="btn btn-go sm pg-go" onclick="(window.RA4 && RA4.toast ? RA4.toast : function () {})('Would open On-Page on ${esc(p.path)} with its ${here.length} missed questions as the brief (mockup).')">Open in On-Page with these ${here.length}</button></div>`
      : qs.length && !misses.length ? `<div class="next"><div class="nh">Next step for this page</div><b>Nothing to add</b><span>Every question this page is the best match for gets a full answer.</span></div>` : '';
    return `<button class="x" aria-label="Close">×</button>
      <div class="pk">A page of the site</div><h3>${esc(p.title.split('|')[0].trim())}</h3>
      <div class="url">${esc(p.path)}</div>
      <p class="pg-v">${verdictLine}</p>
      ${next}
      <div class="sec">${here.length ? group('Missing or in part, to add here', here) : ''}${elsewhere.length ? group('Better as a new page', elsewhere) + `<p class="note" style="font-size:12.5px;color:var(--muted)">${elsewhere.length === 1 ? 'This question is' : 'These questions are'} about something else, so ${elsewhere.length === 1 ? 'it goes' : 'they go'} to the content calendar as new content, linked from this page.</p>` : ''}${signals.length ? group('Answered, but the page lacks contact details', signals) : ''}${group('Answered in full', full)}</div>
      <div class="meta"><div><b>${fmtN(p.totImp)}</b><span>times seen in Google</span></div><div><b>${fmtN(p.totClk)}</b><span>clicks</span></div><div><b>${p.words}</b><span>words</span></div></div>
      <p class="note" style="font-size:12.5px;color:var(--muted)">${p.firstWeek == null ? 'Never seen in Google in these weeks.' : p.firstWeek === 0 ? 'Already in Google when tracking began, week of ' + fmtWeek(D.weeks[0]) + '.' : 'First seen in Google the week of ' + fmtWeek(D.weeks[p.firstWeek]) + '.'}${present ? '' : ' Not yet in Google in the week on the slider.'}</p>
      <div class="sec"><div class="sh">Trust signals on the page</div><div class="ev"><span><i class="${p.localEvidence.phone_on_page ? 'ok' : ''}"></i>Phone number</span><span><i class="${p.localEvidence.street_address_on_page ? 'ok' : ''}"></i>Street address</span><span><i class="${p.localEvidence.city_in_title_h1_meta ? 'ok' : ''}"></i>City in the title</span><span><i class="${p.localEvidence.city_in_copy ? 'ok' : ''}"></i>City in the copy</span></div></div>`;
  }
  // a competitor's best answer to one bank question, set against the practice's own answer
  function rivalPanel(q, state, C, override) {
    const c = override || q.comp; const v = verdictAt(q, state.week); const step = STEP[q.step];
    const host = (u) => u.replace(/^https?:\/\/(www\.)?/, '');
    const cmp = c.verdict === 'covered' && v !== 'covered' ? `${esc(c.site)} answers this in full; the practice ${v === 'thin' ? 'answers it in part' : 'does not answer it yet'}.`
      : c.verdict === 'covered' ? `Both answer this in full.`
      : c.verdict === 'thin' && v === 'covered' ? `The practice answers this better: ${esc(c.site)} only answers it in part.`
      : c.verdict === 'thin' ? `Neither answers this in full; ${esc(c.site)} gets closest.`
      : `No nearby competitor answers this; the ground is open.`;
    return `<button class="x" aria-label="Close">×</button>
      <div class="pk" style="color:var(--compInk)">Best competitor answer · ${esc(q.topic)}</div>
      <h3>${esc(q.text)}</h3>
      <div class="cmp2"><div><span class="ck">${esc(c.site)}</span>${sw(c.verdict === 'covered' ? C.comp : c.verdict === 'thin' ? '#C4B5FD' : C.gap)}${VERDICT_WORD[c.verdict]}</div><div><span class="ck">${esc(D.practice)}</span>${sw(C[v])}${VERDICT_WORD[v]}</div></div>
      <p class="note">${cmp}</p>
      <div class="next"><div class="nh">Next step for the practice</div><b>${step[0]}</b><span>${step[1]}</span></div>
      <div class="sec"><div class="sh c">${c.verdict === 'covered' ? 'Their answer' : 'Their closest section'}</div>
        <div><b style="color:var(--ink)">${esc(c.title || host(c.url))}</b></div>
        <div class="url">${esc(host(c.url))}</div>
        ${c.text ? `<div class="snip">${c.heading ? `<i>${esc(c.heading)}</i>` : ''}${esc(c.text)}</div>` : ''}
        <p class="note" style="font-size:12.5px;color:var(--muted)">${esc(c.note)}</p></div>
      <div class="sec"><div class="sh">The practice's best section</div><div class="url">${esc(q.sectionPage || q.page)}</div>
        <div class="snip">${q.section.heading ? `<i>${esc(q.section.heading)}</i>` : ''}${esc(q.section.text)}</div></div>`;
  }
  function compPanel(cp, C) {
    const qs = cp.top.map(t => QBY[t.q]).filter(Boolean);
    return `<button class="x" aria-label="Close">×</button>
      <div class="pk" style="color:var(--compInk)">Competitor page · ${esc(cp.site)}</div><h3>${esc(cp.title)}</h3>
      <div class="url">${esc(cp.url.replace(/^https?:\/\/(www\.)?/, ''))}</div>
      <div class="sec"><div class="sh c">Questions this page is about</div>${qs.map(q => `<div class="qrow" data-q="${q.id}">${sw(C[q.verdict])}<span>${esc(q.text)} <span style="color:var(--muted)">(${VERDICT_WORD[q.verdict].toLowerCase()} on the practice's site)</span></span></div>`).join('')}</div>`;
  }

  /* ------- How it works ------- */
  function methodWindow(extra) {
    const c = D.counts;
    const m = h(`<div class="modal"><div class="bd"></div><div class="win"><button class="x" aria-label="Close">×</button>
      <div class="kick">Relevance Analyzer</div><h2>How this picture is made</h2>
      ${extra ? `<div class="msec"><h3>This view</h3><p>${extra}</p></div>` : ''}
      <div class="msec"><h3>The questions patients ask</h3><p>${c.questions} questions, written the way patients write them: forum posts, the questions AI assistants get asked, Market Trends phrases, the searches patients type, and the follow-up questions a search engine expands a topic into. They are grouped into ${D.topics.length} subjects (${D.topics.filter(t => t.tier === 'priority').length} main services, ${D.topics.filter(t => t.tier === 'other').length} other services, and choosing the practice). The list is drawn up once and frozen, so each run compares the same questions.</p></div>
      <div class="msec"><h3>The pages that answer them</h3><p>We read the whole site (${c.pages} pages, ${c.sections} sections) and, for each question, find the section closest to it in meaning. A reader (an AI model) then reads that page and says whether it answers the question in full, in part, or not at all, in twelve words or fewer. That verdict is what lights the ground. It is our measure of the site, not Google's.</p></div>
      <div class="msec"><h3>Demand</h3><p>How often patients search the subject, measured on Search Console across every practice we work with (26 weeks). Demand is per subject for now; per-question demand comes later. Two more measures can be tried where the view allows: unmet demand (demand on gaps and half answers) and competitor edge (demand where a competitor answers and the practice does not).</p></div>
      <div class="msec"><h3>Light</h3><p>Teal is answered in full, pale teal is answered in part, grey is a gap. A question about choosing or visiting a dentist nearby lights fully only when the answering page shows the city in its title and a phone number or street address: in this round that stands in for the full local check, which will also match the Business Profile. A page with no phone or address on it is drawn a little dimmer: it answers, but gives a patient no way to act.</p></div>
      <div class="msec"><h3>Time</h3><p>There is one crawl, so the past is rebuilt honestly: a page appears the first week Search Console saw it. ${Object.values(D.appear).reduce((a, b) => a + b, 0) - (D.appear['0'] || 0)} pages appeared during the ${D.weeks.length} weeks shown; ${D.appear['0'] || 0} were already in Google when tracking began. Once runs happen weekly or monthly, each run keeps its own verdicts and the slider shows real history instead.</p></div>
      <div class="msec"><h3>What counts as a change</h3><p>The reader gave the same verdict on 37 of 40 questions when asked twice, so a move of 2 or 3 questions between runs is noise. Show counts ("answers 6 of 13"), never a percentage, and never rank services on small differences.</p></div>
    </div></div>`);
    const close = () => m.remove();
    m.querySelector('.bd').addEventListener('click', close); m.querySelector('.x').addEventListener('click', close);
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    document.body.appendChild(m);
  }

  window.RA3D2 = { D, Q, QBY, PBY, TBY, LAST, h, esc, fmtWeek, fmtN, VERDICT_WORD, COLORS, STEP, pagePresent, verdictAt, dimmed, countsAt, cityRule, cityOk, cityWord, tourStops, historyPanel, questionPanel, pagePanel, compPanel, rivalPanel, methodWindow, sw };
})();
