/* PROTOTYPE, throwaway (#1570 round 2). Variant A polished: the practice page IS the profile, editable with no strategy;
   a strategy opens the same page with a confirm bar. Portal answers lead; other sources fill gaps. Services by category. */
(function () {
  const PP = window.PP, esc = PP.esc;
  const CATS = ['General and preventive', 'Restorative', 'Crowns and bridges', 'Implants', 'Cosmetic and whitening', 'Orthodontics', 'Gum care',
    'Oral surgery', 'Sedation and comfort', 'Kids', 'TMJ and sleep', 'Facial aesthetics', 'Other'];
  const STAR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
  const short = (x) => String(x || '').split(/[;(:,]/)[0].trim();
  let menuFor = null, adding = false;

  /* one tag per fact: the leading source (portal first), "+n" more; hover lists every source with its words */
  function tag(list, seo) {
    list = (list || []).filter((x) => x && x.source);
    if (seo) return `<span class="tag seo" data-tip="${esc(`<div class="t">Changed by ${PP.me} · ${PP.today}</div>Kept until the client says something newer, which flags it instead of overwriting.`)}">Team changed</span>`;
    if (!list.length) return '';
    const sorted = [...list].sort((a, b) => (short(b.source) === 'Portal') - (short(a.source) === 'Portal'));
    const lead = short(sorted[0].source), portal = lead === 'Portal', n = new Set(sorted.map((x) => short(x.source))).size - 1;
    const tip = sorted.map((x) => `<div style="margin-bottom:6px"><div class="t">${esc(short(x.source))}${x.date ? ' · ' + esc(x.date) : ''}</div>${x.says === 'no' ? '<b>Says not offered</b> ' : ''}${x.text ? `<span class="q">"${esc(x.text)}"</span>` : ''}</div>`).join('')
      + (portal ? '' : '<div class="faint" style="margin-top:4px">The portal does not say; filled from the other sources.</div>');
    return `<span class="tag ${portal ? 'portal' : ''}" data-tip="${esc(tip)}">${esc(lead)}${n ? ' +' + n : ''}</span>`;
  }

  const sec = (id, title, sub, body, right) => `<section class="sec" id="p-${id}"><div class="sec-h"><h2>${title}</h2><span class="s">${right || sub || ''}</span></div><div class="sec-b">${body}</div></section>`;

  function services() {
    const all = PP.services(), by = {};
    all.forEach((s) => { const c = CATS.includes(s.category) ? s.category : 'Other'; (by[c] = by[c] || []).push(s); });
    return `<div class="cats">${CATS.filter((c) => by[c]).map((c) => {
      const on = by[c].filter((s) => s.status !== 'not_offered'), off = by[c].filter((s) => s.status === 'not_offered');
      return `<div class="cat"><div class="cat-h"><span>${c}</span><span>${on.length}</span></div>
        ${on.map((s) => `<div class="sv"><button class="star ${s.main ? 'on' : ''}" data-star="${esc(s.name)}" ${s.status === 'needs_confirming' ? 'disabled' : ''} data-tip="${esc(s.main ? `<div class="t">Main service</div>${(s.main_sources || []).map(esc).join(', ') || 'Marked by the team'}` : s.status === 'needs_confirming' ? 'Confirm it first; a service that needs confirming cannot be a main service.' : 'Mark as a main service')}">${STAR}</button>
          <span class="n">${esc(s.name)}${s.status === 'needs_confirming' ? ' <span class="flag">confirm</span>' : ''}</span>${tag(s.sources, s.changed)}
          <button class="more" data-more="${esc(s.name)}" aria-label="More">⋯</button>${menuFor === s.name ? `<div class="menu"><button data-svc="${esc(s.name)}|not_offered">Not offered</button>${s.changed ? `<button data-svcreset="${esc(s.name)}">Back to the sources</button>` : ''}</div>` : ''}</div>`).join('')}
        ${off.length ? `<div class="notoff">Not offered: ${off.map((s) => `<button data-svc="${esc(s.name)}|offered" data-tip="${esc('Click if the practice does offer it. ' + (s.sources || []).map((x) => short(x.source) + ': ' + (x.text || '')).join(' / '))}">${esc(s.name)}</button>`).join(', ')}</div>` : ''}</div>`;
    }).join('')}</div>`;
  }

  function asks() {
    const c = PP.toConfirm();
    return c.map((s) => {
      const no = s.sources.find((x) => x.says === 'no'), yes = s.sources.find((x) => x.says !== 'no');
      return `<div class="ask"><div class="q"><b>Does the practice offer ${esc(s.name.toLowerCase())}?</b><div>${esc(short(no && no.source))} says no${no && no.text ? `: "${esc(no.text)}"` : ''}. ${esc(short(yes && yes.source))} says yes${yes && yes.text ? `: "${esc(yes.text)}"` : ''}.</div></div>
        <button class="btn btn-go sm" data-svc="${esc(s.name)}|offered">Offers it</button><button class="btn btn-line sm" data-svc="${esc(s.name)}|not_offered">Doesn't</button></div>`;
    }).join('');
  }

  const dlRow = (key, label, val, srcs) => {
    const cur = PP.field(key, val), ch = key in PP.state().fields;
    return `<div class="kv" data-ebox2="${key}" data-val="${esc(cur || '')}"><div class="l">${esc(label)}</div><div class="v">${cur ? esc(cur) : '<span class="empty">Not on file</span>'}<button class="ed-btn" data-edit2="${key}|${esc(label)}">${cur ? 'Edit' : 'Add'}</button>${ch ? `<button class="ed-btn keep" data-freset="${key}|${esc(label)}">Undo</button>` : ''}</div><div class="r">${cur ? tag(srcs, ch) : ''}</div></div>`;
  };
  const K = PP.p2;

  function facts(P) {
    const st = PP.state(); st.addedFacts = st.addedFacts || []; st.gone = st.gone || {};
    const rows = [...(P.facts || []).map((f, i) => ({ ...f, id: 'f' + i })), ...st.addedFacts].filter((f) => !st.gone[f.id]);
    return (rows.length ? rows.map((f) => `<div class="fact"><span class="t">${esc(f.text)}</span>${tag([{ source: f.source, date: f.date }])}<button class="x" data-gone="${f.id}" aria-label="Remove">×</button></div>`).join('') : '<div class="empty small">No facts yet.</div>')
      + (adding ? `<div class="addf"><input class="ed" data-newfact placeholder="A fact the AI should always honor, e.g. We don't do amalgam fillings"><button class="btn btn-go sm" data-savefact>Add</button></div>`
        : '<div style="margin-top:10px"><button class="lnk" data-addfact>+ Add a fact</button> <span class="faint small">Facts saved from a client comment in review land here too.</span></div>');
  }

  function comps() {
    const c = PP.state().comps;
    return `<div class="comp">${[0, 1, 2].map((i) => c[i] ? `<div><div class="nm">${esc(c[i].name)}</div><div class="w">${c[i].website ? esc(c[i].website.replace(/^https?:\/\//, '')) : '<span class="flag">no website yet</span>'}</div>
      <div style="margin-top:6px;display:flex;justify-content:space-between">${tag([{ source: c[i].source, text: c[i].note }])}<button class="lnk" data-toast="Would list nearby practices offering the main services to swap in.">Swap</button></div></div>`
      : `<div class="empty-slot"><button class="lnk" data-toast="Would suggest local practices from searches for the main services.">+ Pick competitor ${i + 1}</button></div>`).join('')}</div>`;
  }

  PP.variants.A = (root, P) => {
    const st = PP.opt.door === 'station', todo = PP.toConfirm(), mains = PP.mains(), offered = PP.offered(), S = PP.state();
    const ins = P.insurance || {}, insSrc = ins.source ? [{ source: ins.source, date: ins.date }] : [];
    const NAV = [['ask', 'Needs an answer', todo.length], ['gaps', "What's missing", K.gaps(P).length], ['svc', 'Services', offered.length], ['comp', 'Competitors', S.comps.length], ['goals', 'Goals', (P.goals || []).length],
      ['ideal', 'Ideal patient', (P.ideal_patient || []).length], ['pay', 'Insurance and payments'], ['visit', 'Visits and technology'], ['facts', 'Practice facts', (P.facts || []).length],
      ['team', 'Doctors and offices'], ['hist', 'Changes', S.log.length]].filter((x) => (x[0] !== 'ask' || todo.length) && (x[0] !== 'gaps' || x[2]));
    const G = K.goals(P, tag);
    const bar = st ? `<div class="confirm-bar"><div style="flex:1"><div class="step">SEO Strategy 2027 · Step 1 of 9</div><div class="small">Confirm what the strategy reads. This is the practice's one profile; changes here apply to every tool, with or without a strategy.</div></div>
      ${PP.statusLabel()}<button class="btn btn-go" data-confirm>${S.confirmed ? 'Go to Gather' : 'Confirm profile'}</button></div>` : '';
    root.innerHTML = bar + PP.header(null, `<span class="small muted" style="margin-right:6px">${K.pkg(P)}</span>`, st) + `<nav class="ptabs"><a class="on">Profile</a><a data-toast="Voice: writing samples and the style card, moved here from the strategy's Client Profile tab.">Voice</a><a data-toast="Settings: Asana, Search Console, GA4, Webflow, Drive, email templates, contacts.">Settings</a><a data-toast="The practice's strategies, each reading this profile.">Strategies</a></nav>
      <div class="stats"><div><div class="v">${offered.length}</div><div class="k">services offered</div></div><div><div class="v">${mains.length}</div><div class="k">main services</div></div>
        <div><div class="v">${S.comps.length} of 3</div><div class="k">competitors</div></div><div><div class="v ${todo.length ? 'w' : ''}">${todo.length}</div><div class="k">${todo.length === 1 ? 'needs an answer' : 'need an answer'}</div></div></div>
      <div class="lay"><nav class="snav">${NAV.map(([id, w, c]) => `<a href="#p-${id}"><span>${w}</span>${c != null ? `<span class="c">${c}</span>` : ''}</a>`).join('')}
        <div class="legend" style="margin-top:14px;padding:0 10px;flex-direction:column;align-items:flex-start;gap:6px"><span><span class="tag portal">Portal</span> the client said it</span><span><span class="tag">CRM +2</span> filled from other sources</span><span><span class="tag seo">Team changed</span> edited here</span></div></nav>
      <div>
        ${todo.length ? sec('ask', 'Needs an answer', '', asks(), 'Sources disagree. Tools treat these as offered until someone answers.') : ''}
        ${K.gapsCard(P)}
        ${sec('svc', 'Services', '', services(), '<span style="color:var(--a)">★</span> main service · hover a tag for its sources')}
        ${sec('comp', 'Competitors', 'Up to three local practices. Every tool reads these and only suggests swaps.', comps())}
        ${sec('goals', 'Goals', '', G.html || G, G.right)}
        ${sec('ideal', 'Ideal patient', '', (P.ideal_patient || []).length ? (P.ideal_patient || []).map((x) => K.kv(x.trait, `<span class="small">${esc(x.evidence || '')}</span>`, tag([{ source: x.source, text: x.evidence }]))).join('') + (P.ideal_patient_conflicts || []).map((c) => `<div class="small" style="margin-top:10px"><span class="flag">Sources disagree</span> <b>${esc(c.topic || '')}</b>: "${esc(c.a && c.a.text)}" or "${esc(c.b && c.b.text)}"</div>`).join('') : '<div class="empty small">Not enough evidence yet. Built from the client\'s own words first.</div>')}
        ${sec('pay', 'Insurance and payments', '', `${dlRow('ins_net', 'Network', ins.network, insSrc)}${(ins.insurers || []).length ? K.kv('Insurers accepted', `<div class="techs">${ins.insurers.map((x) => `<span class="tech">${esc(x)}</span>`).join('')}</div>`, tag(insSrc)) : ''}${dlRow('ins_plan', 'Membership plan', ins.membership_plan, insSrc)}${dlRow('ins_fin', 'Financing', ins.financing, insSrc)}${dlRow('ins_pay', 'Payment options', Array.isArray(ins.payment_options) ? ins.payment_options.join(', ') : ins.payment_options, insSrc)}`)}
        ${sec('visit', 'Visits and technology', '', K.visits(P, tag))}
        ${sec('facts', 'Practice facts', 'Facts the AI should always honor, in every strategy, calendar and piece.', facts(P))}
        ${sec('team', 'Doctors and offices', 'Office details come from the Business Profile; fix them there.', `<div class="sub-h">Doctors</div>${(P.doctors || []).map((d) => K.kv(d.name + (d.title ? ', ' + d.title : ''), `<span class="small muted">${esc((d.specialties || []).join(', ') || 'No specialties on file')}</span>`, tag([{ source: d.source }]))).join('') || '<div class="empty small">None on file.</div>'}<div class="sub-h" style="margin-top:16px">Offices</div>${(P.offices || []).map((o) => K.kv(o.name || 'Office', `<span class="small muted">${esc([o.address, o.phone, o.hours_summary].filter(Boolean).join(' · '))}</span>`, tag([{ source: o.source }]))).join('') || '<div class="empty small">None on file.</div>'}`)}
        ${PP.usesStrip()}<div id="p-hist">${PP.history()}</div></div></div>`;
    PP.sec.wire(root);
    root.querySelectorAll('[data-star]').forEach((b) => b.onclick = () => { const s = PP.services().find((x) => x.name === b.dataset.star); PP.setSvc(s.name, { main: !s.main }, s.main ? 'main mark removed' : 'marked main'); });
    root.querySelectorAll('[data-more]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); menuFor = menuFor === b.dataset.more ? null : b.dataset.more; PP.render(); });
    root.querySelectorAll('[data-gone]').forEach((b) => b.onclick = () => { S.gone[b.dataset.gone] = 1; S.log.unshift({ who: PP.me, when: PP.today, what: 'Removed a practice fact' }); PP.render(); });
    root.querySelector('[data-addfact]')?.addEventListener('click', () => { adding = true; PP.render(); document.querySelector('[data-newfact]')?.focus(); });
    root.querySelector('[data-savefact]')?.addEventListener('click', () => { const v = document.querySelector('[data-newfact]').value.trim(); adding = false; if (v) { S.addedFacts.push({ id: 'n' + Date.now(), text: v, source: 'Team note', date: PP.today }); S.log.unshift({ who: PP.me, when: PP.today, what: 'Added a practice fact' }); } PP.render(); });
    root.querySelectorAll('[data-edit2]').forEach((b) => b.onclick = () => {
      const [k, l] = b.dataset.edit2.split('|'), row = b.closest('[data-ebox2]'), cur = row.dataset.val, box = row.querySelector('.v');
      box.innerHTML = `<input class="ed" value="${esc(cur)}"><div style="margin-top:6px"><button class="btn btn-go sm" data-s>Save</button> <button class="lnk" data-c>Cancel</button></div>`;
      box.querySelector('input').focus(); box.querySelector('[data-s]').onclick = () => PP.setField(k, box.querySelector('input').value, l); box.querySelector('[data-c]').onclick = () => PP.render();
    });
    root.querySelector('[data-confirm]')?.addEventListener('click', () => S.confirmed ? PP.toast('Would open Gather.') : PP.confirm());
    document.onclick = (e) => { if (menuFor && !e.target.closest('.menu,[data-more]')) { menuFor = null; PP.render(); } };
  };
  PP.names = { A: 'Round 2 · one page, two doors' };
  PP.title = 'Prototype round 2 · practice profile (#1570)';
})();
