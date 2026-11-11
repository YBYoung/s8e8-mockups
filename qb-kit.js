/* Question bank mockups (#1842): shared pieces. The practice-page frame, branded hover tips, toasts, the fixed sort,
   the demand cells and their plain labels, flags. Pages call QB.mountPage({...}) and get the Questions section's root. */
(function () {
  const QB = window.QB = {};
  const D = window.QB_DATA; QB.D = D;
  QB.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  QB.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  QB.n = (k, one, many) => `${k.toLocaleString('en-US')} ${k === 1 ? one : many}`;
  QB.fmt = (n) => n == null ? '' : Number(n).toLocaleString('en-US');
  QB.me = 'DU'; QB.today = 'Nov 11';
  const esc = QB.esc;

  /* ---- vocabulary: the eight situations, three tiers, statuses ---- */
  QB.SITUATIONS = ['service', 'cost', 'insurance', 'comparison', 'choosing', 'aftercare', 'symptom', 'emergency'];
  QB.SIT_WORD = { service: 'About the treatment', cost: 'Cost', insurance: 'Insurance', comparison: 'Comparing options', choosing: 'Choosing who to see', aftercare: 'Aftercare', symptom: 'A symptom', emergency: 'An emergency' };
  QB.SIT_TIP = {
    service: 'What the treatment is, how it works, whether it hurts, how long it lasts, whether it suits the patient. The service question carries the checklist of basics.',
    cost: 'Price, payment and financing.', insurance: 'Whether insurance covers it, in or out of network, how billing works.',
    comparison: 'One option against another.', choosing: 'Who or where to see: a dentist, a specialist, the practice itself. Always local.',
    aftercare: 'After a treatment the patient has had: what to do, eat or expect while healing.', symptom: 'A problem the patient has noticed and what it means.',
    emergency: 'An urgent problem that needs care now or today.',
  };
  QB.SIT_CLASS = { service: 0, cost: 0, insurance: 0, comparison: 0, choosing: 0, aftercare: 1, symptom: 1, emergency: 1 };
  QB.TIER_WORD = { main: 'Main services', other: 'Other services', practice: 'Practice-level' };
  QB.TIER_ORDER = { main: 0, other: 1, practice: 2 };

  /* ---- the fixed sort (ADR-0047): one order for every consumer and this page ---- */
  QB.sortQuestions = (list, subjById) => list.slice().sort((a, b) => {
    const ta = QB.TIER_ORDER[subjById[a.subject].tier], tb = QB.TIER_ORDER[subjById[b.subject].tier];
    if (ta !== tb) return ta - tb;
    if (a.kept !== b.kept) return a.kept ? -1 : 1;
    const ca = QB.SIT_CLASS[a.situation], cb = QB.SIT_CLASS[b.situation]; if (ca !== cb) return ca - cb;
    const own = (b.demand.ownImp || 0) - (a.demand.ownImp || 0); if (own) return own;
    const ag = (b.demand.agImp || 0) - (a.demand.agImp || 0); if (ag) return ag;
    return (b.demand.cs || 0) - (a.demand.cs || 0);
  });
  QB.sortSubjects = (subjects) => subjects.slice().sort((a, b) => (QB.TIER_ORDER[a.tier] - QB.TIER_ORDER[b.tier]) || (b.own - a.own) || (b.ag - a.ag));
  QB.subjById = () => Object.fromEntries(D.subjects.map((s) => [s.name, s]));

  /* ---- branded hover tips: any element with data-tip ---- */
  let tipEl;
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-tip]'); if (!t) return;
    tipEl?.remove(); tipEl = QB.h(`<div class="tip">${t.dataset.tip}</div>`); document.body.appendChild(tipEl);
    const r = t.getBoundingClientRect(); const w = tipEl.offsetWidth;
    tipEl.style.left = Math.max(64, Math.min(window.innerWidth - w - 12, r.left)) + 'px';
    tipEl.style.top = (r.bottom + window.scrollY + 7) + 'px';
  });
  document.addEventListener('mouseout', (e) => { if (e.target.closest && e.target.closest('[data-tip]')) { tipEl?.remove(); tipEl = null; } });
  QB.tip = (title, body, quote) => esc(`<div class="t">${esc(title)}</div>${body}${quote ? `<div class="q">${quote}</div>` : ''}`);

  QB.toast = (msg) => { document.querySelectorAll('.toast').forEach((t) => t.remove()); const t = QB.h(`<div class="toast">${esc(msg)}</div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 3400); };

  /* small popover menu anchored to a button; items = [{label, on, cls, k}] ('k' = group label, 'sep' = line) */
  QB.menu = (anchor, items) => {
    document.querySelectorAll('.pop').forEach((p) => p.remove());
    const pop = QB.h(`<div class="pop">${items.map((it) => it === 'sep' ? '<div class="sep"></div>' : it.k ? `<div class="k">${esc(it.k)}</div>` : `<button class="${it.cls || ''}">${it.icon || ''}${esc(it.label)}</button>`).join('')}</div>`);
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect(); pop.style.top = (r.bottom + window.scrollY + 4) + 'px';
    pop.style.left = Math.max(64, Math.min(window.innerWidth - pop.offsetWidth - 12, r.right - pop.offsetWidth)) + 'px';
    const btns = pop.querySelectorAll('button'); const acts = items.filter((it) => it !== 'sep' && !it.k);
    btns.forEach((b, i) => b.onclick = () => { pop.remove(); acts[i].on && acts[i].on(); });
    setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('pointerdown', off); } }), 0);
    return pop;
  };

  /* ---- demand: three numbers side by side, plain labels, the explanation on hover ---- */
  QB.DEMAND_COLS = [
    { k: 'cs', label: 'US searches a month', tip: `How many times a month people in the US type this question's main phrase into Google, from a clickstream panel (DataForSEO). Average of the last 12 months. Below 50 a month the panel cannot see it. Measured ${esc(D.csStamp)}.` },
    { k: 'ag', label: 'Our clients, times seen', tip: `How many times our clients' sites were seen in Google for searches that match this question, and how many clients. Every client in Search Console, ${esc(D.gscWindow)}. Test accounts left out.` },
    { k: 'own', label: 'This practice, times seen', tip: `How many times ${esc(D.practice)} was seen in Google for searches that match this question, ${esc(D.gscWindow)}. Searches with the practice's own name left out.` },
  ];
  QB.demandCell = (q, k) => {
    const d = q.demand;
    if (k === 'cs') {
      if (d.cs == null) return `<div class="d none" data-tip="${QB.tip('US searches a month', 'No clickstream phrase was looked up for this question yet.')}">no data</div>`;
      const t = QB.tip('US searches a month', `<b>${esc(d.csPhrase || q.mainPhrase)}</b><br>${d.cs ? `${QB.fmt(d.cs)} searches a month, average of the last 12 months.` : 'Under 50 a month in every one of the last 12 months: below the smallest step the panel can see, not proven zero.'}<br>Measured ${esc(D.csStamp)}.`, d.csNote && d.cs ? esc(d.csNote) : '');
      return `<div class="d ${d.cs ? '' : 'none'}" data-tip="${t}">${d.cs ? QB.fmt(d.cs) : 'under 50'}</div>`;
    }
    if (k === 'ag') {
      if (d.agImp == null) return `<div class="d none">no data</div>`;
      const t = QB.tip("Our clients, times seen", `<b>${QB.fmt(d.agImp)} times</b> across ${QB.n(d.agClients || 0, 'client', 'clients')}, ${esc(D.gscWindow)}.` + (d.agSample?.length ? `<br>Searches that matched:<ul>${d.agSample.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''));
      return `<div class="d" data-tip="${t}">${QB.fmt(d.agImp)}<small>${QB.n(d.agClients || 0, 'client', 'clients')}</small></div>`;
    }
    if (d.ownImp == null) return `<div class="d none">no data</div>`;
    const t = QB.tip('This practice, times seen', `<b>${QB.fmt(d.ownImp)} times</b> in Google for ${QB.n(d.ownSearches || 0, 'different search', 'different searches')} that match this question, ${esc(D.gscWindow)}. Branded searches left out.`);
    return `<div class="d ${d.ownImp ? '' : 'none'}" data-tip="${t}">${d.ownImp ? QB.fmt(d.ownImp) : 'not seen'}</div>`;
  };

  /* ---- flags on the bank ---- */
  QB.FLAGS = {
    before_profile: { label: 'Built before the profile was confirmed', tip: QB.tip('Built before the profile was confirmed', 'Nobody has confirmed the practice profile yet, so the main services here are the build\'s guess from the onboarding goals and the doctors\' specialties. Confirm the profile and the tiers update on their own; the bank does not rebuild.') },
    no_intake: { label: 'Built without an intake', tip: QB.tip('Built without an intake', 'The practice has no intake form, so subjects came from the website\'s service pages, the onboarding checklist and the CRM. Patient wording came from real searches, forum posts and AI Visibility.') },
    no_gsc: { label: 'Built without Search Console', tip: QB.tip('Built without Search Console', 'Search Console was not linked when the bank was built, so needs came from the profile and our other clients\' searches only. Link Search Console and the monthly refresh fills the practice column.') },
    unreviewed: { label: 'Built without review', tip: QB.tip('Built without review', 'Light mode: the bank froze itself when the build finished, so measuring could start without SEO time. The build\'s review list is kept as pending suggestions. Take them any time; each one is a marker on the history.') },
  };
  QB.flagsHTML = (keys) => keys.map((k) => `<span class="flag" data-tip="${QB.FLAGS[k].tip}"><span class="dot w"></span>${QB.FLAGS[k].label}</span>`).join('');

  /* ---- the frame: rail, mockup bar, practice page head, the Questions section root ---- */
  const I = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const RAIL = `<aside class="oq-rail"><a class="oq-rail-item" title="Expand sidebar">${I('<path d="m9 18 6-6-6-6"/>')}</a><div class="oq-rail-sep"></div>
    <a class="oq-rail-item" title="Home">${I('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>')}</a>
    <a class="oq-rail-item is-active" title="Clients">${I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')}</a>
    <a class="oq-rail-item" title="Content Strategy">${I('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>')}</a>
    <a class="oq-rail-item" title="Production">${I('<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>')}</a>
    <a class="oq-rail-item" title="Audit Hub">${I('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>')}</a><div class="oq-rail-sep"></div>
    <a class="oq-rail-item" title="AI Visibility">${I('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>')}</a>
    <a class="oq-rail-item" title="Market Trends">${I('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>')}</a>
    <a class="oq-rail-item" title="Grid Scan">${I('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>')}</a>
    <a class="oq-rail-item" title="Relevance Analyzer">${I('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>')}</a>
    <a class="oq-rail-item" title="Site Audit">${I('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}</a><div class="oq-rail-sep"></div>
    <a class="oq-rail-item" title="Reports">${I('<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>')}</a>
    <div class="oq-rail-foot"><span class="oq-rail-av">DU<i></i></span></div></aside>`;
  QB.RAIL = RAIL;
  const PTABS = ['Overview', 'Profile', 'Questions', 'Strategy', 'Settings'];

  /* opts: view (mockbar title), pitch, states [{k,label}], state (current key), onState(k) */
  QB.mountPage = function (opts) {
    const states = opts.states ? `<span class="tg">${opts.states.map((s) => `<button class="${s.k === opts.state ? 'on' : ''}" data-st="${s.k}">${esc(s.label)}</button>`).join('')}</span>` : '';
    document.body.innerHTML = `${RAIL}
      <div class="mockbar"><b>Mockup · Question bank ${esc(opts.view)}</b>${states}<span class="src">${esc(opts.pitch || '')} Data: ${esc(D.practice)}, real bank of ${D.questions.length} questions in ${D.subjects.length} subjects (v4, 11/1), real demand from clickstream (${esc(D.csStamp)}) and Search Console (${esc(D.gscWindow)}). Nothing is saved from this mockup.</span><a href="qb-index.html">All views</a></div>
      <div class="app"><div class="wrap">
        <div class="crumb"><a href="#">Clients</a> / <a href="#">${esc(D.practice)}</a> / Practice</div>
        <div class="ph"><div><h1>${esc(D.practice)}</h1><div class="sub">${esc(D.site)} · ${esc(D.city)} · SEO client · one office</div></div>
          <div style="display:flex;gap:8px"><button class="btn btn-line" onclick="QB.toast('Would open the client overview.')">Client overview</button><button class="btn btn-line" onclick="QB.toast('Would open the strategy board.')">Strategy</button></div></div>
        <nav class="ptabs">${PTABS.map((t) => `<a href="#" class="${t === 'Questions' ? 'on' : ''}" onclick="return false">${t}</a>`).join('')}</nav>
        <section class="card" data-qb></section>
      </div></div>`;
    document.querySelectorAll('[data-st]').forEach((b) => b.onclick = () => opts.onState && opts.onState(b.dataset.st));
    return document.querySelector('[data-qb]');
  };

  /* the section head: label, lead, saved state, flags, sources line */
  QB.sectionHead = ({ lead, flags, status, right, sources }) => `
    <div class="qb-head"><div style="min-width:0"><h2>Questions</h2><div class="lead">${lead}</div>${flags?.length ? `<div class="flags">${QB.flagsHTML(flags)}</div>` : ''}${sources ? `<div class="sources">${sources}</div>` : ''}</div>
      <div class="right">${status || ''}${right || ''}</div></div>`;
  QB.saved = (txt) => `<span class="save" data-tip="${QB.tip('Saved as you go', 'Every accept, dismiss, edit, merge and flip is saved the moment it is made. If someone else opens this section the page says who, and leaving mid-edit asks first.')}"><span class="dot g"></span>${esc(txt || 'Saved')}</span>`;
  QB.sourcesLine = () => `Built from the <b>practice profile</b> (${D.subjects.filter((s) => s.tier !== 'practice').length} offered services, ${D.subjects.filter((s) => s.tier === 'main').length} main), the practice's <b>${QB.fmt(D.labelling.searches)} real searches</b> in Search Console (${QB.fmt(D.labelling.impressions)} times seen, ${esc(D.gscWindow)}, branded searches removed), our clients' searches per subject, and a crawl of ${D.crawl.pages} pages (${esc(D.crawl.date)}). Wording from real searches, forum posts and AI Visibility questions.`;
})();
