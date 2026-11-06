/* PROTOTYPE, throwaway (#1570): shared state and pieces for the practice profile variants.
   URL: ?variant=A|B|C &client=258|364 &door=page|station. Edits live in memory only and reset on reload. */
(function () {
  const PP = window.PP = {};
  const q = new URLSearchParams(location.search);
  PP.opt = { variant: (q.get('variant') || 'A').toUpperCase(), client: q.get('client') || '258', door: q.get('door') || 'page' };
  PP.variants = {};
  PP.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  PP.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  PP.n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  PP.today = 'Nov 6';
  PP.me = 'DU';

  /* ---- profile + in-memory SEO decisions ---- */
  let S;
  function reset() {
    const P = window.PP_DATA[PP.opt.client];
    S = { P, log: [], svc: {}, confirmed: null, flagsSeen: {}, fields: {}, comps: (P.competitors || []).map((c) => ({ ...c })) };
  }
  PP.state = () => S;
  PP.P = () => S.P;
  PP.services = () => (S.P.services || []).map((s) => {
    const o = S.svc[s.name] || {};
    const status = o.status || s.status;
    return { ...s, status, main: status === 'needs_confirming' ? false : (o.main ?? s.main), changed: !!(o.status || o.main !== undefined) };
  });
  PP.setSvc = (name, patch, what) => {
    S.svc[name] = { ...(S.svc[name] || {}), ...patch };
    S.log.unshift({ who: PP.me, when: PP.today, what: `${name}: ${what}` });
    PP.render();
  };
  PP.resetSvc = (name) => { delete S.svc[name]; S.log.unshift({ who: PP.me, when: PP.today, what: `${name}: back to what the sources say` }); PP.render(); };
  PP.field = (key, fallback) => (key in S.fields ? S.fields[key] : fallback);
  PP.setField = (key, val, label) => { S.fields[key] = val; S.log.unshift({ who: PP.me, when: PP.today, what: `${label} changed` }); PP.render(); };
  PP.resetField = (key, label) => { delete S.fields[key]; S.log.unshift({ who: PP.me, when: PP.today, what: `${label}: back to what the sources say` }); PP.render(); };
  PP.confirm = () => { S.confirmed = { who: PP.me, when: PP.today }; S.log.unshift({ who: PP.me, when: PP.today, what: 'Confirmed the profile' }); PP.render(); PP.toast('Profile confirmed. Gather would read this copy.'); };
  PP.toConfirm = () => PP.services().filter((s) => s.status === 'needs_confirming');
  PP.mains = () => PP.services().filter((s) => s.main);
  PP.offered = () => PP.services().filter((s) => s.status !== 'not_offered');

  /* ---- source chips with a branded hover ---- */
  const SAYS = { yes: 'says offered', no: 'says not offered', priority: 'names it a priority' };
  PP.src = (s) => {
    const tip = `<div class="t">${PP.esc(s.source)}${s.date ? ' · ' + PP.esc(s.date) : ''}</div><b>${PP.esc(SAYS[s.says] || s.says || '')}</b>${s.text ? `<div class="q">"${PP.esc(s.text)}"</div>` : ''}`;
    const short = String(s.source || '').split(/[;(:]/)[0].trim();
    return `<span class="src ${s.says === 'no' ? 'no' : ''}" data-tip="${PP.esc(tip)}">${PP.esc(short)}</span>`;
  };
  PP.srcs = (list) => {
    const g = {}; (list || []).forEach((s) => { const k = String(s.source || '').split(/[;(:]/)[0].trim() + '|' + (s.says === 'no' ? 'no' : '');
      if (g[k]) g[k].text = [g[k].text, s.text].filter(Boolean).join('" and "'); else g[k] = { ...s }; });
    return Object.values(g).map(PP.src).join('');
  };
  PP.one = (source, text, date) => PP.src({ source, text, date, says: '' });
  PP.seoChip = () => `<span class="src seo" data-tip="${PP.esc(`<div class="t">SEO changed</div><b>${PP.me} · ${PP.today}</b><div class="q">Kept until something newer arrives from the client, which raises a flag instead of overwriting.</div>`)}">SEO changed</span>`;

  PP.statusLabel = () => S.confirmed
    ? `<span class="st conf"><span class="dot a"></span>Confirmed by ${S.confirmed.who} · ${S.confirmed.when}</span>`
    : `<span class="st unconf" data-tip="${PP.esc('<div class="t">Not confirmed</div>Tools read the profile as the sources fill it in. Nobody has checked it yet; a strategy cannot start Gather until the SEO confirms it.')}"><span class="dot o"></span>Not confirmed</span>`;

  /* How another tool shows the source of a fact it used (same chips, same hover). */
  PP.usesStrip = () => {
    const m = PP.mains()[0]; const c = S.comps[0];
    return `<div class="card"><h2>How other tools show it</h2><div class="lead small muted">Any tool that uses a profile fact carries the same source chip and a link back here.</div><div class="uses">
      <div class="use"><div class="k">Calendar item · why this topic</div>${m ? `<b>${PP.esc(m.name)}</b> is a main service ${PP.srcs(m.main_sources?.map((x) => ({ source: x, says: 'priority' })))} <a href="#">practice profile</a>` : '<span class="empty">No main services yet, so the calendar falls back and says so.</span>'}</div>
      <div class="use"><div class="k">Relevance Analyzer · competitors</div>${c ? `Compared with <b>${PP.esc(c.name)}</b> ${PP.one(c.source || 'Onboarding', c.note || '')} <a href="#">practice profile</a>` : '<span class="empty">No competitors on the profile; the tool would suggest three from local searches.</span>'}</div></div></div>`;
  };
  PP.missingCard = () => {
    const m = S.P.missing || []; if (!m.length) return '';
    return `<div class="card"><h2>Missing sources</h2><div class="lead small">${PP.n(m.length, 'source is', 'sources are')} missing, so parts of this profile are thin.</div>${m.map((x) => `<div class="row small"><span class="dot o"></span>${PP.esc(x)}</div>`).join('')}</div>`;
  };
  PP.history = () => `<div class="card"><h2>Changes</h2>${S.log.length ? S.log.map((l) => `<div class="row small"><b>${l.who}</b><span class="muted">${l.when}</span>${PP.esc(l.what)}</div>`).join('') : '<div class="empty small">No changes by the team yet. Everything here comes from the sources.</div>'}</div>`;

  PP.toast = (msg) => { document.querySelectorAll('.toast').forEach((t) => t.remove()); const t = PP.h(`<div class="toast">${PP.esc(msg)}</div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 3000); };

  /* ---- shell ---- */
  const I = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const RAIL = `<aside class="oq-rail"><a class="oq-rail-item">${I('<path d="m9 18 6-6-6-6"/>')}</a><div class="oq-rail-sep"></div>
    <a class="oq-rail-item" title="Home">${I('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>')}</a>
    <a class="oq-rail-item is-active" title="Clients">${I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>')}</a>
    <a class="oq-rail-item" title="Content Strategy">${I('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>')}</a>
    <a class="oq-rail-item" title="Production">${I('<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>')}</a>
    <a class="oq-rail-item" title="Audit Hub">${I('<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>')}</a><div class="oq-rail-sep"></div>
    <a class="oq-rail-item" title="AI Visibility">${I('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>')}</a>
    <a class="oq-rail-item" title="Market Trends">${I('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>')}</a>
    <a class="oq-rail-item" title="Grid Scan">${I('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>')}</a>
    <div class="oq-rail-foot"><span class="oq-rail-av">DU</span></div></aside>`;
  const NAMES0 = { A: 'One page, two doors', B: 'Guided confirm, quiet page', C: 'Fact ledger' };

  function go(patch) { Object.assign(PP.opt, patch); const u = new URLSearchParams(PP.opt); history.replaceState(null, '', '?' + u); if ('client' in patch) reset(); PP.render(); }
  PP.go = go;
  const tg = (key, opts) => `<span class="tg">${opts.map(([v, w]) => `<button data-go="${key}:${v}" class="${PP.opt[key] === v ? 'on' : ''}">${w}</button>`).join('')}</span>`;

  PP.render = () => {
    const NAMES = PP.names || NAMES0, P = S.P, v = PP.opt.variant in NAMES ? PP.opt.variant : Object.keys(NAMES)[0], keys = Object.keys(NAMES);
    document.body.innerHTML = `${RAIL}<div class="mockbar"><b>${PP.title || 'Prototype · practice profile (#1570)'}</b>
        Practice ${tg('client', PP.clientList || [['258', 'Kari Mann'], ['364', 'Ingram Hills (missing sources)']])}
        Opened from ${tg('door', [['page', 'Practice page'], ['station', 'Strategy confirm step']])}
        <span>Real local data · edits are not saved</span></div>
      <div class="app"><div class="wrap" data-main></div></div>
      <div class="switch" style="${keys.length < 2 ? 'display:none' : ''}"><button data-step="-1" aria-label="Previous variant">‹</button><span>${v} · ${NAMES[v]}</span><button data-step="1" aria-label="Next variant">›</button></div>`;
    PP.variants[v](document.querySelector('[data-main]'), P);
    document.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => { const [k, val] = b.dataset.go.split(':'); go({ [k]: val }); });
    document.querySelectorAll('[data-step]').forEach((b) => b.onclick = () => go({ variant: keys[(keys.indexOf(v) + +b.dataset.step + keys.length) % keys.length] }));
  };
  PP.header = (title, extra, noStatus) => {
    const P = S.P, p = P.practice || {};
    const crumb = PP.opt.door === 'station' ? `<a href="#">Clients</a> / <a href="#">${PP.esc(p.name)}</a> / <a href="#">SEO Strategy 2027</a> / Practice profile` : `<a href="#">Clients</a> / <a href="#">${PP.esc(p.name)}</a> / Practice profile`;
    const gbp = p.gbp_listing && p.gbp_listing.linked ? PP.esc(p.gbp_listing.name || 'Business Profile linked') : '<span class="flag">Business Profile not linked</span>';
    return `<div class="crumb">${crumb}</div><div class="ph"><div><h1>${PP.esc(title || p.name)}</h1>
      <div class="sub">${p.website ? `<a href="#">${PP.esc(p.website.replace(/^https?:\/\//, ''))}</a>` : '<span class="flag">No website on file</span>'} · ${gbp}${(P.offices || []).length > 1 ? ` · ${P.offices.length} offices` : ''}</div></div>
      <div style="display:flex;gap:8px;align-items:center">${noStatus ? '' : PP.statusLabel()}${extra || ''}</div></div>`;
  };

  /* branded hover for every [data-tip] */
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-tip]'); document.querySelectorAll('.tip').forEach((t) => t.remove()); if (!el) return;
    const t = PP.h(`<div class="tip">${el.dataset.tip}</div>`); document.body.appendChild(t);
    const r = el.getBoundingClientRect(); t.style.top = (r.bottom + scrollY + 6) + 'px'; t.style.left = Math.min(innerWidth - 360, r.left + scrollX) + 'px';
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea,[contenteditable]')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') document.querySelector(`[data-step="${e.key === 'ArrowRight' ? 1 : -1}"]`)?.click();
  });
  PP.start = () => { reset(); PP.render(); };
})();
