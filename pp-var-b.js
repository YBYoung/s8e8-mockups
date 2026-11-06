/* PROTOTYPE, throwaway (#1570). Variant B, guided confirm and a quiet page: the strategy walks the SEO through one
   question at a time; the practice page is a read-only sheet that leads with one sentence, with Edit opening the walk. */
(function () {
  const PP = window.PP, X = PP.sec, esc = PP.esc;
  let step = 0;
  const STEPS = [
    ['Check services', () => PP.toConfirm().length],
    ['Main services', () => 0], ['Competitors', () => 0], ['Goals and Ideal patient', () => 0],
    ['Insurance and facts', () => 0], ['Confirm', () => 0],
  ];
  function walk(root, P) {
    const todo = PP.toConfirm();
    const head = `<div style="display:flex;gap:6px;margin-bottom:16px">${STEPS.map(([w, n], i) => `<button data-step-to="${i}" style="flex:1;text-align:left;border:1px solid ${i === step ? 'var(--a)' : 'var(--line)'};background:${i === step ? 'var(--aTint)' : '#fff'};border-radius:8px;padding:8px 10px;font-size:12.5px;color:${i < step ? 'var(--muted)' : 'var(--ink)'}">
      <span class="faint">${i + 1}</span> ${w}${n() ? ` <span class="flag">${n()}</span>` : ''}</button>`).join('')}</div>`;
    const big = (q, body) => `<div class="card" style="padding:26px 28px"><div style="font-size:20px;font-weight:700;color:var(--ink);margin-bottom:6px">${q}</div>${body}</div>`;
    let body = '';
    if (step === 0) {
      body = todo.length ? todo.map((s) => big(`Does ${esc(P.practice.name)} offer ${esc(s.name.toLowerCase())}?`,
        `<div class="small muted" style="margin-bottom:10px">The sources disagree. Until someone answers, tools treat it as offered.</div>${s.sources.map((x) => `<div class="row small">${PP.src(x)}<span class="${x.says === 'no' ? '' : ''}">${esc(x.text || '')}</span></div>`).join('')}
        <div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-go" data-svc="${esc(s.name)}|offered">Yes, it offers it</button><button class="btn btn-line" data-svc="${esc(s.name)}|not_offered">No</button></div>`)).join('')
        : big('Every source agrees on what the practice offers.', `<div class="small muted">${PP.offered().length} services offered. Full list on the next steps and the practice page.</div>`);
    } else if (step === 1) {
      body = big('Which services should the strategy lean on?', `<div class="small muted" style="margin-bottom:8px">Ticked from every priority source. Untick, or tick any offered service.</div>
        ${PP.services().filter((s) => s.status === 'offered').map((s) => `<label class="row" style="cursor:pointer"><input type="checkbox" data-main-cb="${esc(s.name)}" ${s.main ? 'checked' : ''}> <span class="nm">${esc(s.name)}</span><span class="srcs">${s.main ? PP.srcs((s.main_sources || []).map((x) => ({ source: x, says: 'priority' }))) : ''}${s.changed ? PP.seoChip() : ''}</span></label>`).join('')}`);
    } else if (step === 2) body = big('Who does the practice compete with?', `<div class="small muted" style="margin-bottom:8px">Local practices that may take its patients. Up to three.</div>${X.comps(true)}`);
    else if (step === 3) body = big('What is the practice trying to achieve, and for whom?', `<div class="small muted" style="font-weight:600">Goals</div>${X.goals(true)}<div class="small muted" style="font-weight:600;margin-top:14px">Ideal patient</div>${X.ideal()}`);
    else if (step === 4) body = big('Anything wrong in the practice facts?', `${X.insurance(true)}${X.capacity(true)}<div class="small muted" style="font-weight:600;margin-top:14px">Other facts</div>${X.facts()}`);
    else {
      const ch = PP.state().log.filter((l) => l.what !== 'Confirmed the profile');
      body = big(PP.state().confirmed ? 'Confirmed. Gather will read this copy.' : 'Ready to confirm?', `<div class="small" style="margin-bottom:10px">${PP.mains().length} main services · ${PP.state().comps.length} of 3 competitors · ${PP.offered().length} services offered${todo.length ? ` · <span class="flag">${PP.n(todo.length, 'service stays', 'services stay')} "needs confirming"</span>` : ''}</div>
        ${ch.length ? ch.map((l) => `<div class="row small"><b>${l.who}</b> ${esc(l.what)}</div>`).join('') : '<div class="small muted">No changes. Confirming keeps what the sources say.</div>'}
        <div style="margin-top:16px"><button class="btn btn-go" data-confirm>${PP.state().confirmed ? 'Go to Gather' : 'Confirm profile'}</button></div>`);
    }
    root.innerHTML = PP.header(PP.opt.door === 'station' ? 'Practice profile' : null) + head + body
      + `<div style="display:flex;justify-content:space-between;margin-top:6px"><button class="btn btn-line" data-back ${step ? '' : 'disabled'}>Back</button>${step < STEPS.length - 1 ? '<button class="btn btn-go" data-next>Next</button>' : ''}</div>`;
    X.wire(root);
    root.querySelectorAll('[data-step-to]').forEach((b) => b.onclick = () => { step = +b.dataset.stepTo; PP.render(); });
    root.querySelector('[data-next]')?.addEventListener('click', () => { step++; PP.render(); });
    root.querySelector('[data-back]')?.addEventListener('click', () => { step--; PP.render(); });
    root.querySelectorAll('[data-main-cb]').forEach((c) => c.onchange = () => PP.setSvc(c.dataset.mainCb, { main: c.checked }, c.checked ? 'marked main' : 'main mark removed'));
    root.querySelector('[data-confirm]')?.addEventListener('click', () => PP.state().confirmed ? PP.toast('Would open Gather.') : PP.confirm());
  }
  function sheet(root, P) {
    const m = PP.mains(), o = PP.offered(), todo = PP.toConfirm(), no = PP.services().filter((s) => s.status === 'not_offered');
    const col = (t, b) => `<div><div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.07em;font-size:11px;margin-bottom:6px">${t}</div>${b}</div>`;
    const names = (l) => l.length ? l.map((s) => `<span style="display:inline-block;margin:0 10px 6px 0" data-tip="${esc(s.sources.map((x) => `<div class="t">${esc(x.source)}</div>${esc(x.text || '')}`).join('<br>'))}">${esc(s.name)}</span>`).join('') : '<span class="empty small">None</span>';
    root.innerHTML = PP.header(null, '<button class="btn btn-go" data-edit-walk>Edit profile</button>')
      + `<div class="card" style="padding:24px 28px"><div style="font-size:19px;color:var(--ink);line-height:1.45">${esc(P.practice.name)} offers <b>${o.length}</b> services and leans on <b>${m.length}</b>${m.length ? `: ${esc(m.slice(0, 4).map((s) => s.name.toLowerCase()).join(', '))}${m.length > 4 ? ' and more' : ''}` : ''}. It competes with ${PP.state().comps.length ? esc(PP.state().comps.map((c) => c.name).join(', ')) : 'nobody named yet'}.</div>
        ${todo.length ? `<div class="small" style="margin-top:10px"><span class="dot w"></span> ${PP.n(todo.length, 'service needs', 'services need')} confirming. <button class="lnk" data-edit-walk>Answer</button></div>` : ''}</div>
      <div class="card" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px">
        ${col('Main services', names(m))}${col('Also offered', names(o.filter((s) => !s.main)))}${col('Not offered', names(no))}
        ${col('Goals', (P.goals || []).map((g) => `<div class="small" style="margin-bottom:6px">${esc(g.text)} ${PP.one(g.source, '', g.date)}</div>`).join('') || '<span class="empty small">None</span>')}
        ${col('Ideal patient', (P.ideal_patient || []).map((x) => `<div class="small" style="margin-bottom:6px">${esc(x.trait)} ${PP.one(x.source, x.evidence)}</div>`).join('') || '<span class="empty small">None yet</span>')}
        ${col('Insurance', `<div class="small">${esc((P.insurance || {}).network || 'Not on file')}</div>`)}
        ${col('Doctors', (P.doctors || []).map((d) => `<div class="small">${esc(d.name)}</div>`).join('') || '<span class="empty small">None</span>')}
        ${col('Offices', (P.offices || []).map((d) => `<div class="small">${esc(d.name || d.address)}</div>`).join('') || '<span class="empty small">None</span>')}
        ${col('Capacity', `<div class="small">${(P.capacity || {}).pieces_per_month != null ? esc(P.capacity.pieces_per_month) + ' pieces a month' : '<span class="empty">Not set</span>'}</div>`)}
      </div>${PP.missingCard()}${PP.usesStrip()}${PP.history()}`;
    root.querySelectorAll('[data-edit-walk]').forEach((b) => b.onclick = () => { step = 0; PP.go({ door: 'station' }); });
  }
  PP.variants.B = (root, P) => (PP.opt.door === 'station' ? walk : sheet)(root, P);
})();
