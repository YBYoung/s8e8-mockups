/* PROTOTYPE, throwaway (#1570): section blocks for the practice profile, shared by the variants that read in sections. */
(function () {
  const PP = window.PP, esc = PP.esc;
  const X = PP.sec = {};
  const STATUS = { offered: 'Offered', not_offered: 'Not offered', needs_confirming: 'Needs confirming' };

  X.svcRow = (s, ed) => `<div class="row"><span class="nm">${s.main ? '<span class="dot a" title="Main service"></span> ' : ''}${esc(s.name)}</span>
    <span class="srcs">${PP.srcs(s.sources)}${s.changed ? PP.seoChip() : ''}</span>
    ${ed ? `<span class="act">${s.status === 'needs_confirming'
      ? `<button class="btn btn-go sm" data-svc="${esc(s.name)}|offered">Offers it</button><button class="btn btn-line sm" data-svc="${esc(s.name)}|not_offered">Doesn't</button>`
      : `${s.status === 'offered' ? `<button class="lnk" data-main="${esc(s.name)}">${s.main ? 'Remove main mark' : 'Mark main'}</button> · ` : ''}<button class="lnk" data-svc="${esc(s.name)}|${s.status === 'offered' ? 'not_offered' : 'offered'}">${s.status === 'offered' ? 'Not offered' : 'Offered'}</button>`}
      ${s.changed ? ` · <button class="lnk" data-svcreset="${esc(s.name)}">Reset</button>` : ''}</span>` : ''}</div>`;

  X.confirmList = (ed) => {
    const c = PP.toConfirm();
    if (!c.length) return '<div class="small muted">Nothing to confirm. Every source agrees on what the practice offers.</div>';
    return `<div class="lead small">The onboarding checklist says no, but another source says yes. Tools treat these as offered until the SEO answers.</div>${c.map((s) => X.svcRow(s, ed)).join('')}`;
  };
  X.mainList = (ed) => {
    const m = PP.mains();
    return m.length ? m.map((s) => `<div class="row"><span class="nm">${esc(s.name)}</span><span class="srcs">${PP.srcs((s.main_sources || []).map((x) => ({ source: x, says: 'priority', text: (s.sources.find((y) => y.source === x && y.says === 'priority') || {}).text })))}${s.changed ? PP.seoChip() : ''}</span>${ed ? `<span class="act"><button class="lnk" data-main="${esc(s.name)}">Remove</button></span>` : ''}</div>`).join('')
      : '<div class="empty small">No main services. No source names a priority; the SEO picks them here.</div>';
  };
  X.svcGroups = (ed, opts) => {
    const all = PP.services(); opts = opts || {};
    const g = (st) => all.filter((s) => s.status === st);
    const part = (st, list) => list.length ? `<div style="margin-top:10px"><div class="small muted" style="font-weight:600">${STATUS[st]} · ${list.length}</div>${list.map((s) => X.svcRow(s, ed)).join('')}</div>` : '';
    return (opts.skipConfirm ? '' : part('needs_confirming', g('needs_confirming'))) + part('offered', g('offered')) + part('not_offered', g('not_offered'));
  };

  X.comps = (ed) => {
    const c = PP.state().comps;
    const slots = [0, 1, 2].map((i) => c[i]);
    return slots.map((x, i) => x ? `<div class="row"><span class="nm">${esc(x.name)}</span><span class="srcs small">${x.website ? esc(x.website.replace(/^https?:\/\//, '')) + ' ' : '<span class="flag">no website yet</span> '}${PP.one(x.source || 'Onboarding', x.note || '')}${x.office ? `<span class="faint"> · ${esc(x.office)}</span>` : ''}</span>${ed ? '<span class="act"><button class="lnk" data-toast="Would show the three closest local practices offering the main services to swap in.">Swap</button></span>' : ''}</div>`
      : `<div class="row"><span class="nm faint">Slot ${i + 1} empty</span><span class="srcs small muted">Filled from local searches for the main services</span>${ed ? '<span class="act"><button class="lnk" data-toast="Would list suggested local practices to pick from.">Pick one</button></span>' : ''}</div>`).join('');
  };

  const editable = (key, label, val, srcHtml, ed, multi) => {
    const cur = PP.field(key, val), changed = key in PP.state().fields;
    return `<div class="row" data-ebox="${key}" data-val="${esc(cur || '')}"><span class="nm">${esc(label)}</span><span class="srcs">${cur ? esc(cur) : '<span class="empty">Not on file</span>'} ${changed ? PP.seoChip() : srcHtml || ''}</span>
      ${ed ? `<span class="act"><button class="lnk" data-edit="${key}|${esc(label)}|${multi ? 1 : 0}">Change</button>${changed ? ` · <button class="lnk" data-freset="${key}|${esc(label)}">Reset</button>` : ''}</span>` : ''}</div>`;
  };
  X.editable = editable;

  X.goals = (ed) => {
    const gs = PP.P().goals || [];
    return gs.length ? gs.map((g, i) => editable('goal' + i, 'Goal ' + (i + 1), g.text, PP.one(g.source, '', g.date), ed, true)).join('') : '<div class="empty small">No goals from the client yet.</div>';
  };
  X.ideal = () => {
    const P = PP.P(), t = P.ideal_patient || [], cf = P.ideal_patient_conflicts || [];
    if (!t.length) return '<div class="empty small">No Ideal patient traits yet. Built from the client\'s own statement first, then the sources.</div>';
    return t.map((x) => `<div class="row"><span class="nm">${esc(x.trait)}</span><span class="srcs small">${PP.one(x.source, x.evidence)}</span></div>`).join('')
      + cf.map((c) => `<div class="row small"><span class="flag">Sources disagree</span> <b>${esc(c.topic || '')}</b> ${c.a ? `"${esc(c.a.text)}" ${PP.one(c.a.source, '')} vs "${esc(c.b.text)}" ${PP.one(c.b.source, '')}` : esc(c.text || c)}</div>`).join('');
  };
  X.doctors = () => {
    const d = PP.P().doctors || [];
    return d.length ? d.map((x) => `<div class="row"><span class="nm">${esc(x.name)}<div class="faint small">${esc(x.title || '')}</div></span><span class="srcs small">${esc((x.specialties || []).join(', '))} ${PP.one(x.source || 'CRM', '')}</span></div>`).join('')
      + '<div class="small faint" style="margin-top:6px">Doctors are edited where they are edited today.</div>' : '<div class="empty small">No doctors on file.</div>';
  };
  X.insurance = (ed) => {
    const i = PP.P().insurance || {}; const s = PP.one(i.source || '', '', i.date);
    return editable('ins_net', 'Network', i.network, i.source ? s : '', ed)
      + editable('ins_list', 'Insurers accepted', (i.insurers || []).join(', '), i.source ? s : '', ed, true)
      + editable('ins_plan', 'Membership plan', i.membership_plan, i.source ? s : '', ed)
      + editable('ins_fin', 'Financing', i.financing, i.source ? s : '', ed)
      + editable('ins_pay', 'Payment options', Array.isArray(i.payment_options) ? i.payment_options.join(', ') : i.payment_options, i.source ? s : '', ed);
  };
  const list = (arr, none) => (arr || []).length ? arr.map((x) => `<div class="row small"><span class="srcs">${esc(x.text || x)} ${x.source ? PP.one(x.source, '', x.date) : ''}</span></div>`).join('') : `<div class="empty small">${none}</div>`;
  X.visits = () => `<div class="small muted" style="font-weight:600">Consultations and emergencies</div>${list(PP.P().consultations_emergencies, 'Nothing on file.')}
    <div class="small muted" style="font-weight:600;margin-top:10px">Patient conveniences</div>${list(PP.P().patient_conveniences, 'Nothing on file.')}
    <div class="small muted" style="font-weight:600;margin-top:10px">Technology</div>${list(PP.P().technology, 'Nothing on file.')}`;
  X.facts = () => list(PP.P().facts, 'No other facts on file.');
  X.offices = () => {
    const o = PP.P().offices || [];
    return o.length ? o.map((x) => `<div class="row small"><span class="nm">${esc(x.name || 'Office')}</span><span class="srcs">${esc([x.address, x.phone, x.hours_summary].filter(Boolean).join(' · '))} ${PP.one(x.source || 'Business Profile', '')}</span></div>`).join('') + '<div class="small faint" style="margin-top:6px">Office details come from the Business Profile; fix them there.</div>'
      : '<div class="empty small">No offices on file.</div>';
  };
  X.capacity = (ed) => { const c = PP.P().capacity || {}; return editable('cap', 'Pieces per month', c.pieces_per_month != null ? String(c.pieces_per_month) : '', c.source ? PP.one(c.source, '') : '', ed); };

  /* one wiring pass after every render */
  X.wire = (root) => {
    root.querySelectorAll('[data-svc]').forEach((b) => b.onclick = () => { const [n, st] = b.dataset.svc.split('|'); PP.setSvc(n, { status: st }, st === 'offered' ? 'marked offered' : 'marked not offered'); });
    root.querySelectorAll('[data-main]').forEach((b) => b.onclick = () => { const s = PP.services().find((x) => x.name === b.dataset.main); PP.setSvc(s.name, { main: !s.main }, s.main ? 'main mark removed' : 'marked main'); });
    root.querySelectorAll('[data-svcreset]').forEach((b) => b.onclick = () => PP.resetSvc(b.dataset.svcreset));
    root.querySelectorAll('[data-freset]').forEach((b) => b.onclick = () => { const [k, l] = b.dataset.freset.split('|'); PP.resetField(k, l); });
    root.querySelectorAll('[data-toast]').forEach((b) => b.onclick = () => PP.toast(b.dataset.toast));
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => {
      const [k, l, m] = b.dataset.edit.split('|'); const box = b.closest('[data-ebox]'); const cur = box.dataset.val;
      box.querySelector('.srcs').innerHTML = m === '1' ? `<textarea class="ed" rows="2">${esc(cur)}</textarea>` : `<input class="ed" value="${esc(cur)}">`;
      box.querySelector('.act').innerHTML = '<button class="btn btn-go sm" data-save>Save</button><button class="lnk" data-cancel>Cancel</button>';
      box.querySelector('.ed').focus();
      box.querySelector('[data-save]').onclick = () => PP.setField(k, box.querySelector('.ed').value, l);
      box.querySelector('[data-cancel]').onclick = () => PP.render();
    });
  };
})();
