/* PROTOTYPE, throwaway (#1570). Variant C, fact ledger: every fact is one row (group, fact, value, sources, state).
   The strategy step is the same ledger filtered to rows that need a look, with Confirm in the toolbar. */
(function () {
  const PP = window.PP, X = PP.sec, esc = PP.esc;
  let filter = null, open = {};
  function rows(P) {
    const r = [];
    PP.services().forEach((s) => r.push({ g: 'Service', f: s.name, v: { offered: 'Offered', not_offered: 'Not offered', needs_confirming: 'Needs confirming' }[s.status] + (s.main ? ' · main' : ''),
      src: s.sources, look: s.status === 'needs_confirming', seo: s.changed, one: s.sources.length === 1, svc: s }));
    PP.state().comps.forEach((c, i) => r.push({ g: 'Competitor', f: 'Slot ' + (i + 1), v: c.name + (c.website ? ' · ' + c.website.replace(/^https?:\/\//, '') : ''), src: [{ source: c.source || 'Onboarding', text: c.note }], look: !c.website, one: true }));
    for (let i = PP.state().comps.length; i < 3; i++) r.push({ g: 'Competitor', f: 'Slot ' + (i + 1), v: '', src: [], look: true, missing: true });
    (P.goals || []).forEach((g, i) => r.push({ g: 'Goal', f: 'Goal ' + (i + 1), v: PP.field('goal' + i, g.text), key: 'goal' + i, src: [{ source: g.source, date: g.date }], seo: ('goal' + i) in PP.state().fields, one: true }));
    (P.ideal_patient || []).forEach((t) => r.push({ g: 'Ideal patient', f: t.trait, v: t.evidence, src: [{ source: t.source }], one: true }));
    const ins = P.insurance || {};
    [['Network', 'ins_net', ins.network], ['Insurers', 'ins_list', (ins.insurers || []).join(', ')], ['Membership plan', 'ins_plan', ins.membership_plan], ['Financing', 'ins_fin', ins.financing]]
      .forEach(([f, k, v]) => r.push({ g: 'Insurance', f, key: k, v: PP.field(k, v), src: ins.source ? [{ source: ins.source, date: ins.date }] : [], missing: !PP.field(k, v), seo: k in PP.state().fields }));
    (P.doctors || []).forEach((d) => r.push({ g: 'Doctor', f: d.name, v: (d.specialties || []).join(', '), src: [{ source: d.source || 'CRM' }] }));
    (P.offices || []).forEach((o) => r.push({ g: 'Office', f: o.name || 'Office', v: [o.address, o.phone].filter(Boolean).join(' · '), src: [{ source: o.source || 'Business Profile' }] }));
    (P.facts || []).forEach((x, i) => r.push({ g: 'Fact', f: 'Fact ' + (i + 1), v: x.text || x, src: x.source ? [{ source: x.source, date: x.date }] : [] }));
    const cap = (P.capacity || {}).pieces_per_month;
    r.push({ g: 'Capacity', f: 'Pieces per month', key: 'cap', v: PP.field('cap', cap != null ? String(cap) : ''), src: (P.capacity || {}).source ? [{ source: P.capacity.source }] : [], missing: !PP.field('cap', cap), look: !PP.field('cap', cap), seo: 'cap' in PP.state().fields });
    return r;
  }
  const FILTERS = [['look', 'Needs a look'], ['seo', 'Changed by the team'], ['one', 'One source only'], ['missing', 'Missing']];
  PP.variants.C = (root, P) => {
    const st = PP.opt.door === 'station'; if (st && filter === null) filter = 'look';
    const all = rows(P), shown = filter ? all.filter((r) => r[filter]) : all, look = all.filter((r) => r.look).length;
    const tb = `<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap"><button class="btn sm ${!filter ? 'btn-go' : 'btn-line'}" data-f="">All · ${all.length}</button>
      ${FILTERS.map(([k, w]) => `<button class="btn sm ${filter === k ? 'btn-go' : 'btn-line'}" data-f="${k}">${w} · ${all.filter((r) => r[k]).length}</button>`).join('')}
      <span style="flex:1"></span>${st ? `<span class="small muted">${look ? PP.n(look, 'row needs', 'rows need') + ' a look' : 'Nothing needs a look'}</span><button class="btn btn-go" data-confirm>${PP.state().confirmed ? 'Go to Gather' : 'Confirm profile'}</button>` : ''}</div>`;
    const th = 'text-align:left;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);padding:8px 10px;border-bottom:1px solid var(--line)';
    const td = 'padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top';
    let lastG = '';
    const body = shown.map((r, i) => {
      const g = r.g !== lastG ? r.g : ''; lastG = r.g; const id = r.g + r.f;
      const act = r.svc ? (r.svc.status === 'needs_confirming'
        ? `<button class="btn btn-go sm" data-svc="${esc(r.f)}|offered">Offers it</button> <button class="btn btn-line sm" data-svc="${esc(r.f)}|not_offered">Doesn't</button>`
        : `${r.svc.status === 'offered' ? `<button class="lnk" data-main="${esc(r.f)}">${r.svc.main ? 'Unmark main' : 'Mark main'}</button> · ` : ''}<button class="lnk" data-svc="${esc(r.f)}|${r.svc.status === 'offered' ? 'not_offered' : 'offered'}">${r.svc.status === 'offered' ? 'Not offered' : 'Offered'}</button>${r.seo ? ` · <button class="lnk" data-svcreset="${esc(r.f)}">Reset</button>` : ''}`)
        : r.key ? `<button class="lnk" data-cedit="${r.key}|${esc(r.g + ' ' + r.f)}">Change</button>${r.seo ? ` · <button class="lnk" data-freset="${r.key}|${esc(r.f)}">Reset</button>` : ''}` : '';
      return `<tr style="${r.look ? 'background:#FFFDF0' : ''}"><td style="${td};color:var(--muted);font-size:12.5px;width:110px">${esc(g)}</td><td style="${td};color:var(--ink);font-weight:500;width:220px">${esc(r.f)}</td>
        <td style="${td}" data-cval="${r.key || ''}">${r.v ? esc(r.v) : '<span class="empty">Missing</span>'}</td>
        <td style="${td};width:230px">${PP.srcs(r.src)}${r.seo ? PP.seoChip() : ''}${r.src.length > 1 ? `<button class="lnk" data-open="${esc(id)}">${open[id] ? 'Hide' : 'Show'} quotes</button>` : ''}</td>
        <td style="${td};width:200px;white-space:nowrap">${act}</td></tr>${open[id] ? `<tr><td></td><td colspan="4" style="${td};background:var(--soft)">${r.src.map((x) => `<div class="small">${PP.src(x)} ${esc(x.text || '')}</div>`).join('')}</td></tr>` : ''}`;
    }).join('');
    root.innerHTML = PP.header(null) + tb + `<div class="card" style="padding:0;overflow:hidden"><table style="width:100%;border-collapse:collapse;font-size:13.5px"><thead><tr>
      <th style="${th}">Group</th><th style="${th}">Fact</th><th style="${th}">Value</th><th style="${th}">Sources</th><th style="${th}"></th></tr></thead><tbody>${body || `<tr><td colspan="5" style="${td}" class="empty">No rows in this filter.</td></tr>`}</tbody></table></div>`
      + PP.missingCard() + PP.usesStrip() + PP.history();
    X.wire(root);
    root.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { filter = b.dataset.f || ''; PP.render(); });
    root.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => { open[b.dataset.open] = !open[b.dataset.open]; PP.render(); });
    root.querySelectorAll('[data-cedit]').forEach((b) => b.onclick = () => {
      const [k, l] = b.dataset.cedit.split('|'); const tr = b.closest('tr'); const cell = tr.querySelector('[data-cval]'); const cur = PP.field(k, null) ?? cell.textContent.replace(/^Missing$/, '');
      cell.innerHTML = `<input class="ed" value="${esc(cur)}">`; const inp = cell.querySelector('input'); inp.focus();
      b.parentElement.innerHTML = '<button class="btn btn-go sm" data-csave>Save</button>';
      tr.querySelector('[data-csave]').onclick = () => PP.setField(k, inp.value, l);
    });
    root.querySelector('[data-confirm]')?.addEventListener('click', () => PP.state().confirmed ? PP.toast('Would open Gather.') : PP.confirm());
  };
})();
